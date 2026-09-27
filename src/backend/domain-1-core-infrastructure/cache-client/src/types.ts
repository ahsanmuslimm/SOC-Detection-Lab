/**
 * Cache Client - Type Definitions
 * Type definitions for Redis caching operations
 */

/**
 * Redis connection configuration
 */
export interface ICacheConfig {
  host: string;
  port: number;
  database?: number;
  password?: string;
  username?: string;
  maxRetriesPerRequest?: number | null;
  enableReadyCheck?: boolean;
  enableOfflineQueue?: boolean;
  connectTimeout?: number;
  keepAlive?: number;
  tls?: boolean;
}

/**
 * Cache options
 */
export interface ICacheOptions {
  ttl?: number; // Time to live in seconds
  nx?: boolean; // Only set if not exists
  xx?: boolean; // Only set if exists
  ex?: number; // Expire in seconds
  px?: number; // Expire in milliseconds
}

/**
 * Cache statistics
 */
export interface ICacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number; // hits / (hits + misses)
}

/**
 * Cache key pattern
 */
export interface IKeyPattern {
  pattern: string;
  count: number;
}

/**
 * Cache entry
 */
export interface ICacheEntry<T = any> {
  key: string;
  value: T;
  ttl?: number;
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Batch operation
 */
export interface IBatchCacheOp {
  op: 'set' | 'get' | 'delete';
  key: string;
  value?: unknown;
  ttl?: number;
}

/**
 * Batch result
 */
export interface IBatchCacheResult {
  succeeded: number;
  failed: number;
  results: Array<{ key: string; success: boolean; error?: string }>;
}

/**
 * Cache listener
 */
export type CacheListener = (stats: ICacheEvent) => void;

/**
 * Cache event
 */
export interface ICacheEvent {
  operation: 'get' | 'set' | 'delete' | 'clear';
  key?: string;
  hit?: boolean;
  duration: number;
  timestamp: Date;
  error?: string;
}

/**
 * Lock options
 */
export interface ILockOptions {
  ttl?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Distributed lock
 */
export interface IDistributedLock {
  key: string;
  token: string;
  expiresAt: Date;
}

/**
 * Pub/Sub subscription
 */
export interface IPubSubSubscription {
  channel: string;
  pattern?: boolean;
  subscribed: boolean;
}

/**
 * Pub/Sub message
 */
export interface IPubSubMessage {
  channel: string;
  message: string;
  pattern?: string;
}

/**
 * Sorted set member
 */
export interface ISortedSetMember {
  member: string;
  score: number;
}

/**
 * Stream entry
 */
export interface IStreamEntry {
  id: string;
  fields: Record<string, string>;
}

/**
 * Cache invalidation pattern
 */
export interface ICacheInvalidation {
  pattern: string;
  exact?: boolean;
  count?: number;
}

/**
 * Scan cursor
 */
export interface IScanResult {
  cursor: string;
  keys: string[];
  hasMore: boolean;
}
