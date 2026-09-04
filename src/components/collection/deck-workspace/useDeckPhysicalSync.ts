'use client';

import { useState, useMemo } from 'react';
import { UserCard, Deck, DeckCardDetail, DeckCardPhysicalCopy } from '@/types/collection';
import { useToast } from '@/components/ui/ToastProvider';
import { calculateSectionBalances, buildDeckSavePayload, assignCopyReducer, unassignCopyReducer } from './deckWorkspacePhysical.utils';

interface UseDeckPhysicalSyncProps {
  currentDeck: Deck | null;
  deckCards: DeckCardDetail[];
  setDeckCards: React.Dispatch<React.SetStateAction<DeckCardDetail[]>>;
  userCards: UserCard[];
  setUserCards: React.Dispatch<React.SetStateAction<UserCard[]>>;
  setHasMutated: (mutated: boolean) => void;
  storageLocationId: string;
  compartmentIndex: number;
  name: string;
  format: string;
  isActive: boolean;
  sleevesPayload: Array<{ sleeve_id: string; section: string }>;
  onSuccess?: () => void;
  setInitialDeckCards: React.Dispatch<React.SetStateAction<DeckCardDetail[]>>;
}

export function useDeckPhysicalSync(props: UseDeckPhysicalSyncProps) {
  const {
    currentDeck,
    deckCards,
    setDeckCards,
    userCards,
    setUserCards,
    setHasMutated,
    storageLocationId,
    compartmentIndex,
    name,
    format,
    isActive,
    sleevesPayload,
    onSuccess,
    setInitialDeckCards,
  } = props;

  const toast = useToast();
  const [assignedUserCardIds, setAssignedUserCardIds] = useState<string[]>([]);
  const [unassignedUserCardIds, setUnassignedUserCardIds] = useState<string[]>([]);
  const [assignDrawerSection, setAssignDrawerSection] = useState<'main' | 'extra' | 'side' | 'pool' | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSavingSync, setIsSavingSync] = useState(false);

  // Vincular copia física a una carta del mazo en memoria
  const stageAssignUserCard = (cardId: number, section: string, copy: UserCard) => {
    setDeckCards((prev) => assignCopyReducer(prev, cardId, section, copy, currentDeck?.id));
    setAssignedUserCardIds((prev) => (prev.includes(copy.id) ? prev : [...prev, copy.id]));
    setUnassignedUserCardIds((prev) => prev.filter((id) => id !== copy.id));
    setHasMutated(true);
    toast.success(`Copia (${copy.rarity || 'Common'}) vinculada`);
  };

  // Desvincular copia física de una carta del mazo en memoria
  const stageUnassignUserCard = (cardId: number, section: string, userCardId: string) => {
    setDeckCards((prev) => unassignCopyReducer(prev, cardId, section, userCardId));
    if (assignedUserCardIds.includes(userCardId)) {
      setAssignedUserCardIds((prev) => prev.filter((id) => id !== userCardId));
    } else {
      setUnassignedUserCardIds((prev) => (prev.includes(userCardId) ? prev : [...prev, userCardId]));
    }
    setHasMutated(true);
    toast.info('Copia física desvinculada (se enviará a Inbox al guardar)');
  };

  // Balances derivados por sección
  const balances = useMemo(() => calculateSectionBalances(deckCards), [deckCards]);

  // Cartas pendientes para el Drawer guiado
  const pendingCardsForDrawer = useMemo(() => {
    if (!assignDrawerSection) return [];
    return deckCards.filter((c) => {
      const matchSec = assignDrawerSection === 'pool' ? c.section === 'pool' || c.section === 'extras' : c.section === assignDrawerSection;
      return matchSec && Math.max(0, c.count - (c.physical_copies?.length || 0)) > 0;
    });
  }, [deckCards, assignDrawerSection]);

  // Todas las cartas pendientes para el modal de sincronización
  const allPendingCards = useMemo(() => {
    return deckCards.filter((c) => Math.max(0, c.count - (c.physical_copies?.length || 0)) > 0);
  }, [deckCards]);

  // Copias desvinculadas para el modal de sincronización
  const unassignedUserCards = useMemo(() => {
    return unassignedUserCardIds
      .map((id) => userCards.find((uc) => uc.id === id))
      .filter((uc): uc is UserCard => Boolean(uc));
  }, [unassignedUserCardIds, userCards]);

  // Guardado atómico
  const executeAtomicSave = async ({
    inventoryCardsToAdd = [],
  }: {
    inventoryCardsToAdd?: Array<{
      id: number;
      count: number;
      rarity: string;
      condition: string;
      is_proxy: boolean;
      section: string;
    }>;
  }) => {
    if (!currentDeck) return;
    setIsSavingSync(true);

    try {
      const payload = buildDeckSavePayload({
        deckId: currentDeck.id,
        name: name.trim() || currentDeck.name,
        format,
        isActive,
        storageLocationId,
        compartmentIndex,
        sleevesPayload,
        deckCards,
        assignedUserCardIds,
        unassignedUserCardIds,
        inventoryCardsToAdd,
      });

      const res = await fetch('/api/decks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, register_to_inventory: inventoryCardsToAdd.length > 0 }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Error al guardar el mazo');
      }

      setInitialDeckCards(deckCards);
      setAssignedUserCardIds([]);
      setUnassignedUserCardIds([]);
      setIsSyncModalOpen(false);
      setHasMutated(false);
      toast.success('¡Mazo y estado físico guardados exitosamente!');

      const [cardsRes] = await Promise.all([fetch('/api/collection/cards'), fetch(`/api/decks/${currentDeck.id}`)]);
      if (cardsRes.ok) {
        const json = await cardsRes.json();
        setUserCards(json.data || []);
      }
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Error al guardar mazo');
    } finally {
      setIsSavingSync(false);
    }
  };

  const handleTriggerSave = () => {
    if (balances.totalPendingCount > 0 || unassignedUserCardIds.length > 0) {
      setIsSyncModalOpen(true);
    } else {
      executeAtomicSave({});
    }
  };

  return {
    assignedUserCardIds,
    setAssignedUserCardIds,
    unassignedUserCardIds,
    setUnassignedUserCardIds,
    assignDrawerSection,
    setAssignDrawerSection,
    isSyncModalOpen,
    setIsSyncModalOpen,
    isSavingSync,
    stageAssignUserCard,
    stageUnassignUserCard,
    ...balances,
    pendingCardsForDrawer,
    allPendingCards,
    unassignedUserCards,
    executeAtomicSave,
    handleTriggerSave,
  };
}
