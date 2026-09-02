'use client';

import React from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Swords, 
  Sparkles, 
  Shield, 
  Package 
} from 'lucide-react';
import { StorageLocation, UserCard, DeckCardDetail, SleeveInventory } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';
import { DeckSectionGrid } from './DeckSectionGrid';
import { DeckSectionFilter, RightDeckMode, MobileDeckTab } from './types';

interface DeckCenterPanelProps {
  mobileTab: MobileDeckTab;
  searchFilter: string;
  setSearchFilter: (s: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  sectionFilter: DeckSectionFilter;
  setSectionFilter: (s: DeckSectionFilter) => void;
  totalDeckCount: number;
  totalMainCount: number;
  totalExtraCount: number;
  totalSideCount: number;
  totalPoolCount: number;
  filteredCenterCards: DeckCardDetail[];
  mainCards: DeckCardDetail[];
  extraCards: DeckCardDetail[];
  sideCards: DeckCardDetail[];
  poolCards: DeckCardDetail[];
  selectedCardDetail: DeckCardDetail | null;
  setSelectedCardDetail: (c: DeckCardDetail | null) => void;
  setRightMode: (m: RightDeckMode) => void;
  userCards: UserCard[];
  locations: StorageLocation[];
  storageLocationId: string;
  availableSleeves?: SleeveInventory[];
  mainSleeveId?: string;
  extraSleeveId?: string;
  poolSleeveId?: string;
  isMobile: boolean;
  setMobileTab: (tab: MobileDeckTab) => void;
}

export const DeckCenterPanel: React.FC<DeckCenterPanelProps> = ({
  mobileTab,
  searchFilter,
  setSearchFilter,
  sortBy,
  setSortBy,
  sectionFilter,
  setSectionFilter,
  totalDeckCount,
  totalMainCount,
  totalExtraCount,
  totalSideCount,
  totalPoolCount,
  filteredCenterCards,
  mainCards,
  extraCards,
  sideCards,
  poolCards,
  selectedCardDetail,
  setSelectedCardDetail,
  setRightMode,
  userCards,
  locations,
  storageLocationId,
  availableSleeves = [],
  mainSleeveId = '',
  extraSleeveId = '',
  poolSleeveId = '',
  isMobile,
  setMobileTab,
}) => {
  const currentBaseLocation = locations.find(l => l.id === storageLocationId);

  const handleSelectCard = (card: DeckCardDetail) => {
    setSelectedCardDetail(card);
    setRightMode('card');
  };

  return (
    <main className={`${mobileTab === 'center' ? 'flex' : 'hidden'} lg:flex flex-1 flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative`}>
      {/* Barra Superior de Filtros y Secciones */}
      <div className="px-3 sm:px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/40 flex items-center justify-between gap-2 shrink-0 flex-nowrap overflow-x-auto scrollbar-none">
        {/* Buscador dentro del Deck */}
        <div className="relative flex-1 min-w-32 max-w-xs shrink">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filtrar en deck..."
            className="w-full pl-8.5 pr-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-red-500 focus:outline-none"
          />
        </div>

        {/* Selector de Ordenamiento */}
        <PremiumDropdown
          value={sortBy}
          onChange={(val) => setSortBy(val)}
          size="sm"
          icon={<ArrowUpDown className="w-3.5 h-3.5 text-red-500" />}
          options={[
            { value: 'default', label: 'Orden: Por Defecto' },
            { value: 'name_asc', label: 'Nombre (A → Z)' },
            { value: 'type', label: 'Tipo de Carta' },
          ]}
        />
      </div>

      {/* Pestañas de Secciones del Deck */}
      <div className="px-3 sm:px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-900/30 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
        <button
          type="button"
          onClick={() => setSectionFilter('all')}
          className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 ${
            sectionFilter === 'all'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Todas ({totalDeckCount})
        </button>

        <button
          type="button"
          onClick={() => setSectionFilter('main')}
          className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            sectionFilter === 'main'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Swords className="w-3 h-3 text-red-400" />
          <span>Main Deck ({totalMainCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setSectionFilter('extra')}
          className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            sectionFilter === 'extra'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>Extra Deck ({totalExtraCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setSectionFilter('side')}
          className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            sectionFilter === 'side'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Shield className="w-3 h-3 text-amber-400" />
          <span>Side Deck ({totalSideCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setSectionFilter('pool')}
          className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            sectionFilter === 'pool'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Package className="w-3 h-3 text-cyan-400" />
          <span>Reserva / Cartas Extra ({totalPoolCount})</span>
        </button>
      </div>

      {/* Cuadrícula de Cartas con División por Secciones */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 scrollbar-thin">
        {filteredCenterCards.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-400 dark:text-zinc-600 space-y-3">
            <Swords className="w-12 h-12 opacity-30" />
            <p className="text-xs font-bold uppercase tracking-wider">No hay cartas en esta sección</p>
            <p className="text-[11px] max-w-xs">
              Usa el buscador del panel izquierdo para agregar cartas a tu mazo o a tu reserva de cartas extra.
            </p>
          </div>
        ) : (
          <>
            {/* SECCIÓN 1: MAIN DECK */}
            {(sectionFilter === 'all' || sectionFilter === 'main') && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-red-500/20 dark:border-red-500/20 pb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center">
                      <Swords className="w-3 h-3" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                      Main Deck
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60">
                      {totalMainCount} / 40-60 cartas
                    </span>
                  </div>
                </div>

                <DeckSectionGrid
                  cards={mainCards}
                  sectionName="Main Deck"
                  sectionKey="main"
                  selectedCardDetail={selectedCardDetail}
                  onSelectCard={handleSelectCard}
                  userCards={userCards}
                  locations={locations}
                  storageLocationId={storageLocationId}
                  currentBaseLocation={currentBaseLocation}
                  availableSleeves={availableSleeves}
                  mainSleeveId={mainSleeveId}
                  extraSleeveId={extraSleeveId}
                  poolSleeveId={poolSleeveId}
                  isMobile={isMobile}
                  setMobileTab={setMobileTab}
                  emptyMessage="Main Deck vacío"
                  emptySubMessage="Agrega cartas desde el buscador izquierdo."
                />
              </div>
            )}

            {/* SECCIÓN 2: EXTRA DECK */}
            {(sectionFilter === 'all' || sectionFilter === 'extra') && (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between border-b border-purple-500/20 dark:border-purple-500/20 pb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Sparkles className="w-3 h-3" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                      Extra Deck
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                      {totalExtraCount} / 15 cartas
                    </span>
                  </div>
                </div>

                <DeckSectionGrid
                  cards={extraCards}
                  sectionName="Extra Deck"
                  sectionKey="extra"
                  selectedCardDetail={selectedCardDetail}
                  onSelectCard={handleSelectCard}
                  userCards={userCards}
                  locations={locations}
                  storageLocationId={storageLocationId}
                  currentBaseLocation={currentBaseLocation}
                  availableSleeves={availableSleeves}
                  mainSleeveId={mainSleeveId}
                  extraSleeveId={extraSleeveId}
                  poolSleeveId={poolSleeveId}
                  isMobile={isMobile}
                  setMobileTab={setMobileTab}
                  emptyMessage="Extra Deck vacío"
                  emptySubMessage="Agrega monstruos Fusión, Sincronía, Xyz o Enlace."
                  badgeLabel="Extra"
                  badgeColorClass="bg-purple-900/90 text-purple-200 border-purple-700/50"
                />
              </div>
            )}

            {/* SECCIÓN 3: SIDE DECK */}
            {(sectionFilter === 'all' || sectionFilter === 'side') && (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between border-b border-amber-500/20 dark:border-amber-500/20 pb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Shield className="w-3 h-3" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                      Side Deck
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                      {totalSideCount} / 15 cartas
                    </span>
                  </div>
                </div>

                <DeckSectionGrid
                  cards={sideCards}
                  sectionName="Side Deck"
                  sectionKey="side"
                  selectedCardDetail={selectedCardDetail}
                  onSelectCard={handleSelectCard}
                  userCards={userCards}
                  locations={locations}
                  storageLocationId={storageLocationId}
                  currentBaseLocation={currentBaseLocation}
                  availableSleeves={availableSleeves}
                  mainSleeveId={mainSleeveId}
                  extraSleeveId={extraSleeveId}
                  poolSleeveId={poolSleeveId}
                  isMobile={isMobile}
                  setMobileTab={setMobileTab}
                  emptyMessage="Side Deck vacío"
                  emptySubMessage="Agrega cartas de banquillo para enfrentamientos competitivos."
                  badgeLabel="Side"
                  badgeColorClass="bg-amber-900/90 text-amber-200 border-amber-700/50"
                />
              </div>
            )}

            {/* SECCIÓN 4: RESERVA / CARTAS EXTRA (POOL) */}
            {(sectionFilter === 'all' || sectionFilter === 'pool') && (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between border-b border-cyan-500/20 dark:border-cyan-500/20 pb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                      <Package className="w-3 h-3" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                      Reserva / Cartas Extra del Arquetipo
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60">
                      {totalPoolCount} cartas
                    </span>
                  </div>
                </div>

                <DeckSectionGrid
                  cards={poolCards}
                  sectionName="Reserva"
                  sectionKey="pool"
                  selectedCardDetail={selectedCardDetail}
                  onSelectCard={handleSelectCard}
                  userCards={userCards}
                  locations={locations}
                  storageLocationId={storageLocationId}
                  currentBaseLocation={currentBaseLocation}
                  availableSleeves={availableSleeves}
                  mainSleeveId={mainSleeveId}
                  extraSleeveId={extraSleeveId}
                  poolSleeveId={poolSleeveId}
                  isMobile={isMobile}
                  setMobileTab={setMobileTab}
                  emptyMessage="Reserva de cartas extra vacía"
                  emptySubMessage="Guarda aquí piezas de repuesto, tech cards o cartas que no entran en la lista activa."
                  badgeLabel="Reserva"
                  badgeColorClass="bg-cyan-900/90 text-cyan-200 border-cyan-700/50"
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};
