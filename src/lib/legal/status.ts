/**
 * Státusz-enum és tiltott címkék.
 * AI nem dönthet "jogilag hibátlan" / "approved" státuszt — típusszinten kizárva.
 */

export const DRAFT_STATUSES = [
  "HIANYOS_TERVEZET",
  "SPECIALIS_UGY_STOP",
  "JEGYZOI_KOZZETETELRE_VAR",
  "HATOSAGI_JOVAHAGYASRA_VAR",
  "ALAIHATONAK_TUNO_TERVEZET",
] as const;

export type DraftStatus = (typeof DRAFT_STATUSES)[number];

/** Soha nem használható címkék — futás közben is védjük. */
export const FORBIDDEN_STATUS_LABELS = [
  "JOGILAG_HIBATLAN",
  "LEGAL_FINAL_BY_AI",
  "AI_APPROVED",
  "JOGILAG_GARANTALT",
  "UGYVEDET_HELYETTESITI",
] as const;

export function assertAllowedStatus(s: string): asserts s is DraftStatus {
  if ((FORBIDDEN_STATUS_LABELS as readonly string[]).includes(s)) {
    throw new Error(`Tiltott státusz-címke: ${s}`);
  }
  if (!(DRAFT_STATUSES as readonly string[]).includes(s)) {
    throw new Error(`Ismeretlen draft státusz: ${s}`);
  }
}

export const STATUS_LABEL: Record<DraftStatus, string> = {
  HIANYOS_TERVEZET: "Hiányos tervezet",
  SPECIALIS_UGY_STOP: "Speciális ügy — ügyvédi közreműködés szükséges",
  JEGYZOI_KOZZETETELRE_VAR: "Jegyzői közzétételre vár",
  HATOSAGI_JOVAHAGYASRA_VAR: "Hatósági jóváhagyásra vár",
  ALAIHATONAK_TUNO_TERVEZET: "Aláírhatónak tűnő tervezet",
};

export function isBlockingStatus(s: DraftStatus): boolean {
  return s === "HIANYOS_TERVEZET" || s === "SPECIALIS_UGY_STOP";
}

export function needsWatermark(s: DraftStatus): boolean {
  return s === "HIANYOS_TERVEZET" || s === "SPECIALIS_UGY_STOP";
}

export const WATERMARK_TEXT = "HIÁNYOS TERVEZET – NEM ALÁÍRHATÓ";