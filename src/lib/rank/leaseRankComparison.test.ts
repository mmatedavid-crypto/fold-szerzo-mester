import { describe, expect, it } from "vitest";
import { compareLeaseRanks } from "./leaseRankComparison";
import { EMPTY_PARTY, type LandContext, type PartyStatus } from "./leaseTypes";

describe("compareLeaseRanks — hatályon kívüli föld", () => {
  it("kivett területnél nem futtat előhaszonbérleti ranghelyet", () => {
    const landContext: LandContext = {
      transaction: "lease",
      branch: "out_of_scope",
    };

    const result = compareLeaseRanks({
      landContext,
      lesseeStatus: EMPTY_PARTY,
      userStatus: EMPTY_PARTY,
    });

    expect(result.comparison).toBe("out_of_scope");
    expect(result.userStrongestRank).toBeNull();
    expect(result.lesseeStrongestRank).toBeNull();
    expect(result.requiredProofs).toEqual([]);
    expect(result.explanation).toContain("Kivett terület");
  });
});

describe("compareLeaseRanks — bizonytalan földági helyzetek", () => {
  const localFarmer: PartyStatus = {
    ...EMPTY_PARTY,
    farmer_natural: true,
    local_resident: true,
  };

  it("vegyes alrészletnél ismeretlen nagyobb terület esetén nem ad erős állítást", () => {
    const landContext: LandContext = {
      transaction: "lease",
      branch: "non_forest",
      mixedParcel: true,
      largerArea: "unknown",
    };

    const result = compareLeaseRanks({
      landContext,
      lesseeStatus: EMPTY_PARTY,
      userStatus: localFarmer,
    });

    expect(result.comparison).toBe("cannot_determine");
    expect(result.explanation).toContain("Vegyes alrészlet");
    expect(result.missingConditions).toContain(
      "Tisztázni kell, hogy a vegyes alrészletben melyik területrész nagyobb",
    );
  });

  it("erdő esetén óvatos Evt. figyelmeztetést ad", () => {
    const landContext: LandContext = {
      transaction: "lease",
      branch: "forest",
    };

    const result = compareLeaseRanks({
      landContext,
      lesseeStatus: EMPTY_PARTY,
      userStatus: { ...localFarmer, former_lessee: true },
    });

    expect(result.warnings.some((warning) => warning.includes("Evt."))).toBe(true);
  });
});
