import { NextRequest, NextResponse } from "next/server";
import { getQuote } from "@/lib/yahoo-finance";
import { getPeersForTicker } from "@/lib/peers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ticker = searchParams.get("ticker");

  if (!ticker || typeof ticker !== "string") {
    return NextResponse.json({ error: "Ticker required" }, { status: 400 });
  }

  const peers = await getPeersForTicker(ticker);

  if (peers.length === 0) {
    return NextResponse.json([]);
  }

  try {
    const peerData: Array<Record<string, unknown>> = [];
    for (const peer of peers) {
      try {
        const quote = await getQuote(peer);
        peerData.push({
          symbol: quote.symbol || peer,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          isPositive: quote.change >= 0,
        });
      } catch {
        console.error(`Failed to fetch peer ${peer}`);
      }
    }
    return NextResponse.json(peerData);
  } catch (error) {
    console.error("Peers API error:", error);
    return NextResponse.json({ error: "Failed to fetch peer data" }, { status: 500 });
  }
}
