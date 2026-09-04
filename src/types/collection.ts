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
  deck_ids?: (string | null)[];
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
export type SleeveCategory = 'fit' | 'regular' | 'over';

export interface UserCard {
  id: string;
  card_id: number;
  storage_location_id: string | null; // null = Unsorted Inbox
  deck_id?: string | null;
  deck_section?: 'main' | 'extra' | 'side' | 'pool' | null;
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
  sleeve_fit_id?: string | null;
  sleeve_regular_id?: string | null;
  sleeve_over_id?: string | null;
  sleeve_inner_brand?: string;
  sleeve_inner_color?: string;
  sleeve_outer_brand?: string;
  sleeve_outer_color?: string;
  sleeve_fit_details?: SleeveInventory;
  sleeve_regular_details?: SleeveInventory;
  sleeve_over_details?: SleeveInventory;
  is_proxy?: boolean;
  is_favorite?: boolean;
  is_grayscale_shared?: boolean;
  shared_notes?: string;
  reorganization_reason?: string;
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
    ban_master_duel?: string;
    ban_tcg?: string;
    ban_duel_links?: string;
  };
  deck_details?: {
    name: string;
  };
}

export interface MovedCardInfo {
  card_id: number;
  name: string;
  image_url?: string;
  rarity: string;
  quantity?: number;
  from_location: string;
  to_location: string;
  binder_page?: number;
  binder_slot?: number;
  compartment_index?: number;
  reason_tag?: string;
  is_mosaic_piece?: boolean;
  target_container_type?: 'binder' | 'box' | 'tin' | 'deckbox';
}

export interface IdealOptimizationConfig {
  preserve_active_decks: boolean;
  create_tech_variants: boolean;
  enable_special_mosaics: boolean;
  stack_copies_in_same_slot: boolean;
  separate_collection_and_staples_binders: boolean;
  min_rarity_for_binder: 'Secret+' | 'Ultra+' | 'Super+' | 'All';
  bulk_grouping_mode: 'archetype' | 'card_type';
}

export interface DeckCardPreviewInfo {
  card_id: number;
  name: string;
  count: number;
  section: string;
  image_url?: string;
}

export interface IdealSyncLog {
  id: string;
  category: 'deck_created' | 'card_promoted' | 'bulk_sorted' | 'staple_organized';
  title: string;
  description: string;
  impact_level: 'high' | 'medium' | 'low';
  source_location_name?: string;
  target_location_name?: string;
  card_count: number;
  deck_id?: string;
  ideal_deck_id?: string;
  is_applied_to_physical?: boolean;
  moved_cards?: MovedCardInfo[];
  deck_cards_preview?: DeckCardPreviewInfo[];
  created_at: string;
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
  /**
   * 'existing' = copy loaded from DB or selected from collection picker (already in yg_user_cards).
   * 'staged'   = placeholder pushed when adding a card from search/import/drag (no user_card_id yet).
   * undefined  = legacy/retrocompatible → treated as 'existing'.
   */
  source_status?: 'existing' | 'staged';
}

export interface DeckCardDetail {
  card_id: number;
  count: number;
  proxy_count?: number;
  section: string;
  card_details?: UserCard['card_details'];
  physical_copies?: DeckCardPhysicalCopy[];
  pending_count?: number;
}

export interface SaveDeckWorkspacePayload {
  id: string;
  name: string;
  description?: string;
  format: string;
  is_active: boolean;
  storage_location_id: string | null;
  compartment_index: number;
  cards: Array<{
    id: number;
    count: number;
    proxy_count?: number;
    section: string;
    name?: string;
    type?: string;
    image_url?: string;
  }>;
  assigned_user_card_ids?: string[];
  unassigned_user_card_ids?: string[];
  deleted_user_card_ids?: string[];
  relocated_user_cards?: Array<{
    id: string;
    storage_location_id: string | null;
    compartment_index?: number | null;
  }>;
  inventory_cards_to_add?: Array<{
    id: number;
    count: number;
    rarity: string;
    condition: string;
    is_proxy: boolean;
    section: string;
    sleeve_id?: string | null;
    sleeve_type?: string;
  }>;
  sleeves?: Array<{
    sleeve_id: string;
    section: string;
  }>;
}

// --- Sleeve Inventory ---

export type SleeveSizeType = 'standard' | 'mini-japanese' | 'european';
export type SleeveInventoryCondition = 'new' | 'good' | 'worn';
export type DeckSleeveSection = 'main_side' | 'extra' | 'pool';

export interface SleeveInventory {
  id: string;
  name: string;
  category: SleeveCategory;
  brand: string;
  color_pattern: string;
  color_hex: string;
  size_type: SleeveSizeType;
  condition: SleeveInventoryCondition;
  quantity_total: number;
  /** Computed: quantity_total minus all yg_deck_sleeves.quantity_used for this sleeve */
  quantity_available?: number;
  /** Computed: sum of quantity_used across decks */
  quantity_used?: number;
  /** List of decks currently using this sleeve model */
  used_in_decks?: { deck_id: string; deck_name: string; quantity_used: number }[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DeckSleeve {
  id: string;
  deck_id: string;
  sleeve_id: string;
  section_type: string;
  quantity_used: number;
  created_at: string;
  sleeve_details?: SleeveInventory;
}

export interface SleeveInventoryFormData {
  name: string;
  category?: SleeveCategory;
  brand: string;
  color_pattern: string;
  color_hex: string;
  size_type: SleeveSizeType;
  condition: SleeveInventoryCondition;
  quantity_total: number;
  notes?: string;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  format?: string;
  storage_location_id?: string | null;
  compartment_index?: number;
  is_active?: boolean;
  created_at: string;
  cards?: DeckCardDetail[];
  sleeves?: ({ sleeve_id: string; section?: string; section_type?: string; sleeve_details?: SleeveInventory } | DeckSleeve)[];
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
