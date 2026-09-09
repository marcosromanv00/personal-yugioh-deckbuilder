import { Card, DeckCard, DeckCardPhysicalCopy } from './types';
import { StorageLocation, UserCard } from '@/types/collection';

export function buildNewPhysicalCopy(selectedCopy?: UserCard, locations?: StorageLocation[]): DeckCardPhysicalCopy {
  if (selectedCopy) {
    const loc = locations?.find((l) => l.id === selectedCopy.storage_location_id);
    return {
      user_card_id: selectedCopy.id,
      storage_location_id: selectedCopy.storage_location_id,
      location_name: loc ? loc.name : 'Inbox / Sin clasificar',
      rarity: selectedCopy.rarity || 'Common',
      condition: selectedCopy.condition || 'Near Mint',
      is_proxy: Boolean(selectedCopy.is_proxy),
      is_in_active_deck: Boolean(selectedCopy.deck_id),
      active_deck_id: selectedCopy.deck_id || undefined,
      active_deck_name: selectedCopy.deck_details?.name || (selectedCopy.deck_id ? 'Deck Activo' : undefined),
      binder_page: selectedCopy.binder_page,
      binder_slot: selectedCopy.binder_slot,
      compartment_index: selectedCopy.compartment_index,
      source_status: 'existing',
    };
  }
  return { is_proxy: true, rarity: 'Receta / Proxy', source_status: 'staged' };
}

export function buildUpdatedCopy(targetUc: UserCard, locations: StorageLocation[]): DeckCardPhysicalCopy {
  const loc = locations.find((l) => l.id === targetUc.storage_location_id);
  return {
    user_card_id: targetUc.id,
    storage_location_id: targetUc.storage_location_id,
    location_name: loc ? loc.name : 'Inbox / Sin clasificar',
    rarity: targetUc.rarity || 'Common',
    condition: targetUc.condition || 'Near Mint',
    is_proxy: Boolean(targetUc.is_proxy),
    is_in_active_deck: Boolean(targetUc.deck_id),
    active_deck_id: targetUc.deck_id || undefined,
    active_deck_name: targetUc.deck_details?.name || (targetUc.deck_id ? 'Deck Activo' : undefined),
    binder_page: targetUc.binder_page,
    binder_slot: targetUc.binder_slot,
    compartment_index: targetUc.compartment_index,
  };
}

export function validateDeckSectionLimit(section: 'main' | 'extra' | 'side' | 'extras', deckCards: DeckCard[], format: string): string | null {
  const maxMainSize = format === 'Duel Links' ? 30 : 60;
  const maxExtraSize = format === 'Duel Links' ? 8 : 15;
  const maxSideSize = 15;

  const mainCount = deckCards.filter((c) => c.section === 'main').reduce((acc, c) => acc + c.count, 0);
  const extraCount = deckCards.filter((c) => c.section === 'extra').reduce((acc, c) => acc + c.count, 0);
  const sideCount = deckCards.filter((c) => c.section === 'side').reduce((acc, c) => acc + c.count, 0);

  if (section === 'main' && mainCount >= maxMainSize) return `El Main Deck ha alcanzado el límite máximo (${maxMainSize} cartas).`;
  if (section === 'extra' && extraCount >= maxExtraSize) return `El Extra Deck ha alcanzado el límite máximo (${maxExtraSize} cartas).`;
  if (section === 'side' && sideCount >= maxSideSize) return `El Side Deck ha alcanzado el límite máximo (${maxSideSize} cartas).`;
  return null;
}
