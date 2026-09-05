import { DeckCard } from '@/components/deckbuilder/types';

export type ReorderPosition = 'before' | 'after';

/**
 * Reordena de forma inmutable una carta en una sección del mazo (o entre secciones),
 * respetando el orden del resto del mazo y preservando copias físicas y metadatos.
 */
export function reorderDeckCardsList(
  deckCards: DeckCard[],
  sourceCardId: number,
  sourceSection: 'main' | 'extra' | 'side' | 'extras',
  targetCardId: number,
  targetSection: 'main' | 'extra' | 'side' | 'extras',
  position: ReorderPosition = 'before'
): DeckCard[] {
  const sourceIndexInAll = deckCards.findIndex(
    (c) => c.id === sourceCardId && c.section === sourceSection
  );
  if (sourceIndexInAll === -1) return deckCards;

  const sourceCard = deckCards[sourceIndexInAll];

  // Caso 1: Reordenación dentro de la MISMA sección
  if (sourceSection === targetSection) {
    if (sourceCardId === targetCardId) return deckCards;

    const sectionCards = deckCards.filter((c) => c.section === sourceSection);
    const sourceIdx = sectionCards.findIndex((c) => c.id === sourceCardId);
    if (sourceIdx === -1) return deckCards;

    const newSectionList = [...sectionCards];
    const [movedItem] = newSectionList.splice(sourceIdx, 1);

    const targetIdx = newSectionList.findIndex((c) => c.id === targetCardId);
    if (targetIdx === -1) return deckCards;

    const insertionIndex = position === 'after' ? targetIdx + 1 : targetIdx;
    newSectionList.splice(insertionIndex, 0, movedItem);

    // Reconstruir deckCards reemplazando secuencialmente las cartas de esta sección
    let sectionCursor = 0;
    return deckCards.map((c) => {
      if (c.section === sourceSection) {
        return newSectionList[sectionCursor++];
      }
      return c;
    });
  }

  // Caso 2: Movimiento entre DIFERENTES secciones (ej: Main -> Side o Side -> Main)
  const remainingCards = deckCards.filter(
    (c) => !(c.id === sourceCardId && c.section === sourceSection)
  );

  const targetSectionCards = remainingCards.filter((c) => c.section === targetSection);
  const targetIdx = targetSectionCards.findIndex((c) => c.id === targetCardId);

  const updatedSourceCard: DeckCard = {
    ...sourceCard,
    section: targetSection,
  };

  const newTargetSectionList = [...targetSectionCards];
  if (targetIdx === -1) {
    newTargetSectionList.push(updatedSourceCard);
  } else {
    const insertionIndex = position === 'after' ? targetIdx + 1 : targetIdx;
    newTargetSectionList.splice(insertionIndex, 0, updatedSourceCard);
  }

  // Buscar dónde aparecía targetSection originalmente en el arreglo
  const firstTargetIndex = remainingCards.findIndex((c) => c.section === targetSection);

  if (firstTargetIndex === -1) {
    return [...remainingCards, updatedSourceCard];
  }

  // Reensamblar preservando el bloque de targetSection
  const result: DeckCard[] = [];
  let placedTarget = false;

  for (let i = 0; i < remainingCards.length; i++) {
    const current = remainingCards[i];
    if (current.section === targetSection) {
      if (!placedTarget) {
        result.push(...newTargetSectionList);
        placedTarget = true;
      }
    } else {
      result.push(current);
    }
  }

  if (!placedTarget) {
    result.push(...newTargetSectionList);
  }

  return result;
}
