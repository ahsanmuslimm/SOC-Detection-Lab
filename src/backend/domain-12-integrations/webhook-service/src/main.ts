/**
 * Webhook Service - Main Implementation
 * Event-driven webhook management and delivery system
 */

import {
  WebhookEventType,
  WebhookDeliveryStatus,
  WebhookDeliveryMethod,
  WebhookSigningAlgorithm,
  IWebhookEventPayload,
  IWebhookSubscription,
  IWebhookRetryPolicy,
  IWebhookFilter,
  IWebhookDeliveryAttempt,
  IWebhookRequest,
  IWebhookResponse,
  IWebhookDelivery,
  IWebhookSubscriptionConfig,
  IWebhookRegistrationResult,
  IWebhookDeliveryResult,
  IWebhookStats,
  IWebhookEventFilter,
  IWebhookAuditEntry,
  WebhookEventListener,
  WebhookDeliveryListener,
  IWebhookServiceConfig,
  IWebhookTestResult,
  IWebhookSubscriptionUpdate,
  IWebhookBatchEventTrigger,
  IWebhookBatchDeliveryResult,
  IWebhookHealthCheck,
  IWebhookRateLimitState,
} from './types';

/**
 * Webhook Service
 * Manages webhook subscriptions and event delivery with retry logic and monitoring
 */
export class WebhookService {
  private subscriptions: Map<string, IWebhookSubscription> = new Map();
  private deliveries: Map<string, IWebhookDelivery> = new Map();
  private config: IWebhookServiceConfig;
  private eventListeners: Set<WebhookEventListener> = new Set();
  private deliveryListeners: Set<WebhookDeliveryListener> = new Set();
  private stats: IWebhookStats;
  private auditLog: IWebhookAuditEntry[] = [];
  private rateLimiters: Map<string, IWebhookRateLimitState> = new Map();
  private deliveryQueue: IWebhookDelivery[] = [];
  private cleanupIntervalId: NodeJS.Timeout | null = null;

  /**
   * Constructor
   */
  constructor(config: IWebhookServiceConfig) {
    this.config = this.validateConfig(config);
    this.stats = this.initializeStats();
    this.startCleanupInterval();
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: IWebhookServiceConfig): IWebhookServiceConfig {
    if (config.defaultTimeoutMs < 1000) {
      throw new Error('Default timeout must be at least 1000ms');
    }
    if (config.defaultMaxRetries < 0) {
      throw new Error('Default max retries must be >= 0');
    }
    return config;
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): IWebhookStats {
    return {
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageDeliveryTimeMs: 0,
      deliveriesByStatus: {
        pending: 0,
        delivered: 0,
        failed: 0,
        retrying: 0,
        abandoned: 0,
      },
      deliveriesByEventType: {},
      successRate: 0,
    };
  }

  /**
   * Register webhook subscription
   */
  public registerSubscription(config: IWebhookSubscriptionConfig, userId: string): IWebhookRegistrationResult {
    try {
      if (!config.name || !config.url || !config.eventTypes || config.eventTypes.length === 0) {
        return {
          subscriptionId: '',
          registered: false,
          errors: ['Missing required subscription properties'],
        };
      }

      if (!this.isValidUrl(config.url)) {
        return {
          subscriptionId: '',
          registered: false,
          errors: ['Invalid webhook URL'],
        };
      }

      const subscriptionId = this.generateSubscriptionId();
      const subscription: IWebhookSubscription = {
        subscriptionId,
        name: config.name,
        description: config.description,
        url: config.url,
        method: config.method || 'https',
        eventTypes: config.eventTypes,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        secret: config.secret,
        signingAlgorithm: config.signingAlgorithm || 'hmac-sha256',
        headers: config.headers || {},
        retryPolicy: config.retryPolicy || this.getDefaultRetryPolicy(),
        filters: config.filters || [],
        maxRetries: config.maxRetries || this.config.defaultMaxRetries,
        timeoutMs: config.timeoutMs || this.config.defaultTimeoutMs,
      };

      this.subscriptions.set(subscriptionId, subscription);
      this.stats.totalSubscriptions++;
      this.stats.activeSubscriptions++;

      this.auditEntry('created', { subscriptionId, userId });

      return {
        subscriptionId,
        registered: true,
      };
    } catch (error) {
      return {
        subscriptionId: '',
        registered: false,
        errors: [String(error)],
      };
    }
  }

