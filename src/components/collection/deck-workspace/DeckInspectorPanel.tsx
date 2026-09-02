'use client';

import React, { useState, useMemo } from 'react';
import { 
  Edit3, 
  Info, 
  X,
  PackageCheck,
  Activity,
} from 'lucide-react';
import { StorageLocation, UserCard, SleeveInventory, DeckCardDetail, Deck, SleeveCategory } from '@/types/collection';
import { Card, DeckCard } from '@/components/deckbuilder/types';
import { DeckMetadataForm } from './DeckMetadataForm';
import { DeckCardDetailInspector } from './DeckCardDetailInspector';
import { CollectionSynergiesPanel } from '@/components/deckbuilder/components/CollectionSynergiesPanel';
import { RightDeckMode, MobileDeckTab } from './types';
import { generateExordioDeckAnalysis, ExordioAnalysisResult } from '@/lib/engines/exordioAnalytics';
import { ExordioSidePanelSummary } from '@/components/deckbuilder/exordio/ExordioSidePanelSummary';
import { ExordioAnalyticsModal, ExordioModalTab } from '@/components/deckbuilder/exordio/ExordioAnalyticsModal';

interface DeckInspectorPanelProps {
  rightPanelWidth: number;
  isMobile: boolean;
  mobileTab: MobileDeckTab;
  rightMode: RightDeckMode;
  setRightMode: (m: RightDeckMode) => void;
  selectedCardDetail: DeckCardDetail | null;
  setSelectedCardDetail: (c: DeckCardDetail | null) => void;

  // Form Props
  name: string;
  setName: (s: string) => void;
  format: string;
  setFormat: (s: string) => void;
  isActive: boolean;
  setIsActive: (b: boolean) => void;
  storageLocationId: string;
  setStorageLocationId: (s: string) => void;
  compartmentIndex?: number;
  setCompartmentIndex?: (idx: number) => void;
  locations: StorageLocation[];
  availableSleeves: SleeveInventory[];

  // Main & Side Sleeves Multicapa
  mainProtection?: 'single' | 'double' | 'triple';
  setMainProtection?: (p: 'single' | 'double' | 'triple') => void;
  mainSleeveFitId?: string;
  setMainSleeveFitId?: (s: string) => void;
  mainSleeveId: string;
  setMainSleeveId: (s: string) => void;
  mainSleeveOverId?: string;
  setMainSleeveOverId?: (s: string) => void;

  // Extra Deck Sleeves Multicapa
  extraProtection?: 'single' | 'double' | 'triple';
  setExtraProtection?: (p: 'single' | 'double' | 'triple') => void;
  extraSleeveFitId?: string;
  setExtraSleeveFitId?: (s: string) => void;
  extraSleeveId: string;
  setExtraSleeveId: (s: string) => void;
  extraSleeveOverId?: string;
  setExtraSleeveOverId?: (s: string) => void;

  // Pool Sleeves Multicapa
  poolProtection?: 'single' | 'double' | 'triple';
  setPoolProtection?: (p: 'single' | 'double' | 'triple') => void;
  poolSleeveFitId?: string;
  setPoolSleeveFitId?: (s: string) => void;
  poolSleeveId?: string;
  setPoolSleeveId?: (s: string) => void;
  poolSleeveOverId?: string;
  setPoolSleeveOverId?: (s: string) => void;

  totalMainCount: number;
  totalSideCount: number;
  sideMainCount?: number;
  sideExtraCount?: number;
  totalExtraCount: number;
  totalPoolCount: number;
  mainRequiredSleeves?: number;
  extraRequiredSleeves?: number;
  poolRequiredSleeves?: number;
  savingDeck: boolean;
  handleSaveDeck: () => void;
  onOpenNewSleeveModal: (
    section: 'main_side' | 'extra' | 'pool',
    tab?: 'add_stock' | 'create',
    initialSleeveId?: string,
    suggestedQty?: number,
    sectionTotal?: number,
    initialCategory?: SleeveCategory
  ) => void;

