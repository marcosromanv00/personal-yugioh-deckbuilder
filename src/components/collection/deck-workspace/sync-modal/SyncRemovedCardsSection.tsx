'use client';

import React from 'react';
import { Inbox, ArrowRight } from 'lucide-react';
import { UserCard } from '@/types/collection';

interface SyncRemovedCardsSectionProps {
  unassignedUserCards: UserCard[];
}

export const SyncRemovedCardsSection: React.FC<SyncRemovedCardsSectionProps> = ({
  unassignedUserCards,
}) => {
  if (unassignedUserCards.length === 0) return null;

  return (
    <div className="p-3.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
        <Inbox className="w-4 h-4 shrink-0" />
        <h4 className="font-bold text-xs uppercase tracking-wider">
          Cartas que retornan a Bandeja Sin Clasificar (Inbox)
        </h4>
        <span className="ml-auto text-[10px] font-mono font-black bg-amber-500/10 px-2 py-0.5 rounded">
          {unassignedUserCards.length} {unassignedUserCards.length === 1 ? 'copia' : 'copias'}
        </span>
      </div>

      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
        Estas copias físicas fueron retiradas del mazo. Al guardar, quedarán liberadas en tu Bandeja de Entrada para que puedas devolverlas a tus binders o reubicarlas:
      </p>

      <div className="max-h-32 overflow-y-auto space-y-1 pr-1 scrollbar-thin text-xs">
        {unassignedUserCards.map((uc) => (
          <div
            key={uc.id}
            className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px]"
          >
            <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate">
              {uc.card_details?.name || `Carta #${uc.card_id}`}
            </span>
            <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] text-zinc-500">
              <span>{uc.rarity || 'Common'}</span>
              <ArrowRight className="w-3 h-3 text-zinc-400" />
              <span className="text-amber-600 dark:text-amber-400 font-bold">Inbox</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
