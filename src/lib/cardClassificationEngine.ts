import { StorageLocation, UserCard, Deck, CardStatusFlag } from '@/types/collection';
import { getArchetypesForCard, getImplicitSynergiesForArchetype } from '@/lib/constants/archetypeSynergies';

export const GLOBAL_STAPLES_TIER1 = [
  'Ash Blossom & Joyous Spring',
  'Effect Veiler',
  'Infinite Impermanence',
  'Nibiru, the Primal Being',
  'Triple Tactics Talent',
  'Triple Tactics Thrust',
  'Called by the Grave',
  'Crossout Designator',
  'Forbidden Droplet',
  'S:P Little Knight',
  'I:P Masquerena',
  'Divine Arsenal AA-ZEUS - Sky Thunder',
  'Droll & Lock Bird',
  'Super Polymerization',
  'Dimension Shifter',
  'Evenly Matched',
  'Promethean Princess, Bestower of Flames'
];

export const GLOBAL_STAPLES_TIER2 = [
  'Ghost Belle & Haunted Mansion',
  'Ghost Mourner & Moonlit Chill',
  'Ghost Ogre & Snow Rabbit',
  'Cosmic Cyclone',
  'Lightning Storm',
  'Dark Ruler No More',
  'Harpie\'s Feather Duster',
  'Dimensional Barrier',
  'Solemn Judgment',
  'Solemn Strike',
  'Pot of Prosperity',
  'Pot of Extravagance',
  'Accesscode Talker',
  'Knightmare Phoenix',
  'Knightmare Unicorn',
  'Apollousa, Bow of the Goddess',
  'Abyss Dweller',
  'Book of Moon',
  'Book of Eclipse'
];

export const ICONIC_ANIME_CARDS = [
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
  'Buster Blader',
  'Black Luster Soldier'
];

export const HIGH_RARITIES = [
  'Quarter Century Secret Rare',
  'Starlight Rare',
  'Ghost Rare',
  'Ultimate Rare',
  'Collector\'s Rare',
  'Secret Rare',
  'Prismatic Secret Rare',
  'Platinum Secret Rare',
  'Ultra Rare'
];

export interface DeckNeedMatch {
  deckId: string;
  deckName: string;
  section: string;
  targetCount: number;
  assignedCount: number;
  neededCopies: number;
  deckStorageLocationId?: string | null;
}

export interface CardSurplusAnalysis {
  totalPhysicalInInventory: number;
  isPlaysetComplete: boolean;
  isSurplus: boolean;
  surplusCopies: number;
}

export interface ArchetypeCoreAnalysis {
  archetype: string | null;
  totalCardsInCollection: number;
  uniqueCardsInCollection: number;
  isViableCore: boolean;
}

export interface CollectionTierAnalysis {
  isHighRarity: boolean;
  rarityName: string;
  isStaple: boolean;
  stapleTier: 'Tier 1' | 'Tier 2' | null;
  isAnimeIconic: boolean;
}

export interface BulkAnalysis {
  isBulkCandidate: boolean;
  reason: string;
}

export type RecommendationCategory = 
  | 'deck_completion' 
  | 'surplus_sale' 
  | 'archetype_core_sale' 
  | 'collection_protect' 
  | 'bulk_storage';

export interface BestRecommendation {
  category: RecommendationCategory;
  badgeLabel: string;
  badgeColor: 'emerald' | 'amber' | 'blue' | 'purple' | 'zinc';
  title: string;
  description: string;
  suggestedStatusFlag: CardStatusFlag;
  suggestedLocationId: string | null;
  suggestedLocationName: string;
  suggestedDeckId?: string | null;
  suggestedDeckName?: string | null;
  actionLabel: string;
}

export interface CardClassificationReport {
  cardId: number;
  cardName: string;
  deckMatches: DeckNeedMatch[];
  surplus: CardSurplusAnalysis;
  archetypeCore: ArchetypeCoreAnalysis;
  collectionTier: CollectionTierAnalysis;
  bulk: BulkAnalysis;
  bestRecommendation: BestRecommendation;
}

// -------------------------------------------------------------
// PATRONES DE CARRIL Y COLECCIÓN (LANE & GLOBAL PATTERNS)
// -------------------------------------------------------------

