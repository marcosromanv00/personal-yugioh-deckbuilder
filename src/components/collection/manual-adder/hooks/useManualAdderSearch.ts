import { useState, useEffect, useCallback } from 'react';
import { YgoCardResult } from '../manualAdder.types';
import { searchCardsApi } from '../services/manualAdder.api';

interface UseManualAdderSearchParams {
  isOpen: boolean;
  activeLeftTab: 'search' | 'bulk';
  onError: (msg: string) => void;
}

export function useManualAdderSearch({
  isOpen,
  activeLeftTab,
  onError,
}: UseManualAdderSearchParams) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Monster' | 'Spell' | 'Trap' | 'Extra'>('All');
  const [searchResults, setSearchResults] = useState<YgoCardResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(
    async (queryText: string, typeVal: string) => {
      if (!queryText.trim()) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      onError('');
      try {
        const results = await searchCardsApi(queryText, typeVal);
        setSearchResults(results);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al buscar cartas.';
        onError(message);
      } finally {
        setSearching(false);
      }
    },
    [onError]
  );

  useEffect(() => {
    if (!isOpen || activeLeftTab !== 'search') return;
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch(searchQuery, typeFilter);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, typeFilter, isOpen, activeLeftTab, handleSearch]);

  const resetSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    searchResults,
    searching,
    handleSearch,
    resetSearch,
  };
}
