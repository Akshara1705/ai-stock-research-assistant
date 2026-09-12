import { NextRequest, NextResponse } from "next/server";
import { getQuote, getStockFinancials } from "@/lib/yahoo-finance";
import { calculateOpportunityScore, INTERESTING_STOCKS } from "@/lib/scoring";
import { checkRateLimit, getClientIp } from "@/lib/validation";
import { upsertStock, saveOpportunityScore } from "@/lib/db";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`scanner:${ip}`, 10, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const sector = searchParams.get("sector");

    const results = [];
    const stocksToScan = sector
      ? INTERESTING_STOCKS
      : INTERESTING_STOCKS;

    for (const ticker of stocksToScan) {
      try {
        const [quote, financials] = await Promise.all([
          getQuote(ticker),
          getStockFinancials(ticker),
        ]);

        const stockSector = (financials as Record<string, unknown>)?.sector as string | undefined;
        if (sector && stockSector && stockSector.toLowerCase() !== sector.toLowerCase()) {
          continue;
        }

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
          overallScore: score.overallScore,
          valueScore: score.valueScore,
          growthScore: score.growthScore,
          momentumScore: score.momentumScore,
          qualityScore: score.qualityScore,
          safetyScore: score.safetyScore,
          reason: score.reason,
          sector: stockSector,
        });

        upsertStock(ticker, {
          name: quote.name,
          sector: stockSector,
          marketCap: quote.marketCap,
          pe: quote.pe,
          pb: quote.pb,
          dividendYield: quote.dividendYield,
          beta: quote.beta,
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
          currency: quote.currency,
        }).then((stock) => {
          if (stock) {
            saveOpportunityScore(stock.id, {
              overallScore: score.overallScore,
              valueScore: score.valueScore,
              growthScore: score.growthScore,
              momentumScore: score.momentumScore,
              qualityScore: score.qualityScore,
              safetyScore: score.safetyScore,
              reason: score.reason,
            }).catch(() => {});
          }
        }).catch(() => {});
      } catch {
        continue;
      }
    }

    results.sort((a, b) => b.overallScore - a.overallScore);

    return NextResponse.json({
      results: results.slice(0, limit),
      total: results.length,
    });
  } catch (error) {
    console.error("Scanner API error:", error);
    return NextResponse.json(
      { error: "Failed to scan opportunities" },
      { status: 500 }
    );
  }
}
