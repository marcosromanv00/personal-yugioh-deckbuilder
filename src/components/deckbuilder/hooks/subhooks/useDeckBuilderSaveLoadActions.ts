import { useCallback } from 'react';
import { Deck } from '@/types/collection';
import { DeckCard } from '../../types';
import { fetchDeckSleevesApi, saveDeckApi, deleteDeckApi } from '../../services/deckBuilder.api';
import { buildDeckSnapshot, getUnregisteredCardsList } from '../../deckBuilder.utils';
import { UnregisteredAction, UnregisteredCardItem } from '../../components/UnregisteredCardsModal';
import { mapDeckCardsOnLoad, buildQuickSavePayload, buildSaveDeckPayload, syncDeckSleeves } from '../../deckBuilderSaveLoad.utils';
import { useDeckBuilderSaveLoadState } from './useDeckBuilderSaveLoadState';

interface UseDeckBuilderSaveLoadActionsParams {
  state: ReturnType<typeof useDeckBuilderSaveLoadState>;
  deckCards: DeckCard[];
  setDeckCards: React.Dispatch<React.SetStateAction<DeckCard[]>>;
  lastSavedDeckCardsRef: React.MutableRefObject<DeckCard[]>;
  selectedMainSleeveId: string;
  setSelectedMainSleeveId: (id: string) => void;
  selectedExtraSleeveId: string;
  setSelectedExtraSleeveId: (id: string) => void;
  mainSleeveMode: 'take' | 'add';
  mainSleeveAddedQty: number;
  extraSleeveMode: 'take' | 'add';
  extraSleeveAddedQty: number;
  setHistoryStack: React.Dispatch<React.SetStateAction<DeckCard[][]>>;
  setRedoStack: React.Dispatch<React.SetStateAction<DeckCard[][]>>;
  setUnregisteredCards: (cards: UnregisteredCardItem[]) => void;
  setIsUnregisteredModalOpen: (open: boolean) => void;
  setIsSavingUnregistered: (saving: boolean) => void;
  deactivatedDeckIds: string[];
}

