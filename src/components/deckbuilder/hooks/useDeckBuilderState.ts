import { useState, useEffect } from 'react';
import { DeckCard } from '../types';
import { RARITY_WEIGHTS, getRarityWeight, type YgoApiCardDetails } from '../types/deckBuilderState.types';
import { useDeckBuilderHistory } from './subhooks/useDeckBuilderHistory';
import { useDeckBuilderSleeves } from './subhooks/useDeckBuilderSleeves';
import { useDeckBuilderArchetypes } from './subhooks/useDeckBuilderArchetypes';
import { useDeckBuilderAnalysis } from './subhooks/useDeckBuilderAnalysis';
import { useDeckBuilderCards } from './subhooks/useDeckBuilderCards';
import { useDeckBuilderSearch } from './subhooks/useDeckBuilderSearch';
import { useDeckBuilderModals } from './subhooks/useDeckBuilderModals';
import { useDeckBuilderSaveLoad } from './subhooks/useDeckBuilderSaveLoad';

export { RARITY_WEIGHTS, getRarityWeight, type YgoApiCardDetails };

export function useDeckBuilderState() {
  const [deckCards, setDeckCards] = useState<DeckCard[]>([]);

  const history = useDeckBuilderHistory(deckCards, setDeckCards);
  const sleeves = useDeckBuilderSleeves();

  const archetypes = useDeckBuilderArchetypes({
    format: 'TCG',
    deckCards,
    setDeckCards,
    setDeckName: () => {},
    setDeckId: () => {},
  });

  const saveLoad = useDeckBuilderSaveLoad({
    deckCards,
    setDeckCards,
    selectedMainSleeveId: sleeves.selectedMainSleeveId,
    setSelectedMainSleeveId: sleeves.setSelectedMainSleeveId,
    selectedExtraSleeveId: sleeves.selectedExtraSleeveId,
    setSelectedExtraSleeveId: sleeves.setSelectedExtraSleeveId,
    mainSleeveMode: sleeves.mainSleeveMode,
    mainSleeveAddedQty: sleeves.mainSleeveAddedQty,
    extraSleeveMode: sleeves.extraSleeveMode,
    extraSleeveAddedQty: sleeves.extraSleeveAddedQty,
    setAvailableSleeves: sleeves.setAvailableSleeves,
    detectedArchetypes: [],
    setHistoryStack: history.setHistoryStack,
    setRedoStack: history.setRedoStack,
    setUnregisteredCards: () => {},
    setIsUnregisteredModalOpen: () => {},
    setIsSavingUnregistered: () => {},
    deactivatedDeckIds: [],
  });

  const analysis = useDeckBuilderAnalysis({
    deckCards,
    format: saveLoad.format,
    deckId: saveLoad.deckId,
    setDeckName: saveLoad.setDeckName,
    isManualDeckNameRef: saveLoad.isManualDeckNameRef,
    fetchSidebarBreakdown: archetypes.fetchSidebarBreakdown,
  });

  const search = useDeckBuilderSearch({
    allUserCards: saveLoad.allUserCards,
    inferredArchetype: analysis.inferredArchetype,
    deckCards,
    sidebarBreakdownCards: archetypes.sidebarBreakdownCards,
  });

  const cards = useDeckBuilderCards({
    deckCards,
    setDeckCards,
    format: saveLoad.format,
    locations: saveLoad.locations,
    allUserCards: saveLoad.allUserCards,
    searchResults: search.searchResults,
    sidebarBreakdownCards: archetypes.sidebarBreakdownCards,
    addRecentCard: search.addRecentCard,
    pushHistory: history.pushHistory,
  });

  const modals = useDeckBuilderModals({
    deckCards,
    setDeckCards,
    deckName: saveLoad.deckName,
    setDeckName: saveLoad.setDeckName,
    format: saveLoad.format,
    setDeckId: saveLoad.setDeckId,
    allUserCards: saveLoad.allUserCards,
    locations: saveLoad.locations,
    cardsToRegister: saveLoad.cardsToRegister,
    setCardsToRegister: saveLoad.setCardsToRegister,
    setRegisterToInventory: saveLoad.setRegisterToInventory,
    userInventoryCounts: saveLoad.userInventoryCounts,
    setHistoryStack: history.setHistoryStack,
    setRedoStack: history.setRedoStack,
  });

  useEffect(() => {
    saveLoad.fetchDecksAndLocations();
    archetypes.fetchArchetypes();
  }, [saveLoad.fetchDecksAndLocations, archetypes.fetchArchetypes]);

  return {
    ...saveLoad,
    ...sleeves,
    ...archetypes,
    ...analysis,
    ...search,
    ...cards,
    ...history,
    ...modals,
    deckCards,
    setDeckCards,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}
