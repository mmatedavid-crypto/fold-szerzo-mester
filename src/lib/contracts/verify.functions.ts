import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const verifyDocument = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      document_number: z.string().min(3).max(64),
      document_hash: z.string().optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: doc } = await supabaseAdmin
      .from("generated_documents")
      .select("document_number, document_hash, finalized_at, legal_template_version, lessor_name, lessee_name, settlement, parcel_numbers")
      .eq("document_number", data.document_number)
      .maybeSingle();

    if (!doc) {
      await supabaseAdmin.from("document_verifications").insert({
        document_number: data.document_number,
        document_hash: data.document_hash ?? null,
        result: "not_found",
      });
      return { ok: false, message: "Ezzel az azonosítóval nincs nyilvántartott dokumentum." };
    }

    if (data.document_hash && data.document_hash !== doc.document_hash) {
      await supabaseAdmin.from("document_verifications").insert({
        document_number: data.document_number, document_hash: data.document_hash, result: "hash_mismatch",
      });
      return { ok: false, message: "A megadott hash nem egyezik a nyilvántartott értékkel.", meta: { document_number: doc.document_number } };
    }

    await supabaseAdmin.from("document_verifications").insert({
      document_number: data.document_number, document_hash: doc.document_hash, result: "ok",
    });

    return {
      ok: true,
      message: "A dokumentum érvényes és nyilvántartott.",
      meta: {
        document_number: doc.document_number,
        legal_template_version: doc.legal_template_version,
        finalized_at: doc.finalized_at,
        settlement: doc.settlement ?? "—",
        parcel_numbers: (doc.parcel_numbers ?? []).join(", ") || "—",
        hash_prefix: doc.document_hash?.slice(0, 16) + "…",
      },
    };
  });