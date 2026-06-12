import { createFileRoute } from "@tanstack/react-router";

function isAuthorized(request: Request): boolean {
  const provided =
    request.headers.get("x-hook-secret") ?? request.headers.get("apikey") ?? "";
  const allowed = [
    process.env.NOTICES_SYNC_HOOK_SECRET,
    process.env.CRON_SECRET,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    process.env.VITE_SUPABASE_ANON_KEY,
  ].filter((v): v is string => Boolean(v));
  return allowed.includes(provided);
}

export const Route = createFileRoute("/api/public/hooks/sync-notices")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthorized(request)) {
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
