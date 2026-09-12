"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { FileText, Brain, Search, Target, Lightbulb, ChevronRight } from "lucide-react";

interface Memo {
  id: string;
  title: string;
  ticker: string;
  recommendation: string;
  confidence: number;
  createdAt: string;
}

const STEPS = [
  {
    icon: Search,
    title: "Pick a Stock",
    desc: "Select any ticker from the Dashboard or search for one.",
    color: "text-blue-400",
  },
  {
    icon: Brain,
    title: "Run AI Analysis",
    desc: "Go to Research, generate an AI analysis for the stock.",
    color: "text-purple-400",
  },
  {
    icon: Target,
    title: "Generate Memo",
    desc: "Click \"Generate Investment Memo\" to create a full research report.",
    color: "text-emerald-400",
  },
];

export default function MemoListPage() {
  const router = useRouter();
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
          <div className="space-y-6">
            <Card className="border-rose-500/20 bg-rose-500/5">
              <CardContent className="py-5">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">What are Investment Memos?</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Investment memos are AI-generated research reports that combine stock data, valuation analysis,
                      peer comparisons, and risk assessment into a single document — similar to what equity research
                      analysts produce at investment banks.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                How to Generate a Memo
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <Card key={i}>
                      <CardContent className="py-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-mono text-slate-600 bg-[#1e293b] px-1.5 py-0.5 rounded">
                            {i + 1}
                          </span>
                          <Icon className={`w-4 h-4 ${step.color}`} />
                        </div>
                        <h3 className="text-xs font-semibold text-white mb-1">{step.title}</h3>
                        <p className="text-[11px] text-slate-500">{step.desc}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={() => router.push("/research/AAPL")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                Start with AAPL
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <p className="text-[10px] text-slate-600 mt-2 font-mono">
                Or pick any stock from the Dashboard
              </p>
            </div>
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
