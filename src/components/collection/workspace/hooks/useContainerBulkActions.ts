import { Dispatch, SetStateAction } from 'react';
import { StorageLocation, UserCard, CardStatusFlag, CardCondition, SleeveType } from '@/types/collection';
import { ContainerHistoryAction } from '../types';
import { createMoveCardHistoryItem } from '../containerWorkspace.utils';
import { batchUpdateCardsApi, batchDeleteCardsApi } from '../services/containerWorkspace.api';

interface ToastMethods {
  success: (msg: string, opt?: { title?: string }) => void;
  error: (msg: string, opt?: { title?: string }) => void;
}

interface UseContainerBulkActionsProps {
  cards: UserCard[];
  setCards: Dispatch<SetStateAction<UserCard[]>>;
  selectedCardIds: string[];
  clearCardSelection: () => void;
  selectedUserCard: UserCard | null;
  setSelectedUserCard: Dispatch<SetStateAction<UserCard | null>>;
  location: StorageLocation | null;
  isInbox: boolean;
  pushHistoryAction: (action: ContainerHistoryAction) => void;
  setHasMutated: Dispatch<SetStateAction<boolean>>;
  fetchCards: () => Promise<void>;
  toast: ToastMethods;
}

export function useContainerBulkActions({
  cards,
  setCards,
  selectedCardIds,
  clearCardSelection,
  selectedUserCard,
  setSelectedUserCard,
  location,
  isInbox,
  pushHistoryAction,
  setHasMutated,
  fetchCards,
  toast,
}: UseContainerBulkActionsProps) {
  const handleBulkMove = async (targetLocationId: string | null, targetCompartmentIndex: number = 0) => {
    if (selectedCardIds.length === 0) return;
    const affected = cards.filter(c => selectedCardIds.includes(c.id));

    pushHistoryAction({
      type: 'move_cards',
      description: `Mover ${selectedCardIds.length} cartas en bloque`,
      items: affected.map(c => createMoveCardHistoryItem(c, targetLocationId, targetCompartmentIndex, null, null))
    });

    const currentLocId = isInbox ? null : (location?.id || null);
    if (targetLocationId !== currentLocId) {
      setCards(prev => prev.filter(c => !selectedCardIds.includes(c.id)));
    } else {
      setCards(prev => prev.map(c => selectedCardIds.includes(c.id) ? { ...c, compartment_index: targetCompartmentIndex } : c));
    }
    setHasMutated(true);

    try {
      await batchUpdateCardsApi(selectedCardIds, { storage_location_id: targetLocationId, compartment_index: targetCompartmentIndex });
      toast.success(`${selectedCardIds.length} cartas movidas correctamente`, { title: '¡Mover en Bloque!' });
      clearCardSelection();
      fetchCards();
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Error al mover lote de cartas', { title: 'Error' });
      fetchCards();
    }
  };

  const handleBulkChangeStatus = async (newStatus: CardStatusFlag) => {
    if (selectedCardIds.length === 0) return;
    const affected = cards.filter(c => selectedCardIds.includes(c.id));
    pushHistoryAction({
      type: 'update_cards',
      description: `Cambiar estado de ${selectedCardIds.length} cartas`,
      prevCards: affected,
      newCards: affected.map(c => ({ ...c, status_flag: newStatus }))
    });

    setCards(prev => prev.map(c => selectedCardIds.includes(c.id) ? { ...c, status_flag: newStatus } : c));
    setHasMutated(true);

    try {
      await batchUpdateCardsApi(selectedCardIds, { status_flag: newStatus });
      toast.success(`Estado actualizado para ${selectedCardIds.length} cartas`, { title: '¡Estado en Bloque!' });
      clearCardSelection();
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Error al cambiar estado en lote', { title: 'Error' });
      fetchCards();
    }
  };

  const handleBulkChangeCondition = async (newCondition: CardCondition, sleeveType?: SleeveType) => {
    if (selectedCardIds.length === 0) return;
    const affected = cards.filter(c => selectedCardIds.includes(c.id));
    pushHistoryAction({
      type: 'update_cards',
      description: `Cambiar condición de ${selectedCardIds.length} cartas`,
      prevCards: affected,
      newCards: affected.map(c => ({ ...c, condition: newCondition, ...(sleeveType !== undefined ? { sleeve_type: sleeveType } : {}) }))
    });

    setCards(prev => prev.map(c => !selectedCardIds.includes(c.id) ? c : { ...c, condition: newCondition, ...(sleeveType !== undefined ? { sleeve_type: sleeveType } : {}) }));
    setHasMutated(true);

    try {
      await batchUpdateCardsApi(selectedCardIds, { condition: newCondition, ...(sleeveType !== undefined ? { sleeve_type: sleeveType } : {}) });
      toast.success(`Condición actualizada para ${selectedCardIds.length} cartas`, { title: '¡Condición en Bloque!' });
      clearCardSelection();
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Error al actualizar condición en lote', { title: 'Error' });
      fetchCards();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCardIds.length === 0) return;
    const affected = cards.filter(c => selectedCardIds.includes(c.id));
    pushHistoryAction({
      type: 'delete_cards',
      description: `Eliminar ${selectedCardIds.length} cartas en bloque`,
      cards: affected
    });

    setCards(prev => prev.filter(c => !selectedCardIds.includes(c.id)));
    if (selectedUserCard && selectedCardIds.includes(selectedUserCard.id)) setSelectedUserCard(null);
    setHasMutated(true);

    try {
      await batchDeleteCardsApi(selectedCardIds);
      toast.success(`${selectedCardIds.length} cartas eliminadas`, { title: '¡Eliminado en Bloque!' });
      clearCardSelection();
      fetchCards();
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Error al eliminar lote de cartas', { title: 'Error' });
      fetchCards();
    }
  };

  return {
    handleBulkMove,
    handleBulkChangeStatus,
    handleBulkChangeCondition,
    handleBulkDelete,
  };
}
