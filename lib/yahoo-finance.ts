import YahooFinance from "yahoo-finance2";
import { StockQuote, PriceHistoryPoint, PeerData } from "@/types";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] } as never);

export async function getQuote(ticker: string): Promise<StockQuote> {
  const quote = await yf.quote(ticker);
  return {
    symbol: quote.symbol || ticker,
    name: quote.shortName || quote.longName || ticker,
    price: quote.regularMarketPrice || 0,
    change: quote.regularMarketChange || 0,
    changePercent: quote.regularMarketChangePercent || 0,
    open: quote.regularMarketOpen || 0,
    high: quote.regularMarketDayHigh || 0,
    low: quote.regularMarketDayLow || 0,
    previousClose: quote.regularMarketPreviousClose || 0,
    volume: quote.regularMarketVolume || 0,
    marketCap: quote.marketCap || undefined,
    pe: quote.trailingPE || undefined,
    pb: quote.priceToBook || undefined,
    dividendYield: quote.dividendYield || undefined,
    beta: quote.beta || undefined,
    fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || undefined,
    fiftyTwoWeekLow: quote.fiftyTwoWeekLow || undefined,
    currency: quote.currency || "USD",
    exchange: quote.exchange || "",
    sector: (quote as unknown as Record<string, unknown>).sector as string | undefined,
    industry: (quote as unknown as Record<string, unknown>).industry as string | undefined,
  };
}

export async function getRawQuote(ticker: string): Promise<Record<string, unknown>> {
  const quote = await yf.quote(ticker);
  return quote as unknown as Record<string, unknown>;
}

export async function getPriceHistory(
  ticker: string,
  days: number = 365
): Promise<PriceHistoryPoint[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const historical = await yf.historical(ticker, {
    period1: startDate.toISOString().split("T")[0],
    period2: endDate.toISOString().split("T")[0],
    interval: days <= 90 ? "1d" : "1wk",
  });

  return historical
    .map((item) => ({
      date: item.date.toISOString().split("T")[0],
      price: item.close,
      open: item.open,
      high: item.high,
      low: item.low,
      volume: item.volume,
    }))
    .reverse();
}

export async function getPeers(ticker: string): Promise<PeerData[]> {
  const quote = await yf.quote(ticker);
  const peers: PeerData[] = [];

  const quoteSymbols = (quote as unknown as Record<string, unknown>).quoteSymbols as string[] | undefined;
  if (quoteSymbols) {
    const peerTickers = quoteSymbols.slice(0, 5);
    for (const peerTicker of peerTickers) {
      try {
        const peerQuote = await yf.quote(peerTicker);
        peers.push({
          symbol: peerQuote.symbol || peerTicker,
          name: peerQuote.shortName || peerQuote.longName,
          price: peerQuote.regularMarketPrice || 0,
          change: peerQuote.regularMarketChange || 0,
          changePercent: peerQuote.regularMarketChangePercent || 0,
          isPositive: (peerQuote.regularMarketChange || 0) >= 0,
          pe: peerQuote.trailingPE || undefined,
          marketCap: peerQuote.marketCap || undefined,
        });
      } catch {
        continue;
      }
    }
  }

  return peers;
}

export async function getStockFinancials(ticker: string) {
  try {
    const quote = await yf.quote(ticker);
    const raw = quote as unknown as Record<string, unknown>;
    return {
      marketCap: raw.marketCap as number | undefined,
      trailingPE: raw.trailingPE as number | undefined,
      forwardPE: raw.forwardPE as number | undefined,
      pegRatio: raw.pegRatio as number | undefined,
      priceToBook: raw.priceToBook as number | undefined,
      priceToSales: raw.priceToSalesTrailing12Months as number | undefined,
      enterpriseValue: raw.enterpriseValue as number | undefined,
      evToEbitda: raw.enterpriseToEbitda as number | undefined,
      profitMargin: raw.profitMargins as number | undefined,
      operatingMargin: raw.operatingMargins as number | undefined,
      returnOnEquity: raw.returnOnEquity as number | undefined,
      returnOnAssets: raw.returnOnAssets as number | undefined,
      revenueGrowth: raw.revenueGrowth as number | undefined,
      earningsGrowth: raw.earningsGrowth as number | undefined,
      currentRatio: raw.currentRatio as number | undefined,
      debtToEquity: raw.debtToEquity as number | undefined,
      freeCashflow: raw.freeCashflow as number | undefined,
      operatingCashflow: raw.operatingCashflow as number | undefined,
      totalRevenue: raw.totalRevenue as number | undefined,
      totalDebt: raw.totalDebt as number | undefined,
      totalCash: raw.totalCash as number | undefined,
      bookValue: raw.bookValue as number | undefined,
      dividendRate: raw.dividendRate as number | undefined,
      dividendYield: raw.dividendYield as number | undefined,
      payoutRatio: raw.payoutRatio as number | undefined,
      beta: raw.beta as number | undefined,
      sharesOutstanding: raw.sharesOutstanding as number | undefined,
      heldPercentInsiders: raw.heldPercentInsiders as number | undefined,
      heldPercentInstitutions: raw.heldPercentInstitutions as number | undefined,
      shortRatio: raw.shortRatio as number | undefined,
      shortPercentOfFloat: raw.shortPercentOfFloat as number | undefined,
      sector: raw.sector as string | undefined,
    };
  } catch {
    return null;
  }
}
