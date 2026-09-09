import { useState, useEffect, useCallback } from 'react';
import { Card, SearchScope } from '@/components/deckbuilder/types';
import { FilterState } from '@/components/deckbuilder/CardFilters';
import { UserCard } from '@/types/collection';
import { useRecentCardsHistory } from '@/components/deckbuilder/hooks/useRecentCardsHistory';

interface UseContainerSearchProps {
  isOpen: boolean;
  cards: UserCard[];
}

export function useContainerSearch({ isOpen, cards }: UseContainerSearchProps) {
  const [leftTab, setLeftTab] = useState<'search' | 'import'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'All' | 'Monster' | 'Spell' | 'Trap' | 'Extra'>('All');
  const [searchScope, setSearchScope] = useState<SearchScope>('global');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchViewMode, setSearchViewMode] = useState<'grid' | 'list'>('grid');
  const [searchLimit, setSearchLimit] = useState(45);
  const [selectedSearchCard, setSelectedSearchCard] = useState<Card | null>(null);

  const { recentCards, addRecentCard, clearRecentCards } = useRecentCardsHistory();
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    type: '', attribute: '', race: '', level: '', atkMin: '', atkMax: '',
    defMin: '', defMax: '', archetype: '', rarity: '', status: '',
  });

  const executeSearch = useCallback(async (
    query: string, type: string, adv: FilterState, scope: SearchScope, favs: boolean, limitVal: number
  ) => {
    setIsSearching(true);
    try {
      if (scope === 'staged') {
        const rawList = cards.filter(uc => !uc.binder_page || !uc.binder_slot || uc.binder_page <= 0 || uc.binder_slot <= 0);
        let filtered = rawList;
        if (query) {
          const qLower = query.toLowerCase();
          filtered = filtered.filter(uc => uc.card_details?.name.toLowerCase().includes(qLower));
        }

        const groupedStaged = new Map<number, { first: UserCard; items: UserCard[] }>();
        for (const uc of filtered) {
          if (!uc.card_id) continue;
          if (!groupedStaged.has(uc.card_id)) groupedStaged.set(uc.card_id, { first: uc, items: [uc] });
          else groupedStaged.get(uc.card_id)!.items.push(uc);
        }

        const mappedCards: Card[] = [];
        groupedStaged.forEach(({ first, items }, cardId) => {
          mappedCards.push({
            id: cardId,
            name: first.card_details?.name || 'Carta Yu-Gi-Oh!',
            type: first.card_details?.type || 'Monster',
            desc: first.card_details?.desc || '',
            race: first.card_details?.race,
            attribute: first.card_details?.attribute,
            atk: first.card_details?.atk,
            def: first.card_details?.def,
            level: first.card_details?.level,
            image_url: first.card_details?.image_url || '',
            image_url_small: first.card_details?.image_url_small || '',
            archetype: first.card_details?.archetype,
            userCardsGroup: items,
          });
        });
        setSearchResults(mappedCards);
        return;
      }

      if (scope === 'recent') {
        const q = query.trim().toLowerCase();
        let list = recentCards;
        if (q) {
          list = list.filter((c) =>
            c.name.toLowerCase().includes(q) || String(c.id).includes(q) ||
            (c.desc && c.desc.toLowerCase().includes(q)) || (c.archetype && c.archetype.toLowerCase().includes(q))
          );
        }
        const typeToUse = type !== 'All' ? type : adv.type;
        if (typeToUse) list = list.filter((c) => c.type === typeToUse);
        if (adv.attribute) list = list.filter((c) => c.attribute?.toLowerCase() === adv.attribute.toLowerCase());
        if (adv.race) list = list.filter((c) => c.race?.toLowerCase() === adv.race.toLowerCase());
        if (adv.level) list = list.filter((c) => c.level === parseInt(adv.level));
        if (adv.archetype) list = list.filter((c) => c.archetype?.toLowerCase().includes(adv.archetype.toLowerCase()));
        setSearchResults(list);
        return;
      }

      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (type !== 'All') params.append('type', type);
      if (adv.type) params.append('type', adv.type);
      if (adv.attribute) params.append('attribute', adv.attribute);
      if (adv.race) params.append('race', adv.race);
      if (adv.level) params.append('level', adv.level);
      if (adv.atkMin) params.append('atkMin', adv.atkMin);
      if (adv.atkMax) params.append('atkMax', adv.atkMax);
      if (adv.defMin) params.append('defMin', adv.defMin);
      if (adv.defMax) params.append('defMax', adv.defMax);
      if (adv.archetype) params.append('archetype', adv.archetype);
      if (adv.rarity) params.append('rarity', adv.rarity);
      if (favs) params.append('favorites', 'true');
      params.append('limit', String(limitVal));

      const endpoint = scope === 'collection' ? '/api/collection/cards?' : '/api/cards?';
      const res = await fetch(endpoint + params.toString());
      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        if (scope === 'collection') {
          const groupedMap = new Map<number, { first: UserCard; items: UserCard[] }>();
          for (const uc of (data as UserCard[])) {
            if (!uc.card_id) continue;
            if (!groupedMap.has(uc.card_id)) groupedMap.set(uc.card_id, { first: uc, items: [uc] });
            else groupedMap.get(uc.card_id)!.items.push(uc);
          }
          const mapped: Card[] = [];
          groupedMap.forEach(({ first, items }, cardId) => {
            mapped.push({
              id: cardId,
              name: first.card_details?.name || 'Carta',
              type: first.card_details?.type || 'Monster',
              desc: first.card_details?.desc || '',
              race: first.card_details?.race,
              attribute: first.card_details?.attribute,
              atk: first.card_details?.atk,
              def: first.card_details?.def,
              level: first.card_details?.level,
              image_url: first.card_details?.image_url || '',
              image_url_small: first.card_details?.image_url_small || '',
              archetype: first.card_details?.archetype,
              userCardsGroup: items,
            });
          });
          setSearchResults(mapped);
        } else {
          setSearchResults(data);
        }
      }
    } catch (err) {
      console.error('Error al buscar cartas:', err);
    } finally {
      setIsSearching(false);
    }
  }, [cards, recentCards]);

  useEffect(() => {
    if (leftTab === 'search' && isOpen) {
      const timer = setTimeout(() => {
        executeSearch(searchQuery, searchType, advancedFilters, searchScope, onlyFavorites, searchLimit);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [leftTab, searchQuery, searchType, advancedFilters, searchScope, onlyFavorites, searchLimit, executeSearch, isOpen]);

  return {
    leftTab,
    setLeftTab,
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    searchScope,
    setSearchScope,
    onlyFavorites,
    setOnlyFavorites,
    searchResults,
    setSearchResults,
    isSearching,
    searchViewMode,
    setSearchViewMode,
    searchLimit,
    setSearchLimit,
    recentCards,
    addRecentCard,
    clearRecentCards,
    advancedFilters,
    setAdvancedFilters,
    selectedSearchCard,
    setSelectedSearchCard,
    executeSearch,
  };
}
