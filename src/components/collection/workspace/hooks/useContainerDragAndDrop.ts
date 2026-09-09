import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { Card, HoverCardBase } from '@/components/deckbuilder/types';
import { UserCard } from '@/types/collection';
import { updateCardApi } from '../services/containerWorkspace.api';

interface ToastMethods {
  success: (msg: string, opt?: { title?: string }) => void;
  error: (msg: string, opt?: { title?: string }) => void;
  warning: (msg: string, opt?: { title?: string }) => void;
}

interface UseContainerDragAndDropProps {
  cards: UserCard[];
  setCards: Dispatch<SetStateAction<UserCard[]>>;
  selectedUserCard: UserCard | null;
  setSelectedUserCard: Dispatch<SetStateAction<UserCard | null>>;
  setHasMutated: Dispatch<SetStateAction<boolean>>;
  handleAddCardToContainer: (card: Card | HoverCardBase, page?: number, slot?: number) => Promise<void>;
  toast: ToastMethods;
}

export function useContainerDragAndDrop({
  cards,
  setCards,
  selectedUserCard,
  setSelectedUserCard,
  setHasMutated,
  handleAddCardToContainer,
  toast,
}: UseContainerDragAndDropProps) {
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [isDragOverCenter, setIsDragOverCenter] = useState(false);

  // Modal Selector de Copia Física
  const [pickerCard, setPickerCard] = useState<Card | null>(null);
  const [pickerUserCards, setPickerUserCards] = useState<UserCard[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pendingBinderTarget, setPendingBinderTarget] = useState<{ page?: number; slot?: number } | null>(null);

  const openPicker = useCallback((card: Card, userCards: UserCard[], target?: { page?: number; slot?: number }) => {
    setPickerCard(card);
    setPickerUserCards(userCards);
    setPendingBinderTarget(target || null);
    setIsPickerOpen(true);
  }, []);

  const handleDragCardStart = useCallback((e: React.DragEvent, card: Card) => {
    e.dataTransfer.setData('application/json', JSON.stringify(card));
    e.dataTransfer.effectAllowed = 'copy';
    setDraggedCard(card);
  }, []);

  const handleDropCardToBinderSlot = useCallback(async (e: React.DragEvent, page: number, slot: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;

    interface DragPayload {
      type?: string;
      userCardId?: string;
      card?: Card;
    }
    let payload: DragPayload;
    try { payload = JSON.parse(raw) as DragPayload; } catch { return; }

    if (payload.type === 'binder_slot_card' && payload.userCardId) {
      const sourceCard = cards.find(c => c.id === payload.userCardId);
      if (!sourceCard || (sourceCard.binder_page === page && sourceCard.binder_slot === slot)) {
        setDraggedCard(null);
        return;
      }

      const targetCardsInSlot = cards.filter(c => c.binder_page === page && c.binder_slot === slot);
      const targetSlotQty = targetCardsInSlot.reduce((s, c) => s + (c.quantity || 1), 0);
      const sourceQty = sourceCard.quantity || 1;

      if (targetCardsInSlot.length > 0 && targetSlotQty + sourceQty <= 4) {
        setCards(prev => prev.map(c => c.id === sourceCard.id ? { ...c, binder_page: page, binder_slot: slot } : c));
        if (selectedUserCard?.id === sourceCard.id) {
          setSelectedUserCard(prev => prev ? { ...prev, binder_page: page, binder_slot: slot } : null);
        }
        setHasMutated(true);
        setDraggedCard(null);
        try {
          await updateCardApi({ id: sourceCard.id, binder_page: page, binder_slot: slot });
          toast.success(`Carta añadida al Slot ${slot} (${targetSlotQty + sourceQty}/4)`, { title: '¡Carta apilada en slot!' });
        } catch { toast.error('Error al colocar carta en slot', { title: 'Error' }); }
        return;
      }

      if (targetCardsInSlot.length === 1 && sourceCard.binder_page && sourceCard.binder_slot) {
        const targetCard = targetCardsInSlot[0];
        const sOldPage = sourceCard.binder_page;
        const sOldSlot = sourceCard.binder_slot;

        setCards(prev => prev.map(c => {
          if (c.id === sourceCard.id) return { ...c, binder_page: page, binder_slot: slot };
          if (c.id === targetCard.id) return { ...c, binder_page: sOldPage, binder_slot: sOldSlot };
          return c;
        }));
        if (selectedUserCard?.id === sourceCard.id) setSelectedUserCard(prev => prev ? { ...prev, binder_page: page, binder_slot: slot } : null);
        else if (selectedUserCard?.id === targetCard.id) setSelectedUserCard(prev => prev ? { ...prev, binder_page: sOldPage, binder_slot: sOldSlot } : null);

        setHasMutated(true);
        setDraggedCard(null);
        try {
          await Promise.all([
            updateCardApi({ id: sourceCard.id, binder_page: page, binder_slot: slot }),
            updateCardApi({ id: targetCard.id, binder_page: sOldPage, binder_slot: sOldSlot }),
          ]);
          toast.success('Cartas intercambiadas entre slots', { title: '¡Slots intercambiados!' });
        } catch { toast.error('Error al guardar el intercambio', { title: 'Error' }); }
        return;
      }

      if (targetCardsInSlot.length === 0) {
        setCards(prev => prev.map(c => c.id === sourceCard.id ? { ...c, binder_page: page, binder_slot: slot } : c));
        if (selectedUserCard?.id === sourceCard.id) setSelectedUserCard(prev => prev ? { ...prev, binder_page: page, binder_slot: slot } : null);
        setHasMutated(true);
        setDraggedCard(null);
        try {
          await updateCardApi({ id: sourceCard.id, binder_page: page, binder_slot: slot });
          toast.success(`Carta colocada en Pág. ${page}, Slot ${slot}`, { title: '¡Ubicación actualizada!' });
        } catch { toast.error('Error al mover carta al slot', { title: 'Error' }); }
        return;
      }

      toast.warning(`El Slot ${slot} ya contiene ${targetSlotQty}/4 cartas.`, { title: 'Slot lleno' });
      setDraggedCard(null);
      return;
    }

    const cardData: Card = (payload.card || payload) as Card;
    const targetCardsInSlot = cards.filter(c => c.binder_page === page && c.binder_slot === slot);
    if (targetCardsInSlot.reduce((s, c) => s + (c.quantity || 1), 0) >= 4) {
      toast.warning(`Slot ${slot} (Pág. ${page}) ya está lleno con 4 cartas.`, { title: 'Slot lleno (4 máx.)' });
      setDraggedCard(null);
      return;
    }
    await handleAddCardToContainer(cardData, page, slot);
    setDraggedCard(null);
  }, [cards, selectedUserCard, setCards, setSelectedUserCard, setHasMutated, handleAddCardToContainer, toast]);

  const handleDropCardToBox = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverCenter(false);
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const card = JSON.parse(raw) as Card;
      await handleAddCardToContainer(card);
    } catch { /* ignore */ }
    setDraggedCard(null);
  }, [handleAddCardToContainer]);

  return {
    draggedCard,
    setDraggedCard,
    dragOverSlot,
    setDragOverSlot,
    isDragOverCenter,
    setIsDragOverCenter,
    pickerCard,
    setPickerCard,
    pickerUserCards,
    setPickerUserCards,
    isPickerOpen,
    setIsPickerOpen,
    pendingBinderTarget,
    setPendingBinderTarget,
    openPicker,
    handleDragCardStart,
    handleDropCardToBinderSlot,
    handleDropCardToBox,
  };
}
