'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft, 
  Trash2, 
  MinusCircle, 
  BookOpen, 
  Shield, 
  Sparkles,
  Info
} from 'lucide-react';
import Link from 'next/link';

// Componentes y Hooks
import { SearchPanel } from '../deckbuilder/components/SearchPanel';
import { useBinderBuilderState } from './hooks/useBinderBuilderState';
import { UserCard } from '@/types/collection';
import { Card } from '../deckbuilder/types';
import { getSleeveColorHex } from '@/lib/sleeves';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';
import { getCategoryBadgeStyle } from '@/lib/collectionUtils';


interface PageGridProps {
  pageNumber: number;
  pageCards: UserCard[];
  cols: number;
  rows: number;
  pocketsPerPage: number;
  selectedSearchCard: Card | null;
  onPocketClick: (page: number, slot: number, existingCard: UserCard | undefined) => void;
  onDrop: (e: React.DragEvent, page: number, slot: number) => void;
}

const PageGrid = React.memo(({
  pageNumber,
  pageCards,
  cols,
  rows,
  pocketsPerPage,
  selectedSearchCard,
  onPocketClick,
  onDrop
}: PageGridProps) => {
  const isTargetedForPlace = selectedSearchCard !== null;

  return (
    <div 
      className="grid gap-1.5 sm:gap-2 p-3 bg-slate-900/50 rounded-xl border border-slate-800/80 shadow-inner relative w-full max-w-[100%] h-full max-h-[68vh] md:max-h-[72vh] aspect-3/4 overflow-visible"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {/* Marcador de página */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
        Página {pageNumber}
      </div>

      {Array.from({ length: pocketsPerPage }).map((_, idx) => {
        const slotNumber = idx + 1;
        const cardsInSlot = pageCards.filter(c => c.binder_slot === slotNumber);
        const hasCards = cardsInSlot.length > 0;

        return (
          <div
            key={slotNumber}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, pageNumber, slotNumber)}
            onClick={() => onPocketClick(pageNumber, slotNumber, undefined)}
            className={`relative aspect-3/4 rounded-lg border flex flex-col items-center justify-center p-0.5 group transition-all duration-300 overflow-visible ${
              hasCards 
                ? 'bg-slate-900 border-slate-700/80 cursor-pointer shadow-md' 
                : isTargetedForPlace
                  ? 'bg-purple-950/20 border-dashed border-purple-500/50 hover:bg-purple-950/40 cursor-pointer animate-pulse'
                  : 'bg-slate-950/40 border-dashed border-slate-850'
            }`}
          >
            {hasCards ? (
              cardsInSlot.map((uc, index) => {
                const offsetTop = index * 16;
                return (
                  <div
                    key={uc.id}
                    style={{
                      position: 'absolute',
                      top: `${offsetTop}px`,
                      left: '2px',
                      right: '2px',
                      bottom: `${-offsetTop}px`,
                      zIndex: 10 + index,
                      borderColor: uc.sleeve_type && uc.sleeve_type !== 'none' && uc.sleeve_color ? getSleeveColorHex(uc.sleeve_color) : undefined,
                      borderWidth: uc.sleeve_type && uc.sleeve_type !== 'none' && uc.sleeve_color ? '2.5px' : undefined,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPocketClick(pageNumber, slotNumber, uc);
                    }}
                    className={`rounded-md hover:border-purple-500 hover:scale-[1.02] shadow-lg group/card transition-all duration-205 cursor-pointer overflow-hidden aspect-3/4 bg-slate-900 ${
                      uc.sleeve_type && uc.sleeve_type !== 'none' && uc.sleeve_color ? 'border' : 'border border-slate-800/80'
                    }`}
                  >
                    {uc.card_details && (
                      <>
                        <img
                          src={uc.card_details.image_url_small || uc.card_details.image_url}
                          alt={uc.card_details.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {uc.is_proxy && (
                          <div className="absolute top-1 left-1 bg-red-600/90 text-white font-mono text-[8px] px-1 py-0.5 rounded border border-red-500 font-bold uppercase tracking-wider shadow z-30">
                            Proxy
                          </div>
                        )}
                        <div className="absolute top-1 right-1 bg-slate-950/90 text-purple-300 font-mono text-[9px] px-1 py-0.25 rounded border border-purple-500/30 z-30 font-bold">
                          {uc.quantity}x
                        </div>
                        
                        {uc.sleeve_type && uc.sleeve_type !== 'none' && (
                          <div className="absolute bottom-1 right-1 z-30">
                            <Shield className="w-3.5 h-3.5 text-cyan-400 fill-cyan-500/20" />
                          </div>
                        )}

                        {/* Barra inferior de Categoría */}
                        <div 
                          className={`absolute bottom-0.5 left-1 right-1 h-1 rounded-full overflow-hidden shadow-2xs z-30 ${getCategoryBadgeStyle(uc.status_flag).barColorClass}`}
                          title={`Estado: ${getCategoryBadgeStyle(uc.status_flag).label}`}
                        />
                      </>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center gap-1 text-slate-700 group-hover:text-slate-500 transition-colors">
                <span className="text-[10px] font-mono select-none">
                  {isTargetedForPlace ? 'Colocar' : 'Vacío'}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

PageGrid.displayName = 'PageGrid';

const noop = () => {};

interface BinderBuilderProps {
  binderId: string;
  onClose?: () => void;
}

export default function BinderBuilder({ binderId, onClose }: BinderBuilderProps) {
  const state = useBinderBuilderState(binderId);
  const {
    binder,
    cards,
    loading,
    currentViewIndex,
    setCurrentViewIndex,
    
    // Buscador
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    searchScope,
    setSearchScope,
    onlyFavorites,
    setOnlyFavorites,
    searchResults,
    isSearching,
    searchViewMode,
    setSearchViewMode,
    searchLimit,
    setSearchLimit,
    advancedFilters,
    setAdvancedFilters,

    // Click to place
    selectedSearchCard,
    setSelectedSearchCard,

    // Lógica Binder
    addCardToSlot,
    removeCardFromSlot,
    moveCardToInbox,
    deleteCardFromCollection,
    updateCardInSlot,
  } = state;

  const [activeCardDetails, setActiveCardDetails] = useState<UserCard | null>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [leftPanelWidth] = useState(380);

  const stagedCardsCount = cards.filter(c => !c.binder_page || !c.binder_slot).length;

  // Estados responsivos para móviles
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [activeTabMobile, setActiveTabMobile] = useState<'binder' | 'search'>('binder');
  const [activePageMobile, setActivePageMobile] = useState(1);

  useEffect(() => {
    const checkMobile = () => setIsMobileScreen(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sincronizar navegación móvil y desktop
  useEffect(() => {
    if (isMobileScreen) {
      setCurrentViewIndex(Math.floor(activePageMobile / 2));
    }
  }, [activePageMobile, isMobileScreen, setCurrentViewIndex]);

  useEffect(() => {
    if (!isMobileScreen) {
      setActivePageMobile(currentViewIndex * 2 || 1);
    }
  }, [currentViewIndex, isMobileScreen]);

  const rows = binder?.grid_layout?.rows || 3;
  const cols = binder?.grid_layout?.cols || 3;
  const pocketsPerPage = rows * cols;
  const totalPages = binder?.grid_layout?.total_pages || 40;
  const totalViews = Math.ceil(totalPages / 2);

  // Páginas visibles en la vista actual (viewIndex)
  const leftPageNumber = currentViewIndex === 0 ? null : currentViewIndex * 2;
  const rightPageNumber = currentViewIndex * 2 + 1 <= totalPages ? currentViewIndex * 2 + 1 : null;

  // Filtrar cartas para cada página
  const leftPageCards = useMemo(() => {
    if (!leftPageNumber) return [];
    return cards.filter(c => c.binder_page === leftPageNumber);
  }, [cards, leftPageNumber]);

  const rightPageCards = useMemo(() => {
    if (!rightPageNumber) return [];
    return cards.filter(c => c.binder_page === rightPageNumber);
  }, [cards, rightPageNumber]);

  const activePageCards = useMemo(() => {
    if (!activePageMobile) return [];
    return cards.filter(c => c.binder_page === activePageMobile);
  }, [cards, activePageMobile]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, page: number, slot: number) => {
    e.preventDefault();
    const jsonStr = e.dataTransfer.getData('application/json');
    if (jsonStr) {
      try {
        const cardObj = JSON.parse(jsonStr);
        if (cardObj && cardObj.id) {
          await addCardToSlot(cardObj, page, slot);
        }
      } catch (err) {
        console.error('Error al soltar carta en la binder:', err);
      }
    }
  }, [addCardToSlot]);

  // Click on a pocket
  const handlePocketClick = useCallback(async (page: number, slot: number, existingCard: UserCard | undefined) => {
    if (selectedSearchCard) {
      // Click-to-place activo -> colocar carta
      await addCardToSlot(selectedSearchCard, page, slot);
      setSelectedSearchCard(null);
    } else if (existingCard) {
      // Seleccionar carta para ver detalles / acciones
      setActiveCardDetails(existingCard);
    }
  }, [selectedSearchCard, addCardToSlot, setSelectedSearchCard, setActiveCardDetails]);

  const handleDragCardStart = useCallback((
    e: React.DragEvent,
    cardData: {
      id: number;
      name: string;
      type?: string;
      image_url?: string;
      archetype?: string;
    }
  ) => {
    const payload = JSON.stringify({
      id: cardData.id,
      name: cardData.name,
      type: cardData.type || 'Monster',
      image_url: cardData.image_url || '',
      archetype: cardData.archetype,
    });
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.setData('text/plain', String(cardData.id));
  }, []);

  const addCardToDeck = useCallback((card: Card) => {
    setSelectedSearchCard(card);
  }, [setSelectedSearchCard]);

  // Rarity styling helpers
  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'ultra rare':
      case 'secret rare':
      case 'starlight rare':
        return 'text-amber-400 border-amber-500/30 bg-amber-950/10';
      case 'super rare':
        return 'text-purple-400 border-purple-500/30 bg-purple-950/10';
      case 'rare':
        return 'text-cyan-400 border-cyan-500/30 bg-cyan-950/10';
      default:
        return 'text-slate-300 border-slate-800 bg-slate-900/40';
    }
  };

  if (loading || !binder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[hsl(224,25%,6%)] text-slate-200">
        <Sparkles className="w-10 h-10 text-purple-400 animate-spin mb-4" />
        <p className="font-mono text-sm">Abriendo la binder...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[hsl(224,25%,6%)] text-slate-100 font-sans antialiased overflow-hidden">
      
      {/* HEADER */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md py-4 px-6 flex items-center justify-between gap-4 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full animate-pulse shadow-md"
              style={{ backgroundColor: binder.color_code || '#8b5cf6' }}
            />
            <div>
              <h1 className="text-md font-bold text-slate-100 flex items-center gap-2">
                {binder.name}
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  Binder {rows}x{cols}
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono hidden sm:block">
                {cards.length} cartas ubicadas • Capacidad: {binder.capacity} slots
              </p>
            </div>
          </div>
        </div>

        {/* Portada / Paginación general */}
        <div className="flex items-center gap-3 bg-slate-950/60 px-4 py-1.5 rounded-xl border border-slate-850 font-mono text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          <span>{isMobileScreen ? `Pág ${activePageMobile} de ${totalPages}` : `Vista ${currentViewIndex} de ${totalViews}`}</span>
        </div>
      </header>

      {/* Selector de pestañas móvil */}
      <div className="flex md:hidden bg-slate-950/80 p-1 rounded-xl border border-slate-850/65 m-4 mb-2 shrink-0">
        <button
          onClick={() => setActiveTabMobile('binder')}
          className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTabMobile === 'binder' 
              ? 'bg-purple-600 text-white shadow-md shadow-purple-900/20' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📘 Carpeta
        </button>
        <button
          onClick={() => setActiveTabMobile('search')}
          className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTabMobile === 'search' 
              ? 'bg-purple-600 text-white shadow-md shadow-purple-900/20' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🔍 Buscador
        </button>
      </div>

      {/* CUERPO PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* PANEL DE BÚSQUEDA */}
        <div className={`${activeTabMobile === 'search' ? 'flex w-full h-full' : 'hidden'} md:flex md:w-auto h-full shrink-0 z-20`}>
          <SearchPanel
            leftPanelOpen={leftPanelOpen}
            setLeftPanelOpen={setLeftPanelOpen}
            leftPanelWidth={leftPanelWidth}
            isMobile={isMobileScreen}
            showStagedTab={true}
            stagedCardsCount={stagedCardsCount}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchScope={searchScope}
            setSearchScope={setSearchScope}
            onlyFavorites={onlyFavorites}
            setOnlyFavorites={setOnlyFavorites}
            searchType={searchType}
            setSearchType={setSearchType}
            advancedFilters={advancedFilters}
            setAdvancedFilters={setAdvancedFilters}
            searchResults={searchResults}
            isSearching={isSearching}
            searchViewMode={searchViewMode}
            setSearchViewMode={setSearchViewMode}
            searchLimit={searchLimit}
            setSearchLimit={setSearchLimit}
            format="Master Duel"
            addCardToDeck={addCardToDeck}
            handleDragCardStart={handleDragCardStart}
            handleCardMouseEnter={noop}
            handleCardMouseLeave={noop}
          />
        </div>

        {/* REPRESENTACIÓN DE LA BINDER (DERECHA / CENTRO) */}
        <main className={`${activeTabMobile === 'binder' ? 'flex' : 'hidden'} md:flex flex-1 h-full flex flex-col justify-between p-4 md:p-6 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/30 via-slate-950 to-slate-950 relative`}>
          
          {/* BANNER AVISO CLICK TO PLACE */}
          <AnimatePresence>
            {selectedSearchCard && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-lg mx-auto bg-purple-950/80 border border-purple-500/40 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs text-purple-200 shadow-lg shadow-purple-950/50 backdrop-blur-md mb-4"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span>
                    Haciendo Click-to-Place para <strong>{selectedSearchCard.name}</strong>. Haz click en una casilla de la binder para ubicarla.
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSearchCard(null)}
                  className="px-2 py-1 rounded bg-purple-900 hover:bg-purple-800 text-purple-100 font-semibold"
                >
                  Cancelar
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* VISTA DEL LIBRO (ADAPTATIVA: UNA PÁGINA EN MÓVIL, LIBRO ABIERTO EN DESKTOP) */}
          <div className="flex-1 flex items-center justify-center py-2 h-full overflow-hidden">
            {isMobileScreen ? (
              // Vista móvil: una página individual grande
              <div className="w-full h-full flex items-center justify-center p-1 overflow-visible">
                <PageGrid
                  pageNumber={activePageMobile}
                  pageCards={activePageCards}
                  cols={cols}
                  rows={rows}
                  pocketsPerPage={pocketsPerPage}
                  selectedSearchCard={selectedSearchCard}
                  onPocketClick={handlePocketClick}
                  onDrop={handleDrop}
                />
              </div>
            ) : (
              // Vista desktop: libro abierto con lomo central
              <div className="relative w-full h-full max-h-[76vh] flex gap-1 bg-slate-950 p-6 rounded-3xl border-4 border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.85)] items-center justify-center overflow-visible">
                {/* Lomo central de la carpeta */}
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 border-x border-slate-950/80 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] z-10" />

                {/* LADO IZQUIERDO */}
                <div className="flex-1 pr-3 flex items-center justify-center overflow-visible">
                  {currentViewIndex === 0 ? (
                    // Portada Interior del Binder
                    <div 
                      className="w-full max-w-[100%] h-full max-h-[68vh] md:max-h-[72vh] aspect-3/4 rounded-2xl flex flex-col items-center justify-center p-6 border shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]"
                      style={{
                        backgroundColor: `${binder.color_code}15`,
                        borderColor: `${binder.color_code}30`
                      }}
                    >
                      <BookOpen 
                        className="w-16 h-16 mb-4 animate-pulse" 
                        style={{ color: binder.color_code || '#8b5cf6' }}
                      />
                      <h3 className="text-lg font-black text-slate-200 tracking-wide text-center uppercase">
                        {binder.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-2 text-center">
                        PORTADA INTERIOR
                      </p>
                      {binder.description && (
                        <p className="text-xs text-slate-400 mt-4 text-center max-w-[200px] italic">
                          "{binder.description}"
                        </p>
                      )}
                    </div>
                  ) : (
                    // Página de la binder
                    leftPageNumber && (
                      <PageGrid
                        pageNumber={leftPageNumber}
                        pageCards={leftPageCards}
                        cols={cols}
                        rows={rows}
                        pocketsPerPage={pocketsPerPage}
                        selectedSearchCard={selectedSearchCard}
                        onPocketClick={handlePocketClick}
                        onDrop={handleDrop}
                      />
                    )
                  )}
                </div>

                {/* LADO DERECHO */}
                <div className="flex-1 pl-3 flex items-center justify-center overflow-visible">
                  {rightPageNumber ? (
                    // Página de la binder
                    <PageGrid
                      pageNumber={rightPageNumber}
                      pageCards={rightPageCards}
                      cols={cols}
                      rows={rows}
                      pocketsPerPage={pocketsPerPage}
                      selectedSearchCard={selectedSearchCard}
                      onPocketClick={handlePocketClick}
                      onDrop={handleDrop}
                    />
                  ) : (
                    // Contraportada
                    <div 
                      className="w-full max-w-[100%] h-full max-h-[68vh] md:max-h-[72vh] aspect-3/4 rounded-2xl flex flex-col items-center justify-center p-6 border shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]"
                      style={{
                        backgroundColor: `${binder.color_code}15`,
                        borderColor: `${binder.color_code}30`
                      }}
                    >
                      <BookOpen 
                        className="w-16 h-16 mb-4 opacity-30" 
                        style={{ color: binder.color_code || '#8b5cf6' }}
                      />
                      <h3 className="text-lg font-black text-slate-500 tracking-wide text-center uppercase">
                        Fin de la Binder
                      </h3>
                      <p className="text-xs text-slate-650 font-mono mt-2 text-center">
                        CONTRAPORTADA INTERIOR
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CONTROLES DE NAVEGACIÓN */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              disabled={isMobileScreen ? activePageMobile <= 1 : currentViewIndex <= 0}
              onClick={() => {
                if (isMobileScreen) {
                  setActivePageMobile(p => Math.max(1, p - 1));
                } else {
                  setCurrentViewIndex(v => v - 1);
                }
              }}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:hover:border-slate-800 disabled:hover:bg-slate-900 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
            
            <button
              disabled={isMobileScreen ? activePageMobile >= totalPages : currentViewIndex >= totalViews}
              onClick={() => {
                if (isMobileScreen) {
                  setActivePageMobile(p => Math.min(totalPages, p + 1));
                } else {
                  setCurrentViewIndex(v => v + 1);
                }
              }}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:hover:border-slate-800 disabled:hover:bg-slate-900 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>

      {/* ACCIONES DE CARTA SELECCIONADA (DIÁLOGO FLOTANTE/MODAL) */}
      <AnimatePresence>
        {activeCardDetails && activeCardDetails.card_details && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden"
            >
              {/* Círculo decorativo de fondo */}
              <div 
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10 filter blur-2xl"
                style={{ backgroundColor: binder.color_code }}
              />

              <div className="flex items-start gap-4">
                <img
                  src={activeCardDetails.card_details.image_url_small || activeCardDetails.card_details.image_url}
                  alt={activeCardDetails.card_details.name}
                  className="w-24 rounded-lg border border-slate-800 shadow-md"
                />
                <div className="flex-1">
                  <h2 className="text-md font-bold text-slate-100">
                    {activeCardDetails.card_details.name}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-wide">
                    {activeCardDetails.card_details.type}
                  </p>
                  
                  {/* Informacion de ubicacion física */}
                  <div className="mt-2.5 p-2 bg-slate-900 rounded-lg border border-slate-850 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <div className="text-[10px] font-mono text-slate-400">
                      Ubicación: <strong className="text-slate-200">Pág {activeCardDetails.binder_page}, Slot {activeCardDetails.binder_slot}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTROLES DE EDICIÓN */}
              <div className="mt-6 space-y-4">
                
                {/* Rarity */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                    Rareza
                  </label>
                  <PremiumDropdown
                    value={activeCardDetails.is_proxy ? 'Proxy' : (activeCardDetails.rarity || 'Common')}
                    onChange={(val) => {
                      if (val === 'Proxy') {
                        updateCardInSlot(activeCardDetails.id, { is_proxy: true, rarity: 'Proxy' });
                      } else {
                        updateCardInSlot(activeCardDetails.id, { is_proxy: false, rarity: val });
                      }
                    }}
                    align="full"
                    size="md"
                    options={[
                      { value: 'Common', label: 'Common (Común)' },
                      { value: 'Rare', label: 'Rare (Rara)' },
                      { value: 'Super Rare', label: 'Super Rare' },
                      { value: 'Ultra Rare', label: 'Ultra Rare' },
                      { value: 'Secret Rare', label: 'Secret Rare' },
                      { value: 'Prismatic Secret Rare', label: 'Prismatic Secret Rare' },
                      { value: 'Prismatic Ultimate Rare', label: 'Prismatic Ultimate Rare' },
                      { value: 'Prismatic Platinum Rare', label: 'Prismatic Platinum Rare' },
                      { value: 'Gold Rare', label: 'Gold (Dorada)' },
                      { value: 'Duel Terminal', label: 'Duel Terminal' },
                      { value: 'Ultimate Rare', label: 'Ultimate Rare' },
                      { value: 'Ghost Rare', label: 'Ghost Rare' },
                      { value: 'Starlight Rare', label: 'Starlight Rare' },
                      { value: "Collector's Rare", label: "Collector's Rare" },
                      { value: 'Quarter Century Secret Rare', label: '25th Quarter Century' },
                      { value: 'Proxy', label: '🖨️ Proxy (Copia Impresa)' },
                    ]}
                  />
                </div>

                {/* Sleeve Type */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                    Funda / Sleeve
                  </label>
                  <PremiumDropdown
                    value={activeCardDetails.sleeve_type || 'none'}
                    onChange={(val) => updateCardInSlot(activeCardDetails.id, { sleeve_type: val as 'none' | 'single' | 'double' | 'triple' })}
                    align="full"
                    size="md"
                    options={[
                      { value: 'none', label: 'Sin Funda' },
                      { value: 'single', label: 'Funda Simple' },
                      { value: 'double', label: 'Funda Doble' },
                      { value: 'triple', label: 'Funda Triple' },
                    ]}
                  />
                </div>

                {/* Proxy & Quantity Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                      Copias
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={activeCardDetails.quantity}
                      onChange={(e) => updateCardInSlot(activeCardDetails.id, { quantity: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                      Estado Proxy
                    </label>
                    <button
                      onClick={() => updateCardInSlot(activeCardDetails.id, { is_proxy: !activeCardDetails.is_proxy })}
                      className={`w-full py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        activeCardDetails.is_proxy
                          ? 'bg-red-950/40 text-red-400 border-red-500/50 shadow-md shadow-red-950/20'
                          : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-red-400 hover:border-red-900/30'
                      }`}
                    >
                      {activeCardDetails.is_proxy ? 'Es Proxy' : 'No es Proxy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="mt-8 pt-4 border-t border-slate-900 flex items-center justify-between gap-3">
                <button
                  onClick={async () => {
                    await removeCardFromSlot(activeCardDetails.id);
                    setActiveCardDetails(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                  title="Liberar este bolsillo de la binder y mover la carta a la bandeja de Pendientes de esta binder"
                >
                  <MinusCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>A Pendientes</span>
                </button>

                <button
                  onClick={async () => {
                    await moveCardToInbox(activeCardDetails.id);
                    setActiveCardDetails(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                  title="Quitar la carta de esta binder y devolverla al Inbox general de colecciones"
                >
                  <MinusCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sacar de Binder</span>
                </button>

                <button
                  onClick={async () => {
                    await deleteCardFromCollection(activeCardDetails.id);
                    setActiveCardDetails(null);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-xl text-[10px] font-bold text-red-400 hover:text-red-300 cursor-pointer"
                  title="Borrar carta permanentemente de la colección"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>

                <button
                  onClick={() => setActiveCardDetails(null)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
