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
        return 'text-[hsl(180,80%,45%)]';
      case 'extra':
        return 'text-[hsl(263,85%,64%)]';
      case 'side':
        return 'text-amber-500';
      case 'extras':
        return 'text-teal-400';
      default:
        return 'text-white';
    }
  };

  const getSectionBorderHover = () => {
    switch (section) {
      case 'main':
        return 'hover:border-[hsl(180,80%,45%)]/30';
      case 'extra':
        return 'hover:border-[hsl(263,85%,64%)]/30';
      case 'side':
        return 'hover:border-amber-500/30';
      case 'extras':
        return 'hover:border-teal-500/30';
      default:
        return 'hover:border-slate-500/30';
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleDropCardOnSection(e, section)}
      className={`p-2 rounded-xl border border-transparent transition-colors ${getSectionBorderHover()}`}
    >
      <h3 className={`text-xs font-bold uppercase tracking-wider ${getSectionTitleColor()} mb-3 flex items-center gap-2`}>
        • {title} <span className="text-[10px] lowercase text-[hsl(215,15%,70%)]">({cardsCount} {cardsCount === 1 ? 'carta' : 'cartas'}) {maxSize ? `/ ${maxSize} máx` : ''} - Arrastra aquí</span>
      </h3>
      {sectionCards.length === 0 ? (
        <div className="text-center py-6 bg-[hsl(224,25%,6%)] rounded-xl border border-[hsl(224,15%,16%)] border-dashed text-sm text-zinc-600">
          Sección vacía. Toca una carta para agregarla.
        </div>
      ) : (
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {sectionCards.map(c => (
            <TouchableCard
              key={c.id}
              card={c as HoverCardBase}
              onTap={() => removeCardFromDeck(c.id, section)}
              onOpenPreview={openPreviewForCard}
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
              draggable={true}
              onDragStart={(e) => handleDragCardStart(e, { id: c.id, name: c.name, type: c.type, image_url: c.image_url, archetype: c.archetype, fromSection: section })}
              showInfoButton={true}
              className={`relative aspect-[3/4.2] rounded-lg overflow-hidden border touch-manipulation card-tap group hover:scale-105 transition-all duration-200 ${
                c.proxy_count && c.proxy_count > 0
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
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
              />
              {getBanlistBadge(c)}
              {renderCardFanCount(c.count)}
              {c.proxy_count && c.proxy_count > 0 && (
                <span className="absolute top-0.5 left-0.5 bg-red-600 text-white text-[7px] font-bold px-1 py-0.5 rounded leading-none uppercase shadow">
                  P{c.proxy_count > 1 ? c.proxy_count : ''}
                </span>
              )}
            </TouchableCard>
          ))}
        </div>
      )}
    </div>
  );
};
