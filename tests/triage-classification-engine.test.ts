import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateWorkshopSalad,
  getCompetitiveDeckMatches,
  getThematicIncubators,
  diagnoseCardTriage,
  isCardPendingTriage,
} from '../src/lib/triageClassification.utils';
import { UserCard, Deck } from '../src/types/collection';

describe('triageClassification.utils (Node:test)', () => {
  it('identifica correctamente monstruos vainilla como excelentes para talleres didácticos', () => {
    const vanillaCard: UserCard = {
      id: 'uuid-vanilla-1',
      card_id: 46986414,
      storage_location_id: 'loc-1',
      compartment_index: 0,
      rarity: 'Common',
      condition: 'Near Mint',
      language: 'EN',
      quantity: 1,
      status_flag: 'bulk',
      sleeve_type: 'none',
      created_at: new Date().toISOString(),
      card_details: {
        name: 'Dark Magician',
        type: 'Normal Monster',
        desc: 'The ultimate wizard in terms of attack and defense.',
        atk: 2500,
        def: 2100,
        level: 7,
        race: 'Spellcaster',
        attribute: 'DARK',
      },
    };

    const result = evaluateWorkshopSalad(vanillaCard);
    assert.strictEqual(result.isCandidateForWorkshop, true);
    assert.ok(result.score >= 70);
    assert.ok(result.reasons.some(r => r.includes('Monstruo Vainilla')));
  });

  it('descarta cartas con muros de texto complejos y cláusulas xenófobas de arquetipo para taller', () => {
    const complexCard: UserCard = {
      id: 'uuid-complex-1',
      card_id: 99999999,
      storage_location_id: 'loc-1',
      compartment_index: 0,
      rarity: 'Ultra Rare',
      condition: 'Near Mint',
      language: 'EN',
      quantity: 1,
      status_flag: 'collection',
      sleeve_type: 'none',
      created_at: new Date().toISOString(),
      card_details: {
        name: 'Super Hyper Arquetipo Dragon',
        type: 'Effect Monster',
        archetype: 'HyperArch',
        desc: 'If this card is Special Summoned: You can activate 1 HyperArch Spell from your deck, also for the rest of this turn you cannot Special Summon monsters, except HyperArch monsters. During either player\'s turn, when an opponent activates a card or effect that would destroy a card on the field while you control 3 or more monsters with different attributes: You can banish 2 cards from your GY; negate the activation and destroy it, then draw 1 card for each banished card.',
        atk: 3000,
        def: 2500,
        level: 10,
        race: 'Dragon',
        attribute: 'LIGHT',
      },
    };

    const result = evaluateWorkshopSalad(complexCard);
    assert.strictEqual(result.isCandidateForWorkshop, false);
    assert.ok(result.score < 50);
  });

  it('detecta matches competitivos de mazos activos que requieren copias físicas', () => {
    const decks: Deck[] = [
      {
        id: 'deck-branded-1',
        name: 'Branded Despia 2026',
        format: 'Advanced TCG',
        is_active: true,
        cards: [
          {
            card_id: 14558127,
            count: 3,
            section: 'main',
            physical_copies: [{ is_proxy: false }],
          },
        ],
        created_at: new Date().toISOString(),
      },
    ];

    const matches = getCompetitiveDeckMatches(14558127, decks);
    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].deckName, 'Branded Despia 2026');
    assert.strictEqual(matches[0].neededCopies, 2);
  });

  it('agrupa cartas en incubadoras temáticas por raza cuando no tienen arquetipo oficial', () => {
    const pyroCard: UserCard = {
      id: 'uuid-pyro-1',
      card_id: 111111,
      storage_location_id: 'loc-1',
      compartment_index: 0,
      rarity: 'Common',
      condition: 'Near Mint',
      language: 'EN',
      quantity: 1,
      status_flag: 'bulk',
      sleeve_type: 'none',
      created_at: new Date().toISOString(),
      card_details: {
        name: 'Flame Champion',
        type: 'Effect Monster',
        race: 'Pyro',
        attribute: 'FIRE',
        desc: 'Deals 500 damage when destroyed.',
      },
    };

    const allCards: UserCard[] = [
      pyroCard,
      ...Array.from({ length: 15 }, (_, i) => ({
        id: `uuid-pyro-extra-${i}`,
        card_id: 200000 + i,
        storage_location_id: 'loc-1',
        compartment_index: 0,
        rarity: 'Common',
        condition: 'Near Mint' as const,
        language: 'EN',
        quantity: 1,
        status_flag: 'bulk' as const,
        sleeve_type: 'none' as const,
        created_at: new Date().toISOString(),
        card_details: {
          name: `Pyro Friend #${i}`,
          type: 'Effect Monster',
          race: 'Pyro',
        },
      })),
    ];

    const incubators = getThematicIncubators(pyroCard, allCards);
    const pyroIncubator = incubators.find(i => i.themeName === 'Pyro');
    assert.ok(pyroIncubator);
    assert.strictEqual(pyroIncubator?.totalCardsInCollection, 16);
    assert.strictEqual(pyroIncubator?.hasEnoughForCore, false); // Razas amplias no constituyen core
  });

  it('evalúa Dogu recomendando Desechar a Bulk a pesar de sus 1900 ATK debido a su efecto lento en End Phase y falta de arquetipo', () => {
    const doguCard: UserCard = {
      id: 'uuid-dogu-1',
      card_id: 28357177,
      storage_location_id: 'loc-1',
      compartment_index: 0,
      rarity: 'Common',
      condition: 'Near Mint',
      language: 'EN',
      quantity: 1,
      status_flag: 'bulk',
      sleeve_type: 'none',
      created_at: new Date().toISOString(),
      card_details: {
        name: 'Dogu',
        type: 'Effect Monster',
        race: 'Rock',
        attribute: 'EARTH',
        level: 4,
        atk: 1900,
        def: 0,
        desc: "During the End Phase, if this card is in the Graveyard because it was sent there by an opponent's card effect this turn while in your possession: You can add, from your Deck to your hand, 1 monster with a different Level from the monsters you control and the monsters in your Graveyard. You can only use this effect of \"Dogu\" once per turn.",
      },
    };

    const diagnosis = diagnoseCardTriage(doguCard, [doguCard], []);
    assert.strictEqual(diagnosis.tacticalVerdict.action, 'bulk_discard');
    assert.ok(diagnosis.tacticalVerdict.headline.includes('Desechar a Bulk'));
    assert.ok(diagnosis.tacticalVerdict.statsAnalysis.includes('1900 ATK en Nivel 4'));
    assert.ok(diagnosis.tacticalVerdict.effectSpeedAnalysis.includes('Efecto Lento y Pasivo'));
    assert.ok(diagnosis.tacticalVerdict.themeViability.includes('NO justifica armar una baraja temática'));
    assert.ok(diagnosis.tacticalVerdict.recommendationDecision.includes('Bulk [6]'));
  });

  it('diagnostica la acción primaria correcta para una carta requerida por un mazo activo', () => {
    const card: UserCard = {
      id: 'uuid-card-1',
      card_id: 14558127,
      storage_location_id: 'loc-1',
      compartment_index: 0,
      rarity: 'Super Rare',
      condition: 'Near Mint',
      language: 'EN',
      quantity: 1,
      status_flag: 'bulk',
      sleeve_type: 'none',
      created_at: new Date().toISOString(),
      card_details: {
        name: 'Ash Blossom & Joyous Spring',
        type: 'Tuner Monster',
        race: 'Zombie',
        desc: 'Discard this card: negate an effect that adds a card from Deck to hand.',
      },
    };

    const decks: Deck[] = [
      {
        id: 'deck-1',
        name: 'Mazo Torneo',
        format: 'TCG',
        is_active: true,
        cards: [{ card_id: 14558127, count: 3, section: 'main', physical_copies: [] }],
        created_at: new Date().toISOString(),
      },
    ];

    const diagnosis = diagnoseCardTriage(card, [card], decks);
    assert.strictEqual(diagnosis.isStaple, true);
    assert.strictEqual(diagnosis.stapleTier, 'Tier 1');
    assert.strictEqual(diagnosis.suggestedPrimaryAction, 'active_deck');
  });

  it('recomienda Poner en Venta [5] para cartas inútiles sin mazo activo pero con cotización comercial ($1.20)', () => {
    const valuedUselessCard: UserCard = {
      id: 'uuid-val-1',
      card_id: 88888888,
      storage_location_id: 'loc-1',
      compartment_index: 0,
      rarity: 'Super Rare',
      condition: 'Near Mint',
      language: 'EN',
      quantity: 1,
      status_flag: 'bulk',
      sale_price: 1.20,
      sleeve_type: 'none',
      created_at: new Date().toISOString(),
      card_details: {
        name: 'Random Collector Foil Beast',
        type: 'Effect Monster',
        race: 'Beast',
        desc: 'When this card is Normal Summoned: gain 200 LP.',
      },
    };

    const diagnosis = diagnoseCardTriage(valuedUselessCard, [valuedUselessCard], []);
    assert.strictEqual(diagnosis.tacticalVerdict.action, 'trade_sale');
    assert.strictEqual(diagnosis.tacticalVerdict.actionNumber, 5);
    assert.ok(diagnosis.tacticalVerdict.headline.includes('Poner en Venta'));
    assert.ok(diagnosis.tacticalVerdict.recommendationDecision.includes('Deshazte de ella vendiéndola'));
  });

  it('descalifica monstruos de efecto con disparadores complejos de la ensalada didáctica de taller', () => {
    const doguCard: UserCard = {
      id: 'uuid-dogu-2',
      card_id: 28357177,
      storage_location_id: 'loc-1',
      compartment_index: 0,
      rarity: 'Common',
      condition: 'Near Mint',
      language: 'EN',
      quantity: 1,
      status_flag: 'bulk',
      sleeve_type: 'none',
      created_at: new Date().toISOString(),
      card_details: {
        name: 'Dogu',
        type: 'Effect Monster',
        race: 'Rock',
        desc: "During the End Phase, if this card is in the Graveyard because it was sent there by an opponent's card effect this turn: add 1 monster from Deck.",
      },
    };

    const result = evaluateWorkshopSalad(doguCard);
    assert.strictEqual(result.isCandidateForWorkshop, false);
    assert.ok(result.score <= 15);
  });

  it('acepta monstruos con invocaciones especiales sencillas o mecánicas de cementerio didácticas para taller', () => {
    const easySpecialSummonCard: UserCard = {
      id: 'uuid-extender-1',
      card_id: 77777777,
      storage_location_id: 'loc-1',
      compartment_index: 0,
      rarity: 'Common',
      condition: 'Near Mint',
      language: 'EN',
      quantity: 1,
      status_flag: 'bulk',
      sleeve_type: 'none',
      created_at: new Date().toISOString(),
      card_details: {
        name: 'Cyber Starter Beater',
        type: 'Effect Monster',
        race: 'Machine',
        atk: 1800,
        level: 4,
        desc: 'If you control no monsters, you can Special Summon this card from your hand. You can banish this card from your GY: target 1 card; destroy it.',
      },
    };

    const result = evaluateWorkshopSalad(easySpecialSummonCard);
    assert.strictEqual(result.isCandidateForWorkshop, true);
    assert.ok(result.score >= 65);
    assert.ok(result.reasons.some(r => r.includes('Invocación especial accesible')));
  });

  it('soporta etiquetado y limpieza de notas temáticas para mesas de trabajo específicas', () => {
    // 1. Asignación de Feedran a temática personalizada "Deck Dragón"
    const originalNotes = 'Carta intercambiada con Pedro';
    const tag = 'Deck Dragón';
    const cleanNotes = originalNotes.replace(/\[Tema:\s*[^\]]+\]\s*/gi, '').trim();
    const taggedNotes = `[Tema: ${tag}] ${cleanNotes}`.trim();

    assert.strictEqual(taggedNotes, '[Tema: Deck Dragón] Carta intercambiada con Pedro');

    // 2. Extracción de etiqueta para filtro de mesa de trabajo
    const match = taggedNotes.match(/\[Tema:\s*([^\]]+)\]/i);
    assert.ok(match);
    assert.strictEqual(match[1], 'Deck Dragón');

    // 3. Cuando la 4ta copia se descarta a bulk/crap, la etiqueta se limpia
    const bulkNotes = taggedNotes.replace(/\[Tema:\s*[^\]]+\]\s*/gi, '').trim();
    assert.strictEqual(bulkNotes, 'Carta intercambiada con Pedro');
    assert.strictEqual(Boolean(bulkNotes.match(/\[Tema:\s*[^\]]+\]/i)), false);
  });

  it('isCardPendingTriage identifica correctamente cartas no etiquetadas vs cartas ya categorizadas', () => {
    const baseCard: UserCard = {
      id: 'uuid-1',
      card_id: 12345,
      storage_location_id: 'loc-1',
      compartment_index: 0,
      rarity: 'Common',
      condition: 'Near Mint',
      language: 'ES',
      quantity: 1,
      status_flag: 'collection',
      sleeve_type: 'none',
      created_at: new Date().toISOString(),
    };

    // Pendiente
    assert.strictEqual(isCardPendingTriage(baseCard), true);

    // Con tema asignado -> NO pendiente
    assert.strictEqual(isCardPendingTriage({ ...baseCard, notes: '[Tema: Dragon Maid] Para mazo futuro' }), false);

    // En mazo -> NO pendiente
    assert.strictEqual(isCardPendingTriage({ ...baseCard, deck_id: 'deck-1' }), false);
    assert.strictEqual(isCardPendingTriage({ ...baseCard, status_flag: 'in_deck' }), false);

    // En taller o venta -> NO pendiente
    assert.strictEqual(isCardPendingTriage({ ...baseCard, status_flag: 'workshop' }), false);
    assert.strictEqual(isCardPendingTriage({ ...baseCard, status_flag: 'trade_sale' }), false);

    // Desechada a bulk -> NO pendiente
    assert.strictEqual(isCardPendingTriage({ ...baseCard, status_flag: 'bulk' }), false);

    // Con marca de triaje persistida -> NO pendiente
    assert.strictEqual(isCardPendingTriage({ ...baseCard, notes: '[Triaje: Colección Binder]' }), false);
  });

  it('evalúa veredicto táctico con puntuación de fuerza 1.0-10.0, rol técnico y economía de cartas', () => {
    const bossCard: UserCard = {
      id: 'uuid-boss',
      card_id: 99999990,
      storage_location_id: 'loc-1',
      compartment_index: 0,
      rarity: 'Secret Rare',
      condition: 'Near Mint',
      language: 'EN',
      quantity: 1,
      status_flag: 'collection',
      sleeve_type: 'none',
      created_at: new Date().toISOString(),
      card_details: {
        name: 'Accesscode Talker',
        type: 'Link Monster',
        race: 'Cyberse',
        desc: 'Cannot be negated. You can banish 1 Link Monster from your GY; destroy 1 card your opponent controls.',
      },
    };

    const diagnosis = diagnoseCardTriage(bossCard, [bossCard], []);
    const { tacticalVerdict } = diagnosis;
    assert.ok(tacticalVerdict.powerScore >= 1.0 && tacticalVerdict.powerScore <= 10.0);
    assert.ok(tacticalVerdict.tacticalRole.length > 0);
    assert.ok(tacticalVerdict.metaTier.length > 0);
    assert.ok(tacticalVerdict.cardEconomy.length > 0);
  });

  it('recalcula dinámicamente el veredicto táctico cuando se corrige el precio de una carta', () => {
    const unknownFoilCard: UserCard = {
      id: 'uuid-foil-1',
      card_id: 55555555,
      storage_location_id: 'loc-1',
      compartment_index: 0,
      rarity: 'Common',
      condition: 'Near Mint',
      language: 'EN',
      quantity: 1,
      status_flag: 'collection',
      sleeve_type: 'none',
      created_at: new Date().toISOString(),
      card_details: {
        name: 'Retro Foil Beast',
        type: 'Effect Monster',
        desc: 'Flip: gain 500 LP.',
      },
    };

    // 1. Con precio bajo/default ($0.10), el sistema sugiere desechar a Bulk
    const diagInitial = diagnoseCardTriage(unknownFoilCard, [unknownFoilCard], [], 0.10);
    assert.strictEqual(diagInitial.suggestedPrimaryAction, 'bulk_discard');
    assert.strictEqual(diagInitial.tacticalVerdict.actionNumber, 6);

    // 2. Al corregir el precio a $4.50 (carta cara/coleccionable), el veredicto cambia a Binder Colección [4]
    const diagCorrectedHigh = diagnoseCardTriage(unknownFoilCard, [unknownFoilCard], [], 4.50);
    assert.strictEqual(diagCorrectedHigh.suggestedPrimaryAction, 'collection_binder');
    assert.strictEqual(diagCorrectedHigh.tacticalVerdict.actionNumber, 4);

    // 3. Al corregir el precio a $1.20 (rango comercial), el veredicto cambia a Poner en Venta [5]
    const diagCorrectedTrade = diagnoseCardTriage(unknownFoilCard, [unknownFoilCard], [], 1.20);
    assert.strictEqual(diagCorrectedTrade.suggestedPrimaryAction, 'trade_sale');
    assert.strictEqual(diagCorrectedTrade.tacticalVerdict.actionNumber, 5);
  });

  it('detecta correctamente la sección Extra Deck para cartas de tipo Fusion, Synchro, XYZ y Link', () => {
    const isExtra = (type?: string): boolean => {
      if (!type) return false;
      const t = type.toLowerCase();
      return t.includes('fusion') || t.includes('synchro') || t.includes('xyz') || t.includes('link');
    };

    assert.strictEqual(isExtra('Fusion Monster'), true);
    assert.strictEqual(isExtra('Synchro/Tuner Monster'), true);
    assert.strictEqual(isExtra('XYZ Monster'), true);
    assert.strictEqual(isExtra('Link Monster'), true);
    assert.strictEqual(isExtra('Effect Monster'), false);
    assert.strictEqual(isExtra('Normal Monster'), false);
    assert.strictEqual(isExtra('Spell Card'), false);
    assert.strictEqual(isExtra('Trap Card'), false);
  });

  it('permite filtrar el alcance de triaje a cartas en Bulk sin excluirlas por sólo pendientes', () => {
    const card1: UserCard = {
      id: 'uuid-b1',
      card_id: 11111,
      storage_location_id: 'tin-bulk-id',
      compartment_index: 0,
      rarity: 'Common',
      condition: 'Near Mint',
      language: 'ES',
      quantity: 1,
      status_flag: 'bulk',
      sleeve_type: 'none',
      created_at: new Date().toISOString(),
    };

    const card2: UserCard = {
      id: 'uuid-b2',
      card_id: 22222,
      storage_location_id: 'binder-id',
      compartment_index: 0,
      rarity: 'Ultra Rare',
      condition: 'Near Mint',
      language: 'ES',
      quantity: 1,
      status_flag: 'collection',
      sleeve_type: 'none',
      created_at: new Date().toISOString(),
    };

    const allCards = [card1, card2];
    const targetBulkLocationId = 'tin-bulk-id';

    // Función de filtrado idéntica a useTriageState para scopeType === 'bulk'
    const bulkFiltered = allCards.filter(
      c => c.status_flag === 'bulk' || (targetBulkLocationId && c.storage_location_id === targetBulkLocationId)
    );

    assert.strictEqual(bulkFiltered.length, 1);
    assert.strictEqual(bulkFiltered[0].id, 'uuid-b1');
  });
});

