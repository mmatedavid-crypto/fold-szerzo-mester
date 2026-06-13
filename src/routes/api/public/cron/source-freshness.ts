import { createFileRoute } from "@tanstack/react-router";
import { runFreshnessCheck, type FreshnessResult } from "@/lib/legal/sourceFreshness.server";
import { enqueueTransactionalEmail } from "@/lib/email/enqueue.server";

async function sendToLawyers(results: FreshnessResult[]): Promise<{ sent: number; errors: string[] }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: roles, error: rolesErr } = await supabaseAdmin
    .from("user_roles").select("user_id").eq("role", "lawyer");
  if (rolesErr) return { sent: 0, errors: [rolesErr.message] };
  const ids = (roles ?? []).map((r) => r.user_id);
  if (!ids.length) return { sent: 0, errors: ["No lawyers configured"] };

  const { data: profiles, error: profErr } = await supabaseAdmin
    .from("users_profile").select("email").in("user_id", ids);
  if (profErr) return { sent: 0, errors: [profErr.message] };
  const emails = Array.from(
    new Set((profiles ?? []).map((p) => p.email).filter((e): e is string => !!e)),
  );
  if (!emails.length) return { sent: 0, errors: ["No lawyers configured"] };

  const checkedAt = new Date().toLocaleString("hu-HU", { timeZone: "Europe/Budapest" });
  const templateData = {
    checkedAt,
    items: results.map((r) => ({
      shortName: r.shortName,
      status: r.status,
      storedHash: r.storedHash,
      currentHash: r.currentHash,
      sourceUrl: r.sourceUrl,
      message: r.message,
    })),
  };

  const errors: string[] = [];
  let sent = 0;
  const day = new Date().toISOString().slice(0, 10);
  for (const to of emails) {
    const res = await enqueueTransactionalEmail({
      templateName: "legal-source-freshness",
      recipientEmail: to,
      idempotencyKey: `legal-freshness-${day}-${to}`,
      fromLabel: "Dr Föld jog",
      templateData,
    });
    if (res.status === "error") errors.push(`${to}: ${res.error}`);
    else sent++;
  }
  return { sent, errors };
}

export const Route = createFileRoute("/api/public/cron/source-freshness")({
  server: {
    handlers: {
      POST: async () => {
        const results = await runFreshnessCheck();
        const changed = results.filter((r) => r.status === "changed").length;
        const unreachable = results.filter((r) => r.status === "unreachable").length;
        const newOnes = results.filter((r) => r.status === "never_fetched").length;

        // Only email lawyers if there's something to act on
        const shouldEmail = changed > 0 || unreachable > 0 || newOnes > 0;
        let emailReport: { sent: number; errors: string[] } | null = null;
        if (shouldEmail) {
          emailReport = await sendToLawyers(results);
        }

        return new Response(
          JSON.stringify({
            ok: true,
            checkedAt: new Date().toISOString(),
            summary: { total: results.length, changed, unreachable, newOnes },
            emailReport,
            results,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});