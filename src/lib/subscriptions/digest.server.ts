import { cleanSettlement } from "@/lib/notices/clean";
import { enqueueTransactionalEmail } from "@/lib/email/enqueue.server";

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

function fmtDate(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("hu-HU");
  } catch {
    return d;
  }
}

export async function sendWeeklyDigest(opts: { idempotencySuffix?: string } = {}): Promise<{
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
  const fallbackPublishedSince = new Date(today);
  fallbackPublishedSince.setDate(today.getDate() - 90);
  const todayIso = today.toISOString().slice(0, 10);
  const fallbackIso = fallbackPublishedSince.toISOString().slice(0, 10);
  const { data: allNotices, error: nerr } = await supabaseAdmin
    .from("notices")
    .select(
      "id, subject, settlement, parcel_numbers, notice_type, publication_date, deadline_date, original_detail_url",
    )
    .or(`deadline_date.gte.${todayIso},and(deadline_date.is.null,publication_date.gte.${fallbackIso})`)
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
      const result = await enqueueTransactionalEmail({
        templateName: "weekly-digest",
        recipientEmail: sub.email,
        idempotencyKey: `weekly-digest-${sub.id}-${new Date().toISOString().slice(0, 10)}${opts.idempotencySuffix ? `-${opts.idempotencySuffix}` : ""}`,
        fromLabel: "Dr Föld értesítő",
        templateData: {
          settlement: sub.settlement_clean,
          expiresAt: fmtDate(sub.expires_at),
          notices: notices.map((n) => ({
            parcels: (n.parcel_numbers ?? []).join(", ") || "—",
            type: n.notice_type ?? "—",
            pubDate: fmtDate(n.publication_date),
            deadline: fmtDate(n.deadline_date),
            url: n.original_detail_url ?? "",
          })),
        },
      });
      if (result.status === "error") throw new Error(result.error);
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
