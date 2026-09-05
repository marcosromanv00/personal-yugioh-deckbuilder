'use client';

import React from 'react';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';
import { SleeveInventory, UserCard, StorageLocation } from '@/types/collection';
import { Box, Plus } from 'lucide-react';
import { SyncCardSleevePicker } from './SyncCardSleevePicker';
import { SyncCardLocationPicker } from './SyncCardLocationPicker';
import { SyncCardExistingCopiesPicker } from './SyncCardExistingCopiesPicker';
import { RARITY_SELECT_OPTIONS, CONDITION_SELECT_OPTIONS } from './syncModal.constants';

export interface NewCardRegistrationForm {
  mode?: 'new' | 'take_existing';
  rarity: string;
  condition: string;
  is_proxy: boolean;
  sleeve_id?: string;
  sleeve_type?: 'none' | 'single' | 'double' | 'triple';
  sleeve_fit_id?: string | null;
  sleeve_regular_id?: string | null;
  sleeve_over_id?: string | null;
  sleeve_action?: 'deduct' | 'add';
  sleeve_fit_action?: 'deduct' | 'add';
  sleeve_regular_action?: 'deduct' | 'add';
  sleeve_over_action?: 'deduct' | 'add';
  storage_location_id?: string | null;
  compartment_index?: number | null;
  selected_user_card_id?: string;
  notes?: string;
}

interface SyncCardFormDrawerProps {
  cardId: number;
  form: NewCardRegistrationForm;
  onChange: (fields: Partial<NewCardRegistrationForm>) => void;
  locations?: StorageLocation[];
  defaultDeckFitSleeveName?: string;
  defaultDeckFitId?: string | null;
  defaultDeckSleeveName?: string;
  defaultDeckRegularId?: string | null;
  defaultDeckOverSleeveName?: string;
  defaultDeckOverId?: string | null;
  defaultStorageLocationId?: string | null;
  defaultCompartmentIndex?: number | null;
  availableSleeves?: SleeveInventory[];
  availableCopies?: UserCard[];
  onOpenNewSleeveModal?: () => void;
  onSelectExistingCopy?: (copy: UserCard, sleeveId?: string) => void;
}

export const SyncCardFormDrawer: React.FC<SyncCardFormDrawerProps> = ({
  form,
  onChange,
  locations = [],
  defaultDeckFitSleeveName,
  defaultDeckFitId,
  defaultDeckSleeveName,
  defaultDeckRegularId,
  defaultDeckOverSleeveName,
  defaultDeckOverId,
  defaultStorageLocationId,
  defaultCompartmentIndex = 0,
  availableSleeves = [],
  availableCopies = [],
  onOpenNewSleeveModal,
  onSelectExistingCopy,
}) => {
  const mode = form.mode || 'new';

  return (
    <div className="p-3 bg-zinc-100/70 dark:bg-zinc-950/70 rounded-xl border border-zinc-200 dark:border-zinc-800/80 space-y-3 mt-2 text-xs">
      {availableCopies.length > 0 && (
        <div className="flex bg-zinc-200/80 dark:bg-zinc-900 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => onChange({ mode: 'new' })}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'new'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Plus className="w-3 h-3 text-red-500" />
            <span>Registrar Nueva Copia</span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ mode: 'take_existing' })}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'take_existing'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Box className="w-3 h-3 text-amber-500" />
            <span>Tomar de Colección ({availableCopies.length})</span>
          </button>
        </div>
      )}

      {mode === 'take_existing' && availableCopies.length > 0 ? (
        <SyncCardExistingCopiesPicker
          availableCopies={availableCopies}
          selectedUserCardId={form.selected_user_card_id}
          onSelectCopy={(copy) => {
            onChange({ selected_user_card_id: copy.id });
            onSelectExistingCopy?.(copy, form.sleeve_id || 'inherit');
          }}
        />
      ) : (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">
                Rareza Física
              </label>
              <PremiumDropdown
                value={form.rarity || 'Common'}
                onChange={(val) => onChange({ rarity: val, is_proxy: val === 'Proxy' ? true : form.is_proxy })}
                size="sm"
                align="full"
                options={RARITY_SELECT_OPTIONS}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">
                Condición
              </label>
              <PremiumDropdown
                value={form.condition || 'Near Mint'}
                onChange={(val) => onChange({ condition: val })}
                size="sm"
                align="full"
                options={CONDITION_SELECT_OPTIONS}
              />
            </div>
          </div>

          <SyncCardSleevePicker
            sleeveType={form.sleeve_type || 'none'}
            sleeveFitId={form.sleeve_fit_id}
            sleeveRegularId={form.sleeve_regular_id}
            sleeveOverId={form.sleeve_over_id}
            sleeveAction={form.sleeve_action || 'deduct'}
            sleeveFitAction={form.sleeve_fit_action || form.sleeve_action || 'deduct'}
            sleeveRegularAction={form.sleeve_regular_action || form.sleeve_action || 'deduct'}
            sleeveOverAction={form.sleeve_over_action || form.sleeve_action || 'deduct'}
            availableSleeves={availableSleeves}
            defaultDeckFitSleeveName={defaultDeckFitSleeveName}
            defaultDeckFitId={defaultDeckFitId}
            defaultDeckSleeveName={defaultDeckSleeveName}
            defaultDeckRegularId={defaultDeckRegularId}
            defaultDeckOverSleeveName={defaultDeckOverSleeveName}
            defaultDeckOverId={defaultDeckOverId}
            onOpenNewSleeveModal={onOpenNewSleeveModal}
            onChange={(updates) => onChange(updates)}
          />

          <SyncCardLocationPicker
            locations={locations}
            selectedLocationId={form.storage_location_id !== undefined ? form.storage_location_id : defaultStorageLocationId}
            selectedCompartmentIndex={form.compartment_index !== undefined ? form.compartment_index : defaultCompartmentIndex}
            onChange={(updates) => onChange(updates)}
          />

          <div className="flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-zinc-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_proxy || false}
                onChange={(e) => onChange({ is_proxy: e.target.checked })}
                className="rounded border-zinc-300 text-red-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                Marcar como copia Proxy (impresión / sustituto)
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
