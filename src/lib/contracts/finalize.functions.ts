import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeRiskReport, coreFieldsFingerprint } from "./logic";
import type { Draft } from "./types";

function makeDocNumber(seqHint: string): string {
  const year = new Date().getFullYear();
  const tail = seqHint.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  return `FBSZ-${year}-${tail}`;
}

async function sha256Hex(input: Uint8Array | string): Promise<string> {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  // Copy into a fresh ArrayBuffer to satisfy the BufferSource type constraint
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const buf = await crypto.subtle.digest("SHA-256", ab);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const finalizeContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ draft_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { composeContract } = await import("./compose.server");
    const { renderContractPdf } = await import("./pdf.server");

    // Load draft with user-scoped client (RLS)
    const { data: draftRow, error: draftErr } = await supabase
      .from("contract_drafts").select("*").eq("id", data.draft_id).eq("user_id", userId).single();
    if (draftErr) throw new Error(draftErr.message);
    const draft = draftRow as Draft;

    // Risk check must allow finalize
    const risk = computeRiskReport(draft);
    if (!risk.can_finalize) throw new Error("Hiányzó kötelező adatok — a véglegesítés nem indítható.");

    // Load active template + clauses
    const { data: tpl, error: tplErr } = await supabaseAdmin
      .from("legal_template_versions").select("*").eq("status", "active").order("effective_from", { ascending: false }).limit(1).single();
    if (tplErr || !tpl) throw new Error("Nincs aktív sablonverzió.");
    const { data: clauses, error: clErr } = await supabaseAdmin
      .from("clauses").select("clause_key, title, text, sort_order").eq("legal_template_version_id", tpl.id).eq("active", true);
    if (clErr) throw new Error(clErr.message);

    // Compose contract text server-side
    const composed = composeContract(draft, clauses as { clause_key: string; title: string; text: string; sort_order: number }[]);

    // Pre-generate doc number from draft id; finalize_document RPC consumes credit atomically.
    const documentNumber = makeDocNumber(draft.id);
    const verificationUrl = `https://foldberletiszerzodes.hu/dokumentum-ellenorzes?id=${documentNumber}`;
    const core_hash = coreFieldsFingerprint(draft);

    // Render PDF
    const pdfBytes = await renderContractPdf({
      documentNumber,
      documentHash: "PENDING",
      templateVersion: tpl.version,
      clauseVersion: tpl.version,
      generatedAt: new Date(),
      title: composed.title,
      sections: composed.sections,
      verificationUrl,
    });
    const documentHash = await sha256Hex(pdfBytes);

    // Upload PDF under user folder
    const path = `${userId}/${documentNumber}.pdf`;
    const { error: upErr } = await supabaseAdmin.storage.from("contracts")
      .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });
    if (upErr) throw new Error("PDF feltöltés sikertelen: " + upErr.message);

    // Atomic credit + insert via RPC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: docId, error: rpcErr } = await (supabaseAdmin as any).rpc("finalize_document", {
      _user_id: userId,
      _draft_id: draft.id,
      _document_number: documentNumber,
      _document_hash: documentHash,
      _core_hash: core_hash,
      _template_version: tpl.version,
      _clause_version: tpl.version,
      _lessor_name: draft.lessor_data?.name ?? null,
      _lessee_name: draft.lessee_data?.name ?? null,
      _settlement: draft.parcels?.[0]?.settlement ?? null,
      _parcel_numbers: (draft.parcels ?? []).map((p) => p.parcel_number ?? "").filter(Boolean),
      _pdf_file_path: path,
    });
    if (rpcErr) {
      // Cleanup uploaded file on failure
      await supabaseAdmin.storage.from("contracts").remove([path]);
      if (rpcErr.message?.includes("no_credit_or_quota")) {
        throw new Error("Nincs elérhető szerződés-kredited vagy aktív előfizetési kereted. Kérjük, indíts fizetést.");
      }
      throw new Error(rpcErr.message);
    }

    return { document_id: docId as string, document_number: documentNumber, document_hash: documentHash };
  });

export const getDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ document_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: doc, error } = await supabase
      .from("generated_documents").select("pdf_file_path, document_number").eq("id", data.document_id).eq("user_id", userId).single();
    if (error || !doc?.pdf_file_path) throw new Error("Nem található a dokumentum.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error: sErr } = await supabaseAdmin.storage.from("contracts").createSignedUrl(doc.pdf_file_path, 300);
    if (sErr || !signed) throw new Error("Aláírt URL generálása sikertelen.");
    await supabase.from("usage_logs").insert({
      user_id: userId, action: "document.downloaded", entity_type: "generated_document", entity_id: data.document_id,
    });
    return { url: signed.signedUrl, document_number: doc.document_number };
  });

export const listMyDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("generated_documents")
      .select("id, document_number, lessor_name, lessee_name, settlement, parcel_numbers, finalized_at, legal_template_version")
      .eq("user_id", userId)
      .order("finalized_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyQuota = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: subs }, { data: credits }] = await Promise.all([
      supabase.from("subscriptions").select("*").eq("user_id", userId).eq("status", "active"),
      supabase.from("document_credits").select("*").eq("user_id", userId).eq("status", "available").eq("source_type", "single_purchase"),
    ]);
    const activeSub = subs?.[0];
    return {
      single_credits: credits?.length ?? 0,
      subscription: activeSub
        ? { used: activeSub.used_quota, total: activeSub.annual_quota, period_end: activeSub.quota_period_end }
        : null,
    };
  });