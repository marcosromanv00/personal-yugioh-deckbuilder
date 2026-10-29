'use client';

import React, { useState } from 'react';
import { UserCard, StorageLocation, Deck } from '@/types/collection';
import { TriageCardActionPayload } from '@/types/triage';
import { useTriageState } from './hooks/useTriageState';
import { useTriageCardMutations } from './hooks/useTriageCardMutations';
import { useTriageKeyboardShortcuts } from './hooks/useTriageKeyboardShortcuts';
import { TriageHeaderScopeSelector } from './TriageHeaderScopeSelector';
import { TriageQueueFilmstrip } from './TriageQueueFilmstrip';
import { TriageActiveCardViewer } from './TriageActiveCardViewer';
import { TriageDiagnosticPanel } from './TriageDiagnosticPanel';
import { TriageActionButtonBar } from './TriageActionButtonBar';
import { TriageRarityPricingModal } from './TriageRarityPricingModal';
import { TriageThematicModal } from './TriageThematicModal';
import { TriageDisagreementFeedbackModal } from './components/TriageDisagreementFeedbackModal';

interface TriageWorkstationProps {
  initialCards: UserCard[];
  locations: StorageLocation[];
  decks: Deck[];
  initialLocationId?: string | null;
  initialCompartmentIndex?: number | null;
}

