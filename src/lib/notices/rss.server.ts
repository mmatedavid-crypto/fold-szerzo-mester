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
  const parts = rawTitle.split("|").map((p) => p.trim()).filter(Boolean);
  const types = new Set<string>();
  let settlement: string | null = null;
  const parcels: string[] = [];
  for (const part of parts) {
    const m = part.match(/^(.+?)\s*-\s*(.+?)\s*hrsz\.?:?\s*(.+)$/i);
    if (m) {
      types.add(m[1].trim());
      if (!settlement) settlement = m[2].trim();
      const tail = m[3].replace(/külterület|zártkert|hrsz\.?/gi, " ").trim();
      for (const p of tail.split(/[,\s]+/)) {
        const cleaned = p.replace(/[^0-9A-Za-z/]/g, "");
        if (cleaned && /\d/.test(cleaned)) parcels.push(cleaned);
      }
    }
  }
  const type = Array.from(types).join(" / ") || "Egyéb";
  return { notice_type: type, settlement, parcel_numbers: Array.from(new Set(parcels)).slice(0, 50) };
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
  const res = await fetch("https://hirdetmenyek.gov.hu/rss", {
    headers: { "User-Agent": "Foldberleti-Szerzodes-Generator/1.0 (+kifuggesztesek)" },
  });
  if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);
  const xml = await res.text();
  const rows = parseRss(xml);
  if (rows.length === 0) return { fetched: 0, upserted: 0 };

  const payload = rows.map((r) => ({
    source: "hirdetmenyek.gov.hu",
    source_notice_id: r.source_notice_id,
    original_detail_url: r.original_detail_url,
    subject: r.subject,
    notice_type: r.notice_type,
    settlement: r.settlement,
    parcel_numbers: r.parcel_numbers,
    municipality: r.municipality,
    publication_date: r.publication_date,
    last_fetched_at: new Date().toISOString(),
  }));

  // Upsert without overwriting Excel-imported rich fields (area, rent, deadline, attachment).
  // PostgREST upsert with onConflict + ignoreDuplicates would skip updates; instead we
  // insert new and update only the RSS-sourced columns for existing rows.
  const { error } = await supabaseAdmin
    .from("notices")
    .upsert(payload, { onConflict: "source,source_notice_id" });
  if (error) throw new Error(error.message);
  return { fetched: rows.length, upserted: payload.length };
}