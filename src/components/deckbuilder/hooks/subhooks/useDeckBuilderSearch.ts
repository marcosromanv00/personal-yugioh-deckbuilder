import { useState, useCallback, useRef } from 'react';
import { Card, DeckCard, SearchScope, BreakdownCardItem } from '../../types';
import { FilterState } from '../../CardFilters';
import { UserCard } from '@/types/collection';
import { useRecentCardsHistory } from '../useRecentCardsHistory';
import { filterRecentCards, mapMetaCards, buildSearchCardsUrl, mapCollectionUserCards } from '../../deckBuilderSearch.utils';

interface UseDeckBuilderSearchParams {
  allUserCards: UserCard[];
  inferredArchetype: string;
  deckCards: DeckCard[];
  sidebarBreakdownCards: BreakdownCardItem[];
}

export function useDeckBuilderSearch({
  allUserCards,
  inferredArchetype,
  deckCards,
  sidebarBreakdownCards,
}: UseDeckBuilderSearchParams) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'All' | 'Monster' | 'Spell' | 'Trap' | 'Extra'>('All');
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchViewMode, setSearchViewMode] = useState<'grid' | 'list'>('grid');
  const [searchLimit, setSearchLimit] = useState(45);
  const [searchScope, setSearchScope] = useState<SearchScope>('global');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    type: '', attribute: '', race: '', level: '', atkMin: '', atkMax: '', defMin: '', defMax: '', archetype: '',
  });

  const [favoriteCardIds, setFavoriteCardIds] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('yg_favorite_cards');
      if (stored) {
        try { return JSON.parse(stored); } catch (e) { console.error('Error parsing favorite cards:', e); }
      }
    }
    return [];
  });

  const { recentCards, addRecentCard, clearRecentCards } = useRecentCardsHistory();
  const searchAbortControllerRef = useRef<AbortController | null>(null);

  const handleToggleFavorite = (cardId: number) => {
    setFavoriteCardIds((prev) => {
      const updated = prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId];
      if (typeof window !== 'undefined') localStorage.setItem('yg_favorite_cards', JSON.stringify(updated));
      return updated;
    });
  };

  const executeSearch = useCallback(
    async (query: string, type: string, adv: FilterState, scope: SearchScope, favs: boolean, limitVal: number) => {
      if (searchAbortControllerRef.current) searchAbortControllerRef.current.abort();
      const controller = new AbortController();
      searchAbortControllerRef.current = controller;
      setIsSearching(true);

      try {
        if (scope === 'recent') {
          setSearchResults(filterRecentCards(recentCards, query, type, adv));
          return;
        }

        if (scope === 'meta' && sidebarBreakdownCards.length > 0) {
          setSearchResults(mapMetaCards(sidebarBreakdownCards, query, type, adv));
          return;
        }

        if (scope === 'suggested') {
          const arch = inferredArchetype || (deckCards[0]?.archetype ?? '');
          if (arch && arch !== 'Híbrido / Staples') {
            const url = buildSearchCardsUrl(query, type, adv, limitVal, '/api/cards') + `&archetype=${encodeURIComponent(arch)}`;
            const res = await fetch(url, { signal: controller.signal });
            if (res.ok) {
              const json = await res.json();
              setSearchResults(json.data || []);
              return;
            }
          }
        }

        if (scope === 'collection') {
          const url = buildSearchCardsUrl(query, type, adv, limitVal, '/api/collection/cards') + (favs ? '&favorites=true' : '');
          const res = await fetch(url, { signal: controller.signal });
          if (res.ok) {
            const json = await res.json();
            setSearchResults(mapCollectionUserCards(json.data || []));
          }
          return;
        }

        const url = buildSearchCardsUrl(query, type, adv, limitVal, '/api/cards');
        const res = await fetch(url, { signal: controller.signal });
        if (res.ok) {
          const json = await res.json();
          let cards: Card[] = json.data || [];
          if (favs) cards = cards.filter((c) => favoriteCardIds.includes(c.id));
          cards = cards.map((c) => ({ ...c, userCardsGroup: allUserCards.filter((uc) => uc.card_id === c.id) }));
          setSearchResults(cards);
        }
      } catch (e: unknown) {
        if ((e as Error)?.name === 'AbortError') return;
        console.error('Error buscando cartas:', e);
      } finally {
        if (searchAbortControllerRef.current === controller) setIsSearching(false);
      }
    },
    [allUserCards, recentCards, sidebarBreakdownCards, inferredArchetype, deckCards, favoriteCardIds]
  );

  return {
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    searchResults,
    setSearchResults,
    isSearching,
    searchViewMode,
    setSearchViewMode,
    searchLimit,
    setSearchLimit,
    advancedFilters,
    setAdvancedFilters,
    searchScope,
    setSearchScope,
    onlyFavorites,
    setOnlyFavorites,
    favoriteCardIds,
    handleToggleFavorite,
    recentCards,
    addRecentCard,
    clearRecentCards,
    executeSearch,
  };
}
