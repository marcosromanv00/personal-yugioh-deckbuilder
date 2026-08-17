'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';

export interface SortOption {
  value: string;
  label: string;
  badge?: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'default', label: 'Predeterminado', badge: 'Auto' },
  { value: 'name', label: 'Nombre (A-Z)', badge: 'A-Z' },
  { value: 'type', label: 'Tipo de Carta', badge: 'M/S/T' },
  { value: 'level', label: 'Nivel / Rango', badge: '★' },
  { value: 'atk', label: 'Mayor Ataque', badge: 'ATK' },
  { value: 'def', label: 'Mayor Defensa', badge: 'DEF' },
];

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = SORT_OPTIONS.find((o) => o.value === value) || SORT_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 hover:border-red-500 text-xs font-black text-zinc-900 dark:text-zinc-100 shadow-xs transition-all cursor-pointer"
        title="Cambiar criterio de ordenación"
      >
        <ArrowUpDown className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
        <span className="text-zinc-500 font-bold hidden sm:inline">Ordenar:</span>
        <span className="text-zinc-900 dark:text-white font-black">{selectedOption.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-red-500' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-1.5 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-black/20 p-1.5 z-50 overflow-hidden backdrop-blur-md"
          >
            <div className="px-2.5 py-1.5 border-b border-zinc-100 dark:border-zinc-800/80 mb-1 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">
                Criterios de Ordenación
              </span>
              <span className="text-[9px] font-mono text-red-500 font-bold">× × ×</span>
            </div>

            <div className="space-y-0.5">
              {SORT_OPTIONS.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      ) : (
                        <span className="w-3.5 h-3.5" />
                      )}
                      <span>{option.label}</span>
                    </span>
                    {option.badge && (
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                          isSelected
                            ? 'bg-red-700/60 text-white'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        {option.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
