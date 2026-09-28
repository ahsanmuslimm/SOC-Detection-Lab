/**
 * Sync Service - Type Definitions
 * Data synchronization, conflict resolution, and bi-directional replication
 */

/**
 * Sync job status
 */
export type SyncStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';

/**
 * Sync direction
 */
export type SyncDirection = 'unidirectional' | 'bidirectional';

/**
 * Conflict resolution strategy
 */
export type ConflictResolution = 'source-wins' | 'target-wins' | 'manual' | 'timestamp' | 'version' | 'merge';

/**
 * Data entity
 */
export interface IDataEntity {
  entityId: string;
  type: string;
  data: Record<string, any>;
  version: number;
  lastModified: Date;
  lastModifiedBy?: string;
  sourceId: string;
  metadata?: Record<string, any>;
  checksum?: string;
}

/**
 * Sync endpoint
 */
export interface ISyncEndpoint {
  endpointId: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'storage' | 'webhook';
  config: {
    connectionString?: string;
    apiUrl?: string;
    credentials?: Record<string, any>;
    path?: string;
  };
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sync configuration
 */
export interface ISyncConfig {
  syncId: string;
  name: string;
  description?: string;
  sourceEndpoint: ISyncEndpoint;
  targetEndpoint: ISyncEndpoint;
  direction: SyncDirection;
  entityTypes: string[];
  conflictResolution: ConflictResolution;
  scheduleType: 'manual' | 'continuous' | 'scheduled';
  scheduleInterval?: number; // ms
  batchSize: number;
  retryPolicy: IRetryPolicy;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Retry policy
 */
export interface IRetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Sync job
 */
export interface ISyncJob {
  jobId: string;
  syncId: string;
  status: SyncStatus;
  startedAt: Date;
  completedAt?: Date;
  totalEntities: number;
  syncedEntities: number;
  failedEntities: number;
  conflictEntities: number;
  progress: number;
  error?: string;
  statistics: ISyncStatistics;
  results: ISyncResult[];
}

/**
 * Sync statistics
 */
export interface ISyncStatistics {
  jobId: string;
  totalTime: number;
  averageTimePerEntity: number;
  entitiesPerSecond: number;
  successRate: number;
  conflictRate: number;
  bandwidthUsed: number;
  bytesTransferred: number;
}

/**
 * Sync result
 */
export interface ISyncResult {
  resultId: string;
  jobId: string;
  entityId: string;
  entityType: string;
  action: 'created' | 'updated' | 'deleted' | 'skipped' | 'conflict';
  sourceVersion: number;
  targetVersion: number;
  timestamp: Date;
  details?: Record<string, any>;
}

/**
 * Sync conflict
 */
export interface ISyncConflict {
  conflictId: string;
  jobId: string;
  entityId: string;
  entityType: string;
  sourceData: IDataEntity;
  targetData: IDataEntity;
  reason: string;
  resolved: boolean;
  resolution?: ConflictResolution;
  resolvedData?: Record<string, any>;
  resolvedBy?: string;
  resolvedAt?: Date;
}

/**
 * Sync filter
 */
export interface ISyncFilter {
  filterId: string;
  syncId: string;
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'regex';
  value: any;
  enabled: boolean;
}

/**
 * Sync transformation
 */
export interface ISyncTransformation {
  transformId: string;
  syncId: string;
  name: string;
  type: 'field-map' | 'filter' | 'aggregate' | 'custom';
  sourceField?: string;
  targetField?: string;
  transform?: string; // JavaScript function as string
  enabled: boolean;
  order: number;
}

/**
 * Sync checkpoint
 */
export interface ISyncCheckpoint {
  checkpointId: string;
  syncId: string;
  lastSyncedAt: Date;
  lastSyncedEntityId?: string;
  lastModifiedDate?: Date;
  state: Record<string, any>;
  version: number;
}

/**
 * Sync audit entry
 */
export interface ISyncAuditEntry {
  auditId: string;
  timestamp: Date;
  jobId: string;
  action: 'start' | 'complete' | 'fail' | 'skip' | 'conflict' | 'retry';
  entityId?: string;
  entityType?: string;
  status: 'success' | 'failure';
  details?: Record<string, any>;
}

/**
 * Sync batch result
 */
export interface ISyncBatchResult {
  batchId: string;
  totalBatches: number;
  batchNumber: number;
  entities: IDataEntity[];
  processedCount: number;
  failedCount: number;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Sync health check
 */
export interface ISyncHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  activeJobs: number;
  queuedJobs: number;
  failedJobsLastHour: number;
  averageSyncTime: number;
  lastSuccessfulSync?: Date;
  endpoints: Array<{
    name: string;
    status: 'connected' | 'disconnected' | 'error';
    lastChecked: Date;
  }>;
}

/**
 * Sync event
 */
export interface ISyncEvent {
  eventId: string;
  timestamp: Date;
  type: 'sync-started' | 'sync-completed' | 'sync-failed' | 'conflict-detected' | 'endpoint-down' | 'checkpoint-created';
  jobId?: string;
  syncId?: string;
  details?: Record<string, any>;
}

/**
 * Sync listener
 */
export type SyncListener = (event: ISyncEvent) => Promise<void> | void;

/**
 * Sync metrics
 */
export interface ISyncMetrics {
  timestamp: Date;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalEntitiesSynced: number;
  averageSyncDuration: number;
  successRate: number;
  conflictRate: number;
  throughput: number; // entities/sec
}

/**
 * Sync service configuration
 */
export interface ISyncServiceConfig {
  maxConcurrentSyncs: number;
  maxBatchSize: number;
  defaultBatchSize: number;
  enableCheckpoints: boolean;
  checkpointInterval: number;
  enableAudit: boolean;
  maxAuditEntries: number;
  enableMetrics: boolean;
  enableConflictTracking: boolean;
  cleanupIntervalMs: number;
  retentionDays: number;
  requestTimeoutMs: number;
  maxRetries: number;
}

/**
 * Data delta
 */
export interface IDataDelta {
  deltaId: string;
  entityId: string;
  entityType: string;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  timestamp: Date;
  version: number;
}

/**
 * Sync mapping
 */
export interface ISyncMapping {
  mappingId: string;
  syncId: string;
  sourceField: string;
  targetField: string;
  dataType: string;
  transformer?: string;
  required: boolean;
  enabled: boolean;
}

/**
 * Sync validation rule
 */
export interface ISyncValidationRule {
  ruleId: string;
  syncId: string;
  field: string;
  validationType: 'required' | 'format' | 'range' | 'regex' | 'custom';
  config: Record<string, any>;
  enabled: boolean;
}

/**
 * Incremental sync marker
 */
export interface IIncrementalSyncMarker {
  markerId: string;
  syncId: string;
  lastModifiedDate: Date;
  lastSyncedVersion: number;
  nextMarkerDate?: Date;
}

/**
 * Sync schema
 */
export interface ISyncSchema {
  schemaId: string;
  syncId: string;
  sourceSchema: Record<string, any>;
  targetSchema: Record<string, any>;
  mappings: ISyncMapping[];
  validationRules: ISyncValidationRule[];
  transformations: ISyncTransformation[];
}

/**
 * Deduplication config
 */
export interface IDeduplicationConfig {
  configId: string;
  syncId: string;
  enabled: boolean;
  fields: string[];
  strategy: 'first-wins' | 'last-wins' | 'merge';
}

/**
 * Sync state
 */
export interface ISyncState {
  stateId: string;
  syncId: string;
  currentVersion: number;
  lastSyncTime: Date;
  entityStates: Map<string, ISyncEntityState>;
  conflicts: ISyncConflict[];
}

/**
 * Entity sync state
 */
export interface ISyncEntityState {
  entityId: string;
  lastSyncedVersion: number;
  lastSyncStatus: 'success' | 'failed' | 'conflict';
  lastSyncTime: Date;
  retryCount: number;
}

/**
 * Sync progress
 */
export interface ISyncProgress {
  jobId: string;
  totalEntities: number;
  processedEntities: number;
  failedEntities: number;
  conflictEntities: number;
  percentage: number;
  estimatedTimeRemaining: number;
  currentBatch: number;
  totalBatches: number;
}
