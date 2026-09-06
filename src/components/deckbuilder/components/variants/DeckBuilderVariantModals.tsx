import React from 'react';
import { VariantDiffModal } from './VariantDiffModal';
import { NewVariantModal } from './NewVariantModal';
import { PendingVariantSwitchModal } from './PendingVariantSwitchModal';
import { useDeckVariants } from '../../hooks/useDeckVariants';
import { useDeckBuilderState } from '../../hooks/useDeckBuilderState';
import { DeckVariant, VariantDiffSummary } from '@/types/collection';

interface DeckBuilderVariantModalsProps {
  variantsManager: ReturnType<typeof useDeckVariants>;
  variantDiff: VariantDiffSummary;
  pendingVariantSwitch: DeckVariant | null;
  setPendingVariantSwitch: (v: DeckVariant | null) => void;
  handleQuickSaveClick: () => Promise<void>;
  state: ReturnType<typeof useDeckBuilderState>;
  toast: { success: (msg: string) => void; error: (msg: string) => void; info: (msg: string) => void };
}

export function DeckBuilderVariantModals({
  variantsManager,
  variantDiff,
  pendingVariantSwitch,
  setPendingVariantSwitch,
  handleQuickSaveClick,
  state,
  toast,
}: DeckBuilderVariantModalsProps) {
  const activeContextName = variantsManager.activeVariant?.name || state.deckName;

  return (
    <>
      <VariantDiffModal
        isOpen={variantsManager.isDiffModalOpen}
        onClose={variantsManager.handleCloseDiff}
        activeVariant={variantsManager.activeVariant}
        targetVariant={variantsManager.targetVariantForDiff}
        diff={variantDiff}
        isLoading={variantsManager.isLoadingAction}
        onConfirmSwitch={(target, transfers) => {
          variantsManager.handleConfirmSwitch(target, transfers);
          toast.success(`¡Variante "${target.name}" activada!`);
        }}
      />

      <NewVariantModal
        isOpen={variantsManager.isNewVariantModalOpen}
        onClose={() => variantsManager.setIsNewVariantModalOpen(false)}
        isLoading={variantsManager.isLoadingAction}
        onCreateVariant={async (name, mode) => {
          await variantsManager.handleCreateVariant(name, mode);
          toast.success(`Variante "${name}" creada`);
        }}
      />

      {pendingVariantSwitch && (
        <PendingVariantSwitchModal
          isOpen={Boolean(pendingVariantSwitch)}
          targetVariant={pendingVariantSwitch}
          currentContextName={activeContextName}
          onConfirmSaveAndSwitch={async () => {
            const target = pendingVariantSwitch;
            setPendingVariantSwitch(null);
            await handleQuickSaveClick();
            if (target) variantsManager.handleOpenDiff(target);
          }}
          onConfirmDiscardAndSwitch={() => {
            const target = pendingVariantSwitch;
            setPendingVariantSwitch(null);
            state.handleDiscardChanges();
            if (target) variantsManager.handleOpenDiff(target);
          }}
          onCancel={() => setPendingVariantSwitch(null)}
        />
      )}
    </>
  );
}
