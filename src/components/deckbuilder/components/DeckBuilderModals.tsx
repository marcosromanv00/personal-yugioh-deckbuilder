import React from 'react';
import dynamic from 'next/dynamic';
import { DeckBuilderConfirmDialogs } from './DeckBuilderConfirmDialogs';
import { DeckBuilderVariantModals } from './variants/DeckBuilderVariantModals';
import { DeckBuilderSaveModalContainer } from './DeckBuilderSaveModalContainer';
import { BanlistWarningModal } from './BanlistWarningModal';
import { useDeckBuilderState } from '../hooks/useDeckBuilderState';
import { useDeckCardOperations } from '../hooks/useDeckCardOperations';
import { useDeckBuilderShortcuts } from '../hooks/useDeckBuilderShortcuts';
import { useDeckVariants } from '../hooks/useDeckVariants';
import { useDeckBuilderModalsState } from '../hooks/useDeckBuilderModalsState';
import { VariantDiffSummary } from '@/types/collection';

const LoadDeckModal = dynamic(() => import('./LoadDeckModal').then(m => m.LoadDeckModal), { ssr: false });
const UnregisteredCardsModal = dynamic(() => import('./UnregisteredCardsModal').then(m => m.UnregisteredCardsModal), { ssr: false });
const YdkCollectionLinkModal = dynamic(() => import('./YdkCollectionLinkModal').then(m => m.YdkCollectionLinkModal), { ssr: false });
const AICopilotModal = dynamic(() => import('../ai/AICopilotModal').then(m => m.AICopilotModal), { ssr: false });
const YdkUploadModal = dynamic(() => import('@/components/collection/YdkUploadModal').then(m => m.YdkUploadModal), { ssr: false });
const SearchCardCopyPickerModal = dynamic(() => import('./SearchCardCopyPickerModal').then(m => m.SearchCardCopyPickerModal), { ssr: false });

export interface DeckBuilderModalsProps {
  state: ReturnType<typeof useDeckBuilderState>;
  cardOps: ReturnType<typeof useDeckCardOperations>;
  shortcuts: ReturnType<typeof useDeckBuilderShortcuts>;
  variantsManager: ReturnType<typeof useDeckVariants>;
  modalsState: ReturnType<typeof useDeckBuilderModalsState>;
  variantDiff: VariantDiffSummary;
  handleQuickSaveClick: () => Promise<void>;
  toast: { success: (msg: string) => void; error: (msg: string) => void; info: (msg: string) => void };
}

