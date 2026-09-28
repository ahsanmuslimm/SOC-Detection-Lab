/**
 * Cache Service - Type Definitions
 * High-performance distributed caching with eviction policies and metrics
 */

/**
 * Cache eviction policy
 */
export type EvictionPolicy = 'LRU' | 'LFU' | 'FIFO' | 'TTL' | 'ARC' | 'W-TinyLFU';

/**
 * Cache compression algorithm
 */
export type CompressionAlgorithm = 'gzip' | 'brotli' | 'deflate' | 'lz4' | 'none';

/**
 * Cache statistics scope
 */
export type StatisticsScope = 'global' | 'local' | 'key' | 'pattern';

/**
 * Cache entry status
 */
export type CacheEntryStatus = 'active' | 'expired' | 'evicted' | 'invalidated';

/**
 * Cache invalidation strategy
 */
export type InvalidationStrategy = 'immediate' | 'lazy' | 'background' | 'event-driven';

/**
 * Cache write strategy
 */
export type WriteStrategy = 'write-through' | 'write-back' | 'write-around';

/**
 * Cache entry value
 */
export interface ICacheValue<T = any> {
  key: string;
  value: T;
  size: number;
  createdAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  ttl?: number;
  tags?: string[];
  compressed: boolean;
  metadata?: Record<string, any>;
}

/**
 * Cache entry metadata
 */
export interface ICacheEntryMetadata {
  key: string;
  size: number;
  createdAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  ttl?: number;
  status: CacheEntryStatus;
  expiresAt?: Date;
}

/**
 * Cache statistics
 */
export interface ICacheStats {
  hits: number;
  misses: number;
  evictions: number;
  expirations: number;
  invalidations: number;
  totalSize: number;
  entryCount: number;
  hitRate: number;
  averageAccessTime: number;
  lastUpdated: Date;
}

/**
 * Cache performance metrics
 */
export interface ICacheMetrics {
  timestamp: Date;
  hitRate: number;
  missRate: number;
  evictionRate: number;
  expirationRate: number;
  averageEntrySize: number;
  memoryUtilization: number;
  operationTime: {
    get: number;
    set: number;
    delete: number;
    update: number;
  };
}

/**
 * Cache configuration
 */
export interface ICacheConfig {
  maxSize: number; // Maximum size in bytes
  maxEntries: number; // Maximum number of entries
  defaultTTL: number; // Default TTL in milliseconds
  evictionPolicy: EvictionPolicy;
  enableCompression: boolean;
  compressionAlgorithm: CompressionAlgorithm;
  compressionThreshold: number; // Minimum size to compress
  writeStrategy: WriteStrategy;
  invalidationStrategy: InvalidationStrategy;
  enableMetrics: boolean;
  enableStatistics: boolean;
  cleanupInterval: number; // Interval in milliseconds
  warmupEnabled: boolean;
  warmupData?: Record<string, any>;
}

/**
 * Cache eviction result
 */
export interface IEvictionResult {
  evictionId: string;
  timestamp: Date;
  policy: EvictionPolicy;
  itemsEvicted: number;
  spaceFreed: number;
  duration: number;
}

/**
 * Cache invalidation pattern
 */
export interface IInvalidationPattern {
  patternId: string;
  pattern: string;
  strategy: InvalidationStrategy;
  enabled: boolean;
  tags?: string[];
  condition?: (key: string, value: any) => boolean;
  createdAt: Date;
}

/**
 * Cache listener
 */
export type CacheListener = (event: ICacheEvent) => Promise<void> | void;

/**
 * Cache event
 */
export interface ICacheEvent {
  eventId: string;
  timestamp: Date;
  type: 'set' | 'get' | 'delete' | 'update' | 'evict' | 'expire' | 'invalidate' | 'clear';
  key?: string;
  value?: any;
  size?: number;
  duration?: number;
}

/**
 * Cache health check
 */
export interface ICacheHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
  }>;
}

/**
 * Cache entry filter
 */
export interface ICacheEntryFilter {
  keys?: string[];
  tags?: string[];
  pattern?: string;
  minSize?: number;
  maxSize?: number;
  minAccessCount?: number;
  createdBefore?: Date;
  createdAfter?: Date;
  accessedBefore?: Date;
  accessedAfter?: Date;
}

/**
 * Cache bulk operation
 */
