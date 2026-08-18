'use client';

import React from 'react';
import { 
  Box, 
  Trash2 
} from 'lucide-react';
import { StorageLocation, UserCard, DeckCardDetail } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

interface DeckCardDetailInspectorProps {
  selectedCardDetail: DeckCardDetail;
  selectedPhysicalUserCards: UserCard[];
  locations: StorageLocation[];
  storageLocationId: string;
  currentBaseLocation?: StorageLocation;
  onChangeCardSection: (cardId: number, currentSection: string, targetSection: string) => void;
  onUpdateCardPhysicalLocation: (userCardId: string, locationId: string | null, compartmentIdx: number) => void;
  onRemoveCardFromDeck: (cardId: number, section: 'main' | 'extra' | 'side' | 'pool') => void;
}

export const DeckCardDetailInspector: React.FC<DeckCardDetailInspectorProps> = ({
  selectedCardDetail,
  selectedPhysicalUserCards,
  locations,
  storageLocationId,
  currentBaseLocation,
  onChangeCardSection,
  onUpdateCardPhysicalLocation,
  onRemoveCardFromDeck,
}) => {
  return (
    <div className="space-y-4">
      {/* Vista Previa de la Carta */}
      <div className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 shadow-2xs">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedCardDetail.card_details?.image_url_small || selectedCardDetail.card_details?.image_url}
            alt={selectedCardDetail.card_details?.name || 'Carta'}
            className="w-16 h-24 object-cover rounded-lg shadow-sm shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 leading-tight">
              {selectedCardDetail.card_details?.name}
            </h4>
            <span className="text-[10px] font-mono text-zinc-500 block mt-0.5">
              {selectedCardDetail.card_details?.type}
            </span>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {selectedCardDetail.count} Copias en {selectedCardDetail.section.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cambiar Sección en el Deck */}
      <div className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 shadow-2xs">
        <label className="text-[10.5px] font-mono font-black uppercase text-zinc-700 dark:text-zinc-300 block">
          Sección en el Deck:
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onChangeCardSection(selectedCardDetail.card_id, selectedCardDetail.section, 'main')}
            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCardDetail.section === 'main'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            ⚔️ Main Deck
          </button>
          <button
            type="button"
            onClick={() => onChangeCardSection(selectedCardDetail.card_id, selectedCardDetail.section, 'extra')}
            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCardDetail.section === 'extra'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            🔮 Extra Deck
          </button>
          <button
            type="button"
            onClick={() => onChangeCardSection(selectedCardDetail.card_id, selectedCardDetail.section, 'side')}
            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCardDetail.section === 'side'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            🛡️ Side Deck
          </button>
          <button
            type="button"
            onClick={() => onChangeCardSection(selectedCardDetail.card_id, selectedCardDetail.section, 'pool')}
            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCardDetail.section === 'pool'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            📦 Cartas Extra / Pool
          </button>
        </div>
      </div>

      {/* Ubicación Física Específica de esta Carta */}
      <div className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2.5 shadow-2xs">
        <span className="text-[10.5px] font-mono font-black uppercase text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
          <Box className="w-3.5 h-3.5 text-cyan-500" />
          <span>Ubicación Física de esta Carta:</span>
        </span>

        {selectedPhysicalUserCards.length === 0 ? (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            Esta carta no tiene copias físicas registradas en tu inventario.
          </p>
        ) : (
          <div className="space-y-2">
            {selectedPhysicalUserCards.map((uc, i) => {
              const currentCardLoc = uc.storage_location_id ? locations.find(l => l.id === uc.storage_location_id) : null;
              return (
                <div key={uc.id} className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      Copia #{i + 1} ({uc.rarity})
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {currentCardLoc ? currentCardLoc.name : (currentBaseLocation?.name || 'En Deckbox')}
                    </span>
                  </div>
                  <PremiumDropdown
                    value={uc.storage_location_id || ''}
                    onChange={(val) => onUpdateCardPhysicalLocation(uc.id, val || null, 0)}
                    align="full"
                    size="xs"
                    options={[
                      { value: '', label: `📦 Ubicación Base del Deck (${currentBaseLocation?.name || 'Deckbox'})` },
                      ...locations.map((l) => ({
                        value: l.id,
                        label: `📁 ${l.name} (${l.type})`,
                      })),
                    ]}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quitar Carta del Deck */}
      <button
        type="button"
        onClick={() => onRemoveCardFromDeck(selectedCardDetail.card_id, selectedCardDetail.section as 'main' | 'extra' | 'side' | 'pool')}
        className="w-full py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Quitar 1 Copia del Deck</span>
      </button>
    </div>
  );
};
