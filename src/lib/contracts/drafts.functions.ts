import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeRiskReport, coreFieldsFingerprint } from "./logic";
import type { Draft } from "./types";

export const createDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("contract_drafts")
      .insert({ user_id: userId, status: "draft", title: "Új szerződés" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await supabase.from("usage_logs").insert({
      user_id: userId, action: "draft.created", entity_type: "contract_draft", entity_id: data.id,
    });
    return data as Draft;
  });

export const getDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("contract_drafts").select("*").eq("id", data.id).eq("user_id", userId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Draft not found");
    return row as Draft;
  });

export const listDrafts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("contract_drafts").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as Draft[]) ?? [];
  });

const DraftPatchSchema = z.object({
  id: z.string().uuid(),
  patch: z.object({
    title: z.string().max(255).optional(),
    lessor_data: z.record(z.string(), z.unknown()).optional(),
    lessee_data: z.record(z.string(), z.unknown()).optional(),
    parcels: z.array(z.record(z.string(), z.unknown())).optional(),
    rent: z.record(z.string(), z.unknown()).optional(),
    term: z.record(z.string(), z.unknown()).optional(),
    prelease: z.record(z.string(), z.unknown()).optional(),
    clauses: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const updateDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => DraftPatchSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("contract_drafts")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ ...(data.patch as any) })
      .eq("id", data.id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as Draft;
  });

export const runRiskCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("contract_drafts").select("*").eq("id", data.id).eq("user_id", userId).single();
    if (error) throw new Error(error.message);
    const draft = row as Draft;
    const report = computeRiskReport(draft);
    const core_hash = coreFieldsFingerprint(draft);
    await supabase.from("contract_drafts").update({ risk_report: report, core_hash }).eq("id", data.id).eq("user_id", userId);
    return report;
  });