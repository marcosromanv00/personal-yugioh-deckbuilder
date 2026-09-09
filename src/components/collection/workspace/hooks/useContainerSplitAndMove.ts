import { useState, Dispatch, SetStateAction } from 'react';
import { UserCard } from '@/types/collection';
import { ContainerHistoryAction } from '../types';
import { createMoveCardHistoryItem } from '../containerWorkspace.utils';
import { splitCopyApi, splitAndMoveVariantApi } from '../services/containerWorkspace.api';

interface ToastMethods {
  success: (msg: string, opt?: { title?: string }) => void;
  error: (msg: string, opt?: { title?: string }) => void;
  warning: (msg: string, opt?: { title?: string }) => void;
  info: (msg: string, opt?: { title?: string }) => void;
}

interface UseContainerSplitAndMoveProps {
  cards: UserCard[];
  setCards: Dispatch<SetStateAction<UserCard[]>>;
  selectedUserCard: UserCard | null;
  setSelectedUserCard: Dispatch<SetStateAction<UserCard | null>>;
  selectedCardIds: string[];
  pushHistoryAction: (action: ContainerHistoryAction) => void;
  setHasMutated: Dispatch<SetStateAction<boolean>>;
  fetchCards: () => Promise<void>;
  toast: ToastMethods;
}

export function useContainerSplitAndMove({
  cards,
  setCards,
  selectedUserCard,
  setSelectedUserCard,
  selectedCardIds,
  pushHistoryAction,
  setHasMutated,
  fetchCards,
  toast,
}: UseContainerSplitAndMoveProps) {
  // Modal de División
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [cardToSplit, setCardToSplit] = useState<UserCard | null>(null);

  // Modal de Movimiento de Variante
  const [isMoveVariantModalOpen, setIsMoveVariantModalOpen] = useState(false);
  const [variantToMove, setVariantToMove] = useState<UserCard | null>(null);

  const handleOpenSplitModal = (card?: UserCard) => {
    const target = card || (selectedCardIds.length === 1 ? cards.find(c => c.id === selectedCardIds[0]) : selectedUserCard);
    if (target && (target.quantity || 1) > 1) {
      setCardToSplit(target);
      setIsSplitModalOpen(true);
    } else {
      toast.info('Para separar copias necesitas seleccionar una carta con al menos 2 copias', { title: 'Copias insuficientes' });
    }
  };

  const handleCloseSplitModal = () => {
    setIsSplitModalOpen(false);
    setCardToSplit(null);
  };

  const handleSplitCopies = async (userCardId: string, splitQuantity: number) => {
    try {
      const targetCard = cards.find(c => c.id === userCardId);
      const { updatedSource, newRecord } = await splitCopyApi(userCardId, splitQuantity);

      if (targetCard) {
        pushHistoryAction({
          type: 'update_cards',
          description: `Dividir copias de ${targetCard.card_details?.name || 'carta'}`,
          prevCards: [targetCard],
          newCards: newRecord ? [updatedSource, newRecord] : [updatedSource]
        });
      }

      setCards(prev => {
        const next = prev.map(c => c.id === userCardId ? updatedSource : c);
        return newRecord ? [newRecord, ...next] : next;
      });

      if (newRecord) {
        setSelectedUserCard(newRecord);
      }

      setHasMutated(true);
      toast.success(`Se separaron ${splitQuantity} copia(s) a un nuevo registro`, { title: '¡Copia Individual Creada!' });
      fetchCards();
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Error al separar copias', { title: 'Error' });
    }
  };

  const handleOpenMoveVariantModal = (variant: UserCard) => {
    setVariantToMove(variant);
    setIsMoveVariantModalOpen(true);
  };

  const handleCloseMoveVariantModal = () => {
    setIsMoveVariantModalOpen(false);
    setVariantToMove(null);
  };

  const handleConfirmMoveVariant = async (
    variantId: string,
    quantityToMove: number,
    targetLocationId: string | null,
    targetCompartmentIndex: number
  ) => {
    const targetVariant = cards.find(c => c.id === variantId);
    if (!targetVariant) return;

    const currentQty = targetVariant.quantity || 1;
    const isMovingAll = quantityToMove >= currentQty;

    pushHistoryAction({
      type: 'move_cards',
      description: `Trasladar variante de ${targetVariant.card_details?.name || 'carta'}`,
      items: [createMoveCardHistoryItem(targetVariant, targetLocationId, targetCompartmentIndex, null, null)]
    });

    if (isMovingAll) {
      setCards(prev => prev.filter(c => c.id !== variantId));
      if (selectedUserCard?.id === variantId) {
        const remaining = cards.filter(c => c.id !== variantId && c.card_id === targetVariant.card_id);
        setSelectedUserCard(remaining[0] || null);
      }
    } else {
      const newQty = currentQty - quantityToMove;
      setCards(prev => prev.map(c => c.id === variantId ? { ...c, quantity: newQty } : c));
      if (selectedUserCard?.id === variantId) {
        setSelectedUserCard(prev => prev ? { ...prev, quantity: newQty } : null);
      }
    }

    setHasMutated(true);

    try {
      await splitAndMoveVariantApi({
        user_card_id: variantId,
        split_quantity: quantityToMove,
        target_storage_location_id: targetLocationId,
        target_compartment_index: targetCompartmentIndex,
      });

      toast.success(`${quantityToMove} copia(s) movida(s) correctamente`, { title: '¡Variante trasladada!' });
      fetchCards();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Error al trasladar variante', { title: 'Error' });
      fetchCards();
    }
  };

  return {
    isSplitModalOpen,
    cardToSplit,
    handleOpenSplitModal,
    handleCloseSplitModal,
    handleSplitCopies,
    isMoveVariantModalOpen,
    variantToMove,
    handleOpenMoveVariantModal,
    handleCloseMoveVariantModal,
    handleConfirmMoveVariant,
  };
}
