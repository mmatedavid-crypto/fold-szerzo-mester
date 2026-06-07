import { describe, expect, it } from "vitest";
import { compareLeaseRanks } from "./leaseRankComparison";
import { EMPTY_PARTY, type LandContext } from "./leaseTypes";

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
