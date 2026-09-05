import React from 'react';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';
import { RARITIES, STATUS_FLAGS } from '../constants/cardFilters.constants';

interface CardCollectionFilterFieldsProps {
  showRarity?: boolean;
  showCollectionOptions?: boolean;
  rarity?: string;
  status?: string;
  onRarityChange: (val: string) => void;
  onStatusChange: (val: string) => void;
}

export const CardCollectionFilterFields: React.FC<CardCollectionFilterFieldsProps> = ({
  showRarity,
  showCollectionOptions,
  rarity,
  status,
  onRarityChange,
  onStatusChange,
}) => {
  return (
    <>
      {showRarity && (
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Rareza</label>
          <PremiumDropdown
            value={rarity || ''}
            onChange={onRarityChange}
            align="full"
            size="sm"
            placeholder="Todas"
            options={[
              { value: '', label: 'Todas' },
              ...RARITIES.map((r) => ({ value: r, label: r })),
            ]}
          />
        </div>
      )}

      {showCollectionOptions && (
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Destino</label>
          <PremiumDropdown
            value={status || ''}
            onChange={onStatusChange}
            align="full"
            size="sm"
            placeholder="Todos"
            options={[
              { value: '', label: 'Todos' },
              ...STATUS_FLAGS.map((f) => ({ value: f.value, label: f.label })),
            ]}
          />
        </div>
      )}
    </>
  );
};
