import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Shield, Zap, Settings2, X, Loader2 } from 'lucide-react';
import { StorageLocation, SleeveInventory } from '@/types/collection';
import { DeckCard } from '../types';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

interface SaveDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckName: string;
  setDeckName: (name: string) => void;
  deckDescription: string;
  setDeckDescription: (desc: string) => void;
  saveFormat: 'Master Duel' | 'TCG' | 'Duel Links';
  setSaveFormat: (format: 'Master Duel' | 'TCG' | 'Duel Links') => void;
  saveIsActive: boolean;
  setSaveIsActive: (active: boolean) => void;
  deckCards: DeckCard[];
  loadingDecks: boolean;
  locations: StorageLocation[];
  userInventoryCounts: Record<number, number>;
  registerToInventory: boolean;
  setRegisterToInventory: (reg: boolean) => void;
  targetLocationId: string;
  setTargetLocationId: (id: string) => void;
  selectedLaneIndex?: number;
  setSelectedLaneIndex?: (index: number) => void;
  cardsToRegister: Record<number, boolean>;
  setCardsToRegister: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  availableSleeves: SleeveInventory[];
  selectedMainSleeveId: string;
  setSelectedMainSleeveId: (id: string) => void;
  selectedExtraSleeveId: string;
  setSelectedExtraSleeveId: (id: string) => void;
  handleSaveDeck: () => Promise<void>;
  handleExcludeExisting: () => void;
}

/**
 * SaveDeckModal Component
 * Shows details, physical sleeve mappings, physical stock assignments,
 * with Quick Save (Default) and Advanced Physical Configuration modes.
 */
