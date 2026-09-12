import { StockQuote } from "@/types";

export function calculateOpportunityScore(quote: StockQuote, fundamentals: Record<string, unknown> | null): {
  overallScore: number;
  valueScore: number;
  growthScore: number;
  momentumScore: number;
  qualityScore: number;
  safetyScore: number;
  reason: string;
} {
  const valueScore = calculateValueScore(quote, fundamentals);
  const growthScore = calculateGrowthScore(fundamentals);
  const momentumScore = calculateMomentumScore(quote);
  const qualityScore = calculateQualityScore(fundamentals);
  const safetyScore = calculateSafetyScore(fundamentals);

  const overallScore = Math.round(
    valueScore * 0.25 +
    growthScore * 0.20 +
    momentumScore * 0.15 +
    qualityScore * 0.25 +
    safetyScore * 0.15
  );

  const reasons: string[] = [];
  if (valueScore > 70) reasons.push("Strong value metrics");
  if (growthScore > 70) reasons.push("High growth potential");
  if (momentumScore > 70) reasons.push("Positive price momentum");
  if (qualityScore > 70) reasons.push("Quality fundamentals");
  if (safetyScore > 70) reasons.push("Low risk profile");
  if (valueScore < 40) reasons.push("Expensive valuation");
  if (growthScore < 40) reasons.push("Weak growth outlook");
  if (qualityScore < 40) reasons.push("Below-average fundamentals");

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    valueScore,
    growthScore,
    momentumScore,
    qualityScore,
    safetyScore,
    reason: reasons.join(". ") || "Mixed signals across metrics",
  };
}

function calculateValueScore(quote: StockQuote, fundamentals: Record<string, unknown> | null): number {
  let score = 50;
  const pe = quote.pe || (fundamentals?.trailingPE as number);
  const pb = quote.pb || (fundamentals?.priceToBook as number);
  const dividendYield = quote.dividendYield || (fundamentals?.dividendYield as number);

  if (pe && pe > 0) {
    if (pe < 15) score += 20;
    else if (pe < 20) score += 10;
    else if (pe < 30) score += 0;
    else if (pe < 50) score -= 10;
    else score -= 20;
  }

  if (pb && pb > 0) {
    if (pb < 1) score += 15;
    else if (pb < 2) score += 5;
    else if (pb < 5) score += 0;
    else score -= 10;
  }

  if (dividendYield && dividendYield > 0) {
    if (dividendYield > 0.04) score += 15;
    else if (dividendYield > 0.02) score += 10;
    else score += 5;
  }

  return Math.min(100, Math.max(0, score));
}

function calculateGrowthScore(fundamentals: Record<string, unknown> | null): number {
  let score = 50;
  const revenueGrowth = fundamentals?.revenueGrowth as number;
  const earningsGrowth = fundamentals?.earningsGrowth as number;

  if (revenueGrowth !== undefined && revenueGrowth !== null) {
    if (revenueGrowth > 0.2) score += 25;
    else if (revenueGrowth > 0.1) score += 15;
    else if (revenueGrowth > 0) score += 5;
    else score -= 10;
  }

  if (earningsGrowth !== undefined && earningsGrowth !== null) {
    if (earningsGrowth > 0.25) score += 20;
    else if (earningsGrowth > 0.1) score += 10;
    else if (earningsGrowth > 0) score += 5;
    else score -= 15;
  }

  return Math.min(100, Math.max(0, score));
}

function calculateMomentumScore(quote: StockQuote): number {
  let score = 50;
  const high = quote.fiftyTwoWeekHigh || 0;
  const low = quote.fiftyTwoWeekLow || 0;
  const price = quote.price;

  if (high > 0 && low > 0) {
    const position = (price - low) / (high - low);
    score += Math.round(position * 30 - 15);
  }

  if (quote.changePercent > 2) score += 10;
  else if (quote.changePercent > 0) score += 5;
  else if (quote.changePercent < -2) score -= 10;
  else if (quote.changePercent < 0) score -= 5;

  return Math.min(100, Math.max(0, score));
}

