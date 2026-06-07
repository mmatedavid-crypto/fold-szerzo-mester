/**
 * Haszonbérleti előhaszonbérleti ranghely-definíciók.
 *
 * Az új, önálló kalkulátorhoz készült deklaratív szabálykészlet.
 * A meglévő `engine.ts` és `types.ts` (Notice-alapú admin-futtatás) érintetlen.
 *
 * Csoportok:
 *   - Erdő: F10 (volt haszonbérlő), F20 (földműves tulajdonostárs).
 *   - Nem erdő: 10 (volt haszonbérlő + speciális csúcs-jogcímek), 20 (földműves
 *     tulajdonostárs közös tulajdonban), 30 (helyben lakó szomszéd földműves),
 *     40 (helyben lakó földműves), 50 (20 km-en belüli földműves),
 *     60 (helybeli szervezeti szomszéd), 70 (helybeli szervezet),
 *     80 (20 km szervezet).
 *
 * Kisebb `group` = erősebb. Csoporton belül a `subPriority` rendezi az
 * azonos jogcímeket (kisebb = erősebb), de comparison szempontjából a `group`
 * dönt; subPriority csak intra-group prioritást ad (CSMT > fiatal > sima).
 */

import type { LandContext, PartyStatus } from "./leaseTypes";

export type RankId =
  | "F10_former_lessee"
  | "F20_co_owner_forest"
  | "G10_former_lessee"
  | "G10_animal_holder"
  | "G10_organic"
  | "G10_horticulture"
  | "G10_seed"
  | "G10_irrigation"
  | "G10_rice"
  | "G20_co_owner"
  | "G30_local_neighbor"
  | "G40_local_resident"
  | "G50_within_20km"
  | "G60_org_local_neighbor"
  | "G70_org_local"
  | "G80_org_within_20km";

export interface RankDefinition {
  id: RankId;
  /** Fő ranghely-csoport (kisebb = erősebb). */
  group: number;
  branch: "forest" | "non_forest";
  humanName: string;
  legalRef: string;
  /** Művelési ágak, amikre alkalmazható (üres = mindre). */
  allowedCultivation?: string[];
  /**
   * Visszaad egy értékelést: alkalmazható-e ennek a félnek az adott földhöz.
   *  - "match"      → teljes mértékben megfelel, érvényes ranghely
   *  - "incomplete" → bejelölte a szándékot, de hiányoznak feltételek
   *  - "no"         → nem alkalmazható
   */
  evaluate: (ctx: LandContext, p: PartyStatus) => {
    state: "match" | "incomplete" | "no";
    missing?: string[];
  };
}

const isFarmerNatural = (p: PartyStatus) => p.farmer_natural;
const isOrg = (p: PartyStatus) => p.org_producer;

