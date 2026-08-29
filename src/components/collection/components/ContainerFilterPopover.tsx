'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  X, 
  RotateCcw, 
  BookOpen, 
  Shield, 
  Layers, 
  Box, 
  Check, 
  ArrowUpDown,
  CheckCircle2
} from 'lucide-react';

export type ContainerTypeFilter = 'all' | 'binder' | 'deckbox' | 'box' | 'tin';
export type ContainerStatusFilter = 'all' | 'has_space' | 'full' | 'empty' | 'with_decks';
export type ContainerSortOption = 'name' | 'capacity_desc' | 'occupancy_desc' | 'occupancy_asc';

interface ContainerFilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  typeFilter: ContainerTypeFilter;
  setTypeFilter: (val: ContainerTypeFilter) => void;
  statusFilter: ContainerStatusFilter;
  setStatusFilter: (val: ContainerStatusFilter) => void;
  sortBy: ContainerSortOption;
  setSortBy: (val: ContainerSortOption) => void;
  onResetFilters: () => void;
  activeFiltersCount: number;
}

export const ContainerFilterPopover: React.FC<ContainerFilterPopoverProps> = ({
  isOpen,
  onClose,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  onResetFilters,
  activeFiltersCount,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const typeOptions: { id: ContainerTypeFilter; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'Todos', icon: Layers },
    { id: 'binder', label: 'Carpetas (Binders)', icon: BookOpen },
    { id: 'deckbox', label: 'Deckboxes', icon: Shield },
    { id: 'box', label: 'Cajas', icon: Layers },
    { id: 'tin', label: 'Latas (Tins)', icon: Box },
  ];

  const statusOptions: { id: ContainerStatusFilter; label: string }[] = [
    { id: 'all', label: 'Cualquier estado' },
    { id: 'has_space', label: 'Con espacio libre' },
    { id: 'full', label: 'Llenos (100%)' },
    { id: 'empty', label: 'Vacíos (0%)' },
    { id: 'with_decks', label: 'Con barajas asignadas' },
  ];

  const sortOptions: { id: ContainerSortOption; label: string }[] = [
    { id: 'name', label: 'Nombre (A - Z)' },
    { id: 'capacity_desc', label: 'Mayor Capacidad' },
    { id: 'occupancy_desc', label: 'Mayor Ocupación (%)' },
    { id: 'occupancy_asc', label: 'Menor Ocupación (%)' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-4 select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-3.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
                Filtros de Contenedores
              </h4>
              {activeFiltersCount > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-red-600 text-white">
                  {activeFiltersCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="text-[11px] font-bold text-zinc-500 hover:text-red-600 dark:hover:text-red-400 px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Restablecer
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* 1. Tipo de Contenedor */}
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                Tipo de Almacenamiento
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {typeOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = typeFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTypeFilter(opt.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                          : 'bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Estado de Ocupación */}
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                Estado de Capacidad
              </span>
              <div className="space-y-1">
                {statusOptions.map((opt) => {
                  const isSelected = statusFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStatusFilter(opt.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Criterio de Ordenación */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                Ordenar Por
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {sortOptions.map((opt) => {
                  const isSelected = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSortBy(opt.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center truncate ${
                        isSelected
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
