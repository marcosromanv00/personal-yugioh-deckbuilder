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
import { TriageModalsPortal } from './components/TriageModalsPortal';

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
    userReason?: string,
    overrideDeckId?: string,
    overrideDeckSection?: 'main' | 'extra' | 'side'
  ) => {
    if (!state.currentCard) return;

    if (userReason) {
      state.recordLearnedRule(state.currentCard.card_id, destinationType, userReason, overrideThemeTag);
    }

    const targetLocationId = (destinationType === 'collection_binder' || destinationType === 'trade_sale')
      ? (state.targetBinderLocationId || locations.find(l => l.type === 'binder')?.id || null)
      : destinationType === 'bulk_discard'
      ? (state.targetBulkLocationId || locations.find(l => l.type === 'tin')?.id || null)
      : null;

    const payload: TriageCardActionPayload = {
      userCardId: state.currentCard.id,
      destinationType,
      rarity: state.currentCard.rarity,
      salePrice: overrideSalePrice ?? state.currentCard.sale_price ?? null,
      condition: state.currentCard.condition || 'Near Mint',
      ...(targetLocationId ? { targetLocationId, targetCompartmentIndex: 0 } : {}),
    };

    if (destinationType === 'active_deck') {
      if (overrideDeckId) {
        payload.deckId = overrideDeckId;
        payload.deckSection = overrideDeckSection || 'main';
      } else {
        const match = state.currentDiagnosis?.competitiveMatches[0];
        if (!match && decks.length > 0) {
          state.setIsDeckModalOpen(true);
          return;
        }
        payload.deckId = match ? match.deckId : decks.find(d => d.is_active)?.id || null;
        payload.deckSection = match ? match.section : 'main';
      }
    } else if (destinationType === 'thematic_pool') {
      payload.themeTag = overrideThemeTag || state.currentDiagnosis?.thematicIncubators[0]?.themeName || 'Temático';
    } else if (destinationType === 'trade_sale') {
      payload.salePrice = overrideSalePrice ?? state.currentCard.sale_price ?? state.currentSetsData?.marketPriceTcg ?? 0.25;
    }

    mutations.applyCardAction(state.currentCard, payload);
  };

  useTriageKeyboardShortcuts({
    onAction1: () => {
      const match = state.currentDiagnosis?.competitiveMatches[0];
      if (!match && decks.length > 0) {
        state.setIsDeckModalOpen(true);
      } else {
        handleExecuteAction('active_deck');
      }
    },
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
    isDisabled: state.isRarityModalOpen || state.isThemeModalOpen || state.isPriceCorrectionOpen || state.isDeckModalOpen || isDisagreementModalOpen,
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
        bulkCardsCount={state.bulkCardsCount}
      />

      <TriageQueueFilmstrip cards={state.filteredCards} currentIndex={state.safeIndex} onSelectIndex={state.handleJumpToIndex} />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <TriageActiveCardViewer
          card={state.currentCard}
          setsData={state.currentSetsData}
          onOpenRarityModal={() => state.setIsRarityModalOpen(true)}
          onOpenPriceCorrection={() => state.setIsPriceCorrectionOpen(true)}
        />
        <TriageDiagnosticPanel
          diagnosis={state.currentDiagnosis}
          rarityAlert={state.currentSetsData?.rarityAlert}
          onSelectAction={handleExecuteAction}
          onOpenThemeModal={() => state.setIsThemeModalOpen(true)}
          onOpenRarityModal={() => state.setIsRarityModalOpen(true)}
          onOpenDisagreement={() => setIsDisagreementModalOpen(true)}
          onOpenDeckModal={() => state.setIsDeckModalOpen(true)}
        />
      </div>

      <TriageActionButtonBar
        onAction={dest => {
          if (dest === 'thematic_pool') {
            state.setIsThemeModalOpen(true);
          } else if (dest === 'active_deck' && !state.currentDiagnosis?.competitiveMatches[0] && decks.length > 0) {
            state.setIsDeckModalOpen(true);
          } else {
            handleExecuteAction(dest);
          }
        }}
        onPrev={state.handlePrev}
        onNext={state.handleNext}
        onUndo={mutations.handleUndo}
        canUndo={mutations.canUndo}
        canPrev={state.safeIndex > 0}
        canNext={state.safeIndex < state.totalCount - 1}
        isMutating={mutations.isMutating}
        suggestedAction={state.currentDiagnosis?.suggestedPrimaryAction}
      />

      <TriageModalsPortal
        currentCard={state.currentCard}
        currentDiagnosis={state.currentDiagnosis}
        currentSetsData={state.currentSetsData}
        decks={decks}
        availableThemes={state.availableThemes}
        isRarityModalOpen={state.isRarityModalOpen}
        onCloseRarityModal={() => state.setIsRarityModalOpen(false)}
        isThemeModalOpen={state.isThemeModalOpen}
        onCloseThemeModal={() => state.setIsThemeModalOpen(false)}
        isDisagreementModalOpen={isDisagreementModalOpen}
        onCloseDisagreementModal={() => setIsDisagreementModalOpen(false)}
        isPriceCorrectionOpen={state.isPriceCorrectionOpen}
        onClosePriceCorrectionModal={() => state.setIsPriceCorrectionOpen(false)}
        isDeckModalOpen={state.isDeckModalOpen}
        onCloseDeckModal={() => state.setIsDeckModalOpen(false)}
        onApplyRarityAction={(newRarity, newPrice) => {
          if (!state.currentCard) return;
          const destMap: Record<string, TriageCardActionPayload['destinationType']> = { in_deck: 'active_deck', workshop: 'workshop_salad', collection: 'collection_binder', trade_sale: 'trade_sale' };
          mutations.applyCardAction(state.currentCard, {
            userCardId: state.currentCard.id,
            destinationType: destMap[state.currentCard.status_flag] || 'bulk_discard',
            rarity: newRarity, salePrice: newPrice, condition: state.currentCard.condition,
          });
        }}
        onApplyThemeAction={tag => handleExecuteAction('thematic_pool', tag)}
        onApplyDisagreement={(action, themeTag, salePrice, reason) => handleExecuteAction(action, themeTag, salePrice, reason)}
        onApplyPriceCorrection={state.handleCorrectPrice}
        onAssignToDeck={(deckId, section) => handleExecuteAction('active_deck', undefined, undefined, undefined, deckId, section)}
      />
    </div>
  );
};
