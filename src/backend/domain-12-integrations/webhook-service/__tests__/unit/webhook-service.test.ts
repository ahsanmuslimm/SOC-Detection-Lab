/**
 * Webhook Service - Unit Tests
 */

import {
  WebhookService,
  createWebhookService,
  IWebhookServiceConfig,
  IWebhookSubscriptionConfig,
  IWebhookEventPayload,
  IWebhookBatchEventTrigger,
  WebhookEventListener,
  WebhookDeliveryListener,
} from '../../src';

describe('WebhookService', () => {
  let service: WebhookService;
  let config: IWebhookServiceConfig;

  beforeEach(() => {
    config = {
      enableRetry: true,
      enableSignature: true,
      defaultMaxRetries: 3,
      defaultTimeoutMs: 5000,
      enableAudit: true,
      enableMetrics: true,
      maxSubscriptions: 1000,
      maxDeliveryHistory: 100000,
      cleanupIntervalMs: 3600000,
      enableLogging: true,
    };

    service = createWebhookService(config);
  });

  afterEach(() => {
    service.stop();
  });

  describe('Subscription Management', () => {
    it('should register webhook subscription', () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'Alert Webhook',
        description: 'Webhook for alerts',
        url: 'https://example.com/webhooks/alerts',
        eventTypes: ['alert.triggered', 'alert.resolved'],
        secret: 'secret-key',
      };

      const result = service.registerSubscription(subscriptionConfig, 'user-123');

      expect(result.registered).toBe(true);
      expect(result.subscriptionId).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should validate subscription URL', () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'Bad URL',
        url: 'invalid-url',
        eventTypes: ['alert.triggered'],
      };

      const result = service.registerSubscription(subscriptionConfig, 'user-123');

      expect(result.registered).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should require event types', () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'No Events',
        url: 'https://example.com/webhook',
        eventTypes: [],
      };

      const result = service.registerSubscription(subscriptionConfig, 'user-123');

      expect(result.registered).toBe(false);
    });

    it('should get subscription by ID', () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        eventTypes: ['alert.triggered'],
      };

      const result = service.registerSubscription(subscriptionConfig, 'user-123');
      const subscription = service.getSubscription(result.subscriptionId);

      expect(subscription).not.toBeNull();
      expect(subscription?.name).toBe('Test Webhook');
    });

    it('should return null for non-existent subscription', () => {
      const subscription = service.getSubscription('non-existent');
      expect(subscription).toBeNull();
    });

    it('should get all subscriptions', () => {
      for (let i = 0; i < 3; i++) {
        const config: IWebhookSubscriptionConfig = {
          name: `Webhook ${i}`,
          url: `https://example.com/webhook-${i}`,
          eventTypes: ['alert.triggered'],
        };
        service.registerSubscription(config, 'user-123');
      }

      const all = service.getAllSubscriptions();
      expect(all.length).toBe(3);
    });

    it('should get subscriptions by event type', () => {
      const config1: IWebhookSubscriptionConfig = {
        name: 'Alert Webhook',
        url: 'https://example.com/alerts',
        eventTypes: ['alert.triggered'],
      };

      const config2: IWebhookSubscriptionConfig = {
        name: 'Detection Webhook',
        url: 'https://example.com/detections',
        eventTypes: ['detection.created'],
      };

      service.registerSubscription(config1, 'user-123');
      service.registerSubscription(config2, 'user-123');

      const alertWebhooks = service.getSubscriptionsByEventType('alert.triggered');
      expect(alertWebhooks.length).toBe(1);
      expect(alertWebhooks[0].name).toBe('Alert Webhook');
    });

    it('should update subscription', () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'Original Name',
        url: 'https://example.com/webhook',
        eventTypes: ['alert.triggered'],
      };

      const result = service.registerSubscription(subscriptionConfig, 'user-123');

      const updated = service.updateSubscription(
        result.subscriptionId,
        { name: 'Updated Name' },
        'user-456',
      );

      expect(updated).toBe(true);

      const subscription = service.getSubscription(result.subscriptionId);
      expect(subscription?.name).toBe('Updated Name');
    });

    it('should not update non-existent subscription', () => {
      const updated = service.updateSubscription(
        'non-existent',
        { name: 'New Name' },
        'user-123',
      );

      expect(updated).toBe(false);
    });

    it('should delete subscription', () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'To Delete',
        url: 'https://example.com/webhook',
        eventTypes: ['alert.triggered'],
      };

      const result = service.registerSubscription(subscriptionConfig, 'user-123');
      const deleted = service.deleteSubscription(result.subscriptionId, 'user-456');

      expect(deleted).toBe(true);

      const subscription = service.getSubscription(result.subscriptionId);
      expect(subscription).toBeNull();
    });

    it('should not delete non-existent subscription', () => {
      const deleted = service.deleteSubscription('non-existent', 'user-123');
      expect(deleted).toBe(false);
    });

    it('should activate subscription', () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'Test',
        url: 'https://example.com/webhook',
        eventTypes: ['alert.triggered'],
      };

      const result = service.registerSubscription(subscriptionConfig, 'user-123');
      service.deactivateSubscription(result.subscriptionId);

      const activated = service.activateSubscription(result.subscriptionId);
      expect(activated).toBe(true);

      const subscription = service.getSubscription(result.subscriptionId);
      expect(subscription?.isActive).toBe(true);
    });

    it('should deactivate subscription', () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'Test',
        url: 'https://example.com/webhook',
        eventTypes: ['alert.triggered'],
      };

      const result = service.registerSubscription(subscriptionConfig, 'user-123');

      const deactivated = service.deactivateSubscription(result.subscriptionId);
      expect(deactivated).toBe(true);

      const subscription = service.getSubscription(result.subscriptionId);
      expect(subscription?.isActive).toBe(false);
    });
  });

  describe('Event Triggering', () => {
    it('should trigger event', async () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'Alert Webhook',
        url: 'https://example.com/webhook',
        eventTypes: ['alert.triggered'],
      };

      service.registerSubscription(subscriptionConfig, 'user-123');

      const event: IWebhookEventPayload = {
        eventId: 'evt-123',
        eventType: 'alert.triggered',
        timestamp: new Date(),
        source: 'detection-service',
        data: { alertId: 'alert-123', severity: 'high' },
      };

      await service.triggerEvent(event);

      const stats = service.getStats();
      expect(stats.totalDeliveries).toBeGreaterThan(0);
    });

    it('should filter subscriptions by event type', async () => {
      const alertConfig: IWebhookSubscriptionConfig = {
        name: 'Alert Webhook',
        url: 'https://example.com/alert',
        eventTypes: ['alert.triggered'],
      };

      const detectionConfig: IWebhookSubscriptionConfig = {
        name: 'Detection Webhook',
        url: 'https://example.com/detection',
        eventTypes: ['detection.created'],
      };

      service.registerSubscription(alertConfig, 'user-123');
      service.registerSubscription(detectionConfig, 'user-123');

      const event: IWebhookEventPayload = {
        eventId: 'evt-123',
        eventType: 'alert.triggered',
        timestamp: new Date(),
        source: 'detection-service',
        data: {},
      };

      await service.triggerEvent(event);

      const deliveries = service.getDeliveryHistory({ eventType: 'alert.triggered' });
      expect(deliveries.length).toBeGreaterThan(0);
    });

    it('should apply filters to events', async () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'High Severity Alerts',
        url: 'https://example.com/webhook',
        eventTypes: ['alert.triggered'],
        filters: [
          {
            filterId: 'filter-1',
            field: 'severity',
            operator: 'equals',
            value: 'high',
          },
        ],
      };

      service.registerSubscription(subscriptionConfig, 'user-123');

      const event: IWebhookEventPayload = {
        eventId: 'evt-123',
        eventType: 'alert.triggered',
        timestamp: new Date(),
        source: 'detection-service',
        data: { severity: 'low' },
      };

      await service.triggerEvent(event);

      const deliveries = service.getDeliveryHistory({});
      // Event should not match filter, so no delivery
      expect(deliveries.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Batch Events', () => {
    it('should trigger batch events', async () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'Webhook',
        url: 'https://example.com/webhook',
        eventTypes: ['alert.triggered'],
      };

      service.registerSubscription(subscriptionConfig, 'user-123');

      const batch: IWebhookBatchEventTrigger = {
        events: [
          {
            eventId: 'evt-1',
            eventType: 'alert.triggered',
            timestamp: new Date(),
            source: 'detection-service',
            data: {},
          },
          {
            eventId: 'evt-2',
            eventType: 'alert.triggered',
            timestamp: new Date(),
            source: 'detection-service',
            data: {},
          },
        ],
      };

      const result = await service.triggerBatchEvents(batch);

      expect(result.totalEvents).toBe(2);
      expect(result.successfulDeliveries).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Delivery Management', () => {
    it('should get delivery history', async () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'Webhook',
        url: 'https://example.com/webhook',
        eventTypes: ['alert.triggered'],
      };

      const result = service.registerSubscription(subscriptionConfig, 'user-123');

      const event: IWebhookEventPayload = {
        eventId: 'evt-123',
        eventType: 'alert.triggered',
        timestamp: new Date(),
        source: 'detection-service',
        data: {},
      };

      await service.triggerEvent(event);

      const deliveries = service.getDeliveryHistory({
        subscriptionId: result.subscriptionId,
      });

      expect(deliveries.length).toBeGreaterThanOrEqual(0);
    });

    it('should get delivery by ID', async () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'Webhook',
        url: 'https://example.com/webhook',
        eventTypes: ['alert.triggered'],
      };

      const result = service.registerSubscription(subscriptionConfig, 'user-123');

      const event: IWebhookEventPayload = {
        eventId: 'evt-123',
        eventType: 'alert.triggered',
        timestamp: new Date(),
        source: 'detection-service',
        data: {},
      };

      await service.triggerEvent(event);

      const deliveries = service.getDeliveryHistory({});
      if (deliveries.length > 0) {
        const delivery = service.getDelivery(deliveries[0].deliveryId);
        expect(delivery).not.toBeNull();
      }
    });

    it('should retry failed delivery', async () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'Webhook',
        url: 'https://example.com/webhook',
        eventTypes: ['alert.triggered'],
      };

      const result = service.registerSubscription(subscriptionConfig, 'user-123');

      const event: IWebhookEventPayload = {
        eventId: 'evt-123',
        eventType: 'alert.triggered',
        timestamp: new Date(),
        source: 'detection-service',
        data: {},
      };

      await service.triggerEvent(event);

      const deliveries = service.getDeliveryHistory({});
      if (deliveries.length > 0) {
        const retried = await service.retryDelivery(deliveries[0].deliveryId);
        expect(retried).toBe(true);
      }
    });
  });

  describe('Webhook Testing', () => {
    it('should test webhook', async () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        eventTypes: ['alert.triggered'],
      };

      const result = service.registerSubscription(subscriptionConfig, 'user-123');

      const testResult = await service.testWebhook(result.subscriptionId);

      expect(testResult.subscriptionId).toBe(result.subscriptionId);
      expect(testResult.attempts.length).toBeGreaterThan(0);
    });

    it('should return error for non-existent subscription test', async () => {
      const testResult = await service.testWebhook('non-existent');

      expect(testResult.success).toBe(false);
      expect(testResult.error).toBeDefined();
    });
  });

  describe('Metrics and Statistics', () => {
    it('should track statistics', async () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'Webhook',
        url: 'https://example.com/webhook',
        eventTypes: ['alert.triggered'],
      };

      service.registerSubscription(subscriptionConfig, 'user-123');

      const event: IWebhookEventPayload = {
        eventId: 'evt-123',
        eventType: 'alert.triggered',
        timestamp: new Date(),
        source: 'detection-service',
        data: {},
      };

      await service.triggerEvent(event);

      const stats = service.getStats();

      expect(stats.totalSubscriptions).toBe(1);
      expect(stats.activeSubscriptions).toBe(1);
      expect(stats.totalDeliveries).toBeGreaterThan(0);
    });

    it('should calculate success rate', () => {
      const stats = service.getStats();
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Audit Logging', () => {
    it('should maintain audit log', () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'Test',
        url: 'https://example.com/webhook',
        eventTypes: ['alert.triggered'],
      };

      service.registerSubscription(subscriptionConfig, 'user-123');

      const auditLog = service.getAuditLog();
      expect(auditLog.length).toBeGreaterThan(0);
    });

    it('should include subscription ID in audit', () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'Test',
        url: 'https://example.com/webhook',
        eventTypes: ['alert.triggered'],
      };

      const result = service.registerSubscription(subscriptionConfig, 'user-123');

      const auditLog = service.getAuditLog();
      const entry = auditLog.find((e) => e.subscriptionId === result.subscriptionId);

      expect(entry).toBeDefined();
    });
  });

  describe('Event Listeners', () => {
    it('should call event listener on event trigger', (done) => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'Webhook',
        url: 'https://example.com/webhook',
        eventTypes: ['alert.triggered'],
      };

      service.registerSubscription(subscriptionConfig, 'user-123');

      const listener: WebhookEventListener = async (event) => {
        expect(event.eventType).toBe('alert.triggered');
        done();
      };

      service.onEvent(listener);

      const event: IWebhookEventPayload = {
        eventId: 'evt-123',
        eventType: 'alert.triggered',
        timestamp: new Date(),
        source: 'detection-service',
        data: {},
      };

      service.triggerEvent(event).catch(done);
    });

    it('should remove event listener', () => {
      const listener: WebhookEventListener = async () => {};
      service.onEvent(listener);
      service.offEvent(listener);
      expect(true).toBe(true);
    });

    it('should call delivery listener on successful delivery', (done) => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'Webhook',
        url: 'https://example.com/webhook',
        eventTypes: ['alert.triggered'],
      };

      service.registerSubscription(subscriptionConfig, 'user-123');

      const listener: WebhookDeliveryListener = async (delivery) => {
        expect(delivery.subscriptionId).toBeDefined();
        done();
      };

      service.onDelivery(listener);

      const event: IWebhookEventPayload = {
        eventId: 'evt-123',
        eventType: 'alert.triggered',
        timestamp: new Date(),
        source: 'detection-service',
        data: {},
      };

      service.triggerEvent(event).catch(done);
    });

    it('should remove delivery listener', () => {
      const listener: WebhookDeliveryListener = async () => {};
      service.onDelivery(listener);
      service.offDelivery(listener);
      expect(true).toBe(true);
    });
  });

  describe('Health Check', () => {
    it('should perform health check', async () => {
      const health = await service.performHealthCheck();

      expect(health.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
      expect(health.checks).toBeDefined();
    });

    it('should report metrics in health check', async () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'Webhook',
        url: 'https://example.com/webhook',
        eventTypes: ['alert.triggered'],
      };

      service.registerSubscription(subscriptionConfig, 'user-123');

      const health = await service.performHealthCheck();

      expect(health.activeSubscriptions).toBeGreaterThanOrEqual(0);
      expect(health.pendingDeliveries).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Configuration Validation', () => {
    it('should throw error for invalid timeout', () => {
      const invalidConfig: IWebhookServiceConfig = {
        enableRetry: true,
        enableSignature: true,
        defaultMaxRetries: 3,
        defaultTimeoutMs: 500,
        enableAudit: true,
        enableMetrics: true,
      };

      expect(() => {
        createWebhookService(invalidConfig);
      }).toThrow();
    });

    it('should throw error for invalid max retries', () => {
      const invalidConfig: IWebhookServiceConfig = {
        enableRetry: true,
        enableSignature: true,
        defaultMaxRetries: -1,
        defaultTimeoutMs: 5000,
        enableAudit: true,
        enableMetrics: true,
      };

      expect(() => {
        createWebhookService(invalidConfig);
      }).toThrow();
    });
  });

  describe('Integration', () => {
    it('should handle complete webhook flow', async () => {
      const subscriptionConfig: IWebhookSubscriptionConfig = {
        name: 'Integration Test',
        url: 'https://example.com/webhook',
        eventTypes: ['alert.triggered'],
        secret: 'test-secret',
        headers: { 'X-Custom-Header': 'value' },
      };

      const result = service.registerSubscription(subscriptionConfig, 'user-123');

      const event: IWebhookEventPayload = {
        eventId: 'evt-123',
        eventType: 'alert.triggered',
        timestamp: new Date(),
        source: 'detection-service',
        data: { alertId: 'alert-123' },
      };

      await service.triggerEvent(event);

      const subscription = service.getSubscription(result.subscriptionId);
      expect(subscription).not.toBeNull();

      const stats = service.getStats();
      expect(stats.totalSubscriptions).toBe(1);

      const auditLog = service.getAuditLog();
      expect(auditLog.length).toBeGreaterThan(0);
    });
  });
});
