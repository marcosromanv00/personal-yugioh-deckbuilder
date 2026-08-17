'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Box, 
  Upload, 
  Sparkles, 
  Shield, 
  Plus, 
  Layers, 
  Heart,
  FileText,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';

// Custom State Hook
import { useCollectionState } from '@/components/collection/hooks/useCollectionState';

// Modular UI Subcomponents
import { UnsortedInboxBanner } from '@/components/collection/components/UnsortedInboxBanner';
import { ContainersTab } from '@/components/collection/components/ContainersTab';
import { CollectionCardsTab } from '@/components/collection/components/CollectionCardsTab';
import { SleevesTab } from '@/components/collection/components/SleevesTab';
import { DecksTab } from '@/components/collection/components/DecksTab';
import { DecksPanel } from '@/components/collection/components/DecksPanel';

// Collection Modals
import { StorageFormModal } from '@/components/collection/StorageFormModal';
import { GamifiedInventoryModal } from '@/components/collection/GamifiedInventoryModal';
import { YdkUploadModal } from '@/components/collection/YdkUploadModal';
import { SmartOrganizeModal } from '@/components/collection/SmartOrganizeModal';
import { SleevingAdvisorModal } from '@/components/collection/SleevingAdvisorModal';
import { ManualCardAdderModal } from '@/components/collection/ManualCardAdderModal';
import { SleeveInventoryFormModal } from '@/components/collection/SleeveInventoryFormModal';
import { DeckDetailsModal } from '@/components/collection/DeckDetailsModal';
import { BinderBuilderModal } from '@/components/collection/components/BinderBuilderModal';
import { Deck } from '@/types/collection';

/**
 * CollectionPage Component
 * Manages physical collection directories, container allocations, card portfolios,
 * sleeves registry, and imports tools. Uses modular components and useCollectionState hook.
 */
