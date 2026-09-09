import { useState, useCallback } from 'react';
import { sanitizeBulkInput } from '@/lib/bulkSanitizer';
import { QueuedCardItem } from '../manualAdder.types';
import { analyzeBulkApi, ParsedBulkItem } from '../services/manualAdder.api';

interface UseManualAdderBulkParams {
  defaultLocationId: string;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
  onAddParsedCards: (newItems: QueuedCardItem[]) => void;
}

export function useManualAdderBulk({
  defaultLocationId,
  onError,
  onSuccess,
  onAddParsedCards,
}: UseManualAdderBulkParams) {
  const [bulkText, setBulkText] = useState('');
  const [analyzingBulk, setAnalyzingBulk] = useState(false);
  const [unmatchedBulkCards, setUnmatchedBulkCards] = useState<string[]>([]);

  const handleAnalyzeBulk = useCallback(async () => {
    const cleanedText = sanitizeBulkInput(bulkText, false);
    setBulkText(cleanedText);
    if (!cleanedText.trim()) return;

    setAnalyzingBulk(true);
    onError('');
    onSuccess('');
    setUnmatchedBulkCards([]);

    try {
      const { parsed, unmatched } = await analyzeBulkApi(cleanedText);
      setUnmatchedBulkCards(unmatched);

      if (parsed.length > 0) {
        const newItems: QueuedCardItem[] = parsed.map((p: ParsedBulkItem) => ({
          id: `queue-${p.card_id}-${Math.random().toString(36).substring(2, 9)}`,
          card_id: p.card_id,
          name: p.name,
          type: p.type || 'Monster',
          desc: p.desc || '',
          image_url: p.image_url || '',
          image_url_small: p.image_url_small || p.image_url || '',
          archetype: p.archetype,
          quantity: p.quantity || 1,
          storage_location_id: defaultLocationId,
          rarity: 'Common',
          condition: 'Near Mint',
          language: 'en',
          status_flag: 'collection',
          sleeve_type: 'none',
          is_proxy: false,
          notes: '',
        }));

        onAddParsedCards(newItems);
        onSuccess(`¡${parsed.length} cartas analizadas y agregadas al grid!`);
      } else {
        onError('No se pudieron reconocer cartas en el texto provisto.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al analizar el lote.';
      onError(message);
    } finally {
      setAnalyzingBulk(false);
    }
  }, [bulkText, defaultLocationId, onError, onSuccess, onAddParsedCards]);

  const resetBulk = useCallback(() => {
    setBulkText('');
    setUnmatchedBulkCards([]);
  }, []);

  return {
    bulkText,
    setBulkText,
    analyzingBulk,
    unmatchedBulkCards,
    handleAnalyzeBulk,
    resetBulk,
  };
}
