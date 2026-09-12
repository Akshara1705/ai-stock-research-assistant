import { describe, it, expect } from "vitest";
import { calculateDCF, getValuationSignal } from "@/lib/valuation";

describe("calculateDCF", () => {
  it("calculates fair value per share", () => {
    const result = calculateDCF({
      currentPrice: 150,
      freeCashFlow: 10e9,
      totalRevenue: 50e9,
      sharesOutstanding: 15e9,
      revenueGrowthRate: 0.08,
      terminalGrowthRate: 0.03,
      discountRate: 0.1,
      operatingMargin: 0.25,
      capexPercent: 0.05,
    });

    expect(result.fairValuePerShare).toBeGreaterThan(0);
    expect(result.assumptions.revenueGrowthRate).toBe(0.08);
    expect(result.projectionYears).toHaveLength(5);
    expect(result.sensitivityTable).toHaveLength(5);
    expect(result.sensitivityTable[0]).toHaveLength(5);
  });

  it("returns higher fair value for higher growth", () => {
    const low = calculateDCF({
      currentPrice: 100,
      freeCashFlow: 5e9,
      sharesOutstanding: 10e9,
      revenueGrowthRate: 0.05,
    });

    const high = calculateDCF({
      currentPrice: 100,
      freeCashFlow: 5e9,
      sharesOutstanding: 10e9,
      revenueGrowthRate: 0.2,
    });

    expect(high.fairValuePerShare).toBeGreaterThan(low.fairValuePerShare);
  });
});

describe("getValuationSignal", () => {
  it("returns undervalued when far below fair value", () => {
    expect(getValuationSignal(200, 100)).toBe("undervalued");
  });

  it("returns slightly_undervalued when near fair value", () => {
    expect(getValuationSignal(110, 100)).toBe("slightly_undervalued");
  });

  it("returns fairly_valued when at fair value", () => {
    expect(getValuationSignal(100, 100)).toBe("fairly_valued");
  });

  it("returns overvalued when far above fair value", () => {
    expect(getValuationSignal(50, 100)).toBe("overvalued");
  });

  it("returns slightly_overvalued when near fair value", () => {
    expect(getValuationSignal(90, 100)).toBe("slightly_overvalued");
  });
});
