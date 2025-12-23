import NodeCache from 'node-cache'

/**
 * CacheManager - A wrapper for in-memory caching
 * Can be easily replaced with Redis in the future
 */
class CacheManager {
  private readonly cache: NodeCache

  constructor(defaultTTL: number = 3600000) {
    this.cache = new NodeCache({ stdTTL: defaultTTL})
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get<T>(key);
    
    if (!entry) {
      return null;
    }

    return entry;
  }

  set(key: string, value: any, ttl?: number): void {
    if (ttl) {
      this.cache.set(key, value, ttl)
      return
    }
    this.cache.set(key, value);
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): void {
    this.cache.del(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.flushAll();
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.cache.has(key);
    
  }

  size(): number {
    return this.cache.keys().length;
  }
}

// Export singleton instance
export const cacheManager = new CacheManager(8 * 60 * 60 * 1000); // 8 hours default TTL

// Export class for testing or custom instances
export { CacheManager };
