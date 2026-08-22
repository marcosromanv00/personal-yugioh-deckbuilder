'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart2, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  X, 
  TrendingUp, 
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { OcrDigitStats, OcrConsolidatedMetrics } from '@/lib/ocr/ocrDigitStatsStore';

interface OcrStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OcrStatsModal: React.FC<OcrStatsModalProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<OcrConsolidatedMetrics | null>(null);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  // Cargar métricas al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setMetrics(OcrDigitStats.getMetrics());
      setIsConfirmingReset(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReset = () => {
    OcrDigitStats.resetMetrics();
    setMetrics(OcrDigitStats.getMetrics());
    setIsConfirmingReset(false);
  };

  // Cálculos globales
  let totalHits = 0;
  let totalMisses = 0;

  if (metrics) {
    Object.values(metrics.digits).forEach(d => {
      totalHits += d.hits;
      totalMisses += d.misses;
    });
  }

  const totalDigitEvaluations = totalHits + totalMisses;
  const overallAccuracy = totalDigitEvaluations > 0 
    ? Math.round((totalHits / totalDigitEvaluations) * 100) 
    : 100;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop sólido con opacidad */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80"
        />

        {/* Modal Container */}
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
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors min-h-11 min-w-11 flex items-center justify-center touch-manipulation"
              title="Cerrar diagnóstico"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content scrollable */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col justify-between">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Precisión Global
                </span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-zinc-100">{overallAccuracy}%</span>
                  <span className="text-xs text-zinc-500">
                    ({totalHits}/{totalDigitEvaluations || 0})
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col justify-between">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-red-400" /> Cartas Evaluadas
                </span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-zinc-100">
                    {metrics?.totalScansEvaluated || 0}
                  </span>
                  <span className="text-xs text-zinc-500">sesiones</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col justify-between">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
                  <Layers className="w-3.5 h-3.5 text-amber-400" /> Intentos Registrados
                </span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-zinc-100">
                    {metrics?.totalAttemptsLogged || 0}
                  </span>
                  <span className="text-xs text-zinc-500">frames</span>
                </div>
              </div>
            </div>

            {/* Matrix & Breakdown 0 to 9 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Desglose de Aciertos y Confusión por Dígito
                </h3>
                <span className="text-xs text-zinc-400">
                  Valores del 0 al 9
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {metrics && Object.values(metrics.digits).map(d => {
                  const total = d.hits + d.misses;
                  const accuracy = total > 0 ? Math.round((d.hits / total) * 100) : 100;
                  
                  // Obtener la confusión más común si hay fallos
                  const topConfusionEntry = Object.entries(d.confusions)
                    .filter(([, count]) => count > 0)
                    .sort(([, a], [, b]) => b - a)[0];

                  const isGood = accuracy >= 80 || total === 0;
                  const isModerate = accuracy >= 50 && accuracy < 80;

                  return (
                    <div
                      key={d.digit}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/70 hover:border-zinc-700 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center font-mono font-bold text-base text-zinc-100">
                            {d.digit}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-zinc-200">
                                {accuracy}% precisión
                              </span>
                              {total === 0 ? (
                                <span className="text-xs text-zinc-400">Sin datos</span>
                              ) : isGood ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              )}
                            </div>
                            <span className="text-xs text-zinc-400">
                              {d.hits} aciertos · {d.misses} fallos
                            </span>
                          </div>
                        </div>

                        {/* Barra de progreso mini */}
                        <div className="w-16 flex flex-col items-end gap-1">
                          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isGood
                                  ? 'bg-emerald-500'
                                  : isModerate
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${total === 0 ? 100 : accuracy}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Información de confusión observada */}
                      {topConfusionEntry && d.misses > 0 && (
                        <div className="pt-1.5 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-400">
                          <span className="text-zinc-400">Fallo común:</span>
                          <span className="flex items-center gap-1 font-mono text-zinc-300">
                            <span>{d.digit}</span>
                            <ArrowRight className="w-3 h-3 text-red-400" />
                            <span className="font-bold text-red-400">{topConfusionEntry[0]}</span>
                            <span className="text-zinc-400">({topConfusionEntry[1]}x)</span>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* How self-refinement works info note */}
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
                  onClick={handleReset}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors min-h-11 touch-manipulation flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Confirmar Reinicio
                </button>
                <button
                  onClick={() => setIsConfirmingReset(false)}
                  className="px-3 py-2 text-xs font-medium rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors min-h-11 touch-manipulation"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsConfirmingReset(true)}
                className="px-3 py-2 text-xs font-medium rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800/80 transition-colors min-h-11 touch-manipulation flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reiniciar Estadísticas
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors min-h-11 touch-manipulation"
            >
              Listo
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
