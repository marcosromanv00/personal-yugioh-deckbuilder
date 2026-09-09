import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { CardMarketPrices, CurrencyType, ValuationSummary } from '@/lib/valuationEngine';
import { UserCard } from '@/types/collection';

interface ValuationProxiesSubTabProps {
  valuation: ValuationSummary;
  userCards: UserCard[];
  marketPricesMap: Map<number, CardMarketPrices>;
  currency: CurrencyType;
  currencySymbol: string;
}

export const ValuationProxiesSubTab: React.FC<ValuationProxiesSubTabProps> = ({
  valuation,
  userCards,
  marketPricesMap,
  currency,
  currencySymbol,
}) => {
  const proxyList = React.useMemo(() => {
    return valuation.topValuedCards
      .concat(
        userCards
          .filter((c) => c.is_proxy)
          .map((c) => {
            const m = marketPricesMap.get(c.card_id);
            const p = m ? (currency === 'USD' ? m.tcgplayer_price : m.cardmarket_price) : 0.25;
            return {
              userCardId: c.id,
              cardId: c.card_id,
              name: c.card_details?.name || `Carta #${c.card_id}`,
              type: c.card_details?.type || 'Monster',
              archetype: c.card_details?.archetype || null,
              imageUrl:
                c.card_details?.image_url ||
                c.card_details?.image_url_small ||
                'https://images.ygoprodeck.com/images/cards/placeholder.jpg',
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
          })
      )
      .filter((c, idx, arr) => c.isProxy && arr.findIndex((x) => x.userCardId === c.userCardId) === idx);
  }, [valuation.topValuedCards, userCards, marketPricesMap, currency]);

  return (
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
        {proxyList.map((proxy) => (
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
  );
};
