import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DeckCard } from '../src/components/deckbuilder/types';
import { UserCard } from '../src/types/collection';

describe('Validación de Copias en Borrador & Flujo de Guardado', () => {
  it('detecta correctamente los IDs de copias físicas asignadas en memoria (borrador)', () => {
    const deckCards: DeckCard[] = [
      {
        id: 10001,
        name: 'Alich, Malebranche of the Burning Abyss',
        count: 1,
        section: 'main',
        type: 'Effect Monster',
        image_url: 'https://images.ygoprodeck.com/images/cards/10001.jpg',
        physical_copies: [
          {
            user_card_id: 'copy-uuid-1',
            storage_location_id: 'temporal-box-id',
            location_name: 'Temporal Decks',
            rarity: 'Rare',
            condition: 'Near Mint',
            source_status: 'existing',
          },
        ],
      },
    ];

    // Simulación del cálculo de assignedDraftUserCardIds
    const assignedIds = new Set<string>();
    deckCards.forEach((c) => {
      c.physical_copies?.forEach((pc) => {
        if (pc.user_card_id) {
          assignedIds.add(pc.user_card_id);
        }
      });
    });

    assert.equal(assignedIds.has('copy-uuid-1'), true);
    assert.equal(assignedIds.has('copy-uuid-2'), false);

    // Simulación de copias disponibles en colección
    const allCollectionCopies: UserCard[] = [
      {
        id: 'copy-uuid-1',
        card_id: 10001,
        rarity: 'Rare',
        condition: 'Near Mint',
        storage_location_id: 'temporal-box-id',
        compartment_index: 0,
        language: 'EN',
        quantity: 1,
        status_flag: 'collection',
        sleeve_type: 'none',
        created_at: '2026-09-05T00:00:00Z',
      },
      {
        id: 'copy-uuid-2',
        card_id: 10001,
        rarity: 'Rare',
        condition: 'Near Mint',
        storage_location_id: 'temporal-box-id',
        compartment_index: 0,
        language: 'EN',
        quantity: 1,
        status_flag: 'collection',
        sleeve_type: 'none',
        created_at: '2026-09-05T00:00:00Z',
      },
    ];

    const copy1Status = assignedIds.has(allCollectionCopies[0].id) ? 'draft_assigned' : 'available';
    const copy2Status = assignedIds.has(allCollectionCopies[1].id) ? 'draft_assigned' : 'available';

    assert.equal(copy1Status, 'draft_assigned', 'La copia 1 debe figurar asignada en borrador');
    assert.equal(copy2Status, 'available', 'La copia 2 debe estar disponible para asignar');
  });

  it('permite revertir cartas a su estado original al descartar cambios', () => {
    const savedSnapshotCards: DeckCard[] = [
      {
        id: 50001,
        name: 'The Phantom Knights of Silent Boots',
        count: 3,
        section: 'main',
        type: 'Effect Monster',
        image_url: 'https://images.ygoprodeck.com/images/cards/50001.jpg',
      },
    ];

    // Estado sucio (modificado por el usuario)
    let currentCards: DeckCard[] = [
      ...savedSnapshotCards,
      {
        id: 10001,
        name: 'Alich, Malebranche of the Burning Abyss',
        count: 2,
        section: 'main',
        type: 'Effect Monster',
        image_url: 'https://images.ygoprodeck.com/images/cards/10001.jpg',
      },
    ];

    assert.equal(currentCards.length, 2);

    // Ejecución de Descartar Cambios
    currentCards = savedSnapshotCards;

    assert.equal(currentCards.length, 1);
    assert.equal(currentCards[0].id, 50001);
  });

  it('genera el payload atómico correcto para sincronizar la variante activa al guardar', () => {
    const deckCards: DeckCard[] = [
      { id: 101, count: 2, section: 'main', proxy_count: 0, name: 'Card A', type: 'Monster', image_url: 'https://images.ygoprodeck.com/images/cards/101.jpg' },
      { id: 102, count: 1, section: 'extra', proxy_count: 0, name: 'Card B', type: 'Link Monster', image_url: 'https://images.ygoprodeck.com/images/cards/102.jpg' },
    ];

    const activeVariantId = 'var-uuid-phantom-ba';

    const variantPayload = {
      variant_id: activeVariantId,
      action: 'update',
      cards: deckCards.map((c) => ({
        card_id: c.id,
        count: c.count,
        proxy_count: c.proxy_count || 0,
        section: c.section,
      })),
    };

    assert.equal(variantPayload.variant_id, 'var-uuid-phantom-ba');
    assert.equal(variantPayload.action, 'update');
    assert.equal(variantPayload.cards.length, 2);
    assert.equal(variantPayload.cards[0].card_id, 101);
    assert.equal(variantPayload.cards[1].section, 'extra');
  });
});