export interface LaneCluster {
  id: string;
  name: string;
  category: 'archetype' | 'staple' | 'high_rarity' | 'deck_completion' | 'bulk';
  count: number;
  uniqueCount: number;
  percentage: number;
  color: 'purple' | 'amber' | 'blue' | 'emerald' | 'zinc';
  cardIds: number[];
  userCardIds: string[];
  description: string;
  suggestedAction?: string;
  suggestedTargetLocationId?: string | null;
  suggestedTargetLocationName?: string;
}

export interface LanePatternReport {
  totalCards: number;
  uniqueCards: number;
  dominantTheme: string;
  dominantPercentage: number;
  clusters: LaneCluster[];
  misplacedCards: Array<{
    userCardId: string;
    cardName: string;
    rarity: string;
    reason: string;
    suggestedLocationName: string;
    suggestedLocationId: string | null;
  }>;
  summaryRecommendation: string;
}

export interface GlobalArchetypeCore {
  archetype: string;
  totalCards: number;
  uniqueCards: number;
  deckReadinessPercentage: number;
  cardNames: string[];
  suggestedAction: string;
}

export interface GlobalDeckOpportunity {
  deckId: string;
  deckName: string;
  totalNeeded: number;
  readyToAssignCount: number;
  completionPossibleNow: boolean;
  missingCards: Array<{ cardId: number; name: string; needed: number; availableInCollection: number }>;
}

export interface GlobalCollectionReport {
  archetypeCores: GlobalArchetypeCore[];
  deckOpportunities: GlobalDeckOpportunity[];
  highValueFoilsCount: number;
  unprotectedFoilsCount: number;
  totalStaplesCount: number;
  totalSurplusCopies: number;
  totalBulkEstimated: number;
}

/**
 * Motor central de análisis y clasificación individual en tiempo real.
 */
