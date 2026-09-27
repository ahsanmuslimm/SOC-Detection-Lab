/**
 * Cache Client - Public API
 */

export { CacheClient, createCacheClient } from './main';

export type {
  ICacheConfig,
  ICacheOptions,
  ICacheStats,
  IKeyPattern,
  ICacheEntry,
  IBatchCacheOp,
  IBatchCacheResult,
  CacheListener,
  ICacheEvent,
  ILockOptions,
  IDistributedLock,
  IPubSubSubscription,
  IPubSubMessage,
  ISortedSetMember,
  IStreamEntry,
  ICacheInvalidation,
  IScanResult,
} from './types';
