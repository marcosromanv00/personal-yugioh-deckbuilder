'use client';

import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { TacticalVerdict, TriageDiagnosis } from '@/types/triage';

interface TriageTacticalVerdictCardProps {
  verdict: TacticalVerdict;
  onSelectAction: (actionType: TriageDiagnosis['suggestedPrimaryAction']) => void;
}

export const TriageTacticalVerdictCard: React.FC<TriageTacticalVerdictCardProps> = ({
  verdict,
  onSelectAction,
}) => {
  return (
    <div
      className={`p-4 rounded-2xl border space-y-2.5 shadow-sm ${
        verdict.badgeColor === 'emerald'
          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60'
          : verdict.badgeColor === 'blue'
          ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800/60'
          : verdict.badgeColor === 'purple'
          ? 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800/60'
          : verdict.badgeColor === 'amber'
          ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60'
          : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 flex items-center gap-1 shadow-2xs">
          <Sparkles className="w-3 h-3 text-red-500 shrink-0" />
          <span>Veredicto del Asesor</span>
        </span>
        <span className="text-[10px] font-mono font-bold text-zinc-500">
          Tecla [{verdict.actionNumber}]
        </span>
      </div>

      <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 leading-snug">
        {verdict.headline}
      </h4>

      {/* Justificación Técnica detallada */}
      <div className="space-y-1.5 text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300 pt-0.5">
        <div className="flex items-start gap-1">
          <span className="font-bold text-zinc-900 dark:text-zinc-100 shrink-0">Combate/Stats:</span>
          <span>{verdict.statsAnalysis}</span>
        </div>
        <div className="flex items-start gap-1">
          <span className="font-bold text-zinc-900 dark:text-zinc-100 shrink-0">Efecto:</span>
          <span>{verdict.effectSpeedAnalysis}</span>
        </div>
        <div className="flex items-start gap-1">
          <span className="font-bold text-zinc-900 dark:text-zinc-100 shrink-0">¿Temática?:</span>
          <span>{verdict.themeViability}</span>
        </div>
      </div>

      {/* Consejo Tajante */}
      <div className="p-2.5 rounded-xl bg-white/90 dark:bg-zinc-950/90 border border-zinc-200/90 dark:border-zinc-800 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 shadow-2xs">
        <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-0.5">Veredicto Final:</p>
        <p>{verdict.recommendationDecision}</p>
      </div>

      {/* Botón de Acción Directo */}
      <button
        type="button"
        onClick={() => onSelectAction(verdict.action)}
        className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-500 active:scale-98 text-white rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
      >
        <span>Aplicar: {verdict.actionLabel} [{verdict.actionNumber}]</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
