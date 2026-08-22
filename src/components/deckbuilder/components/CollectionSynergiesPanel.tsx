'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PackageCheck,
  Plus,
  Sparkles,
  Layers,
  Box,
  Flame,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { UserCard, StorageLocation, Deck } from '@/types/collection';
import { DeckCard, Card, HoverCardBase } from '../types';
import { KNOWN_STAPLES_CATALOG } from '@/lib/collectionSuggestions';

export interface CollectionDeckCardItem {
  id?: number;
  card_id?: number;
  count: number;
  section?: string;
  archetype?: string;
  name?: string;
  type?: string;
  image_url?: string;
  image_url_small?: string;
  card_details?: {
    name?: string;
    archetype?: string;
    type?: string;
    image_url?: string;
    image_url_small?: string;
    [key: string]: unknown;
  };
}

interface CollectionSynergiesPanelProps {
  allUserCards: UserCard[];
  deckCards: CollectionDeckCardItem[];
  detectedArchetypes: { name: string; count: number }[];
  inferredArchetype: string;
  locations: StorageLocation[];
  savedDecks?: Deck[];
  onAddCardToDeck?: (card: Card, section?: 'main' | 'extra' | 'side' | 'extras') => void;
  handleDragCardStart?: (e: React.DragEvent, cardData: unknown) => void;
  handleCardMouseEnter?: (card: HoverCardBase) => void;
  handleCardMouseLeave?: () => void;
}

