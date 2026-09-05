import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

interface MockUserCard {
  id: string;
  card_id: number;
  name: string;
  copies: number;
  rarity?: string;
  condition?: string;
  language?: string;
  is_proxy?: boolean;
  status_flag?: string;
  storage_location_id?: string | null;
  storage_lane_id?: string | null;
  deck_id?: string | null;
  deck_section?: string | null;
}

interface MockDeck {
  id: string;
  name: string;
  storage_location_id?: string | null;
  storage_lane_id?: string | null;
}

describe('Collection Card Movement & Location Auto-binding', () => {
  const mockCard: MockUserCard = {
    id: 'user-card-1',
    card_id: 14558127,
    name: 'Ash Blossom & Joyous Spring',
    copies: 3,
    rarity: 'Secret Rare',
    condition: 'Near Mint',
    language: 'EN',
    is_proxy: false,
    status_flag: 'inventory',
    storage_location_id: 'box-a',
    storage_lane_id: 'lane-1',
    deck_id: null,
    deck_section: null,
  };

  const mockTargetDeck: MockDeck = {
    id: 'deck-tenpai-01',
    name: 'Tenpai Dragon Going Second',
    storage_location_id: 'box-c',
    storage_lane_id: 'lane-deck-slot',
  };

  it('moves a card to a deck and auto-binds deck location and lane', () => {
    // Simular lógica ejecutada en CollectionCardLocationField al seleccionar deck
    const selectedVal = `deck:${mockTargetDeck.id}`;
    let updatedCard = { ...mockCard };

    if (selectedVal.startsWith('deck:')) {
      const targetDeckId = selectedVal.replace('deck:', '');
      assert.equal(targetDeckId, mockTargetDeck.id);

      updatedCard = {
        ...updatedCard,
        deck_id: mockTargetDeck.id,
        deck_section: 'main',
        status_flag: 'in_deck',
        storage_location_id: mockTargetDeck.storage_location_id ?? null,
        storage_lane_id: mockTargetDeck.storage_lane_id ?? null,
      };
    }

    assert.equal(updatedCard.deck_id, 'deck-tenpai-01');
    assert.equal(updatedCard.status_flag, 'in_deck');
    assert.equal(updatedCard.deck_section, 'main');
    assert.equal(updatedCard.storage_location_id, 'box-c');
    assert.equal(updatedCard.storage_lane_id, 'lane-deck-slot');
  });

  it('unlinks deck when moving card back to Inbox', () => {
    const cardInDeck: MockUserCard = {
      ...mockCard,
      deck_id: 'deck-tenpai-01',
      status_flag: 'in_deck',
      deck_section: 'main',
    };

    const selectedVal = 'inbox';
    let updatedCard = { ...cardInDeck };

    if (selectedVal === 'inbox') {
      updatedCard = {
        ...updatedCard,
        storage_location_id: null,
        storage_lane_id: null,
        deck_id: null,
        deck_section: null,
        status_flag: 'inbox',
      };
    }

    assert.equal(updatedCard.storage_location_id, null);
    assert.equal(updatedCard.deck_id, null);
    assert.equal(updatedCard.deck_section, null);
    assert.equal(updatedCard.status_flag, 'inbox');
  });

  it('moves card to a physical container and detaches from any deck', () => {
    const cardInDeck: MockUserCard = {
      ...mockCard,
      deck_id: 'deck-tenpai-01',
      status_flag: 'in_deck',
    };

    const targetBoxId = 'binder-staples';
    const updatedCard: MockUserCard = {
      ...cardInDeck,
      storage_location_id: targetBoxId,
      storage_lane_id: null,
      deck_id: null,
      deck_section: null,
      status_flag: 'inventory',
    };

    assert.equal(updatedCard.storage_location_id, 'binder-staples');
    assert.equal(updatedCard.deck_id, null);
    assert.equal(updatedCard.status_flag, 'inventory');
  });
});

describe('Collection Card Properties & Options Validation', () => {
  it('validates language and rarity constants', () => {
    const validLanguages = ['ES', 'EN', 'JP', 'KR', 'DE', 'FR', 'IT', 'PT'];
    const validRarities = [
      'Common',
      'Rare',
      'Super Rare',
      'Ultra Rare',
      'Secret Rare',
      'Starlight Rare',
      'Quarter Century Secret Rare',
      'Collector Rare',
      'Ultimate Rare',
      'Ghost Rare',
      'Gold Rare',
    ];

    assert.ok(validLanguages.includes('EN'));
    assert.ok(validLanguages.includes('ES'));
    assert.ok(validRarities.includes('Secret Rare'));
    assert.ok(validRarities.includes('Quarter Century Secret Rare'));
  });

  it('updates card properties without mutating unrelated fields', () => {
    const baseCard: MockUserCard = {
      id: 'card-01',
      card_id: 12345,
      name: 'Effect Veiler',
      copies: 1,
      rarity: 'Ultra Rare',
      condition: 'Near Mint',
      language: 'EN',
      is_proxy: false,
    };

    const changes = {
      rarity: 'Quarter Century Secret Rare',
      condition: 'Mint',
      copies: 3,
    };

    const updated = { ...baseCard, ...changes };

    assert.equal(updated.name, 'Effect Veiler');
    assert.equal(updated.rarity, 'Quarter Century Secret Rare');
    assert.equal(updated.condition, 'Mint');
    assert.equal(updated.copies, 3);
    assert.equal(updated.language, 'EN');
    assert.equal(updated.is_proxy, false);
  });
});
