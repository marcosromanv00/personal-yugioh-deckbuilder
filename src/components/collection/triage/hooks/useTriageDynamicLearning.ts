'use client';

import { useState, useCallback } from 'react';
import { TriageCardActionPayload, TacticalVerdict, TriageLearnedRule } from '@/types/triage';

const STORAGE_KEYS = {
  RULES: 'yg_triage_learned_rules',
  PRICES: 'yg_triage_price_overrides',
} as const;

const ACTION_METADATA: Record<
  TriageCardActionPayload['destinationType'],
  { label: string; num: number; color: TacticalVerdict['badgeColor'] }
> = {
  active_deck: { label: 'Mazo Activo', num: 1, color: 'emerald' },
  thematic_pool: { label: 'Proyecto Temático', num: 2, color: 'purple' },
  workshop_salad: { label: 'Ensalada Didáctica', num: 3, color: 'emerald' },
  collection_binder: { label: 'Binder Colección', num: 4, color: 'blue' },
  trade_sale: { label: 'Poner en Venta', num: 5, color: 'amber' },
  bulk_discard: { label: 'Desechar a Bulk', num: 6, color: 'zinc' },
};

export function useTriageDynamicLearning() {
  const [learnedRules, setLearnedRules] = useState<Record<number, TriageLearnedRule>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = sessionStorage.getItem(STORAGE_KEYS.RULES);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [priceOverrides, setPriceOverrides] = useState<Record<number, number>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = sessionStorage.getItem(STORAGE_KEYS.PRICES);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const recordRule = useCallback(
    (
      cardId: number,
      destinationType: TriageCardActionPayload['destinationType'],
      reason: string,
      themeTag?: string,
      rating?: number
    ) => {
      const newRule: TriageLearnedRule = {
        cardId,
        destinationType,
        themeTag,
        reason,
        rating,
        timestamp: Date.now(),
      };

      setLearnedRules(prev => {
        const next = { ...prev, [cardId]: newRule };
        try {
          sessionStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  const recordPriceCorrection = useCallback((cardId: number, newPrice: number) => {
    setPriceOverrides(prev => {
      const next = { ...prev, [cardId]: newPrice };
      try {
        sessionStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const applyLearnedVerdict = useCallback(
    (cardId: number, baseVerdict: TacticalVerdict): TacticalVerdict => {
      const rule = learnedRules[cardId];
      if (!rule) return baseVerdict;

      const meta = ACTION_METADATA[rule.destinationType] || {
        label: rule.destinationType,
        num: baseVerdict.actionNumber,
        color: baseVerdict.badgeColor,
      };

      return {
        ...baseVerdict,
        action: rule.destinationType,
        actionLabel: meta.label,
        actionNumber: meta.num,
        badgeColor: meta.color,
        headline: `⚡ Criterio Aprendido: ${meta.label} [${meta.num}]`,
        recommendationDecision: `Criterio registrado por el usuario: "${rule.reason}". El sistema prioriza dinámicamente tu decisión sobre las sugerencias paramétricas.`,
        isLearnedOverride: true,
        learnedReason: rule.reason,
      };
    },
    [learnedRules]
  );

  return {
    learnedRules,
    priceOverrides,
    recordRule,
    recordPriceCorrection,
    applyLearnedVerdict,
  };
}
