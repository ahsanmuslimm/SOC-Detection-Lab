/**
 * Notification Service - Public API
 */

export { NotificationService, createNotificationService } from './main';

export type {
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  INotificationRecipient,
  IRecipientPreferences,
  INotificationTemplate,
  ITemplateContent,
  ITemplateVariable,
  INotification,
  INotificationDeliveryAttempt,
  IBatchNotificationRequest,
  INotificationProviderConfig,
  IRetryPolicy,
  IRateLimit,
  INotificationSchedule,
  IRecurrencePattern,
  INotificationStats,
  INotificationAuditEntry,
  NotificationListener,
  DeliveryListener,
  INotificationServiceConfig,
  INotificationQuery,
  INotificationRenderResult,
  INotificationHealthCheck,
  INotificationBatchResult,
  IDeliveryReport,
  IChannelPerformance,
  INotificationTemplateUpdate,
  IRecipientUpdate,
} from './types';
