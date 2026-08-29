import { StorageLocation, UserCard, SleeveInventory, Deck, CompartmentsConfig } from '@/types/collection';
import { Card, HoverCardBase } from '@/components/deckbuilder/types';
import { LaneCluster, BestRecommendation } from '@/lib/cardClassificationEngine';

export interface UniversalContainerWorkspaceModalProps {
  isOpen: boolean;
  onClose: (hasMutated?: boolean) => void;
  location: StorageLocation | null;
  locations?: StorageLocation[];
  onSelectLocation?: (location: StorageLocation) => void;
  sleeves?: SleeveInventory[];
  decks?: Deck[];
  allCollectionCards?: UserCard[];
  onDeckClick?: (deck: Deck) => void;
  onMutate?: () => void;
}

export interface GridCardGroup {
  card_id: number;
  compartment_index: number;
  card_details?: UserCard['card_details'];
  totalQuantity: number;
  representativeUserCard: UserCard;
  allVariants: UserCard[];
}

export interface DeckInContainer {
  id: string;
  name: string;
  format?: string;
  totalCards: number;
  countInContainer: number;
  compartments: Set<number>;
}

export type RightPanelMode = 'details' | 'analysis';
export type AISubView = 'lane' | 'card' | 'collection';
export type DetailsCopiesMode = 'grouped' | 'breakdown';
export type MobileTab = 'left' | 'center' | 'right';

export type ContainerHistoryAction =
  | {
      type: 'add_cards';
      description: string;
      cards: UserCard[];
    }
  | {
      type: 'delete_cards';
      description: string;
      cards: UserCard[];
    }
  | {
      type: 'update_cards';
      description: string;
      prevCards: UserCard[];
      newCards: UserCard[];
    }
  | {
      type: 'move_cards';
      description: string;
      items: {
        id: string;
        prevLocationId: string | null;
        newLocationId: string | null;
        prevCompartment?: number;
        newCompartment?: number;
        prevPage?: number | null;
        newPage?: number | null;
        prevSlot?: number | null;
        newSlot?: number | null;
        prevCard: UserCard;
        newCard: UserCard;
      }[];
    };
