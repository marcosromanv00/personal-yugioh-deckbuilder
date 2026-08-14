import React from 'react';
import { TrendingUp, AlertTriangle, Loader2, X, Plus } from 'lucide-react';
import { BreakdownCardItem, BanlistAlert, HistoryItem, HoverCardBase, Card } from '../types';

interface MetaAnalysisPanelProps {
  rightPanelOpen: boolean;
  setRightPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  rightPanelWidth: number;
  /** When true, renders inside a MobileBottomSheet — hides collapse controls */
  isMobile?: boolean;
  isAnalyzing: boolean;
  inferredArchetype: string;
  detectedArchetypes: { name: string; count: number }[];
  activeArchetypeTab: string;
  setActiveArchetypeTab: (tab: string) => void;
  banlistAlerts: BanlistAlert[];
  sidebarBreakdownCards: BreakdownCardItem[];
  isFetchingSidebarBreakdown: boolean;
  fetchSidebarBreakdown: (archetype: string) => void;
  cardHistory: HistoryItem[];
  handleDragCardStart: (e: React.DragEvent, cardData: any) => void;
  handleCardMouseEnter: (card: HoverCardBase) => void;
  handleCardMouseLeave: () => void;
  addRecommendedCard: (cardId: number, cardName: string, targetSection?: any, cardObj?: any) => void;
}

/**
 * MetaAnalysisPanel Component
 * Renders the right sidebar containing real-time meta analytics, archetype ratios,
 * banlist check results, and recent user actions history.
 */
