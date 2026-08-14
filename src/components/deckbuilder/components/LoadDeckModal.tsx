import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Loader2, Trash } from 'lucide-react';
import { Deck } from '@/types/collection';

interface LoadDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadingDecks: boolean;
  savedDecks: Deck[];
  handleLoadDeck: (selected: Deck) => void;
  handleDeleteDeck: (id: string) => Promise<void>;
}

/**
 * LoadDeckModal Component
 * Renders the modal with the complete saved decks registry.
 * Users can choose to load a deck to the workspace or completely delete it.
 */
export const LoadDeckModal: React.FC<LoadDeckModalProps> = ({
  isOpen,
  onClose,
  loadingDecks,
  savedDecks,
  handleLoadDeck,
  handleDeleteDeck,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-end md:items-center justify-center md:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="bg-slate-900 border border-slate-800 md:rounded-2xl rounded-t-3xl w-full md:max-w-2xl shadow-2xl p-5 overflow-hidden flex flex-col max-h-[85vh] md:max-h-[80vh]"
            style={{ paddingBottom: 'calc(1.25rem + var(--sab))' }}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="font-bold text-lg text-slate-100 flex items-center gap-1.5">
                  <FolderOpen className="w-5 h-5 text-purple-400" />
                  Cargar Baraja Guardada
                </h3>
                <p className="text-xs text-slate-400">Selecciona una baraja de tu base de datos para cargarla al constructor.</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Decks Listing */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              {loadingDecks ? (
                <div className="text-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
                  <p className="text-xs font-mono text-slate-500">Cargando lista de barajas...</p>
                </div>
              ) : savedDecks.length === 0 ? (
                <div className="text-center py-12 text-zinc-550 text-sm">
                  No tienes ninguna baraja guardada en la base de datos todavía.
                </div>
              ) : (
                savedDecks.map((deck) => (
                  <div
                    key={deck.id}
                    className="p-4 bg-slate-950 border border-slate-850 hover:border-purple-500/40 rounded-xl flex items-center justify-between gap-4 transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-200 group-hover:text-purple-300 transition-colors">{deck.name}</h4>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-slate-400 font-mono">
                          {deck.format}
                        </span>
                      </div>
                      {deck.description && (
                        <p className="text-xs text-slate-550 mt-1 line-clamp-1">{deck.description}</p>
                      )}
                      <p className="text-[10px] text-slate-500 font-mono mt-1.5">
                        {deck.cards?.reduce((acc: number, c: any) => acc + c.count, 0) || 0} cartas • Creado el {new Date(deck.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadDeck(deck)}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold transition-all cursor-pointer"
                      >
                        Cargar
                      </button>
                      <button
                        onClick={() => handleDeleteDeck(deck.id)}
                        className="p-1.5 bg-slate-900 border border-slate-800 text-slate-500 hover:text-red-400 hover:bg-red-950/20 hover:border-red-900/40 rounded transition-all cursor-pointer"
                        title="Eliminar deck"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
