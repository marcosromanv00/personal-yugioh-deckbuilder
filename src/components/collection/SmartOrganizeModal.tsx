'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecommendationResult } from '@/lib/storageRecommender';
import { X, Sparkles, Check, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-slate-950 border border-purple-900/50 rounded-2xl p-6 text-slate-100 shadow-2xl flex flex-col max-h-[85vh] relative"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Asistente de Organización Recomendada
            </h2>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mb-2" />
                <p className="text-sm font-mono text-slate-400">Analizando cartas y contenedores disponibles...</p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-sm flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            ) : recommendation && recommendation.proposals.length > 0 ? (
              <>
                <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/50 text-xs font-mono text-purple-200">
                  <p>✨ Se han analizado {recommendation.summary.totalAssigned} cartas sin clasificar.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(recommendation.summary.assignedByStorage).map(([storageName, count]) => (
                      <span key={storageName} className="px-2 py-1 rounded bg-slate-900 border border-purple-800/60">
                        {storageName}: <strong>{count} cartas</strong>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-mono text-slate-400">Propuestas de Asignación:</h3>
                  {recommendation.proposals.map((prop, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <span className="font-semibold text-slate-100">{prop.cardName}</span>
                        <span className="ml-2 font-mono text-purple-400">({prop.rarity})</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">{prop.reason}</p>
                      </div>
                      <div className="flex items-center space-x-2 text-cyan-400 font-mono shrink-0">
                        <ArrowRight className="w-4 h-4" />
                        <span className="px-2 py-1 rounded bg-slate-950 border border-cyan-800/60 text-cyan-300">
                          {prop.targetStorageName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-500 font-mono text-sm">
                No hay cartas sin clasificar en la bandeja Inbox o no existen contenedores creados.
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              disabled={executing || !recommendation || recommendation.proposals.length === 0}
              className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-medium text-xs transition-colors flex items-center space-x-1.5 shadow-lg shadow-purple-900/30"
            >
              <Check className="w-4 h-4" />
              <span>{executing ? 'Aplicando Reorganización...' : 'Aplicar Distribución Recomendada'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
