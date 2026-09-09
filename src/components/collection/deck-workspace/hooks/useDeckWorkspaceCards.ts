import { useState, useMemo } from 'react';
import { DeckCardDetail, Deck, UserCard } from '@/types/collection';
import { Card } from '@/components/deckbuilder/types';
import { useToast } from '@/components/ui/ToastProvider';
import { RightDeckMode } from '../types';
import { serializeDeckCardsForDirtyCheck } from '../deckWorkspace.utils';
import { saveDeckCardsApi } from '../services/deckWorkspace.api';
import { useDeckPhysicalSync } from '../useDeckPhysicalSync';
import {
  addCardCopyToList,
  removeCardCopyFromList,
  moveCardSectionInList,
} from '../deckWorkspaceCards.utils';

interface UseDeckWorkspaceCardsParams {
  currentDeck: Deck | null;
  deckCards: DeckCardDetail[];
  setDeckCards: React.Dispatch<React.SetStateAction<DeckCardDetail[]>>;
  initialDeckCards: DeckCardDetail[];
  setInitialDeckCards: React.Dispatch<React.SetStateAction<DeckCardDetail[]>>;
  selectedCardDetail: DeckCardDetail | null;
  setSelectedCardDetail: (cd: DeckCardDetail | null) => void;
  setRightMode: (m: RightDeckMode) => void;
  userCards: UserCard[];
  physicalSync: ReturnType<typeof useDeckPhysicalSync>;
  addRecentCard: (card: unknown) => void;
  setHasMutated: (m: boolean) => void;
  storageLocationId: string;
  compartmentIndex: number;
  setDropCopyPickerState: (st: { card: Card; targetSection: 'main' | 'extra' | 'side' | 'pool' | 'extras'; copies: UserCard[] } | null) => void;
}

