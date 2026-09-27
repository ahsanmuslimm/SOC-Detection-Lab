/**
 * Event Pipeline Service - Public API
 */

export { EventPipeline, createEventPipeline } from './main';

export type {
  EventSource,
  EventPriority,
  EventStatus,
  CorrelationType,
  EnrichmentType,
  PipelineStage,
  IEventData,
  IEventContext,
  IEventEnrichment,
  IEventCorrelation,
  IPipelineEvent,
  IEventFilter,
  IEventProcessor,
  IEventEnricher,
  IEventCorrelator,
  IEventDistributor,
  IIngestionConfig,
  IProcessingConfig,
  IEnrichmentConfig,
  ICorrelationConfig,
  IDistributionConfig,
  IPipelineConfig,
  IPipelineStats,
  IPipelineAuditEntry,
  EventPipelineListener,
  StageListener,
  IDeduplicationRecord,
  IEventCacheEntry,
  IPipelineHealthCheck,
  IEventQuery,
  IBatchIngestionRequest,
  IEventProcessingResult,
  IPipelineBatchResult,
  IEventReplayRequest,
  IEventReplayResult,
} from './types';
