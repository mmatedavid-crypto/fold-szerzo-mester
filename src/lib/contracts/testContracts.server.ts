/**
 * Server-only helper that generates 3 fictional but realistic lease contract
 * PDFs, uploads them to the private `contracts` storage bucket, signs 7-day
 * download URLs, and enqueues one summary email to the configured lawyer.
 *
 * Reused by both the admin-only server fn (`testContracts.functions.ts`) and
 * the secret-gated public hook (`/api/public/admin/send-test-contracts`).
 */
import type { Draft } from "./types";
import { LEGAL_RULESET_VERSION, LEASE_CLAUSE_VERSION } from "@/lib/legal/ruleset";
import { company } from "@/lib/company";

function makeDraft(
  id: string,
  partial: Partial<Draft> &
    Pick<Draft, "lessor_data" | "lessee_data" | "parcels" | "rent" | "term">,
): Draft {
  return {
    id,
    user_id: "test-fixture",
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    prelease: {},
    ...partial,
  } as Draft;
}

export const TEST_CONTRACT_SAMPLES: Array<{ title: string; summary: string; draft: Draft }> = [
  {
    title: "Magán bérbeadó · 1 hrsz · Ft/ha/év",
    summary:
      "Egyéni földtulajdonos, egy szántó parcella Hejőkürtön, 5 év, fix 95.000 Ft/ha/év díj, KSH-indexálás.",
    draft: makeDraft("11111111-1111-1111-1111-111111111111", {
      lessor_data: {
        type: "magan",
        name: "Kovács István",
        address: "3593 Hejőkürt, Petőfi Sándor utca 14.",
        birth_name: "Kovács István",
        mother_name: "Tóth Mária",
        birth_place: "Miskolc",
        birth_date: "1962-04-18",
        tax_id: "8412345672",
        ownership_share: "1/1",
      },
      lessee_data: {
        type: "foldmuves",
        name: "Nagy Péter",
        address: "3580 Tiszaújváros, Szent István út 23.",
        tax_id: "8523456783",
        farmer_registry_number: "FM-2019-00417",
        is_registered_farmer: true,
        is_transparent: true,
        no_land_use_debt: true,
      },
      parcels: [
        {
          settlement: "Hejőkürt",
          county: "Borsod-Abaúj-Zemplén",
          parcel_number: "0142/7",
          location_type: "kulterulet",
          cultivation_branch: "szántó",
          area_ha: 4.82,
          area_m2: 48200,
          aranykorona: 96.4,
          ownership_share: "1/1",
          full_parcel: true,
        },
      ],
      rent: {
        model: "ft_ha_ev",
        amount: 95000,
        unit: "Ft/ha/év",
        deadline: "tárgyév november 30.",
        method: "atutalas",
        bank_account: "11773016-12345678-00000000",
        payer: "Haszonbérlő",
        indexation: "ksh",
      },
      term: {
        start_date: "2026-09-01",
        end_date: "2031-08-31",
        first_economic_year: "2026/2027",
        possession_date: "2026-09-01",
      },
      prelease: {},
    }),
  },
  {
    title: "Társtulajdonosok · 2 hrsz · Ft/AK/év",
    summary:
      "Két társtulajdonos (1/2-1/2), Bács-Kiskun megyei szántó és gyümölcsös, 10 év, 1.350 Ft/AK/év.",
    draft: makeDraft("22222222-2222-2222-2222-222222222222", {
      lessor_data: {
        type: "tobbi_tulajdonos",
        name: "Szabó Erzsébet",
        address: "6041 Kerekegyháza, Rákóczi utca 8.",
        birth_name: "Varga Erzsébet",
        mother_name: "Kiss Margit",
        birth_place: "Kecskemét",
        birth_date: "1955-07-22",
        tax_id: "8345671234",
        ownership_share: "1/2",
        co_lessors: [
          {
            type: "tobbi_tulajdonos",
            name: "Varga László",
            address: "1149 Budapest, Bosnyák tér 4.",
            birth_name: "Varga László",
            mother_name: "Kiss Margit",
            birth_place: "Kecskemét",
            birth_date: "1958-03-04",
            tax_id: "8367892341",
            ownership_share: "1/2",
          },
        ],
      },
      lessee_data: {
        type: "termeloszervezet",
        name: "Homokhát Agrár Kft.",
        address: "6041 Kerekegyháza, Ipari park 3.",
        tax_id: "27894561-2-03",
        company_reg_number: "03-09-298765",
        representative: "Tóth Gábor ügyvezető",
        is_producer_org: true,
        is_transparent: true,
        no_land_use_debt: true,
      },
      parcels: [
        {
          settlement: "Kerekegyháza",
          county: "Bács-Kiskun",
          parcel_number: "0273/12",
          location_type: "kulterulet",
          cultivation_branch: "szántó",
          area_ha: 12.74,
          area_m2: 127400,
          aranykorona: 178.4,
          ownership_share: "1/1",
          full_parcel: true,
        },
        {
          settlement: "Kerekegyháza",
          county: "Bács-Kiskun",
          parcel_number: "0273/15",
          location_type: "kulterulet",
          cultivation_branch: "gyümölcsös",
          area_ha: 2.16,
          area_m2: 21600,
          aranykorona: 41.0,
          ownership_share: "1/1",
          full_parcel: true,
        },
      ],
      rent: {
        model: "ft_ak_ev",
        amount: 1350,
        unit: "Ft/AK/év",
        deadline: "tárgyév december 15.",
        method: "atutalas",
        bank_account: "10918001-00000123-87654321",
        payer: "Haszonbérlő",
        indexation: "fixed",
        fixed_pct: 3,
      },
      term: {
        start_date: "2026-10-01",
        end_date: "2036-09-30",
        first_economic_year: "2026/2027",
        possession_date: "2026-10-01",
      },
      prelease: {},
    }),
  },
  {
    title: "Őstermelő bérlő · terményben · 7 év",
    summary:
      "Tolnai szántó, díjazás terményben (búza, 800 kg/AK/év) minimum készpénzhányaddal.",
    draft: makeDraft("33333333-3333-3333-3333-333333333333", {
      lessor_data: {
        type: "magan",
        name: "Horváth Anna",
        address: "7100 Szekszárd, Béri Balogh Ádám u. 7.",
        birth_name: "Horváth Anna",
        mother_name: "Németh Ilona",
        birth_place: "Szekszárd",
        birth_date: "1971-11-09",
        tax_id: "8456712345",
        ownership_share: "1/1",
      },
      lessee_data: {
        type: "ostermelo",
        name: "Molnár Tamás",
        address: "7140 Bátaszék, Kossuth Lajos u. 32.",
        tax_id: "8534127896",
        ostermelo_number: "OT-2021-019847",
        is_registered_farmer: true,
        is_transparent: true,
        no_land_use_debt: true,
        is_young_farmer: true,
      },
      parcels: [
        {
          settlement: "Bátaszék",
          county: "Tolna",
          parcel_number: "0418/3",
          location_type: "kulterulet",
          cultivation_branch: "szántó",
          area_ha: 7.91,
          area_m2: 79100,
          aranykorona: 198.2,
          ownership_share: "1/1",
          full_parcel: true,
        },
      ],
      rent: {
        model: "termeny",
        crop_type: "étkezési búza",
        kg_per_ak: 8,
        min_cash: 50000,
        unit: "kg búza / AK / év",
        deadline: "betakarítást követő 30. nap",
        method: "vegyes",
        bank_account: "11600006-00000000-12345678",
        payer: "Haszonbérlő",
        indexation: "none",
      },
      term: {
        start_date: "2026-09-15",
        end_date: "2033-09-14",
        first_economic_year: "2026/2027",
        possession_date: "2026-09-15",
      },
      prelease: {},
    }),
  },
];

