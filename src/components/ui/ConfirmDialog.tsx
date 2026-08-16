'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-400" />,
          iconBg: 'bg-red-950/40 border-red-900/40',
          confirmBtn: 'bg-red-600 hover:bg-red-700 text-white shadow-red-950/40',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
          iconBg: 'bg-amber-950/40 border-amber-900/40',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-950/40',
        };
      case 'primary':
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-purple-400" />,
          iconBg: 'bg-purple-950/40 border-purple-900/40',
          confirmBtn: 'bg-[hsl(263,85%,64%)] hover:bg-[hsl(263,85%,58%)] text-white shadow-purple-950/40',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 cursor-pointer"
          onClick={!isLoading ? onClose : undefined}
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-[hsl(224,22%,10%)] border border-[hsl(224,15%,18%)] rounded-2xl p-6 shadow-2xl z-10 space-y-4"
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl border shrink-0 ${styles.iconBg}`}>
              {styles.icon}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base text-slate-100 mb-1">{title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 ${styles.confirmBtn}`}
            >
              {isLoading ? 'Procesando...' : confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
