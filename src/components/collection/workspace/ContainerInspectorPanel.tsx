'use client';

import React from 'react';
import { Info, Sparkles, X, Layers, Tag, TrendingUp } from 'lucide-react';
import { StorageLocation, UserCard, Deck } from '@/types/collection';
import { 
  analyzeCardClassification, 
  analyzeLanePatterns, 
  analyzeGlobalCollectionPatterns,
  LaneCluster,
  BestRecommendation 
} from '@/lib/cardClassificationEngine';
import { DispersedCardSummary } from '@/lib/collectionUtils';
import { ContainerLaneAnalysisView } from './ContainerLaneAnalysisView';
import { ContainerCardAnalysisView } from './ContainerCardAnalysisView';
import { ContainerGlobalAnalysisView } from './ContainerGlobalAnalysisView';
import { ContainerCardDetailsInspector } from './ContainerCardDetailsInspector';
import { RightPanelMode, AISubView, DetailsCopiesMode, MobileTab } from './types';

interface ContainerInspectorPanelProps {
  rightPanelWidth: number;
  isMobile: boolean;
  mobileTab: MobileTab;
  rightMode: RightPanelMode;
  setRightMode: (mode: RightPanelMode) => void;
  aiSubView: AISubView;
  setAiSubView: (sub: AISubView) => void;
  selectedUserCard: UserCard | null;
  setSelectedUserCard: (uc: UserCard | null) => void;

  // Context & Locations
  locations: StorageLocation[];
  location: StorageLocation | null;
  currentLocation: StorageLocation | null;
  internalDecks: Deck[];
  activeCompartment: number;
  activeLaneCards: UserCard[];
  totalCollectionCount: number;

  // AI & Pattern Reports
  lanePatternReport: ReturnType<typeof analyzeLanePatterns>;
  classificationReport: ReturnType<typeof analyzeCardClassification> | null;
  globalCollectionReport: ReturnType<typeof analyzeGlobalCollectionPatterns>;
  allDispersedCards: DispersedCardSummary[];
  currentCardDispersedInfo: DispersedCardSummary | null;
  activeClusterFilter: string | null;
  setActiveClusterFilter: (f: string | null) => void;
  expandedClusterSubId: string | null;
  setExpandedClusterSubId: React.Dispatch<React.SetStateAction<string | null>>;

  // Actions
  onOpenAssignDeckModal: (compartmentIdx: number) => void;
  onOpenPickListForCluster: (cluster: LaneCluster, title: string, subtitle: string) => void;
  onOpenPickListForSubArchetype: (sub: NonNullable<LaneCluster['subArchetypes']>[number]) => void;
  onOpenPickListForDispersed: (disp: DispersedCardSummary) => void;
  onOpenPickListForCard: () => void;
  onMoveMisplacedCard: (userCardId: string, suggestedLocationId: string, cardName: string, suggestedLocationName: string) => Promise<void>;
  onApplyRecommendation: (rec: BestRecommendation) => void;
  onAssignToDeck: (deckId: string, deckName: string, section: string) => void;

  // Details mode props
  detailsCopiesMode: DetailsCopiesMode;
  setDetailsCopiesMode: (mode: DetailsCopiesMode) => void;
  isVariantsExpanded: boolean;
  setIsVariantsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  activeVariants: UserCard[];
  totalCopiesInContainer: number;
  onUpdateVariantById: (variantId: string, fields: Partial<UserCard>) => void;
  onDeleteVariantById: (variantId: string) => void;
  onAddNewVariant: () => void;
  onUpdateCard: (fields: Partial<UserCard>) => void;
  onMoveCard: (newLocId: string | null) => void;
  onDeleteCard: () => void;
  onOpenSplitModal?: (card?: UserCard) => void;
}

