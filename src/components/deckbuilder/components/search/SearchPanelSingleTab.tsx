import React from 'react';
import { Search, X, Heart, Loader2, ChevronDown } from 'lucide-react';
import { Card, HoverCardBase, SearchScope } from '../../types';
import { CardFilters, FilterState } from '../../CardFilters';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';
import { SearchResultsList } from './SearchResultsList';

interface SearchPanelSingleTabProps {
  localQuery: string;
  setLocalQuery: (q: string) => void;
  setSearchQuery: (q: string) => void;
  searchScope: SearchScope;
  setSearchScope: (s: SearchScope) => void;
  recentCardsCount: number;
  onClearRecentCards?: () => void;
  showStagedTab: boolean;
  stagedCardsCount: number;
  onSelectAllStaged?: () => void;
  onlyFavorites: boolean;
  setOnlyFavorites: React.Dispatch<React.SetStateAction<boolean>>;
  searchType: 'All' | 'Monster' | 'Spell' | 'Trap' | 'Extra';
  setSearchType: (t: 'All' | 'Monster' | 'Spell' | 'Trap' | 'Extra') => void;
  advancedFilters: FilterState;
  setAdvancedFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  searchResults: Card[];
  isSearching: boolean;
  searchViewMode: 'grid' | 'list';
  isMobile: boolean;
  getBanlistBadge: (card: Card) => React.ReactNode;
  userInventoryCounts: Record<number, number>;
  addCardToDeck: (card: Card, section?: 'main' | 'extra' | 'side' | 'extras') => void;
  openPreviewForCard?: (card: HoverCardBase) => void;
  handleDragCardStart: (e: React.DragEvent, cardData: Card) => void;
  handleCardMouseEnter: (card: HoverCardBase) => void;
  handleCardMouseLeave: () => void;
  searchLimit: number;
  setSearchLimit: React.Dispatch<React.SetStateAction<number>>;
}

export const SearchPanelSingleTab: React.FC<SearchPanelSingleTabProps> = ({
  localQuery, setLocalQuery, setSearchQuery, searchScope, setSearchScope,
  recentCardsCount, onClearRecentCards, showStagedTab, stagedCardsCount, onSelectAllStaged,
  onlyFavorites, setOnlyFavorites, searchType, setSearchType, advancedFilters, setAdvancedFilters,
  searchResults, isSearching, searchViewMode, isMobile, getBanlistBadge, userInventoryCounts,
  addCardToDeck, openPreviewForCard, handleDragCardStart, handleCardMouseEnter, handleCardMouseLeave,
  searchLimit, setSearchLimit,
}) => {
  return (
    <>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            inputMode={/^\d+$/.test(localQuery.trim()) && localQuery.trim().length > 0 ? 'numeric' : 'search'}
            placeholder={
              searchScope === 'staged' ? 'Buscar por nombre o ID...' :
              searchScope === 'collection' ? 'Buscar en mi colección (nombre o ID)...' :
              searchScope === 'recent' ? 'Filtrar en cartas recientes...' :
              searchScope === 'meta' ? 'Buscar cartas del meta...' :
              searchScope === 'suggested' ? 'Buscar en sugerencias...' :
              'Nombre o ID de carta (ej: 89631139)...'
            }
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-red-500 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs focus:outline-none transition-colors"
          />
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
          {localQuery && (
            <button
              type="button"
              onClick={() => { setLocalQuery(''); setSearchQuery(''); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setOnlyFavorites((prev) => !prev)}
          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
            onlyFavorites ? 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border-pink-300 dark:border-pink-500/50 shadow-sm' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-pink-500'
          }`}
          title={onlyFavorites ? 'Mostrar todas las cartas' : 'Filtrar por Favoritas'}
        >
          <Heart className={`w-4 h-4 ${onlyFavorites ? 'fill-pink-500' : ''}`} />
        </button>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex-1 min-w-0">
          <PremiumDropdown
            value={searchScope}
            onChange={(val) => setSearchScope(val as SearchScope)}
            options={[
              { value: 'global', label: '🌐 Global' },
              { value: 'collection', label: '📦 Colección' },
              { value: 'recent', label: `🕒 Recientes${recentCardsCount > 0 ? ` (${recentCardsCount})` : ''}` },
              { value: 'meta', label: '📈 Meta MDM' },
              { value: 'suggested', label: '✨ Sugeridas' },
              ...(showStagedTab ? [{ value: 'staged', label: `📥 Pendientes (${stagedCardsCount})` }] : []),
            ]}
            size="sm"
            triggerClassName="bg-zinc-100 dark:bg-zinc-950 font-bold border-zinc-200 dark:border-zinc-800 rounded-xl"
          />
        </div>
        {searchScope === 'recent' && recentCardsCount > 0 && onClearRecentCards && (
          <button type="button" onClick={onClearRecentCards} className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:bg-red-500/10 hover:border-red-500/30 text-zinc-500 hover:text-red-500 text-[10px] font-bold uppercase transition-colors cursor-pointer shrink-0">
            Limpiar
          </button>
        )}
      </div>

      {searchScope === 'staged' && stagedCardsCount > 0 && onSelectAllStaged && (
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200 truncate">{stagedCardsCount} cartas pendientes</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Sin ranura asignada en el binder</p>
          </div>
          <button type="button" onClick={onSelectAllStaged} className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase font-mono tracking-wider transition-colors shrink-0 cursor-pointer shadow-xs">
            Seleccionar Todo
          </button>
        </div>
      )}

      <div className="grid grid-cols-5 gap-1 shrink-0">
        {(['All', 'Monster', 'Spell', 'Trap', 'Extra'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSearchType(t)}
            className={`w-full py-1.5 px-0.5 rounded-lg text-[11px] sm:text-xs font-black uppercase tracking-tight text-center transition-all cursor-pointer truncate ${
              searchType === t ? 'bg-red-600 text-white shadow-xs' : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="relative z-20 shrink-0">
        <CardFilters
          filters={advancedFilters}
          onFilterChange={setAdvancedFilters}
          onReset={() => setAdvancedFilters({ type: '', attribute: '', race: '', level: '', atkMin: '', atkMax: '', defMin: '', defMax: '', archetype: '' })}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-thin">
        <SearchResultsList
          searchResults={searchResults}
          isSearching={isSearching}
          searchViewMode={searchViewMode}
          isMobile={isMobile}
          getBanlistBadge={getBanlistBadge}
          userInventoryCounts={userInventoryCounts}
          addCardToDeck={addCardToDeck}
          openPreviewForCard={openPreviewForCard}
          handleDragCardStart={handleDragCardStart}
          handleCardMouseEnter={handleCardMouseEnter}
          handleCardMouseLeave={handleCardMouseLeave}
          searchScope={searchScope}
        />
        {searchResults.length > 0 && searchResults.length >= searchLimit && (
          <button
            onClick={() => setSearchLimit((prev) => prev + 45)}
            className="w-full mt-3 py-2 bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" /> : <ChevronDown className="w-3.5 h-3.5 text-purple-400" />}
            <span>Cargar más cartas</span>
          </button>
        )}
      </div>
    </>
  );
};
