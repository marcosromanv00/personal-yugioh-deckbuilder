import { UserCard, StorageLocation, Deck } from '@/types/collection';

export interface LocationCopyBreakdown {
  location_id: string | null;
  location_name: string;
  location_type?: string;
  color_code?: string;
  quantity: number;
  is_inbox: boolean;
  is_deck: boolean;
  deck_name?: string;
}

export interface DuplicateMatchInfo {
  card_id: number;
  card_name: string;
  image_url?: string;
  totalCopies: number;
  locationsCount: number;
  locations: LocationCopyBreakdown[];
  hasDuplicatesInOtherContainers: boolean;
}

export interface ArchetypeSuggestionGroup {
  archetype: string;
  totalCardsCount: number;
  distinctCardsCount: number;
  completionScore: number; // 0-100% aproximado
  mainMonstersCount: number;
  spellsCount: number;
  trapsCount: number;
  extraDeckCount: number;
  cards: UserCard[];
  sampleImage: string;
  locationsPresent: string[];
}

export type StapleCategory = 'handtrap' | 'board_breaker' | 'draw_engine' | 'extra_deck_generic' | 'floodgate_negate';

export interface StapleCardInfo {
  card_id: number;
  card_name: string;
  category: StapleCategory;
  tier: 'S' | 'A' | 'B';
  copiesOwned: number;
  cards: UserCard[];
  locations: LocationCopyBreakdown[];
  isDispersed: boolean;
}

export interface AssistantActionCard {
  id: string;
  type: 'archetype_deck' | 'archetype_container' | 'staple_consolidation' | 'duplicate_cleanup' | 'inbox_triage';
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  icon: string;
  targetArchetype?: string;
  targetCardId?: number;
  targetCardName?: string;
  cardCount?: number;
  actionLabel: string;
  secondaryActionLabel?: string;
}

export interface MultiLevelDestination {
  level: 1 | 2 | 3 | 4;
  levelLabel: string;
  targetId: string | null;
  targetName: string;
  targetType: 'deck' | 'archetype_container' | 'staples_binder' | 'trade_binder' | 'storage_box' | 'inbox';
  targetColor?: string;
  affinityScore: number; // 0 - 100
  rationale: string;
  actionPayload: {
    storage_location_id: string | null;
    deck_id?: string | null;
    deck_section?: 'main' | 'extra' | 'side' | null;
    status_flag?: string;
  };
}

