import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { validateTicker, checkRateLimit, getClientIp } from "@/lib/validation";
import { upsertStock, savePriceData } from "@/lib/db";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey", "ripHistorical"] } as never);

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`history:${ip}`, 30, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const searchParams = request.nextUrl.searchParams;
  const ticker = searchParams.get("ticker");

  if (!validateTicker(ticker)) {
    return NextResponse.json({ error: "Valid ticker is required" }, { status: 400 });
  }

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 365);

    const result = await yf.chart(ticker!, {
      period1: startDate.toISOString().split("T")[0],
      period2: endDate.toISOString().split("T")[0],
      interval: "1d",
    });

    const quotes = result.quotes || [];
    const chartData = quotes
      .filter((item: Record<string, unknown>) => item.close != null)
      .map((item: Record<string, unknown>) => ({
        date: (item.date as string) || "",
        price: parseFloat(((item.close as number) || 0).toFixed(2)),
      }))
      .reverse();

    upsertStock(ticker!).then((stock) => {
      if (stock) {
        const validQuotes = quotes.filter(
          (item: Record<string, unknown>) => item.close != null && item.open != null
        );
        for (const item of validQuotes.slice(0, 30)) {
          savePriceData(stock.id, {
            date: item.date instanceof Date ? item.date : new Date(item.date as string),
            open: (item.open as number) || 0,
            high: (item.high as number) || 0,
            low: (item.low as number) || 0,
            close: (item.close as number) || 0,
            volume: (item.volume as number) || 0,
          }).catch(() => {});
        }
      }
    }).catch(() => {});

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("History API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch price history", details: String(error) },
      { status: 500 }
    );
  }
}
