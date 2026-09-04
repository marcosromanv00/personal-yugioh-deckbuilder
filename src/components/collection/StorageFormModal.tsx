'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StorageType, StorageSubType, StorageLocationFormData, StorageLocation } from '@/types/collection';
import { X, Check, BookOpen, Shield, Box, Layers } from 'lucide-react';

interface StorageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: StorageLocationFormData & { id?: string }) => void;
  initialData?: StorageLocation | null;
}

export const StorageFormModal: React.FC<StorageFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<StorageType>('binder');
  const [subType, setSubType] = useState<StorageSubType>('binder_3x3');
  const [colorCode, setColorCode] = useState('#8b5cf6');
  const [capacity, setCapacity] = useState(360);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [description, setDescription] = useState('');
  const [totalPages, setTotalPages] = useState(40);
  const [compartmentCount, setCompartmentCount] = useState(1);
  const [compartmentNames, setCompartmentNames] = useState<string[]>(['Principal']);

  const [prevInitialData, setPrevInitialData] = useState<StorageLocation | null | undefined>(initialData);

  if (prevInitialData !== initialData) {
    setPrevInitialData(initialData);
    if (initialData) {
      setName(initialData.name || '');
      setType(initialData.type || 'binder');
      setSubType(initialData.sub_type || 'binder_3x3');
      setColorCode(initialData.color_code || '#8b5cf6');
      setCapacity(initialData.capacity || 360);
      setRows(initialData.grid_layout?.rows || 3);
      setCols(initialData.grid_layout?.cols || 3);
      setDescription(initialData.description || '');
      setTotalPages(initialData.grid_layout?.total_pages || 40);
      if (initialData.compartments) {
        setCompartmentCount(initialData.compartments.count || 1);
        setCompartmentNames(initialData.compartments.names || ['Principal']);
      } else {
        setCompartmentCount(1);
        setCompartmentNames(['Principal']);
      }
    } else {
      setName('');
      setType('binder');
      setSubType('binder_3x3');
      setColorCode('#8b5cf6');
      setCapacity(360);
      setRows(3);
      setCols(3);
      setDescription('');
      setTotalPages(40);
      setCompartmentCount(1);
      setCompartmentNames(['Principal']);
    }
  }

  if (!isOpen) return null;

  const handleCompartmentCountChange = (newCount: number) => {
    const count = Math.max(1, Math.min(10, newCount));
    setCompartmentCount(count);
    setCompartmentNames(prev => {
      const next = [...prev];
      if (count > next.length) {
        for (let i = next.length; i < count; i++) {
          next.push(`Carril ${i + 1}`);
        }
      } else {
        next.length = count;
      }
      return next;
    });
  };

  const handleCompartmentNameChange = (index: number, val: string) => {
    setCompartmentNames(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handlePagesChange = (pages: number) => {
    setTotalPages(pages);
    setCapacity(rows * cols * pages);
  };

  const handleTypeChange = (newType: StorageType) => {
    setType(newType);
    if (newType === 'binder') {
      setSubType('binder_3x3');
      setRows(3);
      setCols(3);
      setCapacity(3 * 3 * totalPages);
    } else if (newType === 'deckbox') {
      setSubType('standard');
      setCapacity(100);
    } else if (newType === 'tin') {
      setSubType('standard');
      setCapacity(300);
    } else {
      setSubType('box_multi_row');
      setCapacity(800);
    }
  };

  const handleSubTypeChange = (sub: StorageSubType) => {
    setSubType(sub);
    let r = 3;
    let c = 3;
    if (sub === 'binder_2x2') {
      r = 2;
      c = 2;
    } else if (sub === 'binder_3x4') {
      r = 3;
      c = 4;
    }
    setRows(r);
    setCols(c);
    setCapacity(r * c * totalPages);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      id: initialData?.id,
      name,
      type,
      sub_type: subType,
      color_code: colorCode,
      dimensions: { width: 0, height: 0, depth: 0 },
      capacity,
      grid_layout: {
        rows,
        cols,
        pockets_per_page: rows * cols,
        total_pages: Math.ceil(capacity / (rows * cols || 1)),
      },
      compartments: {
        count: compartmentCount,
        names: compartmentNames.map((n, idx) => n.trim() || `Carril ${idx + 1}`),
      },
      render_style: `${type}_${subType}`,
      description,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-3xl shadow-2xl p-6 text-zinc-900 dark:text-zinc-100 overflow-hidden flex flex-col h-dvh sm:h-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Box className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>{initialData ? 'Editar Contenedor Físico' : 'Registrar Nuevo Contenedor'}</span>
              </h2>
              <p className="text-[10px] text-zinc-500 font-mono">
                Carpetas, cajas, latas o deckboxes físicas
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Presets Rápidos */}
            {!initialData && (
              <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                <span className="text-[10px] font-mono font-black uppercase text-zinc-500 dark:text-zinc-400">
                  Plantillas Rápidas (1-Clic):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setName('Mi Binder 9-Pocket');
                      setType('binder');
                      setSubType('binder_3x3');
                      setRows(3);
                      setCols(3);
                      setTotalPages(40);
                      setCapacity(360);
                      setColorCode('#8b5cf6');
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-purple-600 transition-all cursor-pointer shadow-xs"
                  >
                    📗 Binder 9-Pocket (360)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setName('Mi Binder 4-Pocket');
                      setType('binder');
                      setSubType('binder_2x2');
                      setRows(2);
                      setCols(2);
                      setTotalPages(40);
                      setCapacity(160);
                      setColorCode('#06b6d4');
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-cyan-500 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-cyan-600 transition-all cursor-pointer shadow-xs"
                  >
                    📘 Binder 4-Pocket (160)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setName('Deckbox Principal');
                      setType('deckbox');
                      setSubType('standard');
                      setCapacity(100);
                      setColorCode('#06b6d4');
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-cyan-500 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-cyan-600 transition-all cursor-pointer shadow-xs"
                  >
                    🛡️ Deckbox (100)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setName('Lata Mega-Tin');
                      setType('tin');
                      setSubType('standard');
                      setCapacity(300);
                      setColorCode('#f59e0b');
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-amber-600 transition-all cursor-pointer shadow-xs"
                  >
                    🥫 Lata / Tin (300)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setName('Caja de Almacenamiento');
                      setType('box');
                      setSubType('box_multi_row');
                      setCapacity(800);
                      setColorCode('#6366f1');
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 transition-all cursor-pointer shadow-xs"
                  >
                    📦 Caja (800)
                  </button>
                </div>
              </div>
            )}

            {/* Nombre */}
            <div>
              <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">
                Nombre del Contenedor *
              </label>
              <input
                type="text"
                placeholder="ej: Binder 1 - Raras, Lata Kaiba 2022, Deckbox Doble Neón"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 text-xs font-bold"
              />
            </div>

            {/* Selector de Tipo */}
            <div>
              <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1.5">
                Tipo de Contenedor
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'binder', label: 'Binder', icon: BookOpen },
                  { id: 'deckbox', label: 'Deckbox', icon: Shield },
                  { id: 'tin', label: 'Lata', icon: Box },
                  { id: 'box', label: 'Caja', icon: Layers },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleTypeChange(id as StorageType)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-black transition-all cursor-pointer ${
                      type === id
                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-600 dark:text-purple-300 shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1 text-current" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subtipo / Formato de Cuadrícula */}
            {type === 'binder' && (
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1.5">
                  Formato de Páginas (Bolsillos)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'binder_2x2', label: '2x2 (4 Pockets)' },
                    { id: 'binder_3x3', label: '3x3 (9 Pockets)' },
                    { id: 'binder_3x4', label: '3x4 (12 Pockets)' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSubTypeChange(sub.id as StorageSubType)}
                      className={`p-2.5 rounded-xl border text-xs text-center font-mono font-bold transition-all cursor-pointer ${
                        subType === sub.id
                          ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-500 text-cyan-600 dark:text-cyan-300 shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Capacidad y Color */}
            <div className={`grid gap-3 ${type === 'binder' ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {type === 'binder' && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">
                    Hojas / Páginas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={totalPages}
                    onChange={(e) => handlePagesChange(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-mono font-bold focus:border-red-500 focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">
                  Capacidad {type === 'binder' ? '(Calculada)' : 'Máxima'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={capacity}
                  disabled={type === 'binder'}
                  onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                  className={`w-full px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-mono font-bold ${
                    type === 'binder' ? 'opacity-60 cursor-not-allowed' : 'focus:border-red-500 focus:outline-none'
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">
                  Color de Acento
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-zinc-300 dark:border-zinc-800"
                  />
                  <span className="text-xs font-mono font-bold text-zinc-500">{colorCode}</span>
                </div>
              </div>
            </div>

            {/* Configuración de Carriles / Compartimentos */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] font-mono font-black uppercase text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-500" />
                    <span>Carriles / Compartimentos</span>
                  </span>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Divide esta caja en filas o secciones independientes
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1">
                  <button
                    type="button"
                    disabled={compartmentCount <= 1}
                    onClick={() => handleCompartmentCountChange(compartmentCount - 1)}
                    className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold disabled:opacity-40 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-2 text-xs font-mono font-black text-purple-500">
                    {compartmentCount} {compartmentCount === 1 ? 'carril' : 'carriles'}
                  </span>
                  <button
                    type="button"
                    disabled={compartmentCount >= 10}
                    onClick={() => handleCompartmentCountChange(compartmentCount + 1)}
                    className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold disabled:opacity-40 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {compartmentCount > 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-36 overflow-y-auto">
                  {compartmentNames.map((cName, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-zinc-400 shrink-0 w-12">
                        Carril {idx + 1}:
                      </span>
                      <input
                        type="text"
                        value={cName}
                        onChange={(e) => handleCompartmentNameChange(idx, e.target.value)}
                        placeholder={`Nombre carril ${idx + 1}`}
                        className="flex-1 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-bold focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono mb-1">
                Ubicación / Notas Adicionales
              </label>
              <textarea
                placeholder="ej: En el estante superior de la habitación, carpeta azul..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-red-500 focus:outline-none resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-md shadow-red-600/25 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Contenedor</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
