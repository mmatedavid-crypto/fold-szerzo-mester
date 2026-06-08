import * as XLSX from "xlsx";
import { normalizeRent, parseAreaHa } from "./rent-normalizer";
import { normalizeSalePrice } from "./sale-price-normalizer";

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
  price_raw: string | null;
  price_total_huf: number | null;
  price_normalized_huf_per_ha: number | null;
  deadline_date: string | null; // YYYY-MM-DD
  notice_type: string;
};

function parseHrsz(
  subject: string,
  settlementHint?: string,
): { settlement: string | null; parcels: string[] } {
  // "Gyomaendrőd hrsz.: 02124/31" or "Dörgicse hrsz.: 0197/2 területen belül a 0197/2/C terület"
  const m = subject.match(/^([^h]+?)\s*hrsz\.?:?\s*(.+)$/i);
  let settlement = settlementHint?.trim() ?? null;
  let tail = subject;
  if (m) {
    settlement = settlement ?? m[1].trim();
    tail = m[2];
  }
  const parcels = Array.from(tail.matchAll(/(\d+\/?\d*\/?[A-Z]?)/g))
    .map((x) => x[1])
    .filter((p) => /\d/.test(p));
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

function cellText(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

export function parseNoticesXlsx(buffer: ArrayBuffer): ParsedNotice[] {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const out: ParsedNotice[] = [];
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      blankrows: false,
      defval: null,
    });
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
    const col = (...names: string[]) =>
      headers.findIndex((h) => {
        const header = h.toLowerCase();
        return names.some((name) => header.includes(name.toLowerCase()));
      });
    const cAzon = col("Azonosító");
    const cHat = col("határidő");
    const cOnk = col("Illetékes");
    const cTargy = col("tárgya");
    const cTel = col("Település");
    const cBer = col("Haszonbér", "Bérleti díj", "Bérleti díj / év");
    const cAr = col("Vételár", "Vetelar", "Eladási ár", "Eladasi ar", "Ajánlati ár");
    const cTer = col("Terület");
    const cMuv = col("Művelési");
    const cCsat = col("csatolmány");

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const r = rows[i];
      const azon = r[cAzon];
      if (!azon || typeof azon !== "string") continue;
      const subject = cellText(r[cTargy]) ?? "";
      const settlementHint = cellText(r[cTel]) ?? "";
      const { settlement, parcels } = parseHrsz(subject, settlementHint);
      const areaRaw = cellText(r[cTer]);
      const areaHa = areaRaw ? parseAreaHa(areaRaw) : null;
      const rentRaw = cellText(r[cBer]);
      const normalizedRent = normalizeRent(rentRaw, areaHa);
      const priceRaw = cellText(r[cAr]);
      const normalizedSalePrice = normalizeSalePrice(priceRaw, areaHa);
      const url = cellText(r[cCsat]);
      const attachmentId = url ? (url.match(/\/(\d+)\/?$/)?.[1] ?? null) : null;
      out.push({
        source_notice_id: azon.trim(),
        source_attachment_id: attachmentId,
        original_attachment_url: url,
        municipality: cellText(r[cOnk]),
        subject,
        settlement,
        parcel_numbers: parcels,
        area_raw: areaRaw,
        area_ha: areaHa,
        cultivation_branch: cellText(r[cMuv]),
        rent_raw: rentRaw,
        rent_normalized_huf_per_ha_year: normalizedRent.rentHufPerHaYear,
        price_raw: priceRaw,
        price_total_huf: normalizedSalePrice.priceTotalHuf,
        price_normalized_huf_per_ha: normalizedSalePrice.priceHufPerHa,
        deadline_date: toIsoDate(r[cHat]),
        notice_type: priceRaw ? "adasvetel" : "haszonberlet",
      });
    }
  }
  return out;
}