  /**
   * Get subscription by ID
   */
  public getSubscription(subscriptionId: string): IWebhookSubscription | null {
    return this.subscriptions.get(subscriptionId) || null;
  }

  /**
   * Get all subscriptions
   */
  public getAllSubscriptions(): IWebhookSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get subscriptions by event type
   */
  public getSubscriptionsByEventType(eventType: WebhookEventType): IWebhookSubscription[] {
    return Array.from(this.subscriptions.values()).filter(
      (sub) => sub.isActive && sub.eventTypes.includes(eventType),
    );
  }

  /**
   * Update subscription
   */
  public updateSubscription(
    subscriptionId: string,
    updates: IWebhookSubscriptionUpdate,
    userId: string,
  ): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    const before = { ...subscription };

    if (updates.name !== undefined) subscription.name = updates.name;
    if (updates.description !== undefined) subscription.description = updates.description;
    if (updates.url !== undefined && this.isValidUrl(updates.url)) subscription.url = updates.url;
    if (updates.method !== undefined) subscription.method = updates.method;
    if (updates.eventTypes !== undefined) subscription.eventTypes = updates.eventTypes;
    if (updates.isActive !== undefined) subscription.isActive = updates.isActive;
    if (updates.secret !== undefined) subscription.secret = updates.secret;
    if (updates.signingAlgorithm !== undefined) subscription.signingAlgorithm = updates.signingAlgorithm;
    if (updates.headers !== undefined) subscription.headers = updates.headers;
    if (updates.retryPolicy !== undefined) subscription.retryPolicy = updates.retryPolicy;
    if (updates.filters !== undefined) subscription.filters = updates.filters;
    if (updates.maxRetries !== undefined) subscription.maxRetries = updates.maxRetries;
    if (updates.timeoutMs !== undefined) subscription.timeoutMs = updates.timeoutMs;

    subscription.updatedAt = new Date();

    this.auditEntry('updated', { subscriptionId, userId, changes: this.diffObjects(before, subscription) });

