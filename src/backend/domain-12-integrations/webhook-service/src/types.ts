/**
 * Webhook Service - Type Definitions
 * Type definitions for event-driven webhook management and delivery
 */

/**
 * Webhook event type
 */
export type WebhookEventType =
  | 'alert.triggered'
  | 'alert.resolved'
  | 'detection.created'
  | 'detection.updated'
  | 'detection.resolved'
  | 'incident.created'
  | 'incident.updated'
  | 'incident.closed'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'role.created'
  | 'role.updated'
  | 'role.deleted'
  | 'policy.created'
  | 'policy.updated'
  | 'policy.deleted'
  | 'audit.logged'
  | 'system.started'
  | 'system.stopped'
  | string;

/**
 * Webhook delivery status
 */
export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying' | 'abandoned';

/**
 * Webhook delivery method
 */
export type WebhookDeliveryMethod = 'http' | 'https';

/**
 * Webhook signing algorithm
 */
export type WebhookSigningAlgorithm = 'hmac-sha256' | 'hmac-sha512' | 'none';

/**
 * Webhook event payload
 */
export interface IWebhookEventPayload {
  eventId: string;
  eventType: WebhookEventType;
  timestamp: Date;
  source: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Webhook subscription
 */
export interface IWebhookSubscription {
  subscriptionId: string;
  name: string;
  description?: string;
  url: string;
  method: WebhookDeliveryMethod;
  eventTypes: WebhookEventType[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  secret?: string;
  signingAlgorithm?: WebhookSigningAlgorithm;
  headers?: Record<string, string>;
  retryPolicy?: IWebhookRetryPolicy;
  filters?: IWebhookFilter[];
  maxRetries?: number;
  timeoutMs?: number;
}

/**
 * Webhook retry policy
 */
export interface IWebhookRetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  backoffType: 'exponential' | 'linear';
}

/**
 * Webhook filter
 */
export interface IWebhookFilter {
  filterId: string;
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte' | 'regex' | 'in';
  value: unknown;
  caseSensitive?: boolean;
}

/**
 * Webhook delivery attempt
 */
export interface IWebhookDeliveryAttempt {
  attemptId: string;
  deliveryId: string;
  subscriptionId: string;
  attemptNumber: number;
  status: WebhookDeliveryStatus;
  httpStatus?: number;
  request: IWebhookRequest;
  response?: IWebhookResponse;
  error?: string;
  timestamp: Date;
  durationMs: number;
}

/**
 * Webhook request
 */
export interface IWebhookRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  signature?: string;
}

/**
 * Webhook response
 */
export interface IWebhookResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  size: number;
}

/**
 * Webhook delivery
 */
export interface IWebhookDelivery {
  deliveryId: string;
  subscriptionId: string;
  event: IWebhookEventPayload;
  status: WebhookDeliveryStatus;
  attempts: IWebhookDeliveryAttempt[];
  createdAt: Date;
  nextRetryAt?: Date;
  completedAt?: Date;
  success: boolean;
}

/**
 * Webhook subscription configuration
 */
export interface IWebhookSubscriptionConfig {
  name: string;
  description?: string;
  url: string;
  method?: WebhookDeliveryMethod;
  eventTypes: WebhookEventType[];
  secret?: string;
  signingAlgorithm?: WebhookSigningAlgorithm;
  headers?: Record<string, string>;
  retryPolicy?: IWebhookRetryPolicy;
  filters?: IWebhookFilter[];
  maxRetries?: number;
  timeoutMs?: number;
}

/**
 * Webhook registration result
 */
export interface IWebhookRegistrationResult {
  subscriptionId: string;
  registered: boolean;
  errors?: string[];
}

/**
 * Webhook delivery result
 */
export interface IWebhookDeliveryResult {
  deliveryId: string;
  success: boolean;
  status: WebhookDeliveryStatus;
  attempts: number;
  error?: string;
  completedAt: Date;
}

/**
 * Webhook statistics
 */
export interface IWebhookStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageDeliveryTimeMs: number;
  deliveriesByStatus: Record<WebhookDeliveryStatus, number>;
  deliveriesByEventType: Record<WebhookEventType, number>;
  successRate: number;
}

/**
 * Webhook event filter
 */
export interface IWebhookEventFilter {
  eventType?: WebhookEventType;
  subscriptionId?: string;
  status?: WebhookDeliveryStatus;
  startDate?: Date;
  endDate?: Date;
  createdBy?: string;
  limit?: number;
  offset?: number;
}

/**
 * Webhook audit entry
 */
export interface IWebhookAuditEntry {
  entryId: string;
  timestamp: Date;
  action: 'created' | 'updated' | 'deleted' | 'triggered' | 'retried' | 'abandoned';
  subscriptionId?: string;
  deliveryId?: string;
  userId: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Webhook event listener
 */
export type WebhookEventListener = (event: IWebhookEventPayload) => Promise<void> | void;

/**
 * Webhook delivery listener
 */
export type WebhookDeliveryListener = (delivery: IWebhookDelivery) => Promise<void> | void;

/**
 * Webhook service configuration
 */
export interface IWebhookServiceConfig {
  enableRetry: boolean;
  enableSignature: boolean;
  defaultMaxRetries: number;
  defaultTimeoutMs: number;
  defaultRetryPolicy?: IWebhookRetryPolicy;
  enableAudit: boolean;
  enableMetrics: boolean;
  maxSubscriptions?: number;
  maxDeliveryHistory?: number;
  cleanupIntervalMs?: number;
  enableLogging: boolean;
}

/**
 * Webhook test result
 */
export interface IWebhookTestResult {
  subscriptionId: string;
  success: boolean;
  httpStatus?: number;
  responseTime: number;
  error?: string;
  attempts: IWebhookDeliveryAttempt[];
}

/**
 * Webhook subscription update
 */
export interface IWebhookSubscriptionUpdate {
  name?: string;
  description?: string;
  url?: string;
  method?: WebhookDeliveryMethod;
  eventTypes?: WebhookEventType[];
  isActive?: boolean;
  secret?: string;
  signingAlgorithm?: WebhookSigningAlgorithm;
  headers?: Record<string, string>;
  retryPolicy?: IWebhookRetryPolicy;
  filters?: IWebhookFilter[];
  maxRetries?: number;
  timeoutMs?: number;
}

/**
 * Webhook batch event trigger
 */
export interface IWebhookBatchEventTrigger {
  events: IWebhookEventPayload[];
  failFast?: boolean;
}

/**
 * Webhook batch delivery result
 */
export interface IWebhookBatchDeliveryResult {
  totalEvents: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  results: IWebhookDeliveryResult[];
}

/**
 * Webhook health check
 */
export interface IWebhookHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  activeSubscriptions: number;
  pendingDeliveries: number;
  failedDeliveries: number;
  uptime: number;
  checks: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
  }>;
}

/**
 * Webhook event context
 */
export interface IWebhookEventContext {
  eventId: string;
  eventType: WebhookEventType;
  source: string;
  correlationId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Webhook rate limit state
 */
export interface IWebhookRateLimitState {
  subscriptionId: string;
  requests: number;
  resetTime: Date;
  isLimited: boolean;
}

