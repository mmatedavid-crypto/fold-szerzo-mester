/**
 * Igazolási lista (proof checklist) a kiválasztott legerősebb ranghelyhez.
 * Kategória: "kotelezo" | "jogcim_fuggo" | "jogi_ellenorzes".
 */

import type { RankId } from "./leaseRankDefinitions";
import type { PartyStatus } from "./leaseTypes";

export type ProofCategory = "kotelezo" | "jogcim_fuggo" | "jogi_ellenorzes";

export interface ProofItem {
  id: string;
  label: string;
  category: ProofCategory;
}

const BASE_NATURAL: ProofItem = {
  id: "p_farmer_registry",
  label: "Földműves nyilvántartási igazolás",
  category: "kotelezo",
};
const BASE_ORG: ProofItem = {
  id: "p_org_registry",
  label: "Mezőgazdasági termelőszervezeti nyilvántartási igazolás",
  category: "kotelezo",
};
const NO_DEBT_DECL: ProofItem = {
  id: "p_no_debt",
  label: "Nyilatkozat: nincs földhasználati díjtartozás",
  category: "kotelezo",
};
const COMMITMENTS_42: ProofItem = {
  id: "p_42_commitments",
  label: "42. § szerinti földhasználati vállalások",
  category: "kotelezo",
};

export function getProofsFor(rankId: RankId, p: PartyStatus): ProofItem[] {
  const out: ProofItem[] = [];
  const add = (item: ProofItem) => {
    if (!out.some((x) => x.id === item.id)) out.push(item);
  };

  if (p.farmer_natural) add(BASE_NATURAL);
  if (p.org_producer) add(BASE_ORG);
  add(NO_DEBT_DECL);
  add(COMMITMENTS_42);

  if (p.local_resident) {
    add({ id: "p_residence", label: "Lakcím és életvitelszerű lakáshasználat igazolása", category: "kotelezo" });
  }
  if (p.org_local || p.org_within_20km) {
    add({ id: "p_op_centre", label: "Mezőgazdasági üzemközpont igazolása", category: "kotelezo" });
  }
  if (p.former_lessee || rankId === "G10_former_lessee" || rankId === "F10_former_lessee" || rankId === "G10_rice") {
    add({ id: "p_former_lease", label: "Földhasználati nyilvántartás / korábbi haszonbérleti szerződés", category: "kotelezo" });
  }
  if (p.co_owner_farmer || rankId === "G20_co_owner" || rankId === "F20_co_owner_forest") {
    add({ id: "p_title_deed", label: "Tulajdoni lap / tulajdonostársi jog igazolása", category: "kotelezo" });
  }
  if (p.local_neighbor || p.org_local_neighbor || rankId === "G30_local_neighbor" || rankId === "G60_org_local_neighbor") {
    add({ id: "p_neighbor", label: "Szomszédos föld tulajdoni lapja vagy földhasználati igazolása", category: "kotelezo" });
  }

  if (rankId === "G10_animal_holder" || p.animal_holder) {
    add({ id: "p_farm_site", label: "Állattartó telep hatósági / nyilvántartási igazolása", category: "kotelezo" });
    add({ id: "p_animal_density", label: "Állatsűrűség igazolása", category: "kotelezo" });
    add({ id: "p_feed_reg", label: "Takarmány-vállalkozási nyilvántartás (ha szükséges)", category: "jogcim_fuggo" });
  }
  if (rankId === "G10_organic" || p.organic_purpose) {
    add({ id: "p_organic", label: "Ökológiai tanúsítás vagy átállási igazolás", category: "kotelezo" });
  }
  if (p.geo_indication_purpose) {
    add({ id: "p_geo", label: "Földrajzi árujelzős termelés igazolása", category: "kotelezo" });
  }
  if (rankId === "G10_horticulture" || p.horticulture_purpose) {
    add({ id: "p_horticulture", label: "Kertészeti tevékenység igazolása", category: "kotelezo" });
  }
  if (rankId === "G10_seed" || p.seed_purpose) {
    add({ id: "p_seed", label: "Szaporítóanyag-előállítás igazolása", category: "kotelezo" });
  }
  if (rankId === "G10_irrigation" || p.irrigation_invested) {
    add({ id: "p_irrigation_docs", label: "Öntözésfejlesztési beruházás dokumentumai", category: "kotelezo" });
    add({ id: "p_accounting", label: "Számviteli / beruházási érték igazolása", category: "kotelezo" });
  }

  if (p.csmt_member || p.ocsg_member) {
    add({ id: "p_csmt", label: "CSMT / ŐCSG tagság igazolása", category: "jogcim_fuggo" });
  }
  if (p.young_farmer) {
    add({ id: "p_young", label: "Fiatal földműves státusz igazolása", category: "jogcim_fuggo" });
  }

  if (p.bankruptcy || p.recent_penalty || p.has_use_debt) {
    add({ id: "p_legal_check", label: "Jogi ellenőrzés szükséges (kockázati tényező észlelve)", category: "jogi_ellenorzes" });
  }

  return out;
}