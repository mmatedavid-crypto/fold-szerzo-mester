import { RANK_DEFINITIONS, type RankId } from "./leaseRankDefinitions";
import { getProofsFor, type ProofItem } from "./proofRequirements";
import { EMPTY_PARTY, type PartyStatus } from "./leaseTypes";

/**
 * A kiválasztott jogalapokból (rank id-k) szintetikus PartyStatust állít össze
 * pusztán a csatolandó okiratok listájához (nem ranghely-számoláshoz).
 */
function synthesizePartyForRank(id: RankId): PartyStatus {
  const p: PartyStatus = { ...EMPTY_PARTY };
  switch (id) {
    case "F10_former_lessee":
      p.former_lessee = true; p.farmer_natural = true; p.local_resident = true; break;
    case "F20_co_owner_forest":
      p.co_owner_farmer = true; p.farmer_natural = true; break;
    case "G10_former_lessee":
      p.former_lessee = true; p.farmer_natural = true; p.local_resident = true; p.used_3_years = true; break;
    case "G10_animal_holder":
      p.animal_holder = true; p.farmer_natural = true; p.local_resident = true; p.feed_purpose = true; p.animal_density_ok = true; break;
    case "G10_organic":
      p.organic_purpose = true; p.farmer_natural = true; p.local_resident = true; break;
    case "G10_horticulture":
      p.horticulture_purpose = true; p.farmer_natural = true; p.local_resident = true; break;
    case "G10_seed":
      p.seed_purpose = true; p.farmer_natural = true; p.local_resident = true; break;
    case "G10_irrigation":
      p.irrigation_invested = true; p.farmer_natural = true; p.local_resident = true; break;
    case "G10_rice":
      p.rice_former_lessee = true; p.former_lessee = true; p.farmer_natural = true; break;
    case "G20_co_owner":
      p.co_owner_farmer = true; p.farmer_natural = true; break;
    case "G30_local_neighbor":
      p.farmer_natural = true; p.local_resident = true; p.local_neighbor = true; break;
    case "G40_local_resident":
      p.farmer_natural = true; p.local_resident = true; break;
    case "G50_within_20km":
      p.farmer_natural = true; p.within_20km = true; break;
    case "G60_org_local_neighbor":
      p.org_producer = true; p.org_local = true; p.org_local_neighbor = true; break;
    case "G70_org_local":
      p.org_producer = true; p.org_local = true; break;
    case "G80_org_within_20km":
      p.org_producer = true; p.org_within_20km = true; break;
  }
  return p;
}

export interface RankOption {
  id: RankId;
  label: string;
  legalRef: string;
  group: number;
  branch: "forest" | "non_forest";
}

export const RANK_OPTIONS: RankOption[] = RANK_DEFINITIONS.map((r) => ({
  id: r.id,
  label: r.humanName,
  legalRef: r.legalRef,
  group: r.group,
  branch: r.branch,
})).sort((a, b) => a.group - b.group || a.label.localeCompare(b.label, "hu"));

export function proofsForRanks(rankIds: RankId[]): ProofItem[] {
  const out: ProofItem[] = [];
  for (const id of rankIds) {
    const proofs = getProofsFor(id, synthesizePartyForRank(id));
    for (const proof of proofs) {
      if (!out.some((x) => x.id === proof.id)) out.push(proof);
    }
  }
  return out;
}

/** Az erősebb (kisebb group számú) rank-csoportot adja vissza, ha van. */
export function strongestRankSummary(rankIds: RankId[]): { group: number; label: string } | null {
  if (!rankIds.length) return null;
  const defs = RANK_DEFINITIONS.filter((r) => rankIds.includes(r.id));
  if (!defs.length) return null;
  const best = defs.reduce((a, b) => (b.group < a.group ? b : a));
  return { group: best.group, label: `${best.group}. ranghely (${best.humanName})` };
}