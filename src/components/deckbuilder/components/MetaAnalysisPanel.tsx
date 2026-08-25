'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Loader2,
  X,
  Sparkles,
  Layers,
  Info,
  PackageCheck,
  Activity,
} from 'lucide-react';
import { BreakdownCardItem, BanlistAlert, HistoryItem, HoverCardBase, Card, DeckCard } from '../types';
import { CardDetailPanel } from './CardDetailPanel';
import { CollectionSynergiesPanel } from './CollectionSynergiesPanel';
import { StorageLocation, SleeveInventory, UserCard, Deck } from '@/types/collection';
import { PremiumDropdown, DropdownOption } from '@/components/ui/PremiumDropdown';
import { generateExordioDeckAnalysis, ExordioAnalysisResult } from '@/lib/engines/exordioAnalytics';
import { ExordioDeckStats } from '../exordio/ExordioDeckStats';
import { ExordioKeyCards } from '../exordio/ExordioKeyCards';
import { ExordioThreatCards } from '../exordio/ExordioThreatCards';
import { ExordioTestingData } from '../exordio/ExordioTestingData';
import { ExordioDecklistBroadcast } from '../exordio/ExordioDecklistBroadcast';

export type RightSidebarTab = 'detail' | 'meta' | 'collection' | 'analysis';
export type ExordioSubSection = 'stats' | 'key_cards' | 'threats' | 'testing' | 'decklist';

