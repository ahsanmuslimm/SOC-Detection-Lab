/**
 * Webhook Service - Demonstration Scenarios
 */

import {
  WebhookService,
  createWebhookService,
  IWebhookServiceConfig,
  IWebhookSubscriptionConfig,
  IWebhookEventPayload,
  IWebhookBatchEventTrigger,
} from '../src';

/**
 * Demo 1: Basic Subscription Registration
 */
async function demo1_BasicSubscriptionRegistration() {
  console.log('\n=== Demo 1: Basic Subscription Registration ===\n');

  const config: IWebhookServiceConfig = {
    enableRetry: true,
    enableSignature: true,
    defaultMaxRetries: 3,
    defaultTimeoutMs: 5000,
    enableAudit: true,
    enableMetrics: true,
  };

  const service = createWebhookService(config);

  // Register subscription
  const subscriptionConfig: IWebhookSubscriptionConfig = {
    name: 'Alert Webhook',
    description: 'Receives all alert events',
    url: 'https://example.com/webhooks/alerts',
    eventTypes: ['alert.triggered', 'alert.resolved'],
    secret: 'webhook-secret-key',
  };

  const result = service.registerSubscription(subscriptionConfig, 'user-123');

  console.log(`Subscription registered: ${result.registered}`);
  console.log(`Subscription ID: ${result.subscriptionId}`);

  const subscription = service.getSubscription(result.subscriptionId);
  console.log(`Subscription details:`, {
    name: subscription?.name,
    url: subscription?.url,
    eventTypes: subscription?.eventTypes,
    isActive: subscription?.isActive,
  });

  service.stop();
}

/**
 * Demo 2: Multiple Event Types
 */
async function demo2_MultipleEventTypes() {
  console.log('\n=== Demo 2: Multiple Event Types ===\n');

  const config: IWebhookServiceConfig = {
    enableRetry: true,
    enableSignature: true,
    defaultMaxRetries: 3,
    defaultTimeoutMs: 5000,
    enableAudit: true,
    enableMetrics: true,
  };

  const service = createWebhookService(config);

  // Register subscriptions for different events
  const subscriptions = [
    {
      name: 'Alert Webhook',
      url: 'https://example.com/alerts',
      eventTypes: ['alert.triggered', 'alert.resolved'],
    },
    {
      name: 'Detection Webhook',
      url: 'https://example.com/detections',
      eventTypes: ['detection.created', 'detection.updated'],
    },
    {
      name: 'Incident Webhook',
      url: 'https://example.com/incidents',
      eventTypes: ['incident.created', 'incident.updated', 'incident.closed'],
    },
  ];

  for (const sub of subscriptions) {
    const result = service.registerSubscription(sub as IWebhookSubscriptionConfig, 'user-123');
    console.log(`✓ Registered: ${sub.name} (${result.subscriptionId})`);
  }

  const allSubscriptions = service.getAllSubscriptions();
  console.log(`\nTotal subscriptions: ${allSubscriptions.length}`);

  service.stop();
}

/**
 * Demo 3: Event Triggering
 */
async function demo3_EventTriggering() {
  console.log('\n=== Demo 3: Event Triggering ===\n');

  const config: IWebhookServiceConfig = {
    enableRetry: true,
    enableSignature: true,
    defaultMaxRetries: 3,
    defaultTimeoutMs: 5000,
    enableAudit: true,
    enableMetrics: true,
  };

  const service = createWebhookService(config);

  // Register subscription
  service.registerSubscription(
    {
      name: 'Alert Webhook',
      url: 'https://example.com/webhooks/alerts',
      eventTypes: ['alert.triggered'],
    },
    'user-123',
  );

  // Trigger event
  const event: IWebhookEventPayload = {
    eventId: 'evt-alert-001',
    eventType: 'alert.triggered',
    timestamp: new Date(),
    source: 'detection-engine',
    data: {
      alertId: 'alert-123',
      severity: 'high',
      title: 'Suspicious Login Detected',
      description: 'Multiple failed login attempts detected',
    },
  };

  console.log('Triggering event...');
  await service.triggerEvent(event);
  console.log('Event triggered successfully');

  const stats = service.getStats();
  console.log(`\nWebhook statistics:`, {
    totalDeliveries: stats.totalDeliveries,
    successfulDeliveries: stats.successfulDeliveries,
    failedDeliveries: stats.failedDeliveries,
  });

  service.stop();
}

