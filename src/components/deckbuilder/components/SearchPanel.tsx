import React from 'react';
import { Search, Heart, LayoutGrid, List, X, Loader2, ChevronDown, Sparkles } from 'lucide-react';
import { CardFilters, FilterState } from '../CardFilters';
import { Card, HoverCardBase } from '../types';

interface SearchPanelProps {
  leftPanelOpen: boolean;
  setLeftPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  leftPanelWidth: number;
  /** When true, renders inside a MobileBottomSheet — hides collapse controls */
  isMobile?: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchScope: 'global' | 'collection' | 'staged';
  setSearchScope: (scope: 'global' | 'collection' | 'staged') => void;
  showStagedTab?: boolean;
  stagedCardsCount?: number;
  onlyFavorites: boolean;
  onlyFavoritesSetOnlyFavorites?: React.Dispatch<React.SetStateAction<boolean>>;
  setOnlyFavorites: React.Dispatch<React.SetStateAction<boolean>>;
  searchType: 'All' | 'Monster' | 'Spell' | 'Trap' | 'Extra';
  setSearchType: (type: 'All' | 'Monster' | 'Spell' | 'Trap' | 'Extra') => void;
  advancedFilters: FilterState;
  setAdvancedFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  searchResults: Card[];
  isSearching: boolean;
  searchViewMode: 'grid' | 'list';
  setSearchViewMode: (mode: 'grid' | 'list') => void;
  searchLimit: number;
  setSearchLimit: React.Dispatch<React.SetStateAction<number>>;
  format: 'Master Duel' | 'TCG' | 'Duel Links';
  addCardToDeck: (card: Card, section?: 'main' | 'extra' | 'side' | 'extras') => void;
  openPreviewForCard?: (card: HoverCardBase) => void;
  handleDragCardStart: (e: React.DragEvent, cardData: any) => void;
  handleCardMouseEnter: (card: HoverCardBase) => void;
  handleCardMouseLeave: () => void;
}

interface SearchResultsListProps {
  searchResults: Card[];
  isSearching: boolean;
  searchViewMode: 'grid' | 'list';
  isMobile: boolean;
  getBanlistBadge: (card: Card) => React.ReactNode;
  addCardToDeck: (card: Card, section?: 'main' | 'extra' | 'side' | 'extras') => void;
  openPreviewForCard?: (card: HoverCardBase) => void;
  handleDragCardStart: (e: React.DragEvent, cardData: any) => void;
  handleCardMouseEnter: (card: HoverCardBase) => void;
  handleCardMouseLeave: () => void;
}

