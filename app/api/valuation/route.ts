import { NextRequest, NextResponse } from "next/server";
import { getQuote, getStockFinancials } from "@/lib/yahoo-finance";
import { calculateDCF, getValuationSignal } from "@/lib/valuation";
import { getPeersForTicker } from "@/lib/peers";
import { checkRateLimit, getClientIp, validateTicker } from "@/lib/validation";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] } as never);

async function getRealPeers(ticker: string) {
  const peerSymbols = await getPeersForTicker(ticker);
  if (peerSymbols.length === 0) return [];

  const peers = [];
  for (const peer of peerSymbols) {
    try {
      const quote = await yf.quote(peer);
      peers.push({
        ticker: quote.symbol || peer,
        name: quote.shortName || quote.longName || peer,
        pe: quote.trailingPE || 0,
        pb: quote.priceToBook || 0,
        evEbitda: 0,
      });
    } catch {
      // skip failed peers
    }
  }
  return peers;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`valuation:${ip}`, 10, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { ticker, assumptions } = body;

    if (!validateTicker(ticker)) {
      return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
    }

    const [quote, financials] = await Promise.all([
      getQuote(ticker),
      getStockFinancials(ticker),
    ]);

    const freeCashFlow = financials?.freeCashflow || (quote.marketCap || 0) * 0.05 || 1e9;
    const currentPrice = quote.price;
    const sharesOutstanding = financials?.sharesOutstanding || (quote.marketCap && currentPrice ? quote.marketCap / currentPrice : 1e9);

    const revenueGrowth = financials?.revenueGrowth;
    const opMargin = financials?.operatingMargin;
    const profitMargin = financials?.profitMargin;
    const beta = financials?.beta;
    const totalRevenue = financials?.totalRevenue;
    const operatingCashflow = financials?.operatingCashflow;

    const stockRevenueGrowth = revenueGrowth != null && revenueGrowth > -1 && revenueGrowth < 5
      ? revenueGrowth * 100
      : undefined;
    const stockOperatingMargin = opMargin != null && opMargin > 0 && opMargin < 1
      ? opMargin * 100
      : undefined;
    const stockCapexPercent = (operatingCashflow != null && freeCashFlow > 0 && totalRevenue && totalRevenue > 0)
      ? ((operatingCashflow - freeCashFlow) / totalRevenue) * 100
      : undefined;
    const riskFreeRate = 4.5;
    const marketRiskPremium = 5.5;
    const stockDiscountRate = (beta != null && beta > 0)
      ? riskFreeRate + beta * marketRiskPremium
      : undefined;

    const dcfResult = calculateDCF({
      currentPrice,
      freeCashFlow,
      totalRevenue,
      sharesOutstanding,
      revenueGrowthRate: assumptions?.revenueGrowthRate ?? (stockRevenueGrowth ?? 8),
      terminalGrowthRate: assumptions?.terminalGrowthRate ?? 3,
      discountRate: assumptions?.discountRate ?? (stockDiscountRate ?? 10),
      marginExpansion: assumptions?.marginExpansion ?? 0.5,
      capexPercent: assumptions?.capexPercent ?? (stockCapexPercent ?? 5),
      operatingMargin: assumptions?.operatingMargin ?? (stockOperatingMargin ?? 25),
    });

    const peers = await getRealPeers(ticker);

    const averagePe = peers.length > 0
      ? peers.reduce((sum, p) => sum + p.pe, 0) / peers.length
      : quote.pe || 25;
    const impliedValue = currentPrice * (averagePe / (quote.pe || averagePe));

    const marginOfSafety =
      ((dcfResult.fairValuePerShare - currentPrice) / currentPrice * 100).toFixed(1) + "%";

    return NextResponse.json({
      ticker: ticker.toUpperCase(),
      dcf: {
        fairValuePerShare: dcfResult.fairValuePerShare,
        currentPrice,
        marginOfSafety,
        signal: getValuationSignal(dcfResult.fairValuePerShare, currentPrice),
        assumptions: dcfResult.assumptions,
        sensitivityTable: dcfResult.sensitivityTable,
        projectionYears: dcfResult.projectionYears,
      },
      relativeValuation: {
        peers,
        averagePe,
        impliedValue,
        premium:
          ((currentPrice / impliedValue - 1) * 100).toFixed(1) + "%",
      },
      consensus: {
        dcfValue: dcfResult.fairValuePerShare,
        relativeValue: impliedValue,
        blended: (dcfResult.fairValuePerShare + impliedValue) / 2,
        recommendation: getValuationSignal(
          (dcfResult.fairValuePerShare + impliedValue) / 2,
          currentPrice
        ),
      },
      derivedAssumptions: {
        revenueGrowth: stockRevenueGrowth ?? null,
        operatingMargin: stockOperatingMargin ?? null,
        capexPercent: stockCapexPercent ?? null,
        beta: beta ?? null,
        discountRate: stockDiscountRate ?? null,
        freeCashFlow,
        totalRevenue: totalRevenue ?? null,
        sharesOutstanding,
      },
    });
  } catch (error) {
    console.error("Valuation API error:", error);
    return NextResponse.json(
      { error: "Failed to calculate valuation" },
      { status: 500 }
    );
  }
}
