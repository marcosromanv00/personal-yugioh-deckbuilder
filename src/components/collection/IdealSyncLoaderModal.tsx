'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { useIdealEnvironment } from '@/context/IdealEnvironmentContext';

const SYNC_STEPS = [
  'Analizando inventario y estado físico actual...',
  'Evaluando metajuego y estructurando barajas meta y variantes...',
  'Promoviendo staples y cartas de alta rareza a Binders...',
  'Agrupando motores y clasificando el bulk excedente...',
  'Finalizando ambiente gemelo de Colección Ideal...'
];

export function IdealSyncLoaderModal() {
  const { isSyncing, syncStepMessage } = useIdealEnvironment();

  if (!isSyncing) return null;

  const stepText = syncStepMessage || 'Optimizando contenedores y estructurando colección ideal...';


  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden relative"
        >
          {/* Subtle Ambient Red Glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Header Icon Badge */}
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-500 shadow-md">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-zinc-900 dark:bg-black border border-zinc-800 rounded-full p-1 text-red-500">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight font-display">
              Generando <span className="text-red-600 dark:text-red-500">Colección Ideal</span>
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-xs font-sans">
              Optimizando contenedores, calculando variantes de decks y estructurando tu colección...
            </p>

            {/* Progress Step Indicator Box */}
            <div className="w-full mt-6 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Optimizando Colección Gemela</span>
              </div>
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 min-h-8 flex items-center text-center leading-snug">
                {stepText}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                <motion.div
                  className="bg-red-600 h-full rounded-full animate-pulse"
                  initial={{ width: '30%' }}
                  animate={{ width: '90%' }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
                />
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
