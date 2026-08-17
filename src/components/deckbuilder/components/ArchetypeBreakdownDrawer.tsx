import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, X } from 'lucide-react';
import { BreakdownCardItem, Card, HistoryItem, HoverCardBase } from '../types';

interface ArchetypeBreakdownDrawerProps {
  activeArchetypeBreakdown: string | null;
  setActiveArchetypeBreakdown: (archetype: string | null) => void;
  isFetchingBreakdown: boolean;
  breakdownCards: BreakdownCardItem[];
  initializeDeckFromArchetype: (archetype: string, cards: BreakdownCardItem[]) => Promise<void>;
  addRecommendedCard: (cardId: number, cardName: string, targetSection?: 'main' | 'extra' | 'side' | 'extras', cardObj?: Partial<Card & BreakdownCardItem & HistoryItem>) => void | Promise<void>;
  handleDragCardStart: (e: React.DragEvent, cardData: { id: number; name: string; type: string; image_url?: string }) => void;
  handleCardMouseEnter: (card: HoverCardBase) => void;
  handleCardMouseLeave: () => void;
}

/**
 * ArchetypeBreakdownDrawer Component
 * Renders a spring-animated drawer containing competitive ratios of cards
 * in the meta arquetipe selected by the user. Shows average copies and usage percentage.
 */
