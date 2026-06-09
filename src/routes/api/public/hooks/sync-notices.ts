import { createFileRoute } from "@tanstack/react-router";

function getHookSecret(): string | undefined {
  return process.env.NOTICES_SYNC_HOOK_SECRET ?? process.env.CRON_SECRET;
}

function requestSecret(request: Request): string | null {
  return request.headers.get("x-hook-secret") ?? request.headers.get("apikey");
}

export const Route = createFileRoute("/api/public/hooks/sync-notices")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = getHookSecret();
        if (!expected || requestSecret(request) !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const { syncFromRss } = await import("@/lib/notices/rss.server");
          const result = await syncFromRss();
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
