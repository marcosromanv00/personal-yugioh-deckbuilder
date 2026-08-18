import React from 'react';
import { Layers, HelpCircle } from 'lucide-react';
import { Deck, StorageLocation } from '@/types/collection';

interface DecksPanelProps {
  decks: Deck[];
  locations: StorageLocation[];
  setDecks: React.Dispatch<React.SetStateAction<Deck[]>>;
  handleDragStart: (e: React.DragEvent, deckId: string) => void;
  onDeckClick: (deck: Deck) => void;
}

/**
 * DecksPanel Component
 * Displays the sidebar with all active and inactive deck recipes.
 * Supports drag and drop to assign decks into physical deckboxes/binders.
 */
export const DecksPanel: React.FC<DecksPanelProps> = ({
  decks,
  locations,
  setDecks,
  handleDragStart,
  onDeckClick,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-colors max-h-[calc(100vh-6.5rem)] flex flex-col w-full">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex flex-col gap-2 shrink-0 mb-3">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-xs uppercase tracking-wider flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Layers className="w-4 h-4 text-red-500" />
            <span>Mis Barajas</span>
          </h2>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            {decks.length} {decks.length === 1 ? 'baraja' : 'barajas'}
          </span>
        </div>
        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1 font-medium">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <span>Arrastra una baraja y suéltala en un Deckbox o haz clic para verla.</span>
        </p>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-10 text-zinc-500 text-xs font-bold">
          No tienes barajas guardadas en la base de datos. Crea una en el taller.
        </div>
      ) : (
        <div className="space-y-2.5 overflow-y-auto min-h-0 pr-1 flex-1 scrollbar-thin">
          {decks.map((deck) => {
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
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 shadow-xs hover:border-red-500/50 cursor-pointer ${
                  isActive
                    ? 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
                    : 'bg-zinc-100 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-black text-xs text-zinc-900 dark:text-zinc-100 truncate">{deck.name}</h4>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono font-bold uppercase">
                      {deck.format}
                    </span>
                    <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                      isActive ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40' : 'bg-zinc-200 dark:bg-zinc-900 text-zinc-500 border border-zinc-300 dark:border-zinc-800'
                    }`}>
                      {isActive ? 'Activo' : 'Inactivo (Receta)'}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono font-bold">
                    {deck.cards?.reduce((acc: number, c: any) => acc + c.count, 0) || 0} cartas
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
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
                    className="text-[9px] font-mono font-bold text-zinc-500 hover:text-red-500 underline cursor-pointer"
                  >
                    {isActive ? 'Marcar Inactivo' : 'Marcar Activo'}
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
