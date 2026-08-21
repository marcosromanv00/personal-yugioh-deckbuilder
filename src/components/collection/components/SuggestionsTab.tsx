'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Flame, 
  ShieldAlert, 
  Layers, 
  Swords, 
  Box, 
  ArrowRight, 
  Search, 
  AlertTriangle, 
  Plus, 
  MapPin, 
  Check, 
  Filter
} from 'lucide-react';
import { UserCard, StorageLocation, Deck } from '@/types/collection';
import { 
  analyzeCollectionSuggestions, 
  ArchetypeSuggestionGroup, 
  StapleCardInfo, 
  DuplicateMatchInfo,
  StapleCategory
} from '@/lib/collectionSuggestions';
import { MultiLevelMovementDropdown } from '@/components/collection/MultiLevelMovementDropdown';

interface SuggestionsTabProps {
  allUserCards: UserCard[];
  locations: StorageLocation[];
  decks: Deck[];
  onCreateDeckFromArchetype?: (archetype: string, cards: UserCard[]) => void;
  onOpenConsolidateCard?: (cardId: number) => void;
  onOrganizeInbox?: () => void;
  onOpenContainer?: (containerId: string) => void;
}

type FilterView = 'all' | 'archetypes' | 'staples' | 'duplicates';

export const SuggestionsTab: React.FC<SuggestionsTabProps> = ({
  allUserCards,
  locations,
  decks,
  onCreateDeckFromArchetype,
  onOpenConsolidateCard,
  onOrganizeInbox,
  onOpenContainer,
}) => {
  const [filterView, setFilterView] = useState<FilterView>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stapleCategoryFilter, setStapleCategoryFilter] = useState<string>('all');

  // Análisis integral memoizado
  const analysis = useMemo(() => {
    return analyzeCollectionSuggestions(allUserCards, locations, decks);
  }, [allUserCards, locations, decks]);

  // Arquetipos filtrados
  const filteredArchetypes = useMemo(() => {
    if (!searchQuery.trim()) return analysis.archetypeSuggestions;
    const q = searchQuery.toLowerCase();
    return analysis.archetypeSuggestions.filter(a => a.archetype.toLowerCase().includes(q));
  }, [analysis.archetypeSuggestions, searchQuery]);

  // Staples filtradas
  const filteredStaples = useMemo(() => {
    return analysis.stapleSuggestions.filter(s => {
      const matchesSearch = !searchQuery.trim() || s.card_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = stapleCategoryFilter === 'all' || s.category === stapleCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [analysis.stapleSuggestions, searchQuery, stapleCategoryFilter]);

  // Duplicados filtrados
  const filteredDuplicates = useMemo(() => {
    if (!searchQuery.trim()) return analysis.duplicateSuggestions;
    const q = searchQuery.toLowerCase();
    return analysis.duplicateSuggestions.filter(d => d.card_name.toLowerCase().includes(q));
  }, [analysis.duplicateSuggestions, searchQuery]);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* KPI STATS BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-500 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 font-mono">
              {analysis.stats.totalArchetypesDetected}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
              Arquetipos Viables
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 font-mono">
              {analysis.stats.totalStaplesCount}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
              Staples Detectadas
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 font-mono">
              {analysis.stats.totalDispersedDuplicates}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
              Duplicados Dispersos
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 font-mono">
              {analysis.stats.inboxPendingCount}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
              Inbox Sin Clasificar
            </div>
          </div>
        </div>
      </div>

      {/* TOP: ASISTENTE DE SUGERENCIAS / RECOMENDACIONES DE 1 CLIC */}
      {analysis.assistantActionCards.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
              Recomendaciones del Asistente Exordio
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {analysis.assistantActionCards.map((card) => (
              <motion.div
                key={card.id}
                whileHover={{ y: -2 }}
                className="p-4 rounded-2xl bg-linear-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-3 relative overflow-hidden group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg">{card.icon}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 font-display">
                    {card.title}
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {card.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (card.type === 'inbox_triage') {
                        onOrganizeInbox?.();
                      } else if (card.type === 'archetype_deck' && card.targetArchetype) {
                        const archGroup = analysis.archetypeSuggestions.find(a => a.archetype === card.targetArchetype);
                        onCreateDeckFromArchetype?.(card.targetArchetype, archGroup?.cards || []);
                      } else if (card.targetCardId) {
                        onOpenConsolidateCard?.(card.targetCardId);
                      }
                    }}
                    className="flex-1 py-2 px-3 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>{card.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* FILTER CONTROLS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        {/* Sub-Tabs Selector */}
        <div className="flex flex-wrap items-center bg-zinc-200/70 dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-300 dark:border-zinc-800 gap-1">
          <button
            type="button"
            onClick={() => setFilterView('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
              filterView === 'all'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            Vista General
          </button>
          <button
            type="button"
            onClick={() => setFilterView('archetypes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              filterView === 'archetypes'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Arquetipos ({analysis.stats.totalArchetypesDetected})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterView('staples')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              filterView === 'staples'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Staples ({analysis.stats.totalStaplesCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterView('duplicates')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              filterView === 'duplicates'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Duplicados ({analysis.stats.totalDispersedDuplicates})</span>
          </button>
        </div>

        {/* Search & Sub-category Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {filterView === 'staples' && (
            <select
              value={stapleCategoryFilter}
              onChange={(e) => setStapleCategoryFilter(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold rounded-xl px-2.5 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas las Categorías</option>
              <option value="handtrap">🖐️ Handtraps</option>
              <option value="board_breaker">💥 Board Breakers</option>
              <option value="draw_engine">🏺 Motores de Robo</option>
              <option value="extra_deck_generic">🌌 Extra Deck Genérico</option>
              <option value="floodgate_negate">🛑 Negaciones / Trampas</option>
            </select>
          )}

          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Buscar sugerencias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-red-500"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-400" />
          </div>
        </div>
      </div>

      {/* BLOCK 1: ARQUETIPOS VIABLES */}
      {(filterView === 'all' || filterView === 'archetypes') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
                Arquetipos Detectados en tu Inventario
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              {filteredArchetypes.length} arquetipos
            </span>
          </div>

          {filteredArchetypes.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-500 text-xs">
              No se detectaron arquetipos con las cartas actuales o el filtro ingresado.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArchetypes.map((arch) => (
                <div
                  key={arch.archetype}
                  className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    {/* Imagen de Referencia */}
                    <div className="w-14 h-20 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 relative shadow-sm">
                      {arch.sampleImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={arch.sampleImage}
                          alt={arch.archetype}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600">
                          {arch.archetype[0]}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate font-display">
                          {arch.archetype}
                        </h4>
                        <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                          {arch.totalCardsCount}x
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {arch.distinctCardsCount} cartas distintas
                      </p>

                      {/* Medidor de Núcleo (Core Completion) */}
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                          <span>Core Viable</span>
                          <span className="font-bold text-zinc-300">{arch.completionScore}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-purple-600 to-indigo-500 rounded-full"
                            style={{ width: `${arch.completionScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Desglose Rápido por Tipo */}
                      <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 mt-2">
                        <span>👾 {arch.mainMonstersCount} M</span>
                        <span>🔮 {arch.spellsCount} S</span>
                        <span>🛡️ {arch.trapsCount} T</span>
                        {arch.extraDeckCount > 0 && <span>🌌 {arch.extraDeckCount} EX</span>}
                      </div>
                    </div>
                  </div>

                  {/* Footer de Ubicaciones y Acción */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-zinc-500 truncate" title={arch.locationsPresent.join(', ')}>
                      📍 {arch.locationsPresent.slice(0, 2).join(', ')}{arch.locationsPresent.length > 2 ? '...' : ''}
                    </span>

                    <button
                      type="button"
                      onClick={() => onCreateDeckFromArchetype?.(arch.archetype, arch.cards)}
                      className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
                    >
                      <Swords className="w-3 h-3" />
                      <span>Crear Deck</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* BLOCK 2: STAPLES & HANDTRAPS */}
      {(filterView === 'all' || filterView === 'staples') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
                Staples y Handtraps Identificadas
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              {filteredStaples.length} staples en inventario
            </span>
          </div>

          {filteredStaples.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-500 text-xs">
              No se encontraron staples con los filtros seleccionados.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredStaples.map((staple) => (
                <div
                  key={staple.card_id}
                  className={`p-3 rounded-2xl bg-white dark:bg-zinc-900 border transition-all shadow-xs flex flex-col justify-between gap-2.5 ${
                    staple.isDispersed
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Miniatura */}
                    <div className="w-10 h-14 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                      {staple.cards[0]?.card_details?.image_url_small && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={staple.cards[0].card_details.image_url_small}
                          alt={staple.card_name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded border ${
                          staple.tier === 'S' 
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                            : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                        }`}>
                          Tier {staple.tier}
                        </span>
                        <span className="text-[10px] font-mono font-black text-zinc-400">
                          {staple.copiesOwned}x
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate font-display mt-0.5">
                        {staple.card_name}
                      </h4>

                      <p className="text-[10px] text-zinc-500 capitalize">
                        {staple.category.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  {/* Ubicaciones y Selector Multinivel */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                    <div className="flex items-center gap-1 text-zinc-400 truncate max-w-[140px]">
                      {staple.isDispersed && (
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                      )}
                      <span className="truncate">
                        {staple.locations.length === 1
                          ? staple.locations[0].location_name
                          : `${staple.locations.length} ubicaciones`}
                      </span>
                    </div>

                    {staple.cards[0] && (
                      <MultiLevelMovementDropdown
                        card={staple.cards[0]}
                        allUserCards={allUserCards}
                        locations={locations}
                        decks={decks}
                        onMoveSuccess={onOrganizeInbox}
                        buttonClassName="px-2 py-1 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 cursor-pointer"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* BLOCK 3: DUPLICADOS DISPERSOS */}
      {(filterView === 'all' || filterView === 'duplicates') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
                Cartas con Copias Dispersas en Múltiples Cajas
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              {filteredDuplicates.length} cartas divididas
            </span>
          </div>

          {filteredDuplicates.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-500 text-xs">
              No se detectaron cartas dispersas entre diferentes contenedores.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDuplicates.map((dup) => (
                <div
                  key={dup.card_id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-500/30 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-14 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                      {dup.image_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={dup.image_url}
                          alt={dup.card_name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {dup.totalCopies}x total
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          en {dup.locationsCount} cajas
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate font-display mt-0.5">
                        {dup.card_name}
                      </h4>

                      <div className="flex flex-wrap items-center gap-1 text-[9px] text-zinc-500 mt-1">
                        {dup.locations.map((l, i) => (
                          <span key={i} className="px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 rounded">
                            {l.quantity}x {l.location_name.replace('📥 Sin Clasificar (Inbox)', 'Inbox')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    {(() => {
                      const repCard = allUserCards.find(c => c.card_id === dup.card_id && !c.deck_id);
                      if (repCard) {
                        return (
                          <MultiLevelMovementDropdown
                            card={repCard}
                            allUserCards={allUserCards}
                            locations={locations}
                            decks={decks}
                            onMoveSuccess={onOrganizeInbox}
                            buttonClassName="px-2.5 py-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[10px] font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1 cursor-pointer shadow-2xs"
                          />
                        );
                      }
                      return null;
                    })()}

                    {onOpenConsolidateCard && (
                      <button
                        type="button"
                        onClick={() => onOpenConsolidateCard(dup.card_id)}
                        className="py-1.5 px-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-xs"
                      >
                        Consolidar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

    </div>
  );
};
