'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Layers } from 'lucide-react';
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
  const hasActiveSelection = isSelectMode || selectedCardIds.length > 0;

  return (
    <div className={`h-full flex flex-col items-center justify-between transition-all ${hasActiveSelection ? 'pb-28 sm:pb-32' : 'pb-2'}`}>
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center">
        {/* Página Izquierda */}
        <div className="bg-zinc-100 dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-2 text-center uppercase tracking-widest font-bold">
            {leftPageNum ? `Página ${leftPageNum}` : 'Portada Interior'}
          </div>
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
        </div>

        {/* Página Derecha */}
        <div className="bg-zinc-100 dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-2 text-center uppercase tracking-widest font-bold">
            {rightPageNum ? `Página ${rightPageNum}` : 'Contraportada'}
          </div>
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
        </div>
      </div>

      {/* Controles de página para Binder */}
      <div className="flex items-center gap-4 mt-4">
        <button
          disabled={currentBinderViewIndex <= 0}
          onClick={() => setCurrentBinderViewIndex(p => Math.max(0, p - 1))}
          className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold disabled:opacity-40 flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          Vista {currentBinderViewIndex + 1} de {totalBinderViews}
        </span>
        <button
          disabled={currentBinderViewIndex >= totalBinderViews - 1}
          onClick={() => setCurrentBinderViewIndex(p => Math.min(totalBinderViews - 1, p + 1))}
          className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold disabled:opacity-40 flex items-center gap-1 cursor-pointer"
        >
          <span>Siguiente</span>
          <ChevronRight className="w-4 h-4" />
        </button>
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

