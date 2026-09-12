import { NextRequest, NextResponse } from "next/server";
import { getRawQuote } from "@/lib/yahoo-finance";
import { validateTicker, checkRateLimit, getClientIp } from "@/lib/validation";
import { upsertStock, saveEarningsEvent } from "@/lib/db";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`earnings:${ip}`, 30, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker");

  if (!validateTicker(ticker)) {
    return NextResponse.json({ error: "Valid ticker is required" }, { status: 400 });
  }

  try {
    const raw = await getRawQuote(ticker!);

    const earningsDate = raw.earningsDate
      ? Array.isArray(raw.earningsDate)
        ? raw.earningsDate[0]
          ? new Date(raw.earningsDate[0] as string | number).toISOString().split("T")[0]
          : null
        : new Date(raw.earningsDate as string | number).toISOString().split("T")[0]
      : null;

    const epsForward = (raw.epsForward as number) || null;
    const trailingPE = (raw.trailingPE as number) || null;

    const earningsQuarterly = raw.earningsQuarterly as
      | { date: string | number; actual?: number; estimate?: number; surprise?: number }[]
      | undefined;

    let lastReport = null;
    if (earningsQuarterly && earningsQuarterly.length > 0) {
      const latest = earningsQuarterly[0];
      if (latest.actual !== undefined && latest.estimate !== undefined) {
        const surprise = latest.surprise ?? ((latest.actual - latest.estimate) / Math.abs(latest.estimate) * 100);
        lastReport = {
          epsEstimate: latest.estimate,
          epsActual: latest.actual,
          surprise,
          reportDate: new Date(latest.date).toISOString().split("T")[0],
        };

        upsertStock(ticker!).then((stock) => {
          if (stock) {
            const reportDate = new Date(latest.date);
            saveEarningsEvent(stock.id, {
              reportDate,
              quarter: `Q${Math.ceil((reportDate.getMonth() + 1) / 3)}`,
              year: reportDate.getFullYear(),
              epsEstimate: latest.estimate,
              epsActual: latest.actual,
              surprise,
            }).catch(() => {});
          }
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      ticker: ticker!.toUpperCase(),
      earningsDate,
      epsForward,
      trailingPE,
      lastReport,
    });
  } catch (error) {
    console.error("Earnings API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings data" },
      { status: 500 }
    );
  }
}
