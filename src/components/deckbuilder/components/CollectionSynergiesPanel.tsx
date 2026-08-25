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
  Zap,
  Shield,
  Layers,
  X,
  Target,
  Swords,
  ScrollText,
  Crown,
} from 'lucide-react';
import { UserCard, StorageLocation, Deck } from '@/types/collection';
import { Card, HoverCardBase, DeckCard } from '../types';
import { extractCardBasicInfo, CardBasicInfo } from '@/lib/engines/mechanicsValidator';
import {
  analyzeDeckDnaAndEngines,
  evaluateCardSynergy,
  CardSynergyEvaluation,
  TacticalCategory,
  DeckDnaAnalysisResult,
} from '@/lib/engines/advancedSynergyEngine';
import { PremiumDropdown, DropdownOption } from '@/components/ui/PremiumDropdown';

export interface CollectionDeckCardItem {
  id?: number;
  card_id?: number;
  count?: number;
  quantity?: number;
  section?: string;
  archetype?: string;
  name?: string;
  type?: string;
  desc?: string;
  atk?: number | null;
  def?: number | null;
  level?: number | null;
  race?: string | null;
  attribute?: string | null;
  image_url?: string;
  image_url_small?: string;
  card_details?: {
    id?: number;
    name?: string;
    archetype?: string;
    type?: string;
    desc?: string;
    atk?: number | null;
    def?: number | null;
    level?: number | null;
    race?: string | null;
    attribute?: string | null;
    image_url?: string;
    image_url_small?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface CollectionSynergiesPanelProps {
  allUserCards: UserCard[];
  deckCards: (CollectionDeckCardItem | DeckCard)[];
  detectedArchetypes?: { name: string; count: number }[];
  inferredArchetype?: string;
  locations?: StorageLocation[];
  savedDecks?: Deck[];
  currentDeckId?: string | null;
  onAddCardToDeck?: (card: Card, section?: 'main' | 'extra' | 'side' | 'extras') => void;
  handleDragCardStart?: (e: React.DragEvent, cardData: { id: number; name: string; type?: string; image_url?: string; archetype?: string; fromSection?: 'main' | 'extra' | 'side' | 'extras' }) => void;
  handleCardMouseEnter?: (card: HoverCardBase) => void;
  handleCardMouseLeave?: () => void;
}

export const CollectionSynergiesPanel: React.FC<CollectionSynergiesPanelProps> = ({
  allUserCards = [],
  deckCards = [],
  inferredArchetype,
  locations = [],
  savedDecks = [],
  currentDeckId,
  onAddCardToDeck,
  handleDragCardStart,
  handleCardMouseEnter,
  handleCardMouseLeave,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<TacticalCategory | 'all'>('all');
  const [selectedEngine, setSelectedEngine] = useState<string>('all');

  // 1. NORMALIZACIÓN UNIFICADA DE CARTAS DEL DECK (0 discrepancias entre taller y colección)
  const deckBasicCards = useMemo<CardBasicInfo[]>(() => {
    return deckCards.map((c) => extractCardBasicInfo(c as unknown as Record<string, unknown>));
  }, [deckCards]);

  // Mapa de conteo de copias en el mazo
  const deckCardCountsMap = useMemo(() => {
    const map = new Map<number, number>();
    deckBasicCards.forEach((c) => {
      if (c.id) {
        map.set(c.id, (map.get(c.id) || 0) + (c.count || 1));
      }
    });
    return map;
  }, [deckBasicCards]);

  // 2. ANÁLISIS DE ADN DE MAZO Y FICHA IA
  const deckDna = useMemo<DeckDnaAnalysisResult>(() => {
    return analyzeDeckDnaAndEngines(deckBasicCards, inferredArchetype);
  }, [deckBasicCards, inferredArchetype]);

  // 3. EXCLUSIÓN DE MAZOS ACTIVOS Y DESCUENTO DE COPIAS
  const activeDeckIds = useMemo(() => {
    return new Set(
      savedDecks
        .filter((d) => d.is_active !== false && d.id !== currentDeckId)
        .map((d) => d.id)
    );
  }, [savedDecks, currentDeckId]);

  // Pool de cartas físicas libres en la colección del usuario
  const freeCardsPool = useMemo(() => {
    const physicalTotals = new Map<
      number,
      { sample: UserCard; totalQty: number; locationsList: string[] }
    >();

    allUserCards.forEach((uc) => {
      if (!uc.card_details) return;

      // Excluir si está asignada a otro mazo activo o al mazo actual en BD
      if (uc.deck_id && (activeDeckIds.has(uc.deck_id) || (currentDeckId && uc.deck_id === currentDeckId))) {
        return;
      }

      const cardId = uc.card_id;
      const existing = physicalTotals.get(cardId);
      const locName = uc.storage_location_id
        ? locations.find((l) => l.id === uc.storage_location_id)?.name || 'Caja'
        : '📥 Inbox';

      if (existing) {
        existing.totalQty += uc.quantity || 1;
        if (!existing.locationsList.includes(locName)) {
          existing.locationsList.push(locName);
        }
      } else {
        physicalTotals.set(cardId, {
          sample: uc,
          totalQty: uc.quantity || 1,
          locationsList: [locName],
        });
      }
    });

    const result: {
      sample: UserCard;
      totalQty: number;
      locationsList: string[];
      inDeckCount: number;
      basicInfo: CardBasicInfo;
    }[] = [];

    physicalTotals.forEach((val, cardId) => {
      const inDeck = deckCardCountsMap.get(cardId) || 0;
      if (inDeck >= 3) return; // Máximo de 3 copias ya alcanzado

      const remainingFree = Math.max(0, val.totalQty - inDeck);
      if (remainingFree > 0) {
        const basicInfo = extractCardBasicInfo(val.sample as unknown as Record<string, unknown>);
        result.push({
          sample: val.sample,
          totalQty: remainingFree,
          locationsList: val.locationsList,
          inDeckCount: inDeck,
          basicInfo,
        });
      }
    });

    return result;
  }, [allUserCards, activeDeckIds, currentDeckId, locations, deckCardCountsMap]);

  // 4. EVALUACIÓN TÁCTICA PROFUNDA DE CADA CARTA
  const evaluatedCards = useMemo(() => {
    const list: Array<{
      sample: UserCard;
      totalQty: number;
      locationsList: string[];
      inDeckCount: number;
      basicInfo: CardBasicInfo;
      evaluation: CardSynergyEvaluation;
    }> = [];

    freeCardsPool.forEach((item) => {
      const evalResult = evaluateCardSynergy(item.basicInfo, deckBasicCards, deckDna);
      if (evalResult) {
        list.push({
          ...item,
          evaluation: evalResult,
        });
      }
    });

    return list.sort((a, b) => b.evaluation.confidenceScore - a.evaluation.confidenceScore);
  }, [freeCardsPool, deckBasicCards, deckDna]);

  // 5. MOTORES COMPATIBLES REALES EN LA COLECCIÓN DEL USUARIO
  const availableCompatibleEngines = useMemo(() => {
    const engineMap = new Map<string, { archetype: string; count: number; rationale: string }>();

    deckDna.compatibleEngines.forEach((eng) => {
      const count = freeCardsPool.filter((item) => {
        const arch = item.basicInfo.archetype?.toLowerCase() || '';
        return arch === eng.archetype.toLowerCase() || item.basicInfo.name.toLowerCase().includes(eng.archetype.toLowerCase());
      }).reduce((sum, item) => sum + item.totalQty, 0);

      if (count > 0) {
        engineMap.set(eng.archetype, {
          archetype: eng.archetype,
          count,
          rationale: eng.strategicRationale,
        });
      }
    });

    return Array.from(engineMap.values());
  }, [deckDna.compatibleEngines, freeCardsPool]);

  // Opciones para el PremiumDropdown de motores
  const engineDropdownOptions = useMemo<DropdownOption<string>[]>(() => {
    const opts: DropdownOption<string>[] = [
      {
        value: 'all',
        label: 'Todos los Motores y Cartas',
        badge: evaluatedCards.length,
      },
    ];

    availableCompatibleEngines.forEach((eng) => {
      opts.push({
        value: eng.archetype,
        label: eng.archetype,
        badge: `${eng.count} cartas`,
        description: eng.rationale,
      });
    });

    return opts;
  }, [availableCompatibleEngines, evaluatedCards.length]);

  // 6. CONTEOS POR CATEGORÍA TÁCTICA
  const categoryCounts = useMemo(() => {
    const counts = {
      all: evaluatedCards.length,
      archetype_and_techs: 0,
      handtraps: 0,
      board_breakers: 0,
      consistency_spells: 0,
      extra_deck: 0,
    };

    evaluatedCards.forEach((c) => {
      if (c.evaluation.category in counts) {
        counts[c.evaluation.category]++;
      }
    });

    return counts;
  }, [evaluatedCards]);

  // 7. FILTRADO ACTIVO FINAL
  const visibleCards = useMemo(() => {
    const query = filterQuery.trim().toLowerCase();

    return evaluatedCards.filter((item) => {
      const { evaluation, basicInfo } = item;

      // Filtro por motor específico seleccionado
      if (selectedEngine !== 'all') {
        const arch = basicInfo.archetype?.toLowerCase() || '';
        const engLower = selectedEngine.toLowerCase();
        const matchesEngine = arch === engLower || basicInfo.name.toLowerCase().includes(engLower);
        if (!matchesEngine) return false;
      }

      // Filtro por categoría táctica
      if (activeCategory !== 'all' && evaluation.category !== activeCategory) {
        return false;
      }

      // Filtro por texto de búsqueda
      if (query) {
        const nameMatches = basicInfo.name.toLowerCase().includes(query);
        const archMatches = (basicInfo.archetype || '').toLowerCase().includes(query);
        const roleMatches = evaluation.badgeLabel.toLowerCase().includes(query);
        const reasonMatches = evaluation.shortReason.toLowerCase().includes(query);
        return nameMatches || archMatches || roleMatches || reasonMatches;
      }

      return true;
    });
  }, [evaluatedCards, selectedEngine, activeCategory, filterQuery]);

  // Manejo de Añadir Rápido
  const handleQuickAdd = (sample: UserCard, basicInfo: CardBasicInfo) => {
    if (!onAddCardToDeck) return;
    const isExtra = (basicInfo.type || '').toLowerCase().match(/fusion|synchro|xyz|link/);
    const targetSection = isExtra ? 'extra' : 'main';

    onAddCardToDeck(
      {
        id: sample.card_id,
        name: basicInfo.name,
        type: basicInfo.type || 'Monster',
        desc: basicInfo.desc || '',
        image_url: sample.card_details?.image_url || sample.card_details?.image_url_small || '',
        image_url_small: sample.card_details?.image_url_small || sample.card_details?.image_url || '',
        archetype: basicInfo.archetype || undefined,
        atk: basicInfo.atk ?? undefined,
        def: basicInfo.def ?? undefined,
        level: basicInfo.level ?? undefined,
        race: basicInfo.race || undefined,
        attribute: basicInfo.attribute || undefined,
      },
      targetSection
    );
  };

  const selectedEngineDetails = availableCompatibleEngines.find(
    (e) => e.archetype.toLowerCase() === selectedEngine.toLowerCase()
  );

  return (
    <div className="space-y-3.5 font-sans text-xs">
      {/* ─── HEADER DE SINERGIAS CON CONTEO EXACTO Y ADN ─── */}
      <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-black text-xs uppercase tracking-tight text-zinc-900 dark:text-zinc-100 font-display">
                Sinergias de tu Colección
              </h4>
              <span className="px-1.5 py-0.5 rounded-md bg-red-500/10 text-[9.5px] text-red-600 dark:text-red-400 font-mono font-bold border border-red-500/20">
                IA Táctica
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              <strong className="text-zinc-900 dark:text-zinc-200 font-mono">
                {evaluatedCards.length}
              </strong>{' '}
              cartas con sinergia demostrable en tu colección
            </p>
          </div>
        </div>
      </div>

      {/* ─── SELECTOR ERGONÓMICO DE MOTORES MEDIANTE PREMIUMDROPDOWN ─── */}
      {availableCompatibleEngines.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 px-0.5">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Motores Híbridos Compatibles
            </span>
            {selectedEngine !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedEngine('all')}
                className="text-[10px] text-red-500 font-bold hover:underline cursor-pointer flex items-center gap-0.5 min-h-6"
              >
                <X className="w-3 h-3" />
                <span>Mostrar todos</span>
              </button>
            )}
          </div>

          <PremiumDropdown<string>
            options={engineDropdownOptions}
            value={selectedEngine}
            onChange={(val) => setSelectedEngine(val)}
            icon={<Layers className="w-3.5 h-3.5 text-purple-500" />}
            className="w-full"
            triggerClassName="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            size="sm"
            menuWidth="w-full"
          />

          {/* FICHA ESTRATÉGICA DEL MOTOR SELECCIONADO */}
          {selectedEngineDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[10.5px] text-purple-900 dark:text-purple-300 leading-snug space-y-1"
            >
              <div className="font-bold flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span>Estrategia Híbrida: {selectedEngineDetails.archetype}</span>
              </div>
              <p className="opacity-90">{selectedEngineDetails.rationale}</p>
            </motion.div>
          )}
        </div>
      )}

