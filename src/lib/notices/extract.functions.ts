import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const extractNoticePrices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number }) => ({ limit: input?.limit ?? 25 }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden");

    const { extractPriceBatch } = await import("./extract-prices.server");
    const limit = Math.min(Math.max(data.limit ?? 25, 1), 40);
    return extractPriceBatch(limit);
  });