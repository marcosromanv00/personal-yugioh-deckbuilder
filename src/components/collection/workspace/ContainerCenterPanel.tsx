'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { StorageLocation, UserCard } from '@/types/collection';
import { Card } from '@/components/deckbuilder/types';
import { ContainerCenterHeader } from './ContainerCenterHeader';
import { ContainerGridView } from './ContainerGridView';
import { ContainerBinderView } from './ContainerBinderView';
import { GridCardGroup, DeckInContainer, MobileTab } from './types';

interface ContainerCenterPanelProps {
  containerType: string;
  isInbox: boolean;
  location: StorageLocation | null;
  currentLocation: StorageLocation | null;
  cards: UserCard[];
  loading: boolean;
  mobileTab: MobileTab;
  setMobileTab: (tab: MobileTab) => void;
  isMobile: boolean;

  // Drag & drop
  isDragOverCenter: boolean;
  setIsDragOverCenter: (over: boolean) => void;
  dragOverSlot: string | null;
  setDragOverSlot: (slot: string | null) => void;
  draggedCard: Card | null;
  handleDropCardToBox: (e: React.DragEvent) => void;
  handleDropCardToBinderSlot: (e: React.DragEvent, page: number, slot: number) => void;

  // Header & Filter props
  containerSearch: string;
  setContainerSearch: (s: string) => void;
  totalPhysicalCards: number;
  activeCompartment: number;
  handleSelectCompartment: (idx: number) => void;
  setActiveClusterFilter: (f: string | null) => void;
  decksInContainer: DeckInContainer[];
  decksInActiveLane: DeckInContainer[];
  selectedDeckFilter: string;
  setSelectedDeckFilter: (f: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  displayedGridCards: GridCardGroup[];
  filteredCards: UserCard[];
  onOpenAssignDeckModal: () => void;

  // Selected & Click to place
  selectedSearchCard: Card | null;
  setSelectedSearchCard: (card: Card | null) => void;
  selectedUserCard: UserCard | null;
  setSelectedUserCard: (uc: UserCard | null) => void;
  handleAddCardToContainer: (card: Card, page?: number, slot?: number) => void;

  // Grid pagination
  paginatedGridCards: GridCardGroup[];
  currentGridPage: number;
  setCurrentGridPage: React.Dispatch<React.SetStateAction<number>>;
  totalGridPages: number;

  // Binder configuration & pages
  rows: number;
  cols: number;
  pocketsPerPage: number;
  leftPageNum: number | null;
  rightPageNum: number | null;
  leftPageCards: UserCard[];
  rightPageCards: UserCard[];
  currentBinderViewIndex: number;
  setCurrentBinderViewIndex: React.Dispatch<React.SetStateAction<number>>;
  totalBinderViews: number;

  // Multi-selection
  isSelectMode?: boolean;
  setIsSelectMode?: (mode: boolean | ((prev: boolean) => boolean)) => void;
  selectedCardIds?: string[];
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onToggleSelectGroup?: (group: GridCardGroup) => void;
  onToggleSelectCard?: (userCardId: string) => void;
}

export const ContainerCenterPanel: React.FC<ContainerCenterPanelProps> = ({
  containerType,
  isInbox,
  location,
  currentLocation,
  cards,
  loading,
  mobileTab,
  setMobileTab,
  isMobile,

  isDragOverCenter,
  setIsDragOverCenter,
  dragOverSlot,
  setDragOverSlot,
  draggedCard,
  handleDropCardToBox,
  handleDropCardToBinderSlot,

  containerSearch,
  setContainerSearch,
  totalPhysicalCards,
  activeCompartment,
  handleSelectCompartment,
  setActiveClusterFilter,
  decksInContainer,
  decksInActiveLane,
  selectedDeckFilter,
  setSelectedDeckFilter,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  displayedGridCards,
  filteredCards,
  onOpenAssignDeckModal,

  selectedSearchCard,
  setSelectedSearchCard,
  selectedUserCard,
  setSelectedUserCard,
  handleAddCardToContainer,

  paginatedGridCards,
  currentGridPage,
  setCurrentGridPage,
  totalGridPages,

  rows,
  cols,
  pocketsPerPage,
  leftPageNum,
  rightPageNum,
  leftPageCards,
  rightPageCards,
  currentBinderViewIndex,
  setCurrentBinderViewIndex,
  totalBinderViews,

  isSelectMode = false,
  setIsSelectMode,
  selectedCardIds = [],
  onSelectAll,
  onClearSelection,
  onToggleSelectGroup,
  onToggleSelectCard,
}) => {
  return (
    <main 
      onDragOver={(e) => {
        if (containerType !== 'binder') {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          setIsDragOverCenter(true);
        }
      }}
      onDragLeave={() => setIsDragOverCenter(false)}
      onDrop={(e) => {
        if (containerType !== 'binder') {
          handleDropCardToBox(e);
        }
      }}
      className={`${mobileTab === 'center' ? 'flex flex-1' : 'hidden'} lg:flex flex-1 flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden relative ${
        isDragOverCenter ? 'ring-4 ring-red-500/50 bg-red-950/10' : ''
      }`}
    >
      {/* Overlay Drag & Drop para Contenedores Tipo Caja / Inbox */}
      <AnimatePresence>
        {isDragOverCenter && containerType !== 'binder' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 bg-zinc-950/85 backdrop-blur-xs border-2 border-dashed border-red-500 rounded-2xl flex flex-col items-center justify-center text-red-200 pointer-events-none p-6 text-center m-2 shadow-2xl"
          >
            <Plus className="w-12 h-12 text-red-500 animate-bounce mb-3" />
            <p className="text-sm font-black uppercase tracking-wider text-zinc-100">
              Soltar carta para añadir a {isInbox ? 'Sin Clasificar' : location?.name || 'este contenedor'}
            </p>
            <p className="text-xs text-zinc-400 mt-1 font-mono">Se agregará una copia automáticamente a tu caja</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Barra Superior Consolidada y Escalable */}
      <ContainerCenterHeader
        containerSearch={containerSearch}
        setContainerSearch={setContainerSearch}
        location={location}
        currentLocation={currentLocation}
        cards={cards}
        totalPhysicalCards={totalPhysicalCards}
        activeCompartment={activeCompartment}
        handleSelectCompartment={handleSelectCompartment}
        setActiveClusterFilter={setActiveClusterFilter}
        decksInContainer={decksInContainer}
        decksInActiveLane={decksInActiveLane}
        selectedDeckFilter={selectedDeckFilter}
        setSelectedDeckFilter={setSelectedDeckFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        displayedGridCardsCount={displayedGridCards.length}
        filteredCards={filteredCards}
        onOpenAssignDeckModal={onOpenAssignDeckModal}
        isSelectMode={isSelectMode}
        setIsSelectMode={setIsSelectMode}
        selectedCardIds={selectedCardIds}
        onSelectAll={onSelectAll}
        onClearSelection={onClearSelection}
      />

      {/* Banner de Click to Place para Binders */}
      <AnimatePresence>
        {selectedSearchCard && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="m-3 p-3 bg-red-950/80 border border-red-500/40 rounded-xl flex items-center justify-between text-xs text-red-200 shadow-md shrink-0"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-400 animate-pulse" />
              <span>
                Colocando <strong>{selectedSearchCard.name}</strong>. Haz clic en una casilla para ubicarla.
              </span>
            </div>
            <button
              onClick={() => setSelectedSearchCard(null)}
              className="px-2.5 py-1 rounded bg-red-900 hover:bg-red-800 text-red-100 font-bold cursor-pointer"
            >
              Cancelar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenido Visual: Grid estándar vs Binder Book */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-2" />
            <p className="text-xs font-mono">Cargando cartas del contenedor...</p>
          </div>
        ) : containerType === 'binder' ? (
          <ContainerBinderView
            cols={cols}
            rows={rows}
            pocketsPerPage={pocketsPerPage}
            leftPageNum={leftPageNum}
            rightPageNum={rightPageNum}
            leftPageCards={leftPageCards}
            rightPageCards={rightPageCards}
            dragOverSlot={dragOverSlot}
            setDragOverSlot={setDragOverSlot}
            selectedSearchCard={selectedSearchCard}
            setSelectedSearchCard={setSelectedSearchCard}
            draggedCard={draggedCard}
            onAddCardToContainer={handleAddCardToContainer}
            onSelectCard={(uc) => setSelectedUserCard(uc)}
            onDropCardToBinderSlot={handleDropCardToBinderSlot}
            isMobile={isMobile}
            setMobileTab={setMobileTab}
            currentBinderViewIndex={currentBinderViewIndex}
            setCurrentBinderViewIndex={setCurrentBinderViewIndex}
            totalBinderViews={totalBinderViews}
            isSelectMode={isSelectMode}
            selectedCardIds={selectedCardIds}
            onToggleSelectCard={onToggleSelectCard}
          />
        ) : (
          <ContainerGridView
            filteredCards={filteredCards}
            paginatedGridCards={paginatedGridCards}
            selectedUserCard={selectedUserCard}
            onSelectCard={(uc) => setSelectedUserCard(uc)}
            isMobile={isMobile}
            setMobileTab={setMobileTab}
            currentGridPage={currentGridPage}
            setCurrentGridPage={setCurrentGridPage}
            totalGridPages={totalGridPages}
            isSelectMode={isSelectMode}
            selectedCardIds={selectedCardIds}
            onToggleSelectGroup={onToggleSelectGroup}
          />
        )}
      </div>
    </main>
  );
};
