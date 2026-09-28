/**
 * Cache Service - Main Implementation
 * High-performance distributed caching with eviction, compression, and metrics
 */

import zlib from 'zlib';

import {
  EvictionPolicy,
  CompressionAlgorithm,
  CacheEntryStatus,
  WriteStrategy,
  InvalidationStrategy,
  ICacheValue,
  ICacheEntryMetadata,
  ICacheStats,
  ICacheMetrics,
  ICacheConfig,
  IEvictionResult,
  IInvalidationPattern,
  CacheListener,
  ICacheEvent,
  ICacheHealthCheck,
  ICacheEntryFilter,
  ICacheBulkOperation,
  ICacheServiceConfig,
  ICacheAnalysis,
} from './types';

/**
 * Cache Service - High-performance in-memory cache with advanced features
 */
export class CacheService {
  private cache: Map<string, ICacheValue>;
  private metadata: Map<string, ICacheEntryMetadata>;
  private listeners: CacheListener[];
  private stats: ICacheStats;
  private metrics: ICacheMetrics[];
  private invalidationPatterns: Map<string, IInvalidationPattern>;
  private auditLog: Array<any>;
  private cleanupInterval: NodeJS.Timer | null = null;
  private expiryQueue: Array<{ key: string; expiryTime: number }> = [];
  private config: ICacheServiceConfig;
  private currentSize: number = 0;
  private getTime: number = 0;
  private setTime: number = 0;
  private deleteTime: number = 0;

  constructor(config: ICacheServiceConfig) {
    this.config = this.validateConfig(config);
    this.cache = new Map();
    this.metadata = new Map();
    this.listeners = [];
    this.stats = this.initializeStats();
    this.metrics = [];
    this.invalidationPatterns = new Map();
    this.auditLog = [];

    if (config.warmupEnabled && config.warmupData) {
      this.warmupCache(config.warmupData);
    }

    this.startCleanupInterval();
  }

  private validateConfig(config: ICacheServiceConfig): ICacheServiceConfig {
    if (config.maxSize <= 0) {
      throw new Error('maxSize must be greater than 0');
    }
    if (config.maxEntries <= 0) {
      throw new Error('maxEntries must be greater than 0');
    }
    return config;
  }

  private initializeStats(): ICacheStats {
    return {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
      invalidations: 0,
      totalSize: 0,
      entryCount: 0,
      hitRate: 0,
      averageAccessTime: 0,
      lastUpdated: new Date(),
    };
  }

