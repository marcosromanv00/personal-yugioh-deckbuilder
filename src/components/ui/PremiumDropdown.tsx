'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { DropdownOption, PremiumDropdownProps } from './dropdown.types';
import { calculateDropdownDirection } from './dropdown.utils';

export type { DropdownOption, PremiumDropdownProps };

export const PremiumDropdown = <T extends string | number>({
  options,
  value,
  onChange,
  icon,
  label,
  placeholder = 'Seleccionar...',
  className = '',
  triggerClassName = '',
  menuClassName = '',
  menuWidth = 'min-w-48',
  size = 'sm',
  align = 'left',
  disabled = false,
  maxMenuHeight = 'max-h-60',
  direction = 'auto',
}: PremiumDropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [computedDirection, setComputedDirection] = useState<'down' | 'up'>(() => (direction === 'up' ? 'up' : 'down'));
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      const nextOpen = !prev;
      if (nextOpen && containerRef.current) {
        setComputedDirection(calculateDropdownDirection(containerRef.current, direction));
      }
      return nextOpen;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  let paddingClasses = 'px-3 py-2.5 sm:py-1.5 text-xs min-h-11 sm:min-h-8';
  if (size === 'xs') {
    paddingClasses = 'px-2.5 py-2 sm:py-1 text-xs min-h-10 sm:min-h-7';
  } else if (size === 'md') {
    paddingClasses = 'px-3.5 py-3 sm:py-2 text-xs min-h-12 sm:min-h-9';
  }

  const alignClass =
    align === 'full'
      ? `left-0 min-w-full ${menuWidth}`
      : align === 'right'
      ? `right-0 ${menuWidth}`
      : `left-0 ${menuWidth}`;

  const positionClass =
    computedDirection === 'up'
      ? 'bottom-full mb-1.5 origin-bottom'
      : 'top-full mt-1.5 origin-top';

  return (
    <div className={`relative inline-block text-left ${isOpen ? 'z-60' : 'z-10'} ${align === 'full' ? 'w-full' : ''} ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between gap-1.5 rounded-xl border transition-all font-bold select-none shadow-2xs touch-manipulation ${paddingClasses} ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600'
            : isOpen
            ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-400 dark:border-zinc-600 ring-2 ring-red-500/20 text-zinc-900 dark:text-zinc-100 cursor-pointer'
            : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer'
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {icon && <span className="shrink-0 text-zinc-500 dark:text-zinc-400">{icon}</span>}
          {label && <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 uppercase">{label}:</span>}
          <span className="truncate text-xs font-bold">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge !== undefined && (
            <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-zinc-700 dark:text-zinc-200' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: computedDirection === 'up' ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: computedDirection === 'up' ? 6 : -6 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={`absolute ${alignClass} ${positionClass} bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl py-1.5 z-60 ${menuClassName}`}
          >
            <div className={`${maxMenuHeight} overflow-y-auto scrollbar-thin px-1 space-y-0.5`}>
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
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-medium transition-colors text-left select-none cursor-pointer touch-manipulation ${
                      isSelected
                        ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold'
                        : option.highlight
                        ? 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {option.icon && <span className="shrink-0 text-zinc-500">{option.icon}</span>}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{option.label}</span>
                        {option.description && (
                          <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {option.badge !== undefined && (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-md font-mono font-bold ${
                            isSelected
                              ? 'bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                          }`}
                        >
                          {option.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-red-600 dark:text-red-400 stroke-[2.5]" />}
                    </div>
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