export function analyzeCardClassification(
  card: {
    card_id: number;
    rarity?: string;
    status_flag?: CardStatusFlag;
    quantity?: number;
    deck_id?: string | null;
    storage_location_id?: string | null;
    card_details?: {
      name: string;
      type?: string;
      archetype?: string;
      desc?: string;
    };
  },
  allUserCards: UserCard[] = [],
  allDecks: Deck[] = [],
  locations: StorageLocation[] = []
): CardClassificationReport {
  const cardId = card.card_id;
  const cardName = card.card_details?.name || `Carta #${cardId}`;
  const rarity = card.rarity || 'Common';
  
  // Detectar arquetipo nominal o inferido por sinergia implícita
  const implicitArchetypeMatches = getArchetypesForCard(cardName);
  const primaryImplicit = implicitArchetypeMatches[0];
  const effectiveArchetype = card.card_details?.archetype || (primaryImplicit ? primaryImplicit.archetype : null);
  const archetype = effectiveArchetype;

  // 1. Análisis de Decks del Usuario
  const deckMatches: DeckNeedMatch[] = [];
  for (const deck of allDecks) {
    if (!deck.cards || deck.cards.length === 0) continue;
    const targetCardInDeck = deck.cards.find(c => c.card_id === cardId);
    if (targetCardInDeck) {
      const assignedToThisDeck = allUserCards
        .filter(uc => uc.card_id === cardId && uc.deck_id === deck.id)
        .reduce((sum, uc) => sum + (uc.quantity || 1), 0);

      const needed = Math.max(0, targetCardInDeck.count - assignedToThisDeck);
      deckMatches.push({
        deckId: deck.id,
        deckName: deck.name,
        section: targetCardInDeck.section || 'main',
        targetCount: targetCardInDeck.count,
        assignedCount: assignedToThisDeck,
        neededCopies: needed,
        deckStorageLocationId: deck.storage_location_id || null,
      });
    }
  }

  // 2. Análisis de Excedentes y Playsets
  const totalPhysicalInInventory = allUserCards
    .filter(uc => uc.card_id === cardId)
    .reduce((sum, uc) => sum + (uc.quantity || 1), 0);

  const isPlaysetComplete = totalPhysicalInInventory >= 3;
  const isSurplus = totalPhysicalInInventory > 3;
  const surplusCopies = Math.max(0, totalPhysicalInInventory - 3);

  const surplus: CardSurplusAnalysis = {
    totalPhysicalInInventory,
    isPlaysetComplete,
    isSurplus,
    surplusCopies,
  };

  // 3. Análisis de Núcleos de Arquetipos (Nominales + Sinergias Implícitas)
  let totalArchetypeCards = 0;
  let uniqueArchetypeCards = 0;
  if (archetype) {
    const implicitSynergies = getImplicitSynergiesForArchetype(archetype);
    const implicitCardNames = new Set(implicitSynergies.map(s => s.cardName.toLowerCase()));

    const archetypeCards = allUserCards.filter(uc => {
      const cName = (uc.card_details?.name || '').toLowerCase();
      const isDirectArch = uc.card_details?.archetype?.toLowerCase() === archetype.toLowerCase();
      const isImplicitSynergy = implicitCardNames.has(cName);
      return isDirectArch || isImplicitSynergy;
    });

    totalArchetypeCards = archetypeCards.reduce((sum, uc) => sum + (uc.quantity || 1), 0);
    uniqueArchetypeCards = new Set(archetypeCards.map(uc => uc.card_id)).size;
  }
  const isViableCore = Boolean(archetype && (totalArchetypeCards >= 6 || uniqueArchetypeCards >= 3));

  const archetypeCore: ArchetypeCoreAnalysis = {
    archetype,
    totalCardsInCollection: totalArchetypeCards,
    uniqueCardsInCollection: uniqueArchetypeCards,
    isViableCore,
  };

  // 4. Análisis de Colección, Staples y Alta Rareza
  const isHighRarity = HIGH_RARITIES.some(r => rarity.toLowerCase().includes(r.toLowerCase()));
  const isTier1Staple = GLOBAL_STAPLES_TIER1.some(s => s.toLowerCase() === cardName.toLowerCase());
  const isTier2Staple = GLOBAL_STAPLES_TIER2.some(s => s.toLowerCase() === cardName.toLowerCase());
  const isStaple = isTier1Staple || isTier2Staple;
  const isAnimeIconic = ICONIC_ANIME_CARDS.some(a => a.toLowerCase() === cardName.toLowerCase());

  const collectionTier: CollectionTierAnalysis = {
    isHighRarity,
    rarityName: rarity,
    isStaple,
    stapleTier: isTier1Staple ? 'Tier 1' : isTier2Staple ? 'Tier 2' : null,
    isAnimeIconic,
  };

  // 5. Análisis de Bulk
  const hasNoDeck = deckMatches.length === 0;
  const isCommonOrLow = !isHighRarity;
  const isBulkCandidate = hasNoDeck && !isStaple && !isAnimeIconic && isCommonOrLow;

  const bulk: BulkAnalysis = {
    isBulkCandidate,
    reason: isBulkCandidate 
      ? 'Común / baja rareza sin decks activos ni demanda como staple'
      : 'No califica como bulk estándar (tiene utilidad, rareza o decks asociados)',
  };

  // 6. Localizar Contenedores
  const binderLocations = locations.filter(l => l.type === 'binder');
  const tradeLocations = locations.filter(l => 
    l.name.toLowerCase().includes('trade') || 
    l.name.toLowerCase().includes('venta') ||
    l.description?.toLowerCase().includes('venta')
  );
  const boxLocations = locations.filter(l => l.type === 'box' || l.type === 'drawer' || l.type === 'tin');
  const bulkLocations = locations.filter(l => 
    l.name.toLowerCase().includes('bulk') || 
    l.name.toLowerCase().includes('crap') ||
    l.name.toLowerCase().includes('comun')
  );

  const primaryTradeLoc = tradeLocations[0] || binderLocations[0] || boxLocations[0] || null;
  const primaryBinderLoc = binderLocations[0] || null;
  const primaryBulkLoc = bulkLocations[0] || boxLocations[0] || null;

  // 7. Determinar Mejor Recomendación

  // Prioridad 1: Completar Deck Activo
  const urgentDeck = deckMatches.find(d => d.neededCopies > 0);
  if (urgentDeck) {
    const deckStorage = locations.find(l => l.id === urgentDeck.deckStorageLocationId);
    return {
      cardId,
      cardName,
      deckMatches,
      surplus,
      archetypeCore,
      collectionTier,
      bulk,
      bestRecommendation: {
        category: 'deck_completion',
        badgeLabel: `Completa Mazo: ${urgentDeck.deckName}`,
        badgeColor: 'emerald',
        title: `Asignar a ${urgentDeck.deckName}`,
        description: `Faltan ${urgentDeck.neededCopies} copia(s) física(s) para completar la sección ${urgentDeck.section.toUpperCase()} de este mazo.`,
        suggestedStatusFlag: 'in_deck',
        suggestedLocationId: deckStorage?.id || card.storage_location_id || null,
        suggestedLocationName: deckStorage ? deckStorage.name : 'Deckbox / Ubicación del Mazo',
        suggestedDeckId: urgentDeck.deckId,
        suggestedDeckName: urgentDeck.deckName,
        actionLabel: `Asignar a ${urgentDeck.deckName}`,
      }
    };
  }

  // Prioridad 2: Excedente de Playset (3+ copias)
  if (isSurplus) {
    return {
      cardId,
      cardName,
      deckMatches,
      surplus,
      archetypeCore,
      collectionTier,
      bulk,
      bestRecommendation: {
        category: 'surplus_sale',
        badgeLabel: `Excedente (+${surplusCopies} copias)`,
        badgeColor: 'amber',
        title: 'Mover a Venta / Trade',
        description: `Ya posees ${totalPhysicalInInventory} copias en tu colección. Las copias por encima de 3 son ideales para intercambio o venta.`,
        suggestedStatusFlag: 'trade_sale',
        suggestedLocationId: primaryTradeLoc?.id || null,
        suggestedLocationName: primaryTradeLoc ? primaryTradeLoc.name : 'Carpeta / Caja de Venta',
        actionLabel: `Mover a ${primaryTradeLoc?.name || 'Venta / Trade'}`,
      }
    };
  }

  // Prioridad 3: Colección & Staples / Alta Rareza
  if (isHighRarity || isStaple || isAnimeIconic) {
    const reasonDetail = isStaple 
      ? `Staple universal (${collectionTier.stapleTier}) indispensable para torneos`
      : isHighRarity
      ? `Alta Rareza (${rarity}) digna de protección`
      : 'Carta icónica histórica / coleccionable';

    return {
      cardId,
      cardName,
      deckMatches,
      surplus,
      archetypeCore,
      collectionTier,
      bulk,
      bestRecommendation: {
        category: 'collection_protect',
        badgeLabel: isStaple ? `Staple ${collectionTier.stapleTier}` : isHighRarity ? `Colección: ${rarity}` : 'Colección Icónica',
        badgeColor: 'blue',
        title: 'Proteger en Binder de Colección',
        description: `${reasonDetail}. Se recomienda archivarlo en una carpeta protegida con fundas.`,
        suggestedStatusFlag: 'collection',
        suggestedLocationId: primaryBinderLoc?.id || null,
        suggestedLocationName: primaryBinderLoc ? primaryBinderLoc.name : 'Binder Principal',
        actionLabel: `Archivar en ${primaryBinderLoc?.name || 'Binder de Colección'}`,
      }
    };
  }

  // Prioridad 4: Núcleo de Arquetipo para Venta
  if (isViableCore && archetype) {
    return {
      cardId,
      cardName,
      deckMatches,
      surplus,
      archetypeCore,
      collectionTier,
      bulk,
      bestRecommendation: {
        category: 'archetype_core_sale',
        badgeLabel: `Core ${archetype}`,
        badgeColor: 'purple',
        title: `Agrupar en Lote/Core de ${archetype}`,
        description: `Posees ${totalArchetypeCards} cartas (${uniqueArchetypeCards} únicas) de ${archetype}. Es excelente para vender como paquete/core completo.`,
        suggestedStatusFlag: 'trade_sale',
        suggestedLocationId: primaryTradeLoc?.id || null,
        suggestedLocationName: primaryTradeLoc ? primaryTradeLoc.name : 'Caja de Cores / Trades',
        actionLabel: `Mover a ${primaryTradeLoc?.name || 'Lotes de Venta'}`,
      }
    };
  }

  // Prioridad 5: Bulk / Almacenamiento Estándar
  return {
    cardId,
    cardName,
    deckMatches,
    surplus,
    archetypeCore,
    collectionTier,
    bulk,
    bestRecommendation: {
      category: 'bulk_storage',
      badgeLabel: 'Bulk / Almacenamiento',
      badgeColor: 'zinc',
      title: 'Clasificar como Bulk',
      description: 'Carta común o de baja demanda. Asignar a caja/lata de almacenamiento general para optimizar espacio.',
      suggestedStatusFlag: 'bulk',
      suggestedLocationId: primaryBulkLoc?.id || null,
      suggestedLocationName: primaryBulkLoc ? primaryBulkLoc.name : 'Caja de Bulk',
      actionLabel: `Enviar a ${primaryBulkLoc?.name || 'Caja de Bulk'}`,
    }
  };
}

