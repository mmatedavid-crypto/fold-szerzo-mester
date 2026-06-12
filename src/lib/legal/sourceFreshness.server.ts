import { LEGAL_SOURCES_V2 } from "./sources";
import snippets from "./sources-snippets.json";

type Snippets = Record<string, { versionHash: string; retrievedAt: string }>;
const SNIPPETS = snippets as Snippets;

export type FreshnessResult = {
  id: string;
  shortName: string;
  sourceUrl: string;
  storedHash: string | null;
  storedAt: string | null;
  currentHash: string | null;
  status: "unchanged" | "changed" | "unreachable" | "never_fetched";
  byteLength: number | null;
  checkedAt: string;
  message?: string;
};

async function sha256Hex(input: ArrayBuffer): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", input);
  return Array.from(new Uint8Array(h))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function runFreshnessCheck(): Promise<FreshnessResult[]> {
  const checkedAt = new Date().toISOString();
  return Promise.all(
    LEGAL_SOURCES_V2.map(async (src): Promise<FreshnessResult> => {
      const stored = SNIPPETS[src.id];
      const base = {
        id: src.id,
        shortName: src.shortName,
        sourceUrl: src.sourceUrl,
        storedHash: stored?.versionHash ?? null,
        storedAt: stored?.retrievedAt ?? null,
        checkedAt,
      };
      try {
        const r = await fetch(src.sourceUrl, {
          headers: {
            "user-agent":
              "Mozilla/5.0 (compatible; DrFold-LegalFreshness/1.0; +https://drfold.hu)",
            accept: "text/html,application/xhtml+xml,*/*",
          },
          signal: AbortSignal.timeout(25_000),
        });
        if (!r.ok) {
          return { ...base, status: "unreachable", currentHash: null, byteLength: null, message: `HTTP ${r.status}` };
        }
        const buf = await r.arrayBuffer();
        const current = (await sha256Hex(buf)).slice(0, 16);
        if (!stored) {
          return { ...base, status: "never_fetched", currentHash: current, byteLength: buf.byteLength };
        }
        return {
          ...base,
          status: current === stored.versionHash ? "unchanged" : "changed",
          currentHash: current,
          byteLength: buf.byteLength,
        };
      } catch (e) {
        return { ...base, status: "unreachable", currentHash: null, byteLength: null, message: (e as Error).message };
      }
    }),
  );
}