'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Edit3, Shield, Layers, AlertCircle } from 'lucide-react';
import { Deck, StorageLocation, SleeveInventory, UserCard, DeckCardDetail, DeckSleeve } from '@/types/collection';
import { useRouter } from 'next/navigation';
import { SleeveInventoryFormModal } from './SleeveInventoryFormModal';



interface DeckDetailsModalProps {
  deck: Deck | null;
  isOpen: boolean;
  onClose: () => void;
  locations: StorageLocation[];
  onSuccess: () => void;
}

export const DeckDetailsModal: React.FC<DeckDetailsModalProps> = ({
  deck,
  isOpen,
  onClose,
  locations,
  onSuccess,
}) => {
  const router = useRouter();
  const [name, setName] = useState(deck?.name || '');
  const [format, setFormat] = useState(deck?.format || 'TCG');
  const [isActive, setIsActive] = useState(deck?.is_active !== false);
  const [storageLocationId, setStorageLocationId] = useState<string>(deck?.storage_location_id || '');
  
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
    if (isOpen && deck) {
      setErrorMsg(null);

      const fetchSleevesForDeck = async () => {
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
          
          const sleevesRes = await fetch('/api/collection/sleeve-inventory');
          if (sleevesRes.ok) {
            const json = await sleevesRes.json();
            setAvailableSleeves(json.data || []);
          }

          const cardsRes = await fetch(`/api/collection/cards?deck_id=${deck.id}`);
          if (cardsRes.ok) {
            const json = await cardsRes.json();
            setUserCards(json.data || []);
          }
        } catch (err) {
          console.error('Error al cargar fundas asignadas al deck:', err);
        } finally {
          setLoadingSleeves(false);
        }
      };

      fetchSleevesForDeck();
    }
  }, [isOpen, deck]);

  if (!isOpen || !deck) return null;

  const getSleevingStats = (section: 'main_side' | 'extra') => {
    const targetSections = section === 'main_side' ? ['main', 'side'] : ['extra'];
    
    const N_total = deck.cards?.reduce((sum: number, c: DeckCardDetail) => {
      return targetSections.includes(c.section) ? sum + (c.count || 0) : sum;
    }, 0) || 0;
    
    const N_sleeved_registered = userCards
      ?.filter(uc => targetSections.includes(uc.deck_section || '') && uc.sleeve_type && uc.sleeve_type !== 'none')
      .reduce((sum, uc) => sum + (uc.quantity || 0), 0) || 0;
      
    const N_unsleeved = Math.max(0, N_total - N_sleeved_registered);
    
    return { N_total, N_unsleeved };
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
      <div className="mt-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3.5">
        {/* Info label */}
        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 pb-2 border-b border-slate-900">
          <span>Cartas en sección: <b>{getSleevingStats(section).N_total}</b></span>
          <span>•</span>
          <span>Necesarias: <b>{status.N_needed}</b></span>
          <span>•</span>
          <span>Disponibles en colección: <b>{status.available}</b></span>
        </div>

        {/* Radio group */}
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name={`conflict-mode-${section}`}
              checked={mode === 'take'}
              onChange={() => setMode('take')}
              className="text-purple-500 focus:ring-purple-500 bg-slate-900 border-slate-700"
            />
            <span className="text-[11px] font-mono text-slate-350 group-hover:text-white transition-colors">
              Tomar fundas existentes de la colección
            </span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name={`conflict-mode-${section}`}
              checked={mode === 'add'}
              onChange={() => setMode('add')}
              className="text-purple-500 focus:ring-purple-500 bg-slate-900 border-slate-700"
            />
            <span className="text-[11px] font-mono text-slate-350 group-hover:text-white transition-colors">
              Sumar fundas nuevas al inventario (+ stock)
            </span>
          </label>
        </div>

        {/* Mode-specific panel */}
        {mode === 'take' && status.hasConflict && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-300 font-mono leading-relaxed flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-bold">Aviso de stock insuficiente</p>
              <p className="text-slate-400 mt-0.5">
                Faltan {status.N_needed} fundas para este deck, pero solo hay {status.available} libres. El deck se guardará con un faltante.
              </p>
            </div>
          </div>
        )}

        {mode === 'add' && (
          <div className="pt-2.5 border-t border-slate-900 space-y-2.5">
            <label className="block text-[10px] uppercase font-bold text-slate-400 font-mono">
              Cantidad de fundas a registrar en la colección
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAddedQty(Math.max(1, addedQty - 10))}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold font-mono transition-colors"
              >
                -10
              </button>
              <input
                type="number"
                min={1}
                value={addedQty}
                onChange={e => setAddedQty(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-16 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-center text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setAddedQty(addedQty + 10)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold font-mono transition-colors"
              >
                +10
              </button>
              <span className="text-[10px] text-slate-400 font-mono">
                (Sugerido: 60 u 80)
              </span>
            </div>
            {status.available + addedQty < status.N_needed && (
              <p className="text-[9px] text-amber-400 font-mono">
                ⚠️ Aún faltan {status.N_needed - (status.available + addedQty)} fundas para cubrir las cartas del deck.
              </p>
            )}
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

      alert('¡Fundas guardadas correctamente!');
      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Ocurrió un error inesperado al guardar las fundas.');
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
      }

      // 3. Save/Update Extra Sleeve
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold bg-linear-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Ficha Técnica del Deck
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 mb-4 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 text-xs font-mono">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Nombre de la baraja</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>

            {/* Formato y Estado */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Formato</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-150 text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="TCG">TCG</option>
                  <option value="Master Duel">Master Duel</option>
                  <option value="Duel Links">Duel Links</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Estado</label>
                <select
                  value={isActive ? 'active' : 'inactive'}
                  onChange={(e) => setIsActive(e.target.value === 'active')}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-150 text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="active">Activo (En uso)</option>
                  <option value="inactive">Inactivo (Receta de reserva)</option>
                </select>
              </div>
            </div>

            {/* Ubicación de Almacenamiento */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Contenedor Físico (Ubicación)
              </label>
              <select
                value={storageLocationId}
                onChange={(e) => setStorageLocationId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-150 text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="">Sin almacenar (Sólo Receta)</option>
                {locations.map((loc, idx) => (
                  <option key={loc.id || `location-${idx}`} value={loc.id}>
                    {loc.type === 'deckbox' ? '📦' : loc.type === 'binder' ? '📘' : '📥'} {loc.name} ({loc.type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Fundas */}
            <div className="border-t border-slate-800 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Asignación de Fundas (Sleeves)</span>
              </h3>

              {loadingSleeves ? (
                <div className="text-center py-4 text-xs font-mono text-slate-500">
                  Cargando fundas asignadas...
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-mono text-slate-400">
                        Funda Main & Side
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetSleeveSection('main_side');
                          setIsNewSleeveModalOpen(true);
                        }}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono hover:underline focus:outline-none"
                      >
                        + Registrar nueva
                      </button>
                    </div>
                    <select
                      value={mainSleeveId}
                      onChange={(e) => {
                        setMainSleeveId(e.target.value);
                        setMainSleeveMode('take');
                      }}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-150 text-xs focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Ninguna / Sin funda</option>
                      {availableSleeves.map((s, idx) => (
                        <option key={s.id || `sleeve-main-${idx}`} value={s.id}>
                          {s.name} ({s.brand} - {s.color_pattern})
                        </option>
                      ))}
                    </select>
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
                      <label className="block text-xs font-mono text-slate-400">
                        Funda Extra Deck
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetSleeveSection('extra');
                          setIsNewSleeveModalOpen(true);
                        }}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono hover:underline focus:outline-none"
                      >
                        + Registrar nueva
                      </button>
                    </div>
                    <select
                      value={extraSleeveId}
                      onChange={(e) => {
                        setExtraSleeveId(e.target.value);
                        setExtraSleeveMode('take');
                      }}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-150 text-xs focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Ninguna / Sin funda</option>
                      {availableSleeves.map((s, idx) => (
                        <option key={s.id || `sleeve-extra-${idx}`} value={s.id}>
                          {s.name} ({s.brand} - {s.color_pattern})
                        </option>
                      ))}
                    </select>
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
                  <div className="col-span-2 flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={handleSaveSleevesOnly}
                      disabled={savingSleeves || (mainSleeveId === initialMainSleeveId && extraSleeveId === initialExtraSleeveId)}
                      className="px-4 py-2 rounded-xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-300 disabled:opacity-45 font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{savingSleeves ? 'Guardando...' : 'Confirmar Fundas'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Estadísticas Rápidas */}
            <div className="bg-slate-950/40 border border-slate-855 rounded-xl p-3.5 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-450">Tamaño del Deck:</span>
              <span className="text-white font-bold">{cardsCount} cartas</span>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  router.push(`/?loadDeckId=${deck.id}`);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar baraja en el Constructor</span>
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium text-xs transition-colors flex items-center space-x-1.5 shadow-lg shadow-purple-900/30"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>

      <SleeveInventoryFormModal
        isOpen={isNewSleeveModalOpen}
        onClose={() => {
          setIsNewSleeveModalOpen(false);
          setTargetSleeveSection(null);
        }}
        onSuccess={handleNewSleeveSuccess}
      />
    </AnimatePresence>
  );
};

