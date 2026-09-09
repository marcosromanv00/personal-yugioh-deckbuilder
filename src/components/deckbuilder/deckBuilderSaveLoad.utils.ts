import { Deck, StorageLocation, UserCard } from '@/types/collection';
import { DeckCard, DeckCardPhysicalCopy, Card } from './types';
import { saveDeckSleeveApi, deleteDeckSleeveApi } from './services/deckBuilder.api';
import { UnregisteredAction } from './components/UnregisteredCardsModal';

export function mapDeckCardsOnLoad(
  selected: Deck,
  allUserCards: UserCard[],
  locations: StorageLocation[]
): DeckCard[] {
  const userCardsInDeck = allUserCards.filter(
    (uc) =>
      uc.deck_id === selected.id ||
      (selected.storage_location_id &&
        uc.storage_location_id === selected.storage_location_id &&
        uc.compartment_index === (selected.compartment_index || 0))
  );
  const deckAssignedCounts: Record<string, number> = {};

  return (selected.cards || []).map((dc) => {
    const cardDetails = dc.card_details as (Card & typeof dc.card_details);
    const matchingPhysical = userCardsInDeck.filter((uc) => uc.card_id === dc.card_id);
    const physicalCopies: DeckCardPhysicalCopy[] = [];

    for (let i = 0; i < dc.count; i++) {
      const availableUc = matchingPhysical.find(
        (uc) => (deckAssignedCounts[uc.id] || 0) < (uc.quantity || 1)
      );
      if (availableUc) {
        deckAssignedCounts[availableUc.id] = (deckAssignedCounts[availableUc.id] || 0) + 1;
        const loc = locations.find((l) => l.id === availableUc.storage_location_id);
        physicalCopies.push({
          user_card_id: availableUc.id,
          storage_location_id: availableUc.storage_location_id,
          location_name: loc ? loc.name : 'Inbox / Sin clasificar',
          rarity: availableUc.rarity || 'Common',
          condition: availableUc.condition || 'Near Mint',
          is_proxy: Boolean(availableUc.is_proxy),
          is_in_active_deck: Boolean(availableUc.deck_id && availableUc.deck_id !== selected.id),
          active_deck_id: availableUc.deck_id || undefined,
          active_deck_name: availableUc.deck_details?.name,
          binder_page: availableUc.binder_page,
          binder_slot: availableUc.binder_slot,
          compartment_index: availableUc.compartment_index,
        });
      } else {
        physicalCopies.push({ is_proxy: true, rarity: 'Receta / Proxy' });
      }
    }

    return {
      id: dc.card_id,
      name: cardDetails?.name || `Carta #${dc.card_id}`,
      count: dc.count,
      proxy_count: dc.proxy_count || 0,
      section: dc.section as 'main' | 'extra' | 'side' | 'extras',
      type: cardDetails?.type || 'Monster',
      image_url: cardDetails?.image_url || cardDetails?.image_url_small || `https://images.ygoprodeck.com/images/cards/${dc.card_id}.jpg`,
      ban_master_duel: cardDetails?.ban_master_duel,
      ban_tcg: cardDetails?.ban_tcg,
      ban_duel_links: cardDetails?.ban_duel_links,
      atk: cardDetails?.atk,
      def: cardDetails?.def,
      level: cardDetails?.level,
      race: cardDetails?.race,
      attribute: cardDetails?.attribute,
      physical_copies: physicalCopies,
    };
  });
}

