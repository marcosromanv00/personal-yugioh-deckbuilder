import { useState, useEffect, useCallback, useMemo } from 'react';
import { YgoDetectedCard } from '@/components/scanner/CardCodeScannerModal';
import { QueuedCardItem, YgoCardResult } from './manualAdder.types';
import { saveCardsBatchApi, saveSingleCardApi } from './services/manualAdder.api';
import { useManualAdderSearch } from './hooks/useManualAdderSearch';
import { useManualAdderBulk } from './hooks/useManualAdderBulk';

interface UseManualCardAdderStateParams {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function useManualCardAdderState({
  isOpen,
  onClose,
  onSuccess,
}: UseManualCardAdderStateParams) {
  const [activeLeftTab, setActiveLeftTab] = useState<'search' | 'bulk'>('search');
  const [queuedCards, setQueuedCards] = useState<QueuedCardItem[]>([]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [defaultLocationId, setDefaultLocationId] = useState<string>('inbox');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const activeCard = useMemo(
    () => queuedCards.find((c) => c.id === activeCardId) || null,
    [queuedCards, activeCardId]
  );

  const searchHook = useManualAdderSearch({
    isOpen,
    activeLeftTab,
    onError: setErrorMsg,
  });

  const onAddParsedCards = useCallback((newItems: QueuedCardItem[]) => {
    setQueuedCards((prev) => [...prev, ...newItems]);
    if (newItems.length > 0) setActiveCardId(newItems[0].id);
  }, []);

  const bulkHook = useManualAdderBulk({
    defaultLocationId,
    onError: setErrorMsg,
    onSuccess: setSuccessMsg,
    onAddParsedCards,
  });

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        searchHook.resetSearch();
        bulkHook.resetBulk();
        setQueuedCards([]);
        setActiveCardId(null);
        setErrorMsg('');
        setSuccessMsg('');
      });
    }
  }, [isOpen]);

  const handleAddCardToQueue = useCallback((card: YgoCardResult, qty: number = 1) => {
    setErrorMsg('');
    setSuccessMsg('');
    setQueuedCards((prev) => {
      const existingIndex = prev.findIndex((c) => c.card_id === card.id);
      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const updated = [...prev];
        updated[existingIndex] = { ...existing, quantity: existing.quantity + qty };
        setActiveCardId(existing.id);
        return updated;
      }
      const generatedId = `queue-${card.id}-${prev.length + 1}`;
      const newItem: QueuedCardItem = {
        id: generatedId,
        card_id: card.id,
        name: card.name,
        type: card.type,
        desc: card.desc,
        image_url: card.image_url,
        image_url_small: card.image_url_small || card.image_url,
        archetype: card.archetype,
        atk: card.atk,
        def: card.def,
        level: card.level,
        attribute: card.attribute,
        race: card.race,
        quantity: qty,
        storage_location_id: defaultLocationId,
        rarity: 'Common',
        condition: 'Near Mint',
        language: 'en',
        status_flag: 'collection',
        sleeve_type: 'none',
        is_proxy: false,
        notes: '',
      };
      setActiveCardId(generatedId);
      return [...prev, newItem];
    });
  }, [defaultLocationId]);

  const handleScannerCardRegistered = async (card: YgoDetectedCard, quantity: number) => {
    handleAddCardToQueue(card as YgoCardResult, quantity);
    try {
      const locId = defaultLocationId === 'inbox' ? null : defaultLocationId;
      await saveSingleCardApi(card.id, locId, quantity);
      setSuccessMsg(`¡${card.name} (${quantity}x) guardada directamente!`);
      onSuccess();
    } catch {
      setErrorMsg('Error al guardar la carta escaneada en el contenedor.');
    }
  };

  const handleUpdateActiveCard = (updates: Partial<QueuedCardItem>) => {
    if (!activeCardId) return;
    setQueuedCards((prev) => prev.map((c) => (c.id === activeCardId ? { ...c, ...updates } : c)));
  };

  const handleRemoveQueuedCard = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setQueuedCards((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (activeCardId === id) setActiveCardId(filtered.length > 0 ? filtered[0].id : null);
      return filtered;
    });
  };

  const handleApplyLocationToAll = (locId: string) => {
    setDefaultLocationId(locId);
    setQueuedCards((prev) => prev.map((c) => ({ ...c, storage_location_id: locId })));
  };

  const handleSaveAllCards = async () => {
    if (queuedCards.length === 0) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const count = await saveCardsBatchApi(queuedCards);
      setSuccessMsg(`¡${count} cartas registradas con éxito en tu colección!`);
      onSuccess();
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar las cartas.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const totalCardUnits = queuedCards.reduce((acc, c) => acc + c.quantity, 0);

  return {
    activeLeftTab, setActiveLeftTab,
    searchQuery: searchHook.searchQuery, setSearchQuery: searchHook.setSearchQuery,
    typeFilter: searchHook.typeFilter, setTypeFilter: searchHook.setTypeFilter,
    searchResults: searchHook.searchResults, searching: searchHook.searching,
    bulkText: bulkHook.bulkText, setBulkText: bulkHook.setBulkText,
    analyzingBulk: bulkHook.analyzingBulk, unmatchedBulkCards: bulkHook.unmatchedBulkCards,
    handleAnalyzeBulk: bulkHook.handleAnalyzeBulk,
    queuedCards, setQueuedCards,
    activeCardId, setActiveCardId, activeCard,
    defaultLocationId, handleApplyLocationToAll,
    handleAddCardToQueue, handleScannerCardRegistered,
    handleUpdateActiveCard, handleRemoveQueuedCard,
    handleSaveAllCards,
    submitting, errorMsg, successMsg,
    isScannerOpen, setIsScannerOpen,
    totalCardUnits,
  };
}
