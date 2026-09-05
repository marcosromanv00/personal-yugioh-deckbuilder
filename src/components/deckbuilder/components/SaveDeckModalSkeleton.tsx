'use client';

import React from 'react';
import { Save, X } from 'lucide-react';

export const SaveDeckModalSkeleton: React.FC = () => {
  return (
    <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 text-zinc-900 dark:text-zinc-100 space-y-5">
        {/* Cabecera Skeleton */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-600">
              <Save className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-850 rounded animate-pulse" />
            </div>
          </div>
          <div className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 opacity-60">
            <X className="w-4 h-4" />
          </div>
        </div>

        {/* Wizard Stepper Pills Skeleton */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="h-8 rounded-xl bg-zinc-200 dark:bg-zinc-850 animate-pulse" />
          ))}
        </div>

        {/* Formulario Skeleton */}
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-850 rounded-xl animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-850 rounded-xl animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-850 rounded-xl animate-pulse" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="h-3 w-36 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-16 w-full bg-zinc-100 dark:bg-zinc-850 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Botonera Inferior Skeleton */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="h-10 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
          <div className="h-10 w-32 bg-red-600/30 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
};
