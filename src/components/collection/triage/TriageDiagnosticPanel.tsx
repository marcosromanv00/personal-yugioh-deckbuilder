'use client';

import React from 'react';
import { Swords, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { TriageDiagnosis, RarityAlertEvaluation } from '@/types/triage';
import { TriageTacticalVerdictCard } from './TriageTacticalVerdictCard';
import { TriageThematicIncubatorSection } from './components/TriageThematicIncubatorSection';

interface TriageDiagnosticPanelProps {
  diagnosis: TriageDiagnosis | null;
  rarityAlert?: RarityAlertEvaluation | null;
  onSelectAction: (actionType: TriageDiagnosis['suggestedPrimaryAction'], themeTag?: string) => void;
  onOpenThemeModal?: () => void;
  onOpenRarityModal?: () => void;
}

export const TriageDiagnosticPanel: React.FC<TriageDiagnosticPanelProps> = ({
  diagnosis,
  rarityAlert,
  onSelectAction,
  onOpenThemeModal,
  onOpenRarityModal,
}) => {
  if (!diagnosis) return null;

  const showBulkRarityWarning =
    diagnosis.suggestedPrimaryAction === 'bulk_discard' &&
    Boolean(rarityAlert?.hasDisparity);

  return (
    <div className="space-y-3.5 p-4 bg-zinc-50/70 dark:bg-zinc-900/40 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 w-full lg:w-88 xl:w-96 shrink-0 overflow-y-auto select-text">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-black uppercase text-zinc-500 tracking-wider">
          Diagnóstico & Veredicto
        </span>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
          <span>Playset:</span>
          <span className={`font-black ${diagnosis.isSurplus ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
            {diagnosis.playsetCount}/3 {diagnosis.isSurplus && `(+${diagnosis.playsetCount - 3}x)`}
          </span>
        </div>
      </div>

      {/* Alerta de Prevención antes de Descartar si hay versiones caras */}
      {showBulkRarityWarning && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/50 rounded-xl text-amber-900 dark:text-amber-200 text-xs space-y-1 select-text shadow-2xs">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1 text-[11px] uppercase font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Ojo antes de desechar a Bulk</span>
            </span>
            {onOpenRarityModal && (
              <button
                type="button"
                onClick={onOpenRarityModal}
                className="text-[10px] font-mono underline hover:text-amber-600 dark:hover:text-amber-300 cursor-pointer"
              >
                Ver rarezas [R]
              </button>
            )}
          </div>
          <p className="text-[11px] leading-tight">
            Existen impresiones de hasta ${rarityAlert?.maxPrice.toFixed(2)}. Verifica que tu copia no sea la versión cara.
          </p>
        </div>
      )}

      {/* 0. Veredicto Prominente del Asesor Táctico */}
      <TriageTacticalVerdictCard
        verdict={diagnosis.tacticalVerdict}
        onSelectAction={onSelectAction}
      />

      {/* 1. Diagnóstico Competitivo / Mazos Activos */}
      <div className="p-3.5 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-600 dark:text-red-400 uppercase">
            <Swords className="w-3.5 h-3.5" />
            <span>Competitivo / Mazos</span>
          </div>
          {diagnosis.isStaple && (
            <span className="text-[9.5px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
              {diagnosis.stapleTier} Staple
            </span>
          )}
        </div>

        {diagnosis.competitiveMatches.length > 0 ? (
          <div className="space-y-1.5 pt-1">
            {diagnosis.competitiveMatches.map(match => (
              <div
                key={match.deckId}
                className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs"
              >
                <div className="truncate pr-2">
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {match.deckName}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">
                    Sección: {match.section.toUpperCase()} • Faltan: {match.neededCopies}x
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectAction('active_deck')}
                  className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded-lg shrink-0 cursor-pointer shadow-2xs"
                >
                  Asignar [1]
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-zinc-500 italic">
            Ningún mazo activo requiere copias físicas de esta carta en este momento.
          </p>
        )}
      </div>

      {/* 2. Incubadora Temática (Arquetipo / Raza) */}
      <TriageThematicIncubatorSection
        thematicIncubators={diagnosis.thematicIncubators}
        onSelectAction={tag => onSelectAction('thematic_pool', tag)}
        onOpenThemeModal={onOpenThemeModal}
      />

      {/* 3. Ensalada Didáctica para Talleres */}
      <div className={`p-3.5 rounded-2xl border space-y-2 shadow-2xs ${
        diagnosis.workshopHeuristic.isCandidateForWorkshop
          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/50'
          : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ensalada Didáctica</span>
          </div>
          {diagnosis.workshopHeuristic.isCandidateForWorkshop && (
            <span className="text-[9.5px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
              Recomendada
            </span>
          )}
        </div>

        {diagnosis.workshopHeuristic.reasons.length > 0 ? (
          <ul className="text-[11px] text-zinc-600 dark:text-zinc-300 space-y-1 pl-1">
            {diagnosis.workshopHeuristic.reasons.map((r, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-zinc-500 italic">
            Efecto demasiado complejo o restrictivo para partidas de iniciación.
          </p>
        )}
      </div>
    </div>
  );
};
