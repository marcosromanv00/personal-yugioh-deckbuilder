import { useState } from 'react';
import { UserCard, StorageLocation, Deck, DeckCardDetail, SleeveInventory } from '@/types/collection';
import { useToast } from '@/components/ui/ToastProvider';
import { updateUserCardApi, deleteUserCardApi, addUserCardApi, updateCardPhysicalLocationApi } from '../services/deckWorkspace.api';
import { buildAddPhysicalCopyPayload } from '../deckWorkspaceRelocation.utils';

interface UseDeckWorkspaceRelocationParams {
  currentDeck: Deck | null;
  locations: StorageLocation[];
  storageLocationId: string;
  compartmentIndex: number;
  deckCards: DeckCardDetail[];
  selectedCardDetail: DeckCardDetail | null;
  mainProtection: 'single' | 'double' | 'triple';
  mainSleeveFitId: string;
  mainSleeveId: string;
  mainSleeveOverId: string;
  extraProtection: 'single' | 'double' | 'triple';
  extraSleeveFitId: string;
  extraSleeveId: string;
  extraSleeveOverId: string;
  poolProtection: 'single' | 'double' | 'triple';
  poolSleeveFitId: string;
  poolSleeveId: string;
  poolSleeveOverId: string;
  availableSleeves: SleeveInventory[];
  setUserCards: React.Dispatch<React.SetStateAction<UserCard[]>>;
  setHasMutated: (m: boolean) => void;
  handleRemoveCardFromDeck: (cardId: number, section: 'main' | 'extra' | 'side' | 'pool' | 'extras') => void;
}

