import { DeckCard } from '@/components/deckbuilder/types';

/**
 * Ponderación canónica del tipo de carta para ordenación.
 */
function getCardTypeSortOrder(typeStr: string): number {
  const t = typeStr.toLowerCase();
  if (t.includes('monster')) return 1;
  if (t.includes('spell')) return 2;
  if (t.includes('trap')) return 3;
  return 4;
}

/**
 * Ordena puramente una lista de cartas de baraja según el criterio seleccionado.
 * Devuelve un nuevo array sin mutar el original.
 */
export function getSortedDeckCards(cards: DeckCard[], sortBy: string): DeckCard[] {
  const sorted = [...cards];

  if (sortBy === 'name') {
    return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (sortBy === 'type') {
    return sorted.sort((a, b) => {
      const orderA = getCardTypeSortOrder(a.type);
      const orderB = getCardTypeSortOrder(b.type);
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  }

  if (sortBy === 'level') {
    return sorted.sort((a, b) => {
      const lvlA = a.level ?? 0;
      const lvlB = b.level ?? 0;
      if (lvlA !== lvlB) return lvlB - lvlA;
      return a.name.localeCompare(b.name);
    });
  }

  if (sortBy === 'atk') {
    return sorted.sort((a, b) => {
      const atkA = a.atk ?? -1;
      const atkB = b.atk ?? -1;
      if (atkA !== atkB) return atkB - atkA;
      return a.name.localeCompare(b.name);
    });
  }

  if (sortBy === 'def') {
    return sorted.sort((a, b) => {
      const defA = a.def ?? -1;
      const defB = b.def ?? -1;
      if (defA !== defB) return defB - defA;
      return a.name.localeCompare(b.name);
    });
  }

  return sorted;
}
