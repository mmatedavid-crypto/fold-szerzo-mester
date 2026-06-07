/**
 * Haszonbérleti ranghely-kalkulátor motor.
 *
 * Bemenet: landContext + partyStatus.
 * Kimenet:
 *  - possibleRanks: minden ranghely, amit a felhasználó bejelölése érintett
 *    (match + incomplete egyaránt).
 *  - strongestRank: a legerősebb VALID (match) ranghely.
 *  - incompleteRanks: amit bejelölt de feltétel hiányzik.
 *  - warnings, requiredProofs.
 *
 * Intra-group szabály: csak ugyanazon `group`-on belül módosít subPriorityt,
 * SOHA nem ugrik át főcsoportot.
 */

import { RANK_DEFINITIONS, type RankDefinition, type RankId } from "./leaseRankDefinitions";
import type { LandContext, PartyStatus } from "./leaseTypes";
import { getProofsFor, type ProofItem } from "./proofRequirements";

export interface EvaluatedRank {
  id: RankId;
  group: number;
  humanName: string;
  legalRef: string;
  state: "match" | "incomplete";
  missing?: string[];
  /** Intra-group prioritás (kisebb = erősebb): CSMT/ŐCSG=1, fiatal=2, sima=3. */
  intraPriority: number;
}

export interface LeaseRankResult {
  possibleRanks: EvaluatedRank[];
  strongestRank: EvaluatedRank | null;
  incompleteRanks: EvaluatedRank[];
  warnings: string[];
  requiredProofs: ProofItem[];
  excluded: { reason: string } | null;
}

function intraPriority(p: PartyStatus): number {
  if (p.csmt_member || p.ocsg_member) return 1;
  if (p.young_farmer) return 2;
  return 3;
}

export function evaluateLeaseRanks(input: {
  landContext: LandContext;
  partyStatus: PartyStatus;
}): LeaseRankResult {
  const { landContext: ctx, partyStatus: p } = input;
  const warnings: string[] = [];

  // Adásvétel: ez a motor csak haszonbérletet kezel.
  if (ctx.transaction === "sale") {
    return {
      possibleRanks: [],
      strongestRank: null,
      incompleteRanks: [],
      warnings: ["Adásvételi elővásárlási ranghely külön modulban készül."],
      requiredProofs: [],
      excluded: { reason: "Az adásvételi elővásárlási ranghely más szabályrendszer." },
    };
  }

  // Kizárás: közeli hozzátartozó.
  if (p.close_relative) {
    return {
      possibleRanks: [],
      strongestRank: null,
      incompleteRanks: [],
      warnings: [
        "A szerződő féllel közeli hozzátartozói viszony esetén előhaszonbérleti jog főszabály szerint kizárt.",
      ],
      requiredProofs: [],
      excluded: {
        reason:
          "A szerződő féllel közeli hozzátartozói viszony a Földforgalmi tv. szerint kizárja az előhaszonbérleti jogot.",
      },
    };
  }

  if (p.bankruptcy) {
    warnings.push("Szervezet csőd / felszámolás / végelszámolás esetén a jogcím érvényesítése kizárt lehet.");
  }
  if (p.has_use_debt) {
    warnings.push("Földhasználati díjtartozás a jogcím érvényesítését akadályozhatja.");
  }

  const ip = intraPriority(p);
  const matched: EvaluatedRank[] = [];
  const incomplete: EvaluatedRank[] = [];

  for (const def of RANK_DEFINITIONS) {
    if (def.branch !== ctx.branch) continue;
    const res = def.evaluate(ctx, p);
    if (res.state === "no") continue;
    const ev: EvaluatedRank = {
      id: def.id,
      group: def.group,
      humanName: def.humanName,
      legalRef: def.legalRef,
      state: res.state,
      missing: res.missing,
      intraPriority: ip,
    };
    if (res.state === "match") matched.push(ev);
    else incomplete.push(ev);
  }

  // Erősebb = kisebb group, majd kisebb intraPriority.
  matched.sort((a, b) => a.group - b.group || a.intraPriority - b.intraPriority);
  const strongest = matched[0] ?? null;

  const proofs: ProofItem[] = strongest ? getProofsFor(strongest.id, p) : [];

  return {
    possibleRanks: [...matched, ...incomplete],
    strongestRank: strongest,
    incompleteRanks: incomplete,
    warnings,
    requiredProofs: proofs,
    excluded: null,
  };
}

export type { RankDefinition };