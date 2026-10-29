import { UserCard, Deck } from '@/types/collection';
import { GLOBAL_STAPLES_TIER1, GLOBAL_STAPLES_TIER2 } from './cardClassificationEngine';
import { TriageCompetitiveMatch, TriageThematicIncubator, TriageWorkshopHeuristic, TriageDiagnosis } from '@/types/triage';
import { evaluateTacticalVerdict } from './triageTacticalEvaluator';

/**
 * Detecta si la carta es requerida por algún mazo activo del usuario.
 */
export function getCompetitiveDeckMatches(cardId: number, decks: Deck[]): TriageCompetitiveMatch[] {
  const matches: TriageCompetitiveMatch[] = [];
  for (const deck of decks) {
    if (!deck.is_active || !Array.isArray(deck.cards)) continue;
    const deckCard = deck.cards.find(c => c.card_id === cardId);
    if (!deckCard) continue;
    const currentAssigned = (deckCard.physical_copies || []).filter(p => !p.is_proxy).length;
    const needed = Math.max(0, (deckCard.count || 1) - currentAssigned);
    matches.push({
      deckId: deck.id,
      deckName: deck.name,
      section: (deckCard.section as 'main' | 'extra' | 'side') || 'main',
      neededCopies: needed > 0 ? needed : 1,
      currentInDeck: currentAssigned,
      format: deck.format || 'Master Duel',
    });
  }
  return matches;
}

/**
 * Analiza la masa crítica en la colección para proyectos temáticos (arquetipo o raza/atributo).
 */
export function getThematicIncubators(card: UserCard, allUserCards: UserCard[]): TriageThematicIncubator[] {
  const d = card.card_details;
  if (!d) return [];
  const incubators: TriageThematicIncubator[] = [];

  if (d.archetype) {
    const archCards = allUserCards.filter(c => c.card_details?.archetype === d.archetype);
    const uniqueIds = new Set(archCards.map(c => c.card_id)).size;
    const totalCount = archCards.reduce((acc, c) => acc + (c.quantity || 1), 0);
    incubators.push({
      themeName: d.archetype,
      themeCategory: 'archetype',
      totalCardsInCollection: totalCount,
      uniqueCardsInCollection: uniqueIds,
      hasEnoughForCore: uniqueIds >= 5 || totalCount >= 12,
    });
  }

  if (d.race && d.type?.includes('Monster')) {
    const raceCards = allUserCards.filter(c => c.card_details?.race === d.race);
    incubators.push({
      themeName: d.race,
      themeCategory: 'race',
      totalCardsInCollection: raceCards.reduce((acc, c) => acc + (c.quantity || 1), 0),
      uniqueCardsInCollection: new Set(raceCards.map(c => c.card_id)).size,
      hasEnoughForCore: false,
    });
  }
  return incubators;
}

/**
 * Heurística de Ensalada Didáctica: acepta invocaciones accesibles, mecánicas de cementerio y buenas stats,
 * pero descarta restricciones imposibles, malas stats e interacciones ultra específicas.
 */
