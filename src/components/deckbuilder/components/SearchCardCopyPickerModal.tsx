'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Box, AlertTriangle, Plus } from 'lucide-react';
import { StorageLocation, UserCard } from '@/types/collection';
import { Card } from '../types';

interface SearchCardCopyPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card | null;
  copies: UserCard[];
  locations: StorageLocation[];
  targetSection: 'main' | 'extra' | 'side' | 'extras';
  onSelectCopy: (copy: UserCard) => void;
  onSelectGeneric: () => void;
}

export const SearchCardCopyPickerModal: React.FC<SearchCardCopyPickerModalProps> = ({
  isOpen,
  onClose,
  card,
  copies,
  locations,
  targetSection,
  onSelectCopy,
  onSelectGeneric,
}) => {
  if (!isOpen || !card) return null;

  const getLocationLabel = (copy: UserCard) => {
    if (!copy.storage_location_id) {
      return { text: 'Bandeja Sin Clasificar (Inbox)', isConflict: false };
    }
    const loc = locations.find(l => l.id === copy.storage_location_id);
    const locName = loc ? loc.name : 'Contenedor externo';
    if (copy.binder_page && copy.binder_slot) {
      return { text: `${locName} • Pág. ${copy.binder_page}, Ranura ${copy.binder_slot}`, isConflict: false };
    }
    if (copy.deck_id) {
      return { text: `${locName} • Asignada a otro mazo`, isConflict: true };
    }
    const compName = loc?.compartments?.names?.[copy.compartment_index || 0] || `Carril ${(copy.compartment_index || 0) + 1}`;
    return { text: `${locName} • ${compName}`, isConflict: false };
  };

  const sectionName = targetSection === 'extras' ? 'Reserva' : targetSection.toUpperCase();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.16 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-zinc-900 dark:text-zinc-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-950/70">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xs">
                {card.image_url ? (
                  <Image src={card.image_url_small || card.image_url} alt={card.name} fill sizes="40px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] text-zinc-400">YGO</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">{card.name}</h3>
                <p className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                  <span>Añadiendo a:</span>
                  <span className="font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">{sectionName}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subtítulo de selección */}
          <div className="px-4 py-2.5 bg-zinc-100/60 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
            Tienes <b className="text-zinc-900 dark:text-white font-bold">{copies.length} copias</b> registradas en tu colección. Selecciona cuál deseas asignar:
          </div>

          {/* Lista de Copias Físicas */}
          <div className="p-3 sm:p-4 space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
            {copies.map((copy, index) => {
              const locInfo = getLocationLabel(copy);
              return (
                <div
                  key={copy.id || index}
                  onClick={() => onSelectCopy(copy)}
                  className="p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-red-500 dark:hover:border-red-500/70 bg-zinc-50/50 dark:bg-zinc-950/40 hover:bg-red-50/30 dark:hover:bg-red-950/20 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-[10px] font-black uppercase tracking-wider">
                        {copy.rarity || 'Common'}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 font-bold">
                        {copy.condition || 'Near Mint'}
                      </span>
                      {copy.is_proxy && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[9px] font-bold">
                          Proxy
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                      {locInfo.isConflict ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      ) : (
                        <Box className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      )}
                      <span className="truncate">{locInfo.text}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCopy(copy);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-xs min-h-9 touch-manipulation"
                  >
                    Asignar
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer: Opción de Añadir como Pendiente / Genérica */}
          <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onSelectGeneric}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-11 touch-manipulation"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-500" />
              <span>Añadir como Genérica (Sin asignar / Pendiente)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