// Catálogo de Staples y Handtraps Universales de Yu-Gi-Oh!
export const KNOWN_STAPLES_CATALOG: Record<string, { category: StapleCategory; tier: 'S' | 'A' | 'B'; optimalDeckMax?: number }> = {
  // Handtraps
  'Ash Blossom & Joyous Spring': { category: 'handtrap', tier: 'S', optimalDeckMax: 3 },
  'Maxx "C"': { category: 'handtrap', tier: 'S', optimalDeckMax: 3 },
  'Infinite Impermanence': { category: 'handtrap', tier: 'S', optimalDeckMax: 3 },
  'Nibiru, the Primal Being': { category: 'handtrap', tier: 'S', optimalDeckMax: 2 },
  'Effect Veiler': { category: 'handtrap', tier: 'A', optimalDeckMax: 3 },
  'Droll & Lock Bird': { category: 'handtrap', tier: 'S', optimalDeckMax: 3 },
  'Ghost Ogre & Snow Rabbit': { category: 'handtrap', tier: 'A', optimalDeckMax: 2 },
  'Ghost Belle & Haunted Mansion': { category: 'handtrap', tier: 'A', optimalDeckMax: 2 },
  'Ghost Mourner & Moonlit Chill': { category: 'handtrap', tier: 'B', optimalDeckMax: 2 },
  'Dimension Shifter': { category: 'handtrap', tier: 'S', optimalDeckMax: 2 },
  'Artifact Lancea': { category: 'handtrap', tier: 'B', optimalDeckMax: 2 },
  'Skull Meister': { category: 'handtrap', tier: 'B', optimalDeckMax: 2 },
  'Mulcharmy Purulia': { category: 'handtrap', tier: 'S', optimalDeckMax: 3 },
  'Mulcharmy Fuwalos': { category: 'handtrap', tier: 'S', optimalDeckMax: 3 },

  // Board Breakers & Spells
  'Super Polymerization': { category: 'board_breaker', tier: 'S', optimalDeckMax: 3 },
  'Dark Ruler No More': { category: 'board_breaker', tier: 'A', optimalDeckMax: 3 },
  'Forbidden Droplet': { category: 'board_breaker', tier: 'S', optimalDeckMax: 3 },
  'Lightning Storm': { category: 'board_breaker', tier: 'A', optimalDeckMax: 2 },
  "Harpie's Feather Duster": { category: 'board_breaker', tier: 'S', optimalDeckMax: 1 },
  'Evenly Matched': { category: 'board_breaker', tier: 'S', optimalDeckMax: 3 },
  'Cosmic Cyclone': { category: 'board_breaker', tier: 'A', optimalDeckMax: 3 },
  'Twin Twisters': { category: 'board_breaker', tier: 'B', optimalDeckMax: 2 },
  'Called by the Grave': { category: 'board_breaker', tier: 'S', optimalDeckMax: 2 },
  'Crossout Designator': { category: 'board_breaker', tier: 'S', optimalDeckMax: 3 },
  'Triple Tactics Talent': { category: 'board_breaker', tier: 'S', optimalDeckMax: 2 },
  'Triple Tactics Thrust': { category: 'board_breaker', tier: 'S', optimalDeckMax: 3 },
  'Book of Eclipse': { category: 'board_breaker', tier: 'A', optimalDeckMax: 3 },
  'Book of Moon': { category: 'board_breaker', tier: 'B', optimalDeckMax: 3 },
  'Raigeki': { category: 'board_breaker', tier: 'B', optimalDeckMax: 2 },
  'Change of Heart': { category: 'board_breaker', tier: 'B', optimalDeckMax: 1 },
  'Kashtira Fenrir': { category: 'board_breaker', tier: 'S', optimalDeckMax: 1 },

  // Motores de Robo / Consistencia
  'Pot of Prosperity': { category: 'draw_engine', tier: 'S', optimalDeckMax: 1 },
  'Pot of Extravagance': { category: 'draw_engine', tier: 'A', optimalDeckMax: 2 },
  'Pot of Desires': { category: 'draw_engine', tier: 'A', optimalDeckMax: 2 },
  'Pot of Duality': { category: 'draw_engine', tier: 'B', optimalDeckMax: 2 },
  'Upstart Goblin': { category: 'draw_engine', tier: 'B', optimalDeckMax: 1 },

  // Monstruos Genéricos de Extra Deck
  'S:P Little Knight': { category: 'extra_deck_generic', tier: 'S', optimalDeckMax: 1 },
  'I:P Masquerena': { category: 'extra_deck_generic', tier: 'S', optimalDeckMax: 1 },
  'Divine Arsenal AA-ZEUS - Sky Thunder': { category: 'extra_deck_generic', tier: 'S', optimalDeckMax: 1 },
  'Super Starslayer TY-PHON - Sky Crisis': { category: 'extra_deck_generic', tier: 'S', optimalDeckMax: 1 },
  'Underworld Goddess of the Closed World': { category: 'extra_deck_generic', tier: 'S', optimalDeckMax: 1 },
  'Accesscode Talker': { category: 'extra_deck_generic', tier: 'S', optimalDeckMax: 1 },
  'Apollousa, Bow of the Goddess': { category: 'extra_deck_generic', tier: 'S', optimalDeckMax: 1 },
  'Knightmare Unicorn': { category: 'extra_deck_generic', tier: 'A', optimalDeckMax: 1 },
  'Knightmare Phoenix': { category: 'extra_deck_generic', tier: 'A', optimalDeckMax: 1 },
  'Abyss Dweller': { category: 'extra_deck_generic', tier: 'A', optimalDeckMax: 1 },
  'Number 41: Bagooska the Terribly Tired Tapir': { category: 'extra_deck_generic', tier: 'A', optimalDeckMax: 1 },
  'Baronne de Fleur': { category: 'extra_deck_generic', tier: 'S', optimalDeckMax: 1 },
  'Borreload Savage Dragon': { category: 'extra_deck_generic', tier: 'A', optimalDeckMax: 1 },
  'Linkuriboh': { category: 'extra_deck_generic', tier: 'A', optimalDeckMax: 1 },
  'Relinquished Anima': { category: 'extra_deck_generic', tier: 'A', optimalDeckMax: 1 },
  'Garura, Wings of Resonant Life': { category: 'extra_deck_generic', tier: 'S', optimalDeckMax: 1 },
  'Mudragon of the Swamp': { category: 'extra_deck_generic', tier: 'A', optimalDeckMax: 1 },

  // Negaciones y Trampas
  'Solemn Judgment': { category: 'floodgate_negate', tier: 'A', optimalDeckMax: 3 },
  'Solemn Strike': { category: 'floodgate_negate', tier: 'A', optimalDeckMax: 3 },
  'Anti-Spell Fragrance': { category: 'floodgate_negate', tier: 'A', optimalDeckMax: 1 },
  'Dimensional Barrier': { category: 'floodgate_negate', tier: 'S', optimalDeckMax: 3 },
  'Red Reboot': { category: 'floodgate_negate', tier: 'S', optimalDeckMax: 1 },
};

