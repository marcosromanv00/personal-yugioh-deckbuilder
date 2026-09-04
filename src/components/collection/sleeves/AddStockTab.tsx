'use client';

import React from 'react';
import { Layers, ArrowRight } from 'lucide-react';
import { SleeveInventory, SleeveCategory } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

interface AddStockTabProps {
  availableSleeves: SleeveInventory[];
  filteredSleeves: SleeveInventory[];
  selectedSleeve: SleeveInventory | null;
  selectedSleeveId: string;
  onSelectSleeveId: (id: string) => void;
  categoryFilter: 'all' | SleeveCategory;
  onCategoryFilterChange: (cat: 'all' | SleeveCategory) => void;
  addQuantity: number;
  setAddQuantity: React.Dispatch<React.SetStateAction<number>>;
  suggestedQuantity?: number;
  sectionTotalQuantity?: number;
  onGoToCreate: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const CATEGORY_OPTIONS: { id: 'all' | SleeveCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'Todas', icon: '📦' },
  { id: 'fit', label: 'Fit', icon: '🟢' },
  { id: 'regular', label: 'Regular', icon: '🎴' },
  { id: 'over', label: 'Over', icon: '✨' },
];

export const AddStockTab: React.FC<AddStockTabProps> = ({
  availableSleeves,
  filteredSleeves,
  selectedSleeve,
  selectedSleeveId,
  onSelectSleeveId,
  categoryFilter,
  onCategoryFilterChange,
  addQuantity,
  setAddQuantity,
  suggestedQuantity,
  sectionTotalQuantity,
  onGoToCreate,
  onSubmit,
}) => {
  if (availableSleeves.length === 0) {
    return (
      <div className="text-center py-8 space-y-3">
        <Layers className="w-8 h-8 text-zinc-400 mx-auto" />
        <p className="text-xs text-zinc-500">No tienes fundas registradas en tu inventario aún.</p>
        <button
          type="button"
          onClick={onGoToCreate}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer min-h-11 touch-manipulation"
        >
          Registrar tu primera funda
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} id="add-stock-form" className="space-y-4">
      {/* Selector de Categoría para Añadir Stock */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-black font-mono text-zinc-500 block">
          Filtrar por Categoría de Funda
        </label>
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80">
          {CATEGORY_OPTIONS.map((cat) => {
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryFilterChange(cat.id)}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer min-h-10 touch-manipulation flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 shadow-xs border border-zinc-200/60 dark:border-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de Funda Existente */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-black font-mono text-zinc-500 block">
          Seleccionar Funda ({filteredSleeves.length} disponible{filteredSleeves.length === 1 ? '' : 's'}) *
        </label>
        {filteredSleeves.length === 0 ? (
          <div className="p-3 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-xs text-zinc-500 font-mono text-center">
            No hay fundas en esta categoría.{' '}
            <button
              type="button"
              onClick={() => onCategoryFilterChange('all')}
              className="text-red-500 font-bold underline cursor-pointer"
            >
              Ver todas
            </button>
          </div>
        ) : (
          <PremiumDropdown
            value={selectedSleeveId}
            onChange={(val) => onSelectSleeveId(val)}
            align="full"
            size="md"
            options={filteredSleeves.map((s) => ({
              value: s.id,
              label: `${s.category === 'fit' ? '🟢' : s.category === 'over' ? '✨' : '🎴'} ${s.name} (${s.brand} - ${s.color_pattern}) [${s.quantity_available ?? s.quantity_total} disp.]`,
            }))}
          />
        )}
      </div>

      {/* Tarjeta de Resumen de la Funda Seleccionada */}
      {selectedSleeve && (
        <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-5 h-5 rounded-full border border-black/10 dark:border-white/20 shadow-xs shrink-0"
                style={{ backgroundColor: selectedSleeve.color_hex || '#1a1a2e' }}
              />
              <div className="min-w-0">
                <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate">
                  {selectedSleeve.name}
                </h4>
                <p className="text-[11px] font-mono text-zinc-500 font-semibold truncate">
                  {selectedSleeve.brand} • {selectedSleeve.color_pattern}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-bold shrink-0">
              {selectedSleeve.quantity_available ?? selectedSleeve.quantity_total} disp.
            </span>
          </div>
        </div>
      )}

      {/* Cantidad a Añadir */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase font-black font-mono text-zinc-500 block">
          Cantidad de Fundas a Sumar
        </label>

        {/* Chips Contextuales si provienen de un mazo */}
        {((suggestedQuantity && suggestedQuantity > 0) || (sectionTotalQuantity && sectionTotalQuantity > 0)) && (
          <div className="flex flex-wrap gap-1.5 pb-1">
            {suggestedQuantity && suggestedQuantity > 0 && (
              <button
                type="button"
                onClick={() => setAddQuantity(suggestedQuantity)}
                className={`px-2.5 py-1.5 text-[11px] font-mono font-bold rounded-xl border transition-all cursor-pointer min-h-9 touch-manipulation flex items-center gap-1.5 ${
                  addQuantity === suggestedQuantity
                    ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <span className="font-black">+{suggestedQuantity}</span>
                <span className="text-[9.5px] opacity-85">(Faltantes mazo)</span>
              </button>
            )}
            {sectionTotalQuantity && sectionTotalQuantity > 0 && sectionTotalQuantity !== suggestedQuantity && (
              <button
                type="button"
                onClick={() => setAddQuantity(sectionTotalQuantity)}
                className={`px-2.5 py-1.5 text-[11px] font-mono font-bold rounded-xl border transition-all cursor-pointer min-h-9 touch-manipulation flex items-center gap-1.5 ${
                  addQuantity === sectionTotalQuantity
                    ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-red-500/40'
                }`}
              >
                <span className="font-black">+{sectionTotalQuantity}</span>
                <span className="text-[9.5px] opacity-80">(Total sección)</span>
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-4 gap-2">
          {[10, 40, 60, 100].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAddQuantity(preset)}
              className={`py-2 px-2 text-xs font-mono font-black rounded-xl border transition-all cursor-pointer min-h-11 touch-manipulation ${
                addQuantity === preset
                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
              }`}
            >
              +{preset}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setAddQuantity((prev) => Math.max(1, prev - 10))}
            className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-black cursor-pointer min-h-11 touch-manipulation"
          >
            −10
          </button>
          <input
            type="number"
            min={1}
            value={addQuantity || ''}
            onChange={(e) => {
              const val = e.target.value;
              setAddQuantity(val === '' ? 0 : Math.max(1, parseInt(val, 10) || 1));
            }}
            onBlur={() => {
              if (!addQuantity || addQuantity < 1) setAddQuantity(1);
            }}
            className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-sm font-mono font-bold text-center focus:outline-none focus:border-red-500 min-h-11"
          />
          <button
            type="button"
            onClick={() => setAddQuantity((prev) => prev + 10)}
            className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-black cursor-pointer min-h-11 touch-manipulation"
          >
            +10
          </button>
        </div>
      </div>

      {/* Proyección de Stock */}
      {selectedSleeve && (
        <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex items-center justify-between text-xs font-mono">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Stock Proyectado</span>
            <div className="flex items-center gap-1.5 font-black text-zinc-900 dark:text-zinc-100">
              <span>{selectedSleeve.quantity_total} tot.</span>
              <ArrowRight className="w-3.5 h-3.5 text-red-500" />
              <span className="text-red-600 dark:text-red-400">
                {selectedSleeve.quantity_total + (addQuantity || 0)} totales
              </span>
            </div>
          </div>
          <div className="text-right space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Disponibles</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">
              {(selectedSleeve.quantity_available ?? selectedSleeve.quantity_total) + (addQuantity || 0)} libres
            </span>
          </div>
        </div>
      )}
    </form>
  );
};
