import { useMemo, useState, useCallback } from 'react';
import { StorageLocation, UserCard } from '@/types/collection';

export interface UseContainerBinderPagingProps {
  location: StorageLocation | null;
  cards: UserCard[];
  isOpen: boolean;
}

export interface ContainerBinderPagingState {
  rows: number;
  cols: number;
  pocketsPerPage: number;
  totalBinderPages: number;
  totalBinderViews: number;
  currentBinderViewIndex: number;
  setCurrentBinderViewIndex: React.Dispatch<React.SetStateAction<number>>;
  leftPageNum: number | null;
  rightPageNum: number | null;
  leftPageCards: UserCard[];
  rightPageCards: UserCard[];
  handleNavigateNext: () => void;
  handleNavigatePrev: () => void;
  goToView: (viewIdx: number) => void;
  goToPage: (pageNum: number) => void;
}

/**
 * useContainerBinderPaging
 * Sub-hook modular para la paginación, cálculo de spreads de binder
 * y separación física de páginas izquierda/derecha.
 *
 * En un archivador real, la contraportada interior (izquierda al abrir)
 * NO tiene ranuras; las ranuras comienzan en la Página 1 (a la derecha).
 */
export function useContainerBinderPaging({
  location,
  cards,
  isOpen,
}: UseContainerBinderPagingProps): ContainerBinderPagingState {
  const [currentBinderViewIndex, setCurrentBinderViewIndex] = useState(0);
  const [prevContainerKey, setPrevContainerKey] = useState<string | null>(null);

  // Reiniciar a la primera vista al abrir un nuevo contenedor (ajuste de estado canónico en render)
  const currentKey = isOpen ? (location?.id || 'inbox') : null;
  if (currentKey !== prevContainerKey) {
    setPrevContainerKey(currentKey);
    setCurrentBinderViewIndex(0);
  }

  const rows = location?.grid_layout?.rows || 3;
  const cols = location?.grid_layout?.cols || 3;
  const pocketsPerPage = rows * cols;
  const totalBinderPages = location?.grid_layout?.total_pages || 40;

  // Total de vistas:
  // Vista 0: [Contraportada Interior | Pág 1]
  // Vistas 1..N: Páginas pares a la izquierda, impares a la derecha
  // Para N páginas, se necesitan Math.floor(N / 2) + 1 vistas
  const totalBinderViews = Math.max(1, Math.floor(totalBinderPages / 2) + 1);

  // Página izquierda: null en Vista 0 (contraportada interior), luego 2, 4, 6...
  const leftPageNum = useMemo(() => {
    if (currentBinderViewIndex === 0) return null;
    const pNum = currentBinderViewIndex * 2;
    return pNum <= totalBinderPages ? pNum : null;
  }, [currentBinderViewIndex, totalBinderPages]);

  // Página derecha: 1 en Vista 0, luego 3, 5, 7...
  const rightPageNum = useMemo(() => {
    const pNum = currentBinderViewIndex * 2 + 1;
    return pNum <= totalBinderPages ? pNum : null;
  }, [currentBinderViewIndex, totalBinderPages]);

  const leftPageCards = useMemo(() => {
    if (!leftPageNum) return [];
    return cards.filter(c => c.binder_page === leftPageNum);
  }, [cards, leftPageNum]);

  const rightPageCards = useMemo(() => {
    if (!rightPageNum) return [];
    return cards.filter(c => c.binder_page === rightPageNum);
  }, [cards, rightPageNum]);

  const handleNavigatePrev = useCallback(() => {
    setCurrentBinderViewIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNavigateNext = useCallback(() => {
    setCurrentBinderViewIndex(prev => Math.min(totalBinderViews - 1, prev + 1));
  }, [totalBinderViews]);

  const goToView = useCallback((viewIdx: number) => {
    const safeIdx = Math.max(0, Math.min(totalBinderViews - 1, viewIdx));
    setCurrentBinderViewIndex(safeIdx);
  }, [totalBinderViews]);

  const goToPage = useCallback((pageNum: number) => {
    if (pageNum <= 1) {
      setCurrentBinderViewIndex(0);
      return;
    }
    const targetView = Math.floor(pageNum / 2);
    goToView(targetView);
  }, [goToView]);

  return {
    rows,
    cols,
    pocketsPerPage,
    totalBinderPages,
    totalBinderViews,
    currentBinderViewIndex,
    setCurrentBinderViewIndex,
    leftPageNum,
    rightPageNum,
    leftPageCards,
    rightPageCards,
    handleNavigateNext,
    handleNavigatePrev,
    goToView,
    goToPage,
  };
}