/**
 * Demo 4: Event Filtering
 */
async function demo4_EventFiltering() {
  console.log('\n=== Demo 4: Event Filtering ===\n');

  const config: IWebhookServiceConfig = {
    enableRetry: true,
    enableSignature: true,
    defaultMaxRetries: 3,
    defaultTimeoutMs: 5000,
    enableAudit: true,
    enableMetrics: true,
  };

  const service = createWebhookService(config);

  // Register subscription with filters
  const result = service.registerSubscription(
    {
      name: 'High Severity Alerts Only',
      url: 'https://example.com/high-severity',
      eventTypes: ['alert.triggered'],
      filters: [
        {
          filterId: 'severity-filter',
          field: 'severity',
          operator: 'equals',
          value: 'high',
        },
      ],
    },
    'user-123',
  );

  console.log('Subscription with filter registered');
  console.log(`Filter: severity = 'high'\n`);

  // Trigger events with different severities
  const events: IWebhookEventPayload[] = [
    {
      eventId: 'evt-1',
      eventType: 'alert.triggered',
      timestamp: new Date(),
      source: 'detection-engine',
      data: { severity: 'high', title: 'Critical Alert' },
    },
    {
      eventId: 'evt-2',
      eventType: 'alert.triggered',
      timestamp: new Date(),
      source: 'detection-engine',
      data: { severity: 'low', title: 'Low Priority Alert' },
    },
    {
      eventId: 'evt-3',
      eventType: 'alert.triggered',
      timestamp: new Date(),
      source: 'detection-engine',
      data: { severity: 'high', title: 'Another Critical Alert' },
    },
  ];

  for (const event of events) {
    await service.triggerEvent(event);
    console.log(`Triggered event with severity: ${(event.data as Record<string, string>).severity}`);
  }

  service.stop();
}

/**
 * Demo 5: Subscription Management
 */
async function demo5_SubscriptionManagement() {
  console.log('\n=== Demo 5: Subscription Management ===\n');

  const config: IWebhookServiceConfig = {
    enableRetry: true,
    enableSignature: true,
    defaultMaxRetries: 3,
    defaultTimeoutMs: 5000,
    enableAudit: true,
    enableMetrics: true,
  };

  const service = createWebhookService(config);

  // Register subscription
  const result = service.registerSubscription(
    {
      name: 'Test Webhook',
      url: 'https://example.com/webhook',
      eventTypes: ['alert.triggered'],
    },
    'user-123',
  );

  console.log('Initial subscription created');
  let sub = service.getSubscription(result.subscriptionId);
  console.log(`  Name: ${sub?.name}`);
  console.log(`  Active: ${sub?.isActive}`);

  // Update subscription
  service.updateSubscription(
    result.subscriptionId,
    {
      name: 'Updated Webhook',
      url: 'https://example.com/updated-webhook',
    },
    'user-456',
  );

  console.log('\nSubscription updated');
  sub = service.getSubscription(result.subscriptionId);
  console.log(`  Name: ${sub?.name}`);
  console.log(`  URL: ${sub?.url}`);

  // Deactivate subscription
  service.deactivateSubscription(result.subscriptionId);
  console.log('\nSubscription deactivated');

  sub = service.getSubscription(result.subscriptionId);
  console.log(`  Active: ${sub?.isActive}`);

  // Reactivate subscription
  service.activateSubscription(result.subscriptionId);
  console.log('\nSubscription reactivated');

  sub = service.getSubscription(result.subscriptionId);
  console.log(`  Active: ${sub?.isActive}`);

  service.stop();
}

/**
 * Demo 6: Batch Event Triggering
 */
