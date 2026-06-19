/**
 * Klauzula override-ok server function-jei.
 *
 * Az ügyvéd/admin felülírhatja a hardcode-olt `CLAUSE_LIBRARY` egy-egy elemét:
 * címet, szöveget (bodyTemplate) és jogforrás-hivatkozásokat (sourceRefs).
 * Minden mentés frissíti az `updated_at`-et — a `clauseReviews` logika ezt
 * figyeli, és ha az utolsó jóváhagyás régebbi, akkor a klauzula automatikusan
 * visszakerül "jóváhagyandó" állapotba.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CLAUSE_LIBRARY } from "./clauses";
import { LEGAL_SOURCES_V2 } from "./sources";

export interface ClauseOverrideRow {
  clause_id: string;
  title: string | null;
  body_template: string | null;
  source_refs: Array<{ sourceId: string; section?: string }>;
  updated_by_name: string | null;
  updated_at: string;
}

export interface ClauseEditorEntry {
  clauseId: string;
  defaults: {
    title: string;
    bodyTemplate: string;
    sourceRefs: Array<{ sourceId: string; section?: string }>;
  };
  override: ClauseOverrideRow | null;
  effective: {
    title: string;
    bodyTemplate: string;
    sourceRefs: Array<{ sourceId: string; section?: string }>;
  };
}

export interface LegalSourceOption {
  id: string;
  shortName: string;
  actNumber: string;
}

export const listClauseEditorEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{
    entries: ClauseEditorEntry[];
    sources: LegalSourceOption[];
  }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("clause_overrides")
      .select("clause_id, title, body_template, source_refs, updated_by_name, updated_at");
    if (error) throw new Error(error.message);
    const byId = new Map<string, ClauseOverrideRow>();
    for (const row of (data ?? []) as unknown as ClauseOverrideRow[]) {
      byId.set(row.clause_id, row);
    }

    const entries: ClauseEditorEntry[] = CLAUSE_LIBRARY.map((c) => {
      const ov = byId.get(c.id) ?? null;
      const effective = {
        title: ov?.title ?? c.title,
        bodyTemplate: ov?.body_template ?? c.bodyTemplate,
        sourceRefs:
          ov && Array.isArray(ov.source_refs) && ov.source_refs.length > 0
            ? ov.source_refs
            : c.sourceRefs,
      };
      return {
        clauseId: c.id,
        defaults: {
          title: c.title,
          bodyTemplate: c.bodyTemplate,
          sourceRefs: c.sourceRefs,
        },
        override: ov,
        effective,
      };
    });

    const sources: LegalSourceOption[] = LEGAL_SOURCES_V2.map((s) => ({
      id: s.id,
      shortName: s.shortName,
      actNumber: s.actNumber,
    }));
    return { entries, sources };
  });

const sourceRefSchema = z.object({
  sourceId: z.string().min(1).max(50),
  section: z.string().trim().max(120).optional().nullable().transform((v) => (v && v.length > 0 ? v : undefined)),
});

const upsertInput = z.object({
  clauseId: z.string().min(1).max(100),
  title: z.string().trim().min(1).max(200),
  bodyTemplate: z.string().trim().min(1).max(5000),
  sourceRefs: z.array(sourceRefSchema).min(1).max(10),
});

const checkLawyerOrAdmin = async (supabase: SupabaseClient, userId: string) => {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["lawyer", "admin"]);
  return (data ?? []).length > 0;
};

export const upsertClauseOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => upsertInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!CLAUSE_LIBRARY.some((c) => c.id === data.clauseId)) {
      throw new Error("Ismeretlen klauzula azonosító.");
    }
    for (const ref of data.sourceRefs) {
      if (!LEGAL_SOURCES_V2.some((s) => s.id === ref.sourceId)) {
        throw new Error(`Ismeretlen jogforrás: ${ref.sourceId}`);
      }
    }
    const isAllowed = await checkLawyerOrAdmin(supabase as unknown as SupabaseClient, userId);
    if (!isAllowed) {
      throw new Error("Csak ügyvéd vagy admin szerepkörrel szerkeszthető a klauzula.");
    }
    const { data: profile } = await supabase
      .from("users_profile")
      .select("name, email")
      .eq("user_id", userId)
      .maybeSingle();
    const reviewerName = (profile?.name ?? profile?.email ?? null) as string | null;

    const payload = {
      clause_id: data.clauseId,
      title: data.title,
      body_template: data.bodyTemplate,
      source_refs: data.sourceRefs,
      updated_by: userId,
      updated_by_name: reviewerName,
      updated_at: new Date().toISOString(),
    };
    const { data: row, error } = await supabase
      .from("clause_overrides")
      .upsert(payload, { onConflict: "clause_id" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as ClauseOverrideRow;
  });

const resetInput = z.object({ clauseId: z.string().min(1).max(100) });

export const resetClauseOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => resetInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const isAllowed = await checkLawyerOrAdmin(supabase as unknown as SupabaseClient, userId);
    if (!isAllowed) {
      throw new Error("Csak ügyvéd vagy admin szerepkörrel törölhető az override.");
    }
    const { error } = await supabase
      .from("clause_overrides")
      .delete()
      .eq("clause_id", data.clauseId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });