import React from 'react';
import { Card } from '../../types';

export function renderBanlistBadge(card: Card, format?: 'Master Duel' | 'TCG' | 'Duel Links'): React.ReactNode {
  const status =
    format === 'TCG' ? card.ban_tcg :
    format === 'Master Duel' ? card.ban_master_duel :
    card.ban_duel_links;

  if (!status || status === 'Unlimited') return null;

  if (status === 'Forbidden') {
    return (
      <div
        className="absolute top-1 left-1 bg-black border-2 border-red-600 text-red-500 font-sans font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md shadow-black/80 z-20 select-none"
        title="Prohibida (0 copias)"
      >
        🚫
      </div>
    );
  }

  if (status === 'Limited') {
    return (
      <div
        className="absolute top-1 left-1 bg-black border-2 border-red-500 text-yellow-400 font-sans font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md shadow-black/80 z-20 select-none"
        title="Limitada (1 copia)"
      >
        1
      </div>
    );
  }

  if (status === 'Semi-Limited') {
    return (
      <div
        className="absolute top-1 left-1 bg-black border-2 border-blue-500 text-yellow-400 font-sans font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md shadow-black/80 z-20 select-none"
        title="Semi-limitada (2 copias)"
      >
        2
      </div>
    );
  }

  return null;
}

export function getCardOwnedCount(card: Card, userInventoryCounts?: Record<number, number>): number {
  if (card.userCardsGroup && card.userCardsGroup.length > 0) {
    return card.userCardsGroup.reduce((sum, uc) => sum + (uc.quantity || 1), 0);
  }
  return userInventoryCounts?.[card.id] || 0;
}
