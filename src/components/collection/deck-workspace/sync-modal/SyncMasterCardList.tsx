'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { DeckCardDetail, UserCard } from '@/types/collection';
import { Search, CheckCircle2, Clock, Layers, ArrowDownLeft, AlertTriangle } from 'lucide-react';
import { countStagedCopies } from '../deckWorkspacePhysical.utils';
import { getCardEntryKey } from './syncModalSectionSleeves.utils';

interface SyncMasterCardListProps {
  cards: DeckCardDetail[];
  selectedCardKey: string | null;
  onSelectCard: (cardKey: string) => void;
  unassignedUserCards?: UserCard[];
  cardsWithStockErrors?: string[];
}

export const SyncMasterCardList: React.FC<SyncMasterCardListProps> = ({
  cards,
  selectedCardKey,
  onSelectCard,
  unassignedUserCards = [],
  cardsWithStockErrors = [],
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'registered' | 'removed'>(() => {
    return cards.some((c) => countStagedCopies(c) > 0) ? 'pending' : 'all';
  });
  const [search, setSearch] = useState('');

  const stats = useMemo(() => {
    let pending = 0;
    let registered = 0;
    cards.forEach((c) => {
      if (countStagedCopies(c) > 0) pending++;
      else registered++;
    });
    return { pending, registered, total: cards.length, removed: unassignedUserCards.length };
  }, [cards, unassignedUserCards]);

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      const matchesSearch = !search || c.card_details?.name.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      const staged = countStagedCopies(c);
      if (filter === 'pending') return staged > 0;
      if (filter === 'registered') return staged === 0;
      return true;
    });
  }, [cards, search, filter]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-950/40 border-r border-zinc-200 dark:border-zinc-800 min-h-0">
      {/* Search & Tabs */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por nombre..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-red-500 transition-colors"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {(
            [
              { id: 'all' as const, label: `Todas (${stats.total})` },
              { id: 'pending' as const, label: `Pendientes (${stats.pending})` },
              { id: 'registered' as const, label: `Registradas (${stats.registered})` },
              ...(stats.removed > 0 ? [{ id: 'removed' as const, label: `Retiradas (${stats.removed})` }] : []),
            ]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filter === tab.id
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                  : 'bg-zinc-200/70 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Card List Items */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-2 scrollbar-thin">
        {filter === 'removed' ? (
          unassignedUserCards.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-400">No hay cartas retiradas</div>
          ) : (
            unassignedUserCards.map((uc) => (
              <div
                key={uc.id}
                className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-500/30 flex items-center gap-3 text-xs"
              >
                <ArrowDownLeft className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 truncate">
                    {uc.card_details?.name || 'Carta retirada'}
                  </p>
                  <p className="text-[10px] text-zinc-500">Se moverá a la colección sin asignar</p>
                </div>
              </div>
            ))
          )
        ) : filteredCards.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
            <Layers className="w-6 h-6 opacity-40" />
            <span>No se encontraron cartas</span>
          </div>
        ) : (
          filteredCards.map((card) => {
            const cardKey = getCardEntryKey(card);
            const isSelected = selectedCardKey === cardKey;
            const staged = countStagedCopies(card);
            const regCount = card.physical_copies?.length || 0;
            const imageUrl = card.card_details?.image_url_small || card.card_details?.image_url;

            return (
              <button
                key={cardKey}
                type="button"
                onClick={() => onSelectCard(cardKey)}
                className={`w-full text-left p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                  isSelected
                    ? 'border-red-500/70 bg-red-500/10 dark:bg-red-500/15 ring-1 ring-red-500/30 shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="w-9 h-12 relative rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={card.card_details?.name || ''} fill sizes="36px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[9px] text-zinc-400">?</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${isSelected ? 'text-red-700 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                    {card.card_details?.name || 'Carta Yu-Gi-Oh!'}
                  </p>

                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-mono uppercase text-zinc-500">
                      {card.section === 'main' ? 'Main' : card.section === 'extra' ? 'Extra' : card.section === 'side' ? 'Side' : 'Reserva'}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <span className="text-[10px] text-zinc-400 truncate">
                      x{card.count} en mazo
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {cardsWithStockErrors.includes(cardKey) && (
                    <span title="Funda sin existencias libres disponibles">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    </span>
                  )}
                  {staged > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold">
                      <Clock className="w-3 h-3" />
                      <span>+{staged}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{regCount}</span>
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
