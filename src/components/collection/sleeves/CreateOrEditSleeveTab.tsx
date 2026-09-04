'use client';

import React from 'react';
import {
  SleeveInventoryFormData,
  SleeveSizeType,
  SleeveInventoryCondition,
  SleeveCategory,
} from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

interface CreateOrEditSleeveTabProps {
  form: SleeveInventoryFormData;
  update: <K extends keyof SleeveInventoryFormData>(key: K, value: SleeveInventoryFormData[K]) => void;
  isEditing: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const SLEEVE_CATEGORIES: { value: SleeveCategory; label: string; icon: string; desc: string }[] = [
  { value: 'fit', label: 'Fit / Inner', icon: '🟢', desc: 'Capa interior (Perfect Fit)' },
  { value: 'regular', label: 'Regular (Principal)', icon: '🎴', desc: 'Funda estándar / color / arte' },
  { value: 'over', label: 'Over / Oversleeve', icon: '✨', desc: 'Capa exterior protectora' },
];

const SLEEVE_SIZES: { value: SleeveSizeType; label: string }[] = [
  { value: 'standard', label: 'Estándar (63.5 × 88 mm)' },
  { value: 'mini-japanese', label: 'Mini Japonesas (62 × 89 mm)' },
  { value: 'european', label: 'Europeas (59 × 91 mm)' },
];

const CONDITIONS: { value: SleeveInventoryCondition; label: string }[] = [
  { value: 'new', label: 'Nuevas' },
  { value: 'good', label: 'Buenas' },
  { value: 'worn', label: 'Desgastadas' },
];

const POPULAR_BRANDS = ['Dragon Shield', 'KMC', 'Ultra Pro', 'Perfect Fit', 'Mayday', 'Ultimate Guard', 'BCW'];

const DEFAULT_COLORS = [
  { hex: '#1a1a2e', name: 'Matte Black' },
  { hex: '#f0f0f0', name: 'Matte White' },
  { hex: '#1e3a5f', name: 'Matte Blue' },
  { hex: '#3b1f4a', name: 'Matte Purple' },
  { hex: '#1f3d2a', name: 'Matte Green' },
  { hex: '#4a1c1c', name: 'Matte Red' },
  { hex: '#3d2e10', name: 'Matte Gold' },
  { hex: '#2a2a2a', name: 'Smokey Grey' },
];

export const CreateOrEditSleeveTab: React.FC<CreateOrEditSleeveTabProps> = ({
  form,
  update,
  isEditing,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} id="create-sleeve-form" className="space-y-4">
      {/* Categoría / Rol de Capa */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-black font-mono text-zinc-500 block">
          Categoría / Nivel de Capa *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {SLEEVE_CATEGORIES.map((cat) => {
            const isSelected = (form.category || 'regular') === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => update('category', cat.value)}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer touch-manipulation min-h-14 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-red-50/80 dark:bg-red-950/40 border-red-500 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{cat.icon}</span>
                  <span
                    className={`text-[11px] font-black uppercase tracking-wider ${
                      isSelected ? 'text-red-600 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {cat.label}
                  </span>
                </div>
                <span className="text-[9.5px] text-zinc-500 dark:text-zinc-400 font-mono leading-tight mt-1">
                  {cat.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-black font-mono text-zinc-500">Nombre / Modelo *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="ej. Dragon Shield Matte Black x100"
          className="w-full px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-red-500 rounded-xl text-xs font-bold focus:outline-none min-h-11"
        />
      </div>

      {/* Brand */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-black font-mono text-zinc-500">Marca *</label>
        <div className="flex gap-1.5 flex-wrap mb-1.5">
          {POPULAR_BRANDS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => update('brand', b)}
              className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold border transition-colors cursor-pointer touch-manipulation ${
                form.brand === b
                  ? 'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-600 dark:text-red-300'
                  : 'bg-zinc-100 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={form.brand}
          onChange={(e) => update('brand', e.target.value)}
          placeholder="O escribe la marca..."
          className="w-full px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-red-500 rounded-xl text-xs font-bold focus:outline-none min-h-11"
        />
      </div>

      {/* Color */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-black font-mono text-zinc-500">Color / Patrón</label>
        <div className="flex gap-2 flex-wrap mb-1.5">
          {DEFAULT_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => {
                update('color_hex', c.hex);
                update('color_pattern', c.name);
              }}
              title={c.name}
              className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                form.color_hex === c.hex
                  ? 'border-red-500 scale-110 shadow-md'
                  : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-500'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
          <label
            className="w-7 h-7 rounded-full border-2 border-dashed border-zinc-400 dark:border-zinc-600 hover:border-red-500 flex items-center justify-center cursor-pointer overflow-hidden relative"
            title="Color personalizado"
          >
            <span className="text-[9px] font-bold text-zinc-500">+</span>
            <input
              type="color"
              value={form.color_hex}
              onChange={(e) => update('color_hex', e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </label>
        </div>
        <input
          type="text"
          value={form.color_pattern}
          onChange={(e) => update('color_pattern', e.target.value)}
          placeholder="ej. Matte Black, Holographic..."
          className="w-full px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-red-500 rounded-xl text-xs font-bold focus:outline-none min-h-11"
        />
      </div>

      {/* Size + Condition */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-black font-mono text-zinc-500">Tamaño</label>
          <PremiumDropdown
            value={form.size_type}
            onChange={(val) => update('size_type', val as SleeveSizeType)}
            align="full"
            size="md"
            options={SLEEVE_SIZES.map((s) => ({ value: s.value, label: s.label }))}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-black font-mono text-zinc-500">Condición</label>
          <PremiumDropdown
            value={form.condition}
            onChange={(val) => update('condition', val as SleeveInventoryCondition)}
            align="full"
            size="md"
            options={CONDITIONS.map((c) => ({ value: c.value, label: c.label }))}
          />
        </div>
      </div>

      {/* Quantity */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-black font-mono text-zinc-500">
          {isEditing ? 'Cantidad Total en Inventario' : 'Cantidad Total Inicial de Fundas'}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => update('quantity_total', Math.max(0, (form.quantity_total || 0) - 10))}
            className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-black cursor-pointer min-h-11 touch-manipulation"
          >
            −10
          </button>
          <input
            type="number"
            min={0}
            value={form.quantity_total === 0 ? '0' : (form.quantity_total || '')}
            onChange={(e) => {
              const val = e.target.value;
              update('quantity_total', val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0));
            }}
            className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold text-center focus:outline-none focus:border-red-500 min-h-11"
          />
          <button
            type="button"
            onClick={() => update('quantity_total', (form.quantity_total || 0) + 10)}
            className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-black cursor-pointer min-h-11 touch-manipulation"
          >
            +10
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-black font-mono text-zinc-500">Notas (opcional)</label>
        <textarea
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          rows={2}
          placeholder="ej. Paquete de 100 fundas..."
          className="w-full px-3.5 py-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-red-500 resize-none"
        />
      </div>
    </form>
  );
};
