import { ContainerHistoryAction } from '../types';

export async function syncHistoryActionApi(action: ContainerHistoryAction, direction: 'undo' | 'redo'): Promise<void> {
  if (action.type === 'add_cards') {
    if (direction === 'undo') {
      const ids = action.cards.map(c => c.id);
      await fetch('/api/collection/cards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
    } else {
      await fetch('/api/collection/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: action.cards }),
      });
    }
  } else if (action.type === 'delete_cards') {
    if (direction === 'undo') {
      await fetch('/api/collection/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: action.cards }),
      });
    } else {
      const ids = action.cards.map(c => c.id);
      await fetch('/api/collection/cards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
    }
  } else if (action.type === 'update_cards') {
    const targetCards = direction === 'undo' ? action.prevCards : action.newCards;
    for (const card of targetCards) {
      await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: card.id,
          quantity: card.quantity,
          condition: card.condition,
          status_flag: card.status_flag,
          sleeve_type: card.sleeve_type,
          sleeve_brand: card.sleeve_brand,
          sleeve_color: card.sleeve_color,
          sleeve_condition: card.sleeve_condition,
          rarity: card.rarity,
          notes: card.notes,
          is_favorite: card.is_favorite,
          deck_id: card.deck_id,
          deck_section: card.deck_section,
          compartment_index: card.compartment_index,
          binder_page: card.binder_page,
          binder_slot: card.binder_slot,
        }),
      });
    }
  } else if (action.type === 'move_cards') {
    for (const item of action.items) {
      const isUndo = direction === 'undo';
      const locId = isUndo ? item.prevLocationId : item.newLocationId;
      const comp = isUndo ? item.prevCompartment : item.newCompartment;
      const page = isUndo ? item.prevPage : item.newPage;
      const slot = isUndo ? item.prevSlot : item.newSlot;
      const card = isUndo ? item.prevCard : item.newCard;

      await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          storage_location_id: locId,
          compartment_index: comp ?? 0,
          binder_page: page ?? null,
          binder_slot: slot ?? null,
          deck_id: card.deck_id ?? null,
          deck_section: card.deck_section ?? null,
          status_flag: card.status_flag || 'collection',
        }),
      });
    }
  }
}
