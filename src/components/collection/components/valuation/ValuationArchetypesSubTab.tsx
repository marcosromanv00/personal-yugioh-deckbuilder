import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArchetypeValuation } from '@/lib/valuationEngine';

interface ValuationArchetypesSubTabProps {
  archetypeValuations: ArchetypeValuation[];
  currencySymbol: string;
}

export const ValuationArchetypesSubTab: React.FC<ValuationArchetypesSubTabProps> = ({
  archetypeValuations,
  currencySymbol,
}) => {
  return (
    <motion.div
      key="archetypes"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {archetypeValuations.map((arch) => (
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
                  <span className="text-[9px] text-zinc-400 font-mono uppercase block">
                    Carta más valiosa
                  </span>
                  <strong className="text-zinc-900 dark:text-white truncate block font-bold text-xs">
                    {arch.topCard.name}
                  </strong>
                </div>
                <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {currencySymbol}{arch.topCard.value.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span>M: {arch.monsterCount}</span>
              <span>S: {arch.spellCount}</span>
              <span>T: {arch.trapCount}</span>
              <span className="text-purple-600 dark:text-purple-400 font-bold">
                Extra: {arch.extraCount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
