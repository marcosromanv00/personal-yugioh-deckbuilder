import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { ValuationSummary } from '@/lib/valuationEngine';
import { StorageLocation } from '@/types/collection';

interface ValuationTopCardsSubTabProps {
  valuation: ValuationSummary;
  locations: StorageLocation[];
  currencySymbol: string;
}

export const ValuationTopCardsSubTab: React.FC<ValuationTopCardsSubTabProps> = ({
  valuation, locations, currencySymbol,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const filteredTopCards = useMemo(() => {
    return valuation.topValuedCards.filter((card) => {
      const matchName = card.name.toLowerCase().includes(searchQuery.toLowerCase()) || (card.archetype?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchRarity = rarityFilter === 'all' || card.rarity.toLowerCase().includes(rarityFilter.toLowerCase());
      const matchLoc = locationFilter === 'all' || card.locationId === locationFilter;
      return matchName && matchRarity && matchLoc;
    });
  }, [valuation.topValuedCards, searchQuery, rarityFilter, locationFilter]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar carta o arquetipo..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-900 dark:white placeholder:text-zinc-500 focus:outline-none focus:border-red-500"
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
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTopCards.map((card, index) => (
          <div key={card.userCardId} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-xs flex items-center gap-3.5 hover:border-red-500/40 transition-all">
            <div className="relative w-16 h-22 shrink-0 rounded-xl overflow-hidden bg-black border border-zinc-800">
              <Image src={card.imageUrl} alt={card.name} fill sizes="64px" className="object-cover" />
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
                  <span className="text-[9px] font-mono text-zinc-400">{card.condition}</span>
                </div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate mt-1" title={card.name}>{card.name}</h4>
                {card.archetype && <p className="text-[10px] text-zinc-500 truncate">{card.archetype}</p>}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                <span className="text-[10px] text-zinc-400 font-mono truncate max-w-24">{card.locationName}</span>
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
  );
};
