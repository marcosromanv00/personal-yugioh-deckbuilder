'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2,
  RotateCcw,
  X,
  Sparkles,
} from 'lucide-react';
import { OcrDigitStats, OcrConsolidatedMetrics } from '@/lib/ocr/ocrDigitStatsStore';
import { OcrKpiSummaryCards } from './OcrKpiSummaryCards';
import { OcrDigitBreakdownCard } from './OcrDigitBreakdownCard';

interface OcrStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OcrStatsModal: React.FC<OcrStatsModalProps> = ({ isOpen, onClose }) => {
  const [, setResetVersion] = useState(0);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  if (!isOpen) return null;

  const metrics: OcrConsolidatedMetrics = OcrDigitStats.getMetrics();

  const handleReset = () => {
    OcrDigitStats.resetMetrics();
    setIsConfirmingReset(false);
    setResetVersion((v) => v + 1);
  };

  let totalHits = 0;
  let totalMisses = 0;

  if (metrics) {
    Object.values(metrics.digits).forEach((d) => {
      totalHits += d.hits;
      totalMisses += d.misses;
    });
  }

  const totalDigitEvaluations = totalHits + totalMisses;
  const overallAccuracy =
    totalDigitEvaluations > 0 ? Math.round((totalHits / totalDigitEvaluations) * 100) : 100;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  Diagnóstico y Aprendizaje OCR
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                    0-9 Logs
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Rendimiento y auto-refinamiento de interpretación dígito a dígito
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors min-h-11 min-w-11 flex items-center justify-center touch-manipulation cursor-pointer"
              title="Cerrar diagnóstico"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content scrollable */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <OcrKpiSummaryCards
              overallAccuracy={overallAccuracy}
              totalHits={totalHits}
              totalDigitEvaluations={totalDigitEvaluations}
              totalScansEvaluated={metrics?.totalScansEvaluated || 0}
              totalAttemptsLogged={metrics?.totalAttemptsLogged || 0}
            />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Desglose de Aciertos y Confusión por Dígito
                </h3>
                <span className="text-xs text-zinc-400">Valores del 0 al 9</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {metrics &&
                  Object.values(metrics.digits).map((d) => (
                    <OcrDigitBreakdownCard key={d.digit} digitData={d} />
                  ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 space-y-1">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-red-400" /> Auto-refinamiento activo:
              </span>
              <p>
                El generador de variantes sustituye primero las posiciones donde los dígitos tienen menor tasa de acierto y aplica con mayor prioridad las confusiones históricas aprendidas.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3.5 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
            {isConfirmingReset ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors min-h-11 touch-manipulation flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Confirmar Reinicio
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(false)}
                  className="px-3 py-2 text-xs font-medium rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors min-h-11 touch-manipulation cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingReset(true)}
                className="px-3 py-2 text-xs font-medium rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800/80 transition-colors min-h-11 touch-manipulation flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reiniciar Estadísticas
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors min-h-11 touch-manipulation cursor-pointer"
            >
              Listo
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