      {/* ─── PESTAÑAS DE CATEGORIZACIÓN TÁCTICA ─── */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border min-h-8 touch-manipulation ${
            activeCategory === 'all'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>Todas</span>
          <span className="text-[9.5px] opacity-75 font-mono">({categoryCounts.all})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('archetype_and_techs')}
          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border min-h-8 touch-manipulation ${
            activeCategory === 'archetype_and_techs'
              ? 'bg-red-600 text-white border-red-600 shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-red-500'
          }`}
        >
          <Target className="w-3 h-3 text-red-500" />
          <span>Techs & Core</span>
          <span className="text-[9.5px] opacity-75 font-mono">({categoryCounts.archetype_and_techs})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('handtraps')}
          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border min-h-8 touch-manipulation ${
            activeCategory === 'handtraps'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-amber-500'
          }`}
        >
          <Shield className="w-3 h-3 text-amber-500" />
          <span>Handtraps</span>
          <span className="text-[9.5px] opacity-75 font-mono">({categoryCounts.handtraps})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('board_breakers')}
          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border min-h-8 touch-manipulation ${
            activeCategory === 'board_breakers'
              ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-orange-500'
          }`}
        >
          <Swords className="w-3 h-3 text-orange-500" />
          <span>Breakers</span>
          <span className="text-[9.5px] opacity-75 font-mono">({categoryCounts.board_breakers})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('consistency_spells')}
          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border min-h-8 touch-manipulation ${
            activeCategory === 'consistency_spells'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-blue-500'
          }`}
        >
          <ScrollText className="w-3 h-3 text-blue-500" />
          <span>Consistencia</span>
          <span className="text-[9.5px] opacity-75 font-mono">({categoryCounts.consistency_spells})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('extra_deck')}
          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border min-h-8 touch-manipulation ${
            activeCategory === 'extra_deck'
              ? 'bg-fuchsia-600 text-white border-fuchsia-600 shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-fuchsia-500'
          }`}
        >
          <Crown className="w-3 h-3 text-fuchsia-500" />
          <span>Extra Deck</span>
          <span className="text-[9.5px] opacity-75 font-mono">({categoryCounts.extra_deck})</span>
        </button>
      </div>

      {/* ─── BUSCADOR RÁPIDO EN SUGERENCIAS ─── */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, efecto, tech o rol..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-8 pr-8 py-2 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-hidden focus:border-red-500 transition-colors shadow-2xs"
        />
        {filterQuery && (
          <button
            type="button"
            onClick={() => setFilterQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer p-1"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* ─── LISTADO DE CARTAS CON JUSTIFICACIÓN TÁCTICA PROFUNDA ─── */}
      <div className="space-y-2.5 max-h-120 overflow-y-auto pr-1 scrollbar-thin">
        {visibleCards.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 space-y-2">
            <AlertCircle className="w-6 h-6 text-zinc-400 mx-auto" />
            <p className="text-xs text-zinc-500 font-medium">
              No se encontraron cartas libres en tu colección para los filtros seleccionados.
            </p>
          </div>
        ) : (
          visibleCards.map(({ sample, totalQty, locationsList, inDeckCount, evaluation, basicInfo }) => {
            const isExtra = (basicInfo.type || '').toLowerCase().match(/fusion|synchro|xyz|link/);
            const imageUrl = sample.card_details?.image_url_small || sample.card_details?.image_url;

            return (
              <motion.div
                key={sample.card_id}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                draggable={Boolean(handleDragCardStart)}
                onDragStart={(e) => {
                  if (handleDragCardStart) {
                    handleDragCardStart(e as unknown as React.DragEvent, {
                      id: sample.card_id,
                      name: basicInfo.name,
                      type: basicInfo.type || 'Monster',
                      image_url: sample.card_details?.image_url || sample.card_details?.image_url_small || '',
                    });
                  }
                }}
                onMouseEnter={() => {
                  if (handleCardMouseEnter) {
                    handleCardMouseEnter({
                      id: sample.card_id,
                      name: basicInfo.name,
                      type: basicInfo.type || 'Monster',
                      image_url: sample.card_details?.image_url || sample.card_details?.image_url_small || '',
                      image_url_small: sample.card_details?.image_url_small || sample.card_details?.image_url || '',
                      archetype: basicInfo.archetype || undefined,
                    });
                  }
                }}
                onMouseLeave={() => {
                  if (handleCardMouseLeave) handleCardMouseLeave();
                }}
                className="p-3 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/40 dark:hover:border-red-500/40 transition-all flex flex-col gap-2 group shadow-2xs"
              >
                {/* Cabecera de la tarjeta */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-14 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 shadow-2xs relative">
                      {imageUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={imageUrl}
                          alt={basicInfo.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${evaluation.badgeColor}`}
                        >
                          {evaluation.badgeLabel}
                        </span>
                        {inDeckCount > 0 && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-bold">
                            ({inDeckCount}/3 en deck)
                          </span>
                        )}
                      </div>

                      <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-red-500 transition-colors mt-0.5">
                        {basicInfo.name}
                      </h5>

                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {totalQty}x libre{totalQty > 1 ? 's' : ''}
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-28">{locationsList[0]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botón Añadir */}
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(sample, basicInfo)}
                    className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-red-600 hover:text-white border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-black transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs group-hover:border-red-600 min-h-11 touch-manipulation"
                    title={`Añadir a ${isExtra ? 'Extra Deck' : 'Main Deck'}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase font-display">Añadir</span>
                  </button>
                </div>

                {/* Justificación de valor táctico profundo */}
                <div className="px-2.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 text-[10.5px] text-zinc-700 dark:text-zinc-300 leading-snug space-y-1">
                  <div className="flex items-start gap-1.5 font-medium">
                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{evaluation.shortReason}</span>
                  </div>
                  {evaluation.detailedRationale && (
                    <p className="text-[9.5px] text-zinc-500 dark:text-zinc-400 pl-5 leading-normal">
                      {evaluation.detailedRationale}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
