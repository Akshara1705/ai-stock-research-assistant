"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { FileText } from "lucide-react";

interface Memo {
  id: string;
  title: string;
  ticker: string;
  recommendation: string;
  confidence: number;
  createdAt: string;
}

export default function MemoListPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMemos();
  }, []);

  const fetchMemos = async () => {
    try {
      const res = await fetch("/api/memo/list");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch memos");
      }
      const data = await res.json();
      setMemos(data.memos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load memos");
    } finally {
      setLoading(false);
    }
  };

  const getBadge = (rec: string) => {
    switch (rec) {
      case "BUY": return "success" as const;
      case "SELL": return "danger" as const;
      default: return "warning" as const;
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-400" />
            Investment Memos
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            AI-generated institutional-quality investment research memos.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-xs text-red-400 font-mono mb-3">{error}</p>
            <button onClick={fetchMemos} className="text-blue-400 hover:text-blue-300 text-xs font-mono">
              Try again
            </button>
          </div>
        ) : memos.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-mono mb-3">No memos yet.</p>
            <Link href="/" className="text-blue-400 hover:text-blue-300 text-xs font-mono">
              Go to Dashboard →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {memos.map((memo) => (
              <Link key={memo.id} href={`/memo/${memo.id}`}>
                <Card hover>
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <h3 className="font-semibold text-white text-sm">{memo.title}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        {new Date(memo.createdAt).toLocaleDateString()} • {memo.confidence}% confidence
                      </p>
                    </div>
                    <Badge variant={getBadge(memo.recommendation)}>{memo.recommendation}</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
