'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/ui/ThemeProvider';
import { usePanelResize } from '@/components/deckbuilder/hooks/usePanelResize';
import { SearchPanel } from '@/components/deckbuilder/components/SearchPanel';
import { PhysicalCardPickerModal } from './PhysicalCardPickerModal';
import { PickListConsolidationModal } from './PickListConsolidationModal';
import { UniversalContainerWorkspaceModalProps } from './workspace/types';
import { useContainerWorkspaceState } from './workspace/useContainerWorkspaceState';
import { ContainerWorkspaceHeader } from './workspace/ContainerWorkspaceHeader';
import { ContainerCenterPanel } from './workspace/ContainerCenterPanel';
import { ContainerInspectorPanel } from './workspace/ContainerInspectorPanel';
import { ContainerDeckAssignmentModal } from './workspace/ContainerDeckAssignmentModal';
import { BulkActionsFloatingBar } from './BulkActionsFloatingBar';
import { CardCopySplitModal } from './CardCopySplitModal';
import { VariantMoveModal } from './VariantMoveModal';
import { Card } from '@/components/deckbuilder/types';

const UniversalContainerWorkspaceInner: React.FC<UniversalContainerWorkspaceModalProps> = (props) => {
  const {
    isOpen,
    onClose,
    location,
    locations = [],
    onSelectLocation,
    decks = [],
    allCollectionCards = [],
    onMutate,
  } = props;

  const { theme } = useTheme();
  const panelResize = usePanelResize(422, 384);

  const state = useContainerWorkspaceState({
    isOpen,
    onClose,
    location,
    locations,
    onSelectLocation,
    decks,
    allCollectionCards,
    onMutate,
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:py-4 sm:px-12 bg-black/80 backdrop-blur-md overflow-hidden font-sans select-none"
      onClick={() => onClose(state.hasMutated)}
    >
      {/* VENTANA FLOTANTE — hereda tema del sistema con ancho responsivo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className={`${theme === 'dark' ? 'dark' : ''} w-full sm:max-w-[82vw] xl:max-w-360 2xl:max-w-380 h-dvh sm:h-[92vh] sm:max-h-240 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative z-10 select-auto text-zinc-900 dark:text-zinc-100`}
      >
        {/* ═══ CABECERA SUPERIOR Y NAVEGACIÓN ENTRE CONTENEDORES ═══ */}
        <ContainerWorkspaceHeader
          location={location}
          isInbox={state.isInbox}
          containerType={state.containerType}
          totalPhysicalCards={state.totalPhysicalCards}
          displayedGridCardsCount={state.displayedGridCards.length}
          hasMutated={state.hasMutated}
          onClose={onClose}
          mobileTab={state.mobileTab}
          setMobileTab={state.setMobileTab}
          cardsCount={state.cards.length}
          prevContainer={state.prevContainer}
          nextContainer={state.nextContainer}
          handleNavigatePrev={state.handleNavigatePrev}
          handleNavigateNext={state.handleNavigateNext}
        />

        {/* ═══ CUERPO PRINCIPAL DE 3 PANELES ═══ */}
        <div className="flex-1 flex overflow-hidden relative">

          {/* ─── PANEL IZQUIERDO: BUSCADOR & IMPORTADOR ─── */}
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
                showStagedTab={state.containerType === 'binder'}
                stagedCardsCount={state.cards.filter(c => !c.binder_page || !c.binder_slot).length}
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
                format="Master Duel"
                addCardToDeck={(card) => {
                  if (state.containerType === 'binder') {
                    state.setSelectedSearchCard(card);
                  } else {
                    state.handleAddCardToContainer(card);
                  }
                }}
                openPreviewForCard={(card) => {
                  const existing = state.cards.find(c => c.card_id === card.id);
                  if (existing) {
                    state.setSelectedUserCard(existing);
                  } else {
                    state.handleAddCardToContainer(card);
                  }
                  if (state.isMobile) state.setMobileTab('right');
                }}
                handleDragCardStart={(e, cardData) => state.handleDragCardStart(e, cardData as Card)}
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

          {/* ─── PANEL CENTRAL: VISUALIZADOR DE CONTENEDOR ─── */}
          <ContainerCenterPanel
            containerType={state.containerType}
            isInbox={state.isInbox}
            location={location}
            currentLocation={state.currentLocation}
            cards={state.cards}
            loading={state.loading}
            mobileTab={state.mobileTab}
            setMobileTab={state.setMobileTab}
            isMobile={state.isMobile}
            isDragOverCenter={state.isDragOverCenter}
            setIsDragOverCenter={state.setIsDragOverCenter}
            dragOverSlot={state.dragOverSlot}
            setDragOverSlot={state.setDragOverSlot}
            draggedCard={state.draggedCard}
            handleDropCardToBox={state.handleDropCardToBox}
            handleDropCardToBinderSlot={state.handleDropCardToBinderSlot}
            containerSearch={state.containerSearch}
            setContainerSearch={state.setContainerSearch}
            totalPhysicalCards={state.totalPhysicalCards}
            activeCompartment={state.activeCompartment}
            handleSelectCompartment={state.handleSelectCompartment}
            setActiveClusterFilter={state.setActiveClusterFilter}
            decksInContainer={state.decksInContainer}
            decksInActiveLane={state.decksInActiveLane}
            selectedDeckFilter={state.selectedDeckFilter}
            setSelectedDeckFilter={state.setSelectedDeckFilter}
            statusFilter={state.statusFilter}
            setStatusFilter={state.setStatusFilter}
            sortBy={state.sortBy}
            setSortBy={state.setSortBy}
            displayedGridCards={state.displayedGridCards}
            filteredCards={state.filteredCards}
            onOpenAssignDeckModal={() => {
              state.setAssignCompartmentIdx(state.activeCompartment === -1 ? 0 : state.activeCompartment);
              state.setIsAssignDeckModalOpen(true);
            }}
            selectedSearchCard={state.selectedSearchCard}
            setSelectedSearchCard={state.setSelectedSearchCard}
            selectedUserCard={state.selectedUserCard}
            setSelectedUserCard={state.setSelectedUserCard}
            handleAddCardToContainer={state.handleAddCardToContainer}
            paginatedGridCards={state.paginatedGridCards}
            currentGridPage={state.currentGridPage}
            setCurrentGridPage={state.setCurrentGridPage}
            totalGridPages={state.totalGridPages}
            rows={state.rows}
            cols={state.cols}
            pocketsPerPage={state.pocketsPerPage}
            leftPageNum={state.leftPageNum}
            rightPageNum={state.rightPageNum}
            leftPageCards={state.leftPageCards}
            rightPageCards={state.rightPageCards}
            currentBinderViewIndex={state.currentBinderViewIndex}
            setCurrentBinderViewIndex={state.setCurrentBinderViewIndex}
            totalBinderViews={state.totalBinderViews}
            isSelectMode={state.isSelectMode}
            setIsSelectMode={state.setIsSelectMode}
            selectedCardIds={state.selectedCardIds}
            onSelectAll={() => state.selectAllFilteredCards(state.filteredCards)}
            onClearSelection={state.clearCardSelection}
            onToggleSelectGroup={state.toggleSelectGroup}
            onToggleSelectCard={state.toggleSelectCard}
            duplicateMap={state.crossContainerDuplicatesMap}
            onOpenConsolidate={(cardId) => {
              const card = state.cards.find(c => c.card_id === cardId);
              if (card) state.handleOpenSplitModal(card);
            }}
          />

          {/* DIVIDER REDIMENSIONABLE DERECHO */}
          {!state.isMobile && (
            <div
              onMouseDown={panelResize.startResizeRight}
              className="w-1.5 hover:w-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-red-500 dark:hover:bg-red-500 cursor-col-resize self-stretch shrink-0 transition-all z-30 opacity-70 hover:opacity-100"
              title="Arrastra para cambiar el ancho del panel derecho"
            />
          )}

          {/* ─── PANEL DERECHO: INSPECTOR Y ASISTENTE IA ─── */}
          <ContainerInspectorPanel
            rightPanelWidth={panelResize.rightPanelWidth}
            isMobile={state.isMobile}
            mobileTab={state.mobileTab}
            rightMode={state.rightMode}
            setRightMode={state.setRightMode}
            aiSubView={state.aiSubView}
            setAiSubView={state.setAiSubView}
            selectedUserCard={state.selectedUserCard}
            setSelectedUserCard={state.setSelectedUserCard}
            locations={locations}
            location={location}
            currentLocation={state.currentLocation}
            internalDecks={state.internalDecks}
            activeCompartment={state.activeCompartment}
            activeLaneCards={state.cards.filter(c => state.activeCompartment === -1 || (c.compartment_index || 0) === state.activeCompartment)}
            totalCollectionCount={state.allCollectionCards.length || state.cards.length}
            lanePatternReport={state.lanePatternReport}
            classificationReport={state.classificationReport}
            globalCollectionReport={state.globalCollectionReport}
            allDispersedCards={state.allDispersedCards}
            currentCardDispersedInfo={state.currentCardDispersedInfo}
            activeClusterFilter={state.activeClusterFilter}
            setActiveClusterFilter={state.setActiveClusterFilter}
            expandedClusterSubId={state.expandedClusterSubId}
            setExpandedClusterSubId={state.setExpandedClusterSubId}
            onOpenAssignDeckModal={state.handleOpenAssignDeckModal}
            onOpenPickListForCluster={(cluster, title, subtitle) => {
              state.setSelectedClusterForPickList(cluster);
              state.setSelectedDispersedForPickList(null);
              state.setPickListTitle(title);
              state.setPickListSubtitle(subtitle);
              state.setIsPickListOpen(true);
            }}
            onOpenPickListForSubArchetype={(sub) => {
              state.setSelectedClusterForPickList({
                id: sub.id,
                name: `Sub-Arquetipo: ${sub.archetypeName}`,
                archetypeName: sub.archetypeName,
                category: 'archetype',
                count: sub.count,
                uniqueCount: sub.uniqueCount,
                percentage: 0,
                color: 'purple',
                cardIds: sub.cardIds,
                userCardIds: sub.userCardIds,
                description: `${sub.count} cartas (${sub.uniqueCount} únicas) del sub-arquetipo ${sub.archetypeName}.`,
              });
              state.setSelectedDispersedForPickList(null);
              state.setPickListTitle(`Ruta: ${sub.archetypeName}`);
              state.setPickListSubtitle(`${sub.count} cartas físicas (${sub.uniqueCount} únicas)`);
              state.setIsPickListOpen(true);
            }}
            onOpenPickListForDispersed={(disp) => {
              const allCardsForDisp = (state.allCollectionCards.length > 0 ? state.allCollectionCards : state.cards).filter(c => c.card_id === disp.cardId);
              state.setSelectedDispersedForPickList(allCardsForDisp);
              state.setSelectedClusterForPickList(null);
              state.setPickListTitle(`Reunir ${disp.cardName}`);
              state.setPickListSubtitle(`Consolidar las ${disp.totalCopies} copias divididas en ${disp.distinctLocationsCount} ubicaciones.`);
              state.setIsPickListOpen(true);
            }}
            onOpenPickListForCard={() => {
              if (!state.selectedUserCard || !state.currentCardDispersedInfo) return;
              const allCardsForThis = (state.allCollectionCards.length > 0 ? state.allCollectionCards : state.cards).filter(c => c.card_id === state.selectedUserCard!.card_id);
              state.setSelectedDispersedForPickList(allCardsForThis);
              state.setSelectedClusterForPickList(null);
              state.setPickListTitle(`Reunir: ${state.selectedUserCard.card_details?.name || 'Carta'}`);
              state.setPickListSubtitle(`Consolida las ${state.currentCardDispersedInfo.totalCopies} copias de esta carta en una sola ubicación.`);
              state.setIsPickListOpen(true);
            }}
            onMoveMisplacedCard={async (userCardId, suggestedLocationId) => {
              if (!suggestedLocationId) return;
              try {
                await fetch('/api/collection/cards', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: userCardId,
                    storage_location_id: suggestedLocationId,
                    status_flag: 'collection'
                  })
                });
                state.setCards(prev => prev.filter(c => c.id !== userCardId));
                state.setHasMutated(true);
              } catch (err) {
                console.error(err);
              }
            }}
            onApplyRecommendation={state.handleApplyRecommendation}
            onAssignToDeck={state.handleAssignToDeck}
            detailsCopiesMode={state.detailsCopiesMode}
            setDetailsCopiesMode={state.setDetailsCopiesMode}
            isVariantsExpanded={state.isVariantsExpanded}
            setIsVariantsExpanded={state.setIsVariantsExpanded}
            activeVariants={state.activeVariants}
            totalCopiesInContainer={state.totalCopiesInContainer}
            onUpdateVariantById={state.handleUpdateVariantById}
            onDeleteVariantById={state.handleDeleteVariantById}
            onAddNewVariant={state.handleAddNewVariant}
            onUpdateCard={state.handleUpdateCard}
            onMoveCard={state.handleMoveCard}
            onDeleteCard={state.handleDeleteCard}
            onOpenSplitModal={state.handleOpenSplitModal}
            onOpenMoveVariantModal={state.handleOpenMoveVariantModal}
            onSendToStaged={state.handleSendToStaged}
          />
        </div>

        {/* Modal de Selección de Copias Físicas */}
        <PhysicalCardPickerModal
          isOpen={state.isPickerOpen}
          onClose={() => {
            state.setIsPickerOpen(false);
            state.setPickerCard(null);
            state.setPickerUserCards([]);
            state.setPendingBinderTarget(null);
          }}
          card={state.pickerCard}
          userCards={state.pickerUserCards}
          targetContainerName={state.isInbox ? 'Sin Clasificar (Inbox)' : location?.name}
          onSelectCopy={(uc, action) => {
            state.handleSelectPhysicalCopy(
              uc,
              action,
              state.pendingBinderTarget?.page,
              state.pendingBinderTarget?.slot
            );
          }}
        />

        {/* Modal para Mover Variante Individual a Otro Contenedor */}
        <VariantMoveModal
          isOpen={state.isMoveVariantModalOpen}
          onClose={state.handleCloseMoveVariantModal}
          variant={state.variantToMove}
          locations={locations}
          currentLocation={state.currentLocation}
          onConfirmMove={state.handleConfirmMoveVariant}
        />

        {/* Modal para Gestión de Mazos y Carriles */}
        <ContainerDeckAssignmentModal
          isOpen={state.isAssignDeckModalOpen}
          onClose={() => state.setIsAssignDeckModalOpen(false)}
          currentLocation={state.currentLocation}
          location={location}
          locations={locations}
          decksInContainer={state.decksInContainer}
          cards={state.cards}
          internalDecks={state.internalDecks}
          assignCompartmentIdx={state.assignCompartmentIdx}
          setAssignCompartmentIdx={state.setAssignCompartmentIdx}
          selectedDeckIdToAssign={state.selectedDeckIdToAssign}
          setSelectedDeckIdToAssign={state.setSelectedDeckIdToAssign}
          shouldMoveCardsOnAssign={state.shouldMoveCardsOnAssign}
          setShouldMoveCardsOnAssign={state.setShouldMoveCardsOnAssign}
          isAssigningDeck={state.isAssigningDeck}
          onSaveDeckAssignment={state.handleSaveDeckAssignment}
          onMoveDeckCards={state.handleMoveDeckCards}
        />

        {/* Modal de Ruta de Recolección (Pick-List) Interactiva */}
        <PickListConsolidationModal
          isOpen={state.isPickListOpen}
          onClose={() => {
            state.setIsPickListOpen(false);
            state.setSelectedClusterForPickList(null);
            state.setSelectedDispersedForPickList(null);
          }}
          cluster={state.selectedClusterForPickList}
          selectedCards={state.selectedDispersedForPickList || undefined}
          title={state.pickListTitle}
          subtitle={state.pickListSubtitle}
          allCollectionCards={state.allCollectionCards.length > 0 ? state.allCollectionCards : (allCollectionCards.length > 0 ? allCollectionCards : state.cards)}
          locations={locations}
          defaultTargetLocationId={state.isInbox ? 'inbox' : location?.id}
          defaultTargetCompartmentIndex={state.activeCompartment === -1 ? 0 : state.activeCompartment}
          onSuccess={() => {
            state.setHasMutated(true);
            state.fetchCards();
            fetch('/api/collection/cards')
              .then(res => res.json())
              .then(json => {
                if (json.data) state.setAllCollectionCards(json.data);
              })
              .catch(console.warn);
          }}
        />

        {/* Modal de Separar Copia Individual */}
        <CardCopySplitModal
          isOpen={state.isSplitModalOpen}
          onClose={state.handleCloseSplitModal}
          userCard={state.cardToSplit}
          onConfirmSplit={state.handleSplitCopies}
        />

        {/* Barra Flotante de Acciones en Bloque */}
        <BulkActionsFloatingBar
          selectedCount={state.selectedCardsCount}
          totalPhysicalCount={state.selectedPhysicalCount}
          locations={locations}
          currentLocationId={location?.id || null}
          onClearSelection={state.clearCardSelection}
          onMove={state.handleBulkMove}
          onChangeStatus={state.handleBulkChangeStatus}
          onChangeCondition={state.handleBulkChangeCondition}
          onDelete={state.handleBulkDelete}
          onSplitSingleCard={() => state.handleOpenSplitModal()}
          canSplitSingleCard={state.canSplitSingleCard}
        />

      </motion.div>
    </div>
  );
};

export const UniversalContainerWorkspaceModal: React.FC<UniversalContainerWorkspaceModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <UniversalContainerWorkspaceInner key={props.location?.id || 'inbox'} {...props} />;
};
