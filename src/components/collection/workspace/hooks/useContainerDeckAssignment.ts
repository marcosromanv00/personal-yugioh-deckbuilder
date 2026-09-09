import { useState, Dispatch, SetStateAction } from 'react';
import { StorageLocation, Deck, CompartmentsConfig } from '@/types/collection';
import { updateStorageLocationApi, updateDeckLocationApi, moveDeckCardsApi } from '../services/containerWorkspace.api';

interface ToastMethods {
  success: (msg: string, opt?: { title?: string }) => void;
  error: (msg: string, opt?: { title?: string }) => void;
  info: (msg: string, opt?: { title?: string }) => void;
}

interface UseContainerDeckAssignmentProps {
  location: StorageLocation | null;
  locations: StorageLocation[];
  isInbox: boolean;
  internalDecks: Deck[];
  setInternalDecks: Dispatch<SetStateAction<Deck[]>>;
  onSelectLocation?: (location: StorageLocation) => void;
  onMutate?: () => void;
  setHasMutated: Dispatch<SetStateAction<boolean>>;
  fetchCards: () => Promise<void>;
  toast: ToastMethods;
}

export function useContainerDeckAssignment({
  location,
  locations,
  isInbox,
  internalDecks,
  setInternalDecks,
  onSelectLocation,
  onMutate,
  setHasMutated,
  fetchCards,
  toast,
}: UseContainerDeckAssignmentProps) {
  const [isAssignDeckModalOpen, setIsAssignDeckModalOpen] = useState(false);
  const [assignCompartmentIdx, setAssignCompartmentIdx] = useState<number>(0);
  const [selectedDeckIdToAssign, setSelectedDeckIdToAssign] = useState<string>('');
  const [shouldMoveCardsOnAssign, setShouldMoveCardsOnAssign] = useState<boolean>(true);
  const [shouldRenameCompartmentOnAssign, setShouldRenameCompartmentOnAssign] = useState<boolean>(false);
  const [isAssigningDeck, setIsAssigningDeck] = useState<boolean>(false);

  const handleOpenAssignDeckModal = (compartmentIdx: number) => {
    setAssignCompartmentIdx(compartmentIdx);
    const existingDeckId = location?.compartments?.deck_ids?.[compartmentIdx] || '';
    setSelectedDeckIdToAssign(existingDeckId || (internalDecks[0]?.id || ''));
    setShouldMoveCardsOnAssign(true);
    setShouldRenameCompartmentOnAssign(false);
    setIsAssignDeckModalOpen(true);
  };

  const handleSaveDeckAssignment = async () => {
    if (!location || isInbox) return;
    setIsAssigningDeck(true);
    try {
      const existingComp = location.compartments || { count: 1, names: ['Principal'] };
      const currentDeckIds = [...(existingComp.deck_ids || Array(existingComp.count).fill(null))];
      while (currentDeckIds.length < existingComp.count) currentDeckIds.push(null);

      const newDeckId = selectedDeckIdToAssign || null;
      currentDeckIds[assignCompartmentIdx] = newDeckId;

      const currentNames = [...existingComp.names];
      if (shouldRenameCompartmentOnAssign && newDeckId) {
        const targetDeck = internalDecks.find(d => d.id === newDeckId);
        if (targetDeck) currentNames[assignCompartmentIdx] = `Mazo: ${targetDeck.name}`;
      }

      const updatedCompartments: CompartmentsConfig = { ...existingComp, names: currentNames, deck_ids: currentDeckIds };
      const updatedLocation: StorageLocation = { ...location, compartments: updatedCompartments };

      await updateStorageLocationApi(updatedLocation);
      onSelectLocation?.(updatedLocation);
      onMutate?.();

      if (newDeckId) {
        await updateDeckLocationApi(newDeckId, location.id);
        setInternalDecks(prev => prev.map(d => (d.id === newDeckId ? { ...d, storage_location_id: location.id } : d)));
      }

      const prevDeckInLane = existingComp.deck_ids?.[assignCompartmentIdx];
      if (prevDeckInLane && prevDeckInLane !== newDeckId) {
        const isStillInOtherLane = currentDeckIds.some((dId, idx) => idx !== assignCompartmentIdx && dId === prevDeckInLane);
        if (!isStillInOtherLane) {
          await updateDeckLocationApi(prevDeckInLane, null);
          setInternalDecks(prev => prev.map(d => (d.id === prevDeckInLane ? { ...d, storage_location_id: undefined } : d)));
        }
      }

      if (shouldMoveCardsOnAssign && newDeckId) {
        await moveDeckCardsApi(newDeckId, location.id, assignCompartmentIdx);
        await fetchCards();
      }

      if (newDeckId) {
        const prevContainer = locations.find(l => l.id !== location.id && l.compartments?.deck_ids?.includes(newDeckId));
        if (prevContainer?.compartments?.deck_ids) {
          const cleanedPrev = prevContainer.compartments.deck_ids.map(dId => dId === newDeckId ? null : dId);
          await updateStorageLocationApi({ ...prevContainer, compartments: { ...prevContainer.compartments, deck_ids: cleanedPrev } });
        }
      }

      const assignedDeck = internalDecks.find(d => d.id === newDeckId);
      if (newDeckId && assignedDeck) {
        toast.success(`Mazo "${assignedDeck.name}" asignado al Carril ${assignCompartmentIdx + 1}`, { title: '¡Mazo Asignado!' });
      } else {
        toast.info(`Carril ${assignCompartmentIdx + 1} desvinculado`, { title: 'Desvinculación' });
      }

      setHasMutated(true);
      if (onMutate) onMutate();
      setIsAssignDeckModalOpen(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'No se pudo asignar el mazo');
    } finally {
      setIsAssigningDeck(false);
    }
  };

  const handleMoveDeckCards = async (deckId: string, targetCompIdx: number = 0, targetLocationId?: string | null) => {
    if (!location || isInbox) return;
    const destLocId = targetLocationId !== undefined ? targetLocationId : location.id;

    try {
      if (destLocId === location.id) {
        await moveDeckCardsApi(deckId, location.id, targetCompIdx);
        if (location.compartments) {
          const currentDeckIds = [...(location.compartments.deck_ids || Array(location.compartments.count).fill(null))];
          while (currentDeckIds.length <= targetCompIdx) currentDeckIds.push(null);
          const cleanedDeckIds = currentDeckIds.map((dId, idx) => idx === targetCompIdx ? deckId : (dId === deckId ? null : dId));
          await updateStorageLocationApi({ ...location, compartments: { ...location.compartments, deck_ids: cleanedDeckIds } });
        }
        const targetName = location.compartments?.names?.[targetCompIdx] || `Carril ${targetCompIdx + 1}`;
        toast.success(`Mazo movido a ${targetName}`, { title: '¡Mazo Reubicado!' });
      } else if (destLocId === null) {
        await updateDeckLocationApi(deckId, null);
        await moveDeckCardsApi(deckId, null, 0);
        if (location.compartments) {
          const cleaned = (location.compartments.deck_ids || []).map(dId => dId === deckId ? null : dId);
          await updateStorageLocationApi({ ...location, compartments: { ...location.compartments, deck_ids: cleaned } });
        }
        setInternalDecks(prev => prev.map(d => d.id === deckId ? { ...d, storage_location_id: undefined } : d));
        toast.success('Mazo desvinculado y enviado a Sin Clasificar', { title: 'Mazo Desvinculado' });
      } else {
        const targetContainer = locations.find(l => l.id === destLocId);
        await updateDeckLocationApi(deckId, destLocId, targetCompIdx);
        await moveDeckCardsApi(deckId, destLocId, targetCompIdx);
        if (location.compartments) {
          const cleaned = (location.compartments.deck_ids || []).map(dId => dId === deckId ? null : dId);
          await updateStorageLocationApi({ ...location, compartments: { ...location.compartments, deck_ids: cleaned } });
        }
        setInternalDecks(prev => prev.map(d => d.id === deckId ? { ...d, storage_location_id: destLocId } : d));
        toast.success(`Mazo trasladado a ${targetContainer?.name || 'otro contenedor'}`, { title: 'Mazo Trasladado' });
      }

      setHasMutated(true);
      if (onMutate) onMutate();
      await fetchCards();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'No se pudo mover el mazo');
    }
  };

  return {
    isAssignDeckModalOpen,
    setIsAssignDeckModalOpen,
    assignCompartmentIdx,
    setAssignCompartmentIdx,
    selectedDeckIdToAssign,
    setSelectedDeckIdToAssign,
    shouldMoveCardsOnAssign,
    setShouldMoveCardsOnAssign,
    shouldRenameCompartmentOnAssign,
    setShouldRenameCompartmentOnAssign,
    isAssigningDeck,
    handleOpenAssignDeckModal,
    handleSaveDeckAssignment,
    handleMoveDeckCards,
  };
}
