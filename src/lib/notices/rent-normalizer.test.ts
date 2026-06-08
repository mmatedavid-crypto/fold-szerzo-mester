import { describe, expect, it } from "vitest";
import { normalizeRent, parseAreaHa, parseHungarianNumber } from "./rent-normalizer";

describe("rent-normalizer", () => {
  it("magyar számformátumot kezel", () => {
    expect(parseHungarianNumber("150.000,- Ft")).toBe(150000);
    expect(parseHungarianNumber("1,6050")).toBe(1.605);
    expect(parseHungarianNumber("1 200 000")).toBe(1200000);
  });

  it("hektárt és négyzetmétert hektárra normalizál", () => {
    expect(parseAreaHa("1,6050 ha")).toBe(1.605);
    expect(parseAreaHa("16050 m2")).toBe(1.605);
  });

  it("Ft/ha/év díjat közvetlenül normalizál", () => {
    const result = normalizeRent("150.000 Ft/ha/év", "2 ha");

    expect(result.rentHufPerHaYear).toBe(150000);
    expect(result.rentTotalHufYear).toBe(300000);
    expect(result.rentUnit).toBe("Ft/ha/év");
  });

  it("Ft/év díjat területtel osztva normalizál", () => {
    const result = normalizeRent("120.960.- Ft/év", "1,512 ha");

    expect(result.rentHufPerHaYear).toBe(80000);
    expect(result.rentTotalHufYear).toBe(120960);
    expect(result.rentUnit).toBe("Ft/év");
  });

  it("Ft/AK/év díjat külön tart, mert nem Ft/ha/év", () => {
    const result = normalizeRent("3.000 Ft/AK/év", "5 ha");

    expect(result.rentHufPerHaYear).toBeNull();
    expect(result.rentHufPerAkYear).toBe(3000);
    expect(result.rentUnit).toBe("Ft/AK/év");
  });

  it("terménybérletet nem kever pénzbérleti statisztikába", () => {
    const result = normalizeRent("25 kg búza / AK / év", "5 ha");

    expect(result.rentHufPerHaYear).toBeNull();
    expect(result.rentUnit).toBe("kg/AK/év");
    expect(result.confidence).toBeLessThan(0.5);
  });
});