export function evaluateWorkshopSalad(card: UserCard): TriageWorkshopHeuristic {
  const d = card.card_details;
  if (!d) return { isCandidateForWorkshop: false, score: 0, reasons: [] };

  const desc = (d.desc || '').toLowerCase();
  const type = d.type || '';
  const atk = d.atk ?? 0;
  const lvl = d.level ?? 4;
  const reasons: string[] = [];
  let score = 50;

  // 1. Descalificación por candados xenófobos que impiden jugar en baraja mixta
  const impossibleLocks = [
    'cannot special summon monsters, except',
    'locks you into',
    'for the rest of this turn, you cannot special summon',
    'for the rest of this turn, you cannot activate',
  ];
  if (impossibleLocks.some(lock => desc.includes(lock))) {
    return { isCandidateForWorkshop: false, score: 0, reasons: ['Restricción xenófoba que bloquea invocaciones mixtas'] };
  }

  // 2. Descalificación por interacciones pasivas o dependientes de destrucción del rival
  const isOpponentDependent =
    (desc.includes("opponent's card effect") && desc.includes('during the end phase')) ||
    (desc.includes('when this card is destroyed by battle') && atk < 1400);
  if (isOpponentDependent) {
    return { isCandidateForWorkshop: false, score: 10, reasons: ['Efecto pasivo o dependiente del oponente'] };
  }

  // 3. Descalificación por malas estadísticas sin invocación propia
  if (type.includes('Monster')) {
    const hasSpecialSummon = desc.includes('special summon this card') || desc.includes('you can special summon');
    if (lvl >= 5 && lvl <= 6 && atk < 1900 && !hasSpecialSummon) {
      return { isCandidateForWorkshop: false, score: 15, reasons: [`Nivel ${lvl} con bajo ATK (${atk}) sin invocación propia`] };
    }
    if (lvl >= 7 && atk < 2400 && !hasSpecialSummon) {
      return { isCandidateForWorkshop: false, score: 15, reasons: [`Nivel ${lvl} pesado (${atk} ATK) sin invocación propia`] };
    }
    if (lvl <= 4 && atk < 1000 && !hasSpecialSummon && !desc.includes('draw') && !desc.includes('destroy') && !desc.includes('add 1')) {
      return { isCandidateForWorkshop: false, score: 20, reasons: [`Bajo ATK (${atk}) sin generación de ventaja`] };
    }
  }

  // 4. Calificadores Positivos: Invocación accesible, GY/destierro didáctico y combate
  if (desc.includes('special summon this card') || desc.includes('if you control no monsters') || desc.includes('you can special summon 1')) {
    reasons.push('Invocación especial accesible para desplegar presencia en campo');
    score += 35;
  }
  if (desc.includes('from your gy') || desc.includes('from your graveyard') || desc.includes('banish this card from your gy')) {
    reasons.push('Mecánica de cementerio o destierro didáctica y aprovechable');
    score += 25;
  }
  const genericRemoval = ['destroy 1', 'target 1 card', 'draw 1', 'negate the attack', 'return to the hand'];
  if (genericRemoval.some(w => desc.includes(w))) {
    reasons.push('Interacción de campo directa (destrucción, robo o control)');
    score += 25;
  }
  if (type === 'Normal Monster' || (type.includes('Monster') && !type.includes('Effect'))) {
    reasons.push(atk >= 1700 && lvl <= 4 ? `Vainilla beatstick fuerte (${atk} ATK)` : 'Monstruo Vainilla: combate limpio sin texto');
    score += atk >= 1700 && lvl <= 4 ? 45 : 30;
  } else if (lvl <= 4 && atk >= 1800) {
    reasons.push(`Stats de combate sólidos (${atk} ATK en Nivel ${lvl})`);
    score += 20;
  }

  return { isCandidateForWorkshop: score >= 65, score: Math.min(100, Math.max(0, score)), reasons };
}

/**
 * Genera el diagnóstico tripartito consolidado para la carta activa.
 */
export function diagnoseCardTriage(
  card: UserCard,
  allUserCards: UserCard[],
  decks: Deck[],
  marketPrice?: number
): TriageDiagnosis {
  const cardName = card.card_details?.name || '';
  const isStapleT1 = GLOBAL_STAPLES_TIER1.includes(cardName);
  const isStapleT2 = GLOBAL_STAPLES_TIER2.includes(cardName);
  const isStaple = isStapleT1 || isStapleT2;
  const stapleTier = isStapleT1 ? 'Tier 1' : isStapleT2 ? 'Tier 2' : null;

  const competitiveMatches = getCompetitiveDeckMatches(card.card_id, decks);
  const thematicIncubators = getThematicIncubators(card, allUserCards);
  const workshopHeuristic = evaluateWorkshopSalad(card);

  const totalInCollection = allUserCards
    .filter(c => c.card_id === card.card_id)
    .reduce((sum, c) => sum + (c.quantity || 1), 0);

  const tacticalVerdict = evaluateTacticalVerdict(
    card,
    isStaple,
    competitiveMatches,
    thematicIncubators,
    marketPrice,
    workshopHeuristic.isCandidateForWorkshop
  );

  return {
    cardId: card.card_id,
    userCardId: card.id,
    isStaple,
    stapleTier,
    competitiveMatches,
    thematicIncubators,
    workshopHeuristic,
    playsetCount: totalInCollection,
    isSurplus: totalInCollection > 3,
    suggestedPrimaryAction: tacticalVerdict.action,
    tacticalVerdict,
  };
}

/**
 * Evalúa si una carta está pendiente de clasificar en la mesa de triaje
 * (sin etiqueta temática, sin mazo, sin taller, sin venta y sin marca de triaje).
 */
export function isCardPendingTriage(card: UserCard): boolean {
  if (card.deck_id || card.status_flag === 'in_deck') return false;
  if (card.notes && /\[Tema:\s*[^\]]+\]/i.test(card.notes)) return false;
  if (card.status_flag === 'workshop') return false;
  if (card.status_flag === 'trade_sale') return false;
  if (card.notes && /\[Triaje:\s*[^\]]+\]/i.test(card.notes)) return false;
  if (card.status_flag === 'bulk') return false;
  return true;
}

