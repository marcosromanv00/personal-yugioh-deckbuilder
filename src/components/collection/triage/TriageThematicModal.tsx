'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Flame, Sparkles, X, Plus, Hash } from 'lucide-react';
import { TriageThematicIncubator } from '@/types/triage';

interface TriageThematicModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  currentThemeTag?: string | null;
  suggestedIncubators: TriageThematicIncubator[];
  availableThemes: { name: string; count: number }[];
  onApplyTheme: (themeTag: string) => void;
}

export const TriageThematicModal: React.FC<TriageThematicModalProps> = ({
  isOpen,
  onClose,
  cardName,
  currentThemeTag,
  suggestedIncubators,
  availableThemes,
  onApplyTheme,
}) => {
  const [customInput, setCustomInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    onApplyTheme(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-xl">
              <Flame className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                Mesa / Pool Temático
              </h2>
              <p className="text-[11px] font-mono text-zinc-500 truncate max-w-64">
                {cardName} {currentThemeTag && `(Actual: ${currentThemeTag})`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Sugerencias Directas de la Carta */}
        {suggestedIncubators.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-purple-600 dark:text-purple-400">
              <Sparkles className="w-3 h-3" />
              <span>Sugerencias para esta carta</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestedIncubators.map((inc, i) => (
                <button
                  key={`${inc.themeName}-${i}`}
                  type="button"
                  onClick={() => handleConfirm(inc.themeName)}
                  className="px-2.5 py-1.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 rounded-xl text-xs font-mono font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Hash className="w-3 h-3 text-purple-500" />
                  <span>{inc.themeName}</span>
                  <span className="text-[10px] text-purple-400 font-normal">({inc.totalCardsInCollection})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Temáticas Existentes en la Colección */}
        {availableThemes.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono font-bold uppercase text-zinc-500">
              Mesas de trabajo ya registradas
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {availableThemes.map(th => (
                <button
                  key={th.name}
                  type="button"
                  onClick={() => handleConfirm(th.name)}
                  className="px-2 py-1 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono text-zinc-800 dark:text-zinc-200 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{th.name}</span>
                  <span className="text-[10px] text-zinc-400">({th.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Crear Nueva Temática */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleConfirm(customInput);
          }}
          className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-900"
        >
          <div className="text-[10px] font-mono font-bold uppercase text-zinc-500">
            Escribir otra temática personalizada
          </div>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              placeholder="Ej: Deck Dragón, Reptiles, Fun..."
              className="flex-1 min-h-11 px-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={!customInput.trim()}
              className="min-h-11 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Asignar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
