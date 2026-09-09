import { QueuedCardItem, YgoCardResult } from '../manualAdder.types';

export interface ParsedBulkItem {
  card_id: number;
  name: string;
  type?: string;
  desc?: string;
  image_url?: string;
  image_url_small?: string;
  archetype?: string;
  quantity?: number;
}

export async function searchCardsApi(queryText: string, typeVal: string): Promise<YgoCardResult[]> {
  let url = `/api/cards?q=${encodeURIComponent(queryText.trim())}&limit=24`;
  if (typeVal !== 'All') {
    url += `&type=${encodeURIComponent(typeVal)}`;
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Error al buscar cartas.');
  }
  const json = await res.json();
  return json.data || [];
}

export async function saveCardsBatchApi(queuedCards: QueuedCardItem[]): Promise<number> {
  const payload = {
    cards: queuedCards.map((c) => ({
      card_id: c.card_id,
      storage_location_id: c.storage_location_id === 'inbox' ? null : c.storage_location_id,
      quantity: c.quantity,
      rarity: c.rarity,
      condition: c.condition,
      language: c.language,
      status_flag: c.status_flag,
      sleeve_type: c.sleeve_type,
      is_proxy: c.is_proxy,
      notes: c.notes,
    })),
  };

  const res = await fetch('/api/collection/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error || 'Error al registrar las cartas.');
  }

  const json = await res.json();
  return json.count || queuedCards.reduce((acc, c) => acc + c.quantity, 0);
}

export async function saveSingleCardApi(
  cardId: number,
  locationId: string | null,
  quantity: number
): Promise<void> {
  const res = await fetch('/api/collection/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      card_id: cardId,
      storage_location_id: locationId === 'inbox' ? null : locationId,
      quantity,
      rarity: 'Common',
      condition: 'Near Mint',
      language: 'en',
      status_flag: 'collection',
      sleeve_type: 'none',
      is_proxy: false,
      notes: '',
    }),
  });

  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error || 'Error al guardar la carta.');
  }
}

export async function analyzeBulkApi(
  cleanedText: string
): Promise<{ parsed: ParsedBulkItem[]; unmatched: string[] }> {
  const res = await fetch('/api/collection/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: cleanedText }),
  });

  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error || 'Error al analizar el lote.');
  }

  const json = await res.json();
  return {
    parsed: json.parsed || [],
    unmatched: json.unmatched || [],
  };
}
