import React from 'react';
import Image from 'next/image';
import { StorageLocation } from '@/types/collection';
import { QueuedCardItem } from './manualAdder.types';
import { ManualAdderFormFields } from './ManualAdderFormFields';

interface ManualAdderDetailsSectionProps {
  activeCard: QueuedCardItem | null;
  locations: StorageLocation[];
  onUpdateActiveCard: (updates: Partial<QueuedCardItem>) => void;
}

export const ManualAdderDetailsSection: React.FC<ManualAdderDetailsSectionProps> = ({
  activeCard,
  locations,
  onUpdateActiveCard,
}) => {
  return (
    <div className="w-full lg:w-80 xl:w-96 p-4 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 flex flex-col min-h-0 bg-zinc-50/50 dark:bg-zinc-950/40 shrink-0 overflow-y-auto scrollbar-thin">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-3 shrink-0">
        <h3 className="font-black text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <span className="text-red-500">⚙️</span>
          <span>Detalles del Registro</span>
        </h3>
        <span className="text-[10px] text-zinc-500 font-mono">
          Configura los atributos físicos de la carta activa
        </span>
      </div>

      {activeCard ? (
        <div className="space-y-4">
          {/* Card Mini Header */}
          <div className="flex gap-3 bg-white dark:bg-zinc-950 p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="relative w-16 shrink-0 aspect-[3/4.2] rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900">
              <Image
                src={activeCard.image_url_small || activeCard.image_url}
                alt={activeCard.name}
                fill
                sizes="64px"
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono text-zinc-400">ID #{activeCard.card_id}</span>
                <h4 className="font-black text-xs line-clamp-2 text-zinc-900 dark:text-zinc-100">
                  {activeCard.name}
                </h4>
                {activeCard.archetype && (
                  <span className="inline-block mt-0.5 px-1 py-0.2 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-[8px] font-bold rounded uppercase">
                    {activeCard.archetype}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-zinc-500 font-medium truncate">
                {activeCard.type}
              </span>
            </div>
          </div>

          <ManualAdderFormFields
            activeCard={activeCard}
            locations={locations}
            onUpdateActiveCard={onUpdateActiveCard}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-zinc-400">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-xl mb-3 shadow-inner">
            👆
          </div>
          <p className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Selecciona una carta
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-45 leading-relaxed">
            Toca cualquier carta del grid central para ajustar su rareza, condición o contenedor.
          </p>
        </div>
      )}
    </div>
  );
};
