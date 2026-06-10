import * as XLSX from "xlsx";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const USER_AGENT = "DrFold-Price-Extraction/1.0";

type Notice = {
  id: string;
  source: string | null;
  source_notice_id: string | null;
  original_attachment_url: string | null;
  original_detail_url: string | null;
  settlement: string | null;
  county: string | null;
  municipality: string | null;
  publication_date: string | null;
  area_ha: number | null;
  cultivation_branch: string | null;
  normalized_notice_category: string | null;
  notice_type: string | null;
  subject: string | null;
  rent_normalized_huf_per_ha_year: number | null;
  price_normalized_huf_per_ha: number | null;
};

export type ExtractBatchResult = {
  candidates: number;
  downloaded: number;
  extractedTexts: number;
  rentObservations: number;
  saleObservations: number;
  updatedNotices: number;
  errors: { notice: string; message: string }[];
};

export async function extractPriceBatch(limit = 15): Promise<ExtractBatchResult> {
  const summary: ExtractBatchResult = {
    candidates: 0,
    downloaded: 0,
    extractedTexts: 0,
    rentObservations: 0,
    saleObservations: 0,
    updatedNotices: 0,
    errors: [],
  };

  const { data, error } = await supabaseAdmin
    .from("notices")
    .select(
      "id, source, source_notice_id, original_attachment_url, original_detail_url, settlement, county, municipality, publication_date, area_ha, cultivation_branch, normalized_notice_category, notice_type, subject, rent_normalized_huf_per_ha_year, price_normalized_huf_per_ha, last_fetched_at"
    )
    .or("original_attachment_url.not.is.null,original_detail_url.not.is.null")
    .is("rent_normalized_huf_per_ha_year", null)
    .is("price_normalized_huf_per_ha", null)
    .order("last_fetched_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  const notices = (data ?? []) as Notice[];
  summary.candidates = notices.length;

  for (const notice of notices) {
    try {
      const url = notice.original_attachment_url || notice.original_detail_url;
      if (!url) continue;

      const texts: { kind: string; url: string; text: string }[] = [];
      const detailItems = await extractOfficialDetailItems(notice, url, summary);
      texts.push(...detailItems);

      const useful = texts.filter((t) => t.text.trim());
      summary.extractedTexts += useful.length;

      let chosenRent: ReturnType<typeof normalizeRent> | null = null;
      let chosenSale: ReturnType<typeof normalizeSalePrice> | null = null;
      let chosenAreaHa = normalizeArea(notice.area_ha);
      let settlement = notice.settlement;
      let cultivationBranch = notice.cultivation_branch;
      let priceRaw: string | null = null;
      let rentRaw: string | null = null;

      for (const item of useful) {
        const areaHa = chosenAreaHa ?? extractAreaHa(item.text);
        const area = applyOwnershipShare(areaHa, item.text);
        const rent = normalizeRent(item.text, area);
        const sale = normalizeSalePrice(item.text, area);
        if (!chosenAreaHa && area) chosenAreaHa = area;
        if (!settlement) settlement = extractSettlement(item.text);
        if (!cultivationBranch) cultivationBranch = extractCultivationBranch(item.text);
        if (!chosenRent && rent.rentHufPerHaYear) {
          chosenRent = rent;
          rentRaw = rent.rentRaw;
        }
        if (!chosenSale && sale.priceHufPerHa) {
          chosenSale = sale;
          priceRaw = sale.priceRaw;
        }
        if (chosenRent && chosenSale) break;
      }

      const rssCategory = String(
        notice.normalized_notice_category || notice.notice_type || ""
      ).toLowerCase();
      const combinedText = useful.map((t) => t.text).join("\n");
      const detectedType = detectDocumentType(combinedText);
      const effectiveCategory = detectedType ?? rssCategory;

      const patch: Record<string, any> = { last_fetched_at: new Date().toISOString() };
      if (!notice.area_ha && chosenAreaHa) patch.area_ha = chosenAreaHa;
      if (settlement && !notice.settlement) patch.settlement = settlement;
      if (cultivationBranch && !notice.cultivation_branch) patch.cultivation_branch = cultivationBranch;
      if (
        detectedType &&
        notice.normalized_notice_category !== detectedType
      ) {
        patch.normalized_notice_category = detectedType;
      }

      const isLease = effectiveCategory.includes("haszon");
      const isSale =
        effectiveCategory.includes("adas") || effectiveCategory.includes("adás");
      // Strict: when document type is known, only allow the matching field.
      // Unknown: fall back to whichever signal we extracted.
      const wantRent = chosenRent && (isLease || (!isSale && !isLease));
      const wantSale = chosenSale && (isSale || (!isSale && !isLease));

      if (wantRent && chosenRent) {
        patch.rent_raw = rentRaw ?? null;
        patch.rent_normalized_huf_per_ha_year = chosenRent.rentHufPerHaYear;
        patch.rent_unit = chosenRent.rentUnit;
        summary.rentObservations += 1;
      }
      if (wantSale && chosenSale) {
        patch.price_raw = priceRaw ?? null;
        patch.price_total_huf = chosenSale.priceTotalHuf;
        patch.price_normalized_huf_per_ha = chosenSale.priceHufPerHa;
        summary.saleObservations += 1;
      }

      const { error: updErr } = await supabaseAdmin
        .from("notices")
        .update(patch as any)
        .eq("id", notice.id);
      if (updErr) throw new Error(updErr.message);
      if (wantRent || wantSale) summary.updatedNotices += 1;
    } catch (e) {
      summary.errors.push({
        notice: notice.source_notice_id || notice.id,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return summary;
}

async function extractOfficialDetailItems(
  notice: Notice,
  entryUrl: string,
  summary: ExtractBatchResult
) {
  const detailUrl = officialDetailApiUrl(notice, entryUrl);
  if (!detailUrl) return [];
  let detail: any = null;
  try {
    detail = await fetchJson(detailUrl);
  } catch (e) {
    summary.errors.push({
      notice: notice.source_notice_id || notice.id,
      message: `Detail JSON failed: ${e instanceof Error ? e.message : String(e)}`,
    });
    return [];
  }
  if (!detail) return [];

  const items: { kind: string; url: string; text: string }[] = [
    { kind: "official_detail_json", url: detailUrl, text: officialDetailToText(detail) },
  ];

  const attachmentUrls = officialDetailAttachmentUrls(detail, detailUrl);
  for (const aUrl of attachmentUrls) {
    try {
      const a = await downloadAttachment(aUrl);
      summary.downloaded += 1;
      const extracted = await extractAttachment(a);
      if (extracted.text.trim()) items.push(extracted);
    } catch (e) {
      summary.errors.push({
        notice: notice.source_notice_id || notice.id,
        message: `Attachment failed ${aUrl}: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }
  return items;
}

async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Detail HTTP ${res.status}`);
  return res.json();
}

function officialDetailApiUrl(notice: Notice, entryUrl: string) {
  const id =
    String(entryUrl).match(/\/reszletezo\/(\d+)/)?.[1] ||
    (notice.source_notice_id && notice.source_notice_id !== "manual" ? notice.source_notice_id : null) ||
    String(entryUrl).match(/\/(\d+)(?:[/?#]|$)/)?.[1] ||
    null;
  if (!id) return null;
  return `https://hirdetmenyek.gov.hu/api/hirdetmenyek/reszletezo/${id}`;
}

function officialDetailAttachmentUrls(detail: any, detailUrl: string) {
  const attachments = Array.isArray(detail?.csatolmanyok) ? detail.csatolmanyok : [];
  return attachments
    .map((a: any) => a?.id)
    .filter((id: any) => id != null)
    .map((id: any) => new URL(`/api/csatolmany/${id}`, detailUrl).toString())
    .slice(0, 6);
}

async function downloadAttachment(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "*/*" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const contentType = res.headers.get("content-type") || "";
  const filename = decodeURIComponent(url.split("?")[0].split("/").pop() || "attachment");
  const buffer = new Uint8Array(await res.arrayBuffer());
  return { url, contentType, filename, buffer };
}

function detectKind(a: { contentType: string; filename: string; buffer: Uint8Array }) {
  const lower = `${a.contentType} ${a.filename}`.toLowerCase();
  if (lower.includes("spreadsheet") || lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "xlsx";
  const head = String.fromCharCode(...a.buffer.subarray(0, 4));
  if (lower.includes("pdf") || lower.endsWith(".pdf") || head === "%PDF") return "pdf";
  if (lower.includes("html") || lower.endsWith(".html")) return "html";
  if (lower.includes("text") || lower.endsWith(".txt") || lower.endsWith(".csv")) return "text";
  return "unknown";
}

async function extractAttachment(a: { url: string; contentType: string; filename: string; buffer: Uint8Array }) {
  const kind = detectKind(a);
  if (kind === "xlsx") return { kind, url: a.url, text: extractXlsxText(a.buffer) };
  if (kind === "text") return { kind, url: a.url, text: new TextDecoder().decode(a.buffer) };
  if (kind === "html")
    return { kind, url: a.url, text: stripHtml(new TextDecoder().decode(a.buffer)).replace(/\s+/g, " ").trim() };
  // PDF and unknown: skip in Worker runtime (no pdfjs available)
  return { kind, url: a.url, text: "" };
}

function extractXlsxText(buffer: Uint8Array) {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const chunks: string[] = [];
  for (const sheetName of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<any[]>(wb.Sheets[sheetName], { header: 1, defval: "" });
    chunks.push(`Munkalap: ${sheetName}`);
    for (const row of rows) chunks.push(row.map((c) => String(c ?? "")).join(" | "));
  }
  return chunks.join("\n");
}

function officialDetailToText(detail: any) {
  const lines: string[] = [];
  const dto = detail?.hirdetmenyDTO || {};
  const attributes = detail?.attributumok || {};
  pushObjectLines(lines, "hirdetmeny", {
    tipus: detail?.tipus,
    altipus: detail?.altipus,
    ugyiratszam: dto.ugyiratszam,
    iktatasiszam: dto.iktatasiszam,
    targy: dto.targy,
    kifuggesztesNapja: dto.kifuggesztesNapja,
    lejaratNapja: dto.lejaratNapja,
    kifuggesztesHelye: dto.kifuggesztesHelye,
    forrasIntezmenyNeve: dto.forrasIntezmenyNeve,
    torzsSzoveg: stripHtml(dto.torzsSzoveg),
  });
  pushObjectLines(lines, "foldreszlet", attributes);
  return lines.join("\n");
}

function pushObjectLines(lines: string[], prefix: string, obj: Record<string, unknown>) {
  for (const [k, v] of Object.entries(obj || {})) {
    if (v == null || v === "") continue;
    lines.push(`${prefix}.${k}: ${stripHtml(String(v))}`);
  }
}

function stripHtml(html: unknown) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function normalizeRent(text: string, areaHa: number | null) {
  const perHa = text.match(/([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\s*\/\s*ha\s*\/?\s*(év|ev)?/i);
  if (perHa) {
    const value = parseHungarianNumber(perHa[1]);
    if (value) {
      return {
        rentRaw: perHa[0],
        rentTotalHufYear: areaHa ? Math.round(value * areaHa) : null,
        rentHufPerHaYear: Math.round(value),
        rentUnit: "Ft/ha/év" as const,
      };
    }
  }
  const labeled = text.match(
    /(haszonb[ée]rleti díj|haszonberleti dij|b[ée]rleti díj|berleti dij|haszonb[ée]r|haszonber)\d*[^\d]{0,80}([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\s*\/?\s*(év|ev)?/i
  );
  const total = labeled ? parseHungarianNumber(labeled[2]) : null;
  if (total && areaHa) {
    return {
      rentRaw: labeled![0],
      rentTotalHufYear: Math.round(total),
      rentHufPerHaYear: Math.round(total / areaHa),
      rentUnit: "Ft/év" as const,
    };
  }
  return { rentRaw: null, rentTotalHufYear: null, rentHufPerHaYear: null, rentUnit: "unknown" as const };
}

function normalizeSalePrice(text: string, areaHa: number | null) {
  const perHa = text.match(/([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\s*\/\s*ha\b/i);
  if (perHa) {
    const value = parseHungarianNumber(perHa[1]);
    if (value) {
      return {
        priceRaw: perHa[0],
        priceTotalHuf: areaHa ? Math.round(value * areaHa) : null,
        priceHufPerHa: Math.round(value),
      };
    }
  }
  const labeled = text.match(
    /(v[ée]tel[áa]r|vetelar|elad[áa]si [áa]r|eladasi ar|szerz[őo]d[ée]ses [áa]r|szerzodeses ar|kik[öo]t[öo]tt [áa]r|kikotott ar)\d*[^\d]{0,100}([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\b/i
  );
  const total = labeled ? parseHungarianNumber(labeled[2]) : null;
  if (total && areaHa) {
    return {
      priceRaw: labeled![0],
      priceTotalHuf: Math.round(total),
      priceHufPerHa: Math.round(total / areaHa),
    };
  }
  return { priceRaw: null, priceTotalHuf: null, priceHufPerHa: null };
}

function detectDocumentType(text: string): "haszonberlet" | "adasvetel" | null {
  if (!text) return null;
  const t = text.toLowerCase();
  const leaseHits =
    (t.match(/haszonb[ée]rleti szerz[őo]d[ée]s/g)?.length ?? 0) * 3 +
    (t.match(/f[öo]ldhaszonb[ée]rlet/g)?.length ?? 0) * 3 +
    (t.match(/haszonb[ée]rleti d[íi]j/g)?.length ?? 0) * 2 +
    (t.match(/haszonb[ée]rbead[óo]/g)?.length ?? 0) * 2 +
    (t.match(/haszonb[ée]rl[őo]/g)?.length ?? 0) * 1 +
    (t.match(/haszonb[ée]r(?:let)?(?:re|[ée]re)/g)?.length ?? 0) * 1;
  const saleHits =
    (t.match(/ad[áa]sv[ée]teli szerz[őo]d[ée]s/g)?.length ?? 0) * 3 +
    (t.match(/v[ée]tel[áa]r/g)?.length ?? 0) * 3 +
    (t.match(/el[őo]v[áa]s[áa]rl[áa]si/g)?.length ?? 0) * 2 +
    (t.match(/\belad[óo]\b/g)?.length ?? 0) * 1 +
    (t.match(/\bvev[őo]\b/g)?.length ?? 0) * 1;
  if (leaseHits === 0 && saleHits === 0) return null;
  if (leaseHits >= saleHits + 2) return "haszonberlet";
  if (saleHits >= leaseHits + 2) return "adasvetel";
  return null;
}

function extractAreaHa(text: string) {
  const ha = text.match(/([0-9][0-9.,\s]*)\s*(ha|hektár|hektar)\b/i);
  if (ha) return parseHungarianNumber(ha[1]);
  const m2 = text.match(/([0-9][0-9.,\s]*)\s*(m2|m²|négyzetméter|negyzetmeter)\b/i);
  if (m2) {
    const v = parseHungarianNumber(m2[1]);
    return v ? Math.round((v / 10000) * 10000) / 10000 : null;
  }
  return null;
}

function normalizeArea(v: number | string | null) {
  if (typeof v === "number" && v > 0) return v;
  if (typeof v === "string") return extractAreaHa(v);
  return null;
}

function applyOwnershipShare(areaHa: number | null, text: string) {
  if (!areaHa) return areaHa;
  const m =
    text.match(/foldreszlet\.tulhanyad\d*:\s*(\d+)\s*\/\s*(\d+)/i) ||
    text.match(/tulajdoni h[áa]nyad\d*:\s*(\d+)\s*\/\s*(\d+)/i) ||
    text.match(/tulhanyad\d*:\s*(\d+)\s*\/\s*(\d+)/i);
  if (!m) return areaHa;
  const n = Number(m[1]);
  const d = Number(m[2]);
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0 || n / d >= 1) return areaHa;
  return Math.round(areaHa * (n / d) * 10000) / 10000;
}

function extractSettlement(text: string) {
  return (
    text.match(/foldreszlet\.telepules\d*:\s*([^\n]+)/i)?.[1]?.trim() ||
    text.match(/telep[üu]l[ée]s\d*:\s*([^\n]+)/i)?.[1]?.trim() ||
    null
  );
}

function extractCultivationBranch(text: string) {
  return (
    text.match(/foldreszlet\.muvelesi_ag\d*:\s*([^\n]+)/i)?.[1]?.trim() ||
    text.match(/m[űu]vel[ée]si [áa]g\d*:\s*([^\n]+)/i)?.[1]?.trim() ||
    null
  );
}

function parseHungarianNumber(input: string | number | null | undefined) {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (!input) return null;
  const compact = String(input)
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