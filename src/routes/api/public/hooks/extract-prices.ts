import { createFileRoute } from "@tanstack/react-router";
import { extractPriceBatch } from "@/lib/notices/extract-prices.server";

export const Route = createFileRoute("/api/public/hooks/extract-prices")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        const expected =
          process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apiKey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const url = new URL(request.url);
          const limit = Math.min(
            Math.max(Number(url.searchParams.get("limit") ?? "15"), 1),
            40,
          );
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