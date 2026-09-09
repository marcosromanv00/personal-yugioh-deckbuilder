import React from 'react';
import {
  TrendingUp,
  RefreshCw,
  Copy,
  Check,
  Download,
  DollarSign,
  ShoppingBag,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { CurrencyType, ValuationSummary } from '@/lib/valuationEngine';
import { Deck } from '@/types/collection';
import { ValuationKpiCard, ValuationKpiItem } from './ValuationKpiCard';

interface ValuationHeaderKpisProps {
  currency: CurrencyType;
  setCurrency: (c: CurrencyType) => void;
  currencySymbol: string;
  loadingPrices: boolean;
  fetchMarketPrices: () => void;
  copiedSummary: boolean;
  handleCopySummary: () => void;
  handleDownloadCSV: () => void;
  valuation: ValuationSummary;
  decks: Deck[];
}

export const ValuationHeaderKpis: React.FC<ValuationHeaderKpisProps> = ({
  currency,
  setCurrency,
  currencySymbol,
  loadingPrices,
  fetchMarketPrices,
  copiedSummary,
  handleCopySummary,
  handleDownloadCSV,
  valuation,
  decks,
}) => {
  const kpis: ValuationKpiItem[] = [
    {
      title: 'Valor Total Portafolio',
      titleColor: 'text-zinc-500 dark:text-zinc-400',
      iconBg: 'bg-red-600/10 border-red-500/20 text-red-600 dark:text-red-400',
      icon: DollarSign,
      value: valuation.totalPortfolioValue,
      valueColor: 'text-zinc-900 dark:text-white',
      footerLeft: `${valuation.totalOriginalCardsCount} cartas físicas`,
      footerRight: `Promedio: ${currencySymbol}${valuation.averageCardValue.toFixed(2)}/u`,
    },
    {
      title: 'Liquidez / Para Venta',
      titleColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
      icon: ShoppingBag,
      value: valuation.totalTradeSaleValue,
      valueColor: 'text-amber-600 dark:text-amber-400',
      footerLeft: `${valuation.sellOpportunities.length} oportunidades`,
      footerRight: 'Listas para Trade',
    },
    {
      title: 'En Decks Armados',
      titleColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400',
      icon: FileText,
      value: valuation.totalDeckCardsValue,
      valueColor: 'text-purple-600 dark:text-purple-400',
      footerLeft: `${decks.length} mazos registrados`,
      footerRight: 'En combate',
    },
    {
      title: 'Costo de Proxies',
      titleColor: 'text-cyan-600 dark:text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400',
      icon: ShieldAlert,
      value: valuation.totalProxyReplacementCost,
      valueColor: 'text-cyan-600 dark:text-cyan-400',
      footerLeft: `${valuation.totalProxiesCount} cartas en proxy`,
      footerRight: 'Para completar original',
    },
  ];

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-500 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight font-display">
                Reporte de Costos & <span className="text-red-600 dark:text-red-500">Valoración</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-black uppercase tracking-wider">
                Inteligencia de Mercado
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Análisis del valor de mercado, rarezas estándar, oportunidades de venta y costo de arquetipos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                currency === 'USD' ? 'bg-red-600 text-white shadow-xs font-black' : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              USD ($)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('EUR')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                currency === 'EUR' ? 'bg-red-600 text-white shadow-xs font-black' : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              EUR (€)
            </button>
          </div>

          <button
            type="button"
            onClick={fetchMarketPrices}
            disabled={loadingPrices}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-2xl cursor-pointer"
            title="Actualizar cotizaciones"
          >
            <RefreshCw className={`w-4 h-4 ${loadingPrices ? 'animate-spin text-red-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-bold cursor-pointer"
          >
            {copiedSummary ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
            <span>{copiedSummary ? '¡Copiado!' : 'Copiar Resumen'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <ValuationKpiCard key={kpi.title} kpi={kpi} currencySymbol={currencySymbol} />
        ))}
      </div>
    </>
  );
};
