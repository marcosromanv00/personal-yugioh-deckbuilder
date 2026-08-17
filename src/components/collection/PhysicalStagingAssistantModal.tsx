'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, ArrowRight, Sparkles, Layers, Box, Loader2 } from 'lucide-react';
import { useIdealEnvironment } from '@/context/IdealEnvironmentContext';
import { useToast } from '@/components/ui/ToastProvider';

interface PhysicalStagingAssistantModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function PhysicalStagingAssistantModal({ isOpen: propIsOpen, onClose: propOnClose }: PhysicalStagingAssistantModalProps = {}) {
  const { syncData, isAssistantModalOpen, closeAssistantModal } = useIdealEnvironment();
  const toast = useToast();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isAssistantModalOpen;
  const handleClose = propOnClose || closeAssistantModal;

  const [activeStage, setActiveStage] = useState<'binders' | 'decks' | 'bulk'>('binders');
  const [isApplying, setIsApplying] = useState(false);
  const [completedStages, setCompletedStages] = useState<Record<string, boolean>>({});

  if (!isOpen || !syncData) return null;


  const binderLogs = syncData.logs.filter(l => l.category === 'card_promoted');
  const deckLogs = syncData.logs.filter(l => l.category === 'deck_created');
  const bulkLogs = syncData.logs.filter(l => l.category === 'bulk_sorted');

  const handleApplyCurrentStage = async () => {
    setIsApplying(true);
    try {
      await fetch('/api/collection/ideal/apply-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: activeStage })
      });
      setCompletedStages(prev => ({ ...prev, [activeStage]: true }));
      toast.success(`¡Etapa de '${activeStage.toUpperCase()}' sincronizada con tu colección física!`);
    } catch (e) {
      console.error('Error aplicando etapa:', e);
      toast.error('Error al aplicar etapa de reorganización.');
    } finally {
      setIsApplying(false);
    }
  };


  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight font-display">
                  Asistente de Reorganización <span className="text-red-600 dark:text-red-500">Física</span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                  Guía paso a paso para aplicar los cambios en tus carpetas y cajas reales.
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-800 dark:text-zinc-200 font-sans">
            
            {/* Stage Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <button
                onClick={() => setActiveStage('binders')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeStage === 'binders'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>1. Binders ({binderLogs.length})</span>
                {completedStages['binders'] && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
              </button>

              <button
                onClick={() => setActiveStage('decks')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeStage === 'decks'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2. Decks ({deckLogs.length})</span>
                {completedStages['decks'] && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
              </button>

              <button
                onClick={() => setActiveStage('bulk')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeStage === 'bulk'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>3. Bulk ({bulkLogs.length})</span>
                {completedStages['bulk'] && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
              </button>
            </div>

            {/* Active Stage Content Details */}
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              {activeStage === 'binders' && (
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-display mb-1">
                    Etapa 1: Promocionar Staples y Rarezas a Binders
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                    Busca en tus latas y cajas las cartas indicadas a continuación y muévelas a sus binders asignados.
                  </p>

                  <div className="space-y-3">
                    {binderLogs.map((log, idx) => (
                      <div key={idx} className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <strong className="text-amber-600 dark:text-amber-400 font-bold">{log.title}</strong>
                          <span className="text-[10px] text-zinc-500 font-mono">{log.card_count} cartas</span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">{log.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeStage === 'decks' && (
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-display mb-1">
                    Etapa 2: Ensamblar Decks y Variantes
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                    Junta las cartas de las barajas calculadas por el optimizador.
                  </p>

                  <div className="space-y-3">
                    {deckLogs.map((log, idx) => (
                      <div key={idx} className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <strong className="text-red-600 dark:text-red-400 font-bold">{log.title}</strong>
                          <span className="text-[10px] text-zinc-500 font-mono">{log.card_count} cartas</span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">{log.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeStage === 'bulk' && (
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-display mb-1">
                    Etapa 3: Clasificar Bulk y Cajas Secundarias
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                    Organiza las cartas restantes en cajas por tipo y arquetipo.
                  </p>

                  <div className="space-y-3">
                    {bulkLogs.map((log, idx) => (
                      <div key={idx} className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <strong className="text-cyan-600 dark:text-cyan-400 font-bold">{log.title}</strong>
                          <span className="text-[10px] text-zinc-500 font-mono">{log.card_count} cartas</span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">{log.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cerrar Asistente
            </button>


            <button
              type="button"
              onClick={handleApplyCurrentStage}
              disabled={isApplying}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-600/25 flex items-center gap-2 cursor-pointer font-display"
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sincronizando...</span>
                </>
              ) : (
                <>
                  <span>Marcar Etapa como Realizada en Físico</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
