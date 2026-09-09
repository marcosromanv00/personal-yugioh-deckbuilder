import { useState, useMemo, useEffect } from 'react';
import { DeckCardDetail, Deck } from '@/types/collection';
import { DeckSectionFilter, MobileDeckTab } from '../types';
import { isExtraDeckCardType } from '../deckWorkspace.utils';

export function useDeckWorkspaceFilterSort(
  deckCards: DeckCardDetail[],
  currentDeck: Deck | null,
  decks: Deck[],
  onSelectDeck?: (deck: Deck) => void
) {
  const [searchFilter, setSearchFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState<DeckSectionFilter>('all');
  const [sortBy, setSortBy] = useState<string>('default');
  const [mobileTab, setMobileTab] = useState<MobileDeckTab>('center');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentDeckIndex = useMemo(() => {
    if (!currentDeck || !decks.length) return -1;
    return decks.findIndex((d) => d.id === currentDeck.id);
  }, [currentDeck, decks]);

  const handleNavigatePrev = () => {
    if (currentDeckIndex > 0 && onSelectDeck) onSelectDeck(decks[currentDeckIndex - 1]);
  };

  const handleNavigateNext = () => {
    if (currentDeckIndex >= 0 && currentDeckIndex < decks.length - 1 && onSelectDeck) {
      onSelectDeck(decks[currentDeckIndex + 1]);
    }
  };

  const detectedArchetypes = useMemo(() => {
    const map = new Map<string, number>();
    deckCards.forEach((c) => {
      const arch = c.card_details?.archetype?.trim();
      if (arch) map.set(arch, (map.get(arch) || 0) + (c.count || 1));
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [deckCards]);

  const inferredArchetype = useMemo(() => {
    return detectedArchetypes.length > 0 ? detectedArchetypes[0].name : 'Híbrido / Staples';
  }, [detectedArchetypes]);

  const filteredCenterCards = useMemo(() => {
    let result = [...deckCards];
    if (sectionFilter !== 'all') {
      result = result.filter((c) => c.section === sectionFilter || (sectionFilter === 'pool' && c.section === 'extras'));
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      result = result.filter(
        (c) =>
          c.card_details?.name.toLowerCase().includes(q) ||
          c.card_details?.archetype?.toLowerCase().includes(q) ||
          c.card_details?.type?.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'name_asc') {
      result.sort((a, b) => (a.card_details?.name || '').localeCompare(b.card_details?.name || ''));
    } else if (sortBy === 'type') {
      result.sort((a, b) => (a.card_details?.type || '').localeCompare(b.card_details?.type || ''));
    }
    return result;
  }, [deckCards, sectionFilter, searchFilter, sortBy]);

  const mainCards = useMemo(() => filteredCenterCards.filter((c) => c.section === 'main'), [filteredCenterCards]);
  const extraCards = useMemo(() => filteredCenterCards.filter((c) => c.section === 'extra'), [filteredCenterCards]);
  const sideCards = useMemo(() => filteredCenterCards.filter((c) => c.section === 'side'), [filteredCenterCards]);
  const poolCards = useMemo(() => filteredCenterCards.filter((c) => c.section === 'pool' || c.section === 'extras'), [filteredCenterCards]);

  const totalMainCount = useMemo(() => deckCards.filter((c) => c.section === 'main').reduce((sum, c) => sum + c.count, 0), [deckCards]);
  const totalExtraCount = useMemo(() => deckCards.filter((c) => c.section === 'extra').reduce((sum, c) => sum + c.count, 0), [deckCards]);
  const totalSideCount = useMemo(() => deckCards.filter((c) => c.section === 'side').reduce((sum, c) => sum + c.count, 0), [deckCards]);
  const sideMainCount = useMemo(() => deckCards.filter((c) => c.section === 'side' && !isExtraDeckCardType(c)).reduce((sum, c) => sum + c.count, 0), [deckCards]);
  const sideExtraCount = useMemo(() => deckCards.filter((c) => c.section === 'side' && isExtraDeckCardType(c)).reduce((sum, c) => sum + c.count, 0), [deckCards]);
  const totalPoolCount = useMemo(() => deckCards.filter((c) => c.section === 'pool' || c.section === 'extras').reduce((sum, c) => sum + c.count, 0), [deckCards]);

  const mainRequiredSleeves = totalMainCount + sideMainCount;
  const extraRequiredSleeves = totalExtraCount + sideExtraCount;
  const poolRequiredSleeves = totalPoolCount;
  const totalDeckCount = totalMainCount + totalExtraCount + totalSideCount + totalPoolCount;

  return {
    searchFilter, setSearchFilter,
    sectionFilter, setSectionFilter,
    sortBy, setSortBy,
    filteredCenterCards,
    mainCards, extraCards, sideCards, poolCards,
    totalMainCount, totalExtraCount, totalSideCount,
    sideMainCount, sideExtraCount, totalPoolCount, totalDeckCount,
    mainRequiredSleeves, extraRequiredSleeves, poolRequiredSleeves,
    detectedArchetypes, inferredArchetype,
    mobileTab, setMobileTab, isMobile,
    handleNavigatePrev, handleNavigateNext,
  };
}
