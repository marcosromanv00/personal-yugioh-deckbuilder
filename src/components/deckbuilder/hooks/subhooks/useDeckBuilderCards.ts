import { useState, useCallback, useMemo } from 'react';
import { Card, DeckCard, HistoryItem, BreakdownCardItem } from '../../types';
import { StorageLocation, UserCard } from '@/types/collection';
import { isExtraDeckCard, buildExtractionPickList } from '../../deckBuilder.utils';
import { reorderDeckCardsList } from '@/lib/deck/deck-order.utils';
import { buildNewPhysicalCopy, buildUpdatedCopy, validateDeckSectionLimit } from '../../deckBuilderCards.utils';

interface UseDeckBuilderCardsParams {
  deckCards: DeckCard[];
  setDeckCards: React.Dispatch<React.SetStateAction<DeckCard[]>>;
  format: 'Master Duel' | 'TCG' | 'Duel Links';
  locations: StorageLocation[];
  allUserCards: UserCard[];
  searchResults: Card[];
  sidebarBreakdownCards: BreakdownCardItem[];
  addRecentCard: (card: Card | DeckCard) => void;
  pushHistory: (currentCards: DeckCard[]) => void;
}

export function useDeckBuilderCards({
  deckCards,
  setDeckCards,
  format,
  locations,
  allUserCards,
  searchResults,
  sidebarBreakdownCards,
  addRecentCard,
  pushHistory,
}: UseDeckBuilderCardsParams) {
  const [cardHistory, setCardHistory] = useState<HistoryItem[]>([]);
  const [deactivatedDeckIds, setDeactivatedDeckIds] = useState<string[]>([]);
  const [deckLayoutMode, setDeckLayoutMode] = useState<'collapsed' | 'expanded'>('collapsed');

  const addCardToDeck = useCallback((card: Card, targetSection?: 'main' | 'extra' | 'side' | 'extras', selectedCopy?: UserCard) => {
    const section: 'main' | 'extra' | 'side' | 'extras' = targetSection || (isExtraDeckCard(card.type) ? 'extra' : 'main');
    const limitError = validateDeckSectionLimit(section, deckCards, format);
    if (limitError) { alert(limitError); return; }

    pushHistory(deckCards);
    const historyCard: HistoryItem = {
      id: card.id, name: card.name, type: card.type,
      image_url: card.image_url || card.image_url_small || '',
      archetype: card.archetype, action: 'added', timestamp: Date.now(),
    };
    setCardHistory((prev) => [historyCard, ...prev.filter((i) => i.id !== card.id)].slice(0, 15));

    const newPhysicalCopy = buildNewPhysicalCopy(selectedCopy, locations);

    setDeckCards((prev) => {
      const totalInDeck = prev.filter((c) => c.id === card.id && c.section !== 'extras').reduce((sum, c) => sum + (c.count || 0), 0);
      if (totalInDeck >= 3) { alert('No puedes jugar más de 3 copias de una misma carta en el mazo.'); return prev; }
      const existing = prev.find((c) => c.id === card.id && c.section === section);
      if (existing) {
        return prev.map((c) => (c.id === card.id && c.section === section ? { ...c, count: c.count + 1, physical_copies: [...(c.physical_copies || []), newPhysicalCopy] } : c));
      }
      return [...prev, {
        id: card.id, name: card.name, count: 1, section, type: card.type, image_url: card.image_url,
        archetype: card.archetype, ban_master_duel: card.ban_master_duel, ban_tcg: card.ban_tcg,
        ban_duel_links: card.ban_duel_links, atk: card.atk, def: card.def, level: card.level,
        race: card.race, attribute: card.attribute, physical_copies: [newPhysicalCopy],
      }];
    });
    addRecentCard(card);
  }, [format, deckCards, locations, addRecentCard, pushHistory, setDeckCards]);

  const removeCardFromDeck = useCallback((cardId: number, section: 'main' | 'extra' | 'side' | 'extras') => {
    pushHistory(deckCards);
    const existing = deckCards.find((c) => c.id === cardId && c.section === section);
    if (existing) addRecentCard(existing);

    setDeckCards((prev) => {
      const item = prev.find((c) => c.id === cardId && c.section === section);
      if (item && item.count > 1) {
        return prev.map((c) => (c.id === cardId && c.section === section ? { ...c, count: c.count - 1, physical_copies: (c.physical_copies || []).slice(0, -1) } : c));
      }
      return prev.filter((c) => !(c.id === cardId && c.section === section));
    });
  }, [deckCards, addRecentCard, pushHistory, setDeckCards]);

  const removeCopyFromDeck = useCallback((cardId: number, section: 'main' | 'extra' | 'side' | 'extras', copyIndex: number) => {
    pushHistory(deckCards);
    setDeckCards((prev) => {
      const existing = prev.find((c) => c.id === cardId && c.section === section);
      if (!existing) return prev;
      addRecentCard(existing);
      if (existing.count <= 1) return prev.filter((c) => !(c.id === cardId && c.section === section));
      const currentCopies = existing.physical_copies ? [...existing.physical_copies] : [];
      if (copyIndex >= 0 && copyIndex < currentCopies.length) currentCopies.splice(copyIndex, 1);
      else if (currentCopies.length > 0) currentCopies.pop();
      return prev.map((c) => (c.id === cardId && c.section === section ? { ...c, count: c.count - 1, physical_copies: currentCopies } : c));
    });
  }, [deckCards, addRecentCard, pushHistory, setDeckCards]);

  const handleUpdateCardPhysicalCopy = useCallback((cardId: number, section: 'main' | 'extra' | 'side' | 'extras', copyIndex: number, selectedUserCardId: string | 'proxy') => {
    setDeckCards((prev) => prev.map((c) => {
      if (c.id !== cardId || c.section !== section) return c;
      const copies = [...(c.physical_copies || [])];
      while (copies.length <= copyIndex) copies.push({ is_proxy: true, rarity: 'Receta / Proxy' });

      if (selectedUserCardId === 'proxy') {
        copies[copyIndex] = { is_proxy: true, rarity: 'Receta / Proxy' };
      } else {
        const targetUc = allUserCards.find((uc) => uc.id === selectedUserCardId);
        if (targetUc) copies[copyIndex] = buildUpdatedCopy(targetUc, locations);
      }
      return { ...c, physical_copies: copies };
    }));
  }, [allUserCards, locations, setDeckCards]);

  const reorderDeckCards = useCallback((sourceCardId: number, sourceSection: 'main' | 'extra' | 'side' | 'extras', targetCardId: number, targetSection: 'main' | 'extra' | 'side' | 'extras', position: 'before' | 'after' = 'before') => {
    pushHistory(deckCards);
    setDeckCards((prev) => reorderDeckCardsList(prev, sourceCardId, sourceSection, targetCardId, targetSection, position));
  }, [deckCards, pushHistory, setDeckCards]);

  const handleResolveConflictAction = useCallback((userCardId: string, action: 'move_to_deck' | 'deactivate_origin') => {
    if (action === 'deactivate_origin') {
      const targetUc = allUserCards.find((uc) => uc.id === userCardId);
      if (targetUc?.deck_id) setDeactivatedDeckIds((prev) => Array.from(new Set([...prev, targetUc.deck_id!])));
    }
    setDeckCards((prev) => prev.map((c) => ({
      ...c,
      physical_copies: c.physical_copies?.map((pc) => pc.user_card_id === userCardId ? { ...pc, is_in_active_deck: false, active_deck_id: undefined, active_deck_name: undefined } : pc),
    })));
  }, [allUserCards, setDeckCards]);

  const addRecommendedCard = async (cardId: number, cardName: string, targetSection?: 'main' | 'extra' | 'side' | 'extras', cardObj?: Partial<Card & BreakdownCardItem & HistoryItem>) => {
    if (cardObj && cardObj.id) {
      addCardToDeck({ id: cardObj.id, name: cardObj.name || '', type: cardObj.type || 'Monster', image_url: cardObj.image_url || cardObj.image_url_small || '', image_url_small: cardObj.image_url_small || cardObj.image_url || '', archetype: cardObj.archetype }, targetSection);
      return;
    }
    const found = searchResults.find((c) => c.id === cardId) || sidebarBreakdownCards.find((c) => c.id === cardId) || cardHistory.find((c) => c.id === cardId);
    if (found) {
      const arch = 'archetype' in found ? found.archetype : undefined;
      addCardToDeck({ id: found.id, name: found.name, type: found.type || 'Monster', image_url: found.image_url || '', archetype: arch }, targetSection);
      return;
    }
    try {
      const res = await fetch(`/api/cards?q=${encodeURIComponent(cardName || String(cardId))}`);
      if (res.ok) {
        const json = await res.json();
        const card = json.data?.find((c: Card) => c.id === cardId) || json.data?.[0];
        if (card) addCardToDeck(card, targetSection);
      }
    } catch (e) {
      console.error('Error al agregar recomendada:', e);
    }
  };

  const extractionPickList = useMemo(() => buildExtractionPickList(deckCards, locations), [deckCards, locations]);

  return {
    deckCards, setDeckCards, cardHistory, setCardHistory, deactivatedDeckIds, setDeactivatedDeckIds,
    deckLayoutMode, setDeckLayoutMode, addCardToDeck, removeCardFromDeck, removeCopyFromDeck,
    handleUpdateCardPhysicalCopy, reorderDeckCards, handleResolveConflictAction, addRecommendedCard, extractionPickList,
  };
}
