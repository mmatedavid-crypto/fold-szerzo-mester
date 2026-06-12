/**
 * Placeholder-detektor.
 * Blokkolja az aláírható exportot, ha tipikus üres/TODO/„később pontosítandó" jellegű
 * mintát talál a draft adataiban vagy a kompilált szerződés-szövegben.
 */

import type { Draft } from "@/lib/contracts/types";

export interface PlaceholderHit {
  field: string;
  pattern: string;
  message: string;
}

const TEXT_PATTERNS: { re: RegExp; message: string }[] = [
  { re: /\[\.\.\.\]|\[…\]/i, message: "[...] vagy [...] minta a szövegben." },
  { re: /(^|\s)…(\s|$)/, message: "Üres … (három pont) jel a szövegben." },
  { re: /\bTODO\b/i, message: "TODO maradt a szövegben." },
  { re: /\bFIXME\b/i, message: "FIXME maradt a szövegben." },
  { re: /megegyez[eé]s\s+szerint/i, message: '"Megegyezés szerint" típusú kitöltetlen rész.' },
  { re: /k[eé]s[őo]bb\s+pontos[ií]tand[oó]/i, message: '"Később pontosítandó" maradt a szövegben.' },
  { re: /xxxx|XXXX/, message: "XXXX maszk maradt a szövegben." },
  { re: /_{6,}/, message: "Üres aláhúzott placeholder maradt." },
];

export function detectPlaceholdersInText(text: string, fieldName = "text"): PlaceholderHit[] {
  const out: PlaceholderHit[] = [];
  for (const { re, message } of TEXT_PATTERNS) {
    if (re.test(text)) out.push({ field: fieldName, pattern: re.source, message });
  }
  return out;
}

function emptyDate(v?: string): boolean {
  return !v || !/^\d{4}-\d{2}-\d{2}$/.test(v);
}

function emptyNumber(v?: number | null): boolean {
  return v == null || !Number.isFinite(v) || v <= 0;
}

function emptyStr(v?: string | null): boolean {
  return !v || v.trim().length === 0;
}

/** A draft kritikus szám/dátum/szöveg mezőit nézi. Két tanú külön a stop-rule-ban. */
export function detectPlaceholdersInDraft(draft: Draft): PlaceholderHit[] {
  const hits: PlaceholderHit[] = [];
  const t = draft.term ?? {};
  if (emptyDate(t.start_date))
    hits.push({ field: "term.start_date", pattern: "empty_date", message: "Üres kezdő dátum." });
  if (emptyDate(t.end_date))
    hits.push({ field: "term.end_date", pattern: "empty_date", message: "Üres befejező dátum." });

  const r = draft.rent ?? {};
  if (r.model && r.model !== "termeny" && r.model !== "vegyes" && r.model !== "egyedi") {
    if (emptyNumber(r.amount))
      hits.push({ field: "rent.amount", pattern: "empty_amount", message: "Üres haszonbér-összeg." });
  }
  if (r.model === "termeny") {
    if (emptyStr(r.crop_type))
      hits.push({ field: "rent.crop_type", pattern: "empty_str", message: "Üres termény-megjelölés." });
    if (emptyNumber(r.kg_per_ak) && emptyNumber(r.amount))
      hits.push({
        field: "rent.kg_per_ak",
        pattern: "empty_qty",
        message: "Természetbeni haszonbér pontos mennyisége hiányzik.",
      });
  }

  for (const [i, p] of (draft.parcels ?? []).entries()) {
    if (emptyStr(p.parcel_number))
      hits.push({
        field: `parcels[${i}].parcel_number`,
        pattern: "empty_hrsz",
        message: `${i + 1}. parcella: üres helyrajzi szám.`,
      });
    if (emptyNumber(p.area_ha) && emptyNumber(p.area_m2))
      hits.push({
        field: `parcels[${i}].area`,
        pattern: "empty_area",
        message: `${i + 1}. parcella: üres terület.`,
      });
    if (r.model === "ft_ak_ev" && emptyNumber(p.aranykorona))
      hits.push({
        field: `parcels[${i}].aranykorona`,
        pattern: "empty_ak",
        message: `${i + 1}. parcella: üres aranykorona (Ft/AK/év modellnél kötelező).`,
      });
  }
  return hits;
}