const SearchResultsList = React.memo(({
  searchResults,
  isSearching,
  searchViewMode,
  isMobile,
  getBanlistBadge,
  addCardToDeck,
  openPreviewForCard,
  handleDragCardStart,
  handleCardMouseEnter,
  handleCardMouseLeave,
}: SearchResultsListProps) => {
  if (isSearching && searchResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400 mb-2" />
        <span className="text-xs font-mono text-slate-400">Consultando base de cartas...</span>
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 mb-2">
          🔍
        </div>
        <p className="text-xs font-bold text-slate-300">No se encontraron cartas</p>
        <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-relaxed">
          Intenta buscar por nombre en inglés o limpia los filtros avanzados aplicados.
        </p>
      </div>
    );
  }

  if (searchViewMode === 'grid') {
    return (
      <div className={`grid gap-x-1.5 gap-y-2.5 ${isMobile ? 'grid-cols-4' : 'grid-cols-4 xl:grid-cols-5'}`}>
        {searchResults.map((card, idx) => (
          <div 
            key={`${card.id}-${idx}`}
            draggable={!isMobile}
            onDragStart={!isMobile ? (e) => handleDragCardStart(e, { id: card.id, name: card.name, type: card.type, image_url: card.image_url_small || card.image_url, archetype: card.archetype }) : undefined}
            onClick={() => addCardToDeck(card)}
            onContextMenu={(e) => {
              e.preventDefault();
              if (openPreviewForCard) {
                openPreviewForCard(card as HoverCardBase);
              }
            }}
            onMouseEnter={!isMobile ? () => handleCardMouseEnter(card as HoverCardBase) : undefined}
            onMouseLeave={!isMobile ? handleCardMouseLeave : undefined}
            className="relative aspect-[3/4.4] bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-red-500 transition-all duration-200 group flex flex-col justify-between p-1 overflow-hidden cursor-pointer card-tap touch-manipulation shadow-xs"
          >
            <div className="relative flex-1 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900">
              <img 
                src={card.image_url_small || card.image_url} 
                alt={card.name} 
                className="w-full h-full object-contain group-hover:scale-105 transition-transform" 
                onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
              />
              {getBanlistBadge(card)}
              {card.userCardsGroup && card.userCardsGroup.length > 0 && (
                <div className="absolute top-1 right-1 bg-purple-950/90 text-purple-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-purple-500/40 font-black shadow-xs">
                  {card.userCardsGroup.length}x
                </div>
              )}
            </div>
            <div className="mt-1 transition-all text-center min-w-0 px-0.5">
              <p className="text-[9px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-red-500 transition-colors truncate leading-tight">{card.name}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {searchResults.map((card, idx) => (
        <div 
          key={`${card.id}-${idx}`}
          draggable
          onDragStart={(e) => handleDragCardStart(e, { id: card.id, name: card.name, type: card.type, image_url: card.image_url_small || card.image_url, archetype: card.archetype })}
          onClick={() => addCardToDeck(card)}
          onContextMenu={(e) => {
            e.preventDefault();
            if (openPreviewForCard) {
              openPreviewForCard(card as HoverCardBase);
            }
          }}
          onMouseEnter={() => handleCardMouseEnter(card as HoverCardBase)}
          onMouseLeave={handleCardMouseLeave}
          className="flex gap-3 p-2.5 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-red-500 transition-all duration-200 group cursor-grab active:cursor-grabbing shadow-xs"
        >
          <img 
            src={card.image_url_small || card.image_url} 
            alt={card.name} 
            className="w-12 h-18 object-contain rounded-md shadow-xs group-hover:scale-105 transition-transform shrink-0" 
            onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
          />
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate group-hover:text-red-500 transition-colors">{card.name}</p>
                {card.userCardsGroup && card.userCardsGroup.length > 0 && (
                  <span className="text-[10px] font-mono font-bold text-purple-400 shrink-0">
                    {card.userCardsGroup.length}x
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-500 font-mono font-bold truncate">
                #{card.id} • {card.type} • {card.archetype || 'Genérica'}
              </p>
            </div>
            
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={(e) => { e.stopPropagation(); addCardToDeck(card, 'main'); }}
                className="flex-1 py-1 px-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                title="Añadir al Deck principal o Extra (Auto)"
              >
                + Agregar
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); addCardToDeck(card, 'side'); }}
                className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                title="Añadir a Side Deck"
              >
                + Side
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); addCardToDeck(card, 'extras'); }}
                className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                title="Añadir a Extra Deck"
              >
                + Extra
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}, (prev, next) => {
  return (
    prev.isSearching === next.isSearching &&
    prev.searchViewMode === next.searchViewMode &&
    prev.isMobile === next.isMobile &&
    prev.searchResults === next.searchResults
  );
});

SearchResultsList.displayName = 'SearchResultsList';

export const SearchPanel: React.FC<SearchPanelProps> = ({
  leftPanelOpen,
  setLeftPanelOpen,
  leftPanelWidth,
  isMobile = false,
  searchQuery,
  setSearchQuery,
  searchScope,
  setSearchScope,
  showStagedTab = false,
  stagedCardsCount = 0,
  onlyFavorites,
  setOnlyFavorites,
  searchType,
  setSearchType,
  advancedFilters,
  setAdvancedFilters,
  searchResults,
  isSearching,
  searchViewMode,
  setSearchViewMode,
  searchLimit,
  setSearchLimit,
  format,
  addCardToDeck,
  handleDragCardStart,
  handleCardMouseEnter,
  handleCardMouseLeave,
}) => {
  const [localQuery, setLocalQuery] = React.useState(searchQuery);

  React.useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== searchQuery) {
        setSearchQuery(localQuery);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [localQuery, searchQuery, setSearchQuery]);

  const getBanlistBadge = (card: Card) => {
    const status =
      format === 'TCG' ? card.ban_tcg :
      format === 'Master Duel' ? card.ban_master_duel :
      card.ban_duel_links;

    if (!status || status === 'Unlimited') return null;

    if (status === 'Forbidden') {
      return (
        <div
          className="absolute top-1 left-1 bg-black border-2 border-red-600 text-red-500 font-sans font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md shadow-black/80 z-20 select-none"
          title="Prohibida (0 copias)"
        >
          🚫
        </div>
      );
    }

    if (status === 'Limited') {
      return (
        <div
          className="absolute top-1 left-1 bg-black border-2 border-red-500 text-yellow-400 font-sans font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md shadow-black/80 z-20 select-none"
          title="Limitada (1 copia)"
        >
          1
        </div>
      );
    }

    if (status === 'Semi-Limited') {
      return (
        <div
          className="absolute top-1 left-1 bg-black border-2 border-blue-500 text-yellow-400 font-sans font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md shadow-black/80 z-20 select-none"
          title="Semi-limitada (2 copias)"
        >
          2
        </div>
      );
    }

    return null;
  };

  return (
    <section
      style={(!isMobile && leftPanelOpen) ? { width: `${leftPanelWidth}px` } : {}}
      className={`flex flex-col gap-4 ${
        isMobile
          ? 'w-full'
          : `bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-all overflow-hidden ${leftPanelOpen ? 'p-4' : 'w-10 min-w-10 p-2 items-center'}`
      }`}
    >
      {/* Panel header — hidden on mobile (title is in MobileBottomSheet) */}
      {!isMobile && (
        <div className={`border-b border-zinc-200 dark:border-zinc-800 pb-2.5 flex items-center ${leftPanelOpen ? 'justify-between' : 'justify-center flex-col gap-2'}`}>
          {leftPanelOpen && (
            <h2 className="font-black text-xs uppercase tracking-wider flex items-center gap-2 text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
              <span>🔍</span>
              <span>Buscar Cartas</span>
            </h2>
          )}
          <div className="flex items-center gap-1">
            {leftPanelOpen && (
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setSearchViewMode('grid')}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    searchViewMode === 'grid'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                  title="Vista Cuadrícula"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setSearchViewMode('list')}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    searchViewMode === 'list'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                  title="Vista Lista"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <button
              onClick={() => setLeftPanelOpen(p => !p)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              title={leftPanelOpen ? 'Colapsar panel de búsqueda' : 'Expandir panel de búsqueda'}
            >
              {leftPanelOpen ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Mobile: inline view/sort controls */}
      {isMobile && (
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setSearchViewMode('grid')}
              className={`p-1.5 rounded transition-colors cursor-pointer touch-manipulation ${
                searchViewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Vista Cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSearchViewMode('list')}
              className={`p-1.5 rounded transition-colors cursor-pointer touch-manipulation ${
                searchViewMode === 'list'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Vista Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <span className="text-[10px] text-zinc-500">{searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}</span>
        </div>
      )}
      {leftPanelOpen ? (
        <>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={searchScope === 'staged' ? "Buscar por nombre o ID..." : searchScope === 'collection' ? "Buscar en mi colección (nombre o ID)..." : "Nombre o ID de carta (ej: 89631139)..."}
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-red-500 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs focus:outline-none transition-colors"
              />
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
              {localQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalQuery('');
                    setSearchQuery('');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            <button
              onClick={() => setOnlyFavorites(prev => !prev)}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                onlyFavorites
                  ? 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border-pink-300 dark:border-pink-500/50 shadow-sm'
                  : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-pink-500'
              }`}
              title={onlyFavorites ? "Mostrar todas las cartas" : "Filtrar por Favoritas"}
            >
              <Heart className={`w-4 h-4 ${onlyFavorites ? 'fill-pink-500' : ''}`} />
            </button>
          </div>

          <div className={`grid ${showStagedTab ? 'grid-cols-3' : 'grid-cols-2'} gap-1 bg-zinc-100 dark:bg-zinc-950 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0`}>
            <button
              onClick={() => setSearchScope('global')}
              className={`py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                searchScope === 'global'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              🌐 Base Global
            </button>
            <button
              onClick={() => setSearchScope('collection')}
              className={`py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                searchScope === 'collection'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              📦 Mi Colección
            </button>
            {showStagedTab && (
              <button
                onClick={() => setSearchScope('staged')}
                className={`py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  searchScope === 'staged'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                📥 Pendientes ({stagedCardsCount})
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(['All', 'Monster', 'Spell', 'Trap', 'Extra'] as const).map(t => (
              <button
                key={t}
                onClick={() => setSearchType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  searchType === t
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <CardFilters
            filters={advancedFilters}
            onFilterChange={setAdvancedFilters}
            onReset={() => setAdvancedFilters({
              type: '',
              attribute: '',
              race: '',
              level: '',
              atkMin: '',
              atkMax: '',
              defMin: '',
              defMax: '',
              archetype: ''
            })}
          />

          <div className={`flex-1 overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-thin ${isMobile ? 'max-h-none' : 'max-h-125 lg:max-h-155'}`}>
            <SearchResultsList
              searchResults={searchResults}
              isSearching={isSearching}
              searchViewMode={searchViewMode}
              isMobile={isMobile}
              getBanlistBadge={getBanlistBadge}
              addCardToDeck={addCardToDeck}
              handleDragCardStart={handleDragCardStart}
              handleCardMouseEnter={handleCardMouseEnter}
              handleCardMouseLeave={handleCardMouseLeave}
            />

            {searchResults.length > 0 && searchResults.length >= searchLimit && (
              <button
                onClick={() => setSearchLimit(prev => prev + 45)}
                className="w-full mt-3 py-2 bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" /> : <ChevronDown className="w-3.5 h-3.5 text-purple-400" />}
                <span>Cargar más cartas</span>
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest" style={{ writingMode: 'vertical-rl' }}>Búsqueda</span>
        </div>
      )}
    </section>
  );
};