async function demo6_BatchEventTriggering() {
  console.log('\n=== Demo 6: Batch Event Triggering ===\n');

  const config: IWebhookServiceConfig = {
    enableRetry: true,
    enableSignature: true,
    defaultMaxRetries: 3,
    defaultTimeoutMs: 5000,
    enableAudit: true,
    enableMetrics: true,
  };

  const service = createWebhookService(config);

  // Register subscription
  service.registerSubscription(
    {
      name: 'Alert Webhook',
      url: 'https://example.com/webhooks/alerts',
      eventTypes: ['alert.triggered'],
    },
    'user-123',
  );

  // Trigger batch events
  const batch: IWebhookBatchEventTrigger = {
    events: [
      {
        eventId: 'batch-evt-1',
        eventType: 'alert.triggered',
        timestamp: new Date(),
        source: 'detection-engine',
        data: { alertId: 'alert-1' },
      },
      {
        eventId: 'batch-evt-2',
        eventType: 'alert.triggered',
        timestamp: new Date(),
        source: 'detection-engine',
        data: { alertId: 'alert-2' },
      },
      {
        eventId: 'batch-evt-3',
        eventType: 'alert.triggered',
        timestamp: new Date(),
        source: 'detection-engine',
        data: { alertId: 'alert-3' },
      },
    ],
  };

  console.log('Triggering batch of 3 events...');
  const result = await service.triggerBatchEvents(batch);

  console.log(`\nBatch results:`, {
    totalEvents: result.totalEvents,
    successfulDeliveries: result.successfulDeliveries,
    failedDeliveries: result.failedDeliveries,
  });

  service.stop();
}

/**
 * Demo 7: Webhook Testing
 */
async function demo7_WebhookTesting() {
  console.log('\n=== Demo 7: Webhook Testing ===\n');

  const config: IWebhookServiceConfig = {
    enableRetry: true,
    enableSignature: true,
    defaultMaxRetries: 3,
    defaultTimeoutMs: 5000,
    enableAudit: true,
    enableMetrics: true,
  };

  const service = createWebhookService(config);

  // Register subscription
  const result = service.registerSubscription(
    {
      name: 'Test Webhook',
      url: 'https://example.com/webhook',
      eventTypes: ['alert.triggered'],
    },
    'user-123',
  );

  // Test webhook
  console.log('Testing webhook...');
  const testResult = await service.testWebhook(result.subscriptionId);

  console.log(`\nTest result:`, {
    success: testResult.success,
    httpStatus: testResult.httpStatus,
    responseTime: `${testResult.responseTime}ms`,
    attempts: testResult.attempts.length,
  });

  if (testResult.attempts.length > 0) {
    const attempt = testResult.attempts[0];
    console.log(`\nFirst attempt:`, {
      status: attempt.status,
      httpStatus: attempt.httpStatus,
      durationMs: attempt.durationMs,
    });
  }

  service.stop();
}

/**
 * Demo 8: Metrics and Statistics
 */
async function demo8_MetricsAndStatistics() {
  console.log('\n=== Demo 8: Metrics and Statistics ===\n');

  const config: IWebhookServiceConfig = {
    enableRetry: true,
    enableSignature: true,
    defaultMaxRetries: 3,
    defaultTimeoutMs: 5000,
    enableAudit: true,
    enableMetrics: true,
  };

  const service = createWebhookService(config);

  // Register multiple subscriptions
  for (let i = 1; i <= 3; i++) {
    service.registerSubscription(
      {
        name: `Webhook ${i}`,
        url: `https://example.com/webhook-${i}`,
        eventTypes: ['alert.triggered', 'detection.created'],
      },
      'user-123',
    );
  }

  // Trigger events
  for (let i = 1; i <= 5; i++) {
    const event: IWebhookEventPayload = {
      eventId: `evt-${i}`,
      eventType: i % 2 === 0 ? 'alert.triggered' : 'detection.created',
      timestamp: new Date(),
      source: 'detection-engine',
      data: { id: `item-${i}` },
    };
    await service.triggerEvent(event);
  }

  // Get statistics
  const stats = service.getStats();

  console.log('Webhook Service Statistics:');
  console.log(`  Total Subscriptions: ${stats.totalSubscriptions}`);
  console.log(`  Active Subscriptions: ${stats.activeSubscriptions}`);
  console.log(`  Total Deliveries: ${stats.totalDeliveries}`);
  console.log(`  Successful Deliveries: ${stats.successfulDeliveries}`);
  console.log(`  Failed Deliveries: ${stats.failedDeliveries}`);
  console.log(`  Success Rate: ${(stats.successRate * 100).toFixed(2)}%`);
  console.log(`  Average Delivery Time: ${stats.averageDeliveryTimeMs.toFixed(2)}ms`);

  console.log(`\nDeliveries by Status:`, stats.deliveriesByStatus);
  console.log(`Deliveries by Event Type:`, stats.deliveriesByEventType);

  service.stop();
}

