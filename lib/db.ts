import { prisma } from "./prisma";

export async function upsertStock(ticker: string, data?: {
  name?: string;
  sector?: string;
  industry?: string;
  currency?: string;
  marketCap?: number;
  pe?: number;
  pb?: number;
  dividendYield?: number;
  beta?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}) {
  try {
    return await prisma.stock.upsert({
      where: { ticker: ticker.toUpperCase() },
      update: {
        ...(data?.name && { name: data.name }),
        ...(data?.sector && { sector: data.sector }),
        ...(data?.industry && { industry: data.industry }),
        ...(data?.currency && { currency: data.currency }),
        ...(data?.marketCap != null && { marketCap: data.marketCap }),
        ...(data?.pe != null && { peRatio: data.pe }),
        ...(data?.pb != null && { pbRatio: data.pb }),
        ...(data?.dividendYield != null && { dividendYield: data.dividendYield }),
        ...(data?.beta != null && { beta: data.beta }),
        ...(data?.fiftyTwoWeekHigh != null && { fiftyTwoWeekHigh: data.fiftyTwoWeekHigh }),
        ...(data?.fiftyTwoWeekLow != null && { fiftyTwoWeekLow: data.fiftyTwoWeekLow }),
      },
      create: {
        ticker: ticker.toUpperCase(),
        name: data?.name || ticker.toUpperCase(),
        sector: data?.sector,
        industry: data?.industry,
        currency: data?.currency || "USD",
        marketCap: data?.marketCap,
        peRatio: data?.pe,
        pbRatio: data?.pb,
        dividendYield: data?.dividendYield,
        beta: data?.beta,
        fiftyTwoWeekHigh: data?.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: data?.fiftyTwoWeekLow,
      },
    });
  } catch (error) {
    console.warn("DB unavailable for upsertStock:", error);
    return null;
  }
}

export async function saveAnalysis(stockId: string, data: {
  persona: string;
  signal: string;
  sentiment: string;
  confidenceScore: number;
  riskLevel: string;
  summary: string;
  bullCase: string[];
  bearCase: string[];
  keyCatalyst?: string;
  priceTarget?: number;
  volatilityNote?: string;
  technicalSignal?: string;
}) {
  try {
    return await prisma.analysis.create({
      data: {
        stockId,
        persona: data.persona,
        signal: data.signal,
        sentiment: data.sentiment,
        confidenceScore: data.confidenceScore,
        riskLevel: data.riskLevel,
        summary: data.summary,
        bullCase: JSON.stringify(data.bullCase),
        bearCase: JSON.stringify(data.bearCase),
        keyCatalyst: data.keyCatalyst,
        priceTarget: data.priceTarget,
        volatilityNote: data.volatilityNote,
        technicalSignal: data.technicalSignal,
      },
    });
  } catch (error) {
    console.warn("DB unavailable for saveAnalysis:", error);
    return null;
  }
}

export async function savePriceData(stockId: string, data: {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
}) {
  try {
    return await prisma.priceData.upsert({
      where: { stockId_date: { stockId, date: data.date } },
      update: {
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume,
        adjClose: data.adjClose,
      },
      create: {
        stockId,
        date: data.date,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume,
        adjClose: data.adjClose,
      },
    });
  } catch (error) {
    console.warn("DB unavailable for savePriceData:", error);
    return null;
  }
}

export async function saveEarningsEvent(stockId: string, data: {
  reportDate: Date;
  quarter: string;
  year: number;
  epsEstimate?: number;
  epsActual?: number;
  surprise?: number;
  revenueEstimate?: number;
  revenueActual?: number;
}) {
  try {
    return await prisma.earningsEvent.create({
      data: {
        stockId,
        reportDate: data.reportDate,
        quarter: data.quarter,
        year: data.year,
        epsEstimate: data.epsEstimate,
        epsActual: data.epsActual,
        surprise: data.surprise,
        revenueEstimate: data.revenueEstimate,
        revenueActual: data.revenueActual,
      },
    });
  } catch (error) {
    console.warn("DB unavailable for saveEarningsEvent:", error);
    return null;
  }
}

export async function saveOpportunityScore(stockId: string, data: {
  overallScore: number;
  valueScore: number;
  growthScore: number;
  momentumScore: number;
  qualityScore: number;
  safetyScore: number;
  reason?: string;
  period?: string;
}) {
  try {
    return await prisma.opportunityScore.create({
      data: {
        stockId,
        overallScore: data.overallScore,
        valueScore: data.valueScore,
        growthScore: data.growthScore,
        momentumScore: data.momentumScore,
        qualityScore: data.qualityScore,
        safetyScore: data.safetyScore,
        reason: data.reason,
        period: data.period || "daily",
      },
    });
  } catch (error) {
    console.warn("DB unavailable for saveOpportunityScore:", error);
    return null;
  }
}
