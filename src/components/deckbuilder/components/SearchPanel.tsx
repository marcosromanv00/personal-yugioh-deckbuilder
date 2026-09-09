import React, { useState, useEffect } from 'react';
import { Search, Upload } from 'lucide-react';
import { Card } from '../types';
import dynamic from 'next/dynamic';
import { UserCard } from '@/types/collection';
import { SearchCardCopyPickerModal } from './SearchCardCopyPickerModal';
import { SearchPanelProps, ParsedBulkItem } from './search/searchPanel.types';
import { renderBanlistBadge } from './search/searchPanel.utils';
import { SearchPanelHeader } from './search/SearchPanelHeader';
import { SearchBulkImportTab } from './search/SearchBulkImportTab';
import { SearchPanelSingleTab } from './search/SearchPanelSingleTab';
import { useSearchBulkImport } from './search/useSearchBulkImport';
import { useSearchPanelDrag } from './search/useSearchPanelDrag';

export type { ParsedBulkItem };

const CardCodeScannerModal = dynamic(
  () => import('@/components/scanner/CardCodeScannerModal').then((m) => m.CardCodeScannerModal),
  { ssr: false }
);

export const SearchPanel: React.FC<SearchPanelProps> = ({
  leftPanelOpen, setLeftPanelOpen, leftPanelWidth, isMobile = false,
  searchQuery, setSearchQuery, searchScope, setSearchScope,
  recentCardsCount = 0, onClearRecentCards, showStagedTab = false, stagedCardsCount = 0,
  onlyFavorites, setOnlyFavorites, searchType, setSearchType,
  advancedFilters, setAdvancedFilters, searchResults, isSearching,
  searchViewMode, setSearchViewMode, searchLimit, setSearchLimit,
  format, userInventoryCounts = {}, onSelectAllStaged,
  allUserCards = [], locations = [], assignedDraftUserCardIds, activeContextName,
  addCardToDeck, onDropRemoveCard, openPreviewForCard,
  handleDragCardStart, handleCardMouseEnter, handleCardMouseLeave,
}) => {
  const { isDragOverRemove, panelDragHandlers } = useSearchPanelDrag(onDropRemoveCard);
  const [activeTab, setActiveTab] = useState<'search' | 'bulk'>('search');
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);

  if (searchQuery !== prevSearchQuery) {
    setPrevSearchQuery(searchQuery);
    setLocalQuery(searchQuery);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== searchQuery) setSearchQuery(localQuery);
    }, 180);
    return () => clearTimeout(timer);
  }, [localQuery, searchQuery, setSearchQuery]);

  const [copyPickerState, setCopyPickerState] = useState<{
    card: Card; targetSection: 'main' | 'extra' | 'side' | 'extras'; copies: UserCard[];
  } | null>(null);

  const handleAddCardWithCopyCheck = (card: Card, targetSec: 'main' | 'extra' | 'side' | 'extras' = 'main') => {
    if (searchScope !== 'collection') {
      addCardToDeck(card, targetSec);
      return;
    }
    const copies = card.userCardsGroup?.length ? card.userCardsGroup : allUserCards ? allUserCards.filter((uc) => uc.card_id === card.id) : [];
    if (copies.length > 0 && locations && locations.length > 0) {
      setCopyPickerState({ card, targetSection: targetSec, copies });
    } else if (copies.length === 1) {
      addCardToDeck(card, targetSec, copies[0]);
    } else {
      addCardToDeck(card, targetSec);
    }
  };

  const bulk = useSearchBulkImport(addCardToDeck);

  return (
    <section
      style={!isMobile && leftPanelOpen ? { width: `${leftPanelWidth}px` } : {}}
      {...panelDragHandlers}
      className={`relative flex flex-col h-full min-h-0 gap-3 transition-colors ${
        isMobile ? 'w-full' : `bg-white dark:bg-zinc-900/90 border rounded-2xl shadow-sm transition-all overflow-hidden ${
          isDragOverRemove ? 'border-red-500 ring-2 ring-red-500/50 bg-red-500/5' : 'border-zinc-200 dark:border-zinc-800'
        } ${leftPanelOpen ? 'p-3.5' : 'w-10 min-w-10 p-2 items-center'}`
      }`}
    >
      {isDragOverRemove && (
        <div className="absolute inset-x-3 top-3 z-30 p-2 rounded-xl bg-red-600/95 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg backdrop-blur-xs pointer-events-none animate-in fade-in">
          <span>🗑️</span>
          <span>Soltar aquí para retirar del mazo</span>
        </div>
      )}

      <SearchPanelHeader
        isMobile={isMobile} leftPanelOpen={leftPanelOpen} setLeftPanelOpen={setLeftPanelOpen}
        searchViewMode={searchViewMode} setSearchViewMode={setSearchViewMode} resultsCount={searchResults.length}
      />

      {leftPanelOpen ? (
        <>
          <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={`py-1.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'search' ? 'bg-red-600 text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>BUSCAR CARTA</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bulk')}
              className={`py-1.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'bulk' ? 'bg-red-600 text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>IMPORTAR BULK</span>
            </button>
          </div>

          {activeTab === 'bulk' ? (
            <SearchBulkImportTab {...bulk} userInventoryCounts={userInventoryCounts} />
          ) : (
            <SearchPanelSingleTab
              localQuery={localQuery} setLocalQuery={setLocalQuery} setSearchQuery={setSearchQuery}
              searchScope={searchScope} setSearchScope={setSearchScope} recentCardsCount={recentCardsCount}
              onClearRecentCards={onClearRecentCards} showStagedTab={showStagedTab} stagedCardsCount={stagedCardsCount}
              onSelectAllStaged={onSelectAllStaged} onlyFavorites={onlyFavorites} setOnlyFavorites={setOnlyFavorites}
              searchType={searchType} setSearchType={setSearchType} advancedFilters={advancedFilters}
              setAdvancedFilters={setAdvancedFilters} searchResults={searchResults} isSearching={isSearching}
              searchViewMode={searchViewMode} isMobile={isMobile} getBanlistBadge={(c) => renderBanlistBadge(c, format)}
              userInventoryCounts={userInventoryCounts} addCardToDeck={handleAddCardWithCopyCheck}
              openPreviewForCard={openPreviewForCard} handleDragCardStart={handleDragCardStart}
              handleCardMouseEnter={handleCardMouseEnter} handleCardMouseLeave={handleCardMouseLeave}
              searchLimit={searchLimit} setSearchLimit={setSearchLimit}
            />
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest" style={{ writingMode: 'vertical-rl' }}>Búsqueda</span>
        </div>
      )}

      {bulk.isScannerOpen && (
        <CardCodeScannerModal
          isOpen={bulk.isScannerOpen}
          onClose={() => bulk.setIsScannerOpen(false)}
          onCardRegistered={bulk.handleScannerCardRegistered}
          title="Escanear Código de Carta"
          subtitle="Apunta al código numérico de 8 dígitos de la esquina inferior"
        />
      )}

      {copyPickerState && (
        <SearchCardCopyPickerModal
          isOpen={Boolean(copyPickerState)}
          onClose={() => setCopyPickerState(null)}
          card={copyPickerState.card}
          copies={copyPickerState.copies}
          locations={locations}
          targetSection={copyPickerState.targetSection}
          assignedDraftUserCardIds={assignedDraftUserCardIds}
          activeContextName={activeContextName}
          onSelectCopy={(copy) => {
            addCardToDeck(copyPickerState.card, copyPickerState.targetSection, copy);
            setCopyPickerState(null);
          }}
          onSelectGeneric={() => {
            addCardToDeck(copyPickerState.card, copyPickerState.targetSection);
            setCopyPickerState(null);
          }}
        />
      )}
    </section>
  );
};
