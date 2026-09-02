'use client';

import React from 'react';
import { 
  Box, 
  Shield, 
  Plus, 
  Loader2, 
  Check,
  AlertTriangle,
  PackagePlus,
  CheckCircle2,
  Package
} from 'lucide-react';
import { StorageLocation, SleeveInventory } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

interface DeckMetadataFormProps {
  deckId?: string | null;
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
  poolSleeveId?: string;
  setPoolSleeveId?: (s: string) => void;
  totalMainCount: number;
  totalSideCount: number;
  sideMainCount?: number;
  sideExtraCount?: number;
  totalExtraCount: number;
  totalPoolCount: number;
  mainRequiredSleeves?: number;
  extraRequiredSleeves?: number;
  poolRequiredSleeves?: number;
  savingDeck: boolean;
  handleSaveDeck: () => void;
  onOpenNewSleeveModal: (
    section: 'main_side' | 'extra' | 'pool',
    tab?: 'add_stock' | 'create',
    initialSleeveId?: string,
    suggestedQty?: number,
    sectionTotal?: number
  ) => void;
}

export const DeckMetadataForm: React.FC<DeckMetadataFormProps> = ({
  deckId,
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
  poolSleeveId = '',
  setPoolSleeveId,
  totalMainCount,
  totalSideCount,
  sideMainCount = 0,
  sideExtraCount = 0,
  totalExtraCount,
  totalPoolCount,
  mainRequiredSleeves,
  extraRequiredSleeves,
  poolRequiredSleeves,
  savingDeck,
  handleSaveDeck,
  onOpenNewSleeveModal,
}) => {
  const currentBaseLocation = locations.find(l => l.id === storageLocationId);

  const mainRequired = mainRequiredSleeves ?? (totalMainCount + sideMainCount);
  const extraRequired = extraRequiredSleeves ?? (totalExtraCount + sideExtraCount);
  const poolRequired = poolRequiredSleeves ?? totalPoolCount;

  // Calcula disponibilidad real para este mazo (stock libre + fundas ya retenidas por este mazo)
  const getSleeveAvailabilityForDeck = (sleeve: SleeveInventory | undefined, requiredCount: number) => {
    if (!sleeve) return { avail: 0, diff: 0, isDeficit: false, missingCount: 0, freeStock: 0 };
    const freeStock = sleeve.quantity_available ?? sleeve.quantity_total;
    const alreadyUsedInThisDeck = sleeve.used_in_decks?.find(
      (d) => (deckId && d.deck_id === deckId) || (name && d.deck_name.toLowerCase().trim() === name.toLowerCase().trim())
    )?.quantity_used || 0;

    const totalAvailForThisDeck = freeStock + alreadyUsedInThisDeck;
    const diff = totalAvailForThisDeck - requiredCount;
    const isDeficit = diff < 0;
    const missingCount = Math.abs(diff);

    return {
      avail: totalAvailForThisDeck,
      diff,
      isDeficit,
      missingCount,
      freeStock,
    };
  };

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
            <Shield className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
            <span>Fundas Asignadas (Sleeves)</span>
          </span>
          <button
            type="button"
            onClick={() => onOpenNewSleeveModal('main_side', 'add_stock')}
            className="text-[10.5px] font-mono font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Gestionar / Nueva</span>
          </button>
        </div>

        {/* Fundas Main / Side */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono text-zinc-500 font-bold block">
              Main & Side Deck ({mainRequired} cartas):
            </label>
            {sideMainCount > 0 && (
              <span className="text-[9px] font-mono text-zinc-400">
                {totalMainCount} Main + {sideMainCount} Side
              </span>
            )}
          </div>
          <PremiumDropdown
            value={mainSleeveId}
            onChange={(val) => setMainSleeveId(val)}
            align="full"
            size="sm"
            options={[
              { value: '', label: '-- Sin Funda Asignada --' },
              ...availableSleeves.map((s) => ({
                value: s.id,
                label: `🛡️ ${s.name} (${s.brand} - ${s.color_pattern}) [${s.quantity_available ?? s.quantity_total} disp. / ${s.quantity_total} tot.]`,
              })),
            ]}
          />

          {/* Desglose en vivo Main & Side */}
          {(() => {
            const selectedMainSleeve = availableSleeves.find((s) => s.id === mainSleeveId);
            if (!selectedMainSleeve) return null;
            const status = getSleeveAvailabilityForDeck(selectedMainSleeve, mainRequired);

            if (status.isDeficit) {
              return (
                <div className="p-2.5 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-1.5 text-amber-700 dark:text-amber-300 font-mono text-[10.5px]">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Faltan {status.missingCount} fundas para este mazo</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          {status.avail} accesibles ({status.freeStock} libres) para {mainRequired} cartas
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenNewSleeveModal('main_side', 'add_stock', selectedMainSleeve.id, status.missingCount, mainRequired)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10.5px] font-bold font-mono flex items-center gap-1 shadow-2xs transition-colors cursor-pointer shrink-0"
                    >
                      <PackagePlus className="w-3 h-3" />
                      <span>+ Stock</span>
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-2 text-[10.5px] font-mono text-emerald-700 dark:text-emerald-400">
                <div className="flex items-center gap-1.5 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">
                    {mainRequired} cartas cubiertas • <b>{status.diff}</b> fundas libres
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenNewSleeveModal('main_side', 'add_stock', selectedMainSleeve.id, undefined, mainRequired)}
                  className="text-[10px] text-emerald-700 dark:text-emerald-400 hover:underline font-bold shrink-0 cursor-pointer"
                >
                  + Stock
                </button>
              </div>
            );
          })()}
        </div>

        {/* Fundas Extra Deck */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono text-zinc-500 font-bold block">
              Extra Deck ({extraRequired} cartas):
            </label>
            {sideExtraCount > 0 && (
              <span className="text-[9px] font-mono text-zinc-400">
                {totalExtraCount} Extra + {sideExtraCount} Side
              </span>
            )}
          </div>
          <PremiumDropdown
            value={extraSleeveId}
            onChange={(val) => setExtraSleeveId(val)}
            align="full"
            size="sm"
            options={[
              { value: '', label: '-- Sin Funda Asignada --' },
              ...availableSleeves.map((s) => ({
                value: s.id,
                label: `🛡️ ${s.name} (${s.brand} - ${s.color_pattern}) [${s.quantity_available ?? s.quantity_total} disp. / ${s.quantity_total} tot.]`,
              })),
            ]}
          />

          {/* Desglose en vivo Extra Deck */}
          {(() => {
            const selectedExtraSleeve = availableSleeves.find((s) => s.id === extraSleeveId);
            if (!selectedExtraSleeve) return null;
            const status = getSleeveAvailabilityForDeck(selectedExtraSleeve, extraRequired);

            if (status.isDeficit) {
              return (
                <div className="p-2.5 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-1.5 text-amber-700 dark:text-amber-300 font-mono text-[10.5px]">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Faltan {status.missingCount} fundas para el Extra</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          {status.avail} accesibles ({status.freeStock} libres) para {extraRequired} cartas
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenNewSleeveModal('extra', 'add_stock', selectedExtraSleeve.id, status.missingCount, extraRequired)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10.5px] font-bold font-mono flex items-center gap-1 shadow-2xs transition-colors cursor-pointer shrink-0"
                    >
                      <PackagePlus className="w-3 h-3" />
                      <span>+ Stock</span>
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-2 text-[10.5px] font-mono text-emerald-700 dark:text-emerald-400">
                <div className="flex items-center gap-1.5 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">
                    {extraRequired} cartas cubiertas • <b>{status.diff}</b> fundas libres
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenNewSleeveModal('extra', 'add_stock', selectedExtraSleeve.id, undefined, extraRequired)}
                  className="text-[10px] text-emerald-700 dark:text-emerald-400 hover:underline font-bold shrink-0 cursor-pointer"
                >
                  + Stock
                </button>
              </div>
            );
          })()}
        </div>

        {/* Fundas Reserva / Pool (Opcional) */}
        {setPoolSleeveId && (
          <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-900">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono text-zinc-500 font-bold block">
                Reserva / Pool ({poolRequired} cartas) <span className="font-normal opacity-70">(Opcional)</span>:
              </label>
            </div>
            <PremiumDropdown
              value={poolSleeveId}
              onChange={(val) => setPoolSleeveId(val)}
              align="full"
              size="sm"
              options={[
                { value: '', label: '-- Sin Funda Asignada --' },
                ...availableSleeves.map((s) => ({
                  value: s.id,
                  label: `🛡️ ${s.name} (${s.brand} - ${s.color_pattern}) [${s.quantity_available ?? s.quantity_total} disp. / ${s.quantity_total} tot.]`,
                })),
              ]}
            />

            {/* Desglose en vivo Reserva / Pool */}
            {(() => {
              const selectedPoolSleeve = availableSleeves.find((s) => s.id === poolSleeveId);
              if (!selectedPoolSleeve) return null;
              const status = getSleeveAvailabilityForDeck(selectedPoolSleeve, poolRequired);

              if (status.isDeficit) {
                return (
                  <div className="p-2.5 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5 text-amber-700 dark:text-amber-300 font-mono text-[10.5px]">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">Faltan {status.missingCount} fundas para la reserva</span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            {status.avail} accesibles ({status.freeStock} libres) para {poolRequired} cartas
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenNewSleeveModal('pool', 'add_stock', selectedPoolSleeve.id, status.missingCount, poolRequired)}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10.5px] font-bold font-mono flex items-center gap-1 shadow-2xs transition-colors cursor-pointer shrink-0"
                      >
                        <PackagePlus className="w-3 h-3" />
                        <span>+ Stock</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-2 text-[10.5px] font-mono text-emerald-700 dark:text-emerald-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">
                      {poolRequired} cartas cubiertas • <b>{status.diff}</b> fundas libres
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenNewSleeveModal('pool', 'add_stock', selectedPoolSleeve.id, undefined, poolRequired)}
                    className="text-[10px] text-emerald-700 dark:text-emerald-400 hover:underline font-bold shrink-0 cursor-pointer"
                  >
                    + Stock
                  </button>
                </div>
              );
            })()}
          </div>
        )}
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
