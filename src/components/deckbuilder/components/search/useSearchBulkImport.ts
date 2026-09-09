import { useState } from 'react';
import { Card } from '../../types';
import { sanitizeBulkInput } from '@/lib/bulkSanitizer';
import type { YgoDetectedCard } from '@/components/scanner/CardCodeScannerModal';
import { ParsedBulkItem } from './searchPanel.types';

export function useSearchBulkImport(
  addCardToDeck: (card: Card, section?: 'main' | 'extra' | 'side' | 'extras') => void
) {
  const [bulkMode, setBulkMode] = useState<'ydk' | 'ids'>('ydk');
  const [bulkLinkWithCollection, setBulkLinkWithCollection] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [analyzingBulk, setAnalyzingBulk] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');
  const [bulkErrorMsg, setBulkErrorMsg] = useState('');
  const [unmatchedBulkCards, setUnmatchedBulkCards] = useState<string[]>([]);
  const [parsedBulkItems, setParsedBulkItems] = useState<ParsedBulkItem[]>([]);
  const [fileName, setFileName] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleScannerCardRegistered = (card: YgoDetectedCard, quantity: number) => {
    const lineToAdd = Array(quantity).fill(card.id.toString()).join('\n');
    setBulkText((prev) => (prev.trim() ? `${prev.trim()}\n${lineToAdd}` : lineToAdd));

    const cardObj: Card = {
      id: card.id,
      name: card.name,
      type: card.type,
      desc: card.desc || '',
      image_url: card.image_url,
      image_url_small: card.image_url_small || card.image_url,
      archetype: card.archetype,
      atk: card.atk,
      def: card.def,
      level: card.level,
      attribute: card.attribute,
      race: card.race,
    };

    const typeLower = (card.type || '').toLowerCase();
    const isExtra = typeLower.includes('fusion') || typeLower.includes('synchro') || typeLower.includes('xyz') || typeLower.includes('link');
    const targetSection = isExtra ? 'extra' : 'main';

    for (let i = 0; i < quantity; i++) {
      addCardToDeck(cardObj, targetSection);
    }
    setBulkSuccessMsg(`¡${card.name} (${quantity}x) agregada directamente al mazo!`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const raw = (event.target?.result as string) || '';
      setBulkText(sanitizeBulkInput(raw, bulkMode === 'ids'));
    };
    reader.readAsText(file);
  };

  const handleProcessBulkText = async () => {
    const cleanedText = sanitizeBulkInput(bulkText, bulkMode === 'ids');
    setBulkText(cleanedText);
    if (!cleanedText.trim()) return;

    setAnalyzingBulk(true);
    setBulkErrorMsg('');
    setBulkSuccessMsg('');
    setUnmatchedBulkCards([]);
    setParsedBulkItems([]);

    try {
      const res = await fetch('/api/collection/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanedText, bulkText: cleanedText, isIdsMode: bulkMode === 'ids' }),
      });

      if (res.ok) {
        const json = await res.json();
        const parsed = json.parsed || [];
        const unmatched = json.unmatched || [];
        setUnmatchedBulkCards(unmatched);

        if (parsed.length === 0) {
          setBulkErrorMsg('No se detectaron cartas válidas en el texto ingresado.');
          return;
        }

        const items: ParsedBulkItem[] = parsed.map(
          (item: { card_id: number; name: string; type?: string; section?: string; image_url?: string; image_url_small?: string; quantity?: number }, idx: number) => {
            const type = (item.type || '').toLowerCase();
            const isExtra = type.includes('fusion') || type.includes('synchro') || type.includes('xyz') || type.includes('link');
            const section = item.section && item.section !== 'main' ? (item.section as 'main' | 'extra' | 'side' | 'extras') : isExtra ? 'extra' : 'main';
            return {
              id: `bulk-${item.card_id}-${idx}`,
              card_id: item.card_id,
              name: item.name,
              type: item.type || 'Monster',
              image_url: item.image_url || item.image_url_small || `https://images.ygoprodeck.com/images/cards/${item.card_id}.jpg`,
              image_url_small: item.image_url_small || item.image_url,
              quantity: Math.min(3, Math.max(1, item.quantity || 1)),
              selected: true,
              section,
              linkWithCollection: bulkLinkWithCollection,
            };
          }
        );
        setParsedBulkItems(items);
        setBulkSuccessMsg(`Se encontraron ${items.length} tipos de cartas en el lote.`);
      } else {
        const errJson = await res.json();
        setBulkErrorMsg(errJson.error || 'Error al analizar el lote.');
      }
    } catch (err: unknown) {
      setBulkErrorMsg((err as Error).message || 'Error procesando texto bulk.');
    } finally {
      setAnalyzingBulk(false);
    }
  };

  const toggleBulkItem = (id: string) => {
    setParsedBulkItems((prev) => prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)));
  };

  const toggleBulkItemLink = (id: string) => {
    setParsedBulkItems((prev) => prev.map((item) => (item.id === id ? { ...item, linkWithCollection: item.linkWithCollection === false } : item)));
  };

  const updateBulkItemQty = (id: string, delta: number) => {
    setParsedBulkItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: Math.min(3, Math.max(1, item.quantity + delta)) } : item))
    );
  };

  const selectAllBulkItems = (val: boolean) => {
    setParsedBulkItems((prev) => prev.map((item) => ({ ...item, selected: val })));
  };

  const confirmAddParsedBulkToDeck = () => {
    const selectedItems = parsedBulkItems.filter((i) => i.selected);
    if (selectedItems.length === 0) return;

    let addedTotalCount = 0;
    selectedItems.forEach((item) => {
      const cardObj: Card = { id: item.card_id, name: item.name, type: item.type, image_url: item.image_url, image_url_small: item.image_url_small };
      for (let q = 0; q < item.quantity; q++) {
        addCardToDeck(cardObj, item.section);
        addedTotalCount++;
      }
    });

    setBulkSuccessMsg(`¡Éxito! Se agregaron ${addedTotalCount} cartas seleccionadas al editor de baraja.`);
    setParsedBulkItems([]);
    setBulkText('');
    setFileName('');
  };

  return {
    bulkMode, setBulkMode,
    bulkLinkWithCollection, setBulkLinkWithCollection,
    bulkText, setBulkText,
    analyzingBulk, bulkSuccessMsg, bulkErrorMsg,
    unmatchedBulkCards, parsedBulkItems, fileName, setFileName,
    isScannerOpen, setIsScannerOpen,
    handleScannerCardRegistered, handleFileUpload,
    handleProcessBulkText, toggleBulkItem, toggleBulkItemLink,
    updateBulkItemQty, selectAllBulkItems, confirmAddParsedBulkToDeck,
  };
}
