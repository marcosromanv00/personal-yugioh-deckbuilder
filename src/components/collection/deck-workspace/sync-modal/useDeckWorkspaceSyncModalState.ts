import { useState, useMemo, useCallback } from 'react';
import { DeckCardDetail } from '@/types/collection';
import { NewCardRegistrationForm } from './SyncCardFormDrawer';
import { CardSubstitution } from './SyncRegisteredCardDrawer';
import { buildSyncModalSavePayload } from './syncModalSave.utils';
import { hasStagedCopies, countStagedCopies } from '../deckWorkspacePhysical.utils';
import { getSleeveStockErrors } from './syncModalSleeveStock.utils';
import { useToast } from '@/components/ui/ToastProvider';
import { isExtraDeckCardType } from '../useDeckWorkspaceState';
import {
  UseDeckWorkspaceSyncModalStateProps,
  getCardSectionSleeveDefaults,
  getCardEntryKey,
} from './syncModalSectionSleeves.utils';

export function useDeckWorkspaceSyncModalState({
  pendingCards,
  storageLocationId,
  compartmentIndex,
  availableSleeves = [],
  mainProtection = 'single',
  mainSleeveFitId,
  mainSleeveId,
  mainSleeveOverId,
  extraProtection = 'single',
  extraSleeveFitId,
  extraSleeveId,
  extraSleeveOverId,
  poolProtection = 'single',
  poolSleeveFitId,
  poolSleeveId,
  poolSleeveOverId,
  isActiveDeck,
  onConfirmSave,
}: UseDeckWorkspaceSyncModalStateProps) {
  const toast = useToast();
  const firstUnregistered = pendingCards.find(hasStagedCopies);
  const initialKey = firstUnregistered
    ? getCardEntryKey(firstUnregistered)
    : (pendingCards[0] ? getCardEntryKey(pendingCards[0]) : null);
  const [selectedCardKey, setSelectedCardKey] = useState<string | null>(initialKey);
  const [selectedCopyIndex, setSelectedCopyIndex] = useState<Record<string, number>>({});

  const [actions, setActions] = useState<Record<string, 'register' | 'ignore'>>(() => {
    const initial: Record<string, 'register' | 'ignore'> = {};
    pendingCards.forEach((c) => { initial[getCardEntryKey(c)] = 'register'; });
    return initial;
  });

  const sleeveConfigs = useMemo(() => ({
    mainProtection, mainSleeveFitId, mainSleeveId, mainSleeveOverId,
    extraProtection, extraSleeveFitId, extraSleeveId, extraSleeveOverId,
    poolProtection, poolSleeveFitId, poolSleeveId, poolSleeveOverId,
  }), [
    mainProtection, mainSleeveFitId, mainSleeveId, mainSleeveOverId,
    extraProtection, extraSleeveFitId, extraSleeveId, extraSleeveOverId,
    poolProtection, poolSleeveFitId, poolSleeveId, poolSleeveOverId,
  ]);

  const [copyForms, setCopyForms] = useState<Record<string, NewCardRegistrationForm>>(() => {
    const initial: Record<string, NewCardRegistrationForm> = {};
    pendingCards.forEach((c) => {
      const stagedCount = Math.max(1, countStagedCopies(c));
      const secCfg = getCardSectionSleeveDefaults(c, sleeveConfigs);
      const cardKey = getCardEntryKey(c);

      for (let i = 0; i < stagedCount; i++) {
        const formObj: NewCardRegistrationForm = {
          mode: 'new',
          rarity: 'Common',
          condition: 'Near Mint',
          is_proxy: false,
          sleeve_type: secCfg.protection,
          sleeve_fit_id: secCfg.fitId ? 'inherit' : null,
          sleeve_regular_id: secCfg.regularId ? 'inherit' : null,
          sleeve_over_id: secCfg.overId ? 'inherit' : null,
          sleeve_action: 'deduct',
          sleeve_fit_action: 'deduct',
          sleeve_regular_action: 'deduct',
          sleeve_over_action: 'deduct',
          storage_location_id: storageLocationId || null,
          compartment_index: compartmentIndex ?? 0,
        };
        initial[`${cardKey}_${i}`] = formObj;
        if (!initial[`${c.card_id}_${i}`]) initial[`${c.card_id}_${i}`] = formObj;
      }
    });
    return initial;
  });

  const [substitutions, setSubstitutions] = useState<Record<string, CardSubstitution>>({});
  const [additionalCopies, setAdditionalCopies] = useState<Record<string, NewCardRegistrationForm[]>>({});

  const getSectionSleevesInfoForCard = useCallback((card: DeckCardDetail) => {
    const isExtra = isExtraDeckCardType(card.card_details?.type);
    const sec = card.section;
    const isExtraTarget = sec === 'extra' || (sec === 'side' && isExtra) || ((sec === 'pool' || sec === 'extras') && isExtra);
    const fitId = isExtraTarget ? (sleeveConfigs.extraSleeveFitId || null) : (sleeveConfigs.poolSleeveFitId || sleeveConfigs.mainSleeveFitId || null);
    const regularId = isExtraTarget ? (sleeveConfigs.extraSleeveId || null) : (sleeveConfigs.poolSleeveId || sleeveConfigs.mainSleeveId || null);
    const overId = isExtraTarget ? (sleeveConfigs.extraSleeveOverId || null) : (sleeveConfigs.poolSleeveOverId || sleeveConfigs.mainSleeveOverId || null);

    return {
      fitId,
      fitName: fitId ? availableSleeves.find((s) => s.id === fitId)?.name : undefined,
      regularId,
      regularName: regularId ? availableSleeves.find((s) => s.id === regularId)?.name : undefined,
      overId,
      overName: overId ? availableSleeves.find((s) => s.id === overId)?.name : undefined,
    };
  }, [sleeveConfigs, availableSleeves]);

  const handleUpdateCopyForm = useCallback((cardKey: string, copyIndex: number, fields: Partial<NewCardRegistrationForm>) => {
    setCopyForms((prev) => ({
      ...prev,
      [`${cardKey}_${copyIndex}`]: { ...(prev[`${cardKey}_${copyIndex}`] || {}), ...fields },
    }));
  }, []);

  const handleCopyConfigToAll = useCallback((cardKey: string, sourceCopyIndex: number) => {
    setCopyForms((prev) => {
      const sourceConfig = prev[`${cardKey}_${sourceCopyIndex}`];
      if (!sourceConfig) return prev;
      const next = { ...prev };
      const card = pendingCards.find((c) => getCardEntryKey(c) === cardKey);
      const stagedCount = card ? Math.max(1, countStagedCopies(card)) : 1;
      for (let i = 0; i < stagedCount; i++) {
        if (i !== sourceCopyIndex) {
          next[`${cardKey}_${i}`] = {
            ...sourceConfig,
            selected_user_card_id: undefined,
            mode: sourceConfig.mode === 'take_existing' ? 'new' : sourceConfig.mode,
          };
        }
      }
      return next;
    });
  }, [pendingCards]);

  const handleUpdateSubstitution = useCallback((userCardId: string, sub: CardSubstitution | null) => {
    setSubstitutions((prev) => {
      const next = { ...prev };
      if (sub === null) delete next[userCardId];
      else next[userCardId] = sub;
      return next;
    });
  }, []);

  const handleAddCopy = useCallback((cardKey: string) => {
    setAdditionalCopies((prev) => ({
      ...prev,
      [cardKey]: [...(prev[cardKey] || []), { rarity: 'Common', condition: 'Near Mint', is_proxy: false, sleeve_type: 'none', sleeve_action: 'deduct', sleeve_fit_action: 'deduct', sleeve_regular_action: 'deduct', sleeve_over_action: 'deduct' }],
    }));
  }, []);

  const sleeveStockErrors = useMemo(() => {
    return getSleeveStockErrors({ pendingCards, actions, copyForms, availableSleeves, sleeveConfigs });
  }, [pendingCards, actions, copyForms, availableSleeves, sleeveConfigs]);

  const hasIgnoredInActive = isActiveDeck && pendingCards.some((c) => hasStagedCopies(c) && actions[getCardEntryKey(c)] === 'ignore');

  const handleSave = async () => {
    if (hasIgnoredInActive) return;
    if (sleeveStockErrors.hasErrors) {
      toast.error(`Stock insuficiente para deducir fundas (${sleeveStockErrors.errorSummary.slice(0, 2).join(', ')}). Cambia a "Sumar al Inventario" o añade stock.`);
      return;
    }
    const payloadData = buildSyncModalSavePayload({
      pendingCards,
      actions,
      cardForms: {},
      copyForms,
      substitutions,
      additionalCopies,
    });
    await onConfirmSave(payloadData);
  };

  return {
    selectedCardKey, setSelectedCardKey,
    selectedCopyIndex, setSelectedCopyIndex,
    actions, setActions,
    copyForms, handleUpdateCopyForm, handleCopyConfigToAll,
    substitutions, handleUpdateSubstitution,
    additionalCopies, handleAddCopy,
    getSectionSleevesInfoForCard,
    sleeveStockErrors,
    hasIgnoredInActive, handleSave,
  };
}
