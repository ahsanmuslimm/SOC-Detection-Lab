/**
 * Event Pipeline Service - Type Definitions
 * Type definitions for event ingestion, processing, filtering, and distribution
 */

/**
 * Event source
 */
export type EventSource =
  | 'detection-engine'
  | 'threat-intelligence'
  | 'network-sensor'
  | 'endpoint-agent'
  | 'user-action'
  | 'system-event'
  | 'external-feed'
  | 'api-call'
  | 'manual-entry'
  | string;

/**
 * Event priority
 */
export type EventPriority = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Event status
 */
export type EventStatus = 'ingested' | 'processing' | 'enriched' | 'correlated' | 'distributed' | 'archived';

/**
 * Event correlation type
 */
export type CorrelationType = 'threat' | 'user' | 'asset' | 'time-window' | 'pattern' | 'behavioral';

/**
 * Enrichment type
 */
export type EnrichmentType =
  | 'threat-intel'
  | 'context'
  | 'metadata'
  | 'correlation'
  | 'normalization'
  | 'classification';

/**
 * Pipeline stage
 */
export type PipelineStage = 'ingestion' | 'validation' | 'enrichment' | 'correlation' | 'distribution' | 'archive';

/**
 * Event data
 */
export interface IEventData {
  [key: string]: unknown;
}

/**
 * Event context
 */
export interface IEventContext {
  correlationId: string;
  traceId: string;
  userId?: string;
  sessionId?: string;
  source: EventSource;
  metadata?: Record<string, unknown>;
}

/**
 * Event enrichment
 */
export interface IEventEnrichment {
  enrichmentId: string;
  type: EnrichmentType;
  source: string;
  data: Record<string, unknown>;
  appliedAt: Date;
  confidence?: number;
}

/**
 * Event correlation
 */
export interface IEventCorrelation {
  correlationId: string;
  type: CorrelationType;
  relatedEventIds: string[];
  groupId: string;
  score: number;
  metadata?: Record<string, unknown>;
}

/**
 * Pipeline event
 */
export interface IPipelineEvent {
  eventId: string;
  timestamp: Date;
  source: EventSource;
  priority: EventPriority;
  status: EventStatus;
  data: IEventData;
  context: IEventContext;
  enrichments: IEventEnrichment[];
  correlations: IEventCorrelation[];
  ingestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
}

/**
 * Event filter
 */
export interface IEventFilter {
  filterId: string;
  name: string;
  description?: string;
  isActive: boolean;
  priority: number;
  conditions: IFilterCondition[];
  action: 'accept' | 'reject' | 'transform' | 'route';
  metadata?: Record<string, unknown>;
}

/**
 * Filter condition
 */
export interface IFilterCondition {
  conditionId: string;
  field: string;
  operator: 'equals' | 'contains' | 'regex' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'startsWith' | 'endsWith';
  value: unknown;
  caseSensitive?: boolean;
}

/**
 * Event processor
 */
export interface IEventProcessor {
  processorId: string;
  name: string;
  description?: string;
  priority: number;
  isActive: boolean;
  handler: (event: IPipelineEvent) => Promise<IPipelineEvent>;
  filters?: IEventFilter[];
}

/**
 * Event enricher
 */
export interface IEventEnricher {
  enricherId: string;
  name: string;
  description?: string;
  priority: number;
  isActive: boolean;
  enrichmentType: EnrichmentType;
  handler: (event: IPipelineEvent) => Promise<IEventEnrichment[]>;
}

/**
 * Event correlator
 */
export interface IEventCorrelator {
  correlatorId: string;
  name: string;
  description?: string;
  priority: number;
  isActive: boolean;
  correlationType: CorrelationType;
  timeWindowMs?: number;
  handler: (event: IPipelineEvent, history: IPipelineEvent[]) => Promise<IEventCorrelation[]>;
}

/**
 * Event distributor
 */
export interface IEventDistributor {
  distributorId: string;
  name: string;
  description?: string;
  priority: number;
  isActive: boolean;
  filters?: IEventFilter[];
  handler: (event: IPipelineEvent) => Promise<void>;
}

/**
 * Ingestion configuration
 */
export interface IIngestionConfig {
  maxBatchSize: number;
  batchTimeoutMs: number;
  maxQueueSize: number;
  deduplicationEnabled: boolean;
  deduplicationWindowMs?: number;
}

/**
 * Processing configuration
 */
export interface IProcessingConfig {
  parallelProcessors: number;
  timeoutMs: number;
  maxRetries: number;
  retryBackoffMs: number;
}

/**
 * Enrichment configuration
 */
export interface IEnrichmentConfig {
  enableCaching: boolean;
  cacheTtlMs?: number;
  maxEnrichersPerEvent: number;
  timeoutPerEnricherMs: number;
}

