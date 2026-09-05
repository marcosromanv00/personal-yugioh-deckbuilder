'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import { SleeveInventory } from '@/types/collection';
import { validateSingleCopySleeveStock } from './syncModalSleeveStock.utils';
import { SyncSleeveLayerRow } from './SyncSleeveLayerRow';
import { SyncSleeveInventorySummary } from './SyncSleeveInventorySummary';
import { buildFitOptions, buildRegularOptions, buildOverOptions } from './syncModalSleeveOptions.utils';

interface SyncCardSleevePickerProps {
  sleeveType?: 'none' | 'single' | 'double' | 'triple';
  sleeveFitId?: string | null;
  sleeveRegularId?: string | null;
  sleeveOverId?: string | null;
  sleeveAction?: 'deduct' | 'add';
  sleeveFitAction?: 'deduct' | 'add';
  sleeveRegularAction?: 'deduct' | 'add';
  sleeveOverAction?: 'deduct' | 'add';
  availableSleeves?: SleeveInventory[];
  defaultDeckFitSleeveName?: string;
  defaultDeckFitId?: string | null;
  defaultDeckSleeveName?: string;
  defaultDeckRegularId?: string | null;
  defaultDeckOverSleeveName?: string;
  defaultDeckOverId?: string | null;
  onOpenNewSleeveModal?: () => void;
  onChange: (updates: {
    sleeve_type?: 'none' | 'single' | 'double' | 'triple';
    sleeve_fit_id?: string | null;
    sleeve_regular_id?: string | null;
    sleeve_over_id?: string | null;
    sleeve_action?: 'deduct' | 'add';
    sleeve_fit_action?: 'deduct' | 'add';
    sleeve_regular_action?: 'deduct' | 'add';
    sleeve_over_action?: 'deduct' | 'add';
  }) => void;
}

