import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  Heart, 
  Trash, 
  CheckSquare, 
  CheckCheck, 
  X, 
  Scissors, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Filter,
  RotateCcw
} from 'lucide-react';
import { UserCard, StorageLocation, Deck, CardStatusFlag } from '@/types/collection';
import { CardFilters, FilterState } from '@/components/deckbuilder/CardFilters';
import { getSleeveColorHex } from '@/lib/sleeves';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';
import { getCategoryBadgeStyle, getLanguageDisplay } from '@/lib/collectionUtils';
import { DuplicateCardAlertPopover } from '../DuplicateCardAlertPopover';
import { DuplicateMatchInfo } from '@/lib/collectionSuggestions';
import { CardImage } from '@/components/ui/CardImage';
import { CollectionCardDetailModal } from './CollectionCardDetailModal';
import { CollectionCardsTabSkeleton } from './CollectionCardsTabSkeleton';

interface CollectionCardsTabProps {
  activeTab: 'containers' | 'suggestions' | 'complete' | 'favorites' | 'sleeves' | 'decks';
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
  onMoveCard?: (id: string, locationId: string | null) => Promise<void>;
  onOpenContainer?: (loc: StorageLocation) => void;
  onCardContextMenu?: (uc: UserCard) => void;
  isSelectMode?: boolean;
  setIsSelectMode?: (mode: boolean | ((prev: boolean) => boolean)) => void;
  selectedCardIds?: string[];
  onToggleSelectCard?: (id: string) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onOpenSplitModal?: (card?: UserCard) => void;
  duplicateMap?: Map<number, DuplicateMatchInfo>;
}

const PAGE_SIZE_OPTIONS = [36, 60, 96, 120];

