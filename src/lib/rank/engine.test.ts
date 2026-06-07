import { describe, it, expect } from "vitest";
import { computeRank, computeAcceptanceDeadline, RANK_RULES_VERSION } from "./engine";
import type { ClaimantProfile, NoticeFacts } from "./types";

const baseNotice: NoticeFacts = {
  branch: "non_forest",
  transaction: "sale",
  settlement: "Kistelek",
  contractingPartyRank: 4,
  cultivationBranchTags: [],
};

const baseClaimant: ClaimantProfile = {
  isFoldmuves: false,
  isHelybenLako: false,
  isSzomszedosFoldhasznalo: false,
  isJelenlegiFoldhasznalo: false,
  isTelepulesiFoldhasznalo: false,
  isAllattarto: false,
  isCsaladiGazdasagTag: false,
  isCloseRelativeOfSeller: false,
  isExemptEntity: false,
};

describe("computeRank — kizárások", () => {
  it("közeli hozzátartozó → null + reasonCode", () => {
    const r = computeRank(baseNotice, {
      ...baseClaimant,
      isFoldmuves: true,
      isHelybenLako: true,
      isCloseRelativeOfSeller: true,
    });
    expect(r.rank).toBeNull();
    expect(r.reasonCode).toBe("no_right_close_relative");
    expect(r.strongerThanContractingParty).toBeNull();
  });

  it("kivett alany → null", () => {
    const r = computeRank(baseNotice, {
      ...baseClaimant,
      isFoldmuves: true,
      isExemptEntity: true,
    });
    expect(r.rank).toBeNull();
    expect(r.reasonCode).toBe("no_right_exempt_entity");
  });

  it("közeli hozzátartozó megelőzi a kivett alanyt is", () => {
    const r = computeRank(baseNotice, {
      ...baseClaimant,
      isFoldmuves: true,
      isCloseRelativeOfSeller: true,
      isExemptEntity: true,
    });
    expect(r.reasonCode).toBe("no_right_close_relative");
  });
});

describe("computeRank — nem-erdő alapszabályok", () => {
  it("nem földműves → nincs jog", () => {
    const r = computeRank(baseNotice, baseClaimant);
    expect(r.rank).toBeNull();
    expect(r.reasonCode).toBe("no_right_no_match");
  });

  it("földműves de nem helyben lakó → 4. ranghely (46. § (4))", () => {
    const r = computeRank(baseNotice, { ...baseClaimant, isFoldmuves: true });
    expect(r.rank).toBe(4);
    expect(r.reasonCode).toBe("non_forest_46_4");
  });

  it("földműves + települési földhasználó → 3. ranghely (46. § (3))", () => {
    const r = computeRank(baseNotice, {
      ...baseClaimant,
      isFoldmuves: true,
      isTelepulesiFoldhasznalo: true,
    });
    expect(r.rank).toBe(3);
    expect(r.reasonCode).toBe("non_forest_46_3");
  });

  it("földműves + szomszédos földhasználó → 3. ranghely (erősebb subrank)", () => {
    const r = computeRank(baseNotice, {
      ...baseClaimant,
      isFoldmuves: true,
      isSzomszedosFoldhasznalo: true,
      isTelepulesiFoldhasznalo: true,
    });
    expect(r.rank).toBe(3);
  });

  it("földműves + jelenlegi földhasználó → 3. ranghely (legerősebb subrank)", () => {
    const r = computeRank(baseNotice, {
      ...baseClaimant,
      isFoldmuves: true,
      isJelenlegiFoldhasznalo: true,
      isSzomszedosFoldhasznalo: true,
    });
    expect(r.rank).toBe(3);
  });

  it("helyben lakó földműves → 1. ranghely (46. § (1) b))", () => {
    const r = computeRank(baseNotice, {
      ...baseClaimant,
      isFoldmuves: true,
      isHelybenLako: true,
    });
    expect(r.rank).toBe(1);
    expect(r.reasonCode).toBe("non_forest_46_1_b");
  });

  it("helyben lakó földműves + családi gazdaság → 46. § (1) a) (legerősebb subrank)", () => {
    const r = computeRank(baseNotice, {
      ...baseClaimant,
      isFoldmuves: true,
      isHelybenLako: true,
      isCsaladiGazdasagTag: true,
    });
    expect(r.rank).toBe(1);
    expect(r.reasonCode).toBe("non_forest_46_1_a");
  });

  it("helyben lakó földműves + állattartó → 46. § (1) c)", () => {
    const r = computeRank(baseNotice, {
      ...baseClaimant,
      isFoldmuves: true,
      isHelybenLako: true,
      isAllattarto: true,
    });
    expect(r.rank).toBe(1);
    expect(r.reasonCode).toBe("non_forest_46_1_c");
  });

  it("családi gazdaság megelőzi az állattartót azonos 1. ranghelyen", () => {
    const r = computeRank(baseNotice, {
      ...baseClaimant,
      isFoldmuves: true,
      isHelybenLako: true,
      isCsaladiGazdasagTag: true,
      isAllattarto: true,
    });
    expect(r.reasonCode).toBe("non_forest_46_1_a");
  });

  it("rét/legelő művelési ág → warning állattartó esetén", () => {
    const r = computeRank(
      { ...baseNotice, cultivationBranchTags: ["legelo"] },
      {
        ...baseClaimant,
        isFoldmuves: true,
        isHelybenLako: true,
        isAllattarto: true,
      }
    );
    expect(r.warnings.some((w) => w.includes("rét/legelő"))).toBe(true);
  });
});