export async function runTestContractsToLawyer(): Promise<{
  recipient: string;
  enqueue: unknown;
  contracts: Array<{ documentNumber: string; title: string; downloadUrl: string }>;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { composeContract } = await import("./compose.server");
  const { renderContractPdf } = await import("./pdf.server");
  const { enqueueTransactionalEmail } = await import("@/lib/email/enqueue.server");

  const { data: tpl, error: tplErr } = await supabaseAdmin
    .from("legal_template_versions")
    .select("*")
    .eq("status", "active")
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();
  if (tplErr || !tpl) throw new Error("Nincs aktív sablonverzió.");
  const { data: clauseRows, error: clErr } = await supabaseAdmin
    .from("clauses")
    .select("clause_key, title, text, sort_order")
    .eq("legal_template_version_id", tpl.id)
    .eq("active", true);
  if (clErr) throw new Error(clErr.message);

  const clauseKeys = (clauseRows ?? []).map((c) => c.clause_key);
  const { data: overrides } = await supabaseAdmin
    .from("clause_overrides")
    .select("clause_id, title, body_template")
    .in("clause_id", clauseKeys);
  const overrideByKey = new Map<string, { title: string | null; body_template: string | null }>();
  for (const ov of (overrides ?? []) as Array<{
    clause_id: string;
    title: string | null;
    body_template: string | null;
  }>) {
    overrideByKey.set(ov.clause_id, ov);
  }
  const mergedClauses = (clauseRows ?? []).map((c) => {
    const ov = overrideByKey.get(c.clause_key);
    return {
      clause_key: c.clause_key,
      title: ov?.title ?? c.title,
      text: ov?.body_template ?? c.text,
      sort_order: c.sort_order,
    };
  });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const generated: Array<{
    title: string;
    summary: string;
    documentNumber: string;
    downloadUrl: string;
  }> = [];

  for (let i = 0; i < TEST_CONTRACT_SAMPLES.length; i++) {
    const s = TEST_CONTRACT_SAMPLES[i];
    const composed = composeContract(s.draft, mergedClauses);
    const documentNumber = `FBSZ-TEST-${stamp.slice(0, 19)}-${i + 1}`;
    const verificationUrl = `${company.websiteUrl}/dokumentum-ellenorzes?id=${documentNumber}`;
    const pdfBytes = await renderContractPdf({
      documentNumber,
      documentHash: "TEST",
      templateVersion: `${tpl.version} / ${LEGAL_RULESET_VERSION}`,
      clauseVersion: `${tpl.version} / ${LEASE_CLAUSE_VERSION}`,
      generatedAt: new Date(),
      title: composed.title,
      sections: composed.sections,
      verificationUrl,
      watermark: "TESZT — ÜGYVÉDI ÁTNÉZÉSRE",
    });
    const path = `test-contracts/${stamp}/${i + 1}-${documentNumber}.pdf`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("contracts")
      .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });
    if (upErr) throw new Error(`PDF feltöltés sikertelen: ${upErr.message}`);
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("contracts")
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (sErr || !signed) throw new Error(`Aláírt URL hiba: ${sErr?.message ?? "ismeretlen"}`);
    generated.push({
      title: s.title,
      summary: s.summary,
      documentNumber,
      downloadUrl: signed.signedUrl,
    });
  }

  const result = await enqueueTransactionalEmail({
    templateName: "test-contracts-for-lawyer",
    recipientEmail: company.lawyerEmail,
    idempotencyKey: `test-contracts-${stamp}`,
    templateData: {
      lawyerName: company.lawyerName,
      generatedAt: new Date().toLocaleString("hu-HU", { timeZone: "Europe/Budapest" }),
      linkExpiresIn: "7 nap",
      contracts: generated,
    },
  });

  return {
    recipient: company.lawyerEmail,
    enqueue: result,
    contracts: generated,
  };
}