import { UserCard } from '@/types/collection';

// In-memory cache for cards inside containers/inbox
const containerCache = new Map<string, UserCard[]>();

/**
 * Retrieves cached cards for a given container or inbox.
 */
export function getCachedContainerCards(containerId: string): UserCard[] | undefined {
  return containerCache.get(containerId);
}

/**
 * Stores cards for a given container or inbox in memory.
 */
export function setCachedContainerCards(containerId: string, cards: UserCard[]): void {
  containerCache.set(containerId, cards);
}

/**
 * Invalidates cache for a specific container, or clears all if omitted.
 */
export function invalidateContainerCardsCache(containerId?: string): void {
  if (containerId) {
    containerCache.delete(containerId);
  } else {
    containerCache.clear();
  }
}

/**
 * Optimistically prefetches cards for a container or inbox on hover/focus.
 */
export async function prefetchContainerCards(containerId: string): Promise<UserCard[] | undefined> {
  if (!containerId || containerCache.has(containerId)) {
    return containerCache.get(containerId);
  }
  try {
    const url = containerId === 'inbox'
      ? '/api/collection/inbox'
      : `/api/collection/cards?location_id=${containerId}`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const cards: UserCard[] = json.data || [];
      containerCache.set(containerId, cards);
      return cards;
    }
  } catch (err) {
    console.warn('Error prefetching container cards:', err);
  }
  return undefined;
}
