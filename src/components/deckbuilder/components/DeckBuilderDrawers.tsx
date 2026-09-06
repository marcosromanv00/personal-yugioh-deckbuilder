import React from 'react';
import { ArchetypeBreakdownDrawer } from './ArchetypeBreakdownDrawer';
import { ReplacementDrawer } from './ReplacementDrawer';
import { useDeckBuilderState } from '../hooks/useDeckBuilderState';
import { useDeckCardOperations } from '../hooks/useDeckCardOperations';
import { useCardHoverPreview } from '../hooks/useCardHoverPreview';

interface DeckBuilderDrawersProps {
  state: ReturnType<typeof useDeckBuilderState>;
  cardOps: ReturnType<typeof useDeckCardOperations>;
  preview: ReturnType<typeof useCardHoverPreview>;
}

export function DeckBuilderDrawers({ state, cardOps, preview }: DeckBuilderDrawersProps) {
  const activeReplacementCard = state.deckCards.find((c) => c.id === state.activeReplacementCardId);
  const activeReplacementsList = state.activeReplacementCardId
    ? state.replacements[state.activeReplacementCardId] || []
    : [];

  return (
    <>
      <ArchetypeBreakdownDrawer
        activeArchetypeBreakdown={state.activeArchetypeBreakdown}
        setActiveArchetypeBreakdown={state.setActiveArchetypeBreakdown}
        isFetchingBreakdown={state.isFetchingBreakdown}
        breakdownCards={state.breakdownCards}
        initializeDeckFromArchetype={state.initializeDeckFromArchetype}
        addRecommendedCard={state.addRecommendedCard}
        handleDragCardStart={cardOps.handleDragCardStart}
        handleCardMouseEnter={preview.handleCardMouseEnter}
        handleCardMouseLeave={preview.handleCardMouseLeave}
      />

      <ReplacementDrawer
        activeReplacementCard={activeReplacementCard}
        activeReplacementCardId={state.activeReplacementCardId}
        setActiveReplacementCardId={state.setActiveReplacementCardId}
        activeReplacementsList={activeReplacementsList}
        currentDeckCards={state.deckCards}
        inferredArchetype={state.inferredArchetype}
        addRecommendedCard={state.addRecommendedCard}
        removeCardFromDeck={state.removeCardFromDeck}
        handleCardMouseEnter={preview.handleCardMouseEnter}
        handleCardMouseLeave={preview.handleCardMouseLeave}
      />
    </>
  );
}
