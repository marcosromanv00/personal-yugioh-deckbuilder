import React, { useState } from 'react';
import { Search, Heart, LayoutGrid, List, X, Loader2, ChevronDown, Sparkles, FileText, Upload, Check, AlertCircle } from 'lucide-react';
import { CardFilters, FilterState } from '../CardFilters';
import { Card, HoverCardBase } from '../types';
import { sanitizeBulkInput } from '@/lib/bulkSanitizer';

export interface ParsedBulkItem {
  id: string;
  card_id: number;
  name: string;
  type: string;
  image_url: string;
  image_url_small?: string;
  quantity: number;
  selected: boolean;
  section: 'main' | 'extra' | 'side' | 'extras';
}

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
  format?: 'Master Duel' | 'TCG' | 'Duel Links';
  userInventoryCounts?: Record<number, number>;

  addCardToDeck: (card: Card, section?: 'main' | 'extra' | 'side' | 'extras') => void;
  openPreviewForCard?: (card: HoverCardBase) => void;
  handleDragCardStart: (e: React.DragEvent, cardData: Card) => void;
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
  handleDragCardStart: (e: React.DragEvent, cardData: Card) => void;
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
  userInventoryCounts = {},
  addCardToDeck,
  handleDragCardStart,
  handleCardMouseEnter,
  handleCardMouseLeave,
}) => {


  const [activeTab, setActiveTab] = useState<'search' | 'bulk'>('search');
  // Sub-mode for bulk tab: ydk = file/.ydk/names, ids = raw numeric IDs
  const [bulkMode, setBulkMode] = useState<'ydk' | 'ids'>('ydk');
  const [bulkText, setBulkText] = useState('');
  const [analyzingBulk, setAnalyzingBulk] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');
  const [bulkErrorMsg, setBulkErrorMsg] = useState('');
  const [unmatchedBulkCards, setUnmatchedBulkCards] = useState<string[]>([]);
  const [parsedBulkItems, setParsedBulkItems] = useState<ParsedBulkItem[]>([]);
  const [fileName, setFileName] = useState('');


  const [localQuery, setLocalQuery] = React.useState(searchQuery);
  const [prevSearchQuery, setPrevSearchQuery] = React.useState(searchQuery);

  if (searchQuery !== prevSearchQuery) {
    setPrevSearchQuery(searchQuery);
    setLocalQuery(searchQuery);
  }


  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== searchQuery) {
        setSearchQuery(localQuery);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [localQuery, searchQuery, setSearchQuery]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const raw = (event.target?.result as string) || '';
      setBulkText(sanitizeBulkInput(raw, bulkMode === 'ids'));
    };
    reader.readAsText(file);
  };

  const handleProcessBulkText = async () => {
    const cleanedText = sanitizeBulkInput(bulkText, bulkMode === 'ids');
    setBulkText(cleanedText);

    if (!cleanedText.trim()) return;

    setAnalyzingBulk(true);
    setBulkErrorMsg('');
    setBulkSuccessMsg('');
    setUnmatchedBulkCards([]);
    setParsedBulkItems([]);

    try {
      const res = await fetch('/api/collection/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanedText }),
      });

      if (res.ok) {
        const json = await res.json();
        const parsed = json.parsed || [];
        const unmatched = json.unmatched || [];
        setUnmatchedBulkCards(unmatched);

        if (parsed.length === 0) {
          setBulkErrorMsg('No se pudo reconocer ninguna carta en el texto proporcionado.');
          return;
        }

        const items: ParsedBulkItem[] = parsed.map((item: { card_id: number; name: string; type?: string; section?: string; image_url?: string; image_url_small?: string; quantity?: number }, idx: number) => {
          const type = (item.type || '').toLowerCase();
          const isExtra = type.includes('fusion') || type.includes('synchro') || type.includes('xyz') || type.includes('link');
          const section = (item.section && item.section !== 'main') 
            ? (item.section as 'main' | 'extra' | 'side' | 'extras') 
            : (isExtra ? 'extra' : 'main');

          return {
            id: `bulk-${item.card_id}-${idx}`,
            card_id: item.card_id,
            name: item.name,
            type: item.type || 'Monster',
            image_url: item.image_url || item.image_url_small || `https://images.ygoprodeck.com/images/cards/${item.card_id}.jpg`,
            image_url_small: item.image_url_small || item.image_url,
            quantity: Math.min(3, Math.max(1, item.quantity || 1)),
            selected: true,
            section,
          };
        });

        setParsedBulkItems(items);
        setBulkSuccessMsg(`Se encontraron ${items.length} tipos de cartas en el lote.`);
      } else {
        const errJson = await res.json();
        setBulkErrorMsg(errJson.error || 'Error al analizar el lote.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setBulkErrorMsg(error.message || 'Error procesando texto bulk.');
    } finally {
      setAnalyzingBulk(false);
    }
  };


  const toggleBulkItem = (id: string) => {
    setParsedBulkItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const updateBulkItemQty = (id: string, delta: number) => {
    setParsedBulkItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.min(3, Math.max(1, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const selectAllBulkItems = (val: boolean) => {
    setParsedBulkItems(prev => prev.map(item => ({ ...item, selected: val })));
  };

  const confirmAddParsedBulkToDeck = () => {
    const selectedItems = parsedBulkItems.filter(i => i.selected);
    if (selectedItems.length === 0) return;

    let addedTotalCount = 0;
    selectedItems.forEach(item => {
      const cardObj: Card = {
        id: item.card_id,
        name: item.name,
        type: item.type,
        image_url: item.image_url,
        image_url_small: item.image_url_small
      };

      for (let q = 0; q < item.quantity; q++) {
        addCardToDeck(cardObj, item.section);
        addedTotalCount++;
      }
    });

    setBulkSuccessMsg(`¡Éxito! Se agregaron ${addedTotalCount} cartas seleccionadas al editor de baraja.`);
    setParsedBulkItems([]);
    setBulkText('');
    setFileName('');
  };



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
          {/* Main Search Panel Mode Switcher: Single Card Search vs Bulk Import */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={`py-1.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>BUSCAR CARTA</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bulk')}
              className={`py-1.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'bulk'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>IMPORTAR BULK</span>
            </button>
          </div>

          {activeTab === 'bulk' ? (
            <div className="space-y-3 p-1">

              {/* Sub-switch: .ydk/Nombre vs IDs */}
              <div className="grid grid-cols-2 gap-0.5 p-0.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => { setBulkMode('ydk'); setBulkText(''); setFileName(''); setParsedBulkItems([]); setBulkSuccessMsg(''); setBulkErrorMsg(''); }}
                  className={`py-1 px-2 rounded-md text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    bulkMode === 'ydk'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>.YDK / Nombre</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setBulkMode('ids'); setBulkText(''); setFileName(''); setParsedBulkItems([]); setBulkSuccessMsg(''); setBulkErrorMsg(''); }}
                  className={`py-1 px-2 rounded-md text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    bulkMode === 'ids'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <span>#</span>
                  <span>IDs Numéricos</span>
                </button>
              </div>

              {bulkMode === 'ydk' && (
                <div className="border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-red-500 rounded-xl p-3 text-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
                  <input
                    type="file"
                    accept=".ydk,.txt"
                    onChange={handleFileUpload}
                    id="search-bulk-file-input"
                    className="hidden"
                  />
                  <label htmlFor="search-bulk-file-input" className="cursor-pointer flex flex-col items-center justify-center">
                    <Upload className="w-5 h-5 text-red-600 dark:text-red-500 mb-1" />
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {fileName ? fileName : 'Subir archivo .ydk o .txt'}
                    </span>
                    <span className="text-[10px] text-zinc-400">Archivos YDK o texto con IDs/nombres</span>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">
                  {bulkMode === 'ids' ? 'Pega IDs numéricos (uno por línea):' : 'O pega lista de nombres, IDs o formato YDK:'}
                </label>
                <textarea
                  rows={5}
                  inputMode={bulkMode === 'ids' ? 'numeric' : 'text'}
                  placeholder={
                    bulkMode === 'ids'
                      ? '89631139\n46986414\n24094653\n14558127'
                      : 'Ejemplos:\n3x Ash Blossom & Joyous Spring\n2x Infinite Impermanence\n#main\n46986414'
                  }
                  value={bulkText}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const sanitized = bulkMode === 'ids' ? sanitizeBulkInput(raw, true) : raw;
                    setBulkText(sanitized);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none focus:border-red-500"
                />
              </div>

              {bulkErrorMsg && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{bulkErrorMsg}</span>
                </div>
              )}

              {bulkSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{bulkSuccessMsg}</span>
                </div>
              )}

              {unmatchedBulkCards.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
                  <strong className="block font-bold">No reconocidas ({unmatchedBulkCards.length}):</strong>
                  <span className="text-[11px] font-mono">{unmatchedBulkCards.slice(0, 5).join(', ')}{unmatchedBulkCards.length > 5 ? '...' : ''}</span>
                </div>
              )}

              {parsedBulkItems.length > 0 ? (
                <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[11px] font-black uppercase text-zinc-800 dark:text-zinc-200">
                      Total a agregar: <b className="text-red-600 dark:text-red-400 font-mono text-xs">{parsedBulkItems.filter(i => i.selected).reduce((acc, i) => acc + i.quantity, 0)} cartas</b>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => selectAllBulkItems(true)}
                        className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        Todas
                      </button>
                      <button
                        type="button"
                        onClick={() => selectAllBulkItems(false)}
                        className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        Ninguna
                      </button>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {parsedBulkItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleBulkItem(item.id)}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                          item.selected
                            ? 'bg-zinc-50 dark:bg-zinc-950/80 border-red-500/50 dark:border-red-500/40 shadow-xs'
                            : 'bg-zinc-100/50 dark:bg-zinc-950/30 border-zinc-200 dark:border-zinc-800 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleBulkItem(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-zinc-300 text-red-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer shrink-0"
                        />
                        <img
                          src={item.image_url_small || item.image_url}
                          alt={item.name}
                          className="w-7 h-10 object-cover rounded shadow-xs shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {item.name}
                          </p>
                          <span className={`inline-block px-1.5 py-0.2 text-[8.5px] font-black uppercase rounded tracking-wider mt-0.5 ${
                            item.section === 'extra' 
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800' 
                              : item.section === 'side'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}>
                            {item.section}
                          </span>
                        </div>

                        {/* Columna de comparación directa En Colección vs A Agregar */}
                        <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col items-end text-right">
                            <span className="text-[8px] font-black uppercase text-zinc-400 font-mono tracking-wider">
                              En Colección
                            </span>
                            <span className={`text-[10.5px] font-mono font-black px-1.5 py-0.5 rounded-md border ${
                              (userInventoryCounts[item.card_id] || 0) > 0
                                ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/80'
                                : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-400 border-zinc-200 dark:border-zinc-800'
                            }`}>
                              📦 {userInventoryCounts[item.card_id] || 0}
                            </span>
                          </div>

                          <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black uppercase text-zinc-400 font-mono tracking-wider">
                              A Agregar
                            </span>
                            <div className="flex items-center gap-1 bg-zinc-200 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-300 dark:border-zinc-800">
                              <button
                                type="button"
                                onClick={() => updateBulkItemQty(item.id, -1)}
                                disabled={item.quantity <= 1}
                                className="w-4 h-4 rounded flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-30 text-zinc-900 dark:text-zinc-100 font-bold text-xs cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-xs font-mono font-black text-zinc-900 dark:text-zinc-100 px-1">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateBulkItemQty(item.id, 1)}
                                disabled={item.quantity >= 3}
                                className="w-4 h-4 rounded flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-30 text-zinc-900 dark:text-zinc-100 font-bold text-xs cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                  </div>

                  <button
                    type="button"
                    onClick={confirmAddParsedBulkToDeck}
                    disabled={parsedBulkItems.filter(i => i.selected).length === 0}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-600/25 flex items-center justify-center gap-2 cursor-pointer font-display"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirmar y Agregar ({parsedBulkItems.filter(i => i.selected).reduce((acc, i) => acc + i.quantity, 0)} Cartas)</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleProcessBulkText}
                  disabled={analyzingBulk || !bulkText.trim()}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-600/25 flex items-center justify-center gap-2 cursor-pointer font-display"
                >
                  {analyzingBulk ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analizando Lote...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analizar Lote de Cartas</span>
                    </>
                  )}
                </button>
              )}
            </div>

          ) : (
            <>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                inputMode={/^\d+$/.test(localQuery.trim()) && localQuery.trim().length > 0 ? 'numeric' : 'search'}
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
          )}
        </>
      ) : (

        <div className="flex-1 flex items-center justify-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest" style={{ writingMode: 'vertical-rl' }}>Búsqueda</span>
        </div>
      )}
    </section>
  );
};