/**
 * Correlation configuration
 */
export interface ICorrelationConfig {
  enableCorrelation: boolean;
  maxHistoryPerEvent: number;
  timeWindowMs: number;
  minCorrelationScore: number;
}

/**
 * Distribution configuration
 */
export interface IDistributionConfig {
  maxDistributorsPerEvent: number;
  timeoutPerDistributorMs: number;
  failFastMode: boolean;
}

/**
 * Pipeline configuration
 */
export interface IPipelineConfig {
  enableIngestion: boolean;
  enableValidation: boolean;
  enableEnrichment: boolean;
  enableCorrelation: boolean;
  enableDistribution: boolean;
  enableArchive: boolean;
  ingestionConfig?: IIngestionConfig;
  processingConfig?: IProcessingConfig;
  enrichmentConfig?: IEnrichmentConfig;
  correlationConfig?: ICorrelationConfig;
  distributionConfig?: IDistributionConfig;
  enableMetrics: boolean;
  enableAudit: boolean;
  enableLogging: boolean;
  maxArchiveSize?: number;
  cleanupIntervalMs?: number;
}

/**
 * Pipeline statistics
 */
export interface IPipelineStats {
  totalEventsIngested: number;
  eventsProcessing: number;
  eventsEnriched: number;
  eventsCorrelated: number;
  eventsDistributed: number;
  eventsArchived: number;
  failedEvents: number;
  averageProcessingTimeMs: number;
  averageEnrichmentTimeMs: number;
  averageCorrelationTimeMs: number;
  averageDistributionTimeMs: number;
  throughputEventsPerSecond: number;
  eventsByPriority: Record<EventPriority, number>;
  eventsBySource: Record<EventSource, number>;
  processingErrorRate: number;
}

/**
 * Pipeline audit entry
 */
export interface IPipelineAuditEntry {
  entryId: string;
  timestamp: Date;
  eventId: string;
  action: 'ingested' | 'validated' | 'enriched' | 'correlated' | 'distributed' | 'archived' | 'failed';
  stage: PipelineStage;
  duration?: number;
  details?: Record<string, unknown>;
}

/**
 * Event listener
 */
export type EventPipelineListener = (event: IPipelineEvent) => Promise<void> | void;

/**
 * Stage listener
 */
export type StageListener = (event: IPipelineEvent, stage: PipelineStage) => Promise<void> | void;

/**
 * Deduplication record
 */
export interface IDeduplicationRecord {
  recordId: string;
  eventHash: string;
  originalEventId: string;
  duplicateCount: number;
  firstSeen: Date;
  lastSeen: Date;
  expiresAt: Date;
}

/**
 * Event cache entry
 */
export interface IEventCacheEntry {
  eventId: string;
  event: IPipelineEvent;
  cachedAt: Date;
  expiresAt: Date;
  accessCount: number;
}

/**
 * Pipeline health check
 */
export interface IPipelineHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  stageHealth: Record<PipelineStage, 'healthy' | 'degraded' | 'unhealthy'>;
  queueDepth: number;
  processingRate: number;
  errorRate: number;
  checks: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
  }>;
}

/**
 * Event query
 */
export interface IEventQuery {
  eventId?: string;
  sourceFilter?: EventSource[];
  priorityFilter?: EventPriority[];
  statusFilter?: EventStatus[];
  startDate?: Date;
  endDate?: Date;
  correlationId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Batch ingestion request
 */
export interface IBatchIngestionRequest {
  events: Array<{
    source: EventSource;
    priority?: EventPriority;
    data: IEventData;
    context?: Partial<IEventContext>;
  }>;
  deduplicateWithin?: number;
}

/**
 * Event processing result
 */
export interface IEventProcessingResult {
  eventId: string;
  success: boolean;
  stage: PipelineStage;
  startTime: Date;
  endTime: Date;
  durationMs: number;
  errors?: string[];
  warnings?: string[];
}

/**
 * Pipeline batch result
 */
export interface IPipelineBatchResult {
  batchId: string;
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  averageDurationMs: number;
  results: IEventProcessingResult[];
}

/**
 * Event replay request
 */
export interface IEventReplayRequest {
  startDate: Date;
  endDate: Date;
  sourceFilter?: EventSource[];
  priorityFilter?: EventPriority[];
  reprocessWithEnrichment?: boolean;
  reprocessWithCorrelation?: boolean;
}

/**
 * Event replay result
 */
export interface IEventReplayResult {
  replayId: string;
  totalEventsReplayed: number;
  successfulReplays: number;
  failedReplays: number;
  startTime: Date;
  completionTime: Date;
  durationMs: number;
}
