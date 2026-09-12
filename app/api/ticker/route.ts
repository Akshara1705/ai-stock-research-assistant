import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { checkRateLimit, getClientIp, sanitizeString } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`ticker:${ip}`, 10, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) } }
    );
  }

  const body = await request.json();
  const companyName = sanitizeString(body?.companyName, 200);

  if (!companyName) {
    return NextResponse.json({ error: "Company name required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Convert this company name or description to a stock ticker symbol: "${companyName}"
  
Rules:
- For Indian companies listed on NSE, add .NS suffix (e.g. RELIANCE.NS, TCS.NS, INFY.NS)
- For US companies, just the ticker (e.g. AAPL, MSFT, TSLA)
- If unsure between NSE and NYSE, prefer NSE for clearly Indian companies
- Respond ONLY with the ticker symbol, nothing else, no explanation
- Examples: "Apple" → AAPL, "Reliance" → RELIANCE.NS, "Tesla" → TSLA, "Infosys" → INFY.NS`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const ticker = response.text?.trim().toUpperCase() ?? "";
    return NextResponse.json({ ticker });
  } catch (error) {
    return NextResponse.json({ error: "Failed to convert" }, { status: 500 });
  }
}