  // Card Details Props
  selectedPhysicalUserCards: UserCard[];
  onChangeCardSection: (cardId: number, currentSection: string, targetSection: string) => void;
  onUpdateCardPhysicalLocation: (userCardId: string, locationId: string | null, compartmentIdx: number) => void;
  onRequestRelocateCard?: (userCard: UserCard, locationId: string | null, compartmentIdx: number) => void;
  onUpdateUserCard?: (userCardId: string, fields: Partial<UserCard>) => void;
  onAddPhysicalCopyForCard?: (cardId: number, isProxy?: boolean) => void;
  onDeleteUserCard?: (userCardId: string) => void;
  onRemoveCardFromDeck: (cardId: number, section: 'main' | 'extra' | 'side' | 'pool') => void;

  // Sinergias & Sugerencias de Colección
  currentDeckId?: string | null;
  allUserCards?: UserCard[];
  deckCards?: DeckCardDetail[];
  detectedArchetypes?: { name: string; count: number }[];
  inferredArchetype?: string;
  savedDecks?: Deck[];
  onAddCardToDeck?: (card: Card, section?: 'main' | 'extra' | 'side' | 'extras') => void;
  onOpenRegisterSleeveForCard?: (userCard: UserCard) => void;
}

export const DeckInspectorPanel: React.FC<DeckInspectorPanelProps> = ({
  rightPanelWidth,
  isMobile,
  mobileTab,
  rightMode,
  setRightMode,
  selectedCardDetail,
  setSelectedCardDetail,
  currentDeckId,

  name,
  setName,
  format,
  setFormat,
  isActive,
  setIsActive,
  storageLocationId,
  setStorageLocationId,
  compartmentIndex = 0,
  setCompartmentIndex,
  locations,
  availableSleeves,

  mainProtection,
  setMainProtection,
  mainSleeveFitId,
  setMainSleeveFitId,
  mainSleeveId,
  setMainSleeveId,
  mainSleeveOverId,
  setMainSleeveOverId,

  extraProtection,
  setExtraProtection,
  extraSleeveFitId,
  setExtraSleeveFitId,
  extraSleeveId,
  setExtraSleeveId,
  extraSleeveOverId,
  setExtraSleeveOverId,

  poolProtection,
  setPoolProtection,
  poolSleeveFitId,
  setPoolSleeveFitId,
  poolSleeveId,
  setPoolSleeveId,
  poolSleeveOverId,
  setPoolSleeveOverId,

  totalMainCount,
  totalSideCount,
  sideMainCount,
  sideExtraCount,
  totalExtraCount,
  totalPoolCount,
  mainRequiredSleeves,
  extraRequiredSleeves,
  poolRequiredSleeves,
  savingDeck,
  handleSaveDeck,
  onOpenNewSleeveModal,

  selectedPhysicalUserCards,
  onChangeCardSection,
  onUpdateCardPhysicalLocation,
  onRequestRelocateCard,
  onUpdateUserCard,
  onAddPhysicalCopyForCard,
  onDeleteUserCard,
  onRemoveCardFromDeck,

  allUserCards = [],
  deckCards = [],
  detectedArchetypes = [],
  inferredArchetype = 'Híbrido / Staples',
  savedDecks = [],
  onAddCardToDeck,
  onOpenRegisterSleeveForCard,
}) => {
  const currentBaseLocation = locations.find(l => l.id === storageLocationId);
  const [isExordioModalOpen, setIsExordioModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<ExordioModalTab>('stats');

  const handleOpenExordioModal = (tab: ExordioModalTab = 'stats') => {
    setModalInitialTab(tab);
    setIsExordioModalOpen(true);
  };

  // Mapear cartas de DeckCardDetail a DeckCard para el motor Exordio
  const mappedDeckCards = useMemo<DeckCard[]>(() => {
    return deckCards.map((c) => {
      const details = c.card_details;
      const validSection = c.section === 'pool' ? 'extras' : (c.section as 'main' | 'extra' | 'side' | 'extras');
      return {
        id: c.card_id,
        name: details?.name || `Carta #${c.card_id}`,
        count: c.count,
        section: validSection,
        type: details?.type || 'Monster',
        desc: details?.desc || '',
        image_url: details?.image_url || details?.image_url_small || '',
        image_url_small: details?.image_url_small || details?.image_url || '',
        archetype: details?.archetype,
        atk: details?.atk,
        def: details?.def,
        level: details?.level,
        race: details?.race,
        attribute: details?.attribute,
      };
    });
  }, [deckCards]);

  const exordioAnalysis = useMemo<ExordioAnalysisResult>(() => {
    return generateExordioDeckAnalysis(mappedDeckCards, inferredArchetype);
  }, [mappedDeckCards, inferredArchetype]);

  return (
    <div 
      style={!isMobile ? { width: `${rightPanelWidth}px` } : {}}
      className={`${mobileTab === 'right' ? 'flex w-full' : 'hidden'} lg:flex shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 flex-col h-full overflow-y-auto p-4 sm:p-5 z-20 space-y-4 pb-32`}
    >
      {/* ─── SWITCH SEGMENTADO: FICHA / DETALLES / ANÁLISIS / COLECCIÓN ─── */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 gap-2 shrink-0">
        <div className="flex-1 grid grid-cols-4 p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setRightMode('details')}
            className={`py-1.5 px-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer min-h-8 ${
              rightMode === 'details'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Ver y editar ficha técnica y fundas del mazo"
          >
            <Edit3 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">FICHA</span>
          </button>

          <button
            type="button"
            onClick={() => setRightMode('card')}
            className={`py-1.5 px-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer min-h-8 relative ${
              rightMode === 'card'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Inspeccionar detalles y copias físicas de la carta seleccionada"
          >
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">CARTA</span>
          </button>

          <button
            type="button"
            onClick={() => setRightMode('analysis')}
            className={`py-1.5 px-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer min-h-8 relative ${
              rightMode === 'analysis'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Ver métricas avanzadas y análisis Exordio del mazo"
          >
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">STATS</span>
          </button>

          <button
            type="button"
            onClick={() => setRightMode('collection')}
            className={`py-1.5 px-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer min-h-8 relative ${
              rightMode === 'collection'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Sugerencias de cartas individuales y motores libres de tu colección"
          >
            <PackageCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">SINERGIA</span>
          </button>
        </div>

        {selectedCardDetail && rightMode === 'card' && (
          <button
            onClick={() => setSelectedCardDetail(null)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Deseleccionar carta"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ─── CONTENIDO DEL MODO SELECCIONADO ─── */}
      {rightMode === 'details' ? (
        /* Modo 1: Ficha Técnica */
        <DeckMetadataForm
          deckId={currentDeckId}
          name={name}
          setName={setName}
          format={format}
          setFormat={setFormat}
          isActive={isActive}
          setIsActive={setIsActive}
          storageLocationId={storageLocationId}
          setStorageLocationId={setStorageLocationId}
          compartmentIndex={compartmentIndex}
          setCompartmentIndex={setCompartmentIndex}
          locations={locations}
          availableSleeves={availableSleeves}

          mainProtection={mainProtection}
          setMainProtection={setMainProtection}
          mainSleeveFitId={mainSleeveFitId}
          setMainSleeveFitId={setMainSleeveFitId}
          mainSleeveId={mainSleeveId}
          setMainSleeveId={setMainSleeveId}
          mainSleeveOverId={mainSleeveOverId}
          setMainSleeveOverId={setMainSleeveOverId}

          extraProtection={extraProtection}
          setExtraProtection={setExtraProtection}
          extraSleeveFitId={extraSleeveFitId}
          setExtraSleeveFitId={setExtraSleeveFitId}
          extraSleeveId={extraSleeveId}
          setExtraSleeveId={setExtraSleeveId}
          extraSleeveOverId={extraSleeveOverId}
          setExtraSleeveOverId={setExtraSleeveOverId}

          poolProtection={poolProtection}
          setPoolProtection={setPoolProtection}
          poolSleeveFitId={poolSleeveFitId}
          setPoolSleeveFitId={setPoolSleeveFitId}
          poolSleeveId={poolSleeveId}
          setPoolSleeveId={setPoolSleeveId}
          poolSleeveOverId={poolSleeveOverId}
          setPoolSleeveOverId={setPoolSleeveOverId}

          totalMainCount={totalMainCount}
          totalSideCount={totalSideCount}
          sideMainCount={sideMainCount}
          sideExtraCount={sideExtraCount}
          totalExtraCount={totalExtraCount}
          totalPoolCount={totalPoolCount}
          mainRequiredSleeves={mainRequiredSleeves}
          extraRequiredSleeves={extraRequiredSleeves}
          poolRequiredSleeves={poolRequiredSleeves}
          savingDeck={savingDeck}
          handleSaveDeck={handleSaveDeck}
          onOpenNewSleeveModal={onOpenNewSleeveModal}
        />
      ) : rightMode === 'card' ? (
        /* Modo 2: Detalles de Carta */
        selectedCardDetail ? (
          <DeckCardDetailInspector
            selectedCardDetail={selectedCardDetail}
            selectedPhysicalUserCards={selectedPhysicalUserCards}
            locations={locations}
            storageLocationId={storageLocationId}
            currentBaseLocation={currentBaseLocation}
            availableSleeves={availableSleeves}
            mainSleeveId={mainSleeveId}
            extraSleeveId={extraSleeveId}
            poolSleeveId={poolSleeveId}
            onChangeCardSection={onChangeCardSection}
            onUpdateCardPhysicalLocation={onUpdateCardPhysicalLocation}
            onRequestRelocateCard={onRequestRelocateCard}
            onUpdateUserCard={onUpdateUserCard}
            onAddPhysicalCopyForCard={onAddPhysicalCopyForCard}
            onDeleteUserCard={onDeleteUserCard}
            onRemoveCardFromDeck={onRemoveCardFromDeck}
            onOpenRegisterSleeveForCard={onOpenRegisterSleeveForCard}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 dark:text-zinc-500 space-y-2">
            <Info className="w-10 h-10 mb-1 opacity-40 text-zinc-400" />
            <h4 className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
              Ninguna carta seleccionada
            </h4>
            <p className="text-[11.5px] leading-relaxed text-zinc-400 dark:text-zinc-500 max-w-xs">
              Haz clic en cualquier carta de la cuadrícula para inspeccionar sus copias físicas, moverla de sección o asignarle una ubicación física separada.
            </p>
          </div>
        )
      ) : rightMode === 'analysis' ? (
        /* Modo 3: Hub Táctico Exordio con Modal Flotante */
        <ExordioSidePanelSummary
          analysis={exordioAnalysis}
          format={format}
          onOpenModal={handleOpenExordioModal}
        />
      ) : (
        /* Modo 4: Sugerencias y Sinergias de Colección */
        <CollectionSynergiesPanel
          allUserCards={allUserCards}
          deckCards={mappedDeckCards}
          detectedArchetypes={detectedArchetypes}
          inferredArchetype={inferredArchetype}
          locations={locations}
          savedDecks={savedDecks}
          currentDeckId={currentDeckId}
          onAddCardToDeck={onAddCardToDeck}
        />
      )}

      {/* ─── MODAL FLOTANTE DE ANÁLISIS EXORDIO COMPLETO ─── */}
      <ExordioAnalyticsModal
        isOpen={isExordioModalOpen}
        onClose={() => setIsExordioModalOpen(false)}
        deckCards={mappedDeckCards}
        inferredArchetype={inferredArchetype}
        format={format}
        initialTab={modalInitialTab}
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
    </div>
  );
};

