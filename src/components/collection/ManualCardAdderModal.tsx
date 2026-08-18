'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  BookOpen,
  FileText,
  Check,
  AlertCircle,
  Printer,
  Loader2,
} from 'lucide-react';
import { StorageLocation, CardCondition, CardStatusFlag, SleeveType } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

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
  desc?: string;
  image_url: string;
  image_url_small: string;
  archetype?: string;
  atk?: number | null;
  def?: number | null;
  level?: number | null;
  attribute?: string | null;
  race?: string | null;
}

export interface QueuedCardItem {
  id: string; // unique ID in queue
  card_id: number;
  name: string;
  type: string;
  desc?: string;
  image_url: string;
  image_url_small?: string;
  archetype?: string;
  atk?: number | null;
  def?: number | null;
  level?: number | null;
  attribute?: string | null;
  race?: string | null;
  // Physical attributes
  quantity: number;
  storage_location_id: string; // 'inbox' or location id
  rarity: string;
  condition: CardCondition;
  language: 'en' | 'es' | 'jp';
  status_flag: CardStatusFlag;
  sleeve_type: SleeveType;
  is_proxy: boolean;
  notes: string;
}

const RARITIES = [
  'Common',
  'Rare',
  'Super Rare',
  'Ultra Rare',
  'Secret Rare',
  'Prismatic Secret Rare',
  'Starlight Rare',
  'Collector\'s Rare',
  'Ultimate Rare',
  'Ghost Rare',
  'Gold Rare',
  'Quarter Century Secret Rare',
];

const CONDITIONS: CardCondition[] = [
  'Near Mint',
  'Lightly Played',
  'Moderately Played',
  'Heavily Played',
  'Damaged',
];

const STATUS_FLAGS: { value: CardStatusFlag; label: string }[] = [
  { value: 'collection', label: 'Colección Personal' },
  { value: 'trade_sale', label: 'Trade / En Venta' },
  { value: 'bulk', label: 'Bulk / Sobrantes' },
  { value: 'workshop', label: 'Taller / En Construcción' },
];

