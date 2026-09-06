import React from 'react';
import { Undo2, Redo2, ShieldAlert } from 'lucide-react';
import { DeckSection } from './DeckSection';
import { VariantDropdownSelector } from './variants/VariantDropdownSelector';
import { SortDropdown } from './SortDropdown';
import { DeckUnsavedChangesBanner } from './DeckUnsavedChangesBanner';
import { DeckCard, Card, HoverCardBase } from '../types';
import { DeckVariant } from '@/types/collection';

import { DragCardPayload } from '../hooks/useDeckDragAndDrop';

export interface SharedDeckSectionProps {
  format: 'TCG' | 'Master Duel' | 'Duel Links';
  layoutMode: 'collapsed' | 'expanded';
  deckCards: DeckCard[];
  removeCardFromDeck: (cardId: number, section: 'main' | 'extra' | 'side' | 'extras') => void;
  removeCopyFromDeck?: (cardId: number, section: 'main' | 'extra' | 'side' | 'extras', copyIndex: number) => void;
  handleDragCardStart: (e: React.DragEvent, cardData: DragCardPayload) => void;
  handleDropCardOnSection: (e: React.DragEvent, targetSection: 'main' | 'extra' | 'side' | 'extras') => void;
  onReorderCard: (
    sourceCardId: number,
    sourceSection: 'main' | 'extra' | 'side' | 'extras',
    targetCardId: number,
    targetSection: 'main' | 'extra' | 'side' | 'extras',
    position: 'before' | 'after'
  ) => void;
  handleCardMouseEnter: (card: HoverCardBase) => void;
  handleCardMouseLeave: () => void;
  openPreviewForCard: (card: HoverCardBase) => void;
  onSelectCard: (card: Card | DeckCard | HoverCardBase) => void;
  selectedCardId?: number;
  selectedCopyIndex?: number;
}

interface DeckBoardProps {
  deckName: string;
  onUpdateDeckName: (name: string, isManual?: boolean) => void;
  variants: DeckVariant[];
  activeVariant: DeckVariant | null;
  onSelectVariant: (v: DeckVariant) => void;
  onOpenNewVariantModal: () => void;
  onDeleteVariant: (id: string) => void | Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  deckLayoutMode: 'collapsed' | 'expanded';
  onLayoutModeChange: (mode: 'collapsed' | 'expanded') => void;
  banlistAlertCount: number;
  banlistAlertTooltip?: string;
  onOpenBanlistAlerts?: () => void;
  format: 'TCG' | 'Master Duel' | 'Duel Links';
  mainCardsCount: number;
  extraCardsCount: number;
  sideCardsCount: number;
  extrasCardsCount: number;
  mainSleeveColorHex?: string;
  extraSleeveColorHex?: string;
  sharedDeckSectionProps: SharedDeckSectionProps;
  isDirty: boolean;
  hasCards: boolean;
  activeContextName: string;
  loadingDecks: boolean;
  onDiscardChanges: () => void;
  onQuickSave: () => void | Promise<void>;
  isMobileLayout?: boolean;
}

