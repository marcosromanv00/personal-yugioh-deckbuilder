'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PackagePlus, 
  X, 
  Box, 
  Check, 
  FolderPlus,
  Inbox
} from 'lucide-react';
import { StorageLocation } from '@/types/collection';

export type UnregisteredAction = 'register' | 'take_collection' | 'ignore';

export interface UnregisteredCardItem {
  id: number;
  name: string;
  count: number;
  section: string;
  image_url?: string;
  image_url_small?: string;
  owned: number;
  missing: number;
}

interface UnregisteredCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unregisteredCards: UnregisteredCardItem[];
  targetLocationId: string;
  selectedLaneIndex?: number;
  locations: StorageLocation[];
  onConfirm: (cardActions: Record<number, UnregisteredAction>) => Promise<void>;
  onSkipAndSave: () => Promise<void>;
  isSaving?: boolean;
}

export const UnregisteredCardsModal: React.FC<UnregisteredCardsModalProps> = ({
  isOpen,
  onClose,
  unregisteredCards,
  targetLocationId,
  selectedLaneIndex = 0,
  locations,
  onConfirm,
  onSkipAndSave,
  isSaving = false,
}) => {
  // Inicializar acciones por defecto: si tiene copias en colección, 'take_collection', si no 'register'
  const [actions, setActions] = useState<Record<number, UnregisteredAction>>(() => {
    const initial: Record<number, UnregisteredAction> = {};
    unregisteredCards.forEach(c => {
      initial[c.id] = c.owned > 0 ? 'take_collection' : 'register';
    });
    return initial;
  });

  const targetLocation = locations.find(l => l.id === targetLocationId);
  const locationName = targetLocation ? targetLocation.name : 'Bandeja de Entrada (Inbox / Sin clasificar)';
  const laneName = targetLocation && targetLocation.compartments?.names?.[selectedLaneIndex]
    ? targetLocation.compartments.names[selectedLaneIndex]
    : `Carril ${selectedLaneIndex + 1}`;

  const setAllActions = (action: UnregisteredAction) => {
    const updated: Record<number, UnregisteredAction> = {};
    unregisteredCards.forEach(c => {
      if (action === 'take_collection' && c.owned === 0) {
        updated[c.id] = 'register';
      } else {
        updated[c.id] = action;
      }
    });
    setActions(updated);
  };

  const handleCardActionChange = (cardId: number, action: UnregisteredAction) => {
    setActions(prev => ({
      ...prev,
      [cardId]: action
    }));
  };

  const handleConfirm = async () => {
    await onConfirm(actions);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-zinc-900 dark:text-zinc-100"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-zinc-950/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 shadow-xs">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                  <span>Cartas Sin Registrar / Gestión de Inventario</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Has añadido cartas nuevas al mazo. Elige cómo integrarlas con tu colección física.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Banner de Ubicación de Destino */}
          <div className="px-5 py-3 bg-zinc-100/70 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <Box className="w-4 h-4 text-red-500 shrink-0" />
              <span>Destino físico del mazo:</span>
              <span className="font-bold text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                {locationName} {targetLocation && `• ${laneName}`}
              </span>
            </div>

            {/* Acciones Rápidas en Masa */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] text-zinc-400 font-semibold mr-1">Aplicar a todas:</span>
              <button
                type="button"
                onClick={() => setAllActions('register')}
                className="px-2 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer text-zinc-700 dark:text-zinc-300"
              >
                Registrar Todas
              </button>
              <button
                type="button"
                onClick={() => setAllActions('take_collection')}
                className="px-2 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer text-zinc-700 dark:text-zinc-300"
              >
                Tomar de Colección
              </button>
              <button
                type="button"
                onClick={() => setAllActions('ignore')}
                className="px-2 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer text-zinc-700 dark:text-zinc-300"
              >
                Ignorar Todas
              </button>
            </div>
          </div>

          {/* Lista de Cartas con Segmented Control de Acción */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-zinc-200 dark:divide-zinc-800/60 scrollbar-thin">
            {unregisteredCards.map(card => {
              const currentAction = actions[card.id] || 'register';
              const canTake = card.owned > 0;

              return (
                <div key={card.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Info Carta */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-11 h-16 rounded-lg overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                      {card.image_url ? (
                        <Image
                          src={card.image_url}
                          alt={card.name}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 font-mono text-[9px]">
                          Yu-Gi-Oh
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate max-w-72">
                          {card.name}
                        </span>
                        <span className="px-1.5 py-0.2 text-[9.5px] font-black uppercase tracking-wider rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400">
                          {card.section === 'extras' ? 'Pool / Extras' : card.section}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1 font-mono">
                        <span>Necesitas: <b className="text-zinc-800 dark:text-zinc-200">{card.count}</b></span>
                        <span>•</span>
                        <span>En Colección: <b className={card.owned > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}>{card.owned}</b></span>
                        {card.missing > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-600 dark:text-amber-400 font-bold">Faltan: {card.missing}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Segmented Control de 3 Opciones */}
                  <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0 self-start sm:self-center">
                    {/* Opción: Registrar */}
                    <button
                      type="button"
                      onClick={() => handleCardActionChange(card.id, 'register')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 min-h-9 touch-manipulation ${
                        currentAction === 'register'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                      title="Crear nueva copia física en el inventario con la ubicación del deck"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Registrar</span>
                    </button>

                    {/* Opción: Tomar de Colección */}
                    <button
                      type="button"
                      disabled={!canTake}
                      onClick={() => handleCardActionChange(card.id, 'take_collection')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 min-h-9 touch-manipulation ${
                        currentAction === 'take_collection'
                          ? 'bg-blue-600 text-white shadow-xs cursor-pointer'
                          : canTake
                          ? 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer'
                          : 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-40'
                      }`}
                      title={canTake ? 'Mover copia existente desde tu colección hacia este mazo' : 'No tienes copias registradas en tu colección'}
                    >
                      <Inbox className="w-3.5 h-3.5" />
                      <span>Tomar ({card.owned})</span>
                    </button>

                    {/* Opción: Ignorar */}
                    <button
                      type="button"
                      onClick={() => handleCardActionChange(card.id, 'ignore')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 min-h-9 touch-manipulation ${
                        currentAction === 'ignore'
                          ? 'bg-zinc-700 text-white shadow-xs'
                          : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                      title="Dejar como receta/proxy virtual sin crear entrada en inventario"
                    >
                      <span>Ignorar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer de Acciones */}
          <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={onSkipAndSave}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer min-h-11 touch-manipulation disabled:opacity-50"
            >
              Guardar sin Gestionar
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer min-h-11 touch-manipulation disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/25 transition-all cursor-pointer min-h-11 touch-manipulation disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirmar y Guardar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
