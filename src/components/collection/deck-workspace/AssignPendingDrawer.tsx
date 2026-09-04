'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Box, Check, Plus, AlertTriangle, Layers } from 'lucide-react';
import { StorageLocation, UserCard, DeckCardDetail } from '@/types/collection';

interface AssignPendingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  section: 'main' | 'extra' | 'side' | 'pool' | null;
  pendingCards: DeckCardDetail[];
  userCards: UserCard[];
  locations: StorageLocation[];
  onAssignCopy: (cardId: number, section: string, copy: UserCard) => void;
  onRegisterNewCopy?: (cardId: number, isProxy: boolean) => void;
}

export const AssignPendingDrawer: React.FC<AssignPendingDrawerProps> = ({
  isOpen,
  onClose,
  section,
  pendingCards,
  userCards,
  locations,
  onAssignCopy,
  onRegisterNewCopy,
}) => {
  if (!isOpen || !section) return null;

  const sectionName = section === 'pool' ? 'Reserva / Pool' : `${section.toUpperCase()} DECK`;

  const getLocationText = (copy: UserCard) => {
    if (!copy.storage_location_id) return { text: 'Inbox (Sin clasificar)', isConflict: false };
    const loc = locations.find((l) => l.id === copy.storage_location_id);
    const baseName = loc ? loc.name : 'Contenedor';
    if (copy.binder_page && copy.binder_slot) {
      return { text: `${baseName} • Pág. ${copy.binder_page}, Ranura ${copy.binder_slot}`, isConflict: false };
    }
    if (copy.deck_id) {
      return { text: `${baseName} • En otro mazo`, isConflict: true };
    }
    return { text: baseName, isConflict: false };
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="w-full max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 h-full flex flex-col shadow-2xl text-zinc-900 dark:text-zinc-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-950/80">
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-600" />
                <span>Asignar Pendientes</span>
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{sectionName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Listado de cartas pendientes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {pendingCards.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold">¡Todas las cartas de esta sección tienen copia física asignada!</p>
              </div>
            ) : (
              pendingCards.map((card) => {
                const assignedCount = card.physical_copies?.length || 0;
                const neededCount = Math.max(0, card.count - assignedCount);
                const availableCopies = userCards.filter((uc) => uc.card_id === card.card_id);

                return (
                  <div
                    key={card.card_id}
                    className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xs">
                        {card.card_details?.image_url && (
                          <Image src={card.card_details.image_url} alt={card.card_details.name} fill sizes="40px" className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">{card.card_details?.name || `Carta #${card.card_id}`}</h4>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 mt-0.5">
                          <span>Req: {card.count}</span>
                          <span>•</span>
                          <span>Asignadas: <b className="text-emerald-600 dark:text-emerald-400">{assignedCount}</b></span>
                          <span>•</span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold">Faltan: {neededCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Copias Disponibles en Colección */}
                    <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800/60">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Copias en Colección:</span>
                      {availableCopies.length === 0 ? (
                        <div className="text-[11px] text-zinc-500 py-1 flex items-center justify-between">
                          <span>Sin copias físicas registradas</span>
                          {onRegisterNewCopy && (
                            <button
                              type="button"
                              onClick={() => onRegisterNewCopy(card.card_id, false)}
                              className="text-[10px] font-bold text-red-600 hover:text-red-500 cursor-pointer flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Registrar
                            </button>
                          )}
                        </div>
                      ) : (
                        availableCopies.map((copy) => {
                          const loc = getLocationText(copy);
                          const isAlreadyAssigned = card.physical_copies?.some((cp) => cp.user_card_id === copy.id);

                          return (
                            <div
                              key={copy.id}
                              className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[9px] font-black uppercase">
                                    {copy.rarity || 'Common'}
                                  </span>
                                  <span className="text-[10px] font-mono text-zinc-500">{copy.condition}</span>
                                </div>
                                <div className="text-[10px] text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                                  {loc.isConflict ? <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" /> : <Box className="w-3 h-3 shrink-0" />}
                                  <span className="truncate">{loc.text}</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={isAlreadyAssigned}
                                onClick={() => onAssignCopy(card.card_id, card.section, copy)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all min-h-8 touch-manipulation cursor-pointer ${
                                  isAlreadyAssigned
                                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-500 text-white shadow-xs'
                                }`}
                              >
                                {isAlreadyAssigned ? 'Asignada' : 'Vincular'}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer min-h-11 touch-manipulation"
            >
              Listo
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
