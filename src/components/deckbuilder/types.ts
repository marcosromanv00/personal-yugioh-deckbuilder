export interface ArchetypeItem {
  name: string;
  cardCount: number;
  tier: string;
  description: string;
  playstyle: string;
  popularityScore: number;
}

export interface BreakdownCardItem {
  id: number;
  name: string;
  type: string;
  average_copies: number;
  image_url?: string;
  image_url_small?: string;
  is_main_deck: boolean;
  usage_percent: number;
}

export interface Card {
  id: number;
  name: string;
  type: string;
  desc?: string;
  image_url: string;
  image_url_small?: string;
  archetype?: string;
  ban_master_duel?: string;
  ban_tcg?: string;
  ban_duel_links?: string;
  atk?: number | null;
  def?: number | null;
  level?: number | null;
  race?: string | null;
  attribute?: string | null;
}

export interface DeckCard {
  id: number;
  name: string;
  count: number;
  proxy_count?: number;
  section: 'main' | 'extra' | 'side' | 'extras';
  type: string;
  image_url: string;
  archetype?: string;
  ban_master_duel?: string;
  ban_tcg?: string;
  ban_duel_links?: string;
}

export interface BanlistAlert {
  cardId: number;
  cardName: string;
  status: 'Forbidden' | 'Limited' | 'Semi-Limited';
  message: string;
}

export interface Replacement {
  id: number;
  name: string;
  type: string;
  image_url: string;
  similarityScore: number;
  reason: string;
}

export interface HistoryItem {
  id: number;
  name: string;
  type: string;
  image_url: string;
  archetype?: string;
  action: 'added' | 'removed';
  timestamp: number;
}

export interface HoverCardBase {
  id: number;
  name: string;
  type?: string;
  image_url?: string;
  image_url_small?: string;
  archetype?: string;
  action?: 'added' | 'removed';
  average_copies?: number;
  usage_percent?: number;
}
