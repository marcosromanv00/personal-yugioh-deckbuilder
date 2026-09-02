'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Save, Loader2, AlertCircle, PlusCircle, PackagePlus, ArrowRight } from 'lucide-react';
import { SleeveInventory, SleeveInventoryFormData, SleeveSizeType, SleeveInventoryCondition, SleeveCategory } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

interface SleeveInventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sleeve?: SleeveInventory) => void;
  editingSleeve?: SleeveInventory | null;
  initialTab?: 'add_stock' | 'create';
  initialSleeveId?: string;
  initialCategory?: SleeveCategory;
  availableSleeves?: SleeveInventory[];
  suggestedQuantity?: number;
  sectionTotalQuantity?: number;
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
  category: 'regular',
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
  initialTab = 'add_stock',
  initialSleeveId,
  initialCategory,
  availableSleeves = [],
  suggestedQuantity,
  sectionTotalQuantity,
}) => {
  const [activeTab, setActiveTab] = useState<'add_stock' | 'create'>('add_stock');
  const [selectedSleeveId, setSelectedSleeveId] = useState<string>('');
  const [addQuantity, setAddQuantity] = useState<number>(60);
  const [form, setForm] = useState<SleeveInventoryFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Sincronizar estado al abrir el modal
  useEffect(() => {
    if (isOpen) {
      if (editingSleeve) {
        setActiveTab('create');
        setForm({
          name: editingSleeve.name,
          category: editingSleeve.category || 'regular',
          brand: editingSleeve.brand,
          color_pattern: editingSleeve.color_pattern,
          color_hex: editingSleeve.color_hex || '#1a1a2e',
          size_type: editingSleeve.size_type,
          condition: editingSleeve.condition,
          quantity_total: editingSleeve.quantity_total,
          notes: editingSleeve.notes || '',
        });
      } else {
        setForm({
          ...EMPTY_FORM,
          category: initialCategory || 'regular',
        });
        if (availableSleeves.length === 0) {
          setActiveTab('create');
        } else {
          setActiveTab(initialTab);
        }

        if (initialSleeveId) {
          setSelectedSleeveId(initialSleeveId);
        } else if (availableSleeves.length > 0) {
          setSelectedSleeveId(availableSleeves[0].id);
        } else {
          setSelectedSleeveId('');
        }

        const defaultQty = suggestedQuantity && suggestedQuantity > 0 
          ? suggestedQuantity 
          : sectionTotalQuantity && sectionTotalQuantity > 0 
          ? sectionTotalQuantity 
          : 60;
        setAddQuantity(defaultQty);
      }
      setError('');
    }
  }, [isOpen, editingSleeve, initialTab, initialSleeveId, initialCategory, availableSleeves, suggestedQuantity, sectionTotalQuantity]);

  const selectedSleeve = useMemo(() => {
    return availableSleeves.find((s) => s.id === selectedSleeveId) || null;
  }, [availableSleeves, selectedSleeveId]);

  const update = <K extends keyof SleeveInventoryFormData>(key: K, value: SleeveInventoryFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Manejador para sumar stock a una funda existente
  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSleeveId) {
      setError('Debes seleccionar una funda para añadir stock.');
      return;
    }
    if (addQuantity <= 0) {
      setError('La cantidad a sumar debe ser mayor a 0.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/collection/sleeve-inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSleeveId,
          add_quantity: addQuantity,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        onSuccess(json.data);
        onClose();
      } else {
        const json = await res.json();
        setError(json.error || 'Error al actualizar el stock de la funda.');
      }
    } catch {
      setError('Error de red al actualizar stock.');
    } finally {
      setSubmitting(false);
    }
  };

  // Manejador para crear o editar modelo completo
  const handleCreateOrEditSubmit = async (e: React.FormEvent) => {
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
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl text-zinc-900 dark:text-zinc-100 flex flex-col max-h-dvh sm:max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-red-600 dark:text-red-500" />
                <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  {editingSleeve
                    ? 'Editar Paquete de Fundas'
                    : activeTab === 'add_stock'
                    ? 'Añadir Stock a Fundas'
                    : 'Registrar Nuevas Fundas'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pestañas de Modo (Solo si no estamos en modo edición individual) */}
            {!editingSleeve && (
              <div className="px-6 pt-4 pb-2 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('add_stock');
                      setError('');
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-11 touch-manipulation ${
                      activeTab === 'add_stock'
                        ? 'bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 shadow-xs border border-zinc-200/60 dark:border-zinc-800'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <PackagePlus className="w-4 h-4 shrink-0" />
                    <span>Añadir Stock</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('create');
                      setError('');
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-11 touch-manipulation ${
                      activeTab === 'create'
                        ? 'bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 shadow-xs border border-zinc-200/60 dark:border-zinc-800'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4 shrink-0" />
                    <span>Nuevo Modelo</span>
                  </button>
                </div>
              </div>
            )}

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* TAB 1: Añadir Stock a Funda Existente */}
              {!editingSleeve && activeTab === 'add_stock' && (
                <form onSubmit={handleAddStockSubmit} id="add-stock-form" className="space-y-4">
                  {availableSleeves.length === 0 ? (
                    <div className="text-center py-8 space-y-3">
                      <Layers className="w-8 h-8 text-zinc-400 mx-auto" />
                      <p className="text-xs text-zinc-500">No tienes fundas registradas en tu inventario aún.</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('create')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Registrar tu primera funda
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Selector de Funda Existente */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black font-mono text-zinc-500 block">
                          Seleccionar Funda de tu Colección *
                        </label>
                        <PremiumDropdown
                          value={selectedSleeveId}
                          onChange={(val) => {
                            setSelectedSleeveId(val);
                            setError('');
                          }}
                          align="full"
                          size="md"
                          options={availableSleeves.map((s) => ({
                            value: s.id,
                            label: `🛡️ ${s.name} (${s.brand} - ${s.color_pattern}) [${s.quantity_available ?? s.quantity_total} disp. / ${s.quantity_total} tot.]`,
                          }))}
                        />
                      </div>

                      {/* Tarjeta de Resumen de la Funda Seleccionada */}
                      {selectedSleeve && (
                        <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3 shadow-2xs">
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

                          {/* Decks en uso */}
                          {selectedSleeve.used_in_decks && selectedSleeve.used_in_decks.length > 0 && (
                            <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-1">
                              <span className="text-[9.5px] font-mono font-bold text-zinc-400 uppercase block">
                                Actualmente en uso:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {selectedSleeve.used_in_decks.map((d) => (
                                  <span
                                    key={d.deck_id}
                                    className="px-2 py-0.5 bg-zinc-200/70 dark:bg-zinc-800/80 text-[10px] font-mono text-zinc-700 dark:text-zinc-300 rounded-md font-medium"
                                  >
                                    {d.deck_name} ({d.quantity_used} fundas)
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Cantidad a Añadir */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black font-mono text-zinc-500 block">
                          Cantidad de Fundas a Sumar
                        </label>

                        {/* Chips Contextuales del Mazo */}
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
                                <span className="text-[9.5px] opacity-85">(Faltantes para mazo)</span>
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
                            value={addQuantity}
                            onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
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
                                {selectedSleeve.quantity_total + addQuantity} totales
                              </span>
                            </div>
                          </div>
                          <div className="text-right space-y-0.5">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Disponibles</span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400">
                              {(selectedSleeve.quantity_available ?? selectedSleeve.quantity_total) + addQuantity} libres
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </form>
              )}

              {/* TAB 2: Registrar Nuevo Modelo o Editar */}
              {(editingSleeve || activeTab === 'create') && (
                <form onSubmit={handleCreateOrEditSubmit} id="create-sleeve-form" className="space-y-4">
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
                      {/* Custom color picker */}
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
                      placeholder="ej. Matte Black, Holographic, Art Series..."
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
                      Cantidad Total Inicial de Fundas
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => update('quantity_total', Math.max(0, form.quantity_total - 10))}
                        className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-black cursor-pointer min-h-11 touch-manipulation"
                      >
                        −10
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={form.quantity_total}
                        onChange={(e) => update('quantity_total', Math.max(0, parseInt(e.target.value) || 0))}
                        className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold text-center focus:outline-none focus:border-red-500 min-h-11"
                      />
                      <button
                        type="button"
                        onClick={() => update('quantity_total', form.quantity_total + 10)}
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
              )}

              {error && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-500 font-bold">{error}</p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50/50 dark:bg-zinc-950/50">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer min-h-11 touch-manipulation"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form={!editingSleeve && activeTab === 'add_stock' ? 'add-stock-form' : 'create-sleeve-form'}
                disabled={submitting || (!editingSleeve && activeTab === 'add_stock' && !selectedSleeveId)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-red-600/25 transition-all cursor-pointer min-h-11 touch-manipulation"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : !editingSleeve && activeTab === 'add_stock' ? (
                  <PackagePlus className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>
                  {editingSleeve
                    ? 'Actualizar'
                    : activeTab === 'add_stock'
                    ? `Sumar +${addQuantity} Fundas`
                    : 'Guardar Funda'}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
