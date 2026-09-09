export interface YgoApiCardDetails {
  id: number;
  name: string;
  type: string;
  card_images: Array<{ image_url: string; image_url_small?: string }>;
  atk?: number;
  def?: number;
  level?: number;
  race?: string;
  attribute?: string;
  archetype?: string;
}

export const RARITY_WEIGHTS: Record<string, number> = {
  'Starlight Rare': 100,
  'Quarter Century Secret Rare': 95,
  'Ghost Rare': 90,
  "Collector's Rare": 85,
  'Ultimate Rare': 80,
  'Prismatic Secret Rare': 75,
  'Secret Rare': 70,
  'Ultra Rare': 60,
  'Super Rare': 50,
  'Rare': 40,
  'Common': 30,
  'Short Print': 20,
};

export const getRarityWeight = (rarity?: string): number => {
  if (!rarity) return 0;
  return RARITY_WEIGHTS[rarity] || 35;
};

export interface ExtractionCardItem {
  cardId: number;
  name: string;
  rarity: string;
  count: number;
  image_url: string;
  locationDetail?: string;
  userCardId?: string;
  isInActiveDeck?: boolean;
  activeDeckId?: string;
  activeDeckName?: string;
}

export interface ExtractionGroup {
  id: string;
  name: string;
  type: 'binder' | 'box' | 'tin' | 'deckbox' | 'drawer' | 'inbox' | 'conflict_deck' | 'global_proxy';
  colorCode?: string;
  cards: ExtractionCardItem[];
}
