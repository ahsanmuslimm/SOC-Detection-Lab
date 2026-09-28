/**
 * Queue Service - Public API Exports
 * Message queuing with priorities, retries, and delivery guarantees
 */

export { QueueService, createQueueService } from './main';
export type {
  MessagePriority,
  DeliveryGuarantee,
  MessageStatus,
  QueueType,
  IQueueMessage,
  IQueueConfig,
  IRetryPolicy,
  IDeadLetterConfig,
  IQueueConsumer,
  MessageHandler,
  QueueListener,
  IQueueEvent,
  IQueueStats,
  IQueueHealthCheck,
  IBatchMessageResult,
  IMessageBatch,
  IQueueMetrics,
  IDeadLetterMessage,
  IQueueAuditEntry,
  IMessageProcessingContext,
  IQueuePurgeResult,
  IQueueServiceConfig,
  IMessageOrderingGuarantee,
  IQueueCapacityInfo,
  IConsumerGroup,
  IDeadLetterQueueStats,
} from './types';
