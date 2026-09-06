import React from 'react';
import dynamic from 'next/dynamic';
import { SaveDeckModalSkeleton } from './SaveDeckModalSkeleton';
import { useDeckBuilderState } from '../hooks/useDeckBuilderState';

const SaveDeckModal = dynamic(() => import('./SaveDeckModal').then(m => m.SaveDeckModal), {
  ssr: false,
  loading: () => <SaveDeckModalSkeleton />,
});

interface DeckBuilderSaveModalContainerProps {
  state: ReturnType<typeof useDeckBuilderState>;
}

export function DeckBuilderSaveModalContainer({ state }: DeckBuilderSaveModalContainerProps) {
  if (!state.isSaveModalOpen) return null;

  return (
    <SaveDeckModal
      isOpen={state.isSaveModalOpen}
      onClose={() => state.setIsSaveModalOpen(false)}
      deckName={state.deckName}
      setDeckName={state.setDeckName}
      deckDescription={state.deckDescription}
      setDeckDescription={state.setDeckDescription}
      saveFormat={state.saveFormat}
      setSaveFormat={state.setSaveFormat}
      saveIsActive={state.saveIsActive}
      setSaveIsActive={state.setSaveIsActive}
      deckCards={state.deckCards}
      loadingDecks={state.loadingDecks}
      locations={state.locations}
      userInventoryCounts={state.userInventoryCounts}
      registerToInventory={state.registerToInventory}
      setRegisterToInventory={state.setRegisterToInventory}
      targetLocationId={state.targetLocationId}
      setTargetLocationId={state.setTargetLocationId}
      selectedLaneIndex={state.selectedLaneIndex}
      setSelectedLaneIndex={state.setSelectedLaneIndex}
      cardsToRegister={state.cardsToRegister}
      setCardsToRegister={state.setCardsToRegister}
      availableSleeves={state.availableSleeves}
      selectedMainSleeveId={state.selectedMainSleeveId}
      setSelectedMainSleeveId={state.setSelectedMainSleeveId}
      mainSleeveMode={state.mainSleeveMode}
      setMainSleeveMode={state.setMainSleeveMode}
      mainSleeveAddedQty={state.mainSleeveAddedQty}
      setMainSleeveAddedQty={state.setMainSleeveAddedQty}
      selectedExtraSleeveId={state.selectedExtraSleeveId}
      setSelectedExtraSleeveId={state.setSelectedExtraSleeveId}
      extraSleeveMode={state.extraSleeveMode}
      setExtraSleeveMode={state.setExtraSleeveMode}
      extraSleeveAddedQty={state.extraSleeveAddedQty}
      setExtraSleeveAddedQty={state.setExtraSleeveAddedQty}
      handleSaveDeck={state.handleSaveDeck}
      handleExcludeExisting={state.handleExcludeExisting}
      extractionPickList={state.extractionPickList}
    />
  );
}
