import test from 'node:test';
import assert from 'node:assert/strict';
import { UserCard } from '../src/types/collection';
import { createMoveCardHistoryItem } from '../src/components/collection/workspace/containerWorkspace.utils';

test('Workspace Facade & Pure Utilities Suite', async (t) => {
  await t.test('createMoveCardHistoryItem genera el snapshot correcto de migración física', () => {
    const mockCard: UserCard = {
      id: 'card-abc-123',
      card_id: 89631139,
      storage_location_id: 'box-1',
      compartment_index: 0,
      binder_page: 2,
      binder_slot: 5,
      quantity: 3,
      rarity: 'Ultra Rare',
      condition: 'Near Mint',
      status_flag: 'collection',
      language: 'en',
      sleeve_type: 'none',
      created_at: '2026-01-01T00:00:00.000Z',
    };

    const item = createMoveCardHistoryItem(mockCard, 'box-2', 1, 3, 7);

    assert.equal(item.id, 'card-abc-123');
    assert.equal(item.prevLocationId, 'box-1');
    assert.equal(item.newLocationId, 'box-2');
    assert.equal(item.prevCompartment, 0);
    assert.equal(item.newCompartment, 1);
    assert.equal(item.prevPage, 2);
    assert.equal(item.newPage, 3);
    assert.equal(item.prevSlot, 5);
    assert.equal(item.newSlot, 7);
    assert.equal(item.newCard.storage_location_id, 'box-2');
    assert.equal(item.newCard.compartment_index, 1);
    assert.equal(item.newCard.binder_page, 3);
    assert.equal(item.newCard.binder_slot, 7);
  });

  await t.test('createMoveCardHistoryItem maneja traslados a Inbox (null location) y reseteo de página', () => {
    const mockCard: UserCard = {
      id: 'card-xyz-999',
      card_id: 46986414,
      storage_location_id: 'binder-alpha',
      compartment_index: 2,
      binder_page: 4,
      binder_slot: 1,
      quantity: 1,
      rarity: 'Secret Rare',
      condition: 'Near Mint',
      status_flag: 'collection',
      language: 'es',
      sleeve_type: 'none',
      created_at: '2026-01-01T00:00:00.000Z',
    };

    const item = createMoveCardHistoryItem(mockCard, null, 0, null, null);

    assert.equal(item.newLocationId, null);
    assert.equal(item.newCompartment, 0);
    assert.equal(item.newPage, null);
    assert.equal(item.newSlot, null);
    assert.equal(item.newCard.storage_location_id, null);
    assert.equal(item.newCard.compartment_index, 0);
    assert.equal(item.newCard.binder_page, undefined);
    assert.equal(item.newCard.binder_slot, undefined);
  });
});
