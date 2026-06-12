import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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

export const checkSourceFreshness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FreshnessResult[]> => {
    const isLawyer = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "lawyer" });
    if (!isLawyer.data) throw new Error("Csak ügyvédi szerep");

    const checkedAt = new Date().toISOString();
    const results = await Promise.all(
      LEGAL_SOURCES_V2.map(async (src): Promise<FreshnessResult> => {
        const stored = SNIPPETS[src.id];
        const base: Omit<FreshnessResult, "status" | "currentHash" | "byteLength" | "message"> = {
          id: src.id,
          shortName: src.shortName,
          sourceUrl: src.sourceUrl,
          storedHash: stored?.versionHash ?? null,
          storedAt: stored?.retrievedAt ?? null,
          checkedAt,
        };
        try {
          const r = await fetch(src.sourceUrl, {
            headers: { "user-agent": "DrFold-LegalFreshness/1.0", accept: "text/html,*/*" },
            signal: AbortSignal.timeout(20_000),
          });
          if (!r.ok) {
            return { ...base, status: "unreachable", currentHash: null, byteLength: null, message: `HTTP ${r.status}` };
          }
          const buf = await r.arrayBuffer();
          const full = await sha256Hex(buf);
          const current = full.slice(0, 16);
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
          return {
            ...base,
            status: "unreachable",
            currentHash: null,
            byteLength: null,
            message: (e as Error).message,
          };
        }
      }),
    );
    return results;
  });