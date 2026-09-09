import { DeckCardDetail, UserCard, DeckCardPhysicalCopy } from '@/types/collection';
import { Card } from '@/components/deckbuilder/types';

export function normalizeDeckSection(section?: string): 'main' | 'extra' | 'side' | 'extras' {
  if (section === 'pool' || section === 'extras') return 'extras';
  if (section === 'extra') return 'extra';
  if (section === 'side') return 'side';
  return 'main';
}

export function addCardCopyToList(
  deckCards: DeckCardDetail[],
  card: Card,
  targetSection?: 'main' | 'extra' | 'side' | 'pool' | 'extras',
  selectedCopy?: UserCard,
  currentDeckId?: string
): DeckCardDetail[] {
  let sectionToUse = targetSection || 'main';
  if (!targetSection) {
    const typeLower = (card.type || '').toLowerCase();
    if (typeLower.includes('fusion') || typeLower.includes('synchro') || typeLower.includes('xyz') || typeLower.includes('link')) {
      sectionToUse = 'extra';
    }
  }

  const sectionNormalized = normalizeDeckSection(sectionToUse);
  const existing = deckCards.find(
    (c) => c.card_id === card.id && (c.section === sectionToUse || c.section === sectionNormalized || (sectionNormalized === 'extras' && (c.section === 'pool' || c.section === 'extras')))
  );

  const newCopy: DeckCardPhysicalCopy = selectedCopy
    ? {
        user_card_id: selectedCopy.id,
        storage_location_id: selectedCopy.storage_location_id,
        rarity: selectedCopy.rarity,
        condition: selectedCopy.condition,
        is_proxy: selectedCopy.is_proxy,
        is_in_active_deck: true,
        active_deck_id: currentDeckId || undefined,
        compartment_index: selectedCopy.compartment_index,
        binder_page: selectedCopy.binder_page,
        binder_slot: selectedCopy.binder_slot,
        source_status: 'existing',
      }
    : { source_status: 'staged' };

  if (existing) {
    return deckCards.map((c) => {
      if (c.card_id === card.id && (c.section === sectionToUse || c.section === sectionNormalized || (sectionNormalized === 'extras' && (c.section === 'pool' || c.section === 'extras')))) {
        const currentCopies = c.physical_copies || [];
        const updatedCopies = [...currentCopies, newCopy];
        return {
          ...c,
          count: c.count + 1,
          physical_copies: updatedCopies,
          pending_count: updatedCopies.filter((cp) => cp.source_status === 'staged').length,
        };
      }
      return c;
    });
  }

  return [
    ...deckCards,
    {
      card_id: card.id,
      count: 1,
      section: sectionNormalized,
      physical_copies: [newCopy],
      pending_count: selectedCopy ? 0 : 1,
      card_details: {
        name: card.name,
        type: card.type,
        desc: card.desc,
        atk: card.atk ?? undefined,
        def: card.def ?? undefined,
        level: card.level ?? undefined,
        race: card.race ?? undefined,
        attribute: card.attribute ?? undefined,
        archetype: card.archetype,
        image_url: card.image_url,
        image_url_small: card.image_url_small,
      },
    },
  ];
}

export function removeCardCopyFromList(
  deckCards: DeckCardDetail[],
  cardId: number,
  section: 'main' | 'extra' | 'side' | 'pool' | 'extras'
): { updatedCards: DeckCardDetail[]; removedUserCardId?: string; wasLastInstance: boolean } {
  const sectionNormalized = normalizeDeckSection(section);
  const existing = deckCards.find((c) => c.card_id === cardId && (c.section === section || c.section === sectionNormalized));
  if (!existing) {
    return { updatedCards: deckCards, wasLastInstance: false };
  }

  const currentCopies = [...(existing.physical_copies || [])];
  const lastStagedIdx = currentCopies.map((cp, i) => ({ cp, i })).filter(({ cp }) => cp.source_status === 'staged').pop()?.i;
  let removedUserCardId: string | undefined;

  if (lastStagedIdx !== undefined) {
    currentCopies.splice(lastStagedIdx, 1);
  } else {
    const popped = currentCopies.pop();
    if (popped?.user_card_id) {
      removedUserCardId = popped.user_card_id;
    }
  }

  if (existing.count > 1) {
    const updatedCards = deckCards.map((c) =>
      c.card_id === cardId && (c.section === section || c.section === sectionNormalized)
        ? {
            ...c,
            count: c.count - 1,
            physical_copies: currentCopies,
            pending_count: currentCopies.filter((cp) => cp.source_status === 'staged').length,
          }
        : c
    );
    return { updatedCards, removedUserCardId, wasLastInstance: false };
  }

  const updatedCards = deckCards.filter((c) => !(c.card_id === cardId && (c.section === section || c.section === sectionNormalized)));
  return { updatedCards, removedUserCardId, wasLastInstance: true };
}

export function moveCardSectionInList(
  deckCards: DeckCardDetail[],
  cardId: number,
  currentSection: string,
  targetSection: string
): { updatedCards: DeckCardDetail[]; toSec: 'main' | 'extra' | 'side' | 'extras' } | null {
  const fromSec = normalizeDeckSection(currentSection);
  const toSec = normalizeDeckSection(targetSection);
  if (fromSec === toSec) return null;

  const card = deckCards.find((c) => c.card_id === cardId && (c.section === currentSection || c.section === fromSec));
  if (!card) return null;

  const remainingCards = deckCards.filter((c) => !(c.card_id === cardId && (c.section === currentSection || c.section === fromSec)));
  const targetExisting = remainingCards.find((c) => c.card_id === cardId && (c.section === targetSection || c.section === toSec));
  const updatedCards = targetExisting
    ? remainingCards.map((c) => (c.card_id === cardId && (c.section === targetSection || c.section === toSec) ? { ...c, count: c.count + card.count } : c))
    : [...remainingCards, { ...card, section: toSec }];

  return { updatedCards, toSec };
}
