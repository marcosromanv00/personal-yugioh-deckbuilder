'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { StorageLocation } from '@/types/collection';
import { TriageScopeConfig } from '@/types/triage';
import { TriageDestinationSelects } from './TriageDestinationSelects';

interface TriageHeaderScopeSelectorProps {
  scopeConfig: TriageScopeConfig;
  setScopeConfig: React.Dispatch<React.SetStateAction<TriageScopeConfig>>;
  locations: StorageLocation[];
  currentIndex: number;
  totalCards: number;
  targetBinderLocationId: string;
  onSelectBinderLocation: (id: string) => void;
  targetBulkLocationId: string;
  onSelectBulkLocation: (id: string) => void;
  availableThemes: { name: string; count: number }[];
  bulkCardsCount?: number;
}

export const TriageHeaderScopeSelector: React.FC<TriageHeaderScopeSelectorProps> = ({
  scopeConfig,
  setScopeConfig,
  locations,
  currentIndex,
  totalCards,
  targetBinderLocationId,
  onSelectBinderLocation,
  targetBulkLocationId,
  onSelectBulkLocation,
  availableThemes,
  bulkCardsCount = 0,
}) => {
  const selectedLocation = locations.find(l => l.id === scopeConfig.locationId) || null;
  const compartmentsCount = selectedLocation?.compartments?.count || 1;
  const compartmentNames = selectedLocation?.compartments?.names || [];

  const progressPercent = totalCards > 0 ? Math.min(100, Math.round(((currentIndex + 1) / totalCards) * 100)) : 0;

  return (
    <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 shrink-0 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Lado izquierdo: Botón volver + Título + Selector de Alcance */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/collection"
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Colección</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-red-600/10 text-red-600 dark:text-red-400 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <h1 className="text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Mesa de Triaje
            </h1>
          </div>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

          {/* Selectores de Alcance */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. Tipo de Alcance */}
            <select
              value={scopeConfig.scopeType}
              onChange={e => {
                const val = e.target.value as TriageScopeConfig['scopeType'];
                setScopeConfig(prev => ({
                  ...prev,
                  scopeType: val,
                  locationId: val === 'location' || val === 'compartment' ? prev.locationId || locations[0]?.id || null : null,
                  compartmentIndex: val === 'compartment' ? prev.compartmentIndex ?? 0 : null,
                  themeTag: val === 'theme' ? prev.themeTag || availableThemes[0]?.name || '' : null,
                }));
              }}
              className="text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-red-500 cursor-pointer"
            >
              <option value="all">Toda la Colección</option>
              <option value="location">Por Contenedor</option>
              <option value="compartment">Por Carril Específico</option>
              <option value="theme">🔥 Por Mesa Temática</option>
              <option value="bulk">📦 Cartas en Bulk ({bulkCardsCount})</option>
            </select>

            {/* 2. Selector de Temática (si es 'theme') */}
            {scopeConfig.scopeType === 'theme' && (
              <select
                value={scopeConfig.themeTag || ''}
                onChange={e => setScopeConfig(prev => ({ ...prev, themeTag: e.target.value }))}
                className="text-xs font-mono font-bold bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg px-2.5 py-1.5 text-purple-900 dark:text-purple-200 focus:outline-hidden focus:ring-1 focus:ring-purple-500 max-w-44 truncate cursor-pointer"
              >
                <option value="">Seleccionar Temática...</option>
                {availableThemes.map(th => (
                  <option key={th.name} value={th.name}>
                    {th.name} ({th.count})
                  </option>
                ))}
              </select>
            )}

            {/* 3. Selector de Contenedor (si es 'location' o 'compartment') */}
            {(scopeConfig.scopeType === 'location' || scopeConfig.scopeType === 'compartment') && (
              <select
                value={scopeConfig.locationId || ''}
                onChange={e => {
                  const locId = e.target.value;
                  setScopeConfig(prev => ({ ...prev, locationId: locId, compartmentIndex: 0 }));
                }}
                className="text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-red-500 max-w-44 truncate cursor-pointer"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            )}

            {/* 4. Selector de Carril (si es 'compartment') */}
            {scopeConfig.scopeType === 'compartment' && (
              <select
                value={scopeConfig.compartmentIndex ?? 0}
                onChange={e => {
                  const idx = parseInt(e.target.value, 10);
                  setScopeConfig(prev => ({ ...prev, compartmentIndex: idx }));
                }}
                className="text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-red-500 max-w-36 truncate cursor-pointer"
              >
                {Array.from({ length: compartmentsCount }, (_, i) => (
                  <option key={i} value={i}>
                    {compartmentNames[i] ? `Carril ${i + 1}: ${compartmentNames[i]}` : `Carril ${i + 1}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden lg:block" />

          {/* Selectores de Ubicaciones Destino (Binder y Bulk) */}
          <TriageDestinationSelects
            locations={locations}
            targetBinderLocationId={targetBinderLocationId}
            onSelectBinderLocation={onSelectBinderLocation}
            targetBulkLocationId={targetBulkLocationId}
            onSelectBulkLocation={onSelectBulkLocation}
            bulkCardsCount={bulkCardsCount}
            onViewBulk={() => setScopeConfig(prev => ({ ...prev, scopeType: 'bulk', onlyUnclassified: false }))}
          />
        </div>

        {/* Lado derecho: Filtro de Pendientes + Progreso */}
        <div className="flex items-center gap-4 justify-between sm:justify-end">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={scopeConfig.onlyUnclassified}
              onChange={e => setScopeConfig(prev => ({ ...prev, onlyUnclassified: e.target.checked }))}
              className="rounded-sm border-zinc-300 dark:border-zinc-700 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
            />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Solo pendientes
            </span>
          </label>

          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <div className="text-xs font-mono font-black text-zinc-900 dark:text-zinc-100">
                {totalCards > 0 ? `${currentIndex + 1} / ${totalCards}` : '0 / 0'}
              </div>
              <div className="text-[10px] font-mono text-zinc-500">
                {progressPercent}% procesado
              </div>
            </div>

            <div className="w-20 sm:w-28 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700/50">
              <div
                className="h-full bg-linear-to-r from-red-600 to-amber-500 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