/**
 * CollectionCardsTab Component
 * Renders the filter controls, high-density multi-column card grid,
 * skeleton loaders, and classical pagination for the complete collection or favorites.
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
  isSelectMode = false,
  setIsSelectMode,
  selectedCardIds = [],
  onToggleSelectCard,
  onSelectAll,
  onClearSelection,
  onOpenSplitModal,
  onMoveCard,
  onOpenContainer,
  duplicateMap,
}) => {
  const selectedCount = selectedCardIds.length;
  const gridTopRef = useRef<HTMLDivElement>(null);

  // Estado para desplegar filtros avanzados
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState<boolean>(false);

  // Estado para carta seleccionada en modal de detalles
  const [selectedCardForDetail, setSelectedCardForDetail] = useState<UserCard | null>(null);

  // Conteo de filtros activos
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (allCollectionFilters.type) count++;
    if (allCollectionFilters.attribute) count++;
    if (allCollectionFilters.race) count++;
    if (allCollectionFilters.level) count++;
    if (allCollectionFilters.atkMin || allCollectionFilters.atkMax) count++;
    if (allCollectionFilters.defMin || allCollectionFilters.defMax) count++;
    if (allCollectionFilters.archetype) count++;
    if (allCollectionFilters.rarity) count++;
    if (allCollectionFilters.status) count++;
    return count;
  }, [allCollectionFilters]);

  // Estados de Paginación Clásica
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(60);

  // Reiniciar a la primera página cuando cambian los filtros sin useEffect (React 19 Zero-Effect)
  const [prevFilterHash, setPrevFilterHash] = useState(() => `${allSearchQuery}|${locationFilter}|${deckFilter}|${JSON.stringify(allCollectionFilters)}`);
  const currentFilterHash = `${allSearchQuery}|${locationFilter}|${deckFilter}|${JSON.stringify(allCollectionFilters)}`;
  if (currentFilterHash !== prevFilterHash) {
    setPrevFilterHash(currentFilterHash);
    setCurrentPage(1);
  }

  const totalCards = allCollectionCards.length;
  const totalPages = Math.ceil(totalCards / pageSize) || 1;

  // Cartas paginadas para la vista activa
  const paginatedCards = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return allCollectionCards.slice(startIndex, startIndex + pageSize);
  }, [allCollectionCards, currentPage, pageSize]);

  const startItem = totalCards === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCards);

  // Cambio de página con scroll suave
  const handlePageChange = (newPage: number) => {
    const clampedPage = Math.max(1, Math.min(newPage, totalPages));
    setCurrentPage(clampedPage);
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Generador de números de página con elipsis inteligente
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const handleResetFilters = () => {
    setAllCollectionFilters({
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
    });
  };

  return (
    <div className="space-y-4" ref={gridTopRef}>
      {/* Header Disclaimer for Favorites Mode */}
      {activeTab === 'favorites' && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 shadow-xs">
          <Heart className="w-4 h-4 fill-red-500 text-red-500 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-300 font-mono">
            [ FAVORITAS ] Mostrando cartas marcadas como favoritas en tu colección y taller
          </span>
        </div>
      )}

      {/* ═══ BARRA COMPACTA UNIFICADA DE UTILIDADES ═══ */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        {/* Buscador de Texto */}
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, rareza, notas o card_id:XXXXX..."
            value={allSearchQuery}
            onChange={(e) => setAllSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-500 transition-colors"
          />
          {allSearchQuery && (
            <button
              type="button"
              onClick={() => setAllSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer p-0.5"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Ubicación Dropdown (solo en Colección Completa) */}
          {activeTab === 'complete' && (
            <PremiumDropdown
              value={locationFilter}
              onChange={(val) => {
                setLocationFilter(val);
                setDeckFilter('');
              }}
              size="sm"
              menuWidth="min-w-52"
              options={[
                { value: '', label: '📍 Todas las ubicaciones' },
                { value: 'inbox', label: '📥 Sin Clasificar (Inbox)' },
                { value: 'in_deck', label: '⚔️ En Deck' },
                ...locations.map((l) => ({ value: l.id, label: `📦 ${l.name}` })),
              ]}
            />
          )}

          {activeTab === 'complete' && locationFilter === 'in_deck' && (
            <PremiumDropdown
              value={deckFilter}
              onChange={(val) => setDeckFilter(val)}
              size="sm"
              menuWidth="min-w-48"
              options={[
                { value: '', label: 'Todos los decks' },
                ...decks.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
          )}

          {/* Toggle Filtros Avanzados */}
          <button
            type="button"
            onClick={() => setIsAdvancedFiltersOpen((p) => !p)}
            className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs min-h-10 touch-manipulation ${
              isAdvancedFiltersOpen || activeFilterCount > 0
                ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40'
                : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-transparent'
            }`}
            title="Filtros avanzados de cartas"
          >
            <Filter className="w-3.5 h-3.5 text-red-500" />
            <span>Filtros</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold font-mono">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Botón Modo Selección */}
          {setIsSelectMode && (
            <button
              type="button"
              onClick={() => setIsSelectMode((p) => !p)}
              className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs min-h-10 touch-manipulation ${
                isSelectMode
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-transparent'
              }`}
              title={isSelectMode ? 'Desactivar selección múltiple' : 'Activar selección múltiple'}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Selección</span>
              {selectedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-950 text-white text-[10px] font-bold font-mono">
                  {selectedCount}
                </span>
              )}
            </button>
          )}

          {isSelectMode && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onSelectAll}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-xs font-mono transition-colors cursor-pointer min-h-10 min-w-10 flex items-center justify-center touch-manipulation"
                title="Seleccionar todas las cartas de esta vista"
              >
                <CheckCheck className="w-4 h-4 text-red-500" />
              </button>
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-xs font-mono transition-colors cursor-pointer min-h-10 min-w-10 flex items-center justify-center touch-manipulation"
                  title="Deseleccionar todas"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Panel Plegable de Filtros Avanzados */}
      {isAdvancedFiltersOpen && (
        <div className="p-3 sm:p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-mono font-bold uppercase text-zinc-500 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-red-500" />
              Filtros Avanzados de Yu-Gi-Oh!
            </span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-mono font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Restablecer ({activeFilterCount})
              </button>
            )}
          </div>
          <CardFilters
            filters={allCollectionFilters}
            onFilterChange={setAllCollectionFilters}
            onReset={handleResetFilters}
            showRarity={true}
            showCollectionOptions={true}
          />
        </div>
      )}

      {/* ═══ RESUMEN & PAGINACIÓN COMPACTA ═══ */}
      {!loadingAllCards && totalCards > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3 text-xs font-mono text-zinc-500 dark:text-zinc-400">
            <span>
              Mostrando <strong className="text-zinc-900 dark:text-zinc-100">{startItem}</strong> - <strong className="text-zinc-900 dark:text-zinc-100">{endItem}</strong> de <strong className="text-red-600 dark:text-red-400">{totalCards.toLocaleString()}</strong> cartas
            </span>

            <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Por página:</span>
              <div className="flex items-center gap-1">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                      pageSize === size
                        ? 'bg-red-600 text-white shadow-2xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1 self-center sm:self-auto">
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Primera Página"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Página Anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1 mx-1">
                {getPageNumbers().map((p, idx) => {
                  if (p === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-1 text-xs text-zinc-400 font-mono">
                        ...
                      </span>
                    );
                  }
                  const pageNum = Number(p);
                  const isCurrent = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-7 h-7 px-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Página Siguiente"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Última Página"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* SKELETONS DURING LOADING */}
      {loadingAllCards ? (
        <CollectionCardsTabSkeleton />
      ) : totalCards === 0 ? (
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
        /* HIGH-DENSITY RESPONSIVE CARD GRID */
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 sm:gap-3">
          {paginatedCards.map((uc) => {
            const storedIn = locations.find(l => l.id === uc.storage_location_id);
            const isCardSelected = selectedCardIds.includes(uc.id);

            return (
              <div 
                key={uc.id}
                onClick={() => {
                  if (isSelectMode) {
                    onToggleSelectCard?.(uc.id);
                  } else {
                    setSelectedCardForDetail(uc);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (isSelectMode) {
                    onToggleSelectCard?.(uc.id);
                  } else if (onCardContextMenu) {
                    onCardContextMenu(uc);
                  }
                }}
                className={`bg-white dark:bg-zinc-900 rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-200 relative group shadow-xs cursor-pointer ${
                  isCardSelected
                    ? 'border-2 border-red-500 bg-red-50/40 dark:bg-red-950/20 ring-2 ring-red-500/50'
                    : 'border border-zinc-200 dark:border-zinc-800 hover:border-red-500/50'
                }`}
              >
                <div className="relative">
                  {/* High Performance CardImage with Skeleton */}
                  <div 
                    className={`aspect-[3/4.4] w-full rounded-xl overflow-hidden shadow-xs mb-1.5 group-hover:scale-102 transition-transform relative ${
                      uc.sleeve_type && uc.sleeve_type !== 'none' && uc.sleeve_color ? '' : 'border border-zinc-200 dark:border-zinc-800'
                    }`}
                    style={
                      uc.sleeve_type && uc.sleeve_type !== 'none' && uc.sleeve_color
                        ? { borderColor: getSleeveColorHex(uc.sleeve_color), borderWidth: '2px', borderStyle: 'solid' }
                        : undefined
                    }
                  >
                    <CardImage
                      src={uc.card_details?.image_url_small || uc.card_details?.image_url}
                      alt={uc.card_details?.name || 'Yugioh Card'}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Checkbox de selección múltiple o Alerta de Duplicados */}
                  {isSelectMode ? (
                    <div 
                      className={`absolute top-1 left-1 w-5 h-5 rounded-md flex items-center justify-center transition-all shadow-md z-10 ${
                        isCardSelected
                          ? 'bg-red-600 text-white ring-1 ring-white/40'
                          : 'bg-black/60 border border-white/50 text-transparent hover:border-white'
                      }`}
                    >
                      {isCardSelected && <Check className="w-3.5 h-3.5 stroke-3" />}
                    </div>
                  ) : (
                    <div className="absolute top-1 left-1 flex items-center gap-1 z-10">
                      {/* Alerta de Coincidencias en otros contenedores */}
                      {duplicateMap?.has(uc.card_id) && (
                        <DuplicateCardAlertPopover
                          matchInfo={duplicateMap.get(uc.card_id)}
                          onOpenConsolidate={onOpenSplitModal ? () => onOpenSplitModal(uc) : undefined}
                          size="sm"
                        />
                      )}

                      {/* Badge de Proxy */}
                      {uc.is_proxy && (
                        <span className="bg-red-600 text-white font-black text-[8px] px-1 py-0.2 rounded font-mono uppercase shadow-xs">
                          PROXY
                        </span>
                      )}
                    </div>
                  )}

                  {uc.quantity > 1 && (
                    <span className="absolute top-1 right-1 bg-zinc-950/90 text-white font-black text-[9px] px-1.5 py-0.2 rounded-md shadow-xs font-mono border border-zinc-800">
                      x{uc.quantity}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(uc);
                    }}
                    className={`absolute bottom-2.5 right-1 p-1 rounded-full transition-all cursor-pointer bg-white/90 dark:bg-zinc-900/90 shadow-xs ${
                      uc.is_favorite
                        ? 'text-red-500 opacity-100'
                        : 'text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-red-500'
                    }`}
                    title={uc.is_favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${uc.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                </div>

                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h4 className="font-black text-[11px] text-zinc-900 dark:text-zinc-100 truncate group-hover:text-red-500 transition-colors leading-tight" title={uc.card_details?.name}>
                      {uc.card_details?.name || 'Cargando...'}
                    </h4>
                    
                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                      <span className="text-[8.5px] px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold truncate max-w-16">
                        {uc.rarity || 'Common'}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[8.5px] font-mono font-bold text-zinc-500">
                        <span>{getLanguageDisplay(uc.language).flag}</span>
                      </span>
                    </div>
                  </div>

                  {/* Barra inferior de Categoría */}
                  <div 
                    className={`w-full h-1 mt-1.5 rounded-full overflow-hidden shadow-2xs ${getCategoryBadgeStyle(uc.status_flag).barColorClass}`}
                    title={`Estado: ${getCategoryBadgeStyle(uc.status_flag).label}`}
                  />

                  <div className="mt-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-zinc-400 font-bold">Ubicación:</span>
                      {storedIn ? (
                        <span className="font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-20" title={storedIn.name}>
                          📦 {storedIn.name}
                        </span>
                      ) : (
                        <span className="font-bold text-amber-500 dark:text-amber-400">
                          📥 Inbox
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-zinc-400 font-bold">Destino:</span>
                      <PremiumDropdown
                        value={uc.status_flag}
                        onChange={(val) => handleUpdateCardStatus(uc.id, val)}
                        size="xs"
                        menuWidth="min-w-28"
                        options={[
                          { value: 'collection', label: 'Colección' },
                          { value: 'trade_sale', label: 'Venta' },
                          { value: 'workshop', label: 'Taller' },
                          { value: 'bulk', label: 'Bulk' },
                        ]}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-1 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {uc.quantity > 1 && onOpenSplitModal && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSplitModal(uc);
                          }}
                          className="p-1 hover:bg-purple-100 dark:hover:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg transition-colors cursor-pointer"
                          title="Hacer copia individual (Separar)"
                        >
                          <Scissors className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCard(uc.id);
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-950/40 text-zinc-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar carta"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BOTTOM PAGINATION CONTROLS */}
      {!loadingAllCards && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <span className="text-xs font-mono text-zinc-500">
            Página <strong className="text-zinc-900 dark:text-zinc-100">{currentPage}</strong> de <strong className="text-zinc-900 dark:text-zinc-100">{totalPages}</strong> ({totalCards.toLocaleString()} cartas totales)
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Primera Página"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Página Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 mx-1">
              {getPageNumbers().map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`bottom-ellipsis-${idx}`} className="px-1 text-xs text-zinc-400 font-mono">
                      ...
                    </span>
                  );
                }
                const pageNum = Number(p);
                const isCurrent = pageNum === currentPage;
                return (
                  <button
                    key={`bottom-page-${pageNum}`}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`min-w-8 h-8 px-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Página Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Última Página"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLES Y GESTIÓN COMPLETA DE LA CARTA */}
      <CollectionCardDetailModal
        isOpen={Boolean(selectedCardForDetail)}
        onClose={() => setSelectedCardForDetail(null)}
        userCard={selectedCardForDetail}
        locations={locations}
        decks={decks}
        onToggleFavorite={async (uc) => {
          await handleToggleFavorite(uc);
          setSelectedCardForDetail(prev => prev ? { ...prev, is_favorite: !prev.is_favorite } : null);
        }}
        onUpdateStatus={async (id, status) => {
          await handleUpdateCardStatus(id, status);
          setSelectedCardForDetail(prev => prev ? { ...prev, status_flag: status as CardStatusFlag } : null);
        }}
        onMoveLocation={async (id, newLocId) => {
          if (onMoveCard) {
            await onMoveCard(id, newLocId);
          } else {
            await fetch('/api/collection/cards', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, storage_location_id: newLocId }),
            });
            handleUpdateCardStatus(id, selectedCardForDetail?.status_flag || 'collection');
          }
          setSelectedCardForDetail(prev => prev ? { ...prev, storage_location_id: newLocId } : null);
        }}
        onDelete={async (id) => {
          await handleDeleteCard(id);
          setSelectedCardForDetail(null);
        }}
        onOpenSplitModal={(uc) => {
          setSelectedCardForDetail(null);
          onOpenSplitModal?.(uc);
        }}
        onOpenContainer={(loc) => {
          setSelectedCardForDetail(null);
          onOpenContainer?.(loc);
        }}
        duplicateInfo={selectedCardForDetail ? duplicateMap?.get(selectedCardForDetail.card_id) : undefined}
      />
    </div>
  );
};
