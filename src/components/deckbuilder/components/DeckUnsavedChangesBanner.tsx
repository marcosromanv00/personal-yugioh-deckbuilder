'use client';

import React from 'react';
import { Save } from 'lucide-react';

interface DeckUnsavedChangesBannerProps {
  isDirty: boolean;
  hasCards: boolean;
  contextName: string;
  loading: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

export const DeckUnsavedChangesBanner: React.FC<DeckUnsavedChangesBannerProps> = ({
  isDirty,
  hasCards,
  contextName,
  loading,
  onDiscard,
  onSave,
}) => {
  if (!isDirty || !hasCards) return null;

  return (
    <div className="shrink-0 z-30 bg-zinc-950 text-white px-4 py-2.5 rounded-2xl border border-amber-500/50 shadow-2xl flex items-center justify-between gap-3 flex-wrap animate-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
        <div className="text-xs">
          <span className="font-bold text-amber-400">
            Cambios sin guardar en {contextName}:
          </span>{' '}
          <span className="text-zinc-300 hidden sm:inline">Hay modificaciones pendientes en el mazo.</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <button
          type="button"
          onClick={onDiscard}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all cursor-pointer min-h-9 touch-manipulation disabled:opacity-50"
        >
          Descartar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/30 transition-all cursor-pointer min-h-9 touch-manipulation disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Cambios</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
