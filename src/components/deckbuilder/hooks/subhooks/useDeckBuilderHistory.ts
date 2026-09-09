import { useState, useCallback } from 'react';
import { DeckCard } from '../../types';

export function useDeckBuilderHistory(
  deckCards: DeckCard[],
  setDeckCards: React.Dispatch<React.SetStateAction<DeckCard[]>>
) {
  const [historyStack, setHistoryStack] = useState<DeckCard[][]>([]);
  const [redoStack, setRedoStack] = useState<DeckCard[][]>([]);

  const pushHistory = useCallback((currentCards: DeckCard[]) => {
    setHistoryStack((prev) => [...prev.slice(-14), currentCards]);
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyStack.length === 0) return;
    const previous = historyStack[historyStack.length - 1];
    setRedoStack((prev) => [...prev, deckCards]);
    setDeckCards(previous);
    setHistoryStack((prev) => prev.slice(0, -1));
  }, [historyStack, deckCards, setDeckCards]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistoryStack((prev) => [...prev, deckCards]);
    setDeckCards(next);
    setRedoStack((prev) => prev.slice(0, -1));
  }, [redoStack, deckCards, setDeckCards]);

  return {
    historyStack,
    setHistoryStack,
    redoStack,
    setRedoStack,
    pushHistory,
    handleUndo,
    handleRedo,
    canUndo: historyStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}
