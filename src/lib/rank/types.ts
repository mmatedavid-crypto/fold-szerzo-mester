/**
 * Ranghely-kalkulátor típusai.
 *
 * Modellezi a 2013. évi CXXII. tv. (Földforgalmi tv.) 46. §-a szerinti
 * elővásárlási / előhaszonbérleti jogokat NEM-erdő földek esetén,
 * és külön ágon az Evt. (2009. évi XXXVII. tv.) szerinti erdő-jogokat.
 *
 * FONTOS: a jogok nem adódnak össze. Egy igénylő egy adott hirdetményhez
 * mindig pontosan EGY (a legerősebb) ranghelyet kap, vagy `null`-t, ha
 * nincs joga / kizárt eset.
 */

export type LandBranch = "forest" | "non_forest";

export type TransactionKind = "sale" | "lease";

/** A kifüggesztés releváns adatai (a teljes Notice-ból leszűrt halmaz). */
export interface NoticeFacts {
  /** Föld besorolása. Erdő → külön szabályrendszer. */
  branch: LandBranch;
  /** Adásvétel vagy haszonbérlet. */
  transaction: TransactionKind;
  /** A föld fekvése (település). */
  settlement: string;
  /** A szerződő fél deklarált ranghelye (ha ismert) — 46. § (1)-(4). */
  contractingPartyRank?: number | null;
  /** Speciális ági kizárások (pl. szőlő-ültetvény) — placeholder. */
  cultivationBranchTags?: string[];
}

/** A jogosultság-igénylő ("claimant") deklarált profilja. */
export interface ClaimantProfile {
  /** Földműves nyilvántartásban szerepel-e (2013. évi CXXII. tv. 5. § 7. pont). */
  isFoldmuves: boolean;

  /** Helyben lakó-e (a föld fekvése szerinti településen életvitelszerűen lakik). */
  isHelybenLako: boolean;

  /** Helybeli illetőségű földműves (helyben lakó + földműves). Számolt mező — engine is rászámol. */

  /** Szomszédos földhasználó az adott parcellán (haszonbérlőként vagy földhasználóként). */
  isSzomszedosFoldhasznalo: boolean;

  /** Az adott földön jelenleg földhasználó / haszonbérlő (most birtokol). */
  isJelenlegiFoldhasznalo: boolean;

  /** Az adott településen földhasználó (más parcellán). */
  isTelepulesiFoldhasznalo: boolean;

  /** Állattartó telepet üzemeltet (46. § (1) c) — rét/legelő preferencia). */
  isAllattarto: boolean;

  /** Családi mezőgazdasági társaság vagy őstermelő családi gazdaság tag. */
  isCsaladiGazdasagTag: boolean;

  /** A szerződő féllel közeli hozzátartozó (Ptk. 8:1. § (1) 1. pont). */
  isCloseRelativeOfSeller: boolean;

  /** Magyar Állam vagy önkormányzat / egyházi jogi személy (különleges kizárások). */
  isExemptEntity: boolean;

  /** Erdő esetén az Evt. szerinti speciális jogcímek deklarálása. */
  forest?: {
    isCommonForestOwner?: boolean;
    isAdjacentForestOwner?: boolean;
    isForestryProfessional?: boolean;
  };
}

export type RankReasonCode =
  | "non_forest_46_1_a"
  | "non_forest_46_1_b"
  | "non_forest_46_1_c"
  | "non_forest_46_2"
  | "non_forest_46_3"
  | "non_forest_46_4"
  | "forest_external"
  | "no_right_close_relative"
  | "no_right_exempt_entity"
  | "no_right_no_match";

export interface RankResult {
  /** A legerősebb ranghely (1 = legerősebb), vagy null, ha nincs jog. */
  rank: number | null;
  /** Melyik ágon futott a szabály. */
  branch: LandBranch;
  /** Strukturált indoklás-kód (jogszabályi hivatkozás). */
  reasonCode: RankReasonCode;
  /** Emberi olvasású indoklás magyarul (jogszabályi hivatkozással). */
  reason: string;
  /** Figyelmeztetések (placeholder szabályok, hiányzó input, stb.). */
  warnings: string[];
  /** Erősebb-e mint a szerződő fél ranghelye. null, ha nem összehasonlítható. */
  strongerThanContractingParty: boolean | null;
  /** A használt szabálykészlet verziója. */
  rulesVersion: string;
}