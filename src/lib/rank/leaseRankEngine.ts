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
  incompleteSpecialRanks: EvaluatedRank[];
  warnings: string[];
  requiredProofs: ProofItem[];
  excluded: { reason: string } | null;
}

function intraPriority(p: PartyStatus): number {
  if (p.csmt_member || p.ocsg_member) return 1;
  if (p.young_farmer) return 2;
  return 3;
}

function resolveEffectiveBranch(ctx: LandContext): LandContext {
  if (!ctx.mixedParcel) return ctx;
  if (ctx.largerArea === "forest") return { ...ctx, branch: "forest" };
  if (ctx.largerArea === "non_forest") return { ...ctx, branch: "non_forest" };
  return ctx;
}

function emptyResult(warnings: string[], excluded: { reason: string } | null): LeaseRankResult {
  return {
    possibleRanks: [],
    strongestRank: null,
    incompleteRanks: [],
    incompleteSpecialRanks: [],
    warnings,
    requiredProofs: [],
    excluded,
  };
}

const SPECIAL_IDS: RankId[] = [
  "G10_animal_holder",
  "G10_organic",
  "G10_horticulture",
  "G10_seed",
  "G10_irrigation",
  "G10_rice",
];

export function evaluateLeaseRanks(input: {
  landContext: LandContext;
  partyStatus: PartyStatus;
}): LeaseRankResult {
  const ctx = resolveEffectiveBranch(input.landContext);
  const p = input.partyStatus;
  const warnings: string[] = [];

  if (ctx.branch === "out_of_scope") {
    return emptyResult(
      [
        "Kivett terület esetén a haszonbérleti előhaszonbérleti ranghely kalkulátor nem alkalmazható.",
      ],
      { reason: "A kivett terület nem tartozik a Földforgalmi törvény szerinti föld fogalma alá." },
    );
  }

  // Adásvétel: ez a motor csak haszonbérletet kezel.
  if (ctx.transaction === "sale") {
    return emptyResult(["Adásvételi elővásárlási ranghely külön modulban készül."], {
      reason: "Az adásvételi elővásárlási ranghely más szabályrendszer.",
    });
  }

  if (p.bankruptcy) {
    warnings.push(
      "Szervezet csőd / felszámolás / végelszámolás esetén a jogcím érvényesítése kizárt lehet.",
    );
  }
  if (p.has_use_debt) {
    warnings.push("Földhasználati díjtartozás a jogcím érvényesítését akadályozhatja.");
  }
  if (input.landContext.mixedParcel && input.landContext.largerArea === "unknown") {
    warnings.push(
      "Vegyes alrészlet — nem ismert melyik nagyobb. Az erdő/nem erdő szabálykészlet közötti választás bizonytalan.",
    );
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

  const incompleteSpecial = incomplete.filter((r) => SPECIAL_IDS.includes(r.id));

  const proofs: ProofItem[] = strongest ? getProofsFor(strongest.id, p) : [];

  return {
    possibleRanks: [...matched, ...incomplete],
    strongestRank: strongest,
    incompleteRanks: incomplete,
    incompleteSpecialRanks: incompleteSpecial,
    warnings,
    requiredProofs: proofs,
    excluded: null,
  };
}

export type { RankDefinition };
