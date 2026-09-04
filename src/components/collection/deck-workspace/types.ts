import { StorageLocation, UserCard, SleeveInventory, Deck } from '@/types/collection';

export interface UniversalDeckWorkspaceModalProps {
  isOpen: boolean;
  onClose: (hasMutated?: boolean) => void;
  deck: Deck | null;
  decks?: Deck[];
  onSelectDeck?: (deck: Deck) => void;
  locations?: StorageLocation[];
  sleeves?: SleeveInventory[];
  allUserCards?: UserCard[];
  onSuccess?: () => void;
  handleDeleteDeck?: (id: string) => Promise<boolean | void>;
}

export type DeckSectionFilter = 'all' | 'main' | 'extra' | 'side' | 'pool';
export type RightDeckMode = 'details' | 'card' | 'analysis' | 'collection';
export type MobileDeckTab = 'left' | 'center' | 'right';

