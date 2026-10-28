'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, AlertTriangle, X, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { ReportSource } from '@/types/reports';
import { useToast } from '@/components/ui/ToastProvider';

interface SuggestionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: ReportSource;
  suggestionId?: string;
  suggestionSnippet?: string;
  contextData?: Record<string, unknown>;
  onReportSuccess?: () => void;
}

const RATING_LEVELS: Record<number, { label: string; color: string; desc: string }> = {
  1: { label: 'Crítico / Alucinación', color: 'text-red-500 bg-red-500/10 border-red-500/30', desc: 'Datos falsos, cartas inexistentes o rulings completamente erróneos.' },
  2: { label: 'Deficiente / Desactualizado', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30', desc: 'Precios obsoletos, banlists antiguas o ratios desfasados.' },
  3: { label: 'Regular / Impreciso', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30', desc: 'Parcialmente correcto pero con omisiones o ambigüedades clave.' },
  4: { label: 'Bueno / Aceptable', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', desc: 'Información mayoritariamente verídica con un detalle menor a corregir.' },
  5: { label: 'Excelente / Fidedigno', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', desc: 'Datos 100% precisos y verificables con el formato actual.' },
};

const SOURCE_LABELS: Record<ReportSource, string> = {
  global_chat: 'Cerebro Virtual (Chat IA)',
  deck_assistant: 'Asistente de Decks IA',
  deck_diagnostics: 'Diagnóstico de Consistencia',
  collection_suggestions: 'Sugerencias de Colección',
  duel_copilot: 'Copiloto de Duelo',
  combo_advisor: 'Asesor de Combos',
  general: 'Información General del Sistema',
};

export const SuggestionReportModal: React.FC<SuggestionReportModalProps> = ({
  isOpen,
  onClose,
  source,
  suggestionId,
  suggestionSnippet,
  contextData,
  onReportSuccess,
}) => {
  const toast = useToast();
  const [rating, setRating] = useState<number>(1);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [errorDescription, setErrorDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const activeLevel = RATING_LEVELS[hoverRating || rating];
  const isFormValid = errorDescription.trim().length >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/ai/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          suggestionId,
          rating,
          errorDescription: errorDescription.trim(),
          contextData: {
            ...contextData,
            snippet: suggestionSnippet ? suggestionSnippet.slice(0, 300) : undefined,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsDone(true);
        toast.success('Reporte de error enviado exitosamente. ¡Gracias por auditar el sistema!');
        setTimeout(() => {
          setIsDone(false);
          setErrorDescription('');
          setRating(1);
          onReportSuccess?.();
          onClose();
        }, 1200);
      } else {
        toast.error(data.error || 'Error al enviar reporte');
      }
    } catch {
      toast.error('Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans"
      >
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-zinc-900 dark:text-zinc-100 font-display">
                Reportar Error o Calificar
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                {SOURCE_LABELS[source]}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isDone ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              ¡Reporte Registrado!
            </h4>
            <p className="text-xs text-zinc-500 max-w-xs">
              La retroalimentación fue guardada para corregir y anclar los datos en tiempo real.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {suggestionSnippet && (
              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 italic line-clamp-2">
                &ldquo;{suggestionSnippet}&rdquo;
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                1. Calificación de Calidad (Escala 1 a 5)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isFilled = starValue <= (hoverRating || rating);
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(starValue)}
                      className="p-2 min-h-11 min-w-11 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 transition-colors flex items-center justify-center cursor-pointer touch-manipulation"
                    >
                      <Star
                        className={`w-6 h-6 transition-transform ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 scale-110'
                            : 'text-zinc-300 dark:text-zinc-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className={`mt-2.5 px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-between ${activeLevel.color}`}>
                <span>{activeLevel.label}</span>
                <span className="text-[11px] opacity-80">{activeLevel.desc}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  2. Descripción del Error (Obligatorio)
                </label>
                <span className="text-[10px] text-zinc-400">
                  {errorDescription.trim().length}/2000 (Mín. 5)
                </span>
              </div>
              <textarea
                value={errorDescription}
                onChange={(e) => setErrorDescription(e.target.value)}
                placeholder="Indica qué estuvo mal: ¿carta alucinada?, ¿precio falso?, ¿ratio incorrecto?, ¿ruling violado?..."
                rows={4}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:border-red-500 resize-none transition-colors"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 min-h-11 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer touch-manipulation"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="px-5 py-2.5 min-h-11 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-red-600/20 transition-all cursor-pointer touch-manipulation"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Reporte</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