export interface ICacheBulkOperation {
  operationId: string;
  timestamp: Date;
  type: 'set' | 'delete' | 'invalidate';
  itemCount: number;
  successCount: number;
  failureCount: number;
  duration: number;
  errors?: Array<{
    key: string;
    error: string;
  }>;
}

/**
 * Cache snapshot
 */
export interface ICacheSnapshot {
  snapshotId: string;
  timestamp: Date;
  entries: Map<string, ICacheValue>;
  size: number;
  entryCount: number;
  stats: ICacheStats;
  compressionRatio?: number;
}

/**
 * Cache export options
 */
export interface ICacheExportOptions {
  format: 'json' | 'msgpack' | 'protobuf' | 'binary';
  includeMetadata: boolean;
  includeStats: boolean;
  filters?: ICacheEntryFilter;
  compress: boolean;
}

/**
 * Cache import options
 */
export interface ICacheImportOptions {
  format: 'json' | 'msgpack' | 'protobuf' | 'binary';
  merge: boolean;
  overwrite: boolean;
  validateOnly: boolean;
}

/**
 * Cache warming strategy
 */
export interface ICacheWarmingStrategy {
  strategyId: string;
  name: string;
  data: Record<string, any>;
  priority: number;
  enabled: boolean;
  schedule?: string; // Cron expression
  createdAt: Date;
}

/**
 * Cache partition configuration
 */
export interface ICachePartition {
  partitionId: string;
  name: string;
  maxSize: number;
  maxEntries: number;
  evictionPolicy: EvictionPolicy;
  priority: number;
  enabled: boolean;
  createdAt: Date;
}

/**
 * Cache replication config
 */
export interface IReplicationConfig {
  enabled: boolean;
  replicas: number;
  strategy: 'synchronous' | 'asynchronous';
  nodes?: string[];
  consistency: 'strong' | 'eventual';
}

/**
 * Cache backup
 */
export interface ICacheBackup {
  backupId: string;
  timestamp: Date;
  size: number;
  entryCount: number;
  compressed: boolean;
  encrypted: boolean;
  location?: string;
  restorable: boolean;
}

/**
 * Cache audit entry
 */
export interface ICacheAuditEntry {
  auditId: string;
  timestamp: Date;
  operation: string;
  key?: string;
  value?: any;
  result: 'success' | 'failure';
  duration: number;
  userId?: string;
}

/**
 * Cache hit/miss analysis
 */
export interface ICacheAnalysis {
  analysisId: string;
  timestamp: Date;
  period: string;
  totalRequests: number;
  hits: number;
  misses: number;
  hitRate: number;
  topMisses: Array<{
    key: string;
    missCount: number;
  }>;
  topHits: Array<{
    key: string;
    hitCount: number;
  }>;
}

/**
 * Cache pagination result
 */
export interface ICachePaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Cache notification
 */
export interface ICacheNotification {
  notificationId: string;
  timestamp: Date;
  type: 'eviction' | 'expiration' | 'invalidation' | 'threshold' | 'error';
  message: string;
  severity: 'info' | 'warning' | 'error';
  metadata?: Record<string, any>;
}

/**
 * Cache preload configuration
 */
export interface ICachePreloadConfig {
  enabled: boolean;
  dataSource: string;
  batchSize: number;
  priority: 'low' | 'normal' | 'high';
  timeout: number;
  retryAttempts: number;
}

/**
 * Cache service configuration
 */
export interface ICacheServiceConfig {
  maxSize: number;
  maxEntries: number;
  defaultTTL: number;
  evictionPolicy: EvictionPolicy;
  enableCompression: boolean;
  compressionAlgorithm: CompressionAlgorithm;
  compressionThreshold: number;
  writeStrategy: WriteStrategy;
  invalidationStrategy: InvalidationStrategy;
  enableMetrics: boolean;
  enableStatistics: boolean;
  cleanupInterval: number;
  enableAudit: boolean;
  maxAuditEntries: number;
  enableReplication: boolean;
  replicationConfig?: IReplicationConfig;
  enablePartitioning: boolean;
  partitions?: ICachePartition[];
}

/**
 * Cache range query
 */
export interface ICacheRangeQuery {
  pattern: string;
  offset: number;
  limit: number;
  sortBy: 'key' | 'size' | 'accessCount' | 'createdAt' | 'lastAccessedAt';
  sortOrder: 'asc' | 'desc';
}

/**
 * Cache entry watch
 */
export interface ICacheEntryWatch {
  watchId: string;
  pattern: string;
  handler: CacheListener;
  active: boolean;
  createdAt: Date;
}
