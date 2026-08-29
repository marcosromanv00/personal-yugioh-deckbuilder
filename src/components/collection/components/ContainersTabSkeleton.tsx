'use client';

import React from 'react';

interface ContainersTabSkeletonProps {
  viewMode?: 'grid' | 'list';
}

export const ContainersTabSkeleton: React.FC<ContainersTabSkeletonProps> = ({ viewMode = 'grid' }) => {
  return (
    <div className="space-y-6 animate-pulse select-none">
      {/* Barra superior Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs animate-shimmer">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-1.5">
            <div className="w-36 h-4 rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <div className="w-56 h-3 rounded-md bg-zinc-100 dark:bg-zinc-800/60" />
          </div>
        </div>

        {/* Acciones Skeleton: View Mode + Organizar + Filtro + Refrescar + Nuevo */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="w-16 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-24 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-20 h-9 rounded-xl bg-red-200 dark:bg-red-950/50" />
        </div>
      </div>

      {/* Grid o Lista de Tarjetas Skeleton */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Inbox Skeleton */}
          <div className="p-4.5 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 space-y-4 animate-shimmer">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-200 dark:bg-amber-900/50" />
                <div className="space-y-1.5">
                  <div className="w-24 h-3.5 rounded bg-amber-200 dark:bg-amber-900/50" />
                  <div className="w-16 h-2.5 rounded bg-amber-100 dark:bg-amber-900/30" />
                </div>
              </div>
              <div className="w-12 h-6 rounded-lg bg-amber-200 dark:bg-amber-900/50" />
            </div>
            <div className="w-full h-8 rounded bg-amber-100/60 dark:bg-amber-950/40" />
            <div className="pt-2 border-t border-amber-200/50 dark:border-amber-900/30 flex justify-between">
              <div className="w-20 h-3 rounded bg-amber-200 dark:bg-amber-900/50" />
              <div className="w-16 h-3 rounded bg-amber-200 dark:bg-amber-900/50" />
            </div>
          </div>

          {/* 5 Container Card Skeletons */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-4.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 shadow-xs animate-shimmer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                  <div className="space-y-1.5">
                    <div className="w-28 h-3.5 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="w-20 h-2.5 rounded bg-zinc-100 dark:bg-zinc-800/60" />
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800" />
                  <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800" />
                </div>
              </div>

              <div className="w-3/4 h-3 rounded bg-zinc-100 dark:bg-zinc-800/60" />

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                <div className="flex justify-between">
                  <div className="w-16 h-2.5 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="w-10 h-2.5 rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-shimmer shadow-xs"
            >
              <div className="flex items-center gap-3 w-1/3">
                <div className="w-1 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="space-y-1">
                  <div className="w-28 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="w-20 h-2 rounded bg-zinc-100 dark:bg-zinc-800/60" />
                </div>
              </div>
              <div className="w-1/3 px-4">
                <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="flex gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const DecksPanelSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4 animate-shimmer select-none">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="w-24 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="w-12 h-4 rounded-md bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="w-full h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800/60" />
      <div className="flex gap-1.5">
        <div className="w-14 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="w-20 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
        <div className="w-16 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
      </div>

      <div className="space-y-2.5 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="w-24 h-3.5 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="w-10 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="flex items-center justify-between">
              <div className="w-14 h-2.5 rounded bg-zinc-100 dark:bg-zinc-800/60" />
              <div className="w-16 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
