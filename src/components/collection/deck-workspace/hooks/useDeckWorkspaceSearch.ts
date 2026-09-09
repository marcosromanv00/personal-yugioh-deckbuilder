import { useState, useCallback, useEffect } from 'react';
import { Card, SearchScope } from '@/components/deckbuilder/types';
import { FilterState } from '@/components/deckbuilder/CardFilters';
import { UserCard } from '@/types/collection';
import { useRecentCardsHistory } from '@/components/deckbuilder/hooks/useRecentCardsHistory';

interface UseDeckWorkspaceSearchParams {
  isOpen: boolean;
  format: string;
}

export function useDeckWorkspaceSearch({ isOpen, format }: UseDeckWorkspaceSearchParams) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('global');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [searchType, setSearchType] = useState<'All' | 'Monster' | 'Spell' | 'Trap' | 'Extra'>('All');
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchViewMode, setSearchViewMode] = useState<'grid' | 'list'>('grid');
  const [searchLimit, setSearchLimit] = useState(50);
  const [dropCopyPickerState, setDropCopyPickerState] = useState<{
    card: Card;
    targetSection: 'main' | 'extra' | 'side' | 'pool' | 'extras';
    copies: UserCard[];
  } | null>(null);

  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    type: '', attribute: '', race: '', level: '', atkMin: '', atkMax: '',
    defMin: '', defMax: '', archetype: '', rarity: '', status: '',
  });

  const { recentCards, addRecentCard, clearRecentCards } = useRecentCardsHistory();

  const executeSearch = useCallback(async () => {
    if (searchScope === 'recent') {
      setIsSearching(true);
      try {
        const q = searchQuery.trim().toLowerCase();
        let list = recentCards;
        if (q) list = list.filter((c) => c.name.toLowerCase().includes(q) || String(c.id).includes(q) || (c.desc && c.desc.toLowerCase().includes(q)) || (c.archetype && c.archetype.toLowerCase().includes(q)));
        const typeToUse = searchType !== 'All' ? searchType : advancedFilters.type;
        if (typeToUse) list = list.filter((c) => c.type === typeToUse);
        if (advancedFilters.attribute) list = list.filter((c) => c.attribute?.toLowerCase() === advancedFilters.attribute.toLowerCase());
        if (advancedFilters.race) list = list.filter((c) => c.race?.toLowerCase() === advancedFilters.race.toLowerCase());
        if (advancedFilters.level) list = list.filter((c) => c.level === parseInt(advancedFilters.level));
        if (advancedFilters.archetype) list = list.filter((c) => c.archetype?.toLowerCase().includes(advancedFilters.archetype.toLowerCase()));
        setSearchResults(list);
      } finally {
        setIsSearching(false);
      }
      return;
    }

    if (searchScope === 'collection') {
      setIsSearching(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (searchType !== 'All') params.set('type', searchType);
        if (searchLimit) params.set('limit', String(searchLimit));
        if (advancedFilters.attribute) params.set('attribute', advancedFilters.attribute);
        if (advancedFilters.race) params.set('race', advancedFilters.race);
        if (advancedFilters.level) params.set('level', advancedFilters.level);
        if (advancedFilters.archetype) params.set('archetype', advancedFilters.archetype);

        const res = await fetch(`/api/collection/cards?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          const data: UserCard[] = json.data || [];
          const groupedMap = new Map<number, { first: UserCard; items: UserCard[] }>();
          for (const uc of data) {
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
        }
      } catch (err) {
        console.error('Error al buscar cartas en mi colección:', err);
      } finally {
        setIsSearching(false);
      }
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (searchType !== 'All') params.set('type', searchType);
      if (searchLimit) params.set('limit', String(searchLimit));
      if (format) params.set('format', format);
      if (advancedFilters.attribute) params.set('attribute', advancedFilters.attribute);
      if (advancedFilters.race) params.set('race', advancedFilters.race);
      if (advancedFilters.level) params.set('level', advancedFilters.level);
      if (advancedFilters.archetype) params.set('archetype', advancedFilters.archetype);

      const res = await fetch(`/api/cards?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setSearchResults(json.data || []);
      }
    } catch (err) {
      console.error('Error al buscar cartas en panel izquierdo:', err);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchType, searchLimit, format, advancedFilters, searchScope, recentCards]);

  useEffect(() => {
    if (!isOpen) return;
    const timeout = setTimeout(() => { executeSearch(); }, 300);
    return () => clearTimeout(timeout);
  }, [isOpen, executeSearch]);

  return {
    searchQuery, setSearchQuery,
    searchScope, setSearchScope,
    onlyFavorites, setOnlyFavorites,
    searchType, setSearchType,
    advancedFilters, setAdvancedFilters,
    searchResults, isSearching,
    searchViewMode, setSearchViewMode,
    searchLimit, setSearchLimit,
    dropCopyPickerState, setDropCopyPickerState,
    recentCards, addRecentCard, clearRecentCards,
    executeSearch,
  };
}
