import { NextRequest, NextResponse } from "next/server";
import { generateMemo } from "@/lib/gemini";
import { getQuote, getPeers, getStockFinancials } from "@/lib/yahoo-finance";
import { calculateDCF, getValuationSignal } from "@/lib/valuation";
import { checkRateLimit, getClientIp, validateTicker } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`memo:${ip}`, 5, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const { ticker } = body;

    if (!validateTicker(ticker)) {
      return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
    }

    const [quote, peerData, financials] = await Promise.all([
      getQuote(ticker),
      getPeers(ticker),
      getStockFinancials(ticker),
    ]);

    const stockData = {
      ...quote,
      ...financials,
      ticker: ticker.toUpperCase(),
    };

    const memoData = await generateMemo(
      ticker.toUpperCase(),
      stockData as unknown as Record<string, unknown>,
      peerData as unknown[],
      []
    );

    const freeCashFlow = financials?.freeCashflow || (quote.marketCap || 0) * 0.05 || 1e9;
    const totalRevenue = financials?.totalRevenue;
    const operatingCashflow = financials?.operatingCashflow;
    const sharesOutstanding = financials?.sharesOutstanding || (quote.marketCap && quote.price ? quote.marketCap / quote.price : 1e9);

    const revenueGrowth = financials?.revenueGrowth;
    const opMargin = financials?.operatingMargin;
    const beta = financials?.beta;

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
      currentPrice: quote.price,
      freeCashFlow,
      totalRevenue,
      sharesOutstanding,
      revenueGrowthRate: stockRevenueGrowth ?? 8,
      terminalGrowthRate: 3,
      discountRate: stockDiscountRate ?? 10,
      marginExpansion: 0.5,
      capexPercent: stockCapexPercent ?? 5,
      operatingMargin: stockOperatingMargin ?? 25,
    });

    const targetPrice = dcfResult.fairValuePerShare;
    const signal = getValuationSignal(targetPrice, quote.price);
    const confidence = signal === "undervalued" ? 75 : signal === "overvalued" ? 70 : 60;

    let memoId = `temp-${Date.now()}`;
    let createdAt = new Date().toISOString();

    try {
      const { prisma } = await import("@/lib/prisma");
      const stock = await prisma.stock.upsert({
        where: { ticker: ticker.toUpperCase() },
        update: {},
        create: {
          ticker: ticker.toUpperCase(),
          name: quote.name,
          currency: quote.currency,
        },
      });

      const memo = await prisma.investmentMemo.create({
        data: {
          stockId: stock.id,
          title: `${quote.name} (${ticker.toUpperCase()}) — Investment Memo`,
          thesis: memoData.thesis || "",
          valuation: memoData.valuation || "",
          peerAnalysis: memoData.peerAnalysis || "",
          riskAssessment: memoData.riskAssessment || "",
          catalysts: memoData.catalysts || "",
          recommendation: memoData.recommendation || "HOLD",
          targetPrice,
          timeHorizon: "12 months",
          confidence,
          personas: JSON.stringify([]),
        },
      });
      memoId = memo.id;
      createdAt = memo.createdAt.toISOString();
    } catch (dbError) {
      console.warn("Database unavailable, returning memo without persistence:", dbError);
    }

    return NextResponse.json({
      id: memoId,
      title: `${quote.name} (${ticker.toUpperCase()}) — Investment Memo`,
      thesis: memoData.thesis || "",
      valuation: memoData.valuation || "",
      peerAnalysis: memoData.peerAnalysis || "",
      riskAssessment: memoData.riskAssessment || "",
      catalysts: memoData.catalysts || "",
      recommendation: memoData.recommendation || "HOLD",
      targetPrice,
      timeHorizon: "12 months",
      confidence,
      createdAt,
    });
  } catch (error) {
    console.error("Memo generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate memo" },
      { status: 500 }
    );
  }
}