export interface MetaAnalysisPanelProps {
  rightPanelOpen: boolean;
  setRightPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  rightPanelWidth: number;
  /** When true, renders inside a MobileBottomSheet — hides collapse controls */
  isMobile?: boolean;
  activeRightTab?: RightSidebarTab;
  setActiveRightTab?: (tab: RightSidebarTab) => void;
  allUserCards?: UserCard[];
  locations?: StorageLocation[];
  savedDecks?: Deck[];
  currentDeckId?: string | null;
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
  handleDragCardStart: (
    e: React.DragEvent,
    cardData: {
      id: number;
      name: string;
      type?: string;
      image_url?: string;
      archetype?: string;
      fromSection?: 'main' | 'extra' | 'side' | 'extras';
    }
  ) => void;
  handleCardMouseEnter: (card: HoverCardBase) => void;
  handleCardMouseLeave: () => void;
  addRecommendedCard: (
    cardId: number,
    cardName: string,
    targetSection?: 'main' | 'extra' | 'side' | 'extras',
    cardObj?: Partial<Card & BreakdownCardItem & HistoryItem>
  ) => void | Promise<void>;
}

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
  currentDeckId,
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
  handleDragCardStart,
  handleCardMouseEnter,
  handleCardMouseLeave,
  addRecommendedCard,
}) => {
  const currentTab = activeRightTab || 'detail';
  const [exordioSubSection, setExordioSubSection] = useState<ExordioSubSection>('stats');

  // Análisis Exordio generado para el mazo actual
  const exordioAnalysis = useMemo<ExordioAnalysisResult>(() => {
    return generateExordioDeckAnalysis(deckCards, inferredArchetype);
  }, [deckCards, inferredArchetype]);

  const exordioDropdownOptions: DropdownOption<ExordioSubSection>[] = [
    { value: 'stats', label: '📊 Métricas y Ratios', badge: `${exordioAnalysis.finalScore}/100` },
    { value: 'key_cards', label: '⭐ Cartas Clave y Bosses' },
    { value: 'threats', label: '⚠️ Amenazas y Handtraps', badge: `${exordioAnalysis.threatCards.length}` },
    { value: 'testing', label: '🧪 Pruebas de Consistencia', badge: `${exordioAnalysis.testingData.winRatio}%` },
    { value: 'decklist', label: '📜 Ficha de Transmisión' },
  ];

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
      {/* ─── PANEL HEADER & TABS DE NAVEGACIÓN ─── */}
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
                onClick={() => setActiveRightTab?.('analysis')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'analysis'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="Ver analíticas Exordio del mazo (Métricas, radar, consistencia)"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Análisis</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveRightTab?.('meta')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'meta'
                    ? 'bg-amber-600 text-white shadow-xs'
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

      {/* ─── MOBILE TAB SWITCHER ─── */}
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
            onClick={() => setActiveRightTab?.('analysis')}
            className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation min-h-11 ${
              currentTab === 'analysis'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Análisis</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRightTab?.('meta')}
            className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation min-h-11 ${
              currentTab === 'meta'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Meta</span>
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
        // Colapsado vertical
        <div className="flex-1 flex items-center justify-center cursor-pointer" onClick={() => setRightPanelOpen(true)}>
          <span
            className="text-[10px] font-black text-zinc-400 uppercase tracking-widest"
            style={{ writingMode: 'vertical-rl' }}
          >
            {currentTab === 'detail'
              ? 'Detalle'
              : currentTab === 'collection'
              ? 'Colección'
              : currentTab === 'analysis'
              ? 'Análisis'
              : 'Meta'}
          </span>
        </div>
      ) : (
        // Contenido Expandido del Panel
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
          ) : currentTab === 'analysis' ? (
            /* TAB 2: ANÁLISIS EXORDIO COMPLETO */
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 font-display">
                    <Activity className="w-4 h-4 text-red-500" />
                    <span>Análisis de Mazo Exordio</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500">Métricas avanzadas, consistencia y amenazas</p>
                </div>
              </div>

              {/* Subswitch / Dropdown para navegar módulos analíticos */}
              <PremiumDropdown<ExordioSubSection>
                options={exordioDropdownOptions}
                value={exordioSubSection}
                onChange={(val) => setExordioSubSection(val)}
                className="w-full"
                triggerClassName="w-full bg-zinc-100 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                size="sm"
                menuWidth="w-full"
              />

              {/* Renderizado de la sección de análisis seleccionada */}
              <div className="pt-1">
                {exordioSubSection === 'stats' && (
                  <ExordioDeckStats analysis={exordioAnalysis} format={format} />
                )}
                {exordioSubSection === 'key_cards' && (
                  <ExordioKeyCards
                    keyCards={exordioAnalysis.keyCards}
                    format={format}
                    onCardClick={(c) => {
                      if (onAddCardToDeck) {
                        onAddCardToDeck({
                          id: c.id,
                          name: c.name,
                          type: c.type || 'Monster',
                          image_url: c.image_url || '',
                          image_url_small: c.image_url_small || '',
                        });
                      }
                    }}
                  />
                )}
                {exordioSubSection === 'threats' && (
                  <ExordioThreatCards threats={exordioAnalysis.threatCards} format={format} />
                )}
                {exordioSubSection === 'testing' && (
                  <ExordioTestingData testingData={exordioAnalysis.testingData} />
                )}
                {exordioSubSection === 'decklist' && (
                  <ExordioDecklistBroadcast analysis={exordioAnalysis} deckCards={deckCards} format={format} />
                )}
              </div>
            </div>
          ) : currentTab === 'collection' ? (
            /* TAB 3: PHYSICAL COLLECTION SYNERGIES & RECOMMENDATIONS */
            <CollectionSynergiesPanel
              allUserCards={allUserCards || []}
              deckCards={deckCards || []}
              detectedArchetypes={detectedArchetypes}
              inferredArchetype={inferredArchetype}
              locations={locations || []}
              savedDecks={savedDecks}
              currentDeckId={currentDeckId}
              onAddCardToDeck={onAddCardToDeck}
              handleDragCardStart={handleDragCardStart}
              handleCardMouseEnter={handleCardMouseEnter}
              handleCardMouseLeave={handleCardMouseLeave}
            />
          ) : (
            /* TAB 4: META ANALYSIS & BREAKDOWNS */
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
              {detectedArchetypes.length > 0 && (
                <div>
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Motores Detectados</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {detectedArchetypes.map((arch) => (
                      <button
                        key={arch.name}
                        type="button"
                        onClick={() => {
                          setActiveArchetypeTab(arch.name);
                          fetchSidebarBreakdown(arch.name);
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                          activeArchetypeTab === arch.name
                            ? 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-red-400'
                        }`}
                      >
                        <span>{arch.name}</span>
                        <span className="text-[10px] opacity-75 font-mono">({arch.count})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Breakdown Cards Section */}
              {activeArchetypeTab && (
                <div>
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-purple-500" />
                    <span>Ratios Populares de {activeArchetypeTab}</span>
                  </div>
                  {isFetchingSidebarBreakdown ? (
                    <div className="p-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-red-500 mx-auto mb-2" />
                      <p className="text-xs text-zinc-500">Cargando ratios del metagame...</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                      {sidebarBreakdownCards.map((card) => (
                        <div
                          key={card.id}
                          className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-10 rounded-sm bg-zinc-800 shrink-0 overflow-hidden">
                              {card.image_url_small && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={card.image_url_small}
                                  alt={card.name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                                {card.name}
                              </h5>
                              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                <span>{card.usage_percent}% uso</span>
                                <span>•</span>
                                <span>~{card.average_copies} copias</span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              addRecommendedCard(
                                card.id,
                                card.name,
                                card.is_main_deck ? 'main' : 'extra',
                                card
                              )
                            }
                            className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-wider shrink-0 transition-colors cursor-pointer"
                          >
                            + Añadir
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Banlist Alerts */}
              {banlistAlerts.length > 0 && (
                <div>
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    <span>Alertas de Banlist</span>
                  </div>
                  <div className="space-y-1.5">
                    {banlistAlerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs"
                      >
                        {alert.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
