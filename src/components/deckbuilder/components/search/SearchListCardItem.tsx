import React from 'react';
import { Card, HoverCardBase, SearchScope } from '../../types';
import { CardImage } from '@/components/ui/CardImage';

interface SearchListCardItemProps {
  card: Card;
  idx: number;
  isMobile: boolean;
  searchScope?: SearchScope;
  ownedCount: number;
  addCardToDeck: (card: Card, section?: 'main' | 'extra' | 'side' | 'extras') => void;
  openPreviewForCard?: (card: HoverCardBase) => void;
  handleDragCardStart: (e: React.DragEvent, cardData: Card) => void;
  handleCardMouseEnter: (card: HoverCardBase) => void;
  handleCardMouseLeave: () => void;
}

export const SearchListCardItem: React.FC<SearchListCardItemProps> = ({
  card,
  idx,
  isMobile,
  searchScope,
  ownedCount,
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
      onDragStart={(e) =>
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
      }
      onClick={() => addCardToDeck(card)}
      onContextMenu={(e) => {
        e.preventDefault();
        if (openPreviewForCard) {
          openPreviewForCard(card as HoverCardBase);
        }
      }}
      onMouseEnter={() => handleCardMouseEnter(card as HoverCardBase)}
      onMouseLeave={handleCardMouseLeave}
      className="flex gap-3 p-3 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-red-500 transition-all duration-200 group cursor-pointer shadow-xs touch-manipulation"
    >
      <div className="w-14 h-20 rounded-lg overflow-hidden shadow-xs group-hover:scale-105 transition-transform shrink-0">
        <CardImage
          src={card.image_url_small || card.image_url}
          alt={card.name}
          className="w-full h-full object-contain"
        />
      </div>
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100 truncate group-hover:text-red-500 transition-colors">
              {card.name}
            </p>
            {ownedCount > 0 && (
              <span className="text-[10px] font-mono font-bold text-red-500 shrink-0">
                {ownedCount}x
              </span>
            )}
          </div>
          <p className="text-[10px] text-zinc-500 font-mono font-bold truncate mt-0.5">
            #{card.id} • {card.type} • {card.archetype || 'Genérica'}
          </p>
        </div>

        <div className="flex gap-1.5 mt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addCardToDeck(card, 'main');
            }}
            className="flex-1 py-2 px-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs touch-manipulation min-h-10"
            title="Añadir al Deck principal o Extra (Auto)"
          >
            + Agregar
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addCardToDeck(card, 'side');
            }}
            className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation min-h-10"
            title="Añadir a Side Deck"
          >
            + Side
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addCardToDeck(card, 'extra');
            }}
            className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation min-h-10"
            title="Añadir a Extra Deck"
          >
            + Extra
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addCardToDeck(card, 'extras');
            }}
            className="px-2.5 py-2 bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/50 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation min-h-10"
            title="Añadir a Reserva / Cartas Extra del Arquetipo"
          >
            + Reserva
          </button>
        </div>
      </div>
    </div>
  );
};
