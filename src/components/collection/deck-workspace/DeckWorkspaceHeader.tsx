'use client';

import React from 'react';
import Link from 'next/link';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Swords, 
  ExternalLink,
  Search,
  Layers,
  Info,
  Trash2,
} from 'lucide-react';
import { Deck } from '@/types/collection';
import { MobileDeckTab } from './types';

interface DeckWorkspaceHeaderProps {
  decks: Deck[];
  currentDeck: Deck | null;
  name: string;
  format: string;
  isActive: boolean;
  totalDeckCount: number;
  totalMainCount: number;
  totalExtraCount: number;
  totalSideCount: number;
  totalPoolCount: number;
  hasMutated: boolean;
  onClose: (hasMutated?: boolean) => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  mobileTab: MobileDeckTab;
  setMobileTab: (tab: MobileDeckTab) => void;
  onDeleteDeck?: () => void;
}

export const DeckWorkspaceHeader: React.FC<DeckWorkspaceHeaderProps> = ({
  decks,
  currentDeck,
  name,
  format,
  isActive,
  totalDeckCount,
  totalMainCount,
  totalExtraCount,
  totalSideCount,
  totalPoolCount,
  hasMutated,
  onClose,
  onNavigatePrev,
  onNavigateNext,
  mobileTab,
  setMobileTab,
  onDeleteDeck,
}) => {
  return (
    <header className="px-3 sm:px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/90 flex flex-col gap-2 shrink-0 z-30">
      <div className="flex items-center justify-between gap-3">
        {/* Navegación y Título del Deck */}
        <div className="flex items-center gap-3 min-w-0">
          {decks.length > 1 && (
            <div className="flex items-center gap-1 shrink-0 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onNavigatePrev}
                className="p-1 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Mazo anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onNavigateNext}
                className="p-1 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Siguiente mazo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Swords className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 truncate">
                {name || currentDeck?.name || 'Mazo'}
              </h2>
              <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 shrink-0">
                {format}
              </span>
              {isActive ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 shrink-0">
                  Activo
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                  Reserva
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
              Total: <b>{totalDeckCount} cartas</b> (Main: {totalMainCount} • Extra: {totalExtraCount} • Side: {totalSideCount} • Reserva: {totalPoolCount})
            </p>
          </div>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-2 shrink-0">
          {currentDeck && (
            <Link
              href={`/?loadDeckId=${currentDeck.id}`}
              className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="Abrir en el constructor completo"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Abrir en Taller</span>
            </Link>
          )}

          {onDeleteDeck && (
            <button
              type="button"
              onClick={onDeleteDeck}
              className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer min-h-11 min-w-11 flex items-center justify-center touch-manipulation"
              title="Eliminar baraja"
              aria-label="Eliminar baraja"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onClose(hasMutated)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Switch de Navegación Móvil (Solo visible en pantallas < 1024px) */}
      <div className="flex lg:hidden items-center justify-between bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setMobileTab('left')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileTab === 'left'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Buscador</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('center')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileTab === 'center'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Mazo ({totalDeckCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('right')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileTab === 'right'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Inspector</span>
        </button>
      </div>
    </header>
  );
};