export default function CollectionPage() {
  const state = useCollectionState();
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [isDeckDetailsOpen, setIsDeckDetailsOpen] = useState(false);

  const handleDragStart = (e: React.DragEvent, deckId: string) => {
    e.dataTransfer.setData('text/plain', deckId);
  };

  const totalCardsInCollection = state.locations.reduce((acc, l) => acc + (l.occupied_cards || 0), 0) + state.inboxCards.length;

  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased transition-colors duration-200">
      
      {/* HEADER UNIFICADO EXORDIO */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 h-16 flex items-center shadow-xs">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
          {/* Identidad */}
          <div className="flex items-center gap-3">
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
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 shrink-0">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🛠️</span>
              <span className="hidden sm:inline">Taller</span>
            </Link>
            <Link
              href="/?tab=exordio"
              className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>📊</span>
              <span className="hidden sm:inline">Análisis</span>
            </Link>
            <Link
              href="/?tab=breakdowns"
              className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>📈</span>
              <span className="hidden sm:inline">Meta</span>
            </Link>
            <button
              className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs transition-all cursor-default flex items-center gap-1.5"
            >
              <span>📦</span>
              <span className="hidden sm:inline">Colección</span>
            </button>
          </div>

          {/* QUICK COLLECTION ACTIONS BUTTONS */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => state.setIsManualCardOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-500 hover:text-red-500 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Añadir Carta</span>
            </button>

            <button
              onClick={() => state.setIsYdkOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-cyan-500 hover:text-cyan-500 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-500" />
              <span className="hidden md:inline">Importar .YDK</span>
            </button>

            <button
              onClick={state.handleNewContainerClick}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Contenedor</span>
            </button>

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

      {/* CORE CONTENT */}
      <main className="flex-1 p-6 sm:p-8 max-w-[1600px] mx-auto w-full space-y-8">
        
        {/* Unsorted Inbox Alert Header */}
        <UnsortedInboxBanner
          inboxCount={state.inboxCards.length}
          onOrganizeClick={() => state.setIsOrganizeOpen(true)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT AREA: MAIN TABS DISPLAY */}
          <div className={`${state.activeTab === 'decks' ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-4`}>
            
            <div className="flex flex-wrap items-center justify-between border-b border-[hsl(224,15%,16%)] pb-2.5 gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => state.setActiveTab('containers')}
                  className={`font-bold text-sm uppercase tracking-wider flex items-center gap-2 pb-2 border-b-2 transition-all cursor-pointer ${
                    state.activeTab === 'containers' 
                      ? 'border-[hsl(263,85%,64%)] text-white' 
                      : 'border-transparent text-[hsl(215,15%,70%)] hover:text-slate-200'
                  }`}
                >
                  <Box className="w-4 h-4 text-purple-400" />
                  <span>Almacenamiento ({state.locations.length})</span>
                </button>
                <button
                  onClick={() => state.setActiveTab('sleeves')}
                  className={`font-bold text-sm uppercase tracking-wider flex items-center gap-2 pb-2 border-b-2 transition-all cursor-pointer ${
                    state.activeTab === 'sleeves' 
                      ? 'border-cyan-400 text-cyan-300' 
                      : 'border-transparent text-[hsl(215,15%,70%)] hover:text-slate-200'
                  }`}
                >
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Mis Fundas ({state.sleeves.length})</span>
                </button>
                <button
                  onClick={() => state.setActiveTab('decks')}
                  className={`font-bold text-sm uppercase tracking-wider flex items-center gap-2 pb-2 border-b-2 transition-all cursor-pointer ${
                    state.activeTab === 'decks' 
                      ? 'border-[hsl(263,85%,64%)] text-white' 
                      : 'border-transparent text-[hsl(215,15%,70%)] hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Mis Decks ({state.decks.length})</span>
                </button>
                <button
                  onClick={() => state.setActiveTab('complete')}
                  className={`font-bold text-sm uppercase tracking-wider flex items-center gap-2 pb-2 border-b-2 transition-all cursor-pointer ${
                    state.activeTab === 'complete' 
                      ? 'border-[hsl(263,85%,64%)] text-white' 
                      : 'border-transparent text-[hsl(215,15%,70%)] hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Colección Completa ({totalCardsInCollection})</span>
                </button>
                <button
                  onClick={() => state.setActiveTab('favorites')}
                  className={`font-bold text-sm uppercase tracking-wider flex items-center gap-2 pb-2 border-b-2 transition-all cursor-pointer ${
                    state.activeTab === 'favorites' 
                      ? 'border-pink-500 text-pink-400' 
                      : 'border-transparent text-[hsl(215,15%,70%)] hover:text-slate-200'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${state.activeTab === 'favorites' ? 'fill-pink-500 text-pink-500' : 'text-pink-400'}`} />
                  <span>Favoritas</span>
                </button>
              </div>
            </div>

            {/* TAB CONTAINER VIEWS CONTROLLER */}
            {state.activeTab === 'containers' ? (
              <ContainersTab
                loading={state.loading}
                locations={state.locations}
                decks={state.decks}
                handleOpenContainer={state.handleOpenContainer}
                handleEditContainerClick={state.handleEditContainerClick}
                handleCopyStorage={state.handleCopyStorage}
                handleDeleteStorage={state.handleDeleteStorage}
                handleDropDeck={state.handleDropDeck}
                handleNewContainerClick={state.handleNewContainerClick}
                onDeckClick={(deck) => {
                  setSelectedDeck(deck);
                  setIsDeckDetailsOpen(true);
                }}
              />
            ) : state.activeTab === 'sleeves' ? (
              <SleevesTab
                loadingSleeves={state.loadingSleeves}
                sleeves={state.sleeves}
                setEditingSleeve={state.setEditingSleeve}
                setIsSleeveFormOpen={state.setIsSleeveFormOpen}
                handleDeleteSleeve={state.handleDeleteSleeve}
              />
            ) : state.activeTab === 'decks' ? (
              <DecksTab
                decks={state.decks}
                locations={state.locations}
                sleeves={state.sleeves}
                setDecks={state.setDecks}
                onDeckClick={(deck) => {
                  setSelectedDeck(deck);
                  setIsDeckDetailsOpen(true);
                }}
                onRefreshData={state.fetchCollectionData}
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
              />
            )}
          </div>

          {/* RIGHT SIDEBAR PANEL: DECKS DIRECTORY LIST (Oculto cuando activeTab === 'decks' para aprovechar todo el ancho) */}
          {state.activeTab !== 'decks' && (
            <DecksPanel
              decks={state.decks}
              locations={state.locations}
              setDecks={state.setDecks}
              handleDragStart={handleDragStart}
              onDeckClick={(deck) => {
                setSelectedDeck(deck);
                setIsDeckDetailsOpen(true);
              }}
            />
          )}

        </div>
      </main>

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

      <GamifiedInventoryModal
        location={state.selectedLocation}
        isOpen={state.isInventoryOpen}
        onClose={() => state.setIsInventoryOpen(false)}
        decks={state.decks}
        onRefreshData={state.fetchCollectionData}
        onDeckClick={(deck) => {
          setSelectedDeck(deck);
          setIsDeckDetailsOpen(true);
        }}
      />

      <YdkUploadModal
        isOpen={state.isYdkOpen}
        onClose={() => state.setIsYdkOpen(false)}
        onSuccess={state.fetchCollectionData}
      />

      <SmartOrganizeModal
        isOpen={state.isOrganizeOpen}
        onClose={() => state.setIsOrganizeOpen(false)}
        onSuccess={state.fetchCollectionData}
      />

      <SleevingAdvisorModal
        isOpen={state.isSleevesOpen}
        onClose={() => state.setIsSleevesOpen(false)}
      />

      <ManualCardAdderModal
        isOpen={state.isManualCardOpen}
        onClose={() => state.setIsManualCardOpen(false)}
        locations={state.locations}
        onSuccess={state.fetchCollectionData}
      />

      <SleeveInventoryFormModal
        isOpen={state.isSleeveFormOpen}
        onClose={() => {
          state.setIsSleeveFormOpen(false);
          state.setEditingSleeve(null);
        }}
        onSuccess={state.fetchSleeves}
        editingSleeve={state.editingSleeve}
      />

      <DeckDetailsModal
        key={selectedDeck?.id || 'none'}
        deck={selectedDeck}
        isOpen={isDeckDetailsOpen}
        onClose={() => {
          setIsDeckDetailsOpen(false);
          setSelectedDeck(null);
        }}
        locations={state.locations}
        decks={state.decks}
        onSuccess={state.fetchCollectionData}
      />

      <BinderBuilderModal
        isOpen={state.isBinderBuilderOpen}
        binderId={state.selectedBinderId}
        onClose={state.handleCloseBinderBuilder}
      />
    </div>
  );
}
