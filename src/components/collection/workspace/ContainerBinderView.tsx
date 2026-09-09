'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Layers, BookOpen, ArrowRight, Columns2, FileText } from 'lucide-react';
import { UserCard } from '@/types/collection';
import { Card } from '@/components/deckbuilder/types';
import { getCategoryBadgeStyle } from '@/lib/collectionUtils';
import { DuplicateCardAlertPopover } from '../DuplicateCardAlertPopover';
import { DuplicateMatchInfo } from '@/lib/collectionSuggestions';
import { SlotMultiCardPickerModal } from '../SlotMultiCardPickerModal';
import { MobileTab } from './types';

interface ContainerBinderViewProps {
  cols: number;
  rows: number;
  pocketsPerPage: number;
  leftPageNum: number | null;
  rightPageNum: number | null;
  leftPageCards: UserCard[];
  rightPageCards: UserCard[];
  dragOverSlot: string | null;
  setDragOverSlot: (slotKey: string | null) => void;
  selectedSearchCard: Card | null;
  setSelectedSearchCard: (card: Card | null) => void;
  draggedCard: Card | null;
  onAddCardToContainer: (card: Card, page?: number, slot?: number) => void;
  onSelectCard: (uc: UserCard) => void;
  onDropCardToBinderSlot: (e: React.DragEvent, page: number, slot: number) => void;
  isMobile: boolean;
  setMobileTab: (tab: MobileTab) => void;
  currentBinderViewIndex: number;
  setCurrentBinderViewIndex: React.Dispatch<React.SetStateAction<number>>;
  totalBinderViews: number;
  isSelectMode?: boolean;
  selectedCardIds?: string[];
  onToggleSelectCard?: (id: string) => void;
  duplicateMap?: Map<number, DuplicateMatchInfo>;
  onOpenConsolidate?: (cardId: number) => void;
  onOpenMoveVariantModal?: (card: UserCard) => void;
  onSendCardToStaged?: (card: UserCard) => void;
}

