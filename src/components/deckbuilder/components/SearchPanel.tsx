import React from 'react';
import { Search, Heart, LayoutGrid, List, X, Loader2 } from 'lucide-react';
import { CardFilters, FilterState } from '../CardFilters';
import { Card, HoverCardBase } from '../types';

interface SearchPanelProps {
  leftPanelOpen: boolean;
  setLeftPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  leftPanelWidth: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchScope: 'global' | 'collection';
  setSearchScope: (scope: 'global' | 'collection') => void;
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

export const SearchPanel: React.FC<SearchPanelProps> = ({
  leftPanelOpen,
  setLeftPanelOpen,
  leftPanelWidth,
  searchQuery,
  setSearchQuery,
  searchScope,
  setSearchScope,
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
      style={leftPanelOpen ? { width: `${leftPanelWidth}px` } : {}}
      className={`flex flex-col gap-4 bg-[hsl(224,22%,10%)] border border-[hsl(224,15%,16%)] rounded-2xl transition-all overflow-hidden ${
        leftPanelOpen ? 'p-4' : 'w-10 min-w-[40px] p-2 items-center'
      }`}
    >
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
      {leftPanelOpen ? (
        <>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={searchScope === 'collection' ? "Buscar en mi colección..." : "Nombre de carta..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

          <div className="grid grid-cols-2 gap-1 bg-[hsl(224,25%,6%)] p-0.5 rounded-xl border border-[hsl(224,15%,16%)] shrink-0">
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

          <div className="flex-1 overflow-y-auto max-h-125 lg:max-h-155 pr-1 flex flex-col gap-2 scrollbar-thin">
            {isSearching && searchResults.length === 0 ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-500 mb-1" />
                <span className="text-xs font-mono text-slate-500">Buscando...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-zinc-600 text-sm">
                No se encontraron cartas. Intenta buscando otra palabra.
              </div>
            ) : searchViewMode === 'grid' ? (
              <div className="grid grid-cols-5 gap-x-0.5 gap-y-1.5">
                {searchResults.map(card => (
                  <div 
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragCardStart(e, { id: card.id, name: card.name, type: card.type, image_url: card.image_url_small || card.image_url, archetype: card.archetype })}
                    onClick={() => addCardToDeck(card)}
                    onMouseEnter={() => handleCardMouseEnter(card as HoverCardBase)}
                    onMouseLeave={handleCardMouseLeave}
                    className="relative aspect-[3/4.2] bg-[hsl(224,25%,6%)] hover:bg-[hsl(224,22%,10%)] rounded-lg border border-[hsl(224,15%,16%)] hover:border-[hsl(263,85%,64%)]/40 transition-all duration-300 group flex flex-col justify-between p-1 overflow-hidden cursor-grab active:cursor-grabbing"
                  >
                    <div className="relative flex-1 rounded-md overflow-hidden shadow">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
            ) : (
              searchResults.map(card => (
                <div 
                  key={card.id}
                  draggable
                  onDragStart={(e) => handleDragCardStart(e, { id: card.id, name: card.name, type: card.type, image_url: card.image_url_small || card.image_url, archetype: card.archetype })}
                  onClick={() => addCardToDeck(card)}
                  onMouseEnter={() => handleCardMouseEnter(card as HoverCardBase)}
                  onMouseLeave={handleCardMouseLeave}
                  className="flex gap-3 p-2 bg-[hsl(224,25%,6%)] hover:bg-[hsl(224,22%,10%)] rounded-xl border border-[hsl(224,15%,16%)] hover:border-[hsl(263,85%,64%)]/40 transition-all duration-300 group cursor-grab active:cursor-grabbing"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
                        className="px-1.5 py-1 bg-zinc-900 hover:bg-zinc-700 text-slate-350 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                        title="Añadir a Extras/Sugeridas"
                      >
                        + Ext
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

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
