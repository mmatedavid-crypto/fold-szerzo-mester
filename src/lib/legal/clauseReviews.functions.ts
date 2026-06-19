/**
 * Klauzula-lektorálás (ügyvédi review) server function-jei.
 *
 * - `listClausesForReview`: minden bejelentkezett user számára visszaadja a 22 klauzulát
 *   az aktuális review-státusszal (latest decision a `clause_reviews` táblából).
 * - `submitClauseReview`: csak `lawyer` szerepkörrel hívható; új audit-trail sort vesz fel.
 * - `assertAllRequiredClausesApproved`: a generátor hívja finalize előtt — ha bármelyik
 *   szükséges klauzula nincs `approved` állapotban a jelenlegi `LEASE_CLAUSE_VERSION`-re,
 *   blokkoló hibát dob.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CLAUSE_LIBRARY } from "./clauses";
import { LEASE_CLAUSE_VERSION } from "./ruleset";

export interface ClauseReviewRow {
  id: string;
  clause_id: string;
  clause_version: string;
  decision: "approved" | "rejected";
  risk_level: "low" | "medium" | "high";
  comment: string | null;
  reviewer_name: string | null;
  reviewed_at: string;
}

export interface ClauseReviewSummary {
  clauseId: string;
  title: string;
  bodyTemplate: string;
  sourceRefs: string[];
  currentVersion: string;
  latestReview: ClauseReviewRow | null;
  isApproved: boolean;
}

const checkLawyer = async (supabase: SupabaseClient, userId: string) => {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "lawyer")
    .maybeSingle();
  return Boolean(data);
};

export const listClausesForReview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ClauseReviewSummary[]> => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("clause_reviews")
      .select("*")
      .eq("clause_version", LEASE_CLAUSE_VERSION)
      .order("reviewed_at", { ascending: false });
    if (error) throw new Error(error.message);
    const latestByClause = new Map<string, ClauseReviewRow>();
    for (const r of (rows ?? []) as ClauseReviewRow[]) {
      if (!latestByClause.has(r.clause_id)) latestByClause.set(r.clause_id, r);
    }
    const { data: overrides } = await supabase
      .from("clause_overrides")
      .select("clause_id, title, body_template, source_refs, updated_at");
    const ovById = new Map<
      string,
      { title: string | null; body_template: string | null; source_refs: unknown; updated_at: string }
    >();
    for (const row of (overrides ?? []) as Array<{
      clause_id: string;
      title: string | null;
      body_template: string | null;
      source_refs: unknown;
      updated_at: string;
    }>) {
      ovById.set(row.clause_id, row);
    }

    return CLAUSE_LIBRARY.map((c) => {
      const latest = latestByClause.get(c.id) ?? null;
      const ov = ovById.get(c.id);
      const title = ov?.title ?? c.title;
      const body = ov?.body_template ?? c.bodyTemplate;
      const refs: Array<{ sourceId: string; section?: string }> =
        ov && Array.isArray(ov.source_refs) && (ov.source_refs as unknown[]).length > 0
          ? (ov.source_refs as Array<{ sourceId: string; section?: string }>)
          : c.sourceRefs;
      const reviewStale = Boolean(latest && ov && latest.reviewed_at < ov.updated_at);
      const isApproved = latest?.decision === "approved" && !reviewStale;
      return {
        clauseId: c.id,
        title,
        bodyTemplate: body,
        sourceRefs: refs.map((r) => (r.section ? `${r.sourceId} ${r.section}` : r.sourceId)),
        currentVersion: LEASE_CLAUSE_VERSION,
        latestReview: reviewStale ? null : latest,
        isApproved,
      };
    });
  });

const submitInput = z.object({
  clauseId: z.string().min(1).max(100),
  decision: z.enum(["approved", "rejected"]),
  comment: z.string().max(2000).optional().nullable(),
}).refine((v) => v.decision === "approved" || (v.comment && v.comment.trim().length > 0), {
  message: "Elutasításhoz rövid indoklás szükséges.",
  path: ["comment"],
});

export const submitClauseReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => submitInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!CLAUSE_LIBRARY.some((c) => c.id === data.clauseId)) {
      throw new Error("Ismeretlen klauzula azonosító.");
    }
    const isLawyer = await checkLawyer(supabase as unknown as SupabaseClient, userId);
    if (!isLawyer) {
      throw new Error("Csak ügyvéd szerepkörrel jelentkezett felhasználó adhat le lektorálást.");
    }
    // Lektor neve a profilból (ha van)
    const { data: profile } = await supabase
      .from("users_profile")
      .select("name, email")
      .eq("user_id", userId)
      .maybeSingle();
    const reviewerName = (profile?.name ?? profile?.email ?? null) as string | null;

    const { data: inserted, error } = await supabase
      .from("clause_reviews")
      .insert({
        clause_id: data.clauseId,
        clause_version: LEASE_CLAUSE_VERSION,
        decision: data.decision,
        risk_level: "low",
        checklist: {},
        comment: data.comment ?? null,
        reviewer_id: userId,
        reviewer_name: reviewerName,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return inserted as ClauseReviewRow;
  });

/**
 * Generátor-blokkoló: visszaadja azon klauzula-id-k listáját, amelyek
 * jelenleg szükségesek a draft-hoz, de NINCS rájuk `approved` review az
 * aktuális `LEASE_CLAUSE_VERSION`-re. Ha üres tömböt ad vissza, generálható.
 */
export async function getUnapprovedClauseIds(
  supabaseClient: SupabaseClient,
  requiredClauseIds: string[],
): Promise<string[]> {
  if (requiredClauseIds.length === 0) return [];
  const { data, error } = await supabaseClient
    .from("clause_reviews")
    .select("clause_id, decision, reviewed_at, clause_version")
    .eq("clause_version", LEASE_CLAUSE_VERSION);
  if (error) throw new Error(error.message);
  const latestApproved = new Set<string>();
  const seen = new Map<string, string>(); // clause_id -> max reviewed_at
  for (const row of (data ?? []) as Array<{ clause_id: string; decision: string; reviewed_at: string }>) {
    const prev = seen.get(row.clause_id);
    if (!prev || row.reviewed_at > prev) {
      seen.set(row.clause_id, row.reviewed_at);
      if (row.decision === "approved") latestApproved.add(row.clause_id);
      else latestApproved.delete(row.clause_id);
    }
  }
  return requiredClauseIds.filter((id) => !latestApproved.has(id));
}