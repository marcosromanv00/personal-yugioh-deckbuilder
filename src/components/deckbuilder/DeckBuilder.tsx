/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect } from 'react';
import { RefreshCw, Save, FolderOpen } from 'lucide-react';
import Link from 'next/link';

// Custom Hooks for State & Resizing
import { usePanelResize } from './hooks/usePanelResize';
import { useCardHoverPreview } from './hooks/useCardHoverPreview';
import { useDeckBuilderState } from './hooks/useDeckBuilderState';

// Modular UI Components
import { SearchPanel } from './components/SearchPanel';
import { DeckSection } from './components/DeckSection';
import { MetaAnalysisPanel } from './components/MetaAnalysisPanel';
import { SaveDeckModal } from './components/SaveDeckModal';
import { LoadDeckModal } from './components/LoadDeckModal';
import { CardPreviewModal } from './components/CardPreviewModal';
import { ArchetypeBreakdownDrawer } from './components/ArchetypeBreakdownDrawer';
import { ReplacementDrawer } from './components/ReplacementDrawer';

// Types
import { HoverCardBase } from './types';

/**
 * DeckBuilder Main Component
 * Renders the Yu-Gi-Oh! Deck Builder view. Connects customized state machine,
 * resizing layout controls, long-hover tooltip details preloading, and modular subsections.
 */
