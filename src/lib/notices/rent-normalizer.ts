export type RentUnit = "Ft/ha/év" | "Ft/év" | "Ft/AK/év" | "kg/AK/év" | "termény" | "unknown";

export type NormalizedRentObservation = {
  areaHa: number | null;
  rentRaw: string | null;
  rentTotalHufYear: number | null;
  rentHufPerHaYear: number | null;
  rentHufPerAkYear: number | null;
  rentUnit: RentUnit;
  confidence: number;
  warnings: string[];
};

export function parseHungarianNumber(input: string | number | null | undefined): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (!input) return null;

  const compact = input
    .replace(/\u00a0/g, " ")
    .replace(/[^\d,.\s-]/g, "")
    .replace(/\s/g, "")
    .replace(/^-/, "")
    .replace(/[,\-.]+$/g, "");

  if (!compact) return null;

  const hasCommaDecimal = /,\d{1,4}$/.test(compact);
  const normalized = hasCommaDecimal
    ? compact.replace(/\./g, "").replace(",", ".")
    : compact.replace(/[.,](?=\d{3}(\D|$))/g, "").replace(",", ".");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseAreaHa(raw: string | number | null | undefined): number | null {
  if (typeof raw === "number") return raw > 0 ? raw : null;
  if (!raw) return null;

  const text = raw.toLowerCase().replace(/\u00a0/g, " ");
  const ha = text.match(/([0-9][0-9.,\s]*)\s*(ha|hektár|hektar)\b/i);
  if (ha) return parseHungarianNumber(ha[1]);

  const m2 = text.match(/([0-9][0-9.,\s]*)\s*(m2|m²|négyzetméter|negyzetmeter)\b/i);
  if (m2) {
    const value = parseHungarianNumber(m2[1]);
    return value != null ? round(value / 10000, 4) : null;
  }

  const plain = parseHungarianNumber(text);
  return plain && plain > 0 && plain < 100000 ? plain : null;
}

export function normalizeRent(
  rentRaw: string | null | undefined,
  areaHaInput?: number | string | null,
): NormalizedRentObservation {
  const warnings: string[] = [];
  const areaHa = parseAreaHa(areaHaInput ?? null);
  const raw = rentRaw?.trim() || null;

  if (!raw) {
    return empty(areaHa, ["Nincs haszonbérleti díj szöveg."]);
  }

  const text = raw.toLowerCase().replace(/\u00a0/g, " ");

  if (/(termény|búza|buza|árpa|arpa|kukorica|kg\s*\/\s*ak)/i.test(text)) {
    const kgAk = text.match(/([0-9][0-9.,\s]*)\s*kg\s*\/\s*ak/i);
    return {
      areaHa,
      rentRaw: raw,
      rentTotalHufYear: null,
      rentHufPerHaYear: null,
      rentHufPerAkYear: null,
      rentUnit: kgAk ? "kg/AK/év" : "termény",
      confidence: 0.45,
      warnings: ["Terménybérlet vagy kg/AK díj; nem keverhető Ft/ha/év statisztikába."],
    };
  }

  const perHa = text.match(/([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\s*\/\s*ha\s*\/?\s*(év|ev)?/i);
  if (perHa) {
    const value = parseHungarianNumber(perHa[1]);
    if (value != null) {
      return {
        areaHa,
        rentRaw: raw,
        rentTotalHufYear: areaHa ? Math.round(value * areaHa) : null,
        rentHufPerHaYear: Math.round(value),
        rentHufPerAkYear: null,
        rentUnit: "Ft/ha/év",
        confidence: 0.92,
        warnings,
      };
    }
  }

  const perAk = text.match(/([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\s*\/\s*ak\s*\/?\s*(év|ev)?/i);
  if (perAk) {
    const value = parseHungarianNumber(perAk[1]);
    if (value != null) {
      return {
        areaHa,
        rentRaw: raw,
        rentTotalHufYear: null,
        rentHufPerHaYear: null,
        rentHufPerAkYear: Math.round(value),
        rentUnit: "Ft/AK/év",
        confidence: 0.75,
        warnings: ["Ft/AK/év díj; Ft/ha/év értékhez AK-adat is szükséges."],
      };
    }
  }

  const yearly = text.match(/([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\s*\/\s*(év|ev)\b/i);
  if (yearly) {
    const total = parseHungarianNumber(yearly[1]);
    if (total != null) {
      if (areaHa && areaHa > 0) {
        return {
          areaHa,
          rentRaw: raw,
          rentTotalHufYear: Math.round(total),
          rentHufPerHaYear: Math.round(total / areaHa),
          rentHufPerAkYear: null,
          rentUnit: "Ft/év",
          confidence: 0.82,
          warnings,
        };
      }
      warnings.push("Éves összeg van, de nincs terület; Ft/ha/év nem számolható.");
      return {
        areaHa,
        rentRaw: raw,
        rentTotalHufYear: Math.round(total),
        rentHufPerHaYear: null,
        rentHufPerAkYear: null,
        rentUnit: "Ft/év",
        confidence: 0.62,
        warnings,
      };
    }
  }

  const bareHuf = text.match(/([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\b/i);
  if (bareHuf) {
    const total = parseHungarianNumber(bareHuf[1]);
    if (total != null && areaHa && areaHa > 0) {
      warnings.push(
        "A szöveg Ft összeget tartalmaz, de az időegység nem egyértelmű; éves díjként kezelve.",
      );
      return {
        areaHa,
        rentRaw: raw,
        rentTotalHufYear: Math.round(total),
        rentHufPerHaYear: Math.round(total / areaHa),
        rentHufPerAkYear: null,
        rentUnit: "Ft/év",
        confidence: 0.55,
        warnings,
      };
    }
  }

  return empty(areaHa, ["Nem sikerült biztonságosan díjat kinyerni a szövegből."], raw);
}

export function extractRentObservationFromText(text: string): NormalizedRentObservation {
  const area = extractAreaCandidate(text);
  const rent = extractRentCandidate(text);
  return normalizeRent(rent, area);
}

function extractAreaCandidate(text: string): string | null {
  return (
    text.match(/([0-9][0-9.,\s]*)\s*(ha|hektár|hektar)\b/i)?.[0] ??
    text.match(/([0-9][0-9.,\s]*)\s*(m2|m²|négyzetméter|negyzetmeter)\b/i)?.[0] ??
    null
  );
}

function extractRentCandidate(text: string): string | null {
  return (
    text.match(/([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\s*\/\s*ha\s*\/?\s*(év|ev)?/i)?.[0] ??
    text.match(/([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\s*\/\s*ak\s*\/?\s*(év|ev)?/i)?.[0] ??
    text.match(/([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\s*\/\s*(év|ev)\b/i)?.[0] ??
    text.match(/([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\b/i)?.[0] ??
    null
  );
}

function empty(
  areaHa: number | null,
  warnings: string[],
  rentRaw: string | null = null,
): NormalizedRentObservation {
  return {
    areaHa,
    rentRaw,
    rentTotalHufYear: null,
    rentHufPerHaYear: null,
    rentHufPerAkYear: null,
    rentUnit: "unknown",
    confidence: 0.2,
    warnings,
  };
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
