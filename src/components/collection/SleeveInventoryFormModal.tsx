'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Save, Loader2, AlertCircle } from 'lucide-react';
import { SleeveInventory, SleeveInventoryFormData, SleeveSizeType, SleeveInventoryCondition } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

interface SleeveInventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sleeve?: SleeveInventory) => void;
  editingSleeve?: SleeveInventory | null;
}

const SLEEVE_SIZES: { value: SleeveSizeType; label: string }[] = [
  { value: 'standard', label: 'Estándar (63.5 × 88 mm)' },
  { value: 'mini-japanese', label: 'Mini Japonesas (62 × 89 mm)' },
  { value: 'european', label: 'Europeas (59 × 91 mm)' },
];

const CONDITIONS: { value: SleeveInventoryCondition; label: string; color: string }[] = [
  { value: 'new', label: 'Nuevas', color: 'text-emerald-500' },
  { value: 'good', label: 'Buenas', color: 'text-amber-500' },
  { value: 'worn', label: 'Desgastadas', color: 'text-red-500' },
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

const EMPTY_FORM: SleeveInventoryFormData = {
  name: '',
  brand: 'Dragon Shield',
  color_pattern: 'Matte Black',
  color_hex: '#1a1a2e',
  size_type: 'standard',
  condition: 'new',
  quantity_total: 60,
  notes: '',
};

export const SleeveInventoryFormModal: React.FC<SleeveInventoryFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingSleeve,
}) => {
  const [form, setForm] = useState<SleeveInventoryFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingSleeve) {
        setForm({
          name: editingSleeve.name,
          brand: editingSleeve.brand,
          color_pattern: editingSleeve.color_pattern,
          color_hex: editingSleeve.color_hex || '#1a1a2e',
          size_type: editingSleeve.size_type,
          condition: editingSleeve.condition,
          quantity_total: editingSleeve.quantity_total,
          notes: editingSleeve.notes || '',
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setError('');
    }
  }, [isOpen, editingSleeve]);

  const update = <K extends keyof SleeveInventoryFormData>(key: K, value: SleeveInventoryFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.brand.trim()) {
      setError('El nombre y la marca son obligatorios.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const url = '/api/collection/sleeve-inventory';
      const method = editingSleeve ? 'PUT' : 'POST';
      const body = editingSleeve ? { ...form, id: editingSleeve.id } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const json = await res.json();
        onSuccess(json.data);
        onClose();
      } else {
        const json = await res.json();
        setError(json.error || 'Error al guardar la funda.');
      }
    } catch {
      setError('Error de red al guardar la funda.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl text-zinc-900 dark:text-zinc-100 flex flex-col h-dvh sm:h-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  {editingSleeve ? 'Editar Paquete de Fundas' : 'Registrar Nuevas Fundas'}
                </h2>
              </div>
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black font-mono text-zinc-500">Nombre / Modelo *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  placeholder="ej. Dragon Shield Matte Black x100"
                  className="w-full px-3.5 py-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-red-500 rounded-xl text-xs font-bold focus:outline-none"
                />
              </div>

              {/* Brand */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black font-mono text-zinc-500">Marca *</label>
                <div className="flex gap-1.5 flex-wrap mb-1.5">
                  {POPULAR_BRANDS.map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => update('brand', b)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        form.brand === b
                          ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-500 text-cyan-600 dark:text-cyan-300'
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
                  onChange={e => update('brand', e.target.value)}
                  placeholder="O escribe la marca..."
                  className="w-full px-3.5 py-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-red-500 rounded-xl text-xs font-bold focus:outline-none"
                />
              </div>

              {/* Color */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black font-mono text-zinc-500">Color / Patrón</label>
                <div className="flex gap-2 flex-wrap mb-1.5">
                  {DEFAULT_COLORS.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => { update('color_hex', c.hex); update('color_pattern', c.name); }}
                      title={c.name}
                      className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                        form.color_hex === c.hex ? 'border-red-500 scale-110 shadow-md' : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-500'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                  {/* Custom color picker */}
                  <label className="w-7 h-7 rounded-full border-2 border-dashed border-zinc-400 dark:border-zinc-600 hover:border-red-500 flex items-center justify-center cursor-pointer overflow-hidden" title="Color personalizado">
                    <span className="text-[9px] font-bold text-zinc-500">+</span>
                    <input
                      type="color"
                      value={form.color_hex}
                      onChange={e => update('color_hex', e.target.value)}
                      className="absolute opacity-0 w-0 h-0 cursor-pointer"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={form.color_pattern}
                  onChange={e => update('color_pattern', e.target.value)}
                  placeholder="ej. Matte Black, Holographic, Art Series..."
                  className="w-full px-3.5 py-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-red-500 rounded-xl text-xs font-bold focus:outline-none"
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
                <label className="text-[10px] uppercase font-black font-mono text-zinc-500">Cantidad Total de Fundas</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => update('quantity_total', Math.max(0, form.quantity_total - 10))}
                    className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-black cursor-pointer"
                  >−10</button>
                  <input
                    type="number"
                    min={0}
                    value={form.quantity_total}
                    onChange={e => update('quantity_total', Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold text-center focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => update('quantity_total', form.quantity_total + 10)}
                    className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-black cursor-pointer"
                  >+10</button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black font-mono text-zinc-500">Notas (opcional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => update('notes', e.target.value)}
                  rows={2}
                  placeholder="ej. Paquete de 100 fundas..."
                  className="w-full px-3 py-1.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-500 font-bold">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-red-600/25 transition-all cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingSleeve ? 'Actualizar' : 'Guardar Funda'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
