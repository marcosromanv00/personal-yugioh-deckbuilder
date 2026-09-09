'use client';

import { useState, useMemo } from 'react';
import { StorageLocation, SleeveInventory, Deck, DeckCardDetail } from '@/types/collection';
import { RightDeckMode } from './types';
import { useDeckPhysicalSync } from './useDeckPhysicalSync';
import { useDeckWorkspaceMetadata } from './hooks/useDeckWorkspaceMetadata';
import { useDeckWorkspaceSleeves } from './hooks/useDeckWorkspaceSleeves';
import { useDeckWorkspaceFilterSort } from './hooks/useDeckWorkspaceFilterSort';
import { useDeckWorkspaceSearch } from './hooks/useDeckWorkspaceSearch';
import { useDeckWorkspaceCards } from './hooks/useDeckWorkspaceCards';
import { useDeckWorkspaceRelocation } from './hooks/useDeckWorkspaceRelocation';
import { useDeckWorkspaceLoader } from './hooks/useDeckWorkspaceLoader';
import { checkMetadataDirty } from './deckWorkspace.utils';

export { isExtraDeckCardType, parseSleevesList } from './deckWorkspace.utils';

interface UseDeckWorkspaceStateProps {
  isOpen: boolean;
  onClose: (hasMutated?: boolean) => void;
  deck: Deck | null;
  decks?: Deck[];
  onSelectDeck?: (deck: Deck) => void;
  locations?: StorageLocation[];
  sleeves?: SleeveInventory[];
  onSuccess?: () => void;
}

