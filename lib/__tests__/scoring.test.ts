import { describe, it, expect } from "vitest";
import { calculateOpportunityScore, INTERESTING_STOCKS } from "@/lib/scoring";
import { StockQuote } from "@/types";

function makeQuote(overrides: Partial<StockQuote> = {}): StockQuote {
  return {
    symbol: "TEST",
    name: "Test Corp",
    price: 100,
    change: 2,
    changePercent: 2,
    open: 98,
    high: 102,
    low: 97,
    previousClose: 98,
    volume: 1000000,
    pe: 20,
    pb: 3,
    dividendYield: 0.02,
    beta: 1.1,
    fiftyTwoWeekHigh: 120,
    fiftyTwoWeekLow: 80,
    currency: "USD",
    exchange: "NASDAQ",
    ...overrides,
  };
}

describe("calculateOpportunityScore", () => {
  it("returns scores between 0 and 100", () => {
    const quote = makeQuote();
    const result = calculateOpportunityScore(quote, null);

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.valueScore).toBeGreaterThanOrEqual(0);
    expect(result.valueScore).toBeLessThanOrEqual(100);
    expect(result.growthScore).toBeGreaterThanOrEqual(0);
    expect(result.qualityScore).toBeGreaterThanOrEqual(0);
    expect(result.safetyScore).toBeGreaterThanOrEqual(0);
    expect(result.momentumScore).toBeGreaterThanOrEqual(0);
  });

  it("returns a reason string", () => {
    const quote = makeQuote();
    const result = calculateOpportunityScore(quote, null);
    expect(typeof result.reason).toBe("string");
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it("weights value and quality heavily", () => {
    const cheapQuality = makeQuote({ pe: 10, pb: 1 });
    const result = calculateOpportunityScore(cheapQuality, {
      returnOnEquity: 0.25,
      profitMargin: 0.2,
      currentRatio: 2.5,
      debtToEquity: 0.3,
    });

    expect(result.valueScore).toBeGreaterThanOrEqual(70);
    expect(result.qualityScore).toBeGreaterThanOrEqual(70);
  });
});

describe("INTERESTING_STOCKS", () => {
  it("contains at least 40 tickers", () => {
    expect(INTERESTING_STOCKS.length).toBeGreaterThanOrEqual(40);
  });

  it("contains US and Indian tickers", () => {
    expect(INTERESTING_STOCKS).toContain("AAPL");
    expect(INTERESTING_STOCKS).toContain("RELIANCE.NS");
  });
});
