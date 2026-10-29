'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
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

  const handleWheelScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  return (
    <div
      onWheel={handleWheelScroll}
      className="w-full bg-zinc-100/70 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 overflow-x-auto shrink-0 select-none scroll-smooth"
      title="Rueda del ratón para deslizar horizontalmente la cola de cartas"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-2">
        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
          Cola:
        </span>

        {visibleCards.map((card, idx) => {
          const actualIndex = windowStart + idx;
          const isActive = actualIndex === currentIndex;
          const isPast = actualIndex < currentIndex;
          const imgUrl = card.card_details?.image_url_small || card.card_details?.image_url;
          const cardName = card.card_details?.name || '';
          const hasPotentialHighVal = (card.sale_price !== null && card.sale_price !== undefined && card.sale_price >= 2.0) ||
            (card.rarity && card.rarity !== 'Common');

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectIndex(actualIndex)}
              onAuxClick={e => {
                // Click central (rueda del ratón): abre la carta en nueva ventana sin cambiar de carta activa
                if (e.button === 1 && cardName) {
                  e.preventDefault();
                  window.open(`https://ygoprodeck.com/card/?search=${encodeURIComponent(cardName)}`, '_blank', 'noopener,noreferrer');
                }
              }}
              title={`${cardName} (Click para seleccionar • Rueda para abrir en nueva pestaña)`}
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
                    alt={cardName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-[9px] font-mono text-zinc-400">#{actualIndex + 1}</span>
                )}
              </div>

              {/* Indicador de Alto Valor o Rareza no común */}
              {hasPotentialHighVal && (
                <div className="absolute top-0.5 right-0.5 p-0.5 bg-amber-500 text-zinc-950 rounded-full shadow-xs">
                  <Sparkles className="w-2 h-2" />
                </div>
              )}

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
