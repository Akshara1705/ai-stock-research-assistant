import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeString, checkRateLimit, getClientIp, validateTicker } from "@/lib/validation";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`watchlist:${ip}`, 20, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const name = sanitizeString(body?.name, 100);
    const tickers = body?.tickers;

    if (!name) {
      return NextResponse.json({ error: "Watchlist name is required" }, { status: 400 });
    }
    if (!Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json({ error: "At least one ticker is required" }, { status: 400 });
    }

    const watchlist = await prisma.watchlist.update({
      where: { id },
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
    console.error("Watchlist update error:", error);
    return NextResponse.json({ error: "Failed to update watchlist" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.watchlist.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Watchlist delete error:", error);
    return NextResponse.json({ error: "Failed to delete watchlist" }, { status: 500 });
  }
}
