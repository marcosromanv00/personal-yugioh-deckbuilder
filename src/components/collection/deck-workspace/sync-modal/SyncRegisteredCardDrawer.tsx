'use client';

import React from 'react';
import { StorageLocation, UserCard, DeckCardDetail, SleeveInventory, DeckCardPhysicalCopy } from '@/types/collection';
import { SyncRegisteredCopyRow } from './SyncRegisteredCopyRow';
import { Plus } from 'lucide-react';

export interface CardSubstitution {
  outgoingUserCardId: string;
  destinationType: 'inbox' | 'location' | 'delete';
  targetLocationId?: string;
  incomingMode: 'new' | 'take_existing';
  incomingRarity: string;
  incomingCondition: string;
  incomingIsProxy: boolean;
  incomingSleeveId?: string;
  incomingUserCardId?: string;
}

interface SyncRegisteredCardDrawerProps {
  card: DeckCardDetail;
  locations: StorageLocation[];
  defaultDeckSleeveName?: string;
  availableSleeves?: SleeveInventory[];
  availableCopies?: UserCard[];
  substitutions: Record<string, CardSubstitution>;
  onUpdateSubstitution: (userCardId: string, sub: CardSubstitution | null) => void;
  onAddCopy: (cardId: number) => void;
}

export const SyncRegisteredCardDrawer: React.FC<SyncRegisteredCardDrawerProps> = ({
  card,
  locations,
  defaultDeckSleeveName,
  availableSleeves = [],
  availableCopies: _availableCopies = [],
  substitutions,
  onUpdateSubstitution,
  onAddCopy,
}) => {
  const copies = card.physical_copies || [];

  const sleeveOptions = [
    {
      value: 'inherit',
      label: defaultDeckSleeveName ? `(Heredado) ${defaultDeckSleeveName}` : '(Heredado) Funda del Mazo',
    },
    { value: 'none', label: '🚫 Sin funda' },
    ...availableSleeves.map((s) => ({
      value: s.id,
      label: `🎴 ${s.name} (${s.brand || 'Genérica'})`,
    })),
  ];

  const destinationOptions = [
    { value: 'inbox', label: '📥 Inbox (Sin clasificar)' },
    { value: 'delete', label: '🗑️ Dar de baja / Eliminar' },
    ...locations.map((loc) => ({
      value: loc.id,
      label: `📦 ${loc.name}`,
    })),
  ];

  const handleStartSubstitute = (copy: DeckCardPhysicalCopy, idx: number) => {
    const copyId = copy.user_card_id || `placeholder-${card.card_id}-${idx}`;
    if (!substitutions[copyId]) {
      onUpdateSubstitution(copyId, {
        outgoingUserCardId: copyId,
        destinationType: 'inbox',
        incomingMode: 'new',
        incomingRarity: copy.rarity || 'Common',
        incomingCondition: 'Near Mint',
        incomingIsProxy: false,
        incomingSleeveId: 'inherit',
      });
    }
  };

  return (
    <div className="p-3 bg-zinc-100/70 dark:bg-zinc-950/70 rounded-xl border border-zinc-200 dark:border-zinc-800/80 space-y-3 mt-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase text-zinc-500 font-mono">
          Copias Físicas en el Mazo ({copies.length})
        </span>
        <button
          type="button"
          onClick={() => onAddCopy(card.card_id)}
          className="px-2 py-1 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-600 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Añadir otra copia</span>
        </button>
      </div>

      <div className="space-y-2">
        {copies.map((copy, idx) => {
          const copyId = copy.user_card_id || `placeholder-${card.card_id}-${idx}`;
          return (
            <SyncRegisteredCopyRow
              key={copyId}
              idx={idx}
              copy={copy}
              currentSub={substitutions[copyId]}
              destinationOptions={destinationOptions}
              sleeveOptions={sleeveOptions}
              onStartSubstitute={() => handleStartSubstitute(copy, idx)}
              onUndoSubstitute={() => onUpdateSubstitution(copyId, null)}
              onUpdateSubstitution={(sub) => onUpdateSubstitution(copyId, sub)}
            />
          );
        })}
      </div>
    </div>
  );
};
