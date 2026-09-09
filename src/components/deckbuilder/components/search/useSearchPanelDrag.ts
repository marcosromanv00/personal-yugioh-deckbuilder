import { useState, useRef } from 'react';

export function useSearchPanelDrag(
  onDropRemoveCard?: (cardId: number, fromSection: 'main' | 'extra' | 'side' | 'extras', copyIndex?: number) => void
) {
  const [isDragOverRemove, setIsDragOverRemove] = useState(false);
  const dragCounterRef = useRef(0);

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('application/json')) setIsDragOverRemove(true);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragOverRemove(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragOverRemove(false);
    const jsonStr = e.dataTransfer.getData('application/json');
    if (!jsonStr) return;
    try {
      const cardObj = JSON.parse(jsonStr);
      if (cardObj?.id && cardObj?.fromSection && onDropRemoveCard) {
        onDropRemoveCard(cardObj.id, cardObj.fromSection, cardObj.copyIndex);
      }
    } catch (err) {
      console.error('Error al soltar carta:', err);
    }
  };

  return { isDragOverRemove, panelDragHandlers: { onDragEnter, onDragOver, onDragLeave, onDrop } };
}