export const SyncCardSleevePicker: React.FC<SyncCardSleevePickerProps> = ({
  sleeveType = 'none',
  sleeveFitId,
  sleeveRegularId,
  sleeveOverId,
  sleeveAction = 'deduct',
  sleeveFitAction = 'deduct',
  sleeveRegularAction = 'deduct',
  sleeveOverAction = 'deduct',
  availableSleeves = [],
  defaultDeckFitSleeveName,
  defaultDeckFitId,
  defaultDeckSleeveName,
  defaultDeckRegularId,
  defaultDeckOverSleeveName,
  defaultDeckOverId,
  onOpenNewSleeveModal,
  onChange,
}) => {
  const regularOptions = buildRegularOptions(availableSleeves, defaultDeckSleeveName);
  const fitOptions = buildFitOptions(availableSleeves, defaultDeckFitSleeveName);
  const overOptions = buildOverOptions(availableSleeves, defaultDeckOverSleeveName);

  const isRegularOver = Boolean(sleeveOverId) || (!sleeveFitId && Boolean(defaultDeckOverId));

  const validation = validateSingleCopySleeveStock({
    form: {
      rarity: 'Common',
      condition: 'Near Mint',
      is_proxy: false,
      sleeve_type: sleeveType,
      sleeve_fit_id: sleeveFitId,
      sleeve_regular_id: sleeveRegularId,
      sleeve_over_id: sleeveOverId,
      sleeve_action: sleeveAction,
      sleeve_fit_action: sleeveFitAction,
      sleeve_regular_action: sleeveRegularAction,
      sleeve_over_action: sleeveOverAction,
    },
    availableSleeves,
    sectionFitId: defaultDeckFitId,
    sectionRegularId: defaultDeckRegularId,
    sectionOverId: defaultDeckOverId,
  });

  const handleLevelChange = (lvl: 'none' | 'single' | 'double' | 'triple') => {
    if (lvl === 'none') {
      onChange({ sleeve_type: 'none', sleeve_fit_id: null, sleeve_regular_id: null, sleeve_over_id: null });
    } else if (lvl === 'single') {
      onChange({ sleeve_type: 'single', sleeve_fit_id: null, sleeve_regular_id: sleeveRegularId || 'inherit', sleeve_over_id: null });
    } else if (lvl === 'double') {
      const prefersOver = Boolean(defaultDeckOverId) && !defaultDeckFitId;
      onChange({
        sleeve_type: 'double',
        sleeve_fit_id: prefersOver ? null : (sleeveFitId || (defaultDeckFitId ? 'inherit' : '')),
        sleeve_regular_id: sleeveRegularId || 'inherit',
        sleeve_over_id: prefersOver ? (sleeveOverId || (defaultDeckOverId ? 'inherit' : '')) : null,
      });
    } else {
      onChange({
        sleeve_type: 'triple',
        sleeve_fit_id: sleeveFitId || (defaultDeckFitId ? 'inherit' : ''),
        sleeve_regular_id: sleeveRegularId || 'inherit',
        sleeve_over_id: sleeveOverId || (defaultDeckOverId ? 'inherit' : ''),
      });
    }
  };

  const showFitLayer = sleeveType === 'triple' || (sleeveType === 'double' && !isRegularOver);
  const showOverLayer = sleeveType === 'triple' || (sleeveType === 'double' && isRegularOver);

  const deductNames: string[] = [];
  const addNames: string[] = [];
  if (showFitLayer) {
    if (sleeveFitAction === 'add') addNames.push('Inner (+1)');
    else deductNames.push('Inner (-1)');
  }
  if (sleeveRegularAction === 'add') addNames.push('Regular (+1)');
  else deductNames.push('Regular (-1)');
  if (showOverLayer) {
    if (sleeveOverAction === 'add') addNames.push('Over (+1)');
    else deductNames.push('Over (-1)');
  }

  return (
    <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-mono font-black uppercase text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-red-500" />
          <span>Fundas:</span>
        </span>
        <div className="flex items-center gap-1 bg-zinc-200/80 dark:bg-zinc-950 p-0.5 rounded-lg">
          {([
            { id: 'none', label: 'Sin' },
            { id: 'single', label: 'Simple' },
            { id: 'double', label: 'Doble' },
            { id: 'triple', label: 'Triple' },
          ] as const).map((lvl) => (
            <button
              key={lvl.id}
              type="button"
              onClick={() => handleLevelChange(lvl.id)}
              className={`px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold uppercase transition-all cursor-pointer ${
                sleeveType === lvl.id
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </div>

      {sleeveType === 'double' && (
        <div className="flex bg-zinc-200/70 dark:bg-zinc-950 p-0.5 rounded-lg text-[9.5px] font-mono font-bold">
          <button
            type="button"
            onClick={() => onChange({ sleeve_fit_id: defaultDeckFitId ? 'inherit' : '', sleeve_over_id: null })}
            className={`flex-1 py-1 rounded-md transition-all cursor-pointer text-center ${
              !isRegularOver ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Inner + Regular
          </button>
          <button
            type="button"
            onClick={() => onChange({ sleeve_over_id: defaultDeckOverId ? 'inherit' : '', sleeve_fit_id: null })}
            className={`flex-1 py-1 rounded-md transition-all cursor-pointer text-center ${
              isRegularOver ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Regular + Oversleeve
          </button>
        </div>
      )}

      {sleeveType !== 'none' && (
        <div className="space-y-2 pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
          {showFitLayer && (
            <SyncSleeveLayerRow
              label="🟢 Capa 1: Inner / Fit"
              labelColorClass="text-emerald-600 dark:text-emerald-400"
              action={sleeveFitAction}
              onChangeAction={(act) => onChange({ sleeve_fit_action: act })}
              value={sleeveFitId || (defaultDeckFitId ? 'inherit' : '')}
              onChangeValue={(val) => onChange({ sleeve_fit_id: val })}
              options={fitOptions}
              isOutOfStock={validation.fitOutOfStock}
              onOpenNewSleeveModal={onOpenNewSleeveModal}
            />
          )}

          <SyncSleeveLayerRow
            label={`🎴 Capa ${sleeveType === 'single' ? 'Única' : '2'}: Principal (Regular)`}
            labelColorClass="text-zinc-600 dark:text-zinc-400"
            action={sleeveRegularAction}
            onChangeAction={(act) => onChange({ sleeve_regular_action: act })}
            value={sleeveRegularId || 'inherit'}
            onChangeValue={(val) => onChange({ sleeve_regular_id: val })}
            options={regularOptions}
            isOutOfStock={validation.regularOutOfStock}
            onOpenNewSleeveModal={onOpenNewSleeveModal}
          />

          {showOverLayer && (
            <SyncSleeveLayerRow
              label="✨ Capa 3: Oversleeve (Exterior)"
              labelColorClass="text-purple-600 dark:text-purple-400"
              action={sleeveOverAction}
              onChangeAction={(act) => onChange({ sleeve_over_action: act })}
              value={sleeveOverId || (defaultDeckOverId ? 'inherit' : '')}
              onChangeValue={(val) => onChange({ sleeve_over_id: val })}
              options={overOptions}
              isOutOfStock={validation.overOutOfStock}
              onOpenNewSleeveModal={onOpenNewSleeveModal}
            />
          )}

          <SyncSleeveInventorySummary
            outOfStockNames={validation.outOfStockNames}
            deductNames={deductNames}
            addNames={addNames}
            onSetAllAction={(act) => onChange({
              sleeve_action: act,
              sleeve_fit_action: act,
              sleeve_regular_action: act,
              sleeve_over_action: act,
            })}
            onOpenNewSleeveModal={onOpenNewSleeveModal}
          />
        </div>
      )}
    </div>
  );
};
