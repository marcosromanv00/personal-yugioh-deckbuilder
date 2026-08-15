'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Edit3, Shield, Layers } from 'lucide-react';
import { Deck, StorageLocation, SleeveInventory } from '@/types/collection';
import { useRouter } from 'next/navigation';

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
  const [name, setName] = useState('');
  const [format, setFormat] = useState('TCG');
  const [isActive, setIsActive] = useState(true);
  const [storageLocationId, setStorageLocationId] = useState<string>('');
  
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

  // Fetch current deck sleeves on open
  useEffect(() => {
    if (isOpen && deck) {
      setName(deck.name || '');
      setFormat(deck.format || 'TCG');
      setIsActive(deck.is_active !== false);
      setStorageLocationId(deck.storage_location_id || '');
      setErrorMsg(null);

      const fetchSleevesForDeck = async () => {
        setLoadingSleeves(true);
        try {
          const res = await fetch(`/api/decks/${deck.id}/sleeves`);
          if (res.ok) {
            const json = await res.json();
            const deckSleeves = json.data || [];
            
            const mainSleeve = deckSleeves.find((s: any) => s.section_type === 'main_side');
            const extraSleeve = deckSleeves.find((s: any) => s.section_type === 'extra');
            
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
            body: JSON.stringify({ sleeve_id: mainSleeveId, section_type: 'main_side' }),
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
            body: JSON.stringify({ sleeve_id: extraSleeveId, section_type: 'extra' }),
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
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ocurrió un error inesperado al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const cardsCount = deck.cards?.reduce((acc: number, c: any) => acc + c.count, 0) || 0;

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
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
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
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      Funda Main & Side
                    </label>
                    <select
                      value={mainSleeveId}
                      onChange={(e) => setMainSleeveId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-150 text-xs focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Ninguna / Sin funda</option>
                      {availableSleeves.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.brand} - {s.color_pattern})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      Funda Extra Deck
                    </label>
                    <select
                      value={extraSleeveId}
                      onChange={(e) => setExtraSleeveId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-150 text-xs focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Ninguna / Sin funda</option>
                      {availableSleeves.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.brand} - {s.color_pattern})
                        </option>
                      ))}
                    </select>
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
    </AnimatePresence>
  );
};
