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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 text-zinc-900 dark:text-zinc-100 shadow-2xl flex flex-col max-h-[85vh] relative"
        >
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Asistente de Fundas (Sleeving Advisor)</span>
            </h2>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin mb-2" />
                <p className="text-xs font-mono text-zinc-400">Analizando nivel de protección de la colección...</p>
              </div>
            ) : error ? (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : report && report.recommendations.length > 0 ? (
              <>
                {/* Resumen de Métricas */}
                <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300">
                    <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Requieren Doble Funda</p>
                    <p className="text-xl font-black mt-0.5">{report.summary.doubleSleeveNeededCount}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300">
                    <p className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400">Reglamento TCG</p>
                    <p className="text-xl font-black mt-0.5">{report.summary.tournamentComplianceIssues}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300">
                    <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Ahorro en Bulk</p>
                    <p className="text-xl font-black mt-0.5">{report.summary.bulkSavingsCount}</p>
                  </div>
                </div>

                {/* Lista de Recomendaciones */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase text-zinc-500 font-mono">
                    Sugerencias de Protección:
                  </h3>
                  {report.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{rec.cardName}</span>
                        <span className={`px-2 py-0.5 rounded-lg font-mono text-[10px] font-bold ${
                          rec.priority === 'high' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}>
                          {rec.recommendedSleeve === 'double' ? 'Doble Funda' : rec.recommendedSleeve === 'single' ? 'Funda Simple' : 'Sin Funda'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500">{rec.reason}</p>
                      {rec.recommendedBrand && (
                        <p className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                          Marca recomendada: {rec.recommendedBrand} ({rec.recommendedColor})
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Guía Oficial de Torneos */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-black uppercase tracking-wider text-[11px]">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Reglamento Oficial de Torneos (KDE / TCG / MD)</span>
                  </div>
                  <ul className="text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1 list-disc list-inside">
                    <li><b>Main & Side Deck:</b> Todas las fundas deben ser estrictamente idénticas en tamaño, color, textura y estado de desgaste.</li>
                    <li><b>Extra Deck:</b> Es altamente recomendable usar un color de funda diferente y contrastante.</li>
                    <li><b>Doble Funda:</b> Si se usa doble funda (Inner + Outer), debe aplicarse consistentemente a toda la baraja.</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-zinc-400 text-xs font-bold flex flex-col items-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                <span>¡Excelente! Tu colección cuenta con un nivel de protección adecuado.</span>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-black uppercase tracking-wider cursor-pointer transition-colors"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