export const ContainerInspectorPanel: React.FC<ContainerInspectorPanelProps> = ({
  rightPanelWidth,
  isMobile,
  mobileTab,
  rightMode,
  setRightMode,
  aiSubView,
  setAiSubView,
  selectedUserCard,
  setSelectedUserCard,

  locations,
  location,
  currentLocation,
  internalDecks,
  activeCompartment,
  activeLaneCards,
  totalCollectionCount,

  lanePatternReport,
  classificationReport,
  globalCollectionReport,
  allDispersedCards,
  currentCardDispersedInfo,
  activeClusterFilter,
  setActiveClusterFilter,
  expandedClusterSubId,
  setExpandedClusterSubId,

  onOpenAssignDeckModal,
  onOpenPickListForCluster,
  onOpenPickListForSubArchetype,
  onOpenPickListForDispersed,
  onOpenPickListForCard,
  onMoveMisplacedCard,
  onApplyRecommendation,
  onAssignToDeck,

  detailsCopiesMode,
  setDetailsCopiesMode,
  isVariantsExpanded,
  setIsVariantsExpanded,
  activeVariants,
  totalCopiesInContainer,
  onUpdateVariantById,
  onDeleteVariantById,
  onAddNewVariant,
  onUpdateCard,
  onMoveCard,
  onDeleteCard,
  onOpenSplitModal,
}) => {
  return (
    <div 
      style={!isMobile ? { width: `${rightPanelWidth}px` } : {}}
      className={`${mobileTab === 'right' ? 'flex w-full' : 'hidden'} lg:flex shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 flex-col h-full overflow-y-auto p-4 sm:p-5 z-20 space-y-4`}
    >
      {/* Header del Panel Derecho con Segmented Switch: DETALLES / ANÁLISIS */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 gap-2 shrink-0">
        <div className="flex-1 grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setRightMode('details')}
            className={`py-1.5 px-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              rightMode === 'details'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>DETALLES</span>
          </button>
          <button
            type="button"
            onClick={() => setRightMode('analysis')}
            className={`py-1.5 px-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
              rightMode === 'analysis'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>ANÁLISIS</span>
          </button>
        </div>

        {selectedUserCard && (
          <button
            onClick={() => setSelectedUserCard(null)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Cerrar carta seleccionada"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MODO 1: ANÁLISIS IA & PATRONES
          ═══════════════════════════════════════════════════════════════════ */}
      {rightMode === 'analysis' ? (
        <div className="space-y-3.5">
          {/* Selector de sub-vistas del Asistente IA */}
          <div className="grid grid-cols-3 p-1 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-xl gap-1 border border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setAiSubView('lane')}
              className={`py-1.5 px-1 rounded-lg text-[10.5px] font-mono font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                aiSubView === 'lane'
                  ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3 h-3 text-purple-400" />
              <span>Carril</span>
            </button>
            <button
              type="button"
              onClick={() => setAiSubView('card')}
              className={`py-1.5 px-1 rounded-lg text-[10.5px] font-mono font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                aiSubView === 'card'
                  ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Tag className="w-3 h-3 text-amber-400" />
              <span>Carta</span>
            </button>
            <button
              type="button"
              onClick={() => setAiSubView('collection')}
              className={`py-1.5 px-1 rounded-lg text-[10.5px] font-mono font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                aiSubView === 'collection'
                  ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Colección</span>
            </button>
          </div>

          {/* Sub-vistas */}
          {aiSubView === 'lane' && (
            <ContainerLaneAnalysisView
              activeCompartment={activeCompartment}
              currentLocation={currentLocation}
              location={location}
              internalDecks={internalDecks}
              activeLaneCards={activeLaneCards}
              lanePatternReport={lanePatternReport}
              activeClusterFilter={activeClusterFilter}
              setActiveClusterFilter={setActiveClusterFilter}
              expandedClusterSubId={expandedClusterSubId}
              setExpandedClusterSubId={setExpandedClusterSubId}
              onOpenAssignDeckModal={onOpenAssignDeckModal}
              onOpenPickListForCluster={onOpenPickListForCluster}
              onOpenPickListForSubArchetype={onOpenPickListForSubArchetype}
              onMoveMisplacedCard={onMoveMisplacedCard}
            />
          )}

          {aiSubView === 'card' && (
            <ContainerCardAnalysisView
              selectedUserCard={selectedUserCard}
              classificationReport={classificationReport}
              onApplyRecommendation={onApplyRecommendation}
              onAssignToDeck={onAssignToDeck}
            />
          )}

          {aiSubView === 'collection' && (
            <ContainerGlobalAnalysisView
              totalCollectionCount={totalCollectionCount}
              globalCollectionReport={globalCollectionReport}
              allDispersedCards={allDispersedCards}
              expandedClusterSubId={expandedClusterSubId}
              setExpandedClusterSubId={setExpandedClusterSubId}
              onOpenPickListForCluster={onOpenPickListForCluster}
              onOpenPickListForSubArchetype={onOpenPickListForSubArchetype}
              onOpenPickListForDispersed={onOpenPickListForDispersed}
            />
          )}
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════
            MODO 2: INSPECTOR TRADICIONAL DE DETALLES Y VARIANTES
            ═══════════════════════════════════════════════════════════════════ */
        selectedUserCard && selectedUserCard.card_details ? (
          <ContainerCardDetailsInspector
            selectedUserCard={selectedUserCard}
            locations={locations}
            location={location}
            currentCardDispersedInfo={currentCardDispersedInfo}
            totalCopiesInContainer={totalCopiesInContainer}
            detailsCopiesMode={detailsCopiesMode}
            setDetailsCopiesMode={setDetailsCopiesMode}
            isVariantsExpanded={isVariantsExpanded}
            setIsVariantsExpanded={setIsVariantsExpanded}
            activeVariants={activeVariants}
            onOpenPickListForCard={onOpenPickListForCard}
            onUpdateVariantById={onUpdateVariantById}
            onDeleteVariantById={onDeleteVariantById}
            onAddNewVariant={onAddNewVariant}
            onUpdateCard={onUpdateCard}
            onMoveCard={onMoveCard}
            onDeleteCard={onDeleteCard}
            onOpenSplitModal={onOpenSplitModal}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 dark:text-zinc-500 space-y-2">
            <Info className="w-10 h-10 mb-1 opacity-40 text-zinc-400" />
            <h4 className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
              Ninguna carta seleccionada
            </h4>
            <p className="text-[11.5px] leading-relaxed text-zinc-400 dark:text-zinc-500 max-w-xs">
              Haz clic en una carta de la cuadrícula para inspeccionar sus copias, rarezas y propiedades.
            </p>
          </div>
        )
      )}
    </div>
  );
};
