'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { UserCard, StorageLocation, Deck } from '@/types/collection';
import { TriageScopeConfig, CardSetPrintingsResponse } from '@/types/triage';
import { diagnoseCardTriage } from '@/lib/triageClassification.utils';

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
  const [cards, setCards] = useState<UserCard[]>(initialCards);
  const [scopeConfig, setScopeConfig] = useState<TriageScopeConfig>({
    scopeType: initialCompartmentIndex !== null && initialLocationId
      ? 'compartment'
      : initialLocationId
      ? 'location'
      : 'all',
    locationId: initialLocationId,
    compartmentIndex: initialCompartmentIndex,
    onlyUnclassified: false,
    sortOrder: 'physical',
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRarityModalOpen, setIsRarityModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [setsCache, setSetsCache] = useState<Record<number, CardSetPrintingsResponse>>({});

  const defaultBinder = useMemo(() => locations.find(l => l.name.toLowerCase().includes('ultimate') || l.type === 'binder') || null, [locations]);
  const defaultBulk = useMemo(() => locations.find(l => l.type === 'tin' || l.name.toLowerCase().includes('lata') || l.name.toLowerCase().includes('bulk')) || null, [locations]);
  const [targetBinderLocationId, setTargetBinderLocationId] = useState<string>(defaultBinder?.id || locations.find(l => l.type === 'binder')?.id || '');
  const [targetBulkLocationId, setTargetBulkLocationId] = useState<string>(defaultBulk?.id || locations.find(l => l.type === 'tin')?.id || '');

  // Temáticas registradas en notas [Tema: X]
  const availableThemes = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of cards) {
      const match = c.notes?.match(/\[Tema:\s*([^\]]+)\]/i);
      if (match) {
        const t = match[1].trim();
        map.set(t, (map.get(t) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [cards]);

  // 1. Filtrar cartas según el alcance configurado (cálculo puro en render)
  const filteredCards = useMemo(() => {
    let result = [...cards];

    if (scopeConfig.scopeType === 'location' && scopeConfig.locationId) {
      result = result.filter(c => c.storage_location_id === scopeConfig.locationId);
    } else if (scopeConfig.scopeType === 'compartment' && scopeConfig.locationId) {
      result = result.filter(
        c =>
          c.storage_location_id === scopeConfig.locationId &&
          c.compartment_index === (scopeConfig.compartmentIndex ?? 0)
      );
    } else if (scopeConfig.scopeType === 'theme' && scopeConfig.themeTag) {
      const t = scopeConfig.themeTag.toLowerCase().trim();
      result = result.filter(c => c.notes && c.notes.toLowerCase().includes(`[tema: ${t}]`));
    }

    if (scopeConfig.onlyUnclassified) {
      result = result.filter(c => !c.deck_id && c.status_flag === 'bulk');
    }

    if (scopeConfig.sortOrder === 'name_asc') {
      result.sort((a, b) => (a.card_details?.name || '').localeCompare(b.card_details?.name || ''));
    }

    return result;
  }, [cards, scopeConfig]);

  // Asegurar que currentIndex no supere la longitud de la cola
  const safeIndex = Math.min(currentIndex, Math.max(0, filteredCards.length - 1));
  const currentCard = filteredCards[safeIndex] || null;

  // 2. Diagnóstico de la carta activa
  const currentDiagnosis = useMemo(() => {
    if (!currentCard) return null;
    const marketPrice = setsCache[currentCard.card_id]?.marketPriceTcg;
    return diagnoseCardTriage(currentCard, cards, decks, marketPrice);
  }, [currentCard, cards, decks, setsCache]);

  // 3. Precarga de ediciones/sets para la carta activa y la siguiente
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

    return () => {
      isMounted = false;
    };
  }, [currentCard, setsCache]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(filteredCards.length - 1, prev + 1));
  }, [filteredCards.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleJumpToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < filteredCards.length) {
        setCurrentIndex(index);
      }
    },
    [filteredCards.length]
  );

  const handleCardUpdated = useCallback(
    (updatedCard: UserCard) => {
      setCards(prev => prev.map(c => (c.id === updatedCard.id ? updatedCard : c)));

      // Verificar si la carta sigue perteneciendo al filtro activo
      const tag = scopeConfig.themeTag?.toLowerCase().trim();
      const stillInScope =
        (scopeConfig.scopeType === 'all' ||
          (scopeConfig.scopeType === 'location' && updatedCard.storage_location_id === scopeConfig.locationId) ||
          (scopeConfig.scopeType === 'compartment' &&
            updatedCard.storage_location_id === scopeConfig.locationId &&
            updatedCard.compartment_index === (scopeConfig.compartmentIndex ?? 0)) ||
          (scopeConfig.scopeType === 'theme' && tag && Boolean(updatedCard.notes?.toLowerCase().includes(`[tema: ${tag}]`)))) &&
        (!scopeConfig.onlyUnclassified || (!updatedCard.deck_id && updatedCard.status_flag === 'bulk'));

      if (stillInScope) {
        setCurrentIndex(prev => prev + 1);
      }
    },
    [scopeConfig]
  );

  const handleUndoSuccess = useCallback((restoredCard: UserCard) => {
    setCards(prev => prev.map(c => (c.id === restoredCard.id ? { ...c, ...restoredCard } : c)));
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  return {
    cards,
    filteredCards,
    safeIndex,
    currentCard,
    currentDiagnosis,
    scopeConfig,
    setScopeConfig,
    targetBinderLocationId,
    setTargetBinderLocationId,
    targetBulkLocationId,
    setTargetBulkLocationId,
    availableThemes,
    isThemeModalOpen,
    setIsThemeModalOpen,
    currentSetsData: currentCard ? setsCache[currentCard.card_id] || null : null,
    isRarityModalOpen,
    setIsRarityModalOpen,
    handleNext,
    handlePrev,
    handleJumpToIndex,
    handleCardUpdated,
    handleUndoSuccess,
    totalCount: filteredCards.length,
    locations,
    decks,
  };
}
