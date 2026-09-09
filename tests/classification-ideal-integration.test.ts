import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCardClassification } from '../src/lib/cardClassificationEngine';
import { analyzeCollectionSuggestions } from '../src/lib/collectionSuggestions';
import { UserCard, StorageLocation, Deck } from '../src/types/collection';

describe('Integration Tests: Motor de Clasificación de Cartas & Asignación Táctica', () => {
  const mockLocationBinder: StorageLocation = {
    id: 'binder-staples-1',
    name: 'Binder 1 - Staples Competitivas',
    type: 'binder',
    sub_type: 'binder_3x3',
    color_code: '#ef4444',
    dimensions: { width: 30, height: 30, depth: 5 },
    capacity: 360,
    grid_layout: { rows: 3, cols: 3, pockets_per_page: 9, total_pages: 40 },
    compartments: { count: 1, names: ['Principal'] },
    render_style: 'standard',
    created_at: new Date().toISOString(),
  };

  const mockLocationBox: StorageLocation = {
    id: 'box-megadeck-1',
    name: 'Megadeckbox 1800',
    type: 'box',
    sub_type: 'box_multi_row',
    color_code: '#3b82f6',
    dimensions: { width: 40, height: 20, depth: 15 },
    capacity: 1800,
    grid_layout: { rows: 1, cols: 4, pockets_per_page: 450, total_pages: 1 },
    compartments: { count: 4, names: ['Comp A', 'Comp B', 'Comp C', 'Comp D'] },
    render_style: 'lanes',
    created_at: new Date().toISOString(),
  };

  it('integra necesidad de baraja y recomienda completar deck prioritario (deck_completion)', () => {
    const cardId = 54447022; // Aluber the Jester of Despia
    const targetDeck: Deck = {
      id: 'deck-branded-01',
      name: 'Branded Despia Tournament',
      format: 'Master Duel',
      description: 'Deck competitivo principal',
      cards: [
        { card_id: cardId, section: 'main', count: 3 },
      ],
      created_at: new Date().toISOString(),
    };

    // Solo 1 copia está asignada actualmente a este deck
    const existingUserCards: UserCard[] = [
      {
        id: 'uc-1',
        card_id: cardId,
        storage_location_id: null,
        deck_id: targetDeck.id,
        deck_section: 'main',
        compartment_index: 0,
        rarity: 'Ultra Rare',
        condition: 'Near Mint',
        language: 'EN',
        quantity: 1,
        status_flag: 'in_deck',
        sleeve_type: 'single',
        created_at: new Date().toISOString(),
        card_details: {
          name: 'Aluber the Jester of Despia',
          type: 'Effect Monster',
          archetype: 'Despia',
        },
      },
    ];

    // Nueva carta libre encontrada o en inbox
    const newCardCandidate = {
      card_id: cardId,
      rarity: 'Ultra Rare',
      status_flag: 'workshop' as const,
      quantity: 1,
      card_details: {
        name: 'Aluber the Jester of Despia',
        type: 'Effect Monster',
        archetype: 'Despia',
      },
    };

    const report = analyzeCardClassification(
      newCardCandidate,
      existingUserCards,
      [targetDeck],
      [mockLocationBinder, mockLocationBox]
    );

    assert.equal(report.cardId, cardId);
    assert.equal(report.deckMatches.length, 1);
    assert.equal(report.deckMatches[0].deckId, targetDeck.id);
    assert.equal(report.deckMatches[0].neededCopies, 2); // 3 requeridas - 1 asignada
    assert.equal(report.bestRecommendation.category, 'deck_completion');
    assert.equal(report.bestRecommendation.suggestedDeckId, targetDeck.id);
  });

  it('detecta excedentes (>3 copias) y recomienda venta/intercambio (surplus_sale)', () => {
    const cardId = 14558127; // Ash Blossom & Joyous Spring
    // El usuario tiene 5 copias en su colección
    const existingUserCards: UserCard[] = [
      {
        id: 'uc-ash-1',
        card_id: cardId,
        storage_location_id: mockLocationBinder.id,
        compartment_index: 0,
        rarity: 'Super Rare',
        condition: 'Near Mint',
        language: 'EN',
        quantity: 5,
        status_flag: 'collection',
        sleeve_type: 'single',
        created_at: new Date().toISOString(),
        card_details: {
          name: 'Ash Blossom & Joyous Spring',
          type: 'Tuner Monster',
        },
      },
    ];

    const targetCard = {
      card_id: cardId,
      rarity: 'Super Rare',
      quantity: 1,
      card_details: {
        name: 'Ash Blossom & Joyous Spring',
        type: 'Tuner Monster',
      },
    };

    const report = analyzeCardClassification(targetCard, existingUserCards, [], [mockLocationBinder]);

    assert.equal(report.surplus.totalPhysicalInInventory, 5);
    assert.equal(report.surplus.isPlaysetComplete, true);
    assert.equal(report.surplus.isSurplus, true);
    assert.equal(report.surplus.surplusCopies, 2);
    assert.equal(report.bestRecommendation.category, 'surplus_sale');
    assert.equal(report.bestRecommendation.suggestedStatusFlag, 'trade_sale');
  });

  it('protege cartas de alta rareza recomendando guardado en binder (collection_protect)', () => {
    const cardId = 46986414; // Dark Magician en Quarter Century Secret Rare
    const highRarityCard = {
      card_id: cardId,
      rarity: 'Quarter Century Secret Rare',
      quantity: 1,
      card_details: {
        name: 'Dark Magician',
        type: 'Normal Monster',
      },
    };

    const report = analyzeCardClassification(highRarityCard, [], [], [mockLocationBinder, mockLocationBox]);

    assert.equal(report.collectionTier.isHighRarity, true);
    assert.equal(report.collectionTier.rarityName, 'Quarter Century Secret Rare');
    assert.equal(report.bestRecommendation.category, 'collection_protect');
    assert.equal(report.bestRecommendation.suggestedStatusFlag, 'collection');
    assert.equal(report.bestRecommendation.suggestedLocationId, mockLocationBinder.id);
  });
});

