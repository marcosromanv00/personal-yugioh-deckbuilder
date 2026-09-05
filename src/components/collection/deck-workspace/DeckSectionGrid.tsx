'use client';

import React from 'react';
import { StorageLocation, UserCard, DeckCardDetail, SleeveInventory } from '@/types/collection';
import { MobileDeckTab } from './types';
import { DeckSectionCardTile } from './DeckSectionCardTile';

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
  availableSleeves?: SleeveInventory[];
  mainSleeveId?: string;
  extraSleeveId?: string;
  poolSleeveId?: string;
  isMobile: boolean;
  setMobileTab: (tab: MobileDeckTab) => void;
  emptyMessage: string;
  emptySubMessage: string;
  badgeLabel?: string;
  badgeColorClass?: string;
  handleDragCardStart?: (e: React.DragEvent, cardData: { id: number; name: string; type?: string; image_url?: string; archetype?: string; fromSection?: 'main' | 'extra' | 'side' | 'pool' | 'extras' }) => void;
  handleDropCardOnSection?: (e: React.DragEvent, targetSection: 'main' | 'extra' | 'side' | 'pool' | 'extras') => void;
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
  availableSleeves = [],
  mainSleeveId = '',
  extraSleeveId = '',
  poolSleeveId = '',
  isMobile,
  setMobileTab,
  emptyMessage,
  emptySubMessage,
  badgeLabel,
  badgeColorClass = 'bg-zinc-900/90 text-zinc-200 border-zinc-700/50',
  handleDragCardStart,
  handleDropCardOnSection,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  if (cards.length === 0) {
    return (
      <div 
        onDragOver={(e) => {
          e.preventDefault();
          if (!isDragOver) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          setIsDragOver(false);
          handleDropCardOnSection?.(e, sectionKey);
        }}
        className={`py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-200 ${
          isDragOver
            ? 'border-red-500 bg-red-500/10 text-red-500 scale-[1.01] shadow-md'
            : 'border-zinc-200 dark:border-zinc-800/80 text-zinc-400'
        }`}
      >
        <p className="text-xs font-bold">{emptyMessage}</p>
        <p className="text-[10.5px] mt-0.5">{emptySubMessage}</p>
        <p className="text-[9px] font-mono mt-1 opacity-70">Arrastra cartas aquí para añadirlas a {sectionName}</p>
      </div>
    );
  }

  return (
    <div 
      onDragOver={(e) => {
        e.preventDefault();
        if (!isDragOver) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        handleDropCardOnSection?.(e, sectionKey);
      }}
      className={`grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1.5 sm:gap-2 p-1.5 rounded-2xl transition-all duration-200 ${
        isDragOver ? 'ring-2 ring-red-500 bg-red-500/5' : ''
      }`}
    >
      {cards.map((cardDetail, idx) => (
        <DeckSectionCardTile
          key={`${sectionKey}-${cardDetail.card_id}-${idx}`}
          cardDetail={cardDetail}
          idx={idx}
          sectionKey={sectionKey}
          isSelected={selectedCardDetail?.card_id === cardDetail.card_id && selectedCardDetail.section === cardDetail.section}
          onSelectCard={onSelectCard}
          userCards={userCards}
          locations={locations}
          storageLocationId={storageLocationId}
          currentBaseLocation={currentBaseLocation}
          availableSleeves={availableSleeves}
          mainSleeveId={mainSleeveId}
          extraSleeveId={extraSleeveId}
          poolSleeveId={poolSleeveId}
          isMobile={isMobile}
          setMobileTab={setMobileTab}
          badgeLabel={badgeLabel}
          badgeColorClass={badgeColorClass}
          handleDragCardStart={handleDragCardStart}
        />
      ))}
    </div>
  );
};
