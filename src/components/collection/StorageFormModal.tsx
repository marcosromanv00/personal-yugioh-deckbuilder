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
  const [width, setWidth] = useState(25);
  const [height, setHeight] = useState(30);
  const [depth, setDepth] = useState(4);
  const [description, setDescription] = useState('');
  const [compartmentsCount, setCompartmentsCount] = useState(1);
  const [compartmentNames, setCompartmentNames] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(40);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setType(initialData.type || 'binder');
        setSubType(initialData.sub_type || 'binder_3x3');
        setColorCode(initialData.color_code || '#8b5cf6');
        setCapacity(initialData.capacity || 360);
        setRows(initialData.grid_layout?.rows || 3);
        setCols(initialData.grid_layout?.cols || 3);
        setWidth(initialData.dimensions?.width || 0);
        setHeight(initialData.dimensions?.height || 0);
        setDepth(initialData.dimensions?.depth || 0);
        setDescription(initialData.description || '');
        setCompartmentsCount(initialData.compartments?.count || 1);
        setCompartmentNames(initialData.compartments?.names || []);
        setTotalPages(initialData.grid_layout?.total_pages || 40);
      } else {
        setName('');
        setType('binder');
        setSubType('binder_3x3');
        setColorCode('#8b5cf6');
        setCapacity(360);
        setRows(3);
        setCols(3);
        setWidth(25);
        setHeight(30);
        setDepth(4);
        setDescription('');
        setCompartmentsCount(1);
        setCompartmentNames(['Principal']);
        setTotalPages(40);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

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
      setCompartmentsCount(1);
      setCompartmentNames(['Principal']);
    } else if (newType === 'deckbox') {
      setSubType('deckbox_single');
      setCapacity(80);
      setCompartmentsCount(1);
      setCompartmentNames(['Deck 1']);
    } else if (newType === 'tin') {
      setSubType('standard');
      setCapacity(200);
      setCompartmentsCount(1);
      setCompartmentNames(['Principal']);
    } else {
      setSubType('box_multi_row');
      setCapacity(800);
      setCompartmentsCount(1);
      setCompartmentNames(['Principal']);
    }
  };

  const handleSubTypeChange = (newSubType: StorageSubType) => {
    setSubType(newSubType);
    let newCount = 1;
    if (newSubType === 'binder_2x2') {
      setRows(2);
      setCols(2);
      setCapacity(2 * 2 * totalPages);
      newCount = 1;
    } else if (newSubType === 'binder_3x3') {
      setRows(3);
      setCols(3);
      setCapacity(3 * 3 * totalPages);
      newCount = 1;
    } else if (newSubType === 'binder_3x4') {
      setRows(3);
      setCols(4);
      setCapacity(3 * 4 * totalPages);
      newCount = 1;
    } else if (newSubType === 'deckbox_single') {
      newCount = 1;
      setCapacity(80);
    } else if (newSubType === 'deckbox_double') {
      newCount = 2;
      setCapacity(160);
    } else if (newSubType === 'deckbox_triple') {
      newCount = 3;
      setCapacity(240);
    }
    setCompartmentsCount(newCount);
    setCompartmentNames(prev => {
      const arr = [...prev];
      if (arr.length < newCount) {
        for (let i = arr.length; i < newCount; i++) {
          arr.push(`Deck ${i + 1}`);
        }
      } else if (arr.length > newCount) {
        arr.splice(newCount);
      }
      return arr;
    });
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
        count: compartmentsCount,
        names: type === 'deckbox'
          ? compartmentNames.map((n, i) => n?.trim() || `Deck ${i + 1}`)
          : Array.from({ length: compartmentsCount }, (_, i) => `Compartimento ${i + 1}`),
      },
      render_style: `${type}_${subType}`,
      description,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <h2 className="text-xl font-bold bg-linear-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              {initialData ? 'Editar Contenedor Físico' : 'Registrar Nuevo Contenedor Físico'}
            </h2>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Nombre del Objeto</label>
              <input
                type="text"
                placeholder="ej: Binder 1 - Raras, Lata Kaiba 2022, Deckbox Doble Neón"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>

            {/* Selector de Tipo */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-2">Tipo de Contenedor</label>
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
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                      type === id
                        ? 'bg-purple-950/60 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtipo / Formato de Cuadrícula */}
            {type === 'binder' && (
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-2">Formato de Páginas (Bolsillos)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'binder_2x2', label: '2x2 (4 Pockets)', r: 2, c: 2 },
                    { id: 'binder_3x3', label: '3x3 (9 Pockets)', r: 3, c: 3 },
                    { id: 'binder_3x4', label: '3x4 (12 Pockets)', r: 3, c: 4 },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSubTypeChange(sub.id as StorageSubType)}
                      className={`p-2.5 rounded-lg border text-xs text-center font-mono ${
                        subType === sub.id
                          ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {type === 'deckbox' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-2">Capacidad y Compartimentos</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'deckbox_single', label: 'Simple (1 Comp - 80 cartas)' },
                      { id: 'deckbox_double', label: 'Doble (2 Comp - 160 cartas)' },
                      { id: 'deckbox_triple', label: 'Triple / Dados (3 Comp - 240 cartas)' },
                    ].map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSubTypeChange(sub.id as StorageSubType)}
                        className={`p-2.5 rounded-lg border text-xs text-center font-mono ${
                          subType === sub.id
                            ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <label className="block text-xs font-mono text-slate-400">Decks en los Compartimentos</label>
                  <div className="space-y-2">
                    {Array.from({ length: compartmentsCount }).map((_, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-slate-500 w-16 shrink-0">Comp. {idx + 1}:</span>
                        <input
                          type="text"
                          placeholder={`ej: Deck ${idx + 1} (Snake-Eye, Bystial, etc.)`}
                          value={compartmentNames[idx] || ''}
                          onChange={(e) => {
                            const updated = [...compartmentNames];
                            updated[idx] = e.target.value;
                            setCompartmentNames(updated);
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Capacidad y Color */}
            <div className={`grid gap-3 ${type === 'binder' ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {type === 'binder' && (
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Cantidad de Páginas</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={totalPages}
                    onChange={(e) => handlePagesChange(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Capacidad {type === 'binder' ? '(Calculada)' : 'Máxima (Cartas)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={capacity}
                  disabled={type === 'binder'}
                  onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                  className={`w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm font-mono ${
                    type === 'binder' ? 'opacity-60 cursor-not-allowed bg-slate-900' : 'focus:border-purple-500 focus:outline-none'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Color de Acento</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    className="w-9 h-9 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-slate-400">{colorCode}</span>
                </div>
              </div>
            </div>


            {/* Descripción */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Ubicación / Notas Adicionales</label>
              <textarea
                placeholder="ej: En el estante superior de la habitación, carpeta azul..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors flex items-center space-x-1.5 shadow-lg shadow-purple-900/30"
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
