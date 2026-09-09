import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  combinations,
  hypergeometricPMF,
  hypergeometricAtLeast,
  simulateHands,
} from '../src/lib/engines/hypergeometric';
import {
  canSummonExtraDeckCard,
  isSearcherUsefulInDeck,
  extractCardBasicInfo,
  CardBasicInfo,
} from '../src/lib/engines/mechanicsValidator';

describe('Unit Tests: Motor Hipergeométrico y Probabilidades de Apertura', () => {
  it('calcula coeficientes binomiales correctamente (C(n, k))', () => {
    assert.equal(combinations(40, 0), 1);
    assert.equal(combinations(40, 1), 40);
    assert.equal(combinations(40, 40), 1);
    assert.equal(combinations(5, 2), 10);
    assert.equal(combinations(40, 5), 658008);
    // Casos borde
    assert.equal(combinations(5, -1), 0);
    assert.equal(combinations(5, 6), 0);
  });

  it('calcula probabilidad exacta (PMF) de robar starters en mano inicial de 5', () => {
    // Deck de 40 cartas con 3 copias de una carta específica (ej. 3x Ash Blossom)
    // Probabilidad de robar exactamente 1 copia en mano de 5:
    // C(3, 1) * C(37, 4) / C(40, 5) = (3 * 66045) / 658008 ~= 0.3011
    const pmf1 = hypergeometricPMF(40, 3, 5, 1);
    assert.ok(Math.abs(pmf1 - 0.3011) < 0.001, `Expected ~0.3011, got ${pmf1}`);

    // Probabilidad de robar exactamente 0 copias:
    // C(37, 5) / C(40, 5) = 435897 / 658008 ~= 0.6624
    const pmf0 = hypergeometricPMF(40, 3, 5, 0);
    assert.ok(Math.abs(pmf0 - 0.6624) < 0.001, `Expected ~0.6624, got ${pmf0}`);
  });

  it('calcula probabilidad acumulada de tener al menos 1 starter (At Least 1)', () => {
    // 3 copias en 40 cartas: 1 - P(0) = 1 - 0.66244 = 0.33756 (~33.76%)
    const prob3 = hypergeometricAtLeast(40, 3, 5, 1);
    assert.ok(Math.abs(prob3 - 0.3376) < 0.002, `Expected ~0.3376, got ${prob3}`);

    // 9 starters en 40 cartas: probabilidad de al menos 1 starter debe ser ~74.2%
    const prob9 = hypergeometricAtLeast(40, 9, 5, 1);
    assert.ok(Math.abs(prob9 - 0.7418) < 0.005, `Expected ~0.7418, got ${prob9}`);

    // 12 starters en 40 cartas: debe ser ~85%
    const prob12 = hypergeometricAtLeast(40, 12, 5, 1);
    assert.ok(Math.abs(prob12 - 0.8506) < 0.005, `Expected ~0.8506, got ${prob12}`);
  });

  it('maneja condiciones de frontera en cálculos hipergeométricos', () => {
    assert.equal(hypergeometricAtLeast(0, 5, 5, 1), 0);
    assert.equal(hypergeometricAtLeast(40, 0, 5, 1), 0);
    assert.equal(hypergeometricAtLeast(40, 5, 0, 1), 0);
    assert.equal(hypergeometricAtLeast(40, 40, 5, 1), 1);
  });

  it('ejecuta simulación Monte Carlo de manos con distribución de consistencia', () => {
    const stats = simulateHands(40, 9, 6, 4, 2, 2000);
    assert.equal(stats.totalSimulations, 2000);
    // Con 9 starters, el porcentaje en mano inicial de 5 debe oscilar entre 70% y 80%
    assert.ok(stats.starterInHandPercent >= 68 && stats.starterInHandPercent <= 80,
      `Expected starter percentage ~74%, got ${stats.starterInHandPercent}%`);
    assert.ok(stats.brickPercent <= 30, `Brick rate should be realistic (<= 30%), got ${stats.brickPercent}%`);
  });
});

