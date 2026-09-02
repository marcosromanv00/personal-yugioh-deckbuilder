'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Trash2, Pin, AlertTriangle, Loader2 } from 'lucide-react';
import { CardImage } from '@/components/ui/CardImage';

interface RelocateDeckCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId?: number;
  cardName: string;
  cardImageUrl?: string;
  quantity: number;
  deckName: string;
  deckSection: string;
  targetLocationName: string;
  onConfirmRemoveFromDeck: () => void;
  onConfirmKeepInDeck: () => void;
  loading?: boolean;
}

export const RelocateDeckCardModal: React.FC<RelocateDeckCardModalProps> = ({
  isOpen,
  onClose,
  cardId,
  cardName,
  cardImageUrl,
  quantity,
  deckName,
  deckSection,
  targetLocationName,
  onConfirmRemoveFromDeck,
  onConfirmKeepInDeck,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={loading ? undefined : onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-10 p-5 sm:p-6 text-zinc-900 dark:text-zinc-100 space-y-5"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50 min-h-10 min-w-10 flex items-center justify-center touch-manipulation"
            title="Cancelar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100">
                Mover Carta Asignada a Mazo
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                Confirmación de reubicación física
              </p>
            </div>
          </div>

          {/* Card & Movement Summary Card */}
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center gap-3.5">
            {/* Card preview image */}
            <div className="w-14 h-20 rounded-lg overflow-hidden shrink-0 border border-zinc-300 dark:border-zinc-700 shadow-sm relative">
              {cardImageUrl || cardId ? (
                <CardImage
                  alt={cardName}
                  src={cardImageUrl || `https://images.ygoprodeck.com/images/cards/${cardId}.jpg`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-mono">
                  🃏
                </div>
              )}
              {quantity > 1 && (
                <span className="absolute top-1 right-1 bg-black/90 text-white font-mono text-[9.5px] font-black px-1.5 py-0.2 rounded shadow-xs">
                  x{quantity}
                </span>
              )}
            </div>

            {/* Path details */}
            <div className="min-w-0 flex-1 space-y-1.5">
              <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 block truncate">
                {cardName} {quantity > 1 ? `(${quantity} copias)` : ''}
              </span>

              <div className="flex items-center gap-1.5 text-[11px] font-mono flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 font-bold truncate max-w-35">
                  🎴 {deckName} ({deckSection.toUpperCase()})
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900/40 font-bold truncate max-w-35">
                  📦 {targetLocationName}
                </span>
              </div>

              <p className="text-[10.5px] text-zinc-500 leading-snug">
                ¿Qué deseas hacer con la presencia de esta carta en la lista del mazo?
              </p>
            </div>
          </div>

          {/* Action Options */}
          <div className="space-y-2.5">
            {/* Option 1: Remove from deck (Recommended) */}
            <button
              type="button"
              onClick={onConfirmRemoveFromDeck}
              disabled={loading}
              className="w-full p-3.5 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white transition-all text-left flex items-start gap-3 cursor-pointer shadow-md shadow-red-600/20 disabled:opacity-50 min-h-12 touch-manipulation"
            >
              <div className="p-2 rounded-xl bg-white/20 shrink-0 mt-0.5">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-black uppercase tracking-wider block">
                  1. Quitar de la Receta del Mazo y Mover
                </span>
                <span className="text-[11px] text-white/90 leading-tight block mt-0.5">
                  Resta {quantity} {quantity === 1 ? 'copia' : 'copias'} de la lista del mazo y traslada la carta física a {targetLocationName} conservando sus fundas registradas.
                </span>
              </div>
            </button>

            {/* Option 2: Only move physically (Keep in deck) */}
            <button
              type="button"
              onClick={onConfirmKeepInDeck}
              disabled={loading}
              className="w-full p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 active:scale-[0.99] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-all text-left flex items-start gap-3 cursor-pointer disabled:opacity-50 min-h-12 touch-manipulation"
            >
              <div className="p-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 shrink-0 mt-0.5 text-zinc-700 dark:text-zinc-300">
                <Pin className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-black uppercase tracking-wider block">
                  2. Solo Mover Físicamente (Mantener en Mazo)
                </span>
                <span className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-tight block mt-0.5">
                  La carta se mantiene en la receta digital del mazo, pero se registra que físicamente reside en {targetLocationName} (útil para staples o carpetas compartidas).
                </span>
              </div>
            </button>
          </div>

          {/* Footer Cancel */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer min-h-11 sm:min-h-9 touch-manipulation"
            >
              Cancelar (No mover)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
