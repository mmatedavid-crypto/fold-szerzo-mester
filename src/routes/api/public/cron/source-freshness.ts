import { createFileRoute } from "@tanstack/react-router";
import { runFreshnessCheck, type FreshnessResult } from "@/lib/legal/sourceFreshness.server";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function renderEmail(results: FreshnessResult[]) {
  const changed = results.filter((r) => r.status === "changed");
  const unreachable = results.filter((r) => r.status === "unreachable");
  const newOnes = results.filter((r) => r.status === "never_fetched");

  const row = (r: FreshnessResult, badge: string, color: string) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;"><strong>${escapeHtml(r.shortName)}</strong></td>
      <td style="padding:8px;border-bottom:1px solid #eee;color:${color};font-weight:600;">${badge}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;font-family:monospace;font-size:12px;">${escapeHtml(r.storedHash ?? "—")} → ${escapeHtml(r.currentHash ?? "—")}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;"><a href="${escapeHtml(r.sourceUrl)}">forrás</a></td>
    </tr>`;

  const sections: string[] = [];
  if (changed.length) {
    sections.push(
      `<h3 style="color:#b45309;">MEGVÁLTOZOTT — ügyvédi review kell (${changed.length})</h3>` +
        `<table style="width:100%;border-collapse:collapse;">${changed.map((r) => row(r, "CHANGED", "#b45309")).join("")}</table>`,
    );
  }
  if (newOnes.length) {
    sections.push(
      `<h3 style="color:#0f766e;">Új, még nem lektorált források (${newOnes.length})</h3>` +
        `<table style="width:100%;border-collapse:collapse;">${newOnes.map((r) => row(r, "NEW", "#0f766e")).join("")}</table>`,
    );
  }
  if (unreachable.length) {
    sections.push(
      `<h3 style="color:#991b1b;">Nem elérhető (${unreachable.length})</h3>` +
        `<table style="width:100%;border-collapse:collapse;">${unreachable.map((r) => row(r, "UNREACHABLE", "#991b1b")).join("")}</table>`,
    );
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#111;">
      <h2 style="margin:0 0 8px;">Dr Föld — Jogforrás-frissesség heti riport</h2>
      <p style="color:#555;margin:0 0 16px;">Időpont: ${new Date().toLocaleString("hu-HU", { timeZone: "Europe/Budapest" })}</p>
      ${sections.join("\n") || '<p style="color:#0f766e;">Minden jogforrás változatlan — nincs teendő.</p>'}
      <p style="margin-top:24px;font-size:12px;color:#666;">
        Részletek és lektorálás: <a href="https://drfold.hu/admin/klauzulak">drfold.hu/admin/klauzulak</a>
      </p>
    </div>`;

  const subjectPrefix = changed.length
    ? `[ACTION] ${changed.length} jogforrás megváltozott`
    : unreachable.length
    ? `[FIGYELEM] ${unreachable.length} forrás nem elérhető`
    : "[OK] Heti jogforrás-riport";

  const text = results
    .map((r) => `${r.shortName}: ${r.status} (${r.storedHash ?? "—"} → ${r.currentHash ?? "—"})`)
    .join("\n");

  return { html, text, subject: `${subjectPrefix} — Dr Föld` };
}

async function sendToLawyers(html: string, text: string, subject: string): Promise<{ sent: number; errors: string[] }> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    return { sent: 0, errors: ["Missing LOVABLE_API_KEY or RESEND_API_KEY"] };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: lawyers, error } = await supabaseAdmin
    .from("user_roles")
    .select("user_id, users_profile:users_profile!inner(email, name)")
    .eq("role", "lawyer");
  if (error) return { sent: 0, errors: [error.message] };

  const emails = Array.from(
    new Set(
      (lawyers ?? [])
        .map((l: { users_profile: { email: string | null } | null }) => l.users_profile?.email)
        .filter((e: string | null | undefined): e is string => !!e),
    ),
  );
  if (!emails.length) return { sent: 0, errors: ["No lawyers configured"] };

  const from = process.env.NOTICES_FROM_EMAIL ?? "Dr Föld jog <hello@drfold.hu>";
  const errors: string[] = [];
  let sent = 0;
  for (const to of emails) {
    try {
      const r = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": RESEND_API_KEY,
        },
        body: JSON.stringify({ from, to: [to], subject, html, text }),
      });
      if (!r.ok) errors.push(`${to}: ${r.status} ${await r.text()}`);
      else sent++;
    } catch (e) {
      errors.push(`${to}: ${(e as Error).message}`);
    }
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
          const { html, text, subject } = renderEmail(results);
          emailReport = await sendToLawyers(html, text, subject);
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