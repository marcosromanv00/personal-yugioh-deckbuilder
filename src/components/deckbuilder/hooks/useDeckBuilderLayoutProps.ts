import { useMemo } from 'react';
import { getSortedDeckCards } from '@/lib/deck/deck-sort.utils';
import { computeVariantDiff } from '@/lib/deck/variant-diff.utils';
import { getSleeveColorHex } from '@/lib/sleeves';
import { Card, DeckCard, HoverCardBase } from '../types';
import { DeckVariant } from '@/types/collection';
import { useDeckBuilderState } from './useDeckBuilderState';
import { useDeckVariants } from './useDeckVariants';
import { useDeckCardOperations } from './useDeckCardOperations';
import { useCardHoverPreview } from './useCardHoverPreview';

interface UseDeckBuilderLayoutPropsParams {
  state: ReturnType<typeof useDeckBuilderState>;
  variantsManager: ReturnType<typeof useDeckVariants>;
  cardOps: ReturnType<typeof useDeckCardOperations>;
  preview: ReturnType<typeof useCardHoverPreview>;
  sortBy: string;
  setSortBy: (sort: string) => void;
  activeRightTab: 'detail' | 'meta' | 'collection' | 'analysis';
  setActiveRightTab: (tab: 'detail' | 'meta' | 'collection' | 'analysis') => void;
  selectedDetailCard: Card | DeckCard | HoverCardBase | null;
  onSelectCardForDetail: (card: Card | DeckCard | HoverCardBase) => void;
  onOpenNewVariantModal: () => void;
  onSelectVariantGuarded: (v: DeckVariant) => void;
  handleQuickSaveClick: () => Promise<void>;
  showToastInfo: (msg: string) => void;
}

