import React from 'react';
import { Search, MapPin, ChevronDown, Heart, RefreshCw, Trash } from 'lucide-react';
import { UserCard, StorageLocation, Deck } from '@/types/collection';
import { CardFilters, FilterState } from '@/components/deckbuilder/CardFilters';

interface CollectionCardsTabProps {
  activeTab: 'containers' | 'complete' | 'favorites' | 'sleeves';
  allSearchQuery: string;
  setAllSearchQuery: (query: string) => void;
  locationFilter: string;
  setLocationFilter: (id: string) => void;
  deckFilter: string;
  setDeckFilter: (id: string) => void;
  decks: Deck[];
  locations: StorageLocation[];
  allCollectionFilters: FilterState;
  setAllCollectionFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  loadingAllCards: boolean;
  allCollectionCards: UserCard[];
  handleToggleFavorite: (uc: UserCard) => Promise<void>;
  handleDeleteCard: (id: string) => Promise<void>;
  handleUpdateCardStatus: (id: string, status: string) => Promise<void>;
}

/**
 * CollectionCardsTab Component
 * Renders the filter controls and cards grid for the complete collection or favorites.
 */
export const CollectionCardsTab: React.FC<CollectionCardsTabProps> = ({
  activeTab,
  allSearchQuery,
  setAllSearchQuery,
  locationFilter,
  setLocationFilter,
  deckFilter,
  setDeckFilter,
  decks,
  locations,
  allCollectionFilters,
  setAllCollectionFilters,
  loadingAllCards,
  allCollectionCards,
  handleToggleFavorite,
  handleDeleteCard,
  handleUpdateCardStatus,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Disclaimer for Favorites Mode */}
      {activeTab === 'favorites' && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-pink-950/20 border border-pink-900/30">
          <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
          <span className="text-xs font-semibold text-pink-300">Mostrando sólo cartas marcadas como favoritas</span>
        </div>
      )}

      {/* General Search Input */}
      <div className="relative w-full">
        <input
          type="text"
          placeholder="Buscar por nombre, rareza, notas..."
          value={allSearchQuery}
          onChange={(e) => setAllSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-zinc-700 focus:border-[hsl(263,85%,64%)] text-slate-100 rounded-xl text-xs focus:outline-none transition-colors"
        />
        <Search className="w-3.5 h-3.5 absolute left-3 top-3.5 text-[hsl(215,15%,70%)]" />
      </div>

      {/* Location / Deck filters (only in Complete Tab) */}
      {activeTab === 'complete' && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[10px] uppercase font-bold text-slate-400">Ubicación:</span>
          </div>
          <div className="relative">
            <select
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setDeckFilter('');
              }}
              className="pl-3 pr-7 py-1.5 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-slate-600 text-xs text-slate-200 rounded-lg focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
            >
              <option value="">Todas las ubicaciones</option>
              <option value="inbox">📥 Sin Clasificar (Inbox)</option>
              <option value="in_deck">⚔️ En Deck</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>📦 {l.name}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-2.5 pointer-events-none" />
          </div>
          {locationFilter === 'in_deck' && (
            <div className="relative">
              <select
                value={deckFilter}
                onChange={(e) => setDeckFilter(e.target.value)}
                className="pl-3 pr-7 py-1.5 bg-[hsl(224,25%,6%)] border border-purple-500/40 text-xs text-purple-200 rounded-lg focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">Todos los decks</option>
                {decks.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-2.5 pointer-events-none" />
            </div>
          )}
          {locationFilter && (
            <button
              onClick={() => { setLocationFilter(''); setDeckFilter(''); }}
              className="text-[10px] text-slate-500 hover:text-white underline cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* Advanced Filters Component */}
      <CardFilters
        filters={allCollectionFilters}
        onFilterChange={setAllCollectionFilters}
        onReset={() => setAllCollectionFilters({
          type: '',
          attribute: '',
          race: '',
          level: '',
          atkMin: '',
          atkMax: '',
          defMin: '',
          defMax: '',
          archetype: '',
          rarity: '',
          status: ''
        })}
        showRarity={true}
        showCollectionOptions={true}
      />

      {loadingAllCards ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mb-2" />
          <p className="text-xs font-mono text-slate-500">Cargando colección completa...</p>
        </div>
      ) : allCollectionCards.length === 0 ? (
        <div className="text-center py-20 bg-[hsl(224,22%,10%)] rounded-2xl border border-[hsl(224,15%,16%)] text-slate-500 text-sm">
          {activeTab === 'favorites'
            ? 'No tienes cartas marcadas como favoritas. ¡Pulsa el corazón en cualquier carta para agregarla!'
            : 'No se encontraron cartas en tu colección con los filtros seleccionados.'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {allCollectionCards.map((uc) => {
            const storedIn = locations.find(l => l.id === uc.storage_location_id);
            return (
              <div 
                key={uc.id}
                className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between hover:border-purple-500/40 transition-all duration-300 relative group"
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uc.card_details?.image_url_small || uc.card_details?.image_url || 'https://images.ygoprodeck.com/images/cards/placeholder.jpg'}
                    alt={uc.card_details?.name || 'Yugioh Card'}
                    className="w-full h-44 object-contain rounded-md shadow-md mb-2 group-hover:scale-103 transition-transform"
                    onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                  />
                  {uc.quantity > 1 && (
                    <span className="absolute top-1.5 right-1.5 bg-purple-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full shadow font-mono">
                      x{uc.quantity}
                    </span>
                  )}
                  {uc.is_proxy && (
                    <span className="absolute top-1.5 left-1.5 bg-red-600/90 text-white font-bold text-[9px] px-1.5 py-0.2 rounded font-mono uppercase">
                      PROXY
                    </span>
                  )}
                  <button
                    onClick={() => handleToggleFavorite(uc)}
                    className={`absolute bottom-3.5 right-1.5 p-1 rounded-full transition-all cursor-pointer ${
                      uc.is_favorite
                        ? 'text-pink-500 opacity-100'
                        : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-pink-400'
                    }`}
                    title={uc.is_favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                  >
                    <Heart className={`w-4 h-4 ${uc.is_favorite ? 'fill-pink-500' : ''}`} />
                  </button>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-200 line-clamp-1 group-hover:text-purple-300 transition-colors" title={uc.card_details?.name}>
                      {uc.card_details?.name || 'Cargando...'}
                    </h4>
                    
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 font-medium">
                        {uc.rarity || 'Common'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-cyan-400 font-mono">
                        {uc.condition || 'NM'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 text-[9px]">Ubicación:</span>
                      {storedIn ? (
                        <span className="font-semibold text-cyan-400 text-[9px] truncate max-w-22.5" title={storedIn.name}>
                          📦 {storedIn.name}
                        </span>
                      ) : (
                        <span className="font-semibold text-amber-500 text-[9px]">
                          📥 Inbox
                        </span>
                      )}
                    </div>

                    {(uc.deck_details?.name || uc.deck_id) && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 text-[9px]">Deck:</span>
                        <span className="font-semibold text-purple-400 text-[9px] truncate max-w-28" title={`${uc.deck_details?.name || 'Deck'} (${uc.deck_section || 'Main'})`}>
                          ⚔️ {uc.deck_details?.name || 'Deck'} {uc.deck_section ? `(${uc.deck_section.toUpperCase()})` : ''}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 text-[9px]">Destino:</span>
                      <select
                        value={uc.status_flag}
                        onChange={(e) => handleUpdateCardStatus(uc.id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-[9px] text-slate-350 rounded px-1 py-0.2 focus:outline-none"
                      >
                        <option value="collection">Colección</option>
                        <option value="trade_sale">Venta</option>
                        <option value="workshop">Taller</option>
                        <option value="bulk">Bulk</option>
                      </select>
                    </div>

                    {uc.notes && (
                      <p className="text-[9px] text-slate-500 line-clamp-1 italic">
                        &quot;{uc.notes}&quot;
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-1.5 pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDeleteCard(uc.id)}
                        className="p-1 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded transition-colors cursor-pointer"
                        title="Eliminar carta"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
