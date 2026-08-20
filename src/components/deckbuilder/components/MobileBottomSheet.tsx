'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Height as a Tailwind class, e.g. 'h-[85vh]' or 'h-[70vh]'. Defaults to 85vh. */
  heightClass?: string;
  children: React.ReactNode;
}

/**
 * MobileBottomSheet
 * A reusable animated bottom drawer for mobile viewports.
 * Slides in from the bottom with a spring animation.
 * Renders nothing on desktop (visibility should be controlled by the parent via md:hidden).
 */
export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  heightClass = 'h-[85vh]',
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260, mass: 0.8 }}
            className={`absolute bottom-0 left-0 right-0 ${heightClass} bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 rounded-t-3xl flex flex-col overflow-hidden shadow-2xl text-zinc-900 dark:text-zinc-100`}
            style={{ paddingBottom: 'var(--sab)' }}
          >
            {/* Drag handle */}
            <div className="pt-3 px-4 shrink-0 flex justify-center">
              <div className="w-12 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 pb-3 pt-1 shrink-0 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
