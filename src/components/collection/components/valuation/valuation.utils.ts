import { ValuationSummary, CurrencyType, exportValuationReportToCSV } from '@/lib/valuationEngine';

export function generateValuationSummaryText(
  valuation: ValuationSummary,
  currency: CurrencyType,
  locationsCount: number,
  decksCount: number
): string {
  const currencySymbol = currency === 'USD' ? '$' : '€';
  return `📊 REPORTE DE COLECCIÓN YUGIOH
━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Valor Total del Portafolio: ${currencySymbol}${valuation.totalPortfolioValue.toLocaleString()} ${currency}
🃏 Total Cartas Reales: ${valuation.totalOriginalCardsCount}
🏷️ En Venta / Trade: ${currencySymbol}${valuation.totalTradeSaleValue.toLocaleString()} (${valuation.sellOpportunities.length} cartas)
⚔️ En Decks Armados: ${currencySymbol}${valuation.totalDeckCardsValue.toLocaleString()} (${decksCount} decks)
📦 En Contenedores: ${currencySymbol}${valuation.totalContainerCardsValue.toLocaleString()} (${locationsCount} contenedores)
🛡️ Costo Reemplazo Proxies: ${currencySymbol}${valuation.totalProxyReplacementCost.toLocaleString()} (${valuation.totalProxiesCount} proxies)
💎 Top Carta: ${valuation.topValuedCards[0]?.name || 'N/A'} (${currencySymbol}${valuation.topValuedCards[0]?.unitMarketPrice.toFixed(2) || '0.00'})
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generado con Personal Yu-Gi-Oh! Deckbuilder Hub`;
}

export function downloadValuationCSV(valuation: ValuationSummary) {
  const csvData = exportValuationReportToCSV(valuation, valuation.topValuedCards);
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `reporte_valoracion_yugioh_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