/**
 * Demo 9: Event Listeners
 */
async function demo9_EventListeners() {
  console.log('\n=== Demo 9: Event Listeners ===\n');

  const config: IWebhookServiceConfig = {
    enableRetry: true,
    enableSignature: true,
    defaultMaxRetries: 3,
    defaultTimeoutMs: 5000,
    enableAudit: true,
    enableMetrics: true,
  };

  const service = createWebhookService(config);
  const events: string[] = [];

  // Register subscription
  service.registerSubscription(
    {
      name: 'Alert Webhook',
      url: 'https://example.com/webhooks/alerts',
      eventTypes: ['alert.triggered'],
    },
    'user-123',
  );

  // Add event listener
  service.onEvent(async (event) => {
    events.push(`[Event] ${event.eventType} - ${event.eventId}`);
  });

  // Add delivery listener
  service.onDelivery(async (delivery) => {
    events.push(`[Delivery] Status: ${delivery.status}`);
  });

  // Trigger event
  const event: IWebhookEventPayload = {
    eventId: 'evt-123',
    eventType: 'alert.triggered',
    timestamp: new Date(),
    source: 'detection-engine',
    data: { alertId: 'alert-123' },
  };

  await service.triggerEvent(event);

  console.log('Events captured:');
  events.forEach((e) => console.log(`  ${e}`));

  service.stop();
}

/**
 * Demo 10: Audit Logging
 */
async function demo10_AuditLogging() {
  console.log('\n=== Demo 10: Audit Logging ===\n');

  const config: IWebhookServiceConfig = {
    enableRetry: true,
    enableSignature: true,
    defaultMaxRetries: 3,
    defaultTimeoutMs: 5000,
    enableAudit: true,
    enableMetrics: true,
  };

  const service = createWebhookService(config);

  // Register subscription
  const result = service.registerSubscription(
    {
      name: 'Original Name',
      url: 'https://example.com/webhook',
      eventTypes: ['alert.triggered'],
    },
    'user-123',
  );

  // Update subscription
  service.updateSubscription(
    result.subscriptionId,
    { name: 'Updated Name' },
    'user-456',
  );

  // Get audit log
  const auditLog = service.getAuditLog(10);

  console.log('Audit Log Entries:');
  auditLog.forEach((entry) => {
    console.log(`  - ${entry.action.toUpperCase()} at ${entry.timestamp.toISOString()}`);
    if (entry.userId) console.log(`    User: ${entry.userId}`);
    if (entry.subscriptionId) console.log(`    Subscription: ${entry.subscriptionId}`);
  });

  service.stop();
}

/**
 * Demo 11: Health Check
 */
async function demo11_HealthCheck() {
  console.log('\n=== Demo 11: Health Check ===\n');

  const config: IWebhookServiceConfig = {
    enableRetry: true,
    enableSignature: true,
    defaultMaxRetries: 3,
    defaultTimeoutMs: 5000,
    enableAudit: true,
    enableMetrics: true,
  };

  const service = createWebhookService(config);

  // Register subscriptions
  for (let i = 1; i <= 3; i++) {
    service.registerSubscription(
      {
        name: `Webhook ${i}`,
        url: `https://example.com/webhook-${i}`,
        eventTypes: ['alert.triggered'],
      },
      'user-123',
    );
  }

  // Perform health check
  const health = await service.performHealthCheck();

  console.log('Webhook Service Health Check:');
  console.log(`  Overall Status: ${health.status}`);
  console.log(`  Active Subscriptions: ${health.activeSubscriptions}`);
  console.log(`  Pending Deliveries: ${health.pendingDeliveries}`);
  console.log(`  Failed Deliveries: ${health.failedDeliveries}`);
  console.log(`  Uptime: ${health.uptime}ms`);

  console.log(`\nComponent Checks:`);
  health.checks.forEach((check) => {
    console.log(`  - ${check.name}: ${check.status}`);
    if (check.message) console.log(`    Message: ${check.message}`);
  });

  service.stop();
}

