import { NextRequest, NextResponse } from "next/server";
import { generateDebate } from "@/lib/gemini";
import { getQuote } from "@/lib/yahoo-finance";
import { checkRateLimit, getClientIp, validateTicker } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`debate:${ip}`, 5, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const { ticker, personas } = body;

    if (!validateTicker(ticker)) {
      return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
    }

    const quote = await getQuote(ticker);
    const stockData = {
      ...quote,
      ticker: ticker.toUpperCase(),
    };

    const result = await generateDebate(
      ticker.toUpperCase(),
      stockData as unknown as Record<string, unknown>,
      personas
    );

    return NextResponse.json({
      ticker: ticker.toUpperCase(),
      debateId: Date.now().toString(),
      ...result,
    });
  } catch (error) {
    console.error("Debate API error:", error);
    return NextResponse.json(
      { error: "Failed to generate debate" },
      { status: 500 }
    );
  }
}