export const MetaAnalysisPanel: React.FC<MetaAnalysisPanelProps> = ({
  rightPanelOpen,
  setRightPanelOpen,
  rightPanelWidth,
  isMobile = false,
  isAnalyzing,
  inferredArchetype,
  detectedArchetypes,
  activeArchetypeTab,
  setActiveArchetypeTab,
  banlistAlerts,
  sidebarBreakdownCards,
  isFetchingSidebarBreakdown,
  fetchSidebarBreakdown,
  cardHistory,
  handleDragCardStart,
  handleCardMouseEnter,
  handleCardMouseLeave,
  addRecommendedCard,
}) => {
  return (
    <section
      style={(!isMobile && rightPanelOpen) ? { width: `${rightPanelWidth}px` } : {}}
      className={`flex flex-col gap-4 ${
        isMobile
          ? 'w-full'
          : `bg-[hsl(224,22%,10%)] border border-[hsl(224,15%,16%)] rounded-2xl transition-all overflow-hidden ${rightPanelOpen ? 'p-4' : 'w-10 min-w-[40px] p-2 items-center'}`
      }`}
    >
      {/* Panel Header */}
      {!isMobile && (
        <div className={`border-b border-[hsl(224,15%,16%)] pb-2 mb-2 flex items-center shrink-0 ${rightPanelOpen ? 'justify-between' : 'justify-center flex-col gap-2'}`}>
          {rightPanelOpen && (
            <h2 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 whitespace-nowrap">
              <TrendingUp className="w-4 h-4 text-[hsl(180,80%,45%)]" /> Análisis del Meta
            </h2>
          )}
          <div className="flex items-center gap-1">
            {rightPanelOpen && isAnalyzing && <Loader2 className="w-4 h-4 animate-spin text-[hsl(180,80%,45%)]" />}
            <button
              onClick={() => setRightPanelOpen(p => !p)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={rightPanelOpen ? 'Colapsar panel de análisis' : 'Expandir panel de análisis'}
            >
              {rightPanelOpen ? <X className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {!rightPanelOpen && !isMobile ? (
        // Colapsed vertical text
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest" style={{ writingMode: 'vertical-rl' }}>Análisis</span>
        </div>
      ) : (
        // Expanded Panel Content
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          
          {/* Detected Archetypes Section */}
          <div>
            <span className="text-[10px] text-slate-500 font-mono block mb-1.5">Arquetipos Principales Detectados:</span>
            {detectedArchetypes.length === 0 ? (
              <span className="text-sm font-bold text-slate-300">{inferredArchetype || 'Híbrido / Staples'}</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {detectedArchetypes.map((arch) => {
                  const isActive = (activeArchetypeTab || inferredArchetype) === arch.name;
                  return (
                    <button
                      key={arch.name}
                      onClick={() => {
                        setActiveArchetypeTab(arch.name);
                        fetchSidebarBreakdown(arch.name);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-purple-600/30 text-purple-200 border border-purple-500/60 shadow-lg shadow-purple-900/20'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <span>{arch.name}</span>
                      <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-mono font-extrabold ${isActive ? 'bg-purple-500/40 text-purple-100' : 'bg-zinc-800 text-zinc-400'}`}>
                        {arch.count}x
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Banlist Alerts Section */}
          {banlistAlerts.length > 0 && (
            <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/30">
              <h4 className="text-xs font-bold text-red-400 flex items-center gap-1 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Banlist Alert ({banlistAlerts.length})
              </h4>
              <div className="space-y-1 text-xs">
                {banlistAlerts.map((alert, i) => (
                  <div key={i} className="flex justify-between border-b border-red-900/10 pb-1">
                    <span className="text-zinc-200 truncate pr-2">{alert.cardName}</span>
                    <span className="text-red-400 font-bold font-mono">{alert.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Archetype Card Breakdown & Popularity */}
          {(activeArchetypeTab || inferredArchetype) && (activeArchetypeTab || inferredArchetype) !== 'Híbrido / Staples' && (
            <div className="border-t border-[hsl(224,15%,16%)] pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2 flex items-center justify-between">
                <span>📊 Desglose de {activeArchetypeTab || inferredArchetype}</span>
                {isFetchingSidebarBreakdown && <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />}
              </h4>
              {sidebarBreakdownCards.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">Sin datos de desglose para este arquetipo.</p>
              ) : (
                <div className={`grid gap-x-0.5 gap-y-1 max-h-56 overflow-y-auto pr-1 scrollbar-thin ${isMobile ? 'grid-cols-4' : 'grid-cols-5'}`}>
                  {sidebarBreakdownCards.map((card) => {
                    const U = card.usage_percent;
                    const A = card.average_copies;
                    let x3 = 0, x2 = 0, x1 = 0;
                    if (A >= 2) {
                      x3 = U * (A - 2);
                      x2 = U * (3 - A);
                    } else {
                      x2 = U * (A - 1);
                      x1 = U * (2 - A);
                    }
                    const rx3 = Math.round(x3);
                    const rx2 = Math.round(x2);
                    const rx1 = Math.round(x1);
                    const rx0 = 100 - (rx3 + rx2 + rx1);

                    const hoverText = `${card.name}\nSugerencia del Meta:\n- x3 en ${rx3}%\n- x2 en ${rx2}%\n- x1 en ${rx1}%\n- x0 en ${rx0}%`;
                    const suggestedCopies = Math.round(card.average_copies);

                    return (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={(e) => handleDragStartLocal(e, card)}
                        onClick={() => addRecommendedCard(card.id, card.name, undefined, card)}
                        onMouseEnter={() => handleCardMouseEnter(card as HoverCardBase)}
                        onMouseLeave={handleCardMouseLeave}
                        className="relative aspect-[3/4.2] rounded-md overflow-hidden border border-zinc-800 hover:border-purple-500 hover:scale-105 transition-all duration-200 bg-zinc-950 cursor-grab active:cursor-grabbing group"
                        title={hoverText}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={card.image_url_small || card.image_url}
                          alt={card.name}
                          className="w-full h-full object-contain"
                          onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-black/85 py-0.5 text-center text-[10px] font-extrabold text-purple-300 font-mono">
                          {Math.round(card.usage_percent)}%
                        </div>
                        <div className="absolute top-0.5 left-0.5 bg-black/75 px-1 rounded text-[7px] font-mono text-slate-200">
                          {suggestedCopies}x
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* User History / Recent actions log */}
          <div className="border-t border-[hsl(224,15%,16%)] pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-2">
              🕒 Acciones Recientes
            </h4>
            {cardHistory.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">Sin acciones recientes.</p>
            ) : (
              <div className={`grid gap-x-0.5 gap-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin ${isMobile ? 'grid-cols-4' : 'grid-cols-5'}`}>
                {cardHistory.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    draggable
                    onDragStart={(e) => handleDragStartLocal(e, item)}
                    onMouseEnter={() => handleCardMouseEnter(item as HoverCardBase)}
                    onMouseLeave={handleCardMouseLeave}
                    className={`relative aspect-[3/4.2] rounded-md overflow-hidden border bg-zinc-950 cursor-grab active:cursor-grabbing hover:scale-105 transition-all duration-200 group ${
                      item.action === 'added' ? 'border-green-500/40 hover:border-green-400' : 'border-red-500/40 hover:border-red-400'
                    }`}
                    title={`${item.name} (${item.action === 'added' ? 'Añadida' : 'Quitada'}) - Haz clic o arrastra para agregar`}
                    onClick={() => addRecommendedCard(item.id, item.name, undefined, item)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-contain bg-zinc-900"
                      onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                    />
                    <div className={`absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow ${
                      item.action === 'added' ? 'bg-green-600' : 'bg-red-500'
                    }`}>
                      {item.action === 'added' ? '+' : '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </section>
  );

  function handleDragStartLocal(e: React.DragEvent, card: any) {
    handleDragCardStart(e, {
      id: card.id,
      name: card.name,
      type: card.type || 'Monster',
      image_url: card.image_url || card.image_url_small || ''
    });
  }
};
