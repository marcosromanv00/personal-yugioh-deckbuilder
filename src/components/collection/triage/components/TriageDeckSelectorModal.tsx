'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Swords, Check, Layers } from 'lucide-react';
import { Deck } from '@/types/collection';

interface TriageDeckSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  cardType?: string;
  decks: Deck[];
  initialSelectedDeckId?: string | null;
  onAssignToDeck: (deckId: string, section: 'main' | 'extra' | 'side') => void;
}

const isExtraDeckCard = (type?: string): boolean => {
  if (!type) return false;
  const t = type.toLowerCase();
  return t.includes('fusion') || t.includes('synchro') || t.includes('xyz') || t.includes('link');
};

export const TriageDeckSelectorModal: React.FC<TriageDeckSelectorModalProps> = ({
  isOpen,
  onClose,
  cardName,
  cardType,
  decks,
  initialSelectedDeckId,
  onAssignToDeck,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<'main' | 'extra' | 'side'>(() =>
    isExtraDeckCard(cardType) ? 'extra' : 'main'
  );
  const [selectedDeckId, setSelectedDeckId] = useState<string>(() =>
    initialSelectedDeckId || decks.find((d) => d.is_active)?.id || decks[0]?.id || ''
  );

  const filteredDecks = useMemo(() => {
    if (!searchQuery.trim()) return decks;
    const q = searchQuery.toLowerCase().trim();
    return decks.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.format && d.format.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q))
    );
  }, [decks, searchQuery]);

  const handleConfirm = () => {
    if (!selectedDeckId) return;
    onAssignToDeck(selectedDeckId, selectedSection);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && selectedDeckId) handleConfirm();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-red-600/10 text-red-600 dark:text-red-400 rounded-xl">
              <Swords className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                Asignar Carta a Mazo
              </h3>
              <p className="text-xs text-zinc-500 font-mono truncate max-w-xs sm:max-w-sm">
                {cardName} {cardType ? `• ${cardType}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer min-h-11 min-w-11 flex items-center justify-center touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Selector */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 space-y-2 shrink-0">
          <label className="text-[10px] font-mono font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Sección de Destino en el Mazo</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['main', 'extra', 'side'] as const).map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSelectedSection(sec)}
                className={`min-h-11 py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation ${
                  selectedSection === sec
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                {sec === 'main' ? 'Main Deck' : sec === 'extra' ? 'Extra Deck' : 'Side Deck'}
              </button>
            ))}
          </div>
        </div>

        {/* Deck Search */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar mazo por nombre o formato..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        {/* Decks List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-48">
          {filteredDecks.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-8 font-mono">
              No se encontraron mazos que coincidan con la búsqueda.
            </p>
          ) : (
            filteredDecks.map((deck) => {
              const isSelected = selectedDeckId === deck.id;
              const cardCount = deck.cards?.length || 0;
              return (
                <div
                  key={deck.id}
                  onClick={() => setSelectedDeckId(deck.id)}
                  onDoubleClick={handleConfirm}
                  className={`p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between touch-manipulation ${
                    isSelected
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-500 text-red-950 dark:text-red-100 shadow-2xs'
                      : 'bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  <div className="truncate pr-3">
                    <div className="font-bold truncate flex items-center gap-1.5">
                      <span>{deck.name}</span>
                      {deck.is_active && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                          Activo
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-2 mt-0.5">
                      <span>Formato: {deck.format || 'Standard'}</span>
                      <span>•</span>
                      <span>{cardCount} cartas registradas</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center">
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2 shrink-0 bg-zinc-50/50 dark:bg-zinc-950/50">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-4 py-2 rounded-xl text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer touch-manipulation"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedDeckId}
            className="min-h-11 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-xs disabled:cursor-not-allowed touch-manipulation"
          >
            Asignar al Mazo
          </button>
        </div>
      </div>
    </div>
  );
};
