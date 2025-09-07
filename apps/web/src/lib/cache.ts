/**
 * Caching strategy for frequently accessed data
 * Provides in-memory caching with TTL and smart invalidation
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  totalSize: number;
  hitRate: number;
}

export interface CacheConfig {
  maxSize: number;
  defaultTtl: number; // milliseconds
  cleanupInterval: number; // milliseconds
  evictionPolicy: 'lru' | 'lfu' | 'ttl';
}

/**
 * In-memory cache with LRU/LFU eviction and TTL support
 */
export class SmartCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    totalSize: 0,
    hitRate: 0
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(private config: CacheConfig) {
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      this.updateHitRate();
      return null;
    }

    // Update access info
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.stats.hits++;
    this.updateHitRate();
    return entry.data;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entryTtl = ttl || this.config.defaultTtl;

    // Check if we need to evict before adding
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictEntry();
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: now,
      ttl: entryTtl,
      accessCount: 1,
      lastAccessed: now
    };

    this.cache.set(key, entry);
    this.stats.sets++;
    this.stats.totalSize = this.cache.size;
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.totalSize = this.cache.size;
    }
    return deleted;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.totalSize = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entry count
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Evict entry based on configured policy
   */
  private evictEntry(): void {
    if (this.cache.size === 0) return;

    let keyToEvict: string;

    switch (this.config.evictionPolicy) {
      case 'lru':
        keyToEvict = this.findLeastRecentlyUsed();
        break;
      case 'lfu':
        keyToEvict = this.findLeastFrequentlyUsed();
        break;
      case 'ttl':
        keyToEvict = this.findNearestExpiry();
        break;
      default:
        keyToEvict = this.cache.keys().next().value;
    }

    this.cache.delete(keyToEvict);
    this.stats.evictions++;
    this.stats.totalSize = this.cache.size;
  }

  /**
   * Find least recently used key
   */
  private findLeastRecentlyUsed(): string {
    let oldestKey = '';
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Find least frequently used key
   */
  private findLeastFrequentlyUsed(): string {
    let leastUsedKey = '';
    let leastCount = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastCount) {
        leastCount = entry.accessCount;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }

  /**
   * Find entry with nearest expiry
   */
  private findNearestExpiry(): string {
    let nearestKey = '';
    let nearestExpiry = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      const expiryTime = entry.timestamp + entry.ttl;
      if (expiryTime < nearestExpiry) {
        nearestExpiry = expiryTime;
        nearestKey = key;
      }
    }

    return nearestKey;
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.stats.evictions++;
    });

    this.stats.totalSize = this.cache.size;
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

/**
 * Cache manager for different data types
 */
export class CacheManager {
  private static caches: Map<string, SmartCache<any>> = new Map();

  /**
   * Get or create cache instance
   */
  static getCache<T>(name: string, config?: Partial<CacheConfig>): SmartCache<T> {
    if (!this.caches.has(name)) {
      const defaultConfig: CacheConfig = {
        maxSize: 1000,
        defaultTtl: 5 * 60 * 1000, // 5 minutes
        cleanupInterval: 60 * 1000, // 1 minute
        evictionPolicy: 'lru'
      };

      const mergedConfig = { ...defaultConfig, ...config };
      this.caches.set(name, new SmartCache(mergedConfig));
    }

    return this.caches.get(name)!;
  }

  /**
   * Destroy cache instance
   */
  static destroyCache(name: string): boolean {
    const cache = this.caches.get(name);
    if (cache) {
      cache.destroy();
      this.caches.delete(name);
      return true;
    }
    return false;
  }

  /**
   * Get all cache statistics
   */
  static getAllStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }
    return stats;
  }

  /**
   * Clear all caches
   */
  static clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }
}

/**
 * Specialized caches for different data types
 */
export const ProductCache = CacheManager.getCache<any>('products', {
  maxSize: 500,
  defaultTtl: 10 * 60 * 1000, // 10 minutes - products don't change often
  evictionPolicy: 'lfu' // Products accessed frequently should stay
});

export const CustomerCache = CacheManager.getCache<any>('customers', {
  maxSize: 1000,
  defaultTtl: 5 * 60 * 1000, // 5 minutes - customer data may update
  evictionPolicy: 'lru' // Recent customers are more likely to be accessed
});

export const OrderCache = CacheManager.getCache<any>('orders', {
  maxSize: 200,
  defaultTtl: 2 * 60 * 1000, // 2 minutes - orders change frequently
  evictionPolicy: 'lru'
});

