import { useEffect, useState, useCallback } from 'react';

interface UseDeckBuilderShortcutsParams {
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  handleUndo: () => void;
  handleRedo: () => void;
  handleQuickSave: () => void | Promise<void>;
  showToastInfo: (msg: string) => void;
}

export function useDeckBuilderShortcuts({
  isDirty,
  canUndo,
  canRedo,
  handleUndo,
  handleRedo,
  handleQuickSave,
  showToastInfo,
}: UseDeckBuilderShortcutsParams) {
  const [isUnsavedConfirmOpen, setIsUnsavedConfirmOpen] = useState(false);
  const [pendingGuardedAction, setPendingGuardedAction] = useState<(() => void) | null>(null);

  // Advertencia de recarga/cierre de pestaña si hay progreso no guardado
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Interceptar botón atrás del navegador si hay progreso no guardado
  useEffect(() => {
    if (!isDirty) return;

    window.history.pushState({ deckbuilderGuard: true }, '');

    const handlePopState = () => {
      setIsUnsavedConfirmOpen(true);
      setPendingGuardedAction(() => () => {
        window.history.back();
      });
      window.history.pushState({ deckbuilderGuard: true }, '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isDirty]);

  // Envoltorio para acciones protegidas contra pérdida de datos
  const executeGuardedAction = useCallback(
    (action: () => void) => {
      if (isDirty) {
        setPendingGuardedAction(() => action);
        setIsUnsavedConfirmOpen(true);
      } else {
        action();
      }
    },
    [isDirty]
  );

  // Atajos de teclado para Deshacer / Rehacer / Guardado Rápido (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z, Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (canUndo) {
          handleUndo();
          showToastInfo('Acción deshecha');
        }
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        if (canRedo) {
          handleRedo();
          showToastInfo('Acción rehecha');
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void handleQuickSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, handleUndo, handleRedo, handleQuickSave, showToastInfo]);

  return {
    isUnsavedConfirmOpen,
    setIsUnsavedConfirmOpen,
    pendingGuardedAction,
    setPendingGuardedAction,
    executeGuardedAction,
  };
}
