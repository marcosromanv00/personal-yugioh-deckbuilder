'use client';

import React from 'react';
import { UserCard } from '@/types/collection';

interface TriageQueueFilmstripProps {
  cards: UserCard[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
}

export const TriageQueueFilmstrip: React.FC<TriageQueueFilmstripProps> = ({
  cards,
  currentIndex,
  onSelectIndex,
}) => {
  if (cards.length === 0) return null;

  // Mostramos una ventana de cartas alrededor del cursor actual (3 previas, activa, 10 siguientes)
  const windowStart = Math.max(0, currentIndex - 3);
  const windowEnd = Math.min(cards.length, currentIndex + 11);
  const visibleCards = cards.slice(windowStart, windowEnd);

  return (
    <div className="w-full bg-zinc-100/70 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 overflow-x-auto shrink-0 select-none">
      <div className="max-w-7xl mx-auto flex items-center gap-2">
        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
          Cola:
        </span>

        {visibleCards.map((card, idx) => {
          const actualIndex = windowStart + idx;
          const isActive = actualIndex === currentIndex;
          const isPast = actualIndex < currentIndex;
          const imgUrl = card.card_details?.image_url_small || card.card_details?.image_url;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectIndex(actualIndex)}
              className={`relative rounded-md shrink-0 transition-all cursor-pointer overflow-hidden group ${
                isActive
                  ? 'ring-2 ring-red-600 dark:ring-red-500 scale-105 z-10 shadow-md'
                  : isPast
                  ? 'opacity-40 hover:opacity-80 scale-95'
                  : 'opacity-85 hover:opacity-100'
              }`}
            >
              <div className="w-10 h-14 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                {imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgUrl}
                    alt={card.card_details?.name || ''}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-[9px] font-mono text-zinc-400">#{actualIndex + 1}</span>
                )}
              </div>

              {/* Indicador de posición activa */}
              {isActive && (
                <div className="absolute inset-x-0 bottom-0 bg-red-600 text-white text-[8px] font-mono font-black text-center py-0.2">
                  ACTUAL
                </div>
              )}
            </button>
          );
        })}

        {windowEnd < cards.length && (
          <div className="text-[10px] font-mono text-zinc-400 shrink-0 ml-1">
            +{cards.length - windowEnd} más
          </div>
        )}
      </div>
    </div>
  );
};
