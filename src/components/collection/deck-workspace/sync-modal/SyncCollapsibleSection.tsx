'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SyncCollapsibleSectionProps {
  title: string;
  count: number;
  defaultOpen: boolean;
  accentClass: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const SyncCollapsibleSection: React.FC<SyncCollapsibleSectionProps> = ({
  title,
  count,
  defaultOpen,
  accentClass,
  icon,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isAnimationComplete, setIsAnimationComplete] = useState(defaultOpen);

  const handleToggle = () => {
    setIsAnimationComplete(false);
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between gap-2 group cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <span className={`text-[10px] ${accentClass}`}>{icon}</span>
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
            {title}
          </h4>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${accentClass}`}>
            {count}
          </span>
        </div>
        <span className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onAnimationComplete={() => setIsAnimationComplete(isOpen)}
            className={isOpen && isAnimationComplete ? 'overflow-visible' : 'overflow-hidden'}
          >
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-visible">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
