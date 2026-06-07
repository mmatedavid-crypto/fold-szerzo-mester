import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().trim().email().max(255),
  settlement: z.string().trim().min(1).max(120),
});

export const subscribeToSettlement = createServerFn({ method: "POST" })
  .inputValidator((input) => subscribeSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { cleanSettlement } = await import("@/lib/notices/clean");

    const settlement_clean = cleanSettlement(data.settlement);
    if (!settlement_clean) {
      return { ok: false as const, error: "Érvénytelen településnév." };
    }

    // Upsert: if already subscribed, reactivate + extend
    const { data: existing, error: selErr } = await supabaseAdmin
      .from("notice_subscriptions")
      .select("id, status")
      .eq("email", data.email.toLowerCase())
      .eq("settlement_clean", settlement_clean)
      .maybeSingle();
    if (selErr) return { ok: false as const, error: selErr.message };

    if (existing) {
      const expires = new Date(Date.now() + 52 * 7 * 24 * 60 * 60 * 1000).toISOString();
      const { error: updErr } = await supabaseAdmin
        .from("notice_subscriptions")
        .update({ status: "active", expires_at: expires })
        .eq("id", existing.id);
      if (updErr) return { ok: false as const, error: updErr.message };
      return { ok: true as const, reactivated: true, settlement_clean };
    }

    const { error: insErr } = await supabaseAdmin
      .from("notice_subscriptions")
      .insert({ email: data.email.toLowerCase(), settlement_clean });
    if (insErr) return { ok: false as const, error: insErr.message };
    return { ok: true as const, reactivated: false, settlement_clean };
  });

export const unsubscribeByToken = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ token: z.string().min(10).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("notice_subscriptions")
      .update({ status: "unsubscribed" })
      .eq("unsubscribe_token", data.token)
      .select("email, settlement_clean")
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    if (!row) return { ok: false as const, error: "Érvénytelen leiratkozási link." };
    return { ok: true as const, email: row.email, settlement: row.settlement_clean };
  });