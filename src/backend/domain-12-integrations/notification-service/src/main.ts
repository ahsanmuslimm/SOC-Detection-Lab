/**
 * Notification Service - Main Implementation
 * Multi-channel notification system with templating, scheduling, and delivery tracking
 */

import {
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

/**
 * Notification Service
 * Manages multi-channel notifications with templating, scheduling, and delivery tracking
 */
export class NotificationService {
  private config: INotificationServiceConfig;
  private templates: Map<string, INotificationTemplate> = new Map();
  private recipients: Map<string, INotificationRecipient> = new Map();
  private notifications: Map<string, INotification> = new Map();
  private deliveryHistory: Map<string, INotificationDeliveryAttempt> = new Map();
  private providers: Map<string, INotificationProviderConfig> = new Map();
  private schedules: Map<string, INotificationSchedule> = new Map();
  private notificationListeners: Set<NotificationListener> = new Set();
  private deliveryListeners: Set<DeliveryListener> = new Set();
  private stats: INotificationStats;
  private auditLog: INotificationAuditEntry[] = [];
  private notificationQueue: INotification[] = [];
  private cleanupIntervalId: NodeJS.Timeout | null = null;
  private scheduleIntervalId: NodeJS.Timeout | null = null;

  /**
   * Constructor
   */
  constructor(config: INotificationServiceConfig) {
    this.config = this.validateConfig(config);
    this.stats = this.initializeStats();
    this.startCleanupInterval();
    this.startScheduleInterval();
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: INotificationServiceConfig): INotificationServiceConfig {
    if (!config.enableTemplating && !config.enableScheduling) {
      console.warn('Consider enabling at least templating or scheduling');
    }
    return config;
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): INotificationStats {
    return {
      totalNotifications: 0,
      sentNotifications: 0,
      deliveredNotifications: 0,
      failedNotifications: 0,
      pendingNotifications: 0,
      averageDeliveryTimeMs: 0,
      deliveryByChannel: {
        email: 0,
        sms: 0,
        push: 0,
        'in-app': 0,
        slack: 0,
        teams: 0,
        webhook: 0,
      },
      deliveryByStatus: {
        pending: 0,
        queued: 0,
        sending: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        bounced: 0,
        read: 0,
      },
      deliverySuccessRate: 0,
      failureRateByChannel: {
        email: 0,
        sms: 0,
        push: 0,
        'in-app': 0,
        slack: 0,
        teams: 0,
        webhook: 0,
      },
    };
  }

  /**
   * Register template
   */
  public registerTemplate(template: INotificationTemplate): boolean {
    if (this.templates.has(template.templateId)) {
      return false;
    }

    this.templates.set(template.templateId, template);
    return true;
  }

  /**
   * Get template
   */
  public getTemplate(templateId: string): INotificationTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Update template
   */
  public updateTemplate(templateId: string, updates: INotificationTemplateUpdate): boolean {
    const template = this.templates.get(templateId);
    if (!template) {
      return false;
    }

    if (updates.name) template.name = updates.name;
    if (updates.category) template.category = updates.category;
    if (updates.channels) template.channels = updates.channels;
    if (updates.variables) template.variables = updates.variables;
    if (updates.isActive !== undefined) template.isActive = updates.isActive;

    template.version++;
    template.updatedAt = new Date();

    return true;
  }

  /**
   * Register recipient
   */
  public registerRecipient(recipient: INotificationRecipient): boolean {
    if (this.recipients.has(recipient.recipientId)) {
      return false;
    }

    this.recipients.set(recipient.recipientId, recipient);
    return true;
  }

  /**
   * Get recipient
   */
  public getRecipient(recipientId: string): INotificationRecipient | null {
    return this.recipients.get(recipientId) || null;
  }

  /**
   * Update recipient
   */
  public updateRecipient(recipientId: string, updates: IRecipientUpdate): boolean {
    const recipient = this.recipients.get(recipientId);
    if (!recipient) {
      return false;
    }

    if (updates.name) recipient.name = updates.name;
    if (updates.email) recipient.email = updates.email;
    if (updates.phone) recipient.phone = updates.phone;
    if (updates.pushTokens) recipient.pushTokens = updates.pushTokens;
    if (updates.preferences) {
      recipient.preferences = { ...recipient.preferences, ...updates.preferences };
    }

    return true;
  }

  /**
   * Register provider
   */
  public registerProvider(provider: INotificationProviderConfig): boolean {
    if (this.providers.has(provider.providerId)) {
      return false;
    }

    this.providers.set(provider.providerId, provider);
    return true;
  }

  /**
   * Get provider
   */
  public getProvider(providerId: string): INotificationProviderConfig | null {
    return this.providers.get(providerId) || null;
  }

  /**
   * Get providers by channel
   */
  public getProvidersByChannel(channel: NotificationChannel): INotificationProviderConfig[] {
    return Array.from(this.providers.values()).filter(
      (p) => p.channel === channel && p.isActive,
    );
  }

  /**
   * Render notification
   */
  public renderNotification(
    template: INotificationTemplate,
    channel: NotificationChannel,
    variables: Record<string, unknown>,
  ): INotificationRenderResult | null {
    const content = template.channels[channel];
    if (!content) {
      return null;
    }

    return {
      subject: this.interpolateString(content.subject, variables),
      body: this.interpolateString(content.body, variables),
      htmlBody: content.htmlBody ? this.interpolateString(content.htmlBody, variables) : undefined,
      actionUrl: content.actionUrl ? this.interpolateString(content.actionUrl, variables) : undefined,
      actionText: content.actionText ? this.interpolateString(content.actionText, variables) : undefined,
    };
  }

  /**
   * Send notification
   */
  public async sendNotification(
    templateId: string,
    recipients: INotificationRecipient[],
    channels?: NotificationChannel[],
    priority?: NotificationPriority,
    variables?: Record<string, unknown>,
    createdBy?: string,
  ): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template || !template.isActive) {
      throw new Error(`Template ${templateId} not found or inactive`);
    }

    const notificationId = this.generateNotificationId();
    const notification: INotification = {
      notificationId,
      templateId,
      recipients,
      channels: channels || this.config.defaultChannels || ['email'],
      priority: priority || this.config.defaultPriority || 'normal',
      status: 'pending',
      variables: variables || {},
      createdAt: new Date(),
      createdBy: createdBy || 'system',
    };

    this.notifications.set(notificationId, notification);
    this.notificationQueue.push(notification);
    this.stats.totalNotifications++;
    this.stats.pendingNotifications++;

    await this.auditEntry(notificationId, 'created');
    await this.emitNotificationEvent(notification);

    // Process immediately
    await this.processNotification(notification);

    return notificationId;
  }

  /**
   * Send batch notifications
   */
  public async sendBatchNotifications(
    batch: IBatchNotificationRequest,
    createdBy?: string,
  ): Promise<INotificationBatchResult> {
    const batchId = this.generateBatchId();
    const results: Array<{
      recipientId: string;
      success: boolean;
      notificationIds: string[];
      errors?: string[];
    }> = [];

    let successCount = 0;
    let failCount = 0;
    let pendingCount = 0;

    for (const recipient of batch.recipients) {
      try {
        const notificationId = await this.sendNotification(
          batch.templateId,
          [recipient],
          batch.channels,
          batch.priority,
          batch.variables,
          createdBy,
        );

        results.push({
          recipientId: recipient.recipientId,
          success: true,
          notificationIds: [notificationId],
        });
        successCount++;
      } catch (error) {
        failCount++;
        results.push({
          recipientId: recipient.recipientId,
          success: false,
          notificationIds: [],
          errors: [String(error)],
        });
      }
    }

    pendingCount = batch.recipients.length - successCount - failCount;

    return {
      batchId,
      templateId: batch.templateId,
      totalRecipients: batch.recipients.length,
      successfulNotifications: successCount,
      failedNotifications: failCount,
      pendingNotifications: pendingCount,
      results,
    };
  }

  /**
   * Schedule notification
   */
  public scheduleNotification(
    notification: INotification,
    scheduledFor: Date,
  ): boolean {
    if (scheduledFor <= new Date()) {
      return false;
    }

    notification.scheduledFor = scheduledFor;
    notification.status = 'queued';

    return true;
  }

  /**
   * Schedule recurring notifications
   */
  public createSchedule(schedule: INotificationSchedule): boolean {
    if (this.schedules.has(schedule.scheduleId)) {
      return false;
    }

    this.schedules.set(schedule.scheduleId, schedule);
    return true;
  }

  /**
   * Get notification
   */
  public getNotification(notificationId: string): INotification | null {
    return this.notifications.get(notificationId) || null;
  }

  /**
   * Query notifications
   */
  public queryNotifications(query: INotificationQuery): INotification[] {
    let results = Array.from(this.notifications.values());

    if (query.notificationId) {
      results = results.filter((n) => n.notificationId === query.notificationId);
    }

    if (query.templateId) {
      results = results.filter((n) => n.templateId === query.templateId);
    }

    if (query.recipientId) {
      results = results.filter((n) => n.recipients.some((r) => r.recipientId === query.recipientId));
    }

    if (query.statusFilter && query.statusFilter.length > 0) {
      results = results.filter((n) => query.statusFilter!.includes(n.status));
    }

    if (query.channelFilter && query.channelFilter.length > 0) {
      results = results.filter((n) => n.channels.some((c) => query.channelFilter!.includes(c)));
    }

    if (query.priorityFilter && query.priorityFilter.length > 0) {
      results = results.filter((n) => query.priorityFilter!.includes(n.priority));
    }

    if (query.startDate) {
      results = results.filter((n) => n.createdAt >= query.startDate!);
    }

    if (query.endDate) {
      results = results.filter((n) => n.createdAt <= query.endDate!);
    }

    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const offset = query.offset || 0;
    const limit = query.limit || 100;

    return results.slice(offset, offset + limit);
  }

  /**
   * Get delivery history
   */
  public getDeliveryHistory(notificationId: string, limit: number = 100): INotificationDeliveryAttempt[] {
    return Array.from(this.deliveryHistory.values())
      .filter((d) => d.notificationId === notificationId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get statistics
   */
  public getStats(): INotificationStats {
    this.stats.deliverySuccessRate =
      this.stats.sentNotifications > 0
        ? this.stats.deliveredNotifications / this.stats.sentNotifications
        : 0;

    return { ...this.stats };
  }

  /**
   * Get audit log
   */
  public getAuditLog(limit: number = 100): INotificationAuditEntry[] {
    return this.auditLog.slice(-limit);
  }

  /**
   * Perform health check
   */
  public async performHealthCheck(): Promise<INotificationHealthCheck> {
    const activeProviders = Array.from(this.providers.values()).filter((p) => p.isActive).length;

    const checks = [
      {
        name: 'templates_registered',
        status: this.templates.size > 0 ? ('healthy' as const) : ('degraded' as const),
      },
      {
        name: 'providers_active',
        status: activeProviders > 0 ? ('healthy' as const) : ('degraded' as const),
      },
      {
        name: 'queue_depth',
        status: this.notificationQueue.length < (this.config.maxQueueSize || 10000) ? ('healthy' as const) : ('degraded' as const),
      },
    ];

    const unhealthyCount = checks.filter((c) => c.status === 'unhealthy').length;
    const overallStatus =
      unhealthyCount > 0 ? ('unhealthy' as const) : ('healthy' as const);

    return {
      status: overallStatus,
      timestamp: new Date(),
      activeProviders,
      queueDepth: this.notificationQueue.length,
      successRate: this.stats.deliverySuccessRate,
      checks,
    };
  }

  /**
   * Add notification listener
   */
  public onNotification(listener: NotificationListener): this {
    this.notificationListeners.add(listener);
    return this;
  }

  /**
   * Add delivery listener
   */
  public onDelivery(listener: DeliveryListener): this {
    this.deliveryListeners.add(listener);
    return this;
  }

  /**
   * Generate delivery report
   */
  public generateDeliveryReport(startDate: Date, endDate: Date): IDeliveryReport {
    const deliveries = Array.from(this.deliveryHistory.values()).filter(
      (d) => d.sentAt >= startDate && d.sentAt <= endDate,
    );

    const channelPerformance: Record<NotificationChannel, IChannelPerformance> = {
      email: this.calculateChannelPerformance(deliveries, 'email'),
      sms: this.calculateChannelPerformance(deliveries, 'sms'),
      push: this.calculateChannelPerformance(deliveries, 'push'),
      'in-app': this.calculateChannelPerformance(deliveries, 'in-app'),
      slack: this.calculateChannelPerformance(deliveries, 'slack'),
      teams: this.calculateChannelPerformance(deliveries, 'teams'),
      webhook: this.calculateChannelPerformance(deliveries, 'webhook'),
    };

    const totalNotifications = deliveries.length;
    const deliveredNotifications = deliveries.filter((d) => d.status === 'delivered').length;
    const failedNotifications = deliveries.filter((d) => d.status === 'failed').length;
    const pendingNotifications = deliveries.filter((d) => d.status === 'pending').length;

    const totalDeliveryTime = deliveries.reduce((sum, d) => {
      if (d.deliveredAt) {
        return sum + (d.deliveredAt.getTime() - d.sentAt.getTime());
      }
      return sum;
    }, 0);

    const averageDeliveryTimeMs =
      deliveredNotifications > 0 ? totalDeliveryTime / deliveredNotifications : 0;

    const failureReasonBreakdown: Record<string, number> = {};
    deliveries.forEach((d) => {
      if (d.failureReason) {
        failureReasonBreakdown[d.failureReason] = (failureReasonBreakdown[d.failureReason] || 0) + 1;
      }
    });

    return {
      reportId: this.generateReportId(),
      startDate,
      endDate,
      totalNotifications,
      deliveredNotifications,
      failedNotifications,
      pendingNotifications,
      averageDeliveryTimeMs,
      successRate: totalNotifications > 0 ? deliveredNotifications / totalNotifications : 0,
      failureReasonBreakdown,
      channelPerformance,
    };
  }

  /**
   * Process notification
   */
  private async processNotification(notification: INotification): Promise<void> {
    notification.status = 'sending';

    for (const recipient of notification.recipients) {
      for (const channel of notification.channels) {
        try {
          const template = this.templates.get(notification.templateId);
          if (!template) {
            throw new Error(`Template not found: ${notification.templateId}`);
          }

          const providers = this.getProvidersByChannel(channel);
          if (providers.length === 0) {
            throw new Error(`No active providers for channel: ${channel}`);
          }

          const rendered = this.renderNotification(template, channel, notification.variables);
          if (!rendered) {
            throw new Error(`Failed to render notification for channel: ${channel}`);
          }

          const provider = providers[0]; // Use first available provider
          const deliveryAttempt = await this.deliverToProvider(
            notification,
            recipient,
            channel,
            rendered,
            provider,
          );

          this.deliveryHistory.set(deliveryAttempt.attemptId, deliveryAttempt);
          await this.emitDeliveryEvent(deliveryAttempt);
        } catch (error) {
          const attemptId = this.generateAttemptId();
          const deliveryAttempt: INotificationDeliveryAttempt = {
            attemptId,
            notificationId: notification.notificationId,
            recipientId: recipient.recipientId,
            channel,
            status: 'failed',
            sentAt: new Date(),
            failureReason: String(error),
            retryCount: 0,
          };

          this.deliveryHistory.set(attemptId, deliveryAttempt);
          this.stats.failedNotifications++;
          await this.auditEntry(notification.notificationId, 'failed', {
            channel,
            error: String(error),
          });
        }
      }
    }

    notification.status = 'sent';
    notification.sentAt = new Date();
    this.stats.sentNotifications++;
    this.stats.pendingNotifications--;

    await this.auditEntry(notification.notificationId, 'sent');
  }

  /**
   * Deliver to provider
   */
  private async deliverToProvider(
    notification: INotification,
    recipient: INotificationRecipient,
    channel: NotificationChannel,
    rendered: INotificationRenderResult,
    provider: INotificationProviderConfig,
  ): Promise<INotificationDeliveryAttempt> {
    const attemptId = this.generateAttemptId();
    const sentAt = new Date();

    // Simulate delivery (in production, would call actual provider API)
    const success = Math.random() > 0.1; // 90% success rate for demo

    const deliveryAttempt: INotificationDeliveryAttempt = {
      attemptId,
      notificationId: notification.notificationId,
      recipientId: recipient.recipientId,
      channel,
      status: success ? 'delivered' : 'failed',
      sentAt,
      deliveredAt: success ? new Date() : undefined,
      failureReason: success ? undefined : 'Simulated delivery failure',
      retryCount: 0,
    };

    if (success) {
      this.stats.deliveredNotifications++;
      this.stats.deliveryByChannel[channel]++;
      this.stats.deliveryByStatus.delivered++;
    } else {
      this.stats.failedNotifications++;
      this.stats.failureRateByChannel[channel]++;
      this.stats.deliveryByStatus.failed++;
    }

    return deliveryAttempt;
  }

  /**
   * Calculate channel performance
   */
  private calculateChannelPerformance(
    deliveries: INotificationDeliveryAttempt[],
    channel: NotificationChannel,
  ): IChannelPerformance {
    const channelDeliveries = deliveries.filter((d) => d.channel === channel);
    const delivered = channelDeliveries.filter((d) => d.status === 'delivered').length;
    const failed = channelDeliveries.filter((d) => d.status === 'failed').length;
    const pending = channelDeliveries.filter((d) => d.status === 'pending').length;

    const totalDeliveryTime = channelDeliveries.reduce((sum, d) => {
      if (d.deliveredAt) {
        return sum + (d.deliveredAt.getTime() - d.sentAt.getTime());
      }
      return sum;
    }, 0);

    const averageDeliveryTimeMs = delivered > 0 ? totalDeliveryTime / delivered : 0;

    return {
      channel,
      totalSent: channelDeliveries.length,
      delivered,
      failed,
      pending,
      averageDeliveryTimeMs,
      successRate: channelDeliveries.length > 0 ? delivered / channelDeliveries.length : 0,
      lastError: channelDeliveries.find((d) => d.failureReason)?.failureReason,
    };
  }

  /**
   * Interpolate string with variables
   */
  private interpolateString(template: string | undefined, variables: Record<string, unknown>): string | undefined {
    if (!template) {
      return undefined;
    }

    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(value));
    }
    return result;
  }

  /**
   * Emit notification event
   */
  private async emitNotificationEvent(notification: INotification): Promise<void> {
    for (const listener of this.notificationListeners) {
      try {
        await listener(notification);
      } catch (error) {
        // Silently ignore listener errors
      }
    }
  }

  /**
   * Emit delivery event
   */
  private async emitDeliveryEvent(delivery: INotificationDeliveryAttempt): Promise<void> {
    for (const listener of this.deliveryListeners) {
      try {
        await listener(delivery);
      } catch (error) {
        // Silently ignore listener errors
      }
    }
  }

  /**
   * Audit entry
   */
  private async auditEntry(
    notificationId: string,
    action: any,
    details?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.config.enableAudit) {
      return;
    }

    const entry: INotificationAuditEntry = {
      entryId: this.generateAuditId(),
      timestamp: new Date(),
      notificationId,
      action,
      details,
    };

    this.auditLog.push(entry);
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    const interval = this.config.cleanupIntervalMs || 3600000;

    this.cleanupIntervalId = setInterval(() => {
      this.cleanup();
    }, interval);
  }

  /**
   * Start schedule interval
   */
  private startScheduleInterval(): void {
    this.scheduleIntervalId = setInterval(() => {
      this.processSchedules();
    }, 60000); // Check every minute
  }

  /**
   * Process schedules
   */
  private async processSchedules(): Promise<void> {
    const now = new Date();

    for (const schedule of this.schedules.values()) {
      if (schedule.isActive && schedule.nextRunAt <= now) {
        try {
          await this.sendNotification(
            schedule.templateId,
            schedule.recipients,
            schedule.channels,
            undefined,
            undefined,
            'schedule',
          );

          schedule.lastRunAt = now;
          schedule.nextRunAt = this.calculateNextRunTime(schedule);
        } catch (error) {
          console.error(`Schedule ${schedule.scheduleId} failed:`, error);
        }
      }
    }
  }

  /**
   * Calculate next run time
   */
  private calculateNextRunTime(schedule: INotificationSchedule): Date {
    const next = new Date(schedule.nextRunAt);

    if (schedule.recurrence) {
      const pattern = schedule.recurrence;

      switch (pattern.type) {
        case 'daily':
          next.setDate(next.getDate() + (pattern.interval || 1));
          break;
        case 'weekly':
          next.setDate(next.getDate() + ((pattern.interval || 1) * 7));
          break;
        case 'monthly':
          next.setMonth(next.getMonth() + (pattern.interval || 1));
          break;
        case 'yearly':
          next.setFullYear(next.getFullYear() + (pattern.interval || 1));
          break;
      }

      if (pattern.endDate && next > pattern.endDate) {
        return new Date(0);
      }

      if (pattern.maxOccurrences) {
        // Decrement max occurrences
      }
    }

    return next;
  }

  /**
   * Cleanup
   */
  private cleanup(): void {
    const maxHistory = this.config.maxDeliveryHistory || 100000;
    if (this.deliveryHistory.size > maxHistory) {
      const sortedDeliveries = Array.from(this.deliveryHistory.values()).sort(
        (a, b) => a.sentAt.getTime() - b.sentAt.getTime(),
      );

      const toDelete = sortedDeliveries.slice(0, this.deliveryHistory.size - maxHistory);
      toDelete.forEach((d) => this.deliveryHistory.delete(d.attemptId));
    }
  }

  /**
   * Stop service
   */
  public stop(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }
    if (this.scheduleIntervalId) {
      clearInterval(this.scheduleIntervalId);
    }
  }

  /**
   * Generate IDs
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAttemptId(): string {
    return `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory function
 */
export function createNotificationService(config: INotificationServiceConfig): NotificationService {
  return new NotificationService(config);
}