  public set<T = any>(key: string, value: T, options?: { ttl?: number; tags?: string[] }): boolean {
    const startTime = Date.now();

    try {
      // Check if we need to evict entries
      if (this.cache.size >= this.config.maxEntries) {
        this.evict();
      }

      // Serialize and compress if needed
      let serialized = JSON.stringify(value);
      let compressed = false;

      if (this.config.enableCompression && serialized.length > this.config.compressionThreshold) {
        serialized = this.compressData(serialized);
        compressed = true;
      }

      const size = Buffer.byteLength(serialized, 'utf8');

      // Check size constraint
      if (size > this.config.maxSize) {
        this.emitEvent({
          eventId: this.generateEventId(),
          timestamp: new Date(),
          type: 'set',
          key,
          size,
        });
        return false;
      }

      // Remove old entry if exists
      if (this.cache.has(key)) {
        const oldEntry = this.cache.get(key)!;
        this.currentSize -= oldEntry.size;
        this.stats.invalidations++;
      }

      const cacheValue: ICacheValue<T> = {
        key,
        value: serialized as any,
        size,
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        accessCount: 1,
        ttl: options?.ttl || this.config.defaultTTL,
        tags: options?.tags,
        compressed,
        metadata: { source: 'set' },
      };

      this.cache.set(key, cacheValue);
      this.metadata.set(key, this.createMetadata(cacheValue));
      this.currentSize += size;
      this.stats.entryCount++;
      this.stats.totalSize = this.currentSize;

      if (cacheValue.ttl) {
        this.expiryQueue.push({
          key,
          expiryTime: Date.now() + cacheValue.ttl,
        });
      }

      const duration = Date.now() - startTime;
      this.setTime += duration;

      this.emitEvent({
        eventId: this.generateEventId(),
        timestamp: new Date(),
        type: 'set',
        key,
        size,
        duration,
      });

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  public get<T = any>(key: string): T | null {
    const startTime = Date.now();

    try {
      const entry = this.cache.get(key);

      if (!entry) {
        this.stats.misses++;
        this.updateHitRate();
        this.emitEvent({
          eventId: this.generateEventId(),
          timestamp: new Date(),
          type: 'get',
          key,
          duration: Date.now() - startTime,
        });
        return null;
      }

      // Check expiry
      if (entry.ttl && Date.now() - entry.createdAt.getTime() > entry.ttl) {
        this.cache.delete(key);
        this.metadata.delete(key);
        this.currentSize -= entry.size;
        this.stats.expirations++;
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      entry.lastAccessedAt = new Date();
      entry.accessCount++;

      let value = entry.value;
      if (entry.compressed) {
        value = this.decompressData(value);
      }

      const duration = Date.now() - startTime;
      this.getTime += duration;

      this.stats.hits++;
      this.stats.entryCount++;
      this.updateHitRate();

      this.emitEvent({
        eventId: this.generateEventId(),
        timestamp: new Date(),
        type: 'get',
        key,
        duration,
      });

      return JSON.parse(value as string) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  public delete(key: string): boolean {
    const startTime = Date.now();

    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    this.cache.delete(key);
    this.metadata.delete(key);
    this.currentSize -= entry.size;
    this.stats.invalidations++;

    const duration = Date.now() - startTime;
    this.deleteTime += duration;

    this.emitEvent({
      eventId: this.generateEventId(),
      timestamp: new Date(),
      type: 'delete',
      key,
      duration,
    });

    return true;
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  public clear(): void {
    this.cache.clear();
    this.metadata.clear();
    this.currentSize = 0;
    this.stats.entryCount = 0;
    this.stats.totalSize = 0;

    this.emitEvent({
      eventId: this.generateEventId(),
      timestamp: new Date(),
      type: 'clear',
    });
  }

  public getMetadata(key: string): ICacheEntryMetadata | null {
    return this.metadata.get(key) || null;
  }

  public getAllMetadata(): Map<string, ICacheEntryMetadata> {
    return new Map(this.metadata);
  }

  public getMultiple<T = any>(keys: string[]): Map<string, T | null> {
    const results = new Map<string, T | null>();

    for (const key of keys) {
      results.set(key, this.get<T>(key));
    }

    return results;
  }

  public setMultiple<T = any>(entries: Array<{ key: string; value: T; ttl?: number }>): number {
    let successCount = 0;

    for (const entry of entries) {
      if (this.set(entry.key, entry.value, { ttl: entry.ttl })) {
        successCount++;
      }
    }

    return successCount;
  }

  public deleteMultiple(keys: string[]): number {
    let successCount = 0;

    for (const key of keys) {
      if (this.delete(key)) {
        successCount++;
      }
    }

    return successCount;
  }

  public deleteByPattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let deletedCount = 0;

    for (const [key] of this.cache) {
      if (regex.test(key)) {
        if (this.delete(key)) {
          deletedCount++;
        }
      }
    }

    return deletedCount;
  }

  public invalidateByPattern(pattern: string, strategy: InvalidationStrategy = 'immediate'): string {
    const patternId = this.generatePatternId();
    const invalidPattern: IInvalidationPattern = {
      patternId,
      pattern,
      strategy,
      enabled: true,
      createdAt: new Date(),
    };

    this.invalidationPatterns.set(patternId, invalidPattern);

    if (strategy === 'immediate') {
      this.deleteByPattern(pattern);
    }

    return patternId;
  }

  public getSize(): number {
    return this.currentSize;
  }

  public getCount(): number {
    return this.cache.size;
  }

  public getStats(): ICacheStats {
    return {
      ...this.stats,
      hitRate: this.stats.hitRate,
      averageAccessTime: this.calculateAverageAccessTime(),
      lastUpdated: new Date(),
    };
  }

  public getMetrics(): ICacheMetrics {
    const totalOps = this.stats.hits + this.stats.misses;

    return {
      timestamp: new Date(),
      hitRate: totalOps > 0 ? this.stats.hits / totalOps : 0,
      missRate: totalOps > 0 ? this.stats.misses / totalOps : 0,
      evictionRate: totalOps > 0 ? this.stats.evictions / totalOps : 0,
      expirationRate: totalOps > 0 ? this.stats.expirations / totalOps : 0,
      averageEntrySize: this.cache.size > 0 ? this.currentSize / this.cache.size : 0,
      memoryUtilization: (this.currentSize / this.config.maxSize) * 100,
      operationTime: {
        get: this.cache.size > 0 ? this.getTime / this.stats.hits : 0,
        set: this.cache.size > 0 ? this.setTime / this.cache.size : 0,
        delete: this.stats.invalidations > 0 ? this.deleteTime / this.stats.invalidations : 0,
        update: 0,
      },
    };
  }

  public async performHealthCheck(): Promise<ICacheHealthCheck> {
    const checks = [
      {
        name: 'Cache Store',
        status: this.cache.size > 0 ? 'healthy' : 'degraded' as const,
        message: `${this.cache.size} entries cached`,
      },
      {
        name: 'Memory Usage',
        status: this.currentSize < this.config.maxSize ? 'healthy' : 'degraded' as const,
        message: `${Math.round((this.currentSize / this.config.maxSize) * 100)}% utilized`,
      },
      {
        name: 'Hit Rate',
        status: this.stats.hitRate > 0.5 ? 'healthy' : 'degraded' as const,
        message: `${Math.round(this.stats.hitRate * 100)}% hit rate`,
      },
      {
        name: 'Eviction Policy',
        status: 'healthy' as const,
        message: `${this.config.evictionPolicy} active`,
      },
    ];

    const overallStatus = checks.every((c) => c.status === 'healthy') ? 'healthy' : 'degraded';

    return {
      status: overallStatus as 'healthy' | 'degraded' | 'unhealthy',
      timestamp: new Date(),
      checks,
    };
  }

  public onEvent(listener: CacheListener): this {
    this.listeners.push(listener);
    return this;
  }

  private evict(): void {
    const itemsToEvict = Math.max(1, Math.floor(this.cache.size * 0.1));

    const evicted = this.applyEvictionPolicy(itemsToEvict);
    this.stats.evictions += evicted;

    this.emitEvent({
      eventId: this.generateEventId(),
      timestamp: new Date(),
      type: 'evict',
      size: evicted,
    });
  }

  private applyEvictionPolicy(count: number): number {
    let evictedCount = 0;

    const entries = Array.from(this.cache.entries());

    let candidates = entries;

    switch (this.config.evictionPolicy) {
      case 'LRU': // Least Recently Used
        candidates = entries.sort((a, b) => a[1].lastAccessedAt.getTime() - b[1].lastAccessedAt.getTime());
        break;

      case 'LFU': // Least Frequently Used
        candidates = entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
        break;

      case 'FIFO': // First In, First Out
        candidates = entries.sort((a, b) => a[1].createdAt.getTime() - b[1].createdAt.getTime());
        break;

      case 'TTL': // Time To Live
        candidates = entries.sort((a, b) => {
          const aTTL = a[1].ttl || Infinity;
          const bTTL = b[1].ttl || Infinity;
          return aTTL - bTTL;
        });
        break;

      default:
        candidates = entries.slice(0, count);
    }

    for (let i = 0; i < Math.min(count, candidates.length); i++) {
      const [key, entry] = candidates[i];
      this.cache.delete(key);
      this.metadata.delete(key);
      this.currentSize -= entry.size;
      evictedCount++;
    }

    return evictedCount;
  }

  private warmupCache(data: Record<string, any>): void {
    for (const [key, value] of Object.entries(data)) {
      this.set(key, value);
    }
  }

  private compressData(data: string): string {
    const buffer = Buffer.from(data, 'utf8');
    return zlib.gzipSync(buffer).toString('base64');
  }

  private decompressData(data: string): string {
    const buffer = Buffer.from(data, 'base64');
    return zlib.gunzipSync(buffer).toString('utf8');
  }

  private createMetadata(entry: ICacheValue): ICacheEntryMetadata {
    return {
      key: entry.key,
      size: entry.size,
      createdAt: entry.createdAt,
      lastAccessedAt: entry.lastAccessedAt,
      accessCount: entry.accessCount,
      ttl: entry.ttl,
      status: 'active',
      expiresAt: entry.ttl ? new Date(entry.createdAt.getTime() + entry.ttl) : undefined,
    };
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private calculateAverageAccessTime(): number {
    if (this.cache.size === 0) return 0;

    let totalTime = 0;
    for (const entry of this.cache.values()) {
      totalTime += entry.accessCount;
    }

    return totalTime / this.cache.size;
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const entry of this.cache.values()) {
      if (entry.ttl && now - entry.createdAt.getTime() > entry.ttl) {
        keysToDelete.push(entry.key);
      }
    }

    for (const key of keysToDelete) {
      this.delete(key);
      this.stats.expirations++;
    }

    this.stats.lastUpdated = new Date();
  }

  private emitEvent(event: Omit<ICacheEvent, 'eventId'>): void {
    const fullEvent: ICacheEvent = {
      eventId: this.generateEventId(),
      ...event,
    };

    for (const listener of this.listeners) {
      try {
        Promise.resolve(listener(fullEvent)).catch((error) => {
          console.error('Error in cache listener:', error);
        });
      } catch (error) {
        console.error('Error calling cache listener:', error);
      }
    }
  }

  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePatternId(): string {
    return `pat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export function createCacheService(config: ICacheServiceConfig): CacheService {
  return new CacheService(config);
}
