import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RowSchema = z.object({
  source_notice_id: z.string().min(1).max(64),
  source_attachment_id: z.string().max(64).nullable(),
  original_attachment_url: z.string().url().max(500).nullable(),
  municipality: z.string().max(255).nullable(),
  subject: z.string().max(1000).nullable(),
  settlement: z.string().max(255).nullable(),
  parcel_numbers: z.array(z.string().max(64)).max(50),
  area_raw: z.string().max(64).nullable(),
  area_ha: z.number().nullable(),
  cultivation_branch: z.string().max(255).nullable(),
  rent_raw: z.string().max(255).nullable(),
  rent_normalized_huf_per_ha_year: z.number().nullable(),
  deadline_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  notice_type: z.string().max(64),
});

export const importNotices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ rows: z.array(RowSchema).min(1).max(2000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = data.rows.map((r) => ({
      source: "hirdetmenyek.gov.hu",
      ...r,
      last_fetched_at: new Date().toISOString(),
    }));
    const { error, count } = await supabaseAdmin
      .from("notices")
      .upsert(payload, { onConflict: "source,source_notice_id", count: "exact" });
    if (error) throw new Error(error.message);
    return { imported: count ?? payload.length };
  });