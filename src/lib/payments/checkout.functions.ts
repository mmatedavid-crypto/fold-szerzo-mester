import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function mockPaymentsEnabled(): boolean {
  return (
    process.env.MOCK_PAYMENTS_ENABLED === "true" ||
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test"
  );
}

export const getCheckoutAvailability = createServerFn({ method: "GET" }).handler(async () => {
  const enabled = mockPaymentsEnabled();
  return {
    enabled,
    provider: enabled ? "mock" : null,
    label: enabled ? "Teszt fizetés" : "Online fizetés előkészítés alatt",
  };
});

export const startCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        plan_slug: z.enum(["single", "gazda", "pro"]),
        draft_id: z.string().uuid().optional(),
        return_url: z.string().url(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!mockPaymentsEnabled()) {
      throw new Error(
        "Az online fizetés jelenleg nincs bekapcsolva. Ha van elérhető kredited vagy előfizetési kereted, azzal továbbra is véglegesítheted a dokumentumot.",
      );
    }

    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: plan, error: planErr } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("slug", data.plan_slug)
      .single();
    if (planErr || !plan) throw new Error("Csomag nem található.");

    const productType: "single" | "subscription_gazda" | "subscription_pro" =
      data.plan_slug === "single"
        ? "single"
        : data.plan_slug === "gazda"
          ? "subscription_gazda"
          : "subscription_pro";

    const { data: payment, error: payErr } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        amount_huf: plan.monthly_price_huf,
        currency: "HUF",
        product_type: productType,
        plan_id: plan.id,
        draft_id: data.draft_id ?? null,
        status: "pending",
        provider: "mock",
      })
      .select("*")
      .single();
    if (payErr) throw new Error(payErr.message);

    await supabase.from("usage_logs").insert({
      user_id: userId,
      action: "payment.started",
      entity_type: "payment",
      entity_id: payment.id,
      metadata: { plan: data.plan_slug, amount: plan.monthly_price_huf },
    });

    // Mock provider: redirect URL is our own confirmation endpoint
    const redirectUrl = `/api/public/payments/mock-confirm?payment_id=${payment.id}&return=${encodeURIComponent(data.return_url)}`;
    return { payment_id: payment.id, redirect_url: redirectUrl, provider: "mock" };
  });
