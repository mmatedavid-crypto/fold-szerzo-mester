import { cleanSettlement } from "@/lib/notices/clean";

type Notice = {
  id: string;
  subject: string | null;
  settlement: string | null;
  parcel_numbers: string[] | null;
  notice_type: string | null;
  publication_date: string | null;
  deadline_date: string | null;
  original_detail_url: string | null;
};

type Subscription = {
  id: string;
  email: string;
  settlement_clean: string;
  unsubscribe_token: string;
  expires_at: string;
};

const PUBLIC_SITE = process.env.PUBLIC_SITE_URL ?? "https://drfold.hu";

function htmlEscape(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function renderEmail(
  sub: Subscription,
  notices: Notice[],
): { subject: string; html: string; text: string } {
  const subject = `Heti kifüggesztések – ${sub.settlement_clean} (${notices.length} aktuális)`;
  const unsubUrl = `${PUBLIC_SITE}/leiratkozas?token=${encodeURIComponent(sub.unsubscribe_token)}`;
  const rows = notices
    .map((n) => {
      const parcels = (n.parcel_numbers ?? []).join(", ") || "—";
      const type = n.notice_type ?? "—";
      const pubDate = n.publication_date
        ? new Date(n.publication_date).toLocaleDateString("hu-HU")
        : "—";
      const deadline = n.deadline_date
        ? new Date(n.deadline_date).toLocaleDateString("hu-HU")
        : "—";
      const link = n.original_detail_url
        ? `<a href="${htmlEscape(n.original_detail_url)}" style="color:#0a6;">Hirdetmény megnyitása</a>`
        : "—";
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;">${pubDate}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;">${deadline}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;">${htmlEscape(parcels)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;">${htmlEscape(type)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;">${link}</td>
      </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html><body style="font-family:Arial,sans-serif;background:#fff;color:#222;padding:24px;">
  <h2 style="font-family:Georgia,serif;">Heti kifüggesztések – ${htmlEscape(sub.settlement_clean)}</h2>
  <p style="color:#555;">Az alábbi listában az ${htmlEscape(sub.settlement_clean)} településen aktuálisan kifüggesztett termőföld hirdetmények szerepelnek (${notices.length} db).</p>
  ${
    notices.length === 0
      ? `<p style="padding:12px;background:#f5f5f5;border-radius:6px;">Ezen a héten nincs aktuális kifüggesztés ezen a településen.</p>`
      : `<table style="border-collapse:collapse;width:100%;margin-top:12px;">
        <thead><tr style="background:#f7f7f7;text-align:left;">
          <th style="padding:8px;font-size:12px;">Közzététel</th>
          <th style="padding:8px;font-size:12px;">Határidő</th>
          <th style="padding:8px;font-size:12px;">Hrsz.</th>
          <th style="padding:8px;font-size:12px;">Típus</th>
          <th style="padding:8px;font-size:12px;">Link</th>
        </tr></thead>
        <tbody>${rows}</tbody>
       </table>`
  }
  <p style="margin-top:24px;color:#888;font-size:12px;">
    Előfizetésed lejár: ${new Date(sub.expires_at).toLocaleDateString("hu-HU")}.<br/>
    <a href="${unsubUrl}" style="color:#888;">Leiratkozás</a>
  </p>
</body></html>`;

  const text =
    `Heti kifüggesztések – ${sub.settlement_clean}\n\n${notices.length} aktuális kifüggesztés.\n\n` +
    notices
      .map(
        (n) =>
          `- közzététel: ${n.publication_date ?? ""}; határidő: ${n.deadline_date ?? ""}; hrsz.: ${(n.parcel_numbers ?? []).join(", ")}; ${n.notice_type ?? ""}; ${n.original_detail_url ?? ""}`,
      )
      .join("\n") +
    `\n\nLeiratkozás: ${unsubUrl}`;

  return { subject, html, text };
}

async function sendResendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!LOVABLE_API_KEY || !RESEND_API_KEY)
    throw new Error("Missing LOVABLE_API_KEY or RESEND_API_KEY");
  const from = process.env.NOTICES_FROM_EMAIL ?? "Földbérleti értesítő <onboarding@resend.dev>";
  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend send failed [${res.status}]: ${body}`);
  }
}

export async function sendWeeklyDigest(): Promise<{
  sent: number;
  skipped: number;
  failed: number;
  expired: number;
  errors: string[];
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Expire stale subs
  const { count: expiredCount } = await supabaseAdmin
    .from("notice_subscriptions")
    .update({ status: "expired" }, { count: "exact" })
    .eq("status", "active")
    .lt("expires_at", new Date().toISOString());

  const { data: subs, error: subsErr } = await supabaseAdmin
    .from("notice_subscriptions")
    .select("id, email, settlement_clean, unsubscribe_token, expires_at")
    .eq("status", "active");
  if (subsErr) throw new Error(subsErr.message);

  const list = (subs ?? []) as Subscription[];
  if (list.length === 0)
    return { sent: 0, skipped: 0, failed: 0, expired: expiredCount ?? 0, errors: [] };

  // Pull all notices once and bucket by clean settlement (smaller fanout per sub)
  const today = new Date();
  const inThirtyDays = new Date(today);
  inThirtyDays.setDate(today.getDate() + 30);
  const { data: allNotices, error: nerr } = await supabaseAdmin
    .from("notices")
    .select(
      "id, subject, settlement, parcel_numbers, notice_type, publication_date, deadline_date, original_detail_url",
    )
    .gte("deadline_date", today.toISOString().slice(0, 10))
    .lte("deadline_date", inThirtyDays.toISOString().slice(0, 10))
    .order("publication_date", { ascending: false, nullsFirst: false })
    .limit(10000);
  if (nerr) throw new Error(nerr.message);

  const buckets = new Map<string, Notice[]>();
  for (const n of (allNotices ?? []) as Notice[]) {
    const key = cleanSettlement(n.settlement);
    if (!key) continue;
    const arr = buckets.get(key) ?? [];
    arr.push(n);
    buckets.set(key, arr);
  }

  let sent = 0;
  const skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const sub of list) {
    const notices = buckets.get(sub.settlement_clean) ?? [];
    try {
      const { subject, html, text } = renderEmail(sub, notices);
      await sendResendEmail(sub.email, subject, html, text);
      await supabaseAdmin
        .from("notice_subscriptions")
        .update({ last_sent_at: new Date().toISOString() })
        .eq("id", sub.id);
      sent++;
    } catch (e) {
      failed++;
      errors.push(
        `${sub.email}/${sub.settlement_clean}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  return { sent, skipped, failed, expired: expiredCount ?? 0, errors };
}
