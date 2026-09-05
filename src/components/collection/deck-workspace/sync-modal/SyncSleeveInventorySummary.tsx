'use client';

import React from 'react';
import { AlertCircle, Check, Sparkles, Layers } from 'lucide-react';

interface SyncSleeveInventorySummaryProps {
  outOfStockNames: string[];
  deductNames: string[];
  addNames: string[];
  onSetAllAction?: (action: 'deduct' | 'add') => void;
  onOpenNewSleeveModal?: () => void;
}

export const SyncSleeveInventorySummary: React.FC<SyncSleeveInventorySummaryProps> = ({
  outOfStockNames,
  deductNames,
  addNames,
  onSetAllAction,
  onOpenNewSleeveModal,
}) => {
  const hasOutOfStock = outOfStockNames.length > 0;
  const totalLayers = deductNames.length + addNames.length;

  return (
    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5">
      {totalLayers > 1 && onSetAllAction && (
        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-zinc-400" />
            <span>Aplicar a todas:</span>
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onSetAllAction('deduct')}
              className="px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold cursor-pointer transition-colors"
            >
              Todas -1
            </button>
            <button
              type="button"
              onClick={() => onSetAllAction('add')}
              className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 font-bold cursor-pointer transition-colors"
            >
              Todas +1
            </button>
          </div>
        </div>
      )}

      {hasOutOfStock ? (
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-start justify-between gap-2">
          <div className="flex items-start gap-1.5 min-w-0 text-[10.5px]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">⚠️ Stock insuficiente para deducir</p>
              <p className="text-[10px] opacity-90">
                {outOfStockNames.join(', ')} no tiene unidades libres. Cambia su capa a &quot;Sumar (+1)&quot; si es funda nueva, o añade stock.
              </p>
            </div>
          </div>
          {onOpenNewSleeveModal && (
            <button
              type="button"
              onClick={onOpenNewSleeveModal}
              className="shrink-0 px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700 cursor-pointer"
            >
              + Stock
            </button>
          )}
        </div>
      ) : (
        <div className="px-2 py-1 rounded-lg bg-zinc-100/90 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 text-[10px] font-mono flex items-center gap-1.5">
          {addNames.length > 0 && deductNames.length > 0 ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <div className="truncate">
                <span className="text-zinc-500">Deducir:</span> {deductNames.join(', ')} <span className="text-zinc-400">|</span> <span className="text-emerald-600 dark:text-emerald-400 font-bold">Sumar:</span> {addNames.join(', ')}
              </div>
            </>
          ) : addNames.length > 0 ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">Se sumará +1 unidad de cada capa ({addNames.join(', ')}) a tu inventario.</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">Se deducirá 1 unidad libre del inventario para: {deductNames.join(', ')}.</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