export const ArchetypeBreakdownDrawer: React.FC<ArchetypeBreakdownDrawerProps> = ({
  activeArchetypeBreakdown,
  setActiveArchetypeBreakdown,
  isFetchingBreakdown,
  breakdownCards,
  initializeDeckFromArchetype,
  addRecommendedCard,
  handleDragCardStart,
  handleCardMouseEnter,
  handleCardMouseLeave,
}) => {
  return (
    <AnimatePresence>
      {activeArchetypeBreakdown && (
        <>
          {/* ── Desktop: right-side drawer ── */}
          <div className="hidden md:flex fixed inset-0 bg-black/80 backdrop-blur-md z-50 justify-end">
            <div className="absolute inset-0 cursor-pointer" onClick={() => setActiveArchetypeBreakdown(null)} />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 h-full flex flex-col z-10 shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100"
            >
            {/* Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 flex justify-between items-center relative">
              <div>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-black uppercase tracking-widest font-mono">Master Duel Meta Breakdown</span>
                <h3 className="font-black text-xl text-zinc-900 dark:text-zinc-100 uppercase tracking-tight mt-0.5">
                  📊 {activeArchetypeBreakdown} Breakdown
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Recetas recopiladas de la comunidad y ratios de cartas recomendados.</p>
                {breakdownCards.length > 0 && (
                  <button
                    onClick={() => initializeDeckFromArchetype(activeArchetypeBreakdown, breakdownCards)}
                    className="mt-3 py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-600/25 cursor-pointer w-full sm:w-auto"
                  >
                    🔨 Iniciar Deck con este Arquetipo
                  </button>
                )}
              </div>
              <button
                onClick={() => setActiveArchetypeBreakdown(null)}
                className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-thin bg-white dark:bg-zinc-900">
              {isFetchingBreakdown ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-zinc-400 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                  <span className="text-xs font-bold">Cargando desglose competitivo...</span>
                </div>
              ) : breakdownCards.length === 0 ? (
                <div className="text-center py-20 text-zinc-400 text-xs font-bold font-mono">
                  No hay suficientes datos de recetas recopiladas para &quot;{activeArchetypeBreakdown}&quot;.
                </div>
              ) : (
                <>
                  {/* Main Deck cards */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-4">
                      🃏 Top Main Deck
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {breakdownCards.filter(c => c.is_main_deck).map(item => (
                        <div 
                          key={item.id} 
                          draggable
                          onDragStart={(e) => handleDragCardStart(e, { id: item.id, name: item.name, type: item.type, image_url: item.image_url_small || item.image_url })}
                          onClick={() => addRecommendedCard(item.id, item.name, undefined, item)}
                          onMouseEnter={() => handleCardMouseEnter(item as HoverCardBase)}
                          onMouseLeave={handleCardMouseLeave}
                          className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-red-500 rounded-2xl p-2.5 flex flex-col justify-between group transition-all duration-200 relative overflow-hidden cursor-grab active:cursor-grabbing shadow-xs"
                        >
                          <div className="relative aspect-3/4 rounded-xl overflow-hidden mb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={item.image_url_small || item.image_url} 
                              alt={item.name} 
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute top-1 right-1 bg-black/85 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-md">
                              {Math.round(item.average_copies)}x
                            </div>
                          </div>
                          <div>
                            <h5 className="font-bold text-[10px] truncate text-zinc-900 dark:text-zinc-100" title={item.name}>{item.name}</h5>
                            <p className="text-[9px] text-cyan-600 dark:text-cyan-400 font-bold mt-0.5 font-mono">{Math.round(item.usage_percent)}% de decks</p>
                            
                            <button
                              onClick={(e) => { e.stopPropagation(); addRecommendedCard(item.id, item.name, undefined, item); }}
                              className="w-full py-1 px-2 mt-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-800 dark:text-zinc-200 rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Agregar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Extra Deck cards */}
                  <div className="mt-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-4">
                      🌌 Top Extra Deck
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {breakdownCards.filter(c => !c.is_main_deck).map(item => (
                        <div 
                          key={item.id} 
                          draggable
                          onDragStart={(e) => handleDragCardStart(e, { id: item.id, name: item.name, type: item.type, image_url: item.image_url_small || item.image_url })}
                          onClick={() => addRecommendedCard(item.id, item.name, undefined, item)}
                          onMouseEnter={() => handleCardMouseEnter(item as HoverCardBase)}
                          onMouseLeave={handleCardMouseLeave}
                          className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 rounded-2xl p-2.5 flex flex-col justify-between group transition-all duration-200 relative overflow-hidden cursor-pointer shadow-xs"
                        >
                          <div className="relative aspect-3/4 rounded-xl overflow-hidden mb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={item.image_url_small || item.image_url} 
                              alt={item.name} 
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute top-1 right-1 bg-black/85 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-md">
                              {Math.round(item.average_copies)}x
                            </div>
                          </div>
                          <div>
                            <h5 className="font-bold text-[10px] truncate text-zinc-900 dark:text-zinc-100" title={item.name}>{item.name}</h5>
                            <p className="text-[9px] text-purple-600 dark:text-purple-400 font-bold mt-0.5 font-mono">{Math.round(item.usage_percent)}% de decks</p>
                            
                            <button
                              onClick={(e) => { e.stopPropagation(); addRecommendedCard(item.id, item.name, undefined, item); }}
                              className="w-full py-1 px-2 mt-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-purple-600 hover:text-white text-zinc-800 dark:text-zinc-200 rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Agregar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
          </div>

          {/* ── Mobile: bottom sheet ── */}
          <div className="flex md:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-50 items-end">
            <div className="absolute inset-0 cursor-pointer" onClick={() => setActiveArchetypeBreakdown(null)} />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260, mass: 0.8 }}
              className="relative w-full h-[90vh] bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 rounded-t-3xl flex flex-col z-10 shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100"
              style={{ paddingBottom: 'var(--sab)' }}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-start shrink-0">
                <div>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-black uppercase tracking-widest font-mono">Master Duel Meta Breakdown</span>
                  <h3 className="font-black text-lg text-zinc-900 dark:text-zinc-100 uppercase tracking-tight mt-0.5">
                    📊 {activeArchetypeBreakdown}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveArchetypeBreakdown(null)}
                  className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
                {isFetchingBreakdown ? (
                  <div className="flex flex-col items-center gap-2 py-16">
                    <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                    <p className="text-xs font-mono text-zinc-400">Cargando desglose...</p>
                  </div>
                ) : breakdownCards.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {breakdownCards.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => addRecommendedCard(item.id, item.name, undefined, item)}
                        className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 flex flex-col justify-between group transition-all duration-200 relative overflow-hidden cursor-pointer shadow-xs"
                      >
                        <div className="relative aspect-3/4 rounded-xl overflow-hidden mb-1.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={item.image_url_small || item.image_url} 
                            alt={item.name} 
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute top-1 right-1 bg-black/85 text-white font-mono font-bold text-[8px] px-1 py-0.5 rounded-md">
                            {Math.round(item.average_copies)}x
                          </div>
                        </div>
                        <div>
                          <h5 className="font-bold text-[9px] truncate text-zinc-900 dark:text-zinc-100">{item.name}</h5>
                          <p className="text-[8px] text-purple-600 dark:text-purple-400 font-bold font-mono">{Math.round(item.usage_percent)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
