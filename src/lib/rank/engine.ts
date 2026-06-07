/**
 * Ranghely-kalkulátor motor.
 *
 * Jogszabályi alap:
 *   - 2013. évi CXXII. tv. (Földforgalmi tv.) 46. § (1)-(4) — nem erdő.
 *   - 2009. évi XXXVII. tv. (Erdő tv., Evt.) — erdő, placeholder.
 *
 * Tervezési elvek:
 *   1) Erdő és nem-erdő logika SZIGORÚAN különválasztva.
 *   2) Jogok nem adódnak össze — egy igénylő egy legerősebb ranghelyet kap.
 *   3) Azonos ranghelyen belüli "tiebreaker" sorrendet a `subRank` adja meg
 *      (kisebb = erősebb), de a publikus `rank` csak az integer ranghelyet adja vissza.
 *   4) Kizárások (közeli hozzátartozó, kivett alanyok) → null + warning.
 *   5) Külső jogszabályok (Evt., családi gazdaság tv.) → placeholder + warning.
 */

import type {
  ClaimantProfile,
  NoticeFacts,
  RankResult,
  RankReasonCode,
} from "./types";

export const RANK_RULES_VERSION = "v1.0.0";

interface InternalRankCandidate {
  rank: number;
  /** Tie-breaker sorrend ugyanazon ranghelyen belül; kisebb = erősebb. */
  subRank: number;
  reasonCode: RankReasonCode;
  reason: string;
}

function buildResult(
  best: InternalRankCandidate | null,
  branch: NoticeFacts["branch"],
  warnings: string[],
  contractingPartyRank: number | null | undefined,
  fallback: { reasonCode: RankReasonCode; reason: string }
): RankResult {
  if (!best) {
    return {
      rank: null,
      branch,
      reasonCode: fallback.reasonCode,
      reason: fallback.reason,
      warnings,
      strongerThanContractingParty: null,
      rulesVersion: RANK_RULES_VERSION,
    };
  }

  let strongerThanContractingParty: boolean | null = null;
  if (typeof contractingPartyRank === "number") {
    // Kisebb rangszám = erősebb jog.
    strongerThanContractingParty = best.rank < contractingPartyRank;
  }

  return {
    rank: best.rank,
    branch,
    reasonCode: best.reasonCode,
    reason: best.reason,
    warnings,
    strongerThanContractingParty,
    rulesVersion: RANK_RULES_VERSION,
  };
}

/**
 * Kizárások — előbb futnak, mint bármelyik szabály-ág.
 * Ha igaz, a jog teljesen elveszik, függetlenül attól, hogy egyébként
 * lenne-e ranghely.
 */
function checkExclusions(
  claimant: ClaimantProfile
): { excluded: true; reasonCode: RankReasonCode; reason: string } | { excluded: false } {
  if (claimant.isCloseRelativeOfSeller) {
    // 46. § (5) — a közeli hozzátartozóval kötött adásvétel mentes
    // az elővásárlási jog gyakorlása alól.
    return {
      excluded: true,
      reasonCode: "no_right_close_relative",
      reason:
        "A szerződő féllel közeli hozzátartozói viszonyban áll, ezért az elővásárlási jog gyakorlása kizárt (Földforgalmi tv. 46. § (5) bek.).",
    };
  }
  if (claimant.isExemptEntity) {
    return {
      excluded: true,
      reasonCode: "no_right_exempt_entity",
      reason:
        "A megjelölt alany (állam / önkormányzat / egyházi jogi személy) jogi státusza miatt az általános elővásárlási rang nem alkalmazható.",
    };
  }
  return { excluded: false };
}

/**
 * Nem-erdő ág: Földforgalmi tv. 46. § (1)-(4).
 *
 * Egyszerűsített modell (a kezdeti v1.0.0 készlet):
 *
 *   1. ranghely — 46. § (1):
 *      a) családi gazdaság tagja, ha helyben lakó földműves,
 *      b) helyben lakó földműves,
 *      c) állattartó telepet üzemeltető helyben lakó földműves
 *         (rét/legelő esetén külön preferencia — TODO külön branch tag).
 *   2. ranghely — 46. § (2): helyben lakó földműves (más jogcímen).
 *   3. ranghely — 46. § (3): a település közigazgatási határán belül
 *      földhasználó földműves.
 *   4. ranghely — 46. § (4): minden más földműves.
 *
 * Tiebreaker:
 *   - jelenlegi földhasználó > szomszédos földhasználó > települési földhasználó.
 */
