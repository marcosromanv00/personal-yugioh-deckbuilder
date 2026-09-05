'use client';

import React from 'react';
import { Scissors, Box, Trash2, Check } from 'lucide-react';
import { UserCard, StorageLocation } from '@/types/collection';

interface CollectionCardActionsBarProps {
  userCard: UserCard;
  storedLocation?: StorageLocation;
  onOpenSplitModal?: (card?: UserCard) => void;
  onOpenContainer?: (loc: StorageLocation) => void;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
  isSaving?: boolean;
}

export const CollectionCardActionsBar: React.FC<CollectionCardActionsBarProps> = ({
  userCard,
  storedLocation,
  onOpenSplitModal,
  onOpenContainer,
  onDelete,
  onClose,
  isSaving,
}) => {
  return (
    <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap shrink-0">
      <div className="flex items-center gap-2">
        {/* Separar Copias */}
        {userCard.quantity > 1 && onOpenSplitModal && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSplitModal(userCard);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer touch-manipulation"
            title="Separar una o más copias a un registro independiente"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-500" />
            <span>Separar Copias</span>
          </button>
        )}

        {/* Ir al contenedor directo */}
        {storedLocation && onOpenContainer && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenContainer(storedLocation);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer touch-manipulation"
          >
            <Box className="w-3.5 h-3.5 text-cyan-500" />
            <span>Abrir Contenedor</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Botón Eliminar Carta */}
        <button
          type="button"
          onClick={async () => {
            if (window.confirm('¿Seguro que deseas eliminar esta carta de tu inventario?')) {
              onClose();
              await onDelete(userCard.id);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs font-bold transition-all cursor-pointer touch-manipulation"
          title="Eliminar esta carta del inventario"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Eliminar</span>
        </button>

        {/* Botón Listo */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md touch-manipulation"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Guardando...' : 'Listo'}</span>
        </button>
      </div>
    </div>
  );
};
