'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Layers, Box, Check, Loader2, X } from 'lucide-react';
import { StorageLocation, UserCard, Deck } from '@/types/collection';
import { PremiumDropdown, DropdownOption } from '@/components/ui/PremiumDropdown';
import { DeckInContainer } from './types';

interface ContainerDeckAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: StorageLocation | null;
  location: StorageLocation | null;
  decksInContainer: DeckInContainer[];
  cards: UserCard[];
  internalDecks: Deck[];
  assignCompartmentIdx: number;
  setAssignCompartmentIdx: (idx: number) => void;
  selectedDeckIdToAssign: string;
  setSelectedDeckIdToAssign: (id: string) => void;
  shouldMoveCardsOnAssign: boolean;
  setShouldMoveCardsOnAssign: (b: boolean) => void;
  isAssigningDeck: boolean;
  onSaveDeckAssignment: () => void;
  onMoveDeckCards: (deckId: string, targetCompIdx: number) => void;
}

export const ContainerDeckAssignmentModal: React.FC<ContainerDeckAssignmentModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  location,
  decksInContainer,
  cards,
  internalDecks,
  assignCompartmentIdx,
  setAssignCompartmentIdx,
  selectedDeckIdToAssign,
  setSelectedDeckIdToAssign,
  shouldMoveCardsOnAssign,
  setShouldMoveCardsOnAssign,
  isAssigningDeck,
  onSaveDeckAssignment,
  onMoveDeckCards,
}) => {
  const loc = currentLocation || location;

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-0 sm:p-4 bg-black/80 font-sans"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-3xl p-5 shadow-2xl space-y-4 text-zinc-900 dark:text-zinc-100 h-dvh sm:h-auto sm:max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">
                    Gestión de Mazos y Carriles
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    {loc?.name || 'Caja'} • {decksInContainer.length} {decksInContainer.length === 1 ? 'mazo registrado' : 'mazos registrados'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sección 1: Distribución Actual de Mazos por Carril */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-red-500" />
                  <span>Distribución por Carril</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {cards.length} cartas físicas en caja
                </span>
              </div>

              <div className="space-y-2">
                {(loc?.compartments?.names || ['Principal']).map((compName, idx) => {
                  const compCount = cards.filter(c => (c.compartment_index || 0) === idx).reduce((sum, c) => sum + (c.quantity || 1), 0);
                  const laneDecks = decksInContainer.filter(d => d.compartments.has(idx));
                  const moveOptions = (loc?.compartments?.names || [])
                    .map((name, targetIdx) => targetIdx !== idx ? ({
                      value: targetIdx,
                      label: `Mover a ${name || `Carril ${targetIdx + 1}`}`,
                      icon: <Box className="w-3.5 h-3.5 text-zinc-400" />
                    }) : null)
                    .filter(Boolean) as DropdownOption<number>[];

                  return (
                    <div 
                      key={idx}
                      className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Box className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                            {compName || `Carril ${idx + 1}`}
                          </span>
                          <span className="text-[10.5px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {compCount} cartas
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAssignCompartmentIdx(idx);
                            setSelectedDeckIdToAssign(internalDecks[0]?.id || '');
                          }}
                          className="text-[10.5px] text-red-600 dark:text-red-400 hover:underline font-bold cursor-pointer"
                        >
                          ➕ Añadir mazo a C{idx + 1}
                        </button>
                      </div>

                      {/* Listado de Mazos en este carril */}
                      {laneDecks.length > 0 ? (
                        <div className="space-y-1.5 pt-1">
                          {laneDecks.map(d => (
                            <div 
                              key={d.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Swords className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                <div className="min-w-0">
                                  <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{d.name}</p>
                                  <p className="text-[10px] text-zinc-500 font-mono">
                                    {d.countInContainer} de {d.totalCards} cartas físicas en este carril
                                  </p>
                                </div>
                              </div>

                              {/* Acciones de Mazo (Mover a otro carril) */}
                              {loc?.compartments && loc.compartments.count > 1 && moveOptions.length > 0 && (
                                <div className="shrink-0 ml-2">
                                  <PremiumDropdown
                                    options={moveOptions}
                                    value={-1}
                                    onChange={(targetIdx) => {
                                      if (targetIdx !== -1) {
                                        onMoveDeckCards(d.id, targetIdx);
                                      }
                                    }}
                                    placeholder="Mover mazo a..."
                                    menuWidth="w-52"
                                    align="right"
                                    size="sm"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono italic">
                          Sin mazos vinculados ({compCount} cartas sueltas / staples)
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sección 2: Vincular o Importar Nuevo Mazo a un Carril */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
              <span className="text-[11px] font-mono font-black uppercase tracking-wider text-zinc-500 block">
                Vincular Mazo Existente a un Carril
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Selector de Carril */}
                {loc?.compartments && loc.compartments.count > 1 && (
                  <div>
                    <label className="text-[10.5px] font-mono font-black text-zinc-500 uppercase block mb-1">
                      Carril Destino:
                    </label>
                    <PremiumDropdown
                      options={(loc.compartments.names || []).map((name, i) => ({
                        value: i,
                        label: name || `Carril ${i + 1}`,
                        icon: <Box className="w-3.5 h-3.5 text-zinc-400" />
                      }))}
                      value={assignCompartmentIdx}
                      onChange={(i) => setAssignCompartmentIdx(i)}
                      className="w-full"
                      menuWidth="w-full"
                      size="sm"
                    />
                  </div>
                )}

                {/* Selector de Mazo */}
                <div className={loc?.compartments && loc.compartments.count > 1 ? '' : 'sm:col-span-2'}>
                  <label className="text-[10.5px] font-mono font-black text-zinc-500 uppercase block mb-1">
                    Mazo a Vincular:
                  </label>
                  <PremiumDropdown
                    options={internalDecks.map((d) => ({
                      value: d.id,
                      label: d.name,
                      badge: (d.cards || []).reduce((sum, c) => sum + c.count, 0),
                      icon: <Swords className="w-3.5 h-3.5 text-red-500" />
                    }))}
                    value={selectedDeckIdToAssign}
                    onChange={(deckId) => setSelectedDeckIdToAssign(deckId)}
                    placeholder="-- Seleccionar Mazo --"
                    className="w-full"
                    menuWidth="w-full"
                    size="sm"
                  />
                </div>
              </div>

              {/* Opción de mover cartas físicas automáticamente */}
              {selectedDeckIdToAssign && (
                <label className="flex items-start gap-2 cursor-pointer select-none bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <input
                    type="checkbox"
                    checked={shouldMoveCardsOnAssign}
                    onChange={(e) => setShouldMoveCardsOnAssign(e.target.checked)}
                    className="mt-0.5 rounded border-zinc-300 text-red-600 focus:ring-0 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                      Mover automáticamente las cartas físicas de este mazo a este carril
                    </span>
                    <span className="text-[10.5px] text-zinc-500 block leading-tight">
                      Asigna la ubicación física de todas las copias de este mazo para que queden registradas en este carril.
                    </span>
                  </div>
                </label>
              )}

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={onSaveDeckAssignment}
                  disabled={isAssigningDeck || !selectedDeckIdToAssign}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  {isAssigningDeck ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Asignando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Vincular Mazo al Carril</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