/**
 * Analizador de patrones para un carril / contenedor específico (Lane Pattern Recognizer).
 */
export function analyzeLanePatterns(
  laneCards: UserCard[],
  allCollectionCards: UserCard[] = [],
  allDecks: Deck[] = [],
  locations: StorageLocation[] = []
): LanePatternReport {
  const totalCards = laneCards.reduce((acc, c) => acc + (c.quantity || 1), 0);
  const uniqueCards = new Set(laneCards.map(c => c.card_id)).size;

  if (totalCards === 0) {
    return {
      totalCards: 0,
      uniqueCards: 0,
      dominantTheme: 'Vacío',
      dominantPercentage: 0,
      clusters: [],
      misplacedCards: [],
      summaryRecommendation: 'El carril se encuentra vacío actualmente.',
    };
  }

  // 1. Agrupar por Arquetipos
  const archetypeCounts = new Map<string, { count: number; uniqueIds: Set<number>; userCardIds: string[] }>();
  // 2. Agrupar por Staples
  const stapleCards: UserCard[] = [];
  // 3. Agrupar por Alta Rareza (Foils)
  const foilCards: UserCard[] = [];
  // 4. Agrupar por Completar Decks
  const deckCompletionCards: UserCard[] = [];
  // 5. Agrupar por Bulk
  const bulkCards: UserCard[] = [];

  const binderLocations = locations.filter(l => l.type === 'binder');
  const primaryBinder = binderLocations[0];

  const misplacedCards: LanePatternReport['misplacedCards'] = [];

  for (const uc of laneCards) {
    const qty = uc.quantity || 1;
    const name = uc.card_details?.name || `Carta #${uc.card_id}`;
    const archetype = uc.card_details?.archetype;
    const rarity = uc.rarity || 'Common';
    const isHighRarity = HIGH_RARITIES.some(r => rarity.toLowerCase().includes(r.toLowerCase()));
    const isStaple = GLOBAL_STAPLES_TIER1.some(s => s.toLowerCase() === name.toLowerCase()) ||
                     GLOBAL_STAPLES_TIER2.some(s => s.toLowerCase() === name.toLowerCase());

    if (archetype) {
      const existing = archetypeCounts.get(archetype) || { count: 0, uniqueIds: new Set<number>(), userCardIds: [] };
      existing.count += qty;
      existing.uniqueIds.add(uc.card_id);
      existing.userCardIds.push(uc.id);
      archetypeCounts.set(archetype, existing);
    }

    if (isStaple) {
      stapleCards.push(uc);
    }

    if (isHighRarity) {
      foilCards.push(uc);
      if (primaryBinder && uc.storage_location_id !== primaryBinder.id) {
        misplacedCards.push({
          userCardId: uc.id,
          cardName: name,
          rarity,
          reason: 'Carta Foil / Alta Rareza guardada en caja común en lugar de Carpeta',
          suggestedLocationName: primaryBinder.name,
          suggestedLocationId: primaryBinder.id,
        });
      }
    }

    // Verificar si completa algún mazo
    const matchesDeck = allDecks.some(d => d.cards?.some(dc => dc.card_id === uc.card_id));
    if (matchesDeck) {
      deckCompletionCards.push(uc);
    }

    if (!isHighRarity && !isStaple && !archetype && !matchesDeck) {
      bulkCards.push(uc);
    }
  }

  const clusters: LaneCluster[] = [];

  // Añadir arquetipos relevantes
  archetypeCounts.forEach((data, archName) => {
    if (data.count >= 2) {
      const pct = Math.round((data.count / totalCards) * 100);
      clusters.push({
        id: `arch-${archName}`,
        name: `Arquetipo: ${archName}`,
        category: 'archetype',
        count: data.count,
        uniqueCount: data.uniqueIds.size,
        percentage: pct,
        color: 'purple',
        cardIds: Array.from(data.uniqueIds),
        userCardIds: data.userCardIds,
        description: `${data.count} cartas (${data.uniqueIds.size} únicas) del arquetipo ${archName}.`,
        suggestedAction: `Agrupar lote ${archName}`,
      });
    }
  });

  // Añadir staples
  if (stapleCards.length > 0) {
    const count = stapleCards.reduce((acc, c) => acc + (c.quantity || 1), 0);
    clusters.push({
      id: 'cluster-staples',
      name: 'Staples & Handtraps',
      category: 'staple',
      count,
      uniqueCount: new Set(stapleCards.map(c => c.card_id)).size,
      percentage: Math.round((count / totalCards) * 100),
      color: 'amber',
      cardIds: Array.from(new Set(stapleCards.map(c => c.card_id))),
      userCardIds: stapleCards.map(c => c.id),
      description: `${count} cartas de utilidad competitiva (Handtraps, Removal, Floodgates).`,
      suggestedAction: 'Proteger en Binder o Deckbox de Torneo',
    });
  }

  // Añadir Foils
  if (foilCards.length > 0) {
    const count = foilCards.reduce((acc, c) => acc + (c.quantity || 1), 0);
    clusters.push({
      id: 'cluster-foils',
      name: 'Alta Rareza / Foils',
      category: 'high_rarity',
      count,
      uniqueCount: new Set(foilCards.map(c => c.card_id)).size,
      percentage: Math.round((count / totalCards) * 100),
      color: 'blue',
      cardIds: Array.from(new Set(foilCards.map(c => c.card_id))),
      userCardIds: foilCards.map(c => c.id),
      description: `${count} cartas Ultra/Secret/QCR que requieren fundas y carpeta.`,
      suggestedAction: 'Mover a Carpeta de Colección',
    });
  }

  // Añadir Decks
  if (deckCompletionCards.length > 0) {
    const count = deckCompletionCards.reduce((acc, c) => acc + (c.quantity || 1), 0);
    clusters.push({
      id: 'cluster-decks',
      name: 'Piezas de Mazos Activos',
      category: 'deck_completion',
      count,
      uniqueCount: new Set(deckCompletionCards.map(c => c.card_id)).size,
      percentage: Math.round((count / totalCards) * 100),
      color: 'emerald',
      cardIds: Array.from(new Set(deckCompletionCards.map(c => c.card_id))),
      userCardIds: deckCompletionCards.map(c => c.id),
      description: `${count} cartas requeridas por tus proyectos de baraja actuales.`,
      suggestedAction: 'Asignar a Decks',
    });
  }

  // Determinar tema dominante
  clusters.sort((a, b) => b.count - a.count);
  const dominant = clusters[0];
  const dominantTheme = dominant ? dominant.name : 'Misceláneo / Variado';
  const dominantPercentage = dominant ? dominant.percentage : 0;

  let summaryRecommendation = `Este carril contiene ${totalCards} cartas (${uniqueCards} únicas).`;
  if (dominant) {
    summaryRecommendation += ` Predomina ${dominant.name} con un ${dominant.percentage}% del contenido.`;
  }
  if (misplacedCards.length > 0) {
    summaryRecommendation += ` Se detectaron ${misplacedCards.length} cartas de alto valor que sugerimos mover a una carpeta.`;
  }

  return {
    totalCards,
    uniqueCards,
    dominantTheme,
    dominantPercentage,
    clusters,
    misplacedCards,
    summaryRecommendation,
  };
}

