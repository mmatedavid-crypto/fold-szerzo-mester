import type { Draft, Parcel, PreLease } from "@/lib/contracts/types";

export const LEGAL_RULESET_VERSION = "HU-DRFOLD-2026-06-08";
export const LEASE_CLAUSE_VERSION = "lease-2026-06-08";
export const ACCEPTANCE_STATEMENT_VERSION = "acceptance-2026-06-08";

export type LegalSource = {
  id: string;
  title: string;
  shortTitle: string;
  url: string;
  refs: string[];
  note: string;
};

export type LegalRequirement = {
  id: string;
  label: string;
  legalRefs: string[];
  appliesTo: "lease_contract" | "acceptance_statement" | "both";
  severity: "required" | "warning" | "manual_review";
};

export type LegalAuditItem = {
  id: string;
  label: string;
  legalRefs: string[];
  status: "ok" | "missing" | "warning" | "manual_review";
  message: string;
};

export const LEGAL_SOURCES: LegalSource[] = [
  {
    id: "fftv-2013-cxxii",
    title: "2013. évi CXXII. törvény a mező- és erdőgazdasági földek forgalmáról",
    shortTitle: "Földforgalmi tv.",
    url: "https://njt.jog.gov.hu/jogszabaly/2013-122-00-00",
    refs: ["1. §", "2. §", "4. §", "4/A. §", "4/B. §", "5. §", "42. §", "44–55. §"],
    note: "A földhasználat, haszonbérleti szerződés, előhaszonbérleti jog és hatósági jóváhagyás fő szabályai.",
  },
  {
    id: "fetv-2013-ccxii",
    title:
      "2013. évi CCXII. törvény a mező- és erdőgazdasági földek forgalmáról szóló törvénnyel összefüggő egyes rendelkezésekről és átmeneti szabályokról",
    shortTitle: "Fétv.",
    url: "https://njt.jog.gov.hu/jogszabaly/2013-212-00-00.39",
    refs: ["közzétételi és eljárási rendelkezések", "határidők", "jóváhagyási eljárás"],
    note: "A földforgalmi eljáráshoz kapcsolódó részletszabályok és átmeneti rendelkezések.",
  },
  {
    id: "ptk-2013-v",
    title: "2013. évi V. törvény a Polgári Törvénykönyvről",
    shortTitle: "Ptk.",
    url: "https://njt.jog.gov.hu/jogszabaly/2013-5-00-00",
    refs: ["kötelmi jog", "szerződések általános szabályai", "bérlet/haszonbérlet háttérszabályai"],
    note: "A szerződéses háttérszabályok forrása, ha földforgalmi különös szabály nem tér el.",
  },
  {
    id: "erdotv-2009-xxxvii",
    title: "2009. évi XXXVII. törvény az erdőről, az erdő védelméről és az erdőgazdálkodásról",
    shortTitle: "Erdőtörvény",
    url: "https://njt.jog.gov.hu/jogszabaly/2009-37-00-00.4",
    refs: ["erdőnek minősülő föld", "erdőgazdálkodási használat"],
    note: "Erdő esetén a Földforgalmi tv. szabályai eltérésekkel alkalmazandók.",
  },
];