export function useDeckWorkspaceCards({
  currentDeck,
  deckCards,
  setDeckCards,
  initialDeckCards,
  setInitialDeckCards,
  selectedCardDetail,
  setSelectedCardDetail,
  setRightMode,
  userCards,
  physicalSync,
  addRecentCard,
  setHasMutated,
  storageLocationId,
  compartmentIndex,
  setDropCopyPickerState,
}: UseDeckWorkspaceCardsParams) {
  const toast = useToast();
  const [savingDeckCards, setSavingDeckCards] = useState(false);

  const handleAddCardToDeck = (card: Card, targetSection?: 'main' | 'extra' | 'side' | 'pool' | 'extras', selectedCopy?: UserCard) => {
    if (!currentDeck) return;
    const updated = addCardCopyToList(deckCards, card, targetSection, selectedCopy, currentDeck.id);
    if (selectedCopy) {
      physicalSync.setAssignedUserCardIds((prev) => (prev.includes(selectedCopy.id) ? prev : [...prev, selectedCopy.id]));
      physicalSync.setUnassignedUserCardIds((prev) => prev.filter((id) => id !== selectedCopy.id));
    }
    setDeckCards(updated);
    setHasMutated(true);
    addRecentCard(card);
    toast.success(`+1 ${card.name} (${selectedCopy ? selectedCopy.rarity || 'Common' : 'Pendiente'})`);
  };

  const handleRemoveCardFromDeck = (cardId: number, section: 'main' | 'extra' | 'side' | 'pool' | 'extras') => {
    if (!currentDeck) return;
    const { updatedCards, removedUserCardId, wasLastInstance } = removeCardCopyFromList(deckCards, cardId, section);
    if (removedUserCardId) {
      if (physicalSync.assignedUserCardIds.includes(removedUserCardId)) {
        physicalSync.setAssignedUserCardIds((prev) => prev.filter((id) => id !== removedUserCardId));
      } else {
        physicalSync.setUnassignedUserCardIds((prev) => (prev.includes(removedUserCardId) ? prev : [...prev, removedUserCardId]));
      }
    }
    if (wasLastInstance && selectedCardDetail?.card_id === cardId) {
      setSelectedCardDetail(null);
      setRightMode('details');
    }
    setDeckCards(updatedCards);
    setHasMutated(true);
    toast.info('Copia física retirada');
  };

  const handleChangeCardSection = (cardId: number, currentSection: string, targetSection: string) => {
    if (!currentDeck) return;
    const res = moveCardSectionInList(deckCards, cardId, currentSection, targetSection);
    if (!res) return;
    const { updatedCards, toSec } = res;
    setDeckCards(updatedCards);
    setSelectedCardDetail(selectedCardDetail ? { ...selectedCardDetail, section: toSec } : null);
    setHasMutated(true);
    toast.success(`Carta movida a ${toSec === 'extras' ? 'RESERVA / POOL' : toSec.toUpperCase()}`);
  };

  const handleDragCardStart = (e: React.DragEvent, cardData: { id: number; name: string; type?: string; image_url?: string; archetype?: string; fromSection?: 'main' | 'extra' | 'side' | 'pool' | 'extras' }) => {
    const payload = JSON.stringify({ id: cardData.id, name: cardData.name, type: cardData.type || 'Monster', image_url: cardData.image_url || '', archetype: cardData.archetype, fromSection: cardData.fromSection });
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.setData('text/plain', String(cardData.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropCardOnSection = async (e: React.DragEvent, targetSection: 'main' | 'extra' | 'side' | 'pool' | 'extras') => {
    e.preventDefault();
    const jsonStr = e.dataTransfer.getData('application/json');
    if (jsonStr) {
      try {
        const cardObj = JSON.parse(jsonStr);
        if (cardObj && cardObj.id) {
          const fromSec = cardObj.fromSection;
          const toSec = (targetSection === 'pool' || targetSection === 'extras') ? 'extras' : targetSection;
          const fromSecNorm = (fromSec === 'pool' || fromSec === 'extras') ? 'extras' : fromSec;
          if (fromSecNorm && fromSecNorm !== toSec) {
            handleChangeCardSection(cardObj.id, fromSec, targetSection);
          } else if (!fromSecNorm) {
            const fullCard: Card = { id: cardObj.id, name: cardObj.name, type: cardObj.type, desc: '', image_url: cardObj.image_url, image_url_small: cardObj.image_url, archetype: cardObj.archetype, fromScope: cardObj.fromScope, userCardsGroup: cardObj.userCardsGroup };
            if (cardObj.fromScope === 'collection') {
              const copies = cardObj.userCardsGroup?.length ? cardObj.userCardsGroup : userCards.filter((uc) => uc.card_id === cardObj.id);
              if (copies.length) {
                setDropCopyPickerState({ card: fullCard, targetSection, copies });
                return;
              }
            }
            handleAddCardToDeck(fullCard, targetSection);
          }
          return;
        }
      } catch (err) {
        console.error('Error al procesar carta soltada:', err);
      }
    }
    const rawId = e.dataTransfer.getData('text/plain');
    if (rawId) {
      const cardId = parseInt(rawId);
      if (!isNaN(cardId)) handleAddCardToDeck({ id: cardId, name: `Carta #${cardId}`, type: 'Monster', desc: '', image_url: `https://images.ygoprodeck.com/images/cards/${cardId}.jpg` }, targetSection);
    }
  };

  const isDeckListDirty = useMemo(() => {
    if (physicalSync.assignedUserCardIds.length > 0 || physicalSync.unassignedUserCardIds.length > 0) return true;
    return serializeDeckCardsForDirtyCheck(deckCards) !== serializeDeckCardsForDirtyCheck(initialDeckCards);
  }, [deckCards, initialDeckCards, physicalSync.assignedUserCardIds, physicalSync.unassignedUserCardIds]);

  const handleSaveDeckCards = async () => {
    if (!currentDeck) return;
    setSavingDeckCards(true);
    try {
      const payloadCards = deckCards.map((c) => ({ id: c.card_id, count: c.count, section: (c.section === 'pool' || c.section === 'extras') ? 'extras' : c.section, name: c.card_details?.name, type: c.card_details?.type, image_url: c.card_details?.image_url }));
      const result = await saveDeckCardsApi(currentDeck.id, { storage_location_id: storageLocationId || null, compartment_index: compartmentIndex, cards: payloadCards });
      if (!result.ok) throw new Error(result.error || 'Error al guardar');
      setInitialDeckCards(deckCards);
      setHasMutated(true);
      toast.success('¡Lista de cartas guardada correctamente!');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Error al guardar cartas');
    } finally {
      setSavingDeckCards(false);
    }
  };

  const handleDiscardDeckCards = () => {
    setDeckCards(initialDeckCards);
    toast.info('Cambios descartados');
  };

  return {
    savingDeckCards,
    handleAddCardToDeck,
    handleRemoveCardFromDeck,
    handleChangeCardSection,
    handleDragCardStart,
    handleDropCardOnSection,
    isDeckListDirty,
    handleSaveDeckCards,
    handleDiscardDeckCards,
  };
}
