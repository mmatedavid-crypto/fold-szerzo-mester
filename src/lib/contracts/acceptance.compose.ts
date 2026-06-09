import {
  ACCEPTANCE_STATEMENT_REQUIREMENTS,
  ACCEPTANCE_STATEMENT_VERSION,
  LEGAL_RULESET_VERSION,
  legalSourcesSummary,
} from "@/lib/legal/ruleset";
import { companyLegalDisclaimer, companyLegalLine } from "@/lib/company";

export type AcceptanceInput = {
  noticeId?: string;
  contractSubject?: string;
  noticePublicationDate?: string;
  deadlineDate?: string;
  claimantName?: string;
  claimantBirthName?: string;
  claimantBirthPlace?: string;
  claimantBirthDate?: string;
  claimantMotherName?: string;
  claimantAddress?: string;
  claimantTaxId?: string;
  claimantRegistryNumber?: string;
  claimantRepresentative?: string;
  rankBasis?: string;
  rankOrder?: string;
  rankLegalRef?: string;
  specialPurposeDeclaration?: string;
  attachedProofs?: string[];
  submissionPlace?: string;
  submittedAt?: string;
  signaturePlace?: string;
  signatureDate?: string;
  witnesses?: { name?: string; address?: string }[];
};

export type AcceptanceComposition = {
  title: string;
  sections: { title: string; text: string }[];
  version: string;
  warnings: string[];
};

function value(v: string | undefined, fallback = "____________________"): string {
  return v?.trim() ? v.trim() : fallback;
}

function list(items: string[] | undefined, fallback = "____________________"): string {
  return (items?.length ? items : [fallback])
    .map((item, index) => `${index + 1}. ${item}`)
    .join("\n");
}

function hasWitnessBlock(input: AcceptanceInput): boolean {
  return Boolean(
    input.witnesses?.length === 2 &&
    input.witnesses.every((witness) => witness.name?.trim() && witness.address?.trim()),
  );
}

