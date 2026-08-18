'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecommendationResult } from '@/lib/storageRecommender';
import { X, Sparkles, Check, ArrowRight, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';

interface SmartOrganizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SmartOrganizeModal: React.FC<SmartOrganizeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState('');

  const fetchRecommendation = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/collection/organize', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al generar recomendaciones');
      setRecommendation(json.recommendation);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Fallo al calcular organización recomendada');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchRecommendation();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleApply = async () => {
    if (!recommendation || recommendation.proposals.length === 0) return;
    setExecuting(true);

    try {
      // Actualizar cada carta con su contenedor asignado
      for (const prop of recommendation.proposals) {
        await fetch('/api/collection/cards', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: prop.cardId,
            storage_location_id: prop.targetStorageId,
          }),
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Fallo al aplicar la asignación masiva');
    } finally {
      setExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-3xl p-6 text-zinc-900 dark:text-zinc-100 shadow-2xl flex flex-col h-dvh sm:h-auto sm:max-h-[85vh] relative"
        >
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Organización Inteligente</span>
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
                <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mb-2" />
                <p className="text-xs font-mono text-zinc-400">Analizando cartas y contenedores disponibles...</p>
              </div>
            ) : error ? (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : recommendation && recommendation.proposals.length > 0 ? (
              <>
                <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 text-xs font-mono text-purple-700 dark:text-purple-300">
                  <p className="font-bold">✨ Se han analizado {recommendation.summary.totalAssigned} cartas sin clasificar.</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {Object.entries(recommendation.summary.assignedByStorage).map(([storageName, count]) => (
                      <span key={storageName} className="px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-900 border border-purple-300 dark:border-purple-800 text-[11px] font-bold">
                        {storageName}: <strong>{count} cartas</strong>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase text-zinc-500 font-mono">
                    Propuestas de Asignación:
                  </h3>
                  {recommendation.proposals.map((prop, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{prop.cardName}</span>
                        <span className="ml-2 font-mono text-purple-600 dark:text-purple-400 font-bold">({prop.rarity})</span>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{prop.reason}</p>
                      </div>
                      <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 font-mono shrink-0">
                        <ArrowRight className="w-4 h-4" />
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-cyan-300 dark:border-cyan-800 text-xs font-bold text-cyan-700 dark:text-cyan-300">
                          {prop.targetStorageName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-zinc-400 text-xs font-bold">
                No hay cartas sin clasificar en la bandeja Inbox o no existen contenedores creados.
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              disabled={executing || !recommendation || recommendation.proposals.length === 0}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-md shadow-purple-600/25 cursor-pointer"
            >
              {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{executing ? 'Aplicando...' : 'Aplicar Distribución'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
