import { useState, useEffect, useMemo, useCallback } from 'react';
import { UserCard, StorageLocation, Deck } from '@/types/collection';
import {
  CurrencyType,
  CardMarketPrices,
  generateCollectionValuation,
} from '@/lib/valuationEngine';
import { ValuationSubTab } from './valuation.types';
import { generateValuationSummaryText, downloadValuationCSV } from './valuation.utils';

interface UseValuationPricesParams {
  userCards: UserCard[];
  locations: StorageLocation[];
  decks: Deck[];
}

export function useValuationPrices({ userCards, locations, decks }: UseValuationPricesParams) {
  const [currency, setCurrency] = useState<CurrencyType>('USD');
  const [activeSubTab, setActiveSubTab] = useState<ValuationSubTab>('overview');
  const [marketPricesMap, setMarketPricesMap] = useState<Map<number, CardMarketPrices>>(new Map());
  const [loadingPrices, setLoadingPrices] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

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
    queueMicrotask(() => {
      fetchMarketPrices();
    });
  }, [fetchMarketPrices]);

  const valuation = useMemo(() => {
    return generateCollectionValuation(userCards, locations, decks, marketPricesMap, currency);
  }, [userCards, locations, decks, marketPricesMap, currency]);

  const currencySymbol = currency === 'USD' ? '$' : '€';

  const handleDownloadCSV = () => {
    downloadValuationCSV(valuation);
  };

  const handleCopySummary = () => {
    const summaryText = generateValuationSummaryText(valuation, currency, locations.length, decks.length);
    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return {
    currency, setCurrency,
    activeSubTab, setActiveSubTab,
    marketPricesMap,
    loadingPrices, fetchMarketPrices,
    valuation, currencySymbol,
    copiedSummary, handleCopySummary, handleDownloadCSV,
  };
}
