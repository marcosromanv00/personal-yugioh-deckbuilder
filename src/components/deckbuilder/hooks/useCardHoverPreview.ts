import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, HoverCardBase } from '../types';

/**
 * Hook para manejar la lógica de previsualización técnica de cartas.
 * - Desktop: hover largo (1.5 segundos) sobre una carta.
 * - Mobile/Tablet: long press → openPreviewForCard (disparo inmediato, sin delay).
 */
export function useCardHoverPreview() {
  const [hoveredCard, setHoveredCard] = useState<HoverCardBase | null>(null);
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [modalActionMessage, setModalActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef(false);
  const isPreviewOpenRef = useRef(false);

  const closePreview = useCallback(() => {
    isHoveringRef.current = false;
    isPreviewOpenRef.current = false;
    setIsPreviewOpen(false);
  }, []);

  /** Hover preview disabled per user request in favor of CardDetailPanel */
  const handleCardMouseEnter = useCallback((_card: HoverCardBase) => {
    // Disabled: details are centralized in the right panel upon selection
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    // Disabled
  }, []);

  /** Disabled: details are centralized in the right panel upon selection */
  const openPreviewForCard = useCallback((_card: HoverCardBase) => {
    // Disabled
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    };
  }, []);

  return {
    hoveredCard,
    previewCard,
    setPreviewCard,
    isPreviewOpen,
    setIsPreviewOpen,
    isLoadingPreview,
    modalActionMessage,
    setModalActionMessage,
    isActionLoading,
    setIsActionLoading,
    closePreview,
    handleCardMouseEnter,
    handleCardMouseLeave,
    openPreviewForCard,
  };
}
