/**
 * Notification Service - Type Definitions
 * Type definitions for multi-channel notifications with templating and scheduling
 */

/**
 * Notification channel
 */
export type NotificationChannel = 'email' | 'sms' | 'push' | 'in-app' | 'slack' | 'teams' | 'webhook';

/**
 * Notification priority
 */
export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';

/**
 * Notification status
 */
export type NotificationStatus =
  | 'pending'
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'bounced'
  | 'read';

/**
 * Notification recipient
 */
export interface INotificationRecipient {
  recipientId: string;
  name: string;
  email?: string;
  phone?: string;
  pushTokens?: string[];
  preferences?: IRecipientPreferences;
}

/**
 * Recipient preferences
 */
export interface IRecipientPreferences {
  enabledChannels: NotificationChannel[];
  doNotDisturb?: {
    enabled: boolean;
    startTime?: string; // HH:mm format
    endTime?: string; // HH:mm format
  };
  unsubscribedCategories?: string[];
  language?: string;
  timezone?: string;
}

/**
 * Notification template
 */
export interface INotificationTemplate {
  templateId: string;
  name: string;
  category: string;
  version: number;
  channels: Record<NotificationChannel, ITemplateContent>;
  variables: ITemplateVariable[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

/**
 * Template content
 */
export interface ITemplateContent {
  subject?: string;
  body: string;
  htmlBody?: string;
  actionUrl?: string;
  actionText?: string;
}

/**
 * Template variable
 */
export interface ITemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone';
  required: boolean;
  description?: string;
  defaultValue?: unknown;
}

/**
 * Notification
 */
export interface INotification {
  notificationId: string;
  templateId: string;
  recipients: INotificationRecipient[];
  channels: NotificationChannel[];
  priority: NotificationPriority;
  status: NotificationStatus;
  variables: Record<string, unknown>;
  scheduledFor?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  createdBy: string;
}

/**
 * Notification delivery attempt
 */
export interface INotificationDeliveryAttempt {
  attemptId: string;
  notificationId: string;
  recipientId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt: Date;
  deliveredAt?: Date;
  failureReason?: string;
  retryCount: number;
  nextRetryAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Batch notification request
 */
export interface IBatchNotificationRequest {
  templateId: string;
  recipients: INotificationRecipient[];
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
  variables?: Record<string, unknown>;
  scheduledFor?: Date;
}

/**
 * Notification provider config
 */
export interface INotificationProviderConfig {
  providerId: string;
  name: string;
  channel: NotificationChannel;
  isActive: boolean;
  config: Record<string, unknown>;
  retryPolicy?: IRetryPolicy;
  rateLimit?: IRateLimit;
}

/**
 * Retry policy
 */
export interface IRetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  backoffType: 'exponential' | 'linear';
}

/**
 * Rate limit configuration
 */
export interface IRateLimit {
  maxPerSecond?: number;
  maxPerMinute?: number;
  maxPerHour?: number;
  maxPerDay?: number;
}

/**
 * Notification schedule
 */
export interface INotificationSchedule {
  scheduleId: string;
  name: string;
  description?: string;
  templateId: string;
  recipients: INotificationRecipient[];
  channels: NotificationChannel[];
  recurrence?: IRecurrencePattern;
  nextRunAt: Date;
  lastRunAt?: Date;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

/**
 * Recurrence pattern
 */
export interface IRecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval?: number;
  dayOfWeek?: number[];
  dayOfMonth?: number[];
  monthOfYear?: number[];
  timeOfDay: string; // HH:mm format
  endDate?: Date;
  maxOccurrences?: number;
}

/**
 * Notification statistics
 */
export interface INotificationStats {
  totalNotifications: number;
  sentNotifications: number;
  deliveredNotifications: number;
  failedNotifications: number;
  pendingNotifications: number;
  averageDeliveryTimeMs: number;
  deliveryByChannel: Record<NotificationChannel, number>;
  deliveryByStatus: Record<NotificationStatus, number>;
  deliverySuccessRate: number;
  failureRateByChannel: Record<NotificationChannel, number>;
}

/**
 * Notification audit entry
 */
export interface INotificationAuditEntry {
  entryId: string;
  timestamp: Date;
  notificationId: string;
  action: 'created' | 'scheduled' | 'sent' | 'delivered' | 'failed' | 'retried' | 'cancelled';
  details?: Record<string, unknown>;
}

/**
 * Notification listener
 */
export type NotificationListener = (notification: INotification) => Promise<void> | void;

/**
 * Delivery listener
 */
export type DeliveryListener = (delivery: INotificationDeliveryAttempt) => Promise<void> | void;

/**
 * Notification service configuration
 */
export interface INotificationServiceConfig {
  enableTemplating: boolean;
  enableScheduling: boolean;
  enableRetry: boolean;
  enableDeduplication: boolean;
  defaultPriority?: NotificationPriority;
  defaultChannels?: NotificationChannel[];
  defaultRetryPolicy?: IRetryPolicy;
  maxQueueSize?: number;
  maxDeliveryHistory?: number;
  cleanupIntervalMs?: number;
  enableAudit: boolean;
  enableMetrics: boolean;
  enableLogging: boolean;
}

/**
 * Notification query
 */
export interface INotificationQuery {
  notificationId?: string;
  templateId?: string;
  recipientId?: string;
  statusFilter?: NotificationStatus[];
  channelFilter?: NotificationChannel[];
  priorityFilter?: NotificationPriority[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Notification render result
 */
export interface INotificationRenderResult {
  subject?: string;
  body: string;
  htmlBody?: string;
  actionUrl?: string;
  actionText?: string;
}

/**
 * Notification health check
 */
export interface INotificationHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  activeProviders: number;
  queueDepth: number;
  successRate: number;
  checks: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
  }>;
}

/**
 * Notification batch result
 */
export interface INotificationBatchResult {
  batchId: string;
  templateId: string;
  totalRecipients: number;
  successfulNotifications: number;
  failedNotifications: number;
  pendingNotifications: number;
  results: Array<{
    recipientId: string;
    success: boolean;
    notificationIds: string[];
    errors?: string[];
  }>;
}

/**
 * Delivery report
 */
export interface IDeliveryReport {
  reportId: string;
  startDate: Date;
  endDate: Date;
  totalNotifications: number;
  deliveredNotifications: number;
  failedNotifications: number;
  pendingNotifications: number;
  averageDeliveryTimeMs: number;
  successRate: number;
  failureReasonBreakdown: Record<string, number>;
  channelPerformance: Record<NotificationChannel, IChannelPerformance>;
}

/**
 * Channel performance metrics
 */
export interface IChannelPerformance {
  channel: NotificationChannel;
  totalSent: number;
  delivered: number;
  failed: number;
  pending: number;
  averageDeliveryTimeMs: number;
  successRate: number;
  lastError?: string;
}

/**
 * Notification template update
 */
export interface INotificationTemplateUpdate {
  name?: string;
  category?: string;
  channels?: Record<NotificationChannel, ITemplateContent>;
  variables?: ITemplateVariable[];
  isActive?: boolean;
}

/**
 * Recipient update
 */
export interface IRecipientUpdate {
  name?: string;
  email?: string;
  phone?: string;
  pushTokens?: string[];
  preferences?: Partial<IRecipientPreferences>;
}
