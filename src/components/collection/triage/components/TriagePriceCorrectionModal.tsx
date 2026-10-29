'use client';

import React, { useState } from 'react';
import { X, DollarSign, Send, Star } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

interface TriagePriceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  cardId: number;
  currentPrice: number;
  onApplyCorrection: (newPrice: number, reason: string) => Promise<boolean> | boolean;
}

const COMMON_REASONS = [
  'Precio real en TCGPlayer Market',
  'Carta con spike reciente por metajuego',
  'Rareza / Impresión física no detectada',
  'Cotización del mercado local / tienda',
];

export const TriagePriceCorrectionModal: React.FC<TriagePriceCorrectionModalProps> = ({
  isOpen,
  onClose,
  cardName,
  cardId,
  currentPrice,
  onApplyCorrection,
}) => {
  const toast = useToast();
  const [newPrice, setNewPrice] = useState<string>(currentPrice > 0 ? currentPrice.toFixed(2) : '1.00');
  const [reason, setReason] = useState<string>('Precio real en TCGPlayer Market');
  const [customReason, setCustomReason] = useState<string>('');
  const [rating, setRating] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(newPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error('Por favor ingresa un precio válido mayor o igual a 0.');
      return;
    }

    const finalReason = customReason.trim() ? `${reason}: ${customReason.trim()}` : reason;
    setIsSubmitting(true);
    try {
      await fetch('/api/ai/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'triage_price_correction',
          suggestionId: `price-${cardId}-${Date.now()}`,
          rating,
          errorDescription: `Corrección de precio para ${cardName}: de $${currentPrice.toFixed(2)} a $${parsedPrice.toFixed(2)}. Motivo: ${finalReason}`,
          contextData: { cardId, cardName, oldPrice: currentPrice, newPrice: parsedPrice, reason: finalReason },
        }),
      }).catch(() => {});

      const success = await onApplyCorrection(parsedPrice, finalReason);
      if (success !== false) {
        toast.success(`¡Precio actualizado a $${parsedPrice.toFixed(2)}! El veredicto táctico se recalculó al vuelo.`);
        onClose();
      }
    } catch {
      toast.error('Error aplicando corrección de precio');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-text">
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Corregir Precio y Enseñar al Sistema
              </span>
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate max-w-xs">{cardName}</h3>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <div className="p-3 bg-zinc-100/80 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-mono">Cotización previa registrada:</span>
            <span className="font-mono font-black text-zinc-900 dark:text-zinc-100 text-sm">${currentPrice.toFixed(2)} USD</span>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Precio Real Corregido (USD):</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-sm">$</span>
              <input
                type="number" step="0.01" min="0" value={newPrice} onChange={e => setNewPrice(e.target.value)} required
                className="w-full pl-7 pr-3 py-2 text-sm font-mono font-bold bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Fuente / Razón de la discrepancia:</label>
            <div className="space-y-1.5">
              {COMMON_REASONS.map(r => (
                <button
                  key={r} type="button" onClick={() => setReason(r)}
                  className={`w-full text-left p-2 rounded-xl border text-[11px] font-mono transition-all cursor-pointer ${
                    reason === r
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <input
              type="text" value={customReason} onChange={e => setCustomReason(e.target.value)} placeholder="Detalle adicional opcional..."
              className="mt-2 w-full px-3 py-1.5 text-xs font-sans bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">Calidad de la estimación anterior de la API:</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button" onClick={() => setRating(star)} className="p-1 cursor-pointer">
                  <Star className={`w-4 h-4 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-300 dark:text-zinc-700'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer">
              Cancelar
            </button>
            <button
              type="submit" disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-mono shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Guardando...' : 'Aprender y Actualizar Precio'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
