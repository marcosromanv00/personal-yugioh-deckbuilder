'use client';

import React from 'react';

export const DeckWorkspaceSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse select-none p-4 sm:p-6 overflow-y-auto">
      {/* ═══ SECCIÓN 1: MAIN DECK SKELETON ═══ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-red-200 dark:bg-red-950/60" />
            <div className="w-24 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="w-16 h-4 rounded bg-red-100 dark:bg-red-950/50" />
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={`main-skeleton-${i}`}
              className="aspect-3/4 rounded-xl bg-zinc-200 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800"
            />
          ))}
        </div>
      </div>

      {/* ═══ SECCIÓN 2: EXTRA DECK SKELETON ═══ */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-purple-200 dark:bg-purple-950/60" />
            <div className="w-24 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="w-16 h-4 rounded bg-purple-100 dark:bg-purple-950/50" />
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={`extra-skeleton-${i}`}
              className="aspect-3/4 rounded-xl bg-zinc-200 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
