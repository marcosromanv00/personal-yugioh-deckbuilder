import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, X, AlertCircle, Loader2, Check } from 'lucide-react';

interface ScannerManualCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  manualCodeInput: string;
  setManualCodeInput: (code: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isManualSearching: boolean;
  manualSearchError: string;
}

export const ScannerManualCodeModal: React.FC<ScannerManualCodeModalProps> = ({
  isOpen,
  onClose,
  manualCodeInput,
  setManualCodeInput,
  onSubmit,
  isManualSearching,
  manualSearchError,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/25 sm:bg-black/80 backdrop-blur-none sm:backdrop-blur-xs">
          <div onClick={onClose} className="absolute inset-0 cursor-pointer" />

          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-lg sm:max-w-sm bg-zinc-900 border-t sm:border border-zinc-700 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[70vh] sm:max-h-none overflow-y-auto"
          >
            <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto -mt-2 mb-2 sm:hidden" />

            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-950/60 border border-red-500/30 text-red-400">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Corregir Código de Carta</h3>
                  <p className="text-[11px] text-zinc-400">Código de 8 dígitos de la esquina inferior</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 sm:p-1.5 text-zinc-400 hover:text-white rounded-xl transition-colors cursor-pointer touch-manipulation"
              >
                <X className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono font-bold text-zinc-300">
                  Código Passcode (8 cifras) o Nombre:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoFocus
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  placeholder="Ej. 29616929"
                  className="w-full text-center font-mono font-black text-2xl tracking-widest py-3.5 sm:py-3 px-4 bg-zinc-950 border-2 border-red-500/60 focus:border-red-500 rounded-2xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none shadow-inner"
                />
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono px-1">
                  <span>{manualCodeInput.length} caracteres</span>
                  <span>Introduce el código o nombre</span>
                </div>
              </div>

              {manualSearchError && (
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="truncate">{manualSearchError}</span>
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 min-h-12 sm:h-auto py-3 sm:py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95 text-xs font-bold transition-colors cursor-pointer font-mono touch-manipulation"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={manualCodeInput.trim().length === 0 || isManualSearching}
                  className="flex-1 min-h-12 sm:h-auto py-3 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-red-950 flex items-center justify-center gap-1.5 cursor-pointer font-mono active:scale-95 touch-manipulation"
                >
                  {isManualSearching ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Check className="w-4 h-4" />}
                  <span>{isManualSearching ? 'Buscando...' : 'Buscar Carta'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