export const ManualCardAdderModal: React.FC<ManualCardAdderModalProps> = ({
  isOpen,
  onClose,
  locations,
  onSuccess,
}) => {
  const [activeLeftTab, setActiveLeftTab] = useState<'search' | 'bulk'>('search');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Monster' | 'Spell' | 'Trap' | 'Extra'>('All');
  const [searchResults, setSearchResults] = useState<YgoCardResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Bulk input state
  const [bulkText, setBulkText] = useState('');
  const [analyzingBulk, setAnalyzingBulk] = useState(false);
  const [unmatchedBulkCards, setUnmatchedBulkCards] = useState<string[]>([]);

  // Center Queue & Active selection state
  const [queuedCards, setQueuedCards] = useState<QueuedCardItem[]>([]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // Default global location for new cards
  const [defaultLocationId, setDefaultLocationId] = useState<string>('inbox');

  // Save operation state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Active card derived item
  const activeCard = queuedCards.find((c) => c.id === activeCardId) || null;

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setSearchQuery('');
        setSearchResults([]);
        setQueuedCards([]);
        setActiveCardId(null);
        setBulkText('');
        setUnmatchedBulkCards([]);
        setErrorMsg('');
        setSuccessMsg('');
      });
    }
  }, [isOpen]);

  // Debounced search logic
  const handleSearch = useCallback(
    async (queryText: string, typeVal: string) => {
      if (!queryText.trim()) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      setErrorMsg('');
      try {
        let url = `/api/cards?q=${encodeURIComponent(queryText.trim())}&limit=24`;
        if (typeVal !== 'All') {
          url += `&type=${encodeURIComponent(typeVal)}`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setSearchResults(json.data || []);
        } else {
          setErrorMsg('Error al buscar cartas.');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Error de red al consultar cartas.');
      } finally {
        setSearching(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen || activeLeftTab !== 'search') return;
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch(searchQuery, typeFilter);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, typeFilter, isOpen, activeLeftTab, handleSearch]);

  // Add a card from search to the central queue
  const handleAddCardToQueue = (card: YgoCardResult) => {
    setErrorMsg('');
    setSuccessMsg('');

    // Check if card is already in queue
    const existingIndex = queuedCards.findIndex((c) => c.card_id === card.id);
    if (existingIndex >= 0) {
      // Increment quantity
      const existing = queuedCards[existingIndex];
      const updated = [...queuedCards];
      updated[existingIndex] = {
        ...existing,
        quantity: existing.quantity + 1,
      };
      setQueuedCards(updated);
      setActiveCardId(existing.id);
    } else {
      // Create new queue item
      const newItem: QueuedCardItem = {
        id: `queue-${card.id}-${Math.random().toString(36).substring(2, 9)}`,
        card_id: card.id,
        name: card.name,
        type: card.type,
        desc: card.desc,
        image_url: card.image_url,
        image_url_small: card.image_url_small || card.image_url,
        archetype: card.archetype,
        atk: card.atk,
        def: card.def,
        level: card.level,
        attribute: card.attribute,
        race: card.race,
        quantity: 1,
        storage_location_id: defaultLocationId,
        rarity: 'Common',
        condition: 'Near Mint',
        language: 'en',
        status_flag: 'collection',
        sleeve_type: 'none',
        is_proxy: false,
        notes: '',
      };
      setQueuedCards((prev) => [...prev, newItem]);
      setActiveCardId(newItem.id);
    }
  };

  // Process bulk text and populate the central queue
  const handleAnalyzeBulk = async () => {
    if (!bulkText.trim()) return;

    setAnalyzingBulk(true);
    setErrorMsg('');
    setSuccessMsg('');
    setUnmatchedBulkCards([]);

    try {
      const res = await fetch('/api/collection/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: bulkText }),
      });

      if (res.ok) {
        const json = await res.json();
        const parsed = json.parsed || [];
        const unmatched = json.unmatched || [];
        setUnmatchedBulkCards(unmatched);

        if (parsed.length > 0) {
          type ParsedItem = {
            card_id: number;
            name: string;
            type?: string;
            desc?: string;
            image_url?: string;
            image_url_small?: string;
            archetype?: string;
            quantity?: number;
          };
          const newItems: QueuedCardItem[] = parsed.map((p: ParsedItem) => ({
            id: `queue-${p.card_id}-${Math.random().toString(36).substring(2, 9)}`,
            card_id: p.card_id,
            name: p.name,
            type: p.type || 'Monster',
            desc: p.desc || '',
            image_url: p.image_url || '',
            image_url_small: p.image_url_small || p.image_url || '',
            archetype: p.archetype,
            quantity: p.quantity || 1,
            storage_location_id: defaultLocationId,
            rarity: 'Common',
            condition: 'Near Mint',
            language: 'en',
            status_flag: 'collection',
            sleeve_type: 'none',
            is_proxy: false,
            notes: '',
          }));

          setQueuedCards((prev) => [...prev, ...newItems]);
          if (newItems.length > 0) {
            setActiveCardId(newItems[0].id);
          }
          setSuccessMsg(`¡${parsed.length} cartas analizadas y agregadas al grid!`);
        } else {
          setErrorMsg('No se pudieron reconocer cartas en el texto provisto.');
        }
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

  // Update attributes on the active card
  const handleUpdateActiveCard = (updates: Partial<QueuedCardItem>) => {
    if (!activeCardId) return;
    setQueuedCards((prev) =>
      prev.map((item) => (item.id === activeCardId ? { ...item, ...updates } : item))
    );
  };

  // Remove a card from the queue
  const handleRemoveQueuedCard = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setQueuedCards((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      if (activeCardId === id) {
        setActiveCardId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  // Apply default container to all queued cards
  const handleApplyLocationToAll = (locId: string) => {
    setDefaultLocationId(locId);
    setQueuedCards((prev) =>
      prev.map((item) => ({
        ...item,
        storage_location_id: locId,
      }))
    );
  };

  // Save all queued cards to the collection via batch API
  const handleSaveAllCards = async () => {
    if (queuedCards.length === 0) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        cards: queuedCards.map((c) => ({
          card_id: c.card_id,
          storage_location_id: c.storage_location_id === 'inbox' ? null : c.storage_location_id,
          quantity: c.quantity,
          rarity: c.rarity,
          condition: c.condition,
          language: c.language,
          status_flag: c.status_flag,
          sleeve_type: c.sleeve_type,
          is_proxy: c.is_proxy,
          notes: c.notes,
        })),
      };

      const res = await fetch('/api/collection/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const count = json.count || queuedCards.reduce((acc, c) => acc + c.quantity, 0);
        setSuccessMsg(`¡${count} cartas registradas con éxito en tu colección!`);
        onSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        const json = await res.json();
        setErrorMsg(json.error || 'Error al registrar las cartas.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al guardar las cartas.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCardUnits = queuedCards.reduce((acc, c) => acc + c.quantity, 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden">
        
        {/* Backdrop click to close */}
        <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          className="relative w-full max-w-7xl h-dvh sm:h-[92vh] sm:max-h-[92vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100 z-10"
        >
          
          {/* ══════════════════════════════════════════════════════════════
              WORKSPACE HEADER
          ══════════════════════════════════════════════════════════════ */}
          <div className="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-red-600/30 font-display tracking-wider">
                EX
              </div>
              <div>
                <h2 className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Registro de Cartas en Colección</span>
                  <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-[10px] font-mono font-black">
                    3 Paneles
                  </span>
                </h2>
                <p className="text-[10px] text-zinc-500 font-mono">
                  Buscador • Grid de Registro • Detalle Táctico
                </p>
              </div>
            </div>

            {/* Quick Batch Controls */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className="text-[10px] font-black uppercase text-zinc-400 font-mono">
                  Destino por defecto:
                </span>
                <PremiumDropdown
                  value={defaultLocationId}
                  onChange={(val) => handleApplyLocationToAll(val)}
                  size="sm"
                  menuWidth="min-w-64"
                  options={[
                    { value: 'inbox', label: '📥 Bandeja Sin Clasificar (Inbox)' },
                    ...locations.map((loc) => ({
                      value: loc.id,
                      label: `📦 ${loc.name} (${loc.type})`,
                    })),
                  ]}
                />
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              3-COLUMN WORKSPACE BODY
          ══════════════════════════════════════════════════════════════ */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            
            {/* ──────────────────────────────────────────────────────────
                PANEL IZQUIERDO: BUSCADOR / ENTRADA EN LOTE
            ────────────────────────────────────────────────────────── */}
            <div className="w-full lg:w-80 xl:w-96 p-4 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 flex flex-col min-h-0 bg-zinc-50/50 dark:bg-zinc-950/40 shrink-0">
              
              {/* Left Sub-Tabs */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-3 gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveLeftTab('search')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeLeftTab === 'search'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Buscador</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLeftTab('bulk')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeLeftTab === 'bulk'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>En Lote (Bulk)</span>
                </button>
              </div>

              {activeLeftTab === 'search' ? (
                <>
                  {/* Search Bar */}
                  <div className="relative mb-2 shrink-0">
                    <input
                      type="text"
                      placeholder="Buscar por nombre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-red-500 shadow-xs"
                    />
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Fast Type Filter Pills */}
                  <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-2 mb-2 shrink-0">
                    {(['All', 'Monster', 'Spell', 'Trap', 'Extra'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTypeFilter(t)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                          typeFilter === t
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        {t === 'All' ? 'Todos' : t}
                      </button>
                    ))}
                  </div>

                  {/* Search Results List */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                    {searching ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-red-500 mb-2" />
                        <span className="text-[11px] font-mono text-zinc-400">Buscando cartas...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {searchResults.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => handleAddCardToQueue(c)}
                            className="group relative p-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-red-500 rounded-xl flex flex-col justify-between cursor-pointer transition-all hover:scale-102 shadow-xs"
                          >
                            <div className="aspect-[3/4.2] rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900 mb-1.5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={c.image_url_small || c.image_url}
                                alt={c.name}
                                className="w-full h-full object-contain"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg';
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-black line-clamp-1 text-zinc-900 dark:text-zinc-100">
                              {c.name}
                            </span>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-[8px] font-mono text-zinc-400 truncate">
                                {c.type}
                              </span>
                              <span className="text-[9px] font-black text-red-500 flex items-center">
                                + Añadir
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
                        <BookOpen className="w-8 h-8 mb-2 opacity-40" />
                        <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                          {searchQuery ? 'Sin coincidencias' : 'Escribe para buscar'}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 max-w-50">
                          Escribe el nombre de la carta para añadirla a la cola.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Bulk Tab */
                <div className="flex-1 flex flex-col min-h-0 space-y-3">
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Pega tu lista de cartas (una por línea con cantidad):
                  </div>
                  <textarea
                    rows={8}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={`3 Ash Blossom & Joyous Spring\n1 Nibiru, the Primal Being\n3 Infinite Impermanence\nRaigeki x2`}
                    className="w-full flex-1 p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono focus:border-red-500 focus:outline-none resize-none leading-relaxed"
                  />

                  <button
                    type="button"
                    onClick={handleAnalyzeBulk}
                    disabled={analyzingBulk || !bulkText.trim()}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-red-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {analyzingBulk ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analizando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Analizar y Volcar al Grid</span>
                      </>
                    )}
                  </button>

                  {unmatchedBulkCards.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px]">
                      <b>No reconocidas ({unmatchedBulkCards.length}):</b>
                      <div className="font-mono mt-1 max-h-20 overflow-y-auto">
                        {unmatchedBulkCards.map((u, i) => (
                          <div key={i}>• {u}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ──────────────────────────────────────────────────────────
                PANEL CENTRAL: GRID / COLA DE CARTAS A REGISTRAR
            ────────────────────────────────────────────────────────── */}
            <div className="flex-1 p-4 md:p-6 flex flex-col min-h-0 overflow-hidden bg-zinc-100/50 dark:bg-zinc-900/40">
              
              {/* Center Toolbar */}
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span className="text-red-500">📋</span>
                    <span>Cola de Registro</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-mono font-black">
                    {totalCardUnits} cartas • {queuedCards.length} tipos
                  </span>
                </div>

                {queuedCards.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setQueuedCards([]);
                      setActiveCardId(null);
                    }}
                    className="text-xs text-red-500 hover:text-red-600 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpiar todo</span>
                  </button>
                )}
              </div>

              {/* Grid of Queued Cards */}
              <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
                {queuedCards.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-center text-zinc-400">
                    <div className="w-16 h-16 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-2xl mb-4 shadow-sm">
                      📦
                    </div>
                    <p className="text-sm font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Cola de Registro Vacía
                    </p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm leading-relaxed">
                      Busca cartas en el panel izquierdo o pega un lote de texto para añadirlas a la cola.
                      Podrás editar sus rarezas, condición y contenedor en el panel derecho antes de guardar.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                    {queuedCards.map((item) => {
                      const isSelected = item.id === activeCardId;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setActiveCardId(item.id)}
                          className={`relative p-2 rounded-2xl bg-white dark:bg-zinc-950 border transition-all cursor-pointer group flex flex-col justify-between ${
                            isSelected
                              ? 'ring-2 ring-red-500 border-red-500 shadow-lg shadow-red-500/20 scale-[1.02] z-10'
                              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 shadow-xs'
                          }`}
                        >
                          {/* Image Container with Badges */}
                          <div className="relative aspect-[3/4.2] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 mb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image_url_small || item.image_url}
                              alt={item.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg';
                              }}
                            />

                            {/* Quantity Badge */}
                            <div className="absolute bottom-1 left-1 bg-black/90 text-white font-mono font-black text-[10px] px-1.5 py-0.5 rounded shadow">
                              {item.quantity}x
                            </div>

                            {/* Proxy Badge */}
                            {item.is_proxy && (
                              <div className="absolute top-1 left-1 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow">
                                PROXY
                              </div>
                            )}

                            {/* Rarity Tag */}
                            {item.rarity && item.rarity !== 'Common' && (
                              <div className="absolute top-1 right-1 bg-amber-500/90 text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow">
                                {item.rarity.substring(0, 3)}
                              </div>
                            )}

                            {/* Delete Button (hover) */}
                            <button
                              type="button"
                              onClick={(e) => handleRemoveQueuedCard(item.id, e)}
                              className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow cursor-pointer"
                              title="Remover de la cola"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Info footer */}
                          <div>
                            <span className="text-xs font-black line-clamp-1 text-zinc-900 dark:text-zinc-100">
                              {item.name}
                            </span>
                            <div className="flex items-center justify-between text-[9px] text-zinc-400 mt-0.5">
                              <span className="truncate">{item.condition}</span>
                              <span className="font-mono">{item.language.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Center Footer & Save CTA */}
              <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                {/* Feedback Alerts */}
                <div className="flex-1 min-w-0">
                  {errorMsg && (
                    <div className="text-xs text-red-500 font-bold flex items-center gap-1.5 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="truncate">{errorMsg}</span>
                    </div>
                  )}
                  {successMsg && (
                    <div className="text-xs text-emerald-500 font-bold flex items-center gap-1.5 animate-in fade-in">
                      <Check className="w-4 h-4 shrink-0" />
                      <span className="truncate">{successMsg}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveAllCards}
                  disabled={submitting || queuedCards.length === 0}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando en Colección...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Registrar {totalCardUnits} Cartas en Colección</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* ──────────────────────────────────────────────────────────
                PANEL DERECHO: DETALLES & EDICIÓN DE LA CARTA ACTIVA
            ────────────────────────────────────────────────────────── */}
            <div className="w-full lg:w-80 xl:w-96 p-4 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 flex flex-col min-h-0 bg-zinc-50/50 dark:bg-zinc-950/40 shrink-0 overflow-y-auto scrollbar-thin">
              
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-3 shrink-0">
                <h3 className="font-black text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span className="text-red-500">⚙️</span>
                  <span>Detalles del Registro</span>
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Configura los atributos físicos de la carta activa
                </span>
              </div>

              {activeCard ? (
                <div className="space-y-4">
                  {/* Card Mini Header */}
                  <div className="flex gap-3 bg-white dark:bg-zinc-950 p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
                    <div className="w-16 shrink-0 aspect-[3/4.2] rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeCard.image_url_small || activeCard.image_url}
                        alt={activeCard.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-mono text-zinc-400">ID #{activeCard.card_id}</span>
                        <h4 className="font-black text-xs line-clamp-2 text-zinc-900 dark:text-zinc-100">
                          {activeCard.name}
                        </h4>
                        {activeCard.archetype && (
                          <span className="inline-block mt-0.5 px-1 py-0.2 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-[8px] font-bold rounded uppercase">
                            {activeCard.archetype}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-medium truncate">
                        {activeCard.type}
                      </span>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-3 text-xs">
                    
                    {/* Cantidad e Idioma */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
                          Cantidad
                        </label>
                        <div className="flex items-center bg-white dark:bg-zinc-950 rounded-lg border border-zinc-300 dark:border-zinc-800 p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateActiveCard({ quantity: Math.max(1, activeCard.quantity - 1) })}
                            className="w-7 h-6 rounded flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 font-black cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="flex-1 text-center font-mono font-black text-xs">
                            {activeCard.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateActiveCard({ quantity: activeCard.quantity + 1 })}
                            className="w-7 h-6 rounded flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 font-black cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
                          Idioma
                        </label>
                        <PremiumDropdown
                          value={activeCard.language}
                          onChange={(val) => handleUpdateActiveCard({ language: val as 'en' | 'es' | 'jp' })}
                          align="full"
                          size="sm"
                          options={[
                            { value: 'en', label: 'Inglés (EN)' },
                            { value: 'es', label: 'Español (ES)' },
                            { value: 'jp', label: 'Japonés (JP)' },
                          ]}
                        />
                      </div>
                    </div>

                    {/* Contenedor de Destino */}
                    <div>
                      <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
                        Contenedor de Destino
                      </label>
                      <PremiumDropdown
                        value={activeCard.storage_location_id}
                        onChange={(val) => handleUpdateActiveCard({ storage_location_id: val })}
                        align="full"
                        size="sm"
                        options={[
                          { value: 'inbox', label: '📥 Bandeja "Sin Clasificar" (Inbox)' },
                          ...locations.map((loc) => ({
                            value: loc.id,
                            label: `📦 ${loc.name} (${loc.type})`,
                          })),
                        ]}
                      />
                    </div>

                    {/* Rareza y Condición */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
                          Rareza
                        </label>
                        <PremiumDropdown
                          value={activeCard.rarity}
                          onChange={(val) => handleUpdateActiveCard({ rarity: val })}
                          align="full"
                          size="sm"
                          options={RARITIES.map((r) => ({ value: r, label: r }))}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
                          Condición
                        </label>
                        <PremiumDropdown
                          value={activeCard.condition}
                          onChange={(val) => handleUpdateActiveCard({ condition: val as CardCondition })}
                          align="full"
                          size="sm"
                          options={CONDITIONS.map((cond) => ({ value: cond, label: cond }))}
                        />
                      </div>
                    </div>

                    {/* Estado / Intención y Funda */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
                          Estado / Intención
                        </label>
                        <PremiumDropdown
                          value={activeCard.status_flag}
                          onChange={(val) => handleUpdateActiveCard({ status_flag: val as CardStatusFlag })}
                          align="full"
                          size="sm"
                          options={STATUS_FLAGS.map((s) => ({ value: s.value, label: s.label }))}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
                          Funda
                        </label>
                        <PremiumDropdown
                          value={activeCard.sleeve_type}
                          onChange={(val) => handleUpdateActiveCard({ sleeve_type: val as SleeveType })}
                          align="full"
                          size="sm"
                          options={[
                            { value: 'none', label: 'Sin Funda' },
                            { value: 'single', label: 'Single Sleeve' },
                            { value: 'double', label: 'Double Sleeve' },
                            { value: 'triple', label: 'Triple Sleeve' },
                          ]}
                        />
                      </div>
                    </div>

                    {/* Switch de Proxy */}
                    <div className="p-2.5 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                          <Printer className="w-3.5 h-3.5" />
                          <span>¿Es una carta Proxy / Impresa?</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={activeCard.is_proxy}
                          onChange={(e) => handleUpdateActiveCard({ is_proxy: e.target.checked })}
                          className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                        />
                      </label>
                    </div>

                    {/* Notas Adicionales */}
                    <div>
                      <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
                        Notas Adicionales
                      </label>
                      <input
                        type="text"
                        placeholder="Edición especial, firma, caja de procedencia..."
                        value={activeCard.notes}
                        onChange={(e) => handleUpdateActiveCard({ notes: e.target.value })}
                        className="w-full text-xs py-1.5 px-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-red-500 focus:outline-none placeholder:text-zinc-400"
                      />
                    </div>

                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-zinc-400">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-xl mb-3 shadow-inner">
                    👆
                  </div>
                  <p className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Selecciona una carta
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-45 leading-relaxed">
                    Toca cualquier carta del grid central para ajustar su rareza, condición o contenedor.
                  </p>
                </div>
              )}
            </div>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
