import { NextRequest, NextResponse } from "next/server";
import { generateAnalysis } from "@/lib/gemini";
import { checkRateLimit, getClientIp, validateTicker } from "@/lib/validation";
import { upsertStock, saveAnalysis } from "@/lib/db";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`analyze:${ip}`, 10, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const { ticker, quote, currency } = body;

    if (!validateTicker(ticker)) {
      return NextResponse.json({ error: "Valid ticker is required" }, { status: 400 });
    }
    if (!quote || typeof quote !== "object") {
      return NextResponse.json({ error: "Quote data is required" }, { status: 400 });
    }

    const analysis = await generateAnalysis(ticker, {
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      open: quote.open,
      high: quote.high,
      low: quote.low,
      previousClose: quote.previousClose,
      volume: quote.volume,
      marketCap: quote.marketCap,
      pe: quote.pe,
      currency: currency || quote.currency || "USD",
    });

    const stock = await upsertStock(ticker, {
      name: quote.name,
      marketCap: quote.marketCap,
      pe: quote.pe,
      beta: quote.beta,
      currency: currency || quote.currency || "USD",
    });

    if (stock) {
      await saveAnalysis(stock.id, {
        persona: "equity_analyst",
        signal: analysis.technicalSignal,
        sentiment: analysis.sentiment,
        confidenceScore: analysis.confidenceScore,
        riskLevel: analysis.riskLevel,
        summary: analysis.summary,
        bullCase: analysis.bullCase,
        bearCase: analysis.bearCase,
        keyCatalyst: analysis.keyCatalyst,
        priceTarget: analysis.priceTarget,
        volatilityNote: analysis.volatilityNote,
        technicalSignal: analysis.technicalSignal,
      });
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analyze API error:", error);
    return NextResponse.json(
      { error: "Failed to generate analysis" },
      { status: 500 }
    );
  }
}