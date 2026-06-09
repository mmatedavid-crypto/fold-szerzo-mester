#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { loadEnvFile } from "node:process";

if (existsSync(".env")) loadEnvFile(".env");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LIMIT = Number(process.env.PRICE_EXTRACT_LIMIT || 200);
const DRY_RUN = process.env.DRY_RUN === "1" || process.argv.includes("--dry-run");
const SUPABASE_READ_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || (DRY_RUN ? SUPABASE_READ_KEY : null);
const ONLY_NOTICE_ID = process.env.NOTICE_ID || null;
const ONLY_URL = process.env.ATTACHMENT_URL || null;
const PDF_TEXT_COMMAND = process.env.PDF_TEXT_COMMAND || null;
const DIRECT_OBSERVATIONS = process.env.DIRECT_OBSERVATIONS === "1";
const USER_AGENT = "DrFold-Price-Extraction/1.0";

if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Use DRY_RUN=1 to inspect only.",
  );
  process.exit(1);
}

const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

async function main() {
  const notices = ONLY_URL ? [manualNotice(ONLY_URL)] : await loadCandidateNotices();
  const summary = {
    candidates: notices.length,
    downloaded: 0,
    extracted: 0,
    rentObservations: 0,
    saleObservations: 0,
    updatedNotices: 0,
    skipped: 0,
    errors: [],
  };

  for (const notice of notices) {
    try {
      const url = notice.original_attachment_url || notice.original_detail_url;
      if (!url) {
        summary.skipped += 1;
        continue;
      }

      const detailItems = await extractOfficialDetailItems(notice, url, summary);
      let extractedItems = detailItems;
      if (!extractedItems.length) {
        const entryAttachment = await downloadAttachment(url);
        summary.downloaded += 1;
        extractedItems = await extractAttachmentTree(entryAttachment, summary);
      }
      const usefulItems = extractedItems.filter((item) => item.text.trim());
      if (!usefulItems.length) {
        summary.skipped += 1;
        continue;
      }
      summary.extracted += usefulItems.length;

      const observations = mergeObservationSets(
        usefulItems.map((item) => buildObservations(notice, item.text, item.url)),
      );
      summary.rentObservations += observations.rent.length;
      summary.saleObservations += observations.sale.length;

      if (!DRY_RUN) {
        const updated = await updateNoticePriceFields(notice, observations);
        if (updated) summary.updatedNotices += 1;
        if (DIRECT_OBSERVATIONS) {
          await upsertRentObservations(observations.rent);
          await upsertSaleObservations(observations.sale);
        }
      } else {
        console.log(
          JSON.stringify(
            {
              notice: notice.source_notice_id || notice.id,
              url,
              extracted: usefulItems.map((item) => ({
                kind: item.kind,
                url: item.url,
                textLength: item.text.length,
              })),
              rent: observations.rent.map((o) => pickObservationLog(o, "rent_huf_per_ha_year")),
              sale: observations.sale.map((o) => pickObservationLog(o, "price_huf_per_ha")),
            },
            null,
            2,
          ),
        );
      }
    } catch (error) {
      summary.errors.push({
        notice: notice.source_notice_id || notice.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(
    JSON.stringify({ ok: summary.errors.length === 0, dryRun: DRY_RUN, ...summary }, null, 2),
  );
}

async function loadCandidateNotices() {
  if (!supabase) {
    console.error("Missing Supabase credentials. Set ATTACHMENT_URL for DRY_RUN without DB.");
    process.exit(1);
  }

  let query = supabase
    .from("notices")
    .select(
      "id, source, source_notice_id, original_attachment_url, original_detail_url, settlement, county, municipality, publication_date, area_ha, cultivation_branch, normalized_notice_category, notice_type, subject",
    )
    .or("original_attachment_url.not.is.null,original_detail_url.not.is.null")
    .order("publication_date", { ascending: false, nullsFirst: false })
    .limit(LIMIT);

  if (ONLY_NOTICE_ID) query = query.eq("id", ONLY_NOTICE_ID);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

function manualNotice(url) {
  return {
    id: "manual",
    source: "manual",
    source_notice_id: "manual",
    original_attachment_url: url,
    original_detail_url: null,
    settlement: null,
    county: null,
    municipality: null,
    publication_date: null,
    area_ha: null,
    cultivation_branch: null,
    normalized_notice_category: null,
    notice_type: null,
    subject: null,
  };
}

async function downloadAttachment(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "*/*" } });
  if (!res.ok) throw new Error(`Attachment HTTP ${res.status}`);
  const contentType = res.headers.get("content-type") || "";
  const filename = decodeURIComponent(url.split("?")[0].split("/").pop() || "attachment");
  const buffer = Buffer.from(await res.arrayBuffer());
  return { url, contentType, filename, buffer };
}

async function extractOfficialDetailItems(notice, entryUrl, summary) {
  const detailUrl = officialDetailApiUrl(notice, entryUrl);
  if (!detailUrl) return [];

  const detail = await fetchJson(detailUrl);
  if (!detail) return [];

  const items = [
    {
      kind: "official_detail_json",
      url: detailUrl,
      text: officialDetailToText(detail),
    },
  ];

  const attachmentUrls = officialDetailAttachmentUrls(detail, detailUrl);
  for (const attachmentUrl of attachmentUrls) {
    try {
      const attachment = await downloadAttachment(attachmentUrl);
      summary.downloaded += 1;
      const extracted = await extractAttachment(attachment);
      if (extracted.text.trim()) items.push(extracted);
    } catch (error) {
      summary.errors.push({
        notice: notice.source_notice_id || notice.id,
        message: `Official attachment failed: ${attachmentUrl}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }

  return items;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Detail API HTTP ${res.status}`);
  return res.json();
}

function officialDetailApiUrl(notice, entryUrl) {
  const id =
    String(entryUrl).match(/\/reszletezo\/(\d+)/)?.[1] ||
    (notice.source_notice_id && notice.source_notice_id !== "manual"
      ? notice.source_notice_id
      : null) ||
    String(entryUrl).match(/\/(\d+)(?:[/?#]|$)/)?.[1] ||
    null;
  if (!id) return null;
  return `https://hirdetmenyek.gov.hu/api/hirdetmenyek/reszletezo/${id}`;
}

function officialDetailAttachmentUrls(detail, detailUrl) {
  const attachments = Array.isArray(detail?.csatolmanyok) ? detail.csatolmanyok : [];
  return attachments
    .map((attachment) => attachment?.id)
    .filter((id) => id != null)
    .map((id) => new URL(`/api/csatolmany/${id}`, detailUrl).toString())
    .slice(0, 8);
}

function officialDetailToText(detail) {
  const lines = [];
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

function pushObjectLines(lines, prefix, obj) {
  for (const [key, value] of Object.entries(obj || {})) {
    if (value == null || value === "") continue;
    lines.push(`${prefix}.${key}: ${stripHtml(String(value))}`);
  }
}

async function extractAttachment(attachment) {
  const kind = detectAttachmentKind(attachment);
  if (kind === "xlsx")
    return { kind, url: attachment.url, text: extractXlsxText(attachment.buffer) };
  if (kind === "text")
    return { kind, url: attachment.url, text: attachment.buffer.toString("utf8") };
  if (kind === "html")
    return { kind, url: attachment.url, text: htmlToText(attachment.buffer.toString("utf8")) };
  if (kind === "pdf")
    return { kind, url: attachment.url, text: await extractPdfText(attachment.buffer) };
  return { kind, url: attachment.url, text: "" };
}

async function extractAttachmentTree(entryAttachment, summary) {
  const entry = await extractAttachment(entryAttachment);
  if (entry.kind !== "html") return [entry];

  const html = entryAttachment.buffer.toString("utf8");
  const links = extractDocumentLinks(html, entryAttachment.url);
  const linked = [];
  for (const link of links) {
    try {
      const attachment = await downloadAttachment(link);
      summary.downloaded += 1;
      const extracted = await extractAttachment(attachment);
      if (extracted.kind !== "html") linked.push(extracted);
    } catch (error) {
      summary.errors.push({
        notice: entryAttachment.url,
        message: `Linked attachment failed: ${link}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }

  return linked.length ? linked : [entry];
}

function detectAttachmentKind({ contentType, filename, buffer }) {
  const lower = `${contentType} ${filename}`.toLowerCase();
  if (lower.includes("spreadsheet") || lower.endsWith(".xlsx") || lower.endsWith(".xls"))
    return "xlsx";
  if (
    lower.includes("pdf") ||
    lower.endsWith(".pdf") ||
    buffer.subarray(0, 4).toString() === "%PDF"
  )
    return "pdf";
  if (lower.includes("html") || lower.endsWith(".html")) return "html";
  if (lower.includes("text") || lower.endsWith(".txt") || lower.endsWith(".csv")) return "text";
  return "unknown";
}

function extractXlsxText(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const chunks = [];
  for (const sheetName of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: "" });
    chunks.push(`Munkalap: ${sheetName}`);
    for (const row of rows) chunks.push(row.map((cell) => String(cell ?? "")).join(" | "));
  }
  return chunks.join("\n");
}

async function extractPdfText(buffer) {
  if (PDF_TEXT_COMMAND) return extractPdfTextWithCommand(buffer, PDF_TEXT_COMMAND);

  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const data = new Uint8Array(buffer);
    const pdf = await pdfjs.getDocument({ data, useWorkerFetch: false, isEvalSupported: false })
      .promise;
    const pages = [];
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
    }
    return pages.join("\n");
  } catch (error) {
    throw new Error(
      `PDF text extraction unavailable. Install pdfjs-dist or set PDF_TEXT_COMMAND=pdftotext. ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function extractPdfTextWithCommand(buffer, command) {
  const dir = await mkdtemp(join(tmpdir(), "drfold-pdf-"));
  const pdfPath = join(dir, "input.pdf");
  try {
    await writeFile(pdfPath, buffer);
    return await new Promise((resolve, reject) => {
      const child = spawn(command, [pdfPath, "-"], { stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => (stdout += chunk));
      child.stderr.on("data", (chunk) => (stderr += chunk));
      child.on("close", (code) => {
        if (code === 0) resolve(stdout);
        else reject(new Error(`${command} exited ${code}: ${stderr}`));
      });
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function htmlToText(html) {
  return stripHtml(html).replace(/\s+/g, " ").trim();
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function extractDocumentLinks(html, baseUrl) {
  const links = new Set();
  const attrPattern = /\b(?:href|src)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(attrPattern)) {
    const raw = match[1];
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:"))
      continue;
    let resolved;
    try {
      resolved = new URL(raw, baseUrl).toString();
    } catch {
      continue;
    }
    if (resolved === baseUrl) continue;
    if (isLikelyDocumentUrl(resolved)) links.add(resolved);
  }
  return [...links].slice(0, 12);
}

function isLikelyDocumentUrl(url) {
  const lower = decodeURIComponent(url).toLowerCase();
  return (
    /\.(pdf|xlsx?|csv)(?:[?#]|$)/i.test(lower) ||
    /csatol|mellek|mellék|dokument|letolt|letölt|download|file|attachment/.test(lower)
  );
}

function mergeObservationSets(sets) {
  return {
    rent: sets.flatMap((set) => set.rent),
    sale: sets.flatMap((set) => set.sale),
  };
}

function buildObservations(notice, text, sourceAttachmentUrl) {
  const baseAreaHa = normalizeArea(notice.area_ha) ?? extractAreaHa(text);
  const areaHa = applyOwnershipShare(baseAreaHa, text);
  const rent = normalizeRent(text, areaHa);
  const sale = normalizeSalePrice(text, areaHa);
  const settlement = notice.settlement || extractSettlement(text);
  const cultivationBranch = notice.cultivation_branch || extractCultivationBranch(text);
  const category = String(
    notice.normalized_notice_category || notice.notice_type || "",
  ).toLowerCase();

  const rentObservations =
    rent.rentHufPerHaYear && (category.includes("haszon") || !sale.priceHufPerHa)
      ? [
          {
            notice_id: notice.id === "manual" ? null : notice.id,
            source: notice.source || "hirdetmenyek.gov.hu",
            source_notice_id: notice.source_notice_id,
            settlement,
            settlement_clean: cleanSettlement(settlement),
            county:
              notice.county || inferCounty(`${notice.municipality || ""} ${settlement || ""}`),
            municipality: notice.municipality,
            publication_date: notice.publication_date,
            area_ha: areaHa,
            cultivation_branch: cultivationBranch,
            rent_raw: rent.rentRaw || excerptAroundPrice(text),
            rent_total_huf_year: rent.rentTotalHufYear,
            rent_huf_per_ha_year: rent.rentHufPerHaYear,
            rent_huf_per_ak_year: rent.rentHufPerAkYear,
            rent_unit: rent.rentUnit,
            confidence: rent.confidence,
            extraction_method: "attachment_text",
            source_attachment_url: sourceAttachmentUrl,
            raw_text_excerpt: excerptAroundPrice(text),
            parse_version: "attachment-price-extractor-2026-06-08",
          },
        ]
      : [];

  const saleObservations =
    sale.priceHufPerHa &&
    (category.includes("adas") || category.includes("adás") || !rent.rentHufPerHaYear)
      ? [
          {
            notice_id: notice.id === "manual" ? null : notice.id,
            source: notice.source || "hirdetmenyek.gov.hu",
            source_notice_id: notice.source_notice_id,
            settlement,
            settlement_clean: cleanSettlement(settlement),
            county:
              notice.county || inferCounty(`${notice.municipality || ""} ${settlement || ""}`),
            municipality: notice.municipality,
            publication_date: notice.publication_date,
            area_ha: areaHa,
            cultivation_branch: cultivationBranch,
            price_raw: sale.priceRaw || excerptAroundPrice(text),
            price_total_huf: sale.priceTotalHuf,
            price_huf_per_ha: sale.priceHufPerHa,
            price_unit: sale.priceUnit,
            confidence: sale.confidence,
            extraction_method: "attachment_text",
            source_attachment_url: sourceAttachmentUrl,
            raw_text_excerpt: excerptAroundPrice(text),
            parse_version: "attachment-price-extractor-2026-06-08",
          },
        ]
      : [];

  return { rent: rentObservations, sale: saleObservations };
}

async function upsertRentObservations(rows) {
  if (!rows.length) return;
  const { error } = await supabase
    .from("notice_rent_observations")
    .upsert(rows, { onConflict: "notice_id,extraction_method" });
  if (error) throw new Error(error.message);
}

async function upsertSaleObservations(rows) {
  if (!rows.length) return;
  const { error } = await supabase
    .from("notice_sale_price_observations")
    .upsert(rows, { onConflict: "notice_id,extraction_method" });
  if (error) throw new Error(error.message);
}

async function updateNoticePriceFields(notice, observations) {
  if (notice.id === "manual") return false;
  const rent = observations.rent[0] || null;
  const sale = observations.sale[0] || null;
  if (!rent && !sale) return false;

  const patch = {
    last_fetched_at: new Date().toISOString(),
  };

  if (!notice.area_ha && (rent?.area_ha || sale?.area_ha)) {
    patch.area_ha = rent?.area_ha || sale?.area_ha;
  }

  const sourceRow = rent || sale;
  if (sourceRow?.settlement && !notice.settlement) {
    patch.settlement = sourceRow.settlement;
  }
  if (sourceRow?.county && !notice.county) {
    patch.county = sourceRow.county;
  }
  if (sourceRow?.cultivation_branch && !notice.cultivation_branch) {
    patch.cultivation_branch = sourceRow.cultivation_branch;
  }

  if (rent) {
    patch.rent_raw = rent.rent_raw;
    patch.rent_normalized_huf_per_ha_year = rent.rent_huf_per_ha_year;
    patch.rent_unit = rent.rent_unit;
  }

  if (sale) {
    patch.price_raw = sale.price_raw;
    patch.price_total_huf = sale.price_total_huf;
    patch.price_normalized_huf_per_ha = sale.price_huf_per_ha;
  }

  const { error } = await supabase.from("notices").update(patch).eq("id", notice.id);
  if (error) throw new Error(error.message);
  return true;
}

function normalizeRent(text, areaHa) {
  if (/(termény|búza|buza|árpa|arpa|kukorica|kg\s*\/\s*ak)/i.test(text)) {
    return {
      rentRaw: excerptAroundPrice(text),
      rentTotalHufYear: null,
      rentHufPerHaYear: null,
      rentHufPerAkYear: null,
      rentUnit: /kg\s*\/\s*ak/i.test(text) ? "kg/AK/év" : "termény",
      confidence: 0.4,
    };
  }

  const perHa = text.match(/([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\s*\/\s*ha\s*\/?\s*(év|ev)?/i);
  if (perHa) {
    const value = parseHungarianNumber(perHa[1]);
    if (value) {
      return {
        rentRaw: perHa[0],
        rentTotalHufYear: areaHa ? Math.round(value * areaHa) : null,
        rentHufPerHaYear: Math.round(value),
        rentHufPerAkYear: null,
        rentUnit: "Ft/ha/év",
        confidence: 0.9,
      };
    }
  }

  const perAk = text.match(/([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\s*\/\s*ak\s*\/?\s*(év|ev)?/i);
  if (perAk) {
    const value = parseHungarianNumber(perAk[1]);
    if (value) {
      return {
        rentRaw: perAk[0],
        rentTotalHufYear: null,
        rentHufPerHaYear: null,
        rentHufPerAkYear: Math.round(value),
        rentUnit: "Ft/AK/év",
        confidence: 0.72,
      };
    }
  }

  const rentLabeled = text.match(
    /(haszonb[ée]rleti díj|haszonberleti dij|b[ée]rleti díj|berleti dij|haszonb[ée]r|haszonber|b[ée]rleti d[ií]j)\d*[^\d]{0,80}([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\s*\/?\s*(év|ev)?/i,
  );
  const total = rentLabeled ? parseHungarianNumber(rentLabeled[2]) : null;
  if (total && areaHa) {
    return {
      rentRaw: rentLabeled[0],
      rentTotalHufYear: Math.round(total),
      rentHufPerHaYear: Math.round(total / areaHa),
      rentHufPerAkYear: null,
      rentUnit: "Ft/év",
      confidence: 0.78,
    };
  }

  return {
    rentRaw: null,
    rentTotalHufYear: null,
    rentHufPerHaYear: null,
    rentHufPerAkYear: null,
    rentUnit: "unknown",
    confidence: 0.2,
  };
}

function normalizeSalePrice(text, areaHa) {
  const perHa = text.match(/([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\s*\/\s*ha\b/i);
  if (perHa) {
    const value = parseHungarianNumber(perHa[1]);
    if (value) {
      return {
        priceRaw: perHa[0],
        priceTotalHuf: areaHa ? Math.round(value * areaHa) : null,
        priceHufPerHa: Math.round(value),
        priceUnit: "Ft/ha",
        confidence: 0.9,
      };
    }
  }

  const labeledTotal = text.match(
    /(v[ée]tel[áa]r|vetelar|elad[áa]si [áa]r|eladasi ar|szerz[őo]d[ée]ses [áa]r|szerzodeses ar|kik[öo]t[öo]tt [áa]r|kikotott ar)\d*[^\d]{0,100}([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft\b/i,
  );
  const total = labeledTotal ? parseHungarianNumber(labeledTotal[2]) : null;
  if (total && areaHa) {
    return {
      priceRaw: labeledTotal[0],
      priceTotalHuf: Math.round(total),
      priceHufPerHa: Math.round(total / areaHa),
      priceUnit: "Ft",
      confidence: 0.82,
    };
  }

  return {
    priceRaw: null,
    priceTotalHuf: total ? Math.round(total) : null,
    priceHufPerHa: null,
    priceUnit: "unknown",
    confidence: 0.2,
  };
}

function extractAreaHa(text) {
  const ha = text.match(/([0-9][0-9.,\s]*)\s*(ha|hektár|hektar)\b/i);
  if (ha) return parseHungarianNumber(ha[1]);
  const m2 = text.match(/([0-9][0-9.,\s]*)\s*(m2|m²|négyzetméter|negyzetmeter)\b/i);
  if (m2) {
    const value = parseHungarianNumber(m2[1]);
    return value ? Math.round((value / 10000) * 10000) / 10000 : null;
  }
  return null;
}

function normalizeArea(value) {
  if (typeof value === "number" && value > 0) return value;
  if (typeof value === "string") return extractAreaHa(value);
  return null;
}

function applyOwnershipShare(areaHa, text) {
  if (!areaHa) return areaHa;
  const share = extractOwnershipShare(text);
  if (!share || share <= 0 || share >= 1) return areaHa;
  return Math.round(areaHa * share * 10000) / 10000;
}

function extractOwnershipShare(text) {
  const match =
    text.match(/foldreszlet\.tulhanyad\d*:\s*(\d+)\s*\/\s*(\d+)/i) ||
    text.match(/tulajdoni h[áa]nyad\d*:\s*(\d+)\s*\/\s*(\d+)/i) ||
    text.match(/tulhanyad\d*:\s*(\d+)\s*\/\s*(\d+)/i);
  if (!match) return null;
  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return numerator / denominator;
}

function extractSettlement(text) {
  return (
    text.match(/foldreszlet\.telepules\d*:\s*([^\n]+)/i)?.[1]?.trim() ||
    text.match(/telep[üu]l[ée]s\d*:\s*([^\n]+)/i)?.[1]?.trim() ||
    null
  );
}

function extractCultivationBranch(text) {
  return (
    text.match(/foldreszlet\.muvelesi_ag\d*:\s*([^\n]+)/i)?.[1]?.trim() ||
    text.match(/m[űu]vel[ée]si [áa]g\d*:\s*([^\n]+)/i)?.[1]?.trim() ||
    null
  );
}

function parseHungarianNumber(input) {
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

function cleanSettlement(value) {
  if (!value) return null;
  const cleaned = String(value)
    .replace(/^(adás-vétel|haszonbérlet|haszonberlet|vétel|vetel)\s*-\s*/i, "")
    .replace(/\s+hrsz\.?.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
}

function inferCounty(text) {
  const s = String(text || "").toLowerCase();
  if (/bács|bacs/.test(s)) return "Bács-Kiskun";
  if (/baranya/.test(s)) return "Baranya";
  if (/békés|bekes/.test(s)) return "Békés";
  if (/borsod|abaúj|abauj|zemplén|zemplen/.test(s)) return "Borsod-Abaúj-Zemplén";
  if (/csongrád|csongrad|csanád|csanad/.test(s)) return "Csongrád-Csanád";
  if (/fejér|fejer/.test(s)) return "Fejér";
  if (/győr|gyor|moson|sopron/.test(s)) return "Győr-Moson-Sopron";
  if (/hajdú|hajdu|bihar/.test(s)) return "Hajdú-Bihar";
  if (/heves/.test(s)) return "Heves";
  if (/jász|jasz|nagykun|szolnok/.test(s)) return "Jász-Nagykun-Szolnok";
  if (/komárom|komarom|esztergom/.test(s)) return "Komárom-Esztergom";
  if (/nógrád|nograd/.test(s)) return "Nógrád";
  if (/pest|budapest|főváros|fovaros/.test(s)) return "Pest";
  if (/somogy/.test(s)) return "Somogy";
  if (/szabolcs|szatmár|szatmar|bereg/.test(s)) return "Szabolcs-Szatmár-Bereg";
  if (/tolna/.test(s)) return "Tolna";
  if (/vas/.test(s)) return "Vas";
  if (/veszprém|veszprem/.test(s)) return "Veszprém";
  if (/zala/.test(s)) return "Zala";
  return null;
}

function excerptAroundPrice(text) {
  const match = text.match(/.{0,180}([0-9][0-9.,\s]*)\s*(?:-|\.)?\s*ft.{0,180}/i);
  return (match?.[0] || text.slice(0, 400)).replace(/\s+/g, " ").trim().slice(0, 500);
}

function pickObservationLog(row, valueKey) {
  return {
    settlement: row.settlement,
    county: row.county,
    area_ha: row.area_ha,
    value: row[valueKey],
    confidence: row.confidence,
    excerpt: row.raw_text_excerpt,
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
