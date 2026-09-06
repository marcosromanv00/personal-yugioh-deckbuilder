'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/ui/ToastProvider';
import { useTheme } from '@/components/ui/ThemeProvider';
import { useAIChat } from '@/context/AIChatContext';
import { usePanelResize } from './hooks/usePanelResize';
import { useCardHoverPreview } from './hooks/useCardHoverPreview';
import { useDeckBuilderState } from './hooks/useDeckBuilderState';
import { useDeckVariants } from './hooks/useDeckVariants';
import { useDeckBuilderShortcuts } from './hooks/useDeckBuilderShortcuts';
import { useDeckCardOperations } from './hooks/useDeckCardOperations';
import { useDeckBuilderSearchSync } from './hooks/useDeckBuilderSearchSync';
import { useDeckBuilderLayoutProps } from './hooks/useDeckBuilderLayoutProps';
import { useDeckBuilderModalsState } from './hooks/useDeckBuilderModalsState';
import { Card, DeckCard, HoverCardBase } from './types';
import { MobileNav, type MobileTab } from './components/MobileNav';
import { DeckBuilderHeader } from './components/DeckBuilderHeader';
import { DeckBuilderModals } from './components/DeckBuilderModals';
import { DeckBuilderMainLayout } from './components/DeckBuilderMainLayout';
import { ArchetypesBreakdownsView } from './components/ArchetypesBreakdownsView';
import { DeckBuilderDrawers } from './components/DeckBuilderDrawers';

const ExordioAnalyticsDashboard = dynamic(
  () => import('./exordio/ExordioAnalyticsDashboard').then((m) => m.ExordioAnalyticsDashboard),
  { ssr: false }
);

const preloadSaveModal = () => { void import('./components/SaveDeckModal'); };

