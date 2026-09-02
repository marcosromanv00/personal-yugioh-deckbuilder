'use client';

import React, { useState, useEffect } from 'react';
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
import { SleeveInventory } from '@/types/collection';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

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

  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

  // Advertencia de recarga del navegador si hay cambios sin guardar
  useEffect(() => {
    if (!isOpen) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.isMetadataDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen, state.isMetadataDirty]);

  const handleRequestClose = (hasMutated?: boolean) => {
    if (state.isMetadataDirty) {
      setIsConfirmCloseOpen(true);
    } else {
      onClose(hasMutated ?? state.hasMutated);
    }
  };

  if (!isOpen || !state.currentDeck) return null;

  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center p-0 sm:py-2 sm:px-4 bg-black/80 overflow-hidden font-sans select-none"
      onClick={() => handleRequestClose(state.hasMutated)}
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
          onClose={() => handleRequestClose(state.hasMutated)}
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
            availableSleeves={state.availableSleeves}
            mainSleeveId={state.mainSleeveId}
            extraSleeveId={state.extraSleeveId}
            poolSleeveId={state.poolSleeveId}
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
            compartmentIndex={state.compartmentIndex}
            setCompartmentIndex={state.setCompartmentIndex}
            locations={locations}
            availableSleeves={state.availableSleeves}
            mainSleeveId={state.mainSleeveId}
            setMainSleeveId={state.setMainSleeveId}
            extraSleeveId={state.extraSleeveId}
            setExtraSleeveId={state.setExtraSleeveId}
            poolSleeveId={state.poolSleeveId}
            setPoolSleeveId={state.setPoolSleeveId}
            totalMainCount={state.totalMainCount}
            totalSideCount={state.totalSideCount}
            sideMainCount={state.sideMainCount}
            sideExtraCount={state.sideExtraCount}
            totalExtraCount={state.totalExtraCount}
            totalPoolCount={state.totalPoolCount}
            mainRequiredSleeves={state.mainRequiredSleeves}
            extraRequiredSleeves={state.extraRequiredSleeves}
            poolRequiredSleeves={state.poolRequiredSleeves}
            savingDeck={state.savingDeck}
            handleSaveDeck={state.handleSaveDeck}
            onOpenNewSleeveModal={(section, tab, sleeveId, suggestedQty, sectionTotal) => {
              state.openSleeveModal(section, tab, sleeveId, suggestedQty, sectionTotal);
            }}
            selectedPhysicalUserCards={state.selectedPhysicalUserCards}
            onChangeCardSection={state.handleChangeCardSection}
            onUpdateCardPhysicalLocation={state.handleUpdateCardPhysicalLocation}
            onUpdateUserCard={state.handleUpdateUserCard}
            onAddPhysicalCopyForCard={state.handleAddPhysicalCopyForCard}
            onDeleteUserCard={state.handleDeleteUserCard}
            onRemoveCardFromDeck={state.handleRemoveCardFromDeck}
            currentDeckId={state.currentDeck?.id}
            allUserCards={props.allUserCards && props.allUserCards.length > 0 ? props.allUserCards : state.userCards}
            deckCards={state.deckCards}
            detectedArchetypes={state.detectedArchetypes}
            inferredArchetype={state.inferredArchetype}
            savedDecks={decks}
            onAddCardToDeck={(card, section) => state.handleAddCardToDeck(card, section === 'extras' ? 'pool' : section)}
          />

        </div>

        {/* Modal para Crear o Añadir Stock a Fundas */}
        <SleeveInventoryFormModal
          isOpen={state.isNewSleeveModalOpen}
          availableSleeves={state.availableSleeves}
          initialTab={state.sleeveModalTab}
          initialSleeveId={state.sleeveModalInitialId}
          suggestedQuantity={state.sleeveModalSuggestedQty}
          sectionTotalQuantity={state.sleeveModalSectionTotal}
          onClose={() => {
            state.setIsNewSleeveModalOpen(false);
            state.setTargetSleeveSection(null);
            state.setSleeveModalInitialId(undefined);
          }}
          onSuccess={async (newOrUpdatedSleeve) => {
            const sleevesRes = await fetch('/api/collection/sleeve-inventory');
            if (sleevesRes.ok) {
              const json = await sleevesRes.json();
              const updatedList: SleeveInventory[] = json.data || [];
              state.setAvailableSleeves(updatedList);
              
              // Si se acaba de registrar una nueva funda y había una sección objetivo, auto-seleccionarla
              if (newOrUpdatedSleeve && state.targetSleeveSection) {
                if (state.targetSleeveSection === 'main_side') {
                  state.setMainSleeveId(newOrUpdatedSleeve.id);
                } else if (state.targetSleeveSection === 'extra') {
                  state.setExtraSleeveId(newOrUpdatedSleeve.id);
                } else if (state.targetSleeveSection === 'pool') {
                  state.setPoolSleeveId(newOrUpdatedSleeve.id);
                }
              }
            }
          }}
        />

        {/* Diálogo de Confirmación para Cambios No Guardados en Ficha Técnica */}
        <ConfirmDialog
          isOpen={isConfirmCloseOpen}
          title="¿Cerrar sin guardar la ficha técnica?"
          description={`Has realizado modificaciones en el nombre, formato, ubicación o fundas del mazo "${state.name || state.currentDeck.name}". ¿Deseas salir y descartar los cambios no guardados?`}
          confirmLabel="Descartar y Salir"
          cancelLabel="Continuar Editando"
          saveLabel="Guardar y Salir"
          variant="warning"
          onConfirm={() => {
            setIsConfirmCloseOpen(false);
            onClose(state.hasMutated);
          }}
          onSave={async () => {
            await state.handleSaveDeck();
            setIsConfirmCloseOpen(false);
            onClose(true);
          }}
          onClose={() => setIsConfirmCloseOpen(false)}
        />

      </motion.div>
    </div>
  );
};
