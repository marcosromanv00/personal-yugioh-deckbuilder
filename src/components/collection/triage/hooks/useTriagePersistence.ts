'use client';

import { useCallback } from 'react';
import { TriageScopeConfig } from '@/types/triage';

const STORAGE_KEYS = {
  SCOPE: 'yg_triage_scope_config',
  CARD_ID: 'yg_triage_last_card_id',
} as const;

export function useTriagePersistence() {
  const saveState = useCallback((cardId: string | null, scope: TriageScopeConfig) => {
    if (typeof window === 'undefined') return;
    try {
      if (cardId) {
        sessionStorage.setItem(STORAGE_KEYS.CARD_ID, cardId);
      }
      sessionStorage.setItem(STORAGE_KEYS.SCOPE, JSON.stringify(scope));
    } catch {
      // Ignorar errores en modo incógnito o storage deshabilitado
    }
  }, []);

  const loadSavedScope = useCallback((): TriageScopeConfig | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEYS.SCOPE);
      if (!raw) return null;
      return JSON.parse(raw) as TriageScopeConfig;
    } catch {
      return null;
    }
  }, []);

  const loadSavedCardId = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(STORAGE_KEYS.CARD_ID);
    } catch {
      return null;
    }
  }, []);

  const clearSavedState = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(STORAGE_KEYS.CARD_ID);
      sessionStorage.removeItem(STORAGE_KEYS.SCOPE);
    } catch {}
  }, []);

  return {
    saveState,
    loadSavedScope,
    loadSavedCardId,
    clearSavedState,
  };
}