export function composeAcceptanceStatement(input: AcceptanceInput): AcceptanceComposition {
  const warnings: string[] = [];
  if (!input.noticeId && !input.contractSubject) {
    warnings.push("A kifüggesztett szerződés / hirdetmény azonosítása hiányzik.");
  }
  if (!input.noticePublicationDate || !input.deadlineDate) {
    warnings.push(
      "A közzététel napja és a 15 napos jogvesztő határidő utolsó napja nincs teljesen megadva.",
    );
  }
  if (!input.claimantName || !input.claimantAddress) {
    warnings.push("Az előhaszonbérletre jogosult azonosító adatai hiányosak.");
  }
  if (
    !input.claimantRegistryNumber &&
    (!input.claimantBirthPlace || !input.claimantBirthDate || !input.claimantMotherName)
  ) {
    warnings.push(
      "Természetes személy esetén a születési hely/idő és az anyja neve hiányozhat; szervezet esetén a nyilvántartási szám és képviselő ellenőrzendő.",
    );
  }
  if (!input.rankBasis || !input.rankLegalRef) {
    warnings.push("Az előhaszonbérleti jogalap és törvényi hivatkozás nincs teljesen megadva.");
  }
  if (!input.rankOrder) {
    warnings.push("A törvény szerinti sorrendben elfoglalt ranghely nincs külön megjelölve.");
  }
  if (!input.attachedProofs?.length) {
    warnings.push("A jogalapot bizonyító okiratok listája hiányzik.");
  }
  if (!input.submittedAt || !input.submissionPlace) {
    warnings.push("A benyújtás helye és időpontja nincs teljesen megadva.");
  }
  if (!input.signaturePlace || !input.signatureDate || !hasWitnessBlock(input)) {
    warnings.push(
      "A teljes bizonyító erejű magánokirati forma nincs lezárva: aláírási hely/dátum és két tanú adatai szükségesek, ha nem ügyvédi ellenjegyzéssel vagy hiteles elektronikus aláírással készül.",
    );
  }

  return {
    title: "ELFOGADÓ JOGNYILATKOZAT ELŐHASZONBÉRLETI JOG GYAKORLÁSÁHOZ",
    version: `${ACCEPTANCE_STATEMENT_VERSION} / ${LEGAL_RULESET_VERSION}`,
    warnings,
    sections: [
      {
        title: "1. A kifüggesztett haszonbérleti szerződés azonosítása",
        text: [
          `A nyilatkozattevő a ${value(input.noticeId, "____________________ azonosítójú")} kifüggesztéshez kapcsolódó haszonbérleti szerződés vonatkozásában teszi meg elfogadó jognyilatkozatát.`,
          "",
          `Szerződés / hirdetmény tárgya: ${value(input.contractSubject)}.`,
          `Közzététel / közlés kezdő napja: ${value(input.noticePublicationDate)}.`,
          `A nyilatkozattétel jogvesztő határidejének utolsó napja: ${value(input.deadlineDate)}.`,
        ].join("\n"),
      },
      {
        title: "2. Nyilatkozattevő adatai",
        text: [
          `Név / megnevezés: ${value(input.claimantName)}`,
          `Születési név: ${value(input.claimantBirthName)}`,
          `Születési hely, idő: ${value(input.claimantBirthPlace)}; ${value(input.claimantBirthDate)}`,
          `Anyja neve: ${value(input.claimantMotherName)}`,
          `Lakcím / székhely: ${value(input.claimantAddress)}`,
          `Adóazonosító / adószám: ${value(input.claimantTaxId)}`,
          `Nyilvántartási szám / cégjegyzékszám: ${value(input.claimantRegistryNumber)}`,
          `Képviselő neve és minősége: ${value(input.claimantRepresentative)}`,
        ].join("\n"),
      },
      {
        title: "3. Elfogadó jognyilatkozat",
        text: [
          "A nyilatkozattevő kijelenti, hogy a kifüggesztett haszonbérleti szerződést magára nézve teljes körűen, teljes terjedelmében és az abban foglalt valamennyi feltétellel elfogadja.",
          "A nyilatkozattevő előhaszonbérleti jogát gyakorolni kívánja, és a szerződésbe a kifüggesztett szerződés feltételei szerint kíván belépni.",
        ].join("\n\n"),
      },
      {
        title: "4. Előhaszonbérleti jogalap és ranghely",
        text: [
          `Megjelölt jogalap: ${value(input.rankBasis)}`,
          `Törvény szerinti sorrend / ranghely: ${value(input.rankOrder)}`,
          `Törvényi hivatkozás: ${value(input.rankLegalRef, "Földforgalmi tv. 45–49. § szerinti jogalap pontosítása szükséges")}.`,
          `Külön célhoz kötött joggyakorlás, ha alkalmazandó: ${value(input.specialPurposeDeclaration, "nem alkalmazandó / külön ellenőrzést igényel")}.`,
          "",
          "A nyilatkozattevő tudomásul veszi, hogy az előhaszonbérleti jogosultság jogalapját, törvényen alapuló jog esetén a törvényt és az ott meghatározott sorrend szerinti ranghelyet a jognyilatkozatban meg kell jelölni.",
        ].join("\n"),
      },
      {
        title: "5. Csatolt igazolások",
        text: [
          "A nyilatkozattevő az előhaszonbérleti jogosultságát alátámasztó okiratokat a jognyilatkozathoz csatolja.",
          "",
          list(input.attachedProofs),
        ].join("\n"),
      },
      {
        title: "6. Határidő és benyújtás",
        text: [
          "A nyilatkozattevő kijelenti, hogy az elfogadó jognyilatkozatot a haszonbérleti szerződés közlésének kezdő napjától számított 15 napos jogvesztő határidőn belül teszi meg.",
          "",
          `Benyújtás helye / címzettje: ${value(input.submissionPlace, "a föld fekvése szerint illetékes jegyző / polgármesteri hivatal pontosítása szükséges")}.`,
          `Benyújtás időpontja: ${value(input.submittedAt)}.`,
        ].join("\n"),
      },
      {
        title: "7. Záró nyilatkozatok",
        text: [
          "A nyilatkozattevő kijelenti, hogy a nyilatkozatban szereplő adatok és a csatolt igazolások a valóságnak megfelelnek.",
          "A nyilatkozattevő tudomásul veszi, hogy a hatóság az elfogadó jognyilatkozat alaki és tartalmi feltételeit, a jogalapot, a ranghelyet, a határidőt és a csatolt igazolásokat vizsgálhatja.",
          "A dokumentumot legalább teljes bizonyító erejű magánokiratként kell aláírni, vagy más, jogszabály által elfogadott hiteles okirati formában kell benyújtani.",
        ].join("\n\n"),
      },
      {
        title: "8. Keltezés, aláírás és tanúk",
        text: [
          `Kelt: ${value(input.signaturePlace)}, ${value(input.signatureDate)}`,
          "",
          "Nyilatkozattevő aláírása:",
          "",
          "________________________________",
          value(input.claimantName, "név"),
          "",
          "Tanúk, ha a dokumentum nem saját kezűleg írt és aláírt okiratként, nem ügyvédi ellenjegyzéssel, nem közjegyzői/bírói hitelesítéssel és nem hiteles elektronikus okiratként készül:",
          "",
          `1. tanú neve: ${value(input.witnesses?.[0]?.name)}`,
          `1. tanú lakcíme / tartózkodási helye: ${value(input.witnesses?.[0]?.address)}`,
          "1. tanú aláírása: ________________________________",
          "",
          `2. tanú neve: ${value(input.witnesses?.[1]?.name)}`,
          `2. tanú lakcíme / tartózkodási helye: ${value(input.witnesses?.[1]?.address)}`,
          "2. tanú aláírása: ________________________________",
        ].join("\n"),
      },
      {
        title: "9. Jogszabályi alap",
        text: [
          `Nyilatkozatverzió: ${ACCEPTANCE_STATEMENT_VERSION}`,
          `Ruleset verzió: ${LEGAL_RULESET_VERSION}`,
          "",
          "Kötelező ellenőrzési pontok:",
          ...ACCEPTANCE_STATEMENT_REQUIREMENTS.map(
            (req) => `- ${req.label}: ${req.legalRefs.join("; ")}`,
          ),
          "",
          "Felhasznált jogszabályi források:",
          legalSourcesSummary(),
          "",
          companyLegalDisclaimer,
          companyLegalLine,
        ].join("\n"),
      },
    ],
  };
}
