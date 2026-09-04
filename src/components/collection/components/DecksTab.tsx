'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Layers, 
  Search, 
  Plus, 
  Box, 
  Sparkles, 
  LayoutGrid, 
  List, 
  ArrowUpRight,
  Shield,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RecommendedDecksGallery } from './RecommendedDecksGallery';
import { DecksTabSkeleton } from './DecksTabSkeleton';
import { OverflowTooltip } from '@/components/ui/OverflowTooltip';
import { Deck, StorageLocation, SleeveInventory, UserCard, DeckCardDetail } from '@/types/collection';

type SleeveSummaryItem = {
  sleeve_id: string;
  section?: string;
  section_type?: string;
  sleeve_details?: SleeveInventory;
};

const getDeckSleevesSummary = (deck: Deck, availableSleeves: SleeveInventory[]) => {
  if (!deck.sleeves || !Array.isArray(deck.sleeves) || deck.sleeves.length === 0) {
    return null;
  }

  const findSleeve = (sleeveId?: string, details?: SleeveInventory) => {
    if (details) return details;
    if (!sleeveId) return null;
    return availableSleeves.find(s => s.id === sleeveId) || null;
  };

  const sleeveList = deck.sleeves as SleeveSummaryItem[];

  const mainRegular = sleeveList.find((s) => 
    (s.section_type === 'main_side_regular' || s.section_type === 'main_regular' || s.section_type === 'main_side' || s.section === 'main_side_regular' || s.section === 'main')
  );
  const extraRegular = sleeveList.find((s) => 
    (s.section_type === 'extra_regular' || s.section_type === 'extra' || s.section === 'extra_regular' || s.section === 'extra')
  );
  const poolRegular = sleeveList.find((s) => 
    (s.section_type === 'pool_regular' || s.section_type === 'pool' || s.section_type === 'extras' || s.section === 'pool_regular' || s.section === 'pool')
  );

  const mainSlv = mainRegular ? findSleeve(mainRegular.sleeve_id, mainRegular.sleeve_details) : null;
  const extraSlv = extraRegular ? findSleeve(extraRegular.sleeve_id, extraRegular.sleeve_details) : null;
  const poolSlv = poolRegular ? findSleeve(poolRegular.sleeve_id, poolRegular.sleeve_details) : null;

  const hasFit = sleeveList.some((s) => (s.section_type || s.section || '').endsWith('_fit'));
  const hasOver = sleeveList.some((s) => (s.section_type || s.section || '').endsWith('_over'));
  const layerType = (hasFit && hasOver) ? 'Triple' : (hasFit || hasOver) ? 'Doble' : 'Simple';

  return {
    mainSlv,
    extraSlv,
    poolSlv,
    layerType,
    totalAssigned: [mainSlv, extraSlv, poolSlv].filter(Boolean).length
  };
};

interface DecksTabProps {
  loading?: boolean;
  decks: Deck[];
  locations: StorageLocation[];
  sleeves: SleeveInventory[];
  allUserCards?: UserCard[];
  setDecks: React.Dispatch<React.SetStateAction<Deck[]>>;
  onDeckClick: (deck: Deck) => void;
  onRefreshData?: () => void;
  handleDeleteDeck?: (id: string) => Promise<boolean | void>;
}

