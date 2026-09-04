'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePanelResize } from '@/components/deckbuilder/hooks/usePanelResize';
import { SearchPanel } from '@/components/deckbuilder/components/SearchPanel';
import { SleeveInventoryFormModal } from './SleeveInventoryFormModal';
import { RegisterCardSleeveModal } from './RegisterCardSleeveModal';
import { UniversalDeckWorkspaceModalProps } from './deck-workspace/types';
import { useDeckWorkspaceState } from './deck-workspace/useDeckWorkspaceState';
import { DeckWorkspaceHeader } from './deck-workspace/DeckWorkspaceHeader';
import { DeckCenterPanel } from './deck-workspace/DeckCenterPanel';
import { DeckInspectorPanel } from './deck-workspace/DeckInspectorPanel';
import { Card } from '@/components/deckbuilder/types';
import { SleeveInventory, UserCard } from '@/types/collection';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RelocateDeckCardModal } from './deck-workspace/RelocateDeckCardModal';

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
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);
  const [registerSleeveUserCard, setRegisterSleeveUserCard] = useState<UserCard | null>(null);
  const [isRegisterSleeveModalOpen, setIsRegisterSleeveModalOpen] = useState(false);

  const isDirty = state.isMetadataDirty || state.isDeckListDirty;

  // Advertencia de recarga del navegador si hay cambios sin guardar
  useEffect(() => {
    if (!isOpen) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen, isDirty]);

  const handleRequestClose = (hasMutated?: boolean) => {
    if (isDirty) {
      setIsConfirmCloseOpen(true);
    } else {
      onClose(hasMutated ?? state.hasMutated);
    }
  };

  const handleExecuteDeleteDeck = async () => {
    if (!state.currentDeck || !props.handleDeleteDeck) return;
    setIsDeletingDeck(true);
    try {
      const ok = await props.handleDeleteDeck(state.currentDeck.id);
      if (ok !== false) {
        setIsConfirmDeleteOpen(false);
        onClose(true);
      }
    } finally {
      setIsDeletingDeck(false);
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
          onDeleteDeck={props.handleDeleteDeck ? () => setIsConfirmDeleteOpen(true) : undefined}
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
                addCardToDeck={(card, targetSec) => state.handleAddCardToDeck(card as Card, targetSec || (state.sectionFilter !== 'all' ? state.sectionFilter : undefined))}
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
                handleDragCardStart={state.handleDragCardStart}
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
            handleDragCardStart={state.handleDragCardStart}
            handleDropCardOnSection={state.handleDropCardOnSection}
            isDeckListDirty={state.isDeckListDirty}
            savingDeckCards={state.savingDeckCards}
            onSaveDeckCards={state.handleSaveDeckCards}
            onDiscardDeckCards={state.handleDiscardDeckCards}
            loading={state.loading}
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

            mainProtection={state.mainProtection}
            setMainProtection={state.setMainProtection}
            mainSleeveFitId={state.mainSleeveFitId}
            setMainSleeveFitId={state.setMainSleeveFitId}
            mainSleeveId={state.mainSleeveId}
            setMainSleeveId={state.setMainSleeveId}
            mainSleeveOverId={state.mainSleeveOverId}
            setMainSleeveOverId={state.setMainSleeveOverId}

            extraProtection={state.extraProtection}
            setExtraProtection={state.setExtraProtection}
            extraSleeveFitId={state.extraSleeveFitId}
            setExtraSleeveFitId={state.setExtraSleeveFitId}
            extraSleeveId={state.extraSleeveId}
            setExtraSleeveId={state.setExtraSleeveId}
            extraSleeveOverId={state.extraSleeveOverId}
            setExtraSleeveOverId={state.setExtraSleeveOverId}

            poolProtection={state.poolProtection}
            setPoolProtection={state.setPoolProtection}
            poolSleeveFitId={state.poolSleeveFitId}
            setPoolSleeveFitId={state.setPoolSleeveFitId}
            poolSleeveId={state.poolSleeveId}
            setPoolSleeveId={state.setPoolSleeveId}
            poolSleeveOverId={state.poolSleeveOverId}
            setPoolSleeveOverId={state.setPoolSleeveOverId}

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
            onOpenNewSleeveModal={(section, tab, sleeveId, suggestedQty, sectionTotal, initialCategory) => {
              state.openSleeveModal(section, tab, sleeveId, suggestedQty, sectionTotal, initialCategory);
            }}
            selectedPhysicalUserCards={state.selectedPhysicalUserCards}
            onChangeCardSection={state.handleChangeCardSection}
            onUpdateCardPhysicalLocation={state.handleUpdateCardPhysicalLocation}
            onRequestRelocateCard={state.handleRequestRelocateCard}
            onUpdateUserCard={state.handleUpdateUserCard}
            onAddPhysicalCopyForCard={state.handleAddPhysicalCopyForCard}
            onDeleteUserCard={state.handleDeleteUserCard}
            onRemoveCardFromDeck={state.handleRemoveCardFromDeck}
            onOpenRegisterSleeveForCard={(uc) => {
              setRegisterSleeveUserCard(uc);
              setIsRegisterSleeveModalOpen(true);
            }}
            currentDeckId={state.currentDeck?.id}
            allUserCards={props.allUserCards && props.allUserCards.length > 0 ? props.allUserCards : state.userCards}
            deckCards={state.deckCards}
            detectedArchetypes={state.detectedArchetypes}
            inferredArchetype={state.inferredArchetype}
            savedDecks={decks}
            onAddCardToDeck={(card, section) => state.handleAddCardToDeck(card, section === 'extras' ? 'pool' : section)}
          />

        </div>

        {/* Modal para Registrar o Sumar Funda desde Copia Física */}
        <RegisterCardSleeveModal
          isOpen={isRegisterSleeveModalOpen}
          onClose={() => {
            setIsRegisterSleeveModalOpen(false);
            setRegisterSleeveUserCard(null);
          }}
          userCard={registerSleeveUserCard}
          cardDetail={state.selectedCardDetail}
          availableSleeves={state.availableSleeves}
          onSleeveUpdatedOrCreated={async () => {
            const [sRes, cRes] = await Promise.all([
              fetch('/api/collection/sleeve-inventory'),
              fetch('/api/collection/cards')
            ]);
            if (sRes.ok) {
              const sJson = await sRes.json();
              state.setAvailableSleeves(sJson.data || []);
            }
            if (cRes.ok) {
              const cJson = await cRes.json();
              state.setUserCards(cJson.data || []);
            }
          }}
          onOpenCreateSleeveModal={() => {
            state.openSleeveModal('main_side', 'create', undefined, 1, 1);
          }}
        />

        {/* Modal para Crear o Añadir Stock a Fundas */}
        <SleeveInventoryFormModal
          isOpen={state.isNewSleeveModalOpen}
          availableSleeves={state.availableSleeves}
          initialTab={state.sleeveModalTab}
          initialSleeveId={state.sleeveModalInitialId}
          initialCategory={state.sleeveModalInitialCategory}
          suggestedQuantity={state.sleeveModalSuggestedQty}
          sectionTotalQuantity={state.sleeveModalSectionTotal}
          onClose={() => {
            state.setIsNewSleeveModalOpen(false);
            state.setTargetSleeveSection(null);
            state.setSleeveModalInitialId(undefined);
            state.setSleeveModalInitialCategory(undefined);
          }}
          onSuccess={async (newOrUpdatedSleeve) => {
            const sleevesRes = await fetch('/api/collection/sleeve-inventory');
            if (sleevesRes.ok) {
              const json = await sleevesRes.json();
              const updatedList: SleeveInventory[] = json.data || [];
              state.setAvailableSleeves(updatedList);
              
              // Si se acaba de registrar una nueva funda y había una sección objetivo, auto-seleccionarla según su categoría
              if (newOrUpdatedSleeve && state.targetSleeveSection) {
                const cat = newOrUpdatedSleeve.category || 'regular';
                if (state.targetSleeveSection === 'main_side') {
                  if (cat === 'fit') state.setMainSleeveFitId(newOrUpdatedSleeve.id);
                  else if (cat === 'over') state.setMainSleeveOverId(newOrUpdatedSleeve.id);
                  else state.setMainSleeveId(newOrUpdatedSleeve.id);
                } else if (state.targetSleeveSection === 'extra') {
                  if (cat === 'fit') state.setExtraSleeveFitId(newOrUpdatedSleeve.id);
                  else if (cat === 'over') state.setExtraSleeveOverId(newOrUpdatedSleeve.id);
                  else state.setExtraSleeveId(newOrUpdatedSleeve.id);
                } else if (state.targetSleeveSection === 'pool') {
                  if (cat === 'fit') state.setPoolSleeveFitId(newOrUpdatedSleeve.id);
                  else if (cat === 'over') state.setPoolSleeveOverId(newOrUpdatedSleeve.id);
                  else state.setPoolSleeveId(newOrUpdatedSleeve.id);
                }
              }
            }
          }}
        />

        {/* Modal de Confirmación para Reubicación y Desvinculación de Cartas */}
        {state.pendingRelocation && (
          <RelocateDeckCardModal
            isOpen={Boolean(state.pendingRelocation)}
            onClose={state.handleCancelRelocate}
            cardId={state.pendingRelocation.userCard.card_id}
            cardName={state.pendingRelocation.userCard.card_details?.name || state.selectedCardDetail?.card_details?.name || `Carta #${state.pendingRelocation.userCard.card_id}`}
            cardImageUrl={state.pendingRelocation.userCard.card_details?.image_url || state.selectedCardDetail?.card_details?.image_url}
            quantity={state.pendingRelocation.userCard.quantity || 1}
            deckName={state.currentDeck?.name || 'Mazo Actual'}
            deckSection={state.selectedCardDetail?.section || state.pendingRelocation.userCard.deck_section || 'Main'}
            targetLocationName={state.pendingRelocation.targetLocationName}
            onConfirmRemoveFromDeck={state.handleConfirmRelocateAndRemoveFromDeck}
            onConfirmKeepInDeck={state.handleConfirmRelocateOnly}
            loading={state.relocatingLoading}
          />
        )}

        {/* Diálogo de Confirmación para Cambios No Guardados en Ficha Técnica o Lista de Cartas */}
        <ConfirmDialog
          isOpen={isConfirmCloseOpen}
          title="¿Cerrar sin guardar los cambios del mazo?"
          description={`Has realizado modificaciones en la lista de cartas o configuración técnica del mazo "${state.name || state.currentDeck.name}". ¿Deseas salir y descartar los cambios no guardados?`}
          confirmLabel="Descartar y Salir"
          cancelLabel="Continuar Editando"
          saveLabel="Guardar Todo y Salir"
          variant="warning"
          onConfirm={() => {
            setIsConfirmCloseOpen(false);
            onClose(state.hasMutated);
          }}
          onSave={async () => {
            if (state.isMetadataDirty) {
              await state.handleSaveDeck();
            }
            if (state.isDeckListDirty) {
              await state.handleSaveDeckCards();
            }
            setIsConfirmCloseOpen(false);
            onClose(true);
          }}
          onClose={() => setIsConfirmCloseOpen(false)}
        />

        {/* Diálogo de Confirmación para Eliminar Baraja Completa */}
        <ConfirmDialog
          isOpen={isConfirmDeleteOpen}
          title="¿Eliminar esta baraja?"
          description={`¿Estás seguro de que deseas eliminar la baraja "${state.name || state.currentDeck.name}"? Las cartas físicas que contiene permanecerán intactas en tu colección general.`}
          confirmLabel="Eliminar Baraja"
          cancelLabel="Cancelar"
          variant="danger"
          isLoading={isDeletingDeck}
          onConfirm={handleExecuteDeleteDeck}
          onClose={() => setIsConfirmDeleteOpen(false)}
        />

      </motion.div>
    </div>
  );
};
