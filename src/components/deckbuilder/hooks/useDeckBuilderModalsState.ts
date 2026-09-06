import { useState, useCallback } from 'react';
import { DeckVariant } from '@/types/collection';

interface UseDeckBuilderModalsStateParams {
  deckId: string | null;
  deckName: string;
  deleteDeck: (id: string) => Promise<boolean | undefined>;
  toast: { success: (msg: string) => void; error: (msg: string) => void; info: (msg: string) => void };
}

export function useDeckBuilderModalsState({
  deckId,
  deckName,
  deleteDeck,
  toast,
}: UseDeckBuilderModalsStateParams) {
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isDeleteActiveDeckConfirmOpen, setIsDeleteActiveDeckConfirmOpen] = useState(false);
  const [isDeletingActiveDeck, setIsDeletingActiveDeck] = useState(false);
  const [isYdkUploadOpen, setIsYdkUploadOpen] = useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [pendingVariantSwitch, setPendingVariantSwitch] = useState<DeckVariant | null>(null);

  const handleConfirmDeleteActiveDeck = useCallback(async () => {
    if (!deckId) return;
    setIsDeletingActiveDeck(true);
    try {
      const ok = await deleteDeck(deckId);
      if (ok !== false) {
        setIsDeleteActiveDeckConfirmOpen(false);
        toast.success(`Baraja "${deckName}" eliminada con éxito.`);
      } else {
        toast.error('No se pudo eliminar la baraja.');
      }
    } catch (e) {
      console.error('Error al eliminar deck activo:', e);
      toast.error('Error al eliminar la baraja.');
    } finally {
      setIsDeletingActiveDeck(false);
    }
  }, [deckId, deckName, deleteDeck, toast]);

  return {
    isClearConfirmOpen,
    setIsClearConfirmOpen,
    isDeleteActiveDeckConfirmOpen,
    setIsDeleteActiveDeckConfirmOpen,
    isDeletingActiveDeck,
    handleConfirmDeleteActiveDeck,
    isYdkUploadOpen,
    setIsYdkUploadOpen,
    isAICopilotOpen,
    setIsAICopilotOpen,
    pendingVariantSwitch,
    setPendingVariantSwitch,
  };
}
