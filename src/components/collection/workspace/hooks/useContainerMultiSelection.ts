import { useState, useMemo, useCallback } from 'react';
import { UserCard } from '@/types/collection';
import { GridCardGroup } from '../types';

export interface UseContainerMultiSelectionProps {
  cards: UserCard[];
  selectedUserCard: UserCard | null;
  toast: {
    info: (msg: string, opts?: { title?: string }) => void;
    error: (msg: string, opts?: { title?: string }) => void;
    success: (msg: string, opts?: { title?: string }) => void;
  };
}

export interface ContainerMultiSelectionState {
  isSelectMode: boolean;
  setIsSelectMode: React.Dispatch<React.SetStateAction<boolean>>;
  selectedCardIds: string[];
  setSelectedCardIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedCards: UserCard[];
  selectedCardsCount: number;
  selectedPhysicalCount: number;
  canSplitSingleCard: boolean;
  toggleSelectCard: (id: string) => void;
  toggleSelectGroup: (group: GridCardGroup) => void;
  selectAllFilteredCards: (filteredList?: UserCard[]) => void;
  handleSelectAllStaged: () => void;
  clearCardSelection: () => void;
}

/**
 * useContainerMultiSelection
 * Sub-hook modular para la selección individual, grupal y en lote
 * de cartas físicas dentro del contenedor.
 */
export function useContainerMultiSelection({
  cards,
  selectedUserCard,
  toast,
}: UseContainerMultiSelectionProps): ContainerMultiSelectionState {
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  // Array de UserCards seleccionadas actualmente
  const selectedCards = useMemo(() => {
    return cards.filter(c => selectedCardIds.includes(c.id));
  }, [cards, selectedCardIds]);

  const selectedCardsCount = selectedCardIds.length;

  const selectedPhysicalCount = useMemo(() => {
    return selectedCards.reduce((sum, c) => sum + (c.quantity || 1), 0);
  }, [selectedCards]);

  const canSplitSingleCard = useMemo(() => {
    if (selectedCardIds.length === 1) {
      const target = cards.find(c => c.id === selectedCardIds[0]);
      return (target?.quantity || 1) > 1;
    }
    if (selectedUserCard && (selectedUserCard.quantity || 1) > 1) {
      return true;
    }
    return false;
  }, [selectedCardIds, cards, selectedUserCard]);

  // Alternar selección de una carta individual
  const toggleSelectCard = useCallback((id: string) => {
    setSelectedCardIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  // Alternar selección de un grupo de cartas (ej. en GridView)
  const toggleSelectGroup = useCallback((group: GridCardGroup) => {
    const groupIds = group.allVariants.map(v => v.id);
    setSelectedCardIds(prev => {
      const allSelected = groupIds.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !groupIds.includes(id));
      } else {
        const set = new Set([...prev, ...groupIds]);
        return Array.from(set);
      }
    });
  }, []);

  // Seleccionar todas las cartas filtradas visibles
  const selectAllFilteredCards = useCallback((filteredList?: UserCard[]) => {
    const targetCards = filteredList || cards;
    const allIds = targetCards.map(c => c.id);
    setSelectedCardIds(Array.from(new Set(allIds)));
  }, [cards]);

  // Seleccionar todas las cartas desubicadas / pendientes del binder
  const handleSelectAllStaged = useCallback(() => {
    const staged = cards.filter(c => !c.binder_page || !c.binder_slot || c.binder_page <= 0 || c.binder_slot <= 0);
    const stagedIds = staged.map(c => c.id);
    if (stagedIds.length === 0) {
      toast.info('No hay cartas pendientes en este binder.');
      return;
    }
    setSelectedCardIds(Array.from(new Set(stagedIds)));
    setIsSelectMode(true);
    toast.info(`${stagedIds.length} cartas pendientes seleccionadas. Usa la barra inferior para moverlas o administrarlas.`, { title: 'Pendientes seleccionadas' });
  }, [cards, toast]);

  // Limpiar selección de cartas
  const clearCardSelection = useCallback(() => {
    setSelectedCardIds([]);
  }, []);

  return {
    isSelectMode,
    setIsSelectMode,
    selectedCardIds,
    setSelectedCardIds,
    selectedCards,
    selectedCardsCount,
    selectedPhysicalCount,
    canSplitSingleCard,
    toggleSelectCard,
    toggleSelectGroup,
    selectAllFilteredCards,
    handleSelectAllStaged,
    clearCardSelection,
  };
}
