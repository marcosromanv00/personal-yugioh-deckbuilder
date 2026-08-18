import { StorageLocation, UserCard, SleeveInventory, Deck, DeckCardDetail } from '@/types/collection';

export interface UniversalDeckWorkspaceModalProps {
  isOpen: boolean;
  onClose: (hasMutated?: boolean) => void;
  deck: Deck | null;
  decks?: Deck[];
  onSelectDeck?: (deck: Deck) => void;
  locations?: StorageLocation[];
  sleeves?: SleeveInventory[];
  onSuccess?: () => void;
}

export type DeckSectionFilter = 'all' | 'main' | 'extra' | 'side' | 'pool';
export type RightDeckMode = 'details' | 'card';
export type MobileDeckTab = 'left' | 'center' | 'right';
