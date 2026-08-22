/**
 * Motor de Minería de Datos y Matriz de Co-ocurrencia de Torneos (Yu-Gi-Oh!)
 * Implementa algoritmos de reglas de asociación (Support, Confidence, Lift)
 * sobre recetas competitivas reales (MDM, YGO Meta, YGOPRODeck).
 */

export interface CardCooccurrenceEdge {
  cardIdA: number;
  cardNameA: string;
  cardIdB: number;
  cardNameB: string;
  support: number;    // % de decks donde aparecen juntas
  confidence: number; // P(B | A)
  lift: number;       // Medida de atracción (> 1.0 = fuerte sinergia de motor)
  sharedArchetype?: string;
}

export interface DeckDecklistInput {
  archetype?: string;
  cards: { id: number; name: string; count: number }[];
}

/**
 * Calcula la matriz de co-ocurrencia a partir de un conjunto de barajas de torneos.
 */
export function buildCooccurrenceMatrix(
  decks: DeckDecklistInput[],
  minSupport: number = 0.05 // Aparecen juntas en al menos 5% de los decks
): Map<number, CardCooccurrenceEdge[]> {
  const totalDecks = decks.length;
  if (totalDecks === 0) return new Map();

  const singleCardCounts = new Map<number, { count: number; name: string }>();
  const pairCounts = new Map<string, { count: number; idA: number; nameA: string; idB: number; nameB: string }>();

  // 1. Conteo de frecuencias individuales y pares
  decks.forEach((deck) => {
    const uniqueCardsInDeck = new Map<number, string>();
    deck.cards.forEach((c) => {
      uniqueCardsInDeck.set(c.id, c.name);
    });

    const cardArray = Array.from(uniqueCardsInDeck.entries());

    // Conteo individual
    cardArray.forEach(([id, name]) => {
      const existing = singleCardCounts.get(id);
      if (existing) existing.count++;
      else singleCardCounts.set(id, { count: 1, name });
    });

    // Conteo de pares
    for (let i = 0; i < cardArray.length; i++) {
      for (let j = i + 1; j < cardArray.length; j++) {
        const [idA, nameA] = cardArray[i];
        const [idB, nameB] = cardArray[j];
        const key = idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;

        const existingPair = pairCounts.get(key);
        if (existingPair) {
          existingPair.count++;
        } else {
          pairCounts.set(key, {
            count: 1,
            idA: Math.min(idA, idB),
            nameA: idA < idB ? nameA : nameB,
            idB: Math.max(idA, idB),
            nameB: idA < idB ? nameB : nameA,
          });
        }
      }
    }
  });

  // 2. Cálculo de métricas de asociación
  const cooccurrenceGraph = new Map<number, CardCooccurrenceEdge[]>();

  pairCounts.forEach(({ count: pairCount, idA, nameA, idB, nameB }) => {
    const support = pairCount / totalDecks;
    if (support < minSupport) return;

    const countA = singleCardCounts.get(idA)?.count || 1;
    const countB = singleCardCounts.get(idB)?.count || 1;

    const probA = countA / totalDecks;
    const probB = countB / totalDecks;

    const confidenceAtoB = pairCount / countA;
    const confidenceBtoA = pairCount / countB;

    const lift = support / (probA * probB);

    // Guardar para A -> B
    const edgesA = cooccurrenceGraph.get(idA) || [];
    edgesA.push({
      cardIdA: idA,
      cardNameA: nameA,
      cardIdB: idB,
      cardNameB: nameB,
      support: parseFloat(support.toFixed(3)),
      confidence: parseFloat(confidenceAtoB.toFixed(3)),
      lift: parseFloat(lift.toFixed(2)),
    });
    cooccurrenceGraph.set(idA, edgesA);

    // Guardar para B -> A
    const edgesB = cooccurrenceGraph.get(idB) || [];
    edgesB.push({
      cardIdA: idB,
      cardNameA: nameB,
      cardIdB: idA,
      cardNameB: nameA,
      support: parseFloat(support.toFixed(3)),
      confidence: parseFloat(confidenceBtoA.toFixed(3)),
      lift: parseFloat(lift.toFixed(2)),
    });
    cooccurrenceGraph.set(idB, edgesB);
  });

  // Ordenar relaciones por lift (mayor afinidad primero)
  cooccurrenceGraph.forEach((edges) => {
    edges.sort((a, b) => b.lift - a.lift);
  });

  return cooccurrenceGraph;
}

/**
 * Obtiene las cartas con mayor afinidad de co-ocurrencia para un mazo dado.
 */
export function getTopCooccurringCardsForDeck(
  deckCardIds: number[],
  cooccurrenceGraph: Map<number, CardCooccurrenceEdge[]>,
  limit: number = 8
): CardCooccurrenceEdge[] {
  const currentDeckSet = new Set(deckCardIds);
  const scoreMap = new Map<number, { edge: CardCooccurrenceEdge; totalScore: number; sourcesCount: number }>();

  deckCardIds.forEach((cardId) => {
    const edges = cooccurrenceGraph.get(cardId) || [];
    edges.forEach((edge) => {
      if (currentDeckSet.has(edge.cardIdB)) return; // Ya está en el mazo

      const existing = scoreMap.get(edge.cardIdB);
      const score = edge.lift * edge.confidence;

      if (existing) {
        existing.totalScore += score;
        existing.sourcesCount += 1;
      } else {
        scoreMap.set(edge.cardIdB, {
          edge,
          totalScore: score,
          sourcesCount: 1,
        });
      }
    });
  });

  return Array.from(scoreMap.values())
    .sort((a, b) => b.totalScore * b.sourcesCount - a.totalScore * a.sourcesCount)
    .slice(0, limit)
    .map((item) => item.edge);
}
