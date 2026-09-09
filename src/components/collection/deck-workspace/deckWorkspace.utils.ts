import { DeckCardDetail, SleeveCategory } from '@/types/collection';

export const isExtraDeckCardType = (cardOrType?: string | { type?: string; card_details?: { type?: string } } | null): boolean => {
  if (!cardOrType) return false;
  const rawType = typeof cardOrType === 'string'
    ? cardOrType
    : cardOrType.card_details?.type || cardOrType.type || '';
  const t = rawType.toLowerCase();
  return t.includes('fusion') || t.includes('synchro') || t.includes('xyz') || t.includes('link');
};

export const parseSleevesList = (
  sleevesList?: { section?: string; section_type?: string; sleeve_id?: string; sleeve_details?: { category?: string } }[]
) => {
  let mainFit = '';
  let mainReg = '';
  let mainOver = '';
  let extraFit = '';
  let extraReg = '';
  let extraOver = '';
  let poolFit = '';
  let poolReg = '';
  let poolOver = '';

  if (Array.isArray(sleevesList)) {
    for (const sl of sleevesList) {
      const sec = sl.section || sl.section_type || '';
      const id = sl.sleeve_id || '';
      const cat = sl.sleeve_details?.category;

      if (sec.startsWith('main')) {
        if (sec.endsWith('_fit') || cat === 'fit') mainFit = id;
        else if (sec.endsWith('_over') || cat === 'over') mainOver = id;
        else mainReg = id;
      } else if (sec.startsWith('extra')) {
        if (sec.endsWith('_fit') || cat === 'fit') extraFit = id;
        else if (sec.endsWith('_over') || cat === 'over') extraOver = id;
        else extraReg = id;
      } else if (sec.startsWith('pool') || sec.startsWith('extras')) {
        if (sec.endsWith('_fit') || cat === 'fit') poolFit = id;
        else if (sec.endsWith('_over') || cat === 'over') poolOver = id;
        else poolReg = id;
      }
    }
  }

  const mainCount = (mainFit ? 1 : 0) + (mainReg ? 1 : 0) + (mainOver ? 1 : 0);
  const extraCount = (extraFit ? 1 : 0) + (extraReg ? 1 : 0) + (extraOver ? 1 : 0);
  const poolCount = (poolFit ? 1 : 0) + (poolReg ? 1 : 0) + (poolOver ? 1 : 0);

  return {
    mainFit, mainReg, mainOver,
    mainProt: (mainOver || mainCount >= 3 ? 'triple' : mainCount === 2 ? 'double' : 'single') as 'single' | 'double' | 'triple',
    extraFit, extraReg, extraOver,
    extraProt: (extraOver || extraCount >= 3 ? 'triple' : extraCount === 2 ? 'double' : 'single') as 'single' | 'double' | 'triple',
    poolFit, poolReg, poolOver,
    poolProt: (poolOver || poolCount >= 3 ? 'triple' : poolCount === 2 ? 'double' : 'single') as 'single' | 'double' | 'triple',
  };
};

export interface SleevesConfig {
  mainProtection: 'single' | 'double' | 'triple';
  mainSleeveFitId: string;
  mainSleeveId: string;
  mainSleeveOverId: string;
  extraProtection: 'single' | 'double' | 'triple';
  extraSleeveFitId: string;
  extraSleeveId: string;
  extraSleeveOverId: string;
  poolProtection: 'single' | 'double' | 'triple';
  poolSleeveFitId: string;
  poolSleeveId: string;
  poolSleeveOverId: string;
}

export function computeSleevesPayload(cfg: SleevesConfig): { sleeve_id: string; section: string }[] {
  const payload: { sleeve_id: string; section: string }[] = [];
  if (cfg.mainProtection === 'triple' || cfg.mainProtection === 'double') {
    if (cfg.mainSleeveFitId) payload.push({ sleeve_id: cfg.mainSleeveFitId, section: 'main_side_fit' });
    if (cfg.mainSleeveId) payload.push({ sleeve_id: cfg.mainSleeveId, section: 'main_side_regular' });
    if (cfg.mainSleeveOverId) payload.push({ sleeve_id: cfg.mainSleeveOverId, section: 'main_side_over' });
  } else if (cfg.mainSleeveId) {
    payload.push({ sleeve_id: cfg.mainSleeveId, section: 'main_side_regular' });
  }

  if (cfg.extraProtection === 'triple' || cfg.extraProtection === 'double') {
    if (cfg.extraSleeveFitId) payload.push({ sleeve_id: cfg.extraSleeveFitId, section: 'extra_fit' });
    if (cfg.extraSleeveId) payload.push({ sleeve_id: cfg.extraSleeveId, section: 'extra_regular' });
    if (cfg.extraSleeveOverId) payload.push({ sleeve_id: cfg.extraSleeveOverId, section: 'extra_over' });
  } else if (cfg.extraSleeveId) {
    payload.push({ sleeve_id: cfg.extraSleeveId, section: 'extra_regular' });
  }

  if (cfg.poolProtection === 'triple' || cfg.poolProtection === 'double') {
    if (cfg.poolSleeveFitId) payload.push({ sleeve_id: cfg.poolSleeveFitId, section: 'pool_fit' });
    if (cfg.poolSleeveId) payload.push({ sleeve_id: cfg.poolSleeveId, section: 'pool_regular' });
    if (cfg.poolSleeveOverId) payload.push({ sleeve_id: cfg.poolSleeveOverId, section: 'pool_over' });
  } else if (cfg.poolSleeveId) {
    payload.push({ sleeve_id: cfg.poolSleeveId, section: 'pool_regular' });
  }
  return payload;
}

export function serializeDeckCardsForDirtyCheck(cards: DeckCardDetail[]) {
  return JSON.stringify(
    cards
      .map((c) => ({
        id: c.card_id,
        count: c.count,
        section: c.section === 'pool' || c.section === 'extras' ? 'extras' : c.section,
        assignedCount: c.physical_copies?.length || 0,
      }))
      .sort((a, b) => a.id - b.id || a.section.localeCompare(b.section))
  );
}

export function checkMetadataDirty(
  current: {
    name: string;
    format: string;
    isActive: boolean;
    storageLocationId: string;
    compartmentIndex: number;
    mainProtection: 'single' | 'double' | 'triple';
    mainSleeveFitId: string;
    mainSleeveId: string;
    mainSleeveOverId: string;
    extraProtection: 'single' | 'double' | 'triple';
    poolProtection: 'single' | 'double' | 'triple';
    poolSleeveFitId: string;
    poolSleeveId: string;
    poolSleeveOverId: string;
  },
  initial: Record<string, unknown> | null
): boolean {
  if (!initial) return false;
  return (
    current.name !== initial.name ||
    current.format !== initial.format ||
    current.isActive !== initial.isActive ||
    current.storageLocationId !== initial.storageLocationId ||
    current.compartmentIndex !== initial.compartmentIndex ||
    current.mainProtection !== initial.mainProtection ||
    current.mainSleeveFitId !== initial.mainSleeveFitId ||
    current.mainSleeveId !== initial.mainSleeveId ||
    current.mainSleeveOverId !== initial.mainSleeveOverId ||
    current.extraProtection !== initial.extraProtection ||
    current.poolProtection !== initial.poolProtection ||
    current.poolSleeveFitId !== initial.poolSleeveFitId ||
    current.poolSleeveId !== initial.poolSleeveId ||
    current.poolSleeveOverId !== initial.poolSleeveOverId
  );
}
