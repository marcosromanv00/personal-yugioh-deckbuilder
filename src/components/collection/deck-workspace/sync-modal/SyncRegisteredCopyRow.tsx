'use client';

import React from 'react';
import { DeckCardPhysicalCopy } from '@/types/collection';
import { PremiumDropdown, DropdownOption } from '@/components/ui/PremiumDropdown';
import { CardSubstitution } from './SyncRegisteredCardDrawer';
import { RARITY_SELECT_OPTIONS, CONDITION_SELECT_OPTIONS } from './syncModal.constants';
import { RefreshCw, AlertTriangle, Undo2, ArrowRight } from 'lucide-react';

interface SyncRegisteredCopyRowProps {
  idx: number;
  copy: DeckCardPhysicalCopy;
  currentSub?: CardSubstitution;
  destinationOptions: DropdownOption[];
  sleeveOptions: DropdownOption[];
  onStartSubstitute: () => void;
  onUndoSubstitute: () => void;
  onUpdateSubstitution: (sub: CardSubstitution) => void;
}

export const SyncRegisteredCopyRow: React.FC<SyncRegisteredCopyRowProps> = ({
  idx,
  copy,
  currentSub,
  destinationOptions,
  sleeveOptions,
  onStartSubstitute,
  onUndoSubstitute,
  onUpdateSubstitution,
}) => {
  return (
    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-mono text-zinc-400 font-bold">#{idx + 1}</span>
          <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[9px] font-black uppercase">
            {copy.rarity || 'Common'}
          </span>
          <span className="text-[10px] font-mono text-zinc-500">{copy.condition || 'Near Mint'}</span>
          {copy.is_proxy && (
            <span className="text-[9px] px-1 bg-amber-500/10 text-amber-600 rounded font-bold">Proxy</span>
          )}
        </div>

        <div>
          {currentSub ? (
            <button
              type="button"
              onClick={onUndoSubstitute}
              className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Undo2 className="w-3 h-3" />
              <span>Deshacer</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartSubstitute}
              className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-red-500" />
              <span>Sustituir / Mejorar</span>
            </button>
          )}
        </div>
      </div>

      {currentSub && (
        <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2.5 mt-1">
          <div>
            <label className="block text-[9.5px] font-mono font-bold text-zinc-500 uppercase mb-1">
              Destino de la copia actual saliente:
            </label>
            <PremiumDropdown
              value={currentSub.destinationType === 'location' ? currentSub.targetLocationId || 'inbox' : currentSub.destinationType}
              onChange={(val) => {
                if (val === 'inbox' || val === 'delete') {
                  onUpdateSubstitution({ ...currentSub, destinationType: val, targetLocationId: undefined });
                } else {
                  onUpdateSubstitution({ ...currentSub, destinationType: 'location', targetLocationId: String(val) });
                }
              }}
              size="sm"
              align="full"
              options={destinationOptions}
            />
          </div>

          {currentSub.destinationType === 'delete' && (
            <div className="p-2 bg-red-500/10 border border-red-500/25 rounded-lg flex items-center gap-1.5 text-[10.5px] font-bold text-red-600 dark:text-red-400">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>⚠️ Esta copia se eliminará permanentemente de tu colección al guardar.</span>
            </div>
          )}

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="block text-[9.5px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              Nueva copia que entra al mazo:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-mono text-zinc-400 uppercase mb-0.5">Rareza</label>
                <PremiumDropdown
                  value={currentSub.incomingRarity}
                  onChange={(val) => onUpdateSubstitution({ ...currentSub, incomingRarity: String(val) })}
                  size="sm"
                  align="full"
                  options={RARITY_SELECT_OPTIONS}
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono text-zinc-400 uppercase mb-0.5">Condición</label>
                <PremiumDropdown
                  value={currentSub.incomingCondition}
                  onChange={(val) => onUpdateSubstitution({ ...currentSub, incomingCondition: String(val) })}
                  size="sm"
                  align="full"
                  options={CONDITION_SELECT_OPTIONS}
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-mono text-zinc-400 uppercase mb-0.5">Funda</label>
              <PremiumDropdown
                value={currentSub.incomingSleeveId || 'inherit'}
                onChange={(val) => onUpdateSubstitution({ ...currentSub, incomingSleeveId: String(val) })}
                size="sm"
                align="full"
                options={sleeveOptions}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
