import { useRef, useCallback, useMemo } from 'react';
import { DeckCard } from '../../types';
import { buildDeckSnapshot } from '../../deckBuilder.utils';
import { UnregisteredAction, UnregisteredCardItem } from '../../components/UnregisteredCardsModal';
import { useDeckBuilderSaveLoadState } from './useDeckBuilderSaveLoadState';
import { useDeckBuilderSaveLoadActions } from './useDeckBuilderSaveLoadActions';

interface UseDeckBuilderSaveLoadParams {
  deckCards: DeckCard[];
  setDeckCards: React.Dispatch<React.SetStateAction<DeckCard[]>>;
  selectedMainSleeveId: string;
  setSelectedMainSleeveId: (id: string) => void;
  selectedExtraSleeveId: string;
  setSelectedExtraSleeveId: (id: string) => void;
  mainSleeveMode: 'take' | 'add';
  mainSleeveAddedQty: number;
  extraSleeveMode: 'take' | 'add';
  extraSleeveAddedQty: number;
  setAvailableSleeves: React.Dispatch<React.SetStateAction<import('@/types/collection').SleeveInventory[]>>;
  detectedArchetypes: { name: string; count: number }[];
  setHistoryStack: React.Dispatch<React.SetStateAction<DeckCard[][]>>;
  setRedoStack: React.Dispatch<React.SetStateAction<DeckCard[][]>>;
  setUnregisteredCards: (cards: UnregisteredCardItem[]) => void;
  setIsUnregisteredModalOpen: (open: boolean) => void;
  setIsSavingUnregistered: (saving: boolean) => void;
  deactivatedDeckIds: string[];
}

export function useDeckBuilderSaveLoad(params: UseDeckBuilderSaveLoadParams) {
  const { deckCards, setDeckCards, selectedMainSleeveId, selectedExtraSleeveId, setAvailableSleeves } = params;
  const lastSavedDeckCardsRef = useRef<DeckCard[]>([]);

  const state = useDeckBuilderSaveLoadState(
    setAvailableSleeves,
    params.setSelectedMainSleeveId,
    params.setSelectedExtraSleeveId
  );

  const actions = useDeckBuilderSaveLoadActions({
    ...params,
    state,
    lastSavedDeckCardsRef,
  });

  const handleOpenSaveModal = async () => {
    await state.fetchDecksAndLocations();
    const initialReg: Record<number, boolean> = {};
    deckCards.forEach((c) => { initialReg[c.id] = (state.userInventoryCounts[c.id] || 0) < c.count; });
    state.setCardsToRegister(initialReg);
    state.setSaveFormat(state.format);
    state.setIsSaveModalOpen(true);
  };

  const handleOpenLoadModal = () => {
    state.fetchDecksAndLocations();
    state.setIsLoadModalOpen(true);
  };

  const handleDiscardChanges = useCallback(() => {
    if (lastSavedDeckCardsRef.current.length > 0) {
      setDeckCards(lastSavedDeckCardsRef.current);
    } else if (state.lastSavedSnapshot) {
      try {
        const parsed = JSON.parse(state.lastSavedSnapshot);
        if (parsed.cards && Array.isArray(parsed.cards)) setDeckCards(parsed.cards);
      } catch (err) {
        console.error('Error al descartar cambios:', err);
      }
    } else {
      setDeckCards([]);
    }
  }, [state.lastSavedSnapshot, setDeckCards]);

  const currentSnapshot = useMemo(
    () => buildDeckSnapshot(state.deckName, state.deckDescription, state.format, state.saveFormat, state.deckId, selectedMainSleeveId, selectedExtraSleeveId, deckCards),
    [state.deckName, state.deckDescription, state.format, state.saveFormat, state.deckId, selectedMainSleeveId, selectedExtraSleeveId, deckCards]
  );

  const isDirty = useMemo(
    () => state.lastSavedSnapshot ? currentSnapshot !== state.lastSavedSnapshot : deckCards.length > 0 || state.isManualDeckName,
    [state.lastSavedSnapshot, currentSnapshot, deckCards.length, state.isManualDeckName]
  );

  const assignedDraftUserCardIds = useMemo(() => {
    const ids = new Set<string>();
    deckCards.forEach((c) => c.physical_copies?.forEach((pc) => { if (pc.user_card_id) ids.add(pc.user_card_id); }));
    return ids;
  }, [deckCards]);

  return {
    ...state,
    ...actions,
    handleOpenSaveModal,
    handleOpenLoadModal,
    handleDiscardChanges,
    currentSnapshot,
    isDirty,
    assignedDraftUserCardIds,
  };
}
