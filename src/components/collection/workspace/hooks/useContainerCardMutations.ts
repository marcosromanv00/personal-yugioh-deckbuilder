import { Dispatch, SetStateAction } from 'react';
import { StorageLocation, UserCard } from '@/types/collection';
import { Card, HoverCardBase } from '@/components/deckbuilder/types';
import { BestRecommendation } from '@/lib/cardClassificationEngine';
import { ContainerHistoryAction, WorkspaceToastMethods } from '../types';
import { createMoveCardHistoryItem } from '../containerWorkspace.utils';
import { createCardApi, updateCardApi, deleteCardApi, batchUpdateCardsApi } from '../services/containerWorkspace.api';

interface UseContainerCardMutationsProps {
  cards: UserCard[];
  setCards: Dispatch<SetStateAction<UserCard[]>>;
  selectedUserCard: UserCard | null;
  setSelectedUserCard: Dispatch<SetStateAction<UserCard | null>>;
  isInbox: boolean;
  containerId?: string;
  containerType: string;
  activeCompartment: number;
  currentBinderViewIndex: number;
  pushHistoryAction: (action: ContainerHistoryAction) => void;
  setHasMutated: Dispatch<SetStateAction<boolean>>;
  fetchCards: () => Promise<void>;
  toast: WorkspaceToastMethods;
  addRecentCard: (card: Card | HoverCardBase) => void;
  isIdealMode: boolean;
  onOpenPicker?: (card: Card, userCards: UserCard[], target?: { page?: number; slot?: number }) => void;
}