export function DeckBuilderModals({
  state,
  cardOps,
  shortcuts,
  variantsManager,
  modalsState,
  variantDiff,
  handleQuickSaveClick,
  toast,
}: DeckBuilderModalsProps) {
  const activeContextName = variantsManager.activeVariant?.name || state.deckName;

  return (
    <>
      {modalsState.isAICopilotOpen && (
        <AICopilotModal
          isOpen={modalsState.isAICopilotOpen}
          onClose={() => modalsState.setIsAICopilotOpen(false)}
          currentDeckCards={state.deckCards}
          currentDeckName={state.deckName}
          format={state.format}
          onApplyDeck={cardOps.handleApplyGeneratedDeck}
        />
      )}

      <DeckBuilderConfirmDialogs
        isClearOpen={modalsState.isClearConfirmOpen}
        onConfirmClear={() => { state.handleClearDeck(); modalsState.setIsClearConfirmOpen(false); toast.info('Deck limpiado'); }}
        onCloseClear={() => modalsState.setIsClearConfirmOpen(false)}
        isDeleteOpen={modalsState.isDeleteActiveDeckConfirmOpen}
        deckName={state.deckName}
        isDeleting={modalsState.isDeletingActiveDeck}
        onConfirmDelete={modalsState.handleConfirmDeleteActiveDeck}
        onCloseDelete={() => modalsState.setIsDeleteActiveDeckConfirmOpen(false)}
        isUnsavedOpen={shortcuts.isUnsavedConfirmOpen}
        onConfirmDiscardUnsaved={() => {
          shortcuts.setIsUnsavedConfirmOpen(false);
          if (shortcuts.pendingGuardedAction) {
            const action = shortcuts.pendingGuardedAction;
            shortcuts.setPendingGuardedAction(null);
            action();
          }
        }}
        onSaveUnsaved={() => { shortcuts.setIsUnsavedConfirmOpen(false); state.handleOpenSaveModal(); }}
        onCloseUnsaved={() => { shortcuts.setIsUnsavedConfirmOpen(false); shortcuts.setPendingGuardedAction(null); }}
      />

      <YdkUploadModal
        isOpen={modalsState.isYdkUploadOpen}
        onClose={() => modalsState.setIsYdkUploadOpen(false)}
        onSuccess={() => modalsState.setIsYdkUploadOpen(false)}
        onImportToDeck={async (c) => {
          const res = await state.handleImportYdkOrBulk(c);
          toast.success('Deck cargado exitosamente desde .YDK / IDs Bulk');
          return res;
        }}
      />

      <YdkCollectionLinkModal
        isOpen={state.isCollectionLinkModalOpen}
        onClose={() => state.setIsCollectionLinkModalOpen(false)}
        parsedCards={state.pendingParsedYdkCards}
        allUserCards={state.allUserCards}
        locations={state.locations}
        onConfirm={(cardsWithCopies, unlinkedCardIds) => {
          state.confirmCollectionLinkImport(cardsWithCopies, unlinkedCardIds);
          modalsState.setIsYdkUploadOpen(false);
          toast.success('¡Baraja importada y enlazada con tu colección física con éxito!');
        }}
      />

      {state.isUnregisteredModalOpen && (
        <UnregisteredCardsModal
          isOpen={state.isUnregisteredModalOpen}
          onClose={() => state.setIsUnregisteredModalOpen(false)}
          unregisteredCards={state.unregisteredCards}
          targetLocationId={state.targetLocationId}
          selectedLaneIndex={state.selectedLaneIndex}
          locations={state.locations}
          onConfirm={async (actions) => {
            try {
              await state.handleConfirmUnregisteredSave(actions);
              toast.success(`¡"${state.deckName}" guardado y sincronizado con tu colección!`);
            } catch (e) {
              console.error('Error confirmando registro de cartas:', e);
              toast.error('Error al procesar el guardado de cartas.');
            }
          }}
          onSkipAndSave={async () => {
            try {
              await state.handleSkipUnregisteredSave();
              toast.success(`¡"${state.deckName}" guardado con éxito!`);
            } catch (e) {
              console.error('Error al guardar:', e);
              toast.error('Error al guardar la baraja.');
            }
          }}
          isSaving={state.isSavingUnregistered}
        />
      )}

      <DeckBuilderSaveModalContainer state={state} />

      {state.isLoadModalOpen && (
        <LoadDeckModal
          isOpen={state.isLoadModalOpen}
          onClose={() => state.setIsLoadModalOpen(false)}
          loadingDecks={state.loadingDecks}
          savedDecks={state.savedDecks}
          handleLoadDeck={state.handleLoadDeck}
          handleDeleteDeck={state.handleDeleteDeck}
        />
      )}

      {cardOps.dropCopyPickerState && (
        <SearchCardCopyPickerModal
          isOpen={Boolean(cardOps.dropCopyPickerState)}
          onClose={() => cardOps.setDropCopyPickerState(null)}
          card={cardOps.dropCopyPickerState.card}
          copies={cardOps.dropCopyPickerState.copies}
          locations={state.locations}
          targetSection={cardOps.dropCopyPickerState.targetSection}
          assignedDraftUserCardIds={state.assignedDraftUserCardIds}
          activeContextName={activeContextName}
          onSelectCopy={(copy) => {
            state.addCardToDeck(cardOps.dropCopyPickerState!.card, cardOps.dropCopyPickerState!.targetSection, copy);
            cardOps.setDropCopyPickerState(null);
          }}
          onSelectGeneric={() => {
            state.addCardToDeck(cardOps.dropCopyPickerState!.card, cardOps.dropCopyPickerState!.targetSection);
            cardOps.setDropCopyPickerState(null);
          }}
        />
      )}

      {cardOps.banlistWarningState && (
        <BanlistWarningModal
          isOpen={Boolean(cardOps.banlistWarningState)}
          cardName={cardOps.banlistWarningState.card.name}
          cardImageUrl={cardOps.banlistWarningState.card.image_url || cardOps.banlistWarningState.card.image_url_small}
          format={state.format}
          status={cardOps.banlistWarningState.status}
          limit={cardOps.banlistWarningState.limit}
          currentCopies={cardOps.banlistWarningState.currentCopies}
          onConfirm={() => {
            cardOps.executeAddCard(cardOps.banlistWarningState!.card, cardOps.banlistWarningState!.targetSection, cardOps.banlistWarningState!.selectedCopy);
            cardOps.setBanlistWarningState(null);
          }}
          onCancel={() => cardOps.setBanlistWarningState(null)}
        />
      )}

      <DeckBuilderVariantModals
        variantsManager={variantsManager}
        variantDiff={variantDiff}
        pendingVariantSwitch={modalsState.pendingVariantSwitch}
        setPendingVariantSwitch={modalsState.setPendingVariantSwitch}
        handleQuickSaveClick={handleQuickSaveClick}
        state={state}
        toast={toast}
      />
    </>
  );
}
