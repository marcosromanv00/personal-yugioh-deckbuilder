import { DeckCard } from '@/components/deckbuilder/types';
import { simulateHands } from './hypergeometric';

export interface ExordioMainStats {
  attack: number; // 1 - 10
  control: number;
  consistency: number;
  boardBreaking: number;
  versatility: number;
  resilience: number;
  recovery: number;
}

export interface ExordioAdditionalStats {
  drawPower: number; // 1 - 5 stars
  control: number;
  search: number;
  layeredEndBoard: number;
  beatdown: number;
  stamina: number;
  comeback: number;
  swarm: number;
}

export interface ExordioStaminaBreakdown {
  earlyGame: number; // 1 - 5 stars
  midGame: number;
  longGame: number;
  gyRecycleHand: number;
  gyRecycleDeck: number;
  specialSummonGY: number;
}

export interface ThreatCardItem {
  id: number;
  name: string;
  image_url: string;
  dangerLevel: 1 | 2 | 3 | 4;
  category: 'handtrap' | 'board_breaker' | 'floodgate';
  reason: string;
}

export interface ExordioTestingData {
  winRatio: number; // 0 - 100%
  deadHands: { count: number; total: number }; // ej: 1/10
  otk: { count: number; total: number }; // ej: 5/10
  mostUsedCard?: DeckCard;
  topUsedCards: DeckCard[];
  leastUsedCards: DeckCard[];
}

export interface ExordioAnalysisResult {
  deckTitle: string;
  variant: string;
  deckType: 'Aggro' | 'Control' | 'Combo' | 'Midrange' | 'Stun';
  tierRank: string;
  finalScore: number;
  scoreRankBadge: string;
  recommendedFor: 'Beginners' | 'Intermediate' | 'Competitive' | 'Master';
  difficulty: { stars: number; label: string };
  nonEngineCount: number;
  nonEngineGrade: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  goingFirstViability: 'LOW' | 'MID' | 'HIGH' | 'TOP';
  goingSecondViability: 'LOW' | 'MID' | 'HIGH' | 'TOP';
  mainStats: ExordioMainStats;
  additionalStats: ExordioAdditionalStats;
  stamina: ExordioStaminaBreakdown;
  keyCards: {
    mainStarters: DeckCard[];
    keyCards: DeckCard[];
    mainBeaters: DeckCard[];
    mainDefenders: DeckCard[];
    bestCard: DeckCard | null;
  };
  threatCards: ThreatCardItem[];
  testingData: ExordioTestingData;
}

