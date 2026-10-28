'use client';

import { useEffect, useCallback } from 'react';

interface UseTriageKeyboardShortcutsProps {
  onAction1: () => void; // Asignar a mazo activo
  onAction2: () => void; // Proyecto temático
  onAction3: () => void; // Taller / Ensalada
  onAction4: () => void; // Binder Colección
  onAction5: () => void; // Venta / Trade
  onAction6: () => void; // Bulk / Descarte
  onOpenRarityModal: () => void;
  onNavigateNext: () => void;
  onNavigatePrev: () => void;
  onUndo: () => void;
  canUndo: boolean;
  isDisabled?: boolean;
}

export function useTriageKeyboardShortcuts({
  onAction1,
  onAction2,
  onAction3,
  onAction4,
  onAction5,
  onAction6,
  onOpenRarityModal,
  onNavigateNext,
  onNavigatePrev,
  onUndo,
  canUndo,
  isDisabled = false,
}: UseTriageKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isDisabled) return;

      // Guarda: No procesar atajos si el foco está en un campo de texto
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Deshacer con Ctrl+Z o Cmd+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (canUndo) {
          onUndo();
        }
        return;
      }

      switch (e.key) {
        case '1':
          e.preventDefault();
          onAction1();
          break;
        case '2':
          e.preventDefault();
          onAction2();
          break;
        case '3':
          e.preventDefault();
          onAction3();
          break;
        case '4':
          e.preventDefault();
          onAction4();
          break;
        case '5':
          e.preventDefault();
          onAction5();
          break;
        case '6':
        case 'b':
        case 'B':
          e.preventDefault();
          onAction6();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          onOpenRarityModal();
          break;
        case 'ArrowRight':
        case ' ': // Barra espaciadora también avanza
          e.preventDefault();
          onNavigateNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onNavigatePrev();
          break;
        default:
          break;
      }
    },
    [
      isDisabled,
      canUndo,
      onUndo,
      onAction1,
      onAction2,
      onAction3,
      onAction4,
      onAction5,
      onAction6,
      onOpenRarityModal,
      onNavigateNext,
      onNavigatePrev,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
