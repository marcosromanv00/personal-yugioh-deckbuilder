'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserCard, StorageLocation, Deck } from '@/types/collection';
import { TriageScopeConfig, CardSetPrintingsResponse } from '@/types/triage';
import { diagnoseCardTriage, isCardPendingTriage } from '@/lib/triageClassification.utils';
import { useTriagePersistence } from './useTriagePersistence';
import { useTriageDynamicLearning } from './useTriageDynamicLearning';

interface UseTriageStateProps {
  initialCards: UserCard[];
  locations: StorageLocation[];
  decks: Deck[];
  initialLocationId?: string | null;
  initialCompartmentIndex?: number | null;
}

export function useTriageState({
  initialCards,
  locations,
  decks,
  initialLocationId = null,
  initialCompartmentIndex = null,
}: UseTriageStateProps) {
  const persistence = useTriagePersistence();
  const learning = useTriageDynamicLearning();

  const [cards, setCards] = useState<UserCard[]>(initialCards);
  const [scopeConfig, setScopeConfigState] = useState<TriageScopeConfig>(() => {
    const saved = persistence.loadSavedScope();
    if (saved) return saved;
    return {
      scopeType: initialCompartmentIndex !== null && initialLocationId ? 'compartment' : initialLocationId ? 'location' : 'all',
      locationId: initialLocationId,
      compartmentIndex: initialCompartmentIndex,
      onlyUnclassified: false,
      sortOrder: 'physical',
    };
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    const savedId = persistence.loadSavedCardId();
    if (!savedId) return 0;
    const found = initialCards.findIndex(c => c.id === savedId);
    return found >= 0 ? found : 0;
  });

  const [isRarityModalOpen, setIsRarityModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isPriceCorrectionOpen, setIsPriceCorrectionOpen] = useState(false);
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [setsCache, setSetsCache] = useState<Record<number, CardSetPrintingsResponse>>({});

  const defaultBinder = useMemo(() => locations.find(l => l.name.toLowerCase().includes('ultimate') || l.type === 'binder') || null, [locations]);
  const defaultBulk = useMemo(() => locations.find(l => l.type === 'tin' || l.name.toLowerCase().includes('lata') || l.name.toLowerCase().includes('bulk')) || null, [locations]);
  const [targetBinderLocationId, setTargetBinderLocationId] = useState<string>(defaultBinder?.id || locations.find(l => l.type === 'binder')?.id || '');
  const [targetBulkLocationId, setTargetBulkLocationId] = useState<string>(defaultBulk?.id || locations.find(l => l.type === 'tin')?.id || '');

  const setScopeConfig = useCallback((update: TriageScopeConfig | ((prev: TriageScopeConfig) => TriageScopeConfig)) => {
    setScopeConfigState(prev => {
      const next = typeof update === 'function' ? update(prev) : update;
      persistence.saveState(null, next);
      return next;
    });
  }, [persistence]);

  const bulkCardsCount = useMemo(() => {
    return cards.filter(c => c.status_flag === 'bulk' || (targetBulkLocationId && c.storage_location_id === targetBulkLocationId)).length;
  }, [cards, targetBulkLocationId]);

  const availableThemes = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of cards) {
      const match = c.notes?.match(/\[Tema:\s*([^\]]+)\]/i);
      if (match) {
        const t = match[1].trim();
        map.set(t, (map.get(t) || 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [cards]);

  const filteredCards = useMemo(() => {
    let result = [...cards];
    if (scopeConfig.scopeType === 'location' && scopeConfig.locationId) {
      result = result.filter(c => c.storage_location_id === scopeConfig.locationId);
    } else if (scopeConfig.scopeType === 'compartment' && scopeConfig.locationId) {
      result = result.filter(c => c.storage_location_id === scopeConfig.locationId && c.compartment_index === (scopeConfig.compartmentIndex ?? 0));
    } else if (scopeConfig.scopeType === 'theme' && scopeConfig.themeTag) {
      const t = scopeConfig.themeTag.toLowerCase().trim();
      result = result.filter(c => c.notes && c.notes.toLowerCase().includes(`[tema: ${t}]`));
    } else if (scopeConfig.scopeType === 'bulk') {
      result = result.filter(c => c.status_flag === 'bulk' || (targetBulkLocationId && c.storage_location_id === targetBulkLocationId));
    }
    if (scopeConfig.onlyUnclassified && scopeConfig.scopeType !== 'bulk') result = result.filter(isCardPendingTriage);
    if (scopeConfig.sortOrder === 'name_asc') {
      result.sort((a, b) => (a.card_details?.name || '').localeCompare(b.card_details?.name || ''));
    }
    return result;
  }, [cards, scopeConfig, targetBulkLocationId]);

  const safeIndex = Math.min(currentIndex, Math.max(0, filteredCards.length - 1));
  const currentCard = filteredCards[safeIndex] || null;

  // Persistir cardId actual al navegar
  useEffect(() => {
    if (currentCard) persistence.saveState(currentCard.id, scopeConfig);
  }, [currentCard, scopeConfig, persistence]);

  const currentDiagnosis = useMemo(() => {
    if (!currentCard) return null;
    const learnedPrice = learning.priceOverrides[currentCard.card_id];
    const marketPrice = learnedPrice ?? setsCache[currentCard.card_id]?.marketPriceTcg;
    const raw = diagnoseCardTriage(currentCard, cards, decks, marketPrice);
    const learnedVerdict = learning.applyLearnedVerdict(currentCard.card_id, raw.tacticalVerdict);
    return {
      ...raw,
      suggestedPrimaryAction: learnedVerdict.action,
      tacticalVerdict: learnedVerdict,
    };
  }, [currentCard, cards, decks, setsCache, learning]);

  useEffect(() => {
    if (!currentCard) return;
    const cardId = currentCard.card_id;
    if (setsCache[cardId]) return;
    let isMounted = true;
    fetch(`/api/cards/${cardId}/sets`)
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (isMounted && json?.success && json?.data) {
          setSetsCache(prev => ({ ...prev, [cardId]: json.data }));
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [currentCard, setsCache]);

  const handleCorrectPrice = useCallback(async (newPrice: number): Promise<boolean> => {
    if (!currentCard) return false;
    const { card_id: cardId, id: userCardId } = currentCard;
    learning.recordPriceCorrection(cardId, newPrice);
    setSetsCache(prev => prev[cardId] ? { ...prev, [cardId]: { ...prev[cardId], marketPriceTcg: newPrice } } : prev);
    setCards(prev => prev.map(c => (c.card_id === cardId ? { ...c, sale_price: newPrice } : c)));
    const { error } = await supabase.from('yg_user_cards').update({ sale_price: newPrice }).eq('id', userCardId);
    return !error;
  }, [currentCard, learning]);

  const handleNext = useCallback(() => setCurrentIndex(prev => Math.min(filteredCards.length - 1, prev + 1)), [filteredCards.length]);
  const handlePrev = useCallback(() => setCurrentIndex(prev => Math.max(0, prev - 1)), []);
  const handleJumpToIndex = useCallback((idx: number) => {
    if (idx >= 0 && idx < filteredCards.length) setCurrentIndex(idx);
  }, [filteredCards.length]);

  const handleCardUpdated = useCallback((updatedCard: UserCard) => {
    setCards(prev => prev.map(c => (c.id === updatedCard.id ? updatedCard : c)));
    const tag = scopeConfig.themeTag?.toLowerCase().trim();
    const stillInScope =
      (scopeConfig.scopeType === 'all' ||
        (scopeConfig.scopeType === 'location' && updatedCard.storage_location_id === scopeConfig.locationId) ||
        (scopeConfig.scopeType === 'compartment' &&
          updatedCard.storage_location_id === scopeConfig.locationId &&
          updatedCard.compartment_index === (scopeConfig.compartmentIndex ?? 0)) ||
        (scopeConfig.scopeType === 'theme' && tag && Boolean(updatedCard.notes?.toLowerCase().includes(`[tema: ${tag}]`))) ||
        (scopeConfig.scopeType === 'bulk' && (updatedCard.status_flag === 'bulk' || updatedCard.storage_location_id === targetBulkLocationId))) &&
      (scopeConfig.scopeType === 'bulk' || !scopeConfig.onlyUnclassified || isCardPendingTriage(updatedCard));

    if (stillInScope) setCurrentIndex(prev => prev + 1);
  }, [scopeConfig, targetBulkLocationId]);

  const handleUndoSuccess = useCallback((restoredCard: UserCard) => {
    setCards(prev => prev.map(c => (c.id === restoredCard.id ? { ...c, ...restoredCard } : c)));
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  return {
    cards, filteredCards, safeIndex, currentCard, currentDiagnosis,
    scopeConfig, setScopeConfig, targetBinderLocationId, setTargetBinderLocationId,
    targetBulkLocationId, setTargetBulkLocationId, availableThemes, bulkCardsCount,
    isThemeModalOpen, setIsThemeModalOpen, isPriceCorrectionOpen, setIsPriceCorrectionOpen,
    isDeckModalOpen, setIsDeckModalOpen,
    handleCorrectPrice, recordLearnedRule: learning.recordRule,
    currentSetsData: currentCard ? setsCache[currentCard.card_id] || null : null,
    isRarityModalOpen, setIsRarityModalOpen,
    handleNext, handlePrev, handleJumpToIndex, handleCardUpdated, handleUndoSuccess,
    totalCount: filteredCards.length, locations, decks,
  };
}
