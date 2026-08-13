'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Sparkles, Plus, BookOpen, Globe, Check, AlertCircle, FileText, Trash } from 'lucide-react';
import { StorageLocation, CardCondition, CardStatusFlag, SleeveType } from '@/types/collection';

interface ManualCardAdderModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: StorageLocation[];
  onSuccess: () => void;
}

interface YgoCardResult {
  id: number;
  name: string;
  type: string;
  image_url: string;
  image_url_small: string;
  archetype?: string;
}

interface ParsedBulkCard {
  card_id: number;
  name: string;
  type: string;
  image_url?: string;
  image_url_small?: string;
  quantity: number;
}

export const ManualCardAdderModal: React.FC<ManualCardAdderModalProps> = ({
  isOpen,
  onClose,
  locations,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'individual' | 'bulk'>('individual');
  
  // Individual search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YgoCardResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCard, setSelectedCard] = useState<YgoCardResult | null>(null);

  // Bulk tab states
  const [bulkText, setBulkText] = useState('');
  const [analyzingBulk, setAnalyzingBulk] = useState(false);
  const [parsedBulkCards, setParsedBulkCards] = useState<ParsedBulkCard[]>([]);
  const [unmatchedBulkCards, setUnmatchedBulkCards] = useState<string[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Common Form states
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [quantity, setQuantity] = useState(1);
  const [storageLocationId, setStorageLocationId] = useState<string>('inbox');
  const [rarity, setRarity] = useState('Common');
  const [condition, setCondition] = useState<CardCondition>('Near Mint');
  const [statusFlag, setStatusFlag] = useState<CardStatusFlag>('collection');
  const [sleeveType, setSleeveType] = useState<SleeveType>('none');
  const [isProxy, setIsProxy] = useState(false);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset form
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedCard(null);
      setBulkText('');
      setParsedBulkCards([]);
      setUnmatchedBulkCards([]);
      setHasAnalyzed(false);
      setLanguage('en');
      setQuantity(1);
      setStorageLocationId('inbox');
      setRarity('Common');
      setCondition('Near Mint');
      setStatusFlag('collection');
      setSleeveType('none');
      setIsProxy(false);
      setNotes('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/cards?q=${encodeURIComponent(searchQuery)}&limit=15`);
      if (res.ok) {
        const json = await res.json();
        setSearchResults(json.data || []);
      } else {
        setErrorMsg('Error al buscar cartas. Intenta de nuevo.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al buscar cartas.');
    } finally {
      setSearching(false);
    }
  };

  const handleRegisterCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        card_id: selectedCard.id,
        storage_location_id: storageLocationId === 'inbox' ? null : storageLocationId,
        quantity,
        rarity,
        condition,
        language,
        status_flag: statusFlag,
        sleeve_type: sleeveType,
        is_proxy: isProxy,
        notes,
      };

      const res = await fetch('/api/collection/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessMsg(`¡${selectedCard.name} registrada exitosamente!`);
        onSuccess();
        setTimeout(() => {
          setSelectedCard(null);
          setSuccessMsg('');
        }, 1500);
      } else {
        const json = await res.json();
        setErrorMsg(json.error || 'Error al registrar la carta.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al registrar la carta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnalyzeBulk = async () => {
    if (!bulkText.trim()) return;

    setAnalyzingBulk(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/collection/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: bulkText })
      });

      if (res.ok) {
        const json = await res.json();
        setParsedBulkCards(json.parsed || []);
        setUnmatchedBulkCards(json.unmatched || []);
        setHasAnalyzed(true);
      } else {
        const json = await res.json();
        setErrorMsg(json.error || 'Error al analizar el lote.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al procesar el lote.');
    } finally {
      setAnalyzingBulk(false);
    }
  };

  const handleSaveBulk = async () => {
    if (parsedBulkCards.length === 0) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/collection/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: bulkText,
          action: 'save',
          storage_location_id: storageLocationId,
          language,
          status_flag: statusFlag,
          sleeve_type: sleeveType,
          condition,
          rarity
        })
      });

      if (res.ok) {
        const json = await res.json();
        setSuccessMsg(json.message || 'Lote registrado con éxito.');
        onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        const json = await res.json();
        setErrorMsg(json.error || 'Error al guardar el lote.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al registrar el lote.');
    } finally {
      setSubmitting(false);
    }
  };

  const removeParsedCard = (index: number) => {
    setParsedBulkCards(prev => prev.filter((_, i) => i !== index));
  };

  const updateParsedCardQuantity = (index: number, newQty: number) => {
    setParsedBulkCards(prev => prev.map((item, i) => i === index ? { ...item, quantity: Math.max(1, newQty) } : item));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden text-slate-100"
        >
          {/* Lado Izquierdo: Buscador o Entrada Bulk */}
          <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col max-h-[45vh] md:max-h-none overflow-y-auto">
            {/* Cabecera de Tabs */}
            <div className="flex border-b border-slate-800 mb-4 shrink-0 gap-4">
              <button
                onClick={() => {
                  setActiveTab('individual');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`pb-2.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'individual'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Search className="w-4 h-4" />
                Registro Individual
              </button>
              <button
                onClick={() => {
                  setActiveTab('bulk');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`pb-2.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'bulk'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                Registro en Lote (Bulk)
              </button>
            </div>

            {activeTab === 'individual' ? (
              <>
                {/* Input Buscador */}
                <form onSubmit={handleSearch} className="flex gap-2 mb-4 shrink-0">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="ej: Dark Magician, Ash Blossom, Kuriboh..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searching}
                    className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors flex items-center space-x-1.5 shadow-lg shadow-purple-900/30 disabled:opacity-50"
                  >
                    {searching ? 'Buscando...' : 'Buscar'}
                  </button>
                </form>

                {/* Lista de Resultados */}
                <div className="flex-1 overflow-y-auto min-h-40 space-y-2 pr-1">
                  {searching ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Sparkles className="w-6 h-6 text-purple-400 animate-spin mb-2" />
                      <p className="text-xs font-mono text-slate-400">Consultando base de datos...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {searchResults.map((card) => (
                        <div
                          key={card.id}
                          onClick={() => setSelectedCard(card)}
                          className={`cursor-pointer p-2 rounded-xl border transition-all flex flex-col items-center text-center ${
                            selectedCard?.id === card.id
                              ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-950'
                              : 'bg-slate-950 border-slate-850 hover:border-slate-700'
                          }`}
                        >
                          <img
                            src={card.image_url_small || card.image_url}
                            alt={card.name}
                            className="w-full aspect-3/4 object-cover rounded-lg mb-2"
                            loading="lazy"
                          />
                          <span className="text-xs font-semibold text-slate-200 line-clamp-2 w-full">
                            {card.name}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 mt-1 block">
                            {card.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center">
                      <BookOpen className="w-10 h-10 mb-2 opacity-40" />
                      <p className="text-sm font-semibold">Sin resultados aún</p>
                      <p className="text-xs text-slate-600 mt-0.5">Escribe el nombre de la carta para buscarla.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Bulk Tab UI
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {!hasAnalyzed ? (
                  <div className="flex-1 flex flex-col gap-2">
                    <p className="text-xs text-slate-400">
                      Pega una lista de cartas de Yu-Gi-Oh!, una por línea. Se detectarán automáticamente cantidades al inicio o al final (ej: <span className="font-mono text-purple-400">3 Ash Blossom</span>).
                    </p>
                    <textarea
                      placeholder="3 Ash Blossom & Joyous Spring&#10;1 Nibiru, the Primal Being&#10;Raigeki&#10;3 Infinite Impermanence"
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      className="flex-1 p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-sm resize-none focus:outline-none focus:border-purple-500 min-h-60"
                    />
                    <button
                      onClick={handleAnalyzeBulk}
                      disabled={analyzingBulk || !bulkText.trim()}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-purple-900/30 disabled:opacity-50"
                    >
                      {analyzingBulk ? 'Analizando lista...' : 'Analizar Lista'}
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800 shrink-0">
                      <span className="text-xs font-bold text-slate-300">Cartas Reconocidas ({parsedBulkCards.length})</span>
                      <button
                        onClick={() => setHasAnalyzed(false)}
                        className="text-xs text-purple-400 hover:text-purple-300 underline font-medium cursor-pointer"
                      >
                        Editar lista original
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
                      {parsedBulkCards.map((card, i) => (
                        <div key={`${card.card_id}-${i}`} className="p-2 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {card.image_url_small && (
                              <img src={card.image_url_small} alt={card.name} className="w-8 rounded" />
                            )}
                            <div>
                              <p className="text-xs font-semibold text-slate-200 line-clamp-1">{card.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{card.type}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              value={card.quantity}
                              onChange={(e) => updateParsedCardQuantity(i, parseInt(e.target.value) || 1)}
                              className="w-12 text-center py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono"
                            />
                            <button
                              onClick={() => removeParsedCard(i)}
                              className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded transition-colors"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {unmatchedBulkCards.length > 0 && (
                        <div className="mt-4 p-3 rounded-lg bg-amber-950/20 border border-amber-900/30 text-amber-300">
                          <p className="text-xs font-bold mb-1 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                            No se pudieron reconocer ({unmatchedBulkCards.length} líneas):
                          </p>
                          <ul className="text-[11px] list-disc list-inside font-mono space-y-0.5 opacity-80 max-h-24 overflow-y-auto">
                            {unmatchedBulkCards.map((raw, idx) => (
                              <li key={idx} className="truncate">{raw}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lado Derecho: Configurador e inserción */}
          <div className="flex-1 p-6 flex flex-col max-h-[45vh] md:max-h-none overflow-y-auto bg-slate-950/40 justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 shrink-0">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  Detalles del Registro
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors absolute top-4 right-4"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Controles del Formulario */}
              <div className="space-y-4">
                {activeTab === 'individual' && selectedCard && (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-4">
                    <img
                      src={selectedCard.image_url_small || selectedCard.image_url}
                      alt={selectedCard.name}
                      className="w-12 rounded shadow"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-purple-300 line-clamp-1">{selectedCard.name}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedCard.type}</p>
                    </div>
                  </div>
                )}

                {/* Campos Principales */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Idioma</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-purple-500 focus:outline-none"
                    >
                      <option value="en">Inglés (EN)</option>
                      <option value="es">Español (ES)</option>
                    </select>
                  </div>

                  {activeTab === 'individual' ? (
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-sm font-mono focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Lote total</label>
                      <div className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 text-sm font-mono flex items-center">
                        {parsedBulkCards.reduce((acc, c) => acc + c.quantity, 0)} cartas
                      </div>
                    </div>
                  )}
                </div>

                {/* Contenedor Destino */}
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Contenedor de Destino</label>
                  <select
                    value={storageLocationId}
                    onChange={(e) => setStorageLocationId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-purple-500 focus:outline-none"
                  >
                    <option value="inbox">📥 Bandeja &quot;Sin Clasificar&quot; (Inbox)</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        📦 {loc.name} ({loc.type === 'binder' ? 'Binder' : loc.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rareza y Condición */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Rareza</label>
                    <select
                      value={rarity}
                      onChange={(e) => setRarity(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
                    >
                      <option value="Common">Común</option>
                      <option value="Rare">Rara</option>
                      <option value="Super Rare">Súper Rara (SR)</option>
                      <option value="Ultra Rare">Ultra Rara (UR)</option>
                      <option value="Secret Rare">Secreta (ScR)</option>
                      <option value="Ultimate Rare">Ultimate Rare (UtR)</option>
                      <option value="Collector's Rare">Collector's Rare (CR)</option>
                      <option value="Quarter Century Secret Rare">25th Anniversary (QCSR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Condición</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as CardCondition)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
                    >
                      <option value="Near Mint">Near Mint (NM)</option>
                      <option value="Lightly Played">Lightly Played (LP)</option>
                      <option value="Moderately Played">Moderately Played (MP)</option>
                      <option value="Heavily Played">Heavily Played (HP)</option>
                      <option value="Damaged">Damaged (DMG)</option>
                    </select>
                  </div>
                </div>

                {/* Estado y Funda */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Estado / Intención</label>
                    <select
                      value={statusFlag}
                      onChange={(e) => setStatusFlag(e.target.value as CardStatusFlag)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
                    >
                      <option value="collection">Colección Personal</option>
                      <option value="trade_sale">Para Venta / Trade</option>
                      <option value="workshop">Material de Talleres</option>
                      <option value="bulk">Bulk / Sobrante</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Funda</label>
                    <select
                      value={sleeveType}
                      onChange={(e) => setSleeveType(e.target.value as SleeveType)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
                    >
                      <option value="none">Sin Funda</option>
                      <option value="single">Funda Simple</option>
                      <option value="double">Funda Doble</option>
                      <option value="triple">Funda Triple</option>
                    </select>
                  </div>
                </div>

                {activeTab === 'individual' && (
                  <>
                    <div className="flex items-center">
                      <label className="text-xs font-medium text-slate-350 flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isProxy}
                          onChange={(e) => setIsProxy(e.target.checked)}
                          className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-purple-600 focus:ring-0 focus:ring-offset-0"
                        />
                        <span>¿Es una carta Proxy (Impresa/Placeholder)?</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Notas Adicionales</label>
                      <textarea
                        placeholder="Edición especial, firma, caja de procedencia..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs resize-none focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Acciones de envío */}
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2 mt-4">
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-900/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-900/40 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {activeTab === 'individual' ? (
                <button
                  onClick={handleRegisterCard}
                  disabled={submitting || !selectedCard}
                  className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-sm transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-900/20 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{submitting ? 'Registrando...' : 'Registrar Carta en Colección'}</span>
                </button>
              ) : (
                <button
                  onClick={handleSaveBulk}
                  disabled={submitting || parsedBulkCards.length === 0}
                  className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-purple-900/20 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{submitting ? 'Registrando lote...' : 'Registrar Lote en Colección'}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
