import React from 'react';
import { Search, MapPin, ChevronDown, Heart, RefreshCw, Trash } from 'lucide-react';
import { UserCard, StorageLocation, Deck } from '@/types/collection';
import { CardFilters, FilterState } from '@/components/deckbuilder/CardFilters';
import { getSleeveColorHex } from '@/lib/sleeves';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';
import { getCategoryBadgeStyle, getLanguageDisplay } from '@/lib/collectionUtils';


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
  onCardContextMenu?: (uc: UserCard) => void;
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
  onCardContextMenu,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Disclaimer for Favorites Mode */}
      {activeTab === 'favorites' && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 shadow-xs">
          <Heart className="w-4 h-4 fill-red-500 text-red-500 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-300 font-mono">
            [ FAVORITAS ] Mostrando cartas marcadas como favoritas en tu colección y taller
          </span>
        </div>
      )}

      {/* General Search Input */}
      <div className="relative w-full">
        <input
          type="text"
          placeholder="Buscar por nombre, rareza, notas..."
          value={allSearchQuery}
          onChange={(e) => setAllSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-red-500 text-zinc-900 dark:text-zinc-100 rounded-2xl text-xs font-bold focus:outline-none shadow-xs transition-colors"
        />
        <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
      </div>

      {/* Location / Deck filters (only in Complete Tab) */}
      {activeTab === 'complete' && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Ubicación:</span>
          </div>
          <PremiumDropdown
            value={locationFilter}
            onChange={(val) => {
              setLocationFilter(val);
              setDeckFilter('');
            }}
            size="sm"
            menuWidth="min-w-56"
            options={[
              { value: '', label: 'Todas las ubicaciones' },
              { value: 'inbox', label: '📥 Sin Clasificar (Inbox)' },
              { value: 'in_deck', label: '⚔️ En Deck' },
              ...locations.map((l) => ({ value: l.id, label: `📦 ${l.name}` })),
            ]}
          />
          {locationFilter === 'in_deck' && (
            <PremiumDropdown
              value={deckFilter}
              onChange={(val) => setDeckFilter(val)}
              size="sm"
              menuWidth="min-w-52"
              options={[
                { value: '', label: 'Todos los decks' },
                ...decks.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
          )}
          {locationFilter && (
            <button
              onClick={() => { setLocationFilter(''); setDeckFilter(''); }}
              className="text-[10px] font-bold text-red-600 hover:text-red-500 underline cursor-pointer font-mono"
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
          <RefreshCw className="w-6 h-6 text-red-500 animate-spin mb-2" />
          <p className="text-xs font-mono font-bold text-zinc-500">Cargando colección completa...</p>
        </div>
      ) : allCollectionCards.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-medium shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl mx-auto mb-3">
            {activeTab === 'favorites' ? '❤️' : '📦'}
          </div>
          <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-1">
            {activeTab === 'favorites' ? 'Sin Cartas Favoritas' : 'No se encontraron cartas'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {activeTab === 'favorites'
              ? 'No tienes cartas marcadas como favoritas aún. ¡Pulsa el icono de corazón en cualquier carta de tu colección o en el buscador para añadirla!'
              : 'No se encontraron cartas en tu colección con los filtros seleccionados.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {allCollectionCards.map((uc) => {
            const storedIn = locations.find(l => l.id === uc.storage_location_id);
            return (
              <div 
                key={uc.id}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (onCardContextMenu) {
                    onCardContextMenu(uc);
                  }
                }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 flex flex-col justify-between hover:border-red-500/50 transition-all duration-200 relative group shadow-xs cursor-pointer"
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uc.card_details?.image_url_small || uc.card_details?.image_url || 'https://images.ygoprodeck.com/images/cards/placeholder.jpg'}
                    alt={uc.card_details?.name || 'Yugioh Card'}
                    className={`w-full h-44 object-contain rounded-xl shadow-xs mb-2 group-hover:scale-103 transition-transform ${
                      uc.sleeve_type && uc.sleeve_type !== 'none' && uc.sleeve_color ? '' : 'border border-zinc-200 dark:border-zinc-800'
                    }`}
                    style={
                      uc.sleeve_type && uc.sleeve_type !== 'none' && uc.sleeve_color
                        ? { borderColor: getSleeveColorHex(uc.sleeve_color), borderWidth: '2.5px', borderStyle: 'solid' }
                        : undefined
                    }
                    onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                  />
                  {uc.quantity > 1 && (
                    <span className="absolute top-1.5 right-1.5 bg-zinc-900/90 text-white font-black text-[10px] px-2 py-0.5 rounded-lg shadow-xs font-mono">
                      x{uc.quantity}
                    </span>
                  )}
                  {uc.is_proxy && (
                    <span className="absolute top-1.5 left-1.5 bg-red-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded-md font-mono uppercase">
                      PROXY
                    </span>
                  )}
                  <button
                    onClick={() => handleToggleFavorite(uc)}
                    className={`absolute bottom-3.5 right-1.5 p-1.5 rounded-full transition-all cursor-pointer bg-white/90 dark:bg-zinc-900/90 shadow-xs ${
                      uc.is_favorite
                        ? 'text-red-500 opacity-100'
                        : 'text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-red-500'
                    }`}
                    title={uc.is_favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                  >
                    <Heart className={`w-4 h-4 ${uc.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-black text-xs text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-red-500 transition-colors" title={uc.card_details?.name}>
                      {uc.card_details?.name || 'Cargando...'}
                    </h4>
                    
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold">
                        {uc.rarity || 'Common'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-zinc-500">
                        <span>{getLanguageDisplay(uc.language).flag}</span>
                        <span>{getLanguageDisplay(uc.language).badge}</span>
                      </span>
                    </div>
                  </div>

                  {/* Barra inferior de Categoría */}
                  <div 
                    className={`w-full h-1 mt-2 rounded-full overflow-hidden shadow-2xs ${getCategoryBadgeStyle(uc.status_flag).barColorClass}`}
                    title={`Estado: ${getCategoryBadgeStyle(uc.status_flag).label}`}
                  />

                  <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500 text-[9px] font-bold">Ubicación:</span>
                      {storedIn ? (
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 text-[9px] truncate max-w-22.5" title={storedIn.name}>
                          📦 {storedIn.name}
                        </span>
                      ) : (
                        <span className="font-bold text-amber-600 dark:text-amber-400 text-[9px]">
                          📥 Inbox
                        </span>
                      )}
                    </div>

                    {(uc.deck_details?.name || uc.deck_id) && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-zinc-500 text-[9px] font-bold">Deck:</span>
                        <span className="font-bold text-red-600 dark:text-red-400 text-[9px] truncate max-w-28" title={`${uc.deck_details?.name || 'Deck'} (${uc.deck_section || 'Main'})`}>
                          ⚔️ {uc.deck_details?.name || 'Deck'} {uc.deck_section ? `(${uc.deck_section.toUpperCase()})` : ''}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500 text-[9px] font-bold">Destino:</span>
                      <PremiumDropdown
                        value={uc.status_flag}
                        onChange={(val) => handleUpdateCardStatus(uc.id, val)}
                        size="xs"
                        menuWidth="min-w-32"
                        options={[
                          { value: 'collection', label: 'Colección' },
                          { value: 'trade_sale', label: 'Venta' },
                          { value: 'workshop', label: 'Taller' },
                          { value: 'bulk', label: 'Bulk' },
                        ]}
                      />
                    </div>

                    {uc.notes && (
                      <p className="text-[9px] text-zinc-500 line-clamp-1 italic">
                        &quot;{uc.notes}&quot;
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-1.5 pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDeleteCard(uc.id)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-950/40 text-zinc-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
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
