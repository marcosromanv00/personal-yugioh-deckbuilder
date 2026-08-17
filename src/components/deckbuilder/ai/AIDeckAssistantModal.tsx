'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, X, Loader2, DollarSign, Trophy, Layers, CheckCircle2 } from 'lucide-react';
import { DeckCard } from '@/components/deckbuilder/types';
import { useToast } from '@/components/ui/ToastProvider';

interface AIDeckAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDeckCards: DeckCard[];
  format?: string;
  onApplyGeneratedDeck: (cards: { name: string; count: number; section: 'main' | 'extra' }[]) => void;
}

type AssistantMode = 'build_from_scratch' | 'build_from_collection' | 'optimize_meta' | 'optimize_budget' | 'diagnose';

export const AIDeckAssistantModal: React.FC<AIDeckAssistantModalProps> = ({
  isOpen,
  onClose,
  currentDeckCards,
  format = 'TCG',
  onApplyGeneratedDeck,
}) => {
  const toast = useToast();
  const [mode, setMode] = useState<AssistantMode>('optimize_meta');
  const [prompt, setPrompt] = useState('');
  const [budgetMax, setBudgetMax] = useState<number>(50);
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState<Record<string, unknown> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResultData(null);

    try {
      // Si el modo es basado en colección, intentar leer el inventario del usuario
      let userCollectionCards = [];
      if (mode === 'build_from_collection') {
        const stored = localStorage.getItem('ygo_collection_cards');
        if (stored) {
          try {
            userCollectionCards = JSON.parse(stored);
          } catch {
            userCollectionCards = [];
          }
        }
      }

      const response = await fetch('/api/ai/deck-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          prompt,
          currentDeckCards,
          userCollectionCards,
          format,
          budgetMax: mode === 'optimize_budget' ? budgetMax : undefined,
        }),
      });

      const res = await response.json();
      if (res.success && res.data) {
        setResultData(res.data);
        toast.success('¡Estrategia y deck optimizados con IA con éxito!');
      } else {
        toast.error(res.error || 'Error al comunicarse con Gemini AI');
      }
    } catch (err) {
      console.error(err);
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToDeck = () => {
    if (!resultData) return;
    const mainCards = (resultData.mainDeckCards as Array<{ name: string; count: number }>) || [];
    const extraCards = (resultData.extraDeckCards as Array<{ name: string; count: number }>) || [];

    const formattedList: { name: string; count: number; section: 'main' | 'extra' }[] = [
      ...mainCards.map((c) => ({ name: c.name, count: c.count, section: 'main' as const })),
      ...extraCards.map((c) => ({ name: c.name, count: c.count, section: 'extra' as const })),
    ];

    onApplyGeneratedDeck(formattedList);
    toast.success('¡Receta aplicada al constructor de decks!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                Asistente de Decks con Gemini AI
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-600 text-white font-mono">
                  Agosto 2026 Meta
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Sintetizador de recetas competitivas, optimizador de presupuesto e inventario
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Modo */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'optimize_meta', label: 'Meta Optimizer', icon: Trophy, desc: 'Ajustar a ratios de torneo' },
              { id: 'build_from_scratch', label: 'Desde Cero', icon: Sparkles, desc: 'Crear receta por concepto' },
              { id: 'build_from_collection', label: 'Por Inventario', icon: Layers, desc: 'Usar solo mis cartas físicas' },
              { id: 'optimize_budget', label: 'Budget Optimizer', icon: DollarSign, desc: 'Reemplazar staples caras' },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id as AssistantMode)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-red-500 bg-red-950/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-red-500' : 'text-zinc-400'}`} />
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-red-500" />}
                  </div>
                  <span className="text-xs font-black uppercase text-white">{item.label}</span>
                  <span className="text-[10px] text-zinc-400">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cuerpo / Formulario y Resultados */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-zinc-400 mb-1.5">
                Instrucciones o Detalles Específicos para Gemini
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === 'optimize_budget'
                    ? 'Reemplazar S:P Little Knight y Triple Tactics Thrust por alternativas viables para torneo local...'
                    : mode === 'build_from_scratch'
                    ? 'Quiero un deck competitivo de Ryzeal con soporte de handtraps pesadas para TCG...'
                    : 'Optimizar la consistencia de mi lista actual reduciendo bricks y subiendo non-engine a 18+...'
                }
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            {mode === 'optimize_budget' && (
              <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800">
                <DollarSign className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="flex-1 text-xs">
                  <span className="font-bold text-white block">Presupuesto Máximo Estimado: ${budgetMax} USD</span>
                  <input
                    type="range"
                    min="15"
                    max="200"
                    step="5"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(Number(e.target.value))}
                    className="w-full accent-red-500 mt-1"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sintetizando Receta con Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Ejecutar Análisis y Construcción</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Renderizado de Resultados Generados */}
          {resultData && (
            <div className="p-5 rounded-xl border border-red-500/40 bg-red-950/20 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-red-500/30">
                <div>
                  <h3 className="text-base font-black text-white">{String(resultData.deckName)}</h3>
                  <span className="text-xs text-red-400 font-bold uppercase">
                    Arquetipo: {String(resultData.archetype)} | {String(resultData.estimatedTier)}
                  </span>
                </div>

                <button
                  onClick={handleApplyToDeck}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aplicar al Deckbuilder</span>
                </button>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                {String(resultData.strategyOverview)}
              </p>

              {/* Ratios Non-Engine */}
              <div className="p-3 rounded-lg bg-black/40 border border-zinc-800 text-xs">
                <span className="font-bold text-amber-400 block mb-1">
                  Evaluación de Ratios &amp; Non-Engine:
                </span>
                <p className="text-zinc-300">{String(resultData.nonEngineRatioEvaluation)}</p>
              </div>

              {/* Desglose de Cartas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-black/40 border border-zinc-800">
                  <span className="font-bold text-white block mb-2">Main Deck Sugerido:</span>
                  <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                    {((resultData.mainDeckCards as Array<{ name: string; count: number; justification: string }>) || []).map(
                      (c, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] py-0.5 border-b border-zinc-800/50">
                          <span className="text-zinc-200">
                            {c.count}x {c.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 truncate max-w-35">
                            {c.justification}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-zinc-800">
                  <span className="font-bold text-white block mb-2">Extra Deck Sugerido:</span>
                  <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                    {((resultData.extraDeckCards as Array<{ name: string; count: number; role: string }>) || []).map(
                      (c, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] py-0.5 border-b border-zinc-800/50">
                          <span className="text-zinc-200">
                            {c.count}x {c.name}
                          </span>
                          <span className="text-[10px] text-amber-400 truncate max-w-35">
                            {c.role}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
