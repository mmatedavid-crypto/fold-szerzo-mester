import type { Draft } from "./types";
import { preLeaseRank, rentDescription, allLessors } from "./logic";
import {
  auditLeaseDraftAgainstRuleset,
  LEASE_CONTRACT_REQUIREMENTS,
  legalAuditText,
  legalSourcesSummary,
  LEGAL_RULESET_VERSION,
} from "@/lib/legal/ruleset";
import { companyLegalDisclaimer, companyLegalLine } from "@/lib/company";
import { evaluateDraft, summaryForPdf } from "@/lib/legal/engine";
import { STATUS_LABEL } from "@/lib/legal/status";

type Clause = { clause_key: string; title: string; text: string; sort_order: number };

function substitute(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

function value(
  v: string | number | boolean | null | undefined,
  fallback = "____________________",
): string {
  if (typeof v === "boolean") return v ? "igen" : "nem";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : fallback;
  return v?.toString().trim() ? v.toString().trim() : fallback;
}

function lesseeDeclarationBlock(draft: Draft): string {
  const E = draft.lessee_data ?? {};
  return [
    "Haszonbérlő a Földforgalmi tv. földhasználati jogosultság megszerzésére vonatkozó szabályaira figyelemmel az alábbi nyilatkozatokat teszi:",
    "",
    `Földműves nyilvántartási státusz: ${value(E.is_registered_farmer)}.`,
    `Mezőgazdasági termelőszervezet: ${value(E.is_producer_org)}.`,
    `Átlátható szervezet, ha termelőszervezetként jár el: ${value(E.is_transparent)}.`,
    `Földműves / őstermelői / termelőszervezeti azonosító: ${value(E.farmer_registry_number ?? E.ostermelo_number ?? E.company_reg_number)}.`,
    `Földhasználati díjtartozása nincs: ${value(E.no_land_use_debt)}.`,
    "",
    "Haszonbérlő vállalja, hogy a szerződés fennállása alatt a földhasználati jogosultság megszerzésének jogszabályi feltételeinek megfelel, a föld használatát jogszabályban megengedett eset kivételével másnak nem engedi át, azt maga használja, és eleget tesz a földhasznosítási kötelezettségének.",
    "Ha a haszonbérlő újonnan alapított mezőgazdasági termelőszervezetként vagy más különös jogcímen jár el, az ehhez kapcsolódó többletvállalásokat és igazolásokat külön ellenőrizni kell.",
  ].join("\n");
}

function preLeaseProofBlock(pre: ReturnType<typeof preLeaseRank>): string {
  return [
    `Megjelölt ranghely: ${pre.rank}`,
    `Jogalap: ${pre.basis}`,
    "",
    "A jogalap igazolásához javasolt okiratok:",
    ...pre.proofs.map((proof, index) => `${index + 1}. ${proof}`),
    "",
    "A szerződő felek tudomásul veszik, hogy előhaszonbérleti jogosult elfogadó jognyilatkozata esetén a jogalap, a törvény szerinti sorrend és az igazoló okiratok vizsgálata a hatósági eljárás része lehet.",
  ].join("\n");
}

function proceduralBlock(): string {
  return [
    "A felek tudomásul veszik, hogy a haszonbérleti szerződés a Földforgalmi tv. szerinti esetekben hirdetményi közléshez, előhaszonbérleti eljáráshoz és mezőgazdasági igazgatási szerv általi jóváhagyáshoz kötött lehet.",
    "A haszonbérbeadó köteles a haszonbérleti szerződést az előhaszonbérletre jogosultakkal történő közlés érdekében a jogszabályban meghatározott határidőben a föld fekvése szerint illetékes jegyzőhöz továbbítani.",
    "A szerződés hatályosulása, az előhaszonbérleti jogosult belépése, illetve a hatósági jóváhagyás megtagadása a jogszabályi eljárás eredményétől függhet.",
  ].join("\n\n");
}

function signatureBlock(draft: Draft): string {
  const lessors = allLessors(draft.lessor_data);
  return [
    "A felek kijelentik, hogy a szerződést elolvasták, megértették, és mint akaratukkal mindenben megegyezőt írják alá.",
    "A dokumentum aláírási és benyújtási formáját az ügy körülményeihez kell igazítani. Teljes bizonyító erejű magánokirati, ügyvédi ellenjegyzett, közokirati vagy hiteles elektronikus forma szükségessége külön ellenőrizendő.",
    "",
    "Kelt: ____________________, ____________________",
    "",
    ...lessors.flatMap((lessor, index) => [
      `${lessors.length > 1 ? `${index + 1}. ` : ""}Haszonbérbeadó:`,
      "________________________________",
      value(lessor.name, "név"),
      "",
    ]),
    "Haszonbérlő:",
    "________________________________",
    value(draft.lessee_data?.name, "név"),
    "",
    "Tanúk / ellenjegyzés / hiteles elektronikus aláírás adatai:",
    "1. tanú neve, lakcíme, aláírása: ____________________",
    "2. tanú neve, lakcíme, aláírása: ____________________",
  ].join("\n");
}

export function composeContract(
  draft: Draft,
  clauses: Clause[],
): { title: string; sections: { title: string; text: string }[] } {
  const L = draft.lessor_data ?? {};
  const lessors = allLessors(L);
  const E = draft.lessee_data ?? {};
  const parcels = draft.parcels ?? [];
  const r = draft.rent ?? {};
  const t = draft.term ?? {};
  const pre = preLeaseRank(draft.prelease ?? {});

  const parcels_block = parcels
    .map(
      (p, i) =>
        `${i + 1}. ${p.settlement ?? ""} ${p.location_type ?? ""}, helyrajzi szám: ${p.parcel_number ?? ""}, terület: ${p.area_ha ?? ""} ha, művelési ág: ${p.cultivation_branch ?? ""}, aranykorona: ${p.aranykorona ?? "—"}`,
    )
    .join("\n");

  const vars: Record<string, string> = {
    lessor_name: lessors
      .map((x) => x.name)
      .filter(Boolean)
      .join("; "),
    lessor_address: lessors
      .map((x) => x.address)
      .filter(Boolean)
      .join("; "),
    lessor_tax: L.tax_id ?? L.company_tax_number ?? "",
    lessor_block: lessors
      .map((x, i) => {
        const idx = lessors.length > 1 ? `${i + 1}. ` : "";
        const share = x.ownership_share ? ` (tulajdoni hányad: ${x.ownership_share})` : "";
        const tax = x.tax_id ? `, adóazonosító: ${x.tax_id}` : "";
        return `${idx}${x.name ?? ""} (lakcím/székhely: ${x.address ?? ""}${tax})${share}`;
      })
      .join("\n"),
    lessee_name: E.name ?? "",
    lessee_address: E.address ?? "",
    lessee_tax: E.tax_id ?? "",
    parcels_block,
    term_start: t.start_date ?? "",
    term_end: t.end_date ?? "",
    first_economic_year: t.first_economic_year ?? "",
    possession_date: t.possession_date ?? "",
    rent_description: rentDescription(r),
    rent_deadline: r.deadline ?? "",
    rent_method: r.method ?? "",
    rent_method_text: rentMethodText(r),
    rent_cash_exemption_text: rentCashExemptionText(r),
    rent_bank_account_text: r.bank_account
      ? ` A haszonbér a bérbeadó ${r.bank_account} számú bankszámlájára teljesítendő.`
      : "",
    rent_indexation:
      r.indexation === "ksh"
        ? "A díj a KSH inflációs adatai szerint évente felülvizsgálható."
        : r.indexation === "fixed"
          ? `A díj évente ${r.fixed_pct ?? 0}%-kal emelkedik.`
          : r.indexation === "custom"
            ? "A díj egyedi indexálási rendelkezés szerint kerül módosításra."
            : "",
    prelease_rank: pre.rank,
    prelease_basis: pre.basis,
  };

  const ordered = [...clauses].sort((a, b) => a.sort_order - b.sort_order);
  const sections = ordered.map((c) => ({ title: c.title, text: substitute(c.text, vars) }));
  sections.push(
    {
      title: "Haszonbérlő kötelező földforgalmi nyilatkozatai",
      text: lesseeDeclarationBlock(draft),
    },
    {
      title: "Előhaszonbérleti jogalap, ranghely és igazolások",
      text: preLeaseProofBlock(pre),
    },
    {
      title: "Hirdetményi közlés, jegyzői továbbítás és hatósági jóváhagyás",
      text: proceduralBlock(),
    },
    {
      title: "Keltezés, aláírás és okirati forma",
      text: signatureBlock(draft),
    },
  );
  const legalAudit = auditLeaseDraftAgainstRuleset(draft);
  sections.push({
    title: "Jogszabályi alap és ellenőrzési nyom",
    text: [
      `Ruleset verzió: ${LEGAL_RULESET_VERSION}`,
      "",
      "Felhasznált jogszabályi források:",
      legalSourcesSummary(),
      "",
      "Dokumentum-ellenőrzési pontok:",
      ...LEASE_CONTRACT_REQUIREMENTS.map((req) => `- ${req.label}: ${req.legalRefs.join("; ")}`),
      "",
      "Draft audit:",
      legalAuditText(legalAudit),
      "",
      companyLegalDisclaimer,
      companyLegalLine,
    ].join("\n"),
  });

  // Új motor: státusz + workflow checklist
  const evaluation = evaluateDraft(draft);
  sections.push({
    title: `Státusz és eljárási checklist — ${STATUS_LABEL[evaluation.status]}`,
    text: summaryForPdf(evaluation),
  });
  return { title: "TERMŐFÖLD HASZONBÉRLETI SZERZŐDÉS", sections };
}
