import { UserCard, StorageLocation, Deck } from '@/types/collection';
import { ValuationSummary, CurrencyType } from '@/lib/valuationEngine';

export type ValuationReport = ValuationSummary;
export type CollectionValuation = ValuationSummary;

export type ValuationSubTab =
  | 'overview'
  | 'top_cards'
  | 'sell_opportunities'
  | 'archetypes'
  | 'containers_decks'
  | 'proxies';

export interface ValuationTabProps {
  userCards: UserCard[];
  locations: StorageLocation[];
  decks: Deck[];
  onOpenContainer?: (containerId: string) => void;
  onOpenDeck?: (deck: Deck) => void;
  onUpdateCardStatus?: (cardId: string, status: string) => void;
}
