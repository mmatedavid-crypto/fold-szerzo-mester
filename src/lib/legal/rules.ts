/**
 * Determinisztikus szabálymotor szabályai.
 * Az AI nem dönt jogi kérdést — a draft minden ellenőrzése ezen szabályok alapján fut.
 */

import type { Draft } from "@/lib/contracts/types";
import type { SourceRef } from "./sources";

export type RuleRiskLevel = "informativ" | "warning" | "blocker" | "special_case";
export type RuleReviewStatus = "lawyer_review_required" | "lawyer_verified";

export interface LegalRule {
  id: string;
  title: string;
  sourceRefs: SourceRef[];
  appliesWhen: (draft: Draft) => boolean;
  requiredFacts: string[];
  requiredClauses: string[];
  riskLevel: RuleRiskLevel;
  blocksFinalizationWhen: (draft: Draft) => boolean;
  auditQuestions: string[];
  reviewStatus: RuleReviewStatus;
}

const has = (v: unknown): boolean => {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return Number.isFinite(v) && v > 0;
  return Boolean(v);
};

function termYears(d: Draft): number | null {
  const s = d.term?.start_date;
  const e = d.term?.end_date;
  if (!s || !e) return null;
  const ms = new Date(e).getTime() - new Date(s).getTime();
  if (!Number.isFinite(ms)) return null;
  return ms / (1000 * 60 * 60 * 24 * 365.25);
}

function isForest(d: Draft): boolean {
  return (d.parcels ?? []).some((p) => /erd[őo]/i.test(`${p.cultivation_branch ?? ""}`));
}

function isNaturaOrProtected(d: Draft): boolean {
  return (d.parcels ?? []).some((p) => {
    const s = `${p.special_status ?? ""} ${p.notes ?? ""} ${p.encumbrances ?? ""}`.toLowerCase();
    return s.includes("natura") || s.includes("véd") || s.includes("ved");
  });
}

function hasOutOfScope(d: Draft): boolean {
  return (d.parcels ?? []).some((p) => {
    const s = `${p.special_status ?? ""} ${p.cultivation_branch ?? ""}`.toLowerCase();
    const kivett = s.includes("kivett");
    const agri = ["szántó", "rét", "legel", "kert", "szől", "gyümöl", "gyep", "nádas", "halast"].some((x) =>
      s.includes(x),
    );
    const ricePond = s.includes("rizs") || s.includes("halast");
    return kivett && !ricePond && !agri;
  });
}

function hasPrelaseClaim(d: Draft): boolean {
  const p = d.prelease ?? {};
  return Boolean(
    p.is_former_lessee ||
      p.used_3_years ||
      p.is_local_neighbor ||
      p.is_local_resident ||
      p.within_20km ||
      p.is_local_producer_org ||
      p.is_animal_holder ||
      p.is_organic ||
      p.is_csmt_member ||
      p.is_young_farmer,
  );
}

