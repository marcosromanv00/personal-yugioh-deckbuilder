/**
 * High-performance, lightweight in-memory LRU Cache with TTL support.
 * Designed for caching reference data (cards, archetypes, synergies) in Next.js Server Components / Route Handlers.
 */
interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

export class SimpleLRUCache<K, V> {
  private readonly maxEntries: number;
  private readonly defaultTtlMs: number;
  private readonly map: Map<K, CacheEntry<V>>;

  constructor(maxEntries = 300, defaultTtlMs = 180000) {
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlMs;
    this.map = new Map();
  }

  get(key: K): V | null {
    const entry = this.map.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return null;
    }

    // Refresh LRU order by re-inserting
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V, ttlMs?: number): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxEntries) {
      // Evict oldest entry (first item in Map iterator)
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }

    const duration = ttlMs ?? this.defaultTtlMs;
    this.map.set(key, {
      value,
      expiresAt: Date.now() + duration,
    });
  }

  has(key: K): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.map.clear();
  }

  size(): number {
    return this.map.size;
  }
}
