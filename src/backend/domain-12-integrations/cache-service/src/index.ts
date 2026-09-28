/**
 * Cache Service - Public API Exports
 * High-performance distributed caching with eviction and compression
 */

export { CacheService, createCacheService } from './main';
export type {
  EvictionPolicy,
  CompressionAlgorithm,
  StatisticsScope,
  CacheEntryStatus,
  InvalidationStrategy,
  WriteStrategy,
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
  ICacheSnapshot,
  ICacheExportOptions,
  ICacheImportOptions,
  ICacheWarmingStrategy,
  ICachePartition,
  IReplicationConfig,
  ICacheBackup,
  ICacheAuditEntry,
  ICacheAnalysis,
  ICachePaginationResult,
  ICacheNotification,
  ICachePreloadConfig,
  ICacheServiceConfig,
  ICacheRangeQuery,
  ICacheEntryWatch,
} from './types';
