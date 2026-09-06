import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeVariantDiff } from '../src/lib/deck/variant-diff.utils';
import { DeckCard } from '../src/components/deckbuilder/types';
import { DeckVariantCard, UserCard, StorageLocation, Deck } from '../src/types/collection';

describe('Sistema de Variantes de Decks — Cálculos de Dominio e Intercambio Físico', () => {
  // Mock de cartas base
  const mockCardPkBoots: DeckCard = {
    id: 1001,
    name: 'The Phantom Knights of Silent Boots',
    count: 3,
    section: 'main',
    type: 'Monster',
    image_url: 'https://images.ygoprodeck.com/images/cards/1001.jpg',
  };

  const mockCardPkScales: DeckCard = {
    id: 1002,
    name: 'The Phantom Knights of Torn Scales',
    count: 3,
    section: 'main',
    type: 'Monster',
    image_url: 'https://images.ygoprodeck.com/images/cards/1002.jpg',
  };

  const mockCardRite: DeckCard = {
    id: 2001,
    name: 'Rite of Aramesir',
    count: 1,
    section: 'main',
    type: 'Spell',
    image_url: 'https://images.ygoprodeck.com/images/cards/2001.jpg',
  };

  const mockCardEnchantress: DeckCard = {
    id: 2002,
    name: 'Water Enchantress of the Temple',
    count: 1,
    section: 'main',
    type: 'Monster',
    image_url: 'https://images.ygoprodeck.com/images/cards/2002.jpg',
  };

  const mockCurrentCards: DeckCard[] = [
    mockCardPkBoots,
    mockCardPkScales,
    mockCardRite,
    mockCardEnchantress,
  ];

  it('calcula correctamente las cartas que salen a reserva cuando se reemplaza un motor (Adventure -> Horus)', () => {
    // Objetivo: Variante Horus mantiene PK Boots x3, reduce Torn Scales a 2, saca Rite y Enchantress, y mete Imsety x3
    const targetCards: DeckVariantCard[] = [
      { card_id: 1001, count: 3, section: 'main' }, // Boots x3 (sin cambios)
      { card_id: 1002, count: 2, section: 'main' }, // Scales x2 (1 sale a reserva)
      { card_id: 3001, count: 3, section: 'main' }, // Imsety x3 (nuevo motor)
    ];

    const diff = computeVariantDiff({
      currentCards: mockCurrentCards,
      targetCards,
    });

    // Deben salir a reserva: 1 copia de Torn Scales, 1 de Rite y 1 de Enchantress
    assert.equal(diff.toRemoveFromActive.length, 3);

    const removedScales = diff.toRemoveFromActive.find((c) => c.card_id === 1002);
    assert.ok(removedScales);
    assert.equal(removedScales.count, 1);
    assert.equal(removedScales.fromSection, 'main');

    const removedRite = diff.toRemoveFromActive.find((c) => c.card_id === 2001);
    assert.ok(removedRite);
    assert.equal(removedRite.count, 1);

    const removedEnchantress = diff.toRemoveFromActive.find((c) => c.card_id === 2002);
    assert.ok(removedEnchantress);
    assert.equal(removedEnchantress.count, 1);
  });

  it('identifica con precisión el Core Invariable que permanece idéntico', () => {
    const targetCards: DeckVariantCard[] = [
      { card_id: 1001, count: 3, section: 'main' }, // Boots x3 (3 inalteradas)
      { card_id: 1002, count: 2, section: 'main' }, // Scales x2 (2 inalteradas)
      { card_id: 3001, count: 3, section: 'main' },
    ];

    const diff = computeVariantDiff({
      currentCards: mockCurrentCards,
      targetCards,
    });

    // Core inalterado: Boots x3 y Scales x2
    assert.equal(diff.unchangedCore.length, 2);
    const coreBoots = diff.unchangedCore.find((c) => c.card_id === 1001);
    assert.equal(coreBoots?.count, 3);
    const coreScales = diff.unchangedCore.find((c) => c.card_id === 1002);
    assert.equal(coreScales?.count, 2);
  });

  it('detecta cartas provenientes de la misma Deckbox (Pool Local) vs externas', () => {
    const deckboxId = 'deckbox-pk-01';
    const currentDeckId = 'deck-pk-master';

    const targetCards: DeckVariantCard[] = [
      { card_id: 1001, count: 3, section: 'main' },
      { card_id: 3001, count: 2, section: 'main' }, // Imsety (en la deckbox pool)
      { card_id: 4001, count: 1, section: 'main' }, // Sarcophagus (en carpeta Binder)
    ];

    const locations: StorageLocation[] = [
      {
        id: deckboxId,
        name: 'Deckbox Phantom Knights (Black)',
        type: 'deckbox',
        sub_type: 'standard',
        color_code: '#000000',
        capacity: 100,
        dimensions: { width: 0, height: 0, depth: 0 },
        grid_layout: { rows: 1, cols: 1, pockets_per_page: 1, total_pages: 1 },
        compartments: { count: 1, names: ['Principal'] },
        render_style: 'deckbox',
        created_at: new Date().toISOString(),
      },
      {
        id: 'binder-staples',
        name: 'Carpeta Staples Vault',
        type: 'binder',
        sub_type: 'standard',
        color_code: '#3b82f6',
        capacity: 360,
        dimensions: { width: 0, height: 0, depth: 0 },
        grid_layout: { rows: 3, cols: 3, pockets_per_page: 9, total_pages: 40 },
        compartments: { count: 1, names: ['Principal'] },
        render_style: 'binder',
        created_at: new Date().toISOString(),
      },
    ];

    const userCards: UserCard[] = [
      {
        id: 'uc-imsety-1',
        card_id: 3001,
        storage_location_id: deckboxId,
        deck_id: currentDeckId,
        deck_section: 'pool',
        compartment_index: 0,
        quantity: 2,
        rarity: 'Ultra Rare',
        condition: 'Near Mint',
        language: 'en',
        status_flag: 'in_deck',
        sleeve_type: 'single',
        created_at: new Date().toISOString(),
      },
      {
        id: 'uc-sarc-1',
        card_id: 4001,
        storage_location_id: 'binder-staples',
        deck_id: null,
        deck_section: null,
        compartment_index: 0,
        quantity: 1,
        rarity: 'Super Rare',
        condition: 'Near Mint',
        language: 'en',
        status_flag: 'collection',
        sleeve_type: 'single',
        created_at: new Date().toISOString(),
      },
    ];

    const diff = computeVariantDiff({
      currentCards: [mockCardPkBoots],
      targetCards,
      userCards,
      locations,
      currentDeckId,
      currentLocationId: deckboxId,
    });

    const imsetyEntry = diff.toAddToActive.find((c) => c.card_id === 3001);
    assert.ok(imsetyEntry);
    assert.equal(imsetyEntry.sourceLocation?.isCrossDeckLoan, false);
    assert.equal(imsetyEntry.sourceLocation?.locationId, deckboxId);

    const sarcEntry = diff.toAddToActive.find((c) => c.card_id === 4001);
    assert.ok(sarcEntry);
    assert.equal(sarcEntry.sourceLocation?.locationId, 'binder-staples');
    assert.equal(sarcEntry.sourceLocation?.locationName, 'Carpeta Staples Vault');
  });

  it('detecta préstamos entre diferentes Decks (ej. Motor Shaddoll prestado desde Invoked a Branded)', () => {
    const brandedDeckId = 'deck-branded';
    const invokedDeckId = 'deck-invoked';

    const decks: Deck[] = [
      {
        id: invokedDeckId,
        name: 'Invoked Dogmatika',
        format: 'TCG',
        created_at: new Date().toISOString(),
      },
      {
        id: brandedDeckId,
        name: 'Branded Despia',
        format: 'TCG',
        created_at: new Date().toISOString(),
      },
    ];

    const targetCards: DeckVariantCard[] = [
      { card_id: 5001, count: 1, section: 'extra' }, // El Shaddoll Winda
    ];

    const userCards: UserCard[] = [
      {
        id: 'uc-winda-1',
        card_id: 5001,
        storage_location_id: 'box-invoked',
        deck_id: invokedDeckId,
        deck_section: 'extra',
        quantity: 1,
        rarity: 'Secret Rare',
        condition: 'Near Mint',
        language: 'en',
        status_flag: 'in_deck',
        compartment_index: 0,
        sleeve_type: 'single',
        created_at: new Date().toISOString(),
      },
    ];

    const diff = computeVariantDiff({
      currentCards: [],
      targetCards,
      userCards,
      decks,
      currentDeckId: brandedDeckId,
    });

    const windaEntry = diff.toAddToActive.find((c) => c.card_id === 5001);
    assert.ok(windaEntry);
    assert.equal(windaEntry.sourceLocation?.isCrossDeckLoan, true);
    assert.equal(windaEntry.sourceLocation?.deckName, 'Invoked Dogmatika');
  });

  it('marca correctamente cartas faltantes no presentes en la colección física para proxy/wishlist', () => {
    const targetCards: DeckVariantCard[] = [
      { card_id: 9999, count: 3, section: 'main' }, // Carta no poseída
    ];

    const diff = computeVariantDiff({
      currentCards: [],
      targetCards,
      userCards: [],
    });

    const missingEntry = diff.toAddToActive.find((c) => c.card_id === 9999);
    assert.ok(missingEntry);
    assert.equal(missingEntry.isMissing, true);
    assert.equal(missingEntry.count, 3);
  });
});