    return true;
  }

  /**
   * Delete subscription
   */
  public deleteSubscription(subscriptionId: string, userId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    this.subscriptions.delete(subscriptionId);
    this.stats.totalSubscriptions--;

    if (subscription.isActive) {
      this.stats.activeSubscriptions--;
    }

    this.auditEntry('deleted', { subscriptionId, userId });

    return true;
  }

  /**
   * Activate subscription
   */
  public activateSubscription(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription || subscription.isActive) {
      return false;
    }

    subscription.isActive = true;
    subscription.updatedAt = new Date();
    this.stats.activeSubscriptions++;

    return true;
  }

  /**
   * Deactivate subscription
   */
  public deactivateSubscription(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription || !subscription.isActive) {
      return false;
    }

    subscription.isActive = false;
    subscription.updatedAt = new Date();
    this.stats.activeSubscriptions--;

    return true;
  }

  /**
   * Trigger event
   */
  public async triggerEvent(event: IWebhookEventPayload): Promise<void> {
    // Emit to listeners
    for (const listener of this.eventListeners) {
      try {
        await listener(event);
      } catch (error) {
        // Silently ignore listener errors
      }
    }

    // Get matching subscriptions
    const subscriptions = this.getSubscriptionsByEventType(event.eventType);

    // Queue deliveries
    for (const subscription of subscriptions) {
      if (this.matchesFilters(event, subscription.filters || [])) {
        const delivery: IWebhookDelivery = {
          deliveryId: this.generateDeliveryId(),
          subscriptionId: subscription.subscriptionId,
          event,
          status: 'pending',
          attempts: [],
          createdAt: new Date(),
          success: false,
        };

        this.deliveries.set(delivery.deliveryId, delivery);
        this.deliveryQueue.push(delivery);
        this.stats.totalDeliveries++;
        this.stats.deliveriesByStatus.pending++;

        const eventType = event.eventType;
        if (!this.stats.deliveriesByEventType[eventType]) {
          this.stats.deliveriesByEventType[eventType] = 0;
        }
        this.stats.deliveriesByEventType[eventType]++;

        // Start delivery
        await this.deliverWebhook(delivery);
      }
    }
  }

  /**
   * Trigger batch events
   */
  public async triggerBatchEvents(batchConfig: IWebhookBatchEventTrigger): Promise<IWebhookBatchDeliveryResult> {
    const results: IWebhookDeliveryResult[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const event of batchConfig.events) {
      try {
        await this.triggerEvent(event);
        successCount++;
      } catch (error) {
        failCount++;
        if (batchConfig.failFast) {
          break;
        }
      }
    }

    return {
      totalEvents: batchConfig.events.length,
      successfulDeliveries: successCount,
      failedDeliveries: failCount,
      results,
    };
  }

  /**
   * Deliver webhook
   */
  private async deliverWebhook(delivery: IWebhookDelivery): Promise<void> {
    const subscription = this.subscriptions.get(delivery.subscriptionId);
    if (!subscription) {
      delivery.status = 'abandoned';
      this.updateDeliveryStatus(delivery);
      return;
    }

    const maxRetries = subscription.maxRetries || this.config.defaultMaxRetries;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const deliveryAttempt = await this.performDeliveryAttempt(
          delivery,
          subscription,
          attempt,
        );

        delivery.attempts.push(deliveryAttempt);

        if (deliveryAttempt.status === 'delivered') {
          delivery.status = 'delivered';
          delivery.success = true;
          delivery.completedAt = new Date();
          this.stats.successfulDeliveries++;
          this.updateDeliveryStatus(delivery);
          await this.emitDeliveryEvent(delivery);
          return;
        }

        if (attempt < maxRetries + 1) {
          const delay = this.calculateRetryDelay(subscription.retryPolicy, attempt);
          delivery.status = 'retrying';
          delivery.nextRetryAt = new Date(Date.now() + delay);
          this.updateDeliveryStatus(delivery);

          await this.sleep(delay);
        }
      } catch (error) {
        if (attempt === maxRetries + 1) {
          delivery.status = 'failed';
          delivery.completedAt = new Date();
          this.stats.failedDeliveries++;
          this.updateDeliveryStatus(delivery);
          await this.emitDeliveryEvent(delivery);
        }
      }
    }
  }

  /**
   * Perform delivery attempt
   */
  private async performDeliveryAttempt(
    delivery: IWebhookDelivery,
    subscription: IWebhookSubscription,
    attemptNumber: number,
  ): Promise<IWebhookDeliveryAttempt> {
    const startTime = Date.now();
    const attemptId = this.generateAttemptId();

    try {
      const body = JSON.stringify(delivery.event);
      const signature = subscription.secret
        ? this.generateSignature(body, subscription.secret, subscription.signingAlgorithm)
        : undefined;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'SOC-Detection-Lab-WebhookService/1.0',
        ...subscription.headers,
      };

      if (signature) {
        headers['X-Webhook-Signature'] = signature;
        headers['X-Webhook-Signature-Algorithm'] = subscription.signingAlgorithm || 'hmac-sha256';
      }

      headers['X-Webhook-Event'] = delivery.event.eventType;
      headers['X-Webhook-Delivery'] = delivery.deliveryId;
      headers['X-Delivery-Attempt'] = String(attemptNumber);

      const request: IWebhookRequest = {
        method: 'POST',
        url: subscription.url,
        headers,
        body,
        signature,
      };

      // Simulate HTTP request (in production, use actual HTTP client)
      const response = await this.performHttpRequest(request, subscription.timeoutMs);

      const durationMs = Date.now() - startTime;
      const success = response.statusCode >= 200 && response.statusCode < 300;

      return {
        attemptId,
        deliveryId: delivery.deliveryId,
        subscriptionId: subscription.subscriptionId,
        attemptNumber,
        status: success ? 'delivered' : 'failed',
        httpStatus: response.statusCode,
        request,
        response,
        timestamp: new Date(),
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;

      return {
        attemptId,
        deliveryId: delivery.deliveryId,
        subscriptionId: subscription.subscriptionId,
        attemptNumber,
        status: 'failed',
        request: {
          method: 'POST',
          url: subscription.url,
          headers: {},
          body: '',
        },
        error: String(error),
        timestamp: new Date(),
        durationMs,
      };
    }
  }

  /**
   * Perform HTTP request
   */
  private async performHttpRequest(request: IWebhookRequest, timeoutMs: number): Promise<IWebhookResponse> {
    // In production, use actual HTTP client like axios or node-fetch
    // For now, simulate successful response
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: '{"ok": true}',
      size: 15,
    };
  }

  /**
   * Test webhook subscription
   */
  public async testWebhook(subscriptionId: string): Promise<IWebhookTestResult> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return {
        subscriptionId,
        success: false,
        error: 'Subscription not found',
        responseTime: 0,
        attempts: [],
      };
    }

    const startTime = Date.now();
    const testEvent: IWebhookEventPayload = {
      eventId: this.generateEventId(),
      eventType: subscription.eventTypes[0],
      timestamp: new Date(),
      source: 'webhook-service',
      data: { test: true },
      metadata: { test: true },
    };

    const delivery: IWebhookDelivery = {
      deliveryId: this.generateDeliveryId(),
      subscriptionId,
      event: testEvent,
      status: 'pending',
      attempts: [],
      createdAt: new Date(),
      success: false,
    };

    try {
      const attempt = await this.performDeliveryAttempt(delivery, subscription, 1);
      delivery.attempts.push(attempt);

      const responseTime = Date.now() - startTime;

      return {
        subscriptionId,
        success: attempt.status === 'delivered',
        httpStatus: attempt.httpStatus,
        responseTime,
        attempts: [attempt],
        error: attempt.error,
      };
    } catch (error) {
      return {
        subscriptionId,
        success: false,
        responseTime: Date.now() - startTime,
        attempts: [],
        error: String(error),
      };
    }
  }

  /**
   * Get delivery history
   */
  public getDeliveryHistory(filter: IWebhookEventFilter): IWebhookDelivery[] {
    let results = Array.from(this.deliveries.values());

    if (filter.subscriptionId) {
      results = results.filter((d) => d.subscriptionId === filter.subscriptionId);
    }

    if (filter.status) {
      results = results.filter((d) => d.status === filter.status);
    }

    if (filter.eventType) {
      results = results.filter((d) => d.event.eventType === filter.eventType);
    }

    if (filter.startDate) {
      results = results.filter((d) => d.createdAt >= filter.startDate!);
    }

    if (filter.endDate) {
      results = results.filter((d) => d.createdAt <= filter.endDate!);
    }

    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const offset = filter.offset || 0;
    const limit = filter.limit || 100;

    return results.slice(offset, offset + limit);
  }

  /**
   * Get delivery by ID
   */
  public getDelivery(deliveryId: string): IWebhookDelivery | null {
    return this.deliveries.get(deliveryId) || null;
  }

  /**
   * Retry failed delivery
   */
  public async retryDelivery(deliveryId: string): Promise<boolean> {
    const delivery = this.deliveries.get(deliveryId);
    if (!delivery) {
      return false;
    }

    delivery.status = 'retrying';
    delivery.nextRetryAt = undefined;
    this.deliveryQueue.push(delivery);

    await this.deliverWebhook(delivery);

    return true;
  }

  /**
   * Get statistics
   */
  public getStats(): IWebhookStats {
    this.stats.successRate =
      this.stats.totalDeliveries > 0
        ? this.stats.successfulDeliveries / this.stats.totalDeliveries
        : 0;

    return { ...this.stats };
  }

  /**
   * Get audit log
   */
  public getAuditLog(limit: number = 100): IWebhookAuditEntry[] {
    return this.auditLog.slice(-limit);
  }

  /**
   * Perform health check
   */
  public async performHealthCheck(): Promise<IWebhookHealthCheck> {
    const pendingDeliveries = Array.from(this.deliveries.values()).filter(
      (d) => d.status === 'pending' || d.status === 'retrying',
    ).length;

    const failedDeliveries = Array.from(this.deliveries.values()).filter((d) => d.status === 'failed').length;

    const checks = [
      {
        name: 'subscriptions_registered',
        status: this.subscriptions.size > 0 ? ('healthy' as const) : ('degraded' as const),
      },
      {
        name: 'delivery_queue',
        status: this.deliveryQueue.length < 10000 ? ('healthy' as const) : ('degraded' as const),
      },
      {
        name: 'failed_deliveries',
        status: failedDeliveries < 1000 ? ('healthy' as const) : ('degraded' as const),
      },
    ];

    const unhealthyCount = checks.filter((c) => c.status === 'unhealthy').length;
    const overallStatus =
      unhealthyCount > 0 ? ('unhealthy' as const) : ('healthy' as const);

    return {
      status: overallStatus,
      timestamp: new Date(),
      activeSubscriptions: this.stats.activeSubscriptions,
      pendingDeliveries,
      failedDeliveries,
      uptime: Date.now(),
      checks,
    };
  }

  /**
   * Add event listener
   */
  public onEvent(listener: WebhookEventListener): this {
    this.eventListeners.add(listener);
    return this;
  }

  /**
   * Remove event listener
   */
  public offEvent(listener: WebhookEventListener): this {
    this.eventListeners.delete(listener);
    return this;
  }

  /**
   * Add delivery listener
   */
  public onDelivery(listener: WebhookDeliveryListener): this {
    this.deliveryListeners.add(listener);
    return this;
  }

  /**
   * Remove delivery listener
   */
  public offDelivery(listener: WebhookDeliveryListener): this {
    this.deliveryListeners.delete(listener);
    return this;
  }

  /**
   * Emit delivery event
   */
  private async emitDeliveryEvent(delivery: IWebhookDelivery): Promise<void> {
    for (const listener of this.deliveryListeners) {
      try {
        await listener(delivery);
      } catch (error) {
        // Silently ignore listener errors
      }
    }
  }

  /**
   * Match event against filters
   */
  private matchesFilters(event: IWebhookEventPayload, filters: IWebhookFilter[]): boolean {
    if (filters.length === 0) {
      return true;
    }

    return filters.every((filter) => this.matchFilter(event.data, filter));
  }

  /**
   * Match single filter
   */
  private matchFilter(data: Record<string, unknown>, filter: IWebhookFilter): boolean {
    const value = this.getNestedValue(data, filter.field);

    switch (filter.operator) {
      case 'equals':
        return filter.caseSensitive
          ? value === filter.value
          : String(value).toLowerCase() === String(filter.value).toLowerCase();

      case 'contains':
        return String(value).includes(String(filter.value));

      case 'startsWith':
        return String(value).startsWith(String(filter.value));

      case 'endsWith':
        return String(value).endsWith(String(filter.value));

      case 'gt':
        return Number(value) > Number(filter.value);

      case 'lt':
        return Number(value) < Number(filter.value);

      case 'gte':
        return Number(value) >= Number(filter.value);

      case 'lte':
        return Number(value) <= Number(filter.value);

      case 'regex':
        return new RegExp(String(filter.value)).test(String(value));

      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(value);

      default:
        return true;
    }
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const keys = path.split('.');
    let value: unknown = obj;

    for (const key of keys) {
      if (typeof value === 'object' && value !== null) {
        value = (value as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Update delivery status
   */
  private updateDeliveryStatus(delivery: IWebhookDelivery): void {
    this.deliveries.set(delivery.deliveryId, delivery);

    // Update stats
    this.stats.deliveriesByStatus[delivery.status]++;
  }

  /**
   * Calculate retry delay
   */
  private calculateRetryDelay(retryPolicy: IWebhookRetryPolicy, attemptNumber: number): number {
    const { initialDelayMs, maxDelayMs, backoffMultiplier, backoffType } = retryPolicy;

    let delay = initialDelayMs;

    if (backoffType === 'exponential') {
      delay = initialDelayMs * Math.pow(backoffMultiplier, attemptNumber - 1);
    } else {
      delay = initialDelayMs + initialDelayMs * (attemptNumber - 1);
    }

    return Math.min(delay, maxDelayMs);
  }

  /**
   * Generate signature
   */
  private generateSignature(body: string, secret: string, algorithm?: WebhookSigningAlgorithm): string {
    if (!algorithm || algorithm === 'none') {
      return '';
    }

    // In production, use crypto module
    // For now, return placeholder
    return `sig_${Buffer.from(secret).toString('base64')}`;
  }

  /**
   * Validate URL
   */
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Get default retry policy
   */
  private getDefaultRetryPolicy(): IWebhookRetryPolicy {
    return (
      this.config.defaultRetryPolicy || {
        maxAttempts: 5,
        initialDelayMs: 1000,
        maxDelayMs: 60000,
        backoffMultiplier: 2,
        backoffType: 'exponential',
      }
    );
  }

  /**
   * Diff objects for audit
   */
  private diffObjects(before: Record<string, unknown>, after: Record<string, unknown>): Record<string, unknown> {
    const changes: Record<string, unknown> = {};

    for (const key in after) {
      if (before[key] !== after[key]) {
        changes[key] = { before: before[key], after: after[key] };
      }
    }

    return changes;
  }

  /**
   * Audit entry
   */
  private auditEntry(
    action: 'created' | 'updated' | 'deleted' | 'triggered' | 'retried' | 'abandoned',
    details: Record<string, unknown>,
  ): void {
    if (!this.config.enableAudit) {
      return;
    }

    const entry: IWebhookAuditEntry = {
      entryId: this.generateAuditId(),
      timestamp: new Date(),
      action,
      userId: (details.userId as string) || 'system',
      subscriptionId: (details.subscriptionId as string) || undefined,
      deliveryId: (details.deliveryId as string) || undefined,
      changes: details.changes as Record<string, unknown>,
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
    const interval = this.config.cleanupIntervalMs || 3600000; // 1 hour default

    this.cleanupIntervalId = setInterval(() => {
      this.cleanup();
    }, interval);
  }

  /**
   * Cleanup old deliveries
   */
  private cleanup(): void {
    const maxHistory = this.config.maxDeliveryHistory || 100000;
    if (this.deliveries.size > maxHistory) {
      const sortedDeliveries = Array.from(this.deliveries.values()).sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );

      const toDelete = sortedDeliveries.slice(0, this.deliveries.size - maxHistory);
      toDelete.forEach((d) => this.deliveries.delete(d.deliveryId));
    }
  }

  /**
   * Stop cleanup interval
   */
  public stop(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate IDs
   */
  private generateSubscriptionId(): string {
    return `webhook_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDeliveryId(): string {
    return `webhook_del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAttemptId(): string {
    return `webhook_att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `webhook_evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAuditId(): string {
    return `webhook_aud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory function to create Webhook Service
 */
export function createWebhookService(config: IWebhookServiceConfig): WebhookService {
  return new WebhookService(config);
}