export const CollectionSynergiesPanel: React.FC<CollectionSynergiesPanelProps> = ({
  allUserCards,
  deckCards,
  detectedArchetypes,
  inferredArchetype,
  locations,
  savedDecks = [],
  onAddCardToDeck,
  handleDragCardStart,
  handleCardMouseEnter,
  handleCardMouseLeave,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [activeEngineFilter, setActiveEngineFilter] = useState<string | null>(null);

  // 1. FILTRAR CARTAS LIBRES (Protegiendo solo las de decks activos)
  const activeDeckIds = useMemo(() => {
    return new Set(savedDecks.filter((d) => d.is_active !== false).map((d) => d.id));
  }, [savedDecks]);

  const freeUserCards = useMemo(() => {
    return allUserCards.filter((c) => !c.deck_id || !activeDeckIds.has(c.deck_id));
  }, [allUserCards, activeDeckIds]);

  // Arquetipos presentes en el mazo actual
  const currentDeckArchetypes = useMemo(() => {
    const set = new Set<string>();
    if (inferredArchetype && inferredArchetype !== 'Híbrido / Staples') {
      set.add(inferredArchetype.toLowerCase());
    }
    detectedArchetypes.forEach((a) => set.add(a.name.toLowerCase()));
    deckCards.forEach((c) => {
      const arch = c.archetype || c.card_details?.archetype;
      if (arch) set.add(arch.toLowerCase());
    });
    return set;
  }, [detectedArchetypes, inferredArchetype, deckCards]);

  // Consolidar cartas libres por card_id
  const freeCardsPool = useMemo(() => {
    const map = new Map<number, { sample: UserCard; totalQty: number; locationsList: string[] }>();
    
    freeUserCards.forEach((uc) => {
      if (!uc.card_details) return;
      const existing = map.get(uc.card_id);
      const locName = uc.storage_location_id
        ? locations.find((l) => l.id === uc.storage_location_id)?.name || 'Caja'
        : '📥 Inbox';

      if (existing) {
        existing.totalQty += uc.quantity || 1;
        if (!existing.locationsList.includes(locName)) {
          existing.locationsList.push(locName);
        }
      } else {
        map.set(uc.card_id, {
          sample: uc,
          totalQty: uc.quantity || 1,
          locationsList: [locName],
        });
      }
    });

    return Array.from(map.values());
  }, [freeUserCards, locations]);

  // 2. DETECTAR MOTORES Y ARQUETIPOS EN LA COLECCIÓN FÍSICA LIBRE
  const ownedEngines = useMemo(() => {
    const engineMap = new Map<string, number>();

    freeUserCards.forEach((c) => {
      const arch = c.card_details?.archetype?.trim();
      if (arch) {
        engineMap.set(arch, (engineMap.get(arch) || 0) + (c.quantity || 1));
      }
    });

    return Array.from(engineMap.entries())
      .map(([name, count]) => ({ name, count }))
      .filter((e) => e.count >= 3)
      .sort((a, b) => b.count - a.count);
  }, [freeUserCards]);

  // 3. CARTAS COMPATIBLES SUGERIDAS (Coincidencia con arquetipos del deck o staples)
  const compatibleCards = useMemo(() => {
    return freeCardsPool.filter(({ sample }) => {
      const details = sample.card_details;
      if (!details) return false;
      const name = details.name || '';
      const arch = details.archetype?.toLowerCase() || '';

      // Si hay un filtro de motor activo
      if (activeEngineFilter) {
        return arch === activeEngineFilter.toLowerCase();
      }

      // Si coincide con arquetipos del deck
      const matchesDeckArch = arch && Array.from(currentDeckArchetypes).some((a) => arch.includes(a) || a.includes(arch));
      // Si es una staple conocida
      const isStaple = Boolean(KNOWN_STAPLES_CATALOG[name]);

      const matchesSearch = !filterQuery.trim() || 
        name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        arch.includes(filterQuery.toLowerCase());

      return (matchesDeckArch || isStaple || currentDeckArchetypes.size === 0) && matchesSearch;
    });
  }, [freeCardsPool, activeEngineFilter, currentDeckArchetypes, filterQuery]);

  // Helper para añadir carta al deck
  const handleQuickAdd = (sample: UserCard) => {
    if (!onAddCardToDeck || !sample.card_details) return;
    const details = sample.card_details;
    const isExtra = (details.type || '').toLowerCase().match(/fusion|synchro|xyz|link/);
    const targetSection = isExtra ? 'extra' : 'main';

    onAddCardToDeck(
      {
        id: sample.card_id,
        name: details.name,
        type: details.type || 'Monster',
        desc: details.desc || '',
        image_url: details.image_url || details.image_url_small || '',
        image_url_small: details.image_url_small || details.image_url || '',
        archetype: details.archetype,
        atk: details.atk,
        def: details.def,
        level: details.level,
        race: details.race,
        attribute: details.attribute,
      },
      targetSection
    );
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      
      {/* HEADER DE LA SECCIÓN */}
      <div className="p-3.5 rounded-2xl bg-linear-to-r from-purple-600/10 via-red-600/10 to-amber-500/10 border border-purple-500/20 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-purple-600 to-red-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-black text-xs uppercase tracking-tight text-zinc-900 dark:text-zinc-100 font-display">
              Sinergias de tu Colección
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {freeCardsPool.length} cartas libres listas para incorporar
            </p>
          </div>
        </div>
      </div>

      {/* MOTORES Y ARQUETIPOS DETECTADOS EN TU COLECCIÓN */}
      {ownedEngines.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Motores libres que posees
            </span>
            {activeEngineFilter && (
              <button
                type="button"
                onClick={() => setActiveEngineFilter(null)}
                className="text-[10px] text-red-500 font-bold hover:underline cursor-pointer"
              >
                Ver todas
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {ownedEngines.slice(0, 6).map((engine) => {
              const isSelected = activeEngineFilter === engine.name;
              const isDeckAffiliated = Array.from(currentDeckArchetypes).some((a) =>
                engine.name.toLowerCase().includes(a)
              );

              return (
                <button
                  key={engine.name}
                  type="button"
                  onClick={() =>
                    setActiveEngineFilter(isSelected ? null : engine.name)
                  }
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : isDeckAffiliated
                      ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800/60'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  <span>{engine.name}</span>
                  <span className="text-[9px] opacity-75 font-mono">({engine.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* BUSCADOR RÁPIDO EN COLECCIÓN */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Filtrar cartas compatibles en tu colección..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-hidden focus:border-red-500"
        />
      </div>

      {/* LISTADO DE CARTAS COMPATIBLES */}
      <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1 scrollbar-thin">
        {compatibleCards.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 space-y-2">
            <AlertCircle className="w-6 h-6 text-zinc-400 mx-auto" />
            <p className="text-xs text-zinc-500 font-medium">
              No se encontraron cartas libres adicionales con este filtro.
            </p>
          </div>
        ) : (
          compatibleCards.map(({ sample, totalQty, locationsList }) => {
            const details = sample.card_details;
            if (!details) return null;

            const isExtra = (details.type || '').toLowerCase().match(/fusion|synchro|xyz|link/);
            const inDeckCount = deckCards
              .filter((c) => c.id === sample.card_id || c.card_id === sample.card_id)
              .reduce((acc, c) => acc + c.count, 0);

            return (
              <motion.div
                key={sample.card_id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                draggable={Boolean(handleDragCardStart)}
                onDragStart={(e) => {
                  if (handleDragCardStart) {
                    handleDragCardStart(e as unknown as React.DragEvent, {
                      id: sample.card_id,
                      name: details.name,
                      type: details.type || 'Monster',
                      image_url: details.image_url || details.image_url_small || '',
                    });
                  }
                }}
                onMouseEnter={() => {
                  if (handleCardMouseEnter) {
                    handleCardMouseEnter({
                      id: sample.card_id,
                      name: details.name,
                      type: details.type || 'Monster',
                      image_url: details.image_url || details.image_url_small || '',
                      image_url_small: details.image_url_small || details.image_url || '',
                      archetype: details.archetype,
                    });
                  }
                }}
                onMouseLeave={() => {
                  if (handleCardMouseLeave) handleCardMouseLeave();
                }}
                className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/40 dark:hover:border-red-500/40 transition-all flex items-center justify-between gap-2.5 group"
              >
                {/* Miniatura y Detalles */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-12 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 shadow-2xs relative">
                    {details.image_url_small && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={details.image_url_small}
                        alt={details.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-red-500 transition-colors">
                      {details.name}
                    </h5>

                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px]">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {totalQty}x libre{totalQty > 1 ? 's' : ''}
                      </span>
                      {inDeckCount > 0 && (
                        <span className="text-purple-600 dark:text-purple-400 font-mono font-bold">
                          ({inDeckCount} en deck)
                        </span>
                      )}
                      <span className="text-zinc-400 truncate max-w-28">
                        • {locationsList[0]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón rápido Añadir al Deck */}
                <button
                  type="button"
                  onClick={() => handleQuickAdd(sample)}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-red-600 hover:text-white border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-black transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs group-hover:border-red-600"
                  title={`Añadir a ${isExtra ? 'Extra Deck' : 'Main Deck'}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-display">Añadir</span>
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
