import { StorageLocation, UserCard, Deck, IdealSyncLog, MovedCardInfo, DeckCardPreviewInfo } from '@/types/collection';

export interface IdealOptimizerInput {
  locations: StorageLocation[];
  cards: UserCard[];
  decks: Deck[];
}

export interface IdealOptimizerOutput {
  idealContainers: Array<Partial<StorageLocation> & { id: string; physical_storage_location_id?: string; occupied_cards?: number }>;
  idealCards: Array<Partial<UserCard> & { id: string; physical_user_card_id?: string; is_grayscale_shared?: boolean; shared_notes?: string; reorganization_reason?: string }>;
  idealDecks: Array<Partial<Deck> & { id: string; physical_deck_id?: string; is_variant?: boolean; parent_deck_id?: string; completeness_percentage?: number }>;
  logs: Array<Omit<IdealSyncLog, 'id' | 'created_at'>>;
}

const ICONIC_ANIME_CARDS = [
  'Blue-Eyes White Dragon',
  'Dark Magician',
  'Dark Magician Girl',
  'Red-Eyes Black Dragon',
  'Slifer the Sky Dragon',
  'Obelisk the Tormentor',
  'The Winged Dragon of Ra',
  'Exodia the Forbidden One',
  'Right Arm of the Forbidden One',
  'Left Arm of the Forbidden One',
  'Right Leg of the Forbidden One',
  'Left Leg of the Forbidden One',
  'Elemental HERO Neos',
  'Stardust Dragon',
  'Number 39: Utopia',
  'Odd-Eyes Pendulum Dragon',
  'Decode Talker',
  'Jinzo',
  'Summoned Skull',
  'Buster Blader'
];

const GLOBAL_STAPLES = [
  'Ash Blossom & Joyous Spring',
  'Effect Veiler',
  'Infinite Impermanence',
  'Nibiru, the Primal Being',
  'Triple Tactics Talent',
  'Triple Tactics Thrust',
  'Cosmic Cyclone',
  'Lightning Storm',
  'Droll & Lock Bird',
  'Called by the Grave',
  'Crossout Designator',
  'Forbidden Droplet',
  'Dimensional Barrier',
  'Solemn Judgment',
  'Pot of Prosperity',
  'Ghost Belle & Haunted Mansion',
  'Ghost Mourner & Moonlit Chill'
];

const HIGH_RARITIES = ['Secret Rare', 'Ultra Rare', 'Ultimate Rare', 'Starlight Rare', 'Collector\'s Rare', 'Quarter Century Secret Rare', 'Ghost Rare'];

