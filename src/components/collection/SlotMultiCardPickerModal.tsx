'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, X, Eye, ArrowRightLeft, Inbox, ShieldCheck } from 'lucide-react';
import { UserCard } from '@/types/collection';
import { getCategoryBadgeStyle, getLanguageDisplay } from '@/lib/collectionUtils';

interface SlotMultiCardPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: number | null;
  slot: number | null;
  cardsInSlot: UserCard[];
  onSelectCard: (card: UserCard) => void;
  onOpenMoveVariantModal?: (card: UserCard) => void;
  onSendCardToStaged?: (card: UserCard) => void;
}

export const SlotMultiCardPickerModal: React.FC<SlotMultiCardPickerModalProps> = ({
  isOpen,
  onClose,
  page,
  slot,
  cardsInSlot,
  onSelectCard,
  onOpenMoveVariantModal,
  onSendCardToStaged,
}) => {
  if (!isOpen || !cardsInSlot || cardsInSlot.length === 0) return null;

  const totalQuantity = cardsInSlot.reduce((sum, c) => sum + (c.quantity || 1), 0);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans select-none overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-visible flex flex-col relative z-10 text-zinc-900 dark:text-zinc-100 my-auto"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/50 rounded-t-3xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/40">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-mono">
                  Slot {slot} · Pág. {page}
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                  {cardsInSlot.length} cartas distintas ({totalQuantity}/4 físicas)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Cards List */}
          <div className="p-4 space-y-2.5 max-h-96 overflow-y-auto">
            {cardsInSlot.map((c, idx) => {
              const langDisplay = getLanguageDisplay(c.language);
              const catBadge = getCategoryBadgeStyle(c.status_flag);

              return (
                <div
                  key={c.id || idx}
                  className="p-3 bg-zinc-50 dark:bg-zinc-900/70 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-3 transition-all"
                >
                  <div 
                    onClick={() => {
                      onSelectCard(c);
                      onClose();
                    }}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                  >
                    {/* Mini Artwork */}
                    <div className="relative w-11 aspect-3/4 rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-zinc-200 dark:border-zinc-800 shadow-2xs group-hover:ring-2 group-hover:ring-red-500/50 transition-all">
                      {c.card_details && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={c.card_details.image_url_small || c.card_details.image_url}
                          alt={c.card_details.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-0.5 right-0.5 bg-zinc-950/90 text-purple-300 font-mono text-[8.5px] px-1 rounded font-bold">
                        {c.quantity || 1}x
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-red-500 transition-colors">
                        {c.card_details?.name || 'Carta'}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9.5px] font-mono font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/60">
                          {c.rarity || 'Common'}
                        </span>
                        <span className="text-[9.5px] font-mono text-zinc-500 dark:text-zinc-400">
                          {c.condition || 'Near Mint'}
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {langDisplay.badge}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${catBadge.badgeBgClass} ${catBadge.textColorClass} ${catBadge.borderColorClass}`}>
                          {catBadge.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this specific card */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCard(c);
                        onClose();
                      }}
                      title="Inspeccionar carta en panel de detalles"
                      className="p-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer min-h-10 min-w-10 flex items-center justify-center touch-manipulation"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {onOpenMoveVariantModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenMoveVariantModal(c);
                          onClose();
                        }}
                        title="Mover esta carta a otro contenedor"
                        className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 transition-colors cursor-pointer min-h-10 min-w-10 flex items-center justify-center touch-manipulation"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onSendCardToStaged && (
                      <button
                        type="button"
                        onClick={() => {
                          onSendCardToStaged(c);
                          onClose();
                        }}
                        title="Quitar del slot y enviar a pendientes del binder"
                        className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 transition-colors cursor-pointer min-h-10 min-w-10 flex items-center justify-center touch-manipulation"
                      >
                        <Inbox className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 rounded-b-3xl flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              Capacidad: {totalQuantity} de 4 cartas
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
