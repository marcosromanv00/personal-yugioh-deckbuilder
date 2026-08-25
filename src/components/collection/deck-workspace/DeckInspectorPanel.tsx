'use client';

import React, { useState, useMemo } from 'react';
import { 
  Edit3, 
  Info, 
  X,
  PackageCheck,
  Activity,
  BarChart3,
} from 'lucide-react';
import { StorageLocation, UserCard, SleeveInventory, DeckCardDetail, Deck } from '@/types/collection';
import { Card, DeckCard } from '@/components/deckbuilder/types';
import { DeckMetadataForm } from './DeckMetadataForm';
import { DeckCardDetailInspector } from './DeckCardDetailInspector';
import { CollectionSynergiesPanel } from '@/components/deckbuilder/components/CollectionSynergiesPanel';
import { RightDeckMode, MobileDeckTab } from './types';
import { PremiumDropdown, DropdownOption } from '@/components/ui/PremiumDropdown';
import { generateExordioDeckAnalysis, ExordioAnalysisResult } from '@/lib/engines/exordioAnalytics';
import { ExordioDeckStats } from '@/components/deckbuilder/exordio/ExordioDeckStats';
import { ExordioKeyCards } from '@/components/deckbuilder/exordio/ExordioKeyCards';
import { ExordioThreatCards } from '@/components/deckbuilder/exordio/ExordioThreatCards';
import { ExordioTestingData } from '@/components/deckbuilder/exordio/ExordioTestingData';
import { ExordioDecklistBroadcast } from '@/components/deckbuilder/exordio/ExordioDecklistBroadcast';

export type ExordioInspectorSection = 'stats' | 'key_cards' | 'threats' | 'testing' | 'decklist';

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
  mainSleeveId: string;
  setMainSleeveId: (s: string) => void;
  extraSleeveId: string;
  setExtraSleeveId: (s: string) => void;
  totalMainCount: number;
  totalSideCount: number;
  totalExtraCount: number;
  totalPoolCount: number;
  savingDeck: boolean;
  handleSaveDeck: () => void;
  onOpenNewSleeveModal: (section: 'main_side' | 'extra') => void;

  // Card Details Props
  selectedPhysicalUserCards: UserCard[];
  onChangeCardSection: (cardId: number, currentSection: string, targetSection: string) => void;
  onUpdateCardPhysicalLocation: (userCardId: string, locationId: string | null, compartmentIdx: number) => void;
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
  mainSleeveId,
  setMainSleeveId,
  extraSleeveId,
  setExtraSleeveId,
  totalMainCount,
  totalSideCount,
  totalExtraCount,
  totalPoolCount,
  savingDeck,
  handleSaveDeck,
  onOpenNewSleeveModal,

  selectedPhysicalUserCards,
  onChangeCardSection,
  onUpdateCardPhysicalLocation,
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
}) => {
  const currentBaseLocation = locations.find(l => l.id === storageLocationId);
  const [analysisSubSection, setAnalysisSubSection] = useState<ExordioInspectorSection>('stats');

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

  const analysisDropdownOptions: DropdownOption<ExordioInspectorSection>[] = [
    { value: 'stats', label: '📊 Métricas y Ratios', badge: `${exordioAnalysis.finalScore}/100` },
    { value: 'key_cards', label: '⭐ Cartas Clave y Bosses' },
    { value: 'threats', label: '⚠️ Amenazas Meta y Handtraps', badge: `${exordioAnalysis.threatCards.length}` },
    { value: 'testing', label: '🧪 Pruebas de Consistencia', badge: `${exordioAnalysis.testingData.winRatio}%` },
    { value: 'decklist', label: '📜 Ficha de Transmisión' },
  ];

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
            className={`py-1.5 px-1 rounded-lg text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
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
            className={`py-1.5 px-1 rounded-lg text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer relative ${
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
            className={`py-1.5 px-1 rounded-lg text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer relative ${
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
            className={`py-1.5 px-1 rounded-lg text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer relative ${
              rightMode === 'collection'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Sugerencias de cartas individuales y motores libres de tu colección"
          >
            <PackageCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">SINERGIAS</span>
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
          mainSleeveId={mainSleeveId}
          setMainSleeveId={setMainSleeveId}
          extraSleeveId={extraSleeveId}
          setExtraSleeveId={setExtraSleeveId}
          totalMainCount={totalMainCount}
          totalSideCount={totalSideCount}
          totalExtraCount={totalExtraCount}
          totalPoolCount={totalPoolCount}
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
            onChangeCardSection={onChangeCardSection}
            onUpdateCardPhysicalLocation={onUpdateCardPhysicalLocation}
            onUpdateUserCard={onUpdateUserCard}
            onAddPhysicalCopyForCard={onAddPhysicalCopyForCard}
            onDeleteUserCard={onDeleteUserCard}
            onRemoveCardFromDeck={onRemoveCardFromDeck}
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
        /* Modo 3: Análisis Exordio Completo con Subswitch */
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black uppercase text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 font-display">
                <Activity className="w-4 h-4 text-red-500" />
                <span>Análisis Exordio del Mazo</span>
              </h4>
              <p className="text-[11px] text-zinc-500">Métricas avanzadas, consistencia y amenazas</p>
            </div>
          </div>

          <PremiumDropdown<ExordioInspectorSection>
            options={analysisDropdownOptions}
            value={analysisSubSection}
            onChange={(val) => setAnalysisSubSection(val)}
            className="w-full"
            triggerClassName="w-full bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
            size="sm"
            menuWidth="w-full"
          />

          <div className="pt-1">
            {analysisSubSection === 'stats' && (
              <ExordioDeckStats analysis={exordioAnalysis} format={format} />
            )}
            {analysisSubSection === 'key_cards' && (
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
            {analysisSubSection === 'threats' && (
              <ExordioThreatCards threats={exordioAnalysis.threatCards} format={format} />
            )}
            {analysisSubSection === 'testing' && (
              <ExordioTestingData testingData={exordioAnalysis.testingData} />
            )}
            {analysisSubSection === 'decklist' && (
              <ExordioDecklistBroadcast analysis={exordioAnalysis} deckCards={mappedDeckCards} format={format} />
            )}
          </div>
        </div>
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
    </div>
  );
};
