'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, PackagePlus, AlertTriangle } from 'lucide-react';
import { StorageLocation, UserCard, DeckCardDetail, SleeveInventory } from '@/types/collection';
import { NewCardRegistrationForm } from './sync-modal/SyncCardFormDrawer';
import { SyncRemovedCardsSection } from './sync-modal/SyncRemovedCardsSection';
import { SyncPendingCardsList } from './sync-modal/SyncPendingCardsList';
import { CardSubstitution } from './sync-modal/SyncRegisteredCardDrawer';
import { buildSyncModalSavePayload, SyncSavePayloadData } from './sync-modal/syncModalSave.utils';
import { hasStagedCopies } from './deckWorkspacePhysical.utils';

interface DeckWorkspaceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  isActiveDeck: boolean;
  onToggleActiveDeck: (active: boolean) => void;
  pendingCards: DeckCardDetail[];
  unassignedUserCards: UserCard[];
  locations: StorageLocation[];
  availableSleeves?: SleeveInventory[];
  userCards?: UserCard[];
  mainSleeveId?: string;
  extraSleeveId?: string;
  onConfirmSave: (data: SyncSavePayloadData) => Promise<void>;
  isSaving: boolean;
}

export const DeckWorkspaceSyncModal: React.FC<DeckWorkspaceSyncModalProps> = ({
  isOpen,
  onClose,
  isActiveDeck,
  onToggleActiveDeck,
  pendingCards,
  unassignedUserCards,
  locations,
  availableSleeves = [],
  userCards = [],
  mainSleeveId,
  onConfirmSave,
  isSaving,
}) => {
  const firstUnregistered = pendingCards.find(hasStagedCopies);
  const [expandedCardId, setExpandedCardId] = useState<number | null>(
    firstUnregistered?.card_id || pendingCards[0]?.card_id || null
  );

  const [actions, setActions] = useState<Record<number, 'register' | 'ignore'>>(() => {
    const initial: Record<number, 'register' | 'ignore'> = {};
    pendingCards.forEach((c) => { initial[c.card_id] = 'register'; });
    return initial;
  });

  const [cardForms, setCardForms] = useState<Record<number, NewCardRegistrationForm>>(() => {
    const initial: Record<number, NewCardRegistrationForm> = {};
    pendingCards.forEach((c) => {
      initial[c.card_id] = { rarity: 'Common', condition: 'Near Mint', is_proxy: false, sleeve_id: 'inherit' };
    });
    return initial;
  });

  const [substitutions, setSubstitutions] = useState<Record<string, CardSubstitution>>({});
  const [additionalCopies, setAdditionalCopies] = useState<Record<number, NewCardRegistrationForm[]>>({});

  // Nombre directo de la funda del mazo por defecto
  const defaultDeckSleeveName = useMemo(() => {
    if (!mainSleeveId) return undefined;
    const sleeve = availableSleeves.find((s) => s.id === mainSleeveId);
    return sleeve?.name || undefined;
  }, [mainSleeveId, availableSleeves]);

  const handleUpdateForm = useCallback((cardId: number, fields: Partial<NewCardRegistrationForm>) => {
    setCardForms((prev) => ({
      ...prev,
      [cardId]: { ...prev[cardId], ...fields },
    }));
  }, []);

  const handleUpdateSubstitution = useCallback((userCardId: string, sub: CardSubstitution | null) => {
    setSubstitutions((prev) => {
      const next = { ...prev };
      if (sub === null) delete next[userCardId];
      else next[userCardId] = sub;
      return next;
    });
  }, []);

  const handleAddCopy = useCallback((cardId: number) => {
    setAdditionalCopies((prev) => ({
      ...prev,
      [cardId]: [
        ...(prev[cardId] || []),
        { rarity: 'Common', condition: 'Near Mint', is_proxy: false, sleeve_id: 'inherit' },
      ],
    }));
  }, []);

  if (!isOpen) return null;

  const hasIgnoredInActive = isActiveDeck && pendingCards.some((c) => hasStagedCopies(c) && actions[c.card_id] === 'ignore');

  const handleSave = async () => {
    if (hasIgnoredInActive) return;
    const payloadData = buildSyncModalSavePayload({
      pendingCards,
      actions,
      cardForms,
      substitutions,
      additionalCopies,
    });
    await onConfirmSave(payloadData);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.18 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-900 dark:text-zinc-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/60 dark:bg-zinc-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-xs">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:base uppercase tracking-wider">
                  Conciliación de Inventario Físico
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Revisa las cartas añadidas, retiradas o sustituidas para sincronizarlas con tu colección.
                </p>
              </div>
            </div>
            <button onClick={onClose} disabled={isSaving} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin">
            <SyncRemovedCardsSection unassignedUserCards={unassignedUserCards} />

            {hasIgnoredInActive && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <div className="flex-1 space-y-1">
                  <p className="font-bold">Mazo Activo: Inconsistencia Física Detectada</p>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    Un mazo físico Activo requiere que todas las cartas tengan cartón físico o proxy registrado.
                  </p>
                  <button
                    type="button"
                    onClick={() => onToggleActiveDeck(false)}
                    className="mt-1 px-3 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-[10px] font-black uppercase text-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    Guardar como Inactivo (Solo Receta)
                  </button>
                </div>
              </div>
            )}

            <SyncPendingCardsList
              pendingCards={pendingCards}
              expandedCardId={expandedCardId}
              setExpandedCardId={setExpandedCardId}
              actions={actions}
              setActions={setActions}
              cardForms={cardForms}
              onUpdateForm={handleUpdateForm}
              locations={locations}
              defaultDeckSleeveName={defaultDeckSleeveName}
              availableSleeves={availableSleeves}
              userCards={userCards}
              substitutions={substitutions}
              onUpdateSubstitution={handleUpdateSubstitution}
              onAddCopy={handleAddCopy}
            />
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 flex items-center justify-between gap-3">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer min-h-11">
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || hasIgnoredInActive}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer min-h-11 shadow-md shadow-red-600/25"
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
