import { describe, it, expect } from "vitest";
import { validateTicker, sanitizeString, checkRateLimit } from "@/lib/validation";

describe("validateTicker", () => {
  it("accepts valid US tickers", () => {
    expect(validateTicker("AAPL")).toBe(true);
    expect(validateTicker("MSFT")).toBe(true);
    expect(validateTicker("TSLA")).toBe(true);
    expect(validateTicker("BRK-B")).toBe(true);
  });

  it("accepts valid Indian tickers", () => {
    expect(validateTicker("RELIANCE.NS")).toBe(true);
    expect(validateTicker("TCS.BO")).toBe(true);
    expect(validateTicker("INFY.NS")).toBe(true);
  });

  it("rejects invalid tickers", () => {
    expect(validateTicker("")).toBe(false);
    expect(validateTicker(null)).toBe(false);
    expect(validateTicker(undefined)).toBe(false);
    expect(validateTicker(123)).toBe(false);
    expect(validateTicker("A".repeat(30))).toBe(false);
    expect(validateTicker("AAPL; DROP TABLE")).toBe(false);
  });
});

describe("sanitizeString", () => {
  it("returns empty string for non-string input", () => {
    expect(sanitizeString(null)).toBe("");
    expect(sanitizeString(undefined)).toBe("");
    expect(sanitizeString(123)).toBe("");
  });

  it("truncates long strings", () => {
    expect(sanitizeString("a".repeat(2000), 1000)).toHaveLength(1000);
  });

  it("strips angle brackets", () => {
    expect(sanitizeString("<script>alert(1)</script>")).toBe("scriptalert(1)/script");
  });
});

describe("checkRateLimit", () => {
  it("allows requests within limit", () => {
    const key = `test_${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, 5, 60000);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks requests over limit", () => {
    const key = `test_over_${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, 3, 60000);
    }
    const result = checkRateLimit(key, 3, 60000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });
});
