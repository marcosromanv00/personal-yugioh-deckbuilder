import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Shield } from 'lucide-react';
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
 * and allows saving or updating deck recipes inside PostgreSQL database.
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
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-end md:items-center justify-center md:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="bg-slate-900 border border-slate-800 md:rounded-2xl rounded-t-3xl w-full md:max-w-4xl shadow-2xl p-5 overflow-hidden flex flex-col max-h-[92vh] md:max-h-[90vh]"
            style={{ paddingBottom: 'calc(1.25rem + var(--sab))' }}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="font-bold text-lg text-slate-100 flex items-center gap-1.5">
                  <Save className="w-5 h-5 text-purple-400" />
                  Vista Previa: Guardar Deck en Inventario
                </h3>
                <p className="text-xs text-slate-400">Guarda la baraja en la base de datos y agrega sus cartas a tu inventario físico.</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
              
              {/* General Options */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">Nombre de la Baraja</label>
                  <input
                    type="text"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">Descripción / Comentarios</label>
                  <input
                    type="text"
                    value={deckDescription}
                    onChange={(e) => setDeckDescription(e.target.value)}
                    placeholder="ej: Receta TCG regional..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">Formato del Deck</label>
                  <select
                    value={saveFormat}
                    onChange={(e) => setSaveFormat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Master Duel">Master Duel</option>
                    <option value="TCG">TCG (Formato Físico)</option>
                    <option value="Duel Links">Duel Links</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">Estado Físico</label>
                  <select
                    value={saveIsActive ? 'active' : 'inactive'}
                    onChange={(e) => setSaveIsActive(e.target.value === 'active')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-sm text-cyan-400 focus:outline-none focus:border-purple-500 font-bold"
                  >
                    <option value="active">🟢 Deck Activo (Físicamente armado)</option>
                    <option value="inactive">⚪ Deck Inactivo (Receta guardada)</option>
                  </select>
                </div>
              </div>

              {/* Sleeve Settings */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-slate-200">Asignación de Fundas (Sleeves)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Fundas Main / Side Deck</label>
                    <select
                      value={selectedMainSleeveId}
                      onChange={(e) => setSelectedMainSleeveId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                    >
                      <option value="">-- Sin Funda --</option>
                      {availableSleeves.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.brand} - {s.name} ({s.color_pattern}) - Disp: {s.quantity_available}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Fundas Extra Deck</label>
                    <select
                      value={selectedExtraSleeveId}
                      onChange={(e) => setSelectedExtraSleeveId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                    >
                      <option value="">-- Sin Funda --</option>
                      {availableSleeves.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.brand} - {s.name} ({s.color_pattern}) - Disp: {s.quantity_available}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Inventory Stock Options */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={registerToInventory}
                      onChange={(e) => setRegisterToInventory(e.target.checked)}
                      className="w-4 h-4 text-purple-500 bg-slate-900 border-slate-850 rounded"
                    />
                    <div>
                      <span className="text-sm font-semibold text-slate-200">Registrar cartas en el Inventario General</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">Inserta copias de las cartas seleccionadas directamente a tu stock físico.</p>
                    </div>
                  </label>
                </div>

                {registerToInventory && (
                  <div className="pt-3 border-t border-slate-850 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <label className="block text-[11px] text-slate-400 mb-1 font-mono">Ubicación física destino de las cartas</label>
                        <select
                          value={targetLocationId}
                          onChange={(e) => setTargetLocationId(e.target.value)}
                          className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-350"
                        >
                          <option value="inbox">📥 Bandeja Inbox (Sin Clasificar)</option>
                          {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>
                              📦 {loc.name} ({loc.type.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={handleExcludeExisting}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 rounded text-xs text-slate-950 font-bold transition-all shadow cursor-pointer shrink-0"
                          title="Desmarca automáticamente las cartas de las cuales ya tienes suficientes copias registradas en tu colección."
                        >
                          Omitir cartas ya existentes
                        </button>
                      </div>
                    </div>

                    {/* Batch import selection table */}
                    <div className="border border-slate-800 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                            <th className="p-2 w-12 text-center">Registrar</th>
                            <th className="p-2">Carta</th>
                            <th className="p-2">Sección</th>
                            <th className="p-2 text-center">En Deck</th>
                            <th className="p-2 text-center">En Inventario</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs divide-y divide-slate-850">
                          {deckCards.map(c => {
                            const inInventory = userInventoryCounts[c.id] || 0;
                            return (
                              <tr key={`${c.id}-${c.section}`} className="hover:bg-slate-900/40">
                                <td className="p-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={!!cardsToRegister[c.id]}
                                    onChange={(e) => setCardsToRegister(prev => ({ ...prev, [c.id]: e.target.checked }))}
                                    className="w-3.5 h-3.5 text-purple-600 bg-slate-900 border-slate-800"
                                  />
                                </td>
                                <td className="p-2 font-medium text-slate-200">{c.name}</td>
                                <td className="p-2 text-[10px] uppercase text-slate-400">{c.section}</td>
                                <td className="p-2 text-center font-mono font-bold text-slate-300">{c.count}x</td>
                                <td className="p-2 text-center font-mono">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${inInventory >= c.count ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/40' : inInventory > 0 ? 'bg-amber-950/40 text-amber-450 border border-amber-900/40' : 'bg-red-950/20 text-slate-500'}`}>
                                    {inInventory} copias
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-350 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveDeck}
                disabled={loadingDecks}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {loadingDecks ? 'Guardando...' : 'Confirmar y Guardar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
