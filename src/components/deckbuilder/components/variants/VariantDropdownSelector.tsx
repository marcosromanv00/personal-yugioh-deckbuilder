'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Layers, ChevronDown, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { DeckVariant } from '@/types/collection';

interface VariantDropdownSelectorProps {
  variants: DeckVariant[];
  activeVariant: DeckVariant | null;
  onSelectVariant: (variant: DeckVariant) => void;
  onOpenNewVariantModal: () => void;
  onDeleteVariant: (variantId: string) => void;
}

export const VariantDropdownSelector: React.FC<VariantDropdownSelectorProps> = ({
  variants,
  activeVariant,
  onSelectVariant,
  onOpenNewVariantModal,
  onDeleteVariant,
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

  if (variants.length === 0) {
    return (
      <button
        type="button"
        onClick={onOpenNewVariantModal}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-semibold transition-all cursor-pointer min-h-9 touch-manipulation shadow-2xs"
        title="Crear una variante para este mazo"
      >
        <Plus className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
        <span className="hidden sm:inline">Crear</span> Variante
      </button>
    );
  }

  const displayName = activeVariant?.name || 'Variante Activa';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-9 touch-manipulation shadow-2xs ${
          isOpen
            ? 'bg-zinc-100 dark:bg-zinc-800 border-red-500/60 dark:border-red-500/60 text-zinc-900 dark:text-white'
            : 'bg-zinc-50 dark:bg-zinc-800/90 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-200'
        }`}
        title={`Variante actual: ${displayName}. Clic para cambiar de variante.`}
        aria-expanded={isOpen}
      >
        <Layers className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
        
        <span className="truncate max-w-36 sm:max-w-48 font-black">
          {displayName}
        </span>

        <span className="hidden xs:inline-flex px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-mono font-black uppercase tracking-wider shadow-2xs">
          Activa
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-red-500' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 sm:w-72 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl p-1.5 z-60 text-xs text-zinc-700 dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-100">
          {/* Header del Selector */}
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
            <span>Variantes en Deckbox</span>
            <span className="font-mono bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded-md text-[10px]">
              {variants.length}
            </span>
          </div>

          {/* Lista de Variantes */}
          <div className="py-1 max-h-56 overflow-y-auto scrollbar-thin space-y-0.5">
            {variants.map((v) => {
              const isActive = v.id === activeVariant?.id;
              const cardCount = v.cards?.reduce((acc, c) => acc + c.count, 0) || 0;

              return (
                <div
                  key={v.id}
                  onClick={() => {
                    setIsOpen(false);
                    onSelectVariant(v);
                  }}
                  className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold border border-red-200/60 dark:border-red-800/40'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isActive ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                    ) : (
                      <Layers className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 shrink-0" />
                    )}
                    <span className="truncate">{v.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {cardCount > 0 && (
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                        {cardCount}c
                      </span>
                    )}

                    {isActive ? (
                      <span className="px-1.5 py-0.2 rounded bg-red-600 text-white text-[9px] font-mono font-black uppercase">
                        Activa
                      </span>
                    ) : variants.length > 1 ? (
                      <button
                        type="button"
                        title={`Eliminar variante ${v.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteVariant(v.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-500 text-zinc-400 cursor-pointer rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botón Crear Nueva Variante */}
          <div className="pt-1 mt-1 border-t border-zinc-100 dark:border-zinc-900">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenNewVariantModal();
              }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left cursor-pointer min-h-9 touch-manipulation"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>+ Nueva Variante...</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
