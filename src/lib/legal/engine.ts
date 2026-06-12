/**
 * Szabálymotor + export-kapu.
 * A draft minden ellenőrzése ezen a központi pipeline-on át fut.
 */

import type { Draft } from "@/lib/contracts/types";
import { applicableRules, LEGAL_RULES, type LegalRule } from "./rules";
import { CLAUSE_LIBRARY, clausesFor, type ClauseModule } from "./clauses";
import {
  detectPlaceholdersInDraft,
  detectPlaceholdersInText,
  type PlaceholderHit,
} from "./placeholders";
import { type DraftStatus } from "./status";

export interface RuleFinding {
  ruleId: string;
  title: string;
  level: "informativ" | "warning" | "blocker" | "special_case";
  message: string;
  sourceRefs: string[]; // shortName + section
}

export interface ChecklistItem {
  id: string;
  label: string;
  workflow: boolean;
}

export interface EvaluationResult {
  status: DraftStatus;
  blockers: RuleFinding[];
  warnings: RuleFinding[];
  specialCases: RuleFinding[];
  informational: RuleFinding[];
  requiredClauses: ClauseModule[];
  checklist: ChecklistItem[];
  missingFacts: string[];
  placeholders: PlaceholderHit[];
  needsTwoWitnessesAtSigning: boolean;
  needsNotaryPublication: boolean;
  needsAuthorityApproval: boolean;
}

function refLabel(r: { sourceId: string; section?: string }): string {
  // sources lazily imported to avoid circular
  return r.section ? `${r.sourceId} ${r.section}` : r.sourceId;
}

function findingFromRule(rule: LegalRule, draft: Draft): RuleFinding {
  const blocks = rule.blocksFinalizationWhen(draft);
  const level: RuleFinding["level"] =
    rule.riskLevel === "special_case"
      ? "special_case"
      : blocks
        ? "blocker"
        : rule.riskLevel;
  return {
    ruleId: rule.id,
    title: rule.title,
    level,
    message: rule.title,
    sourceRefs: rule.sourceRefs.map(refLabel),
  };
}

export function evaluateDraft(draft: Draft, compiledText?: string): EvaluationResult {
  const rules = applicableRules(draft);
  const blockers: RuleFinding[] = [];
  const warnings: RuleFinding[] = [];
  const specialCases: RuleFinding[] = [];
  const informational: RuleFinding[] = [];
  const missingFacts: string[] = [];

  for (const r of rules) {
    const f = findingFromRule(r, draft);
    if (r.blocksFinalizationWhen(draft)) {
      if (r.riskLevel === "special_case") specialCases.push(f);
      else blockers.push(f);
      for (const fact of r.requiredFacts) missingFacts.push(`${r.id}:${fact}`);
    } else if (r.riskLevel === "special_case") {
      specialCases.push(f);
    } else if (r.riskLevel === "warning") {
      warnings.push(f);
    } else if (r.riskLevel === "informativ") {
      informational.push(f);
    }
  }

  // Placeholders
  const placeholders: PlaceholderHit[] = [...detectPlaceholdersInDraft(draft)];
  if (compiledText) placeholders.push(...detectPlaceholdersInText(compiledText, "compiled_text"));

  // Required clauses (deduped)
  const requiredIds = new Set<string>();
  for (const r of rules) for (const cid of r.requiredClauses) requiredIds.add(cid);
  // unió a feltételes klauzulákkal
  const conditional = clausesFor(draft).map((c) => c.id);
  for (const id of conditional) requiredIds.add(id);
  const requiredClauses = CLAUSE_LIBRARY.filter((c) => requiredIds.has(c.id));

  // Workflow flags
  const needsNotaryPublication = true; // földforgalmi: hirdetményi közlés alap
  const needsAuthorityApproval = !draft.prelease?.no_prelease_exception;

  const checklist: ChecklistItem[] = [];
  if (needsNotaryPublication) {
    checklist.push({
      id: "wf_notary_publication",
      label: "Aláírt szerződés benyújtása jegyzőhöz közzététel céljából",
      workflow: true,
    });
  }
  if (needsAuthorityApproval) {
    checklist.push({
      id: "wf_authority_approval",
      label: "Mezőgazdasági igazgatási szerv jóváhagyási eljárása",
      workflow: true,
    });
  }
  checklist.push({
    id: "wf_land_use_registry",
    label: "Földhasználat bejelentése a földhasználati nyilvántartásba",
    workflow: true,
  });
  checklist.push({
    id: "two_witnesses",
    label: "Aláírás két teljes adatú tanú jelenlétében",
    workflow: false,
  });

  // Státusz-kapu
  let status: DraftStatus;
  if (specialCases.length > 0) {
    status = "SPECIALIS_UGY_STOP";
  } else if (blockers.length > 0 || placeholders.length > 0) {
    status = "HIANYOS_TERVEZET";
  } else if (needsAuthorityApproval) {
    status = "HATOSAGI_JOVAHAGYASRA_VAR";
  } else if (needsNotaryPublication) {
    status = "JEGYZOI_KOZZETETELRE_VAR";
  } else {
    status = "ALAIHATONAK_TUNO_TERVEZET";
  }

  // Workflow státusz NEM blokkoló: ha minden kritikus adat megvan és nincs placeholder,
  // akkor a "jegyzői/hatósági workflow" státusz is enged aláírható tervezetet generálni.
  // A státuszt mégis megőrizzük tájékoztatás céljából — a kapu az `isBlockingStatus`-t nézi.

  return {
    status,
    blockers,
    warnings,
    specialCases,
    informational,
    requiredClauses,
    checklist,
    missingFacts,
    placeholders,
    needsTwoWitnessesAtSigning: true,
    needsNotaryPublication,
    needsAuthorityApproval,
  };
}

export function summaryForPdf(ev: EvaluationResult): string {
  const lines: string[] = [];
  lines.push(`Státusz: ${ev.status}`);
  if (ev.needsNotaryPublication) {
    lines.push(
      "A szerződés aláírását követően jegyzői közzétételi eljárás szükséges.",
    );
  }
  if (ev.needsAuthorityApproval) {
    lines.push(
      "A szerződés hatályosulásához / földhasználat bejegyzéséhez további hatósági eljárás szükséges lehet.",
    );
  }
  if (ev.blockers.length) {
    lines.push("");
    lines.push("Blokkoló észrevételek:");
    ev.blockers.forEach((b) => lines.push(`- ${b.title} (${b.sourceRefs.join("; ")})`));
  }
  if (ev.specialCases.length) {
    lines.push("");
    lines.push("Speciális ügy — ügyvédi közreműködés szükséges:");
    ev.specialCases.forEach((s) => lines.push(`- ${s.title} (${s.sourceRefs.join("; ")})`));
  }
  if (ev.placeholders.length) {
    lines.push("");
    lines.push("Placeholder-figyelmeztetések:");
    ev.placeholders.forEach((p) => lines.push(`- ${p.field}: ${p.message}`));
  }
  lines.push("");
  lines.push("Checklist:");
  ev.checklist.forEach((c) => lines.push(`- ${c.label}`));
  return lines.join("\n");
}

export const ALL_RULES = LEGAL_RULES;