describe('Integration Tests: Motor de Sugerencias de Colección y Detección Cruzada', () => {
  it('detecta duplicados dispersos en diferentes contenedores físicos para consolidación', () => {
    const cardId = 23434538; // Maxx "C"
    const userCardsWithDuplicates: UserCard[] = [
      {
        id: 'c-box-1',
        card_id: cardId,
        storage_location_id: 'box-1',
        compartment_index: 0,
        rarity: 'Secret Rare',
        condition: 'Near Mint',
        language: 'EN',
        quantity: 1,
        status_flag: 'collection',
        sleeve_type: 'single',
        created_at: new Date().toISOString(),
        card_details: { name: 'Maxx "C"', type: 'Effect Monster' },
      },
      {
        id: 'c-tin-1',
        card_id: cardId,
        storage_location_id: 'tin-1',
        compartment_index: 0,
        rarity: 'Secret Rare',
        condition: 'Near Mint',
        language: 'EN',
        quantity: 1,
        status_flag: 'collection',
        sleeve_type: 'single',
        created_at: new Date().toISOString(),
        card_details: { name: 'Maxx "C"', type: 'Effect Monster' },
      },
    ];

    const locations: StorageLocation[] = [
      {
        id: 'box-1',
        name: 'Caja 1',
        type: 'box',
        sub_type: 'standard',
        color_code: '#333',
        dimensions: { width: 10, height: 10, depth: 10 },
        capacity: 100,
        grid_layout: { rows: 1, cols: 1, pockets_per_page: 100, total_pages: 1 },
        compartments: { count: 1, names: ['Main'] },
        render_style: 'standard',
        created_at: new Date().toISOString(),
      },
      {
        id: 'tin-1',
        name: 'Lata 1',
        type: 'tin',
        sub_type: 'standard',
        color_code: '#666',
        dimensions: { width: 10, height: 10, depth: 10 },
        capacity: 100,
        grid_layout: { rows: 1, cols: 1, pockets_per_page: 100, total_pages: 1 },
        compartments: { count: 1, names: ['Main'] },
        render_style: 'standard',
        created_at: new Date().toISOString(),
      },
    ];

    const result = analyzeCollectionSuggestions(userCardsWithDuplicates, locations, []);
    assert.ok(result.stats.totalDispersedDuplicates >= 1, 'Should detect at least 1 dispersed duplicate');

    const duplicateEntry = result.duplicateSuggestions.find(d => d.card_id === cardId);
    assert.ok(duplicateEntry, 'Duplicate entry for Maxx "C" must be present');
    assert.equal(duplicateEntry.hasDuplicatesInOtherContainers, true);
    assert.equal(duplicateEntry.locations.length, 2);
  });

  it('detecta arquetipos viables y calcula conteo y puntuación de completitud', () => {
    const tenpaiCards: UserCard[] = [
      {
        id: 't-1',
        card_id: 10001,
        storage_location_id: 'box-1',
        compartment_index: 0,
        rarity: 'Ultra Rare',
        condition: 'Near Mint',
        language: 'EN',
        quantity: 3,
        status_flag: 'collection',
        sleeve_type: 'single',
        created_at: new Date().toISOString(),
        card_details: { name: 'Tenpai Dragon Paidra', type: 'Effect Monster', archetype: 'Tenpai Dragon' },
      },
      {
        id: 't-2',
        card_id: 10002,
        storage_location_id: 'box-1',
        compartment_index: 0,
        rarity: 'Super Rare',
        condition: 'Near Mint',
        language: 'EN',
        quantity: 3,
        status_flag: 'collection',
        sleeve_type: 'single',
        created_at: new Date().toISOString(),
        card_details: { name: 'Tenpai Dragon Chundra', type: 'Effect Monster', archetype: 'Tenpai Dragon' },
      },
      {
        id: 't-3',
        card_id: 10003,
        storage_location_id: 'box-1',
        compartment_index: 0,
        rarity: 'Common',
        condition: 'Near Mint',
        language: 'EN',
        quantity: 3,
        status_flag: 'collection',
        sleeve_type: 'single',
        created_at: new Date().toISOString(),
        card_details: { name: 'Sangen Kaimen', type: 'Quick-Play Spell', archetype: 'Tenpai Dragon' },
      },
    ];

    const result = analyzeCollectionSuggestions(tenpaiCards, [], []);
    assert.ok(result.stats.totalArchetypesDetected >= 1);

    const tenpaiGroup = result.archetypeSuggestions.find(a => a.archetype === 'Tenpai Dragon');
    assert.ok(tenpaiGroup, 'Tenpai Dragon archetype group must be detected');
    assert.equal(tenpaiGroup.distinctCardsCount, 3);
    assert.equal(tenpaiGroup.totalCardsCount, 9);
    assert.ok(tenpaiGroup.completionScore > 0);
  });
});
