"use client";

import { useState, useEffect, use } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PriceHeader } from "@/components/stock/PriceHeader";
import { OHLCGrid } from "@/components/stock/OHLCGrid";
import { PriceChart } from "@/components/stock/PriceChart";
import { PeerTable } from "@/components/stock/PeerTable";
import { AnalysisResult } from "@/components/ai/AnalysisResult";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { StockQuote, PriceHistoryPoint, PeerData, AIAnalysis } from "@/types";
import { Brain, BarChart3, Download, RefreshCw, FileText } from "lucide-react";

export default function ResearchPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = use(params);
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [chartData, setChartData] = useState<PriceHistoryPoint[]>([]);
  const [peers, setPeers] = useState<PeerData[]>([]);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generatingMemo, setGeneratingMemo] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "ai">("overview");

  useEffect(() => {
    fetchData();
  }, [ticker]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [quoteRes, historyRes, peersRes] = await Promise.all([
        fetch(`/api/stock?ticker=${ticker}`),
        fetch(`/api/history?ticker=${ticker}`),
        fetch(`/api/peers?ticker=${ticker}`),
      ]);

      if (!quoteRes.ok) throw new Error("Stock not found");

      const quoteData = await quoteRes.json();
      const historyData = await historyRes.json();
      const peersData = await peersRes.json();

      setQuote(quoteData);
      setChartData(historyData);
      setPeers(peersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAiError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, quote, currency: quote?.currency }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Analysis failed");
      }
      const data = await res.json();
      setAnalysis(data);
      setActiveTab("ai");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to generate analysis");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExport = async () => {
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker, analysis, quote }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${ticker}_research_report.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleGenerateMemo = async () => {
    setGeneratingMemo(true);
    try {
      const res = await fetch("/api/memo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = `/memo/${data.id}`;
      }
    } catch {
      // memo generation failed silently
    } finally {
      setGeneratingMemo(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 text-sm font-mono">{error}</p>
            <Button onClick={fetchData} className="mt-4">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        ) : quote ? (
          <>
            <PriceHeader quote={quote} />
            <OHLCGrid quote={quote} />

            <div className="flex gap-1 bg-[#111827] border border-[#1e293b] rounded-lg p-1 w-fit">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === "overview"
                    ? "bg-[#1e293b] text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === "ai"
                    ? "bg-[#1e293b] text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                AI Analysis
              </button>
            </div>

            {activeTab === "overview" ? (
              <div className="space-y-4">
                <PriceChart data={chartData} ticker={ticker.toUpperCase()} currency={quote.currency} />
                <PeerTable peers={peers} ticker={ticker.toUpperCase()} currency={quote.currency} />
                <div className="flex gap-2">
                  <Button onClick={handleAnalyze} disabled={analyzing}>
                    <Brain className="w-3.5 h-3.5 mr-1.5" />
                    {analyzing ? "Analyzing..." : "Generate AI Analysis"}
                  </Button>
                  {analysis && (
                    <Button variant="secondary" onClick={handleExport}>
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Download Report
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {aiError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-xs text-red-400 font-mono">{aiError}</p>
                  </div>
                )}
                {analysis ? (
                  <>
                    <AnalysisResult analysis={analysis} />
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleGenerateMemo} disabled={generatingMemo}>
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        {generatingMemo ? "Generating Memo..." : "Generate Investment Memo"}
                      </Button>
                      <Button variant="secondary" onClick={handleExport}>
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Download Report
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 bg-[#111827] border border-[#1e293b] rounded-lg">
                    <Brain className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-400 mb-4">
                      No AI analysis yet for {ticker.toUpperCase()}
                    </p>
                    <Button onClick={handleAnalyze} disabled={analyzing}>
                      <Brain className="w-3.5 h-3.5 mr-1.5" />
                      {analyzing ? "Analyzing..." : "Generate AI Analysis"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
