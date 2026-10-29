import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isCollectorRarity,
  analyzeRarityDisparity,
} from '../src/lib/rarityDisparity.utils';
import { CardSetPrintingsResponse } from '../src/types/triage';

describe('rarityDisparity.utils (Node:test)', () => {
  it('detecta correctamente nombres de rarezas de coleccionista / alto brillo', () => {
    assert.strictEqual(isCollectorRarity('Quarter Century Secret Rare'), true);
    assert.strictEqual(isCollectorRarity('Secret Rare', '(QCSR)'), true);
    assert.strictEqual(isCollectorRarity('Starlight Rare'), true);
    assert.strictEqual(isCollectorRarity("Collector's Rare"), true);
    assert.strictEqual(isCollectorRarity('Ultimate Rare'), true);
    assert.strictEqual(isCollectorRarity('Ghost Rare'), true);
    assert.strictEqual(isCollectorRarity("Pharaoh's Secret Rare"), true);
    assert.strictEqual(isCollectorRarity('Common'), false);
    assert.strictEqual(isCollectorRarity('Super Rare'), false);
    assert.strictEqual(isCollectorRarity('Ultra Rare'), false);
  });

  it('identifica cartas con precio uniforme para dar total tranquilidad al usuario', () => {
    const uniformCardSets: CardSetPrintingsResponse = {
      cardId: 1001,
      name: 'Mighty Dino King Rex',
      defaultRarity: 'Super Rare',
      highValueWarning: false,
      marketPriceTcg: 0.22,
      marketPriceCardmarket: 0.20,
      printings: [
        {
          setName: 'Duelist Nexus',
          setCode: 'DUNE-EN000',
          setRarity: 'Super Rare',
          setRarityCode: '(SR)',
          setPrice: 0.22,
        },
        {
          setName: '25th Anniversary Tin: Dueling Mirrors',
          setCode: 'MP24-EN269',
          setRarity: 'Ultra Rare',
          setRarityCode: '(UR)',
          setPrice: 0.22,
        },
      ],
    };

    const evaluation = analyzeRarityDisparity(uniformCardSets);
    assert.strictEqual(evaluation.isSafeSamePrice, true);
    assert.strictEqual(evaluation.hasDisparity, false);
    assert.strictEqual(evaluation.alertLevel, 'none');
    assert.strictEqual(evaluation.badgeColor, 'zinc');
    assert.ok(evaluation.badgeLabel.includes('Uniforme'));
    assert.ok(evaluation.alertMessage.includes('No requieres verificar su rareza'));
  });

  it('dispara alerta crítica cuando existe impresión de coleccionista (QCSR) de alto costo', () => {
    const collectorCardSets: CardSetPrintingsResponse = {
      cardId: 2002,
      name: 'Promethean Princess, Bestower of Flames',
      defaultRarity: 'Ultra Rare',
      highValueWarning: true,
      marketPriceTcg: 14.5,
      marketPriceCardmarket: 12.0,
      printings: [
        {
          setName: 'Phantom Nightmare',
          setCode: 'PHNI-EN052',
          setRarity: 'Ultra Rare',
          setRarityCode: '(UR)',
          setPrice: 14.5,
        },
        {
          setName: 'Phantom Nightmare',
          setCode: 'PHNI-EN052',
          setRarity: 'Quarter Century Secret Rare',
          setRarityCode: '(QCSR)',
          setPrice: 85.0,
        },
      ],
    };

    const evaluation = analyzeRarityDisparity(collectorCardSets);
    assert.strictEqual(evaluation.hasDisparity, true);
    assert.strictEqual(evaluation.isSafeSamePrice, false);
    assert.strictEqual(evaluation.alertLevel, 'critical');
    assert.strictEqual(evaluation.badgeColor, 'amber');
    assert.strictEqual(evaluation.hasCollectorRarity, true);
    assert.ok(evaluation.collectorRaritiesFound.includes('Quarter Century Secret Rare'));
    assert.ok(evaluation.alertTitle.includes('Coleccionista'));
    assert.strictEqual(evaluation.maxPrice, 85.0);
  });

  it('dispara alerta crítica ante disparidad de precio extrema sin ser coleccionista', () => {
    const spreadCardSets: CardSetPrintingsResponse = {
      cardId: 3003,
      name: 'Card With Old Expensive Print',
      defaultRarity: 'Common',
      highValueWarning: true,
      marketPriceTcg: 0.35,
      marketPriceCardmarket: 0.3,
      printings: [
        {
          setName: 'Structure Deck',
          setCode: 'SD01-EN001',
          setRarity: 'Common',
          setRarityCode: '(C)',
          setPrice: 0.35,
        },
        {
          setName: 'Tournament Pack 1',
          setCode: 'TP1-E001',
          setRarity: 'Super Rare',
          setRarityCode: '(SR)',
          setPrice: 22.0,
        },
      ],
    };

    const evaluation = analyzeRarityDisparity(spreadCardSets);
    assert.strictEqual(evaluation.hasDisparity, true);
    assert.strictEqual(evaluation.alertLevel, 'critical');
    assert.strictEqual(evaluation.badgeColor, 'red');
    assert.ok(evaluation.priceDifference > 20);
    assert.ok(evaluation.alertMessage.includes('Diferencia'));
  });

  it('dispara alerta de advertencia ante variación moderada (ej. $0.50 vs $3.20)', () => {
    const warningCardSets: CardSetPrintingsResponse = {
      cardId: 4004,
      name: 'Moderate Spread Staple',
      defaultRarity: 'Common',
      highValueWarning: false,
      marketPriceTcg: 0.5,
      marketPriceCardmarket: 0.45,
      printings: [
        {
          setName: 'Starter Deck',
          setCode: 'ST01-EN005',
          setRarity: 'Common',
          setRarityCode: '(C)',
          setPrice: 0.5,
        },
        {
          setName: 'Battles of Legend',
          setCode: 'BLMR-EN010',
          setRarity: 'Secret Rare',
          setRarityCode: '(ScR)',
          setPrice: 3.2,
        },
      ],
    };

    const evaluation = analyzeRarityDisparity(warningCardSets);
    assert.strictEqual(evaluation.hasDisparity, true);
    assert.strictEqual(evaluation.alertLevel, 'warning');
    assert.strictEqual(evaluation.badgeColor, 'amber');
    assert.ok(evaluation.badgeLabel.includes('Revisar'));
  });

  it('maneja de forma segura datos vacíos o nulos', () => {
    const emptyEvaluation = analyzeRarityDisparity(null);
    assert.strictEqual(emptyEvaluation.hasDisparity, false);
    assert.strictEqual(emptyEvaluation.alertLevel, 'none');
    assert.strictEqual(emptyEvaluation.minPrice, 0.25);
    assert.strictEqual(emptyEvaluation.maxPrice, 0.25);
  });
});
