import { useState, useCallback } from 'react';
import { ArchetypeItem, BreakdownCardItem, DeckCard } from '../../types';
import { isExtraDeckCard } from '../../deckBuilder.utils';
import { fetchArchetypesApi, fetchBreakdownApi } from '../../services/deckBuilder.api';

interface UseDeckBuilderArchetypesParams {
  format: 'Master Duel' | 'TCG' | 'Duel Links';
  deckCards: DeckCard[];
  setDeckCards: React.Dispatch<React.SetStateAction<DeckCard[]>>;
  setDeckName: (name: string) => void;
  setDeckId: (id: string | null) => void;
}

export function useDeckBuilderArchetypes({
  format,
  deckCards,
  setDeckCards,
  setDeckName,
  setDeckId,
}: UseDeckBuilderArchetypesParams) {
  const [activeView, setActiveView] = useState<'builder' | 'breakdowns' | 'exordio'>('builder');
  const [archetypesList, setArchetypesList] = useState<ArchetypeItem[]>([]);
  const [isFetchingArchetypes, setIsFetchingArchetypes] = useState(false);
  const [archetypeSearchQuery, setArchetypeSearchQuery] = useState('');
  const [sidebarBreakdownCards, setSidebarBreakdownCards] = useState<BreakdownCardItem[]>([]);
  const [isFetchingSidebarBreakdown, setIsFetchingSidebarBreakdown] = useState(false);
  const [syncedArchetypes, setSyncedArchetypes] = useState<string[]>([]);
  const [activeArchetypeBreakdown, setActiveArchetypeBreakdown] = useState<string | null>(null);
  const [breakdownCards, setBreakdownCards] = useState<BreakdownCardItem[]>([]);
  const [isFetchingBreakdown, setIsFetchingBreakdown] = useState(false);

  const fetchSidebarBreakdown = useCallback(async (archetype: string) => {
    if (!archetype || archetype === 'Híbrido / Staples') {
      setSidebarBreakdownCards([]);
      return;
    }
    setIsFetchingSidebarBreakdown(true);
    try {
      const items = await fetchBreakdownApi(archetype, format);
      setSidebarBreakdownCards(items);
    } catch (e) {
      console.error('Error al cargar desglose de arquetipo para barra lateral:', e);
    } finally {
      setIsFetchingSidebarBreakdown(false);
    }
  }, [format]);

  const openArchetypeBreakdown = useCallback(async (archetype: string) => {
    setActiveArchetypeBreakdown(archetype);
    setIsFetchingBreakdown(true);
    try {
      const items = await fetchBreakdownApi(archetype, format);
      setBreakdownCards(items);
    } catch (e) {
      console.error('Error al cargar desglose de arquetipo:', e);
    } finally {
      setIsFetchingBreakdown(false);
    }
  }, [format]);

  const fetchArchetypes = useCallback(async () => {
    setIsFetchingArchetypes(true);
    try {
      const items = await fetchArchetypesApi(format);
      setArchetypesList(items);
    } catch (e) {
      console.error('Error fetching archetypes:', e);
    } finally {
      setIsFetchingArchetypes(false);
    }
  }, [format]);

  const initializeDeckFromArchetype = async (archetype: string, cardsInBreakdown: BreakdownCardItem[]) => {
    if (deckCards.length > 0 && !confirm(`¿Estás seguro de que deseas iniciar una nueva baraja de ${archetype}? Esto borrará tus cartas actuales.`)) {
      return;
    }

    const cardsToLoad: DeckCard[] = cardsInBreakdown.map((item) => {
      const isExtra = isExtraDeckCard(item.type);
      return {
        id: item.id,
        name: item.name,
        count: Math.round(item.average_copies) || 1,
        section: isExtra ? 'extra' : 'main',
        type: item.type,
        image_url: item.image_url || item.image_url_small || '',
        archetype: archetype,
      };
    });

    setDeckCards(cardsToLoad);
    setDeckName(`Deck ${archetype} (Meta)`);
    setDeckId(null);
    setActiveView('builder');
    setActiveArchetypeBreakdown(null);
  };

  return {
    activeView,
    setActiveView,
    archetypesList,
    setArchetypesList,
    isFetchingArchetypes,
    archetypeSearchQuery,
    setArchetypeSearchQuery,
    sidebarBreakdownCards,
    isFetchingSidebarBreakdown,
    syncedArchetypes,
    setSyncedArchetypes,
    activeArchetypeBreakdown,
    setActiveArchetypeBreakdown,
    breakdownCards,
    isFetchingBreakdown,
    fetchSidebarBreakdown,
    openArchetypeBreakdown,
    fetchArchetypes,
    initializeDeckFromArchetype,
  };
}
