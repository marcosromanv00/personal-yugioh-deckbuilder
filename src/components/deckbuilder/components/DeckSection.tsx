import React, { useState } from 'react';
import { DeckCard, HoverCardBase } from '../types';
import { TouchableCard } from './TouchableCard';
import { CardImage } from '@/components/ui/CardImage';
import { getCardCopiesInDeck, getCardBanlistLimit } from '@/lib/deck/banlist.utils';

interface DragCardPayload {
  id: number;
  name: string;
  type: string;
  image_url: string;
  archetype?: string;
  fromSection?: 'main' | 'extra' | 'side' | 'extras';
}

interface DeckSectionProps {
  title: string;
  section: 'main' | 'extra' | 'side' | 'extras';
  deckCards: DeckCard[];
  cardsCount: number;
  maxSize?: number;
  format: 'Master Duel' | 'TCG' | 'Duel Links';
  layoutMode?: 'collapsed' | 'expanded';
  removeCardFromDeck: (cardId: number, section: 'main' | 'extra' | 'side' | 'extras') => void;
  removeCopyFromDeck?: (cardId: number, section: 'main' | 'extra' | 'side' | 'extras', copyIndex: number) => void;
  handleDragCardStart: (e: React.DragEvent, cardData: DragCardPayload) => void;
  handleDropCardOnSection: (e: React.DragEvent, targetSection: 'main' | 'extra' | 'side' | 'extras') => void;
  onReorderCard?: (
    sourceCardId: number,
    sourceSection: 'main' | 'extra' | 'side' | 'extras',
    targetCardId: number,
    targetSection: 'main' | 'extra' | 'side' | 'extras',
    position: 'before' | 'after'
  ) => void;
  handleCardMouseEnter: (card: HoverCardBase) => void;
  handleCardMouseLeave: () => void;
  openPreviewForCard: (card: HoverCardBase) => void;
  onSelectCard?: (card: DeckCard) => void;
  selectedCardId?: number | null;
  selectedCopyIndex?: number | null;
  sleeveColorHex?: string;
}

