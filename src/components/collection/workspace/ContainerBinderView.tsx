'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { UserCard } from '@/types/collection';
import { Card } from '@/components/deckbuilder/types';
import { getCategoryBadgeStyle } from '@/lib/collectionUtils';
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
}) => {
  return (
    <div className="h-full flex flex-col items-center justify-between">
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
              const cardInSlot = leftPageCards.find(c => c.binder_slot === slotNum);
              const slotKey = `L-${leftPageNum}-${slotNum}`;
              const isDragOver = dragOverSlot === slotKey;
              return (
                <div
                  key={slotNum}
                  onClick={() => {
                    if (selectedSearchCard && leftPageNum) {
                      onAddCardToContainer(selectedSearchCard, leftPageNum, slotNum);
                      setSelectedSearchCard(null);
                    } else if (cardInSlot) {
                      onSelectCard(cardInSlot);
                      if (isMobile) setMobileTab('right');
                    }
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragOverSlot(slotKey); }}
                  onDragLeave={() => setDragOverSlot(null)}
                  onDrop={(e) => leftPageNum ? onDropCardToBinderSlot(e, leftPageNum, slotNum) : undefined}
                  className={`rounded-lg border aspect-3/4 relative flex items-center justify-center p-1 cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-solid border-green-400 bg-green-900/20 scale-105'
                      : cardInSlot
                      ? 'bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 hover:border-red-500 shadow-xs'
                      : selectedSearchCard
                      ? 'border-dashed border-purple-500/60 bg-purple-950/20 hover:bg-purple-950/40 animate-pulse'
                      : 'border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30'
                  }`}
                >
                  {cardInSlot?.card_details ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cardInSlot.card_details.image_url_small || cardInSlot.card_details.image_url}
                        alt={cardInSlot.card_details.name}
                        className="w-full h-full object-cover rounded"
                      />
                      <div className="absolute top-1 right-1 bg-zinc-950/90 text-purple-300 font-mono text-[9px] px-1 rounded border border-purple-500/30 font-bold">
                        {cardInSlot.quantity}x
                      </div>
                      {/* Barra inferior de Categoría */}
                      <div 
                        className={`absolute bottom-0.5 left-1 right-1 h-1 rounded-full overflow-hidden shadow-2xs ${getCategoryBadgeStyle(cardInSlot.status_flag).barColorClass}`}
                        title={`Estado: ${getCategoryBadgeStyle(cardInSlot.status_flag).label}`}
                      />
                    </>
                  ) : (
                    <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                      {draggedCard && !cardInSlot ? '＋' : selectedSearchCard ? 'Colocar' : slotNum}
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
              const cardInSlot = rightPageCards.find(c => c.binder_slot === slotNum);
              const slotKey = `R-${rightPageNum}-${slotNum}`;
              const isDragOver = dragOverSlot === slotKey;
              return (
                <div
                  key={slotNum}
                  onClick={() => {
                    if (selectedSearchCard && rightPageNum) {
                      onAddCardToContainer(selectedSearchCard, rightPageNum, slotNum);
                      setSelectedSearchCard(null);
                    } else if (cardInSlot) {
                      onSelectCard(cardInSlot);
                      if (isMobile) setMobileTab('right');
                    }
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragOverSlot(slotKey); }}
                  onDragLeave={() => setDragOverSlot(null)}
                  onDrop={(e) => rightPageNum ? onDropCardToBinderSlot(e, rightPageNum, slotNum) : undefined}
                  className={`rounded-lg border aspect-3/4 relative flex items-center justify-center p-1 cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-solid border-green-400 bg-green-900/20 scale-105'
                      : cardInSlot
                      ? 'bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 hover:border-red-500 shadow-xs'
                      : selectedSearchCard
                      ? 'border-dashed border-purple-500/60 bg-purple-950/20 hover:bg-purple-950/40 animate-pulse'
                      : 'border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30'
                  }`}
                >
                  {cardInSlot?.card_details ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cardInSlot.card_details.image_url_small || cardInSlot.card_details.image_url}
                        alt={cardInSlot.card_details.name}
                        className="w-full h-full object-cover rounded"
                      />
                      <div className="absolute top-1 right-1 bg-zinc-950/90 text-purple-300 font-mono text-[9px] px-1 rounded border border-purple-500/30 font-bold">
                        {cardInSlot.quantity}x
                      </div>
                      {/* Barra inferior de Categoría */}
                      <div 
                        className={`absolute bottom-0.5 left-1 right-1 h-1 rounded-full overflow-hidden shadow-2xs ${getCategoryBadgeStyle(cardInSlot.status_flag).barColorClass}`}
                        title={`Estado: ${getCategoryBadgeStyle(cardInSlot.status_flag).label}`}
                      />
                    </>
                  ) : (
                    <span className="text-[9px] font-mono text-zinc-600">
                      {selectedSearchCard ? 'Colocar' : slotNum}
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
    </div>
  );
};
