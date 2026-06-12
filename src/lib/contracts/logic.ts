import type {
  Draft,
  RiskItem,
  RiskReport,
  PreLease,
  Rent,
  Term,
  Parcel,
  Lessor,
  Lessee,
} from "./types";
import { auditLeaseDraftAgainstRuleset } from "@/lib/legal/ruleset";
import { evaluateDraft } from "@/lib/legal/engine";
import { isBlockingStatus } from "@/lib/legal/status";

function req(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  return true;
}

function diffYears(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  if (Number.isNaN(da) || Number.isNaN(db)) return NaN;
  return (db - da) / (1000 * 60 * 60 * 24 * 365.25);
}

/** Parse "1/2", "0.5", "50%" etc. as a fraction in [0, 1]. Returns null when unparseable. */
export function parseShare(s: string | undefined | null): number | null {
  if (!s) return null;
  const t = s.trim().replace(/\s/g, "");
  if (!t) return null;
  const pct = t.match(/^([\d.,]+)\s*%$/);
  if (pct) {
    const n = parseFloat(pct[1].replace(",", "."));
    return Number.isFinite(n) ? n / 100 : null;
  }
  const frac = t.match(/^(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/);
  if (frac) {
    const a = parseFloat(frac[1].replace(",", "."));
    const b = parseFloat(frac[2].replace(",", "."));
    return b > 0 ? a / b : null;
  }
  const n = parseFloat(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Return primary lessor + all non-empty co-lessors as a flat list. */
export function allLessors(L: Lessor | undefined | null): Lessor[] {
  if (!L) return [];
  const co = (L.co_lessors ?? []).filter((c) => c && (c.name || c.address || c.ownership_share));
  return [L, ...co];
}

/** Human-readable joined lessor names: "Kiss János; Nagy Béla". */
export function joinLessorNames(L: Lessor | undefined | null): string {
  return allLessors(L)
    .map((x) => x.name)
    .filter(Boolean)
    .join("; ");
}

export function computeRiskReport(
  draft: Pick<Draft, "lessor_data" | "lessee_data" | "parcels" | "rent" | "term" | "prelease">,
): RiskReport {
  const items: RiskItem[] = [];
  const L: Lessor = draft.lessor_data ?? {};
  const E: Lessee = draft.lessee_data ?? {};
  const parcels: Parcel[] = draft.parcels ?? [];
  const rent: Rent = draft.rent ?? {};
  const term: Term = draft.term ?? {};
  const pre: PreLease = draft.prelease ?? {};

  // Mandatory parties
  if (!req(L.name))
    items.push({
      id: "lessor_name",
      category: "felek",
      level: "hianyzo_kotelezo",
      message: "Hiányzik a haszonbérbeadó neve.",
    });
  if (!req(L.address))
    items.push({
      id: "lessor_address",
      category: "felek",
      level: "hianyzo_kotelezo",
      message: "Hiányzik a haszonbérbeadó címe.",
    });
  const coLessors = (L.co_lessors ?? []).filter(
    (c) => c && (req(c.name) || req(c.address) || req(c.ownership_share)),
  );
  coLessors.forEach((c, i) => {
    const tag = `${i + 2}. tulajdonos`;
    if (!req(c.name))
      items.push({
        id: `co_lessor_${i}_name`,
        category: "felek",
        level: "hianyzo_kotelezo",
        message: `${tag}: hiányzik a név.`,
      });
    if (!req(c.address))
      items.push({
        id: `co_lessor_${i}_address`,
        category: "felek",
        level: "hianyzo_kotelezo",
        message: `${tag}: hiányzik a cím.`,
      });
    if (!req(c.ownership_share))
      items.push({
        id: `co_lessor_${i}_share`,
        category: "felek",
        level: "figyelmeztetes",
        message: `${tag}: hiányzik a tulajdoni hányad.`,
      });
  });
  if (coLessors.length > 0) {
    const totals = [L, ...coLessors]
      .map((x) => parseShare(x.ownership_share))
      .filter((n): n is number => n != null);
    if (totals.length === 1 + coLessors.length) {
      const sum = totals.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1) > 0.001) {
        items.push({
          id: "ownership_sum",
          category: "felek",
          level: "jogi_ellenorzes",
          message: `A tulajdoni hányadok összege ${sum.toFixed(3)} — 1/1 helyett.`,
        });
      }
    }
  }
  if (!req(E.name))
    items.push({
      id: "lessee_name",
      category: "felek",
      level: "hianyzo_kotelezo",
      message: "Hiányzik a haszonbérlő neve / cégneve.",
    });
  if (!req(E.address))
    items.push({
      id: "lessee_address",
      category: "felek",
      level: "hianyzo_kotelezo",
      message: "Hiányzik a haszonbérlő címe / székhelye.",
    });
  if (E.type && !E.is_registered_farmer && !E.is_producer_org) {
    items.push({
      id: "lessee_farmer",
      category: "felek",
      level: "jogi_ellenorzes",
      message:
        "A haszonbérlő földműves vagy mezőgazdasági termelőszervezeti jogosultsága nem igazolt — ezt a földhasználati jogosultság megszerzésénél külön vizsgálni kell.",
    });
  }
  if (!E.no_land_use_debt) {
    items.push({
      id: "lessee_no_land_use_debt",
      category: "felek",
      level: "jogi_ellenorzes",
      message: "Hiányzik a haszonbérlő nyilatkozata arról, hogy nincs földhasználati díjtartozása.",
    });
  }
  if (E.is_producer_org && !E.is_transparent) {
    items.push({
      id: "lessee_transparency",
      category: "felek",
      level: "jogi_ellenorzes",
      message:
        "Mezőgazdasági termelőszervezetnél az átláthatósági nyilatkozat külön ellenőrizendő.",
    });
  }

  // Parcels
  if (parcels.length === 0) {
    items.push({
      id: "parcels_missing",
      category: "foldterulet",
      level: "hianyzo_kotelezo",
      message: "Legalább egy földterület megadása kötelező.",
    });
  }
  parcels.forEach((p, i) => {
    const tag = `${i + 1}. parcella`;
    if (!req(p.settlement))
      items.push({
        id: `parcel_${i}_settlement`,
        category: "foldterulet",
        level: "hianyzo_kotelezo",
        message: `${tag}: hiányzik a település.`,
      });
    if (!req(p.parcel_number))
      items.push({
        id: `parcel_${i}_hrsz`,
        category: "foldterulet",
        level: "hianyzo_kotelezo",
        message: `${tag}: hiányzik a helyrajzi szám.`,
      });
    if (!req(p.area_ha) && !req(p.area_m2))
      items.push({
        id: `parcel_${i}_area`,
        category: "foldterulet",
        level: "hianyzo_kotelezo",
        message: `${tag}: hiányzik a terület.`,
      });
    if (p.common_ownership)
      items.push({
        id: `parcel_${i}_common`,
        category: "foldterulet",
        level: "jogi_ellenorzes",
        message: `${tag}: közös tulajdon — használati megosztás vizsgálandó.`,
      });
    if (p.usufruct_right)
      items.push({
        id: `parcel_${i}_usufruct`,
        category: "foldterulet",
        level: "jogi_ellenorzes",
        message: `${tag}: haszonélvezeti jog terheli — haszonélvező hozzájárulása szükséges lehet.`,
      });
    const cultivation = `${p.cultivation_branch ?? ""} ${p.special_status ?? ""}`.toLowerCase();
    const isKivett = cultivation.includes("kivett");
    const hasRiceException = cultivation.includes("rizs") || cultivation.includes("halast");
    const hasAgriculturalPart = cultivation.includes("szántó") || cultivation.includes("gyep");
    if (isKivett && !hasRiceException && !hasAgriculturalPart) {
      items.push({
        id: `parcel_${i}_out_of_scope`,
        category: "foldterulet",
        level: "hianyzo_kotelezo",
        message: `${tag}: kivett vagy nem termőföldként jelölt terület gyanúja — a Földforgalmi tv. szerinti haszonbérleti szerződés sablon nem alkalmazható automatikusan.`,
      });
    }
  });
  if (parcels.length > 1) {
    items.push({
      id: "combined_parcels",
      category: "foldterulet",
      level: "figyelmeztetes",
      message:
        "Több parcella egy szerződésben: a kombinált díjszámítás csak akkor megengedett, ha a területek szomszédosak vagy ugyanaz a használó legalább 3 éve használja őket.",
    });
  }

  // Term
  if (!req(term.start_date) || !req(term.end_date)) {
    items.push({
      id: "term_dates",
      category: "idotartam",
      level: "hianyzo_kotelezo",
      message: "Hiányzik a haszonbérlet kezdő vagy befejező dátuma.",
    });
  } else {
    const years = diffYears(term.start_date!, term.end_date!);
    if (Number.isFinite(years)) {
      if (years < 1)
        items.push({
          id: "term_short",
          category: "idotartam",
          level: "figyelmeztetes",
          message: "Az időtartam kevesebb mint egy gazdasági év.",
        });
      if (years > 20 && !term.is_forest_or_special)
        items.push({
          id: "term_long",
          category: "idotartam",
          level: "jogi_ellenorzes",
          message:
            "A megadott időtartam meghaladja a 20 évet — speciális eset szükséges (pl. erdő).",
        });
    }
  }

  // Rent
  if (!req(rent.model))
    items.push({
      id: "rent_model",
      category: "dij",
      level: "hianyzo_kotelezo",
      message: "Hiányzik a haszonbérleti díj modellje.",
    });
  if (rent.model === "ft_ak_ev") {
    const anyAk = parcels.some((p) => req(p.aranykorona));
    if (!anyAk)
      items.push({
        id: "rent_ak_missing",
        category: "dij",
        level: "hianyzo_kotelezo",
        message: "Ft/AK/év modellnél kötelező az aranykorona érték megadása.",
      });
  }
  if (rent.model === "termeny") {
    if (!req(rent.crop_type))
      items.push({
        id: "rent_crop",
        category: "dij",
        level: "hianyzo_kotelezo",
        message: "Termény-egyenértéknél kötelező a termény megadása.",
      });
    if (!req(rent.kg_per_ak) && !req(rent.amount))
      items.push({
        id: "rent_qty",
        category: "dij",
        level: "hianyzo_kotelezo",
        message: "Termény-egyenértéknél kötelező a pontos mennyiség megadása.",
      });
  }
  if (!req(rent.deadline))
    items.push({
      id: "rent_deadline",
      category: "dij",
      level: "hianyzo_kotelezo",
      message: "Hiányzik a fizetési határidő.",
    });
  if (!req(rent.method))
    items.push({
      id: "rent_method",
      category: "dij",
      level: "hianyzo_kotelezo",
      message: "Hiányzik a fizetés módja.",
    });

  // Pre-lease
  const anyPre = !!(
    pre.is_former_lessee ||
    pre.used_3_years ||
    pre.is_local_neighbor ||
    pre.is_local_resident ||
    pre.is_local_producer_org ||
    pre.is_animal_holder ||
    pre.is_organic ||
    pre.is_csmt_member ||
    pre.is_young_farmer
  );
  if (!pre.no_prelease_exception && !anyPre) {
    items.push({
      id: "prelease_unclear",
      category: "eloberlet",
      level: "figyelmeztetes",
      message:
        "Az előhaszonbérleti rangsor megalapozása hiányos — kérjük, válaszd meg a megfelelő jogalapot.",
    });
  }

  const legalAudit = auditLeaseDraftAgainstRuleset(draft as Draft);
  for (const audit of legalAudit) {
    if (audit.status === "ok") continue;
    items.push({
      id: `legal_${audit.id}`,
      category: "jogszabalyi_ruleset",
      level:
        audit.status === "missing"
          ? "hianyzo_kotelezo"
          : audit.status === "manual_review"
            ? "jogi_ellenorzes"
            : "figyelmeztetes",
      message: `${audit.message} (${audit.legalRefs.join("; ")})`,
    });
  }

  // Új determinisztikus szabálymotor — a meglévő riport fölé rétegezve.
  const evaluation = evaluateDraft(draft as Draft);
  for (const b of evaluation.blockers) {
    items.push({
      id: `engine_${b.ruleId}`,
      category: "jogszabalyi_motor",
      level: "hianyzo_kotelezo",
      message: `${b.title} (${b.sourceRefs.join("; ")})`,
    });
  }
  for (const s of evaluation.specialCases) {
    items.push({
      id: `engine_${s.ruleId}`,
      category: "jogszabalyi_motor",
      level: "jogi_ellenorzes",
      message: `Speciális ügy: ${s.title} (${s.sourceRefs.join("; ")})`,
    });
  }
  for (const w of evaluation.warnings) {
    items.push({
      id: `engine_${w.ruleId}`,
      category: "jogszabalyi_motor",
      level: "figyelmeztetes",
      message: `${w.title} (${w.sourceRefs.join("; ")})`,
    });
  }
  for (const p of evaluation.placeholders) {
    items.push({
      id: `placeholder_${p.field}`,
      category: "jogszabalyi_motor",
      level: "hianyzo_kotelezo",
      message: `Placeholder: ${p.message} (${p.field})`,
    });
  }

  // Add a "rendben" placeholder if no findings
  if (items.length === 0)
    items.push({
      id: "ok",
      category: "altalanos",
      level: "rendben",
      message:
        "Minden alapadat rendben van. A végleges szerződés a fizetés/keret felhasználása után készül el.",
    });

  const blocking =
    items.some((i) => i.level === "hianyzo_kotelezo") || isBlockingStatus(evaluation.status);
  return { items, can_finalize: !blocking };
}

export function preLeaseRank(pre: PreLease): { rank: string; basis: string; proofs: string[] } {
  if (pre.no_prelease_exception) {
    return {
      rank: "Nem alkalmazandó (jogszabályi kivétel)",
      basis: "A bejelentett kivétel alapján előhaszonbérleti jog nem áll fenn.",
      proofs: ["Kivétel igazolása"],
    };
  }
  const ranks: { cond: boolean; label: string; basis: string; proofs: string[] }[] = [
    {
      cond: !!pre.is_former_lessee,
      label: "1. rang: volt haszonbérlő",
      basis: "A haszonbérlő a korábbi haszonbérlő.",
      proofs: ["Korábbi szerződés másolata"],
    },
    {
      cond: !!pre.used_3_years,
      label: "2. rang: legalább 3 éve használó",
      basis:
        "A haszonbérlő a közzétételt közvetlenül megelőzően legalább 3 éve használja a földet.",
      proofs: ["Földhasználati lap, használati igazolás"],
    },
    {
      cond: !!(pre.is_local_resident || pre.is_local_neighbor),
      label: "3. rang: helyi lakos / szomszéd",
      basis: "A haszonbérlő helyi lakos vagy szomszéd.",
      proofs: ["Lakcímkártya, helyrajzi térkép"],
    },
    {
      cond: !!pre.within_20km,
      label: "4. rang: 20 km-en belüli",
      basis: "A haszonbérlő a település 20 km-es körzetén belül lakó/működő.",
      proofs: ["Lakcím/székhely igazolás"],
    },
    {
      cond: !!pre.is_local_producer_org,
      label: "5. rang: helyi termelőszervezet",
      basis: "Helyi mezőgazdasági termelőszervezet.",
      proofs: ["Tagsági/működési igazolás"],
    },
    {
      cond: !!pre.is_animal_holder,
      label: "6. rang: állattartó (takarmány-előállító)",
      basis: "Állattartó, aki takarmány-előállításra használja.",
      proofs: ["ENAR, állatlétszám-igazolás"],
    },
    {
      cond: !!pre.is_organic,
      label: "7. rang: ökológiai gazdálkodó",
      basis: "Ökológiai gazdálkodó.",
      proofs: ["Ökológiai tanúsítvány"],
    },
  ];
  const hit = ranks.find((r) => r.cond);
  if (hit) return { rank: hit.label, basis: hit.basis, proofs: hit.proofs };
  return {
    rank: "Általános rang (egyéb földműves)",
    basis: "Általános előhaszonbérleti rang a földforgalmi tv. szerint.",
    proofs: ["Földműves nyilvántartási igazolás"],
  };
}

export function rentDescription(rent: Rent): string {
  if (!rent.model) return "—";
  switch (rent.model) {
    case "ft_ha_ev":
      return `${rent.amount ?? 0} Ft / ha / év`;
    case "ft_ev":
      return `${rent.amount ?? 0} Ft / év`;
    case "ft_ak_ev":
      return `${rent.amount ?? 0} Ft / AK / év`;
    case "termeny":
      return `${rent.kg_per_ak ?? rent.amount ?? 0} kg ${rent.crop_type ?? ""} / AK / év (min. ${rent.min_cash ?? 0} Ft)`;
    case "vegyes":
      return "Vegyes díjmodell";
    case "egyedi":
      return "Egyedi díjlépcső";
  }
}

export function coreFieldsFingerprint(
  draft: Pick<Draft, "lessor_data" | "lessee_data" | "parcels" | "rent" | "term" | "prelease">,
): string {
  const core = {
    lessor: draft.lessor_data?.name,
    lessee: draft.lessee_data?.name,
    parcels: (draft.parcels ?? [])
      .map((p) => `${p.settlement ?? ""}/${p.parcel_number ?? ""}`)
      .sort(),
    rentModel: draft.rent?.model,
    termStart: draft.term?.start_date,
    termEnd: draft.term?.end_date,
    preBasis: draft.prelease?.no_prelease_exception
      ? "exception"
      : draft.prelease?.is_former_lessee
        ? "former"
        : draft.prelease?.used_3_years
          ? "3y"
          : draft.prelease?.is_local_resident
            ? "local"
            : draft.prelease?.is_animal_holder
              ? "animal"
              : draft.prelease?.is_organic
                ? "organic"
                : "general",
  };
  return JSON.stringify(core);
}
