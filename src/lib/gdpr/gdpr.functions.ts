import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Export all personal data of the logged-in user as a single JSON object.
 * GDPR Art. 20 - right to data portability.
 */
export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const tables = [
      "users_profile",
      "contract_drafts",
      "generated_documents",
      "document_credits",
      "subscriptions",
      "payments",
      "usage_logs",
      "document_verifications",
    ] as const;

    const result: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      user_id: userId,
    };

    for (const t of tables) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from(t).select("*").eq("user_id", userId);
      if (error) {
        result[t] = { error: error.message };
      } else {
        result[t] = data ?? [];
      }
    }

    await supabase.from("usage_logs").insert({
      user_id: userId,
      action: "gdpr.export",
      entity_type: "user",
      entity_id: userId,
    });

    return result;
  });

/**
 * Delete the user's account and all linked personal data.
 * Generated PDFs and finalized documents are kept in anonymized form
 * because of accounting retention requirements (Sztv. 169. §), but all
 * personally identifiable references are stripped.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ confirm: z.literal("TÖRLÉS") }).parse(input))
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Anonymize accounting-relevant rows we must keep
    await supabaseAdmin
      .from("generated_documents")
      .update({
        lessor_name: "(törölt felhasználó)",
        lessee_name: "(törölt felhasználó)",
      })
      .eq("user_id", userId);
    await supabaseAdmin
      .from("payments")
      .update({ user_id: null })
      .eq("user_id", userId);

    // Best-effort delete user-scoped working data
    await supabaseAdmin.from("contract_drafts").delete().eq("user_id", userId);
    await supabaseAdmin.from("document_credits").delete().eq("user_id", userId);
    await supabaseAdmin.from("subscriptions").delete().eq("user_id", userId);
    await supabaseAdmin.from("usage_logs").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    await supabaseAdmin.from("users_profile").delete().eq("user_id", userId);

    // Remove user files from storage (best-effort)
    try {
      const { data: files } = await supabaseAdmin.storage.from("contracts").list(userId);
      if (files && files.length > 0) {
        await supabaseAdmin.storage
          .from("contracts")
          .remove(files.map((f) => `${userId}/${f.name}`));
      }
    } catch {
      // ignore
    }

    // Finally delete the auth user
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delErr) throw new Error("Fiók törlése sikertelen: " + delErr.message);

    return { ok: true as const };
  });