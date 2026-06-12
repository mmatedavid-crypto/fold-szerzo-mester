/**
 * Klauzulakönyvtár (clauseLibrary).
 * A szerződés CSAK ezekből a modulokból állhat össze. AI nem talál ki klauzulát.
 * Minden klauzula sourceRefs[]-szel hivatkozik a jogforrásra, és induló státusza
 * `lawyer_review_required`.
 */

import type { Draft } from "@/lib/contracts/types";
import type { SourceRef } from "./sources";

export type ClauseRiskLevel = "informativ" | "normal" | "kritikus";
export type ClauseReviewStatus = "lawyer_review_required" | "lawyer_verified";

export interface ClauseModule {
  id: string;
  title: string;
  bodyTemplate: string; // {{var}} placeholderekkel; a compose oldal helyettesít
  sourceRefs: SourceRef[];
  requiredFacts: string[];
  appliesWhen: (draft: Draft) => boolean;
  riskLevel: ClauseRiskLevel;
  reviewStatus: ClauseReviewStatus;
}

const always = () => true;

function hasCoOwners(d: Draft) {
  return (d.lessor_data?.co_lessors ?? []).some(
    (c) => c && (c.name || c.address || c.ownership_share),
  );
}
function hasMultipleParcels(d: Draft) {
  return (d.parcels ?? []).length > 1;
}
function isInKind(d: Draft) {
  return d.rent?.model === "termeny" || d.rent?.model === "vegyes";
}
function isCash(d: Draft) {
  return d.rent?.model !== "termeny";
}
function isProducerOrg(d: Draft) {
  return d.lessee_data?.is_producer_org === true;
}
function hasPreLeaseBasis(d: Draft) {
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
      p.is_young_farmer ||
      p.no_prelease_exception,
  );
}
function isForestOrSpecial(d: Draft) {
  return (
    d.term?.is_forest_or_special === true ||
    (d.parcels ?? []).some((p) => /erd[őo]/i.test(p.cultivation_branch ?? ""))
  );
}