export function useDeckBuilderSaveLoadActions({
  state,
  deckCards,
  setDeckCards,
  lastSavedDeckCardsRef,
  selectedMainSleeveId,
  setSelectedMainSleeveId,
  selectedExtraSleeveId,
  setSelectedExtraSleeveId,
  mainSleeveMode,
  mainSleeveAddedQty,
  extraSleeveMode,
  extraSleeveAddedQty,
  setHistoryStack,
  setRedoStack,
  setUnregisteredCards,
  setIsUnregisteredModalOpen,
  setIsSavingUnregistered,
  deactivatedDeckIds,
}: UseDeckBuilderSaveLoadActionsParams) {

  const handleLoadDeck = useCallback(async (selected: Deck) => {
    state.setDeckId(selected.id);
    state.setDeckName(selected.name);
    state.setIsManualDeckName(true);
    state.isManualDeckNameRef.current = true;
    state.setDeckDescription(selected.description || '');
    const fmt = selected.format === 'Master Duel' || selected.format === 'TCG' || selected.format === 'Duel Links' ? selected.format : 'Master Duel';
    state.setFormat(fmt);
    state.setSaveFormat(fmt);
    state.setTargetLocationId(selected.storage_location_id || 'inbox');
    state.setSelectedLaneIndex(selected.compartment_index || 0);
    state.setSaveIsActive(Boolean(selected.is_active));
    state.setLoadedVariants(selected.variants || []);

    const initialMappedCards = mapDeckCardsOnLoad(selected, state.allUserCards, state.locations);
    setDeckCards(initialMappedCards);
    setHistoryStack([]);
    setRedoStack([]);
    state.setIsLoadModalOpen(false);
    lastSavedDeckCardsRef.current = initialMappedCards;

    const assignedSleeves = await fetchDeckSleevesApi(selected.id);
    const mainSl = assignedSleeves.find((a) => a.section_type === 'main_side');
    const extraSl = assignedSleeves.find((a) => a.section_type === 'extra');
    setSelectedMainSleeveId(mainSl?.sleeve_id || '');
    setSelectedExtraSleeveId(extraSl?.sleeve_id || '');

    state.setLastSavedSnapshot(buildDeckSnapshot(selected.name, selected.description || '', fmt, fmt, selected.id, mainSl?.sleeve_id || '', extraSl?.sleeve_id || '', initialMappedCards));
  }, [state, setDeckCards, lastSavedDeckCardsRef, setHistoryStack, setRedoStack, setSelectedMainSleeveId, setSelectedExtraSleeveId]);

  const finalizeSave = async (savedDeckId: string, method: 'POST' | 'PUT', isNew: boolean) => {
    await syncDeckSleeves(savedDeckId, selectedMainSleeveId, selectedExtraSleeveId, mainSleeveMode, mainSleeveAddedQty, extraSleeveMode, extraSleeveAddedQty);
    lastSavedDeckCardsRef.current = deckCards;
    state.setLastSavedSnapshot(buildDeckSnapshot(state.deckName, state.deckDescription, state.saveFormat || state.format, state.saveFormat || state.format, savedDeckId, selectedMainSleeveId, selectedExtraSleeveId, deckCards));
    setIsUnregisteredModalOpen(false);
    state.fetchDecksAndLocations();
    return true;
  };

  const handleQuickSaveDeck = async (overrideActions?: Record<number, UnregisteredAction>): Promise<boolean> => {
    if (!state.deckName.trim()) { alert('El nombre del deck es obligatorio.'); return false; }
    if (!overrideActions) {
      const unreg = getUnregisteredCardsList(deckCards, state.userInventoryCounts);
      if (unreg.length > 0) { setUnregisteredCards(unreg); setIsUnregisteredModalOpen(true); return false; }
    }

    state.setLoadingDecks(true);
    setIsSavingUnregistered(true);
    try {
      const meta = { deckId: state.deckId, deckName: state.deckName, deckDescription: state.deckDescription, saveFormat: state.saveFormat, format: state.format, saveIsActive: state.saveIsActive, targetLocationId: state.targetLocationId, selectedLaneIndex: state.selectedLaneIndex, deactivatedDeckIds };
      const payload = buildQuickSavePayload(deckCards, overrideActions, state.userInventoryCounts, state.allUserCards, meta);
      const result = await saveDeckApi(payload, state.deckId ? 'PUT' : 'POST');
      if (result.ok) {
        const savedDeckId = state.deckId || result.data?.id;
        if (!state.deckId && result.data?.id) state.setDeckId(result.data.id);
        if (savedDeckId) await finalizeSave(savedDeckId, state.deckId ? 'PUT' : 'POST', !state.deckId);
        return true;
      }
      alert(`Error al guardar: ${result.error || 'Intente de nuevo'}`);
      return false;
    } catch (e) {
      console.error(e);
      alert('Error de red al guardar el deck.');
      return false;
    } finally {
      state.setLoadingDecks(false);
      setIsSavingUnregistered(false);
    }
  };

  const handleSaveDeck = async () => {
    if (!state.deckName.trim()) { alert('El nombre del deck es obligatorio.'); return; }
    state.setLoadingDecks(true);
    try {
      let finalDeckId = state.deckId;
      let method: 'POST' | 'PUT' = 'POST';
      if (state.deckId && confirm('¿Deseas SOBRESCRIBIR la baraja actual?\n\n- [Aceptar]: Sobrescribir\n- [Cancelar]: Guardar como copia')) {
        method = 'PUT'; finalDeckId = state.deckId;
      } else {
        method = 'POST'; finalDeckId = null;
      }

      const meta = {
        finalDeckId, deckName: state.deckName, deckDescription: state.deckDescription,
        saveFormat: state.saveFormat, saveIsActive: state.saveIsActive, targetLocationId: state.targetLocationId,
        selectedLaneIndex: state.selectedLaneIndex, registerToInventory: state.registerToInventory, deactivatedDeckIds,
      };
      const payload = buildSaveDeckPayload(deckCards, state.cardsToRegister, state.userInventoryCounts, meta);

      const result = await saveDeckApi(payload, method);
      if (result.ok) {
        const savedDeckId = finalDeckId || result.data?.id;
        if (method === 'POST' && result.data?.id) state.setDeckId(result.data.id);
        if (savedDeckId) await finalizeSave(savedDeckId, method, method === 'POST');
        alert(method === 'PUT' ? '¡Deck sobrescrito exitosamente!' : '¡Copia nueva guardada exitosamente!');
        state.setIsSaveModalOpen(false);
      } else {
        alert(`Error al guardar: ${result.error || 'Intente de nuevo'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al guardar el deck.');
    } finally {
      state.setLoadingDecks(false);
    }
  };

  const handleDeleteDeck = async (id: string): Promise<boolean> => {
    try {
      const ok = await deleteDeckApi(id);
      if (!ok) return false;
      state.setSavedDecks((prev) => prev.filter((d) => d.id !== id));
      if (state.deckId === id) { state.setDeckId(null); setDeckCards([]); state.setLastSavedSnapshot(''); lastSavedDeckCardsRef.current = []; }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleClearDeck = () => {
    setDeckCards([]); state.setDeckId(null); state.setDeckName('Nuevo Deck TCG');
    state.setIsManualDeckName(false); state.isManualDeckNameRef.current = false;
    setSelectedMainSleeveId(''); setSelectedExtraSleeveId(''); state.setLastSavedSnapshot(''); state.setLoadedVariants([]);
  };

  const handleConfirmUnregisteredSave = async (actions: Record<number, UnregisteredAction>) => { await handleQuickSaveDeck(actions); };
  const handleSkipUnregisteredSave = async () => { await handleQuickSaveDeck({}); };

  return {
    handleLoadDeck, handleQuickSaveDeck, handleConfirmUnregisteredSave, handleSkipUnregisteredSave,
    handleSaveDeck, handleDeleteDeck, handleClearDeck,
  };
}
