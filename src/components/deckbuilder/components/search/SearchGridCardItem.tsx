import React from 'react';
import { Card, HoverCardBase, SearchScope } from '../../types';
import { CardImage } from '@/components/ui/CardImage';

interface SearchGridCardItemProps {
  card: Card;
  idx: number;
  isMobile: boolean;
  searchScope?: SearchScope;
  ownedCount: number;
  banlistBadge: React.ReactNode;
  addCardToDeck: (card: Card) => void;
  openPreviewForCard?: (card: HoverCardBase) => void;
  handleDragCardStart: (e: React.DragEvent, cardData: Card) => void;
  handleCardMouseEnter: (card: HoverCardBase) => void;
  handleCardMouseLeave: () => void;
}

export const SearchGridCardItem: React.FC<SearchGridCardItemProps> = ({
  card,
  idx,
  isMobile,
  searchScope,
  ownedCount,
  banlistBadge,
  addCardToDeck,
  openPreviewForCard,
  handleDragCardStart,
  handleCardMouseEnter,
  handleCardMouseLeave,
}) => {
  return (
    <div
      key={`${card.id}-${idx}`}
      draggable={!isMobile}
      onDragStart={
        !isMobile
          ? (e) =>
              handleDragCardStart(e, {
                id: card.id,
                name: card.name,
                type: card.type,
                image_url: card.image_url_small || card.image_url,
                image_url_small: card.image_url_small,
                archetype: card.archetype,
                fromScope: searchScope,
                userCardsGroup: searchScope === 'collection' ? card.userCardsGroup : undefined,
              })
          : undefined
      }
      onClick={() => addCardToDeck(card)}
      onContextMenu={(e) => {
        e.preventDefault();
        if (openPreviewForCard) {
          openPreviewForCard(card as HoverCardBase);
        }
      }}
      onMouseEnter={!isMobile ? () => handleCardMouseEnter(card as HoverCardBase) : undefined}
      onMouseLeave={!isMobile ? handleCardMouseLeave : undefined}
      className="relative aspect-[3/4.4] bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-red-500 transition-all duration-200 group flex flex-col justify-between p-1 overflow-hidden cursor-pointer card-tap touch-manipulation shadow-xs"
    >
      <div className="relative flex-1 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        <CardImage
          src={card.image_url_small || card.image_url}
          alt={card.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
        />
        {banlistBadge}
        {ownedCount > 0 && (
          <div className="absolute top-1 right-1 bg-red-950/90 text-red-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-red-500/40 font-black shadow-xs">
            {ownedCount}x
          </div>
        )}
      </div>
      <div className="mt-1 transition-all text-center min-w-0 px-0.5">
        <p className="text-[9.5px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-red-500 transition-colors truncate leading-tight">
          {card.name}
        </p>
      </div>
    </div>
  );
};
