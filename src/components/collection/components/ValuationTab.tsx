'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  PieChart,
  Sparkles,
  ShoppingBag,
  Layers,
  Box,
  ShieldAlert,
} from 'lucide-react';
import { ValuationTabProps } from './valuation/valuation.types';
import { useValuationPrices } from './valuation/useValuationPrices';
import { ValuationHeaderKpis } from './valuation/ValuationHeaderKpis';
import { ValuationSubTabsNav } from './valuation/ValuationSubTabsNav';
import { ValuationOverviewSubTab } from './valuation/ValuationOverviewSubTab';
import { ValuationTopCardsSubTab } from './valuation/ValuationTopCardsSubTab';
import { ValuationSellOpportunitiesSubTab } from './valuation/ValuationSellOpportunitiesSubTab';
import { ValuationArchetypesSubTab } from './valuation/ValuationArchetypesSubTab';
import { ValuationContainersDecksSubTab } from './valuation/ValuationContainersDecksSubTab';
import { ValuationProxiesSubTab } from './valuation/ValuationProxiesSubTab';

export const ValuationTab: React.FC<ValuationTabProps> = ({
  userCards,
  locations,
  decks,
  onOpenContainer,
  onOpenDeck,
  onUpdateCardStatus,
}) => {
  const {
    currency,
    setCurrency,
    activeSubTab,
    setActiveSubTab,
    marketPricesMap,
    loadingPrices,
    fetchMarketPrices,
    valuation,
    currencySymbol,
    copiedSummary,
    handleCopySummary,
    handleDownloadCSV,
  } = useValuationPrices({ userCards, locations, decks });

  const subTabs = [
    { id: 'overview' as const, label: 'Visión General', icon: PieChart },
    {
      id: 'top_cards' as const,
      label: 'Cartas Más Valiosas',
      icon: Sparkles,
      count: valuation.topValuedCards.length,
    },
    {
      id: 'sell_opportunities' as const,
      label: 'Ventas & Liquidez',
      icon: ShoppingBag,
      count: valuation.sellOpportunities.length,
    },
    {
      id: 'archetypes' as const,
      label: 'Arquetipos',
      icon: Layers,
      count: valuation.archetypeValuations.length,
    },
    { id: 'containers_decks' as const, label: 'Contenedores & Decks', icon: Box },
    {
      id: 'proxies' as const,
      label: 'Auditoría de Proxies',
      icon: ShieldAlert,
      count: valuation.totalProxiesCount,
    },
  ];

  return (
    <div className="space-y-6 select-none font-sans pb-12">
      <ValuationHeaderKpis
        currency={currency}
        setCurrency={setCurrency}
        currencySymbol={currencySymbol}
        loadingPrices={loadingPrices}
        fetchMarketPrices={fetchMarketPrices}
        copiedSummary={copiedSummary}
        handleCopySummary={handleCopySummary}
        handleDownloadCSV={handleDownloadCSV}
        valuation={valuation}
        decks={decks}
      />

      <ValuationSubTabsNav
        tabs={subTabs}
        activeTab={activeSubTab}
        onSelectTab={setActiveSubTab}
      />

      <AnimatePresence mode="wait">
        {activeSubTab === 'overview' && (
          <ValuationOverviewSubTab
            valuation={valuation}
            currencySymbol={currencySymbol}
          />
        )}

        {activeSubTab === 'top_cards' && (
          <ValuationTopCardsSubTab
            valuation={valuation}
            locations={locations}
            currencySymbol={currencySymbol}
          />
        )}

        {activeSubTab === 'sell_opportunities' && (
          <ValuationSellOpportunitiesSubTab
            valuation={valuation}
            currencySymbol={currencySymbol}
            onUpdateCardStatus={onUpdateCardStatus}
          />
        )}

        {activeSubTab === 'archetypes' && (
          <ValuationArchetypesSubTab
            archetypeValuations={valuation.archetypeValuations}
            currencySymbol={currencySymbol}
          />
        )}

        {activeSubTab === 'containers_decks' && (
          <ValuationContainersDecksSubTab
            deckValuations={valuation.deckValuations}
            containerValuations={valuation.containerValuations}
            decks={decks}
            locations={locations}
            currencySymbol={currencySymbol}
            onOpenDeck={onOpenDeck}
            onOpenContainer={onOpenContainer}
          />
        )}

        {activeSubTab === 'proxies' && (
          <ValuationProxiesSubTab
            valuation={valuation}
            userCards={userCards}
            marketPricesMap={marketPricesMap}
            currency={currency}
            currencySymbol={currencySymbol}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