function evaluateNonForest(
  notice: NoticeFacts,
  claimant: ClaimantProfile,
  warnings: string[]
): InternalRankCandidate | null {
  // Az összes nem-erdő szabály FÖLDMŰVES státuszt feltételez.
  if (!claimant.isFoldmuves) {
    return null;
  }

  const helybeliFoldmuves = claimant.isFoldmuves && claimant.isHelybenLako;

  const candidates: InternalRankCandidate[] = [];

  // 46. § (1) a) — családi gazdaság tag, helyben lakó földműves
  if (helybeliFoldmuves && claimant.isCsaladiGazdasagTag) {
    candidates.push({
      rank: 1,
      subRank: 1,
      reasonCode: "non_forest_46_1_a",
      reason:
        "1. ranghely — Földforgalmi tv. 46. § (1) bek. a) pont: családi mezőgazdasági társaság / őstermelők családi gazdaságának helyben lakó földműves tagja.",
    });
  }

  // 46. § (1) c) — állattartó telep, helyben lakó földműves
  if (helybeliFoldmuves && claimant.isAllattarto) {
    if (notice.cultivationBranchTags?.some((t) => t === "ret" || t === "legelo")) {
      warnings.push(
        "A művelési ág (rét/legelő) miatt az állattartó telepet üzemeltető helyben lakó földműves preferencia érvényesül — kérjük ellenőrizze a hatósági jóváhagyási kritériumokat (46. § (1) c))."
      );
    }
    candidates.push({
      rank: 1,
      subRank: 2,
      reasonCode: "non_forest_46_1_c",
      reason:
        "1. ranghely — Földforgalmi tv. 46. § (1) bek. c) pont: állattartó telepet üzemeltető helyben lakó földműves.",
    });
  }

  // 46. § (1) b) — helyben lakó földműves (általános)
  if (helybeliFoldmuves) {
    candidates.push({
      rank: 1,
      subRank: 3,
      reasonCode: "non_forest_46_1_b",
      reason:
        "1. ranghely — Földforgalmi tv. 46. § (1) bek. b) pont: helyben lakó földműves.",
    });
  }

  // 46. § (2) — helyben lakó földműves (másodlagos jogcím)
  // Megjegyzés: gyakorlatban ezt az (1) lefedi. A modell tartalékként hagyja meg
  // azokra az esetekre, amikor a helyben lakó földműves a 2. ranghelyen kerül
  // értékelésre (pl. más jogcímen nem nyer 1. helyet).
  if (helybeliFoldmuves) {
    candidates.push({
      rank: 2,
      subRank: 1,
      reasonCode: "non_forest_46_2",
      reason:
        "2. ranghely — Földforgalmi tv. 46. § (2) bek.: helyben lakó földműves.",
    });
  }

  // 46. § (3) — a település közigazgatási területén földhasználó földműves
  if (
    claimant.isJelenlegiFoldhasznalo ||
    claimant.isSzomszedosFoldhasznalo ||
    claimant.isTelepulesiFoldhasznalo
  ) {
    // Tiebreaker: jelenlegi (1) > szomszédos (2) > települési (3).
    const sub = claimant.isJelenlegiFoldhasznalo
      ? 1
      : claimant.isSzomszedosFoldhasznalo
        ? 2
        : 3;
    candidates.push({
      rank: 3,
      subRank: sub,
      reasonCode: "non_forest_46_3",
      reason:
        "3. ranghely — Földforgalmi tv. 46. § (3) bek.: a település közigazgatási határán belül földhasználó földműves.",
    });
  }

  // 46. § (4) — minden más földműves (utolsó ranghely)
  candidates.push({
    rank: 4,
    subRank: 1,
    reasonCode: "non_forest_46_4",
    reason:
      "4. ranghely — Földforgalmi tv. 46. § (4) bek.: földműves.",
  });

  // Legerősebb: kisebb rank, majd kisebb subRank.
  candidates.sort((a, b) => a.rank - b.rank || a.subRank - b.subRank);
  return candidates[0] ?? null;
}

/**
 * Erdő ág: Evt. szerinti speciális jogok — PLACEHOLDER.
 * A részletes szabálykészlet egy későbbi sprintben kerül modellezésre.
 * Most: ha bármely erdő-jogcímet bejelölt a felhasználó, 4. ranghelyet kap
 * és warning-ot, hogy a hatósági jóváhagyás során a részleteket ellenőrizni kell.
 */
function evaluateForest(
  _notice: NoticeFacts,
  claimant: ClaimantProfile,
  warnings: string[]
): InternalRankCandidate | null {
  warnings.push(
    "Erdő esetén az elővásárlási / előhaszonbérleti jog részletes szabályait az Evt. (2009. évi XXXVII. tv.) tartalmazza. A jelenlegi szabálykészlet csak előzetes tájékoztatást ad — végleges álláspontot az erdészeti hatóság ad."
  );

  const forest = claimant.forest ?? {};
  const hasAny =
    forest.isCommonForestOwner ||
    forest.isAdjacentForestOwner ||
    forest.isForestryProfessional;

  if (!hasAny) {
    return null;
  }

  return {
    rank: 4,
    subRank: 1,
    reasonCode: "forest_external",
    reason:
      "Erdő esetén előzetes ranghely-becslés (Evt. szerint). A pontos rangsort az erdészeti hatóság állapítja meg.",
  };
}

/**
 * Fő belépési pont.
 */
export function computeRank(
  notice: NoticeFacts,
  claimant: ClaimantProfile
): RankResult {
  const warnings: string[] = [];

  // 1. Kizárások — minden ág előtt.
  const exclusion = checkExclusions(claimant);
  if (exclusion.excluded) {
    return buildResult(null, notice.branch, warnings, notice.contractingPartyRank, {
      reasonCode: exclusion.reasonCode,
      reason: exclusion.reason,
    });
  }

  // 2. Ágválasztás — erdő és nem-erdő SZIGORÚAN külön.
  let best: InternalRankCandidate | null = null;
  if (notice.branch === "forest") {
    best = evaluateForest(notice, claimant, warnings);
  } else {
    best = evaluateNonForest(notice, claimant, warnings);
  }

  return buildResult(best, notice.branch, warnings, notice.contractingPartyRank, {
    reasonCode: "no_right_no_match",
    reason:
      "Az Ön által megadott profil alapján a Földforgalmi tv. 46. §-a szerinti elővásárlási / előhaszonbérleti jog nem áll fenn.",
  });
}

/**
 * Segéd: 15 napos jogvesztő határidő számítása a kifüggesztés napjától.
 * A kifüggesztés napját nem számítjuk bele (a tv. szerinti naptári napos szabály).
 */
export function computeAcceptanceDeadline(publicationDate: Date): Date {
  const d = new Date(publicationDate.getTime());
  d.setDate(d.getDate() + 15);
  return d;
}