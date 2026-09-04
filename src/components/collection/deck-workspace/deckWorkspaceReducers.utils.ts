import { DeckCardDetail, UserCard, DeckCardPhysicalCopy } from '@/types/collection';

export function assignCopyReducer(
  deckCards: DeckCardDetail[],
  cardId: number,
  section: string,
  copy: UserCard,
  deckId?: string
): DeckCardDetail[] {
  const secNorm = section === 'pool' || section === 'extras' ? 'extras' : section;
  return deckCards.map((c) => {
    const cSecNorm = c.section === 'pool' || c.section === 'extras' ? 'extras' : c.section;
    if (c.card_id === cardId && cSecNorm === secNorm) {
      const currentCopies = c.physical_copies || [];
      if (currentCopies.some((cp) => cp.user_card_id === copy.id)) return c;
      // Promote one staged placeholder to an existing copy, or append a new existing copy
      const stagedIdx = currentCopies.findIndex((cp) => cp.source_status === 'staged');
      const newCopy: DeckCardPhysicalCopy = {
        user_card_id: copy.id,
        storage_location_id: copy.storage_location_id,
        rarity: copy.rarity,
        condition: copy.condition,
        is_proxy: copy.is_proxy,
        is_in_active_deck: true,
        active_deck_id: deckId,
        compartment_index: copy.compartment_index,
        binder_page: copy.binder_page,
        binder_slot: copy.binder_slot,
        source_status: 'existing' as const,
      };
      let updatedCopies: DeckCardPhysicalCopy[];
      if (stagedIdx >= 0) {
        // Replace the first staged placeholder with the real copy
        updatedCopies = [...currentCopies];
        updatedCopies[stagedIdx] = newCopy;
      } else {
        updatedCopies = [...currentCopies, newCopy];
      }
      const stagedCount = updatedCopies.filter((cp) => cp.source_status === 'staged').length;
      return { ...c, physical_copies: updatedCopies, pending_count: stagedCount };
    }
    return c;
  });
}

export function unassignCopyReducer(
  deckCards: DeckCardDetail[],
  cardId: number,
  section: string,
  userCardId: string
): DeckCardDetail[] {
  const secNorm = section === 'pool' || section === 'extras' ? 'extras' : section;
  return deckCards.map((c) => {
    const cSecNorm = c.section === 'pool' || c.section === 'extras' ? 'extras' : c.section;
    if (c.card_id === cardId && cSecNorm === secNorm) {
      const currentCopies = c.physical_copies || [];
      const updatedCopies = currentCopies.filter((cp) => cp.user_card_id !== userCardId);
      const stagedCount = updatedCopies.filter((cp) => cp.source_status === 'staged').length;
      return { ...c, physical_copies: updatedCopies, pending_count: stagedCount };
    }
    return c;
  });
}
