import { UserCard, SleeveInventory, Deck } from '@/types/collection';

export async function fetchDeckDetailsApi(deckId: string): Promise<Deck | null> {
  const res = await fetch(`/api/decks/${deckId}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export async function fetchUserCardsApi(): Promise<UserCard[]> {
  const res = await fetch('/api/collection/cards');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function fetchSleevesInventoryApi(): Promise<SleeveInventory[]> {
  const res = await fetch('/api/collection/sleeve-inventory');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function saveDeckMetadataApi(deckId: string, payload: Record<string, unknown>): Promise<boolean> {
  const res = await fetch(`/api/decks/${deckId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

export async function saveDeckCardsApi(deckId: string, payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/decks', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: deckId, ...payload }),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, error: json.error };
}

export async function updateUserCardApi(userCardId: string, fields: Partial<UserCard>): Promise<boolean> {
  const res = await fetch('/api/collection/cards', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userCardId, ...fields }),
  });
  return res.ok;
}

export async function addUserCardApi(payload: Record<string, unknown>): Promise<{ ok: boolean; data?: UserCard; error?: string }> {
  const res = await fetch('/api/collection/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, data: json.data, error: json.error };
}

export async function deleteUserCardApi(userCardId: string): Promise<boolean> {
  const res = await fetch(`/api/collection/cards?id=${userCardId}`, { method: 'DELETE' });
  return res.ok;
}

export async function updateCardPhysicalLocationApi(userCardId: string, locationId: string | null, compartmentIdx = 0): Promise<boolean> {
  const res = await fetch('/api/collection/cards', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: userCardId,
      storage_location_id: locationId,
      compartment_index: compartmentIdx,
      binder_page: null,
      binder_slot: null,
    }),
  });
  return res.ok;
}