// Catálogo de amenazas meta demostrables y vigentes (Agosto 2026)
const META_THREAT_CATALOG: Array<{
  id: number;
  name: string;
  image_url: string;
  category: 'handtrap' | 'board_breaker' | 'floodgate';
  checkDanger: (cards: DeckCard[]) => { isThreat: boolean; level: 1 | 2 | 3 | 4; reason: string };
}> = [
  {
    id: 94145021,
    name: 'Droll & Lock Bird',
    image_url: 'https://images.ygoprodeck.com/images/cards/94145021.jpg',
    category: 'handtrap',
    checkDanger: (cards) => {
      const searchers = cards.filter(
        (c) => c.desc?.toLowerCase().includes('add 1') && c.desc?.toLowerCase().includes('deck to your hand')
      ).length;
      if (searchers >= 6) {
        return {
          isThreat: true,
          level: 4,
          reason: 'El deck realiza 3+ búsquedas en su turno 1, deteniendo jugadas por completo.',
        };
      }
      return { isThreat: false, level: 1, reason: '' };
    },
  },
  {
    id: 27204311,
    name: 'Nibiru, the Primal Being',
    image_url: 'https://images.ygoprodeck.com/images/cards/27204311.jpg',
    category: 'handtrap',
    checkDanger: (cards) => {
      const hasSwarm = cards.some(
        (c) => c.desc?.toLowerCase().includes('special summon')
      );
      return {
        isThreat: hasSwarm,
        level: hasSwarm ? 4 : 2,
        reason: 'Líneas de invocación extendida vulnerables tras la 5ta Invocación Especial sin omni-negate temprano.',
      };
    },
  },
  {
    id: 73642296,
    name: 'Ghost Belle & Haunted Mansion',
    image_url: 'https://images.ygoprodeck.com/images/cards/73642296.jpg',
    category: 'handtrap',
    checkDanger: (cards) => {
      const gyTriggers = cards.filter(
        (c) => c.desc?.toLowerCase().includes('from your gy')
      ).length;
      return {
        isThreat: gyTriggers >= 3,
        level: gyTriggers >= 5 ? 4 : 3,
        reason: 'Interrumpe efectos cruciales de resurrección o recuperación de recursos desde el Cementerio.',
      };
    },
  },
  {
    id: 5318639,
    name: 'Anti-Spell Fragrance',
    image_url: 'https://images.ygoprodeck.com/images/cards/5318639.jpg',
    category: 'floodgate',
    checkDanger: (cards) => {
      const spellCount = cards.filter((c) => c.type.toLowerCase().includes('spell')).length;
      return {
        isThreat: spellCount >= 10,
        level: spellCount >= 14 ? 4 : 3,
        reason: 'Paraliza la activación de Mágicas Normales y de Juego Rápido esenciales para el arranque.',
      };
    },
  },
  {
    id: 23434538,
    name: 'Dominus Impulse',
    image_url: 'https://images.ygoprodeck.com/images/cards/23434538.jpg',
    category: 'handtrap',
    checkDanger: (cards) => {
      const ssStarters = cards.filter((c) => c.desc?.toLowerCase().includes('special summon from your deck')).length;
      return {
        isThreat: ssStarters >= 2,
        level: 4,
        reason: 'Anula y destruye efectos que intenten Invocar de Modo Especial directamente desde el Deck.',
      };
    },
  },
  {
    id: 9753964,
    name: 'Rivalry of the Warlords',
    image_url: 'https://images.ygoprodeck.com/images/cards/9753964.jpg',
    category: 'floodgate',
    checkDanger: (cards) => {
      const races = new Set(cards.map((c) => c.race).filter(Boolean));
      return {
        isThreat: races.size >= 4,
        level: races.size >= 4 ? 4 : 2,
        reason: 'El deck utiliza múltiples tipos/razas de monstruos en su motor principal y Extra Deck.',
      };
    },
  },
];

/**
 * Genera el análisis analítico completo estilo Exordio del Duelista a partir de cualquier lista de cartas.
 */
