import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Box } from 'lucide-react';
import { DeckValuation, ContainerValuation } from '@/lib/valuationEngine';
import { StorageLocation, Deck } from '@/types/collection';

interface ValuationContainersDecksSubTabProps {
  deckValuations: DeckValuation[];
  containerValuations: ContainerValuation[];
  decks: Deck[];
  locations: StorageLocation[];
  currencySymbol: string;
  onOpenDeck?: (deck: Deck) => void;
  onOpenContainer?: (containerId: string) => void;
}

export const ValuationContainersDecksSubTab: React.FC<ValuationContainersDecksSubTabProps> = ({
  deckValuations,
  containerValuations,
  decks,
  locations,
  currencySymbol,
  onOpenDeck,
  onOpenContainer,
}) => {
  return (
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
          {deckValuations.map((d) => (
            <div
              key={d.deckId}
              onClick={() => {
                if (onOpenDeck) {
                  const targetDeck = decks.find((deck) => deck.id === d.deckId);
                  if (targetDeck) onOpenDeck(targetDeck);
                }
              }}
              className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between gap-3 ${
                onOpenDeck ? 'cursor-pointer hover:border-purple-500/40 transition-all' : ''
              }`}
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
          {containerValuations.map((loc) => (
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
  );
};
