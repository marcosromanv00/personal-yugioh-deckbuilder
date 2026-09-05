import { SleeveInventory, DeckCardDetail } from '@/types/collection';
import { NewCardRegistrationForm } from './SyncCardFormDrawer';
import { SectionSleeveConfigs, getCardEntryKey, getCardSectionSleeveDefaults } from './syncModalSectionSleeves.utils';
import { hasStagedCopies, countStagedCopies } from '../deckWorkspacePhysical.utils';

export function getFreeStock(s?: SleeveInventory | null): number {
  if (!s) return 0;
  return typeof s.quantity_available === 'number'
    ? s.quantity_available
    : (s.quantity_total || 0) - (s.quantity_used || 0);
}

export function isSleeveOutOfStock(availableSleeves: SleeveInventory[], sleeveId?: string | null): boolean {
  if (!sleeveId || sleeveId === 'none' || sleeveId === 'inherit') return false;
  const sleeve = availableSleeves.find((s) => s.id === sleeveId);
  return sleeve ? getFreeStock(sleeve) <= 0 : false;
}

export function validateSingleCopySleeveStock({
  form,
  availableSleeves,
  sectionFitId,
  sectionRegularId,
  sectionOverId,
}: {
  form: NewCardRegistrationForm;
  availableSleeves: SleeveInventory[];
  sectionFitId?: string | null;
  sectionRegularId?: string | null;
  sectionOverId?: string | null;
}): { 
  isValid: boolean; 
  outOfStockNames: string[];
  fitOutOfStock: boolean;
  regularOutOfStock: boolean;
  overOutOfStock: boolean;
} {
  if (form.sleeve_type === 'none') {
    return { 
      isValid: true, 
      outOfStockNames: [], 
      fitOutOfStock: false, 
      regularOutOfStock: false, 
      overOutOfStock: false 
    };
  }

  const outOfStockNames: string[] = [];
  let fitOutOfStock = false;
  let regularOutOfStock = false;
  let overOutOfStock = false;

  // Capa 1: Fit
  const fitAction = form.sleeve_fit_action || form.sleeve_action || 'deduct';
  if (fitAction === 'deduct' && form.sleeve_fit_id && form.sleeve_fit_id !== 'none') {
    const fitId = form.sleeve_fit_id === 'inherit' ? sectionFitId : form.sleeve_fit_id;
    if (fitId && fitId !== 'none') {
      const slv = availableSleeves.find((s) => s.id === fitId);
      if (slv && getFreeStock(slv) <= 0) {
        fitOutOfStock = true;
        outOfStockNames.push(`Inner: ${slv.name}`);
      }
    }
  }

  // Capa 2: Regular
  const regAction = form.sleeve_regular_action || form.sleeve_action || 'deduct';
  if (regAction === 'deduct') {
    const regId = form.sleeve_regular_id === 'inherit' ? sectionRegularId : (form.sleeve_regular_id || sectionRegularId);
    if (regId && regId !== 'none') {
      const slv = availableSleeves.find((s) => s.id === regId);
      if (slv && getFreeStock(slv) <= 0) {
        regularOutOfStock = true;
        outOfStockNames.push(`Regular: ${slv.name}`);
      }
    }
  }

  // Capa 3: Over
  const overAction = form.sleeve_over_action || form.sleeve_action || 'deduct';
  if (overAction === 'deduct' && form.sleeve_over_id && form.sleeve_over_id !== 'none') {
    const overId = form.sleeve_over_id === 'inherit' ? sectionOverId : form.sleeve_over_id;
    if (overId && overId !== 'none') {
      const slv = availableSleeves.find((s) => s.id === overId);
      if (slv && getFreeStock(slv) <= 0) {
        overOutOfStock = true;
        outOfStockNames.push(`Oversleeve: ${slv.name}`);
      }
    }
  }

  return { 
    isValid: outOfStockNames.length === 0, 
    outOfStockNames,
    fitOutOfStock,
    regularOutOfStock,
    overOutOfStock,
  };
}

export function getSleeveStockErrors({
  pendingCards, actions, copyForms, availableSleeves, sleeveConfigs,
}: {
  pendingCards: DeckCardDetail[];
  actions: Record<string, 'register' | 'ignore'>;
  copyForms: Record<string, NewCardRegistrationForm>;
  availableSleeves: SleeveInventory[];
  sleeveConfigs: SectionSleeveConfigs;
}): { hasErrors: boolean; errorCount: number; errorSummary: string[]; cardKeysWithErrors: string[] } {
  let errorCount = 0;
  const errorSummary: string[] = [];
  const cardKeysWithErrors: string[] = [];

  pendingCards.forEach((c) => {
    const cardKey = getCardEntryKey(c);
    const action = actions[cardKey] ?? 'register';
    if (action !== 'register' || !hasStagedCopies(c)) return;

    const staged = countStagedCopies(c);
    const secCfg = getCardSectionSleeveDefaults(c, sleeveConfigs);

    for (let i = 0; i < staged; i++) {
      const formKey = `${cardKey}_${i}`;
      const form = copyForms[formKey] || copyForms[`${c.card_id}_${i}`];
      if (!form || form.mode === 'take_existing') continue;

      const validation = validateSingleCopySleeveStock({
        form,
        availableSleeves,
        sectionFitId: secCfg.fitId,
        sectionRegularId: secCfg.regularId,
        sectionOverId: secCfg.overId,
      });

      if (!validation.isValid) {
        errorCount++;
        if (!cardKeysWithErrors.includes(cardKey)) cardKeysWithErrors.push(cardKey);
        validation.outOfStockNames.forEach((name) => {
          if (!errorSummary.includes(name)) errorSummary.push(name);
        });
      }
    }
  });

  return { hasErrors: errorCount > 0, errorCount, errorSummary, cardKeysWithErrors };
}

export function extractSleevesToAddStock(
  inventoryCardsToAdd: Array<{
    sleeve_action?: string;
    sleeve_fit_action?: string;
    sleeve_regular_action?: string;
    sleeve_over_action?: string;
    sleeve_type?: string;
    sleeve_fit_id?: string | null;
    sleeve_regular_id?: string | null;
    sleeve_id?: string | null;
    sleeve_over_id?: string | null;
  }>
): Record<string, number> {
  const map: Record<string, number> = {};

  inventoryCardsToAdd.forEach((c) => {
    if (!c.sleeve_type || c.sleeve_type === 'none') return;

    // Capa Fit
    const fitAct = c.sleeve_fit_action || c.sleeve_action || 'deduct';
    if (fitAct === 'add' && c.sleeve_fit_id && c.sleeve_fit_id !== 'none' && c.sleeve_fit_id !== 'inherit') {
      map[c.sleeve_fit_id] = (map[c.sleeve_fit_id] || 0) + 1;
    }

    // Capa Regular
    const regAct = c.sleeve_regular_action || c.sleeve_action || 'deduct';
    const regId = c.sleeve_regular_id || c.sleeve_id;
    if (regAct === 'add' && regId && regId !== 'none' && regId !== 'inherit') {
      map[regId] = (map[regId] || 0) + 1;
    }

    // Capa Over
    const overAct = c.sleeve_over_action || c.sleeve_action || 'deduct';
    if (overAct === 'add' && c.sleeve_over_id && c.sleeve_over_id !== 'none' && c.sleeve_over_id !== 'inherit') {
      map[c.sleeve_over_id] = (map[c.sleeve_over_id] || 0) + 1;
    }
  });

  return map;
}
