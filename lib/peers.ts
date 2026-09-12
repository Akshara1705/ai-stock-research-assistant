import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] } as never);

export const PEER_MAP: Record<string, string[]> = {
  AAPL: ["MSFT", "GOOGL", "META"],
  MSFT: ["AAPL", "GOOGL", "AMZN"],
  GOOGL: ["META", "MSFT", "AAPL"],
  GOOG: ["META", "MSFT", "AAPL"],
  META: ["GOOGL", "SNAP", "PINS"],
  AMZN: ["MSFT", "GOOGL", "WMT"],
  TSLA: ["F", "GM", "RIVN"],
  NVDA: ["AMD", "INTC", "QCOM"],
  AMD: ["NVDA", "INTC", "QCOM"],
  JPM: ["BAC", "GS", "MS"],
  BAC: ["JPM", "WFC", "C"],
  GS: ["MS", "JPM", "BAC"],
  NFLX: ["DIS", "PARA", "WBD"],
  "RELIANCE.NS": ["TCS.NS", "HDFCBANK.NS", "INFY.NS"],
  "RELIANCE.BO": ["TCS.BO", "HDFCBANK.BO", "INFY.BO"],
  "TCS.NS": ["INFY.NS", "WIPRO.NS", "HCLTECH.NS"],
  "TCS.BO": ["INFY.BO", "WIPRO.BO", "HCLTECH.BO"],
  "INFY.NS": ["TCS.NS", "WIPRO.NS", "HCLTECH.NS"],
  "HDFCBANK.NS": ["ICICIBANK.NS", "KOTAKBANK.NS", "SBIN.NS"],
  "HDFCBANK.BO": ["ICICIBANK.BO", "KOTAKBANK.BO", "SBIN.BO"],
};

export function getStaticPeers(ticker: string): string[] {
  return PEER_MAP[ticker.toUpperCase()] || PEER_MAP[ticker] || [];
}

export async function getDynamicPeers(ticker: string): Promise<string[]> {
  try {
    const quote = await yf.quote(ticker);
    const raw = quote as unknown as Record<string, unknown>;
    const quoteSymbols = raw.quoteSymbols as string[] | undefined;
    if (quoteSymbols && quoteSymbols.length > 0) {
      return quoteSymbols.slice(0, 5);
    }
  } catch {
    // fall through to static
  }
  return getStaticPeers(ticker);
}

export async function getPeersForTicker(ticker: string): Promise<string[]> {
  const dynamic = await getDynamicPeers(ticker);
  if (dynamic.length > 0) return dynamic;
  return getStaticPeers(ticker);
}