export const LEASE_CONTRACT_REQUIREMENTS: LegalRequirement[] = [
  {
    id: "parties",
    label: "A felek azonosítása",
    legalRefs: ["Ptk. szerződéses általános szabályok", "Földforgalmi tv. 42. §"],
    appliesTo: "lease_contract",
    severity: "required",
  },
  {
    id: "land_subject",
    label: "A haszonbérlet tárgyát képező föld pontos azonosítása",
    legalRefs: ["Földforgalmi tv. 1–5. §", "Földforgalmi tv. 4–4/B. §"],
    appliesTo: "lease_contract",
    severity: "required",
  },
  {
    id: "term",
    label: "Határozott haszonbérleti időtartam és gazdasági év kezelése",
    legalRefs: ["Földforgalmi tv. 44. §", "Földforgalmi tv. 5. § 8. pont"],
    appliesTo: "lease_contract",
    severity: "required",
  },
  {
    id: "rent",
    label: "Haszonbérleti díj, fizetési mód és határidő",
    legalRefs: ["Ptk. haszonbérleti háttérszabályok", "Földforgalmi tv. jóváhagyási szabályok"],
    appliesTo: "lease_contract",
    severity: "required",
  },
  {
    id: "lessee_declarations",
    label: "Haszonbérlő kötelező nyilatkozatai",
    legalRefs: ["Földforgalmi tv. 42. §", "Földforgalmi tv. 51. § (2) b)"],
    appliesTo: "lease_contract",
    severity: "required",
  },
  {
    id: "prelease_rank",
    label: "Előhaszonbérleti jogalap, ranghely és igazolások",
    legalRefs: ["Földforgalmi tv. 46–49. §", "Földforgalmi tv. 51. § (2) c)"],
    appliesTo: "both",
    severity: "required",
  },
  {
    id: "authority_approval",
    label: "Hatósági jóváhagyás és hirdetményi közlés tudomásulvétele",
    legalRefs: ["Földforgalmi tv. 49–55. §", "Fétv. eljárási rendelkezések"],
    appliesTo: "lease_contract",
    severity: "warning",
  },
  {
    id: "forest_review",
    label: "Erdőnek minősülő föld külön ellenőrzése",
    legalRefs: ["Földforgalmi tv. 2. § (3)", "Földforgalmi tv. 5. § 5a. pont", "Erdőtörvény"],
    appliesTo: "lease_contract",
    severity: "manual_review",
  },
];

export const ACCEPTANCE_STATEMENT_REQUIREMENTS: LegalRequirement[] = [
  {
    id: "accepted_contract",
    label: "A kifüggesztett szerződés egyértelmű azonosítása",
    legalRefs: ["Földforgalmi tv. 49–55. §"],
    appliesTo: "acceptance_statement",
    severity: "required",
  },
  {
    id: "acceptance_identity",
    label: "Az előhaszonbérletre jogosult azonosítása",
    legalRefs: ["Földforgalmi tv. 51. § (4)–(6)", "Földforgalmi tv. 55. §"],
    appliesTo: "acceptance_statement",
    severity: "required",
  },
  {
    id: "acceptance_rank_basis",
    label: "Az előhaszonbérleti jog törvényi jogalapjának és ranghelyének megjelölése",
    legalRefs: ["Földforgalmi tv. 46–49. §", "Földforgalmi tv. 51. § (5) c)"],
    appliesTo: "acceptance_statement",
    severity: "required",
  },
  {
    id: "acceptance_proofs",
    label: "A jogalapot bizonyító okiratok csatolása",
    legalRefs: ["Földforgalmi tv. 51. § (5) c)"],
    appliesTo: "acceptance_statement",
    severity: "required",
  },
  {
    id: "acceptance_deadline",
    label: "Határidőben tett elfogadó jognyilatkozat",
    legalRefs: ["Földforgalmi tv. 51. §", "Fétv. közzétételi eljárási szabályok"],
    appliesTo: "acceptance_statement",
    severity: "required",
  },
];

function hasValue(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value != null && value !== false;
}

function hasAnyPreLeaseBasis(pre: PreLease | undefined): boolean {
  if (!pre) return false;
  return Boolean(
    pre.no_prelease_exception ||
    pre.is_former_lessee ||
    pre.used_3_years ||
    pre.is_local_neighbor ||
    pre.is_local_resident ||
    pre.within_20km ||
    pre.is_local_producer_org ||
    pre.is_animal_holder ||
    pre.is_organic ||
    pre.is_geo_indication ||
    pre.is_horticulture ||
    pre.is_seed ||
    pre.is_irrigation ||
    pre.is_rice ||
    pre.is_csmt_member ||
    pre.is_young_farmer,
  );
}

function hasOutOfScopeParcel(parcels: Parcel[]): boolean {
  return parcels.some((parcel) => {
    const status =
      `${parcel.special_status ?? ""} ${parcel.cultivation_branch ?? ""}`.toLowerCase();
    const isKivett = status.includes("kivett");
    const isRiceException = status.includes("rizstelep");
    const hasAgriculturalPart = [
      "szántó",
      "szanto",
      "rét",
      "ret",
      "legelő",
      "legelo",
      "gyep",
      "kert",
      "szőlő",
      "szolo",
      "gyümölcsös",
      "gyumolcsos",
      "erdő",
      "erdo",
      "fásított",
      "fasitott",
      "nádas",
      "nadas",
      "halastó",
      "halasto",
    ].some((word) => status.includes(word));
    return isKivett && !isRiceException && !hasAgriculturalPart;
  });
}

