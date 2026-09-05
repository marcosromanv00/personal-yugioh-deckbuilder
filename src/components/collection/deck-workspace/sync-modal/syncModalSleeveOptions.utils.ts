import { SleeveInventory } from '@/types/collection';
import { getFreeStock } from './syncModalSleeveStock.utils';

export function buildRegularOptions(availableSleeves: SleeveInventory[], defaultDeckSleeveName?: string) {
  return [
    {
      value: 'inherit',
      label: defaultDeckSleeveName ? `(Heredado) ${defaultDeckSleeveName}` : '(Heredado) Funda del Mazo',
    },
    { value: '', label: '-- Sin Funda Regular --' },
    ...availableSleeves
      .filter((s) => !s.category || s.category === 'regular')
      .map((s) => {
        const free = getFreeStock(s);
        return {
          value: s.id,
          label: free <= 0 ? `🎴 ${s.name} (${s.brand || 'Genérica'}) — ⚠️ Agotada (0 lib)` : `🎴 ${s.name} (${s.brand || 'Genérica'}) — (${free} lib)`,
        };
      }),
  ];
}

export function buildFitOptions(availableSleeves: SleeveInventory[], defaultDeckFitSleeveName?: string) {
  return [
    {
      value: 'inherit',
      label: defaultDeckFitSleeveName ? `(Heredado) ${defaultDeckFitSleeveName}` : '(Heredado) Inner/Fit del Mazo',
    },
    { value: '', label: '-- Sin Inner / Fit --' },
    ...availableSleeves
      .filter((s) => s.category === 'fit' || !availableSleeves.some((x) => x.category === 'fit'))
      .map((s) => {
        const free = getFreeStock(s);
        return {
          value: s.id,
          label: free <= 0 ? `🟢 ${s.name} (${s.brand || 'Genérica'}) — ⚠️ Agotada (0 lib)` : `🟢 ${s.name} (${s.brand || 'Genérica'}) — (${free} lib)`,
        };
      }),
  ];
}

export function buildOverOptions(availableSleeves: SleeveInventory[], defaultDeckOverSleeveName?: string) {
  return [
    {
      value: 'inherit',
      label: defaultDeckOverSleeveName ? `(Heredado) ${defaultDeckOverSleeveName}` : '(Heredado) Oversleeve del Mazo',
    },
    { value: '', label: '-- Sin Oversleeve --' },
    ...availableSleeves
      .filter((s) => s.category === 'over' || !availableSleeves.some((x) => x.category === 'over'))
      .map((s) => {
        const free = getFreeStock(s);
        return {
          value: s.id,
          label: free <= 0 ? `✨ ${s.name} (${s.brand || 'Genérica'}) — ⚠️ Agotada (0 lib)` : `✨ ${s.name} (${s.brand || 'Genérica'}) — (${free} lib)`,
        };
      }),
  ];
}
