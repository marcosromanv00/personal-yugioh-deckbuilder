'use client';

import React from 'react';
import { Sparkles, ArrowRight, ThumbsDown, Zap } from 'lucide-react';
import { TacticalVerdict, TriageDiagnosis } from '@/types/triage';

interface TriageTacticalVerdictCardProps {
  verdict: TacticalVerdict;
  onSelectAction: (actionType: TriageDiagnosis['suggestedPrimaryAction']) => void;
  onOpenDisagreement?: () => void;
}

export const TriageTacticalVerdictCard: React.FC<TriageTacticalVerdictCardProps> = ({
  verdict,
  onSelectAction,
  onOpenDisagreement,
}) => {
  return (
    <div
      className={`p-4 rounded-2xl border space-y-2.5 shadow-sm select-text ${
        verdict.isLearnedOverride
          ? 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 ring-2 ring-purple-500/20'
          : verdict.badgeColor === 'emerald'
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
        {verdict.isLearnedOverride ? (
          <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-purple-600 text-white flex items-center gap-1 shadow-2xs">
            <Zap className="w-3 h-3 text-amber-300 shrink-0" />
            <span>⚡ Criterio Aprendido</span>
          </span>
        ) : (
          <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 flex items-center gap-1 shadow-2xs">
            <Sparkles className="w-3 h-3 text-red-500 shrink-0" />
            <span>Veredicto del Asesor</span>
          </span>
        )}

        {/* Calificación Numérica de Fuerza Obligatoria (Regla 7 de AGENTS.md) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10.5px] font-mono font-black px-2 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs">
            {verdict.powerScore.toFixed(1)} / 10
          </span>
          <span className="text-[10px] font-mono font-bold text-zinc-500">
            [{verdict.actionNumber}]
          </span>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 leading-snug">
          {verdict.headline}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-[10.5px] font-mono font-bold text-zinc-600 dark:text-zinc-400 flex-wrap">
          <span className="px-1.5 py-0.2 rounded bg-white/70 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800">
            {verdict.metaTier}
          </span>
          <span>•</span>
          <span className="text-red-600 dark:text-red-400">
            {verdict.tacticalRole}
          </span>
        </div>
      </div>

      {/* Criterio Táctico y Economía de Cartas */}
      <div className="space-y-1.5 text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300 pt-0.5">
        <div className="flex items-start gap-1">
          <span className="font-bold text-zinc-900 dark:text-zinc-100 shrink-0">Economía:</span>
          <span className="text-zinc-600 dark:text-zinc-400">{verdict.cardEconomy}</span>
        </div>
        <div className="flex items-start gap-1">
          <span className="font-bold text-zinc-900 dark:text-zinc-100 shrink-0">Combate/Stats:</span>
          <span>{verdict.statsAnalysis}</span>
        </div>
        <div className="flex items-start gap-1">
          <span className="font-bold text-zinc-900 dark:text-zinc-100 shrink-0">Impacto/Ritmo:</span>
          <span>{verdict.effectSpeedAnalysis}</span>
        </div>
      </div>

      {/* Consejo Tajante con Justificación Real */}
      <div className="p-2.5 rounded-xl bg-white/90 dark:bg-zinc-950/90 border border-zinc-200/90 dark:border-zinc-800 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 shadow-2xs">
        <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-0.5">Criterio Táctico Final:</p>
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

      {/* Botón "No estoy de acuerdo" para seleccionar otra opción y aprender */}
      {onOpenDisagreement && (
        <button
          type="button"
          onClick={onOpenDisagreement}
          className="w-full py-2 px-3 text-[11px] font-mono font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
        >
          <ThumbsDown className="w-3 h-3 text-amber-500" />
          <span>No estoy de acuerdo con este veredicto</span>
        </button>
      )}
    </div>
  );
};
