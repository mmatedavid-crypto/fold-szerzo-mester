import { parseAreaHa, parseHungarianNumber } from "./rent-normalizer";

export type NormalizedSalePriceObservation = {
  areaHa: number | null;
  priceRaw: string | null;
  priceTotalHuf: number | null;
  priceHufPerHa: number | null;
  priceUnit: "Ft/ha" | "Ft" | "unknown";
  confidence: number;
  warnings: string[];
};

export function normalizeSalePrice(
  priceRaw: string | null | undefined,
  areaHaInput?: number | string | null,
): NormalizedSalePriceObservation {
  const areaHa = parseAreaHa(areaHaInput ?? null);
  const raw = priceRaw?.trim() || null;

  if (!raw) return empty(areaHa, ["Nincs vételár szöveg."]);

  const text = raw.toLowerCase().replace(/\u00a0/g, " ");
  const warnings: string[] = [];

  const perHa = text.match(/([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\s*\/\s*ha\b/i);
  if (perHa) {
    const value = parseHungarianNumber(perHa[1]);
    if (value != null) {
      return {
        areaHa,
        priceRaw: raw,
        priceTotalHuf: areaHa ? Math.round(value * areaHa) : null,
        priceHufPerHa: Math.round(value),
        priceUnit: "Ft/ha",
        confidence: 0.92,
        warnings,
      };
    }
  }

  const labeledTotal = text.match(
    /(vételár|vetelar|eladási ár|eladasi ar|ár|ar)[^\d]{0,40}([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\b/i,
  );
  const bareTotal = text.match(/([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\b/i);
  const candidate = labeledTotal?.[2] ?? bareTotal?.[1] ?? null;

  if (candidate) {
    const total = parseHungarianNumber(candidate);
    if (total != null) {
      if (areaHa && areaHa > 0) {
        if (!labeledTotal)
          warnings.push("A szöveg Ft összeget tartalmaz, de a vételár címke nem egyértelmű.");
        return {
          areaHa,
          priceRaw: raw,
          priceTotalHuf: Math.round(total),
          priceHufPerHa: Math.round(total / areaHa),
          priceUnit: "Ft",
          confidence: labeledTotal ? 0.82 : 0.55,
          warnings,
        };
      }
      return {
        areaHa,
        priceRaw: raw,
        priceTotalHuf: Math.round(total),
        priceHufPerHa: null,
        priceUnit: "Ft",
        confidence: labeledTotal ? 0.65 : 0.45,
        warnings: ["Vételár van, de nincs terület; Ft/ha nem számolható."],
      };
    }
  }

  return empty(areaHa, ["Nem sikerült biztonságosan vételárat kinyerni a szövegből."], raw);
}

export function extractSalePriceObservationFromText(text: string): NormalizedSalePriceObservation {
  const area =
    text.match(/([0-9][0-9.,\s]*)\s*(ha|hektár|hektar)\b/i)?.[0] ??
    text.match(/([0-9][0-9.,\s]*)\s*(m2|m²|négyzetméter|negyzetmeter)\b/i)?.[0] ??
    null;
  const price =
    text.match(
      /(vételár|vetelar|eladási ár|eladasi ar|ár|ar)[^\d]{0,40}([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\b/i,
    )?.[0] ??
    text.match(/([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\s*\/\s*ha\b/i)?.[0] ??
    null;

  return normalizeSalePrice(price, area);
}

function empty(
  areaHa: number | null,
  warnings: string[],
  priceRaw: string | null = null,
): NormalizedSalePriceObservation {
  return {
    areaHa,
    priceRaw,
    priceTotalHuf: null,
    priceHufPerHa: null,
    priceUnit: "unknown",
    confidence: 0.2,
    warnings,
  };
}
