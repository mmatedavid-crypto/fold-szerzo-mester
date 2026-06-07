/**
 * Két fél (kifüggesztett bérlő vs user) ranghely-eredményeinek összehasonlítása.
 */

import { evaluateLeaseRanks, type LeaseRankResult, type EvaluatedRank } from "./leaseRankEngine";
import type { LandContext, PartyStatus } from "./leaseTypes";
import type { ProofItem } from "./proofRequirements";

export type ComparisonOutcome =
  | "user_stronger"
  | "same_rank"
  | "user_weaker"
  | "cannot_determine"
  | "no_valid_user_rank"
  | "no_prelease_right";

export interface LeaseComparisonResult {
  comparison: ComparisonOutcome;
  explanation: string;
  userStrongestRank: EvaluatedRank | null;
  lesseeStrongestRank: EvaluatedRank | null;
  requiredProofs: ProofItem[];
  missingConditions: string[];
  warnings: string[];
  user: LeaseRankResult;
  lessee: LeaseRankResult;
}

function isUnknownLessee(p: PartyStatus): boolean {
  if (p.unknown_status || p.unknown_base) return true;
  // Ha semmi sincs bejelölve, nem összehasonlítható.
  return Object.entries(p).every(([_, v]) => v === false);
}

export function compareLeaseRanks(input: {
  landContext: LandContext;
  lesseeStatus: PartyStatus;
  userStatus: PartyStatus;
}): LeaseComparisonResult {
  const { landContext, lesseeStatus, userStatus } = input;

  const lessee = evaluateLeaseRanks({ landContext, partyStatus: lesseeStatus });
  const user = evaluateLeaseRanks({ landContext, partyStatus: userStatus });

  if (landContext.transaction === "sale") {
    return {
      comparison: "no_prelease_right",
      explanation:
        "Adásvételi ügyletre a haszonbérleti előhaszonbérleti ranghely nem értelmezhető. Az elővásárlási ranghely külön kalkulátorban készül.",
      userStrongestRank: null,
      lesseeStrongestRank: null,
      requiredProofs: [],
      missingConditions: [],
      warnings: ["Adásvételhez külön kalkulátor használandó."],
      user,
      lessee,
    };
  }

  if (user.excluded) {
    return {
      comparison: "no_prelease_right",
      explanation: user.excluded.reason,
      userStrongestRank: null,
      lesseeStrongestRank: lessee.strongestRank,
      requiredProofs: [],
      missingConditions: [],
      warnings: user.warnings,
      user,
      lessee,
    };
  }

  const lesseeUnknown = isUnknownLessee(lesseeStatus);
  const missing: string[] = [];
  if (lesseeUnknown) missing.push("A kifüggesztett bérlő jogcíme nem ismert");
  if (!landContext.cultivationBranch) missing.push("Művelési ág nem ismert");

  // Nincs érvényes user ranghely
  if (!user.strongestRank) {
    const incomplete = user.incompleteRanks.length > 0;
    return {
      comparison: incomplete ? "no_valid_user_rank" : "no_valid_user_rank",
      explanation:
        "A bejelölt adatok alapján nem látszik olyan előhaszonbérleti jogcím, amelyre biztonsággal lehetne elfogadó nyilatkozatot alapozni.",
      userStrongestRank: null,
      lesseeStrongestRank: lessee.strongestRank,
      requiredProofs: [],
      missingConditions: user.incompleteRanks.flatMap((r) => r.missing ?? []),
      warnings: user.warnings,
      user,
      lessee,
    };
  }

  if (lesseeUnknown || (!lessee.strongestRank && lessee.incompleteRanks.length === 0)) {
    return {
      comparison: "cannot_determine",
      explanation:
        "Hiányzik néhány adat, ezért nem lehet biztosan megmondani, ki áll előrébb. A te legerősebb jogcímedet és az igazoláslistát alább megtalálod.",
      userStrongestRank: user.strongestRank,
      lesseeStrongestRank: lessee.strongestRank,
      requiredProofs: user.requiredProofs,
      missingConditions: missing,
      warnings: [...user.warnings, ...lessee.warnings],
      user,
      lessee,
    };
  }

  const lesseeRank = lessee.strongestRank;
  const userRank = user.strongestRank;

  if (!lesseeRank) {
    // Bejelölt valamit a bérlőnél, de mind incomplete → nem összehasonlítható.
    return {
      comparison: "cannot_determine",
      explanation:
        "A kifüggesztett bérlő státusza nem ad teljes érvényes ranghelyet a megadott adatokból.",
      userStrongestRank: userRank,
      lesseeStrongestRank: null,
      requiredProofs: user.requiredProofs,
      missingConditions: missing,
      warnings: [...user.warnings, ...lessee.warnings],
      user,
      lessee,
    };
  }

  if (userRank.group < lesseeRank.group) {
    return mkOutcome("user_stronger", "A megadott adatok alapján előrébb állhatsz a sorban, mint a kifüggesztett szerződés szerinti bérlő.", user, lessee, userRank, lesseeRank);
  }
  if (userRank.group > lesseeRank.group) {
    return mkOutcome("user_weaker", "A megadott adatok alapján valószínűleg hátrébb állsz a sorban.", user, lessee, userRank, lesseeRank);
  }
  // Ugyanaz a group → intra-priority eldönti, de comparison szempontjából
  // azonos főranghely; csak akkor "stronger", ha a usernek alacsonyabb intraPriority.
  if (userRank.intraPriority < lesseeRank.intraPriority) {
    return mkOutcome("user_stronger", "Azonos ranghely-csoporton belül a te csoporton belüli prioritásod (pl. CSMT / ŐCSG / fiatal) erősebb.", user, lessee, userRank, lesseeRank);
  }
  if (userRank.intraPriority > lesseeRank.intraPriority) {
    return mkOutcome("user_weaker", "Azonos ranghely-csoporton belül a kifüggesztett bérlő intra-csoport prioritása erősebb.", user, lessee, userRank, lesseeRank);
  }
  return mkOutcome("same_rank", "A megadott adatok alapján azonos ranghelyen állhattok. Ez nem jelenti automatikusan, hogy te lépsz a bérlő helyébe.", user, lessee, userRank, lesseeRank);
}

function mkOutcome(
  comparison: ComparisonOutcome,
  explanation: string,
  user: LeaseRankResult,
  lessee: LeaseRankResult,
  userRank: EvaluatedRank,
  lesseeRank: EvaluatedRank | null
): LeaseComparisonResult {
  return {
    comparison,
    explanation,
    userStrongestRank: userRank,
    lesseeStrongestRank: lesseeRank,
    requiredProofs: user.requiredProofs,
    missingConditions: [],
    warnings: [...user.warnings, ...lessee.warnings],
    user,
    lessee,
  };
}