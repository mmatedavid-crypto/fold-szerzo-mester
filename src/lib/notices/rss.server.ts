import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type RssNotice = {
  source_notice_id: string;
  original_detail_url: string;
  subject: string;
  notice_type: string;
  settlement: string | null;
  parcel_numbers: string[];
  municipality: string | null;
  publication_date: string | null; // YYYY-MM-DD
};

function decodeHtml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function pick(item: string, tag: string): string | null {
  const m = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeHtml(m[1].trim()) : null;
}

function parseSubject(rawTitle: string): {
  notice_type: string;
  settlement: string | null;
  parcel_numbers: string[];
} {
  // multi entries split by | — same notice id, multiple parcels
  const parts = rawTitle
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);
  const types = new Set<string>();
  let settlement: string | null = null;
  const parcels: string[] = [];
  for (const part of parts) {
    const m = part.match(/^(.+?)\s*-\s*(.+?)\s*hrsz\.?:?\s*(.+)$/i);
    if (m) {
      types.add(m[1].trim());
      if (!settlement) settlement = extractSettlementBeforeHrsz(m[2]);
      const tail = m[3].replace(/külterület|zártkert|hrsz\.?/gi, " ").trim();
      for (const p of tail.split(/[,\s]+/)) {
        const cleaned = p.replace(/[^0-9A-Za-z/]/g, "");
        if (cleaned && /\d/.test(cleaned)) parcels.push(cleaned);
      }
    }
  }
  const type = Array.from(types).join(" / ") || "Egyéb";
  return {
    notice_type: type,
    settlement,
    parcel_numbers: Array.from(new Set(parcels)).slice(0, 50),
  };
}

function parseMunicipality(desc: string): string | null {
  const m = desc.match(/Forrásintézmény\s*:\s*([^<\n]+)/i);
  return m ? m[1].trim() : null;
}

function toIsoFromPubDate(s: string | null): string | null {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function parseRss(xml: string): RssNotice[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const out: RssNotice[] = [];
  for (const item of items) {
    const title = pick(item, "title");
    const link = pick(item, "link");
    const description = pick(item, "description") ?? "";
    if (!title || !link) continue;
    const idMatch = link.match(/\/reszletezo\/(\d+)/);
    if (!idMatch) continue;
    const sourceId = idMatch[1];
    const parsed = parseSubject(title);
    out.push({
      source_notice_id: sourceId,
      original_detail_url: link,
      subject: title.slice(0, 1000),
      notice_type: parsed.notice_type.slice(0, 64),
      settlement: parsed.settlement?.slice(0, 255) ?? null,
      parcel_numbers: parsed.parcel_numbers,
      municipality: parseMunicipality(description)?.slice(0, 255) ?? null,
      publication_date: toIsoFromPubDate(pick(item, "pubDate")),
    });
  }
  return out;
}

export async function syncFromRss(): Promise<{ fetched: number; upserted: number }> {
  return syncFromApi({ incremental: true });
}

const TYPE_LABEL: Record<string, string> = {
  foldelovasarlasos: "Adás-vétel",
  foldhivatali: "Haszonbérlet",
};

type ApiRow = {
  id: number;
  targy: string;
  forrasIntezmenyNeve: string | null;
  kifuggesztesNapja: string | null;
  hirdetmenyTipusNev: string | null;
};

function parseSubjectParts(rawTitle: string): { settlement: string | null; parcels: string[] } {
  const parts = rawTitle
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);
  let settlement: string | null = null;
  const parcels: string[] = [];
  for (const part of parts) {
    const m = part.match(/^(.+?)\s*-\s*(.+?)\s*hrsz\.?:?\s*(.+)$/i);
    if (m) {
      if (!settlement) settlement = extractSettlementBeforeHrsz(m[2]);
      const tail = m[3].replace(/külterület|zártkert|hrsz\.?/gi, " ").trim();
      for (const p of tail.split(/[,\s]+/)) {
        const cleaned = p.replace(/[^0-9A-Za-z/]/g, "");
        if (cleaned && /\d/.test(cleaned)) parcels.push(cleaned);
      }
    }
  }
  return { settlement, parcels: Array.from(new Set(parcels)).slice(0, 50) };
}

function extractSettlementBeforeHrsz(raw: string): string {
  const chunks = raw
    .split(/\s+-\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  return (chunks.at(-1) ?? raw).replace(/^(adás-vétel|haszonbérlet|vétel)\s*-\s*/i, "").trim();
}

async function fetchPage(
  pageIndex: number,
  pageSize: number,
): Promise<{ rows: ApiRow[]; total: number }> {
  const url = `https://hirdetmenyek.gov.hu/api/hirdetmenyek?pageIndex=${pageIndex}&pageSize=${pageSize}&sort=kifuggesztesNapja&order=desc`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Foldberleti-Szerzodes-Generator/1.0", Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`API HTTP ${res.status}`);
  return (await res.json()) as { rows: ApiRow[]; total: number };
}

function mapRow(r: ApiRow) {
  const { settlement, parcels } = parseSubjectParts(r.targy ?? "");
  const typeLabel = TYPE_LABEL[r.hirdetmenyTipusNev ?? ""] ?? r.hirdetmenyTipusNev ?? "Egyéb";
  const pub = r.kifuggesztesNapja ? new Date(r.kifuggesztesNapja).toISOString().slice(0, 10) : null;
  return {
    source: "hirdetmenyek.gov.hu",
    source_notice_id: String(r.id),
    original_detail_url: `https://hirdetmenyek.gov.hu/reszletezo/${r.id}`,
    subject: (r.targy ?? "").slice(0, 1000),
    notice_type: typeLabel.slice(0, 64),
    settlement: settlement?.slice(0, 255) ?? null,
    parcel_numbers: parcels,
    municipality: r.forrasIntezmenyNeve?.slice(0, 255) ?? null,
    publication_date: pub,
    last_fetched_at: new Date().toISOString(),
  };
}

export async function syncFromApi(
  opts: { incremental?: boolean; maxPages?: number } = {},
): Promise<{
  fetched: number;
  upserted: number;
}> {
  const pageSize = 100;
  const first = await fetchPage(0, pageSize);
  const total = first.total;
  const totalPages = Math.ceil(total / pageSize);
  const cap = opts.maxPages ?? (opts.incremental ? 2 : totalPages);
  const pages = Math.min(totalPages, cap);

  let fetched = 0;
  let upserted = 0;

  async function flush(rows: ApiRow[]) {
    if (rows.length === 0) return;
    const payload = rows.map(mapRow);
    const { error } = await supabaseAdmin
      .from("notices")
      .upsert(payload, { onConflict: "source,source_notice_id" });
    if (error) throw new Error(error.message);
    fetched += rows.length;
    upserted += payload.length;
  }

  await flush(first.rows);

  for (let i = 1; i < pages; i++) {
    const page = await fetchPage(i, pageSize);
    await flush(page.rows);
    if (page.rows.length === 0) break;
  }

  return { fetched, upserted };
}
