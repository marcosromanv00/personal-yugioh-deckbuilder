import { useEffect } from 'react';
import { useDeckBuilderState } from './useDeckBuilderState';

export function useDeckBuilderSearchSync(state: ReturnType<typeof useDeckBuilderState>) {
  const {
    searchQuery, searchType, advancedFilters, searchScope, onlyFavorites,
    searchLimit, setSearchLimit, executeSearch, deckCards, format,
    analyzeDeck, activeArchetypeTab, inferredArchetype, syncedArchetypes,
    setSyncedArchetypes, fetchSidebarBreakdown, triggerSync,
  } = state;

  // Resetear límite cuando cambian los parámetros de búsqueda
  useEffect(() => {
    setSearchLimit(45);
  }, [searchQuery, searchType, advancedFilters, searchScope, onlyFavorites, setSearchLimit]);

  // Búsqueda con debounce para evitar llamadas excesivas
  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(searchQuery, searchType, advancedFilters, searchScope, onlyFavorites, searchLimit);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, searchType, advancedFilters, searchScope, onlyFavorites, searchLimit, executeSearch]);

  // Análisis de métricas en tiempo real con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      analyzeDeck(deckCards, format);
    }, 300);
    return () => clearTimeout(timer);
  }, [deckCards, format, analyzeDeck]);

  // Sincronización del breakdown lateral con el arquetipo activo
  useEffect(() => {
    const handleArchetypeChange = async () => {
      const archToUse = activeArchetypeTab || inferredArchetype;
      if (!archToUse || archToUse === 'Híbrido / Staples') {
        void fetchSidebarBreakdown('');
        return;
      }

      if (!syncedArchetypes.includes(archToUse)) {
        setSyncedArchetypes((prev) => [...prev, archToUse]);
        await triggerSync(true);
      } else {
        void fetchSidebarBreakdown(archToUse);
      }
    };
    void handleArchetypeChange();
  }, [activeArchetypeTab, inferredArchetype, format, syncedArchetypes, fetchSidebarBreakdown, triggerSync, setSyncedArchetypes]);
}
