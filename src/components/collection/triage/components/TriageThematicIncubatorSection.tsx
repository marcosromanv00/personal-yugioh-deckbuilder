'use client';

import React from 'react';
import { Flame, Plus } from 'lucide-react';
import { TriageThematicIncubator } from '@/types/triage';

interface TriageThematicIncubatorSectionProps {
  thematicIncubators: TriageThematicIncubator[];
  onSelectAction: (themeTag: string) => void;
  onOpenThemeModal?: () => void;
}

export const TriageThematicIncubatorSection: React.FC<TriageThematicIncubatorSectionProps> = ({
  thematicIncubators,
  onSelectAction,
  onOpenThemeModal,
}) => {
  return (
    <div className="p-3.5 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-2xs select-text">
      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-purple-600 dark:text-purple-400 uppercase">
        <Flame className="w-3.5 h-3.5" />
        <span>Incubadora Temática</span>
      </div>

      {thematicIncubators.length > 0 ? (
        <div className="space-y-1.5 pt-1">
          {thematicIncubators.map((inc, i) => (
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
                onClick={() => onSelectAction(inc.themeName)}
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
  );
};
