'use client';

import React from 'react';
import { 
  Edit3, 
  Info, 
  X,
  PackageCheck
} from 'lucide-react';
import { StorageLocation, UserCard, SleeveInventory, DeckCardDetail, Deck } from '@/types/collection';
import { Card } from '@/components/deckbuilder/types';
import { DeckMetadataForm } from './DeckMetadataForm';
import { DeckCardDetailInspector } from './DeckCardDetailInspector';
import { CollectionSynergiesPanel } from '@/components/deckbuilder/components/CollectionSynergiesPanel';
import { RightDeckMode, MobileDeckTab } from './types';

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
  onRemoveCardFromDeck,

  allUserCards = [],
  deckCards = [],
  detectedArchetypes = [],
  inferredArchetype = 'Híbrido / Staples',
  savedDecks = [],
  onAddCardToDeck,
}) => {
  const currentBaseLocation = locations.find(l => l.id === storageLocationId);

  return (
    <div 
      style={!isMobile ? { width: `${rightPanelWidth}px` } : {}}
      className={`${mobileTab === 'right' ? 'flex w-full' : 'hidden'} lg:flex shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 flex-col h-full overflow-y-auto p-4 sm:p-5 z-20 space-y-4`}
    >
      {/* Switch Segmentado: FICHA TÉCNICA / DETALLES DE CARTA / COLECCIÓN */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 gap-2 shrink-0">
        <div className="flex-1 grid grid-cols-3 p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setRightMode('details')}
            className={`py-1.5 px-1 sm:px-2 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
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
            className={`py-1.5 px-1 sm:px-2 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer relative ${
              rightMode === 'card'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Inspeccionar detalles y copias físicas de la carta seleccionada"
          >
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">DETALLES</span>
          </button>
          <button
            type="button"
            onClick={() => setRightMode('collection')}
            className={`py-1.5 px-1 sm:px-2 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer relative ${
              rightMode === 'collection'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Sugerencias de cartas individuales y motores libres de tu colección"
          >
            <PackageCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">COLECCIÓN</span>
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

      {/* Modo 1: Ficha Técnica */}
      {rightMode === 'details' ? (
        <DeckMetadataForm
          name={name}
          setName={setName}
          format={format}
          setFormat={setFormat}
          isActive={isActive}
          setIsActive={setIsActive}
          storageLocationId={storageLocationId}
          setStorageLocationId={setStorageLocationId}
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
      ) : (
        /* Modo 3: Sugerencias y Sinergias de Colección */
        <CollectionSynergiesPanel
          allUserCards={allUserCards}
          deckCards={deckCards.map((c) => ({
            id: c.card_id,
            card_id: c.card_id,
            name: c.card_details?.name || '',
            count: c.count,
            section: c.section,
            type: c.card_details?.type || 'Monster',
            archetype: c.card_details?.archetype,
            image_url: c.card_details?.image_url,
            image_url_small: c.card_details?.image_url_small,
            card_details: c.card_details,
          }))}
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

