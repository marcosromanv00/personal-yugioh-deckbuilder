'use client';

import React from 'react';
import { BookOpen, Package } from 'lucide-react';
import { StorageLocation } from '@/types/collection';

interface TriageDestinationSelectsProps {
  locations: StorageLocation[];
  targetBinderLocationId: string;
  onSelectBinderLocation: (id: string) => void;
  targetBulkLocationId: string;
  onSelectBulkLocation: (id: string) => void;
}

export const TriageDestinationSelects: React.FC<TriageDestinationSelectsProps> = ({
  locations,
  targetBinderLocationId,
  onSelectBinderLocation,
  targetBulkLocationId,
  onSelectBulkLocation,
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 1. Selector Binder Destino (Acciones 4 y 5) */}
      <div className="flex items-center gap-1.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-lg px-2 py-1 text-xs">
        <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <span className="text-[10px] font-mono font-bold text-blue-900 dark:text-blue-200 hidden xl:inline">
          Binder [4/5]:
        </span>
        <select
          value={targetBinderLocationId}
          onChange={e => onSelectBinderLocation(e.target.value)}
          title="Ubicación física para Binder y Venta"
          className="bg-transparent text-[11px] font-mono font-bold text-blue-900 dark:text-blue-200 focus:outline-hidden cursor-pointer max-w-28 sm:max-w-36 truncate"
        >
          {locations.map(loc => (
            <option key={loc.id} value={loc.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Selector Bulk Destino (Acción 6) */}
      <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs">
        <Package className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400 shrink-0" />
        <span className="text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 hidden xl:inline">
          Bulk [6]:
        </span>
        <select
          value={targetBulkLocationId}
          onChange={e => onSelectBulkLocation(e.target.value)}
          title="Ubicación física para Descarte a Bulk"
          className="bg-transparent text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200 focus:outline-hidden cursor-pointer max-w-28 sm:max-w-36 truncate"
        >
          {locations.map(loc => (
            <option key={loc.id} value={loc.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
              {loc.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
