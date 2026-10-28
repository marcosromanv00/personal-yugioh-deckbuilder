'use client';

import React, { useState } from 'react';
import { X, Sparkles, DollarSign, Check, Award } from 'lucide-react';
import { CardSetPrintingsResponse, CardSetPrinting } from '@/types/triage';

interface TriageRarityPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  currentRarity: string;
  currentSalePrice?: number | null;
  setsData: CardSetPrintingsResponse | null;
  onApplyRarityAndPrice: (rarity: string, price: number | null) => void;
}

export const TriageRarityPricingModal: React.FC<TriageRarityPricingModalProps> = ({
  isOpen,
  onClose,
  cardName,
  currentRarity,
  currentSalePrice,
  setsData,
  onApplyRarityAndPrice,
}) => {
  const [selectedRarity, setSelectedRarity] = useState(currentRarity);
  const [customPrice, setCustomPrice] = useState<string>(
    currentSalePrice !== undefined && currentSalePrice !== null ? currentSalePrice.toFixed(2) : ''
  );

  if (!isOpen) return null;

  const marketPrice = setsData?.marketPriceTcg ?? 0.25;

  const handleSelectPrinting = (printing: CardSetPrinting) => {
    setSelectedRarity(printing.setRarity);
    setCustomPrice(printing.setPrice.toFixed(2));
  };

  const handleSave = () => {
    const trimmed = customPrice.trim();
    const parsedPrice = trimmed ? parseFloat(trimmed) : null;
    onApplyRarityAndPrice(selectedRarity, parsedPrice !== null && !isNaN(parsedPrice) ? parsedPrice : null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
              Ediciones y Rarezas Oficiales
            </span>
            <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate max-w-sm">
              {cardName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Ediciones / Sets */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
          <div className="text-xs font-mono font-bold text-zinc-500 mb-1">
            Selecciona la impresión física de tu carta:
          </div>

          {setsData?.printings && setsData.printings.length > 0 ? (
            <div className="space-y-1.5">
              {setsData.printings.map((p, idx) => {
                const isSelected = selectedRarity.toLowerCase() === p.setRarity.toLowerCase();
                const isHighVal = p.setPrice >= 3.0;

                return (
                  <button
                    key={`${p.setCode}-${idx}`}
                    type="button"
                    onClick={() => handleSelectPrinting(p)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-red-600 dark:border-red-500 bg-red-50/50 dark:bg-red-950/20 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900/40'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                          {p.setCode}
                        </span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {p.setRarity}
                        </span>
                        {isHighVal && (
                          <span className="text-[9px] font-mono font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 px-1.5 py-0.2 rounded-full">
                            ★ Valor
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">{p.setName}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                        ${p.setPrice.toFixed(2)}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-red-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic py-2">
              No se encontraron sets específicos en la base de datos para esta carta. Puedes fijar la rareza manualmente.
            </p>
          )}

          {/* Campo de Precio Personalizado */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="block text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                Precio / Valuación Personalizado (USD):
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCustomPrice(marketPrice.toFixed(2))}
                  className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Usar Mercado (${marketPrice.toFixed(2)})
                </button>
                {customPrice && (
                  <button
                    type="button"
                    onClick={() => setCustomPrice('')}
                    className="text-[10px] font-mono text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer ml-1"
                  >
                    (Limpiar)
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={customPrice}
                onChange={e => setCustomPrice(e.target.value)}
                placeholder={marketPrice.toFixed(2)}
                className="w-full pl-7 pr-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-red-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-xs cursor-pointer active:scale-98 transition-all"
          >
            Aplicar Rareza y Precio
          </button>
        </div>
      </div>
    </div>
  );
};
