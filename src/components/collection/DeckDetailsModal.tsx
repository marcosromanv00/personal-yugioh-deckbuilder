'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Edit3, Shield, Layers, AlertCircle } from 'lucide-react';
import { Deck, StorageLocation, SleeveInventory, UserCard, DeckCardDetail, DeckSleeve } from '@/types/collection';
import { useRouter } from 'next/navigation';
import { SleeveInventoryFormModal } from './SleeveInventoryFormModal';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

interface DeckDetailsModalProps {
  deck: Deck | null;
  isOpen: boolean;
  onClose: () => void;
  locations: StorageLocation[];
  decks?: Deck[];
  onSuccess: () => void;
}

export const DeckDetailsModal: React.FC<DeckDetailsModalProps> = ({
  deck,
  isOpen,
  onClose,
  locations,
  decks = [],
  onSuccess,
}) => {
  const router = useRouter();
  const [prevDeckId, setPrevDeckId] = useState<string | null>(deck?.id || null);
  const [name, setName] = useState(deck?.name || '');
  const [format, setFormat] = useState(deck?.format || 'TCG');
  const [isActive, setIsActive] = useState(deck?.is_active !== false);
  const [storageLocationId, setStorageLocationId] = useState<string>(deck?.storage_location_id || '');

  if (prevDeckId !== (deck?.id || null) && deck) {
    setPrevDeckId(deck.id);
    setName(deck.name || '');
    setFormat(deck.format || 'TCG');
    setIsActive(deck.is_active !== false);
    const assignedLoc = locations.find(
      l => l.id === deck.storage_location_id || Boolean(l.compartments?.deck_ids?.includes(deck.id))
    );
    setStorageLocationId(deck.storage_location_id || assignedLoc?.id || '');
  }
  
  // Sleeves states
  const [availableSleeves, setAvailableSleeves] = useState<SleeveInventory[]>([]);
  const [mainSleeveId, setMainSleeveId] = useState<string>('');
  const [extraSleeveId, setExtraSleeveId] = useState<string>('');
  
  // Track initial sleeves to check for changes
  const [initialMainSleeveId, setInitialMainSleeveId] = useState<string>('');
  const [initialExtraSleeveId, setInitialExtraSleeveId] = useState<string>('');
  
  const [loadingSleeves, setLoadingSleeves] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [isNewSleeveModalOpen, setIsNewSleeveModalOpen] = useState(false);
  const [targetSleeveSection, setTargetSleeveSection] = useState<'main_side' | 'extra' | null>(null);

  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [mainSleeveMode, setMainSleeveMode] = useState<'take' | 'add'>('take');
  const [mainSleeveAddedQty, setMainSleeveAddedQty] = useState<number>(60);
  const [extraSleeveMode, setExtraSleeveMode] = useState<'take' | 'add'>('take');
  const [extraSleeveAddedQty, setExtraSleeveAddedQty] = useState<number>(60);
  const [savingSleeves, setSavingSleeves] = useState(false);

  const handleNewSleeveSuccess = async (newSleeve?: SleeveInventory) => {
    try {
      const sleevesRes = await fetch('/api/collection/sleeve-inventory');
      if (sleevesRes.ok) {
        const json = await sleevesRes.json();
        const updatedSleeves = json.data || [];
        setAvailableSleeves(updatedSleeves);
        
        if (newSleeve && targetSleeveSection) {
          if (targetSleeveSection === 'main_side') {
            setMainSleeveId(newSleeve.id);
          } else if (targetSleeveSection === 'extra') {
            setExtraSleeveId(newSleeve.id);
          }
        }
      }
    } catch (e) {
      console.error('Error al actualizar inventario de fundas:', e);
    }
    setTargetSleeveSection(null);
  };

  // Fetch current deck sleeves on open
  useEffect(() => {
    if (!isOpen || !deck) return;

    const fetchSleevesForDeck = async () => {
        setErrorMsg(null);
        setLoadingSleeves(true);
        try {
          const res = await fetch(`/api/decks/${deck.id}/sleeves`);
          if (res.ok) {
            const json = await res.json();
            const deckSleeves: DeckSleeve[] = json.data || [];
            
            const mainSleeve = deckSleeves.find(s => s.section_type === 'main_side');
            const extraSleeve = deckSleeves.find(s => s.section_type === 'extra');
            
            const mId = mainSleeve?.sleeve_id || '';
            const eId = extraSleeve?.sleeve_id || '';
            
            setMainSleeveId(mId);
            setExtraSleeveId(eId);
            setInitialMainSleeveId(mId);
            setInitialExtraSleeveId(eId);
          }
        } catch (err) {
          console.error('Error fetching deck sleeves:', err);
        } finally {
          setLoadingSleeves(false);
        }
      };

      const fetchAvailableSleeves = async () => {
        try {
          const res = await fetch('/api/collection/sleeve-inventory');
          if (res.ok) {
            const json = await res.json();
            setAvailableSleeves(json.data || []);
          }
        } catch (err) {
          console.error('Error fetching available sleeves:', err);
        }
      };

      const fetchDeckCards = async () => {
        try {
          const res = await fetch(`/api/collection/cards?deck_id=${deck.id}`);
          if (res.ok) {
            const json = await res.json();
            setUserCards(json.data || []);
          }
        } catch (err) {
          console.error('Error fetching deck cards:', err);
        }
      };

      fetchSleevesForDeck();
      fetchAvailableSleeves();
      fetchDeckCards();
  }, [isOpen, deck, locations]);

  if (!isOpen || !deck) return null;

  const getSleevingStats = (section: 'main_side' | 'extra') => {
    if (!deck.cards) return { N_total: 0 };
    const targetSections = section === 'main_side' ? ['main', 'side'] : ['extra'];
    const cards = deck.cards.filter(c => targetSections.includes(c.section));
    const N_total = cards.reduce((acc, c) => acc + c.count, 0);
    return { N_total };
  };

  const getSleeveStockStatus = (sleeveId: string, section: 'main_side' | 'extra') => {
    const sleeve = availableSleeves.find(s => s.id === sleeveId);
    if (!sleeve) return { N_needed: 0, available: 0, hasConflict: false };
    
    const { N_total } = getSleevingStats(section);
    const targetSections = section === 'main_side' ? ['main', 'side'] : ['extra'];
    
    const N_already_sleeved_with_S = userCards
      ?.filter(uc => 
        targetSections.includes(uc.deck_section || '') && 
        uc.sleeve_type && 
        uc.sleeve_type !== 'none' &&
        uc.sleeve_brand?.toLowerCase() === sleeve.brand?.toLowerCase() &&
        uc.sleeve_color?.toLowerCase() === sleeve.color_pattern?.toLowerCase()
      )
      .reduce((sum, uc) => sum + (uc.quantity || 0), 0) || 0;
      
    const N_needed = Math.max(0, N_total - N_already_sleeved_with_S);
    const available = sleeve.quantity_available || 0;
    const hasConflict = N_needed > available;
    
    return { N_needed, available, hasConflict };
  };



  const renderSleeveConflictPanel = (
    sleeveId: string,
    section: 'main_side' | 'extra',
    mode: 'take' | 'add',
    setMode: (m: 'take' | 'add') => void,
    addedQty: number,
    setAddedQty: (q: number) => void
  ) => {
    if (!sleeveId) return null;
    
    const status = getSleeveStockStatus(sleeveId, section);

    return (
      <div className="mt-2.5 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5">
        {/* Info label */}
        <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5 pb-1.5 border-b border-zinc-200 dark:border-zinc-800">
          <span>Cartas: <b>{getSleevingStats(section).N_total}</b></span>
          <span>•</span>
          <span>Necesarias: <b>{status.N_needed}</b></span>
          <span>•</span>
          <span>Libres: <b>{status.available}</b></span>
        </div>

        {/* Radio group */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name={`conflict-mode-${section}`}
              checked={mode === 'take'}
              onChange={() => setMode('take')}
              className="text-red-600 focus:ring-red-500 cursor-pointer"
            />
            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
              Tomar fundas existentes de la colección
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name={`conflict-mode-${section}`}
              checked={mode === 'add'}
              onChange={() => setMode('add')}
              className="text-red-600 focus:ring-red-500 cursor-pointer"
            />
            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
              Sumar fundas nuevas al inventario (+ stock)
            </span>
          </label>
        </div>

        {/* Mode-specific panel */}
        {mode === 'take' && status.hasConflict && (
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[10px] text-amber-600 dark:text-amber-400 font-mono leading-relaxed flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Aviso de stock insuficiente</p>
              <p className="text-zinc-500 mt-0.5">
                Faltan {status.N_needed} fundas, pero solo hay {status.available} libres.
              </p>
            </div>
          </div>
        )}

        {mode === 'add' && (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <label className="block text-[10px] uppercase font-black text-zinc-500 font-mono">
              Cantidad de fundas a registrar
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAddedQty(Math.max(1, addedQty - 10))}
                className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-black cursor-pointer"
              >
                -10
              </button>
              <input
                type="number"
                min={1}
                value={addedQty}
                onChange={e => setAddedQty(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-16 px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-center text-xs font-mono font-bold"
              />
              <button
                type="button"
                onClick={() => setAddedQty(addedQty + 10)}
                className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-black cursor-pointer"
              >
                +10
              </button>
              <span className="text-[10px] text-zinc-400 font-mono">
                (Sugerido: 60 u 80)
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleSaveSleevesOnly = async () => {
    if (!deck) return;
    setSavingSleeves(true);
    setErrorMsg(null);
    try {
      // 1. Save/Update Main Sleeve
      if (mainSleeveId !== initialMainSleeveId) {
        if (mainSleeveId) {
          const res = await fetch(`/api/decks/${deck.id}/sleeves`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              sleeve_id: mainSleeveId, 
              section_type: 'main_side',
              action_mode: mainSleeveMode,
              added_quantity: mainSleeveAddedQty
            }),
          });
          if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.error || 'Error al guardar funda del Main Deck');
          }
        } else {
          const res = await fetch(`/api/decks/${deck.id}/sleeves?section_type=main_side`, {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error('Error al desasignar funda del Main Deck');
        }
        setInitialMainSleeveId(mainSleeveId);
      }

      // 2. Save/Update Extra Sleeve
      if (extraSleeveId !== initialExtraSleeveId) {
        if (extraSleeveId) {
          const res = await fetch(`/api/decks/${deck.id}/sleeves`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              sleeve_id: extraSleeveId, 
              section_type: 'extra',
              action_mode: extraSleeveMode,
              added_quantity: extraSleeveAddedQty
            }),
          });
          if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.error || 'Error al guardar funda del Extra Deck');
          }
        } else {
          const res = await fetch(`/api/decks/${deck.id}/sleeves?section_type=extra`, {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error('Error al desasignar funda del Extra Deck');
        }
        setInitialExtraSleeveId(extraSleeveId);
      }

      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Ocurrió un error al guardar las fundas.');
    } finally {
      setSavingSleeves(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      // 1. Save main deck details
      const deckRes = await fetch('/api/decks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deck.id,
          name,
          format,
          is_active: isActive,
          storage_location_id: storageLocationId || null,
        }),
      });

      if (!deckRes.ok) {
        const errJson = await deckRes.json();
        throw new Error(errJson.error || 'Error al guardar detalles del deck');
      }

      // 2. Save/Update Main Sleeve
      if (mainSleeveId !== initialMainSleeveId) {
        if (mainSleeveId) {
          await fetch(`/api/decks/${deck.id}/sleeves`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              sleeve_id: mainSleeveId, 
              section_type: 'main_side',
              action_mode: mainSleeveMode,
              added_quantity: mainSleeveAddedQty
            }),
          });
        } else {
          await fetch(`/api/decks/${deck.id}/sleeves?section_type=main_side`, {
            method: 'DELETE',
          });
        }
      }

      // 3. Save/Update Extra Sleeve
      if (extraSleeveId !== initialExtraSleeveId) {
        if (extraSleeveId) {
          await fetch(`/api/decks/${deck.id}/sleeves`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              sleeve_id: extraSleeveId, 
              section_type: 'extra',
              action_mode: extraSleeveMode,
              added_quantity: extraSleeveAddedQty
            }),
          });
        } else {
          await fetch(`/api/decks/${deck.id}/sleeves?section_type=extra`, {
            method: 'DELETE',
          });
        }
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Ocurrió un error inesperado al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const cardsCount = deck.cards?.reduce((acc: number, c: DeckCardDetail) => acc + c.count, 0) || 0;

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-3xl shadow-2xl p-6 text-zinc-900 dark:text-zinc-100 overflow-hidden flex flex-col h-dvh sm:h-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Ficha Técnica del Deck
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">Nombre de la baraja</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold text-xs focus:border-red-500 focus:outline-none"
              />
            </div>

            {/* Formato y Estado */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">Formato</label>
                <PremiumDropdown
                  value={format}
                  onChange={(val) => setFormat(val)}
                  align="full"
                  size="md"
                  options={[
                    { value: 'TCG', label: 'TCG' },
                    { value: 'Master Duel', label: 'Master Duel' },
                    { value: 'Duel Links', label: 'Duel Links' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">Estado</label>
                <PremiumDropdown
                  value={isActive ? 'active' : 'inactive'}
                  onChange={(val) => setIsActive(val === 'active')}
                  align="full"
                  size="md"
                  options={[
                    { value: 'active', label: 'Activo (En uso)' },
                    { value: 'inactive', label: 'Inactivo (Receta de reserva)' },
                  ]}
                />
              </div>
            </div>

            {/* Ubicación de Almacenamiento */}
            <div>
              <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">
                Contenedor Físico (Ubicación)
              </label>
              <PremiumDropdown
                value={storageLocationId}
                onChange={(val) => setStorageLocationId(val)}
                align="full"
                size="md"
                options={[
                  { value: '', label: 'Sin almacenar (Sólo Receta)' },
                  ...locations.map(loc => {
                    const containerDecks = decks.filter((d) => d.storage_location_id === loc.id && d.id !== deck?.id);
                    const decksLabel = containerDecks.length > 0
                      ? ` (Contiene: ${containerDecks.map((d) => d.name).join(', ')})`
                      : '';
                    return {
                      value: loc.id,
                      label: `${loc.type === 'deckbox' ? '📦' : loc.type === 'binder' ? '📘' : '📥'} ${loc.name} (${loc.type.toUpperCase()})${decksLabel}`,
                    };
                  }),
                ]}
              />
            </div>

            {/* Fundas */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-2.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Asignación de Fundas (Sleeves)</span>
              </h3>

              {loadingSleeves ? (
                <div className="text-center py-4 text-xs font-mono text-zinc-500">
                  Cargando fundas asignadas...
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono">
                        Funda Main & Side
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetSleeveSection('main_side');
                          setIsNewSleeveModalOpen(true);
                        }}
                        className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline cursor-pointer"
                      >
                        + Nueva
                      </button>
                    </div>
                    <PremiumDropdown
                      value={mainSleeveId}
                      onChange={(val) => {
                        setMainSleeveId(val);
                        setMainSleeveMode('take');
                      }}
                      align="full"
                      size="md"
                      options={[
                        { value: '', label: 'Ninguna / Sin funda' },
                        ...availableSleeves.map((s) => ({
                          value: s.id,
                          label: `${s.name} (${s.brand} - ${s.color_pattern})`,
                        })),
                      ]}
                    />
                    {renderSleeveConflictPanel(
                      mainSleeveId,
                      'main_side',
                      mainSleeveMode,
                      setMainSleeveMode,
                      mainSleeveAddedQty,
                      setMainSleeveAddedQty
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono">
                        Funda Extra Deck
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetSleeveSection('extra');
                          setIsNewSleeveModalOpen(true);
                        }}
                        className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline cursor-pointer"
                      >
                        + Nueva
                      </button>
                    </div>
                    <PremiumDropdown
                      value={extraSleeveId}
                      onChange={(val) => {
                        setExtraSleeveId(val);
                        setExtraSleeveMode('take');
                      }}
                      align="full"
                      size="md"
                      options={[
                        { value: '', label: 'Ninguna / Sin funda' },
                        ...availableSleeves.map((s) => ({
                          value: s.id,
                          label: `${s.name} (${s.brand} - ${s.color_pattern})`,
                        })),
                      ]}
                    />
                    {renderSleeveConflictPanel(
                      extraSleeveId,
                      'extra',
                      extraSleeveMode,
                      setExtraSleeveMode,
                      extraSleeveAddedQty,
                      setExtraSleeveAddedQty
                    )}
                  </div>
                  
                  {/* Botón rápido para guardar sólo fundas */}
                  <div className="col-span-2 flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSaveSleevesOnly}
                      disabled={savingSleeves || (mainSleeveId === initialMainSleeveId && extraSleeveId === initialExtraSleeveId)}
                      className="px-3.5 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-300 disabled:opacity-40 font-black text-xs transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{savingSleeves ? 'Guardando...' : 'Confirmar Fundas'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Estadísticas Rápidas */}
            <div className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-500">Tamaño del Deck:</span>
              <span className="text-zinc-900 dark:text-white font-black">{cardsCount} cartas</span>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  router.push(`/?loadDeckId=${deck.id}`);
                }}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-purple-600 dark:text-purple-300 font-black text-xs uppercase tracking-wider transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Abrir en Taller</span>
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-md shadow-red-600/25 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{saving ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>

      <SleeveInventoryFormModal
        isOpen={isNewSleeveModalOpen}
        availableSleeves={availableSleeves}
        onClose={() => {
          setIsNewSleeveModalOpen(false);
          setTargetSleeveSection(null);
        }}
        onSuccess={handleNewSleeveSuccess}
      />
    </AnimatePresence>
  );
};
