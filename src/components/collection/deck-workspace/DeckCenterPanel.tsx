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
  handleDragCardStart?: (e: React.DragEvent, cardData: { id: number; name: string; type?: string; image_url?: string; archetype?: string; fromSection?: 'main' | 'extra' | 'side' | 'pool' | 'extras' }) => void;
  handleDropCardOnSection?: (e: React.DragEvent, targetSection: 'main' | 'extra' | 'side' | 'pool' | 'extras') => void;
  isDeckListDirty?: boolean;
  savingDeckCards?: boolean;
  onSaveDeckCards?: () => void;
  onDiscardDeckCards?: () => void;
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
  handleDragCardStart,
  handleDropCardOnSection,
  isDeckListDirty = false,
  savingDeckCards = false,
  onSaveDeckCards,
  onDiscardDeckCards,
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
            placeholder="Filtrar cartas en mazo..."
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Selector de Sección y Ordenamiento */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex bg-zinc-200/60 dark:bg-zinc-800/60 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-700/50">
            <button
              onClick={() => setSectionFilter('all')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                sectionFilter === 'all' 
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs' 
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Todo ({totalDeckCount})
            </button>
            <button
              onClick={() => setSectionFilter('main')}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${
                sectionFilter === 'main' 
                  ? 'bg-red-600 text-white shadow-xs' 
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Main ({totalMainCount})
            </button>
            <button
              onClick={() => setSectionFilter('extra')}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${
                sectionFilter === 'extra' 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Extra ({totalExtraCount})
            </button>
            <button
              onClick={() => setSectionFilter('side')}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${
                sectionFilter === 'side' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Side ({totalSideCount})
            </button>
            <button
              onClick={() => setSectionFilter('pool')}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${
                sectionFilter === 'pool' 
                  ? 'bg-cyan-600 text-white shadow-xs' 
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Reserva ({totalPoolCount})
            </button>
          </div>

          <div className="w-36 hidden sm:block">
            <PremiumDropdown
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={[
                { value: 'name_asc', label: 'Nombre (A-Z)' },
                { value: 'name_desc', label: 'Nombre (Z-A)' },
                { value: 'atk_desc', label: 'Mayor ATK' },
                { value: 'level_desc', label: 'Mayor Nivel' },
                { value: 'type', label: 'Tipo de Carta' },
              ]}
              icon={<ArrowUpDown className="w-3.5 h-3.5" />}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Contenedor Principal con Scroll */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {filteredCenterCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No se encontraron cartas</h4>
            <p className="text-xs text-zinc-500 max-w-xs mt-1">
              {searchFilter ? 'Prueba ajustando el término de búsqueda.' : 'Este mazo aún no tiene cartas en la sección seleccionada.'}
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
                      {totalMainCount} cartas
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
                  emptySubMessage="Arrastra o agrega cartas desde el buscador izquierdo."
                  badgeLabel="Main"
                  badgeColorClass="bg-red-900/90 text-red-200 border-red-700/50"
                  handleDragCardStart={handleDragCardStart}
                  handleDropCardOnSection={handleDropCardOnSection}
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
                      {totalExtraCount} cartas
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
                  emptySubMessage="Monstruos Fusión, Synchro, Xyz y Link aparecerán aquí."
                  badgeLabel="Extra"
                  badgeColorClass="bg-purple-900/90 text-purple-200 border-purple-700/50"
                  handleDragCardStart={handleDragCardStart}
                  handleDropCardOnSection={handleDropCardOnSection}
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
                      {totalSideCount} cartas
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
                  handleDragCardStart={handleDragCardStart}
                  handleDropCardOnSection={handleDropCardOnSection}
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
                  handleDragCardStart={handleDragCardStart}
                  handleDropCardOnSection={handleDropCardOnSection}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* BANNER DE VALIDACIÓN DE CAMBIOS EN LA LISTA DE CARTAS */}
      {isDeckListDirty && (
        <div className="sticky bottom-0 inset-x-0 z-40 bg-zinc-900/95 dark:bg-zinc-900/95 text-white p-3 sm:px-5 border-t border-amber-500/40 shadow-2xl flex items-center justify-between gap-3 flex-wrap backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-amber-400">Cambios no confirmados en la baraja:</span>{' '}
              <span className="text-zinc-300">Se han modificado cartas en Main / Extra / Side / Reserva.</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              type="button"
              onClick={onDiscardDeckCards}
              disabled={savingDeckCards}
              className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all cursor-pointer min-h-9 touch-manipulation disabled:opacity-50"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={onSaveDeckCards}
              disabled={savingDeckCards}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/30 transition-all cursor-pointer min-h-9 touch-manipulation disabled:opacity-50"
            >
              {savingDeckCards ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
