/**
 * Sync Service - Public API
 */

export { SyncService, createSyncService } from './main';

export type {
  SyncStatus,
  SyncDirection,
  ConflictResolution,
  IDataEntity,
  ISyncEndpoint,
  ISyncConfig,
  IRetryPolicy,
  ISyncJob,
  ISyncStatistics,
  ISyncResult,
  ISyncConflict,
  ISyncFilter,
  ISyncTransformation,
  ISyncCheckpoint,
  ISyncAuditEntry,
  ISyncBatchResult,
  ISyncHealthCheck,
  ISyncEvent,
  SyncListener,
  ISyncMetrics,
  ISyncServiceConfig,
  IDataDelta,
  ISyncMapping,
  ISyncValidationRule,
  IIncrementalSyncMarker,
  ISyncSchema,
  IDeduplicationConfig,
  ISyncState,
  ISyncEntityState,
  ISyncProgress,
} from './types';