export const SaveDeckModal: React.FC<SaveDeckModalProps> = ({
  isOpen,
  onClose,
  deckName,
  setDeckName,
  deckDescription,
  setDeckDescription,
  saveFormat,
  setSaveFormat,
  saveIsActive,
  setSaveIsActive,
  deckCards,
  loadingDecks,
  locations,
  userInventoryCounts = {},
  registerToInventory,
  setRegisterToInventory,
  targetLocationId,
  setTargetLocationId,
  selectedLaneIndex = 0,
  setSelectedLaneIndex,
  cardsToRegister,
  setCardsToRegister,


  availableSleeves,
  selectedMainSleeveId,
  setSelectedMainSleeveId,
  selectedExtraSleeveId,
  setSelectedExtraSleeveId,
  handleSaveDeck,
  handleExcludeExisting,
}) => {
  const [saveTab, setSaveTab] = useState<'quick' | 'advanced'>('quick');
  const [cardQuantities, setCardQuantities] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    deckCards.forEach((c) => {
      initial[c.id] = c.count;
    });
    return initial;
  });

  const toggleCardRegister = (cardId: number) => {
    setCardsToRegister((prev) => ({
      ...prev,
      [cardId]: prev[cardId] === false ? true : false,
    }));
  };

  const updateCardRegisterQty = (cardId: number, delta: number, maxCount: number) => {
    setCardQuantities((prev) => {
      const current = prev[cardId] ?? maxCount;
      const next = Math.min(maxCount, Math.max(1, current + delta));
      return { ...prev, [cardId]: next };
    });
  };

  const selectAllCardsToRegister = (val: boolean) => {
    const updated: Record<number, boolean> = {};
    deckCards.forEach((c) => {
      updated[c.id] = val;
    });
    setCardsToRegister(updated);
  };


  const mainCardsCount = deckCards.filter((c) => c.section === 'main').reduce((acc, c) => acc + c.count, 0);
  const extraCardsCount = deckCards.filter((c) => c.section === 'extra').reduce((acc, c) => acc + c.count, 0);
  const totalCards = deckCards.reduce((acc, c) => acc + c.count, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-0 md:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none md:rounded-3xl w-full md:max-w-3xl shadow-2xl p-5 overflow-hidden flex flex-col h-dvh md:h-auto md:max-h-[90vh] text-zinc-900 dark:text-zinc-100"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Save className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span>Guardar Baraja</span>
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                  Total: <b className="text-zinc-800 dark:text-zinc-200">{totalCards} cartas</b> ({mainCardsCount} Main, {extraCardsCount} Extra)
                </p>
              </div>
              
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 pt-3 pb-1 border-b border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setSaveTab('quick')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  saveTab === 'quick'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Guardado Rápido</span>
              </button>

              <button
                type="button"
                onClick={() => setSaveTab('advanced')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  saveTab === 'advanced'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5 text-cyan-300" />
                <span>Configuración Física & Fundas</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
              
              {/* Información Básica */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">
                    Nombre de la Baraja *
                  </label>
                  <input
                    type="text"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    placeholder="ej: Snake-Eye Fire King"
                    className="w-full px-3.5 py-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">
                    Formato de Reglas
                  </label>
                  <PremiumDropdown
                    value={saveFormat}
                    onChange={(val) => setSaveFormat(val as 'Master Duel' | 'TCG' | 'Duel Links')}
                    align="full"
                    size="md"
                    options={[
                      { value: 'Master Duel', label: 'Master Duel (MD)' },
                      { value: 'TCG', label: 'TCG (Formato Oficial Físico)' },
                      { value: 'Duel Links', label: 'Duel Links (DL)' },
                    ]}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">
                    Descripción / Notas de Estrategia
                  </label>
                  <input
                    type="text"
                    value={deckDescription}
                    onChange={(e) => setDeckDescription(e.target.value)}
                    placeholder="ej: Combo principal de 1 carta, side deck enfocado contra combo..."
                    className="w-full px-3.5 py-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* OPCIONES AVANZADAS: FUNDAS Y ALMACENAMIENTO */}
              {saveTab === 'advanced' && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800"
                >
                  {/* Estado Físico & Contenedor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">Estado de Armado</label>
                      <PremiumDropdown
                        value={saveIsActive ? 'active' : 'inactive'}
                        onChange={(val) => setSaveIsActive(val === 'active')}
                        align="full"
                        size="sm"
                        options={[
                          { value: 'active', label: '● Activo (Baraja física en uso)' },
                          { value: 'inactive', label: '○ Inactivo (Solo receta/prototipo)' },
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">Contenedor Físico</label>
                      <PremiumDropdown
                        value={targetLocationId}
                        onChange={(val) => {
                          setTargetLocationId(val);
                          if (setSelectedLaneIndex) setSelectedLaneIndex(0);
                        }}
                        align="full"
                        size="sm"
                        options={[
                          { value: 'inbox', label: '📥 Inbox / Sin asignar' },
                          ...locations.map((loc) => ({
                            value: loc.id,
                            label: `📦 ${loc.name} (${loc.type})`,
                          })),
                        ]}
                      />
                    </div>

                    {/* SELECTOR DE CARRIL / FILA (SI LA CAJA TIENE COMPARTIMENTOS MÚLTIPLES) */}
                    {(() => {
                      const selectedLoc = locations.find((l) => l.id === targetLocationId);
                      const hasMultipleLanes = Boolean(
                        selectedLoc &&
                        selectedLoc.compartments &&
                        (selectedLoc.compartments.count > 1 || (selectedLoc.compartments.names && selectedLoc.compartments.names.length > 1))
                      );

                      if (!hasMultipleLanes || !selectedLoc) return null;

                      const laneNames = selectedLoc.compartments.names && selectedLoc.compartments.names.length > 0
                        ? selectedLoc.compartments.names
                        : Array.from({ length: selectedLoc.compartments.count || 2 }).map((_, i) => `Fila ${i + 1}`);

                      return (
                        <div className="sm:col-span-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 animate-fade-in">
                          <label className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 font-mono mb-1 flex items-center justify-between">
                            <span>Carril / Fila en &quot;{selectedLoc.name}&quot; *</span>
                            <span className="text-[9px] text-zinc-400 font-normal">Selecciona dónde guardar el deck</span>
                          </label>
                          <PremiumDropdown
                            value={String(selectedLaneIndex)}
                            onChange={(val) => {
                              if (setSelectedLaneIndex) setSelectedLaneIndex(Number(val));
                            }}
                            align="full"
                            size="sm"
                            options={laneNames.map((laneName, idx) => {
                              const isOccupied = Boolean(selectedLoc.compartments?.deck_ids?.[idx]);
                              return {
                                value: String(idx),
                                label: `Carril ${idx + 1}: ${laneName}${isOccupied ? ' (Ocupado)' : ' (Disponible)'}`,
                              };
                            })}
                          />
                        </div>
                      );
                    })()}
                  </div>

                  {/* Fundas Asignadas */}
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                        Fundas Físicas Asignadas
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">Main & Side Deck</label>
                        <PremiumDropdown
                          value={selectedMainSleeveId}
                          onChange={(val) => setSelectedMainSleeveId(val)}
                          align="full"
                          size="sm"
                          options={[
                            { value: '', label: 'Sin funda asignada' },
                            ...availableSleeves.map((s) => ({
                              value: s.id,
                              label: `${s.brand} • ${s.color_pattern} (${s.name})`,
                            })),
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">Extra Deck</label>
                        <PremiumDropdown
                          value={selectedExtraSleeveId}
                          onChange={(val) => setSelectedExtraSleeveId(val)}
                          align="full"
                          size="sm"
                          options={[
                            { value: '', label: 'Sin funda asignada' },
                            ...availableSleeves.map((s) => ({
                              value: s.id,
                              label: `${s.brand} • ${s.color_pattern} (${s.name})`,
                            })),
                          ]}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Registro de cartas en inventario */}
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={registerToInventory}
                        onChange={(e) => setRegisterToInventory(e.target.checked)}
                        className="rounded border-zinc-300 text-red-600 focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Registrar automáticamente las cartas físicas de esta receta en mi inventario
                      </span>
                    </label>

                    {registerToInventory && (
                      <div className="pt-2 space-y-2 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase text-zinc-700 dark:text-zinc-300">
                            Cartas a registrar: <b className="text-red-600 dark:text-red-400 font-mono text-xs">+{deckCards.filter(c => cardsToRegister[c.id] !== false).reduce((acc, c) => acc + (cardQuantities[c.id] ?? c.count), 0)} nuevas</b>
                            <span className="text-[10px] text-zinc-500 font-normal ml-1">
                              (📦 {deckCards.reduce((acc, c) => acc + (userInventoryCounts[c.id] || 0), 0)} ya en colección)
                            </span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => selectAllCardsToRegister(true)}
                              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                            >
                              Todas
                            </button>
                            <button
                              type="button"
                              onClick={() => selectAllCardsToRegister(false)}
                              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                            >
                              Ninguna
                            </button>
                            <button
                              type="button"
                              onClick={handleExcludeExisting}
                              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors cursor-pointer"
                            >
                              Excluir ya registradas
                            </button>
                          </div>
                        </div>

                        <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                          {deckCards.map((c) => {
                            const alreadyInInv = userInventoryCounts[c.id] || 0;
                            const isChecked = cardsToRegister[c.id] !== false;
                            const qty = cardQuantities[c.id] ?? c.count;

                            return (
                              <div
                                key={`${c.id}-${c.section}`}
                                onClick={() => toggleCardRegister(c.id)}
                                className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                                  isChecked
                                    ? 'bg-white dark:bg-zinc-900 border-red-500/50 dark:border-red-500/40 shadow-xs'
                                    : 'bg-zinc-100/50 dark:bg-zinc-950/30 border-zinc-200 dark:border-zinc-800 opacity-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleCardRegister(c.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded border-zinc-300 text-red-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer shrink-0"
                                />
                                {c.image_url && (
                                  <Image
                                    src={c.image_url}
                                    alt={c.name}
                                    width={24}
                                    height={32}
                                    unoptimized
                                    className="w-6 h-8 object-cover rounded shadow-xs shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                    {c.name}
                                  </p>
                                  <span className={`inline-block px-1.5 py-0.2 text-[8.5px] font-black uppercase rounded tracking-wider mt-0.5 ${
                                    c.section === 'extra' 
                                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400' 
                                      : c.section === 'side'
                                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                  }`}>
                                    {c.section}
                                  </span>
                                </div>

                                {/* Columna de comparación directa en el espacio seleccionado */}
                                <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex flex-col items-end text-right">
                                    <span className="text-[8.5px] font-black uppercase text-zinc-400 font-mono tracking-wider">
                                      En Colección
                                    </span>
                                    <span className={`text-[11px] font-mono font-black px-2 py-0.5 rounded-lg border ${
                                      alreadyInInv > 0
                                        ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/80'
                                        : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-400 border-zinc-200 dark:border-zinc-800'
                                    }`}>
                                      📦 {alreadyInInv} {alreadyInInv === 1 ? 'copia' : 'copias'}
                                    </span>
                                  </div>

                                  <div className="flex flex-col items-end">
                                    <span className="text-[8.5px] font-black uppercase text-zinc-400 font-mono tracking-wider">
                                      A Registrar
                                    </span>
                                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                      <button
                                        type="button"
                                        onClick={() => updateCardRegisterQty(c.id, -1, c.count)}
                                        disabled={qty <= 1}
                                        className="w-5 h-5 rounded-lg flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 text-zinc-900 dark:text-zinc-100 font-bold text-xs cursor-pointer shadow-xs"
                                      >
                                        -
                                      </button>
                                      <span className="text-xs font-mono font-black text-zinc-900 dark:text-zinc-100 px-1.5">
                                        {qty}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => updateCardRegisterQty(c.id, 1, c.count)}
                                        disabled={qty >= c.count}
                                        className="w-5 h-5 rounded-lg flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 text-zinc-900 dark:text-zinc-100 font-bold text-xs cursor-pointer shadow-xs"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                            );
                          })}
                        </div>
                      </div>

                    )}

                  </div>
                </motion.div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveDeck}
                disabled={loadingDecks}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-red-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingDecks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{loadingDecks ? 'Guardando...' : 'Guardar Baraja'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
