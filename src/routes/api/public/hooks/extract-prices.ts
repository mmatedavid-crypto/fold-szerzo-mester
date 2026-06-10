import { createFileRoute } from "@tanstack/react-router";
import { extractPriceBatch } from "@/lib/notices/extract-prices.server";

function isAuthorized(request: Request): boolean {
  const provided =
    request.headers.get("x-hook-secret") ?? request.headers.get("apikey") ?? "";
  const allowed = [
    process.env.PRICE_EXTRACT_HOOK_SECRET,
    process.env.CRON_SECRET,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    process.env.VITE_SUPABASE_ANON_KEY,
  ].filter((v): v is string => Boolean(v));
  console.log("[extract-prices] auth check", {
    providedPrefix: provided.slice(0, 12),
    allowedPrefixes: allowed.map((v) => v.slice(0, 12)),
  });
  return allowed.includes(provided);
}

export const Route = createFileRoute("/api/public/hooks/extract-prices")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthorized(request)) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const url = new URL(request.url);
          const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "15"), 1), 40);
          const result = await extractPriceBatch(limit);
          return Response.json({ success: true, ...result });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          console.error("[extract-prices] failed", message);
          return Response.json({ success: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
