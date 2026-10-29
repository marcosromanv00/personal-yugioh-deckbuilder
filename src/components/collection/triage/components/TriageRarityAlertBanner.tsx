'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';
import { RarityAlertEvaluation } from '@/types/triage';

interface TriageRarityAlertBannerProps {
  evaluation: RarityAlertEvaluation;
  onOpenRarityModal: () => void;
}

export const TriageRarityAlertBanner: React.FC<TriageRarityAlertBannerProps> = ({
  evaluation,
  onOpenRarityModal,
}) => {
  // Caso 1: Precio uniforme en todas las ediciones (Tranquilidad para el usuario)
  if (evaluation.isSafeSamePrice && evaluation.alertLevel === 'none') {
    return (
      <div className="w-full px-3.5 py-2 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs select-text">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 truncate">
            <strong className="text-zinc-800 dark:text-zinc-200 font-bold">Rareza uniforme:</strong> cotización similar (~${evaluation.minPrice.toFixed(2)}) en todas sus versiones.
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenRarityModal}
          className="text-[10px] font-mono font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline shrink-0 cursor-pointer"
        >
          Ver sets [R]
        </button>
      </div>
    );
  }

  // Caso 2: Alerta Crítica o Advertencia de Disparidad
  const isCritical = evaluation.alertLevel === 'critical';
  const containerClasses = isCritical
    ? 'bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/50 dark:border-amber-500/60 text-amber-900 dark:text-amber-200'
    : evaluation.alertLevel === 'warning'
    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
    : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300';

  const iconClasses = isCritical
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-amber-500 dark:text-amber-400';

  return (
    <div className={`w-full p-3.5 rounded-2xl border space-y-2 select-text shadow-2xs ${containerClasses}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {evaluation.hasCollectorRarity ? (
            <Sparkles className={`w-4 h-4 ${iconClasses} shrink-0 animate-pulse`} />
          ) : (
            <AlertTriangle className={`w-4 h-4 ${iconClasses} shrink-0`} />
          )}
          <span className="text-xs font-mono font-black uppercase tracking-wide">
            {evaluation.alertTitle}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenRarityModal}
          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-[10.5px] rounded-lg shadow-2xs cursor-pointer transition-all active:scale-98 shrink-0 flex items-center gap-1"
        >
          <span>Elegir Impresión [R]</span>
        </button>
      </div>

      <p className="text-xs leading-relaxed font-sans font-medium">
        {evaluation.alertMessage}
      </p>

      {/* Rango de precios visual */}
      <div className="flex items-center gap-2 pt-0.5 text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300 flex-wrap">
        <span className="px-2 py-0.5 rounded bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-emerald-700 dark:text-emerald-400">
          Base: ${evaluation.minPrice.toFixed(2)} ({evaluation.lowestPricedPrinting?.setRarity || 'Común'})
        </span>
        <span>→</span>
        <span className="px-2 py-0.5 rounded bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-amber-700 dark:text-amber-400">
          Tope: ${evaluation.maxPrice.toFixed(2)} ({evaluation.highestPricedPrinting?.setRarity || 'Cara'})
        </span>
        {evaluation.priceDifference > 0 && (
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
            (Margen de +${evaluation.priceDifference.toFixed(2)})
          </span>
        )}
      </div>
    </div>
  );
};
