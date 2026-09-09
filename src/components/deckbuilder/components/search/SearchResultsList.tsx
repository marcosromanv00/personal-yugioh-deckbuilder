import React from 'react';
import { Loader2, AlertCircle, Clock } from 'lucide-react';
import { Card, HoverCardBase, SearchScope } from '../../types';
import { SearchGridCardItem } from './SearchGridCardItem';
import { SearchListCardItem } from './SearchListCardItem';
import { getCardOwnedCount } from './searchPanel.utils';

interface SearchResultsListProps {
  searchResults: Card[];
  isSearching: boolean;
  searchViewMode: 'grid' | 'list';
  isMobile: boolean;
  getBanlistBadge: (card: Card) => React.ReactNode;
  userInventoryCounts?: Record<number, number>;
  addCardToDeck: (card: Card, section?: 'main' | 'extra' | 'side' | 'extras') => void;
  openPreviewForCard?: (card: HoverCardBase) => void;
  handleDragCardStart: (e: React.DragEvent, cardData: Card) => void;
  handleCardMouseEnter: (card: HoverCardBase) => void;
  handleCardMouseLeave: () => void;
  searchScope?: SearchScope;
}

export const SearchResultsList = React.memo(
  ({
    searchResults,
    isSearching,
    searchViewMode,
    isMobile,
    getBanlistBadge,
    userInventoryCounts,
    addCardToDeck,
    openPreviewForCard,
    handleDragCardStart,
    handleCardMouseEnter,
    handleCardMouseLeave,
    searchScope,
  }: SearchResultsListProps) => {
    if (isSearching && searchResults.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-red-600 mb-2" />
          <span className="text-xs font-mono text-zinc-400">Consultando base de cartas...</span>
        </div>
      );
    }

    if (searchResults.length === 0) {
      if (searchScope === 'recent') {
        return (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-2">
              <Clock className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">No hay cartas recientes aún</p>
            <p className="text-[10px] text-zinc-400 mt-1 max-w-56 leading-relaxed">
              Las cartas que agregues, retires o consultes aparecerán aquí para un acceso rápido.
            </p>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-2">
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-zinc-500">No se encontraron cartas</p>
          <p className="text-[10px] text-zinc-400 mt-1">Prueba ajustando los términos o filtros</p>
        </div>
      );
    }

    if (searchViewMode === 'grid') {
      return (
        <div className={`grid gap-2 ${isMobile ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-4 xl:grid-cols-5'}`}>
          {searchResults.map((card, idx) => (
            <SearchGridCardItem
              key={`${card.id}-${idx}`}
              card={card}
              idx={idx}
              isMobile={isMobile}
              searchScope={searchScope}
              ownedCount={getCardOwnedCount(card, userInventoryCounts)}
              banlistBadge={getBanlistBadge(card)}
              addCardToDeck={addCardToDeck}
              openPreviewForCard={openPreviewForCard}
              handleDragCardStart={handleDragCardStart}
              handleCardMouseEnter={handleCardMouseEnter}
              handleCardMouseLeave={handleCardMouseLeave}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2.5">
        {searchResults.map((card, idx) => (
          <SearchListCardItem
            key={`${card.id}-${idx}`}
            card={card}
            idx={idx}
            isMobile={isMobile}
            searchScope={searchScope}
            ownedCount={getCardOwnedCount(card, userInventoryCounts)}
            addCardToDeck={addCardToDeck}
            openPreviewForCard={openPreviewForCard}
            handleDragCardStart={handleDragCardStart}
            handleCardMouseEnter={handleCardMouseEnter}
            handleCardMouseLeave={handleCardMouseLeave}
          />
        ))}
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.isSearching === next.isSearching &&
      prev.searchViewMode === next.searchViewMode &&
      prev.isMobile === next.isMobile &&
      prev.searchResults === next.searchResults &&
      prev.userInventoryCounts === next.userInventoryCounts
    );
  }
);

SearchResultsList.displayName = 'SearchResultsList';
