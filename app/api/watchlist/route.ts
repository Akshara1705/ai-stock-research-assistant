import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeString, checkRateLimit, getClientIp } from "@/lib/validation";

export async function GET() {
  try {
    const watchlists = await prisma.watchlist.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({
      watchlists: watchlists.map((w) => ({
        id: w.id,
        name: w.name,
        tickers: JSON.parse(w.tickers || "[]"),
        strategy: w.strategy,
        createdAt: w.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.warn("DB unavailable for watchlist list:", error);
    return NextResponse.json({ watchlists: [] });
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`watchlist:${ip}`, 20, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const name = sanitizeString(body?.name, 100);
    const tickers = body?.tickers;

    if (!name) {
      return NextResponse.json({ error: "Watchlist name is required" }, { status: 400 });
    }
    if (!Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json({ error: "At least one ticker is required" }, { status: 400 });
    }

    const watchlist = await prisma.watchlist.create({
      data: {
        name,
        tickers: JSON.stringify(tickers.map((t: string) => t.toUpperCase())),
        strategy: sanitizeString(body?.strategy, 200) || null,
      },
    });

    return NextResponse.json({
      id: watchlist.id,
      name: watchlist.name,
      tickers: JSON.parse(watchlist.tickers),
      strategy: watchlist.strategy,
      createdAt: watchlist.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Watchlist create error:", error);
    return NextResponse.json({ error: "Failed to create watchlist" }, { status: 500 });
  }
}
