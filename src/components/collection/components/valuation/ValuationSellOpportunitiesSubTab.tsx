import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Coins, Check } from 'lucide-react';
import { ValuationSummary, SellOpportunity } from '@/lib/valuationEngine';

interface ValuationSellOpportunitiesSubTabProps {
  valuation: ValuationSummary;
  currencySymbol: string;
  onUpdateCardStatus?: (cardId: string, status: string) => void;
}

export const ValuationSellOpportunitiesSubTab: React.FC<ValuationSellOpportunitiesSubTabProps> = ({
  valuation, currencySymbol, onUpdateCardStatus,
}) => {
  const [selectedSellCardIds, setSelectedSellCardIds] = useState<Set<string>>(new Set());
  const [lotDiscountPercent, setLotDiscountPercent] = useState<number>(85);

  const toggleSelectSellCard = (id: string) => {
    setSelectedSellCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllSellCards = (items: SellOpportunity[]) => {
    if (selectedSellCardIds.size === items.length) {
      setSelectedSellCardIds(new Set());
    } else {
      setSelectedSellCardIds(new Set(items.map((i) => i.card.userCardId)));
    }
  };

  const selectedSellItems = useMemo(() => {
    return valuation.sellOpportunities.filter((op) => selectedSellCardIds.has(op.card.userCardId));
  }, [valuation.sellOpportunities, selectedSellCardIds]);

  const lotTotalMarketValue = selectedSellItems.reduce((acc, curr) => acc + curr.card.totalMarketValue, 0);
  const lotDiscountedCashout = lotTotalMarketValue * (lotDiscountPercent / 100);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="bg-linear-to-br from-zinc-900 to-black text-white p-6 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-tight font-display text-white">
                Simulador de Lote Comercial / Cashout
              </h3>
              <p className="text-xs text-zinc-400">
                Selecciona cartas candidatas para calcular el total a cobrar con descuento estándar de mercado.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSelectAllSellCards(valuation.sellOpportunities)}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold text-zinc-200 transition-all cursor-pointer"
          >
            {selectedSellCardIds.size === valuation.sellOpportunities.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-800 items-center">
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">
              Descuento de Venta ({lotDiscountPercent}% del valor de mercado):
            </label>
            <div className="flex items-center gap-2">
              {[70, 80, 85, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setLotDiscountPercent(pct)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    lotDiscountPercent === pct ? 'bg-amber-500 text-zinc-950 font-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="text-center sm:text-left">
            <span className="text-[11px] font-mono text-zinc-400 block">Valor de Mercado Seleccionado:</span>
            <span className="text-lg font-black font-mono text-zinc-300">
              {currencySymbol}{lotTotalMarketValue.toFixed(2)} ({selectedSellItems.length} cartas)
            </span>
          </div>

          <div className="text-right p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-[11px] font-mono text-amber-400 block font-bold">Cobro Estimado (Efectivo):</span>
            <span className="text-2xl font-black font-mono text-amber-400">
              {currencySymbol}{lotDiscountedCashout.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-display px-1">
          Cartas Sugeridas para Venta y Excedentes ({valuation.sellOpportunities.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {valuation.sellOpportunities.map((op) => {
            const isSelected = selectedSellCardIds.has(op.card.userCardId);
            return (
              <div
                key={op.card.userCardId}
                onClick={() => toggleSelectSellCard(op.card.userCardId)}
                className={`p-3.5 rounded-3xl border transition-all cursor-pointer select-none flex items-center gap-3.5 ${
                  isSelected ? 'bg-amber-500/10 border-amber-500 dark:bg-amber-950/20' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                }`}
              >
                <div className="relative w-14 h-20 shrink-0 rounded-xl overflow-hidden bg-black border border-zinc-800">
                  <Image src={op.card.imageUrl} alt={op.card.name} fill sizes="56px" className="object-cover" />
                  <div className={`absolute top-1 right-1 w-5 h-5 rounded-md flex items-center justify-center text-white ${isSelected ? 'bg-amber-500' : 'bg-black/60 border border-zinc-600'}`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-3" />}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      op.category === 'trade_sale' ? 'bg-red-600/10 text-red-600 border border-red-500/20' :
                      op.category === 'hidden_gem_bulk' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                      'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20'
                    }`}>
                      {op.categoryLabel}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">{op.card.rarity}</span>
                  </div>

                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate mt-1" title={op.card.name}>{op.card.name}</h4>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">{op.reason} • {op.card.locationName}</p>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-mono">{op.card.quantity}x copias</span>
                    <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">
                      {currencySymbol}{op.recommendedPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
