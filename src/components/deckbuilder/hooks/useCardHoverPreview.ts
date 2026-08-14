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

  /**
   * Fetches and opens the card preview.
   * Shared by both desktop (hover) and mobile (long press) paths.
   */
  const _fetchAndOpenPreview = useCallback(async (card: HoverCardBase) => {
    setIsPreviewOpen(true);
    isPreviewOpenRef.current = true;
    setIsLoadingPreview(true);
    setHoveredCard(card);
    setModalActionMessage(null);

    try {
      const res = await fetch(`/api/cards?id=${card.id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setPreviewCard(json.data[0]);
        } else {
          setPreviewCard({ type: 'Unknown', image_url: '', ...card } as Card);
        }
      } else {
        setPreviewCard({ type: 'Unknown', image_url: '', ...card } as Card);
      }
    } catch (err) {
      console.error('Error fetching preview card details:', err);
      setPreviewCard({ type: 'Unknown', image_url: '', ...card } as Card);
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  /** Desktop: hover 1.5s trigger */
  const handleCardMouseEnter = useCallback((card: HoverCardBase) => {
    if (isPreviewOpenRef.current) return;

    isHoveringRef.current = true;

    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);

    hoverTimerRef.current = setTimeout(async () => {
      if (!isHoveringRef.current) return;
      await _fetchAndOpenPreview(card);
    }, 1500);
  }, [_fetchAndOpenPreview]);

  const handleCardMouseLeave = useCallback(() => {
    if (!isPreviewOpenRef.current) {
      isHoveringRef.current = false;
    }
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  /**
   * Mobile/Tablet: immediate trigger (no delay).
   * Call this from useLongPress onLongPress callback.
   */
  const openPreviewForCard = useCallback(async (card: HoverCardBase) => {
    if (isPreviewOpenRef.current) return;
    await _fetchAndOpenPreview(card);
  }, [_fetchAndOpenPreview]);

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
