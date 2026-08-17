'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw,
  Save,
  FolderOpen,
  MoreVertical,
  X,
  Trash2,
  Undo2,
  Redo2,
  Download,
  Upload,
  HelpCircle,
  Sun,
  Moon,
  Bot,
  Sparkles,
  Network,
  GitFork,
  PenLine,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// UI Feedback components & Theme
import { useToast } from '@/components/ui/ToastProvider';
import { useTheme } from '@/components/ui/ThemeProvider';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { YdkUploadModal } from '@/components/collection/YdkUploadModal';

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
import { DeckActionsDropdown } from './components/DeckActionsDropdown';
import { SortDropdown } from './components/SortDropdown';
import { DeckCard, Card, HoverCardBase } from './types';
import { getSleeveColorHex } from '@/lib/sleeves';
import { ExordioAnalyticsDashboard } from './exordio/ExordioAnalyticsDashboard';
import { AICopilotModal } from './ai/AICopilotModal';


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

  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isYdkUploadOpen, setIsYdkUploadOpen] = useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);

  // Aplicar receta generada por Gemini AI al constructor
  const handleApplyGeneratedDeck = useCallback(
    async (cards: { name: string; count: number; section: 'main' | 'extra' }[]) => {
      toast.info('Cargando cartas del deck generado...');
      try {
        const newDeckCards: DeckCard[] = [];
        for (const item of cards) {
          try {
            const res = await fetch(
              `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(item.name)}`
            );
            const data = await res.json();
            if (data.data && data.data[0]) {
              const cardInfo = data.data[0];
              newDeckCards.push({
                id: cardInfo.id,
                name: cardInfo.name,
                count: item.count,
                section: item.section,
                type: cardInfo.type,
                image_url: cardInfo.card_images[0]?.image_url || '',
                archetype: cardInfo.archetype,
                ban_tcg: cardInfo.banlist_info?.ban_tcg,
                ban_master_duel: cardInfo.banlist_info?.ban_master_duel,
                atk: cardInfo.atk,
                def: cardInfo.def,
                level: cardInfo.level,
                race: cardInfo.race,
                attribute: cardInfo.attribute,
              });
            }
          } catch (err) {
            console.warn(`No se pudo cargar detalles de ${item.name}:`, err);
          }
        }

        if (newDeckCards.length > 0) {
          state.setDeckCards(newDeckCards);
          toast.success(
            `¡Deck aplicado con éxito (${newDeckCards.reduce((acc, c) => acc + c.count, 0)} cartas)!`
          );
        } else {
          toast.error('No se pudieron obtener los detalles de las cartas generadas');
        }
      } catch (err) {
        console.error('Error aplicando deck:', err);
        toast.error('Error al aplicar el deck generado');
      }
    },
    [state, toast]
  );

  // Atajos de teclado para Deshacer / Rehacer (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el foco está en un input o textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (state.canUndo) {
          state.handleUndo();
          toast.info('Acción deshecha');
        }
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        if (state.canRedo) {
          state.handleRedo();
          toast.info('Acción rehecha');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.canUndo, state.canRedo, state.handleUndo, state.handleRedo, toast]);

  // Wrapper para añadir cartas con Toast y botón de deshacer
  const handleAddCardWithFeedback = useCallback(
    (card: Card, targetSection?: 'main' | 'extra' | 'side' | 'extras') => {
      state.addCardToDeck(card, targetSection);
      toast.success(`+1 ${card.name}`, {
        duration: 3000,
        action: {
          label: 'Deshacer',
          onClick: () => {
            state.handleUndo();
          },
        },
      });
    },
    [state, toast]
  );

  // Wrapper para remover cartas con Toast y botón de deshacer
  const handleRemoveCardWithFeedback = useCallback(
    (cardId: number, section: 'main' | 'extra' | 'side' | 'extras') => {
      const targetCard = state.deckCards.find((c) => c.id === cardId && c.section === section);
      state.removeCardFromDeck(cardId, section);
      if (targetCard) {
        toast.info(`Removida: ${targetCard.name}`, {
          duration: 3000,
          action: {
            label: 'Deshacer',
            onClick: () => {
              state.handleUndo();
            },
          },
        });
      }
    },
    [state, toast]
  );

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

  const mainSleeve = state.availableSleeves.find(s => s.id === state.selectedMainSleeveId);
  const extraSleeve = state.availableSleeves.find(s => s.id === state.selectedExtraSleeveId);
  const mainSleeveColorHex = mainSleeve ? getSleeveColorHex(mainSleeve.color_pattern, state.availableSleeves) : '';
  const extraSleeveColorHex = extraSleeve ? getSleeveColorHex(extraSleeve.color_pattern, state.availableSleeves) : '';

  // ── Shared card props helpers ──────────────────────────────────────────────
  const sharedDeckSectionProps = {
    format: state.format,
    deckCards: getSortedCards(state.deckCards),
    removeCardFromDeck: handleRemoveCardWithFeedback,
    handleDragCardStart,
    handleDropCardOnSection,
    handleCardMouseEnter: preview.handleCardMouseEnter,
    handleCardMouseLeave: preview.handleCardMouseLeave,
    openPreviewForCard: preview.openPreviewForCard,
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased transition-colors duration-200">

      {/* ══════════════════════════════════════════════════════════════
          UNIFIED EXORDIO HEADER — Perfectly Centered & Polished
      ══════════════════════════════════════════════════════════════ */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 h-16 flex items-center shadow-xs">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
          
          {/* ZONA IZQUIERDA: Marca Exordio DeckLab + Nombre editable + Selector de Formato */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-red-600/30 font-display tracking-wider">
                EX
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-display uppercase leading-none">
                  Exordio DeckLab
                </span>
                <span className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 font-sans tracking-wide mt-0.5">
                  Tactical Builder &amp; Meta
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 min-w-0">
              <input
                value={state.deckName}
                onChange={(e) => state.setDeckName(e.target.value)}
                className="text-sm font-black bg-transparent border-b-2 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-red-500 focus:outline-none transition-colors max-w-32 sm:max-w-44 text-zinc-900 dark:text-zinc-100 truncate"
                title="Editar nombre del deck"
              />
            </div>

            {/* Selector de Formato Ultra-Compacto */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0">
              {(['TCG', 'Master Duel', 'Duel Links'] as const).map((f) => {
                const label = f === 'Master Duel' ? 'MD' : f === 'Duel Links' ? 'DL' : 'TCG';
                const isSelected = state.format === f;
                return (
                  <button
                    key={f}
                    onClick={() => state.setFormat(f)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                    title={`Formato ${f}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ZONA CENTRAL: Navegación de 4 Modos (Segmented Tabs) */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 shrink-0">
            <button
              onClick={() => state.setActiveView('builder')}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                state.activeView === 'builder'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span>🛠️</span>
              <span className="hidden sm:inline">Taller</span>
            </button>

            <button
              onClick={() => state.setActiveView('exordio')}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                state.activeView === 'exordio'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
              }`}
            >
              <span>📊</span>
              <span className="hidden sm:inline">Análisis</span>
            </button>

            <button
              onClick={() => state.setActiveView('breakdowns')}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                state.activeView === 'breakdowns'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span>📈</span>
              <span className="hidden sm:inline">Meta</span>
            </button>

            <Link
              href="/collection"
              className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>📦</span>
              <span className="hidden sm:inline">Colección</span>
            </Link>
          </div>

          {/* ZONA DERECHA: Botón AI Copilot + Menú Desplegable Deck + Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Botón Principal de IA */}
            <button
              onClick={() => setIsAICopilotOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/25 transition-all cursor-pointer font-display"
              title="Abrir AI Copilot (Sintetizador de Decks & Juez de Duelo)"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden md:inline">IA Copilot</span>
            </button>

            {/* Menú Desplegable de Operaciones de Deck */}
            <DeckActionsDropdown
              onSave={state.handleOpenSaveModal}
              onLoad={state.handleOpenLoadModal}
              onImportYdk={() => setIsYdkUploadOpen(true)}
              onExportYdk={() => {
                state.exportYdkFile();
                toast.success('Archivo .YDK descargado');
              }}
              onClear={() => setIsClearConfirmOpen(true)}
              onSyncMeta={() => state.triggerSync()}
              hasCards={state.deckCards.length > 0}
              isSyncing={state.isSyncing}
            />

            {/* Toggle Global de Tema Light / Dark */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={`Cambiar a modo ${theme === 'dark' ? 'Light Tech' : 'Dark Carbón'}`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-700" />
              )}
            </button>
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
              addCardToDeck={handleAddCardWithFeedback}
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
            <section className="flex-1 min-w-0 flex flex-col gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 overflow-hidden shadow-sm transition-colors">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 shrink-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-black text-sm sm:text-base uppercase tracking-wider flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                    <span className="text-red-500">📋</span>
                    <span>Lista de Cartas</span>
                  </h2>
                  
                  {/* Undo / Redo Actions Toolbar */}
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-0.5 shadow-xs">
                    <button
                      type="button"
                      onClick={() => {
                        state.handleUndo();
                        toast.info('Acción deshecha');
                      }}
                      disabled={!state.canUndo}
                      className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      title="Deshacer última acción (Ctrl+Z)"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        state.handleRedo();
                        toast.info('Acción rehecha');
                      }}
                      disabled={!state.canRedo}
                      className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      title="Rehacer acción (Ctrl+Y)"
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Dropdown de Ordenación Pulido React */}
                  <SortDropdown value={sortBy} onChange={setSortBy} />
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  {[
                    { label: 'Main', count: mainCardsCount, max: state.format === 'Duel Links' ? 30 : 60 },
                    { label: 'Extra', count: extraCardsCount, max: state.format === 'Duel Links' ? 8 : 15 },
                    { label: 'Side', count: sideCardsCount, max: 15 },
                    { label: 'Extras', count: extrasCardsCount, max: 30 },
                  ].map(({ label, count, max }) => (
                    <span key={label} className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-950 py-1 px-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 shadow-xs">
                      {label}: <b className="font-mono font-black text-zinc-900 dark:text-white">{count}</b>/{max}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-thin">
                <DeckSection title="Main Deck" section="main" cardsCount={mainCardsCount} maxSize={state.format === 'Duel Links' ? 30 : 60} sleeveColorHex={mainSleeveColorHex} {...sharedDeckSectionProps} />
                <DeckSection title="Extra Deck" section="extra" cardsCount={extraCardsCount} maxSize={state.format === 'Duel Links' ? 8 : 15} sleeveColorHex={extraSleeveColorHex} {...sharedDeckSectionProps} />
                <DeckSection title="Side Deck" section="side" cardsCount={sideCardsCount} maxSize={15} sleeveColorHex={mainSleeveColorHex} {...sharedDeckSectionProps} />
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
            <div className="w-72 shrink-0 flex flex-col gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <h2 className="font-black text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100">🔍 Buscar</h2>
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
                  addCardToDeck={handleAddCardWithFeedback}
                  handleDragCardStart={handleDragCardStart}
                  handleCardMouseEnter={preview.handleCardMouseEnter}
                  handleCardMouseLeave={preview.handleCardMouseLeave}
                />
              </div>
            </div>

            {/* Deck + Meta column */}
            <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-hidden">
              {/* Deck board */}
              <section className="flex-1 min-w-0 flex flex-col gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 overflow-hidden shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 gap-2 shrink-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-black text-sm uppercase tracking-wider flex items-center gap-2 text-zinc-900 dark:text-zinc-100">📋 Lista de Cartas</h2>
                  <SortDropdown value={sortBy} onChange={setSortBy} />
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                    {[
                      { label: 'Main', count: mainCardsCount, max: state.format === 'Duel Links' ? 30 : 60 },
                      { label: 'Extra', count: extraCardsCount, max: state.format === 'Duel Links' ? 8 : 15 },
                      { label: 'Side', count: sideCardsCount, max: 15 },
                    ].map(({ label, count, max }) => (
                      <span key={label} className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 py-0.5 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {label}: <b className="font-mono font-black text-zinc-900 dark:text-white">{count}</b>/{max}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-2 scrollbar-thin">
                  <DeckSection title="Main Deck" section="main" cardsCount={mainCardsCount} maxSize={state.format === 'Duel Links' ? 30 : 60} sleeveColorHex={mainSleeveColorHex} {...sharedDeckSectionProps} />
                  <DeckSection title="Extra Deck" section="extra" cardsCount={extraCardsCount} maxSize={state.format === 'Duel Links' ? 8 : 15} sleeveColorHex={extraSleeveColorHex} {...sharedDeckSectionProps} />
                  <DeckSection title="Side Deck" section="side" cardsCount={sideCardsCount} maxSize={15} sleeveColorHex={mainSleeveColorHex} {...sharedDeckSectionProps} />
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
                  <div className="flex gap-1.5 text-xs font-bold overflow-x-auto scrollbar-thin pb-1">
                    {[
                      { label: 'Main', count: mainCardsCount, max: state.format === 'Duel Links' ? 30 : 60 },
                      { label: 'Extra', count: extraCardsCount, max: state.format === 'Duel Links' ? 8 : 15 },
                      { label: 'Side', count: sideCardsCount, max: 15 },
                      { label: 'Extras', count: extrasCardsCount, max: 30 },
                    ].map(({ label, count, max }) => (
                      <span key={label} className="shrink-0 flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 py-1 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {label}: <b className="font-mono font-black text-zinc-900 dark:text-white">{count}</b>/{max}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-col gap-5 overflow-y-auto scrollbar-thin">
                    <DeckSection title="Main Deck" section="main" cardsCount={mainCardsCount} maxSize={state.format === 'Duel Links' ? 30 : 60} sleeveColorHex={mainSleeveColorHex} {...sharedDeckSectionProps} />
                    <DeckSection title="Extra Deck" section="extra" cardsCount={extraCardsCount} maxSize={state.format === 'Duel Links' ? 8 : 15} sleeveColorHex={extraSleeveColorHex} {...sharedDeckSectionProps} />
                    <DeckSection title="Side Deck" section="side" cardsCount={sideCardsCount} maxSize={15} sleeveColorHex={mainSleeveColorHex} {...sharedDeckSectionProps} />
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
                  <Trash2 className="w-4 h-4 text-red-400" />
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
      ) : state.activeView === 'exordio' ? (
        /* EXORDIO ANALYTICS HUB VIEW */
        <div className="flex-1 w-full pb-20 md:pb-8">
          <ExordioAnalyticsDashboard
            deckCards={state.deckCards}
            inferredArchetype={state.inferredArchetype}
            format={state.format}
            onApplyGeneratedDeck={handleApplyGeneratedDeck}
            onCardClick={(c) => preview.openPreviewForCard(c)}
            onClose={() => state.setActiveView('builder')}
          />
        </div>
      ) : (
        /* ARCHETYPES BREAKDOWNS LIST VIEW */
        <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <h2 className="font-black text-xl sm:text-2xl text-zinc-900 dark:text-zinc-100 flex items-center gap-2 uppercase tracking-wider">
                  <span className="text-red-500">📊</span> Breakdowns Competitivos
                </h2>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-medium">
                  Explora arquetipos de Master Duel Meta y carga sus recetas populares en un solo clic.
                </p>
              </div>
              <input
                type="text"
                placeholder="Filtrar arquetipos..."
                value={state.archetypeSearchQuery}
                onChange={(e) => state.setArchetypeSearchQuery(e.target.value)}
                className="pl-3 pr-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-red-500 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-bold focus:outline-none w-full sm:max-w-xs shadow-xs transition-colors"
              />
            </div>

            {state.isFetchingArchetypes ? (
              <div className="text-center py-20">
                <span className="w-8 h-8 animate-spin text-red-500 mx-auto mb-2 block font-extrabold">⏳</span>
                <p className="text-xs font-mono font-bold text-zinc-500">Cargando arquetipos del meta...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {state.archetypesList
                  .filter((a) => a.name.toLowerCase().includes(state.archetypeSearchQuery.toLowerCase()))
                  .map((arch) => (
                    <div
                      key={arch.name}
                      onClick={() => state.openArchetypeBreakdown(arch.name)}
                      className="cursor-pointer p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/60 rounded-2xl flex flex-col justify-between group transition-all duration-200 shadow-xs touch-manipulation"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-black text-base text-zinc-900 dark:text-zinc-100 group-hover:text-red-500 transition-colors">
                            {arch.name}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold font-mono border border-red-200 dark:border-red-900/40">
                            Tier {arch.tier}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">{arch.description}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-[10px] font-mono font-bold text-zinc-400">
                        <span>Cartas meta: {arch.cardCount}</span>
                        <span className="text-red-600 dark:text-red-400 font-black group-hover:underline">Ver desglose →</span>
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

      {/* UNIFIED AI COPILOT MODAL (Synthesizer & Live Judge) */}
      <AICopilotModal
        isOpen={isAICopilotOpen}
        onClose={() => setIsAICopilotOpen(false)}
        currentDeckCards={state.deckCards}
        currentDeckName={state.deckName}
        format={state.format}
        onApplyDeck={handleApplyGeneratedDeck}
      />

      {/* CONFIRM CLEAR DECK DIALOG */}
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        title="¿Limpiar todas las cartas del Deck?"
        description="Se removerán todas las cartas del Main, Extra, Side y Extras del editor actual. Puedes revertir esta acción usando Deshacer (Ctrl+Z)."
        confirmLabel="Limpiar Deck"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => {
          state.handleClearDeck();
          setIsClearConfirmOpen(false);
          toast.info('Deck limpiado');
        }}
        onClose={() => setIsClearConfirmOpen(false)}
      />

      {/* YDK UPLOAD MODAL IN DECKBUILDER */}
      <YdkUploadModal
        isOpen={isYdkUploadOpen}
        onClose={() => setIsYdkUploadOpen(false)}
        onSuccess={() => {
          setIsYdkUploadOpen(false);
          toast.success('Archivo .YDK importado exitosamente');
        }}
      />
    </div>
  );
}
