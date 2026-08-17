import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Shield, Zap, Settings2, X, Loader2 } from 'lucide-react';
import { StorageLocation, SleeveInventory } from '@/types/collection';
import { DeckCard } from '../types';

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
  registerToInventory,
  setRegisterToInventory,
  targetLocationId,
  setTargetLocationId,
  availableSleeves,
  selectedMainSleeveId,
  setSelectedMainSleeveId,
  selectedExtraSleeveId,
  setSelectedExtraSleeveId,
  handleSaveDeck,
  handleExcludeExisting,
}) => {
  const [saveTab, setSaveTab] = useState<'quick' | 'advanced'>('quick');

  const mainCardsCount = deckCards.filter((c) => c.section === 'main').reduce((acc, c) => acc + c.count, 0);
  const extraCardsCount = deckCards.filter((c) => c.section === 'extra').reduce((acc, c) => acc + c.count, 0);
  const totalCards = deckCards.reduce((acc, c) => acc + c.count, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full md:max-w-3xl shadow-2xl p-5 overflow-hidden flex flex-col max-h-[92vh] md:max-h-[90vh] text-zinc-900 dark:text-zinc-100"
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
                  <select
                    value={saveFormat}
                    onChange={(e) => setSaveFormat(e.target.value as 'Master Duel' | 'TCG' | 'Duel Links')}
                    className="w-full px-3.5 py-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 cursor-pointer"
                  >
                    <option value="Master Duel">Master Duel (MD)</option>
                    <option value="TCG">TCG (Formato Oficial Físico)</option>
                    <option value="Duel Links">Duel Links (DL)</option>
                  </select>
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
                      <select
                        value={saveIsActive ? 'active' : 'inactive'}
                        onChange={(e) => setSaveIsActive(e.target.value === 'active')}
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 cursor-pointer"
                      >
                        <option value="active">● Activo (Baraja física en uso)</option>
                        <option value="inactive">○ Inactivo (Solo receta/prototipo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">Contenedor Físico</label>
                      <select
                        value={targetLocationId}
                        onChange={(e) => setTargetLocationId(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 cursor-pointer"
                      >
                        <option value="inbox">📥 Inbox / Sin asignar</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            📦 {loc.name} ({loc.type})
                          </option>
                        ))}
                      </select>
                    </div>
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
                        <select
                          value={selectedMainSleeveId}
                          onChange={(e) => setSelectedMainSleeveId(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 cursor-pointer"
                        >
                          <option value="">Sin funda asignada</option>
                          {availableSleeves.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.brand} • {s.color_pattern} ({s.name})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">Extra Deck</label>
                        <select
                          value={selectedExtraSleeveId}
                          onChange={(e) => setSelectedExtraSleeveId(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 cursor-pointer"
                        >
                          <option value="">Sin funda asignada</option>
                          {availableSleeves.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.brand} • {s.color_pattern} ({s.name})
                            </option>
                          ))}
                        </select>
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
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleExcludeExisting}
                          className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
                        >
                          Excluir cartas que ya tengo registradas en mi inventario
                        </button>
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