export function useDeckBuilderLayoutProps({
  state,
  variantsManager,
  cardOps,
  preview,
  sortBy,
  setSortBy,
  activeRightTab,
  setActiveRightTab,
  selectedDetailCard,
  onSelectCardForDetail,
  onOpenNewVariantModal,
  onSelectVariantGuarded,
  handleQuickSaveClick,
  showToastInfo,
}: UseDeckBuilderLayoutPropsParams) {
  const variantDiff = useMemo(() => {
    if (!variantsManager.targetVariantForDiff) return { toRemoveFromActive: [], toAddToActive: [], unchangedCore: [] };
    return computeVariantDiff({
      currentCards: state.deckCards,
      targetCards: variantsManager.targetVariantForDiff.cards || [],
      userCards: state.allUserCards,
      locations: state.locations,
      decks: state.savedDecks,
      currentDeckId: state.deckId,
      currentLocationId: state.targetLocationId,
    });
  }, [variantsManager.targetVariantForDiff, state.deckCards, state.allUserCards, state.locations, state.savedDecks, state.deckId, state.targetLocationId]);

  const mainCardsCount = state.deckCards.filter((c) => c.section === 'main').reduce((acc, c) => acc + c.count, 0);
  const extraCardsCount = state.deckCards.filter((c) => c.section === 'extra').reduce((acc, c) => acc + c.count, 0);
  const sideCardsCount = state.deckCards.filter((c) => c.section === 'side').reduce((acc, c) => acc + c.count, 0);
  const extrasCardsCount = state.deckCards.filter((c) => c.section === 'extras').reduce((acc, c) => acc + c.count, 0);

  const mainSleeve = state.availableSleeves.find((s) => s.id === state.selectedMainSleeveId);
  const extraSleeve = state.availableSleeves.find((s) => s.id === state.selectedExtraSleeveId);
  const mainSleeveColorHex = mainSleeve ? getSleeveColorHex(mainSleeve.color_pattern, state.availableSleeves) : '';
  const extraSleeveColorHex = extraSleeve ? getSleeveColorHex(extraSleeve.color_pattern, state.availableSleeves) : '';

  const selectedDeckCard = selectedDetailCard ? state.deckCards.find((c) => c.id === selectedDetailCard.id) || null : null;
  const activeContextName = variantsManager.activeVariant?.name || state.deckName;

  const sharedDeckSectionProps = {
    format: state.format,
    layoutMode: state.deckLayoutMode,
    deckCards: getSortedDeckCards(state.deckCards, sortBy),
    removeCardFromDeck: cardOps.handleRemoveCardWithFeedback,
    removeCopyFromDeck: state.removeCopyFromDeck,
    handleDragCardStart: cardOps.handleDragCardStart,
    handleDropCardOnSection: cardOps.handleDropCardOnSection,
    onReorderCard: cardOps.handleReorderCard,
    handleCardMouseEnter: preview.handleCardMouseEnter,
    handleCardMouseLeave: preview.handleCardMouseLeave,
    openPreviewForCard: preview.openPreviewForCard,
    onSelectCard: onSelectCardForDetail,
    selectedCardId: selectedDetailCard?.id,
    selectedCopyIndex: selectedDeckCard?.selected_copy_index,
  };

  const deckBoardProps = {
    deckName: state.deckName,
    onUpdateDeckName: state.handleUpdateDeckName,
    variants: variantsManager.variants,
    activeVariant: variantsManager.activeVariant,
    onSelectVariant: onSelectVariantGuarded,
    onOpenNewVariantModal,
    onDeleteVariant: variantsManager.handleDeleteVariant,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    onUndo: () => { state.handleUndo(); showToastInfo('Acción deshecha'); },
    onRedo: () => { state.handleRedo(); showToastInfo('Acción rehecha'); },
    sortBy,
    onSortChange: setSortBy,
    deckLayoutMode: state.deckLayoutMode,
    onLayoutModeChange: state.setDeckLayoutMode,
    banlistAlertCount: state.banlistAlerts.length,
    banlistAlertTooltip: state.banlistAlerts.map((a) => a.message).join('\n'),
    onOpenBanlistAlerts: () => setActiveRightTab('analysis'),
    format: state.format,
    mainCardsCount,
    extraCardsCount,
    sideCardsCount,
    extrasCardsCount,
    mainSleeveColorHex,
    extraSleeveColorHex,
    sharedDeckSectionProps,
    isDirty: state.isDirty,
    hasCards: state.deckCards.length > 0,
    activeContextName,
    loadingDecks: state.loadingDecks,
    onDiscardChanges: state.handleDiscardChanges,
    onQuickSave: handleQuickSaveClick,
  };

  const searchPanelSharedProps = {
    searchQuery: state.searchQuery,
    setSearchQuery: state.setSearchQuery,
    searchScope: state.searchScope,
    setSearchScope: state.setSearchScope,
    recentCardsCount: state.recentCards.length,
    onClearRecentCards: state.clearRecentCards,
    onlyFavorites: state.onlyFavorites,
    setOnlyFavorites: state.setOnlyFavorites,
    searchType: state.searchType,
    setSearchType: state.setSearchType,
    advancedFilters: state.advancedFilters,
    setAdvancedFilters: state.setAdvancedFilters,
    searchResults: state.searchResults,
    isSearching: state.isSearching,
    searchViewMode: state.searchViewMode,
    setSearchViewMode: state.setSearchViewMode,
    searchLimit: state.searchLimit,
    setSearchLimit: state.setSearchLimit,
    format: state.format,
    assignedDraftUserCardIds: state.assignedDraftUserCardIds,
    activeContextName,
    addCardToDeck: cardOps.handleAddCardWithFeedback,
    openPreviewForCard: preview.openPreviewForCard,
    handleDragCardStart: cardOps.handleDragCardStart,
    onDropRemoveCard: cardOps.handleDropRemoveCard,
    handleCardMouseEnter: preview.handleCardMouseEnter,
    handleCardMouseLeave: preview.handleCardMouseLeave,
  };

  const metaPanelSharedProps = {
    activeRightTab,
    setActiveRightTab,
    allUserCards: state.allUserCards,
    locations: state.locations,
    savedDecks: state.savedDecks,
    currentDeckId: state.deckId || null,
    deckCards: state.deckCards,
    selectedDetailCard,
    selectedDeckCard,
    onUpdateDeckCard: cardOps.handleUpdateDeckCard,
    onUpdateCardPhysicalCopy: state.handleUpdateCardPhysicalCopy,
    onResolveConflictAction: state.handleResolveConflictAction,
    onRemoveFromDeck: cardOps.handleRemoveCardWithFeedback,
    onAddCardToDeck: cardOps.handleAddCardWithFeedback,
    onToggleFavorite: state.handleToggleFavorite,
    favoriteCardIds: state.favoriteCardIds,
    availableSleeves: state.availableSleeves,
    format: state.format,
    isAnalyzing: state.isAnalyzing,
    inferredArchetype: state.inferredArchetype,
    detectedArchetypes: state.detectedArchetypes,
    activeArchetypeTab: state.activeArchetypeTab,
    setActiveArchetypeTab: state.setActiveArchetypeTab,
    banlistAlerts: state.banlistAlerts,
    sidebarBreakdownCards: state.sidebarBreakdownCards,
    isFetchingSidebarBreakdown: state.isFetchingSidebarBreakdown,
    fetchSidebarBreakdown: state.fetchSidebarBreakdown,
    cardHistory: state.cardHistory,
    handleDragCardStart: cardOps.handleDragCardStart,
    handleCardMouseEnter: preview.handleCardMouseEnter,
    handleCardMouseLeave: preview.handleCardMouseLeave,
    addRecommendedCard: state.addRecommendedCard,
  };

  return {
    variantDiff,
    mainCardsCount,
    deckBoardProps,
    searchPanelSharedProps,
    metaPanelSharedProps,
  };
}
