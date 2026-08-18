'use client';

import React from 'react';
import { StorageLocation, UserCard, DeckCardDetail } from '@/types/collection';
import { MobileDeckTab } from './types';

interface DeckSectionGridProps {
  cards: DeckCardDetail[];
  sectionName: string;
  sectionKey: 'main' | 'extra' | 'side' | 'pool';
  selectedCardDetail: DeckCardDetail | null;
  onSelectCard: (card: DeckCardDetail) => void;
  userCards: UserCard[];
  locations: StorageLocation[];
  storageLocationId: string;
  currentBaseLocation?: StorageLocation;
  isMobile: boolean;
  setMobileTab: (tab: MobileDeckTab) => void;
  emptyMessage: string;
  emptySubMessage: string;
  badgeLabel?: string;
  badgeColorClass?: string;
}

export const DeckSectionGrid: React.FC<DeckSectionGridProps> = ({
  cards,
  sectionName,
  sectionKey,
  selectedCardDetail,
  onSelectCard,
  userCards,
  locations,
  storageLocationId,
  currentBaseLocation,
  isMobile,
  setMobileTab,
  emptyMessage,
  emptySubMessage,
  badgeLabel,
  badgeColorClass = 'bg-zinc-900/90 text-zinc-200 border-zinc-700/50',
}) => {
  if (cards.length === 0) {
    return (
      <div className="py-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center text-center text-zinc-400">
        <p className="text-xs font-bold">{emptyMessage}</p>
        <p className="text-[10.5px] mt-0.5">{emptySubMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1.5 sm:gap-2">
      {cards.map((cardDetail, idx) => {
        const isSelected = selectedCardDetail?.card_id === cardDetail.card_id && selectedCardDetail.section === cardDetail.section;
        const physicalCards = userCards.filter(uc => uc.card_id === cardDetail.card_id);
        const hasPhysical = physicalCards.length > 0;
        const cardLocationId = physicalCards[0]?.storage_location_id;
        const cardLoc = cardLocationId ? locations.find(l => l.id === cardLocationId) : null;

        return (
          <div
            key={`${sectionKey}-${cardDetail.card_id}-${idx}`}
            onClick={() => {
              onSelectCard(cardDetail);
              if (isMobile) setMobileTab('right');
            }}
            className={`relative aspect-3/4.4 bg-white dark:bg-zinc-900 rounded-xl border p-1 flex flex-col justify-between overflow-hidden cursor-pointer transition-all shadow-2xs group ${
              isSelected
                ? 'border-red-500 ring-2 ring-red-500/40 shadow-md scale-102'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
            }`}
          >
            <div className="relative flex-1 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cardDetail.card_details?.image_url_small || cardDetail.card_details?.image_url}
                alt={cardDetail.card_details?.name || 'Carta'}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                loading="lazy"
              />
              <div className="absolute top-1 right-1 bg-black/85 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-md font-black shadow-xs">
                {cardDetail.count}x
              </div>
              {badgeLabel && (
                <div className="absolute top-1 left-1">
                  <span className={`text-[8px] font-black uppercase px-1 py-0.2 rounded border ${badgeColorClass}`}>
                    {badgeLabel}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-1 px-0.5 text-center min-w-0">
              <p className="text-[9.5px] font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-red-500 transition-colors">
                {cardDetail.card_details?.name}
              </p>
              <div className="mt-0.5">
                {hasPhysical ? (
                  <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400 truncate block">
                    📍 {cardLoc ? cardLoc.name : (storageLocationId ? (currentBaseLocation?.name || 'En Deckbox') : 'Sin clasificar')}
                  </span>
                ) : (
                  <span className="text-[8px] font-mono text-amber-600 dark:text-amber-400 font-bold block">
                    ⚠️ Solo Receta
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