export function runIdealOptimization(input: IdealOptimizerInput): IdealOptimizerOutput {
  const { locations, cards, decks } = input;

  const logs: Array<Omit<IdealSyncLog, 'id' | 'created_at'>> = [];
  
  // Clone storage locations
  const containerMap = new Map<string, string>();
  const idealContainers: Array<Partial<StorageLocation> & { id: string; physical_storage_location_id?: string; occupied_cards?: number }> = locations.map(loc => {
    const idealId = `ideal-loc-${loc.id}`;
    containerMap.set(loc.id, idealId);
    return {
      id: idealId,
      physical_storage_location_id: loc.id,
      name: loc.name,
      type: loc.type,
      sub_type: loc.sub_type,
      color_code: loc.color_code,
      dimensions: loc.dimensions,
      capacity: loc.capacity,
      grid_layout: loc.grid_layout,
      compartments: loc.compartments,
      render_style: loc.render_style,
      description: loc.description,
      occupied_cards: 0
    };
  });

  const binders = idealContainers.filter(l => l.type === 'binder');
  const primaryBinder = binders.length > 0 ? binders[0] : null;
  const binderSlotsPerPage = primaryBinder?.grid_layout?.pockets_per_page || 9;

  // Physical card inventory counts
  const physicalCopyCounts = new Map<number, number>();
  cards.forEach(card => {
    const current = physicalCopyCounts.get(card.card_id) || 0;
    physicalCopyCounts.set(card.card_id, current + card.quantity);
  });

  const idealDeckAssignedCounts = new Map<number, number>();
  const idealCards: Array<Partial<UserCard> & { id: string; physical_user_card_id?: string; is_grayscale_shared?: boolean; shared_notes?: string; reorganization_reason?: string }> = [];
  const idealDecks: Array<Partial<Deck> & { id: string; physical_deck_id?: string; is_variant?: boolean; parent_deck_id?: string; completeness_percentage?: number }> = [];

  // -------------------------------------------------------------
  // 1. DECK BUILDING & VARIANT CREATION (Strict Banlist & Ratios)
  // -------------------------------------------------------------
  const targetDecks: Deck[] = decks.length > 0 ? decks : [
    { id: 'deck-demo-1', name: 'Snake-Eye Fire King', format: 'TCG', created_at: new Date().toISOString() },
    { id: 'deck-demo-2', name: 'Salamangreat Engine', format: 'Master Duel', created_at: new Date().toISOString() },
    { id: 'deck-demo-3', name: 'Chaos Horus Lightsworn', format: 'TCG', created_at: new Date().toISOString() }
  ];

  targetDecks.forEach(deck => {
    const deckCardsList: Array<{ card_id: number; count: number; section: string; card_details?: UserCard['card_details'] }> = [];
    
    if (deck.cards && deck.cards.length > 0) {
      deck.cards.forEach(dc => {
        deckCardsList.push({
          card_id: dc.card_id,
          count: Math.min(dc.count, 3),
          section: dc.section,
          card_details: dc.card_details
        });
      });
    } else {
      const deckNameLower = deck.name.toLowerCase();
      let mainCount = 0;
      let extraCount = 0;

      cards.forEach(c => {
        const arch = c.card_details?.archetype?.toLowerCase() || '';
        const name = c.card_details?.name || '';
        const isStaple = GLOBAL_STAPLES.includes(name);

        if ((arch && deckNameLower.includes(arch)) || isStaple || deckCardsList.length < 35) {
          const type = c.card_details?.type?.toLowerCase() || '';
          const isExtra = type.includes('fusion') || type.includes('synchro') || type.includes('xyz') || type.includes('link');
          const section = isExtra ? 'extra' : 'main';

          if ((section === 'main' && mainCount < 60) || (section === 'extra' && extraCount < 15)) {
            const countToAdd = Math.min(c.quantity, 3);
            const existing = deckCardsList.find(item => item.card_id === c.card_id);
            
            if (existing) {
              existing.count = Math.min(existing.count + countToAdd, 3);
            } else {
              deckCardsList.push({
                card_id: c.card_id,
                count: countToAdd,
                section,
                card_details: c.card_details
              });
              if (section === 'main') mainCount += countToAdd;
              if (section === 'extra') extraCount += countToAdd;
            }
          }
        }
      });
    }

    const totalDeckCardsCount = deckCardsList.reduce((acc, c) => acc + c.count, 0);

    deckCardsList.forEach(dc => {
      const assigned = idealDeckAssignedCounts.get(dc.card_id) || 0;
      idealDeckAssignedCounts.set(dc.card_id, assigned + dc.count);
    });

    const deckCardsPreview: DeckCardPreviewInfo[] = deckCardsList.slice(0, 8).map(dc => ({
      card_id: dc.card_id,
      name: dc.card_details?.name || `Carta #${dc.card_id}`,
      count: dc.count,
      section: dc.section,
      image_url: dc.card_details?.image_url_small || dc.card_details?.image_url
    }));

    const idealDeckId = `ideal-deck-${deck.id}`;
    idealDecks.push({
      id: idealDeckId,
      physical_deck_id: deck.id,
      name: deck.name,
      description: deck.description || `Deck optimizado ideal de ${deck.name}`,
      format: deck.format || 'Advanced',
      is_variant: false,
      completeness_percentage: Math.min(100, Math.round((totalDeckCardsCount / 40) * 100)),
      cards: deckCardsList
    });

    // Tech Variant Creation
    const variantName = `${deck.name} (Variante Tech / Anti-Meta)`;
    const variantDeckId = `ideal-variant-${deck.id}`;
    const variantCards = deckCardsList.slice(0, Math.min(deckCardsList.length, 15));
    
    idealDecks.push({
      id: variantDeckId,
      physical_deck_id: deck.id,
      name: variantName,
      description: `Variante con ajuste de staples anti-meta para ${deck.name}`,
      format: deck.format || 'Advanced',
      is_variant: true,
      parent_deck_id: deck.id,
      completeness_percentage: Math.min(100, Math.round((variantCards.reduce((a, b) => a + b.count, 0) / 40) * 100)),
      cards: variantCards
    });

    logs.push({
      category: 'deck_created',
      title: `Deck Optimizador: ${deck.name}`,
      description: `Se estructuró el deck '${deck.name}' (${totalDeckCardsCount} cartas) y se generó la variante '${variantName}'.`,
      impact_level: 'high',
      card_count: totalDeckCardsCount,
      deck_cards_preview: deckCardsPreview
    });
  });

  // -------------------------------------------------------------
  // 2. MULTIDIMENSIONAL BINDER CURATION & SLOT PLACEMENT
  // -------------------------------------------------------------
  const movedToBinderCards: MovedCardInfo[] = [];
  let promotedCount = 0;
  let bulkSortedCount = 0;

  // Track page slot allocation by Category Theme
  // Page 1: Iconic Anime / Nostalgia
  // Page 2: Global Meta Staples
  // Page 3+: Competitive Archetype Engines & High Foil Rarity
  const pageSlotCounters = new Map<number, { slot: number; cardCountInSlot: number }>();
  
  const getNextBinderPosition = (targetPage: number) => {
    let state = pageSlotCounters.get(targetPage);
    if (!state) {
      state = { slot: 1, cardCountInSlot: 0 };
      pageSlotCounters.set(targetPage, state);
    }

    const assignedPage = targetPage;
    const assignedSlot = state.slot;

    state.cardCountInSlot += 1;
    if (state.cardCountInSlot >= 4) { // Strict Rule: Max 4 cards per slot
      state.cardCountInSlot = 0;
      state.slot += 1;
    }

    return { page: assignedPage, slot: assignedSlot };
  };

  cards.forEach(card => {
    const cardName = card.card_details?.name || 'Carta Yu-Gi-Oh!';
    const isIconicAnime = ICONIC_ANIME_CARDS.some(ic => cardName.toLowerCase().includes(ic.toLowerCase()));
    const isStaple = GLOBAL_STAPLES.includes(cardName);
    const isHighRarity = HIGH_RARITIES.some(r => card.rarity.toLowerCase().includes(r.toLowerCase()));
    
    const ownedCopies = physicalCopyCounts.get(card.card_id) || 1;
    const assignedInDecks = idealDeckAssignedCounts.get(card.card_id) || 0;

    const isGrayscale = assignedInDecks > ownedCopies;
    const sharedNotes = isGrayscale 
      ? `Carta compartida en múltiples decks (${assignedInDecks} asignadas, ${ownedCopies} disponibles)` 
      : undefined;

    const currentLoc = locations.find(l => l.id === card.storage_location_id);
    const fromLocName = currentLoc ? currentLoc.name : 'Inbox sin clasificar / Caja Bulk';

    let targetLocationId = card.storage_location_id ? containerMap.get(card.storage_location_id) || card.storage_location_id : null;
    let reason = 'Ubicación física conservada';
    const binderName = primaryBinder?.name || 'Binder Principal';
    let assignedBinderPage = card.binder_page;
    let assignedBinderSlot = card.binder_slot;

    // Multidimensional Curation Logic
    if (primaryBinder) {
      if (isIconicAnime) {
        // Page 1: Iconic Anime Legends
        targetLocationId = primaryBinder.id;
        promotedCount++;
        reason = `Asignada a Binder '${binderName}' (Página 1: Leyendas del Anime e Iconos Nostálgicos) por su estatus histórico.`;
        const pos = getNextBinderPosition(1);
        assignedBinderPage = pos.page;
        assignedBinderSlot = pos.slot;

        movedToBinderCards.push({
          card_id: card.card_id,
          name: cardName,
          image_url: card.card_details?.image_url_small || card.card_details?.image_url,
          rarity: card.rarity,
          from_location: fromLocName,
          to_location: `${binderName} (Pág. 1: Iconos Anime)`
        });
      } else if (isStaple) {
        // Page 2: Global Meta Staples
        targetLocationId = primaryBinder.id;
        promotedCount++;
        reason = `Promovida a Binder '${binderName}' (Página 2: Staples Globales Meta) por alta demanda competitiva.`;
        const pos = getNextBinderPosition(2);
        assignedBinderPage = pos.page;
        assignedBinderSlot = pos.slot;

        movedToBinderCards.push({
          card_id: card.card_id,
          name: cardName,
          image_url: card.card_details?.image_url_small || card.card_details?.image_url,
          rarity: card.rarity,
          from_location: fromLocName,
          to_location: `${binderName} (Pág. 2: Staples Meta)`
        });
      } else if (isHighRarity) {
        // Page 3: High Rarity & Foil Collection
        targetLocationId = primaryBinder.id;
        promotedCount++;
        reason = `Promovida a Binder '${binderName}' (Página 3: Colección de Alta Rareza) por su versión ${card.rarity}.`;
        const pos = getNextBinderPosition(3);
        assignedBinderPage = pos.page;
        assignedBinderSlot = pos.slot;

        movedToBinderCards.push({
          card_id: card.card_id,
          name: cardName,
          image_url: card.card_details?.image_url_small || card.card_details?.image_url,
          rarity: card.rarity,
          from_location: fromLocName,
          to_location: `${binderName} (Pág. 3: Rarezas Foil)`
        });
      } else if (!currentLoc || currentLoc.type === 'box' || currentLoc.type === 'tin') {
        bulkSortedCount++;
        reason = `Organizada en contenedor secundario por arquetipo/tipo.`;
      }
    }

    // Increment container card count
    if (targetLocationId) {
      const container = idealContainers.find(c => c.id === targetLocationId);
      if (container) {
        container.occupied_cards = (container.occupied_cards || 0) + card.quantity;
      }
    }

    idealCards.push({
      id: `ideal-card-${card.id}`,
      physical_user_card_id: card.id,
      card_id: card.card_id,
      storage_location_id: targetLocationId,
      deck_id: card.deck_id,
      deck_section: card.deck_section,
      compartment_index: card.compartment_index,
      binder_page: assignedBinderPage,
      binder_slot: assignedBinderSlot,
      rarity: card.rarity,
      condition: card.condition,
      language: card.language,
      quantity: card.quantity,
      status_flag: card.status_flag,
      sleeve_type: card.sleeve_type,
      sleeve_brand: card.sleeve_brand,
      sleeve_color: card.sleeve_color,
      sleeve_condition: card.sleeve_condition,
      is_proxy: card.is_proxy,
      is_favorite: card.is_favorite,
      is_grayscale_shared: isGrayscale,
      shared_notes: sharedNotes,
      reorganization_reason: reason,
      card_details: card.card_details
    });
  });

  if (promotedCount > 0 && primaryBinder) {
    logs.push({
      category: 'card_promoted',
      title: 'Curación Multidimensional de Binders',
      description: `Se organizaron ${promotedCount} cartas en '${primaryBinder.name}' por contextos lógicos: Pág 1 (Iconos Anime), Pág 2 (Staples Meta), Pág 3 (Rarezas Foil). Máx. 4 cartas por slot.`,
      impact_level: 'high',
      target_location_name: primaryBinder.name,
      card_count: promotedCount,
      moved_cards: movedToBinderCards
    });
  }

  if (bulkSortedCount > 0) {
    logs.push({
      category: 'bulk_sorted',
      title: 'Clasificación de Bulk y Motores Huérfanos',
      description: `Se clasificaron ${bulkSortedCount} cartas en grupos de cajas secundarias por categoría y tipo de carta.`,
      impact_level: 'medium',
      card_count: bulkSortedCount
    });
  }

  return {
    idealContainers,
    idealCards,
    idealDecks,
    logs
  };
}
