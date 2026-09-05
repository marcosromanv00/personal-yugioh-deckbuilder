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
  userCardsGroup?: import('@/types/collection').UserCard[];
  is_grayscale_shared?: boolean;
  fromScope?: SearchScope;
  fromSection?: 'main' | 'extra' | 'side' | 'extras' | 'pool';
}

export interface DeckCardPhysicalCopy {
  user_card_id?: string;
  storage_location_id?: string | null;
  location_name?: string;
  rarity?: string;
  condition?: string;
  is_proxy?: boolean;
  is_in_active_deck?: boolean;
  active_deck_id?: string;
  active_deck_name?: string;
  binder_page?: number;
  binder_slot?: number;
  compartment_index?: number;
  source_status?: 'existing' | 'staged';
}

export interface DeckCard {
  id: number;
  name: string;
  count: number;
  proxy_count?: number;
  section: 'main' | 'extra' | 'side' | 'extras';
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
  rarity?: string;
  condition?: string;
  is_grayscale_shared?: boolean;

  notes?: string;
  sleeve_id?: string;
  sleeve_color_hex?: string;

  physical_copies?: DeckCardPhysicalCopy[];
  is_virtual_proxy?: boolean;
  selected_copy_index?: number;
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

export type SearchScope = 'global' | 'collection' | 'staged' | 'recent' | 'meta' | 'suggested';
