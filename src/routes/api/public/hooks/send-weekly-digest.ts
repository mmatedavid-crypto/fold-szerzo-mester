import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/send-weekly-digest")({
  server: {
    handlers: {
      POST: async () => {
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
