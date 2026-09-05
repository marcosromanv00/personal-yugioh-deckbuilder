import { useState, useCallback, useEffect } from 'react';
import { Card, HoverCardBase } from '../types';

const STORAGE_KEY = 'exordio_recent_cards';
const SYNC_EVENT = 'exordio-recent-cards-updated';
const MAX_RECENT_CARDS = 50;

export function normalizeToRecentCard(raw: unknown): Card | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const id = typeof item.id === 'number' ? item.id : typeof item.card_id === 'number' ? item.card_id : null;
  if (!id) return null;

  const details = (item.card_details && typeof item.card_details === 'object' ? item.card_details : null) as Record<string, unknown> | null;
  const name = (typeof item.name === 'string' && item.name) || (details && typeof details.name === 'string' && details.name) || '';
  if (!name) return null;

  const type = (typeof item.type === 'string' && item.type) || (details && typeof details.type === 'string' && details.type) || 'Unknown';
  const desc = (typeof item.desc === 'string' && item.desc) || (details && typeof details.desc === 'string' && details.desc) || '';
  const image_url = (typeof item.image_url === 'string' && item.image_url) || (details && typeof details.image_url === 'string' && details.image_url) || (typeof item.image_url_small === 'string' && item.image_url_small) || (details && typeof details.image_url_small === 'string' && details.image_url_small) || `https://images.ygoprodeck.com/images/cards/${id}.jpg`;
  const image_url_small = (typeof item.image_url_small === 'string' && item.image_url_small) || (details && typeof details.image_url_small === 'string' && details.image_url_small) || image_url;
  const archetype = typeof item.archetype === 'string' ? item.archetype : details && typeof details.archetype === 'string' ? details.archetype : undefined;
  const race = typeof item.race === 'string' ? item.race : details && typeof details.race === 'string' ? details.race : undefined;
  const attribute = typeof item.attribute === 'string' ? item.attribute : details && typeof details.attribute === 'string' ? details.attribute : undefined;
  const level = typeof item.level === 'number' ? item.level : details && typeof details.level === 'number' ? details.level : undefined;
  const atk = typeof item.atk === 'number' ? item.atk : details && typeof details.atk === 'number' ? details.atk : undefined;
  const def = typeof item.def === 'number' ? item.def : details && typeof details.def === 'number' ? details.def : undefined;

  return {
    id,
    name,
    type,
    desc,
    image_url,
    image_url_small,
    archetype,
    race,
    attribute,
    level,
    atk,
    def,
  };
}

function loadStoredRecentCards(): Card[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const validCards: Card[] = parsed.filter(
          (item): item is Card =>
            typeof item === 'object' &&
            item !== null &&
            typeof item.id === 'number' &&
            typeof item.name === 'string'
        );
        return validCards.slice(0, MAX_RECENT_CARDS);
      }
    }
  } catch (e) {
    console.error('Error loading recent cards from localStorage:', e);
  }
  return [];
}

/**
 * Hook to manage recent cards history in localStorage (max 50 cards).
 * Deduplicates cards so the most recently interacted card is always at index 0.
 * Sincronizado reactivamente entre componentes y pestañas mediante eventos de ventana.
 */
export function useRecentCardsHistory() {
  const [recentCards, setRecentCards] = useState<Card[]>(loadStoredRecentCards);

  // Sincronización en tiempo real con otras instancias y pestañas
  useEffect(() => {
    const handleSync = () => {
      setRecentCards(loadStoredRecentCards());
    };

    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Add or bump card to front of recent cards
  const addRecentCard = useCallback((rawCard: Card | HoverCardBase | unknown) => {
    const cardObj = normalizeToRecentCard(rawCard);
    if (!cardObj) return;

    setRecentCards((prev) => {
      const filtered = prev.filter((c) => c.id !== cardObj.id);
      const updated = [cardObj, ...filtered].slice(0, MAX_RECENT_CARDS);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent(SYNC_EVENT));
      } catch (e) {
        console.error('Error saving recent cards to localStorage:', e);
      }

      return updated;
    });
  }, []);

  // Clear history
  const clearRecentCards = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(SYNC_EVENT));
    } catch (e) {
      console.error('Error clearing recent cards from localStorage:', e);
    }
    setRecentCards([]);
  }, []);

  return {
    recentCards,
    addRecentCard,
    clearRecentCards,
  };
}
