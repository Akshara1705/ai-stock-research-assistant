import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatPercent,
  getSignalColor,
  getSignalBg,
  getCurrencyFromTicker,
} from "@/lib/utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters falsy values", () => {
    expect(cn("a", null, undefined, false, "b")).toBe("a b");
  });
});

describe("formatCurrency", () => {
  it("formats USD values", () => {
    expect(formatCurrency(150000000000)).toBe("$150.00B");
    expect(formatCurrency(2500000000)).toBe("$2.50B");
    expect(formatCurrency(150.5)).toBe("$150.50");
  });

  it("formats INR values", () => {
    expect(formatCurrency(15000000, "INR")).toBe("₹1.50 Cr");
    expect(formatCurrency(150000, "INR")).toBe("₹1.50 L");
  });
});

describe("formatPercent", () => {
  it("formats positive values with +", () => {
    expect(formatPercent(5.25)).toBe("+5.25%");
  });

  it("formats negative values with -", () => {
    expect(formatPercent(-3.14)).toBe("-3.14%");
  });
});

describe("getSignalColor / getSignalBg", () => {
  it("returns green for buy signals", () => {
    expect(getSignalColor("buy")).toContain("emerald");
    expect(getSignalColor("bullish")).toContain("emerald");
  });

  it("returns red for sell signals", () => {
    expect(getSignalColor("sell")).toContain("red");
    expect(getSignalColor("bearish")).toContain("red");
  });

  it("returns amber for hold signals", () => {
    expect(getSignalColor("hold")).toContain("amber");
    expect(getSignalColor("neutral")).toContain("amber");
  });
});

describe("getCurrencyFromTicker", () => {
  it("returns INR for Indian tickers", () => {
    expect(getCurrencyFromTicker("RELIANCE.NS")).toBe("INR");
    expect(getCurrencyFromTicker("TCS.BO")).toBe("INR");
  });

  it("returns USD for US tickers", () => {
    expect(getCurrencyFromTicker("AAPL")).toBe("USD");
    expect(getCurrencyFromTicker("msft")).toBe("USD");
  });
});
