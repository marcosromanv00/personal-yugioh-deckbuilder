import { Card, HoverCardBase, SearchScope } from '../../types';
import { FilterState } from '../../CardFilters';
import { StorageLocation, UserCard } from '@/types/collection';

export interface ParsedBulkItem {
  id: string;
  card_id: number;
  name: string;
  type: string;
  image_url: string;
  image_url_small?: string;
  quantity: number;
  selected: boolean;
  section: 'main' | 'extra' | 'side' | 'extras';
  linkWithCollection?: boolean;
}

export interface SearchPanelProps {
  leftPanelOpen: boolean;
  setLeftPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  leftPanelWidth: number;
  isMobile?: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchScope: SearchScope;
  setSearchScope: (scope: SearchScope) => void;
  recentCardsCount?: number;
  onClearRecentCards?: () => void;
  showStagedTab?: boolean;
  stagedCardsCount?: number;
  onlyFavorites: boolean;
  onlyFavoritesSetOnlyFavorites?: React.Dispatch<React.SetStateAction<boolean>>;
  setOnlyFavorites: React.Dispatch<React.SetStateAction<boolean>>;
  searchType: 'All' | 'Monster' | 'Spell' | 'Trap' | 'Extra';
  setSearchType: (type: 'All' | 'Monster' | 'Spell' | 'Trap' | 'Extra') => void;
  advancedFilters: FilterState;
  setAdvancedFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  searchResults: Card[];
  isSearching: boolean;
  searchViewMode: 'grid' | 'list';
  setSearchViewMode: (mode: 'grid' | 'list') => void;
  searchLimit: number;
  setSearchLimit: React.Dispatch<React.SetStateAction<number>>;
  format?: 'Master Duel' | 'TCG' | 'Duel Links';
  userInventoryCounts?: Record<number, number>;
  onSelectAllStaged?: () => void;
  allUserCards?: UserCard[];
  locations?: StorageLocation[];
  assignedDraftUserCardIds?: Set<string>;
  activeContextName?: string;
  addCardToDeck: (card: Card, section?: 'main' | 'extra' | 'side' | 'extras', selectedCopy?: UserCard) => void;
  onDropRemoveCard?: (cardId: number, fromSection: 'main' | 'extra' | 'side' | 'extras', copyIndex?: number) => void;
  openPreviewForCard?: (card: HoverCardBase) => void;
  handleDragCardStart: (e: React.DragEvent, cardData: Card) => void;
  handleCardMouseEnter: (card: HoverCardBase) => void;
  handleCardMouseLeave: () => void;
}
