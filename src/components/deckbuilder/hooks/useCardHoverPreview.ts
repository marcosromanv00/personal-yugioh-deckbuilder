import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, HoverCardBase } from '../types';

/**
 * Hook para manejar la lógica de previsualización técnica por hover largo (1.5 segundos)
 * de las cartas de Yu-Gi-Oh!
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

  const handleCardMouseEnter = useCallback((card: HoverCardBase) => {
    if (isPreviewOpenRef.current) return;

    isHoveringRef.current = true;

    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);

    hoverTimerRef.current = setTimeout(async () => {
      if (!isHoveringRef.current) return;

      setIsPreviewOpen(true);
      isPreviewOpenRef.current = true;
      setIsLoadingPreview(true);
      setHoveredCard(card);
      setModalActionMessage(null);

      try {
        const res = await fetch(`/api/cards?id=${card.id}`);
        if (!isHoveringRef.current) {
          setIsPreviewOpen(false);
          isPreviewOpenRef.current = false;
          setIsLoadingPreview(false);
          return;
        }
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
    }, 1500);
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    if (!isPreviewOpenRef.current) {
      isHoveringRef.current = false;
    }
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
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
  };
}
