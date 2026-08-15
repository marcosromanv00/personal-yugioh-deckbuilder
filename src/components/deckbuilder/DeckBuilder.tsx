'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Save, FolderOpen, MoreVertical, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

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
import { MobileNav, type MobileTab } from './components/MobileNav';
import { MobileBottomSheet } from './components/MobileBottomSheet';
import { DeckCard } from './types';

/**
 * DeckBuilder Main Component
 * Renders the Yu-Gi-Oh! Deck Builder view. Connects customized state machine,
 * resizing layout controls, long-hover tooltip details preloading, and modular subsections.
 * On mobile: single-column layout with bottom navigation and bottom sheets.
 * On desktop: 3-column resizable panel layout (unchanged).
 */
export default function DeckBuilder() {
  // 1. Centralized deck building state machine
  const state = useDeckBuilderState();
  const {
    searchQuery,
    searchType,
    advancedFilters,
    searchScope,
    onlyFavorites,
    searchLimit,
    executeSearch,
    setSearchLimit,
    deckCards,
    format,
    analyzeDeck,
    activeArchetypeTab,
    inferredArchetype,
    fetchSidebarBreakdown,
    syncedArchetypes,
    setSyncedArchetypes,
    triggerSync,
  } = state;

  const [sortBy, setSortBy] = useState<string>('default');

  const getSortedCards = (cards: DeckCard[]) => {
    const sorted = [...cards];
    if (sortBy === 'name') {
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === 'type') {
      const getOrder = (typeStr: string) => {
        const t = typeStr.toLowerCase();
        if (t.includes('monster')) return 1;
        if (t.includes('spell')) return 2;
        if (t.includes('trap')) return 3;
        return 4;
      };
      return sorted.sort((a, b) => {
        const orderA = getOrder(a.type);
        const orderB = getOrder(b.type);
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
    }
    if (sortBy === 'level') {
      return sorted.sort((a, b) => {
        const lvlA = a.level ?? 0;
        const lvlB = b.level ?? 0;
        if (lvlA !== lvlB) return lvlB - lvlA;
        return a.name.localeCompare(b.name);
      });
    }
    if (sortBy === 'atk') {
      return sorted.sort((a, b) => {
        const atkA = a.atk ?? -1;
        const atkB = b.atk ?? -1;
        if (atkA !== atkB) return atkB - atkA;
        return a.name.localeCompare(b.name);
      });
    }
    if (sortBy === 'def') {
      return sorted.sort((a, b) => {
        const defA = a.def ?? -1;
        const defB = b.def ?? -1;
        if (defA !== defB) return defB - defA;
        return a.name.localeCompare(b.name);
      });
    }
    return sorted;
  };

  // 2. Panel resize handlers (desktop only)
  const resize = usePanelResize();

  // 3. Hover preview trigger manager
  const preview = useCardHoverPreview();

  // 4. Mobile navigation state
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('deck');
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const handleMobileTabChange = (tab: MobileTab) => {
    if (tab === 'more') {
      setMobileMoreOpen(true);
    } else {
      setActiveMobileTab(tab);
    }
  };

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

  // Reset limit when search parameters change
  useEffect(() => {
    setSearchLimit(45);
  }, [
    searchQuery,
    searchType,
    advancedFilters,
    searchScope,
    onlyFavorites,
    setSearchLimit
  ]);

  // Debounced search trigger logic
  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(
        searchQuery,
        searchType,
        advancedFilters,
        searchScope,
        onlyFavorites,
        searchLimit
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [
    searchQuery,
    searchType,
    advancedFilters,
    searchScope,
    onlyFavorites,
    searchLimit,
    executeSearch
  ]);

  // Real-time deck metadata/ratios analyzer trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      analyzeDeck(deckCards, format);
    }, 300);
    return () => clearTimeout(timer);
  }, [deckCards, format, analyzeDeck]);

  // Sync side-bar breakdown when archetype focus updates
  useEffect(() => {
    const handleArchetypeChange = async () => {
      const archToUse = activeArchetypeTab || inferredArchetype;
      if (!archToUse || archToUse === 'Híbrido / Staples') {
        fetchSidebarBreakdown('');
        return;
      }

      if (!syncedArchetypes.includes(archToUse)) {
        setSyncedArchetypes((prev) => [...prev, archToUse]);
        await triggerSync(true);
      } else {
        fetchSidebarBreakdown(archToUse);
      }
    };
    handleArchetypeChange();
  }, [
    activeArchetypeTab,
    inferredArchetype,
    format,
    syncedArchetypes,
    fetchSidebarBreakdown,
    triggerSync,
    setSyncedArchetypes
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

  // ── Shared card props helpers ──────────────────────────────────────────────
  const sharedDeckSectionProps = {
    format: state.format,
    deckCards: getSortedCards(state.deckCards),
    removeCardFromDeck: state.removeCardFromDeck,
    handleDragCardStart,
    handleDropCardOnSection,
    handleCardMouseEnter: preview.handleCardMouseEnter,
    handleCardMouseLeave: preview.handleCardMouseLeave,
    openPreviewForCard: preview.openPreviewForCard,
  };

  return (
    <div className="flex flex-col min-h-screen bg-[hsl(224,25%,6%)] text-[hsl(210,40%,98%)] font-sans antialiased">

      {/* ══════════════════════════════════════════════════════════════
          HEADER — Responsive: compact on mobile, full on desktop
      ══════════════════════════════════════════════════════════════ */}
      <header className="border-b border-[hsl(224,15%,16%)] bg-[hsl(224,22%,10%)]/90 backdrop-blur-md sticky top-0 z-40 pt-safe">
        {/* ── Mobile + Tablet Header (compact) ── */}
        <div className="flex lg:hidden items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-linear-to-tr from-[hsl(263,85%,64%)] to-[hsl(180,80%,45%)] flex items-center justify-center font-bold text-base shadow-lg shadow-[hsl(263,85%,64%)]/20">
              YG
            </div>
            <div className="min-w-0">
              <input
                value={state.deckName}
                onChange={(e) => state.setDeckName(e.target.value)}
                className="text-sm font-bold bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-[hsl(263,85%,64%)] focus:outline-none transition-colors w-full max-w-40 text-slate-100 truncate"
              />
              <p className="text-[10px] text-[hsl(215,15%,55%)] truncate">Constructor Inteligente</p>
            </div>
          </div>

          {/* Mobile: format pill compact + save button */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-0.5 bg-[hsl(224,25%,6%)] p-0.5 rounded-lg border border-[hsl(224,15%,16%)]">
              {(['MD', 'TCG', 'DL'] as const).map((short, idx) => {
                const full = (['Master Duel', 'TCG', 'Duel Links'] as const)[idx];
                return (
                  <button
                    key={full}
                    onClick={() => state.setFormat(full)}
                    className={`px-2 py-1 rounded-md font-bold text-[10px] transition-all duration-300 cursor-pointer touch-manipulation ${
                      state.format === full
                        ? 'bg-[hsl(263,85%,64%)] text-white shadow-sm'
                        : 'text-[hsl(215,15%,60%)] hover:text-white'
                    }`}
                  >
                    {short}
                  </button>
                );
              })}
            </div>

            <button
              onClick={state.handleOpenSaveModal}
              className="flex items-center gap-1 px-3 py-2 bg-[hsl(263,85%,64%)] text-white hover:bg-[hsl(263,85%,58%)] rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer touch-manipulation"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Guardar</span>
            </button>
          </div>
        </div>

        {/* ── Mobile bottom header tabs ── */}
        <div className="flex lg:hidden gap-1 px-4 pb-2 border-t border-[hsl(224,15%,14%)] pt-2">
          <button
            onClick={() => state.setActiveView('builder')}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-300 cursor-pointer touch-manipulation ${
              state.activeView === 'builder'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-[hsl(215,15%,60%)] hover:text-white'
            }`}
          >
            🛠️ Constructor
          </button>
          <button
            onClick={() => state.setActiveView('breakdowns')}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-300 cursor-pointer touch-manipulation ${
              state.activeView === 'breakdowns'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-[hsl(215,15%,60%)] hover:text-white'
            }`}
          >
            📊 Meta
          </button>
          <Link
            href="/collection"
            className="px-3 py-1.5 rounded-lg font-medium text-xs text-[hsl(215,15%,60%)] hover:text-white transition-all duration-300 cursor-pointer flex items-center gap-1 touch-manipulation"
          >
            📦 Colección
          </Link>
        </div>

        {/* ── Desktop Header (full row) ── */}
        <div className="hidden lg:flex py-4 px-6 flex-wrap items-center justify-between gap-4">
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
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          CORE WORKSPACE — Responsive layout
      ══════════════════════════════════════════════════════════════ */}
      {state.activeView === 'builder' ? (
        <>
          {/* ── DESKTOP (lg+): 3-column resizable panel layout ── */}
          <div className="hidden lg:flex flex-1 flex-row gap-3 p-6 sm:p-8 max-w-full w-full overflow-hidden">
            {/* SEARCH PANEL */}
            <SearchPanel
              leftPanelOpen={resize.leftPanelOpen}
              setLeftPanelOpen={resize.setLeftPanelOpen}
              leftPanelWidth={resize.leftPanelWidth}
              isMobile={false}
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

            {/* MAIN DECKBOARD */}
            <section className="flex-1 min-w-0 flex flex-col gap-4 bg-[hsl(224,22%,10%)] border border-[hsl(224,15%,16%)] rounded-2xl p-6 overflow-hidden">
              <div className="flex items-center justify-between border-b border-[hsl(224,15%,16%)] pb-3 shrink-0">
                <div className="flex items-center gap-4 flex-wrap">
                  <h2 className="font-bold text-lg flex items-center gap-2">📋 Lista de Cartas</h2>
                  <div className="flex items-center gap-1.5 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] rounded-lg px-2.5 py-1 text-xs">
                    <span className="text-slate-400">Ordenar por:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent border-none text-slate-200 outline-none cursor-pointer focus:ring-0 text-xs font-semibold"
                    >
                      <option value="default" className="bg-[hsl(224,22%,10%)] text-slate-200">Predeterminado</option>
                      <option value="name" className="bg-[hsl(224,22%,10%)] text-slate-200">Nombre (A-Z)</option>
                      <option value="type" className="bg-[hsl(224,22%,10%)] text-slate-200">Tipo (Monstruo, Magia, Trampa)</option>
                      <option value="level" className="bg-[hsl(224,22%,10%)] text-slate-200">Nivel/Rango</option>
                      <option value="atk" className="bg-[hsl(224,22%,10%)] text-slate-200">ATK</option>
                      <option value="def" className="bg-[hsl(224,22%,10%)] text-slate-200">DEF</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  {[
                    { label: 'Main', count: mainCardsCount, max: state.format === 'Duel Links' ? 30 : 60 },
                    { label: 'Extra', count: extraCardsCount, max: state.format === 'Duel Links' ? 8 : 15 },
                    { label: 'Side', count: sideCardsCount, max: 15 },
                    { label: 'Extras', count: extrasCardsCount, max: 30 },
                  ].map(({ label, count, max }) => (
                    <span key={label} className="flex items-center gap-1.5 bg-[hsl(224,25%,6%)] py-1 px-2.5 rounded-lg border border-[hsl(224,15%,16%)]">
                      {label}: <b className="font-mono text-white">{count}</b>/{max}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-thin">
                <DeckSection title="Main Deck" section="main" cardsCount={mainCardsCount} maxSize={state.format === 'Duel Links' ? 30 : 60} {...sharedDeckSectionProps} />
                <DeckSection title="Extra Deck" section="extra" cardsCount={extraCardsCount} maxSize={state.format === 'Duel Links' ? 8 : 15} {...sharedDeckSectionProps} />
                <DeckSection title="Side Deck" section="side" cardsCount={sideCardsCount} maxSize={15} {...sharedDeckSectionProps} />
                <DeckSection title="Extras / Estrategias Sugeridas" section="extras" cardsCount={extrasCardsCount} maxSize={30} {...sharedDeckSectionProps} />
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
              isMobile={false}
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

          {/* ── TABLET (md–lg): 2-column layout — Search + Deck, Meta as icon drawer ── */}
          <div className="hidden md:flex lg:hidden flex-1 flex-row gap-3 p-4 max-w-full w-full overflow-hidden">
            {/* Search Panel — fixed width on tablet */}
            <div className="w-72 shrink-0 flex flex-col gap-4 bg-[hsl(224,22%,10%)] border border-[hsl(224,15%,16%)] rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[hsl(224,15%,16%)] flex items-center justify-between shrink-0">
                <h2 className="font-bold text-sm uppercase tracking-wider">🔍 Buscar</h2>
              </div>
              <div className="p-4 pt-0 flex-1 overflow-hidden">
                <SearchPanel
                  leftPanelOpen={true}
                  setLeftPanelOpen={() => {}}
                  leftPanelWidth={0}
                  isMobile={true}
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
              </div>
            </div>

            {/* Deck + Meta column */}
            <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-hidden">
              {/* Deck board */}
              <section className="flex-1 min-w-0 flex flex-col gap-4 bg-[hsl(224,22%,10%)] border border-[hsl(224,15%,16%)] rounded-2xl p-4 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[hsl(224,15%,16%)] pb-3 gap-2 shrink-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-bold text-base flex items-center gap-2">📋 Lista de Cartas</h2>
                  <div className="flex items-center gap-1 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] rounded-lg px-2 py-0.5 text-[10px]">
                    <span className="text-slate-400">Ordenar:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent border-none text-slate-200 outline-none cursor-pointer focus:ring-0 text-[10px] font-semibold py-0"
                    >
                      <option value="default" className="bg-[hsl(224,22%,10%)] text-slate-200">Por defecto</option>
                      <option value="name" className="bg-[hsl(224,22%,10%)] text-slate-200">Nombre (A-Z)</option>
                      <option value="type" className="bg-[hsl(224,22%,10%)] text-slate-200">Tipo (Monstruo, Magia, Trampa)</option>
                      <option value="level" className="bg-[hsl(224,22%,10%)] text-slate-200">Nivel/Rango</option>
                      <option value="atk" className="bg-[hsl(224,22%,10%)] text-slate-200">ATK</option>
                      <option value="def" className="bg-[hsl(224,22%,10%)] text-slate-200">DEF</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                    {[
                      { label: 'Main', count: mainCardsCount, max: state.format === 'Duel Links' ? 30 : 60 },
                      { label: 'Extra', count: extraCardsCount, max: state.format === 'Duel Links' ? 8 : 15 },
                      { label: 'Side', count: sideCardsCount, max: 15 },
                    ].map(({ label, count, max }) => (
                      <span key={label} className="flex items-center gap-1 bg-[hsl(224,25%,6%)] py-0.5 px-2 rounded-lg border border-[hsl(224,15%,16%)]">
                        {label}: <b className="font-mono text-white">{count}</b>/{max}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-2 scrollbar-thin">
                  <DeckSection title="Main Deck" section="main" cardsCount={mainCardsCount} maxSize={state.format === 'Duel Links' ? 30 : 60} {...sharedDeckSectionProps} />
                  <DeckSection title="Extra Deck" section="extra" cardsCount={extraCardsCount} maxSize={state.format === 'Duel Links' ? 8 : 15} {...sharedDeckSectionProps} />
                  <DeckSection title="Side Deck" section="side" cardsCount={sideCardsCount} maxSize={15} {...sharedDeckSectionProps} />
                  <DeckSection title="Extras / Estrategias" section="extras" cardsCount={extrasCardsCount} maxSize={30} {...sharedDeckSectionProps} />
                </div>
              </section>

              {/* Meta panel — collapsed to icon strip on tablet */}
              <div className="shrink-0">
                <MetaAnalysisPanel
                  rightPanelOpen={resize.rightPanelOpen}
                  setRightPanelOpen={resize.setRightPanelOpen}
                  rightPanelWidth={resize.rightPanelWidth}
                  isMobile={false}
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
            </div>
          </div>

          {/* ── MOBILE (< md): Single-column layout with bottom nav ── */}
          <div className="flex md:hidden flex-col flex-1 pb-16">
            {/* Deck view (always rendered, shown/hidden by tab) */}
            <AnimatePresence mode="wait">
              {activeMobileTab === 'deck' && (
                <motion.section
                  key="mobile-deck"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18 }}
                  className="flex-1 flex flex-col gap-3 p-4"
                >
                  {/* Deck stats bar */}
                  <div className="flex gap-1.5 text-xs font-semibold overflow-x-auto scrollbar-thin pb-1">
                    {[
                      { label: 'Main', count: mainCardsCount, max: state.format === 'Duel Links' ? 30 : 60 },
                      { label: 'Extra', count: extraCardsCount, max: state.format === 'Duel Links' ? 8 : 15 },
                      { label: 'Side', count: sideCardsCount, max: 15 },
                      { label: 'Extras', count: extrasCardsCount, max: 30 },
                    ].map(({ label, count, max }) => (
                      <span key={label} className="shrink-0 flex items-center gap-1 bg-[hsl(224,22%,10%)] py-1 px-2.5 rounded-lg border border-[hsl(224,15%,16%)]">
                        {label}: <b className="font-mono text-white">{count}</b>/{max}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-col gap-5 overflow-y-auto scrollbar-thin">
                    <DeckSection title="Main Deck" section="main" cardsCount={mainCardsCount} maxSize={state.format === 'Duel Links' ? 30 : 60} {...sharedDeckSectionProps} />
                    <DeckSection title="Extra Deck" section="extra" cardsCount={extraCardsCount} maxSize={state.format === 'Duel Links' ? 8 : 15} {...sharedDeckSectionProps} />
                    <DeckSection title="Side Deck" section="side" cardsCount={sideCardsCount} maxSize={15} {...sharedDeckSectionProps} />
                    <DeckSection title="Extras / Estrategias Sugeridas" section="extras" cardsCount={extrasCardsCount} maxSize={30} {...sharedDeckSectionProps} />
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Search bottom sheet */}
            <MobileBottomSheet
              isOpen={activeMobileTab === 'search'}
              onClose={() => setActiveMobileTab('deck')}
              title="🔍 Buscar Cartas"
              heightClass="h-[88vh]"
            >
              <div className="p-4">
                <SearchPanel
                  leftPanelOpen={true}
                  setLeftPanelOpen={() => setActiveMobileTab('deck')}
                  leftPanelWidth={0}
                  isMobile={true}
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
              </div>
            </MobileBottomSheet>

            {/* Meta Analysis bottom sheet */}
            <MobileBottomSheet
              isOpen={activeMobileTab === 'meta'}
              onClose={() => setActiveMobileTab('deck')}
              title="📊 Análisis del Meta"
              heightClass="h-[85vh]"
            >
              <div className="p-4">
                <MetaAnalysisPanel
                  rightPanelOpen={true}
                  setRightPanelOpen={() => setActiveMobileTab('deck')}
                  rightPanelWidth={0}
                  isMobile={true}
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
            </MobileBottomSheet>

            {/* More options bottom sheet */}
            <MobileBottomSheet
              isOpen={mobileMoreOpen}
              onClose={() => setMobileMoreOpen(false)}
              title="⚙️ Opciones"
              heightClass="h-[60vh]"
            >
              <div className="p-5 flex flex-col gap-4">
                {/* Sync button */}
                <button
                  onClick={() => { state.triggerSync(); setMobileMoreOpen(false); }}
                  disabled={state.isSyncing}
                  className="flex items-center gap-3 w-full px-4 py-3.5 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-[hsl(180,80%,45%)]/40 rounded-xl text-sm font-semibold text-[hsl(215,15%,80%)] transition-all cursor-pointer disabled:opacity-50 touch-manipulation"
                >
                  <RefreshCw className={`w-4 h-4 text-[hsl(180,80%,45%)] ${state.isSyncing ? 'animate-spin' : ''}`} />
                  {state.isSyncing ? 'Sincronizando...' : 'Sincronizar Meta'}
                </button>

                {/* Load deck */}
                <button
                  onClick={() => { state.handleOpenLoadModal(); setMobileMoreOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3.5 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-purple-400 rounded-xl text-sm font-semibold text-[hsl(215,15%,80%)] transition-all cursor-pointer touch-manipulation"
                >
                  <FolderOpen className="w-4 h-4 text-purple-400" />
                  Cargar Deck
                </button>

                {/* Clear deck */}
                <button
                  onClick={() => { state.handleClearDeck(); setMobileMoreOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3.5 bg-[hsl(224,25%,6%)] border border-red-900/40 hover:border-red-500 rounded-xl text-sm font-semibold text-red-400 transition-all cursor-pointer touch-manipulation"
                >
                  <X className="w-4 h-4 text-red-400" />
                  Limpiar Deck
                </button>

                {/* Collection link */}
                <Link
                  href="/collection"
                  className="flex items-center gap-3 w-full px-4 py-3.5 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] rounded-xl text-sm font-semibold text-[hsl(215,15%,80%)] transition-all touch-manipulation"
                >
                  <span>📦</span> Mi Colección
                </Link>
              </div>
            </MobileBottomSheet>
          </div>
        </>
      ) : (
        /* ARCHETYPES BREAKDOWNS LIST VIEW */
        <div className="flex-1 p-4 sm:p-8 max-w-full w-full pb-20 md:pb-8">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[hsl(224,15%,16%)] pb-4">
              <div>
                <h2 className="font-bold text-xl sm:text-2xl text-slate-100 flex items-center gap-2">📊 Breakdowns Competitivos</h2>
                <p className="text-xs text-[hsl(215,15%,70%)] mt-1">
                  Explora arquetipos de Master Duel Meta y carga sus recetas populares en un solo clic.
                </p>
              </div>
              <input
                type="text"
                placeholder="Filtrar arquetipos..."
                value={state.archetypeSearchQuery}
                onChange={(e) => state.setArchetypeSearchQuery(e.target.value)}
                className="pl-3 pr-3 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-zinc-700 focus:border-[hsl(263,85%,64%)] text-slate-100 rounded-xl text-xs focus:outline-none w-full sm:max-w-xs"
              />
            </div>

            {state.isFetchingArchetypes ? (
              <div className="text-center py-20">
                <span className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2 block font-extrabold">⏳</span>
                <p className="text-xs font-mono text-slate-500">Cargando arquetipos del meta...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {state.archetypesList
                  .filter((a) => a.name.toLowerCase().includes(state.archetypeSearchQuery.toLowerCase()))
                  .map((arch) => (
                    <div
                      key={arch.name}
                      onClick={() => state.openArchetypeBreakdown(arch.name)}
                      className="cursor-pointer p-4 bg-[hsl(224,22%,10%)] border border-[hsl(224,15%,16%)] hover:border-[hsl(180,80%,45%)]/40 rounded-2xl flex flex-col justify-between group transition-all duration-300 shadow-md touch-manipulation"
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

      {/* ── Mobile Bottom Navigation ── */}
      {state.activeView === 'builder' && (
        <MobileNav
          activeTab={activeMobileTab}
          onTabChange={handleMobileTabChange}
          mainCardsCount={mainCardsCount}
        />
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
