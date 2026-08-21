'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Sparkles,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  Layers,
  Box,
  FileText,
  ShieldAlert,
  Coins,
  ChevronRight,
  ArrowUpRight,
  RefreshCw,
  Tag,
  ShoppingBag,
  ExternalLink,
  Flame,
  PieChart,
  SlidersHorizontal,
} from 'lucide-react';
import { UserCard, StorageLocation, Deck } from '@/types/collection';
import {
  CurrencyType,
  CardMarketPrices,
  generateCollectionValuation,
  exportValuationReportToCSV,
  CardValuationItem,
  SellOpportunity,
} from '@/lib/valuationEngine';

interface ValuationTabProps {
  userCards: UserCard[];
  locations: StorageLocation[];
  decks: Deck[];
  onOpenContainer?: (containerId: string) => void;
  onOpenDeck?: (deck: Deck) => void;
  onUpdateCardStatus?: (cardId: string, status: string) => void;
}

type ValuationSubTab = 'overview' | 'top_cards' | 'sell_opportunities' | 'archetypes' | 'containers_decks' | 'proxies';

export const ValuationTab: React.FC<ValuationTabProps> = ({
  userCards,
  locations,
  decks,
  onOpenContainer,
  onOpenDeck,
}) => {
  const [currency, setCurrency] = useState<CurrencyType>('USD');
  const [activeSubTab, setActiveSubTab] = useState<ValuationSubTab>('overview');
  const [marketPricesMap, setMarketPricesMap] = useState<Map<number, CardMarketPrices>>(new Map());
  const [loadingPrices, setLoadingPrices] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Filtros de búsqueda en Top Cartas y Venta
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Estado del Simulador de Venta por Lote
  const [selectedSellCardIds, setSelectedSellCardIds] = useState<Set<string>>(new Set());
  const [lotDiscountPercent, setLotDiscountPercent] = useState<number>(85); // 85% de TCGPlayer por defecto

  // 1. Cargar precios de mercado desde la API de valoración
  const fetchMarketPrices = useCallback(async () => {
    if (userCards.length === 0) return;
    setLoadingPrices(true);
    try {
      const uniqueCardIds = Array.from(new Set(userCards.map((c) => c.card_id)));
      const res = await fetch('/api/collection/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_ids: uniqueCardIds }),
      });

      if (res.ok) {
        const json = await res.json();
        const priceList: CardMarketPrices[] = json.data || [];
        const newMap = new Map<number, CardMarketPrices>();
        priceList.forEach((p) => newMap.set(p.card_id, p));
        setMarketPricesMap(newMap);
      }
    } catch (err) {
      console.error('Error al consultar precios de mercado:', err);
    } finally {
      setLoadingPrices(false);
    }
  }, [userCards]);

  useEffect(() => {
    fetchMarketPrices();
  }, [fetchMarketPrices]);

  // 2. Generar el resumen analítico completo en tiempo real
  const valuation = useMemo(() => {
    return generateCollectionValuation(userCards, locations, decks, marketPricesMap, currency);
  }, [userCards, locations, decks, marketPricesMap, currency]);

  const currencySymbol = currency === 'USD' ? '$' : '€';

  // Exportar a CSV
  const handleDownloadCSV = () => {
    const csvData = exportValuationReportToCSV(valuation, valuation.topValuedCards);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_valoracion_yugioh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copiar resumen ejecutivo al portapapeles
  const handleCopySummary = () => {
    const summaryText = `📊 REPORTE DE COLECCIÓN YUGIOH
━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Valor Total del Portafolio: ${currencySymbol}${valuation.totalPortfolioValue.toLocaleString()} ${currency}
🃏 Total Cartas Reales: ${valuation.totalOriginalCardsCount}
🏷️ En Venta / Trade: ${currencySymbol}${valuation.totalTradeSaleValue.toLocaleString()} (${valuation.sellOpportunities.length} cartas)
⚔️ En Decks Armados: ${currencySymbol}${valuation.totalDeckCardsValue.toLocaleString()} (${decks.length} decks)
📦 En Contenedores: ${currencySymbol}${valuation.totalContainerCardsValue.toLocaleString()} (${locations.length} contenedores)
🛡️ Costo Reemplazo Proxies: ${currencySymbol}${valuation.totalProxyReplacementCost.toLocaleString()} (${valuation.totalProxiesCount} proxies)
💎 Top Carta: ${valuation.topValuedCards[0]?.name || 'N/A'} (${currencySymbol}${valuation.topValuedCards[0]?.unitMarketPrice.toFixed(2) || '0.00'})
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generado con Personal Yu-Gi-Oh! Deckbuilder Hub`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Toggle de selección en simulador de lote
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

  // Cálculo del valor del lote de venta seleccionado
  const selectedSellItems = useMemo(() => {
    return valuation.sellOpportunities.filter((op) => selectedSellCardIds.has(op.card.userCardId));
  }, [valuation.sellOpportunities, selectedSellCardIds]);

  const lotTotalMarketValue = selectedSellItems.reduce((acc, curr) => acc + curr.card.totalMarketValue, 0);
  const lotDiscountedCashout = lotTotalMarketValue * (lotDiscountPercent / 100);

  // Filtrado de Top Cartas
  const filteredTopCards = useMemo(() => {
    return valuation.topValuedCards.filter((card) => {
      const matchName = card.name.toLowerCase().includes(searchQuery.toLowerCase()) || (card.archetype?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchRarity = rarityFilter === 'all' || card.rarity.toLowerCase().includes(rarityFilter.toLowerCase());
      const matchLoc = locationFilter === 'all' || card.locationId === locationFilter;
      return matchName && matchRarity && matchLoc;
    });
  }, [valuation.topValuedCards, searchQuery, rarityFilter, locationFilter]);

  const subTabs = [
    { id: 'overview' as const, label: 'Visión General', icon: PieChart },
    { id: 'top_cards' as const, label: 'Cartas Más Valiosas', icon: Sparkles, count: valuation.topValuedCards.length },
    { id: 'sell_opportunities' as const, label: 'Ventas & Liquidez', icon: ShoppingBag, count: valuation.sellOpportunities.length },
    { id: 'archetypes' as const, label: 'Arquetipos', icon: Layers, count: valuation.archetypeValuations.length },
    { id: 'containers_decks' as const, label: 'Contenedores & Decks', icon: Box },
    { id: 'proxies' as const, label: 'Auditoría de Proxies', icon: ShieldAlert, count: valuation.totalProxiesCount },
  ];

  return (
    <div className="space-y-6 select-none font-sans pb-12">
      {/* HEADER SUPERIOR CON CONTROLES Y ACCIONES */}
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

        {/* ACCIONES Y SELECTOR DE MONEDA */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Selector USD / EUR */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer touch-manipulation ${
                currency === 'USD'
                  ? 'bg-red-600 text-white shadow-xs font-black'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Precios de referencia TCGPlayer en Dólares Estadounidenses"
            >
              USD ($)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('EUR')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer touch-manipulation ${
                currency === 'EUR'
                  ? 'bg-red-600 text-white shadow-xs font-black'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Precios de referencia Cardmarket en Euros"
            >
              EUR (€)
            </button>
          </div>

          {/* Botón Refrescar Precios */}
          <button
            type="button"
            onClick={fetchMarketPrices}
            disabled={loadingPrices}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-2xl transition-all cursor-pointer touch-manipulation disabled:opacity-50"
            title="Actualizar cotizaciones en vivo"
          >
            <RefreshCw className={`w-4 h-4 ${loadingPrices ? 'animate-spin text-red-500' : ''}`} />
          </button>

          {/* Copiar Resumen */}
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer touch-manipulation min-h-11"
            title="Copiar resumen ejecutivo al portapapeles"
          >
            {copiedSummary ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
            <span>{copiedSummary ? '¡Copiado!' : 'Copiar Resumen'}</span>
          </button>

          {/* Exportar a CSV */}
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-zinc-900 dark:bg-zinc-100 hover:bg-black dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer touch-manipulation min-h-11"
            title="Descargar inventario valorado en formato CSV"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPIS PRINCIPALES (TARJETAS RESUMEN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Portafolio */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
              Valor Total Portafolio
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-zinc-900 dark:text-white font-mono tracking-tight">
              {currencySymbol}{valuation.totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
              <span>{valuation.totalOriginalCardsCount} cartas físicas</span>
              <span>Promedio: {currencySymbol}{valuation.averageCardValue.toFixed(2)}/u</span>
            </div>
          </div>
        </div>

        {/* En Venta / Trade */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
              Liquidez / Para Venta
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
              {currencySymbol}{valuation.totalTradeSaleValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
              <span>{valuation.sellOpportunities.length} oportunidades</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">Listas para Trade</span>
            </div>
          </div>
        </div>

        {/* Decks Armados */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 font-mono">
              En Decks Armados
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-purple-600 dark:text-purple-400 font-mono tracking-tight">
              {currencySymbol}{valuation.totalDeckCardsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
              <span>{decks.length} mazos registrados</span>
              <span>En combate</span>
            </div>
          </div>
        </div>

        {/* Costo Reemplazo Proxies */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-mono">
              Costo de Proxies
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-cyan-600 dark:text-cyan-400 font-mono tracking-tight">
              {currencySymbol}{valuation.totalProxyReplacementCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
              <span>{valuation.totalProxiesCount} cartas en proxy</span>
              <span>Para completar original</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-BARRA DE NAVEGACIÓN ENTRE SECCIONES ANALÍTICAS */}
      <div className="overflow-x-auto scrollbar-none flex items-center gap-1.5 p-1 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        {subTabs.map((st) => {
          const Icon = st.icon;
          const isActive = activeSubTab === st.id;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => setActiveSubTab(st.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all cursor-pointer touch-manipulation min-h-11 ${
                isActive
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{st.label}</span>
              {st.count !== undefined && st.count > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-px rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {st.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* CONTENIDO SEGÚN LA SUB-PESTAÑA SELECCIONADA */}
      <AnimatePresence mode="wait">
        {/* 1. VISIÓN GENERAL */}
        {activeSubTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribución por Rareza */}
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
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate pr-2">
                          {item.rarity}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-zinc-500 text-[11px]">{item.count} cartas</span>
                          <span className="font-black text-zinc-900 dark:text-white">
                            {currencySymbol}{item.totalValue.toFixed(2)}
                          </span>
                          <span className="text-zinc-400 text-[10px] w-10 text-right">({item.percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-red-600 to-amber-500 rounded-full"
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Distribución por Tipo de Carta */}
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
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {item.typeGroup}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 text-[11px]">{item.count} cartas</span>
                          <span className="font-black text-zinc-900 dark:text-white">
                            {currencySymbol}{item.totalValue.toFixed(2)}
                          </span>
                          <span className="text-zinc-400 text-[10px] w-10 text-right">({item.percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.typeGroup === 'Extra Deck'
                              ? 'bg-purple-500'
                              : item.typeGroup === 'Mágicas'
                              ? 'bg-emerald-500'
                              : item.typeGroup === 'Trampas'
                              ? 'bg-pink-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Nota de resolución inteligente de rarezas */}
                <div className="mt-6 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-zinc-900 dark:text-zinc-200">Estimación Inteligente:</strong> Para cartas sin rareza registrada, el sistema utiliza el valor de mercado estándar accesible (Común, Rare, Super y Ultra). Las rarezas caras (Secret, Starlight, QCR) solo se cotizan si las agregas manualmente.
                  </p>
                </div>
              </div>
            </div>

            {/* Banner de Top 5 Joyas de la Corona */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-500" />
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider font-display">
                    Joyas de la Corona (Top 5 Más Valiosas)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('top_cards')}
                  className="text-xs font-bold text-red-600 hover:text-red-500 flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver todas las 30</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {valuation.topValuedCards.slice(0, 5).map((card, idx) => (
                  <div
                    key={card.userCardId}
                    className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between gap-2.5 relative group hover:border-red-500/40 transition-colors"
                  >
                    <span className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-black/80 text-white font-mono font-black text-[10px] flex items-center justify-center border border-zinc-700">
                      #{idx + 1}
                    </span>

                    <div className="relative w-full aspect-5/7 rounded-xl overflow-hidden bg-black border border-zinc-800">
                      <Image
                        src={card.imageUrl}
                        alt={card.name}
                        fill
                        sizes="(max-width: 768px) 150px, 200px"
                        className="object-contain group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate" title={card.name}>
                        {card.name}
                      </h4>
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
        )}

        {/* 2. TOP CARTAS MÁS VALIOSAS */}
        {activeSubTab === 'top_cards' && (
          <motion.div
            key="top_cards"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Filtros de búsqueda */}
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar carta o arquetipo..."
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={rarityFilter}
                  onChange={(e) => setRarityFilter(e.target.value)}
                  aria-label="Filtrar por rareza"
                  className="px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-mono text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">Todas las Rarezas</option>
                  <option value="Secret">Secret Rare</option>
                  <option value="Ultra">Ultra Rare</option>
                  <option value="Super">Super Rare</option>
                  <option value="Rare">Rare</option>
                  <option value="Common">Common</option>
                </select>

                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  aria-label="Filtrar por ubicación"
                  className="px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-mono text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer max-w-44 truncate"
                >
                  <option value="all">Todas las Ubicaciones</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Listado de Cartas Top */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTopCards.map((card, index) => (
                <div
                  key={card.userCardId}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-xs flex items-center gap-3.5 hover:border-red-500/40 transition-all"
                >
                  <div className="relative w-16 h-22 shrink-0 rounded-xl overflow-hidden bg-black border border-zinc-800">
                    <Image
                      src={card.imageUrl}
                      alt={card.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                    <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-black/80 text-white font-mono font-black text-[9px]">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {card.rarity}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400">
                          {card.condition}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate mt-1" title={card.name}>
                        {card.name}
                      </h4>
                      {card.archetype && (
                        <p className="text-[10px] text-zinc-500 truncate">
                          {card.archetype}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                      <span className="text-[10px] text-zinc-400 font-mono truncate max-w-24">
                        {card.locationName}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                          {currencySymbol}{card.unitMarketPrice.toFixed(2)}
                        </span>
                        {card.quantity > 1 && (
                          <span className="text-[9px] text-zinc-400 font-mono">
                            Total ({card.quantity}x): {currencySymbol}{card.totalMarketValue.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 3. VENTAS & LIQUIDEZ (HUB DE VENTA) */}
        {activeSubTab === 'sell_opportunities' && (
          <motion.div
            key="sell_opportunities"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Simulador de Venta por Lote */}
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

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllSellCards(valuation.sellOpportunities)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold text-zinc-200 transition-all cursor-pointer"
                  >
                    {selectedSellCardIds.size === valuation.sellOpportunities.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                  </button>
                </div>
              </div>

              {/* Controles de Descuento y Totales */}
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
                          lotDiscountPercent === pct
                            ? 'bg-amber-500 text-zinc-950 font-black'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
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

            {/* Listado de Oportunidades de Venta */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-display">
                  Cartas Sugeridas para Venta y Excedentes ({valuation.sellOpportunities.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {valuation.sellOpportunities.map((op) => {
                  const isSelected = selectedSellCardIds.has(op.card.userCardId);
                  return (
                    <div
                      key={op.card.userCardId}
                      onClick={() => toggleSelectSellCard(op.card.userCardId)}
                      className={`p-3.5 rounded-3xl border transition-all cursor-pointer select-none flex items-center gap-3.5 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 dark:bg-amber-950/20'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                      }`}
                    >
                      <div className="relative w-14 h-20 shrink-0 rounded-xl overflow-hidden bg-black border border-zinc-800">
                        <Image
                          src={op.card.imageUrl}
                          alt={op.card.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                        <div
                          className={`absolute top-1 right-1 w-5 h-5 rounded-md flex items-center justify-center text-white ${
                            isSelected ? 'bg-amber-500' : 'bg-black/60 border border-zinc-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-3" />}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            op.category === 'trade_sale'
                              ? 'bg-red-600/10 text-red-600 border border-red-500/20'
                              : op.category === 'hidden_gem_bulk'
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              : 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20'
                          }`}>
                            {op.categoryLabel}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">{op.card.rarity}</span>
                        </div>

                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate mt-1" title={op.card.name}>
                          {op.card.name}
                        </h4>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                          {op.reason} • {op.card.locationName}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {op.card.quantity}x copias
                          </span>
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
        )}

        {/* 4. INVERSIÓN POR ARQUETIPOS */}
        {activeSubTab === 'archetypes' && (
          <motion.div
            key="archetypes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {valuation.archetypeValuations.map((arch) => (
                <div
                  key={arch.archetype}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                        Arquetipo
                      </span>
                      <h4 className="text-base font-black text-zinc-900 dark:text-white font-display">
                        {arch.archetype}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {arch.totalCards} cartas ({arch.uniqueCards} únicas)
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black font-mono text-red-600 dark:text-red-500 block">
                        {currencySymbol}{arch.totalValue.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        Prom: {currencySymbol}{arch.avgCardValue.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Carta más valiosa del arquetipo */}
                  {arch.topCard && (
                    <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5 text-xs">
                      <div className="relative w-8 h-11 shrink-0 rounded-md overflow-hidden bg-black">
                        <Image
                          src={arch.topCard.imageUrl}
                          alt={arch.topCard.name}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] text-zinc-400 font-mono uppercase block">Carta más valiosa</span>
                        <strong className="text-zinc-900 dark:text-white truncate block font-bold text-xs">
                          {arch.topCard.name}
                        </strong>
                      </div>
                      <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {currencySymbol}{arch.topCard.value.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Desglose de tipos en arquetipo */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span>M: {arch.monsterCount}</span>
                    <span>S: {arch.spellCount}</span>
                    <span>T: {arch.trapCount}</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">Extra: {arch.extraCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 5. CONTENEDORES & DECKS */}
        {activeSubTab === 'containers_decks' && (
          <motion.div
            key="containers_decks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Desglose de Decks Físicos */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-display flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" />
                <span>Valoración de Decks Armados ({decks.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {valuation.deckValuations.map((d) => (
                  <div
                    key={d.deckId}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 uppercase font-bold">
                          {d.format}
                        </span>
                        <h4 className="text-sm font-black text-zinc-900 dark:text-white font-display">
                          {d.name}
                        </h4>
                        <span className="text-xs text-zinc-500 font-mono">{d.totalCards} cartas</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black font-mono text-purple-600 dark:text-purple-400 block">
                          {currencySymbol}{d.totalValue.toFixed(2)}
                        </span>
                        {d.proxyCardsCount > 0 && (
                          <span className="text-[10px] font-mono text-cyan-500 block">
                            +{currencySymbol}{d.proxyReplacementCost.toFixed(2)} en proxies
                          </span>
                        )}
                      </div>
                    </div>

                    {d.topCardName && (
                      <div className="text-[11px] font-mono text-zinc-500 flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <span className="truncate">Top: {d.topCardName}</span>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300 shrink-0 ml-1">
                          {currencySymbol}{d.topCardValue?.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Desglose de Contenedores Físicos */}
            <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-display flex items-center gap-2">
                <Box className="w-4 h-4 text-red-500" />
                <span>Valoración de Contenedores ({locations.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {valuation.containerValuations.map((loc) => (
                  <div
                    key={loc.containerId}
                    onClick={() => onOpenContainer && onOpenContainer(loc.containerId)}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between gap-3 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: loc.colorCode }}
                        >
                          <Box className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-zinc-900 dark:text-white font-display">
                            {loc.name}
                          </h4>
                          <span className="text-xs text-zinc-500 font-mono capitalize">
                            {loc.type} • {loc.cardCount} cartas
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black font-mono text-zinc-900 dark:text-white block">
                          {currencySymbol}{loc.totalValue.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {currencySymbol}{loc.avgCardValue.toFixed(2)}/u
                        </span>
                      </div>
                    </div>

                    {loc.topCardName && (
                      <div className="text-[11px] font-mono text-zinc-500 flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <span className="truncate">Top: {loc.topCardName}</span>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300 shrink-0 ml-1">
                          {currencySymbol}{loc.topCardValue?.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 6. AUDITORÍA DE PROXIES */}
        {activeSubTab === 'proxies' && (
          <motion.div
            key="proxies"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-3xl p-5 flex items-start gap-3.5 text-cyan-800 dark:text-cyan-300">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-cyan-600 dark:text-cyan-400" />
              <div>
                <strong className="font-bold block text-sm">Auditoría y Presupuesto de Proxies</strong>
                <p className="text-xs leading-relaxed mt-0.5">
                  Aquí se listan todas las cartas marcadas como proxies en tus decks o colección, junto con su cotización real estimada de mercado para saber exactamente cuánto dinero se necesita para reemplazarlas por copias originales de torneo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {valuation.topValuedCards
                .concat(userCards.filter((c) => c.is_proxy).map((c) => {
                  const m = marketPricesMap.get(c.card_id);
                  const p = m ? (currency === 'USD' ? m.tcgplayer_price : m.cardmarket_price) : 0.25;
                  return {
                    userCardId: c.id,
                    cardId: c.card_id,
                    name: c.card_details?.name || `Carta #${c.card_id}`,
                    type: c.card_details?.type || 'Monster',
                    archetype: c.card_details?.archetype || null,
                    imageUrl: c.card_details?.image_url || c.card_details?.image_url_small || 'https://images.ygoprodeck.com/images/cards/placeholder.jpg',
                    rarity: c.rarity || 'Common',
                    condition: c.condition,
                    quantity: c.quantity || 1,
                    isProxy: true,
                    statusFlag: c.status_flag,
                    locationId: c.storage_location_id,
                    locationName: 'En Deck/Proxy',
                    deckId: c.deck_id || null,
                    deckName: null,
                    salePriceCustom: null,
                    unitMarketPrice: p,
                    totalMarketValue: 0,
                    proxyAcquisitionCost: p * (c.quantity || 1),
                    isHighRarityManual: false,
                    isSellCandidate: false,
                  };
                }))
                .filter((c, idx, arr) => c.isProxy && arr.findIndex((x) => x.userCardId === c.userCardId) === idx)
                .map((proxy) => (
                  <div
                    key={proxy.userCardId}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-xs flex items-center gap-3.5"
                  >
                    <div className="relative w-14 h-20 shrink-0 rounded-xl overflow-hidden bg-black border border-cyan-500/40">
                      <Image
                        src={proxy.imageUrl}
                        alt={proxy.name}
                        fill
                        sizes="56px"
                        className="object-cover opacity-80"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-cyan-600 text-white font-mono text-[8px] font-black text-center py-0.5">
                        PROXY
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate" title={proxy.name}>
                        {proxy.name}
                      </h4>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-mono">
                        {proxy.quantity}x copias requeridas
                      </p>

                      <div className="mt-2 pt-1 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 font-mono">Costo Original:</span>
                        <span className="text-xs font-black font-mono text-cyan-600 dark:text-cyan-400">
                          {currencySymbol}{proxy.proxyAcquisitionCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
