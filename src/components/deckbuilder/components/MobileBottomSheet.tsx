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
            className={`absolute bottom-0 left-0 right-0 ${heightClass} bg-[hsl(224,22%,10%)] border-t border-[hsl(224,15%,18%)] rounded-t-3xl flex flex-col overflow-hidden shadow-2xl`}
            style={{ paddingBottom: 'var(--sab)' }}
          >
            {/* Drag handle */}
            <div className="pt-3 px-4 shrink-0">
              <div className="sheet-handle" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 pb-3 shrink-0 border-b border-[hsl(224,15%,16%)]">
                <h2 className="font-bold text-sm uppercase tracking-wider text-slate-200">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,18%)] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Cerrar"
                >
                  <X className="w-3.5 h-3.5" />
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
