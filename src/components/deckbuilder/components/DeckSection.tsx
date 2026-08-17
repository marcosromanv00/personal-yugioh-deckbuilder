import React from 'react';
import { DeckCard, HoverCardBase } from '../types';
import { TouchableCard } from './TouchableCard';

interface DeckSectionProps {
  title: string;
  section: 'main' | 'extra' | 'side' | 'extras';
  deckCards: DeckCard[];
  cardsCount: number;
  maxSize?: number;
  format: 'Master Duel' | 'TCG' | 'Duel Links';
  removeCardFromDeck: (cardId: number, section: 'main' | 'extra' | 'side' | 'extras') => void;
  handleDragCardStart: (e: React.DragEvent, cardData: any) => void;
  handleDropCardOnSection: (e: React.DragEvent, targetSection: 'main' | 'extra' | 'side' | 'extras') => void;
  handleCardMouseEnter: (card: HoverCardBase) => void;
  handleCardMouseLeave: () => void;
  openPreviewForCard: (card: HoverCardBase) => void;
  onSelectCard?: (card: DeckCard) => void;
  selectedCardId?: number | null;
  sleeveColorHex?: string;
}

export const DeckSection: React.FC<DeckSectionProps> = ({
  title,
  section,
  deckCards,
  cardsCount,
  maxSize,
  format,
  removeCardFromDeck,
  handleDragCardStart,
  handleDropCardOnSection,
  handleCardMouseEnter,
  handleCardMouseLeave,
  openPreviewForCard,
  onSelectCard,
  selectedCardId,
  sleeveColorHex,
}) => {
  const sectionCards = deckCards.filter(c => c.section === section);

  const getBanlistBadge = (card: DeckCard) => {
    const status =
      format === 'TCG' ? card.ban_tcg :
      format === 'Master Duel' ? card.ban_master_duel :
      card.ban_duel_links;

    if (!status || status === 'Unlimited') return null;

    if (status === 'Forbidden') {
      return (
        <div
          className="absolute top-1 left-1 bg-black border-[3px] border-red-600 text-red-500 font-sans font-black text-[12px] w-6 h-6 rounded-full flex items-center justify-center shadow-md shadow-black/80 z-20 select-none"
          title="Prohibida (0 copias)"
        >
          🚫
        </div>
      );
    }

    if (status === 'Limited') {
      return (
        <div
          className="absolute top-1 left-1 bg-black border-[3px] border-red-500 text-yellow-400 font-sans font-black text-[12px] w-6 h-6 rounded-full flex items-center justify-center shadow-md shadow-black/80 z-20 select-none"
          title="Limitada (1 copia)"
        >
          1
        </div>
      );
    }

    if (status === 'Semi-Limited') {
      return (
        <div
          className="absolute top-1 left-1 bg-black border-[3px] border-blue-500 text-yellow-400 font-sans font-black text-[12px] w-6 h-6 rounded-full flex items-center justify-center shadow-md shadow-black/80 z-20 select-none"
          title="Semi-limitada (2 copias)"
        >
          2
        </div>
      );
    }

    return null;
  };

  const renderCardFanCount = (count: number) => {
    if (count <= 0) return null;
    return (
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center select-none">
        <div className="relative w-6.5 h-4.5 flex items-center justify-center">
          {/* Card 1: Left */}
          <div className="absolute w-2.75 h-4 bg-linear-to-b from-amber-900 to-amber-950 border border-amber-600 rounded-[1px] shadow-sm transform -rotate-12 -translate-x-1.5 translate-y-0.5 origin-bottom" />
          {/* Card 3: Right */}
          <div className="absolute w-2.75 h-4 bg-linear-to-b from-amber-900 to-amber-950 border border-amber-600 rounded-[1px] shadow-sm transform rotate-12 translate-x-1.5 translate-y-0.5 origin-bottom" />
          {/* Card 2: Center */}
          <div className="absolute w-2.75 h-4 bg-linear-to-b from-amber-800 to-amber-950 border border-amber-500 rounded-[1px] shadow-md z-10" />
          {/* Count Text Overlay */}
          <div className="absolute z-20 bg-black/95 border border-zinc-800 text-white font-mono font-black text-[7px] px-0.5 py-px rounded shadow-lg leading-none">
            {count}x
          </div>
        </div>
      </div>
    );
  };

  // Determinar clases de color para los títulos
  const getSectionTitleColor = () => {
    switch (section) {
      case 'main':
        return 'text-red-600 dark:text-red-400';
      case 'extra':
        return 'text-amber-600 dark:text-amber-400';
      case 'side':
        return 'text-cyan-600 dark:text-cyan-400';
      case 'extras':
        return 'text-emerald-600 dark:text-emerald-400';
      default:
        return 'text-zinc-900 dark:text-white';
    }
  };

  const getSectionBorderHover = () => {
    return 'hover:border-red-500/40';
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleDropCardOnSection(e, section)}
      className={`p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/40 transition-colors ${getSectionBorderHover()}`}
    >
      <div className="flex items-center justify-between mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <h3 className={`text-xs font-black uppercase tracking-wider ${getSectionTitleColor()} flex items-center gap-2`}>
          <span className="w-2 h-2 rounded-full bg-current" />
          <span>{title}</span>
        </h3>
        <span className="text-[11px] font-mono font-bold text-zinc-500">
          <strong className="text-zinc-900 dark:text-white">{cardsCount}</strong>
          {maxSize ? ` / ${maxSize}` : ''} cartas
        </span>
      </div>

      {sectionCards.length === 0 ? (
        <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800 border-dashed text-xs font-bold text-zinc-400">
          Sección vacía • Arrastra cartas o toca en el buscador para añadir
        </div>
      ) : (
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {sectionCards.map(c => {
            const isSelected = selectedCardId === c.id;
            return (
              <div
                key={`${c.id}-${section}`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  openPreviewForCard(c as HoverCardBase);
                }}
                className="relative"
              >
                <TouchableCard
                  card={c as HoverCardBase}
                  onTap={() => {
                    if (onSelectCard) {
                      onSelectCard(c);
                    } else {
                      removeCardFromDeck(c.id, section);
                    }
                  }}
                  onOpenPreview={openPreviewForCard}
                  onMouseEnter={handleCardMouseEnter}
                  onMouseLeave={handleCardMouseLeave}
                  draggable={true}
                  onDragStart={(e) => handleDragCardStart(e, { id: c.id, name: c.name, type: c.type, image_url: c.image_url, archetype: c.archetype, fromSection: section })}
                  showInfoButton={true}
                  className={`relative aspect-[3/4.2] rounded-lg overflow-hidden border touch-manipulation card-tap group hover:scale-105 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-red-500 shadow-md shadow-red-500/40 border-red-500 scale-102 z-10'
                      : c.proxy_count && c.proxy_count > 0
                        ? 'border-red-500/70 shadow-md shadow-red-500/20 hover:border-red-400'
                        : sleeveColorHex
                          ? ''
                          : 'border-[hsl(224,15%,16%)] hover:border-red-500/50'
                  }`}
                  style={sleeveColorHex ? { borderColor: sleeveColorHex, borderWidth: '2.5px', borderStyle: 'solid' } : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.image_url}
                    alt={c.name}
                    className={`w-full h-full object-contain transition-all duration-300 ${
                      c.is_grayscale_shared ? 'grayscale contrast-125 opacity-75' : ''
                    }`}
                    onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                  />
                  {getBanlistBadge(c)}
                  {renderCardFanCount(c.count)}
                  {c.is_grayscale_shared && (
                    <span className="absolute top-0.5 right-0.5 bg-gray-950/90 text-gray-300 border border-gray-500/80 text-[6px] font-black px-1 py-0.5 rounded leading-none uppercase shadow-md backdrop-blur-xs">
                      🔄 COMPARTIDA
                    </span>
                  )}
                  {c.proxy_count && c.proxy_count > 0 && (
                    <span className="absolute top-0.5 left-0.5 bg-red-600 text-white text-[7px] font-bold px-1 py-0.5 rounded leading-none uppercase shadow">
                      P{c.proxy_count > 1 ? c.proxy_count : ''}
                    </span>
                  )}
                  {c.rarity && c.rarity !== 'Common' && !c.is_grayscale_shared && (
                    <span className="absolute bottom-0.5 right-0.5 bg-amber-500/90 text-black text-[6px] font-black px-1 rounded uppercase tracking-tighter leading-none shadow">
                      {c.rarity.substring(0, 3)}
                    </span>
                  )}

                </TouchableCard>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