export const SearchCache = CacheManager.getCache<any>('search', {
  maxSize: 100,
  defaultTtl: 15 * 60 * 1000, // 15 minutes - search results can be cached longer
  evictionPolicy: 'lfu' // Popular searches should stay cached
});

/**
 * Cache-aware database query wrapper
 */
export class CachedQuery {
  /**
   * Get with cache fallback
   */
  static async getWithCache<T>(
    cacheKey: string,
    cache: SmartCache<T>,
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try cache first
    const cached = cache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - execute query
    const result = await queryFn();
    
    // Store in cache
    cache.set(cacheKey, result, ttl);
    
    return result;
  }

  /**
   * Invalidate cache entries by pattern
   */
  static invalidatePattern(cache: SmartCache<any>, pattern: string): number {
    let invalidated = 0;
    const keys = cache.keys();
    
    for (const key of keys) {
      if (key.includes(pattern)) {
        cache.delete(key);
        invalidated++;
      }
    }
    
    return invalidated;
  }

  /**
   * Warm up cache with data
   */
  static async warmUpCache<T>(
    cache: SmartCache<T>,
    dataLoader: () => Promise<Array<{ key: string; data: T }>>,
    ttl?: number
  ): Promise<void> {
    try {
      const data = await dataLoader();
      for (const item of data) {
        cache.set(item.key, item.data, ttl);
      }
      console.log(`✅ Cache warmed up with ${data.length} entries`);
    } catch (error) {
      console.error('❌ Cache warm-up failed:', error);
    }
  }
}

/**
 * Cache invalidation strategies
 */
export class CacheInvalidation {
  /**
   * Invalidate product-related caches
   */
  static invalidateProductCaches(productId: string): void {
    ProductCache.delete(`product:${productId}`);
    CachedQuery.invalidatePattern(SearchCache, 'product');
    CachedQuery.invalidatePattern(ProductCache, 'list');
  }

  /**
   * Invalidate customer-related caches
   */
  static invalidateCustomerCaches(customerId: string): void {
    CustomerCache.delete(`customer:${customerId}`);
    CachedQuery.invalidatePattern(OrderCache, `customer:${customerId}`);
  }

  /**
   * Invalidate order-related caches
   */
  static invalidateOrderCaches(orderId: string, customerId?: string): void {
    OrderCache.delete(`order:${orderId}`);
    if (customerId) {
      CachedQuery.invalidatePattern(OrderCache, `customer:${customerId}`);
    }
  }

  /**
   * Invalidate all caches
   */
  static invalidateAll(): void {
    CacheManager.clearAll();
    console.log('🗑️ All caches invalidated');
  }
}

/**
 * Cache monitoring and metrics
 */
export class CacheMonitoring {
  /**
   * Generate cache performance report
   */
  static generateReport(): {
    caches: Record<string, CacheStats>;
    recommendations: string[];
    overall: {
      totalHitRate: number;
      totalSize: number;
      healthStatus: 'healthy' | 'warning' | 'critical';
    };
  } {
    const stats = CacheManager.getAllStats();
    const recommendations: string[] = [];
    
    let totalHits = 0;
    let totalRequests = 0;
    let totalSize = 0;
    
    for (const [name, stat] of Object.entries(stats)) {
      totalHits += stat.hits;
      totalRequests += stat.hits + stat.misses;
      totalSize += stat.totalSize;
      
      // Generate recommendations
      if (stat.hitRate < 50) {
        recommendations.push(`${name} cache has low hit rate (${stat.hitRate.toFixed(1)}%). Consider increasing TTL or cache size.`);
      }
      
      if (stat.evictions > stat.sets * 0.3) {
        recommendations.push(`${name} cache has high eviction rate. Consider increasing cache size.`);
      }
    }
    
    const totalHitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
    
    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (totalHitRate < 30) {
      healthStatus = 'critical';
    } else if (totalHitRate < 60) {
      healthStatus = 'warning';
    }
    
    return {
      caches: stats,
      recommendations,
      overall: {
        totalHitRate,
        totalSize,
        healthStatus
      }
    };
  }

  /**
   * Log cache performance metrics
   */
  static logMetrics(): void {
    const report = this.generateReport();
    console.log('📊 Cache Performance Report:', {
      hitRate: `${report.overall.totalHitRate.toFixed(1)}%`,
      totalSize: report.overall.totalSize,
      status: report.overall.healthStatus,
      recommendations: report.recommendations
    });
  }
}

// Initialize periodic cache monitoring in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    CacheMonitoring.logMetrics();
  }, 10 * 60 * 1000); // Every 10 minutes
}

export {
  CacheManager,
  CachedQuery,
  CacheInvalidation,
  CacheMonitoring
};