'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, PackagePlus, AlertTriangle, ArrowLeft } from 'lucide-react';
import { StorageLocation, UserCard, DeckCardDetail, SleeveInventory } from '@/types/collection';
import { SyncSavePayloadData } from './sync-modal/syncModalSave.utils';
import { SectionSleeveConfigs, getCardEntryKey } from './sync-modal/syncModalSectionSleeves.utils';
import { useDeckWorkspaceSyncModalState } from './sync-modal/useDeckWorkspaceSyncModalState';
import { SyncMasterCardList } from './sync-modal/SyncMasterCardList';
import { SyncDetailPanel } from './sync-modal/SyncDetailPanel';

interface DeckWorkspaceSyncModalProps extends SectionSleeveConfigs {
  isOpen: boolean;
  onClose: () => void;
  isActiveDeck: boolean;
  onToggleActiveDeck: (active: boolean) => void;
  pendingCards: DeckCardDetail[];
  unassignedUserCards: UserCard[];
  locations: StorageLocation[];
  storageLocationId?: string | null;
  compartmentIndex?: number | null;
  availableSleeves?: SleeveInventory[];
  userCards?: UserCard[];
  onOpenNewSleeveModal?: () => void;
  onConfirmSave: (data: SyncSavePayloadData) => Promise<void>;
  isSaving: boolean;
}

export const DeckWorkspaceSyncModal: React.FC<DeckWorkspaceSyncModalProps> = (props) => {
  const {
    isOpen, onClose, isActiveDeck, onToggleActiveDeck, pendingCards,
    unassignedUserCards, locations, storageLocationId, compartmentIndex,
    availableSleeves = [], userCards = [], onOpenNewSleeveModal, onConfirmSave, isSaving,
    ...sleeveConfigs
  } = props;

  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const state = useDeckWorkspaceSyncModalState({
    pendingCards,
    storageLocationId,
    compartmentIndex,
    availableSleeves,
    isActiveDeck,
    onConfirmSave,
    ...sleeveConfigs,
  });

  if (!isOpen) return null;

  const activeCard = pendingCards.find((c) => getCardEntryKey(c) === state.selectedCardKey) || pendingCards[0] || null;
  const activeCardKey = activeCard ? getCardEntryKey(activeCard) : '';
  const activeCopyIdx = (activeCardKey && state.selectedCopyIndex[activeCardKey]) || 0;
  const sleevesInfo = activeCard ? state.getSectionSleevesInfoForCard(activeCard) : null;
  const handleSelectCard = (key: string) => {
    state.setSelectedCardKey(key);
    setMobileDetailOpen(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.18 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col h-[90vh] text-zinc-900 dark:text-zinc-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 sm:px-7 sm:py-4.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-950/70 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-xs">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider">Conciliación de Inventario Físico</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{pendingCards.length} cartas en mazo • Panel de configuración por copia física</p>
              </div>
            </div>
            <button onClick={onClose} disabled={isSaving} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 2-Panel Master-Detail Layout */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Left: Master List */}
            <div className={`lg:col-span-5 h-full min-h-0 flex flex-col ${mobileDetailOpen ? 'hidden lg:flex' : 'flex'}`}>
              <SyncMasterCardList cards={pendingCards} selectedCardKey={activeCardKey} onSelectCard={handleSelectCard} unassignedUserCards={unassignedUserCards} cardsWithStockErrors={state.sleeveStockErrors.cardKeysWithErrors} />
            </div>

            {/* Right: Detail Workspace */}
            <div className={`lg:col-span-7 h-full min-h-0 flex-col overflow-y-auto bg-white dark:bg-zinc-900 scrollbar-thin ${mobileDetailOpen ? 'flex' : 'hidden lg:flex'}`}>
              {mobileDetailOpen && (
                <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 lg:hidden flex items-center gap-2">
                  <button type="button" onClick={() => setMobileDetailOpen(false)} className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver a la lista</span>
                  </button>
                </div>
              )}

              <SyncDetailPanel
                card={activeCard}
                copyForms={state.copyForms}
                selectedCopyIndex={activeCopyIdx}
                onSelectCopyIndex={(idx) => { if (activeCardKey) state.setSelectedCopyIndex((prev) => ({ ...prev, [activeCardKey]: idx })); }}
                onUpdateCopyForm={state.handleUpdateCopyForm}
                onCopyConfigToAll={state.handleCopyConfigToAll}
                locations={locations}
                storageLocationId={storageLocationId}
                compartmentIndex={compartmentIndex}
                defaultDeckFitSleeveName={sleevesInfo?.fitName}
                defaultDeckFitId={sleevesInfo?.fitId}
                defaultDeckSleeveName={sleevesInfo?.regularName}
                defaultDeckRegularId={sleevesInfo?.regularId}
                defaultDeckOverSleeveName={sleevesInfo?.overName}
                defaultDeckOverId={sleevesInfo?.overId}
                availableSleeves={availableSleeves}
                userCards={userCards}
                substitutions={state.substitutions}
                onUpdateSubstitution={state.handleUpdateSubstitution}
                onAddCopy={state.handleAddCopy}
                onOpenNewSleeveModal={onOpenNewSleeveModal}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 sm:px-7 sm:py-4.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 flex items-center justify-between gap-4 shrink-0 flex-wrap">
            {state.hasIgnoredInActive ? (
              <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Mazo activo con copias sin registrar.</span>
                <button type="button" onClick={() => onToggleActiveDeck(false)} className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-[10.5px] font-bold uppercase cursor-pointer">Guardar como Inactivo</button>
              </div>
            ) : state.sleeveStockErrors.hasErrors ? (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Stock insuficiente en fundas: {state.sleeveStockErrors.errorSummary.slice(0, 1).join(', ')}</span>
              </div>
            ) : (
              <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer min-h-11">Cancelar</button>
            )}

            <button
              type="button"
              onClick={state.handleSave}
              disabled={isSaving || state.hasIgnoredInActive}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer min-h-11 shadow-md shadow-red-600/25 ml-auto"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirmar y Guardar Mazo</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
