import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Shield, Zap, Settings2, X, Loader2, ChevronDown } from 'lucide-react';
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
  extractionPickList?: Array<{
    id: string;
    name: string;
    type: string;
    colorCode?: string;
    cards: Array<{
      cardId: number;
      name: string;
      rarity: string;
      count: number;
      image_url: string;
      locationDetail?: string;
      userCardId?: string;
      isInActiveDeck?: boolean;
      activeDeckId?: string;
      activeDeckName?: string;
    }>;
  }>;
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
  extractionPickList = [],
}) => {
  const [saveTab, setSaveTab] = useState<'quick' | 'advanced'>('quick');
  const [isPickListExpanded, setIsPickListExpanded] = useState(false);
  const [deficitPromptOpen, setDeficitPromptOpen] = useState(false);
  const [deficitList, setDeficitList] = useState<Array<{ id: number; name: string; required: number; owned: number; missing: number }>>([]);
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
      [cardId]: !prev[cardId],
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

  const validateAndSave = async () => {
    if (saveIsActive) {
      const deficits: Array<{ id: number; name: string; required: number; owned: number; missing: number }> = [];
      deckCards.forEach((c) => {
        const owned = userInventoryCounts[c.id] || 0;
        const willRegister = registerToInventory && cardsToRegister[c.id] ? (cardQuantities[c.id] ?? c.count) : 0;
        const totalPhysical = owned + willRegister;
        if (totalPhysical < c.count) {
          deficits.push({
            id: c.id,
            name: c.name,
            required: c.count,
            owned,
            missing: c.count - totalPhysical,
          });
        }
      });

      if (deficits.length > 0) {
        setDeficitList(deficits);
        setDeficitPromptOpen(true);
        return;
      }
    }

    await handleSaveDeck();
  };

  const handleResolveDeficitRegister = () => {
    setRegisterToInventory(true);
    setCardsToRegister((prev) => {
      const updated = { ...prev };
      deficitList.forEach((d) => {
        updated[d.id] = true;
      });
      return updated;
    });
    setCardQuantities((prev) => {
      const updated = { ...prev };
      deficitList.forEach((d) => {
        updated[d.id] = d.missing;
      });
      return updated;
    });
    setDeficitPromptOpen(false);
    setTimeout(() => {
      handleSaveDeck();
    }, 120);
  };

  const handleResolveDeficitInactive = () => {
    setSaveIsActive(false);
    setDeficitPromptOpen(false);
    setTimeout(() => {
      handleSaveDeck();
    }, 120);
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
                <span>Guardado Principal</span>
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
              
              {/* SELECTOR DE ESTADO: RECETA VIRTUAL VS DECK ACTIVO */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${saveIsActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                    <span>{saveIsActive ? 'Deck Físico Activo (Ensamblado)' : 'Receta Virtual (Prototipo)'}</span>
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                    {saveIsActive
                      ? 'Las cartas físicas se marcarán como ocupadas en este mazo y se generará el plan de extracción de tus contenedores.'
                      : 'Guarda la lista como fórmula táctica sin mover ni bloquear cartas físicas de tus contenedores.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSaveIsActive(!saveIsActive)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                    saveIsActive
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {saveIsActive ? '● Activo' : '○ Receta'}
                </button>
              </div>

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

              {/* PLAN DE EXTRACCIÓN FÍSICO (PICK LIST) */}
              {saveIsActive && extractionPickList && extractionPickList.length > 0 && (
                <div className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-emerald-500/30 overflow-hidden transition-all">
                  <div
                    onClick={() => setIsPickListExpanded((prev) => !prev)}
                    className="p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">📋</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                            Plan de Extracción Físico (Pick List)
                          </h4>
                          <span className="text-[9.5px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                            {extractionPickList.length} ubicaciones
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono truncate">
                          {isPickListExpanded
                            ? 'Ubicaciones de donde debes sacar las cartas reales para armar este deck'
                            : 'Haz clic para desplegar las ubicaciones y cartas a extraer'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {totalCards} cartas
                      </span>
                      <div className="p-1 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isPickListExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {isPickListExpanded && (
                    <div className="p-3.5 pt-0 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-2.5">
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin pt-3">
                        {extractionPickList.map((group) => (
                          <div
                            key={group.id}
                            className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2"
                          >
                            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-1.5">
                              <span className="text-[11px] font-black uppercase text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                <span>{group.name}</span>
                              </span>
                              <span className="text-[9.5px] font-mono font-bold text-zinc-400">
                                {group.cards.reduce((acc, c) => acc + c.count, 0)} {group.cards.reduce((acc, c) => acc + c.count, 0) === 1 ? 'carta' : 'cartas'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {group.cards.map((item, itemIdx) => (
                                <div
                                  key={`${item.cardId}-${itemIdx}`}
                                  className="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60"
                                >
                                  {item.image_url && (
                                    <Image
                                      src={item.image_url}
                                      alt={item.name}
                                      width={20}
                                      height={28}
                                      unoptimized
                                      className="w-5 h-7 object-contain rounded shrink-0"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10.5px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                      {item.name}
                                    </p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className="text-[8.5px] font-mono font-black px-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                        {item.rarity}
                                      </span>
                                      {item.locationDetail && (
                                        <span className="text-[8.5px] font-mono text-cyan-600 dark:text-cyan-400">
                                          {item.locationDetail}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-xs font-mono font-black text-zinc-700 dark:text-zinc-300 shrink-0 px-1">
                                    x{item.count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

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

                        <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                          {deckCards.map((c) => {
                            const alreadyInInv = userInventoryCounts[c.id] || 0;
                            const isChecked = Boolean(cardsToRegister[c.id]);
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
                onClick={validateAndSave}
                disabled={loadingDecks}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-red-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingDecks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{loadingDecks ? 'Guardando...' : 'Guardar Baraja'}</span>
              </button>
            </div>

            {/* DIÁLOGO INTERACTIVO DE DÉFICIT FÍSICO (BARAJA INCOMPLETA) */}
            <AnimatePresence>
              {deficitPromptOpen && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    className="bg-white dark:bg-zinc-900 border border-red-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-3.5"
                  >
                    <div className="flex items-center gap-2.5 text-red-500">
                      <span className="text-xl">⚠️</span>
                      <h4 className="text-sm font-black uppercase tracking-wider">
                        Baraja Física Incompleta
                      </h4>
                    </div>

                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      El deck no se puede guardar como <strong>Activo</strong> (físico en uso) porque no tienes suficientes cartas en tu colección de:
                    </p>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 scrollbar-thin">
                      {deficitList.map((d) => (
                        <div key={d.id} className="flex items-center justify-between text-xs p-1.5 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate flex-1 min-w-0 pr-2">
                            {d.name}
                          </span>
                          <div className="flex items-center gap-1 shrink-0 font-mono text-[10.5px]">
                            <span className="text-zinc-500">Req: <b>{d.required}</b></span>
                            <span className="text-zinc-400">•</span>
                            <span className="text-purple-600 dark:text-purple-400">Col: <b>{d.owned}</b></span>
                            <span className="text-zinc-400">•</span>
                            <span className="text-red-500 font-bold bg-red-500/10 px-1 py-0.2 rounded">
                              Faltan {d.missing}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-[10px] text-zinc-500 font-mono">
                      ¿Deseas registrar las copias faltantes en tu colección o guardar el mazo como Inactivo (solo receta/prototipo)?
                    </p>

                    <div className="flex flex-col gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={handleResolveDeficitRegister}
                        className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-red-600/20"
                      >
                        + Marcar Faltantes para Registrar
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleResolveDeficitInactive}
                          className="flex-1 py-2 px-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          ○ Guardar como Inactivo
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeficitPromptOpen(false)}
                          className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Volver
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
