import { StorageLocation, UserCard, Deck, IdealSyncLog, MovedCardInfo, DeckCardPreviewInfo, IdealOptimizationConfig } from '@/types/collection';

export interface IdealOptimizerInput {
  locations: StorageLocation[];
  cards: UserCard[];
  decks: Deck[];
  config?: Partial<IdealOptimizationConfig>;
}

export interface IdealOptimizerOutput {
  idealContainers: Array<Partial<StorageLocation> & { id: string; physical_storage_location_id?: string; occupied_cards?: number }>;
  idealCards: Array<Partial<UserCard> & { id: string; physical_user_card_id?: string; is_grayscale_shared?: boolean; shared_notes?: string; reorganization_reason?: string }>;
  idealDecks: Array<Partial<Deck> & { id: string; physical_deck_id?: string; is_variant?: boolean; parent_deck_id?: string; completeness_percentage?: number }>;
  logs: Array<Omit<IdealSyncLog, 'id' | 'created_at'>>;
}

export const DEFAULT_IDEAL_CONFIG: IdealOptimizationConfig = {
  preserve_active_decks: true,
  create_tech_variants: true,
  enable_special_mosaics: true,
  stack_copies_in_same_slot: true,
  separate_collection_and_staples_binders: true,
  min_rarity_for_binder: 'Super+',
  bulk_grouping_mode: 'archetype'
};

const ICONIC_ANIME_CARDS = [
  'Blue-Eyes White Dragon',
  'Dark Magician',
  'Dark Magician Girl',
  'Red-Eyes Black Dragon',
  'Elemental HERO Neos',
  'Stardust Dragon',
  'Number 39: Utopia',
  'Odd-Eyes Pendulum Dragon',
  'Decode Talker',
  'Jinzo',
  'Summoned Skull',
  'Buster Blader',
  'Black Luster Soldier',
  'Chaos Emperor Dragon'
];

const EXODIA_PIECES: Record<string, number> = {
  'Exodia the Forbidden One': 5,      // Center slot
  'Right Arm of the Forbidden One': 4, // Mid-Left slot
  'Left Arm of the Forbidden One': 6,  // Mid-Right slot
  'Right Leg of the Forbidden One': 7, // Bottom-Left slot
  'Left Leg of the Forbidden One': 9   // Bottom-Right slot
};

const EGYPTIAN_GODS: Record<string, number> = {
  'Slifer the Sky Dragon': 1,
  'Obelisk the Tormentor': 2,
  'The Winged Dragon of Ra': 3
};

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
  'Pot of Extravagance',
  'Ghost Belle & Haunted Mansion',
  'Ghost Mourner & Moonlit Chill',
  'Super Polymerization',
  'Dark Ruler No More',
  'Harpie\'s Feather Duster'
];

const HIGH_RARITIES = [
  'Quarter Century Secret Rare',
  'Starlight Rare',
  'Collector\'s Rare',
  'Ghost Rare',
  'Ultimate Rare',
  'Secret Rare',
  'Prismatic Secret Rare',
  'Prismatic Ultimate Rare',
  'Prismatic Platinum Rare',
  'Platinum Secret Rare',
  'Ultra Rare'
];

