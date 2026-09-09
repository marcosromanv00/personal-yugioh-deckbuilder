import { useState, useCallback } from 'react';
import { DeckCard } from '../../types';
import { StorageLocation, UserCard } from '@/types/collection';
import { YdkImportParsedCard } from '../../components/YdkCollectionLinkModal';
import { parseYdkOrBulkToDeckCards, toggleCardPhysicalLinkHelper } from '../../deckBuilderModals.utils';

interface UseDeckBuilderModalsParams {
  deckCards: DeckCard[];
  setDeckCards: React.Dispatch<React.SetStateAction<DeckCard[]>>;
  deckName: string;
  setDeckName: (name: string) => void;
  format: string;
  setDeckId: (id: string | null) => void;
  allUserCards: UserCard[];
  locations: StorageLocation[];
  cardsToRegister: Record<number, boolean>;
  setCardsToRegister: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  setRegisterToInventory: (reg: boolean) => void;
  userInventoryCounts: Record<number, number>;
  setHistoryStack: React.Dispatch<React.SetStateAction<DeckCard[][]>>;
  setRedoStack: React.Dispatch<React.SetStateAction<DeckCard[][]>>;
}

export function useDeckBuilderModals({
  deckCards,
  setDeckCards,
  deckName,
  setDeckName,
  setDeckId,
  allUserCards,
  locations,
  cardsToRegister,
  setCardsToRegister,
  setRegisterToInventory,
  userInventoryCounts,
  setHistoryStack,
  setRedoStack,
}: UseDeckBuilderModalsParams) {
  const [isUnregisteredModalOpen, setIsUnregisteredModalOpen] = useState(false);
  const [unregisteredCards, setUnregisteredCards] = useState<import('../../components/UnregisteredCardsModal').UnregisteredCardItem[]>([]);
  const [isSavingUnregistered, setIsSavingUnregistered] = useState(false);
  const [isCollectionLinkModalOpen, setIsCollectionLinkModalOpen] = useState(false);
  const [pendingParsedYdkCards, setPendingParsedYdkCards] = useState<YdkImportParsedCard[]>([]);

  const exportYdkFile = useCallback(() => {
    const mainCards = deckCards.filter((c) => c.section === 'main');
    const extraCards = deckCards.filter((c) => c.section === 'extra');
    const sideCards = deckCards.filter((c) => c.section === 'side');

    let ydkText = `#created by Yu-Gi-Oh! Deckbuilder\n#main\n`;
    mainCards.forEach((c) => { for (let i = 0; i < c.count; i++) ydkText += `${c.id}\n`; });
    ydkText += `#extra\n`;
    extraCards.forEach((c) => { for (let i = 0; i < c.count; i++) ydkText += `${c.id}\n`; });
    ydkText += `!side\n`;
    sideCards.forEach((c) => { for (let i = 0; i < c.count; i++) ydkText += `${c.id}\n`; });

    const blob = new Blob([ydkText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${deckName.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'deck'}.ydk`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [deckCards, deckName]);

  const handleExcludeExisting = useCallback(() => {
    const updated = { ...cardsToRegister };
    deckCards.forEach((c) => {
      const inInventory = userInventoryCounts[c.id] || 0;
      if (inInventory >= c.count) updated[c.id] = false;
    });
    setCardsToRegister(updated);
  }, [cardsToRegister, deckCards, userInventoryCounts, setCardsToRegister]);

  const handleImportYdkOrBulk = async (rawInput: string) => {
    if (!rawInput.trim()) return;
    const directMappedCards = await parseYdkOrBulkToDeckCards(rawInput);
    setDeckCards(directMappedCards);
    setHistoryStack([]);
    setRedoStack([]);
    setDeckId(null);
    setDeckName('Deck Importado YDK / Bulk');
  };

  const confirmCollectionLinkImport = (cardsWithCopies: DeckCard[], unlinkedCardIds: Record<number, number>) => {
    setDeckCards(cardsWithCopies);
    setHistoryStack([]);
    setRedoStack([]);
    setDeckId(null);
    setDeckName('Deck Importado YDK / Bulk');
    setIsCollectionLinkModalOpen(false);
    setPendingParsedYdkCards([]);

    if (Object.keys(unlinkedCardIds).length > 0) {
      setRegisterToInventory(true);
      setCardsToRegister((prev) => {
        const updated = { ...prev };
        Object.keys(unlinkedCardIds).forEach((idStr) => {
          if (unlinkedCardIds[Number(idStr)] > 0) updated[Number(idStr)] = true;
        });
        return updated;
      });
    }
  };

  const handleToggleCardLink = useCallback((cardId: number, section: 'main' | 'extra' | 'side' | 'extras', copyIndex?: number) => {
    setDeckCards((prev) => toggleCardPhysicalLinkHelper(prev, cardId, section, copyIndex, allUserCards, locations));
  }, [allUserCards, locations, setDeckCards]);

  return {
    isUnregisteredModalOpen,
    setIsUnregisteredModalOpen,
    unregisteredCards,
    setUnregisteredCards,
    isSavingUnregistered,
    setIsSavingUnregistered,
    isCollectionLinkModalOpen,
    setIsCollectionLinkModalOpen,
    pendingParsedYdkCards,
    setPendingParsedYdkCards,
    exportYdkFile,
    handleExcludeExisting,
    handleImportYdkOrBulk,
    confirmCollectionLinkImport,
    handleToggleCardLink,
  };
}