describe("computeRank — jogok nem adódnak össze", () => {
  it("több jogcím megléte ellenére is EGY ranghelyet kap", () => {
    const r = computeRank(baseNotice, {
      ...baseClaimant,
      isFoldmuves: true,
      isHelybenLako: true,
      isCsaladiGazdasagTag: true,
      isAllattarto: true,
      isJelenlegiFoldhasznalo: true,
      isTelepulesiFoldhasznalo: true,
    });
    expect(typeof r.rank).toBe("number");
    expect(r.rank).toBe(1);
    // Egyetlen reasonCode-ot kapunk (nem összeadás).
    expect(r.reasonCode).toBe("non_forest_46_1_a");
  });
});

describe("computeRank — erősebb-mint összehasonlítás", () => {
  it("1. ranghely erősebb mint 4-es szerződő fél", () => {
    const r = computeRank(
      { ...baseNotice, contractingPartyRank: 4 },
      { ...baseClaimant, isFoldmuves: true, isHelybenLako: true }
    );
    expect(r.strongerThanContractingParty).toBe(true);
  });

  it("4. ranghely NEM erősebb mint 4-es szerződő fél", () => {
    const r = computeRank(
      { ...baseNotice, contractingPartyRank: 4 },
      { ...baseClaimant, isFoldmuves: true }
    );
    expect(r.strongerThanContractingParty).toBe(false);
  });

  it("4. ranghely NEM erősebb mint 1-es szerződő fél", () => {
    const r = computeRank(
      { ...baseNotice, contractingPartyRank: 1 },
      { ...baseClaimant, isFoldmuves: true }
    );
    expect(r.strongerThanContractingParty).toBe(false);
  });

  it("hiányzó szerződő fél rang → null összehasonlítás", () => {
    const r = computeRank(
      { ...baseNotice, contractingPartyRank: null },
      { ...baseClaimant, isFoldmuves: true, isHelybenLako: true }
    );
    expect(r.strongerThanContractingParty).toBeNull();
  });
});

describe("computeRank — erdő ág SZIGORÚAN különválasztva", () => {
  it("erdő + nem-erdő jogcímek → nem-erdő szabály nem fut", () => {
    const r = computeRank(
      { ...baseNotice, branch: "forest" },
      {
        ...baseClaimant,
        // ezek mind nem-erdő szabályok — itt nem szabad érvényesülniük
        isFoldmuves: true,
        isHelybenLako: true,
        isCsaladiGazdasagTag: true,
      }
    );
    expect(r.branch).toBe("forest");
    // Nincs erdő-jogcím → null
    expect(r.rank).toBeNull();
    expect(r.warnings.some((w) => w.includes("Evt."))).toBe(true);
  });

  it("erdő + erdő-jogcím → előzetes 4. ranghely + warning", () => {
    const r = computeRank(
      { ...baseNotice, branch: "forest" },
      {
        ...baseClaimant,
        forest: { isAdjacentForestOwner: true },
      }
    );
    expect(r.rank).toBe(4);
    expect(r.reasonCode).toBe("forest_external");
  });

  it("nem-erdő branchen az erdő-jogcímek figyelmen kívül maradnak", () => {
    const r = computeRank(baseNotice, {
      ...baseClaimant,
      forest: { isCommonForestOwner: true },
    });
    expect(r.rank).toBeNull();
    expect(r.reasonCode).toBe("no_right_no_match");
  });
});

describe("computeRank — verzió és metaadat", () => {
  it("minden eredmény tartalmazza a rulesVersion-t", () => {
    const r = computeRank(baseNotice, baseClaimant);
    expect(r.rulesVersion).toBe(RANK_RULES_VERSION);
  });
});

describe("computeAcceptanceDeadline", () => {
  it("15 napot ad hozzá a kifüggesztés napjához", () => {
    const pub = new Date("2026-06-01T00:00:00Z");
    const d = computeAcceptanceDeadline(pub);
    expect(d.toISOString().slice(0, 10)).toBe("2026-06-16");
  });

  it("hónapváltáson átnyúlik", () => {
    const pub = new Date("2026-06-20T00:00:00Z");
    const d = computeAcceptanceDeadline(pub);
    expect(d.toISOString().slice(0, 10)).toBe("2026-07-05");
  });
});