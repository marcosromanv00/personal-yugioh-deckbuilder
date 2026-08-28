'use client';

import React from 'react';
import { useIdealEnvironment } from '@/context/IdealEnvironmentContext';
import { Sparkles, ClipboardList, Sliders } from 'lucide-react';

export function EnvironmentSwitcher() {
  const { isIdealMode, toggleIdealMode, openReportModal, openConfigModal, isSyncing } = useIdealEnvironment();

  return (
    <div className="flex items-center gap-2">
      {/* Botón de Parámetros de Reorganización (Solo visible en Modo Ideal) */}
      {isIdealMode && (
        <button
          onClick={openConfigModal}
          title="Parámetros de Reorganización Ideal"
          className="relative group p-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors shadow-xs cursor-pointer min-h-9 min-w-9 flex items-center justify-center touch-manipulation"
        >
          <Sliders className="w-4 h-4 text-zinc-600 dark:text-zinc-300 group-hover:text-red-500 transition-colors" />
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap px-2.5 py-1 text-xs font-semibold text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl backdrop-blur-md z-50 font-sans">
            Ajustar Parámetros de Optimización
          </span>
        </button>
      )}

      {/* Botón de Reporte Permanente (Solo visible en Modo Ideal) */}
      {isIdealMode && (
        <button
          onClick={openReportModal}
          title="Ver Reporte de Ajustes e Ideas"
          className="relative group p-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors shadow-xs cursor-pointer min-h-9 min-w-9 flex items-center justify-center touch-manipulation"
        >
          <ClipboardList className="w-4 h-4 text-zinc-600 dark:text-zinc-300 group-hover:text-red-500 transition-colors" />
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap px-2.5 py-1 text-xs font-semibold text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl backdrop-blur-md z-50 font-sans">
            Reporte de Reorganización Ideal
          </span>
        </button>
      )}

      {/* Switcher Icon-only para Alternar Ambiente */}
      <button
        onClick={toggleIdealMode}
        disabled={isSyncing}
        title={isIdealMode ? 'Colección Ideal Activa (Click para regresar a Físico)' : 'Colección Física (Click para activar Colección Ideal)'}
        className={`relative group p-2.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-xs ${
          isIdealMode
            ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-600/25 ring-2 ring-red-500/30'
            : 'border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-red-500 hover:text-red-600 dark:hover:text-red-400'
        }`}
      >
        <Sparkles
          className={`w-4 h-4 transition-transform duration-200 ${
            isIdealMode ? 'text-white scale-110' : 'text-zinc-500 dark:text-zinc-400 group-hover:scale-110 group-hover:text-red-500'
          }`}
        />
        
        {/* Subtle Indicator Glow Dot */}
        <span
          className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full transition-all duration-200 ${
            isIdealMode ? 'bg-amber-400 ring-2 ring-amber-400/50 animate-pulse' : 'bg-zinc-400 dark:bg-zinc-600'
          }`}
        />

        {/* Hover Tooltip */}
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap px-2.5 py-1 text-xs font-semibold text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl backdrop-blur-md z-50 font-sans">
          {isIdealMode ? 'Modo Colección Ideal Activo' : 'Cambiar a Colección Ideal'}
        </span>
      </button>
    </div>
  );
}
