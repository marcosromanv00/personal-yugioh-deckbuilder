'use client';

import React from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, X, Undo2, Redo2, RotateCcw } from 'lucide-react';
import { StorageLocation } from '@/types/collection';
import { MobileTab } from './types';

interface ContainerWorkspaceHeaderProps {
  location: StorageLocation | null;
  isInbox: boolean;
  containerType: string;
  totalPhysicalCards: number;
  displayedGridCardsCount: number;
  hasMutated: boolean;
  onClose: (hasMutated?: boolean) => void;
  mobileTab: MobileTab;
  setMobileTab: (tab: MobileTab) => void;
  cardsCount: number;
  prevContainer: StorageLocation | null;
  nextContainer: StorageLocation | null;
  handleNavigatePrev: () => void;
  handleNavigateNext: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const ContainerWorkspaceHeader: React.FC<ContainerWorkspaceHeaderProps> = ({
  location,
  isInbox,
  containerType,
  totalPhysicalCards,
  displayedGridCardsCount,
  hasMutated,
  onClose,
  mobileTab,
  setMobileTab,
  cardsCount,
  prevContainer,
  nextContainer,
  handleNavigatePrev,
  handleNavigateNext,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <>
      {/* BOTÓN NAVEGACIÓN ANTERIOR (FLECHA IZQUIERDA - SOLO DESKTOP/TABLET) */}
      {prevContainer && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNavigatePrev();
          }}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full z-50 -ml-3 p-3 rounded-2xl bg-zinc-900 hover:bg-red-600 border border-zinc-700 hover:border-red-500 text-zinc-200 hover:text-white shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer group items-center gap-2"
          title={`Anterior: ${prevContainer.name} (←)`}
          aria-label="Contenedor anterior"
        >
          <ChevronLeft className="w-5 h-5 shrink-0" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-40 transition-all duration-300 text-xs font-bold font-mono">
            {prevContainer.name}
          </span>
        </button>
      )}

      {/* BOTÓN NAVEGACIÓN SIGUIENTE (FLECHA DERECHA - SOLO DESKTOP/TABLET) */}
      {nextContainer && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNavigateNext();
          }}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-full z-50 -mr-3 p-3 rounded-2xl bg-zinc-900 hover:bg-red-600 border border-zinc-700 hover:border-red-500 text-zinc-200 hover:text-white shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer group items-center gap-2"
          title={`Siguiente: ${nextContainer.name} (→)`}
          aria-label="Siguiente contenedor"
        >
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-40 transition-all duration-300 text-xs font-bold font-mono">
            {nextContainer.name}
          </span>
          <ChevronRight className="w-5 h-5 shrink-0" />
        </button>
      )}

      {/* ═══ HEADER DEL ESPACIO DE TRABAJO ═══ */}
      <header className="h-16 shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-4 lg:px-6 flex items-center justify-between gap-3 z-30 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => onClose(hasMutated)}
            className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer shrink-0 min-h-10 min-w-10 flex items-center justify-center touch-manipulation"
            title="Volver a la colección (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        
          <div className="flex items-center gap-2 min-w-0">
            <div 
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: isInbox ? '#f59e0b' : (location?.color_code || '#dc2626') }}
            />
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base font-black text-zinc-900 dark:text-white truncate flex items-center gap-1.5 sm:gap-2">
                <span className="truncate">{isInbox ? 'Inbox' : location?.name}</span>
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-mono uppercase tracking-wider font-bold shrink-0">
                  {isInbox ? 'Inbox' : containerType.toUpperCase()}
                </span>
              </h1>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate hidden sm:block">
                {totalPhysicalCards} {totalPhysicalCards === 1 ? 'carta física registrada' : 'cartas físicas registradas'} ({displayedGridCardsCount} en galería) • Capacidad: {isInbox ? 'Ilimitada' : `${location?.capacity || 0} slots`}
              </p>
            </div>
          </div>
        </div>

        {/* NAVEGADOR DE PESTAÑAS PARA MÓVIL */}
        <div className="flex lg:hidden bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 shrink-0 text-xs font-black">
          <button
            onClick={() => setMobileTab('left')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors touch-manipulation min-h-9 ${mobileTab === 'left' ? 'bg-red-600 text-white shadow-xs' : 'text-zinc-500 dark:text-zinc-400'}`}
          >
            Buscador
          </button>
          <button
            onClick={() => setMobileTab('center')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors touch-manipulation min-h-9 ${mobileTab === 'center' ? 'bg-red-600 text-white shadow-xs' : 'text-zinc-500 dark:text-zinc-400'}`}
          >
            Cartas ({cardsCount})
          </button>
          <button
            onClick={() => setMobileTab('right')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors touch-manipulation min-h-9 ${mobileTab === 'right' ? 'bg-red-600 text-white shadow-xs' : 'text-zinc-500 dark:text-zinc-400'}`}
          >
            Detalles
          </button>
        </div>

        {/* ACCIONES DEL HEADER (DESHACER, REHACER, REFRESCAR, CERRAR) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* BOTÓN DESHACER (UNDO) */}
          {onUndo && (
            <button
              type="button"
              disabled={!canUndo}
              onClick={onUndo}
              className={`p-2 rounded-xl border min-h-10 min-w-10 flex items-center justify-center transition-all touch-manipulation ${
                canUndo
                  ? 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white cursor-pointer active:scale-95'
                  : 'bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200/40 dark:border-zinc-800/40 text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-50'
              }`}
              title={canUndo ? 'Deshacer última acción (Ctrl+Z)' : 'Nada para deshacer'}
              aria-label="Deshacer"
            >
              <Undo2 className="w-4 h-4" />
            </button>
          )}

          {/* BOTÓN REHACER (REDO) */}
          {onRedo && (
            <button
              type="button"
              disabled={!canRedo}
              onClick={onRedo}
              className={`p-2 rounded-xl border min-h-10 min-w-10 flex items-center justify-center transition-all touch-manipulation ${
                canRedo
                  ? 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white cursor-pointer active:scale-95'
                  : 'bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200/40 dark:border-zinc-800/40 text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-50'
              }`}
              title={canRedo ? 'Rehacer acción deshecha (Ctrl+Y)' : 'Nada para rehacer'}
              aria-label="Rehacer"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          )}

          {/* BOTÓN REFRESCAR ESTADO */}
          {onRefresh && (
            <button
              type="button"
              disabled={isRefreshing}
              onClick={onRefresh}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/40 transition-all cursor-pointer min-h-10 min-w-10 flex items-center justify-center touch-manipulation active:scale-95"
              title="Refrescar estado y sincronizar contenedor"
              aria-label="Refrescar contenedor"
            >
              <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-red-600 dark:text-red-400' : ''}`} />
            </button>
          )}

          {/* DIVIDER VERTICAL SUTIL */}
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

          {/* BOTÓN CERRAR */}
          <button
            onClick={() => onClose(hasMutated)}
            className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer min-h-10 min-w-10 flex items-center justify-center touch-manipulation"
            title="Cerrar modal (Esc)"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>
    </>
  );
};

