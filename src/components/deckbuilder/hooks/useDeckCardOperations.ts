import { useState, useCallback } from 'react';
import { Card, DeckCard, HoverCardBase } from '../types';
import { checkBanlistViolationOnAdd, BanlistStatus } from '@/lib/deck/banlist.utils';
import { StorageLocation, UserCard } from '@/types/collection';
import { fetchGeneratedDeckCards, GeneratedDeckInputCard } from '@/lib/deck/deck-generator.service';
import { useDeckDragAndDrop, DragCardPayload } from './useDeckDragAndDrop';

export type { DragCardPayload };

export interface BanlistWarningModalState {
  card: Card;
  targetSection?: 'main' | 'extra' | 'side' | 'extras';
  selectedCopy?: UserCard;
  limit: number;
  status: BanlistStatus;
  currentCopies: number;
}

export interface DropCopyPickerModalState {
  card: Card;
  targetSection: 'main' | 'extra' | 'side' | 'extras';
  copies: UserCard[];
}

interface UseDeckCardOperationsParams {
  deckCards: DeckCard[];
  format: 'TCG' | 'Master Duel' | 'Duel Links';
  allUserCards?: UserCard[];
  locations?: StorageLocation[];
  addCardToDeck: (card: Card, targetSection?: 'main' | 'extra' | 'side' | 'extras', selectedCopy?: UserCard) => void;
  removeCardFromDeck: (cardId: number, section: 'main' | 'extra' | 'side' | 'extras') => void;
  removeCopyFromDeck?: (cardId: number, section: 'main' | 'extra' | 'side' | 'extras', copyIndex: number) => void;
  reorderDeckCards: (
    sourceCardId: number,
    sourceSection: 'main' | 'extra' | 'side' | 'extras',
    targetCardId: number,
    targetSection: 'main' | 'extra' | 'side' | 'extras',
    position: 'before' | 'after'
  ) => void;
  addRecommendedCard: (cardId: number, cardName: string, targetSection?: 'main' | 'extra' | 'side' | 'extras', cardObj?: Partial<Card & import('../types').BreakdownCardItem & import('../types').HistoryItem>) => void | Promise<void>;
  addRecentCard: (card: Card | DeckCard | HoverCardBase) => void;
  handleUndo: () => void;
  setDeckCards: React.Dispatch<React.SetStateAction<DeckCard[]>>;
  onCardSelectedForDetail?: (card: Card | DeckCard | HoverCardBase) => void;
  showToastSuccess: (msg: string, opts?: { duration?: number; action?: { label: string; onClick: () => void } }) => void;
  showToastInfo: (msg: string, opts?: { duration?: number; action?: { label: string; onClick: () => void } }) => void;
  showToastError: (msg: string) => void;
  onResetSort?: () => void;
}

