'use client';

import React from 'react';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';
import { SleeveInventory, UserCard } from '@/types/collection';
import { Box, Plus, Check } from 'lucide-react';

export interface NewCardRegistrationForm {
  mode?: 'new' | 'take_existing';
  rarity: string;
  condition: string;
  is_proxy: boolean;
  sleeve_id?: string;
  selected_user_card_id?: string;
  notes?: string;
}

interface SyncCardFormDrawerProps {
  cardId: number;
  form: NewCardRegistrationForm;
  onChange: (fields: Partial<NewCardRegistrationForm>) => void;
  defaultDeckSleeveName?: string;
  availableSleeves?: SleeveInventory[];
  availableCopies?: UserCard[];
  onSelectExistingCopy?: (copy: UserCard, sleeveId?: string) => void;
}

import { RARITY_SELECT_OPTIONS, CONDITION_SELECT_OPTIONS } from './syncModal.constants';

export const SyncCardFormDrawer: React.FC<SyncCardFormDrawerProps> = ({
  form,
  onChange,
  defaultDeckSleeveName,
  availableSleeves = [],
  availableCopies = [],
  onSelectExistingCopy,
}) => {
  const mode = form.mode || 'new';

  const sleeveOptions = [
    {
      value: 'inherit',
      label: defaultDeckSleeveName
        ? `🎴 ${defaultDeckSleeveName} (Funda del Mazo)`
        : '🎴 Funda estándar del mazo',
    },
    { value: 'none', label: '🚫 Sin funda' },
    ...availableSleeves.map((s) => ({
      value: s.id,
      label: `🎴 ${s.name} (${s.brand || 'Genérica'} - ${s.color_pattern || 'Color'})`,
    })),
  ];

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
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Copias disponibles en inventario:
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
            {availableCopies.map((copy) => {
              const isSelected = form.selected_user_card_id === copy.id;
              return (
                <div
                  key={copy.id}
                  onClick={() => {
                    onChange({ selected_user_card_id: copy.id });
                    onSelectExistingCopy?.(copy, form.sleeve_id || 'inherit');
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-red-500/10 border-red-500/40 text-red-700 dark:text-red-300 ring-1 ring-red-500/30'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[9px] font-black uppercase">
                        {copy.rarity || 'Common'}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">{copy.condition || 'Near Mint'}</span>
                      {copy.is_proxy && (
                        <span className="text-[9px] px-1 bg-amber-500/10 text-amber-600 rounded font-bold">Proxy</span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                      {copy.sleeve_brand ? `Funda: ${copy.sleeve_brand}` : 'Sin funda'}
                    </p>
                  </div>
                  <span className={`p-1 rounded-lg ${isSelected ? 'bg-red-600 text-white' : 'text-zinc-400'}`}>
                    <Check className="w-3.5 h-3.5" />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
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

          <div>
            <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">
              Funda Asignada
            </label>
            <PremiumDropdown
              value={form.sleeve_id || 'inherit'}
              onChange={(val) => onChange({ sleeve_id: val })}
              size="sm"
              align="full"
              options={sleeveOptions}
            />
          </div>

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
