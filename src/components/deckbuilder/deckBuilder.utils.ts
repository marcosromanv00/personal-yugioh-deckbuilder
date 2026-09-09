import { DeckCard, DeckCardPhysicalCopy } from './types';
import { StorageLocation } from '@/types/collection';
import { ExtractionGroup, ExtractionCardItem } from './types/deckBuilderState.types';
import { UnregisteredCardItem } from './components/UnregisteredCardsModal';

export const isExtraDeckCard = (cardType?: string): boolean => {
  if (!cardType) return false;
  const t = cardType.toLowerCase();
  return t.includes('fusion') || t.includes('link') || t.includes('synchro') || t.includes('xyz');
};

export const buildExtractionPickList = (
  deckCards: DeckCard[],
  locations: StorageLocation[]
): ExtractionGroup[] => {
  const groupsMap = new Map<string, ExtractionGroup>();

  const getOrCreateGroup = (
    id: string,
    name: string,
    type: ExtractionGroup['type'],
    colorCode?: string
  ): ExtractionGroup => {
    if (!groupsMap.has(id)) {
      groupsMap.set(id, { id, name, type, colorCode, cards: [] });
    }
    return groupsMap.get(id)!;
  };

  deckCards.forEach((card) => {
    const copies: DeckCardPhysicalCopy[] =
      card.physical_copies && card.physical_copies.length > 0
        ? card.physical_copies
        : Array.from({ length: card.count }).map((): DeckCardPhysicalCopy => ({
            is_proxy: true,
            rarity: 'Receta / Proxy',
          }));

    copies.forEach((copy) => {
      if (copy.is_proxy || !copy.user_card_id) {
        const group = getOrCreateGroup('proxies', 'Recetas Virtuales / Proxies', 'global_proxy', '#71717a');
        const existingCard = group.cards.find(
          (c) => c.cardId === card.id && c.rarity === (copy.rarity || 'Receta / Proxy')
        );
        if (existingCard) {
          existingCard.count += 1;
        } else {
          group.cards.push({
            cardId: card.id,
            name: card.name,
            rarity: copy.rarity || 'Receta / Proxy',
            count: 1,
            image_url: card.image_url,
          });
        }
      } else if (copy.is_in_active_deck && copy.active_deck_name) {
        const groupId = `conflict-${copy.active_deck_id || 'unknown'}`;
        const group = getOrCreateGroup(
          groupId,
          `⚔️ Deck Activo: ${copy.active_deck_name}`,
          'conflict_deck',
          '#f59e0b'
        );
        group.cards.push({
          cardId: card.id,
          name: card.name,
          rarity: copy.rarity || 'Common',
          count: 1,
          image_url: card.image_url,
          userCardId: copy.user_card_id,
          isInActiveDeck: true,
          activeDeckId: copy.active_deck_id,
          activeDeckName: copy.active_deck_name,
        });
      } else if (copy.storage_location_id) {
        const loc = locations.find((l) => l.id === copy.storage_location_id);
        const group = getOrCreateGroup(
          loc?.id || copy.storage_location_id,
          loc ? `${loc.type === 'binder' ? '📁' : '📦'} ${loc.name}` : '📦 Contenedor',
          (loc?.type as ExtractionGroup['type']) || 'box',
          loc?.color_code || '#ef4444'
        );

        let locationDetail = '';
        if (loc?.type === 'binder' && copy.binder_page) {
          locationDetail = `Pág. ${copy.binder_page}${copy.binder_slot ? `, Ranura ${copy.binder_slot}` : ''}`;
        } else if (copy.compartment_index !== undefined) {
          locationDetail = `Carril ${copy.compartment_index + 1}`;
        }

        group.cards.push({
          cardId: card.id,
          name: card.name,
          rarity: copy.rarity || 'Common',
          count: 1,
          image_url: card.image_url,
          locationDetail,
          userCardId: copy.user_card_id,
        });
      } else {
        const group = getOrCreateGroup('inbox', '📥 Inbox / Sin clasificar', 'inbox', '#3b82f6');
        group.cards.push({
          cardId: card.id,
          name: card.name,
          rarity: copy.rarity || 'Common',
          count: 1,
          image_url: card.image_url,
          userCardId: copy.user_card_id,
        });
      }
    });
  });

  return Array.from(groupsMap.values());
};

export const getUnregisteredCardsList = (
  deckCards: DeckCard[],
  userInventoryCounts: Record<number, number>
): UnregisteredCardItem[] => {
  const list: UnregisteredCardItem[] = [];
  deckCards.forEach((card) => {
    const stagedCount = (card.physical_copies || []).filter(
      (cp) => !cp.user_card_id || cp.source_status === 'staged'
    ).length;
    if (stagedCount > 0) {
      const owned = userInventoryCounts[card.id] || 0;
      list.push({
        id: card.id,
        name: card.name,
        count: card.count,
        section: card.section,
        image_url: card.image_url,
        owned,
        missing: stagedCount,
      });
    }
  });
  return list;
};

export const buildDeckSnapshot = (
  deckName: string,
  deckDescription: string,
  format: string,
  saveFormat: string,
  deckId: string | null,
  selectedMainSleeveId: string,
  selectedExtraSleeveId: string,
  deckCards: DeckCard[]
): string => {
  return JSON.stringify({
    deckName,
    deckDescription,
    format,
    saveFormat,
    deckId,
    selectedMainSleeveId,
    selectedExtraSleeveId,
    cards: deckCards.map((c) => ({
      id: c.id,
      count: c.count,
      section: c.section,
      proxy_count: c.proxy_count || 0,
      rarity: c.rarity,
      condition: c.condition,
    })),
  });
};
