'use client';

import React, { useState } from 'react';
import { X, ThumbsDown, Send } from 'lucide-react';
import { TriageCardActionPayload, TacticalVerdict } from '@/types/triage';
import { useToast } from '@/components/ui/ToastProvider';
import { DestinationSelectorGrid, StarRatingSelector } from './TriageDisagreementFormFields';

interface TriageDisagreementFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  cardId: number;
  currentVerdict: TacticalVerdict;
  onApplyOverride: (
    destinationType: TriageCardActionPayload['destinationType'],
    themeTag?: string,
    salePrice?: number,
    reason?: string
  ) => void;
}

export const TriageDisagreementFeedbackModal: React.FC<TriageDisagreementFeedbackModalProps> = ({
  isOpen,
  onClose,
  cardName,
  cardId,
  currentVerdict,
  onApplyOverride,
}) => {
  const toast = useToast();
  const [selectedDestination, setSelectedDestination] = useState<TriageCardActionPayload['destinationType']>(
    currentVerdict.action === 'bulk_discard' ? 'collection_binder' : 'thematic_pool'
  );
  const [themeTag, setThemeTag] = useState('');
  const [salePrice, setSalePrice] = useState('1.00');
  const [userReason, setUserReason] = useState('');
  const [rating, setRating] = useState<number>(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanReason = userReason.trim();
    if (cleanReason.length < 5) {
      toast.error('Por favor ingresa una breve justificación (mínimo 5 caracteres) para que el sistema aprenda.');
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch('/api/ai/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'triage_tactical_verdict',
          suggestionId: `verdict-${cardId}-${Date.now()}`,
          rating,
          errorDescription: `Desacuerdo de Triaje: Sistema [${currentVerdict.actionLabel}], Usuario [${selectedDestination}]. Criterio: ${cleanReason}`,
          contextData: { cardId, cardName, systemAction: currentVerdict.action, userChosenAction: selectedDestination, themeTag: selectedDestination === 'thematic_pool' ? themeTag : undefined },
        }),
      }).catch(() => {});

      toast.success('¡Criterio registrado! El sistema guardó tu feedback y aprendió de tu decisión.');
      const parsedPrice = selectedDestination === 'trade_sale' ? parseFloat(salePrice) || 1.0 : undefined;
      onApplyOverride(selectedDestination, themeTag.trim() || undefined, parsedPrice, cleanReason);
      onClose();
    } catch {
      toast.error('Error aplicando decisión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-text">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ThumbsDown className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Auditoría de Criterio del Asesor
              </span>
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate max-w-sm">
                {cardName}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="p-3 bg-zinc-100/80 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
            <span className="text-zinc-500 font-mono text-[10.5px]">Sugerencia actual del sistema:</span>
            <p className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              [{currentVerdict.actionNumber}] {currentVerdict.actionLabel} — {currentVerdict.headline}
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 mb-2">
              ¿Cuál consideras que es el destino correcto?
            </label>
            <DestinationSelectorGrid
              selectedDestination={selectedDestination}
              onSelect={setSelectedDestination}
            />
          </div>

          {selectedDestination === 'thematic_pool' && (
            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                Nombre del Proyecto / Arquetipo / Tema:
              </label>
              <input
                type="text"
                value={themeTag}
                onChange={e => setThemeTag(e.target.value)}
                placeholder="Ej. Edison Dinosaur, Cyber Dragon, Zombies..."
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-red-500"
              />
            </div>
          )}

          {selectedDestination === 'trade_sale' && (
            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                Precio de Venta sugerido (USD):
              </label>
              <input
                type="number"
                step="0.01"
                min="0.10"
                value={salePrice}
                onChange={e => setSalePrice(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-red-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Califica la sugerencia previa del sistema:
            </label>
            <StarRatingSelector rating={rating} onChange={setRating} />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Justificación técnica (para entrenar y corregir el criterio):
            </label>
            <textarea
              rows={3}
              value={userReason}
              onChange={e => setUserReason(e.target.value)}
              placeholder="Explica por qué difieres (ej: 'Es un buscador no reconocido en formato Edison', 'Se usa en combo con Ground Xeno')..."
              className="w-full px-3 py-2 text-xs font-sans rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-red-500 leading-relaxed"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || userReason.trim().length < 5}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-mono shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Guardando...' : 'Aprender y Aplicar Mi Decisión'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
