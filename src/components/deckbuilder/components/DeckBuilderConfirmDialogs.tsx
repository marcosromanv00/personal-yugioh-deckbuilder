import React from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface DeckBuilderConfirmDialogsProps {
  isClearOpen: boolean;
  onConfirmClear: () => void;
  onCloseClear: () => void;

  isDeleteOpen: boolean;
  deckName: string;
  isDeleting: boolean;
  onConfirmDelete: () => void | Promise<void>;
  onCloseDelete: () => void;

  isUnsavedOpen: boolean;
  onConfirmDiscardUnsaved: () => void;
  onSaveUnsaved: () => void;
  onCloseUnsaved: () => void;
}

export function DeckBuilderConfirmDialogs({
  isClearOpen,
  onConfirmClear,
  onCloseClear,
  isDeleteOpen,
  deckName,
  isDeleting,
  onConfirmDelete,
  onCloseDelete,
  isUnsavedOpen,
  onConfirmDiscardUnsaved,
  onSaveUnsaved,
  onCloseUnsaved,
}: DeckBuilderConfirmDialogsProps) {
  return (
    <>
      <ConfirmDialog
        isOpen={isClearOpen}
        title="¿Limpiar todas las cartas del Deck?"
        description="Se removerán todas las cartas del Main, Extra, Side y Extras del editor actual. Puedes revertir esta acción usando Deshacer (Ctrl+Z)."
        confirmLabel="Limpiar Deck"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={onConfirmClear}
        onClose={onCloseClear}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="¿Eliminar baraja de la base de datos?"
        description={`¿Estás seguro de que deseas eliminar permanentemente la baraja "${deckName}" de tu base de datos? Las cartas físicas que contiene permanecerán intactas en tu colección general.`}
        confirmLabel="Eliminar Baraja"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={onConfirmDelete}
        onClose={onCloseDelete}
      />

      <ConfirmDialog
        isOpen={isUnsavedOpen}
        title="¿Descartar cambios no guardados?"
        description={`Tienes modificaciones no guardadas en el mazo "${deckName}". Si continúas con esta acción, perderás tu avance no guardado.`}
        confirmLabel="Descartar y Continuar"
        cancelLabel="Continuar Editando"
        saveLabel="Guardar Mazo"
        variant="warning"
        onConfirm={onConfirmDiscardUnsaved}
        onSave={onSaveUnsaved}
        onClose={onCloseUnsaved}
      />
    </>
  );
}
