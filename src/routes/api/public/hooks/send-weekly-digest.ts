import { createFileRoute } from "@tanstack/react-router";

function getHookSecret(): string | undefined {
  return process.env.DIGEST_HOOK_SECRET ?? process.env.CRON_SECRET;
}

function requestSecret(request: Request): string | null {
  return request.headers.get("x-hook-secret") ?? request.headers.get("apikey");
}

export const Route = createFileRoute("/api/public/hooks/send-weekly-digest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = getHookSecret();
        if (!expected || requestSecret(request) !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const { sendWeeklyDigest } = await import("@/lib/subscriptions/digest.server");
          const result = await sendWeeklyDigest();
          return Response.json({ success: true, ...result });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          console.error("[send-weekly-digest] failed", message);
          return Response.json({ success: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
