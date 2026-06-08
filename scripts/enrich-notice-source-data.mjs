#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

if (existsSync(".env")) {
  loadEnvFile(".env");
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAGE_SIZE = Number(process.env.HIRDETMENY_PAGE_SIZE || 100);
const MAX_PAGES = Number(process.env.HIRDETMENY_MAX_PAGES || 0);
const USER_AGENT = "DrFold-Notice-Enrichment/1.0";
const DRY_RUN = process.env.DRY_RUN === "1" || process.argv.includes("--dry-run");

if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Use DRY_RUN=1 to inspect only.",
  );
  process.exit(1);
}

const supabase = DRY_RUN
  ? null
  : createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

const TYPE_LABEL = {
  foldelovasarlasos: "Adás-vétel",
  foldhivatali: "Haszonbérlet",
};

function parseSubjectParts(rawTitle) {
  const parts = String(rawTitle || "")
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);
  let settlement = null;
  const parcels = [];
  for (const part of parts) {
    const m = part.match(/^(.+?)\s*-\s*(.+?)\s*hrsz\.?:?\s*(.+)$/i);
    if (!m) continue;
    if (!settlement) settlement = extractSettlementBeforeHrsz(m[2]);
    const tail = m[3].replace(/külterület|zártkert|hrsz\.?/gi, " ").trim();
    for (const p of tail.split(/[,\s]+/)) {
      const cleaned = p.replace(/[^0-9A-Za-z/]/g, "");
      if (cleaned && /\d/.test(cleaned)) parcels.push(cleaned);
    }
  }
  return { settlement, parcels: Array.from(new Set(parcels)).slice(0, 50) };
}

function extractSettlementBeforeHrsz(raw) {
  const chunks = String(raw)
    .split(/\s+-\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  return (chunks.at(-1) || raw).replace(/^(adás-vétel|haszonbérlet|vétel)\s*-\s*/i, "").trim();
}

function classifyNoticeCategory(sourceType, subject) {
  const hay = `${sourceType || ""} ${subject || ""}`.toLowerCase();
  if (/haszonb[ée]r|b[ée]rleti|földhaszonb[ée]r|foldhaszonber/.test(hay)) return "haszonberlet";
  if (/adás-vétel|adas-vetel|elővásárl|elovasarl|foldelovasarlasos/.test(hay)) return "adasvetel";
  if (sourceType === "foldhivatali") return "foldhivatali";
  return sourceType ? String(sourceType).toLowerCase() : null;
}

function toIsoDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function mapRow(row) {
  const { settlement, parcels } = parseSubjectParts(row.targy);
  const typeLabel = TYPE_LABEL[row.hirdetmenyTipusNev] || row.hirdetmenyTipusNev || "Egyéb";
  const publicationDate = toIsoDate(row.kifuggesztesNapja);
  const deadlineDate = toIsoDate(row.lejaratNapja);
  return {
    source: "hirdetmenyek.gov.hu",
    source_notice_id: String(row.id),
    original_detail_url: `https://hirdetmenyek.gov.hu/reszletezo/${row.id}`,
    subject: String(row.targy || "").slice(0, 1000),
    notice_type: typeLabel.slice(0, 64),
    settlement: settlement?.slice(0, 255) || null,
    parcel_numbers: parcels,
    municipality: row.forrasIntezmenyNeve?.slice(0, 255) || null,
    publication_date: publicationDate,
    deadline_date: deadlineDate,
    source_deadline_date: deadlineDate,
    source_case_number: row.ugyiratszam?.slice(0, 255) || null,
    registry_number: row.iktatasiszam?.slice(0, 255) || null,
    source_notice_type: row.hirdetmenyTipusNev?.slice(0, 64) || null,
    normalized_notice_category: classifyNoticeCategory(row.hirdetmenyTipusNev, row.targy),
    raw_json: row,
    last_fetched_at: new Date().toISOString(),
  };
}

async function fetchPage(mode, pageIndex) {
  const endpoint = mode === "expiring" ? "hirdetmenyek/lejaro" : "hirdetmenyek";
  const sort = mode === "expiring" ? "lejaratNapja" : "kifuggesztesNapja";
  const order = mode === "expiring" ? "asc" : "desc";
  const url = `https://hirdetmenyek.gov.hu/api/${endpoint}?pageIndex=${pageIndex}&pageSize=${PAGE_SIZE}&sort=${sort}&order=${order}`;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      });
      if (!res.ok) throw new Error(`${mode} page ${pageIndex}: HTTP ${res.status}`);
      return res.json();
    } catch (error) {
      if (attempt === 4) throw error;
      const waitMs = attempt * 1200;
      console.warn(`${mode}: page ${pageIndex} fetch failed, retrying in ${waitMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw new Error(`${mode} page ${pageIndex}: fetch failed`);
}

async function upsertRows(rows) {
  if (rows.length === 0) return 0;
  const payload = rows.map(mapRow);
  if (DRY_RUN) {
    summarizePayload(payload);
    return payload.length;
  }
  const { error } = await supabase
    .from("notices")
    .upsert(payload, { onConflict: "source,source_notice_id" });
  if (error) throw new Error(error.message);
  return payload.length;
}

async function runMode(mode) {
  const first = await fetchPage(mode, 0);
  const totalPages = Math.ceil(first.total / PAGE_SIZE);
  const pages = MAX_PAGES > 0 ? Math.min(MAX_PAGES, totalPages) : totalPages;
  let fetched = first.rows.length;
  let upserted = await upsertRows(first.rows);
  console.log(`${mode}: page 1/${pages}, rows=${first.rows.length}`);

  for (let page = 1; page < pages; page += 1) {
    const data = await fetchPage(mode, page);
    fetched += data.rows.length;
    upserted += await upsertRows(data.rows);
    console.log(`${mode}: page ${page + 1}/${pages}, rows=${data.rows.length}`);
    if (data.rows.length === 0) break;
  }

  return { fetched, upserted };
}

const latest = await runMode("latest");
const expiring = await runMode("expiring");

console.log(
  JSON.stringify(
    {
      ok: true,
      dryRun: DRY_RUN,
      latest,
      expiring,
      pageSize: PAGE_SIZE,
      maxPages: MAX_PAGES || "all",
    },
    null,
    2,
  ),
);

function summarizePayload(payload) {
  const counts = new Map();
  for (const row of payload) {
    const key = row.normalized_notice_category || "unknown";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  console.log(
    "batch categories:",
    [...counts.entries()].map(([key, value]) => `${key}=${value}`).join(", "),
  );
}
