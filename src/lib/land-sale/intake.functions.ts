import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { enqueueTransactionalEmail } from "@/lib/email/enqueue.server";
import { company } from "@/lib/company";

const ROLE_LABELS: Record<string, string> = {
  seller: "Eladó",
  buyer: "Vevő",
  both: "Mindkettő (közvetítés)",
  other: "Egyéb",
};

const schema = z.object({
  fullName: z.string().trim().min(2, "Add meg a teljes neved.").max(120),
  email: z.string().trim().email("Érvényes e-mail címet adj meg.").max(255),
  phone: z.string().trim().max(60).optional().or(z.literal("")),
  roleInDeal: z.enum(["seller", "buyer", "both", "other"]),
  settlement: z.string().trim().max(120).optional().or(z.literal("")),
  parcelNumbers: z.string().trim().max(500).optional().or(z.literal("")),
  areaHa: z
    .union([z.number().positive().max(100000), z.literal("")])
    .optional(),
  cultivationBranch: z.string().trim().max(120).optional().or(z.literal("")),
  priceHuf: z
    .union([z.number().positive().max(100_000_000_000), z.literal("")])
    .optional(),
  counterpartyName: z.string().trim().max(120).optional().or(z.literal("")),
  counterpartyContact: z.string().trim().max(255).optional().or(z.literal("")),
  preferredContact: z.string().trim().max(255).optional().or(z.literal("")),
  notes: z.string().trim().max(3000).optional().or(z.literal("")),
});

export const submitLandSaleIntake = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const cleanStr = (v: string | undefined | null) => {
      if (v === undefined || v === null) return null;
      const t = String(v).trim();
      return t.length === 0 ? null : t;
    };
    const cleanNum = (v: number | "" | undefined) =>
      typeof v === "number" && Number.isFinite(v) ? v : null;

    const { data: inserted, error } = await supabaseAdmin
      .from("land_sale_intakes")
      .insert({
        full_name: data.fullName,
        email: data.email.toLowerCase(),
        phone: cleanStr(data.phone as string | undefined),
        role_in_deal: data.roleInDeal,
        settlement: cleanStr(data.settlement as string | undefined),
        parcel_numbers: cleanStr(data.parcelNumbers as string | undefined),
        area_ha: cleanNum(data.areaHa as number | "" | undefined),
        cultivation_branch: cleanStr(data.cultivationBranch as string | undefined),
        price_huf: cleanNum(data.priceHuf as number | "" | undefined),
        counterparty_name: cleanStr(data.counterpartyName as string | undefined),
        counterparty_contact: cleanStr(data.counterpartyContact as string | undefined),
        preferred_contact: cleanStr(data.preferredContact as string | undefined),
        notes: cleanStr(data.notes as string | undefined),
        assigned_lawyer_email: company.lawyerEmail,
      })
      .select("id, created_at")
      .single();

    if (error || !inserted) {
      throw new Error(error?.message ?? "Nem sikerült rögzíteni a megkeresést.");
    }

    const fmtPrice = (n: number | null) =>
      n === null ? undefined : n.toLocaleString("hu-HU");
    const fmtArea = (n: number | null) =>
      n === null ? undefined : n.toLocaleString("hu-HU");

    await enqueueTransactionalEmail({
      templateName: "land-sale-intake",
      recipientEmail: company.lawyerEmail,
      idempotencyKey: `land-sale-intake:${inserted.id}`,
      fromLabel: "Dr Föld űrlap",
      templateData: {
        fullName: data.fullName,
        email: data.email,
        phone: cleanStr(data.phone as string | undefined) ?? undefined,
        roleLabel: ROLE_LABELS[data.roleInDeal] ?? data.roleInDeal,
        settlement: cleanStr(data.settlement as string | undefined) ?? undefined,
        parcelNumbers: cleanStr(data.parcelNumbers as string | undefined) ?? undefined,
        areaHa: fmtArea(cleanNum(data.areaHa as number | "" | undefined)),
        cultivationBranch:
          cleanStr(data.cultivationBranch as string | undefined) ?? undefined,
        priceHuf: fmtPrice(cleanNum(data.priceHuf as number | "" | undefined)),
        counterpartyName:
          cleanStr(data.counterpartyName as string | undefined) ?? undefined,
        counterpartyContact:
          cleanStr(data.counterpartyContact as string | undefined) ?? undefined,
        preferredContact:
          cleanStr(data.preferredContact as string | undefined) ?? undefined,
        notes: cleanStr(data.notes as string | undefined) ?? undefined,
        intakeId: inserted.id,
        submittedAt: new Date(inserted.created_at).toLocaleString("hu-HU"),
      },
    });

    return { ok: true as const, intakeId: inserted.id };
  });