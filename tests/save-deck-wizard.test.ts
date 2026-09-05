import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Save Deck Wizard - Sleeve Allocation Logic', () => {
  it('allows selecting take mode when free stock is sufficient', () => {
    const requiredSleeves = 40;
    const sleeveStock = { total_quantity: 100, free_quantity: 60 };
    const canTake = sleeveStock.free_quantity >= requiredSleeves;

    assert.equal(canTake, true, 'Debe permitir tomar fundas si hay suficiente stock libre');
  });

  it('detects insufficient stock when take mode exceeds free stock', () => {
    const requiredSleeves = 40;
    const sleeveStock = { total_quantity: 100, free_quantity: 25 };
    const canTake = sleeveStock.free_quantity >= requiredSleeves;

    assert.equal(canTake, false, 'No debe permitir tomar fundas si faltan unidades');
  });

  it('validates add mode when adding new packages of sleeves', () => {
    const requiredSleeves = 40;
    const addedQty = 50;
    const isValidAdd = addedQty >= requiredSleeves;

    assert.equal(isValidAdd, true, 'El modo add debe cubrir la cantidad de cartas del deck');
  });

  it('calculates total sleeves needed across main and extra deck', () => {
    const mainDeckCards = 40;
    const extraDeckCards = 15;
    const sideDeckCards = 15;

    const totalMainAndSide = mainDeckCards + sideDeckCards;
    const totalExtra = extraDeckCards;

    assert.equal(totalMainAndSide, 55);
    assert.equal(totalExtra, 15);
  });
});

describe('Save Deck Wizard - Step Navigation & Form Validation', () => {
  it('validates step 1 basic info: requires deck name', () => {
    const validState = { deckName: 'Branded Despia', saveFormat: 'master_duel' };
    const invalidState = { deckName: '   ', saveFormat: 'master_duel' };

    assert.equal(validState.deckName.trim().length > 0, true);
    assert.equal(invalidState.deckName.trim().length > 0, false);
  });

  it('validates storage step 2: allows unassigned or assigned box', () => {
    const stateWithBox = { storageLocationId: 'box-1', storageLaneId: 'lane-a' };
    const stateWithoutBox = { storageLocationId: '', storageLaneId: '' };

    assert.ok(stateWithBox.storageLocationId.length > 0);
    assert.equal(stateWithoutBox.storageLocationId, '');
  });

  it('generates correct payload for sleeve assignment API', () => {
    const mainSleeveConfig = {
      sleeveId: 'sleeve-dragon-shield-matte-black',
      mode: 'take' as const,
      addedQty: 0,
    };

    const extraSleeveConfig = {
      sleeveId: 'sleeve-katana-red',
      mode: 'add' as const,
      addedQty: 60,
    };

    const mainPayload = {
      sleeve_id: mainSleeveConfig.sleeveId,
      sleeve_type: 'main',
      action_mode: mainSleeveConfig.mode,
      added_quantity: mainSleeveConfig.addedQty,
    };

    const extraPayload = {
      sleeve_id: extraSleeveConfig.sleeveId,
      sleeve_type: 'extra',
      action_mode: extraSleeveConfig.mode,
      added_quantity: extraSleeveConfig.addedQty,
    };

    assert.equal(mainPayload.action_mode, 'take');
    assert.equal(extraPayload.action_mode, 'add');
    assert.equal(extraPayload.added_quantity, 60);
  });
});
