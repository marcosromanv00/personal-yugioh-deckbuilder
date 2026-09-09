import { useState, useMemo, Dispatch, SetStateAction } from 'react';
import { UserCard } from '@/types/collection';
import { DetailsCopiesMode } from '../types';
import { ContainerHistoryAction } from '../types';
import { createCardApi, updateCardApi, deleteCardApi } from '../services/containerWorkspace.api';

interface ToastMethods {
  success: (msg: string, opt?: { title?: string }) => void;
  error: (msg: string, opt?: { title?: string }) => void;
  warning: (msg: string, opt?: { title?: string }) => void;
  info: (msg: string, opt?: { title?: string }) => void;
}

interface UseContainerVariantsProps {
  cards: UserCard[];
  setCards: Dispatch<SetStateAction<UserCard[]>>;
  selectedUserCard: UserCard | null;
  setSelectedUserCard: Dispatch<SetStateAction<UserCard | null>>;
  containerType: string;
  pushHistoryAction: (action: ContainerHistoryAction) => void;
  setHasMutated: Dispatch<SetStateAction<boolean>>;
  fetchCards: () => Promise<void>;
  toast: ToastMethods;
}

export function useContainerVariants({
  cards,
  setCards,
  selectedUserCard,
  setSelectedUserCard,
  containerType,
  pushHistoryAction,
  setHasMutated,
  fetchCards,
  toast,
}: UseContainerVariantsProps) {
  const [detailsCopiesMode, setDetailsCopiesMode] = useState<DetailsCopiesMode>('grouped');
  const [isVariantsExpanded, setIsVariantsExpanded] = useState<boolean>(false);

  const activeVariants = useMemo(() => {
    if (!selectedUserCard) return [];
    const comp = selectedUserCard.compartment_index || 0;
    return cards.filter(c => c.card_id === selectedUserCard.card_id && (c.compartment_index || 0) === comp);
  }, [cards, selectedUserCard]);

  const totalCopiesInContainer = useMemo(() => {
    return activeVariants.reduce((sum, v) => sum + (v.quantity || 1), 0);
  }, [activeVariants]);

  const handleUpdateVariantById = async (variantId: string, updatedFields: Partial<UserCard>) => {
    const targetVariant = cards.find(c => c.id === variantId);
    if (targetVariant) {
      pushHistoryAction({
        type: 'update_cards',
        description: `Actualizar variante de ${targetVariant.card_details?.name || 'carta'}`,
        prevCards: [targetVariant],
        newCards: [{ ...targetVariant, ...updatedFields }]
      });
    }

    setCards(prev => prev.map(c => c.id === variantId ? { ...c, ...updatedFields } : c));
    if (selectedUserCard?.id === variantId) {
      setSelectedUserCard(prev => prev ? { ...prev, ...updatedFields } : null);
    }
    setHasMutated(true);

    try {
      await updateCardApi({ id: variantId, ...updatedFields });
    } catch {
      fetchCards();
    }
  };

  const handleAddNewVariant = async () => {
    if (!selectedUserCard) return;

    try {
      let pageToAssign: number | undefined;
      let slotToAssign: number | undefined;

      if (containerType === 'binder' && selectedUserCard.binder_page && selectedUserCard.binder_slot) {
        const cardsInSameSlot = cards.filter(
          c => c.binder_page === selectedUserCard.binder_page && c.binder_slot === selectedUserCard.binder_slot
        );
        const currentSlotQty = cardsInSameSlot.reduce((s, c) => s + (c.quantity || 1), 0);
        if (currentSlotQty < 4) {
          pageToAssign = selectedUserCard.binder_page;
          slotToAssign = selectedUserCard.binder_slot;
        }
      }

      const payload: Record<string, unknown> = {
        card_id: selectedUserCard.card_id,
        storage_location_id: selectedUserCard.storage_location_id,
        compartment_index: selectedUserCard.compartment_index || 0,
        quantity: 1,
        rarity: 'Common',
        condition: 'Near Mint',
        status_flag: selectedUserCard.status_flag || 'collection',
        sleeve_type: 'none',
        ...(pageToAssign && slotToAssign ? { binder_page: pageToAssign, binder_slot: slotToAssign } : {})
      };

      const insertedCard = await createCardApi(payload);
      if (insertedCard) {
        pushHistoryAction({
          type: 'add_cards',
          description: `Añadir variante de ${selectedUserCard.card_details?.name || 'carta'}`,
          cards: [insertedCard]
        });
        setCards(prev => [insertedCard, ...prev]);
      }
      setHasMutated(true);
      if (pageToAssign && slotToAssign) {
        toast.success(`Nueva variante añadida en Ranura ${slotToAssign}`, { title: '¡Variante creada!' });
      } else {
        toast.success(`Nueva variante añadida (en Pendientes)`, { title: '¡Variante creada!' });
      }
      fetchCards();
    } catch (err) {
      console.error('Error al añadir variante:', err);
    }
  };

  const handleDeleteVariantById = async (variantId: string) => {
    if (!confirm('¿Eliminar esta variante/rareza de la colección?')) return;
    const targetVariant = cards.find(c => c.id === variantId);
    if (targetVariant) {
      pushHistoryAction({
        type: 'delete_cards',
        description: `Eliminar variante de ${targetVariant.card_details?.name || 'carta'}`,
        cards: [targetVariant]
      });
    }

    setCards(prev => prev.filter(c => c.id !== variantId));
    if (selectedUserCard?.id === variantId) {
      const remaining = cards.filter(c => c.id !== variantId && c.card_id === selectedUserCard.card_id);
      setSelectedUserCard(remaining[0] || null);
    }
    setHasMutated(true);

    try {
      await deleteCardApi(variantId);
      fetchCards();
    } catch {
      fetchCards();
    }
  };

  return {
    detailsCopiesMode,
    setDetailsCopiesMode,
    isVariantsExpanded,
    setIsVariantsExpanded,
    activeVariants,
    totalCopiesInContainer,
    handleUpdateVariantById,
    handleAddNewVariant,
    handleDeleteVariantById,
  };
}