describe('Unit Tests: Validador Mecánico de Extra Deck y Buscadores', () => {
  it('valida invocabilidad de monstruos de Fusión según enablers presentes', () => {
    const fusionMonster: CardBasicInfo = {
      id: 68468459,
      name: 'Mirrorjade the Iceblade Dragon',
      type: 'Fusion Monster',
      level: 8,
      desc: '"Fallen of Albaz" + 1 Fusion, Synchro, Xyz, or Link Monster',
    };

    // Escenario 1: Sin cartas de Fusión en Main Deck
    const mainWithoutFusion: CardBasicInfo[] = [
      { id: 1, name: 'Ash Blossom', type: 'Tuner Monster', level: 3 },
      { id: 2, name: 'Effect Veiler', type: 'Tuner Monster', level: 1 },
    ];
    const checkFailed = canSummonExtraDeckCard(fusionMonster, mainWithoutFusion);
    assert.equal(checkFailed.canSummon, false);
    assert.equal(checkFailed.summonType, 'Fusion');
    assert.ok(checkFailed.reason?.includes('Polimerización/Fusión'));

    // Escenario 2: Con carta de Fusión en Main Deck (ej. Branded Fusion)
    const mainWithFusion: CardBasicInfo[] = [
      { id: 1, name: 'Branded Fusion', type: 'Normal Spell', desc: 'Fusion Summon 1 Fusion Monster that mentions "Fallen of Albaz"' },
      { id: 2, name: 'Fallen of Albaz', type: 'Effect Monster', level: 4 },
    ];
    const checkSuccess = canSummonExtraDeckCard(fusionMonster, mainWithFusion);
    assert.equal(checkSuccess.canSummon, true);
    assert.equal(checkSuccess.summonType, 'Fusion');
  });

  it('valida invocabilidad de monstruos Synchro comprobando Tuners y Niveles', () => {
    const synchroLevel8: CardBasicInfo = {
      id: 84243274,
      name: 'Baronne de Fleur',
      type: 'Synchro Monster',
      level: 8,
      desc: '1 Tuner + 1+ non-Tuner monsters',
    };

    // Escenario 1: Sin Tuner en el mazo
    const mainWithoutTuner: CardBasicInfo[] = [
      { id: 1, name: 'Kashtira Fenrir', type: 'Effect Monster', level: 7 },
      { id: 2, name: 'Kashtira Unicorn', type: 'Effect Monster', level: 7 },
    ];
    const checkNoTuner = canSummonExtraDeckCard(synchroLevel8, mainWithoutTuner);
    assert.equal(checkNoTuner.canSummon, false);
    assert.ok(checkNoTuner.reason?.includes('Cantante (Tuner)'));

    // Escenario 2: Con Tuner de Nivel 1 y Non-Tuner de Nivel 7 (1 + 7 = 8)
    const mainValidSynchro: CardBasicInfo[] = [
      { id: 1, name: 'Kashtira Fenrir', type: 'Effect Monster', level: 7 },
      { id: 2, name: 'Effect Veiler', type: 'Tuner Monster', level: 1 },
    ];
    const checkValidSynchro = canSummonExtraDeckCard(synchroLevel8, mainValidSynchro);
    assert.equal(checkValidSynchro.canSummon, true);
    assert.equal(checkValidSynchro.summonType, 'Synchro');
  });

  it('valida invocabilidad de monstruos XYZ comprobando duplicados de nivel', () => {
    const xyzRank4: CardBasicInfo = {
      id: 21044178,
      name: 'Abyss Dweller',
      type: 'XYZ Monster',
      level: 4, // Rango 4
      desc: '2 Level 4 monsters',
    };

    // Escenario 1: Solo un monstruo de nivel 4
    const mainSingleLvl4: CardBasicInfo[] = [
      { id: 1, name: 'Stratos', type: 'Effect Monster', level: 4, count: 1 },
      { id: 2, name: 'Malicious', type: 'Effect Monster', level: 6, count: 2 },
    ];
    const checkFailXyz = canSummonExtraDeckCard(xyzRank4, mainSingleLvl4);
    assert.equal(checkFailXyz.canSummon, false);
    assert.ok(checkFailXyz.reason?.includes('al menos 2 monstruos'));

    // Escenario 2: Múltiples monstruos de nivel 4
    const mainValidXyz: CardBasicInfo[] = [
      { id: 1, name: 'Stratos', type: 'Effect Monster', level: 4, count: 2 },
    ];
    const checkPassXyz = canSummonExtraDeckCard(xyzRank4, mainValidXyz);
    assert.equal(checkPassXyz.canSummon, true);
    assert.equal(checkPassXyz.summonType, 'XYZ');
  });

  it('detecta buscadores huérfanos sin objetivos válidos en el mazo', () => {
    // "Reinforcement of the Army" busca monstruos Guerrero (Warrior) de Nivel 4 o menor
    const rotaCard: CardBasicInfo = {
      id: 44665364,
      name: 'Reinforcement of the Army',
      type: 'Normal Spell',
      desc: 'Add 1 Level 4 or lower Warrior monster from your Deck to your hand.',
    };

    // Mazo sin Guerreros de Nivel <= 4
    const deckWithoutWarriors: CardBasicInfo[] = [
      { id: 1, name: 'Ash Blossom', type: 'Effect Monster', race: 'Zombie', level: 3 },
      { id: 2, name: 'Blue-Eyes White Dragon', type: 'Normal Monster', race: 'Dragon', level: 8 },
    ];
    const resultNo = isSearcherUsefulInDeck(rotaCard, deckWithoutWarriors);
    assert.equal(resultNo.isUseful, false, 'ROTA should be marked as orphan without Warrior targets');
    assert.ok(resultNo.reason?.includes('no tiene suficientes objetivos'));

    // Mazo con al menos 2 Guerreros de Nivel <= 4
    const deckWithWarriors: CardBasicInfo[] = [
      { id: 3, name: 'Elemental HERO Stratos', type: 'Effect Monster', race: 'Warrior', level: 4, count: 2 },
    ];
    const resultYes = isSearcherUsefulInDeck(rotaCard, deckWithWarriors);
    assert.equal(resultYes.isUseful, true, 'ROTA should be marked as useful with valid targets');
  });

  it('extrae CardBasicInfo de manera normalizada desde objetos polimórficos', () => {
    const rawRow = {
      card_id: 99999,
      card_details: {
        id: 99999,
        name: 'Test Card',
        type: 'Spell Card',
        desc: 'Test description',
      },
      quantity: 3,
    };
    const normalized = extractCardBasicInfo(rawRow);
    assert.equal(normalized.id, 99999);
    assert.equal(normalized.name, 'Test Card');
    assert.equal(normalized.type, 'Spell Card');
    assert.equal(normalized.count, 3);
  });
});
