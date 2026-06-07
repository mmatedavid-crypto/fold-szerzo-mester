import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/send-weekly-digest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apiKey !== expected) {
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