import React from 'react';
import { Search, Heart, LayoutGrid, List, X, Loader2 } from 'lucide-react';
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
  handleDragCardStart,
  handleCardMouseEnter,
  handleCardMouseLeave
}: SearchResultsListProps) => {
  if (isSearching && searchResults.length === 0) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-500 mb-1" />
        <span className="text-xs font-mono text-slate-500">Buscando...</span>
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-650 text-sm">
        No se encontraron cartas. Intenta buscando otra palabra.
      </div>
    );
  }

  if (searchViewMode === 'grid') {
    return (
      <div className={`grid gap-x-1 gap-y-2 ${isMobile ? 'grid-cols-4' : 'grid-cols-5'}`}>
        {searchResults.map(card => (
          <div 
            key={card.id}
            draggable={!isMobile}
            onDragStart={!isMobile ? (e) => handleDragCardStart(e, { id: card.id, name: card.name, type: card.type, image_url: card.image_url_small || card.image_url, archetype: card.archetype }) : undefined}
            onClick={() => addCardToDeck(card)}
            onMouseEnter={!isMobile ? () => handleCardMouseEnter(card as HoverCardBase) : undefined}
            onMouseLeave={!isMobile ? handleCardMouseLeave : undefined}
            className="relative aspect-[3/4.2] bg-[hsl(224,25%,6%)] hover:bg-[hsl(224,22%,10%)] rounded-lg border border-[hsl(224,15%,16%)] hover:border-[hsl(263,85%,64%)]/40 transition-all duration-300 group flex flex-col justify-between p-1 overflow-hidden cursor-pointer card-tap touch-manipulation"
          >
            <div className="relative flex-1 rounded-md overflow-hidden shadow">
              <img 
                src={card.image_url_small || card.image_url} 
                alt={card.name} 
                className="w-full h-full object-contain group-hover:scale-105 transition-transform" 
                onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
              />
              {getBanlistBadge(card)}
            </div>
            <div className="mt-1 transition-all text-center min-w-0">
              <p className="text-[7.5px] font-semibold text-slate-300 truncate">{card.name}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {searchResults.map(card => (
        <div 
          key={card.id}
          draggable
          onDragStart={(e) => handleDragCardStart(e, { id: card.id, name: card.name, type: card.type, image_url: card.image_url_small || card.image_url, archetype: card.archetype })}
          onClick={() => addCardToDeck(card)}
          onMouseEnter={() => handleCardMouseEnter(card as HoverCardBase)}
          onMouseLeave={handleCardMouseLeave}
          className="flex gap-3 p-2 bg-[hsl(224,25%,6%)] hover:bg-[hsl(224,22%,10%)] rounded-xl border border-[hsl(224,15%,16%)] hover:border-[hsl(263,85%,64%)]/40 transition-all duration-300 group cursor-grab active:cursor-grabbing"
        >
          <img 
            src={card.image_url_small || card.image_url} 
            alt={card.name} 
            className="w-12 h-18 object-contain rounded-md shadow-md shadow-black/40 group-hover:scale-105 transition-transform"
            onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
          />
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <p className="text-[10.5px] font-semibold text-slate-200 truncate group-hover:text-purple-300 transition-colors">{card.name}</p>
              <p className="text-[9px] text-[hsl(215,15%,70%)] truncate">
                {card.type} • {card.archetype || 'Genérica'}
              </p>
            </div>
            
            <div className="flex gap-1.5 mt-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); addCardToDeck(card, 'main'); }}
                className="flex-1 py-1 px-1.5 bg-[hsl(263,85%,64%)] hover:bg-[hsl(263,85%,64%)]/80 text-white rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                title="Añadir al Deck principal o Extra (Auto)"
              >
                + Agregar
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); addCardToDeck(card, 'side'); }}
                className="px-1.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-slate-200 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                title="Añadir a Side Deck"
              >
                + Side
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); addCardToDeck(card, 'extras'); }}
                className="px-1.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-slate-200 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
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
    }, 200);
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

  return (
    <section
      style={(!isMobile && leftPanelOpen) ? { width: `${leftPanelWidth}px` } : {}}
      className={`flex flex-col gap-4 ${
        isMobile
          ? 'w-full'
          : `bg-[hsl(224,22%,10%)] border border-[hsl(224,15%,16%)] rounded-2xl transition-all overflow-hidden ${leftPanelOpen ? 'p-4' : 'w-10 min-w-[40px] p-2 items-center'}`
      }`}
    >
      {/* Panel header — hidden on mobile (title is in MobileBottomSheet) */}
      {!isMobile && (
        <div className={`border-b border-[hsl(224,15%,16%)] pb-2.5 flex items-center ${leftPanelOpen ? 'justify-between' : 'justify-center flex-col gap-2'}`}>
          {leftPanelOpen && (
            <h2 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 whitespace-nowrap">
              🔍 Buscar Cartas
            </h2>
          )}
          <div className="flex items-center gap-1">
            {leftPanelOpen && (
              <div className="flex items-center gap-1 bg-[hsl(224,25%,6%)] p-0.5 rounded-lg border border-[hsl(224,15%,16%)]">
                <button
                  onClick={() => setSearchViewMode('grid')}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    searchViewMode === 'grid'
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'text-[hsl(215,15%,70%)] hover:text-white'
                  }`}
                  title="Vista Cuadrícula"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setSearchViewMode('list')}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    searchViewMode === 'list'
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'text-[hsl(215,15%,70%)] hover:text-white'
                  }`}
                  title="Vista Lista"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <button
              onClick={() => setLeftPanelOpen(p => !p)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
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
          <div className="flex items-center gap-1 bg-[hsl(224,25%,6%)] p-0.5 rounded-lg border border-[hsl(224,15%,16%)]">
            <button
              onClick={() => setSearchViewMode('grid')}
              className={`p-1.5 rounded transition-colors cursor-pointer touch-manipulation ${
                searchViewMode === 'grid'
                  ? 'bg-zinc-800 text-white'
                  : 'text-[hsl(215,15%,70%)] hover:text-white'
              }`}
              title="Vista Cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSearchViewMode('list')}
              className={`p-1.5 rounded transition-colors cursor-pointer touch-manipulation ${
                searchViewMode === 'list'
                  ? 'bg-zinc-800 text-white'
                  : 'text-[hsl(215,15%,70%)] hover:text-white'
              }`}
              title="Vista Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <span className="text-[10px] text-slate-500">{searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}</span>
        </div>
      )}
      {leftPanelOpen ? (
        <>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={searchScope === 'staged' ? "Buscar pendientes..." : searchScope === 'collection' ? "Buscar en mi colección..." : "Nombre de carta..."}
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-zinc-700 focus:border-[hsl(263,85%,64%)] text-slate-100 rounded-xl text-xs focus:outline-none transition-colors"
              />
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[hsl(215,15%,70%)]" />
            </div>
            
            <button
              onClick={() => setOnlyFavorites(prev => !prev)}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                onlyFavorites
                  ? 'bg-pink-950/40 text-pink-500 border-pink-500/50 shadow-md shadow-pink-950/20'
                  : 'bg-[hsl(224,25%,6%)] border-[hsl(224,15%,16%)] text-slate-400 hover:text-pink-400 hover:border-pink-900/30'
              }`}
              title={onlyFavorites ? "Mostrar todas las cartas" : "Filtrar por Favoritas"}
            >
              <Heart className={`w-4 h-4 ${onlyFavorites ? 'fill-pink-500' : ''}`} />
            </button>
          </div>

          <div className={`grid ${showStagedTab ? 'grid-cols-3' : 'grid-cols-2'} gap-1 bg-[hsl(224,25%,6%)] p-0.5 rounded-xl border border-[hsl(224,15%,16%)] shrink-0`}>
            <button
              onClick={() => setSearchScope('global')}
              className={`py-1.5 rounded-lg text-[10.5px] font-semibold transition-all duration-300 cursor-pointer ${
                searchScope === 'global'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-[hsl(215,15%,70%)] hover:text-white'
              }`}
            >
              🌐 Base Global
            </button>
            <button
              onClick={() => setSearchScope('collection')}
              className={`py-1.5 rounded-lg text-[10.5px] font-semibold transition-all duration-300 cursor-pointer ${
                searchScope === 'collection'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-[hsl(215,15%,70%)] hover:text-white'
              }`}
            >
              📦 Mi Colección
            </button>
            {showStagedTab && (
              <button
                onClick={() => setSearchScope('staged')}
                className={`py-1.5 rounded-lg text-[10.5px] font-semibold transition-all duration-300 cursor-pointer ${
                  searchScope === 'staged'
                    ? 'bg-purple-650 text-white shadow-sm shadow-purple-900/35 border border-purple-500/20'
                    : 'text-[hsl(215,15%,70%)] hover:text-white'
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  searchType === t
                    ? 'bg-[hsl(180,80%,45%)]/20 text-[hsl(180,80%,45%)] border border-[hsl(180,80%,45%)]/40'
                    : 'bg-[hsl(224,25%,6%)] text-[hsl(215,15%,70%)] border border-[hsl(224,15%,16%)] hover:text-white'
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
                className="w-full mt-3 py-2 bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" /> : '▼'}
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