// Ratios óptimos para cartas clave comúnmente jugadas a 1 o 2 copias
const CARD_OPTIMAL_DECK_RATIOS: Record<string, number> = {
  'Blazing Cartesia, the Virtuous': 2,
  'Guiding Quem, the Virtuous': 1,
  'Aluber the Jester of Despia': 3,
  'Fallen of Albaz': 3,
  'Branded Fusion': 1,
  'Lubellion the Searing Dragon': 2,
  'Albion the Branded Dragon': 2,
  'Mirrorjade the Iceblade Dragon': 2,
  'Granguignol the Dusk Dragon': 1,
  'Bystial Magnamhut': 1,
  'Bystial Druiswurm': 1,
  'Bystial Saronir': 3,
  'Bystial Lubellion': 3,
};

/**
 * Computa el mapa de duplicados cruzados entre contenedores para toda la colección.
 * REGLA INVARIANTE: Las cartas en decks activos (is_deck === true) están blindadas
 * y NO generan alertas de consolidación hacia cajas.
 */
export function computeCrossContainerDuplicateMap(
  allUserCards: UserCard[],
  locations: StorageLocation[]
): Map<number, DuplicateMatchInfo> {
  const locMap = new Map<string, StorageLocation>();
  locations.forEach(l => locMap.set(l.id, l));

  // Agrupar cartas por card_id
  const byCardId = new Map<number, UserCard[]>();
  allUserCards.forEach(c => {
    const list = byCardId.get(c.card_id) || [];
    list.push(c);
    byCardId.set(c.card_id, list);
  });

  const resultMap = new Map<number, DuplicateMatchInfo>();

  byCardId.forEach((cards, cardId) => {
    const first = cards[0];
    const cardName = first?.card_details?.name || `Carta #${cardId}`;
    const imageUrl = first?.card_details?.image_url_small || first?.card_details?.image_url;

    // Desglose de ubicaciones
    const locationMap = new Map<string, LocationCopyBreakdown>();
    let totalCopies = 0;

    cards.forEach(c => {
      totalCopies += c.quantity || 1;
      const isInbox = !c.storage_location_id && !c.deck_id;
      const isDeck = Boolean(c.deck_id);
      const locId = c.storage_location_id || (isDeck ? `deck_${c.deck_id}` : 'inbox');

      let locBreakdown = locationMap.get(locId);
      if (!locBreakdown) {
        let locName = '📥 Sin Clasificar (Inbox)';
        let locType: string | undefined = undefined;
        let colorCode: string | undefined = undefined;

        if (c.storage_location_id) {
          const loc = locMap.get(c.storage_location_id);
          if (loc) {
            locName = loc.name;
            locType = loc.type;
            colorCode = loc.color_code;
          } else {
            locName = 'Contenedor';
          }
        } else if (isDeck) {
          locName = `⚔️ ${c.deck_details?.name || 'En Deck'}`;
        }

        locBreakdown = {
          location_id: c.storage_location_id || null,
          location_name: locName,
          location_type: locType,
          color_code: colorCode,
          quantity: 0,
          is_inbox: isInbox,
          is_deck: isDeck,
          deck_name: c.deck_details?.name,
        };
        locationMap.set(locId, locBreakdown);
      }

      locBreakdown.quantity += c.quantity || 1;
    });

    const locationsList = Array.from(locationMap.values());
    
    // REGLA: Solo se consideran duplicados dispersos si existen al menos 2 ubicaciones que NO sean decks
    const nonDeckLocations = locationsList.filter(l => !l.is_deck);
    const hasDuplicates = nonDeckLocations.length >= 2;

    resultMap.set(cardId, {
      card_id: cardId,
      card_name: cardName,
      image_url: imageUrl,
      totalCopies,
      locationsCount: locationsList.length,
      locations: locationsList,
      hasDuplicatesInOtherContainers: hasDuplicates,
    });
  });

  return resultMap;
}

