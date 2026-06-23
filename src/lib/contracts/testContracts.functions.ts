/**
 * Admin server-fn: 3 fiktív, de valósághű földbérleti szerződésmintát generál
 * és e-mailben kiküldi az ügyvédnek. Csak admin szerepkörrel hívható.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendTestContractsToLawyer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Csak admin jogosultsággal hívható.");

    const { runTestContractsToLawyer } = await import("./testContracts.server");
    const r = await runTestContractsToLawyer();
    return {
      recipient: r.recipient,
      enqueue: r.enqueue,
      contracts: r.contracts.map((c) => ({
        documentNumber: c.documentNumber,
        title: c.title,
      })),
    };
  });
