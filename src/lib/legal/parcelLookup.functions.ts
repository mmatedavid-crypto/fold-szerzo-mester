import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const OENY = "https://www.oeny.hu/hk-api";

const InputSchema = z.object({
  settlement: z.string().trim().min(1).max(120),
  lotNumber: z.string().trim().min(1).max(40),
});

export type ParcelLookupResult = {
  ok: boolean;
  status: "found" | "settlement_not_found" | "lot_not_found" | "ambiguous_settlement" | "error";
  message: string;
  kshCode?: string;
  settlementName?: string;
  exactMatch?: { id: number; lotNumber: string };
  suggestions?: { id: number; lotNumber: string }[];
  source: "oeny.hu/hk-api";
  checkedAt: string;
};

async function j(url: string) {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`oeny ${r.status}`);
  return r.json();
}

export const lookupParcel = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<ParcelLookupResult> => {
    const checkedAt = new Date().toISOString();
    try {
      const settlements = (await j(
        `${OENY}/settlements/search?searchString=${encodeURIComponent(data.settlement)}`,
      )) as { kshCode: string; name: string }[];

      if (!settlements.length) {
        return {
          ok: false,
          status: "settlement_not_found",
          message: `A "${data.settlement}" település nem található a hivatalos nyilvántartásban.`,
          source: "oeny.hu/hk-api",
          checkedAt,
        };
      }

      const norm = (s: string) => s.toLocaleLowerCase("hu").trim();
      const exact = settlements.find((s) => norm(s.name) === norm(data.settlement));
      const picked = exact ?? (settlements.length === 1 ? settlements[0] : null);

      if (!picked) {
        return {
          ok: false,
          status: "ambiguous_settlement",
          message: `Több település is illeszkedik: ${settlements.slice(0, 5).map((s) => s.name).join(", ")}. Pontosítsd a település nevét.`,
          suggestions: settlements.slice(0, 5).map((s, i) => ({ id: i, lotNumber: s.name })),
          source: "oeny.hu/hk-api",
          checkedAt,
        };
      }

      const parcels = (await j(
        `${OENY}/parcels/search?kshCode=${picked.kshCode}&lotNumber=${encodeURIComponent(data.lotNumber)}`,
      )) as { id: number; lotNumber: string }[];

      const exactLot = parcels.find((p) => p.lotNumber === data.lotNumber);

      if (exactLot) {
        return {
          ok: true,
          status: "found",
          message: `HRSZ találat: ${picked.name} ${exactLot.lotNumber}.`,
          kshCode: picked.kshCode,
          settlementName: picked.name,
          exactMatch: exactLot,
          source: "oeny.hu/hk-api",
          checkedAt,
        };
      }

      return {
        ok: false,
        status: "lot_not_found",
        message: parcels.length
          ? `Pontos egyezés nincs (${picked.name} ${data.lotNumber}). Hasonló HRSZ-ek: ${parcels.slice(0, 5).map((p) => p.lotNumber).join(", ")}.`
          : `${picked.name} településen nincs ilyen HRSZ: ${data.lotNumber}.`,
        kshCode: picked.kshCode,
        settlementName: picked.name,
        suggestions: parcels.slice(0, 8),
        source: "oeny.hu/hk-api",
        checkedAt,
      };
    } catch (e) {
      return {
        ok: false,
        status: "error",
        message: `HRSZ-ellenőrzés átmenetileg nem elérhető (${(e as Error).message}).`,
        source: "oeny.hu/hk-api",
        checkedAt,
      };
    }
  });