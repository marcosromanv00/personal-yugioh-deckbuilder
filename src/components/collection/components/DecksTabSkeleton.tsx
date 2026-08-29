'use client';

import React from 'react';

interface DecksTabSkeletonProps {
  viewMode?: 'grid' | 'list';
}

export const DecksTabSkeleton: React.FC<DecksTabSkeletonProps> = ({ viewMode = 'grid' }) => {
  return (
    <div className="space-y-6 animate-pulse select-none">
      {/* Subcategory Selector Skeleton */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 animate-shimmer">
        <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="w-36 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-44 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="w-28 h-8 rounded-xl bg-red-200 dark:bg-red-950/50 hidden sm:block" />
      </div>

      {/* Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs animate-shimmer">
        <div className="w-full sm:w-72 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        <div className="flex items-center gap-2">
          <div className="w-16 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-48 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-32 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Grid or List of Decks Skeleton */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 shadow-xs animate-shimmer"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="w-36 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="flex gap-2">
                    <div className="w-12 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="w-16 h-3 rounded bg-zinc-100 dark:bg-zinc-800/60" />
                  </div>
                </div>
                <div className="w-10 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              </div>

              <div className="w-full h-8 rounded bg-zinc-100 dark:bg-zinc-800/50" />

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div className="w-20 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-24 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
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
                <div className="w-1.5 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="space-y-1">
                  <div className="w-32 h-3.5 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="w-20 h-2.5 rounded bg-zinc-100 dark:bg-zinc-800/60" />
                </div>
              </div>
              <div className="w-1/3 px-4">
                <div className="w-28 h-5 rounded-md bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="flex gap-2">
                <div className="w-16 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-8 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
