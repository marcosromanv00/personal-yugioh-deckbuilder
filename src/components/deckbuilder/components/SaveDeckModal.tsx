import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Shield, Box, Zap, Settings2, CheckCircle2, AlertCircle } from 'lucide-react';
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
  userInventoryCounts,
  registerToInventory,
  setRegisterToInventory,
  targetLocationId,
  setTargetLocationId,
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

  const mainCardsCount = deckCards.filter((c) => c.section === 'main').reduce((acc, c) => acc + c.count, 0);
  const extraCardsCount = deckCards.filter((c) => c.section === 'extra').reduce((acc, c) => acc + c.count, 0);
  const totalCards = deckCards.reduce((acc, c) => acc + c.count, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-end md:items-center justify-center md:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="bg-slate-900 border border-slate-800 md:rounded-2xl rounded-t-3xl w-full md:max-w-3xl shadow-2xl p-5 overflow-hidden flex flex-col max-h-[92vh] md:max-h-[90vh]"
            style={{ paddingBottom: 'calc(1.25rem + var(--sab))' }}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3.5 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="font-bold text-base md:text-lg text-slate-100 flex items-center gap-2">
                  <Save className="w-5 h-5 text-purple-400" />
                  <span>Guardar Baraja</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Total: <b className="text-white font-mono">{totalCards} cartas</b> ({mainCardsCount} Main, {extraCardsCount} Extra)
                </p>
              </div>
              
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 pt-3 pb-1 border-b border-slate-800/60">
              <button
                type="button"
                onClick={() => setSaveTab('quick')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  saveTab === 'quick'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Guardado Rápido</span>
              </button>

              <button
                type="button"
                onClick={() => setSaveTab('advanced')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  saveTab === 'advanced'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5 text-cyan-300" />
                <span>Configuración Física & Fundas</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
              
              {/* Información Básica (Siempre visible en ambos modos) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Nombre de la Baraja *</label>
                  <input
                    type="text"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    placeholder="ej: Snake-Eye Fire King"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Formato de Reglas</label>
                  <select
                    value={saveFormat}
                    onChange={(e) => setSaveFormat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="Master Duel">Master Duel (MD)</option>
                    <option value="TCG">TCG (Formato Oficial Físico)</option>
                    <option value="Duel Links">Duel Links (DL)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-slate-400 mb-1">Descripción / Notas de Estrategia</label>
                  <input
                    type="text"
                    value={deckDescription}
                    onChange={(e) => setDeckDescription(e.target.value)}
                    placeholder="ej: Combo principal de 1 carta, side deck enfocado contra combo..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* OPCIONES AVANZADAS: FUNDAS Y ALMACENAMIENTO */}
              {saveTab === 'advanced' && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-2 border-t border-slate-800/80"
                >
                  {/* Estado Físico & Contenedor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Estado de Armado</label>
                      <select
                        value={saveIsActive ? 'active' : 'inactive'}
                        onChange={(e) => setSaveIsActive(e.target.value === 'active')}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                      >
                        <option value="active">● Activo (Baraja física en uso)</option>
                        <option value="inactive">○ Inactivo (Solo receta/prototipo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Contenedor Físico</label>
                      <select
                        value={targetLocationId}
                        onChange={(e) => setTargetLocationId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
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
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Fundas Físicas Asignadas
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono text-slate-400 mb-1">Main & Side Deck</label>
                        <select
                          value={selectedMainSleeveId}
                          onChange={(e) => setSelectedMainSleeveId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
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
                        <label className="block text-[11px] font-mono text-slate-400 mb-1">Extra Deck</label>
                        <select
                          value={selectedExtraSleeveId}
                          onChange={(e) => setSelectedExtraSleeveId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
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
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={registerToInventory}
                        onChange={(e) => setRegisterToInventory(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-200">
                        Registrar automáticamente las cartas físicas de esta receta en mi inventario
                      </span>
                    </label>

                    {registerToInventory && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleExcludeExisting}
                          className="text-[11px] font-mono text-purple-400 hover:text-purple-300 underline cursor-pointer"
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
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveDeck}
                disabled={loadingDecks}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[hsl(263,85%,64%)] to-[hsl(180,80%,45%)] hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-950/40 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loadingDecks ? 'Guardando...' : 'Guardar Baraja Ahora'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
