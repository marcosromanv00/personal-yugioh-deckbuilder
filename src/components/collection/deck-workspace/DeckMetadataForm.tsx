'use client';

import React from 'react';
import { 
  Box, 
  Shield, 
  Plus, 
  Loader2, 
  Check 
} from 'lucide-react';
import { StorageLocation, SleeveInventory } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

interface DeckMetadataFormProps {
  name: string;
  setName: (s: string) => void;
  format: string;
  setFormat: (s: string) => void;
  isActive: boolean;
  setIsActive: (b: boolean) => void;
  storageLocationId: string;
  setStorageLocationId: (s: string) => void;
  compartmentIndex?: number;
  setCompartmentIndex?: (idx: number) => void;
  locations: StorageLocation[];
  availableSleeves: SleeveInventory[];
  mainSleeveId: string;
  setMainSleeveId: (s: string) => void;
  extraSleeveId: string;
  setExtraSleeveId: (s: string) => void;
  totalMainCount: number;
  totalSideCount: number;
  totalExtraCount: number;
  totalPoolCount: number;
  savingDeck: boolean;
  handleSaveDeck: () => void;
  onOpenNewSleeveModal: (section: 'main_side' | 'extra') => void;
}

export const DeckMetadataForm: React.FC<DeckMetadataFormProps> = ({
  name,
  setName,
  format,
  setFormat,
  isActive,
  setIsActive,
  storageLocationId,
  setStorageLocationId,
  compartmentIndex = 0,
  setCompartmentIndex,
  locations,
  availableSleeves,
  mainSleeveId,
  setMainSleeveId,
  extraSleeveId,
  setExtraSleeveId,
  totalMainCount,
  totalSideCount,
  totalExtraCount,
  totalPoolCount,
  savingDeck,
  handleSaveDeck,
  onOpenNewSleeveModal,
}) => {
  const currentBaseLocation = locations.find(l => l.id === storageLocationId);

  return (
    <div className="space-y-4">
      {/* Nombre de la Baraja */}
      <div className="space-y-1.5">
        <label className="text-[10.5px] font-mono font-black uppercase text-zinc-700 dark:text-zinc-300">
          Nombre de la Baraja:
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:border-red-500 focus:outline-none shadow-2xs"
        />
      </div>

      {/* Formato y Estado */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <label className="text-[10.5px] font-mono font-black uppercase text-zinc-700 dark:text-zinc-300">
            Formato:
          </label>
          <PremiumDropdown
            value={format}
            onChange={(val) => setFormat(val)}
            align="full"
            size="sm"
            options={[
              { value: 'TCG', label: 'TCG' },
              { value: 'Master Duel', label: 'Master Duel' },
              { value: 'OCG', label: 'OCG' },
              { value: 'Speed Duel', label: 'Speed Duel' },
              { value: 'Edison', label: 'Edison' },
              { value: 'GOAT', label: 'GOAT' },
              { value: 'Casual', label: 'Casual' },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10.5px] font-mono font-black uppercase text-zinc-700 dark:text-zinc-300">
            Estado:
          </label>
          <PremiumDropdown
            value={isActive ? 'active' : 'recipe'}
            onChange={(val) => setIsActive(val === 'active')}
            align="full"
            size="sm"
            options={[
              { value: 'active', label: 'Activo (Mazo armado)' },
              { value: 'recipe', label: 'Inactivo (Receta)' },
            ]}
          />
        </div>
      </div>

      {/* Contenedor Físico Principal (Deckbox / Caja) */}
      <div className="space-y-2 p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xs">
        <label className="text-[10.5px] font-mono font-black uppercase text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
          <Box className="w-3.5 h-3.5 text-red-500" />
          <span>Contenedor Físico Base:</span>
        </label>
        <PremiumDropdown
          value={storageLocationId}
          onChange={(val) => {
            setStorageLocationId(val);
            if (setCompartmentIndex) setCompartmentIndex(0);
          }}
          align="full"
          size="sm"
          options={[
            { value: '', label: '-- Sin almacenar (Sólo Receta Digital) --' },
            ...locations.map((loc) => ({
              value: loc.id,
              label: `📦 ${loc.name} (${loc.type})`,
            })),
          ]}
        />

        {/* SELECTOR DE CARRIL / FILA (SI LA CAJA TIENE COMPARTIMENTOS MÚLTIPLES) */}
        {(() => {
          const hasMultipleLanes = Boolean(
            currentBaseLocation &&
            currentBaseLocation.compartments &&
            (currentBaseLocation.compartments.count > 1 || (currentBaseLocation.compartments.names && currentBaseLocation.compartments.names.length > 1))
          );

          if (!hasMultipleLanes || !currentBaseLocation) return null;

          const laneNames = currentBaseLocation.compartments.names && currentBaseLocation.compartments.names.length > 0
            ? currentBaseLocation.compartments.names
            : Array.from({ length: currentBaseLocation.compartments.count || 2 }).map((_, i) => `Fila ${i + 1}`);

          return (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 animate-fade-in space-y-1.5">
              <label className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 font-mono flex items-center justify-between">
                <span>Carril / Fila en &quot;{currentBaseLocation.name}&quot; *</span>
                <span className="text-[9px] text-zinc-400 font-normal">Ubicación exacta</span>
              </label>
              <PremiumDropdown
                value={String(compartmentIndex ?? 0)}
                onChange={(val) => {
                  if (setCompartmentIndex) setCompartmentIndex(Number(val));
                }}
                align="full"
                size="sm"
                options={laneNames.map((laneName, idx) => {
                  const isOccupied = Boolean(currentBaseLocation.compartments?.deck_ids?.[idx]);
                  return {
                    value: String(idx),
                    label: `Carril ${idx + 1}: ${laneName || `Fila ${idx + 1}`}${isOccupied ? ' (Ocupado)' : ' (Disponible)'}`,
                  };
                })}
              />
            </div>
          );
        })()}

        <p className="text-[10.5px] text-zinc-500 leading-relaxed mt-1">
          Las cartas principales de este mazo se registrarán como guardadas aquí, salvo que indiques una ubicación separada para ciertas cartas.
        </p>
      </div>

      {/* Asignación de Fundas (Sleeves) */}
      <div className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-mono font-black uppercase text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-purple-500" />
            <span>Fundas Asignadas (Sleeves)</span>
          </span>
          <button
            type="button"
            onClick={() => onOpenNewSleeveModal('main_side')}
            className="text-[10.5px] font-mono font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Nueva Funda</span>
          </button>
        </div>

        {/* Fundas Main / Side */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-zinc-500 font-bold block">
            Main & Side Deck ({totalMainCount + totalSideCount} cartas):
          </label>
          <PremiumDropdown
            value={mainSleeveId}
            onChange={(val) => setMainSleeveId(val)}
            align="full"
            size="sm"
            options={[
              { value: '', label: '-- Sin Funda Asignada --' },
              ...availableSleeves.map((s) => ({
                value: s.id,
                label: `🛡️ ${s.name} (${s.brand} - ${s.color_pattern}) [${s.quantity_total} totales]`,
              })),
            ]}
          />
        </div>

        {/* Fundas Extra Deck */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-zinc-500 font-bold block">
            Extra Deck ({totalExtraCount} cartas):
          </label>
          <PremiumDropdown
            value={extraSleeveId}
            onChange={(val) => setExtraSleeveId(val)}
            align="full"
            size="sm"
            options={[
              { value: '', label: '-- Sin Funda Asignada --' },
              ...availableSleeves.map((s) => ({
                value: s.id,
                label: `🛡️ ${s.name} (${s.brand} - ${s.color_pattern}) [${s.quantity_total} totales]`,
              })),
            ]}
          />
        </div>
      </div>

      {/* Resumen Físico y Ratios */}
      <div className="p-3.5 bg-zinc-100/60 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 text-xs">
        <span className="text-[10px] font-mono font-black uppercase text-zinc-500 block">
          Resumen de Ubicaciones Físicas:
        </span>
        <div className="space-y-1 text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
          <div className="flex justify-between">
            <span>En Contenedor Base:</span>
            <b className="text-zinc-900 dark:text-zinc-100">
              {currentBaseLocation 
                ? `${currentBaseLocation.name}${
                    currentBaseLocation.compartments && (currentBaseLocation.compartments.count > 1 || (currentBaseLocation.compartments.names && currentBaseLocation.compartments.names.length > 1))
                      ? ` (${currentBaseLocation.compartments.names?.[compartmentIndex ?? 0] || `Carril ${(compartmentIndex ?? 0) + 1}`})`
                      : ''
                  }` 
                : 'Sin asignar'}
            </b>
          </div>
          <div className="flex justify-between">
            <span>Cartas Extra / Reserva:</span>
            <b className="text-cyan-600 dark:text-cyan-400">{totalPoolCount} cartas</b>
          </div>
        </div>
      </div>

      {/* Botón Guardar Ficha Técnica */}
      <button
        type="button"
        onClick={handleSaveDeck}
        disabled={savingDeck}
        className="w-full py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-600/20 cursor-pointer flex items-center justify-center gap-2"
      >
        {savingDeck ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Guardando Cambios...</span>
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            <span>Guardar Ficha Técnica</span>
          </>
        )}
      </button>
    </div>
  );
};