export function generateExordioDeckAnalysis(
  deckCards: DeckCard[],
  inferredArchetype?: string
): ExordioAnalysisResult {
  const mainCards = deckCards.filter((c) => c.section === 'main');
  const extraCards = deckCards.filter((c) => c.section === 'extra');
  const totalMainCount = mainCards.reduce((acc, c) => acc + c.count, 0);

  // Clasificación de cartas
  const starters: DeckCard[] = [];
  const beaters: DeckCard[] = [];
  const defenders: DeckCard[] = [];
  const keyCards: DeckCard[] = [];
  const nonEngineCards: DeckCard[] = [];

  mainCards.forEach((c) => {
    const text = (c.desc || '').toLowerCase();
    const isHandtrap =
      text.includes('discard this card') ||
      c.name.includes('Ash Blossom') ||
      c.name.includes('Nibiru') ||
      c.name.includes('Infinite Impermanence') ||
      c.name.includes('Effect Veiler') ||
      c.name.includes('Ghost Mourner') ||
      c.name.includes('Droll');

    const isBoardBreaker =
      c.name.includes('Super Polymerization') ||
      c.name.includes('Dark Ruler') ||
      c.name.includes('Evenly Matched') ||
      c.name.includes('Lightning Storm') ||
      c.name.includes('Droplet');

    if (isHandtrap || isBoardBreaker) {
      nonEngineCards.push(c);
    }

    if (
      (text.includes('add 1') && text.includes('from your deck to your hand')) ||
      text.includes('if this card is normal') ||
      text.includes('normal or special summon')
    ) {
      starters.push(c);
    }

    if ((c.atk && c.atk >= 2500) || text.includes('cannot be destroyed') || text.includes('double')) {
      beaters.push(c);
    }

    if (
      text.includes('negate the activation') ||
      text.includes('destroy that') ||
      c.type.toLowerCase().includes('trap') ||
      (c.def && c.def >= 2500)
    ) {
      defenders.push(c);
    }

    if (c.archetype && !isHandtrap && !isBoardBreaker) {
      keyCards.push(c);
    }
  });

  // Extra deck bosses
  extraCards.forEach((c) => {
    if (c.atk && c.atk >= 2800) beaters.push(c);
    const text = (c.desc || '').toLowerCase();
    if (text.includes('quick effect') || text.includes('negate')) defenders.push(c);
  });

  // Best card calculation
  const bestCard =
    beaters[0] ||
    starters[0] ||
    extraCards[0] ||
    mainCards[0] ||
    null;

  // Non-engine stats
  const nonEngineCount = nonEngineCards.reduce((acc, c) => acc + c.count, 0);
  let nonEngineGrade: ExordioAnalysisResult['nonEngineGrade'] = 'POOR';
  if (nonEngineCount >= 18) nonEngineGrade = 'EXCELLENT';
  else if (nonEngineCount >= 13) nonEngineGrade = 'GOOD';
  else if (nonEngineCount >= 8) nonEngineGrade = 'FAIR';

  // Simulación Monte Carlo
  const starterCount = starters.reduce((acc, c) => acc + c.count, 0);
  const handtrapCount = nonEngineCount;
  const sim = simulateHands(totalMainCount || 40, starterCount, handtrapCount, 6, 2, 1000);

  // Scores en escala 1-10
  const consistencyScore = Math.min(10, Math.max(1, Math.round(sim.starterInHandPercent / 10)));
  const attackScore = Math.min(10, Math.max(3, Math.round(beaters.length * 1.5) + 3));
  const controlScore = Math.min(10, Math.max(2, Math.round(defenders.length * 1.2) + 2));
  const boardBreakingScore = Math.min(10, Math.max(3, Math.round(sim.goingSecondOTKPotential / 10)));
  const versatilityScore = Math.min(10, Math.max(4, Math.round(extraCards.length / 2) + 2));
  const resilienceScore = Math.min(10, Math.max(2, Math.round(sim.twoOrMoreStartersPercent / 10)));
  const recoveryScore = Math.min(10, Math.max(3, 7));

  // Final score ponderado
  const finalScore =
    Math.round(
      ((consistencyScore * 2 +
        attackScore * 1.5 +
        controlScore * 1.5 +
        boardBreakingScore * 1.2 +
        resilienceScore * 1.5 +
        recoveryScore * 1.3) /
        9) *
        10
    ) / 10;

  let scoreRankBadge = 'C RANK';
  let tierRank = 'TIER 3 / ROGUE';
  if (finalScore >= 8.5) {
    scoreRankBadge = 'S RANK';
    tierRank = 'TIER 1 (META DOMINANT)';
  } else if (finalScore >= 7.5) {
    scoreRankBadge = 'A RANK';
    tierRank = 'TIER 2 (COMPETITIVE)';
  } else if (finalScore >= 6.5) {
    scoreRankBadge = 'B RANK';
    tierRank = 'TIER 3 (SOLID ROGUE)';
  }

  // Amenazas calculadas
  const threatCards: ThreatCardItem[] = [];
  META_THREAT_CATALOG.forEach((item) => {
    const check = item.checkDanger(deckCards);
    if (check.isThreat) {
      threatCards.push({
        id: item.id,
        name: item.name,
        image_url: item.image_url,
        dangerLevel: check.level,
        category: item.category,
        reason: check.reason,
      });
    }
  });

  // Si faltan amenazas, rellenar con las handtraps más comunes
  if (threatCards.length < 3) {
    META_THREAT_CATALOG.slice(0, 3).forEach((item) => {
      if (!threatCards.some((t) => t.id === item.id)) {
        threatCards.push({
          id: item.id,
          name: item.name,
          image_url: item.image_url,
          dangerLevel: 3,
          category: item.category,
          reason: 'Interrupción estándar del formato que exige líneas alternativas de juego.',
        });
      }
    });
  }

  // Testing data
  const deadHandsCount = Math.max(1, Math.round(sim.brickPercent / 10));
  const otkCount = Math.min(10, Math.max(1, Math.round(sim.goingSecondOTKPotential / 10)));
  const winRatio = Math.min(95, Math.max(45, Math.round(finalScore * 9)));

  // Deck type
  let deckType: ExordioAnalysisResult['deckType'] = 'Midrange';
  if (attackScore >= 8 && consistencyScore >= 7) deckType = 'Aggro';
  else if (controlScore >= 8) deckType = 'Control';
  else if (consistencyScore >= 8 && extraCards.length >= 12) deckType = 'Combo';

  return {
    deckTitle: inferredArchetype ? `${inferredArchetype} Deck` : 'Competitive Decklist',
    variant: inferredArchetype || 'Pure Engine',
    deckType,
    tierRank,
    finalScore,
    scoreRankBadge,
    recommendedFor: finalScore >= 8 ? 'Competitive' : 'Beginners',
    difficulty: {
      stars: finalScore >= 8 ? 4 : 2,
      label: finalScore >= 8 ? 'Learning curve: Advanced' : 'Learning curve: Easy / Medium',
    },
    nonEngineCount,
    nonEngineGrade,
    goingFirstViability: controlScore >= 7 ? 'TOP' : 'HIGH',
    goingSecondViability: boardBreakingScore >= 7 ? 'HIGH' : 'MID',
    mainStats: {
      attack: attackScore,
      control: controlScore,
      consistency: consistencyScore,
      boardBreaking: boardBreakingScore,
      versatility: versatilityScore,
      resilience: resilienceScore,
      recovery: recoveryScore,
    },
    additionalStats: {
      drawPower: Math.min(5, Math.max(1, Math.round(starters.length / 3))),
      control: Math.min(5, Math.max(1, Math.round(controlScore / 2))),
      search: Math.min(5, Math.max(1, Math.round(starters.length / 2))),
      layeredEndBoard: Math.min(5, Math.max(1, Math.round(extraCards.length / 3))),
      beatdown: Math.min(5, Math.max(1, Math.round(attackScore / 2))),
      stamina: Math.min(5, Math.max(1, Math.round(recoveryScore / 2))),
      comeback: Math.min(5, Math.max(1, Math.round(resilienceScore / 2))),
      swarm: Math.min(5, Math.max(1, Math.round(starters.length / 2))),
    },
    stamina: {
      earlyGame: Math.min(5, Math.max(1, Math.round(consistencyScore / 2))),
      midGame: 5,
      longGame: Math.min(5, Math.max(1, Math.round(recoveryScore / 2))),
      gyRecycleHand: 4,
      gyRecycleDeck: 1,
      specialSummonGY: 3,
    },
    keyCards: {
      mainStarters: starters.slice(0, 3),
      keyCards: keyCards.slice(0, 4),
      mainBeaters: beaters.slice(0, 3),
      mainDefenders: defenders.slice(0, 2),
      bestCard,
    },
    threatCards: threatCards.slice(0, 5),
    testingData: {
      winRatio,
      deadHands: { count: deadHandsCount, total: 10 },
      otk: { count: otkCount, total: 10 },
      mostUsedCard: bestCard || mainCards[0],
      topUsedCards: (starters.length > 0 ? starters : mainCards).slice(0, 3),
      leastUsedCards: mainCards.slice(-3),
    },
  };
}
