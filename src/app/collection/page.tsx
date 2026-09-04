'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Sun, 
  Moon, 
  Menu,
  BrainCircuit,
  TrendingUp,
} from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';
import { useAIChat } from '@/context/AIChatContext';

// Custom State Hook
import { useCollectionState } from '@/components/collection/hooks/useCollectionState';

// Modular UI Subcomponents
import { ContainersTab } from '@/components/collection/components/ContainersTab';
import { CollectionCardsTab } from '@/components/collection/components/CollectionCardsTab';
import { SleevesTab } from '@/components/collection/components/SleevesTab';
import { DecksTab } from '@/components/collection/components/DecksTab';
import { DecksPanel } from '@/components/collection/components/DecksPanel';
import { SuggestionsTab } from '@/components/collection/components/SuggestionsTab';
import { ValuationTab } from '@/components/collection/components/ValuationTab';
import { CollectionSidebar, CollectionTab } from '@/components/collection/components/CollectionSidebar';

import { UniversalContainerWorkspaceModal } from '@/components/collection/UniversalContainerWorkspaceModal';
import { CollectionValuationModal } from '@/components/collection/CollectionValuationModal';
import { BulkActionsFloatingBar } from '@/components/collection/BulkActionsFloatingBar';
import { CardCopySplitModal } from '@/components/collection/CardCopySplitModal';
import { PickListConsolidationModal } from '@/components/collection/PickListConsolidationModal';
import { StorageFormModal } from '@/components/collection/StorageFormModal';
import { SmartOrganizeModal } from '@/components/collection/SmartOrganizeModal';
import { SleevingAdvisorModal } from '@/components/collection/SleevingAdvisorModal';
import { SleeveInventoryFormModal } from '@/components/collection/SleeveInventoryFormModal';
import { UniversalDeckWorkspaceModal } from '@/components/collection/UniversalDeckWorkspaceModal';
import { EnvironmentSwitcher } from '@/components/collection/EnvironmentSwitcher';
import { Deck, UserCard } from '@/types/collection';
import { analyzeCollectionSuggestions } from '@/lib/collectionSuggestions';

/**
 * CollectionPage Component
 * Manages physical collection directories, container allocations, card portfolios,
 * sleeves registry, and imports tools. Uses modular components and useCollectionState hook.
 */
