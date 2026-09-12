"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MemoSection } from "./MemoSection";
import { cn } from "@/lib/utils";
import { FileText, Clock, Target } from "lucide-react";

interface MemoPreviewProps {
  memo: {
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
  };
  onExportPDF?: () => void;
  exporting?: boolean;
}

export function MemoPreview({ memo, onExportPDF, exporting }: MemoPreviewProps) {
  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case "BUY": return "success" as const;
      case "SELL": return "danger" as const;
      default: return "warning" as const;
    }
  };

  return (
    <div id="memo-content" className="space-y-4">
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                {memo.title}
              </h2>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                Generated {new Date(memo.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={getRecommendationBadge(memo.recommendation)}>
                {memo.recommendation}
              </Badge>
              {memo.targetPrice && (
                <span className="text-lg font-bold text-white font-mono tabular-nums flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-blue-400" />
                  ${Number(memo.targetPrice).toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {memo.timeHorizon}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Confidence: {memo.confidence}%
            </div>
          </div>
        </CardContent>
      </Card>

      <MemoSection title="Investment Thesis" content={memo.thesis} variant="highlight" />
      <MemoSection title="Valuation Analysis" content={memo.valuation} />
      <MemoSection title="Peer Comparison" content={memo.peerAnalysis} />
      <MemoSection title="Risk Assessment" content={memo.riskAssessment} />
      <MemoSection title="Catalysts" content={memo.catalysts} />

      {onExportPDF && (
        <div className="flex justify-end">
          <Button onClick={onExportPDF} disabled={exporting}>
            {exporting ? "Exporting..." : "Export as PDF"}
          </Button>
        </div>
      )}
    </div>
  );
}