export const TriageWorkstation: React.FC<TriageWorkstationProps> = ({
  initialCards,
  locations,
  decks,
  initialLocationId,
  initialCompartmentIndex,
}) => {
  const state = useTriageState({ initialCards, locations, decks, initialLocationId, initialCompartmentIndex });
  const mutations = useTriageCardMutations({ onCardUpdated: state.handleCardUpdated, onUndoSuccess: state.handleUndoSuccess });
  const [isDisagreementModalOpen, setIsDisagreementModalOpen] = useState(false);

  const handleExecuteAction = (
    destinationType: TriageCardActionPayload['destinationType'],
    overrideThemeTag?: string,
    overrideSalePrice?: number,
    userReason?: string
  ) => {
    if (!state.currentCard) return;

    let targetLocationId: string | null = null;
    if (destinationType === 'collection_binder' || destinationType === 'trade_sale') {
      targetLocationId = state.targetBinderLocationId || locations.find(l => l.type === 'binder')?.id || null;
    } else if (destinationType === 'bulk_discard') {
      targetLocationId = state.targetBulkLocationId || locations.find(l => l.type === 'tin')?.id || null;
    }

    const payload: TriageCardActionPayload = {
      userCardId: state.currentCard.id,
      destinationType,
      rarity: state.currentCard.rarity,
      salePrice: overrideSalePrice ?? state.currentCard.sale_price ?? null,
      condition: state.currentCard.condition || 'Near Mint',
      ...(targetLocationId ? { targetLocationId, targetCompartmentIndex: 0 } : {}),
    };

    if (destinationType === 'active_deck') {
      const match = state.currentDiagnosis?.competitiveMatches[0];
      payload.deckId = match ? match.deckId : decks.find(d => d.is_active)?.id || null;
      payload.deckSection = match ? match.section : 'main';
    } else if (destinationType === 'thematic_pool') {
      payload.themeTag = overrideThemeTag || state.currentDiagnosis?.thematicIncubators[0]?.themeName || 'Temático';
    } else if (destinationType === 'trade_sale') {
      payload.salePrice = overrideSalePrice ?? state.currentCard.sale_price ?? state.currentSetsData?.marketPriceTcg ?? 0.25;
    }

    mutations.applyCardAction(state.currentCard, payload);
  };

  useTriageKeyboardShortcuts({
    onAction1: () => handleExecuteAction('active_deck'),
    onAction2: () => state.setIsThemeModalOpen(true),
    onAction3: () => handleExecuteAction('workshop_salad'),
    onAction4: () => handleExecuteAction('collection_binder'),
    onAction5: () => handleExecuteAction('trade_sale'),
    onAction6: () => handleExecuteAction('bulk_discard'),
    onOpenRarityModal: () => state.setIsRarityModalOpen(true),
    onNavigateNext: state.handleNext,
    onNavigatePrev: state.handlePrev,
    onUndo: mutations.handleUndo,
    canUndo: mutations.canUndo,
    isDisabled: state.isRarityModalOpen || state.isThemeModalOpen,
  });

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      <TriageHeaderScopeSelector
        scopeConfig={state.scopeConfig}
        setScopeConfig={state.setScopeConfig}
        locations={locations}
        currentIndex={state.safeIndex}
        totalCards={state.totalCount}
        targetBinderLocationId={state.targetBinderLocationId}
        onSelectBinderLocation={state.setTargetBinderLocationId}
        targetBulkLocationId={state.targetBulkLocationId}
        onSelectBulkLocation={state.setTargetBulkLocationId}
        availableThemes={state.availableThemes}
      />

      <TriageQueueFilmstrip cards={state.filteredCards} currentIndex={state.safeIndex} onSelectIndex={state.handleJumpToIndex} />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <TriageActiveCardViewer
          card={state.currentCard}
          setsData={state.currentSetsData}
          onOpenRarityModal={() => state.setIsRarityModalOpen(true)}
        />
        <TriageDiagnosticPanel
          diagnosis={state.currentDiagnosis}
          rarityAlert={state.currentSetsData?.rarityAlert}
          onSelectAction={handleExecuteAction}
          onOpenThemeModal={() => state.setIsThemeModalOpen(true)}
          onOpenRarityModal={() => state.setIsRarityModalOpen(true)}
          onOpenDisagreement={() => setIsDisagreementModalOpen(true)}
        />
      </div>

      <TriageActionButtonBar
        onAction={dest => dest === 'thematic_pool' ? state.setIsThemeModalOpen(true) : handleExecuteAction(dest)}
        onPrev={state.handlePrev}
        onNext={state.handleNext}
        onUndo={mutations.handleUndo}
        canUndo={mutations.canUndo}
        canPrev={state.safeIndex > 0}
        canNext={state.safeIndex < state.totalCount - 1}
        isMutating={mutations.isMutating}
        suggestedAction={state.currentDiagnosis?.suggestedPrimaryAction}
      />

      {state.isRarityModalOpen && state.currentCard && (
        <TriageRarityPricingModal
          key={`rarity-${state.currentCard.id}`}
          isOpen={state.isRarityModalOpen}
          onClose={() => state.setIsRarityModalOpen(false)}
          cardName={state.currentCard.card_details?.name || 'Carta'}
          currentRarity={state.currentCard.rarity || 'Common'}
          currentSalePrice={state.currentCard.sale_price}
          setsData={state.currentSetsData}
          onApplyRarityAndPrice={(newRarity, newPrice) => {
            if (!state.currentCard) return;
            const destMap: Record<string, TriageCardActionPayload['destinationType']> = { in_deck: 'active_deck', workshop: 'workshop_salad', collection: 'collection_binder', trade_sale: 'trade_sale' };
            mutations.applyCardAction(state.currentCard, {
              userCardId: state.currentCard.id,
              destinationType: destMap[state.currentCard.status_flag] || 'bulk_discard',
              rarity: newRarity,
              salePrice: newPrice,
              condition: state.currentCard.condition,
            });
          }}
        />
      )}

      {state.isThemeModalOpen && state.currentCard && (
        <TriageThematicModal
          key={`theme-${state.currentCard.id}`}
          isOpen={state.isThemeModalOpen}
          onClose={() => state.setIsThemeModalOpen(false)}
          cardName={state.currentCard.card_details?.name || 'Carta'}
          currentThemeTag={state.currentCard.notes?.match(/\[Tema:\s*([^\]]+)\]/i)?.[1] || null}
          suggestedIncubators={state.currentDiagnosis?.thematicIncubators || []}
          availableThemes={state.availableThemes}
          onApplyTheme={tag => handleExecuteAction('thematic_pool', tag)}
        />
      )}

      {isDisagreementModalOpen && state.currentCard && state.currentDiagnosis && (
        <TriageDisagreementFeedbackModal
          key={`disagree-${state.currentCard.id}`}
          isOpen={isDisagreementModalOpen}
          onClose={() => setIsDisagreementModalOpen(false)}
          cardName={state.currentCard.card_details?.name || 'Carta'}
          cardId={state.currentCard.card_id}
          currentVerdict={state.currentDiagnosis.tacticalVerdict}
          onApplyOverride={(chosenAction, themeTag, salePrice, reason) => {
            handleExecuteAction(chosenAction, themeTag, salePrice, reason);
          }}
        />
      )}
    </div>
  );
};
