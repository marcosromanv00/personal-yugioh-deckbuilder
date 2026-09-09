import { useState, useEffect, useMemo, useCallback } from 'react';
import { StorageLocation } from '@/types/collection';
import { MobileTab } from '../types';

interface UseContainerNavigationProps {
  isOpen: boolean;
  isInbox: boolean;
  location: StorageLocation | null;
  locations: StorageLocation[];
  onSelectLocation?: (location: StorageLocation) => void;
  onClose: (hasMutated?: boolean) => void;
  hasMutated: boolean;
  canUndo: boolean;
  canRedo: boolean;
  handleUndo: () => void;
  handleRedo: () => void;
}

export function useContainerNavigation({
  isOpen,
  isInbox,
  location,
  locations,
  onSelectLocation,
  onClose,
  hasMutated,
  canUndo,
  canRedo,
  handleUndo,
  handleRedo,
}: UseContainerNavigationProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>('center');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const allContainers = useMemo<StorageLocation[]>(() => {
    const inboxLoc: StorageLocation = {
      id: 'inbox',
      name: 'Sin Clasificar',
      type: 'box',
      sub_type: 'standard',
      color_code: '#f59e0b',
      dimensions: { width: 0, height: 0, depth: 0 },
      capacity: 9999,
      grid_layout: { rows: 3, cols: 3, pockets_per_page: 9, total_pages: 1 },
      compartments: { count: 1, names: ['Inbox'] },
      render_style: 'grid',
      created_at: '',
    };
    return [inboxLoc, ...locations];
  }, [locations]);

  const currentContainerIndex = useMemo(() => {
    if (isInbox || !location) return 0;
    const idx = allContainers.findIndex(c => c.id === location.id);
    return idx >= 0 ? idx : 0;
  }, [allContainers, isInbox, location]);

  const prevContainer = useMemo(() => {
    if (allContainers.length <= 1) return null;
    const prevIdx = (currentContainerIndex - 1 + allContainers.length) % allContainers.length;
    return allContainers[prevIdx];
  }, [allContainers, currentContainerIndex]);

  const nextContainer = useMemo(() => {
    if (allContainers.length <= 1) return null;
    const nextIdx = (currentContainerIndex + 1) % allContainers.length;
    return allContainers[nextIdx];
  }, [allContainers, currentContainerIndex]);

  const handleNavigatePrev = useCallback(() => {
    if (prevContainer && onSelectLocation) onSelectLocation(prevContainer);
  }, [prevContainer, onSelectLocation]);

  const handleNavigateNext = useCallback(() => {
    if (nextContainer && onSelectLocation) onSelectLocation(nextContainer);
  }, [nextContainer, onSelectLocation]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (canUndo) handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        if (canRedo) handleRedo();
      } else if (e.key === 'Escape') {
        onClose(hasMutated);
      } else if (e.key === 'ArrowLeft') {
        handleNavigatePrev();
      } else if (e.key === 'ArrowRight') {
        handleNavigateNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasMutated, onClose, handleNavigatePrev, handleNavigateNext, canUndo, canRedo, handleUndo, handleRedo]);

  return {
    mobileTab,
    setMobileTab,
    isMobile,
    allContainers,
    prevContainer,
    nextContainer,
    handleNavigatePrev,
    handleNavigateNext,
  };
}
