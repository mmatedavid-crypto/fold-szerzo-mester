import { createFileRoute } from "@tanstack/react-router";

async function run(request: Request) {
  const url = new URL(request.url);
  const pages = Math.min(Math.max(Number(url.searchParams.get("pages") ?? "0"), 0), 100);
  const { syncFromApi, syncFromRss } = await import("@/lib/notices/rss.server");
  if (pages > 0) {
    return syncFromApi({ maxPages: pages, includeExpiring: true });
  }
  return syncFromRss();
}

export const Route = createFileRoute("/api/public/hooks/sync-notices")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const result = await run(request);
          return Response.json({ success: true, ...result });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          console.error("[sync-notices] failed", message);
          return Response.json({ success: false, error: message }, { status: 500 });
        }
      },
      GET: async ({ request }) => {
        try {
          const result = await run(request);
          return Response.json({ success: true, ...result });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          console.error("[sync-notices] failed", message);
          return Response.json({ success: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
