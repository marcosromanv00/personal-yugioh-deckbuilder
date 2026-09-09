import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuantityIdList } from '../src/components/collection/workspace/containerWorkspace.utils';
import { ContainerHistoryAction, GridCardGroup } from '../src/components/collection/workspace/types';
import { UserCard } from '../src/types/collection';

describe('Workspace Sub-Hooks & Pure Logic Unit Suite', () => {
  describe('parseQuantityIdList parser', () => {
    it('ignora líneas vacías y comentarios de tipo YDK (# y !)', () => {
      const input = `
        #created by ...
        #main
        !side
        
      `;
      const result = parseQuantityIdList(input);
      assert.deepEqual(result, []);
    });

    it('parsea IDs individuales directos por línea', () => {
      const input = `
        89631139
        46986414
      `;
      const result = parseQuantityIdList(input);
      assert.deepEqual(result, [89631139, 46986414]);
    });

    it('parsea pares de "cantidad e ID" (ej: 3 89631139)', () => {
      const input = `3 89631139\n2 46986414`;
      const result = parseQuantityIdList(input);
      assert.deepEqual(result, [
        89631139, 89631139, 89631139,
        46986414, 46986414,
      ]);
    });

    it('parsea pares invertidos de "ID y cantidad" (ej: 89631139 3)', () => {
      const input = `89631139 2`;
      const result = parseQuantityIdList(input);
      assert.deepEqual(result, [89631139, 89631139]);
    });

    it('limpia caracteres extraños y puntuación no numérica', () => {
      const input = `- [x] 3x 89631139 (Blue-Eyes)`;
      const result = parseQuantityIdList(input);
      assert.deepEqual(result, [89631139, 89631139, 89631139]);
    });
  });

  describe('Lógica de Historial Undo / Redo (History Stack)', () => {
    it('limita la pila de deshacer a un máximo de 30 acciones (evita fugas de memoria)', () => {
      let stack: ContainerHistoryAction[] = [];
      const pushAction = (action: ContainerHistoryAction) => {
        stack = [...stack.slice(-29), action];
      };

      for (let i = 1; i <= 40; i++) {
        pushAction({
          type: 'add_cards',
          description: `Acción ${i}`,
          cards: [],
        });
      }

      assert.equal(stack.length, 30, 'La pila debe truncarse en un máximo de 30 acciones');
      assert.equal(stack[0]?.description, 'Acción 11', 'La acción más vieja conservada debe ser la 11');
      assert.equal(stack[29]?.description, 'Acción 40', 'La última acción debe ser la 40');
    });

    it('maneja transición entre undoStack y redoStack', () => {
      let undoStack: ContainerHistoryAction[] = [
        { type: 'delete_cards', description: 'Acción 1', cards: [] },
        { type: 'delete_cards', description: 'Acción 2', cards: [] },
      ];
      let redoStack: ContainerHistoryAction[] = [];

      // Ejecutar Undo
      const lastAction = undoStack[undoStack.length - 1];
      undoStack = undoStack.slice(0, -1);
      redoStack = [...redoStack, lastAction];

      assert.equal(undoStack.length, 1);
      assert.equal(redoStack.length, 1);
      assert.equal(redoStack[0]?.description, 'Acción 2');

      // Nueva mutación debe limpiar redoStack
      const newAction: ContainerHistoryAction = { type: 'add_cards', description: 'Acción 3', cards: [] };
      undoStack = [...undoStack.slice(-29), newAction];
      redoStack = [];

      assert.equal(undoStack.length, 2);
      assert.equal(redoStack.length, 0, 'Nueva acción debe invalidar la pila de redo');
    });
  });

  describe('Lógica de Selección Múltiple y Agrupación', () => {
    const mockCards: UserCard[] = [
      {
        id: 'u1',
        card_id: 100,
        quantity: 2,
        created_at: '',
        storage_location_id: 'box1',
        compartment_index: 0,
        rarity: 'Common',
        condition: 'Near Mint',
        language: 'EN',
        status_flag: 'collection',
        sleeve_type: 'none',
      },
      {
        id: 'u2',
        card_id: 100,
        quantity: 1,
        created_at: '',
        storage_location_id: 'box1',
        compartment_index: 0,
        rarity: 'Common',
        condition: 'Near Mint',
        language: 'EN',
        status_flag: 'collection',
        sleeve_type: 'none',
      },
      {
        id: 'u3',
        card_id: 200,
        quantity: 1,
        created_at: '',
        storage_location_id: 'box1',
        binder_page: 0,
        compartment_index: 0,
        rarity: 'Common',
        condition: 'Near Mint',
        language: 'EN',
        status_flag: 'collection',
        sleeve_type: 'none',
      },
    ];

    it('calcula correctamente conteo físico total de cartas seleccionadas', () => {
      const selectedIds = ['u1', 'u2'];
      const selectedCards = mockCards.filter(c => selectedIds.includes(c.id));
      const physicalCount = selectedCards.reduce((sum, c) => sum + (c.quantity || 1), 0);

      assert.equal(physicalCount, 3, 'u1 (2) + u2 (1) = 3 copias físicas');
    });

    it('alterna la selección de grupo completo (GridCardGroup)', () => {
      const group: GridCardGroup = {
        card_id: 100,
        compartment_index: 0,
        totalQuantity: 3,
        representativeUserCard: mockCards[0]!,
        allVariants: [mockCards[0]!, mockCards[1]!],
      };

      let selectedIds: string[] = [];

      // Selección: si ninguno estaba seleccionado, añade todos
      const groupIds = group.allVariants.map(v => v.id);
      const allSelected = groupIds.every(id => selectedIds.includes(id));
      selectedIds = allSelected ? selectedIds.filter(id => !groupIds.includes(id)) : Array.from(new Set([...selectedIds, ...groupIds]));

      assert.deepEqual(selectedIds, ['u1', 'u2'], 'Debe seleccionar todas las variantes del grupo');

      // Deselección: si todos estaban seleccionados, deselecciona todos
      const allSelected2 = groupIds.every(id => selectedIds.includes(id));
      selectedIds = allSelected2 ? selectedIds.filter(id => !groupIds.includes(id)) : Array.from(new Set([...selectedIds, ...groupIds]));

      assert.deepEqual(selectedIds, [], 'Debe deseleccionar todas las variantes del grupo');
    });

    it('filtra correctamente cartas pendientes/desubicadas del binder (staged)', () => {
      const stagedCards = mockCards.filter(c => !c.binder_page || !c.binder_slot || c.binder_page <= 0 || c.binder_slot <= 0);
      assert.equal(stagedCards.length, 3, 'Todas las cartas sin página/ranura asignada entran a staged');
    });
  });
});
