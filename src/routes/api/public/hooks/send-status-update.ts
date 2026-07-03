import { createFileRoute } from "@tanstack/react-router";

// One-shot admin trigger; delete after use.
const ONE_SHOT_TOKEN = "d4b1e6a2-3c9f-4a1e-89b7-6f5c2e8a41cd";

export const Route = createFileRoute("/api/public/hooks/send-status-update")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.headers.get("x-one-shot-token") !== ONE_SHOT_TOKEN) {
          return Response.json({ success: false, error: "unauthorized" }, { status: 401 });
        }
        try {
          const { enqueueTransactionalEmail } = await import("@/lib/email/enqueue.server");
          const generatedAt = new Date().toLocaleString("hu-HU", {
            timeZone: "Europe/Budapest",
          });
          const stamp = new Date().toISOString().replace(/[:.]/g, "-");
          const targets: Array<{ email: string; name: string }> = [
            { email: "iroda@szarkaadam.hu", name: "Dr. Szarka Ádám Ügyvédi Iroda" },
            { email: "szarkaadam@szarkaadam.hu", name: "Dr. Szarka Ádám" },
            { email: "hello@drfold.hu", name: "Dr Föld csapat" },
          ];
          const results: Array<{ to: string; result: unknown }> = [];
          for (const t of targets) {
            const r = await enqueueTransactionalEmail({
              templateName: "project-status-update",
              recipientEmail: t.email,
              idempotencyKey: `status-update-${stamp}-${t.email}`,
              templateData: { recipientName: t.name, generatedAt },
            });
            results.push({ to: t.email, result: r });
          }
          return Response.json({ success: true, results });
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          console.error("[send-status-update] failed", message);
          return Response.json({ success: false, error: message }, { status: 500 });
        }
      },
    },
  },
});