'use client';

import React from 'react';
import { PackageMinus, PackagePlus, AlertCircle } from 'lucide-react';
import { PremiumDropdown, DropdownOption } from '@/components/ui/PremiumDropdown';

interface SyncSleeveLayerRowProps {
  label: React.ReactNode;
  labelColorClass?: string;
  action: 'deduct' | 'add';
  onChangeAction: (action: 'deduct' | 'add') => void;
  value: string;
  onChangeValue: (val: string | null) => void;
  options: DropdownOption[];
  isOutOfStock: boolean;
  onOpenNewSleeveModal?: () => void;
}

export const SyncSleeveLayerRow: React.FC<SyncSleeveLayerRowProps> = ({
  label,
  labelColorClass = 'text-zinc-500',
  action,
  onChangeAction,
  value,
  onChangeValue,
  options,
  isOutOfStock,
  onOpenNewSleeveModal,
}) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-1.5">
        <label className={`text-[9.5px] font-mono font-bold uppercase truncate ${labelColorClass}`}>
          {label}
        </label>
        {/* Micro-selector granular de inventario por capa */}
        <div className="flex bg-zinc-200/80 dark:bg-zinc-950 p-0.5 rounded-md gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onChangeAction('deduct')}
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
              action === 'deduct'
                ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
            title="Deducir (-1) del inventario existente"
          >
            <PackageMinus className="w-2.5 h-2.5 text-red-400" />
            <span>-1 <span className="hidden sm:inline font-sans font-medium text-[8.5px]">Deducir</span></span>
          </button>
          <button
            type="button"
            onClick={() => onChangeAction('add')}
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
              action === 'add'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
            title="Sumar (+1) como funda nueva al inventario"
          >
            <PackagePlus className="w-2.5 h-2.5 text-emerald-200" />
            <span>+1 <span className="hidden sm:inline font-sans font-medium text-[8.5px]">Sumar</span></span>
          </button>
        </div>
      </div>

      <PremiumDropdown
        value={value}
        onChange={(val) => onChangeValue(val ? String(val) : null)}
        size="sm"
        align="full"
        options={options}
      />

      {isOutOfStock && action === 'deduct' && (
        <div className="px-2 py-1 rounded-md bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-[9.5px] font-mono flex items-center justify-between gap-1.5 animate-in fade-in duration-150">
          <div className="flex items-center gap-1 min-w-0">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span className="truncate">Sin unidades libres. Cambia a (+1) o añade stock.</span>
          </div>
          {onOpenNewSleeveModal && (
            <button
              type="button"
              onClick={onOpenNewSleeveModal}
              className="shrink-0 px-1.5 py-0.2 bg-red-600 text-white rounded text-[9px] font-bold hover:bg-red-700 cursor-pointer"
            >
              + Stock
            </button>
          )}
        </div>
      )}
    </div>
  );
};