export const ContainerBinderView: React.FC<ContainerBinderViewProps> = ({
  cols,
  rows,
  pocketsPerPage,
  leftPageNum,
  rightPageNum,
  leftPageCards,
  rightPageCards,
  dragOverSlot,
  setDragOverSlot,
  selectedSearchCard,
  setSelectedSearchCard,
  draggedCard,
  onAddCardToContainer,
  onSelectCard,
  onDropCardToBinderSlot,
  isMobile,
  setMobileTab,
  currentBinderViewIndex,
  setCurrentBinderViewIndex,
  totalBinderViews,
  isSelectMode = false,
  selectedCardIds = [],
  onToggleSelectCard,
  duplicateMap,
  onOpenConsolidate,
  onOpenMoveVariantModal,
  onSendCardToStaged,
}) => {
  const [slotModalData, setSlotModalData] = useState<{ page: number; slot: number; cards: UserCard[] } | null>(null);
  const [userSelectedSide, setUserSelectedSide] = useState<'left' | 'right' | null>(null);
  const [prevViewIndex, setPrevViewIndex] = useState<number>(currentBinderViewIndex);
  const [desktopViewMode, setDesktopViewMode] = useState<'spread' | 'single'>('spread');
  const hasActiveSelection = isSelectMode || selectedCardIds.length > 0;

  // Si cambia la vista, resetear la preferencia manual de lado (ajuste canónico en render)
  if (currentBinderViewIndex !== prevViewIndex) {
    setPrevViewIndex(currentBinderViewIndex);
    setUserSelectedSide(null);
  }

  // En la vista 0 las ranuras inician a la derecha (Pág 1); en vistas posteriores inicia a la izquierda
  const defaultMobileSide: 'left' | 'right' = currentBinderViewIndex === 0 ? 'right' : 'left';
  const activeMobileSide = userSelectedSide ?? defaultMobileSide;

  return (
    <div className={`h-full flex flex-col items-center justify-between transition-all ${hasActiveSelection ? 'pb-28 sm:pb-32' : 'pb-2'}`}>
      {/* Selector de página para vista de 1 página a la vez (móvil y toggle desktop) */}
      <div className={`items-center justify-between gap-2 mb-3 w-full max-w-md px-2 ${desktopViewMode === 'spread' ? 'flex md:hidden' : 'flex'}`}>
        <button
          type="button"
          onClick={() => setUserSelectedSide('left')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 touch-manipulation min-h-11 cursor-pointer ${
            activeMobileSide === 'left'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm ring-1 ring-zinc-900/10 dark:ring-white/20'
              : 'bg-zinc-200/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <span>{leftPageNum ? `Pág. ${leftPageNum}` : 'Contraportada'}</span>
        </button>
        <button
          type="button"
          onClick={() => setUserSelectedSide('right')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 touch-manipulation min-h-11 cursor-pointer ${
            activeMobileSide === 'right'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm ring-1 ring-zinc-900/10 dark:ring-white/20'
              : 'bg-zinc-200/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <span>{rightPageNum ? `Pág. ${rightPageNum}` : 'Contraportada'}</span>
        </button>
      </div>

      <div className={`w-full ${desktopViewMode === 'spread' ? 'max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6' : 'max-w-md flex flex-col'} items-center justify-center`}>
        {/* Página Izquierda */}
        <div className={`w-full bg-zinc-100 dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 ${
          desktopViewMode === 'spread' 
            ? (activeMobileSide === 'left' ? 'block md:block' : 'hidden md:block')
            : (activeMobileSide === 'left' ? 'block' : 'hidden')
        }`}>
          <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-2 text-center uppercase tracking-widest font-bold">
            {leftPageNum ? `Página ${leftPageNum}` : 'Contraportada Interior'}
          </div>

          {leftPageNum === null ? (
            /* Contraportada Interior: Superficie física del binder SIN slots */
            <div className="bg-zinc-200/60 dark:bg-zinc-900/90 p-6 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 flex flex-col items-center justify-center text-center aspect-3/4 select-none relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-zinc-300/80 dark:bg-zinc-800/80 border border-zinc-400/30 dark:border-zinc-700/50 flex items-center justify-center text-zinc-500 dark:text-zinc-400 mb-3 shadow-inner">
                <BookOpen className="w-7 h-7 opacity-75" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 font-display">
                Contraportada Interior
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-[210px] leading-relaxed font-medium">
                Superficie interna del archivador físico sin ranuras.
              </p>
              <div className="mt-4 px-3 py-1.5 rounded-full bg-red-600/10 border border-red-500/30 text-red-600 dark:text-red-400 text-[10px] font-bold flex items-center gap-1.5 shadow-2xs">
                <span>Las ranuras inician en la Página 1</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ) : (
            <div
              className="grid gap-2 aspect-3/4"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
              }}
            >
            {Array.from({ length: pocketsPerPage }).map((_, idx) => {
              const slotNum = idx + 1;
              const cardsInSlot = leftPageCards.filter(c => c.binder_slot === slotNum);
              const totalSlotQty = cardsInSlot.reduce((sum, c) => sum + (c.quantity || 1), 0);
              const hasCards = cardsInSlot.length > 0;
              const hasMultipleCards = cardsInSlot.length > 1;
              const firstCard = cardsInSlot[0];
              const frontCard = cardsInSlot[cardsInSlot.length - 1];

              const slotKey = `L-${leftPageNum}-${slotNum}`;
              const isDragOver = dragOverSlot === slotKey;
              const isSlotCardSelected = hasCards ? cardsInSlot.some(c => selectedCardIds.includes(c.id)) : false;

              return (
                <div
                  key={slotNum}
                  draggable={!isSelectMode && hasCards}
                  onDragStart={(e) => {
                    if (isSelectMode || !firstCard) return;
                    e.dataTransfer.setData('application/json', JSON.stringify({
                      type: 'binder_slot_card',
                      userCardId: firstCard.id,
                      cardId: firstCard.card_id,
                      fromPage: leftPageNum,
                      fromSlot: slotNum,
                      card: {
                        id: firstCard.card_id,
                        name: firstCard.card_details?.name || 'Carta',
                        type: firstCard.card_details?.type || '',
                        image_url: firstCard.card_details?.image_url || '',
                        image_url_small: firstCard.card_details?.image_url_small || firstCard.card_details?.image_url || '',
                      }
                    }));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => {
                    setDragOverSlot(null);
                  }}
                  onClick={() => {
                    if (isSelectMode && hasCards) {
                      cardsInSlot.forEach(c => onToggleSelectCard?.(c.id));
                    } else if (selectedSearchCard && leftPageNum) {
                      onAddCardToContainer(selectedSearchCard, leftPageNum, slotNum);
                      setSelectedSearchCard(null);
                    } else if (hasMultipleCards && leftPageNum) {
                      setSlotModalData({ page: leftPageNum, slot: slotNum, cards: cardsInSlot });
                    } else if (cardsInSlot.length === 1) {
                      onSelectCard(cardsInSlot[0]);
                      if (isMobile) setMobileTab('right');
                    }
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverSlot(slotKey); }}
                  onDragLeave={() => setDragOverSlot(null)}
                  onDrop={(e) => leftPageNum ? onDropCardToBinderSlot(e, leftPageNum, slotNum) : undefined}
                  className={`rounded-lg border aspect-3/4 relative flex items-center justify-center p-1 cursor-pointer transition-all overflow-hidden ${
                    isDragOver
                      ? hasCards
                        ? 'border-solid border-amber-400 bg-amber-900/30 scale-105 ring-2 ring-amber-400/60 shadow-lg'
                        : 'border-solid border-green-400 bg-green-900/20 scale-105'
                      : isSlotCardSelected
                      ? 'border-red-500 bg-red-950/20 ring-2 ring-red-500/60 shadow-md'
                      : hasCards
                      ? 'bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 hover:border-red-500 shadow-xs active:cursor-grabbing'
                      : selectedSearchCard
                      ? 'border-dashed border-purple-500/60 bg-purple-950/20 hover:bg-purple-950/40 animate-pulse'
                      : 'border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30'
                  }`}
                >
                  {hasCards ? (
                    <>
                      {/* Renderizado de cartas: Apilado escalonado si hay múltiples o única */}
                      {hasMultipleCards ? (
                        <div className="relative w-full h-full overflow-hidden rounded">
                          {cardsInSlot.map((c, cIdx) => {
                            const offsetPx = cardsInSlot.length <= 2 ? 14 : cardsInSlot.length === 3 ? 10 : 8;
                            const topPx = cIdx * offsetPx;

                            return (
                              <div
                                key={c.id || cIdx}
                                className="absolute inset-x-0 aspect-3/4 rounded overflow-hidden shadow-xs border-t border-zinc-950/30"
                                style={{
                                  top: `${topPx}px`,
                                  zIndex: cIdx + 1,
                                }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={c.card_details?.image_url_small || c.card_details?.image_url}
                                  alt={c.card_details?.name}
                                  className="w-full h-full object-cover pointer-events-none select-none"
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={firstCard.card_details?.image_url_small || firstCard.card_details?.image_url}
                          alt={firstCard.card_details?.name}
                          className="w-full h-full object-cover rounded pointer-events-none select-none"
                        />
                      )}

                      {/* Checkbox en modo selección o Alerta de Duplicados */}
                      {isSelectMode ? (
                        <div 
                          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded flex items-center justify-center transition-all shadow-xs z-30 ${
                            isSlotCardSelected
                              ? 'bg-red-600 text-white ring-1 ring-white/40'
                              : 'bg-black/60 border border-white/50 text-transparent hover:border-white'
                          }`}
                        >
                          {isSlotCardSelected && <Check className="w-3 h-3 stroke-3" />}
                        </div>
                      ) : (
                        firstCard && duplicateMap?.has(firstCard.card_id) && (
                          <div className="absolute top-0.5 left-0.5 z-30">
                            <DuplicateCardAlertPopover
                              matchInfo={duplicateMap.get(firstCard.card_id)}
                              onOpenConsolidate={onOpenConsolidate}
                              size="sm"
                            />
                          </div>
                        )
                      )}

                      {/* Badge de Cantidad y Apilado */}
                      <div 
                        className={`absolute top-1 right-1 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold z-30 shadow-xs flex items-center gap-0.5 ${
                          hasMultipleCards
                            ? 'bg-zinc-950/95 text-purple-300 border border-purple-500/40'
                            : 'bg-zinc-950/90 text-purple-300 border border-purple-500/30'
                        }`}
                        title={hasMultipleCards ? `${cardsInSlot.length} cartas distintas (${totalSlotQty}/4 físicas)` : `${totalSlotQty}x`}
                      >
                        {hasMultipleCards && <Layers className="w-2.5 h-2.5 text-purple-400" />}
                        <span>{totalSlotQty}x</span>
                      </div>

                      {/* Barra inferior de Categoría */}
                      {frontCard && (
                        <div 
                          className={`absolute bottom-0.5 left-1 right-1 h-1 rounded-full overflow-hidden shadow-2xs z-30 ${getCategoryBadgeStyle(frontCard.status_flag).barColorClass}`}
                          title={`Estado: ${getCategoryBadgeStyle(frontCard.status_flag).label}`}
                        />
                      )}
                    </>
                  ) : (
                    <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                      {draggedCard && !hasCards ? '＋' : selectedSearchCard ? 'Colocar' : slotNum}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Página Derecha */}
        <div className={`w-full bg-zinc-100 dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 ${
          desktopViewMode === 'spread' 
            ? (activeMobileSide === 'right' ? 'block md:block' : 'hidden md:block')
            : (activeMobileSide === 'right' ? 'block' : 'hidden')
        }`}>
          <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-2 text-center uppercase tracking-widest font-bold">
            {rightPageNum ? `Página ${rightPageNum}` : 'Contraportada Trasera'}
          </div>

          {rightPageNum === null ? (
            /* Contraportada Trasera: Superficie física del binder SIN slots */
            <div className="bg-zinc-200/60 dark:bg-zinc-900/90 p-6 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 flex flex-col items-center justify-center text-center aspect-3/4 select-none relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-zinc-300/80 dark:bg-zinc-800/80 border border-zinc-400/30 dark:border-zinc-700/50 flex items-center justify-center text-zinc-500 dark:text-zinc-400 mb-3 shadow-inner">
                <BookOpen className="w-7 h-7 opacity-75" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 font-display">
                Contraportada Trasera
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-[210px] leading-relaxed font-medium">
                Final del archivador físico.
              </p>
            </div>
          ) : (
            <div
              className="grid gap-2 aspect-3/4"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
              }}
            >
            {Array.from({ length: pocketsPerPage }).map((_, idx) => {
              const slotNum = idx + 1;
              const cardsInSlot = rightPageCards.filter(c => c.binder_slot === slotNum);
              const totalSlotQty = cardsInSlot.reduce((sum, c) => sum + (c.quantity || 1), 0);
              const hasCards = cardsInSlot.length > 0;
              const hasMultipleCards = cardsInSlot.length > 1;
              const firstCard = cardsInSlot[0];
              const frontCard = cardsInSlot[cardsInSlot.length - 1];

              const slotKey = `R-${rightPageNum}-${slotNum}`;
              const isDragOver = dragOverSlot === slotKey;
              const isSlotCardSelected = hasCards ? cardsInSlot.some(c => selectedCardIds.includes(c.id)) : false;

              return (
                <div
                  key={slotNum}
                  draggable={!isSelectMode && hasCards}
                  onDragStart={(e) => {
                    if (isSelectMode || !firstCard) return;
                    e.dataTransfer.setData('application/json', JSON.stringify({
                      type: 'binder_slot_card',
                      userCardId: firstCard.id,
                      cardId: firstCard.card_id,
                      fromPage: rightPageNum,
                      fromSlot: slotNum,
                      card: {
                        id: firstCard.card_id,
                        name: firstCard.card_details?.name || 'Carta',
                        type: firstCard.card_details?.type || '',
                        image_url: firstCard.card_details?.image_url || '',
                        image_url_small: firstCard.card_details?.image_url_small || firstCard.card_details?.image_url || '',
                      }
                    }));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => {
                    setDragOverSlot(null);
                  }}
                  onClick={() => {
                    if (isSelectMode && hasCards) {
                      cardsInSlot.forEach(c => onToggleSelectCard?.(c.id));
                    } else if (selectedSearchCard && rightPageNum) {
                      onAddCardToContainer(selectedSearchCard, rightPageNum, slotNum);
                      setSelectedSearchCard(null);
                    } else if (hasMultipleCards && rightPageNum) {
                      setSlotModalData({ page: rightPageNum, slot: slotNum, cards: cardsInSlot });
                    } else if (cardsInSlot.length === 1) {
                      onSelectCard(cardsInSlot[0]);
                      if (isMobile) setMobileTab('right');
                    }
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverSlot(slotKey); }}
                  onDragLeave={() => setDragOverSlot(null)}
                  onDrop={(e) => rightPageNum ? onDropCardToBinderSlot(e, rightPageNum, slotNum) : undefined}
                  className={`rounded-lg border aspect-3/4 relative flex items-center justify-center p-1 cursor-pointer transition-all overflow-hidden ${
                    isDragOver
                      ? hasCards
                        ? 'border-solid border-amber-400 bg-amber-900/30 scale-105 ring-2 ring-amber-400/60 shadow-lg'
                        : 'border-solid border-green-400 bg-green-900/20 scale-105'
                      : isSlotCardSelected
                      ? 'border-red-500 bg-red-950/20 ring-2 ring-red-500/60 shadow-md'
                      : hasCards
                      ? 'bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 hover:border-red-500 shadow-xs active:cursor-grabbing'
                      : selectedSearchCard
                      ? 'border-dashed border-purple-500/60 bg-purple-950/20 hover:bg-purple-950/40 animate-pulse'
                      : 'border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30'
                  }`}
                >
                  {hasCards ? (
                    <>
                      {/* Renderizado de cartas: Apilado escalonado si hay múltiples o única */}
                      {hasMultipleCards ? (
                        <div className="relative w-full h-full overflow-hidden rounded">
                          {cardsInSlot.map((c, cIdx) => {
                            const offsetPx = cardsInSlot.length <= 2 ? 14 : cardsInSlot.length === 3 ? 10 : 8;
                            const topPx = cIdx * offsetPx;

                            return (
                              <div
                                key={c.id || cIdx}
                                className="absolute inset-x-0 aspect-3/4 rounded overflow-hidden shadow-xs border-t border-zinc-950/30"
                                style={{
                                  top: `${topPx}px`,
                                  zIndex: cIdx + 1,
                                }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={c.card_details?.image_url_small || c.card_details?.image_url}
                                  alt={c.card_details?.name}
                                  className="w-full h-full object-cover pointer-events-none select-none"
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={firstCard.card_details?.image_url_small || firstCard.card_details?.image_url}
                          alt={firstCard.card_details?.name}
                          className="w-full h-full object-cover rounded pointer-events-none select-none"
                        />
                      )}

                      {/* Checkbox en modo selección o Alerta de Duplicados */}
                      {isSelectMode ? (
                        <div 
                          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded flex items-center justify-center transition-all shadow-xs z-30 ${
                            isSlotCardSelected
                              ? 'bg-red-600 text-white ring-1 ring-white/40'
                              : 'bg-black/60 border border-white/50 text-transparent hover:border-white'
                          }`}
                        >
                          {isSlotCardSelected && <Check className="w-3 h-3 stroke-3" />}
                        </div>
                      ) : (
                        firstCard && duplicateMap?.has(firstCard.card_id) && (
                          <div className="absolute top-0.5 left-0.5 z-30">
                            <DuplicateCardAlertPopover
                              matchInfo={duplicateMap.get(firstCard.card_id)}
                              onOpenConsolidate={onOpenConsolidate}
                              size="sm"
                            />
                          </div>
                        )
                      )}

                      {/* Badge de Cantidad y Apilado */}
                      <div 
                        className={`absolute top-1 right-1 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold z-30 shadow-xs flex items-center gap-0.5 ${
                          hasMultipleCards
                            ? 'bg-zinc-950/95 text-purple-300 border border-purple-500/40'
                            : 'bg-zinc-950/90 text-purple-300 border border-purple-500/30'
                        }`}
                        title={hasMultipleCards ? `${cardsInSlot.length} cartas distintas (${totalSlotQty}/4 físicas)` : `${totalSlotQty}x`}
                      >
                        {hasMultipleCards && <Layers className="w-2.5 h-2.5 text-purple-400" />}
                        <span>{totalSlotQty}x</span>
                      </div>

                      {/* Barra inferior de Categoría */}
                      {frontCard && (
                        <div 
                          className={`absolute bottom-0.5 left-1 right-1 h-1 rounded-full overflow-hidden shadow-2xs z-30 ${getCategoryBadgeStyle(frontCard.status_flag).barColorClass}`}
                          title={`Estado: ${getCategoryBadgeStyle(frontCard.status_flag).label}`}
                        />
                      )}
                    </>
                  ) : (
                    <span className="text-[9px] font-mono text-zinc-600">
                      {draggedCard && !hasCards ? '＋' : selectedSearchCard ? 'Colocar' : slotNum}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>

      {/* Controles de página para Binder */}
      <div className="flex items-center flex-wrap justify-center gap-3 sm:gap-4 mt-4 w-full">
        <button
          type="button"
          disabled={currentBinderViewIndex <= 0}
          onClick={() => setCurrentBinderViewIndex(p => Math.max(0, p - 1))}
          className="px-4 py-2 min-h-11 touch-manipulation bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold disabled:opacity-40 flex items-center gap-1 cursor-pointer transition-all hover:bg-zinc-200 dark:hover:bg-zinc-800"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        <span className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 px-2">
          Vista {currentBinderViewIndex + 1} de {totalBinderViews}
        </span>

        <button
          type="button"
          disabled={currentBinderViewIndex >= totalBinderViews - 1}
          onClick={() => setCurrentBinderViewIndex(p => Math.min(totalBinderViews - 1, p + 1))}
          className="px-4 py-2 min-h-11 touch-manipulation bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold disabled:opacity-40 flex items-center gap-1 cursor-pointer transition-all hover:bg-zinc-200 dark:hover:bg-zinc-800"
        >
          <span>Siguiente</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Toggle de Modo en Escritorio (2 Páginas vs 1 Página) */}
        <div className="hidden md:flex items-center bg-zinc-200/80 dark:bg-zinc-800/80 p-0.5 rounded-xl text-[11px] font-semibold border border-zinc-300 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setDesktopViewMode('spread')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all min-h-8 ${
              desktopViewMode === 'spread'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Vista de doble página (abierto)"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>2 Páginas</span>
          </button>
          <button
            type="button"
            onClick={() => setDesktopViewMode('single')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all min-h-8 ${
              desktopViewMode === 'single'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Vista de una sola página"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1 Página</span>
          </button>
        </div>
      </div>

      {/* Modal para slots con múltiples cartas */}
      <SlotMultiCardPickerModal
        isOpen={!!slotModalData}
        onClose={() => setSlotModalData(null)}
        page={slotModalData?.page || null}
        slot={slotModalData?.slot || null}
        cardsInSlot={slotModalData?.cards || []}
        onSelectCard={(uc) => {
          onSelectCard(uc);
          if (isMobile) setMobileTab('right');
        }}
        onOpenMoveVariantModal={onOpenMoveVariantModal}
        onSendCardToStaged={onSendCardToStaged}
      />
    </div>
  );
};

