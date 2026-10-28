'use client';

import React from 'react';
import { Undo2, ArrowLeft, ArrowRight, Swords, Flame, Sparkles, FolderArchive, DollarSign, Trash2 } from 'lucide-react';
import { TriageCardActionPayload } from '@/types/triage';

interface TriageActionButtonBarProps {
  onAction: (destinationType: TriageCardActionPayload['destinationType']) => void;
  onPrev: () => void;
  onNext: () => void;
  onUndo: () => void;
  canUndo: boolean;
  canPrev: boolean;
  canNext: boolean;
  isMutating: boolean;
  suggestedAction?: TriageCardActionPayload['destinationType'];
}

export const TriageActionButtonBar: React.FC<TriageActionButtonBarProps> = ({
  onAction,
  onPrev,
  onNext,
  onUndo,
  canUndo,
  canPrev,
  canNext,
  isMutating,
  suggestedAction,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 p-3 sm:px-6 shrink-0 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Navegación y Deshacer */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo || isMutating}
            className={`min-h-11 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              canUndo
                ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 active:scale-95'
                : 'opacity-40 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900/50 text-zinc-400'
            }`}
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden md:inline">Deshacer</span>
            <kbd className="hidden lg:inline px-1 bg-zinc-200 dark:bg-zinc-800 text-[9px] rounded">Ctrl+Z</kbd>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onPrev}
              disabled={!canPrev}
              className="min-h-11 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 text-xs font-mono font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!canNext}
              className="min-h-11 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 text-xs font-mono font-bold"
            >
              <span className="hidden sm:inline">Saltar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 6 Botones de Destino Rápido (1 a 6) */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          {/* 1: Mazo Activo */}
          <button
            type="button"
            onClick={() => onAction('active_deck')}
            disabled={isMutating}
            className={`min-h-11 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ${
              suggestedAction === 'active_deck'
                ? 'bg-red-600 hover:bg-red-500 text-white ring-2 ring-red-400'
                : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 hover:bg-red-100'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Mazo</span>
            <kbd className="px-1 bg-black/10 dark:bg-white/10 rounded text-[9.5px]">1</kbd>
          </button>

          {/* 2: Temático */}
          <button
            type="button"
            onClick={() => onAction('thematic_pool')}
            disabled={isMutating}
            className={`min-h-11 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ${
              suggestedAction === 'thematic_pool'
                ? 'bg-purple-600 hover:bg-purple-500 text-white ring-2 ring-purple-400'
                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50 hover:bg-purple-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Tema</span>
            <kbd className="px-1 bg-black/10 dark:bg-white/10 rounded text-[9.5px]">2</kbd>
          </button>

          {/* 3: Taller / Ensalada */}
          <button
            type="button"
            onClick={() => onAction('workshop_salad')}
            disabled={isMutating}
            className={`min-h-11 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ${
              suggestedAction === 'workshop_salad'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Taller</span>
            <kbd className="px-1 bg-black/10 dark:bg-white/10 rounded text-[9.5px]">3</kbd>
          </button>

          {/* 4: Binder Colección */}
          <button
            type="button"
            onClick={() => onAction('collection_binder')}
            disabled={isMutating}
            className={`min-h-11 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ${
              suggestedAction === 'collection_binder'
                ? 'bg-blue-600 hover:bg-blue-500 text-white ring-2 ring-blue-400'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Binder</span>
            <kbd className="px-1 bg-black/10 dark:bg-white/10 rounded text-[9.5px]">4</kbd>
          </button>

          {/* 5: Venta / Trade */}
          <button
            type="button"
            onClick={() => onAction('trade_sale')}
            disabled={isMutating}
            className={`min-h-11 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ${
              suggestedAction === 'trade_sale'
                ? 'bg-amber-600 hover:bg-amber-500 text-white ring-2 ring-amber-400'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Venta</span>
            <kbd className="px-1 bg-black/10 dark:bg-white/10 rounded text-[9.5px]">5</kbd>
          </button>

          {/* 6: Bulk */}
          <button
            type="button"
            onClick={() => onAction('bulk_discard')}
            disabled={isMutating}
            className={`min-h-11 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ${
              suggestedAction === 'bulk_discard'
                ? 'bg-zinc-700 hover:bg-zinc-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bulk</span>
            <kbd className="px-1 bg-black/10 dark:bg-white/10 rounded text-[9.5px]">6</kbd>
          </button>
        </div>
      </div>
    </div>
  );
};
