"use client";

import { useState, use } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PersonaCard } from "@/components/ai/PersonaCard";
import { DebateBoard } from "@/components/ai/DebateBoard";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { PERSONAS } from "@/lib/personas";
import { PersonaAnalysis } from "@/types";
import { Swords, Users } from "lucide-react";

export default function DebatePage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = use(params);
  const [personas, setPersonas] = useState<PersonaAnalysis[]>([]);
  const [consensus, setConsensus] = useState<{
    signal: string;
    avgConfidence: number;
    agreement: string;
    keyDisagreements: string[];
    synthesizedView: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(Object.keys(PERSONAS));

  const handleDebate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, personas: selectedPersonas }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Debate failed");
      }
      const data = await res.json();
      setPersonas(data.personas);
      setConsensus(data.consensus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate debate");
    } finally {
      setLoading(false);
    }
  };

  const togglePersona = (id: string) => {
    setSelectedPersonas((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-purple-400" />
            AI Analyst Debate: {ticker.toUpperCase()}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Five legendary investors analyze the same stock from their unique perspectives.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {Object.entries(PERSONAS).map(([id, persona]) => (
            <button
              key={id}
              onClick={() => togglePersona(id)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors ${
                selectedPersonas.includes(id)
                  ? "bg-blue-600 text-white"
                  : "bg-[#1e293b] text-slate-400 hover:bg-[#2d3748] hover:text-slate-200"
              }`}
            >
              {persona.name}
            </button>
          ))}
        </div>

        <Button onClick={handleDebate} disabled={loading || selectedPersonas.length < 2}>
          <Users className="w-3.5 h-3.5 mr-1.5" />
          {loading ? "Debating..." : `Start Debate (${selectedPersonas.length})`}
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
              <p className="text-xs text-slate-500 mt-4 font-mono">Analysts are debating...</p>
            </div>
          </div>
        )}

        {!loading && personas.length > 0 && consensus && (
          <DebateBoard personas={personas} consensus={consensus} />
        )}

        {!loading && personas.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              Detailed Analysis
            </h2>
            {personas.map((persona, index) => (
              <PersonaCard key={persona.name} analysis={persona} index={index} />
            ))}
          </div>
        )}

        {!loading && personas.length === 0 && (
          <div className="text-center py-20">
            <Swords className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-mono">
              Select analysts and start a debate to see {ticker.toUpperCase()} analyzed from multiple perspectives.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
