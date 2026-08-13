export type StorageType = 'binder' | 'box' | 'tin' | 'deckbox' | 'drawer';

export type StorageSubType = 
  | 'standard' 
  | 'binder_2x2' 
  | 'binder_3x3' 
  | 'binder_3x4' 
  | 'deckbox_single' 
  | 'deckbox_double' 
  | 'deckbox_triple' 
  | 'box_multi_row';

export interface StorageDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface GridLayout {
  rows: number;
  cols: number;
  pockets_per_page: number;
  total_pages: number;
}

export interface CompartmentsConfig {
  count: number;
  names: string[];
}

export interface StorageLocation {
  id: string;
  name: string;
  type: StorageType;
  sub_type: StorageSubType;
  color_code: string;
  dimensions: StorageDimensions;
  capacity: number;
  grid_layout: GridLayout;
  compartments: CompartmentsConfig;
  render_style: string;
  description?: string;
  created_at: string;
  // Computed fields
  occupied_cards?: number;
}

export type CardCondition = 'Near Mint' | 'Lightly Played' | 'Moderately Played' | 'Heavily Played' | 'Damaged';
export type CardStatusFlag = 'collection' | 'trade_sale' | 'bulk' | 'workshop' | 'in_deck' | 'memory_deck';
export type SleeveType = 'none' | 'single' | 'double' | 'triple';
export type SleeveCondition = 'new' | 'good' | 'worn' | 'damaged';

export interface UserCard {
  id: string;
  card_id: number;
  storage_location_id: string | null; // null = Unsorted Inbox
  deck_id?: string | null;
  deck_section?: 'main' | 'extra' | 'side' | null;
  compartment_index: number;
  binder_page?: number;
  binder_slot?: number;
  rarity: string;
  condition: CardCondition;
  language: string;
  quantity: number;
  status_flag: CardStatusFlag;
  sleeve_type: SleeveType;
  sleeve_brand?: string;
  sleeve_color?: string;
  sleeve_condition?: SleeveCondition;
  is_proxy?: boolean;
  sale_price?: number;
  notes?: string;
  created_at: string;
  // Joined card details from yg_cards
  card_details?: {
    name: string;
    type: string;
    desc?: string;
    atk?: number;
    def?: number;
    level?: number;
    race?: string;
    attribute?: string;
    archetype?: string;
    image_url?: string;
    image_url_small?: string;
  };
  deck_details?: {
    name: string;
  };
}

export type StorageRuleType = 'rarity' | 'status_flag' | 'archetype' | 'is_staple' | 'deck_completion';

export interface StorageRule {
  id: string;
  storage_location_id: string;
  rule_type: StorageRuleType;
  target_value: string;
  priority: number;
  created_at: string;
}

export interface DeckSleeveConfig {
  id: string;
  deck_id: string;
  main_deck_sleeve_color: string;
  main_deck_sleeve_brand: string;
  main_deck_double_sleeved: boolean;
  extra_deck_sleeve_color: string;
  extra_deck_sleeve_brand: string;
  extra_deck_double_sleeved: boolean;
  notes?: string;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  card_id: number;
  target_quantity: number;
  priority: 'high' | 'medium' | 'low';
  max_price?: number;
  deck_id?: string;
  created_at: string;
  card_details?: UserCard['card_details'];
}

export interface DeckCardDetail {
  card_id: number;
  count: number;
  section: string;
  card_details?: UserCard['card_details'];
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  format?: string;
  storage_location_id?: string | null;
  is_active?: boolean;
  created_at: string;
  cards?: DeckCardDetail[];
}
export interface YdkParseResult {
  mainDeckCardIds: number[];
  extraDeckCardIds: number[];
  sideDeckCardIds: number[];
  unknownPasscodes: string[];
  totalCardsCount: number;
}

export interface StorageLocationFormData {
  name: string;
  type: StorageType;
  sub_type: StorageSubType;
  color_code: string;
  dimensions: StorageDimensions;
  capacity: number;
  grid_layout: GridLayout;
  compartments: CompartmentsConfig;
  render_style: string;
  description?: string;
}
