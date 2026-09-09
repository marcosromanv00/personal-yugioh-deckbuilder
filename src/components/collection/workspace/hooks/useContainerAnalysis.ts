import { useState, useMemo } from 'react';
import { StorageLocation, UserCard, Deck } from '@/types/collection';
import {
  analyzeCardClassification,
  analyzeLanePatterns,
  analyzeGlobalCollectionPatterns,
  LaneCluster,
} from '@/lib/cardClassificationEngine';
import { findDispersedCardsAcrossLocations } from '@/lib/collectionUtils';
import { computeCrossContainerDuplicateMap } from '@/lib/collectionSuggestions';

interface UseContainerAnalysisProps {
  cards: UserCard[];
  allCollectionCards: UserCard[];
  selectedUserCard: UserCard | null;
  activeLaneCards: UserCard[];
  internalDecks: Deck[];
  locations: StorageLocation[];
}

export function useContainerAnalysis({
  cards,
  allCollectionCards,
  selectedUserCard,
  activeLaneCards,
  internalDecks,
  locations,
}: UseContainerAnalysisProps) {
  // Filtros de Cluster/Patrón
  const [activeClusterFilter, setActiveClusterFilter] = useState<string | null>(null);
  const [expandedClusterSubId, setExpandedClusterSubId] = useState<string | null>(null);

  // Estados para Modal de Ruta de Recolección (Pick-List)
  const [isPickListOpen, setIsPickListOpen] = useState<boolean>(false);
  const [selectedClusterForPickList, setSelectedClusterForPickList] = useState<LaneCluster | null>(null);
  const [selectedDispersedForPickList, setSelectedDispersedForPickList] = useState<UserCard[] | null>(null);
  const [pickListTitle, setPickListTitle] = useState<string>('');
  const [pickListSubtitle, setPickListSubtitle] = useState<string>('');

  const consolidatedPool = useMemo(() => {
    if (allCollectionCards.length === 0) return cards;
    const cardMap = new Map<string, UserCard>();
    allCollectionCards.forEach(c => cardMap.set(c.id, c));
    cards.forEach(c => cardMap.set(c.id, c));
    return Array.from(cardMap.values());
  }, [allCollectionCards, cards]);

  const classificationReport = useMemo(() => {
    if (!selectedUserCard) return null;
    return analyzeCardClassification(selectedUserCard, consolidatedPool, internalDecks, locations);
  }, [selectedUserCard, consolidatedPool, internalDecks, locations]);

  const lanePatternReport = useMemo(() => {
    return analyzeLanePatterns(activeLaneCards, consolidatedPool, internalDecks, locations);
  }, [activeLaneCards, consolidatedPool, internalDecks, locations]);

  const globalCollectionReport = useMemo(() => {
    return analyzeGlobalCollectionPatterns(consolidatedPool, internalDecks, locations);
  }, [consolidatedPool, internalDecks, locations]);

  const allDispersedCards = useMemo(() => {
    return findDispersedCardsAcrossLocations(consolidatedPool, locations);
  }, [consolidatedPool, locations]);

  const crossContainerDuplicatesMap = useMemo(() => {
    return computeCrossContainerDuplicateMap(consolidatedPool, locations);
  }, [consolidatedPool, locations]);

  const currentCardDispersedInfo = useMemo(() => {
    if (!selectedUserCard) return null;
    return allDispersedCards.find(d => d.cardId === selectedUserCard.card_id) || null;
  }, [selectedUserCard, allDispersedCards]);

  return {
    activeClusterFilter,
    setActiveClusterFilter,
    expandedClusterSubId,
    setExpandedClusterSubId,
    isPickListOpen,
    setIsPickListOpen,
    selectedClusterForPickList,
    setSelectedClusterForPickList,
    selectedDispersedForPickList,
    setSelectedDispersedForPickList,
    pickListTitle,
    setPickListTitle,
    pickListSubtitle,
    setPickListSubtitle,
    consolidatedPool,
    classificationReport,
    lanePatternReport,
    globalCollectionReport,
    allDispersedCards,
    crossContainerDuplicatesMap,
    currentCardDispersedInfo,
  };
}
