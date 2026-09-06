'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Copy, Plus, X, Loader2 } from 'lucide-react';

interface NewVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateVariant: (name: string, mode: 'duplicate' | 'empty') => void;
  isLoading?: boolean;
}

export const NewVariantModal: React.FC<NewVariantModalProps> = ({
  isOpen,
  onClose,
  onCreateVariant,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'duplicate' | 'empty'>('duplicate');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateVariant(name.trim(), mode);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-zinc-100"
        >
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Nueva Variante</h3>
                <p className="text-xs text-zinc-400 font-mono">Agrega una variante a esta Deckbox</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                Nombre de la Variante
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Horus, Burning Abyss, Pure..."
                autoFocus
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-red-500 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                Punto de Partida
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('duplicate')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    mode === 'duplicate'
                      ? 'bg-red-950/40 border-red-600/80 text-white'
                      : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Copy className="w-4 h-4 text-red-500 mb-1" />
                  <div className="text-xs font-bold">Duplicar actual</div>
                  <div className="text-[10px] text-zinc-500">Clona las cartas actuales para cambiar solo un motor</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('empty')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    mode === 'empty'
                      ? 'bg-red-950/40 border-red-600/80 text-white'
                      : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Layers className="w-4 h-4 text-zinc-400 mb-1" />
                  <div className="text-xs font-bold">Lista limpia</div>
                  <div className="text-[10px] text-zinc-500">Inicia sin cartas para armar desde cero</div>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer min-h-11 md:min-h-9 touch-manipulation"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-600/30 cursor-pointer min-h-11 md:min-h-9 touch-manipulation disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Crear Variante</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
