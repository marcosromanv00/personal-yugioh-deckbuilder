import { useState, useMemo } from 'react';
import { SleeveInventory, SleeveCategory } from '@/types/collection';
import { computeSleevesPayload } from '../deckWorkspace.utils';

export function useDeckWorkspaceSleeves(initialSleeves: SleeveInventory[] = []) {
  const [availableSleeves, setAvailableSleeves] = useState<SleeveInventory[]>(initialSleeves);

  // Main & Side Deck Sleeves
  const [mainProtection, setMainProtection] = useState<'single' | 'double' | 'triple'>('single');
  const [mainSleeveFitId, setMainSleeveFitId] = useState<string>('');
  const [mainSleeveId, setMainSleeveId] = useState<string>('');
  const [mainSleeveOverId, setMainSleeveOverId] = useState<string>('');

  // Extra Deck Sleeves
  const [extraProtection, setExtraProtection] = useState<'single' | 'double' | 'triple'>('single');
  const [extraSleeveFitId, setExtraSleeveFitId] = useState<string>('');
  const [extraSleeveId, setExtraSleeveId] = useState<string>('');
  const [extraSleeveOverId, setExtraSleeveOverId] = useState<string>('');

  // Pool Sleeves
  const [poolProtection, setPoolProtection] = useState<'single' | 'double' | 'triple'>('single');
  const [poolSleeveFitId, setPoolSleeveFitId] = useState<string>('');
  const [poolSleeveId, setPoolSleeveId] = useState<string>('');
  const [poolSleeveOverId, setPoolSleeveOverId] = useState<string>('');

  // New Sleeve Modal
  const [isNewSleeveModalOpen, setIsNewSleeveModalOpen] = useState(false);
  const [targetSleeveSection, setTargetSleeveSection] = useState<'main_side' | 'extra' | 'pool' | null>(null);
  const [sleeveModalTab, setSleeveModalTab] = useState<'add_stock' | 'create'>('add_stock');
  const [sleeveModalInitialId, setSleeveModalInitialId] = useState<string | undefined>(undefined);
  const [sleeveModalInitialCategory, setSleeveModalInitialCategory] = useState<SleeveCategory | undefined>(undefined);
  const [sleeveModalSuggestedQty, setSleeveModalSuggestedQty] = useState<number | undefined>(undefined);
  const [sleeveModalSectionTotal, setSleeveModalSectionTotal] = useState<number | undefined>(undefined);

  const openSleeveModal = (
    section: 'main_side' | 'extra' | 'pool',
    tab: 'add_stock' | 'create' = 'add_stock',
    sleeveId?: string,
    suggestedQty?: number,
    sectionTotal?: number,
    initialCategory?: SleeveCategory
  ) => {
    setTargetSleeveSection(section);
    setSleeveModalTab(tab);
    setSleeveModalInitialId(sleeveId);
    setSleeveModalInitialCategory(initialCategory);
    setSleeveModalSuggestedQty(suggestedQty);
    setSleeveModalSectionTotal(sectionTotal);
    setIsNewSleeveModalOpen(true);
  };

  const sleevesPayload = useMemo(() => {
    return computeSleevesPayload({
      mainProtection, mainSleeveFitId, mainSleeveId, mainSleeveOverId,
      extraProtection, extraSleeveFitId, extraSleeveId, extraSleeveOverId,
      poolProtection, poolSleeveFitId, poolSleeveId, poolSleeveOverId,
    });
  }, [
    mainProtection, mainSleeveFitId, mainSleeveId, mainSleeveOverId,
    extraProtection, extraSleeveFitId, extraSleeveId, extraSleeveOverId,
    poolProtection, poolSleeveFitId, poolSleeveId, poolSleeveOverId,
  ]);

  return {
    availableSleeves, setAvailableSleeves,
    mainProtection, setMainProtection,
    mainSleeveFitId, setMainSleeveFitId,
    mainSleeveId, setMainSleeveId,
    mainSleeveOverId, setMainSleeveOverId,
    extraProtection, setExtraProtection,
    extraSleeveFitId, setExtraSleeveFitId,
    extraSleeveId, setExtraSleeveId,
    extraSleeveOverId, setExtraSleeveOverId,
    poolProtection, setPoolProtection,
    poolSleeveFitId, setPoolSleeveFitId,
    poolSleeveId, setPoolSleeveId,
    poolSleeveOverId, setPoolSleeveOverId,
    isNewSleeveModalOpen, setIsNewSleeveModalOpen,
    targetSleeveSection, setTargetSleeveSection,
    sleeveModalTab, setSleeveModalTab,
    sleeveModalInitialId, setSleeveModalInitialId,
    sleeveModalInitialCategory, setSleeveModalInitialCategory,
    sleeveModalSuggestedQty, setSleeveModalSuggestedQty,
    sleeveModalSectionTotal, setSleeveModalSectionTotal,
    openSleeveModal,
    sleevesPayload,
  };
}