/**
 * Genera opciones multinivel de movimiento con justificación táctica para una carta específica.
 */
export function computeMultiLevelDestinationsForCard(
  card: UserCard,
  allUserCards: UserCard[],
  locations: StorageLocation[],
  decks: Deck[]
): MultiLevelDestination[] {
  const destinations: MultiLevelDestination[] = [];
  const cardName = card.card_details?.name || '';
  const cardArchetype = card.card_details?.archetype || '';
  const cardType = card.card_details?.type || '';
  const isExtraDeck = cardType.includes('Fusion') || cardType.includes('Synchro') || cardType.includes('XYZ') || cardType.includes('Link');
  const targetSection = isExtraDeck ? 'extra' : 'main';

  // 1. NIVEL 1: Completar Deck Activo (Solo si el deck necesita la carta y no ha alcanzado su ratio óptimo)
  if (cardArchetype) {
    const matchingDecks = decks.filter(d => 
      d.is_active !== false && 
      (d.name.toLowerCase().includes(cardArchetype.toLowerCase()) || 
       (cardArchetype === 'Branded' && d.name.toLowerCase().includes('despia')) ||
       (cardArchetype === 'Despia' && d.name.toLowerCase().includes('branded')))
    );

    for (const deck of matchingDecks) {
      // Contar cuántas copias de esta carta ya tiene el deck
      const copiesInDeck = allUserCards
        .filter(c => c.deck_id === deck.id && c.card_id === card.card_id)
        .reduce((acc, c) => acc + (c.quantity || 1), 0);

      const optimalMax = CARD_OPTIMAL_DECK_RATIOS[cardName] || (KNOWN_STAPLES_CATALOG[cardName]?.optimalDeckMax ?? 3);

      if (copiesInDeck < optimalMax) {
        destinations.push({
          level: 1,
          levelLabel: 'Nivel 1: Completar Deck Activo',
          targetId: `deck_${deck.id}`,
          targetName: deck.name,
          targetType: 'deck',
          targetColor: '#9333ea',
          affinityScore: 98,
          rationale: `El deck "${deck.name}" lleva ${copiesInDeck}/${optimalMax} copias óptimas. Añadir esta copia completa su ratio competitivo.`,
          actionPayload: {
            storage_location_id: deck.storage_location_id || null,
            deck_id: deck.id,
            deck_section: targetSection,
            status_flag: 'in_deck',
          },
        });
      }
    }
  }

  // 2. NIVEL 2: Contenedor / Base del Arquetipo
  if (cardArchetype) {
    const archetypeLocs = locations.filter(l => 
      l.name.toLowerCase().includes(cardArchetype.toLowerCase()) ||
      (l.description && l.description.toLowerCase().includes(cardArchetype.toLowerCase())) ||
      (cardArchetype === 'Branded' && l.name.toLowerCase().includes('legendary')) ||
      (cardArchetype === 'Despia' && l.name.toLowerCase().includes('branded'))
    );

    archetypeLocs.forEach(loc => {
      if (loc.id !== card.storage_location_id) {
        destinations.push({
          level: 2,
          levelLabel: 'Nivel 2: Base del Arquetipo',
          targetId: loc.id,
          targetName: loc.name,
          targetType: 'archetype_container',
          targetColor: loc.color_code || '#6366f1',
          affinityScore: 88,
          rationale: `Contenedor físico dedicado a la base de "${cardArchetype}". Mantiene agrupadas tus piezas de arquetipo.`,
          actionPayload: {
            storage_location_id: loc.id,
            deck_id: null,
            status_flag: 'collection',
          },
        });
      }
    });
  }

  // 3. NIVEL 3: Binder de Staples / Carpeta de Trade
  const stapleEntry = KNOWN_STAPLES_CATALOG[cardName];
  const isHighRarity = (card.rarity || '').includes('Secret') || (card.rarity || '').includes('Ultimate') || (card.rarity || '').includes('Quarter');
  const isTrade = card.status_flag === 'trade_sale';

  const tradeAndStapleBinders = locations.filter(l => 
    l.type === 'binder' && 
    (l.name.toLowerCase().includes('staple') || 
     l.name.toLowerCase().includes('trade') || 
     l.name.toLowerCase().includes('cambio') || 
     l.name.toLowerCase().includes('colección'))
  );

  tradeAndStapleBinders.forEach(binder => {
    if (binder.id !== card.storage_location_id) {
      destinations.push({
        level: 3,
        levelLabel: isTrade ? 'Nivel 3: Carpeta de Trade / Venta' : 'Nivel 3: Binder de Staples / Colección',
        targetId: binder.id,
        targetName: binder.name,
        targetType: isTrade ? 'trade_binder' : 'staples_binder',
        targetColor: binder.color_code || '#06b6d4',
        affinityScore: stapleEntry ? 82 : (isHighRarity ? 78 : 70),
        rationale: stapleEntry 
          ? `Staple universal Tier ${stapleEntry.tier}. Ideal para tener en tu carpeta de acceso rápido.`
          : (isHighRarity ? `Alta rareza (${card.rarity}). Protegida en carpeta física.` : `Destinada para intercambio o catálogo de colección.`),
        actionPayload: {
          storage_location_id: binder.id,
          deck_id: null,
          status_flag: isTrade ? 'trade_sale' : 'collection',
        },
      });
    }
  });

  // 4. NIVEL 4: Almacén Alfabético / Bulk
  const storageBoxes = locations.filter(l => 
    (l.type === 'box' || l.type === 'tin' || l.type === 'drawer') &&
    !destinations.some(d => d.targetId === l.id) &&
    l.id !== card.storage_location_id
  );

  storageBoxes.slice(0, 3).forEach(box => {
    destinations.push({
      level: 4,
      levelLabel: 'Nivel 4: Almacén General / Bulk Alfabético',
      targetId: box.id,
      targetName: box.name,
      targetType: 'storage_box',
      targetColor: box.color_code || '#71717a',
      affinityScore: 50,
      rationale: `Caja de almacenamiento general para archivo alfabético y stock de reserva.`,
      actionPayload: {
        storage_location_id: box.id,
        deck_id: null,
        status_flag: 'bulk',
      },
    });
  });

  // Ordenar por nivel (1 > 2 > 3 > 4) y luego afinidad descendente
  destinations.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return b.affinityScore - a.affinityScore;
  });

  return destinations;
}

