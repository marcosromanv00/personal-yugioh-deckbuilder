'use client';

import React from 'react';

export const SleevesTabSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse select-none">
      {/* ═══ TOOLBAR SKELETON ═══ */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        {/* Buscador Skeleton */}
        <div className="w-full md:w-80 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800" />

        {/* Acciones y Filtros Skeleton */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="w-28 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-24 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-28 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-28 h-10 rounded-xl bg-red-200 dark:bg-red-950/50" />
        </div>
      </div>

      {/* ═══ CHIPS DE INVENTARIO Y MÉTRICAS SKELETON ═══ */}
      <div className="flex items-center gap-3 flex-wrap p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80">
        <div className="w-32 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="w-28 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="w-36 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* ═══ GRID DE TARJETAS DE FUNDAS SKELETON ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 shadow-xs"
          >
            {/* Cabecera de la Tarjeta */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="space-y-1.5">
                  <div className="w-24 h-3.5 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="w-16 h-2.5 rounded bg-zinc-100 dark:bg-zinc-800/60" />
                </div>
              </div>
              <div className="w-8 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            </div>

            {/* Badges de Tamaño y Condición */}
            <div className="flex gap-1.5">
              <div className="w-14 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800" />
              <div className="w-16 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800" />
            </div>

            {/* Barra de Progreso y Disponibilidad */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <div className="flex justify-between">
                <div className="w-20 h-2.5 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-10 h-2.5 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
