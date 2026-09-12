"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { OpportunityCard } from "@/components/scanner/OpportunityCard";
import { ScoreGauge } from "@/components/scanner/ScoreGauge";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { OpportunityScore } from "@/types";
import { Crosshair, Radar } from "lucide-react";

export default function ScannerPage() {
  const [opportunities, setOpportunities] = useState<OpportunityScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scanner?limit=15");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Scan failed");
      }
      const data = await res.json();
      setOpportunities(data.results);
      setScanned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan market");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-amber-400" />
            Opportunity Scanner
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            AI-scored opportunities ranked by value, growth, momentum, quality, and safety.
          </p>
        </div>

        <Button onClick={handleScan} disabled={loading}>
          <Radar className="w-3.5 h-3.5 mr-1.5" />
          {loading ? "Scanning..." : scanned ? "Rescan Market" : "Scan Market"}
        </Button>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-xs text-red-400 font-mono">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="text-xs text-slate-500 mt-4 font-mono">Scanning market opportunities...</p>
            </div>
          </div>
        )}

        {!loading && scanned && opportunities.length > 0 && (
          <>
            <Card>
              <CardContent className="flex items-center justify-around py-4 flex-wrap gap-3">
                <ScoreGauge score={Math.round(opportunities.reduce((s, o) => s + o.valueScore, 0) / opportunities.length)} label="Value" />
                <ScoreGauge score={Math.round(opportunities.reduce((s, o) => s + o.growthScore, 0) / opportunities.length)} label="Growth" />
                <ScoreGauge score={Math.round(opportunities.reduce((s, o) => s + o.momentumScore, 0) / opportunities.length)} label="Momentum" />
                <ScoreGauge score={Math.round(opportunities.reduce((s, o) => s + o.qualityScore, 0) / opportunities.length)} label="Quality" />
                <ScoreGauge score={Math.round(opportunities.reduce((s, o) => s + o.safetyScore, 0) / opportunities.length)} label="Safety" />
              </CardContent>
            </Card>
            <div className="space-y-2">
              {opportunities.map((opp, index) => (
                <Link key={opp.ticker} href={`/research/${opp.ticker}`}>
                  <OpportunityCard opportunity={opp} rank={index + 1} />
                </Link>
              ))}
            </div>
          </>
        )}

        {!loading && scanned && opportunities.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xs text-slate-500 font-mono">No opportunities found. Try scanning again.</p>
          </div>
        )}

        {!loading && !scanned && (
          <div className="text-center py-20">
            <Crosshair className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-mono">
              Click &quot;Scan Market&quot; to find AI-scored investment opportunities.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
