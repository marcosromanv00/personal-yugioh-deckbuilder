import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { DeckCard, Replacement, HoverCardBase } from '../types';

interface ReplacementDrawerProps {
  activeReplacementCard: DeckCard | undefined;
  activeReplacementCardId: number | null;
  setActiveReplacementCardId: (id: number | null) => void;
  activeReplacementsList: Replacement[];
  addRecommendedCard: (cardId: number, cardName: string, targetSection?: any, cardObj?: any) => void;
  removeCardFromDeck: (cardId: number, section: 'main' | 'extra' | 'side' | 'extras') => void;
  handleCardMouseEnter: (card: HoverCardBase) => void;
  handleCardMouseLeave: () => void;
}

/**
 * ReplacementDrawer Component
 * Displays card substitution recommendations when a user clicks to replace a card.
 * Recommendations are sorted by technical similarity score.
 */
export const ReplacementDrawer: React.FC<ReplacementDrawerProps> = ({
  activeReplacementCard,
  activeReplacementCardId,
  setActiveReplacementCardId,
  activeReplacementsList,
  addRecommendedCard,
  removeCardFromDeck,
  handleCardMouseEnter,
  handleCardMouseLeave,
}) => {
  return (
    <AnimatePresence>
      {activeReplacementCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setActiveReplacementCardId(null)} />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col z-10 shadow-2xl p-6"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Sustituir Carta
                </h3>
                <p className="text-xs text-slate-400">Reemplazos recomendados para {activeReplacementCard.name}</p>
              </div>
              <button 
                onClick={() => setActiveReplacementCardId(null)} 
                className="w-8 h-8 rounded-lg hover:bg-slate-850 text-slate-300 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Replacements List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {activeReplacementsList.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-10">No hay reemplazos cargados en caché para esta carta.</p>
              ) : (
                activeReplacementsList.map(rep => (
                  <div 
                    key={rep.id} 
                    onMouseEnter={() => handleCardMouseEnter(rep as HoverCardBase)}
                    onMouseLeave={handleCardMouseLeave}
                    className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex gap-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={rep.image_url} alt={rep.name} className="w-12 h-18 object-contain rounded" />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h5 className="font-bold text-xs text-white truncate">{rep.name}</h5>
                        <span className="text-[10px] font-mono text-[hsl(180,80%,45%)] font-bold">{Math.round(rep.similarityScore * 100)}% Similitud</span>
                        <p className="text-[11px] text-slate-400 mt-1 leading-tight">{rep.reason}</p>
                      </div>
                      <button
                        onClick={() => {
                          addRecommendedCard(rep.id, rep.name);
                          removeCardFromDeck(activeReplacementCard.id, activeReplacementCard.section);
                          setActiveReplacementCardId(null);
                        }}
                        className="mt-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-bold cursor-pointer"
                      >
                        Sustituir
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
