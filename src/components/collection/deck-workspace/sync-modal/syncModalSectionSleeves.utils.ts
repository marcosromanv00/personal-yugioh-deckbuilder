import { DeckCardDetail, SleeveInventory } from '@/types/collection';
import { SyncSavePayloadData } from './syncModalSave.utils';
import { isExtraDeckCardType } from '../useDeckWorkspaceState';

export interface SectionSleeveConfigs {
  mainProtection?: 'single' | 'double' | 'triple';
  mainSleeveFitId?: string | null;
  mainSleeveId?: string | null;
  mainSleeveOverId?: string | null;
  extraProtection?: 'single' | 'double' | 'triple';
  extraSleeveFitId?: string | null;
  extraSleeveId?: string | null;
  extraSleeveOverId?: string | null;
  poolProtection?: 'single' | 'double' | 'triple';
  poolSleeveFitId?: string | null;
  poolSleeveId?: string | null;
  poolSleeveOverId?: string | null;
}

export interface UseDeckWorkspaceSyncModalStateProps extends SectionSleeveConfigs {
  pendingCards: DeckCardDetail[];
  storageLocationId?: string | null;
  compartmentIndex?: number | null;
  availableSleeves?: SleeveInventory[];
  isActiveDeck: boolean;
  onConfirmSave: (data: SyncSavePayloadData) => Promise<void>;
}

export function getCardEntryKey(card: DeckCardDetail): string {
  return `${card.card_id}_${card.section}`;
}

export type DoubleSleeveVariant = 'inner_regular' | 'regular_over';

export interface CardSectionSleeveDefaults {
  protection: 'single' | 'double' | 'triple';
  doubleVariant: DoubleSleeveVariant;
  fitId: string | null;
  regularId: string | null;
  overId: string | null;
  sectionLabel: string;
}

export function getCardSectionSleeveDefaults(
  card: DeckCardDetail,
  config: SectionSleeveConfigs
): CardSectionSleeveDefaults {
  const isExtra = isExtraDeckCardType(card.card_details?.type);
  const sec = card.section;

  let hasOver = false;
  let hasFit = false;
  let rawProt: 'single' | 'double' | 'triple' | undefined;
  let rawFitId: string | null = null;
  let rawRegularId: string | null = null;
  let rawOverId: string | null = null;
  let sectionLabel = 'Main Deck';

  if (sec === 'extra' || (sec === 'side' && isExtra)) {
    hasOver = Boolean(config.extraSleeveOverId);
    hasFit = Boolean(config.extraSleeveFitId);
    rawProt = config.extraProtection;
    rawFitId = config.extraSleeveFitId || null;
    rawRegularId = config.extraSleeveId || null;
    rawOverId = config.extraSleeveOverId || null;
    sectionLabel = 'Extra Deck';
  } else if (sec === 'pool' || sec === 'extras') {
    const targetOver = isExtra ? config.extraSleeveOverId : (config.poolSleeveOverId || config.mainSleeveOverId);
    const targetFit = isExtra ? config.extraSleeveFitId : (config.poolSleeveFitId || config.mainSleeveFitId);
    hasOver = Boolean(targetOver);
    hasFit = Boolean(targetFit);
    rawProt = isExtra ? config.extraProtection : (config.poolProtection || config.mainProtection);
    rawFitId = targetFit || null;
    rawRegularId = config.poolSleeveId || (isExtra ? config.extraSleeveId : config.mainSleeveId) || null;
    rawOverId = targetOver || null;
    sectionLabel = 'Reserva';
  } else {
    hasOver = Boolean(config.mainSleeveOverId);
    hasFit = Boolean(config.mainSleeveFitId);
    rawProt = config.mainProtection;
    rawFitId = config.mainSleeveFitId || null;
    rawRegularId = config.mainSleeveId || null;
    rawOverId = config.mainSleeveOverId || null;
    sectionLabel = 'Main Deck';
  }

  let protection: 'single' | 'double' | 'triple' = 'single';
  let doubleVariant: DoubleSleeveVariant = 'inner_regular';

  if (hasOver && hasFit) {
    protection = 'triple';
    doubleVariant = 'regular_over';
  } else if (hasOver && !hasFit) {
    protection = 'double';
    doubleVariant = 'regular_over';
  } else if (hasFit && !hasOver) {
    protection = 'double';
    doubleVariant = 'inner_regular';
  } else {
    protection = rawProt || 'single';
  }

  return {
    protection,
    doubleVariant,
    fitId: (protection === 'triple' || (protection === 'double' && doubleVariant === 'inner_regular')) ? rawFitId : null,
    regularId: rawRegularId,
    overId: (protection === 'triple' || (protection === 'double' && doubleVariant === 'regular_over')) ? rawOverId : null,
    sectionLabel,
  };
}
