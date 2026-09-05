'use client';

import React from 'react';
import Image from 'next/image';
import { Layers, Copy } from 'lucide-react';
import { DeckCardDetail, StorageLocation, SleeveInventory, UserCard } from '@/types/collection';
import { SyncCardFormDrawer, NewCardRegistrationForm } from './SyncCardFormDrawer';
import { SyncRegisteredCardDrawer, CardSubstitution } from './SyncRegisteredCardDrawer';
import { countStagedCopies } from '../deckWorkspacePhysical.utils';
import { getCardEntryKey } from './syncModalSectionSleeves.utils';

interface SyncDetailPanelProps {
  card: DeckCardDetail | null;
  copyForms: Record<string, NewCardRegistrationForm>;
  selectedCopyIndex: number;
  onSelectCopyIndex: (index: number) => void;
  onUpdateCopyForm: (cardKey: string, copyIndex: number, fields: Partial<NewCardRegistrationForm>) => void;
  onCopyConfigToAll: (cardKey: string, sourceCopyIndex: number) => void;
  locations?: StorageLocation[];
  storageLocationId?: string | null;
  compartmentIndex?: number | null;
  defaultDeckFitSleeveName?: string;
  defaultDeckFitId?: string | null;
  defaultDeckSleeveName?: string;
  defaultDeckRegularId?: string | null;
  defaultDeckOverSleeveName?: string;
  defaultDeckOverId?: string | null;
  availableSleeves?: SleeveInventory[];
  userCards?: UserCard[];
  substitutions: Record<string, CardSubstitution>;
  onUpdateSubstitution: (userCardId: string, sub: CardSubstitution | null) => void;
  onAddCopy: (cardKey: string) => void;
  onOpenNewSleeveModal?: () => void;
}

export const SyncDetailPanel: React.FC<SyncDetailPanelProps> = ({
  card, copyForms, selectedCopyIndex, onSelectCopyIndex, onUpdateCopyForm, onCopyConfigToAll,
  locations = [], storageLocationId, compartmentIndex = 0,
  defaultDeckFitSleeveName, defaultDeckFitId, defaultDeckSleeveName, defaultDeckRegularId,
  defaultDeckOverSleeveName, defaultDeckOverId,
  availableSleeves = [], userCards = [], substitutions,
  onUpdateSubstitution, onAddCopy, onOpenNewSleeveModal,
}) => {
  if (!card) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-400">
        <Layers className="w-10 h-10 mb-3 opacity-30" />
        <h4 className="font-bold text-sm text-zinc-600 dark:text-zinc-300">Ninguna carta seleccionada</h4>
        <p className="text-xs text-zinc-400 max-w-xs mt-1">
          Selecciona una carta en la lista de la izquierda para configurar sus rarezas, fundas y ubicación.
        </p>
      </div>
    );
  }

  const cardKey = getCardEntryKey(card);
  const stagedCount = countStagedCopies(card);
  const registeredCount = card.physical_copies?.length || 0;
  const imageUrl = card.card_details?.image_url_small || card.card_details?.image_url;
  const availableCopies = userCards.filter(
    (c) => c.card_id === card.card_id && !c.deck_id && c.status_flag === 'collection'
  );

  const activeCopyIdx = Math.min(selectedCopyIndex, Math.max(0, stagedCount - 1));
  const currentFormKey = `${cardKey}_${activeCopyIdx}`;
  const currentForm = copyForms[currentFormKey] || copyForms[`${card.card_id}_${activeCopyIdx}`] || {
    mode: 'new',
    rarity: 'Common',
    condition: 'Near Mint',
    is_proxy: false,
  };

  return (
    <div className="p-5 sm:p-6 md:p-7 space-y-5">
      {/* Active Card Header */}
      <div className="flex items-start gap-3.5 p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-950/60 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="w-12 h-17 relative rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-300 dark:border-zinc-700 shadow-xs">
          {imageUrl ? (
            <Image src={imageUrl} alt={card.card_details?.name || ''} fill sizes="48px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">?</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate">
            {card.card_details?.name}
          </h3>
          <p className="text-[11px] text-zinc-500 truncate mt-0.5">
            {card.card_details?.type} • {card.card_details?.race || 'Yu-Gi-Oh!'}
          </p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 uppercase">
              {card.section === 'main' ? 'Main Deck' : card.section === 'extra' ? 'Extra Deck' : card.section === 'side' ? 'Side Deck' : 'Reserva'}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              Total: {card.count} ({registeredCount} reg. / {stagedCount} pend.)
            </span>
          </div>
        </div>
      </div>

      {/* Pending Physical Copies Configuration */}
      {stagedCount > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-mono font-black uppercase text-zinc-700 dark:text-zinc-300">
              Copias Físicas por Conciliar ({stagedCount})
            </span>

            {stagedCount > 1 && (
              <button
                type="button"
                onClick={() => onCopyConfigToAll(cardKey, activeCopyIdx)}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[10.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Aplica la rareza, condición y fundas de esta copia a todas las demás copias pendientes"
              >
                <Copy className="w-3 h-3 text-red-500" />
                <span>Copiar config a todas</span>
              </button>
            )}
          </div>

          {/* Segmented Per-Copy Tabs */}
          {stagedCount > 1 && (
            <div className="flex gap-1.5 overflow-x-auto p-1 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {Array.from({ length: stagedCount }).map((_, idx) => {
                const isSelected = activeCopyIdx === idx;
                const formKey = `${cardKey}_${idx}`;
                const form = copyForms[formKey] || copyForms[`${card.card_id}_${idx}`];
                const rarityLabel = form?.rarity ? form.rarity.slice(0, 3) : 'Com';

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectCopyIndex(idx)}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>Copia {idx + 1} de {stagedCount}</span>
                    <span className={`text-[9.5px] px-1 rounded font-mono ${isSelected ? 'bg-red-700 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                      {rarityLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Form for Active Copy */}
          <SyncCardFormDrawer
            cardId={card.card_id}
            form={currentForm}
            onChange={(fields) => onUpdateCopyForm(cardKey, activeCopyIdx, fields)}
            locations={locations}
            defaultDeckFitSleeveName={defaultDeckFitSleeveName}
            defaultDeckFitId={defaultDeckFitId}
            defaultDeckSleeveName={defaultDeckSleeveName}
            defaultDeckRegularId={defaultDeckRegularId}
            defaultDeckOverSleeveName={defaultDeckOverSleeveName}
            defaultDeckOverId={defaultDeckOverId}
            defaultStorageLocationId={storageLocationId}
            defaultCompartmentIndex={compartmentIndex}
            availableSleeves={availableSleeves}
            availableCopies={availableCopies}
            onOpenNewSleeveModal={onOpenNewSleeveModal}
          />
        </div>
      )}

      {/* Registered Physical Copies Section */}
      {registeredCount > 0 && (
        <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <SyncRegisteredCardDrawer
            card={card}
            locations={locations}
            defaultDeckSleeveName={defaultDeckSleeveName}
            availableSleeves={availableSleeves}
            availableCopies={availableCopies}
            substitutions={substitutions}
            onUpdateSubstitution={onUpdateSubstitution}
            onAddCopy={() => onAddCopy(cardKey)}
          />
        </div>
      )}
    </div>
  );
};
