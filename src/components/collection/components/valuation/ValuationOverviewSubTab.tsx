import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, Layers, Flame, ChevronRight } from 'lucide-react';
import { ValuationSummary } from '@/lib/valuationEngine';

interface ValuationOverviewSubTabProps {
  valuation: ValuationSummary;
  currencySymbol: string;
  onViewAllTopCards?: () => void;
}

export const ValuationOverviewSubTab: React.FC<ValuationOverviewSubTabProps> = ({
  valuation, currencySymbol, onViewAllTopCards,
}) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider font-display">
                Distribución de Valor por Rareza
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">Total: {currencySymbol}{valuation.totalPortfolioValue.toFixed(2)}</span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {valuation.rarityDistribution.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate pr-2">{item.rarity}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-zinc-500 text-[11px]">{item.count} cartas</span>
                    <span className="font-black text-zinc-900 dark:text-white">{currencySymbol}{item.totalValue.toFixed(2)}</span>
                    <span className="text-zinc-400 text-[10px] w-10 text-right">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-linear-to-r from-red-600 to-amber-500 rounded-full" style={{ width: `${Math.min(100, item.percentage)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-500" />
              <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider font-display">
                Distribución por Tipo de Carta
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">{valuation.totalOriginalCardsCount} cartas</span>
          </div>

          <div className="space-y-3">
            {valuation.typeDistribution.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{item.typeGroup}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-[11px]">{item.count} cartas</span>
                    <span className="font-black text-zinc-900 dark:text-white">{currencySymbol}{item.totalValue.toFixed(2)}</span>
                    <span className="text-zinc-400 text-[10px] w-10 text-right">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.typeGroup === 'Extra Deck' ? 'bg-purple-500' :
                      item.typeGroup === 'Mágicas' ? 'bg-emerald-500' :
                      item.typeGroup === 'Trampas' ? 'bg-pink-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              <strong className="text-zinc-900 dark:text-zinc-200">Estimación Inteligente:</strong> Para cartas sin rareza registrada, el sistema utiliza el valor de mercado estándar accesible. Las rarezas caras solo se cotizan si las agregas manualmente.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider font-display">
              Joyas de la Corona (Top 5 Más Valiosas)
            </h3>
          </div>
          <button type="button" onClick={onViewAllTopCards} className="text-xs font-bold text-red-600 hover:text-red-500 flex items-center gap-1 cursor-pointer">
            <span>Ver todas las 30</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {valuation.topValuedCards.slice(0, 5).map((card, idx) => (
            <div key={card.userCardId} className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between gap-2.5 relative group hover:border-red-500/40 transition-colors">
              <span className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-black/80 text-white font-mono font-black text-[10px] flex items-center justify-center border border-zinc-700">
                #{idx + 1}
              </span>
              <div className="relative w-full aspect-5/7 rounded-xl overflow-hidden bg-black border border-zinc-800">
                <Image src={card.imageUrl} alt={card.name} fill sizes="(max-width: 768px) 150px, 200px" className="object-contain group-hover:scale-105 transition-transform duration-200" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate" title={card.name}>{card.name}</h4>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mt-0.5">
                  <span className="text-amber-600 dark:text-amber-400 truncate">{card.rarity}</span>
                  <span>{card.condition}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-400 font-mono truncate max-w-24">{card.locationName}</span>
                  <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {currencySymbol}{card.unitMarketPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