export function useDeckCardOperations({
  deckCards,
  format,
  allUserCards,
  locations,
  addCardToDeck,
  removeCardFromDeck,
  removeCopyFromDeck,
  reorderDeckCards,
  addRecommendedCard,
  addRecentCard,
  handleUndo,
  setDeckCards,
  onCardSelectedForDetail,
  showToastSuccess,
  showToastInfo,
  showToastError,
  onResetSort,
}: UseDeckCardOperationsParams) {
  const [banlistWarningState, setBanlistWarningState] = useState<BanlistWarningModalState | null>(null);
  const [dropCopyPickerState, setDropCopyPickerState] = useState<DropCopyPickerModalState | null>(null);

  const executeAddCard = useCallback(
    (card: Card, targetSection?: 'main' | 'extra' | 'side' | 'extras', selectedCopy?: UserCard) => {
      addCardToDeck(card, targetSection, selectedCopy);
      if (onCardSelectedForDetail) onCardSelectedForDetail(card);
      addRecentCard(card);
      showToastSuccess(`+1 ${card.name}${selectedCopy?.rarity ? ` (${selectedCopy.rarity})` : ''}`, {
        duration: 3000,
        action: { label: 'Deshacer', onClick: handleUndo },
      });
    },
    [addCardToDeck, onCardSelectedForDetail, addRecentCard, showToastSuccess, handleUndo]
  );

  const handleAddCardWithFeedback = useCallback(
    (card: Card, targetSection?: 'main' | 'extra' | 'side' | 'extras', selectedCopy?: UserCard, bypassBanlist = false) => {
      if (!bypassBanlist) {
        const violation = checkBanlistViolationOnAdd(card, deckCards, format);
        if (violation.isViolated) {
          setBanlistWarningState({
            card,
            targetSection,
            selectedCopy,
            limit: violation.limit,
            status: violation.status,
            currentCopies: violation.currentCopies,
          });
          return;
        }
      }
      executeAddCard(card, targetSection, selectedCopy);
    },
    [deckCards, format, executeAddCard]
  );

  const handleRemoveCardWithFeedback = useCallback(
    (cardId: number, section: 'main' | 'extra' | 'side' | 'extras') => {
      const targetCard = deckCards.find((c) => c.id === cardId && c.section === section);
      removeCardFromDeck(cardId, section);
      if (targetCard) {
        showToastInfo(`Removida: ${targetCard.name}`, {
          duration: 3000,
          action: { label: 'Deshacer', onClick: handleUndo },
        });
      }
    },
    [deckCards, removeCardFromDeck, showToastInfo, handleUndo]
  );

  const handleDropRemoveCard = useCallback(
    (cardId: number, fromSection: 'main' | 'extra' | 'side' | 'extras', copyIndex?: number) => {
      const targetCard = deckCards.find((c) => c.id === cardId && c.section === fromSection);
      if (typeof copyIndex === 'number' && removeCopyFromDeck) {
        removeCopyFromDeck(cardId, fromSection, copyIndex);
      } else {
        removeCardFromDeck(cardId, fromSection);
      }
      if (targetCard) {
        showToastInfo(`Retirada del mazo: ${targetCard.name}`, {
          duration: 3000,
          action: { label: 'Deshacer', onClick: handleUndo },
        });
      }
    },
    [deckCards, removeCopyFromDeck, removeCardFromDeck, showToastInfo, handleUndo]
  );

  const handleReorderCard = useCallback(
    (
      sourceCardId: number,
      sourceSection: 'main' | 'extra' | 'side' | 'extras',
      targetCardId: number,
      targetSection: 'main' | 'extra' | 'side' | 'extras',
      position: 'before' | 'after'
    ) => {
      reorderDeckCards(sourceCardId, sourceSection, targetCardId, targetSection, position);
      if (onResetSort) onResetSort();
    },
    [reorderDeckCards, onResetSort]
  );

  const { handleDragCardStart, handleDropCardOnSection } = useDeckDragAndDrop({
    deckCards,
    format,
    allUserCards,
    locations,
    addCardToDeck,
    removeCardFromDeck,
    addRecommendedCard,
    onBanlistViolation: setBanlistWarningState,
    onOpenCopyPicker: setDropCopyPickerState,
  });

  const handleUpdateDeckCard = useCallback(
    (cardId: number, updates: Partial<DeckCard>) => {
      setDeckCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, ...updates } : c)));
    },
    [setDeckCards]
  );

  const handleApplyGeneratedDeck = useCallback(
    async (cards: GeneratedDeckInputCard[]) => {
      showToastInfo('Cargando cartas del deck generado...');
      try {
        const newDeckCards = await fetchGeneratedDeckCards(cards);
        if (newDeckCards.length > 0) {
          setDeckCards(newDeckCards);
          showToastSuccess(`¡Deck aplicado con éxito (${newDeckCards.reduce((acc, c) => acc + c.count, 0)} cartas)!`);
        } else {
          showToastError('No se pudieron obtener los detalles de las cartas generadas');
        }
      } catch (err) {
        console.error('Error aplicando deck:', err);
        showToastError('Error al aplicar el deck generado');
      }
    },
    [setDeckCards, showToastInfo, showToastSuccess, showToastError]
  );

  return {
    banlistWarningState,
    setBanlistWarningState,
    dropCopyPickerState,
    setDropCopyPickerState,
    executeAddCard,
    handleAddCardWithFeedback,
    handleRemoveCardWithFeedback,
    handleDropRemoveCard,
    handleReorderCard,
    handleDragCardStart,
    handleDropCardOnSection,
    handleUpdateDeckCard,
    handleApplyGeneratedDeck,
  };
}
