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
    <div className="lg:col-span-4 bg-[hsl(224,22%,10%)]/75 border border-[hsl(224,15%,16%)] rounded-2xl p-5 space-y-4">
      <div className="border-b border-[hsl(224,15%,16%)] pb-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Mis Barajas</span>
          </h2>
        </div>
        <p className="text-[11px] text-slate-400 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          Arrastra una baraja activa y suéltala sobre un Deckbox o haz clic para ver detalle.
        </p>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-xs">
          No tienes barajas guardadas en la base de datos. Crea una en el constructor.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-130 overflow-y-auto pr-1 scrollbar-thin">
          {decks.map((deck) => {
            const storedIn = locations.find(l => l.id === deck.storage_location_id);
            const isActive = deck.is_active !== false;

            return (
              <div
                key={deck.id}
                draggable
                onDragStart={(e) => handleDragStart(e, deck.id)}
                onClick={() => onDeckClick(deck)}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 shadow shadow-black hover:border-purple-500/50 cursor-pointer ${
                  isActive
                    ? 'bg-slate-950 border-slate-850'
                    : 'bg-slate-950/50 border-slate-900 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-xs text-slate-200 truncate">{deck.name}</h4>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono uppercase">
                      {deck.format}
                    </span>
                    <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                      isActive ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/40' : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}>
                      {isActive ? 'Activo' : 'Inactivo (Receta)'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-505 mt-1 font-mono">
                    {deck.cards?.reduce((acc: number, c: any) => acc + c.count, 0) || 0} cartas
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {storedIn ? (
                    <span className="text-[9px] font-mono font-bold bg-cyan-950/60 text-cyan-400 border border-cyan-900/30 px-2 py-0.5 rounded-md truncate max-w-24">
                      📦 {storedIn.name}
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold bg-amber-950/30 text-amber-500 border border-amber-900/10 px-2 py-0.5 rounded-md">
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
                    className="text-[8.5px] font-mono text-slate-400 hover:text-purple-300 underline cursor-pointer"
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
