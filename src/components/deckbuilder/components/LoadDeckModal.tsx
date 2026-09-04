import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Loader2, Trash, X } from 'lucide-react';
import { Deck, DeckCardDetail } from '@/types/collection';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface LoadDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadingDecks: boolean;
  savedDecks: Deck[];
  handleLoadDeck: (selected: Deck) => void;
  handleDeleteDeck: (id: string) => Promise<boolean | void>;
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
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-0 md:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none md:rounded-3xl w-full md:max-w-2xl shadow-2xl p-5 overflow-hidden flex flex-col h-dvh md:h-auto md:max-h-[80vh] text-zinc-900 dark:text-zinc-100"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span>Cargar Baraja Guardada</span>
                </h3>
                <p className="text-[10px] text-zinc-500 font-mono">Selecciona una baraja para cargarla al constructor.</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Decks Listing */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 scrollbar-thin">
              {loadingDecks ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-red-600 dark:text-red-400 mb-2" />
                  <p className="text-xs font-mono text-zinc-400">Cargando lista de barajas...</p>
                </div>
              ) : savedDecks.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 text-xs font-bold font-mono">
                  No tienes ninguna baraja guardada en la base de datos todavía.
                </div>
              ) : (
                savedDecks.map((deck) => (
                  <div
                    key={deck.id}
                    className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all group shadow-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">{deck.name}</h4>
                        <span className="text-[9px] px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-mono font-bold shrink-0">
                          {deck.format}
                        </span>
                      </div>
                      {deck.description && (
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{deck.description}</p>
                      )}
                      <p className="text-[10px] text-zinc-400 font-mono mt-1">
                        {deck.cards?.reduce((acc: number, c: DeckCardDetail) => acc + c.count, 0) || 0} cartas • Creado el {new Date(deck.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleLoadDeck(deck)}
                        className="px-4 py-2.5 sm:py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-red-600/25 touch-manipulation min-h-11 sm:min-h-9"
                      >
                        Cargar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeckToDelete(deck)}
                        className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all cursor-pointer touch-manipulation"
                        title="Eliminar baraja"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer touch-manipulation min-h-11 sm:min-h-9"
              >
                Cerrar
              </button>
            </div>

            {/* Diálogo de Confirmación */}
            <ConfirmDialog
              isOpen={Boolean(deckToDelete)}
              title="¿Eliminar baraja de la base de datos?"
              description={`¿Estás seguro de que deseas eliminar permanentemente la baraja "${deckToDelete?.name}"? Las cartas físicas que contiene permanecerán intactas en tu colección general.`}
              confirmLabel="Eliminar Baraja"
              cancelLabel="Cancelar"
              variant="danger"
              isLoading={isDeleting}
              onConfirm={async () => {
                if (!deckToDelete) return;
                setIsDeleting(true);
                try {
                  await handleDeleteDeck(deckToDelete.id);
                  setDeckToDelete(null);
                } finally {
                  setIsDeleting(false);
                }
              }}
              onClose={() => setDeckToDelete(null)}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
