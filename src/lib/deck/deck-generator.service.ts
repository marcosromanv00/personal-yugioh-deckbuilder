import { DeckCard } from '@/components/deckbuilder/types';

export interface GeneratedDeckInputCard {
  name: string;
  count: number;
  section: 'main' | 'extra';
}

/**
 * Consulta la API de YGOPRODeck para obtener los detalles completos de las cartas generadas por IA.
 */
export async function fetchGeneratedDeckCards(
  cards: GeneratedDeckInputCard[]
): Promise<DeckCard[]> {
  const newDeckCards: DeckCard[] = [];

  for (const item of cards) {
    try {
      const res = await fetch(
        `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(item.name)}`
      );
      const data = await res.json();
      if (data.data && data.data[0]) {
        const cardInfo = data.data[0];
        newDeckCards.push({
          id: cardInfo.id,
          name: cardInfo.name,
          count: item.count,
          section: item.section,
          type: cardInfo.type,
          image_url: cardInfo.card_images[0]?.image_url || '',
          archetype: cardInfo.archetype,
          ban_tcg: cardInfo.banlist_info?.ban_tcg,
          ban_master_duel: cardInfo.banlist_info?.ban_master_duel,
          atk: cardInfo.atk,
          def: cardInfo.def,
          level: cardInfo.level,
          race: cardInfo.race,
          attribute: cardInfo.attribute,
        });
      }
    } catch (err) {
      console.warn(`No se pudo cargar detalles de ${item.name}:`, err);
    }
  }

  return newDeckCards;
}
