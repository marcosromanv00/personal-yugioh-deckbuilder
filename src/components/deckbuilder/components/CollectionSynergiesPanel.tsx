'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  PackageCheck,
  Plus,
  Sparkles,
  Flame,
  Search,
  AlertCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { UserCard, StorageLocation, Deck } from '@/types/collection';
import { Card, HoverCardBase } from '../types';
import { KNOWN_STAPLES_CATALOG } from '@/lib/collectionSuggestions';
import {
  canSummonExtraDeckCard,
  isSearcherUsefulInDeck,
  inferCardValueProposition,
  CardBasicInfo,
} from '@/lib/engines/mechanicsValidator';

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
    desc?: string;
    atk?: number;
    def?: number;
    level?: number;
    race?: string;
    attribute?: string;
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
  currentDeckId?: string | null;
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
  currentDeckId,
  onAddCardToDeck,
  handleDragCardStart,
  handleCardMouseEnter,
  handleCardMouseLeave,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [activeEngineFilter, setActiveEngineFilter] = useState<string | null>(null);

  // 1. DICCIONARIO DE CARTAS ACTUALES EN EL DECK
  const deckCardCountsMap = useMemo(() => {
    const map = new Map<number, number>();
    deckCards.forEach((c) => {
      const id = c.id || c.card_id;
      if (id) {
        map.set(id, (map.get(id) || 0) + (c.count || 1));
      }
    });
    return map;
  }, [deckCards]);

  // Convertir cartas del deck a CardBasicInfo para validaciones mecánicas
  const deckBasicCards = useMemo<CardBasicInfo[]>(() => {
    return deckCards.map((c) => {
      const id = c.id || c.card_id || 0;
      const details = c.card_details;
      return {
        id,
        name: c.name || details?.name || `Carta #${id}`,
        type: c.type || details?.type,
        desc: (details?.desc as string) || '',
        atk: details?.atk as number | undefined,
        def: details?.def as number | undefined,
        level: details?.level as number | undefined,
        race: details?.race as string | undefined,
        attribute: details?.attribute as string | undefined,
        archetype: c.archetype || details?.archetype,
        count: c.count || 1,
      };
    });
  }, [deckCards]);

  // 2. EXCLUSIÓN ESTRICTA: Proteger cartas de decks activos Y descontar las del deck actual
  const activeDeckIds = useMemo(() => {
    return new Set(
      savedDecks
        .filter((d) => d.is_active !== false && d.id !== currentDeckId)
        .map((d) => d.id)
    );
  }, [savedDecks, currentDeckId]);

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

  // Consolidar cartas disponibles realmente libres
  const freeCardsPool = useMemo(() => {
    const physicalTotals = new Map<number, { sample: UserCard; totalQty: number; locationsList: string[] }>();

    allUserCards.forEach((uc) => {
      if (!uc.card_details) return;
      // Excluir si está asignada a otro deck activo o al deck actual
      if (uc.deck_id && (activeDeckIds.has(uc.deck_id) || uc.deck_id === currentDeckId)) {
        return;
      }

      const existing = physicalTotals.get(uc.card_id);
      const locName = uc.storage_location_id
        ? locations.find((l) => l.id === uc.storage_location_id)?.name || 'Caja'
        : '📥 Inbox';

      if (existing) {
        existing.totalQty += uc.quantity || 1;
        if (!existing.locationsList.includes(locName)) {
          existing.locationsList.push(locName);
        }
      } else {
        physicalTotals.set(uc.card_id, {
          sample: uc,
          totalQty: uc.quantity || 1,
          locationsList: [locName],
        });
      }
    });

    // Descontar las copias que ya están colocadas en el deck que estamos editando
    const result: { sample: UserCard; totalQty: number; locationsList: string[]; inDeckCount: number }[] = [];
    physicalTotals.forEach((val, cardId) => {
      const inDeck = deckCardCountsMap.get(cardId) || 0;
      // Si ya está al máximo permitido (3 copias), no sugerir más
      if (inDeck >= 3) return;

      const remainingFree = Math.max(0, val.totalQty - inDeck);
      if (remainingFree > 0) {
        result.push({
          sample: val.sample,
          totalQty: remainingFree,
          locationsList: val.locationsList,
          inDeckCount: inDeck,
        });
      }
    });

    return result;
  }, [allUserCards, activeDeckIds, currentDeckId, locations, deckCardCountsMap]);

  // 3. DETECTAR MOTORES Y ARQUETIPOS EN LA COLECCIÓN LIBRE
  const ownedEngines = useMemo(() => {
    const engineMap = new Map<string, number>();

    freeCardsPool.forEach(({ sample, totalQty }) => {
      const arch = sample.card_details?.archetype?.trim();
      if (arch) {
        engineMap.set(arch, (engineMap.get(arch) || 0) + totalQty);
      }
    });

    return Array.from(engineMap.entries())
      .map(([name, count]) => ({ name, count }))
      .filter((e) => e.count >= 2)
      .sort((a, b) => b.count - a.count);
  }, [freeCardsPool]);

  // 4. FILTRADO INTELIGENTE DE SUGERENCIAS CON VALIDACIÓN MECÁNICA Y JUSTIFICACIÓN
  const compatibleCards = useMemo(() => {
    const isSearching = Boolean(filterQuery.trim());
    const archetypeList = Array.from(currentDeckArchetypes);

    return freeCardsPool
      .filter(({ sample }) => {
        const details = sample.card_details;
        if (!details) return false;
        const name = details.name || '';
        const arch = details.archetype?.toLowerCase() || '';
        const type = details.type || '';
        const isExtra = type.includes('Fusion') || type.includes('Synchro') || type.includes('XYZ') || type.includes('Link');

        // Búsqueda manual por texto
        if (isSearching) {
          const q = filterQuery.toLowerCase();
          return name.toLowerCase().includes(q) || arch.includes(q) || type.toLowerCase().includes(q);
        }

        // Filtro por motor específico seleccionado
        if (activeEngineFilter) {
          return arch === activeEngineFilter.toLowerCase();
        }

        // 1. VALIDACIÓN DE EXTRA DECK: Solo sugerir si es 100% invocable
        const cardBasic: CardBasicInfo = {
          id: sample.card_id,
          name,
          type,
          desc: details.desc || '',
          level: details.level,
          race: details.race,
          attribute: details.attribute,
          archetype: details.archetype,
        };

        if (isExtra) {
          const summonCheck = canSummonExtraDeckCard(cardBasic, deckBasicCards);
          if (!summonCheck.canSummon) return false; // Descartar fusiones/synchros/xyz incompatibles
        }

        // 2. VALIDACIÓN DE BUSCADORES: Descartar si es buscador huérfano (Fossil Dig sin dinos, etc.)
        const searchCheck = isSearcherUsefulInDeck(cardBasic, deckBasicCards);
        if (!searchCheck.isUseful) return false;

        // 3. AFINIDAD: Coincidencia de arquetipo, staple S/A-Tier o tipo afín
        const matchesDeckArch = arch && archetypeList.some((a) => arch.includes(a) || a.includes(arch));
        const isStaple = Boolean(KNOWN_STAPLES_CATALOG[name]);
        const matchingRace = details.race && deckBasicCards.filter((c) => c.race?.toLowerCase() === details.race?.toLowerCase()).length >= 4;

        return matchesDeckArch || isStaple || matchingRace;
      })
      .map((item) => {
        const details = item.sample.card_details!;
        const cardBasic: CardBasicInfo = {
          id: item.sample.card_id,
          name: details.name || '',
          type: details.type,
          desc: details.desc || '',
          level: details.level,
          race: details.race,
          attribute: details.attribute,
          archetype: details.archetype,
        };
        const rationale = inferCardValueProposition(cardBasic, deckBasicCards, archetypeList);
        return { ...item, rationale };
      })
      .sort((a, b) => b.rationale.confidenceScore - a.rationale.confidenceScore);
  }, [freeCardsPool, activeEngineFilter, currentDeckArchetypes, filterQuery, deckBasicCards]);

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
            <h4 className="font-black text-xs uppercase tracking-tight text-zinc-900 dark:text-zinc-100 font-display flex items-center gap-1.5">
              Sinergias de tu Colección
              <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-[10px] text-purple-600 dark:text-purple-400 font-mono font-bold">
                Smart
              </span>
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {compatibleCards.length} cartas con sinergia directa demostrable
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
              Motores compatibles disponibles
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
          placeholder="Filtrar cartas o buscar en colección..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-hidden focus:border-red-500"
        />
      </div>

      {/* LISTADO DE CARTAS COMPATIBLES CON JUSTIFICACIÓN DE VALOR TÁCTICO */}
      <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1 scrollbar-thin">
        {compatibleCards.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 space-y-2">
            <AlertCircle className="w-6 h-6 text-zinc-400 mx-auto" />
            <p className="text-xs text-zinc-500 font-medium">
              No hay cartas libres con sinergia directa o el límite de 3 copias ya se alcanzó.
            </p>
          </div>
        ) : (
          compatibleCards.map(({ sample, totalQty, locationsList, inDeckCount, rationale }) => {
            const details = sample.card_details;
            if (!details) return null;

            const isExtra = (details.type || '').toLowerCase().match(/fusion|synchro|xyz|link/);

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
                className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 hover:border-red-500/40 dark:hover:border-red-500/40 transition-all flex flex-col gap-2 group shadow-2xs"
              >
                {/* Cabecera de la tarjeta con badge de justificación táctica */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-13 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 shadow-2xs relative">
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${rationale.badgeColor}`}
                        >
                          {rationale.badgeLabel}
                        </span>
                        {inDeckCount > 0 && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-bold">
                            ({inDeckCount}/3 en deck)
                          </span>
                        )}
                      </div>

                      <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-red-500 transition-colors mt-0.5">
                        {details.name}
                      </h5>

                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {totalQty}x disponible{totalQty > 1 ? 's' : ''}
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-28">{locationsList[0]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botón Añadir */}
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(sample)}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-red-600 hover:text-white border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-black transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs group-hover:border-red-600"
                    title={`Añadir a ${isExtra ? 'Extra Deck' : 'Main Deck'}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase font-display">Añadir</span>
                  </button>
                </div>

                {/* Justificación de valor táctico (Por qué añadir esta carta) */}
                <div className="px-2.5 py-1.5 rounded-xl bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 text-[10px] text-zinc-600 dark:text-zinc-300 leading-snug flex items-start gap-1.5">
                  <Zap className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                  <span>{rationale.shortReason}</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
