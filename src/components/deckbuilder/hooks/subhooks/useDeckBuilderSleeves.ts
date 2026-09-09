import { useState } from 'react';
import { SleeveInventory } from '@/types/collection';

export function useDeckBuilderSleeves() {
  const [availableSleeves, setAvailableSleeves] = useState<SleeveInventory[]>([]);
  const [selectedMainSleeveId, setSelectedMainSleeveId] = useState<string>('');
  const [selectedExtraSleeveId, setSelectedExtraSleeveId] = useState<string>('');
  const [mainSleeveMode, setMainSleeveMode] = useState<'take' | 'add'>('take');
  const [mainSleeveAddedQty, setMainSleeveAddedQty] = useState<number>(60);
  const [extraSleeveMode, setExtraSleeveMode] = useState<'take' | 'add'>('take');
  const [extraSleeveAddedQty, setExtraSleeveAddedQty] = useState<number>(15);

  return {
    availableSleeves,
    setAvailableSleeves,
    selectedMainSleeveId,
    setSelectedMainSleeveId,
    selectedExtraSleeveId,
    setSelectedExtraSleeveId,
    mainSleeveMode,
    setMainSleeveMode,
    mainSleeveAddedQty,
    setMainSleeveAddedQty,
    extraSleeveMode,
    setExtraSleeveMode,
    extraSleeveAddedQty,
    setExtraSleeveAddedQty,
  };
}
