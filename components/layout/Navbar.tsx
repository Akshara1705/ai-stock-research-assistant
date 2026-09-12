"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useTicker } from "@/contexts/TickerContext";
import { Search, Terminal, Menu } from "lucide-react";

export function Navbar() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const { ticker, setTicker } = useTicker();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      const t = search.trim().toUpperCase();
      setTicker(t);
      router.push(`/research/${t}`);
      setSearch("");
    }
  };

  return (
    <header className="h-12 border-b border-[#1e293b] bg-[#0d1117] flex items-center px-4 gap-4 shrink-0">
      <div className="lg:hidden">
        <button className="p-1.5 text-slate-400 hover:text-white">
          <Menu className="w-5 h-5" />
        </button>
      </div>
      <div className="lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-md flex items-center justify-center">
            <Terminal className="w-4 h-4 text-white" />
          </div>
        </Link>
      </div>
      <form onSubmit={handleSearch} className="flex-1 max-w-sm">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
            placeholder="Search any stock..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#0d1117] border border-[#1e293b] rounded-md text-xs font-mono focus:outline-none focus:border-blue-500 text-slate-200 placeholder-slate-600"
          />
          <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-slate-600" />
        </div>
      </form>
      <div className="hidden md:flex items-center gap-3 ml-auto">
        <span className="text-[10px] text-blue-300 font-mono uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
          {ticker}
        </span>
      </div>
    </header>
  );
}
