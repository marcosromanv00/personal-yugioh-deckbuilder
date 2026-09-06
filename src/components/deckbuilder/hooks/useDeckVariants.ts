import { useState, useCallback } from 'react';
import { DeckVariant, DeckVariantCard } from '@/types/collection';
import { DeckCard } from '@/components/deckbuilder/types';

interface UseDeckVariantsProps {
  deckId: string | null;
  deckCards: DeckCard[];
  setDeckCards: React.Dispatch<React.SetStateAction<DeckCard[]>>;
  initialVariants?: DeckVariant[];
  onCardsTransferred?: () => Promise<void> | void;
}

export function useDeckVariants({
  deckId,
  deckCards,
  setDeckCards,
  initialVariants = [],
  onCardsTransferred,
}: UseDeckVariantsProps) {
  const [variants, setVariants] = useState<DeckVariant[]>(initialVariants);
  const [prevInitial, setPrevInitial] = useState(initialVariants);
  if (initialVariants !== prevInitial) {
    setPrevInitial(initialVariants);
    setVariants(initialVariants);
  }
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [targetVariantForDiff, setTargetVariantForDiff] = useState<DeckVariant | null>(null);
  const [isNewVariantModalOpen, setIsNewVariantModalOpen] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const activeVariant = variants.find((v) => v.is_active) || variants[0] || null;

  const handleOpenDiff = useCallback((targetVariant: DeckVariant) => {
    if (targetVariant.id === activeVariant?.id) return;
    setTargetVariantForDiff(targetVariant);
    setIsDiffModalOpen(true);
  }, [activeVariant?.id]);

  const handleCloseDiff = useCallback(() => {
    setIsDiffModalOpen(false);
    setTargetVariantForDiff(null);
  }, []);

  const handleConfirmSwitch = useCallback(async (
    targetVariant: DeckVariant,
    transferUserCardIds: string[] = []
  ) => {
    if (!deckId) return;
    setIsLoadingAction(true);
    try {
      const res = await fetch(`/api/decks/${deckId}/variants`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_id: targetVariant.id,
          action: 'activate',
          transfer_user_card_ids: transferUserCardIds,
        }),
      });

      if (!res.ok) throw new Error('Error al activar variante');

      // Actualizar estado local de variantes
      setVariants((prev) =>
        prev.map((v) => ({
          ...v,
          is_active: v.id === targetVariant.id,
        }))
      );

      // Reconfigurar cartas en el constructor con las cartas de la nueva variante
      if (targetVariant.cards && targetVariant.cards.length > 0) {
        setDeckCards((prev) => {
          const currentCardsMap = new Map(prev.map((c) => [c.id, c]));
          const newDeckCards: DeckCard[] = [];

          targetVariant.cards.forEach((vc) => {
            const existing = currentCardsMap.get(vc.card_id);
            if (existing) {
              newDeckCards.push({
                ...existing,
                count: vc.count,
                proxy_count: vc.proxy_count || 0,
                section: vc.section,
              });
            } else if (vc.card_details) {
              newDeckCards.push({
                id: vc.card_id,
                name: vc.card_details.name,
                count: vc.count,
                proxy_count: vc.proxy_count || 0,
                section: vc.section,
                type: vc.card_details.type || 'Monster',
                image_url: vc.card_details.image_url || `https://images.ygoprodeck.com/images/cards/${vc.card_id}.jpg`,
                image_url_small: vc.card_details.image_url_small,
              });
            }
          });

          // Conservar en extras cualquier carta del pool que estuviera en el deck maestro
          prev.forEach((oldC) => {
            if (!newDeckCards.some((nc) => nc.id === oldC.id)) {
              newDeckCards.push({
                ...oldC,
                section: 'extras',
              });
            }
          });

          return newDeckCards;
        });
      }

      if (onCardsTransferred) {
        await onCardsTransferred();
      }

      handleCloseDiff();
    } catch (err) {
      console.error('Error switching variant:', err);
      alert('Hubo un error al activar la variante. Por favor intenta de nuevo.');
    } finally {
      setIsLoadingAction(false);
    }
  }, [deckId, handleCloseDiff, onCardsTransferred, setDeckCards]);

  const handleCreateVariant = useCallback(async (
    name: string,
    mode: 'duplicate' | 'empty' = 'duplicate'
  ) => {
    if (!deckId || !name.trim()) return;
    setIsLoadingAction(true);
    try {
      const cardsPayload: DeckVariantCard[] = mode === 'duplicate'
        ? deckCards.map((c) => ({
            card_id: c.id,
            count: c.count,
            proxy_count: c.proxy_count || 0,
            section: c.section,
          }))
        : [];

      const res = await fetch(`/api/decks/${deckId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          is_active: variants.length === 0,
          cards: cardsPayload,
        }),
      });

      if (!res.ok) throw new Error('Error al crear variante');
      const json = await res.json();
      const newVar = json.data as DeckVariant;

      setVariants((prev) => [...prev, newVar]);
      setIsNewVariantModalOpen(false);
    } catch (err) {
      console.error('Error creating variant:', err);
      alert('Error al crear la variante');
    } finally {
      setIsLoadingAction(false);
    }
  }, [deckId, deckCards, variants.length]);

  const handleDeleteVariant = useCallback(async (variantId: string) => {
    if (!deckId) return;
    if (!confirm('¿Estás seguro de eliminar esta variante?')) return;
    setIsLoadingAction(true);
    try {
      const res = await fetch(`/api/decks/${deckId}/variants?variant_id=${variantId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar variante');

      setVariants((prev) => {
        const filtered = prev.filter((v) => v.id !== variantId);
        if (filtered.length > 0 && !filtered.some((v) => v.is_active)) {
          filtered[0].is_active = true;
        }
        return filtered;
      });
    } catch (err) {
      console.error('Error deleting variant:', err);
      alert('Error al eliminar la variante');
    } finally {
      setIsLoadingAction(false);
    }
  }, [deckId]);

  const handleSaveActiveVariantCards = useCallback(async (cards: DeckCard[]): Promise<boolean> => {
    if (!deckId || !activeVariant) return true;
    try {
      const cardsPayload: DeckVariantCard[] = cards.map((c) => ({
        card_id: c.id,
        count: c.count,
        proxy_count: c.proxy_count || 0,
        section: c.section,
      }));

      const res = await fetch(`/api/decks/${deckId}/variants`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_id: activeVariant.id,
          action: 'update',
          cards: cardsPayload,
        }),
      });

      if (!res.ok) return false;

      setVariants((prev) =>
        prev.map((v) =>
          v.id === activeVariant.id ? { ...v, cards: cardsPayload } : v
        )
      );
      return true;
    } catch {
      return false;
    }
  }, [deckId, activeVariant]);

  return {
    variants,
    setVariants,
    activeVariant,
    isDiffModalOpen,
    targetVariantForDiff,
    isNewVariantModalOpen,
    isLoadingAction,
    setIsNewVariantModalOpen,
    handleOpenDiff,
    handleCloseDiff,
    handleConfirmSwitch,
    handleCreateVariant,
    handleDeleteVariant,
    handleSaveActiveVariantCards,
  };
}
