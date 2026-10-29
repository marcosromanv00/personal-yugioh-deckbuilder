'use client';

import React from 'react';
import { UserCard, Deck } from '@/types/collection';
import { TriageDiagnosis, CardSetPrintingsResponse } from '@/types/triage';
import { TriageRarityPricingModal } from '../TriageRarityPricingModal';
import { TriageThematicModal } from '../TriageThematicModal';
import { TriageDisagreementFeedbackModal } from './TriageDisagreementFeedbackModal';
import { TriagePriceCorrectionModal } from './TriagePriceCorrectionModal';
import { TriageDeckSelectorModal } from './TriageDeckSelectorModal';

interface TriageModalsPortalProps {
  currentCard: UserCard | null;
  currentDiagnosis: TriageDiagnosis | null;
  currentSetsData: CardSetPrintingsResponse | null;
  decks: Deck[];
  availableThemes: { name: string; count: number }[];
  isRarityModalOpen: boolean;
  onCloseRarityModal: () => void;
  isThemeModalOpen: boolean;
  onCloseThemeModal: () => void;
  isDisagreementModalOpen: boolean;
  onCloseDisagreementModal: () => void;
  isPriceCorrectionOpen: boolean;
  onClosePriceCorrectionModal: () => void;
  isDeckModalOpen: boolean;
  onCloseDeckModal: () => void;
  onApplyRarityAction: (newRarity: string, newPrice: number | null) => void;
  onApplyThemeAction: (themeTag: string) => void;
  onApplyDisagreement: (action: TriageDiagnosis['suggestedPrimaryAction'], themeTag?: string, salePrice?: number, reason?: string) => void;
  onApplyPriceCorrection: (newPrice: number, reason: string) => Promise<boolean>;
  onAssignToDeck: (deckId: string, section: 'main' | 'extra' | 'side') => void;
}

export const TriageModalsPortal: React.FC<TriageModalsPortalProps> = ({
  currentCard,
  currentDiagnosis,
  currentSetsData,
  decks,
  availableThemes,
  isRarityModalOpen,
  onCloseRarityModal,
  isThemeModalOpen,
  onCloseThemeModal,
  isDisagreementModalOpen,
  onCloseDisagreementModal,
  isPriceCorrectionOpen,
  onClosePriceCorrectionModal,
  isDeckModalOpen,
  onCloseDeckModal,
  onApplyRarityAction,
  onApplyThemeAction,
  onApplyDisagreement,
  onApplyPriceCorrection,
  onAssignToDeck,
}) => {
  if (!currentCard) return null;

  return (
    <>
      {isRarityModalOpen && (
        <TriageRarityPricingModal
          key={`rarity-${currentCard.id}`}
          isOpen={isRarityModalOpen}
          onClose={onCloseRarityModal}
          cardName={currentCard.card_details?.name || 'Carta'}
          currentRarity={currentCard.rarity || 'Common'}
          currentSalePrice={currentCard.sale_price}
          setsData={currentSetsData}
          onApplyRarityAndPrice={onApplyRarityAction}
        />
      )}

      {isThemeModalOpen && (
        <TriageThematicModal
          key={`theme-${currentCard.id}`}
          isOpen={isThemeModalOpen}
          onClose={onCloseThemeModal}
          cardName={currentCard.card_details?.name || 'Carta'}
          currentThemeTag={currentCard.notes?.match(/\[Tema:\s*([^\]]+)\]/i)?.[1] || null}
          suggestedIncubators={currentDiagnosis?.thematicIncubators || []}
          availableThemes={availableThemes}
          onApplyTheme={onApplyThemeAction}
        />
      )}

      {isDisagreementModalOpen && currentDiagnosis && (
        <TriageDisagreementFeedbackModal
          key={`disagree-${currentCard.id}`}
          isOpen={isDisagreementModalOpen}
          onClose={onCloseDisagreementModal}
          cardName={currentCard.card_details?.name || 'Carta'}
          cardId={currentCard.card_id}
          currentVerdict={currentDiagnosis.tacticalVerdict}
          onApplyOverride={onApplyDisagreement}
        />
      )}

      {isPriceCorrectionOpen && (
        <TriagePriceCorrectionModal
          key={`price-${currentCard.id}`}
          isOpen={isPriceCorrectionOpen}
          onClose={onClosePriceCorrectionModal}
          cardName={currentCard.card_details?.name || 'Carta'}
          cardId={currentCard.card_id}
          currentPrice={currentCard.sale_price ?? currentSetsData?.marketPriceTcg ?? 0.25}
          onApplyCorrection={onApplyPriceCorrection}
        />
      )}

      {isDeckModalOpen && (
        <TriageDeckSelectorModal
          key={`deck-${currentCard.id}`}
          isOpen={isDeckModalOpen}
          onClose={onCloseDeckModal}
          cardName={currentCard.card_details?.name || 'Carta'}
          cardType={currentCard.card_details?.type}
          decks={decks}
          initialSelectedDeckId={currentDiagnosis?.competitiveMatches[0]?.deckId}
          onAssignToDeck={onAssignToDeck}
        />
      )}
    </>
  );
};
