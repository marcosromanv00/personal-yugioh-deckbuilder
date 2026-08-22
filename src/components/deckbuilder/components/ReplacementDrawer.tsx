import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Zap } from 'lucide-react';
import { DeckCard, Replacement, HoverCardBase, Card, BreakdownCardItem, HistoryItem } from '../types';
import { calculateCardConsistencyDelta } from '@/lib/engines/exordioAnalytics';

interface ReplacementDrawerProps {
  activeReplacementCard: DeckCard | undefined;
  activeReplacementCardId: number | null;
  setActiveReplacementCardId: (id: number | null) => void;
  activeReplacementsList: Replacement[];
  currentDeckCards?: DeckCard[];
  inferredArchetype?: string;
  addRecommendedCard: (cardId: number, cardName: string, targetSection?: 'main' | 'extra' | 'side' | 'extras', cardObj?: Partial<Card & BreakdownCardItem & HistoryItem>) => void | Promise<void>;
  removeCardFromDeck: (cardId: number, section: 'main' | 'extra' | 'side' | 'extras') => void;
  handleCardMouseEnter: (card: HoverCardBase) => void;
  handleCardMouseLeave: () => void;
}

/**
 * ReplacementDrawer Component
 * Displays card substitution recommendations when a user clicks to replace a card.
 * Recommendations include technical similarity score and simulated consistency delta.
 */
export const ReplacementDrawer: React.FC<ReplacementDrawerProps> = ({
  activeReplacementCard,
  setActiveReplacementCardId,
  activeReplacementsList,
  currentDeckCards = [],
  inferredArchetype = '',
  addRecommendedCard,
  removeCardFromDeck,
  handleCardMouseEnter,
  handleCardMouseLeave,
}) => {
  return (
    <AnimatePresence>
      {activeReplacementCard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex justify-end">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setActiveReplacementCardId(null)} />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 h-full flex flex-col z-10 shadow-2xl p-6 text-zinc-900 dark:text-zinc-100"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-4">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 font-display">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Sustituir Carta</span>
                </h3>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  Reemplazos con evaluación de impacto para {activeReplacementCard.name}
                </p>
              </div>
              <button 
                onClick={() => setActiveReplacementCardId(null)} 
                className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Replacements List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {activeReplacementsList.length === 0 ? (
                <p className="text-xs text-zinc-400 font-mono text-center py-12">No hay reemplazos cargados para esta carta.</p>
              ) : (
                activeReplacementsList.map(rep => {
                  const delta = calculateCardConsistencyDelta(
                    currentDeckCards,
                    { name: rep.name, type: rep.type, desc: rep.reason },
                    inferredArchetype
                  );

                  return (
                    <div 
                      key={rep.id} 
                      onMouseEnter={() => handleCardMouseEnter(rep as HoverCardBase)}
                      onMouseLeave={handleCardMouseLeave}
                      className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 hover:border-red-500/40 rounded-2xl flex gap-3 shadow-xs transition-all group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={rep.image_url} alt={rep.name} className="w-12 h-18 object-contain rounded-lg shrink-0 bg-zinc-900" />
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <span className="text-[9px] font-mono text-cyan-600 dark:text-cyan-400 font-black px-1.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                              {Math.round(rep.similarityScore * 100)}% Match
                            </span>
                            <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5 text-emerald-500" />
                              {delta.summaryLabel}
                            </span>
                          </div>

                          <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-red-500 transition-colors">
                            {rep.name}
                          </h5>
                          <p className="text-[11px] text-zinc-500 mt-1 leading-tight line-clamp-2">{rep.reason}</p>
                        </div>

                        <button
                          onClick={() => {
                            addRecommendedCard(rep.id, rep.name);
                            removeCardFromDeck(activeReplacementCard.id, activeReplacementCard.section);
                            setActiveReplacementCardId(null);
                          }}
                          className="mt-2 py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs font-display flex items-center justify-center gap-1"
                        >
                          <span>Sustituir</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
