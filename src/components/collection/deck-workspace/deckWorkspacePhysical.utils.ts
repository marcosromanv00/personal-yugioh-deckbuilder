import { DeckCardDetail, UserCard, DeckCardPhysicalCopy, SaveDeckWorkspacePayload } from '@/types/collection';

export function enrichDeckCardsWithPhysicalCopies(
  deckCards: DeckCardDetail[],
  userCards: UserCard[],
  deckId?: string | null
): DeckCardDetail[] {
  if (!deckCards || deckCards.length === 0) return [];
  if (!userCards || userCards.length === 0 || !deckId) {
    return deckCards.map((dc) => ({
      ...dc,
      physical_copies: dc.physical_copies || [],
      pending_count: Math.max(0, dc.count - (dc.physical_copies?.length || 0)),
    }));
  }

  const userCardsInDeck = userCards.filter((uc) => uc.deck_id === deckId);
  const copyMap = new Map<string, UserCard[]>();

  for (const uc of userCardsInDeck) {
    const rawSec = (uc.deck_section as string | null | undefined);
    const sec = rawSec === 'pool' || rawSec === 'extras' ? 'extras' : uc.deck_section || 'main';
    const key = `${uc.card_id}_${sec}`;
    const list = copyMap.get(key) || [];
    list.push(uc);
    copyMap.set(key, list);
  }

  return deckCards.map((dc) => {
    // If already enriched (e.g. from a previous hydration), just recount staged placeholders
    if (dc.physical_copies && dc.physical_copies.length > 0) {
      const stagedCount = dc.physical_copies.filter((cp) => cp.source_status === 'staged').length;
      return { ...dc, pending_count: stagedCount };
    }

    const sec = dc.section === 'pool' || dc.section === 'extras' ? 'extras' : dc.section;
    const key = `${dc.card_id}_${sec}`;
    const availableUserCopies = copyMap.get(key) || [];

    const matchedCopies = availableUserCopies.slice(0, dc.count);
    copyMap.set(key, availableUserCopies.slice(dc.count));

    // All copies from DB → 'existing'
    const physical_copies: DeckCardPhysicalCopy[] = matchedCopies.map((uc) => ({
      user_card_id: uc.id,
      storage_location_id: uc.storage_location_id,
      rarity: uc.rarity,
      condition: uc.condition,
      is_proxy: uc.is_proxy,
      is_in_active_deck: true,
      active_deck_id: deckId,
      compartment_index: uc.compartment_index,
      binder_page: uc.binder_page,
      binder_slot: uc.binder_slot,
      source_status: 'existing' as const,
    }));

    // Cards not matched by userCards get staged placeholders to fill remaining slots
    const unmatchedCount = Math.max(0, dc.count - physical_copies.length);
    const stagedPlaceholders: DeckCardPhysicalCopy[] = Array.from({ length: unmatchedCount }, () => ({
      source_status: 'staged' as const,
    }));

    const allCopies = [...physical_copies, ...stagedPlaceholders];
    return {
      ...dc,
      physical_copies: allCopies,
      pending_count: stagedPlaceholders.length,
    };
  });
}

function countStaged(cards: DeckCardDetail[]): number {
  return cards.reduce(
    (s, c) => s + (c.physical_copies?.filter((cp) => cp.source_status === 'staged').length ?? 0),
    0
  );
}

function countExisting(cards: DeckCardDetail[]): number {
  return cards.reduce(
    (s, c) => s + (c.physical_copies?.filter((cp) => cp.source_status !== 'staged').length ?? 0),
    0
  );
}

export function calculateSectionBalances(deckCards: DeckCardDetail[]) {
  const mainCards = deckCards.filter((c) => c.section === 'main');
  const extraCards = deckCards.filter((c) => c.section === 'extra');
  const sideCards = deckCards.filter((c) => c.section === 'side');
  const poolCards = deckCards.filter((c) => c.section === 'pool' || c.section === 'extras');

  return {
    mainCards,
    extraCards,
    sideCards,
    poolCards,
    mainPhysicalCount: countExisting(mainCards),
    mainPendingCount: countStaged(mainCards),
    extraPhysicalCount: countExisting(extraCards),
    extraPendingCount: countStaged(extraCards),
    sidePhysicalCount: countExisting(sideCards),
    sidePendingCount: countStaged(sideCards),
    poolPhysicalCount: countExisting(poolCards),
    poolPendingCount: countStaged(poolCards),
    totalPendingCount:
      countStaged(mainCards) +
      countStaged(extraCards) +
      countStaged(sideCards) +
      countStaged(poolCards),
  };
}

export interface BuildDeckSavePayloadParams {
  deckId: string;
  name: string;
  format: string;
  isActive: boolean;
  storageLocationId: string;
  compartmentIndex: number;
  sleevesPayload: Array<{ sleeve_id: string; section: string }>;
  deckCards: DeckCardDetail[];
  assignedUserCardIds: string[];
  unassignedUserCardIds: string[];
  inventoryCardsToAdd?: Array<{
    id: number;
    count: number;
    rarity: string;
    condition: string;
    is_proxy: boolean;
    section: string;
  }>;
}

export function buildDeckSavePayload(params: BuildDeckSavePayloadParams): SaveDeckWorkspacePayload {
  const payloadCards = params.deckCards.map((c) => ({
    id: c.card_id,
    count: c.count,
    section: c.section === 'pool' || c.section === 'extras' ? 'extras' : c.section,
    name: c.card_details?.name,
    type: c.card_details?.type,
    image_url: c.card_details?.image_url,
  }));

  return {
    id: params.deckId,
    name: params.name,
    format: params.format,
    is_active: params.isActive,
    storage_location_id: params.storageLocationId || null,
    compartment_index: params.compartmentIndex,
    sleeves: params.sleevesPayload,
    cards: payloadCards,
    assigned_user_card_ids: params.assignedUserCardIds,
    unassigned_user_card_ids: params.unassignedUserCardIds,
    inventory_cards_to_add: params.inventoryCardsToAdd || [],
  };
}

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
