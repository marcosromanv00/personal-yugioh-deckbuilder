import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { UserCard } from '@/types/collection';
import { ContainerHistoryAction, WorkspaceToastMethods } from '../types';
import { syncHistoryActionApi } from '../services/containerHistory.service';

export interface UseContainerHistoryActionsProps {
  setCards: Dispatch<SetStateAction<UserCard[]>>;
  selectedUserCard: UserCard | null;
  setSelectedUserCard: Dispatch<SetStateAction<UserCard | null>>;
  isInbox: boolean;
  containerId: string | undefined;
  setHasMutated: Dispatch<SetStateAction<boolean>>;
  toast: WorkspaceToastMethods;
}

export interface ContainerHistoryActionsState {
  undoStack: ContainerHistoryAction[];
  redoStack: ContainerHistoryAction[];
  canUndo: boolean;
  canRedo: boolean;
  pushHistoryAction: (action: ContainerHistoryAction) => void;
  handleUndo: () => Promise<void>;
  handleRedo: () => Promise<void>;
}

export function useContainerHistoryActions({
  setCards,
  selectedUserCard,
  setSelectedUserCard,
  isInbox,
  containerId,
  setHasMutated,
  toast,
}: UseContainerHistoryActionsProps): ContainerHistoryActionsState {
  const [undoStack, setUndoStack] = useState<ContainerHistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<ContainerHistoryAction[]>([]);

  const pushHistoryAction = useCallback((action: ContainerHistoryAction) => {
    setUndoStack(prev => [...prev.slice(-29), action]);
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(async () => {
    if (undoStack.length === 0) return;
    const action = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, action]);

    try {
      if (action.type === 'add_cards') {
        const ids = action.cards.map(c => c.id);
        setCards(prev => prev.filter(c => !ids.includes(c.id)));
        if (selectedUserCard && ids.includes(selectedUserCard.id)) setSelectedUserCard(null);
      } else if (action.type === 'delete_cards') {
        setCards(prev => [...action.cards, ...prev]);
      } else if (action.type === 'update_cards') {
        const prevMap = new Map(action.prevCards.map(c => [c.id, c]));
        setCards(prev => prev.map(c => prevMap.get(c.id) || c));
        if (selectedUserCard && prevMap.has(selectedUserCard.id)) setSelectedUserCard(prevMap.get(selectedUserCard.id)!);
      } else if (action.type === 'move_cards') {
        const itemMap = new Map(action.items.map(i => [i.id, i]));
        setCards(prev => {
          const currentFiltered = prev.filter(c => !itemMap.has(c.id));
          const restoredCards = action.items
            .filter(i => (isInbox ? !i.prevLocationId : i.prevLocationId === containerId))
            .map(i => ({
              ...i.prevCard,
              storage_location_id: i.prevLocationId,
              compartment_index: i.prevCompartment ?? i.prevCard.compartment_index,
              binder_page: i.prevPage ?? i.prevCard.binder_page,
              binder_slot: i.prevSlot ?? i.prevCard.binder_slot,
            }));
          return [...restoredCards, ...currentFiltered];
        });
      }
      setHasMutated(true);
      await syncHistoryActionApi(action, 'undo');
      toast.info?.(`Deshecho: ${action.description}`, { title: 'Deshacer (Undo)' });
    } catch (err) {
      console.error('Error al deshacer acción:', err);
      toast.error('Error al intentar deshacer la acción', { title: 'Error' });
    }
  }, [undoStack, selectedUserCard, isInbox, containerId, toast, setCards, setSelectedUserCard, setHasMutated]);

  const handleRedo = useCallback(async () => {
    if (redoStack.length === 0) return;
    const action = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, action]);

    try {
      if (action.type === 'add_cards') {
        setCards(prev => [...action.cards, ...prev]);
      } else if (action.type === 'delete_cards') {
        const ids = action.cards.map(c => c.id);
        setCards(prev => prev.filter(c => !ids.includes(c.id)));
        if (selectedUserCard && ids.includes(selectedUserCard.id)) setSelectedUserCard(null);
      } else if (action.type === 'update_cards') {
        const newMap = new Map(action.newCards.map(c => [c.id, c]));
        setCards(prev => prev.map(c => newMap.get(c.id) || c));
        if (selectedUserCard && newMap.has(selectedUserCard.id)) setSelectedUserCard(newMap.get(selectedUserCard.id)!);
      } else if (action.type === 'move_cards') {
        const itemMap = new Map(action.items.map(i => [i.id, i]));
        setCards(prev => {
          const currentFiltered = prev.filter(c => !itemMap.has(c.id));
          const restoredCards = action.items
            .filter(i => (isInbox ? !i.newLocationId : i.newLocationId === containerId))
            .map(i => ({
              ...i.newCard,
              storage_location_id: i.newLocationId,
              compartment_index: i.newCompartment ?? i.newCard.compartment_index,
              binder_page: i.newPage ?? i.newCard.binder_page,
              binder_slot: i.newSlot ?? i.newCard.binder_slot,
            }));
          return [...restoredCards, ...currentFiltered];
        });
      }
      setHasMutated(true);
      await syncHistoryActionApi(action, 'redo');
      toast.info?.(`Rehecho: ${action.description}`, { title: 'Rehacer (Redo)' });
    } catch (err) {
      console.error('Error al rehacer acción:', err);
      toast.error('Error al intentar rehacer la acción', { title: 'Error' });
    }
  }, [redoStack, selectedUserCard, isInbox, containerId, toast, setCards, setSelectedUserCard, setHasMutated]);

  return {
    undoStack,
    redoStack,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    pushHistoryAction,
    handleUndo,
    handleRedo,
  };
}