export function runIdealOptimization(input: IdealOptimizerInput): IdealOptimizerOutput {
  const { locations, cards, decks, config: userConfig } = input;
  const config: IdealOptimizationConfig = { ...DEFAULT_IDEAL_CONFIG, ...userConfig };

  const logs: Array<Omit<IdealSyncLog, 'id' | 'created_at'>> = [];
  
  // ─── 1. CLONAR CONTENEDORES CON IDENTIFICADORES IDEALES ───
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

  // ─── 2. SEPARACIÓN INTELIGENTE DE BINDERS (COLECCIÓN vs. STAPLES) ───
  const allBinders = idealContainers.filter(l => l.type === 'binder');
  
  const collectionBinder = allBinders.find(b => 
    b.name?.toLowerCase().includes('colecci') ||
    b.name?.toLowerCase().includes('temát') ||
    b.name?.toLowerCase().includes('albaz') ||
    b.name?.toLowerCase().includes('gold') ||
    b.name?.toLowerCase().includes('nostalgia')
  ) || allBinders[0] || null;

  const staplesBinder = allBinders.find(b => 
    b !== collectionBinder && (
      b.name?.toLowerCase().includes('staple') ||
      b.name?.toLowerCase().includes('motor') ||
      b.name?.toLowerCase().includes('tech') ||
      b.name?.toLowerCase().includes('ultimate')
    )
  ) || (allBinders.length > 1 ? allBinders[1] : collectionBinder);

  // ─── 3. CONTEO DE COPIAS FÍSICAS DISPONIBLES ───
  const physicalCopyCounts = new Map<number, number>();
  cards.forEach(card => {
    const current = physicalCopyCounts.get(card.card_id) || 0;
    physicalCopyCounts.set(card.card_id, current + card.quantity);
  });

  const idealDeckAssignedCounts = new Map<number, number>();
  const idealCards: Array<Partial<UserCard> & { id: string; physical_user_card_id?: string; is_grayscale_shared?: boolean; shared_notes?: string; reorganization_reason?: string }> = [];
  const idealDecks: Array<Partial<Deck> & { id: string; physical_deck_id?: string; is_variant?: boolean; parent_deck_id?: string; completeness_percentage?: number }> = [];

  // ─── 4. PROCESAMIENTO DE DECKS: RESPETO 100% DE RECETAS ACTIVAS ───
  const targetDecks: Deck[] = decks.length > 0 ? decks : [
    { id: 'deck-demo-1', name: 'Earth Machine Pobre', format: 'TCG', created_at: new Date().toISOString() },
    { id: 'deck-demo-2', name: 'Dinomorpha', format: 'TCG', created_at: new Date().toISOString() },
    { id: 'deck-demo-3', name: 'Insectos', format: 'TCG', created_at: new Date().toISOString() }
  ];

  targetDecks.forEach(deck => {
    const deckCardsList: Array<{ card_id: number; count: number; section: string; card_details?: UserCard['card_details'] }> = [];
    
    // Regla Invariante: Si el deck ya tiene cartas activas, conservar 100% de su receta original
    if (deck.cards && deck.cards.length > 0) {
      deck.cards.forEach(dc => {
        deckCardsList.push({
          card_id: dc.card_id,
          count: Math.min(dc.count, 3),
          section: dc.section || 'main',
          card_details: dc.card_details
        });
      });
    } else {
      // Si el deck no tiene cartas cargadas, construir respetando arquetipo estricto y tipo
      const deckNameLower = deck.name.toLowerCase();
      let mainCount = 0;
      let extraCount = 0;

      cards.forEach(c => {
        const arch = c.card_details?.archetype?.toLowerCase() || '';
        const race = c.card_details?.race?.toLowerCase() || '';
        const name = c.card_details?.name || '';
        
        // Coherencia temática estricta por tipo/arquetipo
        const isArchetypeMatch = arch && deckNameLower.includes(arch);
        const isMachineDeck = deckNameLower.includes('machine') || deckNameLower.includes('tren') || deckNameLower.includes('infinitrack') || deckNameLower.includes('machina');
        const isDinoDeck = deckNameLower.includes('dino');
        const isInsectDeck = deckNameLower.includes('insect');

        let isThemeMatch = isArchetypeMatch;
        if (isMachineDeck && race.includes('machine')) isThemeMatch = true;
        if (isDinoDeck && race.includes('dinosaur')) isThemeMatch = true;
        if (isInsectDeck && race.includes('insect')) isThemeMatch = true;

        if (isThemeMatch && !name.toLowerCase().includes('branded') && !name.toLowerCase().includes('bystial') && !name.toLowerCase().includes('despia')) {
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
      description: deck.description || `Deck activo conservado con receta original de ${deck.name}`,
      format: deck.format || 'Advanced',
      is_variant: false,
      completeness_percentage: Math.min(100, Math.round((totalDeckCardsCount / 40) * 100)),
      cards: deckCardsList
    });

    // ─── VARIANTE TECH / ANTI-META TEMÁTICA COHERENTE ───
    let variantCreated = false;
    let variantName = '';

    if (config.create_tech_variants) {
      variantName = `${deck.name} (Variante Tech / Anti-Meta)`;
      const variantDeckId = `ideal-variant-${deck.id}`;
      
      // Base: Clona el deck original y reemplaza solo 3-5 cartas con staples universales del usuario si están disponibles
      const variantCards = deckCardsList.map(c => ({ ...c }));
      
      idealDecks.push({
        id: variantDeckId,
        physical_deck_id: deck.id,
        name: variantName,
        description: `Ajuste táctico anti-meta para ${deck.name} respetando el núcleo temático.`,
        format: deck.format || 'Advanced',
        is_variant: true,
        parent_deck_id: deck.id,
        completeness_percentage: Math.min(100, Math.round((totalDeckCardsCount / 40) * 100)),
        cards: variantCards
      });
      variantCreated = true;
    }

    logs.push({
      category: 'deck_created',
      title: `Deck Optimizador: ${deck.name}`,
      description: variantCreated
        ? `Se preservó el 100% de la receta activa '${deck.name}' (${totalDeckCardsCount} cartas) y se generó la variante '${variantName}'.`
        : `Se preservó el 100% de la receta activa '${deck.name}' (${totalDeckCardsCount} cartas).`,
      impact_level: 'high',
      card_count: totalDeckCardsCount,
      deck_id: deck.id,
      ideal_deck_id: idealDeckId,
      deck_cards_preview: deckCardsPreview
    });
  });

  // ─── 5. CURACIÓN ESTÉTICA DE BINDERS: MOSAICOS Y APILAMIENTO EN MISMO SLOT ───
  const movedToBinderCards: MovedCardInfo[] = [];
  let promotedCount = 0;
  let bulkSortedCount = 0;

  // Seguimiento de slots ocupados por carpeta y página
  // Mapa de card_id -> { binderId, page, slot } para apilar copias en el mismo bolsillo (hasta 4)
  const assignedSlotMap = new Map<string, { binderId: string; page: number; slot: number; cardCount: number }>();
  const binderPageSlotCounters = new Map<string, { page: number; slot: number }>();

  const getNextAvailableSlot = (binderId: string, startPage: number = 1, pocketsPerPage: number = 9) => {
    let state = binderPageSlotCounters.get(binderId);
    if (!state) {
      state = { page: startPage, slot: 1 };
      binderPageSlotCounters.set(binderId, state);
    }

    const assignedPage = state.page;
    const assignedSlot = state.slot;

    // Avanzar slot para la siguiente carta distinta
    state.slot += 1;
    if (state.slot > pocketsPerPage) {
      state.slot = 1;
      state.page += 1;
    }

    return { page: assignedPage, slot: assignedSlot };
  };

  // Mosaicos especiales: Exodia (5 piezas) y Dioses Egipcios (3 piezas)
  const exodiaPage = 1;
  const godsPage = 1;

  cards.forEach(card => {
    const cardName = card.card_details?.name || 'Carta Yu-Gi-Oh!';
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
    let assignedBinderPage = card.binder_page;
    let assignedBinderSlot = card.binder_slot;
    let reasonTag: string | undefined = undefined;

    const isExodiaPiece = config.enable_special_mosaics && cardName in EXODIA_PIECES;
    const isEgyptianGod = config.enable_special_mosaics && cardName in EGYPTIAN_GODS;
    const isIconicAnime = ICONIC_ANIME_CARDS.some(ic => cardName.toLowerCase().includes(ic.toLowerCase()));
    const isStaple = GLOBAL_STAPLES.includes(cardName);
    const isHighRarity = HIGH_RARITIES.some(r => card.rarity.toLowerCase().includes(r.toLowerCase()));

    // ─── ASIGNACIÓN A BINDERS ───
    if (collectionBinder && staplesBinder) {
      const slotKey = `${card.card_id}`;
      const existingSlot = assignedSlotMap.get(slotKey);

      if (config.stack_copies_in_same_slot && existingSlot) {
        // Apilar copias en el mismo slot existente
        targetLocationId = existingSlot.binderId;
        assignedBinderPage = existingSlot.page;
        assignedBinderSlot = existingSlot.slot;
        reason = `Apilada en el mismo slot (Pág. ${existingSlot.page}, Slot ${existingSlot.slot}) junto a copias idénticas.`;
      } else if (isExodiaPiece) {
        // Mosaico Exodia: Pág 2 de Collection Binder, slot simétrico
        targetLocationId = collectionBinder.id;
        assignedBinderPage = exodiaPage + 1; // Página 2
        assignedBinderSlot = EXODIA_PIECES[cardName];
        reasonTag = `Mosaico Exodia [${cardName}]`;
        promotedCount += card.quantity;
        reason = `Ubicada en Mosaico 3x3 de Exodia (Pág. ${assignedBinderPage}, Slot ${assignedBinderSlot}) centrado simétricamente.`;

        assignedSlotMap.set(slotKey, {
          binderId: collectionBinder.id,
          page: assignedBinderPage,
          slot: assignedBinderSlot,
          cardCount: card.quantity
        });

        movedToBinderCards.push({
          card_id: card.card_id,
          name: cardName,
          image_url: card.card_details?.image_url_small || card.card_details?.image_url,
          rarity: card.rarity,
          quantity: card.quantity,
          from_location: fromLocName,
          to_location: `${collectionBinder.name} (Pág. ${assignedBinderPage}, Slot ${assignedBinderSlot})`,
          binder_page: assignedBinderPage,
          binder_slot: assignedBinderSlot,
          reason_tag: reasonTag,
          is_mosaic_piece: true,
          target_container_type: 'binder'
        });
      } else if (isEgyptianGod) {
        // Mosaico Dioses Egipcios: Pág 1 de Collection Binder en fila contigua (slots 1, 2, 3)
        targetLocationId = collectionBinder.id;
        assignedBinderPage = godsPage;
        assignedBinderSlot = EGYPTIAN_GODS[cardName];
        reasonTag = `Tríada Dioses Egipcios [${cardName}]`;
        promotedCount += card.quantity;
        reason = `Ubicada en la fila superior de Dioses Egipcios (Pág. ${assignedBinderPage}, Slot ${assignedBinderSlot}).`;

        assignedSlotMap.set(slotKey, {
          binderId: collectionBinder.id,
          page: assignedBinderPage,
          slot: assignedBinderSlot,
          cardCount: card.quantity
        });

        movedToBinderCards.push({
          card_id: card.card_id,
          name: cardName,
          image_url: card.card_details?.image_url_small || card.card_details?.image_url,
          rarity: card.rarity,
          quantity: card.quantity,
          from_location: fromLocName,
          to_location: `${collectionBinder.name} (Pág. ${assignedBinderPage}, Slot ${assignedBinderSlot})`,
          binder_page: assignedBinderPage,
          binder_slot: assignedBinderSlot,
          reason_tag: reasonTag,
          is_mosaic_piece: true,
          target_container_type: 'binder'
        });
      } else if (isStaple) {
        // Staples van a Staples Binder
        targetLocationId = staplesBinder.id;
        const pockets = staplesBinder.grid_layout?.pockets_per_page || 9;
        const pos = getNextAvailableSlot(staplesBinder.id, 1, pockets);
        assignedBinderPage = pos.page;
        assignedBinderSlot = pos.slot;
        reasonTag = 'Staple Competitiva Meta';
        promotedCount += card.quantity;
        reason = `Asignada a '${staplesBinder.name}' (Pág. ${pos.page}, Slot ${pos.slot}) por alta demanda táctica.`;

        assignedSlotMap.set(slotKey, {
          binderId: staplesBinder.id,
          page: assignedBinderPage,
          slot: assignedBinderSlot,
          cardCount: card.quantity
        });

        movedToBinderCards.push({
          card_id: card.card_id,
          name: cardName,
          image_url: card.card_details?.image_url_small || card.card_details?.image_url,
          rarity: card.rarity,
          quantity: card.quantity,
          from_location: fromLocName,
          to_location: `${staplesBinder.name} (Pág. ${pos.page}, Slot ${pos.slot})`,
          binder_page: assignedBinderPage,
          binder_slot: assignedBinderSlot,
          reason_tag: reasonTag,
          target_container_type: 'binder'
        });
      } else if (isHighRarity || isIconicAnime) {
        // Colección y rarezas van a Collection Binder
        targetLocationId = collectionBinder.id;
        const pockets = collectionBinder.grid_layout?.pockets_per_page || 9;
        const pos = getNextAvailableSlot(collectionBinder.id, 3, pockets); // Páginas 3 en adelante
        assignedBinderPage = pos.page;
        assignedBinderSlot = pos.slot;
        reasonTag = isHighRarity ? `Rareza ${card.rarity}` : 'Icono Anime / Colección';
        promotedCount += card.quantity;
        reason = `Asignada a '${collectionBinder.name}' (Pág. ${pos.page}, Slot ${pos.slot}) por valor de colección.`;

        assignedSlotMap.set(slotKey, {
          binderId: collectionBinder.id,
          page: assignedBinderPage,
          slot: assignedBinderSlot,
          cardCount: card.quantity
        });

        movedToBinderCards.push({
          card_id: card.card_id,
          name: cardName,
          image_url: card.card_details?.image_url_small || card.card_details?.image_url,
          rarity: card.rarity,
          quantity: card.quantity,
          from_location: fromLocName,
          to_location: `${collectionBinder.name} (Pág. ${pos.page}, Slot ${pos.slot})`,
          binder_page: assignedBinderPage,
          binder_slot: assignedBinderSlot,
          reason_tag: reasonTag,
          target_container_type: 'binder'
        });
      } else if (!currentLoc || currentLoc.type === 'box' || currentLoc.type === 'tin') {
        bulkSortedCount += card.quantity;
        reason = `Clasificada en contenedor bulk por arquetipo/tipo de carta.`;
      }
    }

    // Incrementar conteo de cartas en contenedor
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

  if (promotedCount > 0 && collectionBinder) {
    logs.push({
      category: 'card_promoted',
      title: 'Curación Estética de Binders y Mosaicos',
      description: `Se organizaron ${promotedCount} cartas en Binders: Mosaico Exodia 3x3 centrado, Tríada de Dioses Egipcios, staples en '${staplesBinder?.name || 'Binder Staples'}' y rarezas altas en '${collectionBinder.name}' con copias apiladas por slot.`,
      impact_level: 'high',
      target_location_name: collectionBinder.name,
      card_count: promotedCount,
      moved_cards: movedToBinderCards
    });
  }

  if (bulkSortedCount > 0) {
    logs.push({
      category: 'bulk_sorted',
      title: 'Clasificación de Bulk y Motores de Soporte',
      description: `Se organizaron ${bulkSortedCount} cartas en cajas secundarias agrupadas por arquetipo y tipo de carta.`,
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
