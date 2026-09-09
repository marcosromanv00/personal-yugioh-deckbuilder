import { useState, useMemo } from 'react';
import { UserCard, Deck } from '@/types/collection';
import { GridCardGroup, DeckInContainer } from '../types';
import { LanePatternReport, GlobalCollectionReport } from '@/lib/cardClassificationEngine';

interface UseContainerFilterSortProps {
  cards: UserCard[];
  isInbox: boolean;
  internalDecks: Deck[];
  activeClusterFilter: string | null;
  lanePatternReport: LanePatternReport | null;
  globalCollectionReport: GlobalCollectionReport | null;
  onCompartmentSelectedForImport?: (compIndex: number) => void;
}

export function useContainerFilterSort({
  cards,
  isInbox,
  internalDecks,
  activeClusterFilter,
  lanePatternReport,
  globalCollectionReport,
  onCompartmentSelectedForImport,
}: UseContainerFilterSortProps) {
  const [containerSearch, setContainerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('registration_asc');
  const [activeCompartment, setActiveCompartment] = useState<number>(-1);
  const [selectedDeckFilter, setSelectedDeckFilter] = useState<string>('all');
  const [currentGridPage, setCurrentGridPage] = useState(1);

  const handleSelectCompartment = (compIndex: number) => {
    setActiveCompartment(compIndex);
    if (compIndex !== -1 && onCompartmentSelectedForImport) {
      onCompartmentSelectedForImport(compIndex);
    }
  };

  const decksInContainer = useMemo<DeckInContainer[]>(() => {
    const map = new Map<string, DeckInContainer>();
    cards.forEach(c => {
      if (c.deck_id) {
        const targetDeck = internalDecks.find(d => d.id === c.deck_id);
        const dName = c.deck_details?.name || targetDeck?.name || 'Mazo';
        const existing = map.get(c.deck_id) || {
          id: c.deck_id,
          name: dName,
          format: targetDeck?.format,
          totalCards: (targetDeck?.cards || []).reduce((sum, cd) => sum + cd.count, 0),
          countInContainer: 0,
          compartments: new Set<number>()
        };
        existing.countInContainer += (c.quantity || 1);
        existing.compartments.add(c.compartment_index || 0);
        map.set(c.deck_id, existing);
      }
    });
    return Array.from(map.values());
  }, [cards, internalDecks]);

  const decksInActiveLane = useMemo(() => {
    if (activeCompartment === -1) return decksInContainer;
    return decksInContainer.filter(d => d.compartments.has(activeCompartment));
  }, [decksInContainer, activeCompartment]);

  const totalPhysicalCards = useMemo(() => {
    return cards.reduce((sum, c) => sum + (c.quantity || 1), 0);
  }, [cards]);

  const activeLaneCards = useMemo(() => {
    if (activeCompartment === -1) return cards;
    return cards.filter(c => (c.compartment_index || 0) === activeCompartment);
  }, [cards, activeCompartment]);

  const filteredCards = useMemo(() => {
    const list = cards.filter(c => {
      const nameMatch = !containerSearch || (c.card_details?.name.toLowerCase().includes(containerSearch.toLowerCase()) ?? false);
      const sMatch = statusFilter === 'all' || c.status_flag === statusFilter;
      const compMatch = isInbox || activeCompartment === -1 || (c.compartment_index || 0) === activeCompartment;

      let clusterMatch = true;
      if (activeClusterFilter) {
        let matched = false;
        const matchFn = (uIds?: string[], cIds?: number[], arch?: string) => {
          if (c.id && uIds?.some(id => String(id) === String(c.id))) return true;
          if (c.card_id != null && cIds?.some(id => String(id) === String(c.card_id))) return true;
          if (arch && c.card_details?.archetype) {
            return c.card_details.archetype.trim().toLowerCase() === arch.trim().toLowerCase();
          }
          return false;
        };

        if (lanePatternReport) {
          const cl = lanePatternReport.clusters.find(item => item.id === activeClusterFilter);
          if (cl) {
            clusterMatch = matchFn(cl.userCardIds, cl.cardIds, cl.archetypeName);
            matched = true;
          } else {
            for (const item of lanePatternReport.clusters) {
              const sub = item.subArchetypes?.find(s => s.id === activeClusterFilter);
              if (sub) {
                clusterMatch = matchFn(sub.userCardIds, sub.cardIds, sub.archetypeName);
                matched = true;
                break;
              }
            }
          }
        }
        if (!matched && globalCollectionReport) {
          const gCl = globalCollectionReport.globalClusters.find(item => item.id === activeClusterFilter);
          if (gCl) {
            clusterMatch = matchFn(gCl.userCardIds, gCl.cardIds, gCl.archetypeName);
            matched = true;
          } else {
            for (const item of globalCollectionReport.globalClusters) {
              const sub = item.subArchetypes?.find(s => s.id === activeClusterFilter);
              if (sub) {
                clusterMatch = matchFn(sub.userCardIds, sub.cardIds, sub.archetypeName);
                matched = true;
                break;
              }
            }
          }
        }
      }

      let deckMatch = true;
      if (selectedDeckFilter === 'unassigned') deckMatch = !c.deck_id;
      else if (selectedDeckFilter !== 'all') deckMatch = c.deck_id === selectedDeckFilter;

      return nameMatch && sMatch && compMatch && clusterMatch && deckMatch;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'registration_asc') return (a.created_at ? new Date(a.created_at).getTime() : 0) - (b.created_at ? new Date(b.created_at).getTime() : 0);
      if (sortBy === 'registration_desc') return (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0);
      if (sortBy === 'name_asc') return (a.card_details?.name || '').localeCompare(b.card_details?.name || '');
      if (sortBy === 'name_desc') return (b.card_details?.name || '').localeCompare(a.card_details?.name || '');
      if (sortBy === 'id_asc') return (a.card_id || 0) - (b.card_id || 0);
      if (sortBy === 'type') return (a.card_details?.type || '').localeCompare(b.card_details?.type || '');
      return 0;
    });
  }, [cards, containerSearch, statusFilter, sortBy, isInbox, activeCompartment, activeClusterFilter, lanePatternReport, globalCollectionReport, selectedDeckFilter]);

  const groupedGridCards = useMemo<GridCardGroup[]>(() => {
    const groupsMap = new Map<string, GridCardGroup>();
    for (const uc of filteredCards) {
      const comp = uc.compartment_index || 0;
      const key = `${uc.card_id}_${comp}`;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          card_id: uc.card_id,
          compartment_index: comp,
          card_details: uc.card_details,
          totalQuantity: uc.quantity || 1,
          representativeUserCard: uc,
          allVariants: [uc],
        });
      } else {
        const group = groupsMap.get(key)!;
        group.totalQuantity += (uc.quantity || 1);
        group.allVariants.push(uc);
      }
    }
    return Array.from(groupsMap.values());
  }, [filteredCards]);

  const CARDS_PER_GRID_PAGE = 30;
  const totalGridPages = Math.max(1, Math.ceil(groupedGridCards.length / CARDS_PER_GRID_PAGE));
  const paginatedGridCards = useMemo(() => {
    const start = (currentGridPage - 1) * CARDS_PER_GRID_PAGE;
    return groupedGridCards.slice(start, start + CARDS_PER_GRID_PAGE);
  }, [groupedGridCards, currentGridPage]);

  return {
    containerSearch,
    setContainerSearch,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    activeCompartment,
    setActiveCompartment,
    handleSelectCompartment,
    selectedDeckFilter,
    setSelectedDeckFilter,
    currentGridPage,
    setCurrentGridPage,
    decksInContainer,
    decksInActiveLane,
    totalPhysicalCards,
    activeLaneCards,
    filteredCards,
    displayedGridCards: groupedGridCards,
    paginatedGridCards,
    totalGridPages,
  };
}
