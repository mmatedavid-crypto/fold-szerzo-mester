/**
 * Két fél (kifüggesztett bérlő vs user) ranghely-eredményeinek összehasonlítása.
 * Új eredmény típusok:
 *  - empty: nincs elég bemenet → ne mutassunk negatív eredményt.
 *  - user_stronger / same_rank / user_weaker: klasszikus.
 *  - lessee_unknown: usernek van rangja, de a bérlő ismeretlen.
 *  - incomplete_special: a user bejelölt erős speciális jogcímet, de hiányos.
 *  - no_valid_user_rank: a user semmilyen érvényes ranghelyet nem ér el.
 *  - exception: tranzakciós kivétel áll fenn.
 *  - no_prelease_right: adásvétel.
 *  - out_of_scope: nem Földforgalmi tv. szerinti föld (pl. kivett terület).
 */

import { evaluateLeaseRanks, type LeaseRankResult, type EvaluatedRank } from "./leaseRankEngine";
import type { LandContext, PartyStatus, TransactionException } from "./leaseTypes";
import { isPartyEmpty } from "./rankPresets";
import type { ProofItem } from "./proofRequirements";

export type ComparisonOutcome =
  | "empty"
  | "user_stronger"
  | "same_rank"
  | "user_weaker"
  | "lessee_unknown"
  | "incomplete_special"
  | "cannot_determine"
  | "no_valid_user_rank"
  | "exception"
  | "no_prelease_right"
  | "out_of_scope";

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
  exceptionsActive: TransactionException[];
}

function lesseeUnknownLike(p: PartyStatus): boolean {
  if (p.unknown_status || p.unknown_base) return true;
  return isPartyEmpty(p);
}

