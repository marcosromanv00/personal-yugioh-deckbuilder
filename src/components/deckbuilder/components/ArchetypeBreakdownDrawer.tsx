import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus } from 'lucide-react';
import { BreakdownCardItem, HoverCardBase } from '../types';

interface ArchetypeBreakdownDrawerProps {
  activeArchetypeBreakdown: string | null;
  setActiveArchetypeBreakdown: (archetype: string | null) => void;
  isFetchingBreakdown: boolean;
  breakdownCards: BreakdownCardItem[];
  initializeDeckFromArchetype: (archetype: string, cards: BreakdownCardItem[]) => Promise<void>;
  addRecommendedCard: (cardId: number, cardName: string, targetSection?: any, cardObj?: any) => void;
  handleDragCardStart: (e: React.DragEvent, cardData: any) => void;
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setActiveArchetypeBreakdown(null)} />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-2xl bg-[hsl(224,22%,10%)] border-l border-[hsl(224,15%,16%)] h-full flex flex-col z-10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-[hsl(224,15%,16%)] bg-[hsl(224,25%,6%)]/40 flex justify-between items-center relative">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[hsl(180,80%,45%)]/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <span className="text-[10px] text-[hsl(180,80%,45%)] font-bold uppercase tracking-widest font-mono">Master Duel Meta Breakdown</span>
                <h3 className="font-bold text-2xl text-white uppercase tracking-tight mt-1">
                  📊 {activeArchetypeBreakdown} Breakdown
                </h3>
                <p className="text-xs text-[hsl(215,15%,70%)] mt-1">Recetas recopiladas de la comunidad y ratios de cartas recomendados.</p>
                {breakdownCards.length > 0 && (
                  <button
                    onClick={() => initializeDeckFromArchetype(activeArchetypeBreakdown, breakdownCards)}
                    className="mt-3 py-2 px-4 bg-[hsl(263,85%,64%)] hover:bg-[hsl(263,85%,64%)]/90 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[hsl(263,85%,64%)]/20 cursor-pointer w-full sm:w-auto"
                  >
                    🔨 Iniciar Deck con este Arquetipo
                  </button>
                )}
              </div>
              <button
                onClick={() => setActiveArchetypeBreakdown(null)}
                className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl font-bold flex items-center justify-center transition-colors text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-thin">
              {isFetchingBreakdown ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[hsl(180,80%,45%)]" />
                  <span className="text-sm font-semibold">Cargando desglose competitivo...</span>
                </div>
              ) : breakdownCards.length === 0 ? (
                <div className="text-center py-20 text-zinc-500 text-sm">
                  No hay suficientes datos de recetas recopiladas para el arquetipo &quot;{activeArchetypeBreakdown}&quot; en este formato.
                </div>
              ) : (
                <>
                  {/* Main Deck cards */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[hsl(180,80%,45%)] border-b border-[hsl(224,15%,16%)] pb-2 mb-4">
                      🃏 Top Main Deck
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {breakdownCards.filter(c => c.is_main_deck).map(item => (
                        <div 
                          key={item.id} 
                          draggable
                          onDragStart={(e) => handleDragCardStart(e, { id: item.id, name: item.name, type: item.type, image_url: item.image_url_small || item.image_url })}
                          onClick={() => addRecommendedCard(item.id, item.name, undefined, item)}
                          onMouseEnter={() => handleCardMouseEnter(item as HoverCardBase)}
                          onMouseLeave={handleCardMouseLeave}
                          className="bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-[hsl(180,80%,45%)]/40 rounded-xl p-3 flex flex-col justify-between group transition-all duration-300 relative overflow-hidden cursor-grab active:cursor-grabbing"
                        >
                          <div className="relative aspect-3/4 rounded-lg overflow-hidden shadow shadow-black/60 mb-2.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={item.image_url_small || item.image_url} 
                              alt={item.name} 
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-1.5 right-1.5 bg-black/85 border border-zinc-700 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                              {Math.round(item.average_copies)}x
                            </div>
                          </div>
                          <div>
                            <h5 className="font-bold text-[10px] truncate text-white" title={item.name}>{item.name}</h5>
                            <p className="text-[9px] text-[hsl(180,80%,45%)] font-bold mt-1 font-mono">{Math.round(item.usage_percent)}% de decks</p>
                            
                            <button
                              onClick={(e) => { e.stopPropagation(); addRecommendedCard(item.id, item.name, undefined, item); }}
                              className="w-full py-1.5 px-3.5 mt-2 bg-zinc-800 hover:bg-[hsl(180,80%,45%)]/20 hover:text-[hsl(180,80%,45%)] text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 border border-zinc-700 hover:border-[hsl(180,80%,45%)]/30 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Agregar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Extra Deck cards */}
                  <div className="mt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[hsl(263,85%,64%)] border-b border-[hsl(224,15%,16%)] pb-2 mb-4">
                      🌌 Top Extra Deck
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {breakdownCards.filter(c => !c.is_main_deck).map(item => (
                        <div 
                          key={item.id} 
                          draggable
                          onDragStart={(e) => handleDragCardStart(e, { id: item.id, name: item.name, type: item.type, image_url: item.image_url_small || item.image_url })}
                          onClick={() => addRecommendedCard(item.id, item.name, undefined, item)}
                          onMouseEnter={() => handleCardMouseEnter(item as HoverCardBase)}
                          onMouseLeave={handleCardMouseLeave}
                          className="bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-[hsl(263,85%,64%)]/40 rounded-xl p-3 flex flex-col justify-between group transition-all duration-300 relative overflow-hidden cursor-grab active:cursor-grabbing"
                        >
                          <div className="relative aspect-3/4 rounded-lg overflow-hidden shadow shadow-black/60 mb-2.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={item.image_url_small || item.image_url} 
                              alt={item.name} 
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-1.5 right-1.5 bg-black/85 border border-zinc-700 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                              {Math.round(item.average_copies)}x
                            </div>
                          </div>
                          <div>
                            <h5 className="font-bold text-[10px] truncate text-white" title={item.name}>{item.name}</h5>
                            <p className="text-[9px] text-[hsl(263,85%,64%)] font-bold mt-1 font-mono">{Math.round(item.usage_percent)}% de decks</p>
                            
                            <button
                              onClick={(e) => { e.stopPropagation(); addRecommendedCard(item.id, item.name, undefined, item); }}
                              className="w-full py-1.5 px-3.5 mt-2 bg-zinc-800 hover:bg-[hsl(263,85%,64%)]/20 hover:text-[hsl(263,85%,64%)] text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 border border-zinc-700 hover:border-[hsl(263,85%,64%)]/30 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Agregar
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
      )}
    </AnimatePresence>
  );
};
