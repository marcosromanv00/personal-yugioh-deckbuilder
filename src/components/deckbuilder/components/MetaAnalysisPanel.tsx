import React from 'react';
import { TrendingUp, AlertTriangle, Loader2, X, Sparkles, Layers, Info, PackageCheck } from 'lucide-react';
import { BreakdownCardItem, BanlistAlert, HistoryItem, HoverCardBase, Card, DeckCard } from '../types';
import { CardDetailPanel } from './CardDetailPanel';
import { CollectionSynergiesPanel } from './CollectionSynergiesPanel';
import { StorageLocation, SleeveInventory, UserCard, Deck } from '@/types/collection';

export interface MetaAnalysisPanelProps {
  rightPanelOpen: boolean;
  setRightPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  rightPanelWidth: number;
  /** When true, renders inside a MobileBottomSheet — hides collapse controls */
  isMobile?: boolean;
  activeRightTab?: 'detail' | 'meta' | 'collection';
  setActiveRightTab?: (tab: 'detail' | 'meta' | 'collection') => void;
  allUserCards?: UserCard[];
  locations?: StorageLocation[];
  savedDecks?: Deck[];
  deckCards?: DeckCard[];
  selectedDetailCard?: (Card | DeckCard | HoverCardBase) | null;
  selectedDeckCard?: DeckCard | null;
  onUpdateDeckCard?: (cardId: number, updates: Partial<DeckCard>) => void;
  onRemoveFromDeck?: (cardId: number, section: 'main' | 'extra' | 'side' | 'extras') => void;
  onAddCardToDeck?: (card: Card, section?: 'main' | 'extra' | 'side' | 'extras') => void;
  onToggleFavorite?: (cardId: number) => void;
  favoriteCardIds?: number[];
  availableSleeves?: SleeveInventory[];
  format?: 'Master Duel' | 'TCG' | 'Duel Links';
  // Meta analysis props
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
 * Renders the right sidebar containing:
 * 1. "Detalle de Carta" tab: editing proxy counts, rarities, physical condition, sleeves, and notes.
 * 2. "Análisis Meta" tab: real-time meta analytics, archetype ratios, banlist check results, and recent history.
 */
export const MetaAnalysisPanel: React.FC<MetaAnalysisPanelProps> = ({
  rightPanelOpen,
  setRightPanelOpen,
  rightPanelWidth,
  isMobile = false,
  activeRightTab = 'detail',
  setActiveRightTab,
  allUserCards = [],
  locations = [],
  savedDecks = [],
  deckCards = [],
  selectedDetailCard = null,
  selectedDeckCard = null,
  onUpdateDeckCard,
  onRemoveFromDeck,
  onAddCardToDeck,
  onToggleFavorite,
  favoriteCardIds = [],
  availableSleeves = [],
  format = 'Master Duel',
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
  const currentTab = activeRightTab || 'detail';

  const handleDragStartLocal = (e: React.DragEvent, card: any) => {
    handleDragCardStart(e, {
      id: card.id,
      name: card.name,
      type: card.type || 'Monster',
      image_url: card.image_url || card.image_url_small || '',
    });
  };

  return (
    <section
      style={!isMobile && rightPanelOpen ? { width: `${rightPanelWidth}px` } : {}}
      className={`flex flex-col gap-3 ${
        isMobile
          ? 'w-full'
          : `bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-all overflow-hidden ${
              rightPanelOpen ? 'p-4' : 'w-10 min-w-10 p-2 items-center'
            }`
      }`}
    >
      {/* Panel Header */}
      {!isMobile && (
        <div
          className={`border-b border-zinc-200 dark:border-zinc-800 pb-2.5 flex items-center shrink-0 ${
            rightPanelOpen ? 'justify-between gap-2' : 'justify-center flex-col gap-2'
          }`}
        >
          {rightPanelOpen && (
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0">
              <button
                type="button"
                onClick={() => setActiveRightTab?.('detail')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'detail'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="Ver y editar detalles de la carta seleccionada"
              >
                <Info className="w-3.5 h-3.5 text-red-500" />
                <span>Detalle</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveRightTab?.('meta')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'meta'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="Ver análisis del meta y arquetipos"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Meta</span>
                {isAnalyzing && <Loader2 className="w-3 h-3 animate-spin text-white" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveRightTab?.('collection')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'collection'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="Ver recomendaciones de cartas libres y motores en tu colección física"
              >
                <PackageCheck className="w-3.5 h-3.5 text-purple-300" />
                <span>Colección</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setRightPanelOpen((p) => !p)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              title={rightPanelOpen ? 'Colapsar panel lateral' : 'Expandir panel lateral'}
            >
              {rightPanelOpen ? <X className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Tab switcher */}
      {isMobile && (
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-3 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveRightTab?.('detail')}
            className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation min-h-11 ${
              currentTab === 'detail'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-red-500" />
            <span>Detalle</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRightTab?.('meta')}
            className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation min-h-11 ${
              currentTab === 'meta'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Meta</span>
            {isAnalyzing && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveRightTab?.('collection')}
            className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation min-h-11 ${
              currentTab === 'collection'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5 text-purple-300" />
            <span>Colección</span>
          </button>
        </div>
      )}

      {!rightPanelOpen && !isMobile ? (
        // Collapsed vertical text
        <div className="flex-1 flex items-center justify-center cursor-pointer" onClick={() => setRightPanelOpen(true)}>
          <span
            className="text-[10px] font-black text-zinc-400 uppercase tracking-widest"
            style={{ writingMode: 'vertical-rl' }}
          >
            {currentTab === 'detail' ? 'Detalle' : currentTab === 'collection' ? 'Colección' : 'Análisis'}
          </span>
        </div>
      ) : (
        // Expanded Panel Content
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
          {currentTab === 'detail' ? (
            /* TAB 1: CARD DETAIL & ATTRIBUTE EDITOR */
            <CardDetailPanel
              card={selectedDetailCard}
              deckCard={selectedDeckCard}
              isInDeck={Boolean(selectedDeckCard)}
              onUpdateDeckCard={onUpdateDeckCard}
              onRemoveFromDeck={onRemoveFromDeck}
              onAddCardToDeck={onAddCardToDeck}
              onToggleFavorite={onToggleFavorite}
              isFavorite={selectedDetailCard ? favoriteCardIds.includes(selectedDetailCard.id) : false}
              availableSleeves={availableSleeves}
              format={format}
            />
          ) : currentTab === 'collection' ? (
            /* TAB 3: PHYSICAL COLLECTION SYNERGIES & RECOMMENDATIONS */
            <CollectionSynergiesPanel
              allUserCards={allUserCards || []}
              deckCards={deckCards || []}
              detectedArchetypes={detectedArchetypes}
              inferredArchetype={inferredArchetype}
              locations={locations || []}
              savedDecks={savedDecks}
              onAddCardToDeck={onAddCardToDeck}
              handleDragCardStart={handleDragCardStart}
              handleCardMouseEnter={handleCardMouseEnter}
              handleCardMouseLeave={handleCardMouseLeave}
            />
          ) : (
            /* TAB 2: META ANALYSIS & BREAKDOWNS */
            <div className="space-y-4">
              {/* Live Meta Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                    <span>Master Duel Meta</span>
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-zinc-500 font-mono">En vivo • Ratios y Staples</span>
                  </div>
                </div>
                {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin text-red-500" />}
              </div>

              {/* Detected Archetypes Section */}
              <div>
                <span className="text-[10px] text-zinc-500 font-mono font-bold block mb-1.5">
                  Arquetipos Principales Detectados:
                </span>
                {detectedArchetypes.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">No se han detectado arquetipos aún</p>
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
                          className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                          }`}
                        >
                          <span>{arch.name}</span>
                          <span className="text-[10px] font-mono opacity-80">{arch.count}x</span>
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
              {(activeArchetypeTab || inferredArchetype) &&
                (activeArchetypeTab || inferredArchetype) !== 'Híbrido / Staples' && (
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 mb-2 flex items-center justify-between">
                      <span>📊 Desglose de {activeArchetypeTab || inferredArchetype}</span>
                      {isFetchingSidebarBreakdown && <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />}
                    </h4>
                    {sidebarBreakdownCards.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4">
                        Sin datos de desglose para este arquetipo.
                      </p>
                    ) : (
                      <div
                        className={`grid gap-x-0.5 gap-y-1 max-h-56 overflow-y-auto pr-1 scrollbar-thin ${
                          isMobile ? 'grid-cols-4' : 'grid-cols-5'
                        }`}
                      >
                        {sidebarBreakdownCards.map((card) => {
                          const U = card.usage_percent;
                          const A = card.average_copies;
                          let x3 = 0,
                            x2 = 0,
                            x1 = 0;
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
                              className="relative aspect-[3/4.2] rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-red-500 hover:scale-105 transition-all duration-200 bg-white dark:bg-zinc-950 cursor-grab active:cursor-grabbing group shadow-xs"
                              title={hoverText}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={card.image_url_small || card.image_url}
                                alt={card.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg';
                                }}
                              />
                              <div className="absolute bottom-0 inset-x-0 bg-black/85 py-0.5 text-center text-[10px] font-extrabold text-red-400 font-mono">
                                {Math.round(card.usage_percent)}%
                              </div>
                              <div className="absolute top-0.5 left-0.5 bg-black/75 px-1 rounded text-[7px] font-mono text-zinc-200">
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
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-2">
                  🕒 Acciones Recientes
                </h4>
                {cardHistory.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-4">Sin acciones recientes.</p>
                ) : (
                  <div
                    className={`grid gap-x-0.5 gap-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin ${
                      isMobile ? 'grid-cols-4' : 'grid-cols-5'
                    }`}
                  >
                    {cardHistory.map((item, idx) => (
                      <div
                        key={`${item.id}-${idx}`}
                        draggable
                        onDragStart={(e) => handleDragStartLocal(e, item)}
                        onMouseEnter={() => handleCardMouseEnter(item as HoverCardBase)}
                        onMouseLeave={handleCardMouseLeave}
                        className={`relative aspect-[3/4.2] rounded-md overflow-hidden border bg-zinc-950 cursor-grab active:cursor-grabbing hover:scale-105 transition-all duration-200 group ${
                          item.action === 'added'
                            ? 'border-green-500/40 hover:border-green-400'
                            : 'border-red-500/40 hover:border-red-400'
                        }`}
                        title={`${item.name} (${item.action === 'added' ? 'Añadida' : 'Quitada'}) - Haz clic o arrastra para agregar`}
                        onClick={() => addRecommendedCard(item.id, item.name, undefined, item)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-contain bg-zinc-900"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg';
                          }}
                        />
                        <div
                          className={`absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow ${
                            item.action === 'added' ? 'bg-green-600' : 'bg-red-500'
                          }`}
                        >
                          {item.action === 'added' ? '+' : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
