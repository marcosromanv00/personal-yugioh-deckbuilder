'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { DeckVariant } from '@/types/collection';

interface PendingVariantSwitchModalProps {
  isOpen: boolean;
  targetVariant: DeckVariant | null;
  currentContextName: string;
  onConfirmSaveAndSwitch: () => void;
  onConfirmDiscardAndSwitch: () => void;
  onCancel: () => void;
}

export const PendingVariantSwitchModal: React.FC<PendingVariantSwitchModalProps> = ({
  isOpen,
  targetVariant,
  currentContextName,
  onConfirmSaveAndSwitch,
  onConfirmDiscardAndSwitch,
  onCancel,
}) => {
  if (!isOpen || !targetVariant) return null;

  return (
    <div className="fixed inset-0 z-70 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-zinc-900 dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-150 relative">
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-black text-sm text-zinc-900 dark:text-zinc-100">
              Cambios sin guardar
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              Cambiando a variante &quot;{targetVariant.name}&quot;
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Tienes modificaciones pendientes en <b className="text-zinc-900 dark:text-white font-bold">{currentContextName}</b>. Guarda o descarta tus cambios antes de cambiar de variante:
        </p>

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={onConfirmSaveAndSwitch}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer min-h-11 touch-manipulation shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            <span>Guardar y Cambiar</span>
          </button>

          <button
            type="button"
            onClick={onConfirmDiscardAndSwitch}
            className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer min-h-11 touch-manipulation flex items-center justify-center"
          >
            <span>Descartar y Cambiar</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 px-4 rounded-xl text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
