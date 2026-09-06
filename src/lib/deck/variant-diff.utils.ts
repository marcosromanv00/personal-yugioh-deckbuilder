import { DeckCard } from '@/components/deckbuilder/types';
import { DeckVariantCard, VariantDiffSummary, UserCard, StorageLocation, Deck } from '@/types/collection';

interface ComputeVariantDiffParams {
  currentCards: DeckCard[];
  targetCards: DeckVariantCard[];
  userCards?: UserCard[];
  locations?: StorageLocation[];
  decks?: Deck[];
  currentDeckId?: string | null;
  currentLocationId?: string | null;
}

export function computeVariantDiff({
  currentCards,
  targetCards,
  userCards = [],
  locations = [],
  decks = [],
  currentDeckId = null,
  currentLocationId = null,
}: ComputeVariantDiffParams): VariantDiffSummary {
  const activeCurrent = currentCards.filter((c) => c.section !== 'extras');
  const activeTarget = targetCards.filter((c) => c.section !== 'extras');

  const currentMap = new Map<string, { card: DeckCard; count: number }>();
  activeCurrent.forEach((c) => {
    const key = `${c.id}_${c.section}`;
    const existing = currentMap.get(key);
    currentMap.set(key, { card: c, count: (existing?.count || 0) + c.count });
  });

  const targetMap = new Map<string, { card: DeckVariantCard; count: number }>();
  activeTarget.forEach((c) => {
    const key = `${c.card_id}_${c.section}`;
    const existing = targetMap.get(key);
    targetMap.set(key, { card: c, count: (existing?.count || 0) + c.count });
  });

  const toRemoveFromActive: VariantDiffSummary['toRemoveFromActive'] = [];
  const toAddToActive: VariantDiffSummary['toAddToActive'] = [];
  const unchangedCore: VariantDiffSummary['unchangedCore'] = [];

  // Analizar cartas actuales
  currentMap.forEach(({ card, count }, key) => {
    const targetEntry = targetMap.get(key);
    const targetCount = targetEntry ? targetEntry.count : 0;

    if (count > targetCount) {
      toRemoveFromActive.push({
        card_id: card.id,
        name: card.name,
        image_url: card.image_url,
        fromSection: card.section as 'main' | 'extra' | 'side',
        count: count - targetCount,
      });
    }

    const common = Math.min(count, targetCount);
    if (common > 0) {
      unchangedCore.push({
        card_id: card.id,
        name: card.name,
        section: card.section as 'main' | 'extra' | 'side',
        count: common,
      });
    }
  });

  // Analizar cartas que entran al deck activo
  targetMap.forEach(({ card, count }, key) => {
    const currentEntry = currentMap.get(key);
    const currentCount = currentEntry ? currentEntry.count : 0;

    if (count > currentCount) {
      const addedQty = count - currentCount;
      const matchingCards = currentCards.find((c) => c.id === card.card_id);
      const cardName = matchingCards?.name || card.card_details?.name || `Carta #${card.card_id}`;
      const imageUrl = matchingCards?.image_url || card.card_details?.image_url || '';

      // Buscar ubicación física en el inventario
      const availableCopies = userCards.filter((uc) => uc.card_id === card.card_id);
      let sourceLocation: VariantDiffSummary['toAddToActive'][0]['sourceLocation'] | undefined;
      let isMissing = false;

      if (availableCopies.length > 0) {
        // Priorizar copia en la misma deckbox/pool
        const localCopy = availableCopies.find(
          (uc) =>
            (currentLocationId && uc.storage_location_id === currentLocationId) ||
            (currentDeckId && uc.deck_id === currentDeckId)
        );

        if (localCopy) {
          const loc = locations.find((l) => l.id === localCopy.storage_location_id);
          sourceLocation = {
            locationId: localCopy.storage_location_id,
            locationName: loc?.name || 'Reserva de la Deckbox',
            compartmentIndex: localCopy.compartment_index,
            isCrossDeckLoan: false,
          };
        } else {
          // Copia externa (en otro deck o carpeta)
          const externalCopy = availableCopies[0];
          const otherDeck = externalCopy.deck_id
            ? decks.find((d) => d.id === externalCopy.deck_id)
            : undefined;
          const loc = locations.find((l) => l.id === externalCopy.storage_location_id);

          sourceLocation = {
            locationId: externalCopy.storage_location_id,
            locationName: otherDeck ? `Deck "${otherDeck.name}"` : loc?.name || 'Bandeja Inbox',
            compartmentIndex: externalCopy.compartment_index,
            deckName: otherDeck?.name,
            isCrossDeckLoan: Boolean(otherDeck && otherDeck.id !== currentDeckId),
          };
        }
      } else {
        isMissing = true;
      }

      toAddToActive.push({
        card_id: card.card_id,
        name: cardName,
        image_url: imageUrl,
        toSection: card.section as 'main' | 'extra' | 'side',
        count: addedQty,
        sourceLocation,
        isMissing,
      });
    }
  });

  return { toRemoveFromActive, toAddToActive, unchangedCore };
}
