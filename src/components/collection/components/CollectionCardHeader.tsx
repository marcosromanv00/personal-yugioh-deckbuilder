'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { UserCard, Deck } from '@/types/collection';

interface CollectionCardHeaderProps {
  userCard: UserCard;
  assignedDeck?: Deck;
  isSaving?: boolean;
}

export const CollectionCardHeader: React.FC<CollectionCardHeaderProps> = ({
  userCard,
  assignedDeck,
  isSaving,
}) => {
  const cardDetails = userCard.card_details;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase">
          {cardDetails?.type || 'Carta'}
        </span>
        {cardDetails?.archetype && (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
            {cardDetails.archetype}
          </span>
        )}
        {cardDetails?.attribute && (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {cardDetails.attribute}
          </span>
        )}
        {isSaving && (
          <span className="text-[10px] font-mono text-amber-500 font-bold animate-pulse ml-auto">
            Guardando...
          </span>
        )}
      </div>

      <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">
        {cardDetails?.name || `Carta #${userCard.card_id}`}
      </h2>

      {(cardDetails?.atk !== undefined || cardDetails?.level !== undefined) && (
        <div className="flex items-center gap-3 text-xs font-mono font-bold text-zinc-500">
          {cardDetails.level !== undefined && (
            <span>★ Nivel/Rango: <b className="text-zinc-900 dark:text-white">{cardDetails.level}</b></span>
          )}
          {cardDetails.atk !== undefined && (
            <span>ATK: <b className="text-zinc-900 dark:text-white">{cardDetails.atk}</b></span>
          )}
          {cardDetails.def !== undefined && (
            <span>DEF: <b className="text-zinc-900 dark:text-white">{cardDetails.def}</b></span>
          )}
        </div>
      )}

      {assignedDeck && (
        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
            <BookOpen className="w-4 h-4" />
            <span>Asignada a Baraja: <b>{assignedDeck.name}</b> ({userCard.deck_section?.toUpperCase() || 'MAIN'})</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-600 text-white">EN MAZO</span>
        </div>
      )}
    </div>
  );
};
