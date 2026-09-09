import { StorageLocation, UserCard } from '@/types/collection';

export async function fetchContainerCardsApi(isInbox: boolean, containerId?: string): Promise<UserCard[]> {
  const url = isInbox ? '/api/collection/inbox' : `/api/collection/cards?location_id=${containerId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al cargar cartas del contenedor');
  const json = await res.json();
  return json.data || [];
}

export async function fetchGlobalCollectionDataApi(): Promise<{ cards: UserCard[]; decks: unknown[] }> {
  const [resCards, resDecks] = await Promise.all([
    fetch('/api/collection/cards'),
    fetch('/api/decks')
  ]);
  const cards = resCards.ok ? (await resCards.json()).data || [] : [];
  const decks = resDecks.ok ? (await resDecks.json()).data || [] : [];
  return { cards, decks };
}

export async function createCardApi(payload: Record<string, unknown>): Promise<UserCard> {
  const res = await fetch('/api/collection/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al añadir carta');
  }
  const json = await res.json();
  return json.data;
}

export async function updateCardApi(payload: Record<string, unknown>): Promise<void> {
  const res = await fetch('/api/collection/cards', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al actualizar carta');
  }
}

export async function deleteCardApi(id: string): Promise<void> {
  const res = await fetch(`/api/collection/cards?id=${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al eliminar carta');
  }
}

export async function batchUpdateCardsApi(cardIds: string[], updates: Record<string, unknown>): Promise<void> {
  const res = await fetch('/api/collection/cards', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'batch_update',
      card_ids: cardIds,
      updates,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al actualizar cartas en bloque');
  }
}

export async function batchDeleteCardsApi(ids: string[]): Promise<void> {
  const res = await fetch('/api/collection/cards', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al eliminar cartas en lote');
  }
}

export async function splitCopyApi(userCardId: string, splitQuantity: number): Promise<{ updatedSource: UserCard; newRecord?: UserCard }> {
  const res = await fetch('/api/collection/cards', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'split_copy',
      user_card_id: userCardId,
      split_quantity: splitQuantity,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al separar copias');
  }
  return await res.json();
}

export async function splitAndMoveVariantApi(payload: {
  user_card_id: string;
  split_quantity: number;
  target_storage_location_id: string | null;
  target_compartment_index: number;
}): Promise<void> {
  const res = await fetch('/api/collection/cards', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'split_and_move', ...payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al mover variante');
  }
}

export async function updateStorageLocationApi(location: StorageLocation): Promise<void> {
  const res = await fetch('/api/collection/storage', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: location.id,
      name: location.name,
      type: location.type,
      sub_type: location.sub_type,
      color_code: location.color_code,
      dimensions: location.dimensions,
      capacity: location.capacity,
      grid_layout: location.grid_layout,
      compartments: location.compartments,
      render_style: location.render_style,
      description: location.description,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al guardar asignación de almacenamiento');
  }
}

export async function updateDeckLocationApi(deckId: string, storageLocationId: string | null, compartmentIndex: number = 0): Promise<void> {
  const res = await fetch(`/api/decks/${deckId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storage_location_id: storageLocationId, compartment_index: compartmentIndex }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al actualizar ubicación del mazo');
  }
}

export async function moveDeckCardsApi(deckId: string, targetStorageLocationId: string | null, targetCompartmentIndex: number): Promise<void> {
  const res = await fetch('/api/collection/cards', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'move_deck_cards',
      target_deck_id: deckId,
      target_storage_location_id: targetStorageLocationId,
      target_compartment_index: targetCompartmentIndex,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al mover cartas del mazo');
  }
}