export const LEGAL_RULES: LegalRule[] = [
  {
    id: "base_lease",
    title: "Alap termőföld-haszonbérleti szabály",
    sourceRefs: [{ sourceId: "fftv", section: "1–5., 44. §" }, { sourceId: "ptk" }],
    appliesWhen: () => true,
    requiredFacts: ["lessor_data.name", "lessee_data.name", "parcels[0]", "rent.model", "term"],
    requiredClauses: [
      "parties_lessor",
      "parties_lessee",
      "land_identification",
      "term",
      "payment_deadline",
      "lessee_eligibility",
      "farmer_or_producer_org",
      "prelease_rank",
      "wf_notary_publication",
      "wf_authority_approval",
      "wf_land_use_registry",
      "soil_protection",
      "no_sublease",
      "possession",
      "termination_settlement",
      "two_witness_signature",
      "attachments_list",
    ],
    riskLevel: "blocker",
    blocksFinalizationWhen: (d) =>
      !has(d.lessor_data?.name) ||
      !has(d.lessee_data?.name) ||
      (d.parcels ?? []).length === 0 ||
      !has(d.rent?.model) ||
      !has(d.term?.start_date) ||
      !has(d.term?.end_date),
    auditQuestions: ["Megvan-e mindkét fél, a föld, a díj és az időtartam?"],
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "two_witness_form",
    title: "Két tanús teljes bizonyító erejű magánokirat",
    sourceRefs: [{ sourceId: "pp", section: "325. §" }, { sourceId: "fftv", section: "49. § (4)" }],
    appliesWhen: () => true,
    requiredFacts: ["witnesses.two_complete"],
    requiredClauses: ["two_witness_signature"],
    riskLevel: "blocker",
    blocksFinalizationWhen: () => false, // a tanúk az aláíráskor töltődnek — a PDF kapuban nézzük
    auditQuestions: ["A végleges aláírás két teljes adatú tanúval történik?"],
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "lessee_eligibility",
    title: "Haszonbérlő jogosultsági szabály",
    sourceRefs: [{ sourceId: "fftv", section: "40–42. §" }],
    appliesWhen: () => true,
    requiredFacts: ["lessee_data.no_land_use_debt"],
    requiredClauses: ["lessee_eligibility"],
    riskLevel: "blocker",
    blocksFinalizationWhen: (d) => d.lessee_data?.no_land_use_debt !== true,
    auditQuestions: ["Nyilatkozott-e a haszonbérlő arról, hogy nincs földhasználati díjtartozása?"],
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "farmer_or_org_or_exception",
    title: "Földműves / mezőgazdasági termelőszervezet / kivétel",
    sourceRefs: [{ sourceId: "fftv", section: "5., 40. §" }],
    appliesWhen: () => true,
    requiredFacts: ["lessee_data.is_registered_farmer|is_producer_org|exception"],
    requiredClauses: ["farmer_or_producer_org"],
    riskLevel: "blocker",
    blocksFinalizationWhen: (d) =>
      d.lessee_data?.is_registered_farmer !== true &&
      d.lessee_data?.is_producer_org !== true,
    auditQuestions: ["Földműves vagy termelőszervezet a haszonbérlő, vagy jelölve van-e kivétel?"],
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "term_window",
    title: "Időtartam: legalább 1 év, legfeljebb 20 év (erdő/különös eset kivételével)",
    sourceRefs: [{ sourceId: "fftv", section: "44. §" }],
    appliesWhen: (d) => has(d.term?.start_date) && has(d.term?.end_date),
    requiredFacts: ["term.start_date", "term.end_date"],
    requiredClauses: ["term"],
    riskLevel: "blocker",
    blocksFinalizationWhen: (d) => {
      const y = termYears(d);
      if (y == null) return false;
      if (y < 1) return true;
      if (y > 20 && !d.term?.is_forest_or_special) return true;
      return false;
    },
    auditQuestions: ["1 és 20 év közé esik az időtartam?"],
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "rent_required",
    title: "Haszonbér díj megadása",
    sourceRefs: [{ sourceId: "ptk" }, { sourceId: "fetv" }],
    appliesWhen: () => true,
    requiredFacts: ["rent.amount|rent.kg_per_ak"],
    requiredClauses: ["rent_cash"],
    riskLevel: "blocker",
    blocksFinalizationWhen: (d) => {
      const r = d.rent ?? {};
      if (!has(r.model)) return true;
      if (r.model === "termeny") return false; // a természetbeni szabály kezeli
      if (r.model === "vegyes" || r.model === "egyedi") return false; // ügyvédi review
      return !has(r.amount);
    },
    auditQuestions: ["Megvan-e a haszonbér modell és összeg?"],
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "rent_in_kind_quantity",
    title: "Természetbeni haszonbér pontos mennyisége",
    sourceRefs: [{ sourceId: "fetv" }],
    appliesWhen: (d) => d.rent?.model === "termeny" || d.rent?.model === "vegyes",
    requiredFacts: ["rent.crop_type", "rent.kg_per_ak"],
    requiredClauses: ["rent_in_kind"],
    riskLevel: "blocker",
    blocksFinalizationWhen: (d) =>
      (d.rent?.model === "termeny" || d.rent?.model === "vegyes") &&
      (!has(d.rent?.crop_type) || (!has(d.rent?.kg_per_ak) && !has(d.rent?.amount))),
    auditQuestions: ["Pontos termény-mennyiség meg van adva?"],
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "prelease_rank_proof",
    title: "Előhaszonbérleti ranghely + igazolás",
    sourceRefs: [{ sourceId: "fftv", section: "45–49. §" }, { sourceId: "korm-474-2013" }],
    appliesWhen: () => true,
    requiredFacts: ["prelease.basis_or_exception"],
    requiredClauses: ["prelease_rank"],
    riskLevel: "blocker",
    blocksFinalizationWhen: (d) =>
      !d.prelease?.no_prelease_exception && !hasPrelaseClaim(d),
    auditQuestions: ["Megjelölt ranghely vagy kivétel, és van bizonyító adat?"],
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "wf_notary_publication",
    title: "Jegyzői közzétételi workflow (NEM generálási stop)",
    sourceRefs: [{ sourceId: "fftv", section: "49. §" }, { sourceId: "korm-474-2013", section: "11. §" }],
    appliesWhen: () => true,
    requiredFacts: [],
    requiredClauses: ["wf_notary_publication"],
    riskLevel: "warning",
    blocksFinalizationWhen: () => false,
    auditQuestions: ["A jegyzői közzétételt workflow-státusz kezeli, nem blokkolja a generálást?"],
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "wf_authority_approval",
    title: "Mezőgazdasági igazgatási szerv jóváhagyási workflow (NEM stop)",
    sourceRefs: [{ sourceId: "fftv", section: "49–55. §" }],
    appliesWhen: () => true,
    requiredFacts: [],
    requiredClauses: ["wf_authority_approval"],
    riskLevel: "warning",
    blocksFinalizationWhen: () => false,
    auditQuestions: ["A hatósági jóváhagyás workflow-státuszként jelenik meg?"],
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "wf_land_use_registry",
    title: "Földhasználati nyilvántartási workflow",
    sourceRefs: [{ sourceId: "korm-356-2007" }],
    appliesWhen: () => true,
    requiredFacts: [],
    requiredClauses: ["wf_land_use_registry"],
    riskLevel: "informativ",
    blocksFinalizationWhen: () => false,
    auditQuestions: ["A bejegyzési kötelezettség checklist-tételként jelenik meg?"],
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "common_ownership",
    title: "Közös tulajdon szabály",
    sourceRefs: [{ sourceId: "ptk", section: "5:73. §" }, { sourceId: "fftv" }],
    appliesWhen: (d) =>
      (d.parcels ?? []).some((p) => p.common_ownership) ||
      ((d.lessor_data?.co_lessors ?? []).filter((c) => c && (c.name || c.address)).length > 0),
    requiredFacts: ["parcels[].existing_use_order|common_ownership_logic"],
    requiredClauses: ["common_ownership_warning"],
    riskLevel: "blocker",
    blocksFinalizationWhen: (d) =>
      (d.parcels ?? []).some((p) => p.common_ownership && !p.existing_use_order),
    auditQuestions: ["Közös tulajdonnál van használati / tulajdoni logika?"],
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "multi_parcel",
    title: "Több hrsz szabály",
    sourceRefs: [{ sourceId: "fftv" }],
    appliesWhen: (d) => (d.parcels ?? []).length > 1,
    requiredFacts: [],
    requiredClauses: ["multi_parcel_note"],
    riskLevel: "warning",
    blocksFinalizationWhen: () => false,
    auditQuestions: ["Több hrsz esetén kiegészítő figyelmeztetés bekerül?"],
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "forest_stop",
    title: "Erdő stop-rule",
    sourceRefs: [{ sourceId: "evt" }, { sourceId: "fftv", section: "2. § (3)" }],
    appliesWhen: isForest,
    requiredFacts: [],
    requiredClauses: [],
    riskLevel: "special_case",
    blocksFinalizationWhen: isForest,
    auditQuestions: ["Erdő esetén speciális ügy-státuszba kerül a draft?"],
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "natura_special",
    title: "Natura 2000 / védett terület speciális ügy",
    sourceRefs: [{ sourceId: "korm-275-2004" }, { sourceId: "tvtv" }],
    appliesWhen: isNaturaOrProtected,
    requiredFacts: [],
    requiredClauses: [],
    riskLevel: "special_case",
    blocksFinalizationWhen: isNaturaOrProtected,
    auditQuestions: ["Natura / védett terület speciális ügyként jelenik meg?"],
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "soil_protection",
    title: "Talajvédelmi / művelési kötelezettség",
    sourceRefs: [{ sourceId: "tfvt" }],
    appliesWhen: () => true,
    requiredFacts: [],
    requiredClauses: ["soil_protection"],
    riskLevel: "informativ",
    blocksFinalizationWhen: () => false,
    auditQuestions: ["Talajvédelmi kötelezettség klauzula bekerül?"],
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "no_sublease",
    title: "Alhaszonbérlet tiltás / speciális ügy",
    sourceRefs: [{ sourceId: "fftv" }],
    appliesWhen: () => true,
    requiredFacts: [],
    requiredClauses: ["no_sublease"],
    riskLevel: "warning",
    blocksFinalizationWhen: () => false,
    auditQuestions: ["Alhaszonbérleti tilalom bekerül?"],
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "out_of_scope_parcel",
    title: "Kivett / hatókörön kívüli terület",
    sourceRefs: [{ sourceId: "fftv", section: "1–5. §" }],
    appliesWhen: hasOutOfScope,
    requiredFacts: [],
    requiredClauses: [],
    riskLevel: "special_case",
    blocksFinalizationWhen: hasOutOfScope,
    auditQuestions: ["Kivett terület esetén speciális ügy-státusz?"],
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "placeholder_validation",
    title: "Placeholder validációs szabály",
    sourceRefs: [],
    appliesWhen: () => true,
    requiredFacts: [],
    requiredClauses: [],
    riskLevel: "blocker",
    blocksFinalizationWhen: () => false, // a kapu külön nézi a draft- és szövegplaceholder-eket
    auditQuestions: ["Placeholder detektor fut a draft adatain és a kompilált szövegen?"],
    reviewStatus: "lawyer_review_required",
  },
];

export function applicableRules(draft: Draft): LegalRule[] {
  return LEGAL_RULES.filter((r) => r.appliesWhen(draft));
}