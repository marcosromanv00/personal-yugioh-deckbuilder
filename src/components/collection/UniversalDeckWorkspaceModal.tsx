'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { usePanelResize } from '@/components/deckbuilder/hooks/usePanelResize';
import { SearchPanel } from '@/components/deckbuilder/components/SearchPanel';
import { SleeveInventoryFormModal } from './SleeveInventoryFormModal';
import { UniversalDeckWorkspaceModalProps } from './deck-workspace/types';
import { useDeckWorkspaceState } from './deck-workspace/useDeckWorkspaceState';
import { DeckWorkspaceHeader } from './deck-workspace/DeckWorkspaceHeader';
import { DeckCenterPanel } from './deck-workspace/DeckCenterPanel';
import { DeckInspectorPanel } from './deck-workspace/DeckInspectorPanel';
import { Card } from '@/components/deckbuilder/types';

export const UniversalDeckWorkspaceModal: React.FC<UniversalDeckWorkspaceModalProps> = (props) => {
  const {
    isOpen,
    onClose,
    deck,
    decks = [],
    onSelectDeck,
    locations = [],
    sleeves = [],
    onSuccess,
  } = props;

  const panelResize = usePanelResize(422, 384);

  const state = useDeckWorkspaceState({
    isOpen,
    onClose,
    deck,
    decks,
    onSelectDeck,
    locations,
    sleeves,
    onSuccess,
  });

  if (!isOpen || !state.currentDeck) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:py-2 sm:px-4 bg-black/80 backdrop-blur-md overflow-hidden font-sans select-none"
      onClick={() => onClose(state.hasMutated)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full sm:w-[98vw] sm:max-w-[1720px] h-dvh sm:h-[96vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100 select-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══ CABECERA SUPERIOR DEL WORKSPACE ═══ */}
        <DeckWorkspaceHeader
          decks={decks}
          currentDeck={state.currentDeck}
          name={state.name}
          format={state.format}
          isActive={state.isActive}
          totalDeckCount={state.totalDeckCount}
          totalMainCount={state.totalMainCount}
          totalExtraCount={state.totalExtraCount}
          totalSideCount={state.totalSideCount}
          totalPoolCount={state.totalPoolCount}
          hasMutated={state.hasMutated}
          onClose={onClose}
          onNavigatePrev={state.handleNavigatePrev}
          onNavigateNext={state.handleNavigateNext}
          mobileTab={state.mobileTab}
          setMobileTab={state.setMobileTab}
        />

        {/* ═══ CUERPO PRINCIPAL DE 3 PANELES ═══ */}
        <div className="flex-1 flex overflow-hidden relative">

          {/* ─── PANEL IZQUIERDO: BUSCADOR & IMPORTADOR BULK ─── */}
          <div 
            style={!state.isMobile ? { width: `${panelResize.leftPanelWidth}px` } : {}}
            className={`${state.mobileTab === 'left' ? 'flex w-full' : 'hidden'} lg:flex shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 flex-col h-full overflow-hidden z-20`}
          >
            <div className="flex-1 overflow-hidden flex flex-col">
              <SearchPanel
                leftPanelOpen={true}
                setLeftPanelOpen={() => {}}
                leftPanelWidth={panelResize.leftPanelWidth}
                isMobile={state.isMobile}
                searchQuery={state.searchQuery}
                setSearchQuery={state.setSearchQuery}
                searchScope={state.searchScope}
                setSearchScope={state.setSearchScope}
                onlyFavorites={state.onlyFavorites}
                setOnlyFavorites={state.setOnlyFavorites}
                searchType={state.searchType}
                setSearchType={state.setSearchType}
                advancedFilters={state.advancedFilters}
                setAdvancedFilters={state.setAdvancedFilters}
                searchResults={state.searchResults}
                isSearching={state.isSearching}
                searchViewMode={state.searchViewMode}
                setSearchViewMode={state.setSearchViewMode}
                searchLimit={state.searchLimit}
                setSearchLimit={state.setSearchLimit}
                format={state.format as 'TCG' | 'Master Duel' | 'Duel Links'}
                addCardToDeck={(card) => state.handleAddCardToDeck(card as Card, state.sectionFilter !== 'all' ? state.sectionFilter : undefined)}
                openPreviewForCard={(card) => {
                  const existing = state.deckCards.find(c => c.card_id === card.id);
                  if (existing) {
                    state.setSelectedCardDetail(existing);
                    state.setRightMode('card');
                  } else {
                    state.handleAddCardToDeck(card as Card, state.sectionFilter !== 'all' ? state.sectionFilter : undefined);
                  }
                  if (state.isMobile) state.setMobileTab('right');
                }}
                handleDragCardStart={() => {}}
                handleCardMouseEnter={() => {}}
                handleCardMouseLeave={() => {}}
              />
            </div>
          </div>

          {/* DIVIDER REDIMENSIONABLE IZQUIERDO */}
          {!state.isMobile && (
            <div
              onMouseDown={panelResize.startResizeLeft}
              className="w-1.5 hover:w-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-red-500 dark:hover:bg-red-500 cursor-col-resize self-stretch shrink-0 transition-all z-30 opacity-70 hover:opacity-100"
              title="Arrastra para cambiar el ancho del panel izquierdo"
            />
          )}

          {/* ─── PANEL CENTRAL: GRID DEL DECK Y SECCIONES BIEN DIVIDIDAS ─── */}
          <DeckCenterPanel
            mobileTab={state.mobileTab}
            searchFilter={state.searchFilter}
            setSearchFilter={state.setSearchFilter}
            sortBy={state.sortBy}
            setSortBy={state.setSortBy}
            sectionFilter={state.sectionFilter}
            setSectionFilter={state.setSectionFilter}
            totalDeckCount={state.totalDeckCount}
            totalMainCount={state.totalMainCount}
            totalExtraCount={state.totalExtraCount}
            totalSideCount={state.totalSideCount}
            totalPoolCount={state.totalPoolCount}
            filteredCenterCards={state.filteredCenterCards}
            mainCards={state.mainCards}
            extraCards={state.extraCards}
            sideCards={state.sideCards}
            poolCards={state.poolCards}
            selectedCardDetail={state.selectedCardDetail}
            setSelectedCardDetail={state.setSelectedCardDetail}
            setRightMode={state.setRightMode}
            userCards={state.userCards}
            locations={locations}
            storageLocationId={state.storageLocationId}
            isMobile={state.isMobile}
            setMobileTab={state.setMobileTab}
          />

          {/* DIVIDER REDIMENSIONABLE DERECHO */}
          {!state.isMobile && (
            <div
              onMouseDown={panelResize.startResizeRight}
              className="w-1.5 hover:w-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-red-500 dark:hover:bg-red-500 cursor-col-resize self-stretch shrink-0 transition-all z-30 opacity-70 hover:opacity-100"
              title="Arrastra para cambiar el ancho del panel derecho"
            />
          )}

          {/* ─── PANEL DERECHO: SWITCH ENTRE FICHA TÉCNICA, DETALLES DE CARTA Y COLECCIÓN ─── */}
          <DeckInspectorPanel
            rightPanelWidth={panelResize.rightPanelWidth}
            isMobile={state.isMobile}
            mobileTab={state.mobileTab}
            rightMode={state.rightMode}
            setRightMode={state.setRightMode}
            selectedCardDetail={state.selectedCardDetail}
            setSelectedCardDetail={state.setSelectedCardDetail}
            name={state.name}
            setName={state.setName}
            format={state.format}
            setFormat={state.setFormat}
            isActive={state.isActive}
            setIsActive={state.setIsActive}
            storageLocationId={state.storageLocationId}
            setStorageLocationId={state.setStorageLocationId}
            locations={locations}
            availableSleeves={state.availableSleeves}
            mainSleeveId={state.mainSleeveId}
            setMainSleeveId={state.setMainSleeveId}
            extraSleeveId={state.extraSleeveId}
            setExtraSleeveId={state.setExtraSleeveId}
            totalMainCount={state.totalMainCount}
            totalSideCount={state.totalSideCount}
            totalExtraCount={state.totalExtraCount}
            totalPoolCount={state.totalPoolCount}
            savingDeck={state.savingDeck}
            handleSaveDeck={state.handleSaveDeck}
            onOpenNewSleeveModal={(section) => {
              state.setTargetSleeveSection(section);
              state.setIsNewSleeveModalOpen(true);
            }}
            selectedPhysicalUserCards={state.selectedPhysicalUserCards}
            onChangeCardSection={state.handleChangeCardSection}
            onUpdateCardPhysicalLocation={state.handleUpdateCardPhysicalLocation}
            onRemoveCardFromDeck={state.handleRemoveCardFromDeck}
            allUserCards={props.allUserCards && props.allUserCards.length > 0 ? props.allUserCards : state.userCards}
            deckCards={state.deckCards}
            detectedArchetypes={state.detectedArchetypes}
            inferredArchetype={state.inferredArchetype}
            savedDecks={decks}
            onAddCardToDeck={(card, section) => state.handleAddCardToDeck(card, section === 'extras' ? 'pool' : section)}
          />

        </div>

        {/* Modal para Crear Nueva Funda */}
        <SleeveInventoryFormModal
          isOpen={state.isNewSleeveModalOpen}
          onClose={() => {
            state.setIsNewSleeveModalOpen(false);
            state.setTargetSleeveSection(null);
          }}
          onSuccess={async () => {
            const sleevesRes = await fetch('/api/collection/sleeve-inventory');
            if (sleevesRes.ok) {
              const json = await sleevesRes.json();
              state.setAvailableSleeves(json.data || []);
            }
          }}
        />

      </motion.div>
    </div>
  );
};
