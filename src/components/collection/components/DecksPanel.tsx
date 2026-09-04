'use client';

import React, { useState, useMemo } from 'react';
import { Layers, HelpCircle, Search, X, GripVertical } from 'lucide-react';
import { Deck, DeckCardDetail, StorageLocation } from '@/types/collection';

interface DecksPanelProps {
  decks: Deck[];
  locations: StorageLocation[];
  setDecks: React.Dispatch<React.SetStateAction<Deck[]>>;
  handleDragStart: (e: React.DragEvent, deckId: string) => void;
  onDeckClick: (deck: Deck) => void;
}

export const DecksPanel: React.FC<DecksPanelProps> = ({
  decks,
  locations,
  setDecks,
  handleDragStart,
  onDeckClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [panelFilter, setPanelFilter] = useState<'all' | 'unassigned' | 'active'>('all');

  // Conteo de barajas sin almacenar
  const unassignedCount = useMemo(() => {
    return decks.filter(d => {
      const storedIn = locations.find(
        l => l.id === d.storage_location_id || Boolean(l.compartments?.deck_ids?.includes(d.id))
      );
      return !storedIn;
    }).length;
  }, [decks, locations]);

  const activeCount = useMemo(() => {
    return decks.filter(d => d.is_active !== false).length;
  }, [decks]);

  const filteredDecks = useMemo(() => {
    return decks.filter(deck => {
      const matchesSearch = deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (deck.format && deck.format.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      const storedIn = locations.find(
        l => l.id === deck.storage_location_id || Boolean(l.compartments?.deck_ids?.includes(deck.id))
      );

      if (panelFilter === 'unassigned') {
        return !storedIn;
      }
      if (panelFilter === 'active') {
        return deck.is_active !== false;
      }
      return true;
    });
  }, [decks, locations, searchQuery, panelFilter]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4.5 shadow-sm transition-colors max-h-[calc(100vh-6.5rem)] flex flex-col w-full">
      {/* Cabecera del Panel */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex flex-col gap-2 shrink-0 mb-3">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-xs uppercase tracking-wider flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-display">
            <Layers className="w-4 h-4 text-red-500" />
            <span>Mis Barajas</span>
          </h2>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            {filteredDecks.length} / {decks.length}
          </span>
        </div>

        {/* Buscador Rápido Integrado */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar baraja o formato..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Píldoras de Filtro Rápido */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
          <button
            type="button"
            onClick={() => setPanelFilter('all')}
            className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center truncate ${
              panelFilter === 'all'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Todos ({decks.length})
          </button>
          <button
            type="button"
            onClick={() => setPanelFilter('unassigned')}
            className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center truncate ${
              panelFilter === 'unassigned'
                ? 'bg-amber-500 text-zinc-950 shadow-xs'
                : 'text-amber-600 dark:text-amber-400 hover:text-amber-700'
            }`}
          >
            Sin guardar ({unassignedCount})
          </button>
          <button
            type="button"
            onClick={() => setPanelFilter('active')}
            className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center truncate ${
              panelFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
            }`}
          >
            Activos ({activeCount})
          </button>
        </div>

        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-medium mt-0.5">
          <HelpCircle className="w-3 h-3 text-cyan-500 shrink-0" />
          <span>Arrastra y suelta en un Deckbox o haz clic para ver.</span>
        </p>
      </div>

      {/* Listado de Decks */}
      {filteredDecks.length === 0 ? (
        <div className="text-center py-10 text-zinc-500 text-xs font-medium">
          {decks.length === 0
            ? 'No tienes barajas guardadas. Diseña una en el taller.'
            : 'No se encontraron barajas con los filtros actuales.'}
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto min-h-0 pr-1 flex-1 scrollbar-thin">
          {filteredDecks.map((deck) => {
            const storedIn = locations.find(
              l => l.id === deck.storage_location_id || Boolean(l.compartments?.deck_ids?.includes(deck.id))
            );
            let laneName = '';
            if (storedIn && storedIn.compartments?.deck_ids) {
              const laneIdx = storedIn.compartments.deck_ids.indexOf(deck.id);
              if (laneIdx !== -1 && storedIn.compartments.names?.[laneIdx]) {
                laneName = storedIn.compartments.names[laneIdx];
              }
            }
            const isActive = deck.is_active !== false;

            return (
              <div
                key={deck.id}
                draggable
                onDragStart={(e) => handleDragStart(e, deck.id)}
                onClick={() => onDeckClick(deck)}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 shadow-xs hover:border-red-500/50 cursor-grab active:cursor-grabbing group ${
                  isActive
                    ? 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800/80'
                    : 'bg-zinc-100/60 dark:bg-zinc-950/40 border-zinc-200/60 dark:border-zinc-800/50 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <GripVertical className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-black text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-red-500 transition-colors font-display">
                        {deck.name}
                      </h4>
                      <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono font-bold uppercase shrink-0">
                        {deck.format}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-zinc-500">
                      <span>{deck.cards?.reduce((acc: number, c: DeckCardDetail) => acc + (c.count || 0), 0) || 0} cartas</span>
                      <span className={isActive ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-400'}>
                        • {isActive ? 'Activo' : 'Receta'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  {storedIn ? (
                    <span 
                      className="text-[9px] font-mono font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900/30 px-2 py-0.5 rounded-md truncate max-w-28 text-right"
                      title={`Almacenado en: ${storedIn.name}${laneName ? ` (${laneName})` : ''}`}
                    >
                      📦 {storedIn.name}
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/20 px-2 py-0.5 rounded-md">
                      Sin almacenar
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const newActive = !isActive;
                      const previousDecks = decks;
                      setDecks(prev =>
                        prev.map(d => d.id === deck.id ? { ...d, is_active: newActive } : d)
                      );
                      try {
                        const res = await fetch('/api/decks', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: deck.id, is_active: newActive })
                        });
                        if (!res.ok) setDecks(previousDecks);
                      } catch (err) {
                        setDecks(previousDecks);
                        console.error('Error al cambiar estado activo del deck:', err);
                      }
                    }}
                    className="text-[9px] font-mono text-zinc-500 hover:text-red-500 underline cursor-pointer"
                  >
                    {isActive ? 'Inactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
