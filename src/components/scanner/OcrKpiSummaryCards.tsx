import React from 'react';
import { TrendingUp, Sparkles, Layers } from 'lucide-react';

interface OcrKpiSummaryCardsProps {
  overallAccuracy: number;
  totalHits: number;
  totalDigitEvaluations: number;
  totalScansEvaluated: number;
  totalAttemptsLogged: number;
}

export const OcrKpiSummaryCards: React.FC<OcrKpiSummaryCardsProps> = ({
  overallAccuracy,
  totalHits,
  totalDigitEvaluations,
  totalScansEvaluated,
  totalAttemptsLogged,
}) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col justify-between">
        <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Precisión Global
        </span>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-zinc-100">{overallAccuracy}%</span>
          <span className="text-xs text-zinc-500">
            ({totalHits}/{totalDigitEvaluations || 0})
          </span>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col justify-between">
        <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-red-400" /> Cartas Evaluadas
        </span>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-zinc-100">
            {totalScansEvaluated}
          </span>
          <span className="text-xs text-zinc-500">sesiones</span>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col justify-between">
        <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
          <Layers className="w-3.5 h-3.5 text-amber-400" /> Intentos Registrados
        </span>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-zinc-100">
            {totalAttemptsLogged}
          </span>
          <span className="text-xs text-zinc-500">frames</span>
        </div>
      </div>
    </div>
  );
};
