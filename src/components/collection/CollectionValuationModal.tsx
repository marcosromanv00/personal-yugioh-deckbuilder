'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp } from 'lucide-react';
import { UserCard, StorageLocation, Deck } from '@/types/collection';
import { ValuationTab } from './components/ValuationTab';

interface CollectionValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCards: UserCard[];
  locations: StorageLocation[];
  decks: Deck[];
  onOpenContainer?: (containerId: string) => void;
  onOpenDeck?: (deck: Deck) => void;
}

export const CollectionValuationModal: React.FC<CollectionValuationModalProps> = ({
  isOpen,
  onClose,
  userCards,
  locations,
  decks,
  onOpenContainer,
  onOpenDeck,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="w-full max-w-6xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-dvh sm:h-auto sm:max-h-[92vh]"
        >
          {/* Header Modal */}
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-tight font-display">
                  Reporte Financiero y <span className="text-red-600 dark:text-red-500">Valoración</span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                  Análisis completo de costos, valor de mercado y oportunidades de venta.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Scrollable */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-zinc-800 dark:text-zinc-200 font-sans">
            <ValuationTab
              userCards={userCards}
              locations={locations}
              decks={decks}
              onOpenContainer={(containerId) => {
                onClose();
                onOpenContainer?.(containerId);
              }}
              onOpenDeck={(deck) => {
                onClose();
                onOpenDeck?.(deck);
              }}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
