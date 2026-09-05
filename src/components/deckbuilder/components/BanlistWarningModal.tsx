'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { BanlistFormat, BanlistStatus } from '@/lib/deck/banlist.utils';

export interface BanlistWarningModalProps {
  isOpen: boolean;
  cardName: string;
  cardImageUrl?: string;
  format: BanlistFormat;
  status: BanlistStatus;
  limit: number;
  currentCopies: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BanlistWarningModal: React.FC<BanlistWarningModalProps> = ({
  isOpen,
  cardName,
  cardImageUrl,
  format,
  status,
  limit,
  currentCopies,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getStatusBadge = () => {
    switch (status) {
      case 'Forbidden':
        return {
          label: '🚫 Prohibida (0 Copias)',
          bg: 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400',
        };
      case 'Limited':
        return {
          label: '1️⃣ Limitada (Máx 1 Copia)',
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400',
        };
      case 'Semi-Limited':
        return {
          label: '2️⃣ Semi-Limitada (Máx 2 Copias)',
          bg: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-600 dark:text-yellow-400',
        };
      default:
        return {
          label: 'Ilegal por Banlist',
          bg: 'bg-zinc-500/15 border-zinc-500/40 text-zinc-600 dark:text-zinc-400',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-white font-display">
                Incumplimiento de Banlist
              </h3>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Cerrar advertencia"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4.5 space-y-4">
            <div className="flex items-start gap-3.5">
              {cardImageUrl && (
                <div className="w-16 h-23 shrink-0 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm relative bg-zinc-100 dark:bg-zinc-950">
                  <Image
                    src={cardImageUrl}
                    alt={cardName}
                    fill
                    sizes="64px"
                    className="object-contain"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1.5">
                <h4 className="font-black text-sm text-zinc-900 dark:text-white truncate">
                  {cardName}
                </h4>
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    Formato: {format}
                  </span>
                  <span
                    className={`text-[10.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${badge.bg}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pt-1">
                  Actualmente ya cuentas con{' '}
                  <strong className="text-zinc-900 dark:text-white font-bold">
                    {currentCopies}
                  </strong>{' '}
                  {currentCopies === 1 ? 'copia' : 'copias'} en tu mazo. La banlist oficial permite un
                  máximo de{' '}
                  <strong className="text-red-600 dark:text-red-400 font-bold">{limit}</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>
                Puedes ignorar esta advertencia para pruebas o juego casual, pero este mazo no será
                válido en torneos oficiales de {format}.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20 transition-all cursor-pointer"
            >
              Continuar de todos modos
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