export function auditLeaseDraftAgainstRuleset(draft: Draft): LegalAuditItem[] {
  const parcels = draft.parcels ?? [];
  const hasParties =
    hasValue(draft.lessor_data?.name) &&
    hasValue(draft.lessor_data?.address) &&
    hasValue(draft.lessee_data?.name) &&
    hasValue(draft.lessee_data?.address);
  const hasLand =
    parcels.length > 0 && parcels.every((p) => hasValue(p.settlement) && hasValue(p.parcel_number));
  const hasTerm = hasValue(draft.term?.start_date) && hasValue(draft.term?.end_date);
  const hasRent =
    hasValue(draft.rent?.model) && hasValue(draft.rent?.deadline) && hasValue(draft.rent?.method);
  const hasLesseeDeclarations =
    draft.lessee_data?.is_registered_farmer === true ||
    draft.lessee_data?.is_producer_org === true ||
    draft.lessee_data?.is_transparent === true;
  const hasPreLease = hasAnyPreLeaseBasis(draft.prelease);
  const outOfScope = hasOutOfScopeParcel(parcels);
  const forest = parcels.some((p) => `${p.cultivation_branch ?? ""}`.toLowerCase().includes("erd"));

  return [
    mkAudit("parties", hasParties, "A felek alapadatai szerepelnek.", "Hiányos félazonosítás."),
    mkAudit(
      "land_subject",
      hasLand && !outOfScope,
      "A földterület azonosítható.",
      outOfScope
        ? "Kivett / hatályon kívüli terület gyanúja merült fel."
        : "Hiányos földterület-azonosítás.",
    ),
    mkAudit("term", hasTerm, "Az időtartam megadva.", "Hiányzik a haszonbérleti időtartam."),
    mkAudit(
      "rent",
      hasRent,
      "A díj és fizetés alapadatai megadva.",
      "Hiányos haszonbérleti díj / fizetési adat.",
    ),
    mkAudit(
      "lessee_declarations",
      hasLesseeDeclarations,
      "A haszonbérlő nyilatkozati alapadatai szerepelnek.",
      "A haszonbérlő 42. § szerinti nyilatkozatai külön ellenőrizendők.",
      hasLesseeDeclarations ? "ok" : "manual_review",
    ),
    mkAudit(
      "prelease_rank",
      hasPreLease,
      "Az előhaszonbérleti jogalap meg van jelölve.",
      "Az előhaszonbérleti jogalap / ranghely nincs kellően megjelölve.",
    ),
    mkAudit(
      "authority_approval",
      true,
      "A dokumentum a hatósági jóváhagyási és hirdetményi eljárásra figyelmeztet.",
      "A hatósági jóváhagyási eljárásra figyelmeztetni kell.",
      "warning",
    ),
    mkAudit(
      "forest_review",
      !forest,
      "Nem erdőként jelölt föld.",
      "Erdőnek minősülő föld esetén Erdőtörvény szerinti külön ellenőrzés szükséges.",
      forest ? "manual_review" : "ok",
    ),
  ];
}

function mkAudit(
  id: string,
  ok: boolean,
  okMessage: string,
  failMessage: string,
  overrideStatus?: LegalAuditItem["status"],
): LegalAuditItem {
  const req = LEASE_CONTRACT_REQUIREMENTS.find((r) => r.id === id);
  const status =
    overrideStatus ??
    (ok
      ? "ok"
      : req?.severity === "manual_review"
        ? "manual_review"
        : req?.severity === "warning"
          ? "warning"
          : "missing");
  return {
    id,
    label: req?.label ?? id,
    legalRefs: req?.legalRefs ?? [],
    status,
    message: ok ? okMessage : failMessage,
  };
}

export function legalSourcesSummary(): string {
  return LEGAL_SOURCES.map((source) => `${source.shortTitle}: ${source.refs.join(", ")}`).join(
    "\n",
  );
}

export function legalAuditText(items: LegalAuditItem[]): string {
  return items
    .map((item) => {
      const status =
        item.status === "ok"
          ? "Rendben"
          : item.status === "missing"
            ? "Hiányzik"
            : item.status === "manual_review"
              ? "Ügyvédi ellenőrzés javasolt"
              : "Figyelmeztetés";
      return `${status}: ${item.label}. ${item.message} Jogszabályi alap: ${item.legalRefs.join("; ") || "általános szerződéses szabályok"}.`;
    })
    .join("\n");
}
