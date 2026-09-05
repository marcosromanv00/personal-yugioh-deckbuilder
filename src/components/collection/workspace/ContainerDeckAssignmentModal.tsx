'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Layers, Box, Check, Loader2, X, Home, Plane } from 'lucide-react';
import { StorageLocation, UserCard, Deck } from '@/types/collection';
import { PremiumDropdown, DropdownOption } from '@/components/ui/PremiumDropdown';
import { DeckInContainer } from './types';

interface ContainerDeckAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: StorageLocation | null;
  location: StorageLocation | null;
  locations?: StorageLocation[];
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
  onMoveDeckCards: (deckId: string, targetCompIdx: number, targetLocationId?: string | null) => void;
}

export const ContainerDeckAssignmentModal: React.FC<ContainerDeckAssignmentModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  location,
  locations = [],
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
  const selectedDeck = internalDecks.find(d => d.id === selectedDeckIdToAssign);

  // Generador de opciones de movimiento para cada mazo
  const getMoveOptions = (currentCompIdx: number): DropdownOption<string>[] => {
    const opts: DropdownOption<string>[] = [];

    // 1. Otros carriles en esta misma caja
    if (loc?.compartments && loc.compartments.count > 1) {
      (loc.compartments.names || []).forEach((compName, targetIdx) => {
        if (targetIdx !== currentCompIdx) {
          opts.push({
            value: `lane:${targetIdx}`,
            label: `Carril ${targetIdx + 1}: ${compName || `Fila ${targetIdx + 1}`}`,
            icon: <Box className="w-3.5 h-3.5 text-zinc-400" />
          });
        }
      });
    }

    // 2. Otras deckboxes y contenedores
    locations
      .filter(l => l.id !== loc?.id)
      .forEach(otherLoc => {
        opts.push({
          value: `container:${otherLoc.id}`,
          label: `📦 ${otherLoc.name} (${otherLoc.type})`,
          icon: <Box className="w-3.5 h-3.5 text-amber-500" />
        });
      });

    // 3. Sin clasificar (desvincular)
    opts.push({
      value: 'unassign',
      label: '❌ Desvincular (Sin clasificar)',
      icon: <X className="w-3.5 h-3.5 text-red-500" />
    });

    return opts;
  };

  const laneCount = loc?.compartments?.count || 1;
  const laneNames = loc?.compartments?.names || ['Principal'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-black/80 font-sans"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 text-zinc-900 dark:text-zinc-100 max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Header Superior */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3.5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shadow-2xs">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Gestión de Mazos y Carriles
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium flex items-center gap-2">
                    <span>📦 {loc?.name || 'Caja'}</span>
                    <span>•</span>
                    <span className="font-mono text-zinc-600 dark:text-zinc-400 font-bold">{decksInContainer.length} {decksInContainer.length === 1 ? 'mazo registrado' : 'mazos registrados'}</span>
                    <span>•</span>
                    <span className="font-mono text-zinc-500">{cards.length} cartas físicas</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo Principal en 2 Columnas */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 overflow-hidden min-h-0">
              
              {/* ═══ COLUMNA IZQUIERDA: DISTRIBUCIÓN POR CARRILES (60%) ═══ */}
              <div className="lg:col-span-7 flex flex-col overflow-hidden space-y-2.5">
                <div className="flex items-center justify-between shrink-0">
                  <span className="text-[11px] font-mono font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-red-500" />
                    <span>Distribución Actual ({laneCount} {laneCount === 1 ? 'carril' : 'carriles'})</span>
                  </span>
                  <span className="text-[10.5px] text-zinc-400 font-mono">
                    {cards.length} cartas en total
                  </span>
                </div>

                {/* Lista / Grid de Carriles con Scroll */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {laneNames.map((compName, idx) => {
                    const compCount = cards.filter(c => (c.compartment_index || 0) === idx).reduce((sum, c) => sum + (c.quantity || 1), 0);
                    const laneDecks = decksInContainer.filter(d => d.compartments.has(idx));
                    const moveOptions = getMoveOptions(idx);
                    const isTargetForAssignment = assignCompartmentIdx === idx;

                    return (
                      <div 
                        key={idx}
                        className={`p-3.5 rounded-2xl transition-all border ${
                          isTargetForAssignment
                            ? 'bg-zinc-50 dark:bg-zinc-900/90 border-red-500/60 dark:border-red-500/50 shadow-xs'
                            : 'bg-zinc-50/70 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800'
                        } space-y-2`}
                      >
                        {/* Cabecera del Carril */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Box className={`w-3.5 h-3.5 ${isTargetForAssignment ? 'text-red-500' : 'text-zinc-500'}`} />
                            <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                              {compName || `Carril ${idx + 1}`}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                              {compCount} cartas
                            </span>
                            {laneDecks.length > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                                {laneDecks.length} {laneDecks.length === 1 ? 'mazo' : 'mazos'}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAssignCompartmentIdx(idx);
                              if (!selectedDeckIdToAssign && internalDecks.length > 0) {
                                setSelectedDeckIdToAssign(internalDecks[0]?.id || '');
                              }
                            }}
                            className={`text-[11px] font-mono font-bold transition-all cursor-pointer px-2 py-1 rounded-lg ${
                              isTargetForAssignment
                                ? 'bg-red-600 text-white shadow-2xs'
                                : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:underline'
                            }`}
                          >
                            ➕ Añadir mazo a C{idx + 1}
                          </button>
                        </div>

                        {/* Listado de Mazos en este carril */}
                        {laneDecks.length > 0 ? (
                          <div className="space-y-1.5 pt-0.5">
                            {laneDecks.map(d => (
                              <div 
                                key={d.id}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs shadow-2xs gap-2"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <Swords className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{d.name}</p>
                                    <p className="text-[10.5px] text-zinc-500 font-mono">
                                      {d.countInContainer} de {d.totalCards} cartas en este carril
                                    </p>
                                  </div>
                                </div>

                                {/* Acciones de Mazo (Mover a otro carril, caja o sin clasificar) */}
                                {moveOptions.length > 0 && (
                                  <div className="shrink-0">
                                    <PremiumDropdown
                                      options={moveOptions}
                                      value=""
                                      onChange={(targetVal) => {
                                        if (!targetVal) return;
                                        if (targetVal.startsWith('lane:')) {
                                          const laneIdx = Number(targetVal.replace('lane:', ''));
                                          onMoveDeckCards(d.id, laneIdx, loc?.id);
                                        } else if (targetVal.startsWith('container:')) {
                                          const targetLocId = targetVal.replace('container:', '');
                                          onMoveDeckCards(d.id, 0, targetLocId);
                                        } else if (targetVal === 'unassign') {
                                          onMoveDeckCards(d.id, 0, null);
                                        }
                                      }}
                                      placeholder="Mover mazo a..."
                                      menuWidth="w-60"
                                      align="right"
                                      size="sm"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-2 rounded-xl bg-white/60 dark:bg-zinc-950/40 border border-dashed border-zinc-200 dark:border-zinc-800">
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono italic">
                              Sin mazos vinculados ({compCount} cartas sueltas / staples)
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ═══ COLUMNA DERECHA: PANEL DE VINCULACIÓN Y TRASLADO (40%) ═══ */}
              <div className="lg:col-span-5 flex flex-col justify-between overflow-y-auto bg-zinc-50/90 dark:bg-zinc-900/70 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-2xs">
                
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                    <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold font-mono">
                      +
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                        Vincular / Mover Mazo
                      </h4>
                      <p className="text-[10.5px] text-zinc-500">
                        Asigna un mazo existente a un carril específico de esta caja.
                      </p>
                    </div>
                  </div>

                  {/* Selector de Carril Destino */}
                  {loc?.compartments && loc.compartments.count > 1 && (
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-mono font-black text-zinc-600 dark:text-zinc-400 uppercase block">
                        Carril Destino:
                      </label>
                      <PremiumDropdown
                        options={(loc.compartments.names || []).map((name, i) => ({
                          value: i,
                          label: `Carril ${i + 1}: ${name || `Fila ${i + 1}`}`,
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
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-black text-zinc-600 dark:text-zinc-400 uppercase block">
                      Mazo a Vincular / Mover:
                    </label>
                    <PremiumDropdown
                      options={internalDecks.map((d) => {
                        const totalCards = (d.cards || []).reduce((sum, c) => sum + c.count, 0);
                        const locFound = d.storage_location_id ? locations.find(l => l.id === d.storage_location_id) : null;
                        const locDesc = d.storage_location_id
                          ? d.storage_location_id === loc?.id
                            ? 'En esta caja'
                            : `En: ${locFound?.name || 'Otro Contenedor'}`
                          : 'Sin clasificar (Inbox)';

                        return {
                          value: d.id,
                          label: d.name,
                          badge: totalCards,
                          description: locDesc,
                          icon: <Swords className="w-3.5 h-3.5 text-red-500" />
                        };
                      })}
                      value={selectedDeckIdToAssign}
                      onChange={(deckId) => setSelectedDeckIdToAssign(deckId)}
                      placeholder="-- Seleccionar Mazo --"
                      className="w-full"
                      menuWidth="w-full"
                      size="sm"
                    />
                  </div>

                  {/* Información Comparativa de Ubicación Actual vs Destino */}
                  {selectedDeck && (
                    <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1.5 shadow-2xs animate-fade-in">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-zinc-500 font-bold flex items-center gap-1">
                          <Home className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>Actual:</span>
                        </span>
                        <b className="text-zinc-800 dark:text-zinc-200">
                          {selectedDeck.storage_location_id
                            ? selectedDeck.storage_location_id === loc?.id
                              ? `Esta caja (${loc?.name})`
                              : locations.find(l => l.id === selectedDeck.storage_location_id)?.name || 'Otro contenedor'
                            : 'Sin clasificar (Inbox)'}
                        </b>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-zinc-500 font-bold flex items-center gap-1">
                          <Plane className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>Destino:</span>
                        </span>
                        <b className="text-red-600 dark:text-red-400">
                          {loc?.name} • C{assignCompartmentIdx + 1} ({loc?.compartments?.names?.[assignCompartmentIdx] || `Carril ${assignCompartmentIdx + 1}`})
                        </b>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px] pt-1 border-t border-zinc-100 dark:border-zinc-900">
                        <span className="text-zinc-500">Cartas del mazo:</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {(selectedDeck.cards || []).reduce((sum, c) => sum + c.count, 0)} cartas
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Opción de mover cartas físicas automáticamente */}
                  {selectedDeckIdToAssign && (
                    <label className="flex items-start gap-2.5 cursor-pointer select-none bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                      <input
                        type="checkbox"
                        checked={shouldMoveCardsOnAssign}
                        onChange={(e) => setShouldMoveCardsOnAssign(e.target.checked)}
                        className="mt-0.5 rounded border-zinc-300 text-red-600 focus:ring-0 cursor-pointer shrink-0"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                          Mover automáticamente cartas físicas
                        </span>
                        <span className="text-[10.5px] text-zinc-500 block leading-tight mt-0.5">
                          Reubica las copias físicas registradas para que figuren en este carril.
                        </span>
                      </div>
                    </label>
                  )}
                </div>

                {/* Botones de Acción */}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={onSaveDeckAssignment}
                    disabled={isAssigningDeck || !selectedDeckIdToAssign}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-600/20 cursor-pointer flex items-center gap-1.5"
                  >
                    {isAssigningDeck ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Asignando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Vincular al Carril</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
