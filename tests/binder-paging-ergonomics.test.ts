import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { UserCard } from '../src/types/collection';

// Lógica pura de cálculo de vistas y páginas de archivador físico
function computeBinderView(viewIndex: number, totalPages: number) {
  const totalViews = Math.max(1, Math.floor(totalPages / 2) + 1);
  const leftPageNum = viewIndex === 0 ? null : (viewIndex * 2 <= totalPages ? viewIndex * 2 : null);
  const rightPageNum = (viewIndex * 2 + 1) <= totalPages ? (viewIndex * 2 + 1) : null;
  return { totalViews, leftPageNum, rightPageNum };
}

function calculateTargetView(targetPage: number): number {
  if (targetPage <= 1) return 0;
  return Math.floor(targetPage / 2);
}

describe('Binder Paging & Physical Ergonomics Unit Suite', () => {
  it('Vista 0: Primera página izquierda es estrictamente null (Contraportada Interior sin slots) y derecha es Página 1', () => {
    const view0 = computeBinderView(0, 40);

    assert.equal(view0.leftPageNum, null, 'En vista 0, la página izquierda debe ser null (contraportada interior)');
    assert.equal(view0.rightPageNum, 1, 'En vista 0, las ranuras deben comenzar en la página 1 (derecha)');
  });

  it('Calcula correctamente el total de vistas para no truncar la última página en archivadores pares', () => {
    const totalPages = 40;
    const view0 = computeBinderView(0, totalPages);
    
    // Con 40 páginas y vista 0 ocupando sólo la pág 1 a la derecha,
    // se requieren 21 vistas (vista 0 a 20) para que la página 40 esté visible
    assert.equal(view0.totalViews, 21, 'Debe haber 21 vistas para cubrir 40 páginas completas');

    // La última vista (índice 20) debe tener la página 40 a la izquierda y contraportada trasera a la derecha
    const lastView = computeBinderView(20, totalPages);
    assert.equal(lastView.leftPageNum, 40, 'La página 40 debe situarse en la izquierda en la última vista');
    assert.equal(lastView.rightPageNum, null, 'La página derecha en la última vista es null (contraportada trasera)');
  });

  it('Calcula correctamente archivadores con número impar de páginas', () => {
    const totalPages = 9;
    const view0 = computeBinderView(0, totalPages);
    assert.equal(view0.totalViews, 5, 'Para 9 páginas debe haber 5 vistas');

    const lastView = computeBinderView(4, totalPages);
    assert.equal(lastView.leftPageNum, 8, 'Página 8 a la izquierda');
    assert.equal(lastView.rightPageNum, 9, 'Página 9 a la derecha');
  });

  it('Salto directo a página (goToPage) resuelve la vista correcta respetando el offset físico', () => {
    assert.equal(calculateTargetView(1), 0, 'Página 1 -> Vista 0');
    assert.equal(calculateTargetView(2), 1, 'Página 2 -> Vista 1');
    assert.equal(calculateTargetView(3), 1, 'Página 3 -> Vista 1');
    assert.equal(calculateTargetView(4), 2, 'Página 4 -> Vista 2');
    assert.equal(calculateTargetView(5), 2, 'Página 5 -> Vista 2');
    assert.equal(calculateTargetView(40), 20, 'Página 40 -> Vista 20');
  });

  it('Filtra cartas garantizando que ninguna carta caiga en la contraportada interior (página izquierda null)', () => {
    const sampleCards: Partial<UserCard>[] = [
      { id: 'c1', binder_page: 1, binder_slot: 1, card_id: 101 },
      { id: 'c2', binder_page: 2, binder_slot: 1, card_id: 102 },
      { id: 'c3', binder_page: 3, binder_slot: 2, card_id: 103 },
    ];

    // En vista 0:
    const view0 = computeBinderView(0, 40);
    const leftPageCards0 = !view0.leftPageNum ? [] : sampleCards.filter(c => c.binder_page === view0.leftPageNum);
    const rightPageCards0 = !view0.rightPageNum ? [] : sampleCards.filter(c => c.binder_page === view0.rightPageNum);

    assert.equal(leftPageCards0.length, 0, 'La página izquierda en vista 0 no debe tener cartas ni ranuras');
    assert.equal(rightPageCards0.length, 1, 'La página derecha en vista 0 debe contener las cartas de la pág 1');
    assert.equal(rightPageCards0[0]?.id, 'c1');

    // En vista 1:
    const view1 = computeBinderView(1, 40);
    const leftPageCards1 = !view1.leftPageNum ? [] : sampleCards.filter(c => c.binder_page === view1.leftPageNum);
    const rightPageCards1 = !view1.rightPageNum ? [] : sampleCards.filter(c => c.binder_page === view1.rightPageNum);

    assert.equal(leftPageCards1.length, 1, 'Página 2 en la izquierda de vista 1');
    assert.equal(leftPageCards1[0]?.id, 'c2');
    assert.equal(rightPageCards1.length, 1, 'Página 3 en la derecha de vista 1');
    assert.equal(rightPageCards1[0]?.id, 'c3');
  });

  it('Comportamiento de vista única para móvil: selección activa inicial según índice de vista', () => {
    const getInitialMobileSide = (viewIndex: number): 'left' | 'right' => {
      return viewIndex === 0 ? 'right' : 'left';
    };

    assert.equal(getInitialMobileSide(0), 'right', 'En vista 0 el móvil debe abrir automáticamente la pág 1 (derecha)');
    assert.equal(getInitialMobileSide(1), 'left', 'En vista 1 el móvil debe abrir la pág 2 (izquierda)');
    assert.equal(getInitialMobileSide(5), 'left', 'En vista > 0 el móvil debe abrir la izquierda');
  });
});
