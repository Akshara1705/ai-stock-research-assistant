import { GoogleGenAI } from "@google/genai";
import { AIAnalysis, PersonaAnalysis } from "@/types";
import { PERSONAS, getDebatePrompt } from "./personas";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function parseJSONResponse(text: string): Record<string, unknown> {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();
  return JSON.parse(cleaned);
}

function normalizeAnalysis(raw: Record<string, unknown>): AIAnalysis {
  const bullCase = Array.isArray(raw.bullCase)
    ? raw.bullCase.map(String)
    : typeof raw.bullCase === "string"
      ? raw.bullCase.split(/[|,\n]/).map((s: string) => s.trim()).filter(Boolean)
      : [];

  const bearCase = Array.isArray(raw.bearCase)
    ? raw.bearCase.map(String)
    : typeof raw.bearCase === "string"
      ? raw.bearCase.split(/[|,\n]/).map((s: string) => s.trim()).filter(Boolean)
      : [];

  let priceTarget = typeof raw.priceTarget === "number"
    ? raw.priceTarget
    : typeof raw.priceTarget === "string"
      ? parseFloat(raw.priceTarget.replace(/[^0-9.]/g, "")) || 0
      : 0;

  return {
    confidenceScore: Math.min(100, Math.max(0, Number(raw.confidenceScore) || 50)),
    sentiment: String(raw.sentiment || "neutral").toLowerCase(),
    riskLevel: String(raw.riskLevel || "medium").toLowerCase(),
    summary: String(raw.summary || ""),
    keyCatalyst: String(raw.keyCatalyst || ""),
    bullCase,
    bearCase,
    technicalSignal: String(raw.technicalSignal || "hold").toLowerCase(),
    priceTarget,
    volatilityNote: String(raw.volatilityNote || ""),
  };
}

export async function generateAnalysis(
  ticker: string,
  quote: Record<string, unknown>
): Promise<AIAnalysis> {
  const currency = (quote.currency as string) || "USD";
  const symbol = currency === "INR" ? "₹" : "$";
  const prompt = `You are a senior equity analyst at Goldman Sachs analyzing ${ticker}.

Current Market Data:
- Price: ${symbol}${quote.price}
- Change: ${quote.change} (${quote.changePercent}%)
- Open: ${symbol}${quote.open}
- High: ${symbol}${quote.high}
- Low: ${symbol}${quote.low}
- Previous Close: ${symbol}${quote.previousClose}
- Volume: ${quote.volume}
${quote.marketCap ? `- Market Cap: ${symbol}${(quote.marketCap as number / 1e9).toFixed(1)}B` : ""}
${quote.pe ? `- P/E Ratio: ${quote.pe}` : ""}

Provide a comprehensive analysis with:
1. confidenceScore (0-100)
2. sentiment (bullish/neutral/bearish)
3. riskLevel (low/medium/high)
4. summary (2-3 sentences)
5. keyCatalyst (main catalyst to watch)
6. bullCase (array of 3-4 specific reasons)
7. bearCase (array of 3-4 specific reasons)
8. technicalSignal (buy/hold/sell based on technicals)
9. priceTarget (12-month target price as a number)
10. volatilityNote (1 sentence on expected volatility)

Respond in this exact JSON format (no markdown, no code fences):
{
  "confidenceScore": number,
  "sentiment": "bullish" | "neutral" | "bearish",
  "riskLevel": "low" | "medium" | "high",
  "summary": "string",
  "keyCatalyst": "string",
  "bullCase": ["string", "string", "string"],
  "bearCase": ["string", "string", "string"],
  "technicalSignal": "buy" | "hold" | "sell",
  "priceTarget": number,
  "volatilityNote": "string"
}`;

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = result.text || "";
  const parsed = parseJSONResponse(text);
  return normalizeAnalysis(parsed);
}