export default function DeckBuilder() {
  const state = useDeckBuilderState();
  const resize = usePanelResize();
  const preview = useCardHoverPreview();
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const { openChatDrawer } = useAIChat();

  const [sortBy, setSortBy] = useState<string>('default');
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('deck');
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<'detail' | 'meta' | 'collection' | 'analysis'>('detail');
  const [selectedDetailCard, setSelectedDetailCard] = useState<Card | DeckCard | HoverCardBase | null>(null);

  const variantsManager = useDeckVariants({
    deckId: state.deckId,
    deckCards: state.deckCards,
    setDeckCards: state.setDeckCards,
    initialVariants: state.loadedVariants,
  });

  const modalsState = useDeckBuilderModalsState({
    deckId: state.deckId,
    deckName: state.deckName,
    deleteDeck: state.handleDeleteDeck,
    toast,
  });

  const handleQuickSaveClick = useCallback(async () => {
    if (state.deckCards.length === 0) {
      toast.warning('Agrega cartas a la baraja antes de guardar.');
      return;
    }
    if (!state.deckId) {
      state.handleOpenSaveModal();
      return;
    }
    try {
      const success = await state.handleQuickSaveDeck();
      if (success) {
        if (variantsManager.activeVariant) {
          await variantsManager.handleSaveActiveVariantCards(state.deckCards);
        }
        toast.success(`¡"${variantsManager.activeVariant?.name || state.deckName}" guardado con éxito!`);
      }
    } catch (e) {
      console.error('Error en guardado rápido:', e);
      toast.error('Error al guardar la baraja.');
    }
  }, [state, variantsManager, toast]);

  const shortcuts = useDeckBuilderShortcuts({
    isDirty: state.isDirty,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    handleUndo: state.handleUndo,
    handleRedo: state.handleRedo,
    handleQuickSave: handleQuickSaveClick,
    showToastInfo: toast.info,
  });

  const handleSelectCardForDetail = useCallback((card: Card | DeckCard | HoverCardBase) => {
    setSelectedDetailCard(card);
    setActiveRightTab('detail');
    state.addRecentCard(card);
    if (!resize.rightPanelOpen) resize.setRightPanelOpen(true);
  }, [resize, state]);

  const cardOps = useDeckCardOperations({
    deckCards: state.deckCards, format: state.format, allUserCards: state.allUserCards,
    locations: state.locations, addCardToDeck: state.addCardToDeck, removeCardFromDeck: state.removeCardFromDeck,
    removeCopyFromDeck: state.removeCopyFromDeck, reorderDeckCards: state.reorderDeckCards,
    addRecommendedCard: state.addRecommendedCard, addRecentCard: state.addRecentCard,
    handleUndo: state.handleUndo, setDeckCards: state.setDeckCards,
    onCardSelectedForDetail: handleSelectCardForDetail,
    showToastSuccess: toast.success, showToastInfo: toast.info, showToastError: toast.error,
    onResetSort: () => { if (sortBy !== 'default') setSortBy('default'); },
  });

  useDeckBuilderSearchSync(state);

  const onOpenNewVariant = useCallback(() => {
    if (!state.deckId) {
      toast.info('Guarda tu deck primero para poder registrar sus variantes.');
      state.setIsSaveModalOpen(true);
      return;
    }
    variantsManager.setIsNewVariantModalOpen(true);
  }, [state, variantsManager, toast]);

  const layoutProps = useDeckBuilderLayoutProps({
    state, variantsManager, cardOps, preview, sortBy, setSortBy, activeRightTab, setActiveRightTab,
    selectedDetailCard, onSelectCardForDetail: handleSelectCardForDetail,
    onOpenNewVariantModal: onOpenNewVariant,
    onSelectVariantGuarded: (target) => state.isDirty ? modalsState.setPendingVariantSwitch(target) : variantsManager.handleOpenDiff(target),
    handleQuickSaveClick, showToastInfo: toast.info,
  });

  return (
    <div className="flex flex-col min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased transition-colors duration-200">
      <DeckBuilderHeader
        state={state} shortcuts={shortcuts} modalsState={modalsState}
        variantsManager={variantsManager} handleQuickSaveClick={handleQuickSaveClick}
        openChatDrawer={openChatDrawer} theme={theme} toggleTheme={toggleTheme}
        preloadSaveModal={preloadSaveModal} onOpenSaveModalWithToast={onOpenNewVariant}
        showToastSuccess={toast.success}
      />

      {state.activeView === 'builder' ? (
        <DeckBuilderMainLayout
          resize={resize} state={state} modalsState={modalsState}
          layoutProps={layoutProps} activeMobileTab={activeMobileTab}
          setActiveMobileTab={setActiveMobileTab} mobileMoreOpen={mobileMoreOpen}
          setMobileMoreOpen={setMobileMoreOpen} showToastSuccess={toast.success}
        />
      ) : state.activeView === 'exordio' ? (
        <div className="flex-1 min-h-0 w-full pb-20 md:pb-8 overflow-y-auto">
          <ExordioAnalyticsDashboard
            deckCards={state.deckCards} inferredArchetype={state.inferredArchetype} format={state.format}
            onApplyGeneratedDeck={cardOps.handleApplyGeneratedDeck}
            onCardClick={(c) => preview.openPreviewForCard(c)} onClose={() => state.setActiveView('builder')}
          />
        </div>
      ) : (
        <ArchetypesBreakdownsView
          onBackToBuilder={() => state.setActiveView('builder')} searchQuery={state.archetypeSearchQuery}
          onSearchQueryChange={state.setArchetypeSearchQuery} isFetching={state.isFetchingArchetypes}
          archetypesList={state.archetypesList} onSelectArchetype={(arch) => state.openArchetypeBreakdown(arch)}
        />
      )}

      {state.activeView === 'builder' && (
        <MobileNav
          activeTab={activeMobileTab}
          onTabChange={(tab) => (tab === 'more' ? setMobileMoreOpen(true) : setActiveMobileTab(tab))}
          mainCardsCount={layoutProps.mainCardsCount}
        />
      )}

      <DeckBuilderDrawers state={state} cardOps={cardOps} preview={preview} />

      <DeckBuilderModals
        state={state} cardOps={cardOps} shortcuts={shortcuts}
        variantsManager={variantsManager} modalsState={modalsState}
        variantDiff={layoutProps.variantDiff} handleQuickSaveClick={handleQuickSaveClick} toast={toast}
      />
    </div>
  );
}
