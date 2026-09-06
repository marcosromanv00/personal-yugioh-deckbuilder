import React from 'react';
import { Card, DeckCard, SearchScope } from '../types';
import { checkBanlistViolationOnAdd, BanlistStatus } from '@/lib/deck/banlist.utils';
import { StorageLocation, UserCard } from '@/types/collection';

export interface DragCardPayload {
  id: number;
  name: string;
  type?: string;
  image_url?: string;
  image_url_small?: string;
  archetype?: string;
  fromSection?: 'main' | 'extra' | 'side' | 'extras' | 'pool';
  fromScope?: SearchScope;
  userCardsGroup?: UserCard[];
}

interface UseDeckDragAndDropParams {
  deckCards: DeckCard[];
  format: 'TCG' | 'Master Duel' | 'Duel Links';
  allUserCards?: UserCard[];
  locations?: StorageLocation[];
  addCardToDeck: (card: Card, targetSection?: 'main' | 'extra' | 'side' | 'extras', selectedCopy?: UserCard) => void;
  removeCardFromDeck: (cardId: number, section: 'main' | 'extra' | 'side' | 'extras') => void;
  addRecommendedCard: (cardId: number, cardName: string, targetSection?: 'main' | 'extra' | 'side' | 'extras', cardObj?: Partial<Card & import('../types').BreakdownCardItem & import('../types').HistoryItem>) => void | Promise<void>;
  onBanlistViolation: (payload: { card: Card; targetSection?: 'main' | 'extra' | 'side' | 'extras'; limit: number; status: BanlistStatus; currentCopies: number }) => void;
  onOpenCopyPicker: (payload: { card: Card; targetSection: 'main' | 'extra' | 'side' | 'extras'; copies: UserCard[] }) => void;
}

export function useDeckDragAndDrop({
  deckCards,
  format,
  allUserCards,
  locations,
  addCardToDeck,
  removeCardFromDeck,
  addRecommendedCard,
  onBanlistViolation,
  onOpenCopyPicker,
}: UseDeckDragAndDropParams) {
  const handleDragCardStart = (e: React.DragEvent, cardData: DragCardPayload) => {
    const payload = JSON.stringify({
      id: cardData.id,
      name: cardData.name,
      type: cardData.type || 'Monster',
      image_url: cardData.image_url || cardData.image_url_small || '',
      archetype: cardData.archetype,
      fromSection: cardData.fromSection,
      fromScope: cardData.fromScope,
      userCardsGroup: cardData.userCardsGroup,
    });
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.setData('text/plain', String(cardData.id));
  };

  const handleDropCardOnSection = (e: React.DragEvent, targetSection: 'main' | 'extra' | 'side' | 'extras') => {
    e.preventDefault();
    const jsonStr = e.dataTransfer.getData('application/json');
    if (jsonStr) {
      try {
        const cardObj = JSON.parse(jsonStr) as Card & { fromSection?: 'main' | 'extra' | 'side' | 'extras'; fromScope?: SearchScope; userCardsGroup?: UserCard[] };
        if (cardObj && cardObj.id) {
          if (cardObj.fromSection) {
            if (cardObj.fromSection !== targetSection) {
              removeCardFromDeck(cardObj.id, cardObj.fromSection);
              addCardToDeck(cardObj, targetSection);
            }
          } else {
            const violation = checkBanlistViolationOnAdd(cardObj, deckCards, format);
            if (violation.isViolated) {
              onBanlistViolation({
                card: cardObj,
                targetSection,
                limit: violation.limit,
                status: violation.status,
                currentCopies: violation.currentCopies,
              });
              return;
            }

            if (cardObj.fromScope === 'collection') {
              const copies = (cardObj.userCardsGroup && cardObj.userCardsGroup.length > 0)
                ? cardObj.userCardsGroup
                : (allUserCards ? allUserCards.filter((uc) => uc.card_id === cardObj.id) : []);
              if (copies.length > 0 && locations && locations.length > 0) {
                onOpenCopyPicker({ card: cardObj, targetSection, copies });
                return;
              }
            }
            addCardToDeck(cardObj, targetSection);
          }
          return;
        }
      } catch (err) {
        console.error('Error al parsear carta arrastrada:', err);
      }
    }
    const rawId = e.dataTransfer.getData('text/plain');
    if (rawId) {
      const cardId = parseInt(rawId, 10);
      if (!isNaN(cardId)) {
        addRecommendedCard(cardId, '', targetSection);
      }
    }
  };

  return {
    handleDragCardStart,
    handleDropCardOnSection,
  };
}