export function useDeckWorkspaceRelocation({
  currentDeck,
  locations,
  storageLocationId,
  compartmentIndex,
  deckCards,
  selectedCardDetail,
  mainProtection,
  mainSleeveFitId,
  mainSleeveId,
  mainSleeveOverId,
  extraProtection,
  extraSleeveFitId,
  extraSleeveId,
  extraSleeveOverId,
  poolProtection,
  poolSleeveFitId,
  poolSleeveId,
  poolSleeveOverId,
  availableSleeves,
  setUserCards,
  setHasMutated,
  handleRemoveCardFromDeck,
}: UseDeckWorkspaceRelocationParams) {
  const toast = useToast();
  const [pendingRelocation, setPendingRelocation] = useState<{
    userCard: UserCard;
    targetLocationId: string | null;
    targetCompartmentIdx: number;
    targetLocationName: string;
  } | null>(null);
  const [relocatingLoading, setRelocatingLoading] = useState(false);

  const handleUpdateCardPhysicalLocation = async (userCardId: string, locationId: string | null, compartmentIdx = 0) => {
    try {
      const ok = await updateCardPhysicalLocationApi(userCardId, locationId, compartmentIdx);
      if (!ok) throw new Error('Error al mover carta física');
      setUserCards((prev) => prev.map((uc) => (uc.id === userCardId ? { ...uc, storage_location_id: locationId, compartment_index: compartmentIdx } : uc)));
      toast.success('Ubicación física de la carta actualizada');
      setHasMutated(true);
    } catch (err) {
      console.error('Error al actualizar ubicación de carta:', err);
      toast.error('No se pudo actualizar la ubicación de la carta');
    }
  };

  const handleRequestRelocateCard = (userCard: UserCard, locationId: string | null, compartmentIdx = 0) => {
    const isAssigned = Boolean(userCard.deck_id || deckCards.some((dc) => dc.card_id === userCard.card_id));
    const targetLoc = locations.find((l) => l.id === locationId);
    const targetName = locationId === 'inbox' ? 'Bandeja Sin Clasificar (Inbox)' : targetLoc ? targetLoc.name : !locationId ? `Ubicación Base (${currentDeck?.name || 'Deckbox'})` : 'Ubicación Externa';

    if (!isAssigned || !locationId || locationId === storageLocationId) {
      handleUpdateCardPhysicalLocation(userCard.id, locationId, compartmentIdx);
      return;
    }

    setPendingRelocation({ userCard, targetLocationId: locationId, targetCompartmentIdx: compartmentIdx, targetLocationName: targetName });
  };

  const handleConfirmRelocateAndRemoveFromDeck = async () => {
    if (!pendingRelocation) return;
    setRelocatingLoading(true);
    try {
      const { userCard, targetLocationId: locId, targetCompartmentIdx: compIdx } = pendingRelocation;
      await handleUpdateCardPhysicalLocation(userCard.id, locId, compIdx);
      const deckCard = deckCards.find((dc) => dc.card_id === userCard.card_id);
      if (deckCard) handleRemoveCardFromDeck(userCard.card_id, deckCard.section as 'main' | 'extra' | 'side' | 'pool' | 'extras');
      toast.success(`Copia reubicada y retirada de ${currentDeck?.name || 'la baraja'}`);
      setPendingRelocation(null);
    } finally {
      setRelocatingLoading(false);
    }
  };

  const handleConfirmRelocateOnly = async () => {
    if (!pendingRelocation) return;
    setRelocatingLoading(true);
    try {
      const { userCard, targetLocationId: locId, targetCompartmentIdx: compIdx } = pendingRelocation;
      await handleUpdateCardPhysicalLocation(userCard.id, locId, compIdx);
      toast.success('Ubicación física actualizada (conservando la carta en la receta)');
      setPendingRelocation(null);
    } finally {
      setRelocatingLoading(false);
    }
  };

  const handleCancelRelocate = () => setPendingRelocation(null);

  const handleUpdateUserCard = async (userCardId: string, fields: Partial<UserCard>) => {
    setUserCards((prev) => prev.map((uc) => (uc.id === userCardId ? { ...uc, ...fields } : uc)));
    setHasMutated(true);
    try {
      const ok = await updateUserCardApi(userCardId, fields);
      if (!ok) throw new Error('Error al actualizar');
      toast.success('Detalles de la copia física actualizados');
    } catch {
      toast.error('No se pudo actualizar la copia física');
    }
  };

  const handleAddPhysicalCopyForCard = async (cardId: number, isProxy = false) => {
    try {
      const payload = buildAddPhysicalCopyPayload({
        cardId,
        isProxy,
        selectedCardDetail,
        storageLocationId,
        compartmentIndex,
        currentDeckId: currentDeck?.id,
        mainProtection, mainSleeveFitId, mainSleeveId, mainSleeveOverId,
        extraProtection, extraSleeveFitId, extraSleeveId, extraSleeveOverId,
        poolProtection, poolSleeveFitId, poolSleeveId, poolSleeveOverId,
        availableSleeves,
      });

      const res = await addUserCardApi(payload);
      if (res.ok && res.data) {
        setUserCards((prev) => [res.data!, ...prev]);
        setHasMutated(true);
        toast.success(isProxy ? 'Proxy registrada en tu colección' : 'Copia física registrada');
      } else {
        toast.error(res.error || 'Error al registrar copia física');
      }
    } catch {
      toast.error('Error de conexión al registrar copia');
    }
  };

  const handleDeleteUserCard = async (userCardId: string) => {
    if (!confirm('¿Eliminar esta copia física de tu colección?')) return;
    setUserCards((prev) => prev.filter((uc) => uc.id !== userCardId));
    setHasMutated(true);
    try {
      await deleteUserCardApi(userCardId);
      toast.success('Copia eliminada de la colección');
    } catch {
      toast.error('No se pudo eliminar la copia física');
    }
  };

  return {
    pendingRelocation, relocatingLoading, handleRequestRelocateCard,
    handleConfirmRelocateAndRemoveFromDeck, handleConfirmRelocateOnly, handleCancelRelocate,
    handleUpdateCardPhysicalLocation, handleUpdateUserCard, handleAddPhysicalCopyForCard, handleDeleteUserCard,
  };
}