export const DecksTab: React.FC<DecksTabProps> = ({
  loading = false,
  decks,
  locations,
  sleeves,
  allUserCards = [],
  setDecks,
  onDeckClick,
  onRefreshData,
  handleDeleteDeck,
}) => {
  const [subCategory, setSubCategory] = useState<'my_decks' | 'recommended'>('my_decks');
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'Master Duel' | 'TCG' | 'Duel Links'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'recipe'>('all');
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Persistencia de Vista (Cuadrícula o Lista) con inicializador perezoso
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('exordio_decks_view_mode');
        if (saved === 'grid' || saved === 'list') {
          return saved;
        }
      } catch {
        // noop
      }
    }
    return 'grid';
  });

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('exordio_decks_view_mode', mode);
    } catch {
      // noop
    }
  };

  const filteredDecks = useMemo(() => {
    return decks.filter(deck => {
      const matchesSearch = deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (deck.description && deck.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesFormat = formatFilter === 'all' || deck.format === formatFilter;
      
      const isActive = deck.is_active !== false;
      const matchesStatus = statusFilter === 'all' 
        ? true 
        : statusFilter === 'active' 
          ? isActive 
          : !isActive;

      return matchesSearch && matchesFormat && matchesStatus;
    });
  }, [decks, searchQuery, formatFilter, statusFilter]);

  if (loading) {
    return <DecksTabSkeleton viewMode={viewMode} />;
  }

  const toggleDeckActive = async (e: React.MouseEvent, deck: Deck) => {
    e.stopPropagation();
    const newActive = deck.is_active === false ? true : false;
    const previousDecks = decks;

    setDecks(prev =>
      prev.map(d => (d.id === deck.id ? { ...d, is_active: newActive } : d))
    );

    try {
      const res = await fetch('/api/decks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deck.id, is_active: newActive }),
      });
      if (!res.ok) {
        setDecks(previousDecks);
      }
    } catch (err) {
      setDecks(previousDecks);
      console.error('Error al actualizar estado activo del deck:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ═══ SELECTOR DE SUBCATEGORÍA ═══ */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setSubCategory('my_decks')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer font-display ${
              subCategory === 'my_decks'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-red-500" />
            <span>Mis Decks &amp; Recetas ({decks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubCategory('recommended')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer font-display ${
              subCategory === 'recommended'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Decks Recomendados</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-mono font-bold">
              NUEVO
            </span>
          </button>
        </div>

        {subCategory === 'my_decks' && (
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-red-600/20 transition-all cursor-pointer font-display"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear en Taller</span>
          </Link>
        )}
      </div>

      {/* RENDER RECOMMENDED DECKS GALLERY OR MY DECKS */}
      {subCategory === 'recommended' ? (
        <RecommendedDecksGallery
          allUserCards={allUserCards}
          decks={decks}
          locations={locations}
        />
      ) : (
        <div className="space-y-6">
          {/* ═══ TOOLBAR ERGONÓMICA DE DECKS ═══ */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            
            {/* Buscador */}
            <div className="relative flex-1 min-w-48">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar baraja por nombre o nota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Formato Filter */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                {(['all', 'Master Duel', 'TCG', 'Duel Links'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormatFilter(fmt)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      formatFilter === fmt
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {fmt === 'all' ? 'Todos' : fmt === 'Master Duel' ? 'MD' : fmt === 'Duel Links' ? 'DL' : 'TCG'}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <PremiumDropdown
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as 'all' | 'active' | 'recipe')}
                size="md"
                options={[
                  { value: 'all', label: 'Estado: Todos' },
                  { value: 'active', label: 'Solo Activos (Físicos)' },
                  { value: 'recipe', label: 'Solo Recetas' },
                ]}
              />

              {/* Alternador de Vista (Cuadrícula / Lista) */}
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => handleViewModeChange('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                  title="Vista en cuadrícula"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                  title="Vista en lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-red-600/30 transition-all cursor-pointer sm:hidden"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo</span>
              </Link>
            </div>
          </div>

          {/* ═══ RENDER DE DECKS (GRID O LISTA) ═══ */}
          {filteredDecks.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
              <Layers className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
              <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-display">
                No se encontraron barajas
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto font-medium">
                {decks.length === 0
                  ? 'Aún no tienes barajas guardadas. Diseña una en el taller inteligente.'
                  : 'Ninguna baraja coincide con los filtros aplicados.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredDecks.map((deck) => {
                const storedIn = locations.find(
                  l => l.id === deck.storage_location_id || Boolean(l.compartments?.deck_ids?.includes(deck.id))
                );
                let laneName = '';
                if (storedIn && storedIn.compartments?.deck_ids) {
                  const laneIdx = storedIn.compartments.deck_ids.indexOf(deck.id);
                  if (laneIdx !== -1 && storedIn.compartments.names?.[laneIdx]) {
                    laneName = storedIn.compartments.names[laneIdx];
                  }
                }
                const totalCards = deck.cards?.reduce((acc: number, c: DeckCardDetail) => acc + c.count, 0) || 0;
                const isActive = deck.is_active !== false;
                const formatStr = deck.format || 'TCG';
                const sleeveSummary = getDeckSleevesSummary(deck, sleeves);

                return (
                  <motion.div
                    key={deck.id}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => onDeckClick(deck)}
                    className={`relative group rounded-2xl p-4.5 border transition-all duration-200 shadow-xs flex flex-col justify-between cursor-pointer ${
                      isActive
                        ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-red-500/60'
                        : 'border-zinc-200/80 dark:border-zinc-800/60 bg-zinc-50/70 dark:bg-zinc-950/40 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Formato & Estado */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase">
                          {formatStr}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => toggleDeckActive(e, deck)}
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                          }`}
                          title="Clic para cambiar entre Activo (físico) y Receta"
                        >
                          {isActive ? '● Activo Físico' : '○ Receta'}
                        </button>
                      </div>

                      {/* Nombre y Descripción */}
                      <div>
                        <h3 className="font-black text-sm sm:text-base text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-1 font-display">
                          {deck.name}
                        </h3>
                        {deck.description && (
                          <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 font-medium">
                            {deck.description}
                          </p>
                        )}
                      </div>

                      {/* Info de Cartas, Almacenamiento y Fundas */}
                      <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800 space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between text-zinc-500">
                          <span>Cartas:</span>
                          <span className="text-zinc-900 dark:text-zinc-100 font-bold">{totalCards}</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-500">
                          <span>Almacén:</span>
                          {storedIn ? (
                            <span 
                              className="text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1 truncate max-w-40"
                              title={`Almacenado en: ${storedIn.name}${laneName ? ` (${laneName})` : ''}`}
                            >
                              <Box className="w-3 h-3 shrink-0" />
                              <span className="truncate">{storedIn.name}</span>
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                              Sin asignar
                            </span>
                          )}
                        </div>

                        {/* Desglose de Fundas del Deck */}
                        <div className="flex items-start justify-between text-zinc-500 pt-1.5 border-t border-zinc-100/60 dark:border-zinc-800/60">
                          <span className="shrink-0 flex items-center gap-1">
                            <Shield className="w-3 h-3 text-red-500" />
                            <span>Fundas:</span>
                          </span>
                          {sleeveSummary && sleeveSummary.totalAssigned > 0 ? (
                            <div className="flex flex-wrap items-center justify-end gap-1 max-w-[70%]">
                              {sleeveSummary.mainSlv && (
                                <OverflowTooltip
                                  text={`Main/Side: ${sleeveSummary.mainSlv.name} (${sleeveSummary.mainSlv.brand} - ${sleeveSummary.mainSlv.color_pattern}) [${sleeveSummary.layerType}]`}
                                  className="text-[9.5px] font-mono font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/60 px-1.5 py-0.5 rounded-md"
                                >
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                                    style={{ backgroundColor: sleeveSummary.mainSlv.color_hex || '#e11d48' }}
                                  />
                                  <span className="truncate max-w-20">Main: {sleeveSummary.mainSlv.color_pattern || sleeveSummary.mainSlv.brand}</span>
                                </OverflowTooltip>
                              )}
                              {sleeveSummary.extraSlv && (
                                <OverflowTooltip
                                  text={`Extra Deck: ${sleeveSummary.extraSlv.name} (${sleeveSummary.extraSlv.brand} - ${sleeveSummary.extraSlv.color_pattern})`}
                                  className="text-[9.5px] font-mono font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 px-1.5 py-0.5 rounded-md"
                                >
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                                    style={{ backgroundColor: sleeveSummary.extraSlv.color_hex || '#a855f7' }}
                                  />
                                  <span className="truncate max-w-20">Extra: {sleeveSummary.extraSlv.color_pattern || sleeveSummary.extraSlv.brand}</span>
                                </OverflowTooltip>
                              )}
                              {sleeveSummary.poolSlv && (
                                <OverflowTooltip
                                  text={`Reserva/Pool: ${sleeveSummary.poolSlv.name} (${sleeveSummary.poolSlv.brand} - ${sleeveSummary.poolSlv.color_pattern})`}
                                  className="text-[9.5px] font-mono font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-1 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 px-1.5 py-0.5 rounded-md"
                                >
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                                    style={{ backgroundColor: sleeveSummary.poolSlv.color_hex || '#06b6d4' }}
                                  />
                                  <span className="truncate max-w-20">Pool: {sleeveSummary.poolSlv.color_pattern || sleeveSummary.poolSlv.brand}</span>
                                </OverflowTooltip>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-400 dark:text-zinc-600 text-[10.5px] italic">
                              Sin fundas
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400 font-mono">
                          ID: {deck.id.slice(0, 6)}...
                        </span>
                        {handleDeleteDeck && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeckToDelete(deck);
                            }}
                            className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Eliminar baraja"
                            aria-label="Eliminar baraja"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Ver</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredDecks.map((deck) => {
                const storedIn = locations.find(
                  l => l.id === deck.storage_location_id || Boolean(l.compartments?.deck_ids?.includes(deck.id))
                );
                const totalCards = deck.cards?.reduce((acc: number, c: DeckCardDetail) => acc + c.count, 0) || 0;
                const isActive = deck.is_active !== false;
                const sleeveSummary = getDeckSleevesSummary(deck, sleeves);

                return (
                  <div
                    key={deck.id}
                    onClick={() => onDeckClick(deck)}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/50 hover:shadow-xs transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 sm:w-1/3">
                      <div className={`w-1 h-8 rounded-full shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-red-500 transition-colors truncate font-display">
                            {deck.name}
                          </h4>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase">
                            {deck.format}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 block truncate">
                          {totalCards} cartas
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-1 min-w-0 px-1 sm:px-2">
                      {storedIn ? (
                        <span className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 truncate max-w-36">
                          📦 {storedIn.name}
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 italic">
                          Sin almacenar
                        </span>
                      )}
                    </div>

                    {/* Columna de Fundas en Vista Lista */}
                    <div className="flex items-center gap-1.5 min-w-0 sm:w-1/4">
                      {sleeveSummary && sleeveSummary.totalAssigned > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap truncate">
                          {sleeveSummary.mainSlv && (
                            <OverflowTooltip
                              text={`Main: ${sleeveSummary.mainSlv.name} (${sleeveSummary.mainSlv.brand})`}
                              className="text-[9.5px] font-mono font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700"
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                                style={{ backgroundColor: sleeveSummary.mainSlv.color_hex || '#e11d48' }}
                              />
                              <span className="truncate max-w-16 sm:max-w-20">{sleeveSummary.mainSlv.color_pattern || sleeveSummary.mainSlv.brand}</span>
                            </OverflowTooltip>
                          )}
                          {sleeveSummary.extraSlv && (
                            <OverflowTooltip
                              text={`Extra: ${sleeveSummary.extraSlv.name} (${sleeveSummary.extraSlv.brand})`}
                              className="text-[9.5px] font-mono font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/40"
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                                style={{ backgroundColor: sleeveSummary.extraSlv.color_hex || '#a855f7' }}
                              />
                              <span className="truncate max-w-16 sm:max-w-20">{sleeveSummary.extraSlv.color_pattern || sleeveSummary.extraSlv.brand}</span>
                            </OverflowTooltip>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 italic">
                          Sin fundas
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 justify-end">
                      <button
                        type="button"
                        onClick={(e) => toggleDeckActive(e, deck)}
                        className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        {isActive ? 'Activo' : 'Receta'}
                      </button>
                      {handleDeleteDeck && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeckToDelete(deck);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Eliminar baraja"
                          aria-label="Eliminar baraja"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 group-hover:translate-x-0.5 transition-transform">
                        →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Confirmación para Eliminar Baraja */}
      <ConfirmDialog
        isOpen={Boolean(deckToDelete)}
        title="¿Eliminar baraja?"
        description={`¿Estás seguro de que deseas eliminar la baraja "${deckToDelete?.name}"? Las cartas físicas asociadas permanecerán intactas en tu colección general.`}
        confirmLabel="Eliminar Baraja"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={async () => {
          if (!deckToDelete || !handleDeleteDeck) return;
          setIsDeleting(true);
          try {
            await handleDeleteDeck(deckToDelete.id);
            setDeckToDelete(null);
          } finally {
            setIsDeleting(false);
          }
        }}
        onClose={() => setDeckToDelete(null)}
      />
    </div>
  );
};
