'use client';

import React from 'react';
import { UserCard } from '@/types/collection';
import { Check } from 'lucide-react';

interface SyncCardExistingCopiesPickerProps {
  availableCopies: UserCard[];
  selectedUserCardId?: string;
  onSelectCopy: (copy: UserCard) => void;
}

export const SyncCardExistingCopiesPicker: React.FC<SyncCardExistingCopiesPickerProps> = ({
  availableCopies,
  selectedUserCardId,
  onSelectCopy,
}) => {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
        Copias disponibles en inventario:
      </p>
      <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
        {availableCopies.map((copy) => {
          const isSelected = selectedUserCardId === copy.id;
          return (
            <div
              key={copy.id}
              onClick={() => onSelectCopy(copy)}
              className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
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
  );
};