/**
 * Analiza la colección completa y genera agrupaciones por arquetipo, staples,
 * duplicados dispersos y sugerencias accionables para el usuario.
 */
export function analyzeCollectionSuggestions(
  allUserCards: UserCard[],
  locations: StorageLocation[],
  decks: Deck[]
): {
  archetypeSuggestions: ArchetypeSuggestionGroup[];
  stapleSuggestions: StapleCardInfo[];
  duplicateSuggestions: DuplicateMatchInfo[];
  assistantActionCards: AssistantActionCard[];
  stats: {
    totalArchetypesDetected: number;
    totalStaplesCount: number;
    totalDispersedDuplicates: number;
    inboxPendingCount: number;
  };
} {
  const duplicateMap = computeCrossContainerDuplicateMap(allUserCards, locations);

  // 1. Agrupar por Arquetipo
  const archetypeMap = new Map<string, UserCard[]>();

  allUserCards.forEach(c => {
    const rawArch = c.card_details?.archetype;
    if (rawArch && rawArch.trim() !== '') {
      const arch = rawArch.trim();
      const list = archetypeMap.get(arch) || [];
      list.push(c);
      archetypeMap.set(arch, list);
    }
  });

  const archetypeSuggestions: ArchetypeSuggestionGroup[] = [];

  archetypeMap.forEach((cards, archName) => {
    const distinctCards = new Set(cards.map(c => c.card_id));
    const totalCopies = cards.reduce((acc, c) => acc + (c.quantity || 1), 0);

    if (distinctCards.size >= 2 || totalCopies >= 3) {
      let monsters = 0;
      let spells = 0;
      let traps = 0;
      let extra = 0;
      const locationsSet = new Set<string>();

      cards.forEach(c => {
        const type = c.card_details?.type || '';
        if (type.includes('Fusion') || type.includes('Synchro') || type.includes('XYZ') || type.includes('Link')) {
          extra += c.quantity || 1;
        } else if (type.includes('Monster')) {
          monsters += c.quantity || 1;
        } else if (type.includes('Spell')) {
          spells += c.quantity || 1;
        } else if (type.includes('Trap')) {
          traps += c.quantity || 1;
        }

        if (c.storage_location_id) {
          const loc = locations.find(l => l.id === c.storage_location_id);
          if (loc) locationsSet.add(loc.name);
        } else if (c.deck_id) {
          locationsSet.add('En Deck');
        } else {
          locationsSet.add('Inbox');
        }
      });

      const completionScore = Math.min(100, Math.round((totalCopies / 15) * 100));
      const sampleCard = cards.find(c => c.card_details?.image_url) || cards[0];

      archetypeSuggestions.push({
        archetype: archName,
        totalCardsCount: totalCopies,
        distinctCardsCount: distinctCards.size,
        completionScore,
        mainMonstersCount: monsters,
        spellsCount: spells,
        trapsCount: traps,
        extraDeckCount: extra,
        cards,
        sampleImage: sampleCard?.card_details?.image_url_small || sampleCard?.card_details?.image_url || '',
        locationsPresent: Array.from(locationsSet),
      });
    }
  });

  archetypeSuggestions.sort((a, b) => b.totalCardsCount - a.totalCardsCount);

  // 2. Identificar Staples
  const stapleSuggestions: StapleCardInfo[] = [];

  duplicateMap.forEach((matchInfo, cardId) => {
    const stapleEntry = KNOWN_STAPLES_CATALOG[matchInfo.card_name];
    if (stapleEntry) {
      const cards = allUserCards.filter(c => c.card_id === cardId);
      stapleSuggestions.push({
        card_id: cardId,
        card_name: matchInfo.card_name,
        category: stapleEntry.category,
        tier: stapleEntry.tier,
        copiesOwned: matchInfo.totalCopies,
        cards,
        locations: matchInfo.locations,
        isDispersed: matchInfo.hasDuplicatesInOtherContainers,
      });
    }
  });

  const tierOrder: Record<string, number> = { S: 3, A: 2, B: 1 };
  stapleSuggestions.sort((a, b) => {
    const diffTier = (tierOrder[b.tier] || 0) - (tierOrder[a.tier] || 0);
    if (diffTier !== 0) return diffTier;
    return b.copiesOwned - a.copiesOwned;
  });

  // 3. Duplicados Dispersos (Excluyendo decks)
  const duplicateSuggestions = Array.from(duplicateMap.values())
    .filter(d => d.hasDuplicatesInOtherContainers)
    .sort((a, b) => b.totalCopies - a.totalCopies);

  // 4. Tarjetas Asistente de Acción Rápida
  const assistantActionCards: AssistantActionCard[] = [];

  const inboxCards = allUserCards.filter(c => !c.storage_location_id && !c.deck_id);
  if (inboxCards.length > 0) {
    assistantActionCards.push({
      id: 'inbox_triage',
      type: 'inbox_triage',
      title: '📥 Cartas Sin Clasificar en Inbox',
      description: `Tienes ${inboxCards.length} copias en el buzón de entrada esperando asignación a un contenedor físico o binder.`,
      badge: `${inboxCards.length} cartas`,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      icon: '📥',
      actionLabel: 'Organizar Inbox',
    });
  }

  archetypeSuggestions.slice(0, 2).forEach((arch, idx) => {
    const hasDeck = decks.some(d => d.name.toLowerCase().includes(arch.archetype.toLowerCase()));
    if (!hasDeck && arch.totalCardsCount >= 5) {
      assistantActionCards.push({
        id: `arch_deck_${idx}`,
        type: 'archetype_deck',
        title: `🔥 Motor ${arch.archetype} Detectado`,
        description: `Cuentas con ${arch.totalCardsCount} cartas (${arch.distinctCardsCount} únicas) de ${arch.archetype}. ¡Puedes armar un deck con este núcleo!`,
        badge: `${arch.completionScore}% Core`,
        badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
        icon: '⚔️',
        targetArchetype: arch.archetype,
        cardCount: arch.totalCardsCount,
        actionLabel: 'Crear Deck con este Arquetipo',
        secondaryActionLabel: 'Mover a Binder/Caja',
      });
    }
  });

  const dispersedStaples = stapleSuggestions.filter(s => s.isDispersed);
  if (dispersedStaples.length > 0) {
    const firstStaple = dispersedStaples[0];
    assistantActionCards.push({
      id: `staple_dis_${firstStaple.card_id}`,
      type: 'staple_consolidation',
      title: `⚡ Staple Dispersa: ${firstStaple.card_name}`,
      description: `Tienes ${firstStaple.copiesOwned}x ${firstStaple.card_name} repartidas en ${firstStaple.locations.length} lugares distintos. Reúnelas en un contenedor principal.`,
      badge: `${firstStaple.copiesOwned}x Copias`,
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
      icon: '✨',
      targetCardId: firstStaple.card_id,
      targetCardName: firstStaple.card_name,
      actionLabel: 'Consolidar Staple',
    });
  }

  if (duplicateSuggestions.length > 0 && !dispersedStaples.some(s => s.card_id === duplicateSuggestions[0].card_id)) {
    const topDup = duplicateSuggestions[0];
    assistantActionCards.push({
      id: `dup_cleanup_${topDup.card_id}`,
      type: 'duplicate_cleanup',
      title: `📦 Duplicados en Múltiples Cajas: ${topDup.card_name}`,
      description: `Tienes ${topDup.totalCopies}x copias divididas en ${topDup.locationsCount} contenedores diferentes.`,
      badge: `⚠️ ${topDup.locationsCount} Cajas`,
      badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
      icon: '⚠️',
      targetCardId: topDup.card_id,
      targetCardName: topDup.card_name,
      actionLabel: 'Ver Coincidencias',
    });
  }

  return {
    archetypeSuggestions,
    stapleSuggestions,
    duplicateSuggestions,
    assistantActionCards,
    stats: {
      totalArchetypesDetected: archetypeSuggestions.length,
      totalStaplesCount: stapleSuggestions.length,
      totalDispersedDuplicates: duplicateSuggestions.length,
      inboxPendingCount: inboxCards.length,
    },
  };
}
