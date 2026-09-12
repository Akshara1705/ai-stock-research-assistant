"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useTicker } from "@/contexts/TickerContext";
import {
  Search,
  Swords,
  TrendingUp,
  Crosshair,
  FileText,
  Calendar,
  Activity,
  BarChart3,
  Zap,
} from "lucide-react";

const MODULES = [
  { href: "/research", label: "Stock Research", desc: "Deep-dive analysis", icon: Search, color: "text-blue-400" },
  { href: "/debate", label: "AI Analyst Debate", desc: "Multi-perspective", icon: Swords, color: "text-purple-400" },
  { href: "/valuation", label: "DCF Valuation", desc: "Intrinsic value", icon: TrendingUp, color: "text-emerald-400" },
  { href: "/scanner", label: "Opportunity Scanner", desc: "AI-scored picks", icon: Crosshair, color: "text-amber-400" },
  { href: "/earnings", label: "Earnings Intel", desc: "Calendar & surprises", icon: Calendar, color: "text-cyan-400" },
  { href: "/memo", label: "Investment Memos", desc: "Generate reports", icon: FileText, color: "text-rose-400" },
];

const TICKERS = ["AAPL", "MSFT", "GOOGL", "NVDA", "TSLA", "AMZN", "RELIANCE.NS", "TCS.NS", "INFY.NS"];

export default function DashboardPage() {
  const { ticker, setTicker } = useTicker();
  const router = useRouter();
  const [memos, setMemos] = useState<Array<{ id: string; title: string; recommendation: string; createdAt: string }>>([]);

  useEffect(() => {
    fetch("/api/memo/list")
      .then((r) => r.json())
      .then((d) => setMemos(d.memos || []))
      .catch(() => setMemos([]));
  }, []);

  const handleModuleClick = (href: string) => {
    setTicker(ticker);
    router.push(`${href}/${ticker}`);
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              AlphaTerminal
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              AI-powered equity research platform
            </p>
          </div>
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1e293b] rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Search className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Current Stock: <span className="text-blue-400">{ticker}</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TICKERS.map((t) => (
              <button
                key={t}
                onClick={() => setTicker(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors ${
                  ticker === t
                    ? "bg-blue-600 text-white"
                    : "bg-[#1e293b] text-slate-400 hover:bg-[#2d3748] hover:text-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.href}
                onClick={() => handleModuleClick(mod.href)}
                className="bg-[#111827] border border-[#1e293b] rounded-lg p-3 hover:border-[#2d3748] hover:bg-[#151d2b] transition-all duration-150 cursor-pointer group text-left"
              >
                <Icon className={`w-5 h-5 ${mod.color} mb-2 group-hover:scale-110 transition-transform`} />
                <h3 className="font-medium text-white text-xs">{mod.label}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{mod.desc}</p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="bg-[#111827] border border-[#1e293b] rounded-lg">
              <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Quick Research
                </h2>
                <span className="text-[10px] text-slate-600 font-mono">{TICKERS.length} tickers</span>
              </div>
              <div className="p-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
                {TICKERS.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTicker(t); router.push(`/research/${t}`); }}
                    className={`border rounded-md px-3 py-2.5 text-center transition-all cursor-pointer group ${
                      ticker === t
                        ? "bg-blue-500/10 border-blue-500/50"
                        : "bg-[#0d1117] border-[#1e293b] hover:border-blue-500/50 hover:bg-blue-500/5"
                    }`}
                  >
                    <span className={`font-mono font-bold text-sm ${ticker === t ? "text-blue-400" : "text-white group-hover:text-blue-400"} transition-colors`}>{t}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-[#111827] border border-[#1e293b] rounded-lg">
              <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  Recent Memos
                </h2>
                <span className="text-[10px] text-slate-600 font-mono">{memos.length}</span>
              </div>
              <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                {memos.length === 0 ? (
                  <div className="px-3 py-6 text-center text-xs text-slate-600">
                    No memos yet
                  </div>
                ) : (
                  memos.slice(0, 5).map((memo) => (
                    <Link key={memo.id} href={`/memo/${memo.id}`}>
                      <div className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-[#161b22] transition-colors cursor-pointer">
                        <span className="text-xs text-slate-300 truncate mr-2">{memo.title}</span>
                        <span className="text-[10px] text-slate-600 font-mono shrink-0">
                          {new Date(memo.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
