/**
 * Queue Service - Type Definitions
 * Message queuing with priorities, retry policies, and delivery guarantees
 */

/**
 * Queue message priority
 */
export type MessagePriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Queue delivery guarantee
 */
export type DeliveryGuarantee = 'at-most-once' | 'at-least-once' | 'exactly-once';

/**
 * Message status
 */
export type MessageStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'dead-letter';

/**
 * Queue type
 */
export type QueueType = 'FIFO' | 'priority' | 'topic' | 'stream';

/**
 * Queue message
 */
export interface IQueueMessage {
  messageId: string;
  queueId: string;
  body: any;
  headers?: Record<string, any>;
  priority: MessagePriority;
  status: MessageStatus;
  createdAt: Date;
  processingStartedAt?: Date;
  completedAt?: Date;
  attempts: number;
  lastError?: string;
  delayMs?: number;
  ttlMs?: number;
  metadata?: Record<string, any>;
}

/**
 * Queue configuration
 */
export interface IQueueConfig {
  queueId: string;
  name: string;
  description?: string;
  type: QueueType;
  maxMessages: number;
  maxMessageSize: number;
  visibilityTimeoutMs: number;
  deliveryGuarantee: DeliveryGuarantee;
  retryPolicy: IRetryPolicy;
  deadLetterConfig?: IDeadLetterConfig;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Retry policy
 */
export interface IRetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  backoffType: 'linear' | 'exponential' | 'fixed';
  retryableErrors?: string[];
}

/**
 * Dead letter configuration
 */
export interface IDeadLetterConfig {
  enabled: boolean;
  maxRetries: number;
  deadLetterQueueId?: string;
}

/**
 * Queue consumer
 */
export interface IQueueConsumer {
  consumerId: string;
  queueId: string;
  name: string;
  active: boolean;
  concurrency: number;
  messagesProcessed: number;
  messagesFailed: number;
  createdAt: Date;
}

/**
 * Message handler
 */
export type MessageHandler = (message: IQueueMessage) => Promise<void> | void;

/**
 * Queue listener
 */
export type QueueListener = (event: IQueueEvent) => Promise<void> | void;

/**
 * Queue event
 */
export interface IQueueEvent {
  eventId: string;
  timestamp: Date;
  type: 'message-received' | 'message-processed' | 'message-failed' | 'message-dead-lettered' | 'queue-created' | 'consumer-registered';
  queueId?: string;
  messageId?: string;
  consumerId?: string;
  error?: string;
}

/**
 * Queue statistics
 */
export interface IQueueStats {
  queueId: string;
  totalMessages: number;
  pendingMessages: number;
  processingMessages: number;
  completedMessages: number;
  failedMessages: number;
  deadLetterMessages: number;
  averageProcessingTimeMs: number;
  totalConsumers: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Queue health check
 */
export interface IQueueHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  queues: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    messageCount: number;
    consumerCount: number;
  }>;
}

/**
 * Batch message result
 */
export interface IBatchMessageResult {
  successCount: number;
  failureCount: number;
  messageIds: string[];
  errors?: Array<{
    messageId: string;
    error: string;
  }>;
}

/**
 * Message batch
 */
export interface IMessageBatch {
  batchId: string;
  queueId: string;
  messageIds: string[];
  size: number;
  createdAt: Date;
}

/**
 * Queue metrics
 */
export interface IQueueMetrics {
  timestamp: Date;
  messageRate: number;
  averageLatencyMs: number;
  p50LatencyMs: number;
  p99LatencyMs: number;
  consumerUtilization: number;
  queueDepth: number;
  errorRate: number;
}

/**
 * Dead letter message
 */
export interface IDeadLetterMessage {
  messageId: string;
  originalQueueId: string;
  body: any;
  headers?: Record<string, any>;
  lastError: string;
  attempts: number;
  createdAt: Date;
  reason: string;
}

/**
 * Queue audit entry
 */
export interface IQueueAuditEntry {
  auditId: string;
  timestamp: Date;
  action: 'send' | 'receive' | 'delete' | 'retry' | 'consumer-registered';
  queueId: string;
  messageId?: string;
  userId?: string;
  details?: Record<string, any>;
}

/**
 * Message processing context
 */
export interface IMessageProcessingContext {
  message: IQueueMessage;
  consumer: IQueueConsumer;
  retryCount: number;
  processingStartTime: number;
}

/**
 * Queue purge result
 */
export interface IQueuePurgeResult {
  queueId: string;
  messagesPurged: number;
  timestamp: Date;
}

/**
 * Queue service configuration
 */
export interface IQueueServiceConfig {
  maxQueues: number;
  maxMessagesPerQueue: number;
  defaultVisibilityTimeoutMs: number;
  maxMessageSize: number;
  enableDeadLetterQueue: boolean;
  enableMetrics: boolean;
  enableAudit: boolean;
  maxAuditEntries: number;
  cleanupIntervalMs: number;
  enablePersistence: boolean;
  retentionDays: number;
}

/**
 * Message ordering guarantee
 */
export interface IMessageOrderingGuarantee {
  enabled: boolean;
  groupId: string;
  sequenceNumber: number;
}

/**
 * Queue capacity info
 */
export interface IQueueCapacityInfo {
  queueId: string;
  maxMessages: number;
  currentMessages: number;
  maxMessageSize: number;
  averageMessageSize: number;
  utilizationPercentage: number;
}

/**
 * Consumer group
 */
export interface IConsumerGroup {
  groupId: string;
  queueId: string;
  name: string;
  consumers: IQueueConsumer[];
  sharedState?: Record<string, any>;
  createdAt: Date;
}

/**
 * Queue dlq stats
 */
export interface IDeadLetterQueueStats {
  totalMessages: number;
  messagesByReason: Record<string, number>;
  oldestMessageAge: number;
  averageRetryAttempts: number;
  lastUpdated: Date;
}
