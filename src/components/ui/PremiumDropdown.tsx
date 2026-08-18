'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
  description?: string;
  highlight?: boolean;
}

export interface PremiumDropdownProps<T = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  icon?: React.ReactNode;
  label?: string;
  placeholder?: string;
  className?: string;
  menuWidth?: string;
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
}

export const PremiumDropdown = <T extends string | number>({
  options,
  value,
  onChange,
  icon,
  label,
  placeholder = 'Seleccionar...',
  className = '',
  menuWidth = 'min-w-48',
  size = 'sm',
  align = 'left',
}: PremiumDropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const isSm = size === 'sm';
  const paddingClasses = isSm ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-xs';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Botón Trigger del Dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-1.5 rounded-xl border transition-all cursor-pointer font-bold select-none shadow-2xs ${paddingClasses} ${
          isOpen
            ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-400 dark:border-zinc-600 ring-2 ring-red-500/20 text-zinc-900 dark:text-zinc-100'
            : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {icon && <span className="shrink-0 text-zinc-500 dark:text-zinc-400">{icon}</span>}
          {label && <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase">{label}:</span>}
          <span className="truncate text-[11.5px] font-bold">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge !== undefined && (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
          className="shrink-0 ml-1 text-zinc-400 dark:text-zinc-500"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.span>
      </button>

      {/* Menú Desplegable Flotante Sólido (Sin Glassmorphism, Z-Index Alto) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={`absolute z-100 mt-1 ${menuWidth} ${align === 'right' ? 'right-0' : 'left-0'} bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl shadow-black/40 p-1.5 space-y-0.5 max-h-64 overflow-y-auto scrollbar-thin font-sans`}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer group select-none ${
                    isSelected
                      ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/80'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {option.icon && (
                      <span className={`shrink-0 ${isSelected ? 'text-red-500' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200'}`}>
                        {option.icon}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[11.5px] font-bold">{option.label}</p>
                      {option.description && (
                        <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 truncate leading-tight mt-0.5">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {option.badge !== undefined && (
                      <span
                        className={`text-[9.5px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                          isSelected
                            ? 'bg-red-600 text-white'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'
                        }`}
                      >
                        {option.badge}
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-red-500" />}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
