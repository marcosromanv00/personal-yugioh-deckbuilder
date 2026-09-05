import { DeckCardDetail } from '@/types/collection';
import { NewCardRegistrationForm } from './SyncCardFormDrawer';
import { CardSubstitution } from './SyncRegisteredCardDrawer';
import { countStagedCopies } from '../deckWorkspacePhysical.utils';

export interface SyncSavePayloadData {
  inventoryCardsToAdd: Array<{
    id: number;
    count: number;
    rarity: string;
    condition: string;
    is_proxy: boolean;
    section: string;
    sleeve_id?: string | null;
    sleeve_type?: 'none' | 'single' | 'double' | 'triple';
    sleeve_fit_id?: string | null;
    sleeve_regular_id?: string | null;
    sleeve_over_id?: string | null;
    sleeve_action?: 'deduct' | 'add';
    sleeve_fit_action?: 'deduct' | 'add';
    sleeve_regular_action?: 'deduct' | 'add';
    sleeve_over_action?: 'deduct' | 'add';
    storage_location_id?: string | null;
    compartment_index?: number | null;
  }>;
  deletedUserCardIds: string[];
  relocatedUserCards: Array<{
    id: string;
    storage_location_id: string | null;
    compartment_index?: number | null;
  }>;
  additionalAssignedIds: string[];
}

interface BuildSyncSaveParams {
  pendingCards: DeckCardDetail[];
  actions: Record<string | number, 'register' | 'ignore'>;
  cardForms?: Record<number, NewCardRegistrationForm>;
  copyForms?: Record<string, NewCardRegistrationForm>;
  substitutions: Record<string, CardSubstitution>;
  additionalCopies: Record<number | string, NewCardRegistrationForm[]>;
}

export function buildSyncModalSavePayload(params: BuildSyncSaveParams): SyncSavePayloadData {
  const { pendingCards, actions, cardForms = {}, copyForms = {}, substitutions, additionalCopies } = params;

  const inventoryCardsToAdd: SyncSavePayloadData['inventoryCardsToAdd'] = [];
  const deletedUserCardIds: string[] = [];
  const relocatedUserCards: SyncSavePayloadData['relocatedUserCards'] = [];
  const additionalAssignedIds: string[] = [];

  // 1. Cartas pendientes sin registrar
  pendingCards.forEach((card) => {
    const cardKey = `${card.card_id}_${card.section}`;
    const action = actions[cardKey] ?? actions[card.card_id] ?? 'register';
    if (action === 'register') {
      const needed = countStagedCopies(card);
      if (needed > 0) {
        for (let i = 0; i < needed; i++) {
          const copyKey = `${cardKey}_${i}`;
          const fallbackKey = `${card.card_id}_${i}`;
          const form = copyForms[copyKey] || copyForms[fallbackKey] || cardForms[card.card_id] || { rarity: 'Common', condition: 'Near Mint', is_proxy: false };
          if (form.mode === 'take_existing' && form.selected_user_card_id) {
            additionalAssignedIds.push(form.selected_user_card_id);
          } else {
            inventoryCardsToAdd.push({
              id: card.card_id,
              count: 1,
              rarity: form.rarity,
              condition: form.condition || 'Near Mint',
              is_proxy: form.is_proxy,
              section: (card.section === 'pool' || card.section === 'extras') ? 'extras' : card.section,
              sleeve_id: form.sleeve_id === 'inherit' ? undefined : (form.sleeve_id || undefined),
              sleeve_type: form.sleeve_type || 'none',
              sleeve_fit_id: form.sleeve_fit_id || null,
              sleeve_regular_id: form.sleeve_regular_id || (form.sleeve_id && form.sleeve_id !== 'none' && form.sleeve_id !== 'inherit' ? form.sleeve_id : null),
              sleeve_over_id: form.sleeve_over_id || null,
              sleeve_action: form.sleeve_action || 'deduct',
              sleeve_fit_action: form.sleeve_fit_action || form.sleeve_action || 'deduct',
              sleeve_regular_action: form.sleeve_regular_action || form.sleeve_action || 'deduct',
              sleeve_over_action: form.sleeve_over_action || form.sleeve_action || 'deduct',
              storage_location_id: form.storage_location_id !== undefined ? form.storage_location_id : undefined,
              compartment_index: form.compartment_index !== undefined ? form.compartment_index : undefined,
            });
          }
        }
      }
    }
  });

  // 2. Sustituciones y mejoras de cartas registradas
  Object.values(substitutions).forEach((sub) => {
    if (!sub.outgoingUserCardId.startsWith('placeholder-')) {
      if (sub.destinationType === 'delete') {
        deletedUserCardIds.push(sub.outgoingUserCardId);
      } else {
        relocatedUserCards.push({
          id: sub.outgoingUserCardId,
          storage_location_id: sub.destinationType === 'location' ? sub.targetLocationId || null : null,
        });
      }
    }

    if (sub.incomingMode === 'take_existing' && sub.incomingUserCardId) {
      additionalAssignedIds.push(sub.incomingUserCardId);
    } else {
      const parentCard = pendingCards.find((c) =>
        c.physical_copies?.some((cp) => cp.user_card_id === sub.outgoingUserCardId)
      );
      if (parentCard) {
        inventoryCardsToAdd.push({
          id: parentCard.card_id,
          count: 1,
          rarity: sub.incomingRarity,
          condition: sub.incomingCondition || 'Near Mint',
          is_proxy: sub.incomingIsProxy,
          section: (parentCard.section === 'pool' || parentCard.section === 'extras') ? 'extras' : parentCard.section,
          sleeve_id: sub.incomingSleeveId === 'inherit' ? undefined : (sub.incomingSleeveId || undefined),
        });
      }
    }
  });

  // 3. Copias adicionales añadidas manualmente
  Object.entries(additionalCopies).forEach(([cardIdStr, forms]) => {
    const cardId = Number(cardIdStr);
    const parentCard = pendingCards.find((c) => c.card_id === cardId);
    const section = parentCard ? (parentCard.section === 'pool' || parentCard.section === 'extras' ? 'extras' : parentCard.section) : 'main';

    forms.forEach((form) => {
      inventoryCardsToAdd.push({
        id: cardId,
        count: 1,
        rarity: form.rarity || 'Common',
        condition: form.condition || 'Near Mint',
        is_proxy: Boolean(form.is_proxy),
        section,
        sleeve_id: form.sleeve_id === 'inherit' ? undefined : (form.sleeve_id || undefined),
        sleeve_type: form.sleeve_type || 'none',
        sleeve_fit_id: form.sleeve_fit_id || null,
        sleeve_regular_id: form.sleeve_regular_id || (form.sleeve_id && form.sleeve_id !== 'none' && form.sleeve_id !== 'inherit' ? form.sleeve_id : null),
        sleeve_over_id: form.sleeve_over_id || null,
        sleeve_action: form.sleeve_action || 'deduct',
        sleeve_fit_action: form.sleeve_fit_action || form.sleeve_action || 'deduct',
        sleeve_regular_action: form.sleeve_regular_action || form.sleeve_action || 'deduct',
        sleeve_over_action: form.sleeve_over_action || form.sleeve_action || 'deduct',
        storage_location_id: form.storage_location_id !== undefined ? form.storage_location_id : undefined,
        compartment_index: form.compartment_index !== undefined ? form.compartment_index : undefined,
      });
    });
  });

  return {
    inventoryCardsToAdd,
    deletedUserCardIds,
    relocatedUserCards,
    additionalAssignedIds,
  };
}