export const CLAUSE_LIBRARY: ClauseModule[] = [
  {
    id: "parties_lessor",
    title: "Haszonbérbeadó adatai",
    bodyTemplate: "Haszonbérbeadó(k): {{lessor_block}}",
    sourceRefs: [{ sourceId: "ptk", section: "6:331. §" }, { sourceId: "fftv", section: "44. §" }],
    requiredFacts: ["lessor_data.name", "lessor_data.address"],
    appliesWhen: always,
    riskLevel: "kritikus",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "parties_lessee",
    title: "Haszonbérlő adatai",
    bodyTemplate: "Haszonbérlő: {{lessee_name}} (lakcím/székhely: {{lessee_address}})",
    sourceRefs: [{ sourceId: "fftv", section: "40–42. §" }],
    requiredFacts: ["lessee_data.name", "lessee_data.address"],
    appliesWhen: always,
    riskLevel: "kritikus",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "land_identification",
    title: "Földterület azonosítása",
    bodyTemplate: "A haszonbérlet tárgyát képező földrészlet(ek):\n{{parcels_block}}",
    sourceRefs: [{ sourceId: "fftv", section: "1–5. §" }],
    requiredFacts: ["parcels[].settlement", "parcels[].parcel_number", "parcels[].area"],
    appliesWhen: always,
    riskLevel: "kritikus",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "multi_parcel_note",
    title: "Több földrészlet melléklete",
    bodyTemplate:
      "A több földrészletre vonatkozó haszonbér csak akkor vonható össze, ha a területek szomszédosak vagy ugyanaz a használó legalább 3 éve használja őket.",
    sourceRefs: [{ sourceId: "fftv" }],
    requiredFacts: [],
    appliesWhen: hasMultipleParcels,
    riskLevel: "normal",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "common_ownership_warning",
    title: "Közös tulajdon figyelmeztetés",
    bodyTemplate:
      "Közös tulajdonban álló földrészlet esetén a használati/tulajdoni logika (használati megosztás, tulajdonostárs hozzájárulása) külön vizsgálandó.",
    sourceRefs: [{ sourceId: "ptk", section: "5:73. §" }, { sourceId: "fftv" }],
    requiredFacts: ["parcels[].common_ownership"],
    appliesWhen: (d) => (d.parcels ?? []).some((p) => p.common_ownership) || hasCoOwners(d),
    riskLevel: "kritikus",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "term",
    title: "Időtartam",
    bodyTemplate:
      "A haszonbérlet határozott időre szól: {{term_start}}-tól {{term_end}}-ig. Első gazdasági év: {{first_economic_year}}. Birtokbaadás: {{possession_date}}.",
    sourceRefs: [{ sourceId: "fftv", section: "44. §" }],
    requiredFacts: ["term.start_date", "term.end_date"],
    appliesWhen: always,
    riskLevel: "kritikus",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "rent_cash",
    title: "Pénzbeli haszonbér",
    bodyTemplate: "Haszonbér: {{rent_description}}. {{rent_indexation}}",
    sourceRefs: [{ sourceId: "ptk" }, { sourceId: "fetv" }],
    requiredFacts: ["rent.amount"],
    appliesWhen: (d) => isCash(d) && !isInKind(d),
    riskLevel: "kritikus",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "rent_in_kind",
    title: "Természetbeni haszonbér",
    bodyTemplate:
      "Természetbeni haszonbér: {{rent_description}}. A teljesítés helye és minőségi követelményei a szerződésben rögzítettek szerint.",
    sourceRefs: [{ sourceId: "ptk" }, { sourceId: "fetv" }],
    requiredFacts: ["rent.crop_type", "rent.kg_per_ak"],
    appliesWhen: isInKind,
    riskLevel: "kritikus",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "payment_deadline",
    title: "Fizetési határidő és mód",
    bodyTemplate: "Fizetési határidő: {{rent_deadline}}. Fizetési mód: {{rent_method}}.",
    sourceRefs: [{ sourceId: "fetv" }],
    requiredFacts: ["rent.deadline", "rent.method"],
    appliesWhen: always,
    riskLevel: "normal",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "lessee_eligibility",
    title: "Haszonbérlő jogosultsági nyilatkozata",
    bodyTemplate:
      "A haszonbérlő kijelenti, hogy a Földforgalmi tv. szerinti földhasználati jogosultság megszerzésének feltételeit teljesíti, és a föld használatát a jogszabályban megengedett eset kivételével másnak nem engedi át.",
    sourceRefs: [{ sourceId: "fftv", section: "40–42. §" }, { sourceId: "fetv", section: "94. §" }],
    requiredFacts: ["lessee_data.no_land_use_debt"],
    appliesWhen: always,
    riskLevel: "kritikus",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "farmer_or_producer_org",
    title: "Földműves / mezőgazdasági termelőszervezet nyilatkozat",
    bodyTemplate:
      "A haszonbérlő nyilatkozik földműves nyilvántartási státuszáról, illetve mezőgazdasági termelőszervezeti minőségéről és átlátható szervezeti jellegéről.",
    sourceRefs: [{ sourceId: "fftv", section: "5. §" }],
    requiredFacts: ["lessee_data.is_registered_farmer|is_producer_org"],
    appliesWhen: always,
    riskLevel: "kritikus",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "producer_org_transparency",
    title: "Termelőszervezet átláthatósági nyilatkozata",
    bodyTemplate: "A mezőgazdasági termelőszervezet átlátható szervezeti minőségét igazolja.",
    sourceRefs: [{ sourceId: "fftv" }],
    requiredFacts: ["lessee_data.is_transparent"],
    appliesWhen: isProducerOrg,
    riskLevel: "kritikus",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "prelease_rank",
    title: "Előhaszonbérleti ranghely nyilatkozat",
    bodyTemplate:
      "Előhaszonbérleti jogalap: {{prelease_basis}} — megjelölt ranghely: {{prelease_rank}}.",
    sourceRefs: [{ sourceId: "fftv", section: "45–49. §" }, { sourceId: "korm-474-2013" }],
    requiredFacts: ["prelease.basis_or_exception"],
    appliesWhen: always,
    riskLevel: "kritikus",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "wf_notary_publication",
    title: "Jegyzői közzétételi workflow",
    bodyTemplate:
      "A szerződés aláírását követően a haszonbérbeadó köteles a szerződést a föld fekvése szerint illetékes jegyzőhöz továbbítani hirdetményi közzététel céljából.",
    sourceRefs: [{ sourceId: "fftv", section: "49. §" }, { sourceId: "korm-474-2013", section: "11. §" }],
    requiredFacts: [],
    appliesWhen: always,
    riskLevel: "normal",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "wf_authority_approval",
    title: "Hatósági jóváhagyási workflow",
    bodyTemplate:
      "A szerződés hatályosulásához / földhasználat bejegyzéséhez a mezőgazdasági igazgatási szerv jóváhagyása szükséges lehet.",
    sourceRefs: [{ sourceId: "fftv", section: "49–55. §" }],
    requiredFacts: [],
    appliesWhen: always,
    riskLevel: "normal",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "wf_land_use_registry",
    title: "Földhasználati nyilvántartás workflow",
    bodyTemplate:
      "A haszonbérlő köteles a földhasználatot a 356/2007. (XII. 23.) Korm. rendelet szerint bejelenteni a földhasználati nyilvántartásba.",
    sourceRefs: [{ sourceId: "korm-356-2007" }],
    requiredFacts: [],
    appliesWhen: always,
    riskLevel: "normal",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "soil_protection",
    title: "Művelési és talajvédelmi kötelezettség",
    bodyTemplate:
      "A haszonbérlő köteles a földet a művelési ágának megfelelően művelni és a termőföld védelmére vonatkozó szabályokat betartani.",
    sourceRefs: [{ sourceId: "tfvt" }],
    requiredFacts: [],
    appliesWhen: always,
    riskLevel: "normal",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "no_sublease",
    title: "Alhaszonbérlet tiltása",
    bodyTemplate:
      "A haszonbérlő a föld használatát másnak — a jogszabályban megengedett eset kivételével — nem engedheti át. Alhaszonbérlet tilos.",
    sourceRefs: [{ sourceId: "fftv" }],
    requiredFacts: [],
    appliesWhen: always,
    riskLevel: "kritikus",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "possession",
    title: "Birtokbaadás",
    bodyTemplate: "Birtokbaadás napja: {{possession_date}}. A birtokátruházás jegyzőkönyvvel történik.",
    sourceRefs: [{ sourceId: "ptk" }],
    requiredFacts: [],
    appliesWhen: always,
    riskLevel: "normal",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "termination_settlement",
    title: "Megszűnés és elszámolás",
    bodyTemplate:
      "A haszonbérleti szerződés megszűnésére és az elszámolásra a Ptk. és a Földforgalmi tv. szabályai irányadók.",
    sourceRefs: [{ sourceId: "ptk" }, { sourceId: "fftv" }],
    requiredFacts: [],
    appliesWhen: always,
    riskLevel: "normal",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "two_witness_signature",
    title: "Két tanús aláírási blokk",
    bodyTemplate:
      "A szerződés teljes bizonyító erejű magánokirati formában készül, két tanú jelenlétében aláírva. Tanúk neve, lakcíme, aláírása a végén feltüntetve.",
    sourceRefs: [{ sourceId: "pp", section: "325. §" }],
    requiredFacts: ["witnesses.two_complete"],
    appliesWhen: always,
    riskLevel: "kritikus",
    reviewStatus: "lawyer_review_required",
  },
  {
    id: "attachments_list",
    title: "Mellékletek listája",
    bodyTemplate:
      "Mellékletek: 1) tulajdoni lap másolat, 2) földmérési térkép, 3) előhaszonbérleti jogalapot igazoló okiratok, 4) használati megosztási megállapodás (ha van), 5) erdőterv (erdőnél).",
    sourceRefs: [{ sourceId: "korm-474-2013", section: "2. melléklet" }],
    requiredFacts: [],
    appliesWhen: always,
    riskLevel: "informativ",
    reviewStatus: "lawyer_review_required",
  },
];

export function clausesFor(draft: Draft): ClauseModule[] {
  return CLAUSE_LIBRARY.filter((c) => c.appliesWhen(draft));
}

export function findClause(id: string): ClauseModule | undefined {
  return CLAUSE_LIBRARY.find((c) => c.id === id);
}

// A "forest"/Natura specifikus klauzulamodul nincs külön — speciális ügy stop-rule
// a `rules.ts`-ben kezeli; a draft akkor SPECIALIS_UGY_STOP státuszba kerül.
export const _hasForestOrSpecial = isForestOrSpecial;
export const _hasPreLeaseBasis = hasPreLeaseBasis;