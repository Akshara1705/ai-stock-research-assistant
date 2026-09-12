"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MemoPreview } from "@/components/memo/MemoPreview";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { FileText, AlertTriangle, RefreshCw } from "lucide-react";

interface MemoData {
  id: string;
  title: string;
  thesis: string;
  valuation: string;
  peerAnalysis: string;
  riskAssessment: string;
  catalysts: string;
  recommendation: string;
  targetPrice?: number;
  timeHorizon: string;
  confidence: number;
  createdAt: string;
}

export default function MemoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [memo, setMemo] = useState<MemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(`memo-${id}`);
    if (stored) {
      try {
        setMemo(JSON.parse(stored));
        sessionStorage.removeItem(`memo-${id}`);
        setLoading(false);
        fetch("/api/memo/" + id).catch(() => {});
        return;
      } catch {}
    }
    fetchMemo();
  }, [id]);

  const fetchMemo = async () => {
    try {
      const res = await fetch(`/api/memo/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMemo(data);
      } else {
        setError(id.startsWith("temp-") ? "temp" : "not_found");
      }
    } catch {
      setError("network");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { exportToPDF } = await import("@/lib/pdf-export");
      const filename = memo?.title
        ? `${memo.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`
        : `memo_${id}.pdf`;
      await exportToPDF("memo-content", filename);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : error === "temp" ? (
          <div className="text-center py-20">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 max-w-md mx-auto">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <h2 className="text-sm font-semibold text-white mb-2">Memo Not Persisted</h2>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                The memo was generated but could not be saved to the database. This may be a temporary issue.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={fetchMemo}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Retry
                </Button>
                <Link href="/memo">
                  <Button variant="secondary">
                    View All Memos
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-red-400 text-xs font-mono mb-3">
              {error === "not_found" ? "Memo not found. It may have been deleted." : "Failed to load memo."}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={fetchMemo} variant="secondary">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Retry
              </Button>
              <Link href="/memo">
                <Button variant="secondary">
                  View All Memos
                </Button>
              </Link>
            </div>
          </div>
        ) : memo ? (
          <MemoPreview memo={memo} onExportPDF={handleExportPDF} exporting={exporting} />
        ) : null}
      </div>
    </AppShell>
  );
}