export function DeckBoard(props: DeckBoardProps) {
  const {
    deckName, onUpdateDeckName, variants, activeVariant, onSelectVariant,
    onOpenNewVariantModal, onDeleteVariant, canUndo, canRedo, onUndo, onRedo,
    sortBy, onSortChange, deckLayoutMode, onLayoutModeChange, banlistAlertCount,
    banlistAlertTooltip, onOpenBanlistAlerts, format, mainCardsCount,
    extraCardsCount, sideCardsCount, extrasCardsCount, mainSleeveColorHex,
    extraSleeveColorHex, sharedDeckSectionProps, isDirty, hasCards,
    activeContextName, loadingDecks, onDiscardChanges, onQuickSave, isMobileLayout,
  } = props;

  const maxMain = format === 'Duel Links' ? 30 : 60;
  const maxExtra = format === 'Duel Links' ? 8 : 15;

  return (
    <section className={`flex-1 min-w-0 h-full min-h-0 flex flex-col gap-3 lg:gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 lg:p-5 overflow-hidden shadow-sm transition-colors relative ${isMobileLayout ? 'border-0 p-0 shadow-none bg-transparent dark:bg-transparent' : ''}`}>
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 gap-2 shrink-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          {!isMobileLayout ? (
            <div className="flex items-center gap-2">
              <span className="text-red-500 font-bold">📋</span>
              <input
                type="text"
                value={deckName}
                onChange={(e) => onUpdateDeckName(e.target.value, true)}
                placeholder="Nombre de la baraja..."
                className="bg-transparent font-black text-sm sm:text-base text-zinc-900 dark:text-zinc-100 border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-red-500 focus:outline-hidden px-1 py-0.5 transition-colors font-display"
                title="Haz clic para editar el nombre de la baraja"
              />
            </div>
          ) : null}

          <VariantDropdownSelector
            variants={variants}
            activeVariant={activeVariant}
            onSelectVariant={onSelectVariant}
            onOpenNewVariantModal={onOpenNewVariantModal}
            onDeleteVariant={onDeleteVariant}
          />

          {!isMobileLayout && (
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-0.5 shadow-xs">
              <button type="button" onClick={onUndo} disabled={!canUndo} className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 transition-colors cursor-pointer" title="Deshacer (Ctrl+Z)">
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={onRedo} disabled={!canRedo} className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 transition-colors cursor-pointer" title="Rehacer (Ctrl+Y)">
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <SortDropdown value={sortBy} onChange={onSortChange} />

          {!isMobileLayout && (
            <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-0.5 shadow-xs">
              <button type="button" onClick={() => onLayoutModeChange('collapsed')} className={`py-1 px-2 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${deckLayoutMode === 'collapsed' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-500'}`} title="Vista Agrupada">
                <span>🗂️</span><span className="hidden sm:inline">Agrupado</span>
              </button>
              <button type="button" onClick={() => onLayoutModeChange('expanded')} className={`py-1 px-2 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${deckLayoutMode === 'expanded' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-500'}`} title="Vista Desglosada">
                <span>📑</span><span className="hidden sm:inline">Desglosado</span>
              </button>
            </div>
          )}
        </div>

        {/* Section Counters & Banlist Alerts */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs font-bold items-center overflow-x-auto scrollbar-thin">
          {banlistAlertCount > 0 && (
            <button type="button" onClick={onOpenBanlistAlerts} className="flex items-center gap-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-600 dark:text-red-400 py-1 px-2.5 rounded-xl shadow-xs transition-colors cursor-pointer text-xs font-bold shrink-0" title={banlistAlertTooltip}>
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{banlistAlertCount} {banlistAlertCount === 1 ? 'Alerta' : 'Alertas'} Banlist</span>
            </button>
          )}
          {[
            { label: 'Main', count: mainCardsCount, max: maxMain },
            { label: 'Extra', count: extraCardsCount, max: maxExtra },
            { label: 'Side', count: sideCardsCount, max: 15 },
            { label: 'Reserva', count: extrasCardsCount, max: null },
          ].map(({ label, count, max }) => (
            <span key={label} className="shrink-0 flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-950 py-1 px-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 shadow-xs">
              {label}: <b className="font-mono font-black text-zinc-900 dark:text-white">{count}</b>{max ? `/${max}` : ''}
            </span>
          ))}
        </div>
      </div>

      {/* 4 Card Sections */}
      <div className="flex-1 min-h-0 flex flex-col gap-5 lg:gap-6 overflow-y-auto pr-1 scrollbar-thin">
        <DeckSection title="Main Deck" section="main" cardsCount={mainCardsCount} maxSize={maxMain} sleeveColorHex={mainSleeveColorHex} {...sharedDeckSectionProps} />
        <DeckSection title="Extra Deck" section="extra" cardsCount={extraCardsCount} maxSize={maxExtra} sleeveColorHex={extraSleeveColorHex} {...sharedDeckSectionProps} />
        <DeckSection title="Side Deck" section="side" cardsCount={sideCardsCount} maxSize={15} sleeveColorHex={mainSleeveColorHex} {...sharedDeckSectionProps} />
        <DeckSection title="Reserva / Pool de la Deckbox" section="extras" cardsCount={extrasCardsCount} {...sharedDeckSectionProps} />
      </div>

      {/* Unsaved Changes Banner */}
      <DeckUnsavedChangesBanner
        isDirty={isDirty}
        hasCards={hasCards}
        contextName={activeContextName}
        loading={loadingDecks}
        onDiscard={onDiscardChanges}
        onSave={onQuickSave}
      />
    </section>
  );
}
