import { Deck, StorageLocation, UserCard, SleeveInventory, DeckSleeve } from '@/types/collection';
import { ArchetypeItem, BreakdownCardItem, Replacement } from '../types';

export async function fetchArchetypesApi(format: string): Promise<ArchetypeItem[]> {
  const res = await fetch(`/api/archetypes?format=${encodeURIComponent(format)}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.archetypes || [];
}

export async function fetchBreakdownApi(archetype: string, format: string): Promise<BreakdownCardItem[]> {
  const res = await fetch(`/api/breakdown?archetype=${encodeURIComponent(archetype)}&format=${format}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.breakdown || [];
}

export interface AnalyzeDeckResponse {
  detectedArchetypes: { name: string; count: number }[];
  archetype?: string;
  replacements?: Record<number, Replacement[]>;
}

export async function analyzeDeckApi(cards: Array<{ id: number; name: string; count: number; section: string }>, format: string): Promise<AnalyzeDeckResponse> {
  const res = await fetch('/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cards, format })
  });
  if (!res.ok) return { detectedArchetypes: [] };
  return res.json();
}

export async function syncMetaApi(): Promise<{ ok: boolean; message?: string; error?: string }> {
  const res = await fetch('/api/sync-meta', { method: 'POST' });
  const json = await res.json();
  return { ok: res.ok, message: json.message, error: json.error };
}

export async function fetchDecksApi(): Promise<Deck[]> {
  const res = await fetch('/api/decks');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function fetchStorageLocationsApi(): Promise<StorageLocation[]> {
  const res = await fetch('/api/collection/storage');
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data || []).filter((l: StorageLocation) => l.type === 'deckbox' || l.type === 'binder' || l.type === 'box');
}

export async function fetchCollectionCardsApi(params = ''): Promise<UserCard[]> {
  const res = await fetch(`/api/collection/cards${params ? `?${params}` : ''}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function fetchSleeveInventoryApi(): Promise<SleeveInventory[]> {
  const res = await fetch('/api/collection/sleeve-inventory');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function fetchDeckSleevesApi(deckId: string): Promise<DeckSleeve[]> {
  const res = await fetch(`/api/decks/${deckId}/sleeves`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function saveDeckSleeveApi(
  deckId: string,
  payload: { sleeve_id: string; section_type: string; action_mode?: string; added_quantity?: number }
): Promise<boolean> {
  const res = await fetch(`/api/decks/${deckId}/sleeves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.ok;
}

export async function deleteDeckSleeveApi(deckId: string, sectionType: string): Promise<boolean> {
  const res = await fetch(`/api/decks/${deckId}/sleeves?section_type=${sectionType}`, { method: 'DELETE' });
  return res.ok;
}

export async function saveDeckApi(payload: Record<string, unknown>, method: 'POST' | 'PUT'): Promise<{ ok: boolean; data?: Deck; error?: string }> {
  const res = await fetch('/api/decks', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  return { ok: res.ok, data: json.data, error: json.error };
}

export async function deleteDeckApi(deckId: string): Promise<boolean> {
  const res = await fetch(`/api/decks?id=${deckId}`, { method: 'DELETE' });
  return res.ok;
}
