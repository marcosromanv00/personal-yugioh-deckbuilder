'use client';

import React from 'react';

export const CollectionCardsTabSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6 animate-pulse select-none">
      {/* ═══ BARRA SUPERIOR DE BÚSQUEDA Y FILTROS ═══ */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        {/* Buscador */}
        <div className="w-full md:w-80 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800" />

        {/* Acciones */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="w-32 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-28 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-24 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      {/* ═══ BARRA DE PAGINACIÓN SKELETON ═══ */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-2.5 sm:p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="w-36 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      {/* ═══ GRID RESPONSIVA DE CARTAS SKELETON ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 sm:gap-3">
        {Array.from({ length: 24 }).map((_, idx) => (
          <div
            key={`col-card-skeleton-${idx}`}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-2 sm:p-2.5 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-xs"
          >
            {/* Imagen con aspect ratio canónico de tarjeta */}
            <div className="aspect-3/4 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800 mb-2" />
            <div className="space-y-1.5">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800/60 rounded w-1/2" />
              <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-full mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
