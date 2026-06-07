import type { Draft } from "./types";
import { preLeaseRank, rentDescription } from "./logic";

type Clause = { clause_key: string; title: string; text: string; sort_order: number };

function substitute(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

export function composeContract(draft: Draft, clauses: Clause[]): { title: string; sections: { title: string; text: string }[] } {
  const L = draft.lessor_data ?? {};
  const E = draft.lessee_data ?? {};
  const parcels = draft.parcels ?? [];
  const r = draft.rent ?? {};
  const t = draft.term ?? {};
  const pre = preLeaseRank(draft.prelease ?? {});

  const parcels_block = parcels
    .map((p, i) => `${i + 1}. ${p.settlement ?? ""} ${p.location_type ?? ""}, helyrajzi szám: ${p.parcel_number ?? ""}, terület: ${p.area_ha ?? ""} ha, művelési ág: ${p.cultivation_branch ?? ""}, aranykorona: ${p.aranykorona ?? "—"}`)
    .join("\n");

  const vars: Record<string, string> = {
    lessor_name: L.name ?? "",
    lessor_address: L.address ?? "",
    lessor_tax: L.tax_id ?? L.company_tax_number ?? "",
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
    rent_indexation: r.indexation === "ksh" ? "A díj a KSH inflációs adatai szerint évente felülvizsgálható."
      : r.indexation === "fixed" ? `A díj évente ${r.fixed_pct ?? 0}%-kal emelkedik.`
      : r.indexation === "custom" ? "A díj egyedi indexálási rendelkezés szerint kerül módosításra." : "",
    prelease_rank: pre.rank,
    prelease_basis: pre.basis,
  };

  const ordered = [...clauses].sort((a, b) => a.sort_order - b.sort_order);
  const sections = ordered.map((c) => ({ title: c.title, text: substitute(c.text, vars) }));
  return { title: "TERMŐFÖLD HASZONBÉRLETI SZERZŐDÉS", sections };
}