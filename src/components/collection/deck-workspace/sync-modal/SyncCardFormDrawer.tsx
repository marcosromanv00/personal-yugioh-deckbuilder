'use client';

import React from 'react';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

export interface NewCardRegistrationForm {
  rarity: string;
  condition: string;
  is_proxy: boolean;
  notes?: string;
}

interface SyncCardFormDrawerProps {
  cardId: number;
  form: NewCardRegistrationForm;
  onChange: (fields: Partial<NewCardRegistrationForm>) => void;
}

const RARITY_SELECT_OPTIONS = [
  { value: 'Common', label: 'Common (Común)' },
  { value: 'Rare', label: 'Rare (Rara)' },
  { value: 'Super Rare', label: 'Super Rare' },
  { value: 'Ultra Rare', label: 'Ultra Rare' },
  { value: 'Secret Rare', label: 'Secret Rare' },
  { value: 'Quarter Century Secret Rare', label: '25th Quarter Century' },
  { value: 'Collector\'s Rare', label: 'Collector\'s Rare' },
  { value: 'Ultimate Rare', label: 'Ultimate Rare' },
  { value: 'Starlight Rare', label: 'Starlight Rare' },
  { value: 'Ghost Rare', label: 'Ghost Rare' },
  { value: 'Gold Rare', label: 'Gold Rare' },
  { value: 'Proxy', label: '🖨️ Proxy' },
];

const CONDITION_SELECT_OPTIONS = [
  { value: 'Near Mint', label: 'Near Mint (NM)' },
  { value: 'Lightly Played', label: 'Lightly Played (LP)' },
  { value: 'Moderately Played', label: 'Moderately Played (MP)' },
  { value: 'Heavily Played', label: 'Heavily Played (HP)' },
  { value: 'Damaged', label: 'Damaged (DMG)' },
];

export const SyncCardFormDrawer: React.FC<SyncCardFormDrawerProps> = ({
  cardId,
  form,
  onChange,
}) => {
  return (
    <div className="p-3 bg-zinc-100/70 dark:bg-zinc-950/70 rounded-xl border border-zinc-200 dark:border-zinc-800/80 space-y-2.5 mt-2 animate-fade-in text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">
            Rareza Física
          </label>
          <PremiumDropdown
            value={form.rarity}
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
            value={form.condition}
            onChange={(val) => onChange({ condition: val })}
            size="sm"
            align="full"
            options={CONDITION_SELECT_OPTIONS}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-zinc-800">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.is_proxy}
            onChange={(e) => onChange({ is_proxy: e.target.checked })}
            className="rounded border-zinc-300 text-red-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
          />
          <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
            Marcar como copia Proxy (impresión / sustituto)
          </span>
        </label>
      </div>
    </div>
  );
};
