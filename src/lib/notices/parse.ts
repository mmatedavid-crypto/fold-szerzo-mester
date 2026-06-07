import * as XLSX from "xlsx";

export type ParsedNotice = {
  source_notice_id: string;
  source_attachment_id: string | null;
  original_attachment_url: string | null;
  municipality: string | null;
  subject: string | null;
  settlement: string | null;
  parcel_numbers: string[];
  area_raw: string | null;
  area_ha: number | null;
  cultivation_branch: string | null;
  rent_raw: string | null;
  rent_normalized_huf_per_ha_year: number | null;
  deadline_date: string | null; // YYYY-MM-DD
  notice_type: string;
};

function toNumberHU(s: string): number | null {
  // "150.000,-" / "120.960" / "1,6050" — HU: . = thousand sep, , = decimal
  const cleaned = s.replace(/\s/g, "").replace(/Ft.*$/i, "").replace(/,-$/, "");
  // Try HU decimal first
  if (/,\d+$/.test(cleaned)) {
    const n = Number(cleaned.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(cleaned.replace(/\./g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseArea(raw: string): number | null {
  if (!raw) return null;
  const s = raw.replace(/\s/g, "").toLowerCase();
  const haMatch = s.match(/([0-9.,]+)ha/);
  if (haMatch) {
    const n = Number(haMatch[1].replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  const m2Match = s.match(/([0-9.,]+)m2/);
  if (m2Match) {
    const n = Number(m2Match[1].replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n / 10000 : null;
  }
  return null;
}

function parseRentPerHaPerYear(raw: string, areaHa: number | null): number | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s.includes("szerz") || s.includes("csatolm")) return null;
  // "150.000,-Ft/ha/év"
  const perHa = raw.match(/([0-9.,]+)\s*,?-?\s*ft\s*\/\s*ha/i);
  if (perHa) return toNumberHU(perHa[1]);
  // "120.960.- Ft/év" → total per year, divide by area
  const perYear = raw.match(/([0-9.,]+)\s*\.?-?\s*ft\s*\/\s*év/i);
  if (perYear) {
    const total = toNumberHU(perYear[1]);
    if (total != null && areaHa && areaHa > 0) return Math.round(total / areaHa);
  }
  return null;
}

function parseHrsz(subject: string, settlementHint?: string): { settlement: string | null; parcels: string[] } {
  // "Gyomaendrőd hrsz.: 02124/31" or "Dörgicse hrsz.: 0197/2 területen belül a 0197/2/C terület"
  const m = subject.match(/^([^h]+?)\s*hrsz\.?:?\s*(.+)$/i);
  let settlement = settlementHint?.trim() ?? null;
  let tail = subject;
  if (m) {
    settlement = settlement ?? m[1].trim();
    tail = m[2];
  }
  const parcels = Array.from(tail.matchAll(/(\d+\/?\d*\/?[A-Z]?)/g)).map((x) => x[1]).filter((p) => /\d/.test(p));
  return { settlement, parcels };
}

function toIsoDate(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  if (typeof v === "string") {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}

export function parseNoticesXlsx(buffer: ArrayBuffer): ParsedNotice[] {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const out: ParsedNotice[] = [];
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: null });
    // find header row (contains "Azonosító szám")
    let headerIdx = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].some((c) => typeof c === "string" && c.includes("Azonosító szám"))) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx < 0) continue;
    const headers = rows[headerIdx].map((h) => (typeof h === "string" ? h.trim() : ""));
    const col = (name: string) => headers.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()));
    const cAzon = col("Azonosító");
    const cHat = col("határidő");
    const cOnk = col("Illetékes");
    const cTargy = col("tárgya");
    const cTel = col("Település");
    const cBer = col("Haszonbér");
    const cTer = col("Terület");
    const cMuv = col("Művelési");
    const cCsat = col("csatolmány");

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const r = rows[i];
      const azon = r[cAzon];
      if (!azon || typeof azon !== "string") continue;
      const subject = (r[cTargy] as string) ?? "";
      const settlementHint = (r[cTel] as string) ?? "";
      const { settlement, parcels } = parseHrsz(subject, settlementHint);
      const areaRaw = r[cTer] != null ? String(r[cTer]) : null;
      const areaHa = areaRaw ? parseArea(areaRaw) : null;
      const rentRaw = r[cBer] != null ? String(r[cBer]) : null;
      const url = (r[cCsat] as string) ?? null;
      const attachmentId = url ? (url.match(/\/(\d+)\/?$/)?.[1] ?? null) : null;
      out.push({
        source_notice_id: azon.trim(),
        source_attachment_id: attachmentId,
        original_attachment_url: url,
        municipality: (r[cOnk] as string) ?? null,
        subject,
        settlement,
        parcel_numbers: parcels,
        area_raw: areaRaw,
        area_ha: areaHa,
        cultivation_branch: (r[cMuv] as string) ?? null,
        rent_raw: rentRaw,
        rent_normalized_huf_per_ha_year: rentRaw ? parseRentPerHaPerYear(rentRaw, areaHa) : null,
        deadline_date: toIsoDate(r[cHat]),
        notice_type: "haszonberlet",
      });
    }
  }
  return out;
}