export function useDeckWorkspaceState({
  isOpen, deck, decks = [], onSelectDeck, locations = [], sleeves = [], onSuccess,
}: UseDeckWorkspaceStateProps) {
  const meta = useDeckWorkspaceMetadata(deck, locations, onSuccess);
  const slv = useDeckWorkspaceSleeves(sleeves);
  const [deckCards, setDeckCards] = useState<DeckCardDetail[]>(deck?.cards || []);
  const [initialDeckCards, setInitialDeckCards] = useState<DeckCardDetail[]>(deck?.cards || []);
  const [rightMode, setRightMode] = useState<RightDeckMode>('details');
  const [selectedCardDetail, setSelectedCardDetail] = useState<DeckCardDetail | null>(null);

  useDeckWorkspaceLoader({
    isOpen, deck, locations, sleeves,
    setCurrentDeck: meta.setCurrentDeck, setName: meta.setName, setFormat: meta.setFormat,
    setIsActive: meta.setIsActive, setStorageLocationId: meta.setStorageLocationId,
    setCompartmentIndex: meta.setCompartmentIndex, setDeckCards, setInitialDeckCards,
    setUserCards: meta.setUserCards, setAvailableSleeves: slv.setAvailableSleeves,
    setLoading: meta.setLoading, setInitialFormState: meta.setInitialFormState,
    sleeveSetters: {
      setMainProtection: slv.setMainProtection, setMainSleeveFitId: slv.setMainSleeveFitId,
      setMainSleeveId: slv.setMainSleeveId, setMainSleeveOverId: slv.setMainSleeveOverId,
      setExtraProtection: slv.setExtraProtection, setExtraSleeveFitId: slv.setExtraSleeveFitId,
      setExtraSleeveId: slv.setExtraSleeveId, setExtraSleeveOverId: slv.setExtraSleeveOverId,
      setPoolProtection: slv.setPoolProtection, setPoolSleeveFitId: slv.setPoolSleeveFitId,
      setPoolSleeveId: slv.setPoolSleeveId, setPoolSleeveOverId: slv.setPoolSleeveOverId,
    },
  });

  const physicalSync = useDeckPhysicalSync({
    currentDeck: meta.currentDeck, deckCards, setDeckCards, userCards: meta.userCards,
    setUserCards: meta.setUserCards, setHasMutated: meta.setHasMutated,
    storageLocationId: meta.storageLocationId, compartmentIndex: meta.compartmentIndex,
    name: meta.name, format: meta.format, isActive: meta.isActive,
    sleevesPayload: slv.sleevesPayload, onSuccess, setInitialDeckCards,
  });

  const filt = useDeckWorkspaceFilterSort(deckCards, meta.currentDeck, decks, onSelectDeck);
  const srch = useDeckWorkspaceSearch({ isOpen, format: meta.format });

  const cards = useDeckWorkspaceCards({
    currentDeck: meta.currentDeck, deckCards, setDeckCards, initialDeckCards, setInitialDeckCards,
    selectedCardDetail, setSelectedCardDetail, setRightMode, userCards: meta.userCards,
    physicalSync, addRecentCard: srch.addRecentCard, setHasMutated: meta.setHasMutated,
    storageLocationId: meta.storageLocationId, compartmentIndex: meta.compartmentIndex,
    setDropCopyPickerState: srch.setDropCopyPickerState,
  });

  const relo = useDeckWorkspaceRelocation({
    currentDeck: meta.currentDeck, locations, storageLocationId: meta.storageLocationId,
    compartmentIndex: meta.compartmentIndex, deckCards, selectedCardDetail,
    mainProtection: slv.mainProtection, mainSleeveFitId: slv.mainSleeveFitId,
    mainSleeveId: slv.mainSleeveId, mainSleeveOverId: slv.mainSleeveOverId,
    extraProtection: slv.extraProtection, extraSleeveFitId: slv.extraSleeveFitId,
    extraSleeveId: slv.extraSleeveId, extraSleeveOverId: slv.extraSleeveOverId,
    poolProtection: slv.poolProtection, poolSleeveFitId: slv.poolSleeveFitId,
    poolSleeveId: slv.poolSleeveId, poolSleeveOverId: slv.poolSleeveOverId,
    availableSleeves: slv.availableSleeves, setUserCards: meta.setUserCards,
    setHasMutated: meta.setHasMutated, handleRemoveCardFromDeck: cards.handleRemoveCardFromDeck,
  });

  const isMetadataDirty = useMemo(() => {
    return checkMetadataDirty({
      name: meta.name, format: meta.format, isActive: meta.isActive,
      storageLocationId: meta.storageLocationId, compartmentIndex: meta.compartmentIndex,
      mainProtection: slv.mainProtection, mainSleeveFitId: slv.mainSleeveFitId,
      mainSleeveId: slv.mainSleeveId, mainSleeveOverId: slv.mainSleeveOverId,
      extraProtection: slv.extraProtection, poolProtection: slv.poolProtection,
      poolSleeveFitId: slv.poolSleeveFitId, poolSleeveId: slv.poolSleeveId,
      poolSleeveOverId: slv.poolSleeveOverId,
    }, meta.initialFormState);
  }, [meta, slv]);

  const selectedPhysicalUserCards = useMemo(() => {
    if (!selectedCardDetail) return [];
    return meta.userCards.filter((uc) => uc.card_id === selectedCardDetail.card_id);
  }, [meta.userCards, selectedCardDetail]);

  return {
    ...cards,
    ...relo,
    ...slv,
    ...filt,
    ...srch,
    currentDeck: meta.currentDeck, deckCards, userCards: meta.userCards, setUserCards: meta.setUserCards,
    loading: meta.loading, hasMutated: meta.hasMutated, setHasMutated: meta.setHasMutated,
    name: meta.name, setName: meta.setName, format: meta.format, setFormat: meta.setFormat,
    isActive: meta.isActive, setIsActive: meta.setIsActive, storageLocationId: meta.storageLocationId,
    setStorageLocationId: meta.setStorageLocationId, compartmentIndex: meta.compartmentIndex,
    setCompartmentIndex: meta.setCompartmentIndex,
    savingDeck: meta.savingDeck || physicalSync.isSavingSync,
    handleSaveDeck: physicalSync.handleTriggerSave,
    isMetadataDirty,
    savingDeckCards: cards.savingDeckCards || physicalSync.isSavingSync,
    handleSaveDeckCards: physicalSync.handleTriggerSave,
    rightMode, setRightMode, selectedCardDetail, setSelectedCardDetail,
    selectedPhysicalUserCards,
    assignedUserCardIds: physicalSync.assignedUserCardIds,
    unassignedUserCardIds: physicalSync.unassignedUserCardIds,
    assignDrawerSection: physicalSync.assignDrawerSection,
    setAssignDrawerSection: physicalSync.setAssignDrawerSection,
    isSyncModalOpen: physicalSync.isSyncModalOpen,
    setIsSyncModalOpen: physicalSync.setIsSyncModalOpen,
    isSavingSync: physicalSync.isSavingSync,
    stageAssignUserCard: physicalSync.stageAssignUserCard,
    stageUnassignUserCard: physicalSync.stageUnassignUserCard,
    mainPhysicalCount: physicalSync.mainPhysicalCount,
    mainPendingCount: physicalSync.mainPendingCount,
    extraPhysicalCount: physicalSync.extraPhysicalCount,
    extraPendingCount: physicalSync.extraPendingCount,
    sidePhysicalCount: physicalSync.sidePhysicalCount,
    sidePendingCount: physicalSync.sidePendingCount,
    poolPhysicalCount: physicalSync.poolPhysicalCount,
    poolPendingCount: physicalSync.poolPendingCount,
    totalPendingCount: physicalSync.totalPendingCount,
    pendingCardsForDrawer: physicalSync.pendingCardsForDrawer,
    allPendingCards: physicalSync.allPendingCards,
    unassignedUserCards: physicalSync.unassignedUserCards,
    executeAtomicSave: physicalSync.executeAtomicSave,
    handleTriggerSave: physicalSync.handleTriggerSave,
  };
}