export default function DeckBuilder() {
  // 1. Centralized deck building state machine
  const state = useDeckBuilderState();

  // 2. Panel resize handlers
  const resize = usePanelResize();

  // 3. Hover preview trigger manager
  const preview = useCardHoverPreview();

  // Drag and drop helper payload mapping
  const handleDragCardStart = (
    e: React.DragEvent,
    cardData: {
      id: number;
      name: string;
      type?: string;
      image_url?: string;
      archetype?: string;
      fromSection?: 'main' | 'extra' | 'side' | 'extras';
    }
  ) => {
    const payload = JSON.stringify({
      id: cardData.id,
      name: cardData.name,
      type: cardData.type || 'Monster',
      image_url: cardData.image_url || '',
      archetype: cardData.archetype,
      fromSection: cardData.fromSection,
    });
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.setData('text/plain', String(cardData.id));
  };

  const handleDropCardOnSection = (
    e: React.DragEvent,
    targetSection: 'main' | 'extra' | 'side' | 'extras'
  ) => {
    e.preventDefault();
    const jsonStr = e.dataTransfer.getData('application/json');
    if (jsonStr) {
      try {
        const cardObj = JSON.parse(jsonStr);
        if (cardObj && cardObj.id) {
          if (cardObj.fromSection) {
            if (cardObj.fromSection !== targetSection) {
              state.removeCardFromDeck(cardObj.id, cardObj.fromSection);
              state.addCardToDeck(cardObj, targetSection);
            }
          } else {
            state.addCardToDeck(cardObj, targetSection);
          }
          return;
        }
      } catch (err) {
        console.error('Error al parsear carta arrastrada:', err);
      }
    }
    const rawId = e.dataTransfer.getData('text/plain');
    if (rawId) {
      const cardId = parseInt(rawId);
      if (!isNaN(cardId)) {
        state.addRecommendedCard(cardId, '', targetSection);
      }
    }
  };

  // Debounced search trigger logic
  const prevSearchKeyRef = React.useRef('');

  useEffect(() => {
    const searchKey = JSON.stringify({
      searchQuery: state.searchQuery,
      searchType: state.searchType,
      advancedFilters: state.advancedFilters,
      searchScope: state.searchScope,
      onlyFavorites: state.onlyFavorites,
    });
    if (prevSearchKeyRef.current !== searchKey) {
      prevSearchKeyRef.current = searchKey;
      state.setSearchLimit(45);
      return;
    }

    const timer = setTimeout(() => {
      state.executeSearch(
        state.searchQuery,
        state.searchType,
        state.advancedFilters,
        state.searchScope,
        state.onlyFavorites,
        state.searchLimit
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [
    state.searchQuery,
    state.searchType,
    state.advancedFilters,
    state.searchScope,
    state.onlyFavorites,
    state.searchLimit,
    state.executeSearch,
    state.setSearchLimit
  ]);

  // Real-time deck metadata/ratios analyzer trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      state.analyzeDeck(state.deckCards, state.format);
    }, 300);
    return () => clearTimeout(timer);
  }, [state.deckCards, state.format, state.analyzeDeck]);

  // Sync side-bar breakdown when archetype focus updates
  useEffect(() => {
    const handleArchetypeChange = async () => {
      const archToUse = state.activeArchetypeTab || state.inferredArchetype;
      if (!archToUse || archToUse === 'Híbrido / Staples') {
        state.fetchSidebarBreakdown('');
        return;
      }

      if (!state.syncedArchetypes.includes(archToUse)) {
        state.setSyncedArchetypes((prev) => [...prev, archToUse]);
        await state.triggerSync(true);
      } else {
        state.fetchSidebarBreakdown(archToUse);
      }
    };
    handleArchetypeChange();
  }, [
    state.activeArchetypeTab,
    state.inferredArchetype,
    state.format,
    state.syncedArchetypes,
    state.fetchSidebarBreakdown,
    state.triggerSync,
    state.setSyncedArchetypes
  ]);

  // Card count limits/ratios calculators
  const mainCardsCount = state.deckCards.filter((c) => c.section === 'main').reduce((acc, c) => acc + c.count, 0);
  const extraCardsCount = state.deckCards.filter((c) => c.section === 'extra').reduce((acc, c) => acc + c.count, 0);
  const sideCardsCount = state.deckCards.filter((c) => c.section === 'side').reduce((acc, c) => acc + c.count, 0);
  const extrasCardsCount = state.deckCards.filter((c) => c.section === 'extras').reduce((acc, c) => acc + c.count, 0);

  const activeReplacementCard = state.deckCards.find((c) => c.id === state.activeReplacementCardId);
  const activeReplacementsList = state.activeReplacementCardId ? state.replacements[state.activeReplacementCardId] || [] : [];

  // Technical proxies/collection operations wrapper mapping
  const handleAddProxyWrapper = async (cardId: number) => {
    preview.setIsActionLoading(true);
    preview.setModalActionMessage(null);
    try {
      const res = await fetch('/api/collection/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: cardId,
          quantity: 1,
          is_proxy: true,
          status_flag: 'collection',
          rarity: 'Common',
          condition: 'Near Mint',
          language: 'en',
        }),
      });
      if (res.ok) {
        state.setUserInventoryCounts((prev) => ({
          ...prev,
          [cardId]: (prev[cardId] || 0) + 1,
        }));
        preview.setModalActionMessage({
          text: '¡Agregada como proxy exitosamente!',
          type: 'success',
        });
      } else {
        const errJson = await res.json();
        preview.setModalActionMessage({
          text: `Error: ${errJson.error || 'No se pudo agregar'}`,
          type: 'error',
        });
      }
    } catch (e) {
      console.error('Error adding proxy:', e);
      preview.setModalActionMessage({
        text: 'Error de red al agregar proxy.',
        type: 'error',
      });
    } finally {
      preview.setIsActionLoading(false);
    }
  };

  const handleRemoveFromCollectionWrapper = async (cardId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar todas las copias de esta carta de tu colección?')) return;
    preview.setIsActionLoading(true);
    preview.setModalActionMessage(null);
    try {
      const res = await fetch(`/api/collection/cards?card_id=${cardId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        state.setUserInventoryCounts((prev) => {
          const updated = { ...prev };
          delete updated[cardId];
          return updated;
        });
        preview.setModalActionMessage({
          text: '¡Carta eliminada de la colección!',
          type: 'success',
        });
      } else {
        const errJson = await res.json();
        preview.setModalActionMessage({
          text: `Error: ${errJson.error || 'No se pudo eliminar'}`,
          type: 'error',
        });
      }
    } catch (e) {
      console.error('Error removing from collection:', e);
      preview.setModalActionMessage({
        text: 'Error de red al eliminar.',
        type: 'error',
      });
    } finally {
      preview.setIsActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[hsl(224,25%,6%)] text-[hsl(210,40%,98%)] font-sans antialiased">
      {/* HEADER */}
      <header className="border-b border-[hsl(224,15%,16%)] bg-[hsl(224,22%,10%)]/90 backdrop-blur-md sticky top-0 z-40 py-4 px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-[hsl(263,85%,64%)] to-[hsl(180,80%,45%)] flex items-center justify-center font-bold text-xl shadow-lg shadow-[hsl(263,85%,64%)]/20">
            YG
          </div>
          <div>
            <input
              value={state.deckName}
              onChange={(e) => state.setDeckName(e.target.value)}
              className="text-lg font-bold bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-[hsl(263,85%,64%)] focus:outline-none transition-colors max-w-xs text-slate-100"
            />
            <p className="text-xs text-[hsl(215,15%,70%)]">Constructor de Decks Inteligente</p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={state.handleOpenLoadModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-purple-400 hover:text-white rounded-xl text-xs font-semibold text-[hsl(215,15%,70%)] transition-all cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>Cargar Deck</span>
          </button>

          <button
            onClick={state.handleClearDeck}
            className="flex items-center gap-1.5 px-3 py-2 bg-[hsl(224,25%,6%)] border border-red-900/40 hover:border-red-500 hover:text-red-400 hover:bg-red-950/10 rounded-xl text-xs font-semibold text-red-500 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-red-500" />
            <span>Limpiar Deck</span>
          </button>

          <button
            onClick={state.handleOpenSaveModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-[hsl(263,85%,64%)] text-white hover:bg-[hsl(263,85%,58%)] rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar Deck</span>
          </button>
        </div>

        <div className="flex gap-2 bg-[hsl(224,25%,6%)] p-1 rounded-xl border border-[hsl(224,15%,16%)]">
          <button
            onClick={() => state.setActiveView('builder')}
            className={`px-4 py-2 rounded-lg font-medium text-xs transition-all duration-300 cursor-pointer ${
              state.activeView === 'builder'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-[hsl(215,15%,70%)] hover:text-white'
            }`}
          >
            🛠️ Constructor
          </button>
          <button
            onClick={() => state.setActiveView('breakdowns')}
            className={`px-4 py-2 rounded-lg font-medium text-xs transition-all duration-300 cursor-pointer ${
              state.activeView === 'breakdowns'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-[hsl(215,15%,70%)] hover:text-white'
            }`}
          >
            📊 Breakdowns Meta
          </button>
          <Link
            href="/collection"
            className="px-4 py-2 rounded-lg font-medium text-xs text-[hsl(215,15%,70%)] hover:text-white transition-all duration-300 cursor-pointer flex items-center gap-1"
          >
            📦 Mi Colección
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => state.triggerSync()}
            disabled={state.isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-[hsl(180,80%,45%)]/40 hover:text-white rounded-xl text-xs font-semibold text-[hsl(215,15%,70%)] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[hsl(180,80%,45%)] ${state.isSyncing ? 'animate-spin' : ''}`} />
            {state.isSyncing ? 'Sincronizando...' : 'Sincronizar Meta'}
          </button>

          <div className="flex items-center gap-2 bg-[hsl(224,25%,6%)] p-1 rounded-xl border border-[hsl(224,15%,16%)]">
            {(['Master Duel', 'TCG', 'Duel Links'] as const).map((f) => (
              <button
                key={f}
                onClick={() => state.setFormat(f)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                  state.format === f
                    ? 'bg-[hsl(263,85%,64%)] text-white shadow-md'
                    : 'text-[hsl(215,15%,70%)] hover:text-white hover:bg-[hsl(224,22%,10%)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE */}
      {state.activeView === 'builder' ? (
        <div className="flex-1 flex flex-row gap-3 p-6 sm:p-8 max-w-full w-full overflow-hidden">
          {/* SEARCH PANEL */}
          <SearchPanel
            leftPanelOpen={resize.leftPanelOpen}
            setLeftPanelOpen={resize.setLeftPanelOpen}
            leftPanelWidth={resize.leftPanelWidth}
            searchQuery={state.searchQuery}
            setSearchQuery={state.setSearchQuery}
            searchScope={state.searchScope}
            setSearchScope={state.setSearchScope}
            onlyFavorites={state.onlyFavorites}
            setOnlyFavorites={state.setOnlyFavorites}
            searchType={state.searchType}
            setSearchType={state.setSearchType}
            advancedFilters={state.advancedFilters}
            setAdvancedFilters={state.setAdvancedFilters}
            searchResults={state.searchResults}
            isSearching={state.isSearching}
            searchViewMode={state.searchViewMode}
            setSearchViewMode={state.setSearchViewMode}
            searchLimit={state.searchLimit}
            setSearchLimit={state.setSearchLimit}
            format={state.format}
            addCardToDeck={state.addCardToDeck}
            handleDragCardStart={handleDragCardStart}
            handleCardMouseEnter={preview.handleCardMouseEnter}
            handleCardMouseLeave={preview.handleCardMouseLeave}
          />

          {resize.leftPanelOpen && (
            <div
              onMouseDown={resize.startResizeLeft}
              className="w-1 hover:w-1.5 bg-transparent cursor-col-resize self-stretch shrink-0 transition-all"
            />
          )}

          {/* MAIN DECKBOARD SECTIONS CONTAINER */}
          <section className="flex-1 min-w-0 flex flex-col gap-4 bg-[hsl(224,22%,10%)] border border-[hsl(224,15%,16%)] rounded-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[hsl(224,15%,16%)] pb-3 shrink-0">
              <h2 className="font-bold text-lg flex items-center gap-2">📋 Lista de Cartas</h2>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="flex items-center gap-1.5 bg-[hsl(224,25%,6%)] py-1 px-2.5 rounded-lg border border-[hsl(224,15%,16%)]">
                  Main: <b className="font-mono text-white">{mainCardsCount}</b>/{state.format === 'Duel Links' ? '30' : '60'}
                </span>
                <span className="flex items-center gap-1.5 bg-[hsl(224,25%,6%)] py-1 px-2.5 rounded-lg border border-[hsl(224,15%,16%)]">
                  Extra: <b className="font-mono text-white">{extraCardsCount}</b>/{state.format === 'Duel Links' ? '8' : '15'}
                </span>
                <span className="flex items-center gap-1.5 bg-[hsl(224,25%,6%)] py-1 px-2.5 rounded-lg border border-[hsl(224,15%,16%)]">
                  Side: <b className="font-mono text-white">{sideCardsCount}</b>/15
                </span>
                <span className="flex items-center gap-1.5 bg-[hsl(224,25%,6%)] py-1 px-2.5 rounded-lg border border-[hsl(224,15%,16%)]">
                  Extras: <b className="font-mono text-white">{extrasCardsCount}</b>/30
                </span>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-thin">
              <DeckSection
                title="Main Deck"
                section="main"
                deckCards={state.deckCards}
                cardsCount={mainCardsCount}
                maxSize={state.format === 'Duel Links' ? 30 : 60}
                format={state.format}
                removeCardFromDeck={state.removeCardFromDeck}
                handleDragCardStart={handleDragCardStart}
                handleDropCardOnSection={handleDropCardOnSection}
                handleCardMouseEnter={preview.handleCardMouseEnter}
                handleCardMouseLeave={preview.handleCardMouseLeave}
              />

              <DeckSection
                title="Extra Deck"
                section="extra"
                deckCards={state.deckCards}
                cardsCount={extraCardsCount}
                maxSize={state.format === 'Duel Links' ? 8 : 15}
                format={state.format}
                removeCardFromDeck={state.removeCardFromDeck}
                handleDragCardStart={handleDragCardStart}
                handleDropCardOnSection={handleDropCardOnSection}
                handleCardMouseEnter={preview.handleCardMouseEnter}
                handleCardMouseLeave={preview.handleCardMouseLeave}
              />

              <DeckSection
                title="Side Deck"
                section="side"
                deckCards={state.deckCards}
                cardsCount={sideCardsCount}
                maxSize={15}
                format={state.format}
                removeCardFromDeck={state.removeCardFromDeck}
                handleDragCardStart={handleDragCardStart}
                handleDropCardOnSection={handleDropCardOnSection}
                handleCardMouseEnter={preview.handleCardMouseEnter}
                handleCardMouseLeave={preview.handleCardMouseLeave}
              />

              <DeckSection
                title="Extras / Estrategias Sugeridas"
                section="extras"
                deckCards={state.deckCards}
                cardsCount={extrasCardsCount}
                maxSize={30}
                format={state.format}
                removeCardFromDeck={state.removeCardFromDeck}
                handleDragCardStart={handleDragCardStart}
                handleDropCardOnSection={handleDropCardOnSection}
                handleCardMouseEnter={preview.handleCardMouseEnter}
                handleCardMouseLeave={preview.handleCardMouseLeave}
              />
            </div>
          </section>

          {resize.rightPanelOpen && (
            <div
              onMouseDown={resize.startResizeRight}
              className="w-1 hover:w-1.5 bg-transparent cursor-col-resize self-stretch shrink-0 transition-all"
            />
          )}

          {/* META ANALYSIS */}
          <MetaAnalysisPanel
            rightPanelOpen={resize.rightPanelOpen}
            setRightPanelOpen={resize.setRightPanelOpen}
            rightPanelWidth={resize.rightPanelWidth}
            isAnalyzing={state.isAnalyzing}
            inferredArchetype={state.inferredArchetype}
            detectedArchetypes={state.detectedArchetypes}
            activeArchetypeTab={state.activeArchetypeTab}
            setActiveArchetypeTab={state.setActiveArchetypeTab}
            banlistAlerts={state.banlistAlerts}
            sidebarBreakdownCards={state.sidebarBreakdownCards}
            isFetchingSidebarBreakdown={state.isFetchingSidebarBreakdown}
            fetchSidebarBreakdown={state.fetchSidebarBreakdown}
            cardHistory={state.cardHistory}
            handleDragCardStart={handleDragCardStart}
            handleCardMouseEnter={preview.handleCardMouseEnter}
            handleCardMouseLeave={preview.handleCardMouseLeave}
            addRecommendedCard={state.addRecommendedCard}
          />
        </div>
      ) : (
        /* ARCHETYPES BREAKDOWNS LIST VIEW */
        <div className="flex-1 p-6 sm:p-8 max-w-full w-full">
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[hsl(224,15%,16%)] pb-4">
              <div>
                <h2 className="font-bold text-2xl text-slate-100 flex items-center gap-2">📊 Breakdowns Competitivos</h2>
                <p className="text-xs text-[hsl(215,15%,70%)] mt-1">
                  Explora arquetipos de Master Duel Meta y carga sus recetas populares en un solo clic.
                </p>
              </div>
              <input
                type="text"
                placeholder="Filtrar arquetipos..."
                value={state.archetypeSearchQuery}
                onChange={(e) => state.setArchetypeSearchQuery(e.target.value)}
                className="pl-3 pr-10 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-zinc-700 focus:border-[hsl(263,85%,64%)] text-slate-100 rounded-xl text-xs focus:outline-none max-w-xs w-full"
              />
            </div>

            {state.isFetchingArchetypes ? (
              <div className="text-center py-20">
                <span className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2 block font-extrabold">⏳</span>
                <p className="text-xs font-mono text-slate-500">Cargando arquetipos del meta...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {state.archetypesList
                  .filter((a) => a.name.toLowerCase().includes(state.archetypeSearchQuery.toLowerCase()))
                  .map((arch) => (
                    <div
                      key={arch.name}
                      onClick={() => state.openArchetypeBreakdown(arch.name)}
                      className="cursor-pointer p-4 bg-[hsl(224,22%,10%)] border border-[hsl(224,15%,16%)] hover:border-[hsl(180,80%,45%)]/40 rounded-2xl flex flex-col justify-between group transition-all duration-300 shadow-md"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-base text-slate-200 group-hover:text-purple-300 transition-colors">
                            {arch.name}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[hsl(180,80%,45%)]/15 text-[hsl(180,80%,45%)] font-bold font-mono">
                            Tier {arch.tier}
                          </span>
                        </div>
                        <p className="text-xs text-[hsl(215,15%,70%)] mt-2 line-clamp-2">{arch.description}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[hsl(224,15%,16%)] flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span>Cartas meta: {arch.cardCount}</span>
                        <span className="text-[hsl(180,80%,45%)] font-bold group-hover:underline">Ver desglose →</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SAVE DECK MODAL */}
      <SaveDeckModal
        isOpen={state.isSaveModalOpen}
        onClose={() => state.setIsSaveModalOpen(false)}
        deckName={state.deckName}
        setDeckName={state.setDeckName}
        deckDescription={state.deckDescription}
        setDeckDescription={state.setDeckDescription}
        saveFormat={state.saveFormat}
        setSaveFormat={state.setSaveFormat}
        saveIsActive={state.saveIsActive}
        setSaveIsActive={state.setSaveIsActive}
        deckCards={state.deckCards}
        loadingDecks={state.loadingDecks}
        locations={state.locations}
        userInventoryCounts={state.userInventoryCounts}
        registerToInventory={state.registerToInventory}
        setRegisterToInventory={state.setRegisterToInventory}
        targetLocationId={state.targetLocationId}
        setTargetLocationId={state.setTargetLocationId}
        cardsToRegister={state.cardsToRegister}
        setCardsToRegister={state.setCardsToRegister}
        availableSleeves={state.availableSleeves}
        selectedMainSleeveId={state.selectedMainSleeveId}
        setSelectedMainSleeveId={state.setSelectedMainSleeveId}
        selectedExtraSleeveId={state.selectedExtraSleeveId}
        setSelectedExtraSleeveId={state.setSelectedExtraSleeveId}
        handleSaveDeck={state.handleSaveDeck}
        handleExcludeExisting={state.handleExcludeExisting}
      />

      {/* LOAD DECK MODAL */}
      <LoadDeckModal
        isOpen={state.isLoadModalOpen}
        onClose={() => state.setIsLoadModalOpen(false)}
        loadingDecks={state.loadingDecks}
        savedDecks={state.savedDecks}
        handleLoadDeck={state.handleLoadDeck}
        handleDeleteDeck={state.handleDeleteDeck}
      />

      {/* ARCHETYPE BREAKDOWN DRAWER */}
      <ArchetypeBreakdownDrawer
        activeArchetypeBreakdown={state.activeArchetypeBreakdown}
        setActiveArchetypeBreakdown={state.setActiveArchetypeBreakdown}
        isFetchingBreakdown={state.isFetchingBreakdown}
        breakdownCards={state.breakdownCards}
        initializeDeckFromArchetype={state.initializeDeckFromArchetype}
        addRecommendedCard={state.addRecommendedCard}
        handleDragCardStart={handleDragCardStart}
        handleCardMouseEnter={preview.handleCardMouseEnter}
        handleCardMouseLeave={preview.handleCardMouseLeave}
      />

      {/* REPLACEMENTS DRAWER */}
      <ReplacementDrawer
        activeReplacementCard={activeReplacementCard}
        activeReplacementCardId={state.activeReplacementCardId}
        setActiveReplacementCardId={state.setActiveReplacementCardId}
        activeReplacementsList={activeReplacementsList}
        addRecommendedCard={state.addRecommendedCard}
        removeCardFromDeck={state.removeCardFromDeck}
        handleCardMouseEnter={preview.handleCardMouseEnter}
        handleCardMouseLeave={preview.handleCardMouseLeave}
      />

      {/* DETAILED CARD PREVIEW TECHNICAL SHEET MODAL */}
      <CardPreviewModal
        isOpen={preview.isPreviewOpen}
        onClose={preview.closePreview}
        isLoadingPreview={preview.isLoadingPreview}
        previewCard={preview.previewCard}
        hoveredCard={preview.hoveredCard}
        favoriteCardIds={state.favoriteCardIds}
        handleToggleFavorite={state.handleToggleFavorite}
        userInventoryCounts={state.userInventoryCounts}
        userProxyCounts={state.userProxyCounts}
        handleAddProxy={handleAddProxyWrapper}
        handleRemoveFromCollection={handleRemoveFromCollectionWrapper}
        isActionLoading={preview.isActionLoading}
        modalActionMessage={preview.modalActionMessage}
      />
    </div>
  );
}
