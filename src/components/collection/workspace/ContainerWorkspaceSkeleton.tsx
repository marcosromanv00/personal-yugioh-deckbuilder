'use client';

import React from 'react';

interface ContainerWorkspaceSkeletonProps {
  containerType?: string;
}

export const ContainerWorkspaceSkeleton: React.FC<ContainerWorkspaceSkeletonProps> = ({
  containerType = 'box'
}) => {
  const isBinder = containerType === 'binder';

  return (
    <div className="space-y-4 animate-pulse select-none h-full flex flex-col justify-start">
      {/* Barra de Paginación y Resumen Skeleton */}
      <div className="flex items-center justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="w-36 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex items-center gap-2">
          <div className="w-20 h-7 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-20 h-7 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      {isBinder ? (
        /* VISTA BINDER SKELETON: Dos páginas de 3x3 pockets */
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 p-2">
          {/* Página Izquierda */}
          <div className="bg-zinc-100 dark:bg-zinc-900/80 p-3 sm:p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 grid grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={`left-pocket-${i}`}
                className="aspect-3/4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/40 dark:bg-zinc-950/40"
              />
            ))}
          </div>

          {/* Página Derecha */}
          <div className="bg-zinc-100 dark:bg-zinc-900/80 p-3 sm:p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 grid grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={`right-pocket-${i}`}
                className="aspect-3/4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/40 dark:bg-zinc-950/40"
              />
            ))}
          </div>
        </div>
      ) : (
        /* VISTA BOX / TIN / DECKBOX SKELETON: Grid de tarjetas */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 p-1">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={`box-card-skeleton-${i}`}
              className="p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2 shadow-xs"
            >
              <div className="aspect-3/4 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5" />
              <div className="flex justify-between items-center pt-1">
                <div className="w-12 h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded" />
                <div className="w-6 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
