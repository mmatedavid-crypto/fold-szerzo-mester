import {
  ACCEPTANCE_STATEMENT_REQUIREMENTS,
  ACCEPTANCE_STATEMENT_VERSION,
  LEGAL_RULESET_VERSION,
  legalSourcesSummary,
} from "@/lib/legal/ruleset";

export type AcceptanceInput = {
  noticeId?: string;
  contractSubject?: string;
  claimantName?: string;
  claimantAddress?: string;
  claimantTaxId?: string;
  rankBasis?: string;
  rankLegalRef?: string;
  attachedProofs?: string[];
  submittedAt?: string;
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

export function composeAcceptanceStatement(input: AcceptanceInput): AcceptanceComposition {
  const warnings: string[] = [];
  if (!input.noticeId && !input.contractSubject) {
    warnings.push("A kifüggesztett szerződés / hirdetmény azonosítása hiányzik.");
  }
  if (!input.claimantName || !input.claimantAddress) {
    warnings.push("Az előhaszonbérletre jogosult azonosító adatai hiányosak.");
  }
  if (!input.rankBasis || !input.rankLegalRef) {
    warnings.push("Az előhaszonbérleti jogalap és törvényi hivatkozás nincs teljesen megadva.");
  }
  if (!input.attachedProofs?.length) {
    warnings.push("A jogalapot bizonyító okiratok listája hiányzik.");
  }

  return {
    title: "ELFOGADÓ JOGNYILATKOZAT ELŐHASZONBÉRLETI JOG GYAKORLÁSÁHOZ",
    version: `${ACCEPTANCE_STATEMENT_VERSION} / ${LEGAL_RULESET_VERSION}`,
    warnings,
    sections: [
      {
        title: "1. A kifüggesztett szerződés azonosítása",
        text: `A nyilatkozattevő a ${value(input.noticeId, "____________________ azonosítójú")} kifüggesztéshez kapcsolódó haszonbérleti szerződés vonatkozásában teszi meg elfogadó jognyilatkozatát.\n\nSzerződés / hirdetmény tárgya: ${value(input.contractSubject)}.`,
      },
      {
        title: "2. Nyilatkozattevő adatai",
        text: `Név: ${value(input.claimantName)}\nLakcím / székhely: ${value(input.claimantAddress)}\nAdóazonosító / adószám: ${value(input.claimantTaxId)}.`,
      },
      {
        title: "3. Elfogadó jognyilatkozat",
        text: "A nyilatkozattevő kijelenti, hogy a kifüggesztett haszonbérleti szerződést teljes terjedelmében, az abban foglalt feltételekkel elfogadja, és előhaszonbérleti jogát gyakorolni kívánja.",
      },
      {
        title: "4. Előhaszonbérleti jogalap és ranghely",
        text: `Megjelölt jogalap / ranghely: ${value(input.rankBasis)}\nTörvényi hivatkozás: ${value(input.rankLegalRef, "Földforgalmi tv. 46–49. § szerinti jogalap pontosítása szükséges")}.\n\nA nyilatkozattevő tudomásul veszi, hogy a jogalapot és ranghelyet bizonyító okiratokat csatolni kell, és a hatóság az elfogadó jognyilatkozat érvényességi és hatályosulási feltételeit vizsgálja.`,
      },
      {
        title: "5. Csatolt igazolások",
        text: (input.attachedProofs?.length ? input.attachedProofs : ["____________________"])
          .map((proof, index) => `${index + 1}. ${proof}`)
          .join("\n"),
      },
      {
        title: "6. Jogszabályi alap",
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
          "A Dr Föld dokumentumgeneráló és döntéstámogató szolgáltatás, nem ügyvédi iroda. Egyedi, vitás vagy nagy értékű ügyben ügyvédi ellenőrzés javasolt.",
        ].join("\n"),
      },
    ],
  };
}
