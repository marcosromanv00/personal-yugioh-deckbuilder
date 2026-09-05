'use client';

import React, { useState } from 'react';
import { Box, ChevronDown, ClipboardList } from 'lucide-react';
import { StorageLocation } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

interface PickListItem {
  id: string;
  name: string;
  type: string;
  colorCode?: string;
  cards: Array<{
    cardId: number;
    name: string;
    rarity: string;
    count: number;
    image_url: string;
    locationDetail?: string;
  }>;
}

interface SaveDeckStep2StorageProps {
  locations: StorageLocation[];
  targetLocationId: string;
  setTargetLocationId: (id: string) => void;
  selectedLaneIndex?: number;
  setSelectedLaneIndex?: (index: number) => void;
  extractionPickList?: PickListItem[];
}

export const SaveDeckStep2Storage: React.FC<SaveDeckStep2StorageProps> = ({
  locations,
  targetLocationId,
  setTargetLocationId,
  selectedLaneIndex = 0,
  setSelectedLaneIndex,
  extractionPickList = [],
}) => {
  const [isPickListExpanded, setIsPickListExpanded] = useState(false);
  const selectedLoc = locations.find((l) => l.id === targetLocationId);
  const laneNames = selectedLoc?.compartments?.names || [];
  const hasMultipleLanes = Boolean(selectedLoc?.compartments && (selectedLoc.compartments.count > 1 || laneNames.length > 1));

  const totalCardsToExtract = extractionPickList.reduce(
    (acc, loc) => acc + loc.cards.reduce((sum, c) => sum + c.count, 0),
    0
  );

  return (
    <div className="space-y-4 py-1">
      {/* Contenedor y Carril */}
      <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center gap-1.5">
          <Box className="w-4 h-4 text-amber-500" />
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Almacenamiento Físico del Mazo
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">Caja o Contenedor</label>
            <PremiumDropdown
              value={targetLocationId}
              onChange={(val) => {
                setTargetLocationId(val);
                if (setSelectedLaneIndex) setSelectedLaneIndex(0);
              }}
              align="full"
              size="sm"
              options={[
                { value: 'inbox', label: '📥 Inbox (Sin contenedor específico)' },
                ...locations.map((loc) => ({
                  value: loc.id,
                  label: `📦 ${loc.name} (${loc.type})`,
                })),
              ]}
            />
          </div>

          {hasMultipleLanes && selectedLoc && (
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">
                Carril en &quot;{selectedLoc.name}&quot;
              </label>
              <PremiumDropdown
                value={String(selectedLaneIndex)}
                onChange={(val) => setSelectedLaneIndex?.(parseInt(val, 10) || 0)}
                align="full"
                size="sm"
                options={laneNames.map((name, idx) => ({
                  value: String(idx),
                  label: `Carril ${idx + 1}: ${name || `Espacio ${idx + 1}`}`,
                }))}
              />
            </div>
          )}
        </div>
      </div>

      {/* Plan de Extracción Físico (Pick List) */}
      {extractionPickList.length > 0 && (
        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden transition-all shadow-2xs">
          <button
            type="button"
            onClick={() => setIsPickListExpanded(!isPickListExpanded)}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer select-none touch-manipulation"
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-red-500 shrink-0" />
              <div>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                  Plan de Extracción Físico (Pick List)
                </span>
                <span className="text-[10px] text-zinc-500">
                  {extractionPickList.length} ubicaciones origen • {totalCardsToExtract} cartas a recolectar
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {totalCardsToExtract} cartas
              </span>
              <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isPickListExpanded ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {isPickListExpanded && (
            <div className="p-3 pt-0 space-y-2 border-t border-zinc-200 dark:border-zinc-800/60 max-h-48 overflow-y-auto scrollbar-thin">
              {extractionPickList.map((group) => (
                <div key={group.id} className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 block">
                    📁 {group.name} ({group.type})
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    {group.cards.map((c) => (
                      <div key={`${group.id}-${c.cardId}`} className="flex items-center justify-between gap-1 text-zinc-700 dark:text-zinc-300">
                        <span className="truncate">{c.name}</span>
                        <span className="font-mono font-bold shrink-0 text-red-600">x{c.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
