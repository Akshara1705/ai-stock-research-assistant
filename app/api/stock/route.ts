import { NextRequest, NextResponse } from "next/server";
import { getQuote } from "@/lib/yahoo-finance";
import { validateTicker, checkRateLimit, getClientIp } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`stock:${ip}`, 60, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const ticker = searchParams.get("ticker");

  if (!validateTicker(ticker)) {
    return NextResponse.json({ error: "Valid ticker is required" }, { status: 400 });
  }

  try {
    const quote = await getQuote(ticker);
    return NextResponse.json(quote);
  } catch (error) {
    console.error("Stock API error:", error);
    return NextResponse.json(
      { error: "Could not find ticker", details: String(error) },
      { status: 404 }
    );
  }
}