export default function CollectionPage() {
  const state = useCollectionState();
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [isDeckDetailsOpen, setIsDeckDetailsOpen] = useState(false);

  // Apertura y cierre de deck con sincronización en URL
  const handleOpenDeck = useCallback((deck: Deck) => {
    setSelectedDeck(deck);
    setIsDeckDetailsOpen(true);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('deck_id', deck.id);
      window.history.replaceState(null, '', url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : ''));
    }
  }, []);

  const handleCloseDeck = useCallback(() => {
    setIsDeckDetailsOpen(false);
    setSelectedDeck(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('deck_id');
      url.searchParams.delete('deck');
      window.history.replaceState(null, '', url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : ''));
    }
  }, []);

  // Re-abrir modal de deck al recargar si existe deck_id en la URL
  const initialDeckCheckedRef = useRef(false);
  useEffect(() => {
    if (!initialDeckCheckedRef.current && state.decks.length > 0 && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const deckId = params.get('deck_id') || params.get('deck');
      if (deckId) {
        const found = state.decks.find(d => d.id === deckId);
        if (found) {
          queueMicrotask(() => {
            setSelectedDeck(found);
            setIsDeckDetailsOpen(true);
          });
          initialDeckCheckedRef.current = true;
        }
      }
    }
  }, [state.decks]);

  // Sidebar Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleDragStart = (e: React.DragEvent, deckId: string) => {
    e.dataTransfer.setData('text/plain', deckId);
  };

  const totalCardsInCollection = state.locations.reduce((acc, l) => acc + (l.occupied_cards || 0), 0) + state.inboxCards.length;

  // Sugerencias calculadas para el badge de navegación
  const suggestionsAnalysis = useMemo(() => {
    return analyzeCollectionSuggestions(state.allCollectionCards, state.locations, state.decks);
  }, [state.allCollectionCards, state.locations, state.decks]);

  const suggestionsCount = suggestionsAnalysis.stats.totalArchetypesDetected + suggestionsAnalysis.stats.totalDispersedDuplicates;

  const { theme, toggleTheme } = useTheme();
  const { openChatDrawer } = useAIChat();

  // Handler para crear deck desde arquetipo sugerido
  const handleCreateDeckFromArchetype = async (archetype: string, cards: UserCard[]) => {
    try {
      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Deck ${archetype}`,
          format: 'Master Duel',
          notes: `Deck inicial sugerido automáticamente con cartas de la colección.`,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const newDeck = json.data;
        if (newDeck) {
          // Asignar cartas al deck
          for (const c of cards) {
            await fetch('/api/collection/cards', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: c.id,
                deck_id: newDeck.id,
                status_flag: 'in_deck',
              }),
            });
          }
          await state.fetchCollectionDataSilently();
          handleOpenDeck(newDeck);
        }
      }
    } catch (err) {
      console.error('Error al crear deck desde sugerencia:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased transition-colors duration-200">
      
      {/* HEADER UNIFICADO EXORDIO - ALTURA FIJA GLOBAL */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 h-16 shrink-0 flex items-center shadow-xs">
        <div className="max-w-[1700px] mx-auto w-full flex items-center justify-between gap-3">
          {/* Identidad y Menú Móvil */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Abrir menú de navegación"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-red-600/30 shrink-0 font-display tracking-wider">
              EX
            </div>
            <div>
              <h1 className="text-xs font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-display uppercase leading-none">
                Exordio DeckLab
              </h1>
              <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mt-0.5 font-sans">
                Mi Colección &amp; Almacenamiento
              </p>
            </div>
          </div>

          {/* TOP NAVIGATION TABS */}
          <div className="hidden md:flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 shrink-0">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🛠️</span>
              <span>Taller</span>
            </Link>
            <Link
              href="/?tab=exordio"
              className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>📊</span>
              <span>Análisis</span>
            </Link>
            <Link
              href="/?tab=breakdowns"
              className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>📈</span>
              <span>Meta</span>
            </Link>
            <button
              className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs transition-all cursor-default flex items-center gap-1.5"
            >
              <span>📦</span>
              <span>Colección</span>
            </button>
            <Link
              href="/knowledge"
              className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              title="Banco de Reglas e Interpretaciones del Agente"
            >
              <span>📜</span>
              <span className="hidden sm:inline">Reglas</span>
            </Link>
          </div>

          {/* ACCIONES SUPERIORES */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Botón Flotante IA */}
            <button
              onClick={openChatDrawer}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-linear-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/25 transition-all cursor-pointer font-display min-h-11 touch-manipulation"
              title="Abrir Asistente Táctico de IA (Juez, Rulings & Combos)"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>IA</span>
            </button>

            {/* Botón Acceso Rápido Valoración / Reporte Financiero */}
            <button
              type="button"
              onClick={() => state.setIsValuationModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 dark:bg-zinc-800 hover:bg-black dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              title="Abrir Reporte Financiero y Valoración de la Colección"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Valoración</span>
            </button>

            <button
              onClick={state.handleNewContainerClick}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nuevo Contenedor</span>
            </button>

            {/* Switcher de Ambiente Colección Ideal */}
            <EnvironmentSwitcher />

            {/* Toggle Global de Tema */}
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

      {/* CORE LAYOUT: SIDEBAR + MAIN VIEW */}
      <div className="flex-1 flex max-w-[1700px] w-full mx-auto">
        
        {/* SIDEBAR COLAPSABLE LATERAL */}
        <CollectionSidebar
          activeTab={state.activeTab}
          setActiveTab={(tab: CollectionTab) => state.setActiveTab(tab)}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
          containersCount={state.locations.length}
          suggestionsCount={suggestionsCount}
          sleevesCount={state.sleeves.length}
          decksCount={state.decks.length}
          totalCardsCount={totalCardsInCollection}
          inboxCount={state.inboxCards.length}
          onOpenInbox={state.handleOpenInbox}
          onNewContainerClick={state.handleNewContainerClick}
          onPrefetchFullCollection={state.prefetchFullCollection}
        />

        {/* CONTENIDO PRINCIPAL DE LA VISTA SELECCIONADA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 pb-24 lg:pb-8">
          
          {/* BARRA DE NAVEGACIÓN RÁPIDA PARA MÓVIL (< lg) */}
          <div className="lg:hidden mb-4 overflow-x-auto scrollbar-none flex items-center gap-1.5 p-1 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            {[
              { id: 'containers' as const, label: 'Contenedores', icon: '📦', count: state.locations.length },
              { id: 'valuation' as const, label: 'Costos & Valor', icon: '💰' },
              { id: 'complete' as const, label: 'Colección', icon: '🃏', count: totalCardsInCollection },
              { id: 'decks' as const, label: 'Decks', icon: '📋', count: state.decks.length },
              { id: 'sleeves' as const, label: 'Fundas', icon: '🛡️', count: state.sleeves.length },
              { id: 'suggestions' as const, label: 'Sugerencias', icon: '✨', count: suggestionsCount },
            ].map((tabItem) => {
              const isActive = state.activeTab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => state.setActiveTab(tabItem.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all cursor-pointer touch-manipulation min-h-11 ${
                    isActive
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>{tabItem.icon}</span>
                  <span>{tabItem.label}</span>
                  {tabItem.count !== undefined && tabItem.count > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-px rounded-full font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {tabItem.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* AREA PRINCIPAL */}
            <div className={`${state.activeTab === 'containers' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>
              
              {/* TAB CONTAINER VIEWS CONTROLLER */}
              {state.activeTab === 'containers' ? (
                <ContainersTab
                  loading={state.loading}
                  locations={state.locations}
                  decks={state.decks}
                  inboxCount={state.inboxCards.length}
                  handleOpenContainer={state.handleOpenContainer}
                  handleOpenInbox={state.handleOpenInbox}
                  handleOrganizeInbox={() => state.setIsOrganizeOpen(true)}
                  handleEditContainerClick={state.handleEditContainerClick}
                  handleCopyStorage={state.handleCopyStorage}
                  handleDeleteStorage={state.handleDeleteStorage}
                  handleDropDeck={state.handleDropDeck}
                  handleNewContainerClick={state.handleNewContainerClick}
                  onDeckClick={handleOpenDeck}
                  onRefreshData={state.fetchCollectionData}
                />
              ) : state.activeTab === 'valuation' ? (
                <ValuationTab
                  userCards={state.masterCollectionCards.length > 0 ? state.masterCollectionCards : state.allCollectionCards}
                  locations={state.locations}
                  decks={state.decks}
                  onOpenContainer={(containerId) => {
                    const loc = state.locations.find((l) => l.id === containerId);
                    if (loc) state.handleOpenContainer(loc);
                  }}
                  onOpenDeck={handleOpenDeck}
                />
              ) : state.activeTab === 'suggestions' ? (
                <SuggestionsTab
                  allUserCards={state.masterCollectionCards.length > 0 ? state.masterCollectionCards : state.allCollectionCards}
                  locations={state.locations}
                  decks={state.decks}
                  onCreateDeckFromArchetype={handleCreateDeckFromArchetype}
                  onOpenConsolidateCard={state.handleOpenConsolidateForCard}
                  onOrganizeInbox={() => state.setIsOrganizeOpen(true)}
                  onOpenContainer={(containerId) => {
                    const loc = state.locations.find(l => l.id === containerId);
                    if (loc) state.handleOpenContainer(loc);
                  }}
                />
              ) : state.activeTab === 'sleeves' ? (
                <SleevesTab
                  loadingSleeves={state.loadingSleeves}
                  sleeves={state.sleeves}
                  allUserCards={state.masterCollectionCards.length > 0 ? state.masterCollectionCards : state.allCollectionCards}
                  decks={state.decks}
                  locations={state.locations}
                  setEditingSleeve={state.setEditingSleeve}
                  setIsSleeveFormOpen={state.setIsSleeveFormOpen}
                  handleDeleteSleeve={state.handleDeleteSleeve}
                  onAddStock={state.handleOpenAddStock}
                  onAddSleeveClick={state.handleOpenCreateSleeve}
                />
              ) : state.activeTab === 'decks' ? (
                <DecksTab
                  loading={state.loading}
                  decks={state.decks}
                  locations={state.locations}
                  sleeves={state.sleeves}
                  allUserCards={state.masterCollectionCards.length > 0 ? state.masterCollectionCards : state.allCollectionCards}
                  setDecks={state.setDecks}
                  onDeckClick={handleOpenDeck}
                  onRefreshData={state.fetchCollectionDataSilently}
                  handleDeleteDeck={state.handleDeleteDeck}
                />
              ) : (
                <CollectionCardsTab
                  activeTab={state.activeTab}
                  allSearchQuery={state.allSearchQuery}
                  setAllSearchQuery={state.setAllSearchQuery}
                  locationFilter={state.locationFilter}
                  setLocationFilter={state.setLocationFilter}
                  deckFilter={state.deckFilter}
                  setDeckFilter={state.setDeckFilter}
                  decks={state.decks}
                  locations={state.locations}
                  allCollectionFilters={state.allCollectionFilters}
                  setAllCollectionFilters={state.setAllCollectionFilters}
                  loadingAllCards={state.loadingAllCards}
                  allCollectionCards={state.allCollectionCards}
                  handleToggleFavorite={state.handleToggleFavorite}
                  handleDeleteCard={state.handleDeleteCard}
                  handleUpdateCardStatus={state.handleUpdateCardStatus}
                  isSelectMode={state.isSelectMode}
                  setIsSelectMode={state.setIsSelectMode}
                  selectedCardIds={state.selectedCardIds}
                  onToggleSelectCard={state.toggleSelectCard}
                  onSelectAll={state.selectAllCards}
                  onClearSelection={state.clearCardSelection}
                  onOpenSplitModal={state.handleOpenSplitModal}
                  duplicateMap={state.crossContainerDuplicatesMap}
                  onOpenContainer={(loc) => state.handleOpenContainer(loc)}
                  onCardContextMenu={(uc) => {
                    const targetLoc = uc.storage_location_id 
                      ? state.locations.find(l => l.id === uc.storage_location_id) || null
                      : null;
                    if (targetLoc) {
                      state.handleOpenContainer(targetLoc);
                    } else {
                      state.handleOpenInbox();
                    }
                  }}
                />
              )}
            </div>

            {/* RIGHT SIDEBAR PANEL: DECKS DIRECTORY LIST (Exclusivo en 'containers' y solo laptop/desktop) */}
            {state.activeTab === 'containers' && (
              <aside className="hidden lg:block lg:col-span-4 sticky top-20 self-start z-10 w-full">
                <DecksPanel
                  decks={state.decks}
                  locations={state.locations}
                  setDecks={state.setDecks}
                  handleDragStart={handleDragStart}
                  onDeckClick={handleOpenDeck}
                />
              </aside>
            )}

          </div>
        </main>
      </div>

      {/* POPUPS & MODALS PORTS */}
      <StorageFormModal
        isOpen={state.isFormOpen}
        onClose={() => {
          state.setIsFormOpen(false);
          state.setEditingLocation(null);
        }}
        onSubmit={state.handleSaveStorage}
        initialData={state.editingLocation}
      />

      {/* WORKSPACE UNIFICADO DE 3 PANELES PARA TODOS LOS CONTENEDORES */}
      <UniversalContainerWorkspaceModal
        isOpen={state.isWorkspaceOpen}
        onClose={state.handleCloseWorkspace}
        onMutate={state.fetchCollectionDataSilently}
        location={state.selectedLocation}
        locations={state.locations}
        allCollectionCards={state.allCollectionCards}
        onSelectLocation={(loc) => {
          if (loc.id === 'inbox') {
            state.handleOpenInbox();
          } else {
            state.handleOpenContainer(loc);
          }
        }}
        sleeves={state.sleeves}
        decks={state.decks}
        onDeckClick={handleOpenDeck}
      />

      <SmartOrganizeModal
        isOpen={state.isOrganizeOpen}
        onClose={() => state.setIsOrganizeOpen(false)}
        onSuccess={state.fetchCollectionDataSilently}
      />

      <SleevingAdvisorModal
        isOpen={state.isSleevesOpen}
        onClose={() => state.setIsSleevesOpen(false)}
      />

      <SleeveInventoryFormModal
        isOpen={state.isSleeveFormOpen}
        availableSleeves={state.sleeves}
        initialTab={state.sleeveFormTab}
        initialSleeveId={state.sleeveFormInitialId}
        initialCategory={state.sleeveFormInitialCategory}
        editingSleeve={state.editingSleeve}
        onClose={() => {
          state.setIsSleeveFormOpen(false);
          state.setEditingSleeve(null);
          state.setSleeveFormInitialId(undefined);
          state.setSleeveFormInitialCategory(undefined);
        }}
        onSuccess={async () => {
          await state.fetchSleeves();
        }}
      />

      <UniversalDeckWorkspaceModal
        key={selectedDeck?.id || 'none'}
        deck={selectedDeck}
        isOpen={isDeckDetailsOpen}
        onClose={handleCloseDeck}
        onSelectDeck={(d) => handleOpenDeck(d)}
        locations={state.locations}
        decks={state.decks}
        sleeves={state.sleeves}
        allUserCards={state.allCollectionCards}
        onSuccess={state.fetchCollectionDataSilently}
        handleDeleteDeck={state.handleDeleteDeck}
      />

      {/* Modal de Separar Copia Individual en Colección Principal */}
      <CardCopySplitModal
        isOpen={state.isSplitModalOpen}
        onClose={state.handleCloseSplitModal}
        userCard={state.cardToSplit}
        onConfirmSplit={state.handleSplitCopies}
      />

      {/* Modal de Consolidación Directa de Copias Dispersas */}
      <PickListConsolidationModal
        isOpen={state.isConsolidateOpen}
        onClose={state.handleCloseConsolidate}
        selectedCards={state.consolidationCards}
        title={state.consolidationTitle || 'Consolidar Copias'}
        subtitle="Unifica todas las copias dispersas de esta carta en un solo contenedor físico o carpeta."
        allCollectionCards={state.masterCollectionCards.length > 0 ? state.masterCollectionCards : state.allCollectionCards}
        locations={state.locations}
        onSuccess={() => {
          state.fetchCollectionDataSilently();
          state.handleCloseConsolidate();
        }}
      />

      {/* Barra Flotante de Acciones en Bloque en Vista Principal de Colección */}
      {!state.isWorkspaceOpen && (state.activeTab === 'complete' || state.activeTab === 'favorites') && (
        <BulkActionsFloatingBar
          selectedCount={state.selectedCardsCount}
          totalPhysicalCount={state.selectedPhysicalCount}
          locations={state.locations}
          currentLocationId={null}
          onClearSelection={state.clearCardSelection}
          onMove={state.handleBulkMove}
          onChangeStatus={state.handleBulkChangeStatus}
          onChangeCondition={state.handleBulkChangeCondition}
          onDelete={state.handleBulkDelete}
          onSplitSingleCard={() => state.handleOpenSplitModal()}
          canSplitSingleCard={state.canSplitSingleCard}
        />
      )}

      {/* Modal de Reporte Financiero y Valoración Completa */}
      <CollectionValuationModal
        isOpen={state.isValuationModalOpen}
        onClose={() => state.setIsValuationModalOpen(false)}
        userCards={state.allCollectionCards}
        locations={state.locations}
        decks={state.decks}
        onOpenContainer={(containerId) => {
          const loc = state.locations.find((l) => l.id === containerId);
          if (loc) state.handleOpenContainer(loc);
        }}
        onOpenDeck={handleOpenDeck}
      />
    </div>
  );
}
