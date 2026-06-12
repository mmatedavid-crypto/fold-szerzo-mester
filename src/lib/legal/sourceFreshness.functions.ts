import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runFreshnessCheck, type FreshnessResult } from "./sourceFreshness.server";

export type { FreshnessResult };

export const checkSourceFreshness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FreshnessResult[]> => {
    const isLawyer = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "lawyer" });
    if (!isLawyer.data) throw new Error("Csak ügyvédi szerep");
    return runFreshnessCheck();
  });