'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserCard } from '@/types/collection';
import { TriageCardActionPayload, TriageUndoAction } from '@/types/triage';

interface UseTriageCardMutationsProps {
  onCardUpdated: (updatedCard: UserCard) => void;
  onUndoSuccess?: (restoredCard: UserCard) => void;
}

export function useTriageCardMutations({
  onCardUpdated,
  onUndoSuccess,
}: UseTriageCardMutationsProps) {
  const [undoStack, setUndoStack] = useState<TriageUndoAction[]>([]);
  const [isMutating, setIsMutating] = useState(false);

  const applyCardAction = useCallback(
    async (currentCard: UserCard, payload: TriageCardActionPayload): Promise<boolean> => {
      setIsMutating(true);
      try {
        // 1. Guardar estado previo para la pila de Undo
        const previousState: TriageUndoAction['previousCardState'] = {
          status_flag: currentCard.status_flag,
          deck_id: currentCard.deck_id,
          deck_section: currentCard.deck_section,
          storage_location_id: currentCard.storage_location_id,
          compartment_index: currentCard.compartment_index,
          rarity: currentCard.rarity,
          sale_price: currentCard.sale_price,
          notes: currentCard.notes,
        };

        // 2. Preparar campos según el destino
        let newStatusFlag = currentCard.status_flag;
        let newDeckId = currentCard.deck_id || null;
        let newDeckSection = currentCard.deck_section || null;
        const cleanNotes = (currentCard.notes || '').replace(/\[Tema:\s*[^\]]+\]\s*/gi, '').trim();
        let newNotes = cleanNotes;

        switch (payload.destinationType) {
          case 'active_deck':
            newStatusFlag = 'in_deck';
            newDeckId = payload.deckId || null;
            newDeckSection = payload.deckSection || 'main';
            newNotes = cleanNotes;
            break;
          case 'thematic_pool':
            newStatusFlag = 'collection';
            newDeckId = null;
            newDeckSection = null;
            newNotes = payload.themeTag ? `[Tema: ${payload.themeTag}] ${cleanNotes}`.trim() : cleanNotes;
            break;
          case 'workshop_salad':
            newStatusFlag = 'workshop';
            newDeckId = null;
            newDeckSection = null;
            newNotes = cleanNotes;
            break;
          case 'collection_binder':
            newStatusFlag = 'collection';
            newDeckId = null;
            newDeckSection = null;
            newNotes = cleanNotes;
            break;
          case 'trade_sale':
            newStatusFlag = 'trade_sale';
            newDeckId = null;
            newDeckSection = null;
            newNotes = cleanNotes;
            break;
          case 'bulk_discard':
            newStatusFlag = 'bulk';
            newDeckId = null;
            newDeckSection = null;
            newNotes = cleanNotes;
            break;
        }

        const updateData: Record<string, unknown> = {
          status_flag: newStatusFlag,
          deck_id: newDeckId,
          deck_section: newDeckSection,
          rarity: payload.rarity || currentCard.rarity,
          sale_price: payload.salePrice !== undefined ? payload.salePrice : currentCard.sale_price,
          notes: newNotes,
        };

        if (payload.targetLocationId !== undefined) {
          updateData.storage_location_id = payload.targetLocationId;
          updateData.compartment_index = payload.targetCompartmentIndex ?? 0;
        }

        // 3. Persistir en Supabase
        const { error } = await supabase
          .from('yg_user_cards')
          .update(updateData)
          .eq('id', currentCard.id);

        if (error) {
          console.error('Error actualizando carta en triaje:', error.message);
          return false;
        }

        // 4. Apilar acción de deshacer
        const undoItem: TriageUndoAction = {
          userCardId: currentCard.id,
          previousCardState: previousState,
          cardName: currentCard.card_details?.name || 'Carta',
          timestamp: Date.now(),
        };
        setUndoStack(prev => [undoItem, ...prev.slice(0, 29)]);

        // 5. Notificar actualización local
        const updatedUserCard: UserCard = {
          ...currentCard,
          status_flag: newStatusFlag as UserCard['status_flag'],
          deck_id: newDeckId,
          deck_section: newDeckSection as UserCard['deck_section'],
          rarity: payload.rarity || currentCard.rarity,
          sale_price: payload.salePrice !== undefined ? payload.salePrice ?? undefined : currentCard.sale_price,
          notes: newNotes,
          storage_location_id: (updateData.storage_location_id as string) ?? currentCard.storage_location_id,
          compartment_index: (updateData.compartment_index as number) ?? currentCard.compartment_index,
        };
        onCardUpdated(updatedUserCard);
        return true;
      } catch (err) {
        console.error('Fallo inesperado al clasificar carta:', err);
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [onCardUpdated]
  );

  const handleUndo = useCallback(async (): Promise<boolean> => {
    if (undoStack.length === 0) return false;
    const [actionToUndo, ...remainingStack] = undoStack;

    setIsMutating(true);
    try {
      const prev = actionToUndo.previousCardState;
      const { error } = await supabase
        .from('yg_user_cards')
        .update({
          status_flag: prev.status_flag,
          deck_id: prev.deck_id,
          deck_section: prev.deck_section,
          storage_location_id: prev.storage_location_id,
          compartment_index: prev.compartment_index,
          rarity: prev.rarity,
          sale_price: prev.sale_price,
          notes: prev.notes,
        })
        .eq('id', actionToUndo.userCardId);

      if (error) {
        console.error('Error revirtiendo carta con Undo:', error.message);
        return false;
      }

      setUndoStack(remainingStack);
      if (onUndoSuccess) {
        onUndoSuccess({
          id: actionToUndo.userCardId,
        } as UserCard);
      }
      return true;
    } catch (err) {
      console.error('Fallo revirtiendo acción:', err);
      return false;
    } finally {
      setIsMutating(false);
    }
  }, [undoStack, onUndoSuccess]);

  return {
    applyCardAction,
    handleUndo,
    canUndo: undoStack.length > 0,
    isMutating,
    lastUndoAction: undoStack[0] || null,
  };
}