/**
 * Analizador global de patrones y oportunidades de toda la colección.
 */
export function analyzeGlobalCollectionPatterns(
  allCards: UserCard[] = [],
  allDecks: Deck[] = [],
  locations: StorageLocation[] = []
): GlobalCollectionReport {
  // 1. Arquetipos globales
  const archMap = new Map<string, { count: number; uniqueIds: Set<number>; cardNames: Set<string> }>();
  let totalStaples = 0;
  let highValueFoils = 0;
  let unprotectedFoils = 0;
  let surplusTotal = 0;
  let bulkTotal = 0;

  const physicalCountsByCardId = new Map<number, number>();
  for (const uc of allCards) {
    const qty = uc.quantity || 1;
    const current = physicalCountsByCardId.get(uc.card_id) || 0;
    physicalCountsByCardId.set(uc.card_id, current + qty);

    const name = uc.card_details?.name || `Carta #${uc.card_id}`;
    const archetype = uc.card_details?.archetype;
    const rarity = uc.rarity || 'Common';
    const isHighRarity = HIGH_RARITIES.some(r => rarity.toLowerCase().includes(r.toLowerCase()));
    const isStaple = GLOBAL_STAPLES_TIER1.some(s => s.toLowerCase() === name.toLowerCase()) ||
                     GLOBAL_STAPLES_TIER2.some(s => s.toLowerCase() === name.toLowerCase());

    if (archetype) {
      const e = archMap.get(archetype) || { count: 0, uniqueIds: new Set<number>(), cardNames: new Set<string>() };
      e.count += qty;
      e.uniqueIds.add(uc.card_id);
      e.cardNames.add(name);
      archMap.set(archetype, e);
    }

    if (isStaple) totalStaples += qty;
    if (isHighRarity) {
      highValueFoils += qty;
      const loc = locations.find(l => l.id === uc.storage_location_id);
      if (!loc || loc.type !== 'binder') {
        unprotectedFoils += qty;
      }
    }

    if (!isHighRarity && !isStaple && !archetype && !uc.deck_id) {
      bulkTotal += qty;
    }
  }

  // Contar excedentes de playset
  physicalCountsByCardId.forEach((qty) => {
    if (qty > 3) surplusTotal += (qty - 3);
  });

  const archetypeCores: GlobalArchetypeCore[] = [];
  archMap.forEach((val, archName) => {
    if (val.uniqueIds.size >= 3 || val.count >= 6) {
      // Estimar readiness para deck (un core típico suele requerir 15-20 cartas del arquetipo)
      const readiness = Math.min(100, Math.round((val.count / 18) * 100));
      archetypeCores.push({
        archetype: archName,
        totalCards: val.count,
        uniqueCards: val.uniqueIds.size,
        deckReadinessPercentage: readiness,
        cardNames: Array.from(val.cardNames).slice(0, 5),
        suggestedAction: readiness >= 70 ? 'Listo para armar Deck' : 'Lote / Core para Venta',
      });
    }
  });
  archetypeCores.sort((a, b) => b.totalCards - a.totalCards);

  // Oportunidades de completar Decks
  const deckOpportunities: GlobalDeckOpportunity[] = [];
  for (const deck of allDecks) {
    if (!deck.cards || deck.cards.length === 0) continue;
    let totalNeeded = 0;
    let readyToAssignCount = 0;
    const missing: GlobalDeckOpportunity['missingCards'] = [];

    for (const dc of deck.cards) {
      const assignedToDeck = allCards
        .filter(uc => uc.card_id === dc.card_id && uc.deck_id === deck.id)
        .reduce((acc, uc) => acc + (uc.quantity || 1), 0);

      const needed = Math.max(0, dc.count - assignedToDeck);
      if (needed > 0) {
        totalNeeded += needed;
        const availableInCollection = (physicalCountsByCardId.get(dc.card_id) || 0) - assignedToDeck;
        const canSupply = Math.min(needed, Math.max(0, availableInCollection));
        readyToAssignCount += canSupply;
        missing.push({
          cardId: dc.card_id,
          name: dc.card_details?.name || `Carta #${dc.card_id}`,
          needed,
          availableInCollection,
        });
      }
    }

    if (totalNeeded > 0) {
      deckOpportunities.push({
        deckId: deck.id,
        deckName: deck.name,
        totalNeeded,
        readyToAssignCount,
        completionPossibleNow: readyToAssignCount >= totalNeeded,
        missingCards: missing,
      });
    }
  }

  deckOpportunities.sort((a, b) => b.readyToAssignCount - a.readyToAssignCount);

  return {
    archetypeCores,
    deckOpportunities,
    highValueFoilsCount: highValueFoils,
    unprotectedFoilsCount: unprotectedFoils,
    totalStaplesCount: totalStaples,
    totalSurplusCopies: surplusTotal,
    totalBulkEstimated: bulkTotal,
  };
}
