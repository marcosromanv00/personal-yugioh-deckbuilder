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

// Catálogo de Staples y Handtraps Universales de Yu-Gi-Oh!
export const KNOWN_STAPLES_CATALOG: Record<string, { category: StapleCategory; tier: 'S' | 'A' | 'B' }> = {
  // Handtraps
  'Ash Blossom & Joyous Spring': { category: 'handtrap', tier: 'S' },
  'Maxx "C"': { category: 'handtrap', tier: 'S' },
  'Infinite Impermanence': { category: 'handtrap', tier: 'S' },
  'Nibiru, the Primal Being': { category: 'handtrap', tier: 'S' },
  'Effect Veiler': { category: 'handtrap', tier: 'A' },
  'Droll & Lock Bird': { category: 'handtrap', tier: 'S' },
  'Ghost Ogre & Snow Rabbit': { category: 'handtrap', tier: 'A' },
  'Ghost Belle & Haunted Mansion': { category: 'handtrap', tier: 'A' },
  'Ghost Mourner & Moonlit Chill': { category: 'handtrap', tier: 'B' },
  'Dimension Shifter': { category: 'handtrap', tier: 'S' },
  'Artifact Lancea': { category: 'handtrap', tier: 'B' },
  'Skull Meister': { category: 'handtrap', tier: 'B' },
  'Mulcharmy Purulia': { category: 'handtrap', tier: 'S' },
  'Mulcharmy Fuwalos': { category: 'handtrap', tier: 'S' },

  // Board Breakers & Spells
  'Super Polymerization': { category: 'board_breaker', tier: 'S' },
  'Dark Ruler No More': { category: 'board_breaker', tier: 'A' },
  'Forbidden Droplet': { category: 'board_breaker', tier: 'S' },
  'Lightning Storm': { category: 'board_breaker', tier: 'A' },
  "Harpie's Feather Duster": { category: 'board_breaker', tier: 'S' },
  'Evenly Matched': { category: 'board_breaker', tier: 'S' },
  'Cosmic Cyclone': { category: 'board_breaker', tier: 'A' },
  'Twin Twisters': { category: 'board_breaker', tier: 'B' },
  'Called by the Grave': { category: 'board_breaker', tier: 'S' },
  'Crossout Designator': { category: 'board_breaker', tier: 'S' },
  'Triple Tactics Talent': { category: 'board_breaker', tier: 'S' },
  'Triple Tactics Thrust': { category: 'board_breaker', tier: 'S' },
  'Book of Eclipse': { category: 'board_breaker', tier: 'A' },
  'Book of Moon': { category: 'board_breaker', tier: 'B' },
  'Raigeki': { category: 'board_breaker', tier: 'B' },
  'Change of Heart': { category: 'board_breaker', tier: 'B' },
  'Kashtira Fenrir': { category: 'board_breaker', tier: 'S' },

  // Motores de Robo / Consistencia
  'Pot of Prosperity': { category: 'draw_engine', tier: 'S' },
  'Pot of Extravagance': { category: 'draw_engine', tier: 'A' },
  'Pot of Desires': { category: 'draw_engine', tier: 'A' },
  'Pot of Duality': { category: 'draw_engine', tier: 'B' },
  'Upstart Goblin': { category: 'draw_engine', tier: 'B' },

  // Monstruos Genéricos de Extra Deck
  'S:P Little Knight': { category: 'extra_deck_generic', tier: 'S' },
  'I:P Masquerena': { category: 'extra_deck_generic', tier: 'S' },
  'Divine Arsenal AA-ZEUS - Sky Thunder': { category: 'extra_deck_generic', tier: 'S' },
  'Super Starslayer TY-PHON - Sky Crisis': { category: 'extra_deck_generic', tier: 'S' },
  'Underworld Goddess of the Closed World': { category: 'extra_deck_generic', tier: 'S' },
  'Accesscode Talker': { category: 'extra_deck_generic', tier: 'S' },
  'Apollousa, Bow of the Goddess': { category: 'extra_deck_generic', tier: 'S' },
  'Knightmare Unicorn': { category: 'extra_deck_generic', tier: 'A' },
  'Knightmare Phoenix': { category: 'extra_deck_generic', tier: 'A' },
  'Abyss Dweller': { category: 'extra_deck_generic', tier: 'A' },
  'Number 41: Bagooska the Terribly Tired Tapir': { category: 'extra_deck_generic', tier: 'A' },
  'Baronne de Fleur': { category: 'extra_deck_generic', tier: 'S' },
  'Borreload Savage Dragon': { category: 'extra_deck_generic', tier: 'A' },
  'Linkuriboh': { category: 'extra_deck_generic', tier: 'A' },
  'Relinquished Anima': { category: 'extra_deck_generic', tier: 'A' },
  'Garura, Wings of Resonant Life': { category: 'extra_deck_generic', tier: 'S' },
  'Mudragon of the Swamp': { category: 'extra_deck_generic', tier: 'A' },

  // Negaciones y Trampas
  'Solemn Judgment': { category: 'floodgate_negate', tier: 'A' },
  'Solemn Strike': { category: 'floodgate_negate', tier: 'A' },
  'Anti-Spell Fragrance': { category: 'floodgate_negate', tier: 'A' },
  'Dimensional Barrier': { category: 'floodgate_negate', tier: 'S' },
  'Red Reboot': { category: 'floodgate_negate', tier: 'S' },
};

/**
 * Computa el mapa de duplicados cruzados entre contenedores para toda la colección.
 * Devuelve un Map<card_id, DuplicateMatchInfo>.
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
    const hasDuplicates = locationsList.length >= 2;

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
    // Considerar arquetipo viable si tiene al menos 3 copias o cartas
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

      // Cálculo de puntaje de compleción de arquetipo (base 15 cartas para un core jugable)
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

  // Ordenar arquetipos por total de cartas descendente
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

  // Ordenar staples por Tier (S > A > B) y luego copias
  const tierOrder: Record<string, number> = { S: 3, A: 2, B: 1 };
  stapleSuggestions.sort((a, b) => {
    const diffTier = (tierOrder[b.tier] || 0) - (tierOrder[a.tier] || 0);
    if (diffTier !== 0) return diffTier;
    return b.copiesOwned - a.copiesOwned;
  });

  // 3. Duplicados Dispersos
  const duplicateSuggestions = Array.from(duplicateMap.values())
    .filter(d => d.hasDuplicatesInOtherContainers)
    .sort((a, b) => b.totalCopies - a.totalCopies);

  // 4. Tarjetas Asistente de Acción Rápida
  const assistantActionCards: AssistantActionCard[] = [];

  // Sugerencia de Inbox Triage
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

  // Top 2 Arquetipos con más cartas
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

  // Top Staples Dispersas
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

  // Top Duplicados dispersos
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
