'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SleevingAdvisorReport } from '@/lib/sleevingAdvisor';
import { X, Shield, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface SleevingAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SleevingAdvisorModal: React.FC<SleevingAdvisorModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SleevingAdvisorReport | null>(null);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/collection/sleeves', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al analizar fundas');
      setReport(json.report);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Fallo al generar reporte de fundas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchReport();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-slate-950 border border-cyan-900/50 rounded-2xl p-6 text-slate-100 shadow-2xl flex flex-col max-h-[85vh] relative"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Asistente Recomendador de Fundas (Sleeving Advisor)
            </h2>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
                <p className="text-sm font-mono text-slate-400">Analizando nivel de protección de la colección...</p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            ) : report && report.recommendations.length > 0 ? (
              <>
                {/* Resumen de Métricas */}
                <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300">
                    <p className="text-[10px] text-amber-400/80">Requieren Doble Funda</p>
                    <p className="text-lg font-bold mt-0.5">{report.summary.doubleSleeveNeededCount}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300">
                    <p className="text-[10px] text-red-400/80">Reglamento TCG</p>
                    <p className="text-lg font-bold mt-0.5">{report.summary.tournamentComplianceIssues}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300">
                    <p className="text-[10px] text-emerald-400/80">Ahorro en Bulk</p>
                    <p className="text-lg font-bold mt-0.5">{report.summary.bulkSavingsCount}</p>
                  </div>
                </div>

                {/* Lista de Recomendaciones */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-mono text-slate-400">Sugerencias de Protección:</h3>
                  {report.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{rec.cardName}</span>
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                          rec.priority === 'high' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {rec.recommendedSleeve === 'double' ? 'Doble Funda' : rec.recommendedSleeve === 'single' ? 'Funda Simple' : 'Sin Funda'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{rec.reason}</p>
                      {rec.recommendedBrand && (
                        <p className="text-[10px] font-mono text-cyan-400">
                          Marca recomendada: {rec.recommendedBrand} ({rec.recommendedColor})
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-500 font-mono text-sm flex flex-col items-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
                <span>¡Excelente! Tu colección cuenta con un nivel de protección adecuado.</span>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