export function compareLeaseRanks(input: {
  landContext: LandContext;
  lesseeStatus: PartyStatus;
  userStatus: PartyStatus;
}): LeaseComparisonResult {
  const { landContext, lesseeStatus, userStatus } = input;

  if (landContext.branch === "out_of_scope") {
    const empty = {
      possibleRanks: [],
      strongestRank: null,
      incompleteRanks: [],
      incompleteSpecialRanks: [],
      warnings: [
        "Kivett terület esetén a Földforgalmi törvény szerinti előhaszonbérleti ranghely nem alkalmazható.",
      ],
      requiredProofs: [],
      excluded: {
        reason: "A kivett terület nem tartozik a Földforgalmi törvény szerinti föld fogalma alá.",
      },
    };
    return {
      user: empty,
      lessee: empty,
      exceptionsActive: [],
      warnings: empty.warnings,
      comparison: "out_of_scope",
      explanation:
        "Kivett terület esetén ez a ranghely kalkulátor nem alkalmazható, mert nem Földforgalmi törvény szerinti mező- vagy erdőgazdasági hasznosítású földről van szó.",
      userStrongestRank: null,
      lesseeStrongestRank: null,
      requiredProofs: [],
      missingConditions: [],
    };
  }

  const lessee = evaluateLeaseRanks({ landContext, partyStatus: lesseeStatus });
  const user = evaluateLeaseRanks({ landContext, partyStatus: userStatus });

  const activeExceptions = (landContext.exceptions ?? []).filter((e) => e !== "unknown");

  const base = {
    user,
    lessee,
    exceptionsActive: activeExceptions,
    warnings: [...user.warnings, ...lessee.warnings],
  };

  // Adásvétel
  if (landContext.transaction === "sale") {
    return {
      ...base,
      comparison: "no_prelease_right",
      explanation:
        "Adásvételi ügyletre a haszonbérleti előhaszonbérleti ranghely nem értelmezhető. Az elővásárlási ranghely külön kalkulátorban készül.",
      userStrongestRank: null,
      lesseeStrongestRank: null,
      requiredProofs: [],
      missingConditions: [],
      warnings: ["Adásvételhez külön kalkulátor használandó."],
    };
  }

  // Tranzakciós kivétel
  if (activeExceptions.length > 0) {
    return {
      ...base,
      comparison: "exception",
      explanation:
        "Az ügylet egy ritkább kivétel hatálya alá eshet, ezért a főszabály szerinti előhaszonbérleti rangsor nem alkalmazható közvetlenül.",
      userStrongestRank: user.strongestRank,
      lesseeStrongestRank: lessee.strongestRank,
      requiredProofs: [],
      missingConditions: [],
      warnings: [...base.warnings, "Kivétel esetén ügyvédi ellenőrzés javasolt."],
    };
  }

  const userEmpty = isPartyEmpty(userStatus);
  const lesseeEmpty = isPartyEmpty(lesseeStatus);

  // Üres állapot: ne legyen negatív eredmény
  if (userEmpty && lesseeEmpty) {
    return {
      ...base,
      comparison: "empty",
      explanation:
        "Pipálj be pár dolgot. Válaszd ki, mi igaz a bérlőre és mi igaz rád. Utána megmutatjuk, ki áll előrébb.",
      userStrongestRank: null,
      lesseeStrongestRank: null,
      requiredProofs: [],
      missingConditions: [],
      warnings: [],
    };
  }

  // Hiányos erős speciális jogcím — usernek nincs érvényes ranghelye, de bejelölt egy speciálisat
  if (!user.strongestRank && user.incompleteSpecialRanks.length > 0) {
    return {
      ...base,
      comparison: "incomplete_special",
      explanation:
        "Bejelöltél egy erős speciális jogcímet, de nem adtál meg minden feltételt hozzá.",
      userStrongestRank: null,
      lesseeStrongestRank: lessee.strongestRank,
      requiredProofs: [],
      missingConditions: user.incompleteSpecialRanks.flatMap((r) => r.missing ?? []),
      warnings: base.warnings,
    };
  }

  // Nincs érvényes user ranghely
  if (!user.strongestRank) {
    if (userEmpty) {
      return {
        ...base,
        comparison: "empty",
        explanation: "Még nincs elég adat rólad. Jelölj be legalább egy jogcímet.",
        userStrongestRank: null,
        lesseeStrongestRank: lessee.strongestRank,
        requiredProofs: [],
        missingConditions: [],
        warnings: [],
      };
    }
    return {
      ...base,
      comparison: "no_valid_user_rank",
      explanation:
        "A bejelölt adatok alapján nem látszik olyan előhaszonbérleti jogcím, amelyre biztonsággal lehetne elfogadó nyilatkozatot alapozni.",
      userStrongestRank: null,
      lesseeStrongestRank: lessee.strongestRank,
      requiredProofs: [],
      missingConditions: user.incompleteRanks.flatMap((r) => r.missing ?? []),
      warnings: base.warnings,
    };
  }

  // A bérlő ismeretlen
  if (
    lesseeUnknownLike(lesseeStatus) ||
    (!lessee.strongestRank && lessee.incompleteRanks.length === 0)
  ) {
    return {
      ...base,
      comparison: "lessee_unknown",
      explanation:
        "A saját legerősebb jogcímedet meg tudjuk mutatni, de a másik fél jogcíme nélkül nem lehet biztos összehasonlítást adni.",
      userStrongestRank: user.strongestRank,
      lesseeStrongestRank: lessee.strongestRank,
      requiredProofs: user.requiredProofs,
      missingConditions: ["A kifüggesztett bérlő jogcíme nem ismert"],
      warnings: base.warnings,
    };
  }

  const lesseeRank = lessee.strongestRank;
  const userRank = user.strongestRank;

  if (!lesseeRank) {
    return {
      ...base,
      comparison: "cannot_determine",
      explanation:
        "A kifüggesztett bérlő státusza nem ad teljes érvényes ranghelyet a megadott adatokból.",
      userStrongestRank: userRank,
      lesseeStrongestRank: null,
      requiredProofs: user.requiredProofs,
      missingConditions: [],
      warnings: base.warnings,
    };
  }

  if (userRank.group < lesseeRank.group) {
    return mk(
      "user_stronger",
      "A megadott adatok alapján erősebb előhaszonbérleti ranghelyed lehet, mint a kifüggesztett bérlőnek.",
      base,
      user,
      userRank,
      lesseeRank,
    );
  }
  if (userRank.group > lesseeRank.group) {
    return mk(
      "user_weaker",
      "A megadott adatok alapján a kifüggesztett bérlő erősebb ranghelyen lehet.",
      base,
      user,
      userRank,
      lesseeRank,
    );
  }
  if (userRank.intraPriority < lesseeRank.intraPriority) {
    return mk(
      "user_stronger",
      "Azonos főcsoporton belül a te csoporton belüli prioritásod (pl. CSMT / ŐCSG / fiatal) erősebb.",
      base,
      user,
      userRank,
      lesseeRank,
    );
  }
  if (userRank.intraPriority > lesseeRank.intraPriority) {
    return mk(
      "user_weaker",
      "Azonos főcsoporton belül a kifüggesztett bérlő intra-csoport prioritása erősebb.",
      base,
      user,
      userRank,
      lesseeRank,
    );
  }
  return mk(
    "same_rank",
    "A megadott adatok alapján azonos ranghelyen állhattok. Ez nem jelenti automatikusan, hogy te lépsz a bérlő helyébe.",
    base,
    user,
    userRank,
    lesseeRank,
  );
}

function mk(
  comparison: ComparisonOutcome,
  explanation: string,
  base: {
    user: LeaseRankResult;
    lessee: LeaseRankResult;
    exceptionsActive: TransactionException[];
    warnings: string[];
  },
  user: LeaseRankResult,
  userRank: EvaluatedRank,
  lesseeRank: EvaluatedRank | null,
): LeaseComparisonResult {
  return {
    ...base,
    comparison,
    explanation,
    userStrongestRank: userRank,
    lesseeStrongestRank: lesseeRank,
    requiredProofs: user.requiredProofs,
    missingConditions: [],
  };
}