export async function generatePersonaAnalysis(
  ticker: string,
  stockData: Record<string, unknown>,
  personaId: string
): Promise<PersonaAnalysis> {
  const persona = PERSONAS[personaId];
  if (!persona) throw new Error(`Unknown persona: ${personaId}`);

  const prompt = getDebatePrompt(ticker, stockData, persona);

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = result.text || "";
  const parsed = parseJSONResponse(text);

  const bullCase = Array.isArray(parsed.bullCase)
    ? parsed.bullCase.map(String)
    : typeof parsed.bullCase === "string"
      ? parsed.bullCase.split(/[|,\n]/).map((s: string) => s.trim()).filter(Boolean)
      : [];

  const bearCase = Array.isArray(parsed.bearCase)
    ? parsed.bearCase.map(String)
    : typeof parsed.bearCase === "string"
      ? parsed.bearCase.split(/[|,\n]/).map((s: string) => s.trim()).filter(Boolean)
      : [];

  return {
    name: persona.name,
    philosophy: persona.philosophy,
    signal: (parsed.signal as string) || "hold",
    confidence: (parsed.confidence as number) || 50,
    summary: (parsed.summary as string) || "",
    bullCase,
    bearCase,
    keyMetrics: (parsed.keyMetrics as Record<string, number>) || {},
  };
}

export async function generateDebate(
  ticker: string,
  stockData: Record<string, unknown>,
  personaIds: string[] = Object.keys(PERSONAS)
): Promise<{
  personas: PersonaAnalysis[];
  consensus: {
    signal: string;
    avgConfidence: number;
    agreement: string;
    keyDisagreements: string[];
    synthesizedView: string;
  };
}> {
  const analyses = await Promise.all(
    personaIds.map((id) => generatePersonaAnalysis(ticker, stockData, id))
  );

  const signalCounts: Record<string, number> = {};
  let totalConfidence = 0;

  for (const a of analyses) {
    signalCounts[a.signal] = (signalCounts[a.signal] || 0) + 1;
    totalConfidence += a.confidence;
  }

  const avgConfidence = Math.round(totalConfidence / analyses.length);
  const dominantSignal = Object.entries(signalCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const agreement =
    dominantSignal[1] === analyses.length
      ? "strong"
      : dominantSignal[1] >= analyses.length * 0.6
        ? "moderate"
        : dominantSignal[1] >= analyses.length * 0.4
          ? "weak"
          : "divided";

  const allSignals = Object.keys(signalCounts);
  const keyDisagreements: string[] = [];
  if (allSignals.length > 1) {
    keyDisagreements.push(
      `Analysts disagree: ${allSignals.map((s) => `${s} (${signalCounts[s]})`).join(", ")}`
    );
  }

  const viewPoints = analyses.map((a) => a.summary).join(" ");
  const synthesizedView = `Consensus among ${analyses.length} investors: ${dominantSignal[0].toUpperCase()} with ${avgConfidence}% average confidence. Agreement level: ${agreement}. ${viewPoints.slice(0, 300)}...`;

  return {
    personas: analyses,
    consensus: {
      signal: dominantSignal[0],
      avgConfidence,
      agreement,
      keyDisagreements,
      synthesizedView,
    },
  };
}

export async function generateMemo(
  ticker: string,
  stockData: Record<string, unknown>,
  peerData: unknown[],
  personaAnalyses: PersonaAnalysis[]
): Promise<Record<string, string>> {
  const prompt = `You are a senior equity research analyst at a top-tier investment bank.
Generate a comprehensive investment memo for ${ticker}.

STOCK DATA: ${JSON.stringify(stockData)}
PEER DATA: ${JSON.stringify(peerData)}
ANALYST PERSPECTIVES: ${JSON.stringify(personaAnalyses)}

Generate the memo with these sections:
{
  "thesis": "Executive summary of the investment thesis (3-4 sentences)",
  "valuation": "Detailed valuation analysis including DCF summary, relative valuation, and fair value assessment",
  "peerAnalysis": "How the company compares to peers on key metrics",
  "riskAssessment": "Primary and secondary risks with mitigation strategies",
  "catalysts": "Upcoming catalysts that could move the stock",
  "recommendation": "BUY | HOLD | SELL with conviction level"
}

Respond in this exact JSON format (no markdown, no code fences):
{
  "thesis": "string",
  "valuation": "string",
  "peerAnalysis": "string",
  "riskAssessment": "string",
  "catalysts": "string",
  "recommendation": "BUY" | "HOLD" | "SELL"
}`;

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = result.text || "";
  return parseJSONResponse(text) as Record<string, string>;
}

export async function generateTickerFromName(
  companyName: string
): Promise<string> {
  const prompt = `Convert this company name or description to a stock ticker symbol.
If it's an Indian company, append .NS for NSE or .BO for BSE.
If it's a US company, just return the ticker.
Company: ${companyName}
Reply with ONLY the ticker symbol, nothing else.`;

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return (result.text || "").trim().replace(/['"]/g, "");
}
