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
  Heart
} from 'lucide-react';

// Custom State Hook
import { useCollectionState } from '@/components/collection/hooks/useCollectionState';

// Modular UI Subcomponents
import { UnsortedInboxBanner } from '@/components/collection/components/UnsortedInboxBanner';
import { ContainersTab } from '@/components/collection/components/ContainersTab';
import { CollectionCardsTab } from '@/components/collection/components/CollectionCardsTab';
import { SleevesTab } from '@/components/collection/components/SleevesTab';
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

  return (
    <div className="flex flex-col min-h-screen bg-[hsl(224,25%,6%)] text-[hsl(210,40%,98%)] font-sans antialiased">
      
      {/* HEADER */}
      <header className="border-b border-[hsl(224,15%,16%)] bg-[hsl(224,22%,10%)]/90 backdrop-blur-md sticky top-0 z-40 py-4 px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-[hsl(263,85%,64%)] to-[hsl(180,80%,45%)] flex items-center justify-center font-bold text-xl shadow-lg shadow-[hsl(263,85%,64%)]/20">
            YG
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Mi Colección</h1>
            <p className="text-xs text-[hsl(215,15%,70%)]">Gestión de Almacenamiento y Binders</p>
          </div>
        </div>

        {/* TOP NAVIGATION TABS */}
        <div className="flex gap-2 bg-[hsl(224,25%,6%)] p-1 rounded-xl border border-[hsl(224,15%,16%)]">
          <Link
            href="/"
            className="px-4 py-2 rounded-lg font-medium text-xs text-[hsl(215,15%,70%)] hover:text-white transition-all duration-300 cursor-pointer flex items-center gap-1"
          >
            🛠️ Constructor
          </Link>
          <Link
            href="/?tab=breakdowns"
            className="px-4 py-2 rounded-lg font-medium text-xs text-[hsl(215,15%,70%)] hover:text-white transition-all duration-300 cursor-pointer flex items-center gap-1"
          >
            📊 Breakdowns Meta
          </Link>
          <button
            className="px-4 py-2 rounded-lg font-medium text-xs bg-zinc-800 text-white transition-all duration-300 cursor-default flex items-center gap-1"
          >
            📦 Mi Colección
          </button>
        </div>

        {/* QUICK COLLECTION ACTIONS BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => state.setIsManualCardOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-[hsl(180,80%,45%)]/40 hover:text-white rounded-xl text-xs font-semibold text-[hsl(215,15%,70%)] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Añadir Carta Manual</span>
          </button>

          <button
            onClick={() => state.setIsYdkOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-[hsl(180,80%,45%)]/40 hover:text-white rounded-xl text-xs font-semibold text-[hsl(215,15%,70%)] transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>Importar .YDK</span>
          </button>

          <button
            onClick={() => state.setIsOrganizeOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-[hsl(180,80%,45%)]/40 hover:text-white rounded-xl text-xs font-semibold text-[hsl(215,15%,70%)] transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Organizador Inteligente</span>
          </button>

          <button
            onClick={() => state.setIsSleevesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-[hsl(180,80%,45%)]/40 hover:text-white rounded-xl text-xs font-semibold text-[hsl(215,15%,70%)] transition-all cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Recomendador Fundas</span>
          </button>

          <button
            onClick={state.handleNewContainerClick}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[hsl(263,85%,64%)] text-white hover:bg-[hsl(263,85%,58%)] rounded-xl text-xs font-bold transition-all shadow-md shadow-[hsl(263,85%,64%)]/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Contenedor</span>
          </button>
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
          <div className="lg:col-span-8 space-y-4">
            
            <div className="flex flex-wrap items-center justify-between border-b border-[hsl(224,15%,16%)] pb-2.5 gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => state.setActiveTab('containers')}
                  className={`font-bold text-sm uppercase tracking-wider flex items-center gap-2 pb-2 border-b-2 transition-all cursor-pointer ${
                    state.activeTab === 'containers' 
                      ? 'border-[hsl(263,85%,64%)] text-white' 
                      : 'border-transparent text-[hsl(215,15%,70%)] hover:text-slate-200'
                  }`}
                >
                  <Box className="w-4 h-4" />
                  <span>Almacenamiento ({state.locations.length})</span>
                </button>
                <button
                  onClick={() => state.setActiveTab('complete')}
                  className={`font-bold text-sm uppercase tracking-wider flex items-center gap-2 pb-2 border-b-2 transition-all cursor-pointer ${
                    state.activeTab === 'complete' 
                      ? 'border-[hsl(263,85%,64%)] text-white' 
                      : 'border-transparent text-[hsl(215,15%,70%)] hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
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
                  <Heart className={`w-4 h-4 ${state.activeTab === 'favorites' ? 'fill-pink-500 text-pink-500' : ''}`} />
                  <span>Favoritas</span>
                </button>
                <button
                  onClick={() => state.setActiveTab('sleeves')}
                  className={`font-bold text-sm uppercase tracking-wider flex items-center gap-2 pb-2 border-b-2 transition-all cursor-pointer ${
                    state.activeTab === 'sleeves' 
                      ? 'border-cyan-400 text-cyan-300' 
                      : 'border-transparent text-[hsl(215,15%,70%)] hover:text-slate-200'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Mis Fundas ({state.sleeves.length})</span>
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
              />
            ) : state.activeTab === 'sleeves' ? (
              <SleevesTab
                loadingSleeves={state.loadingSleeves}
                sleeves={state.sleeves}
                setEditingSleeve={state.setEditingSleeve}
                setIsSleeveFormOpen={state.setIsSleeveFormOpen}
                handleDeleteSleeve={state.handleDeleteSleeve}
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

          {/* RIGHT SIDEBAR PANEL: DECKS DIRECTORY LIST */}
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
