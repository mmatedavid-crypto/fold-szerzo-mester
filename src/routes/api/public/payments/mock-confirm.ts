import { createFileRoute } from "@tanstack/react-router";
import { mockPaymentsEnabled } from "@/lib/payments/mock";

function safeReturnPath(requestUrl: string): string {
  const url = new URL(requestUrl);
  const ret = url.searchParams.get("return") ?? "/dashboard";
  try {
    const target = new URL(ret, url.origin);
    if (target.origin !== url.origin) return "/dashboard";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/dashboard";
  }
}

export const Route = createFileRoute("/api/public/payments/mock-confirm")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!mockPaymentsEnabled()) {
          return new Response("Not found", { status: 404 });
        }

        const url = new URL(request.url);
        const paymentId = url.searchParams.get("payment_id");
        const ret = safeReturnPath(request.url);
        if (!paymentId) return new Response("Missing payment_id", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: payment, error } = await supabaseAdmin
          .from("payments")
          .select("*")
          .eq("id", paymentId)
          .single();
        if (error || !payment) return new Response("Payment not found", { status: 404 });
        if (payment.status === "paid") {
          return new Response(null, { status: 302, headers: { Location: ret } });
        }

        // Mark as paid
        await supabaseAdmin
          .from("payments")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("id", paymentId);

        // Grant credit or subscription
        if (payment.product_type === "single") {
          await supabaseAdmin.from("document_credits").insert({
            user_id: payment.user_id,
            source_type: "single_purchase",
            status: "available",
            payment_id: payment.id,
          });
        } else {
          const planId = payment.plan_id;
          if (!planId) return new Response("Plan missing", { status: 400 });
          const { data: plan } = await supabaseAdmin
            .from("plans")
            .select("*")
            .eq("id", planId)
            .single();
          if (plan) {
            const start = new Date();
            const periodEnd = new Date();
            periodEnd.setMonth(periodEnd.getMonth() + 1);
            const quotaEnd = new Date();
            quotaEnd.setFullYear(quotaEnd.getFullYear() + 1);
            // Upsert: cancel previous active and insert new
            await supabaseAdmin
              .from("subscriptions")
              .update({ status: "cancelled" })
              .eq("user_id", payment.user_id)
              .eq("status", "active");
            await supabaseAdmin.from("subscriptions").insert({
              user_id: payment.user_id,
              plan_id: plan.id,
              status: "active",
              current_period_start: start.toISOString(),
              current_period_end: periodEnd.toISOString(),
              annual_quota: plan.annual_quota,
              used_quota: 0,
              quota_period_start: start.toISOString(),
              quota_period_end: quotaEnd.toISOString(),
              payment_provider: "mock",
            });
          }
        }

        await supabaseAdmin.from("usage_logs").insert({
          user_id: payment.user_id,
          action: "payment.paid",
          entity_type: "payment",
          entity_id: payment.id,
        });

        return new Response(null, { status: 302, headers: { Location: ret } });
      },
    },
  },
});