export function buildQuickSavePayload(
  deckCards: DeckCard[],
  overrideActions: Record<number, UnregisteredAction> | undefined,
  userInventoryCounts: Record<number, number>,
  allUserCards: UserCard[],
  meta: { deckId: string | null; deckName: string; deckDescription: string; saveFormat: string; format: string; saveIsActive: boolean; targetLocationId: string; selectedLaneIndex: number; deactivatedDeckIds: string[] }
) {
  const inventoryCardsToAdd: { id: number; count: number }[] = [];
  const assignedUserCardIds: string[] = [];

  if (overrideActions) {
    deckCards.forEach((c) => {
      const act = overrideActions[c.id];
      const stagedCount = (c.physical_copies || []).filter((cp) => !cp.user_card_id || cp.source_status === 'staged').length;
      if (act === 'register') {
        const deficit = stagedCount > 0 ? stagedCount : Math.max(1, c.count - (userInventoryCounts[c.id] || 0));
        inventoryCardsToAdd.push({ id: c.id, count: deficit });
      } else if (act === 'take_collection') {
        const available = allUserCards.filter((uc) => uc.card_id === c.id);
        const needed = stagedCount > 0 ? stagedCount : c.count;
        available.slice(0, needed).forEach((uc) => { if (uc.id && !uc.is_proxy) assignedUserCardIds.push(uc.id); });
      }
    });
  } else {
    deckCards.forEach((c) => c.physical_copies?.forEach((pc) => { if (pc.user_card_id && !pc.is_proxy) assignedUserCardIds.push(pc.user_card_id); }));
  }

  return {
    id: meta.deckId || undefined,
    name: meta.deckName,
    description: meta.deckDescription,
    format: meta.saveFormat || meta.format,
    is_active: meta.saveIsActive,
    storage_location_id: meta.targetLocationId === 'inbox' ? null : meta.targetLocationId,
    compartment_index: meta.targetLocationId === 'inbox' ? 0 : meta.selectedLaneIndex,
    cards: deckCards.map((c) => ({ id: c.id, name: c.name, count: c.count, proxy_count: c.proxy_count || 0, section: c.section, type: c.type, image_url: c.image_url })),
    register_to_inventory: inventoryCardsToAdd.length > 0,
    inventory_cards_to_add: inventoryCardsToAdd,
    assigned_user_card_ids: assignedUserCardIds,
    deactivated_deck_ids: meta.deactivatedDeckIds,
  };
}

export function buildSaveDeckPayload(
  deckCards: DeckCard[],
  cardsToRegister: Record<number, boolean>,
  userInventoryCounts: Record<number, number>,
  meta: {
    finalDeckId: string | null;
    deckName: string;
    deckDescription: string;
    saveFormat: string;
    saveIsActive: boolean;
    targetLocationId: string;
    selectedLaneIndex: number;
    registerToInventory: boolean;
    deactivatedDeckIds: string[];
  }
) {
  const cardsToRegisterList = deckCards.filter((c) => cardsToRegister[c.id]);
  const assignedUserCardIds: string[] = [];
  deckCards.forEach((c) =>
    c.physical_copies?.forEach((pc) => {
      if (pc.user_card_id && !pc.is_proxy) assignedUserCardIds.push(pc.user_card_id);
    })
  );

  return {
    id: meta.finalDeckId,
    name: meta.deckName,
    description: meta.deckDescription,
    format: meta.saveFormat,
    is_active: meta.saveIsActive,
    storage_location_id: meta.targetLocationId === 'inbox' ? null : meta.targetLocationId,
    compartment_index: meta.targetLocationId === 'inbox' ? 0 : meta.selectedLaneIndex,
    cards: deckCards.map((c) => ({
      id: c.id,
      name: c.name,
      count: c.count,
      proxy_count: c.proxy_count || 0,
      section: c.section,
      type: c.type,
      image_url: c.image_url,
    })),
    register_to_inventory: meta.registerToInventory,
    inventory_cards_to_add: cardsToRegisterList.map((c) => ({
      id: c.id,
      count: Math.max(1, c.count - (userInventoryCounts[c.id] || 0)),
    })),
    assigned_user_card_ids: assignedUserCardIds,
    deactivated_deck_ids: meta.deactivatedDeckIds,
  };
}

export async function syncDeckSleeves(
  savedDeckId: string,
  selectedMainSleeveId: string,
  selectedExtraSleeveId: string,
  mainMode: 'take' | 'add',
  mainQty: number,
  extraMode: 'take' | 'add',
  extraQty: number
) {
  if (selectedMainSleeveId) {
    await saveDeckSleeveApi(savedDeckId, { sleeve_id: selectedMainSleeveId, section_type: 'main_side', action_mode: mainMode, added_quantity: mainQty });
  } else {
    await deleteDeckSleeveApi(savedDeckId, 'main_side');
  }
  if (selectedExtraSleeveId) {
    await saveDeckSleeveApi(savedDeckId, { sleeve_id: selectedExtraSleeveId, section_type: 'extra', action_mode: extraMode, added_quantity: extraQty });
  } else {
    await deleteDeckSleeveApi(savedDeckId, 'extra');
  }
}
