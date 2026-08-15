'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Save, Loader2, AlertCircle } from 'lucide-react';
import { SleeveInventory, SleeveInventoryFormData, SleeveSizeType, SleeveInventoryCondition } from '@/types/collection';

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
  { value: 'new', label: 'Nuevas', color: 'text-emerald-400' },
  { value: 'good', label: 'Buenas', color: 'text-amber-400' },
  { value: 'worn', label: 'Desgastadas', color: 'text-red-400' },
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
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al guardar');
      onSuccess(json.data);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-[hsl(224,22%,10%)] border border-[hsl(224,15%,16%)] rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(224,15%,16%)]">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <h2 className="text-sm font-bold text-white">
                  {editingSleeve ? 'Editar Funda' : 'Nueva Funda'}
                </h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Nombre / Diseño *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  placeholder="ej. Dragon Shield Matte Black x100"
                  className="w-full px-3 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Brand */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Marca *</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {POPULAR_BRANDS.map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => update('brand', b)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
                        form.brand === b
                          ? 'bg-purple-600/40 border-purple-500/60 text-purple-200'
                          : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-500'
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
                  className="w-full px-3 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Color */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Color / Patrón</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {DEFAULT_COLORS.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => { update('color_hex', c.hex); update('color_pattern', c.name); }}
                      title={c.name}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        form.color_hex === c.hex ? 'border-purple-400 scale-110 shadow-lg' : 'border-transparent hover:border-slate-400'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                  {/* Custom color picker */}
                  <label className="w-7 h-7 rounded-full border-2 border-dashed border-slate-600 hover:border-slate-400 flex items-center justify-center cursor-pointer overflow-hidden" title="Color personalizado">
                    <span className="text-[8px] text-slate-500">+</span>
                    <input
                      type="color"
                      value={form.color_hex}
                      onChange={e => update('color_hex', e.target.value)}
                      className="absolute opacity-0 w-0 h-0"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={form.color_pattern}
                  onChange={e => update('color_pattern', e.target.value)}
                  placeholder="ej. Matte Black, Holographic, Art Series..."
                  className="w-full px-3 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Size + Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Tamaño</label>
                  <select
                    value={form.size_type}
                    onChange={e => update('size_type', e.target.value as SleeveSizeType)}
                    className="w-full px-3 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-slate-600 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {SLEEVE_SIZES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Condición</label>
                  <select
                    value={form.condition}
                    onChange={e => update('condition', e.target.value as SleeveInventoryCondition)}
                    className="w-full px-3 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-slate-600 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {CONDITIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Cantidad Total</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => update('quantity_total', Math.max(0, form.quantity_total - 10))}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold"
                  >−10</button>
                  <input
                    type="number"
                    min={0}
                    value={form.quantity_total}
                    onChange={e => update('quantity_total', Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 px-3 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] rounded-lg text-sm text-white text-center focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => update('quantity_total', form.quantity_total + 10)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold"
                  >+10</button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Notas (opcional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => update('notes', e.target.value)}
                  rows={2}
                  placeholder="ej. Compradas en Amazon, paquete de 100..."
                  className="w-full px-3 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-slate-600 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingSleeve ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
