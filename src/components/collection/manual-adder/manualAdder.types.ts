import { StorageLocation, CardCondition, CardStatusFlag, SleeveType } from '@/types/collection';

export interface ManualCardAdderModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: StorageLocation[];
  onSuccess: () => void;
}

export interface YgoCardResult {
  id: number;
  name: string;
  type: string;
  desc?: string;
  image_url: string;
  image_url_small: string;
  archetype?: string;
  atk?: number | null;
  def?: number | null;
  level?: number | null;
  attribute?: string | null;
  race?: string | null;
}

export interface QueuedCardItem {
  id: string; // unique ID in queue
  card_id: number;
  name: string;
  type: string;
  desc?: string;
  image_url: string;
  image_url_small?: string;
  archetype?: string;
  atk?: number | null;
  def?: number | null;
  level?: number | null;
  attribute?: string | null;
  race?: string | null;
  // Physical attributes
  quantity: number;
  storage_location_id: string; // 'inbox' or location id
  rarity: string;
  condition: CardCondition;
  language: 'en' | 'es' | 'jp';
  status_flag: CardStatusFlag;
  sleeve_type: SleeveType;
  is_proxy: boolean;
  notes: string;
}

export const RARITIES = [
  'Common',
  'Rare',
  'Super Rare',
  'Ultra Rare',
  'Secret Rare',
  'Prismatic Secret Rare',
  'Prismatic Ultimate Rare',
  'Prismatic Platinum Rare',
  'Gold Rare',
  'Duel Terminal',
  'Starlight Rare',
  'Collector\'s Rare',
  'Ultimate Rare',
  'Ghost Rare',
  'Quarter Century Secret Rare',
  'Proxy',
];

export const CONDITIONS: CardCondition[] = [
  'Near Mint',
  'Lightly Played',
  'Moderately Played',
  'Heavily Played',
  'Damaged',
];

export const STATUS_FLAGS: { value: CardStatusFlag; label: string }[] = [
  { value: 'collection', label: 'Colección Personal' },
  { value: 'trade_sale', label: 'Trade / En Venta' },
  { value: 'bulk', label: 'Bulk / Sobrantes' },
  { value: 'workshop', label: 'Taller / En Construcción' },
];