/**
 * Demo 12: Complete Integration Flow
 */
async function demo12_CompleteIntegrationFlow() {
  console.log('\n=== Demo 12: Complete Integration Flow ===\n');

  const config: IWebhookServiceConfig = {
    enableRetry: true,
    enableSignature: true,
    defaultMaxRetries: 3,
    defaultTimeoutMs: 5000,
    enableAudit: true,
    enableMetrics: true,
  };

  const service = createWebhookService(config);
  const flowEvents: string[] = [];

  // Add listeners
  service.onEvent(async (event) => {
    flowEvents.push(`[Event Triggered] ${event.eventType}`);
  });

  service.onDelivery(async (delivery) => {
    flowEvents.push(`[Delivery ${delivery.status}] to ${delivery.subscriptionId}`);
  });

  // Register multiple subscriptions
  const sub1 = service.registerSubscription(
    {
      name: 'Alert Webhook',
      url: 'https://example.com/alerts',
      eventTypes: ['alert.triggered', 'alert.resolved'],
    },
    'user-123',
  );

  const sub2 = service.registerSubscription(
    {
      name: 'Detection Webhook',
      url: 'https://example.com/detections',
      eventTypes: ['detection.created'],
    },
    'user-123',
  );

  flowEvents.push('[Subscriptions Registered]');

  // Trigger various events
  const events: IWebhookEventPayload[] = [
    {
      eventId: 'evt-1',
      eventType: 'alert.triggered',
      timestamp: new Date(),
      source: 'detection-engine',
      data: { severity: 'high' },
    },
    {
      eventId: 'evt-2',
      eventType: 'detection.created',
      timestamp: new Date(),
      source: 'detection-engine',
      data: { type: 'malware' },
    },
  ];

  for (const event of events) {
    await service.triggerEvent(event);
  }

  // Get final statistics
  const stats = service.getStats();

  console.log('Integration Flow Events:');
  flowEvents.forEach((e) => console.log(`  ${e}`));

  console.log(`\nFinal Statistics:`, {
    subscriptions: stats.totalSubscriptions,
    deliveries: stats.totalDeliveries,
    successful: stats.successfulDeliveries,
    failed: stats.failedDeliveries,
    successRate: `${(stats.successRate * 100).toFixed(2)}%`,
  });

  service.stop();
}

/**
 * Run all demonstrations
 */
async function runAllDemos() {
  try {
    await demo1_BasicSubscriptionRegistration();
    await demo2_MultipleEventTypes();
    await demo3_EventTriggering();
    await demo4_EventFiltering();
    await demo5_SubscriptionManagement();
    await demo6_BatchEventTriggering();
    await demo7_WebhookTesting();
    await demo8_MetricsAndStatistics();
    await demo9_EventListeners();
    await demo10_AuditLogging();
    await demo11_HealthCheck();
    await demo12_CompleteIntegrationFlow();

    console.log('\n=== All demonstrations completed successfully ===\n');
  } catch (error) {
    console.error('Demo execution failed:', error);
  }
}

// Export for testing
export {
  demo1_BasicSubscriptionRegistration,
  demo2_MultipleEventTypes,
  demo3_EventTriggering,
  demo4_EventFiltering,
  demo5_SubscriptionManagement,
  demo6_BatchEventTriggering,
  demo7_WebhookTesting,
  demo8_MetricsAndStatistics,
  demo9_EventListeners,
  demo10_AuditLogging,
  demo11_HealthCheck,
  demo12_CompleteIntegrationFlow,
  runAllDemos,
};
