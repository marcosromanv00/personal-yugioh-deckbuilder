'use client';

import React from 'react';
import { Swords, Flame, Sparkles, CheckCircle2, Plus } from 'lucide-react';
import { TriageDiagnosis } from '@/types/triage';
import { TriageTacticalVerdictCard } from './TriageTacticalVerdictCard';

interface TriageDiagnosticPanelProps {
  diagnosis: TriageDiagnosis | null;
  onSelectAction: (actionType: TriageDiagnosis['suggestedPrimaryAction'], themeTag?: string) => void;
  onOpenThemeModal?: () => void;
}

export const TriageDiagnosticPanel: React.FC<TriageDiagnosticPanelProps> = ({
  diagnosis,
  onSelectAction,
  onOpenThemeModal,
}) => {
  if (!diagnosis) return null;

  return (
    <div className="space-y-3.5 p-4 bg-zinc-50/70 dark:bg-zinc-900/40 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 w-full lg:w-88 xl:w-96 shrink-0 overflow-y-auto">
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
      <div className="p-3.5 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-purple-600 dark:text-purple-400 uppercase">
          <Flame className="w-3.5 h-3.5" />
          <span>Incubadora Temática</span>
        </div>

        {diagnosis.thematicIncubators.length > 0 ? (
          <div className="space-y-1.5 pt-1">
            {diagnosis.thematicIncubators.map((inc, i) => (
              <div
                key={`${inc.themeName}-${i}`}
                className="p-2 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-purple-900 dark:text-purple-200">
                    {inc.themeName} ({inc.themeCategory === 'race' ? 'Raza/Tipo' : 'Arquetipo'})
                  </div>
                  <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400">
                    {inc.totalCardsInCollection} cartas en colección {inc.hasEnoughForCore ? '• ¡Core Viable!' : '• Sin Arquetipo'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectAction('thematic_pool', inc.themeName)}
                  className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold rounded-lg shrink-0 cursor-pointer shadow-2xs"
                >
                  Agrupar en {inc.themeName}
                </button>
              </div>
            ))}

            {onOpenThemeModal && (
              <button
                type="button"
                onClick={onOpenThemeModal}
                className="w-full pt-1 text-center text-[10.5px] font-mono text-purple-700 dark:text-purple-300 hover:underline flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Asignar a otra mesa temática...</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] text-zinc-500 italic">
              Sin arquetipo ni masa crítica acumulada para un mazo temático.
            </p>
            {onOpenThemeModal && (
              <button
                type="button"
                onClick={onOpenThemeModal}
                className="w-full py-1 text-center text-[10.5px] font-mono text-purple-700 dark:text-purple-300 hover:underline flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Definir mesa temática personalizada...</span>
              </button>
            )}
          </div>
        )}
      </div>

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