export const RANK_DEFINITIONS: RankDefinition[] = [
  // ───────────── ERDŐ ─────────────
  {
    id: "F10_former_lessee",
    group: 10,
    branch: "forest",
    humanName: "Erdő — volt haszonbérlő (földműves / szervezet)",
    legalRef: "Evt. szerinti előhaszonbérleti rangsor",
    evaluate: (ctx, p) => {
      if (ctx.branch !== "forest") return { state: "no" };
      if (!p.former_lessee) return { state: "no" };
      if (!(isFarmerNatural(p) || isOrg(p))) return { state: "no" };
      const localish =
        p.local_resident || p.local_neighbor || p.within_20km || p.org_local || p.org_local_neighbor || p.org_within_20km;
      if (!localish) return { state: "incomplete", missing: ["helyben lakó / helybeli / 20 km-es feltétel"] };
      return { state: "match" };
    },
  },
  {
    id: "F20_co_owner_forest",
    group: 20,
    branch: "forest",
    humanName: "Erdő — földműves tulajdonostárs",
    legalRef: "Evt. szerinti tulajdonostársi előhaszonbérlet",
    evaluate: (ctx, p) => {
      if (ctx.branch !== "forest") return { state: "no" };
      if (!p.co_owner_farmer) return { state: "no" };
      const missing: string[] = [];
      if (!ctx.commonOwnership) missing.push("közös tulajdon a földön");
      if (!ctx.coOwnerLeaseToThirdParty) missing.push("tulajdonostárs harmadik személynek adja bérbe");
      if (missing.length) return { state: "incomplete", missing };
      return { state: "match" };
    },
  },

  // ───────────── NEM ERDŐ — 10-es csoport (csúcs) ─────────────
  {
    id: "G10_former_lessee",
    group: 10,
    branch: "non_forest",
    humanName: "Volt haszonbérlő",
    legalRef: "2013. évi CXXII. tv. (Földforgalmi tv.) 46. § — volt haszonbérlő",
    evaluate: (ctx, p) => {
      if (ctx.branch !== "non_forest") return { state: "no" };
      if (!p.former_lessee) return { state: "no" };
      const missing: string[] = [];
      if (!(isFarmerNatural(p) || isOrg(p))) missing.push("földműves / mg. termelőszervezeti státusz");
      const localish =
        p.local_resident || p.local_neighbor || p.within_20km || p.org_local || p.org_local_neighbor || p.org_within_20km;
      if (!localish) missing.push("helyben lakó / helybeli / 20 km-es feltétel");
      if (missing.length) return { state: "incomplete", missing };
      return { state: "match" };
    },
  },
  {
    id: "G10_animal_holder",
    group: 10,
    branch: "non_forest",
    humanName: "Állattartó telepet üzemeltető helybeli földműves",
    legalRef: "Földforgalmi tv. 46. § — állattartó telep csúcsjogcím",
    evaluate: (ctx, p) => {
      if (ctx.branch !== "non_forest") return { state: "no" };
      if (!p.animal_holder) return { state: "no" };
      const missing: string[] = [];
      if (!(p.local_resident || p.org_local || p.local_neighbor || p.org_local_neighbor))
        missing.push("helyben lakó vagy helybeli mg. szervezet státusz");
      if (!p.feed_purpose) missing.push("takarmányszükséglet a cél");
      if (!p.animal_density_ok) missing.push("megfelelő állatsűrűség igazolása");
      if (missing.length) return { state: "incomplete", missing };
      return { state: "match" };
    },
  },
  {
    id: "G10_organic",
    group: 10,
    branch: "non_forest",
    humanName: "Ökológiai gazdálkodás / földrajzi árujelző csúcsjogcím",
    legalRef: "Földforgalmi tv. 46. § — ökológiai / OFJ termelés",
    allowedCultivation: ["szanto", "kert", "szolo", "gyumolcsos"],
    evaluate: (ctx, p) => {
      if (ctx.branch !== "non_forest") return { state: "no" };
      if (!(p.organic_purpose || p.geo_indication_purpose)) return { state: "no" };
      const missing: string[] = [];
      const allowed = ["szanto", "kert", "szolo", "gyumolcsos"];
      if (!ctx.cultivationBranch || !allowed.includes(ctx.cultivationBranch))
        missing.push("megfelelő művelési ág (szántó / kert / szőlő / gyümölcsös)");
      if (!(p.local_resident || p.org_local)) missing.push("helyben lakó földműves vagy helybeli szervezet");
      if (missing.length) return { state: "incomplete", missing };
      return { state: "match" };
    },
  },
  {
    id: "G10_horticulture",
    group: 10,
    branch: "non_forest",
    humanName: "Kertészeti tevékenység csúcsjogcím",
    legalRef: "Földforgalmi tv. 46. § — kertészeti tevékenység",
    evaluate: (ctx, p) => {
      if (ctx.branch !== "non_forest") return { state: "no" };
      if (!p.horticulture_purpose) return { state: "no" };
      const missing: string[] = [];
      if (!(p.local_resident || p.org_local)) missing.push("helyben lakó / helybeli szervezet");
      if (missing.length) return { state: "incomplete", missing };
      return { state: "match" };
    },
  },
  {
    id: "G10_seed",
    group: 10,
    branch: "non_forest",
    humanName: "Szaporítóanyag-előállítás csúcsjogcím",
    legalRef: "Földforgalmi tv. 46. § — szaporítóanyag-előállítás",
    evaluate: (ctx, p) => {
      if (ctx.branch !== "non_forest") return { state: "no" };
      if (!p.seed_purpose) return { state: "no" };
      const missing: string[] = [];
      if (!(p.local_resident || p.org_local)) missing.push("helyben lakó / helybeli szervezet");
      if (missing.length) return { state: "incomplete", missing };
      return { state: "match" };
    },
  },
  {
    id: "G10_irrigation",
    group: 10,
    branch: "non_forest",
    humanName: "Öntözésfejlesztési beruházást megvalósító csúcsjogcím",
    legalRef: "Földforgalmi tv. 46. § — öntözésfejlesztés",
    allowedCultivation: ["szanto", "szolo", "gyumolcsos", "kert"],
    evaluate: (ctx, p) => {
      if (ctx.branch !== "non_forest") return { state: "no" };
      if (!p.irrigation_invested) return { state: "no" };
      const missing: string[] = [];
      const allowed = ["szanto", "szolo", "gyumolcsos", "kert"];
      if (!ctx.cultivationBranch || !allowed.includes(ctx.cultivationBranch))
        missing.push("megfelelő művelési ág");
      if (!p.irrigation_half_land) missing.push("a föld legalább fele öntözhető");
      if (!p.irrigation_half_term) missing.push("a beruházás a futamidő legalább feléig értékkel bír");
      if (missing.length) return { state: "incomplete", missing };
      return { state: "match" };
    },
  },
  {
    id: "G10_rice",
    group: 10,
    branch: "non_forest",
    humanName: "Rizstelep volt haszonbérlője",
    legalRef: "Földforgalmi tv. 46. § — rizstelep",
    allowedCultivation: ["rizstelep"],
    evaluate: (ctx, p) => {
      if (ctx.branch !== "non_forest") return { state: "no" };
      if (!p.rice_former_lessee) return { state: "no" };
      if (ctx.cultivationBranch !== "rizstelep")
        return { state: "incomplete", missing: ["rizstelep művelési ág"] };
      return { state: "match" };
    },
  },

  // ───────────── NEM ERDŐ — 20-as csoport (földműves tulajdonostárs) ─────────────
  {
    id: "G20_co_owner",
    group: 20,
    branch: "non_forest",
    humanName: "Földműves tulajdonostárs (közös tulajdon)",
    legalRef: "Földforgalmi tv. 46. § — tulajdonostárs",
    evaluate: (ctx, p) => {
      if (ctx.branch !== "non_forest") return { state: "no" };
      if (!p.co_owner_farmer) return { state: "no" };
      const missing: string[] = [];
      if (!ctx.commonOwnership) missing.push("közös tulajdon a földön");
      if (!ctx.coOwnerLeaseToThirdParty) missing.push("tulajdonostárs harmadik személynek adja bérbe");
      if (!isFarmerNatural(p)) missing.push("földműves természetes személy státusz");
      if (missing.length) return { state: "incomplete", missing };
      return { state: "match" };
    },
  },

  // ───────────── NEM ERDŐ — természetes személy láncolat ─────────────
  {
    id: "G30_local_neighbor",
    group: 30,
    branch: "non_forest",
    humanName: "Helyben lakó szomszéd földműves",
    legalRef: "Földforgalmi tv. 46. § (3) — helyben lakó szomszéd",
    evaluate: (ctx, p) => {
      if (ctx.branch !== "non_forest") return { state: "no" };
      if (!isFarmerNatural(p)) return { state: "no" };
      if (!(p.local_resident && p.local_neighbor)) return { state: "no" };
      return { state: "match" };
    },
  },
  {
    id: "G40_local_resident",
    group: 40,
    branch: "non_forest",
    humanName: "Helyben lakó földműves",
    legalRef: "Földforgalmi tv. 46. § — helyben lakó földműves",
    evaluate: (ctx, p) => {
      if (ctx.branch !== "non_forest") return { state: "no" };
      if (!isFarmerNatural(p)) return { state: "no" };
      if (!p.local_resident) return { state: "no" };
      return { state: "match" };
    },
  },
  {
    id: "G50_within_20km",
    group: 50,
    branch: "non_forest",
    humanName: "20 km-en belüli földműves",
    legalRef: "Földforgalmi tv. 46. § — 20 km-es körzet",
    evaluate: (ctx, p) => {
      if (ctx.branch !== "non_forest") return { state: "no" };
      if (!isFarmerNatural(p)) return { state: "no" };
      if (!p.within_20km) return { state: "no" };
      return { state: "match" };
    },
  },

  // ───────────── NEM ERDŐ — szervezeti láncolat ─────────────
  {
    id: "G60_org_local_neighbor",
    group: 60,
    branch: "non_forest",
    humanName: "Helybeli mg. termelőszervezet szomszéd",
    legalRef: "Földforgalmi tv. 46. § — helybeli szervezeti szomszéd",
    evaluate: (ctx, p) => {
      if (ctx.branch !== "non_forest") return { state: "no" };
      if (!isOrg(p)) return { state: "no" };
      if (!(p.org_local && p.org_local_neighbor)) return { state: "no" };
      return { state: "match" };
    },
  },
  {
    id: "G70_org_local",
    group: 70,
    branch: "non_forest",
    humanName: "Helybeli mg. termelőszervezet",
    legalRef: "Földforgalmi tv. 46. § — helybeli szervezet",
    evaluate: (ctx, p) => {
      if (ctx.branch !== "non_forest") return { state: "no" };
      if (!isOrg(p)) return { state: "no" };
      if (!p.org_local) return { state: "no" };
      return { state: "match" };
    },
  },
  {
    id: "G80_org_within_20km",
    group: 80,
    branch: "non_forest",
    humanName: "20 km-en belüli mg. termelőszervezet",
    legalRef: "Földforgalmi tv. 46. § — 20 km-es szervezet",
    evaluate: (ctx, p) => {
      if (ctx.branch !== "non_forest") return { state: "no" };
      if (!isOrg(p)) return { state: "no" };
      if (!p.org_within_20km) return { state: "no" };
      return { state: "match" };
    },
  },
];

export function getRankDefinition(id: RankId): RankDefinition | undefined {
  return RANK_DEFINITIONS.find((r) => r.id === id);
}