export function useContainerCardMutations({
  cards, setCards, selectedUserCard, setSelectedUserCard, isInbox,
  containerId, containerType, activeCompartment, currentBinderViewIndex,
  pushHistoryAction, setHasMutated, fetchCards, toast, addRecentCard, isIdealMode, onOpenPicker,
}: UseContainerCardMutationsProps) {

  const handleSelectPhysicalCopy = async (userCard: UserCard, action: 'move' | 'proxy' = 'move', page?: number, slot?: number) => {
    try {
      if (action === 'proxy' && userCard.deck_id) {
        await createCardApi({ card_id: userCard.card_id, deck_id: userCard.deck_id, deck_section: userCard.deck_section || 'main', is_proxy: true, quantity: 1, rarity: userCard.rarity || 'Common', condition: userCard.condition || 'Near Mint', status_flag: 'in_deck' });
      }
      const effComp = activeCompartment === -1 ? 0 : activeCompartment;
      const tPage = containerType === 'binder' ? (page || (currentBinderViewIndex === 0 ? 1 : currentBinderViewIndex * 2)) : null;
      const tSlot = containerType === 'binder' ? (slot || 1) : null;
      const targetLocId = isInbox ? null : (containerId || null);

      pushHistoryAction({
        type: 'move_cards',
        description: `Ubicar ${userCard.card_details?.name || 'carta'}`,
        items: [createMoveCardHistoryItem(userCard, targetLocId, effComp, tPage, tSlot)]
      });

      setCards(prev => prev.some(c => c.id === userCard.id)
        ? prev.map(c => c.id === userCard.id ? { ...c, binder_page: tPage ?? undefined, binder_slot: tSlot ?? undefined, storage_location_id: targetLocId } : c)
        : [{ ...userCard, binder_page: tPage ?? undefined, binder_slot: tSlot ?? undefined, storage_location_id: targetLocId }, ...prev]);
      setHasMutated(true);

      await updateCardApi({
        id: userCard.id, storage_location_id: isInbox ? null : containerId, deck_id: null, deck_section: null, compartment_index: effComp,
        ...(containerType === 'binder' ? { binder_page: tPage, binder_slot: tSlot } : {})
      });
      toast.success(action === 'proxy' ? `${userCard.card_details?.name || 'Carta física'} movida (proxy en deck)` : `${userCard.card_details?.name || 'Carta física'} ubicada`, { title: '¡Copia asignada!' });
      fetchCards();
    } catch {
      toast.error('Error al actualizar la ubicación de la carta física', { title: 'Error' });
      fetchCards();
    }
  };

  const handleAddCardToContainer = async (card: Card | HoverCardBase, page?: number, slot?: number) => {
    try {
      addRecentCard(card);
      const cardObj = card as Card;
      if (containerType === 'binder' && page && slot) {
        const inSlot = cards.filter(c => c.binder_page === page && c.binder_slot === slot);
        if (inSlot.reduce((s, c) => s + (c.quantity || 1), 0) >= 4) {
          toast.warning?.(`El Slot ${slot} (Pág. ${page}) ya alcanzó el límite de 4 cartas.`, { title: 'Slot lleno' });
          return;
        }
        const unplaced = cards.find(c => Number(c.card_id) === Number(card.id) && (!c.binder_page || !c.binder_slot || c.binder_page <= 0 || c.binder_slot <= 0));
        if (unplaced) {
          const updated = { ...unplaced, binder_page: page, binder_slot: slot };
          pushHistoryAction({ type: 'update_cards', description: `Ubicar ${card.name}`, prevCards: [unplaced], newCards: [updated] });
          setCards(prev => prev.map(c => c.id === unplaced.id ? updated : c));
          setSelectedUserCard(updated);
          setHasMutated(true);
          await updateCardApi({ id: unplaced.id, binder_page: page, binder_slot: slot });
          fetchCards();
          toast.success(`${card.name} ubicada en Pág. ${page}, Slot ${slot}`, { title: '¡Posición asignada!' });
          return;
        }
      }
      if (cardObj.userCardsGroup && cardObj.userCardsGroup.length > 0) {
        if (cardObj.userCardsGroup.length > 1 || cardObj.userCardsGroup.some(uc => uc.deck_id || uc.deck_details)) {
          onOpenPicker?.(cardObj, cardObj.userCardsGroup, page && slot ? { page, slot } : undefined);
          return;
        }
        await handleSelectPhysicalCopy(cardObj.userCardsGroup[0], 'move', page, slot);
        return;
      }
      const effComp = activeCompartment === -1 ? 0 : activeCompartment;
      const tPage = containerType === 'binder' ? (page || (currentBinderViewIndex === 0 ? 1 : currentBinderViewIndex * 2)) : undefined;
      const tSlot = containerType === 'binder' ? (slot || 1) : undefined;
      const inserted = await createCardApi({
        card_id: card.id, storage_location_id: isInbox ? null : containerId, quantity: 1,
        rarity: 'Common', condition: 'Near Mint', status_flag: 'collection', sleeve_type: 'none',
        compartment_index: effComp, ...(tPage ? { binder_page: tPage, binder_slot: tSlot } : {})
      });
      if (inserted) {
        pushHistoryAction({ type: 'add_cards', description: `Añadir ${card.name}`, cards: [inserted] });
        setCards(prev => [inserted, ...prev]);
        setSelectedUserCard(inserted);
      }
      setHasMutated(true);
      fetchCards();
      toast.success(page && slot ? `${card.name} colocada en Pág. ${page}, Slot ${slot}` : `${card.name} añadida`, { title: '¡Carta añadida!' });
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Error al añadir carta', { title: 'Error' });
    }
  };

  const handleUpdateCard = async (updatedFields: Partial<UserCard>) => {
    if (!selectedUserCard) return;
    const updated = { ...selectedUserCard, ...updatedFields };
    pushHistoryAction({ type: 'update_cards', description: `Modificar ${selectedUserCard.card_details?.name || 'carta'}`, prevCards: [selectedUserCard], newCards: [updated] });
    setSelectedUserCard(updated);
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
    setHasMutated(true);
    try { await updateCardApi({ id: selectedUserCard.id, ...updatedFields }); } catch { fetchCards(); }
  };

  const handleMoveCard = async (newLocationId: string | null) => {
    if (!selectedUserCard) return;
    const targetLoc = newLocationId === 'inbox' ? null : newLocationId;
    const comp = selectedUserCard.compartment_index || 0;
    const variants = cards.filter(c => c.card_id === selectedUserCard.card_id && (c.compartment_index || 0) === comp);
    pushHistoryAction({
      type: 'move_cards',
      description: `Trasladar copias de ${selectedUserCard.card_details?.name || 'carta'}`,
      items: variants.map(v => createMoveCardHistoryItem(v, targetLoc, 0, null, null))
    });
    setCards(prev => prev.filter(c => !variants.some(v => v.id === c.id)));
    setSelectedUserCard(null);
    setHasMutated(true);
    try {
      await batchUpdateCardsApi(variants.map(v => v.id), { storage_location_id: targetLoc, binder_page: null, binder_slot: null });
      toast.success(`Todas las copias se movieron al nuevo contenedor`, { title: '¡Carta trasladada!' });
      fetchCards();
    } catch { fetchCards(); }
  };

  const handleSendToStaged = async (cardToSend?: UserCard) => {
    const target = cardToSend || selectedUserCard;
    if (!target) return;
    const updatedCard: UserCard = { ...target, binder_page: undefined, binder_slot: undefined };
    pushHistoryAction({ type: 'update_cards', description: `Enviar a pendientes`, prevCards: [target], newCards: [updatedCard] });
    setCards(prev => prev.map(c => c.id === target.id ? { ...c, binder_page: null as unknown as undefined, binder_slot: null as unknown as undefined } : c));
    if (selectedUserCard?.id === target.id) setSelectedUserCard(prev => prev ? { ...prev, binder_page: null as unknown as undefined, binder_slot: null as unknown as undefined } : null);
    setHasMutated(true);
    try {
      await updateCardApi({ id: target.id, binder_page: null, binder_slot: null });
      toast.success(`${target.card_details?.name || 'Carta'} enviada a pendientes`, { title: '¡Enviada a Pendientes!' });
      if (!isIdealMode) fetchCards();
    } catch { fetchCards(); }
  };

  const handleAssignToDeck = async (deckId: string, deckName: string, section: string = 'main') => {
    if (!selectedUserCard) return;
    await handleUpdateCard({ deck_id: deckId, deck_section: section as 'main' | 'extra' | 'side', status_flag: 'in_deck' });
    toast.success(`Carta asignada a ${deckName} (${section.toUpperCase()})`, { title: '¡Mazo asignado!' });
  };

  const handleApplyRecommendation = async (rec: BestRecommendation) => {
    if (!selectedUserCard) return;
    const updates: Partial<UserCard> = { status_flag: rec.suggestedStatusFlag, ...(rec.suggestedDeckId ? { deck_id: rec.suggestedDeckId, deck_section: 'main' } : {}) };
    if (rec.suggestedLocationId && rec.suggestedLocationId !== selectedUserCard.storage_location_id) {
      await handleUpdateCard({ ...updates, storage_location_id: rec.suggestedLocationId, binder_page: undefined, binder_slot: undefined });
      setCards(prev => prev.filter(c => c.id !== selectedUserCard.id));
      setSelectedUserCard(null);
    } else {
      await handleUpdateCard(updates);
    }
    toast.success(rec.title, { title: '✨ Clasificación Aplicada' });
  };

  const handleDeleteCard = async () => {
    if (!selectedUserCard || !confirm(`¿Eliminar "${selectedUserCard.card_details?.name || 'esta carta'}"?`)) return;
    pushHistoryAction({ type: 'delete_cards', description: `Eliminar ${selectedUserCard.card_details?.name || 'carta'}`, cards: [selectedUserCard] });
    const id = selectedUserCard.id;
    setSelectedUserCard(null);
    setCards(prev => prev.filter(c => c.id !== id));
    setHasMutated(true);
    try { await deleteCardApi(id); } catch { fetchCards(); }
  };

  return {
    handleSelectPhysicalCopy, handleAddCardToContainer, handleUpdateCard,
    handleMoveCard, handleSendToStaged, handleAssignToDeck, handleApplyRecommendation, handleDeleteCard,
  };
}