export const DeckSection: React.FC<DeckSectionProps> = ({
  title,
  section,
  deckCards,
  cardsCount,
  maxSize,
  format,
  layoutMode = 'collapsed',
  removeCardFromDeck,
  removeCopyFromDeck,
  handleDragCardStart,
  handleDropCardOnSection,
  onReorderCard,
  handleCardMouseEnter,
  handleCardMouseLeave,
  openPreviewForCard,
  onSelectCard,
  selectedCardId,
  selectedCopyIndex,
  sleeveColorHex,
}) => {
  const sectionCards = deckCards.filter(c => c.section === section);

  const [dropTarget, setDropTarget] = useState<{
    cardId: number;
    position: 'before' | 'after';
  } | null>(null);

  const handleCardDragOver = (e: React.DragEvent, targetCardId: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const position: 'before' | 'after' = e.clientX < midX ? 'before' : 'after';
    if (!dropTarget || dropTarget.cardId !== targetCardId || dropTarget.position !== position) {
      setDropTarget({ cardId: targetCardId, position });
    }
  };

  const handleCardDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const related = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(related)) {
      setDropTarget(null);
    }
  };

  const handleCardDropOnSlot = (e: React.DragEvent, targetCardId: number) => {
    e.preventDefault();
    e.stopPropagation();
    const position = dropTarget?.position || 'before';
    setDropTarget(null);

    const jsonStr = e.dataTransfer.getData('application/json');
    if (!jsonStr) return;

    try {
      const cardObj = JSON.parse(jsonStr);
      if (!cardObj?.id) return;

      if (cardObj.fromSection && onReorderCard) {
        onReorderCard(cardObj.id, cardObj.fromSection, targetCardId, section, position);
      } else {
        handleDropCardOnSection(e, section);
      }
    } catch (err) {
      console.error('Error al soltar carta en ranura:', err);
    }
  };

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

  const getRarityBadgeInfo = (rarity?: string, isProxy?: boolean, isInActiveDeck?: boolean) => {
    if (isProxy) {
      return {
        text: 'PROXY',
        className: 'bg-zinc-900/90 text-zinc-400 border border-zinc-700',
        dotClass: 'bg-zinc-500',
        tooltip: 'Receta Virtual / Proxy'
      };
    }
    if (isInActiveDeck) {
      return {
        text: rarity ? rarity.substring(0, 3).toUpperCase() : 'ACT',
        className: 'bg-amber-950/90 text-amber-300 border border-amber-500/50',
        dotClass: 'bg-amber-400',
        tooltip: 'En otro Deck Activo'
      };
    }
    const r = (rarity || 'Common').toLowerCase();
    if (r.includes('starlight') || r.includes('ghost') || r.includes('secret') || r.includes('prismatic')) {
      return {
        text: 'SCR',
        className: 'bg-purple-950/90 text-purple-300 border border-purple-500/50',
        dotClass: 'bg-purple-400',
        tooltip: `Física: ${rarity}`
      };
    }
    if (r.includes('ultra') || r.includes('ultimate') || r.includes('collector')) {
      return {
        text: 'UR',
        className: 'bg-amber-950/90 text-amber-300 border border-amber-500/50',
        dotClass: 'bg-amber-400',
        tooltip: `Física: ${rarity}`
      };
    }
    if (r.includes('super')) {
      return {
        text: 'SR',
        className: 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50',
        dotClass: 'bg-cyan-400',
        tooltip: `Física: ${rarity}`
      };
    }
    return {
      text: 'COM',
      className: 'bg-zinc-900/90 text-zinc-300 border border-zinc-700',
      dotClass: 'bg-emerald-400',
      tooltip: `Física: ${rarity || 'Common'}`
    };
  };

  const renderCardFanCount = (card: DeckCard) => {
    if (card.count <= 0) return null;
    const copies = card.physical_copies || [];

    return (
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center select-none gap-0.5">
        {/* Micro status dots representing each physical copy */}
        <div className="flex items-center gap-0.5 bg-black/80 px-1 py-0.5 rounded-full border border-zinc-800/80 shadow-xs">
          {Array.from({ length: card.count }).map((_, idx) => {
            const pc = copies[idx];
            const isProxy = !pc || pc.is_proxy || !pc.user_card_id;
            const isInDeck = pc?.is_in_active_deck;
            const dotColor = isProxy ? 'bg-zinc-500' : isInDeck ? 'bg-amber-400' : 'bg-emerald-400';
            return (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full ${dotColor}`}
                title={isProxy ? 'Receta Virtual' : isInDeck ? `En Deck: ${pc.active_deck_name}` : `Física: ${pc.rarity || 'Common'}`}
              />
            );
          })}
        </div>

        <div className="relative w-6.5 h-4 flex items-center justify-center">
          {/* Card 1: Left */}
          <div className="absolute w-2.75 h-3.5 bg-linear-to-b from-amber-900 to-amber-950 border border-amber-600 rounded-[1px] shadow-sm transform -rotate-12 -translate-x-1.5 translate-y-0.5 origin-bottom" />
          {/* Card 3: Right */}
          <div className="absolute w-2.75 h-3.5 bg-linear-to-b from-amber-900 to-amber-950 border border-amber-600 rounded-[1px] shadow-sm transform rotate-12 translate-x-1.5 translate-y-0.5 origin-bottom" />
          {/* Card 2: Center */}
          <div className="absolute w-2.75 h-3.5 bg-linear-to-b from-amber-800 to-amber-950 border border-amber-500 rounded-[1px] shadow-md z-10" />
          {/* Count Text Overlay */}
          <div className="absolute z-20 bg-black/95 border border-zinc-800 text-white font-mono font-black text-[7px] px-0.5 py-px rounded shadow-lg leading-none">
            {card.count}x
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
      ) : layoutMode === 'expanded' ? (
        /* VISTA DESGLOSADA (1 ranura por copia individual) */
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-2.5">
          {sectionCards.flatMap(c => {
            const copySlots = Array.from({ length: c.count }).map((_, copyIndex) => {
              const pc = c.physical_copies?.[copyIndex];
              const isProxy = !pc || pc.is_proxy || !pc.user_card_id;
              const isInDeck = pc?.is_in_active_deck;
              const rarityInfo = getRarityBadgeInfo(pc?.rarity, isProxy, isInDeck);
              const isSelected = selectedCardId === c.id && (selectedCopyIndex === undefined || selectedCopyIndex === null || selectedCopyIndex === copyIndex);
              const totalCopies = getCardCopiesInDeck(deckCards, c.id);
              const { limit: banLimit, status: banStatus } = getCardBanlistLimit(c, format);
              const isBanExceeded = banStatus !== 'Unlimited' && totalCopies > banLimit;

              return (
                <div
                  key={`${c.id}-${section}-copy-${copyIndex}`}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    openPreviewForCard(c as HoverCardBase);
                  }}
                  onDragOver={(e) => handleCardDragOver(e, c.id)}
                  onDragLeave={handleCardDragLeave}
                  onDrop={(e) => handleCardDropOnSlot(e, c.id)}
                  className="relative group/slot"
                >
                  {/* Indicador visual fluido de inserción en grilla */}
                  {dropTarget?.cardId === c.id && (
                    <div
                      className={`absolute top-0 bottom-0 w-1.5 bg-red-500 rounded-full shadow-lg shadow-red-500/80 z-30 pointer-events-none animate-pulse ${
                        dropTarget.position === 'before' ? '-left-1' : '-right-1'
                      }`}
                    />
                  )}
                  <TouchableCard
                    card={c as HoverCardBase}
                    onTap={() => {
                      if (onSelectCard) {
                        onSelectCard({ ...c, selected_copy_index: copyIndex });
                      } else if (removeCopyFromDeck) {
                        removeCopyFromDeck(c.id, section, copyIndex);
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
                        : isBanExceeded
                          ? 'ring-2 ring-red-600 border-red-500 shadow-md shadow-red-600/30'
                          : isProxy
                            ? 'border-zinc-700/80 opacity-85 hover:opacity-100 hover:border-red-500/50'
                            : isInDeck
                              ? 'border-amber-500/70 shadow-xs hover:border-amber-400'
                              : sleeveColorHex
                                ? ''
                                : 'border-zinc-800 hover:border-red-500/50'
                    }`}
                    style={sleeveColorHex ? { borderColor: sleeveColorHex, borderWidth: '2.5px', borderStyle: 'solid' } : undefined}
                  >
                    <CardImage
                      src={c.image_url_small || c.image_url}
                      alt={c.name}
                      className={`w-full h-full object-contain transition-all duration-300 ${
                        isProxy ? 'brightness-90 contrast-110' : ''
                      }`}
                      loading="lazy"
                    />
                    {getBanlistBadge(c)}

                    {/* Badge de Alerta por Exceder Banlist */}
                    {isBanExceeded && (
                      <div
                        className="absolute top-0.5 right-0.5 bg-red-600 text-white font-mono font-black text-[6.5px] px-1 py-0.2 rounded shadow-md z-20 flex items-center gap-0.5"
                        title={`Infracción de Banlist: ${totalCopies}/${banLimit} copias en el mazo`}
                      >
                        <span>⚠️</span>
                        <span>{totalCopies}/{banLimit}</span>
                      </div>
                    )}

                    {/* Badge de Copia Individual */}
                    <div className="absolute top-0.5 left-0.5 bg-black/90 text-zinc-300 font-mono font-black text-[7px] px-1 py-0.2 rounded border border-zinc-800 shadow-xs">
                      #{copyIndex + 1}
                    </div>

                    {/* Badge de Rareza / Estado Físico */}
                    <div className={`absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded text-[6.5px] font-black uppercase tracking-tighter leading-none shadow flex items-center gap-0.5 ${rarityInfo.className}`}>
                      <span className={`w-1 h-1 rounded-full ${rarityInfo.dotClass}`} />
                      <span>{rarityInfo.text}</span>
                    </div>

                    {/* Borde inferior de color para cartas enlazadas de otros decks activos */}
                    {isInDeck && (
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-amber-500 via-amber-400 to-amber-500 z-10 shadow-xs" 
                        title={`En uso en: ${pc?.active_deck_name || 'Deck Activo'}`}
                      />
                    )}
                  </TouchableCard>
                </div>
              );
            });
            return copySlots;
          })}
        </div>
      ) : (
        /* VISTA COLAPSADA (x1, x2, x3) */
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-2.5">
          {sectionCards.map(c => {
            const isSelected = selectedCardId === c.id;
            const totalCopies = getCardCopiesInDeck(deckCards, c.id);
            const { limit: banLimit, status: banStatus } = getCardBanlistLimit(c, format);
            const isBanExceeded = banStatus !== 'Unlimited' && totalCopies > banLimit;

            return (
              <div
                key={`${c.id}-${section}`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  openPreviewForCard(c as HoverCardBase);
                }}
                onDragOver={(e) => handleCardDragOver(e, c.id)}
                onDragLeave={handleCardDragLeave}
                onDrop={(e) => handleCardDropOnSlot(e, c.id)}
                className="relative group/slot"
              >
                {/* Indicador visual fluido de inserción en grilla */}
                {dropTarget?.cardId === c.id && (
                  <div
                    className={`absolute top-0 bottom-0 w-1.5 bg-red-500 rounded-full shadow-lg shadow-red-500/80 z-30 pointer-events-none animate-pulse ${
                      dropTarget.position === 'before' ? '-left-1' : '-right-1'
                    }`}
                  />
                )}
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
                      : isBanExceeded
                        ? 'ring-2 ring-red-600 border-red-500 shadow-md shadow-red-600/30'
                        : c.proxy_count && c.proxy_count > 0
                          ? 'border-red-500/70 shadow-md shadow-red-500/20 hover:border-red-400'
                          : sleeveColorHex
                            ? ''
                            : 'border-zinc-800 hover:border-red-500/50'
                  }`}
                  style={sleeveColorHex ? { borderColor: sleeveColorHex, borderWidth: '2.5px', borderStyle: 'solid' } : undefined}
                >
                  <CardImage
                    src={c.image_url_small || c.image_url}
                    alt={c.name}
                    className={`w-full h-full object-contain transition-all duration-300 ${
                      c.is_grayscale_shared ? 'grayscale contrast-125 opacity-75' : ''
                    }`}
                    loading="lazy"
                  />
                  {getBanlistBadge(c)}
                  {renderCardFanCount(c)}

                  {/* Badge de Alerta por Exceder Banlist */}
                  {isBanExceeded && (
                    <div
                      className="absolute top-0.5 right-0.5 bg-red-600 text-white font-mono font-black text-[6.5px] px-1 py-0.2 rounded shadow-md z-20 flex items-center gap-0.5"
                      title={`Infracción de Banlist: ${totalCopies}/${banLimit} copias en el mazo`}
                    >
                      <span>⚠️</span>
                      <span>{totalCopies}/{banLimit}</span>
                    </div>
                  )}

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
                </TouchableCard>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
