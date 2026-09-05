'use client';

import React from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { SleeveInventory } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

interface SaveDeckStep3SleevesProps {
  availableSleeves: SleeveInventory[];
  selectedMainSleeveId: string;
  setSelectedMainSleeveId: (id: string) => void;
  mainSleeveMode: 'take' | 'add';
  setMainSleeveMode: (m: 'take' | 'add') => void;
  mainSleeveAddedQty: number;
  setMainSleeveAddedQty: (q: number) => void;
  selectedExtraSleeveId: string;
  setSelectedExtraSleeveId: (id: string) => void;
  extraSleeveMode: 'take' | 'add';
  setExtraSleeveMode: (m: 'take' | 'add') => void;
  extraSleeveAddedQty: number;
  setExtraSleeveAddedQty: (q: number) => void;
  totalMainSideCards: number;
  totalExtraCards: number;
}

export const SaveDeckStep3Sleeves: React.FC<SaveDeckStep3SleevesProps> = ({
  availableSleeves,
  selectedMainSleeveId,
  setSelectedMainSleeveId,
  mainSleeveMode,
  setMainSleeveMode,
  mainSleeveAddedQty,
  setMainSleeveAddedQty,
  selectedExtraSleeveId,
  setSelectedExtraSleeveId,
  extraSleeveMode,
  setExtraSleeveMode,
  extraSleeveAddedQty,
  setExtraSleeveAddedQty,
  totalMainSideCards,
  totalExtraCards,
}) => {
  const sleeveOptions = [
    { value: '', label: 'Sin funda asignada' },
    ...availableSleeves.map((s) => ({
      value: s.id,
      label: `${s.brand} • ${s.color_pattern} (${s.name}) [${(s.quantity_total || 0) - (s.quantity_used || 0)} libres]`,
    })),
  ];

  const renderSectionConfig = (
    title: string,
    sleeveId: string,
    onSelect: (id: string) => void,
    mode: 'take' | 'add',
    setMode: (m: 'take' | 'add') => void,
    qty: number,
    setQty: (q: number) => void,
    neededCards: number,
    radioName: string
  ) => {
    const sleeve = availableSleeves.find((s) => s.id === sleeveId);
    const freeStock = sleeve ? (sleeve.quantity_total || 0) - (sleeve.quantity_used || 0) : 0;
    const hasDeficit = mode === 'take' && freeStock < neededCards;

    return (
      <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{title}</label>
          <span className="text-[10px] font-mono text-zinc-500">{neededCards} cartas</span>
        </div>

        <PremiumDropdown
          value={sleeveId}
          onChange={onSelect}
          align="full"
          size="sm"
          options={sleeveOptions}
        />

        {sleeveId && (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-zinc-700 dark:text-zinc-300">
                <input
                  type="radio"
                  name={radioName}
                  checked={mode === 'take'}
                  onChange={() => setMode('take')}
                  className="text-red-600 focus:ring-0"
                />
                <span>Tomar de colección ({freeStock} libres)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-zinc-700 dark:text-zinc-300">
                <input
                  type="radio"
                  name={radioName}
                  checked={mode === 'add'}
                  onChange={() => setMode('add')}
                  className="text-red-600 focus:ring-0"
                />
                <span>Sumar nuevas fundas (+ stock)</span>
              </label>
            </div>

            {mode === 'add' && (
              <div className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] font-mono text-zinc-500">Cantidad a agregar:</span>
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 10))}
                  className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-xs font-bold"
                >
                  -10
                </button>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 text-center font-mono font-bold text-xs bg-transparent border border-zinc-300 dark:border-zinc-700 rounded py-0.5"
                />
                <button
                  type="button"
                  onClick={() => setQty(qty + 10)}
                  className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-xs font-bold"
                >
                  +10
                </button>
                <span className="text-[10px] text-zinc-400 ml-auto font-mono">
                  (Sugerido: {neededCards || 60})
                </span>
              </div>
            )}

            {hasDeficit && (
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Stock insuficiente: se requieren {neededCards} fundas y solo hay {freeStock} libres.</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3.5 py-1">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Shield className="w-4 h-4 text-cyan-500 shrink-0" />
        <span>Elige fundas para cada sección y define si descontar stock libre o registrar fundas nuevas.</span>
      </div>

      {renderSectionConfig(
        'Main & Side Deck',
        selectedMainSleeveId,
        setSelectedMainSleeveId,
        mainSleeveMode,
        setMainSleeveMode,
        mainSleeveAddedQty,
        setMainSleeveAddedQty,
        totalMainSideCards,
        'main_sleeve_mode'
      )}

      {renderSectionConfig(
        'Extra Deck',
        selectedExtraSleeveId,
        setSelectedExtraSleeveId,
        extraSleeveMode,
        setExtraSleeveMode,
        extraSleeveAddedQty,
        setExtraSleeveAddedQty,
        totalExtraCards,
        'extra_sleeve_mode'
      )}
    </div>
  );
};