function calculateQualityScore(fundamentals: Record<string, unknown> | null): number {
  let score = 50;
  const roe = fundamentals?.returnOnEquity as number;
  const profitMargin = fundamentals?.profitMargin as number;
  const currentRatio = fundamentals?.currentRatio as number;
  const debtToEquity = fundamentals?.debtToEquity as number;

  if (roe !== undefined && roe !== null) {
    if (roe > 0.2) score += 15;
    else if (roe > 0.1) score += 10;
    else if (roe > 0.05) score += 5;
    else score -= 10;
  }

  if (profitMargin !== undefined && profitMargin !== null) {
    if (profitMargin > 0.2) score += 15;
    else if (profitMargin > 0.1) score += 10;
    else if (profitMargin > 0.05) score += 5;
    else score -= 5;
  }

  if (currentRatio !== undefined && currentRatio !== null) {
    if (currentRatio > 2) score += 10;
    else if (currentRatio > 1.5) score += 5;
    else if (currentRatio < 1) score -= 10;
  }

  if (debtToEquity !== undefined && debtToEquity !== null) {
    if (debtToEquity < 0.5) score += 10;
    else if (debtToEquity < 1) score += 5;
    else if (debtToEquity > 2) score -= 10;
  }

  return Math.min(100, Math.max(0, score));
}

function calculateSafetyScore(fundamentals: Record<string, unknown> | null): number {
  let score = 50;
  const beta = fundamentals?.beta as number;
  const dividendYield = fundamentals?.dividendYield as number;
  const payoutRatio = fundamentals?.payoutRatio as number;

  if (beta !== undefined && beta !== null) {
    if (beta < 0.8) score += 15;
    else if (beta < 1) score += 10;
    else if (beta < 1.2) score += 0;
    else if (beta < 1.5) score -= 5;
    else score -= 15;
  }

  if (dividendYield !== undefined && dividendYield !== null && dividendYield > 0) {
    score += 10;
  }

  if (payoutRatio !== undefined && payoutRatio !== null) {
    if (payoutRatio < 0.5) score += 10;
    else if (payoutRatio < 0.75) score += 5;
    else if (payoutRatio > 1) score -= 15;
  }

  return Math.min(100, Math.max(0, score));
}

export const INTERESTING_STOCKS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA",
  "BRK-B", "JPM", "V", "UNH", "MA", "JNJ", "WMT", "PG",
  "HD", "BAC", "XOM", "CVX", "KO", "PEP", "AVGO", "COST",
  "LLY", "ABBV", "MRK", "CRM", "AMD", "NFLX", "ADBE",
  "ORCL", "INTC", "QCOM", "CSCO", "DIS", "NKE", "PYPL",
  "PLTR", "SNOW", "COIN", "SQ", "ROKU", "SHOP",
  "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS",
  "ICICIBANK.NS", "SBIN.NS", "BHARTIARTL.NS", "ITC.NS",
  "KOTAKBANK.NS", "LT.NS", "AXISBANK.NS", "WIPRO.NS",
];

export async function getTopOpportunities(
  limit: number = 20
): Promise<
  Array<{
    ticker: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    score: number;
    sector?: string;
  }>
> {
  const { getQuote, getStockFinancials } = await import("./yahoo-finance");
  const results: Array<{
    ticker: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    score: number;
    sector?: string;
  }> = [];

  for (const ticker of INTERESTING_STOCKS.slice(0, limit)) {
    try {
      const [quote, financials] = await Promise.all([
        getQuote(ticker),
        getStockFinancials(ticker),
      ]);
      const score = calculateOpportunityScore(
        quote,
        financials as Record<string, unknown> | null
      );
      results.push({
        ticker,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        score: score.overallScore,
        sector: financials?.sector,
      });
    } catch {
      continue;
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
