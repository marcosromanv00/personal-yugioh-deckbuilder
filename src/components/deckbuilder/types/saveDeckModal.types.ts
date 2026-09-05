import { StorageLocation, SleeveInventory } from '@/types/collection';
import { DeckCard } from '../types';

export interface PickListCardItem {
  cardId: number;
  name: string;
  rarity: string;
  count: number;
  image_url: string;
  locationDetail?: string;
}

export interface ExtractionPickListGroup {
  id: string;
  name: string;
  type: string;
  colorCode?: string;
  cards: PickListCardItem[];
}

export interface SaveDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckName: string;
  setDeckName: (name: string) => void;
  deckDescription: string;
  setDeckDescription: (desc: string) => void;
  saveFormat: 'Master Duel' | 'TCG' | 'Duel Links';
  setSaveFormat: (format: 'Master Duel' | 'TCG' | 'Duel Links') => void;
  saveIsActive: boolean;
  setSaveIsActive: (active: boolean) => void;
  deckCards: DeckCard[];
  loadingDecks: boolean;
  locations: StorageLocation[];
  userInventoryCounts: Record<number, number>;
  registerToInventory: boolean;
  setRegisterToInventory: (reg: boolean) => void;
  targetLocationId: string;
  setTargetLocationId: (id: string) => void;
  selectedLaneIndex?: number;
  setSelectedLaneIndex?: (index: number) => void;
  cardsToRegister: Record<number, boolean>;
  setCardsToRegister: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  availableSleeves: SleeveInventory[];
  selectedMainSleeveId: string;
  setSelectedMainSleeveId: (id: string) => void;
  mainSleeveMode?: 'take' | 'add';
  setMainSleeveMode?: (m: 'take' | 'add') => void;
  mainSleeveAddedQty?: number;
  setMainSleeveAddedQty?: (q: number) => void;
  selectedExtraSleeveId: string;
  setSelectedExtraSleeveId: (id: string) => void;
  extraSleeveMode?: 'take' | 'add';
  setExtraSleeveMode?: (m: 'take' | 'add') => void;
  extraSleeveAddedQty?: number;
  setExtraSleeveAddedQty?: (q: number) => void;
  handleSaveDeck: () => Promise<void>;
  handleExcludeExisting?: () => void;
  extractionPickList?: ExtractionPickListGroup[];
}
