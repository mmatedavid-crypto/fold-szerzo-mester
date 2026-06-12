import { describe, it, expect } from "vitest";
import { runAudit } from "./audit";
import { FORBIDDEN_STATUS_LABELS, assertAllowedStatus } from "./status";

describe("legal rule engine audit", () => {
  const report = runAudit();

  it("regisztrál minden forrást, szabályt és klauzulát", () => {
    expect(report.sourcesRegistered).toBeGreaterThanOrEqual(10);
    expect(report.rulesRegistered).toBeGreaterThanOrEqual(16);
    expect(report.clausesRegistered).toBeGreaterThanOrEqual(22);
  });

  it("a jegyzői közzététel NEM generálási blokkoló", () => {
    expect(report.notaryIsNonBlocking).toBe(true);
  });

  it("a hatósági jóváhagyás NEM generálási blokkoló", () => {
    expect(report.authorityIsNonBlocking).toBe(true);
  });

  it("placeholder smoke érzékeli a TODO mintát és HIANYOS_TERVEZET-be lök", () => {
    expect(report.placeholderSmokeOk).toBe(true);
  });

  it("minden eset átmegy", () => {
    for (const c of report.cases) {
      if (!c.passed) {
        // segítő üzenet a CI-ban
        // eslint-disable-next-line no-console
        console.error("Audit eset bukott:", c);
      }
      expect(c.passed).toBe(true);
    }
    expect(report.allPassed).toBe(true);
  });

  it("tiltott státusz-címkék típusszinten ki vannak zárva (runtime guard)", () => {
    for (const label of FORBIDDEN_STATUS_LABELS) {
      expect(() => assertAllowedStatus(label)).toThrow();
    }
  });
});