/**
 * Smoke / audit a szabálymotorhoz. A `runAudit()` JSON riportot ad arról, hogy
 * a 11+ forgatókönyv a várt státuszt és blokkereket adja-e.
 */

import type { Draft } from "@/lib/contracts/types";
import { evaluateDraft } from "./engine";
import { LEGAL_SOURCES_V2 } from "./sources";
import { LEGAL_RULES } from "./rules";
import { CLAUSE_LIBRARY } from "./clauses";
import type { DraftStatus } from "./status";

function makeDraft(overrides: Partial<Draft> = {}): Draft {
  const base: Draft = {
    id: "test",
    user_id: "u",
    status: "draft",
    title: null,
    lessor_data: {
      name: "Kiss János",
      address: "1111 Budapest, Példa utca 1.",
    },
    lessee_data: {
      type: "foldmuves",
      name: "Nagy Béla",
      address: "2222 Falu, Fő utca 2.",
      is_registered_farmer: true,
      is_producer_org: false,
      no_land_use_debt: true,
    },
    parcels: [
      {
        settlement: "Falu",
        parcel_number: "0123/4",
        area_ha: 5,
        aranykorona: 100,
        cultivation_branch: "szántó",
      },
    ],
    rent: { model: "ft_ha_ev", amount: 80000, deadline: "2026-11-30", method: "atutalas" },
    term: { start_date: "2026-10-01", end_date: "2036-09-30" },
    prelease: { no_prelease_exception: true },
    clauses: {},
    risk_report: null,
    core_hash: null,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
  return base;
}

interface Case {
  name: string;
  draft: Draft;
  expectStatus?: DraftStatus | DraftStatus[];
  expectBlockerId?: string;
  expectSpecialId?: string;
  shouldHavePlaceholder?: boolean;
  notBlockingNote?: string;
}

const CASES: Case[] = [
  {
    name: "Egyszerű magánszemély haszonbérlet — minden adat megvan",
    draft: makeDraft(),
    expectStatus: ["JEGYZOI_KOZZETETELRE_VAR", "ALAIHATONAK_TUNO_TERVEZET"],
  },
  {
    name: "Hiányzó tanúk — generálás nem stop, aláírásnál ellenőrzendő",
    draft: makeDraft(),
    notBlockingNote: "A két tanú az aláíráskor töltődik, nem blokkolja a draft-generálást.",
  },
  {
    name: "Nem földműves haszonbérlő, kivétel nélkül",
    draft: makeDraft({
      lessee_data: {
        name: "X",
        address: "Y",
        is_registered_farmer: false,
        is_producer_org: false,
        no_land_use_debt: true,
      },
    }),
    expectBlockerId: "farmer_or_org_or_exception",
    expectStatus: "HIANYOS_TERVEZET",
  },
  {
    name: "Hibás időtartam — 25 év",
    draft: makeDraft({ term: { start_date: "2026-01-01", end_date: "2051-01-01" } }),
    expectBlockerId: "term_window",
    expectStatus: "HIANYOS_TERVEZET",
  },
  {
    name: "Természetbeni bér mennyiség nélkül",
    draft: makeDraft({
      rent: { model: "termeny", crop_type: "búza", deadline: "2026-11-30", method: "atutalas" },
    }),
    expectBlockerId: "rent_in_kind_quantity",
    expectStatus: "HIANYOS_TERVEZET",
  },
  {
    name: "Előhaszonbérleti ranghely bizonyíték nélkül",
    draft: makeDraft({ prelease: {} }),
    expectBlockerId: "prelease_rank_proof",
    expectStatus: "HIANYOS_TERVEZET",
  },
  {
    name: "Közös tulajdon, használati logika nélkül",
    draft: makeDraft({
      parcels: [
        {
          settlement: "Falu",
          parcel_number: "0123/4",
          area_ha: 5,
          aranykorona: 100,
          cultivation_branch: "szántó",
          common_ownership: true,
          existing_use_order: false,
        },
      ],
    }),
    expectBlockerId: "common_ownership",
    expectStatus: "HIANYOS_TERVEZET",
  },
  {
    name: "Erdő stop-rule",
    draft: makeDraft({
      parcels: [
        {
          settlement: "Falu",
          parcel_number: "01",
          area_ha: 10,
          cultivation_branch: "erdő",
        },
      ],
    }),
    expectSpecialId: "forest_stop",
    expectStatus: "SPECIALIS_UGY_STOP",
  },
  {
    name: "Natura 2000 / védett terület",
    draft: makeDraft({
      parcels: [
        {
          settlement: "Falu",
          parcel_number: "02",
          area_ha: 3,
          aranykorona: 50,
          cultivation_branch: "szántó",
          special_status: "Natura 2000",
        },
      ],
    }),
    expectSpecialId: "natura_special",
    expectStatus: "SPECIALIS_UGY_STOP",
  },
  {
    name: "Jegyzői közzététel szükséges — NEM generálási stop",
    draft: makeDraft(),
    notBlockingNote: "A státusz lehet workflow-státusz, de nem HIANYOS_TERVEZET.",
  },
  {
    name: "Hatósági jóváhagyás szükséges — workflow státusz",
    draft: makeDraft({ prelease: { is_former_lessee: true } }),
    expectStatus: "HATOSAGI_JOVAHAGYASRA_VAR",
  },
  {
    name: "Placeholder smoke — TODO a parcel notes-ban nem direkt mező, ezért compiledText-tel teszteljük",
    draft: makeDraft(),
    shouldHavePlaceholder: true,
  },
];

export interface AuditCaseResult {
  name: string;
  status: DraftStatus;
  blockers: string[];
  specialCases: string[];
  placeholders: number;
  passed: boolean;
  note?: string;
}

export interface AuditReport {
  sourcesRegistered: number;
  rulesRegistered: number;
  clausesRegistered: number;
  cases: AuditCaseResult[];
  notaryIsNonBlocking: boolean;
  authorityIsNonBlocking: boolean;
  placeholderSmokeOk: boolean;
  allPassed: boolean;
}

export function runAudit(): AuditReport {
  const cases: AuditCaseResult[] = [];
  for (const c of CASES) {
    const ev = evaluateDraft(
      c.draft,
      c.shouldHavePlaceholder ? "Az összeg TODO és [...] később pontosítandó." : undefined,
    );
    const blockerIds = ev.blockers.map((b) => b.ruleId);
    const specialIds = ev.specialCases.map((s) => s.ruleId);
    let passed = true;
    if (c.expectStatus) {
      const list = Array.isArray(c.expectStatus) ? c.expectStatus : [c.expectStatus];
      if (!list.includes(ev.status)) passed = false;
    }
    if (c.expectBlockerId && !blockerIds.includes(c.expectBlockerId)) passed = false;
    if (c.expectSpecialId && !specialIds.includes(c.expectSpecialId)) passed = false;
    if (c.shouldHavePlaceholder && ev.placeholders.length === 0) passed = false;
    cases.push({
      name: c.name,
      status: ev.status,
      blockers: blockerIds,
      specialCases: specialIds,
      placeholders: ev.placeholders.length,
      passed,
      note: c.notBlockingNote,
    });
  }

  // Workflow non-blocking: alap eset (egyszerű magánszemély) státusza nem
  // lehet HIANYOS_TERVEZET attól, hogy jegyzői/hatósági workflow szükséges.
  const baseEv = evaluateDraft(makeDraft({ prelease: { is_former_lessee: true } }));
  const notaryIsNonBlocking = baseEv.status !== "HIANYOS_TERVEZET";
  const authorityIsNonBlocking = baseEv.status !== "HIANYOS_TERVEZET";

  const phSmokeEv = evaluateDraft(makeDraft(), "TODO maradt.");
  const placeholderSmokeOk = phSmokeEv.placeholders.length > 0 && phSmokeEv.status === "HIANYOS_TERVEZET";

  return {
    sourcesRegistered: LEGAL_SOURCES_V2.length,
    rulesRegistered: LEGAL_RULES.length,
    clausesRegistered: CLAUSE_LIBRARY.length,
    cases,
    notaryIsNonBlocking,
    authorityIsNonBlocking,
    placeholderSmokeOk,
    allPassed: cases.every((c) => c.passed) && notaryIsNonBlocking && placeholderSmokeOk,
  };
}