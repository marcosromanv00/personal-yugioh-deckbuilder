'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FolderOpen,
  Save,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  ChevronDown,
  FileText,
  Wand2,
} from 'lucide-react';

interface DeckActionsDropdownProps {
  onSave: () => void;
  onLoad: () => void;
  onCreateWithAI?: () => void;
  onImportYdk: () => void;
  onExportYdk: () => void;
  onClear: () => void;
  onSyncMeta: () => void;
  hasCards: boolean;
  isSyncing: boolean;
  isSavedDeck?: boolean;
  onDeleteDeck?: () => void;
}

export const DeckActionsDropdown: React.FC<DeckActionsDropdownProps> = ({
  onSave,
  onLoad,
  onCreateWithAI,
  onImportYdk,
  onExportYdk,
  onClear,
  onSyncMeta,
  hasCards,
  isSyncing,
  isSavedDeck,
  onDeleteDeck,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-700 text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer min-h-11 touch-manipulation"
      >
        <FileText className="w-3.5 h-3.5 text-zinc-500" />
        <span>Deck</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl p-1.5 z-50 text-xs text-zinc-700 dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-100">
          {/* CREAR DECK CON IA */}
          {onCreateWithAI && (
            <button
              onClick={() => {
                onCreateWithAI();
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl font-bold bg-linear-to-r from-purple-500/10 to-red-500/10 hover:from-purple-500/20 hover:to-red-500/20 text-purple-700 dark:text-purple-300 transition-all text-left cursor-pointer border border-purple-500/20 mb-1"
            >
              <Wand2 className="w-4 h-4 text-purple-500 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>Crear Deck con IA</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-purple-500 text-[9px] text-white font-mono font-bold">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-purple-600/80 dark:text-purple-400/80 font-normal">
                  Sintetizador & Generador
                </p>
              </div>
            </button>
          )}

          <button
            onClick={() => {
              onSave();
              setIsOpen(false);
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left cursor-pointer"
          >
            <Save className="w-4 h-4 text-emerald-500" />
            <div className="flex-1 flex justify-between items-center">
              <span>Guardar Deck</span>
              <span className="text-[10px] text-zinc-400 font-mono">Ctrl+S</span>
            </div>
          </button>

          <button
            onClick={() => {
              onLoad();
              setIsOpen(false);
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-purple-500" />
            <span>Cargar Deck Guardado</span>
          </button>

          <div className="my-1 border-t border-zinc-100 dark:border-zinc-900" />

          <button
            onClick={() => {
              onImportYdk();
              setIsOpen(false);
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left cursor-pointer"
          >
            <Upload className="w-4 h-4 text-cyan-500" />
            <span>Importar Archivo .YDK</span>
          </button>

          <button
            onClick={() => {
              if (hasCards) {
                onExportYdk();
                setIsOpen(false);
              }
            }}
            disabled={!hasCards}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Exportar Archivo .YDK</span>
          </button>

          <div className="my-1 border-t border-zinc-100 dark:border-zinc-900" />

          <button
            onClick={() => {
              onSyncMeta();
              setIsOpen(false);
            }}
            disabled={isSyncing}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left cursor-pointer disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 text-amber-500 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Meta MDM'}</span>
          </button>

          <button
            onClick={() => {
              if (hasCards) {
                onClear();
                setIsOpen(false);
              }
            }}
            disabled={!hasCards}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl font-bold text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpiar Mesa de Trabajo</span>
          </button>

          {isSavedDeck && onDeleteDeck && (
            <button
              onClick={() => {
                onDeleteDeck();
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left cursor-pointer border-t border-zinc-100 dark:border-zinc-900 mt-1 pt-2"
            >
              <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
              <div className="flex-1">
                <span>Eliminar Baraja Guardada</span>
                <p className="text-[10px] text-red-500/80 font-normal">Borrar definitivamente de la BD</p>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
