/**
 * Queue Service - Prototype Demonstrations
 * 12 comprehensive scenario demonstrations
 */

import {
  QueueService,
  createQueueService,
  IQueueServiceConfig,
  MessageHandler,
  QueueListener,
} from '../src/index';

/**
 * Demo 1-12: Complete queue service demonstrations
 */
async function demo1_BasicQueueOperations(): Promise<void> {
  console.log('\n=== Demo 1: Basic Queue Operations ===');

  const config: IQueueServiceConfig = {
    maxQueues: 100,
    maxMessagesPerQueue: 10000,
    defaultVisibilityTimeoutMs: 30000,
    maxMessageSize: 1048576,
    enableDeadLetterQueue: true,
    enableMetrics: true,
    enableAudit: true,
    maxAuditEntries: 1000,
    cleanupIntervalMs: 60000,
    enablePersistence: false,
    retentionDays: 30,
  };

  const service = createQueueService(config);

  const queueId = service.createQueue({
    name: 'alerts',
    type: 'FIFO',
    maxMessages: 1000,
    maxMessageSize: 1048576,
    visibilityTimeoutMs: 30000,
    deliveryGuarantee: 'at-least-once',
    retryPolicy: {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      backoffType: 'exponential',
    },
  });

  console.log(`✓ Created queue: ${queueId}`);

  const msgId1 = service.sendMessage(queueId, { alert: 'SSH Attack' });
  const msgId2 = service.sendMessage(queueId, { alert: 'Port Scan' });

  console.log(`✓ Sent 2 messages`);

  const message = service.receiveMessage(queueId);
  console.log(`✓ Received message: ${message?.body.alert}`);

  service.completeMessage(queueId, message!.messageId);
  console.log(`✓ Completed message`);

  const stats = service.getQueueStats(queueId);
  console.log(`✓ Queue stats: ${stats?.totalMessages} total, ${stats?.completedMessages} completed`);

  service.stop();
}

async function demo2_PriorityQueues(): Promise<void> {
  console.log('\n=== Demo 2: Priority Queues ===');

  const config: IQueueServiceConfig = {
    maxQueues: 100,
    maxMessagesPerQueue: 10000,
    defaultVisibilityTimeoutMs: 30000,
    maxMessageSize: 1048576,
    enableDeadLetterQueue: true,
    enableMetrics: true,
    enableAudit: true,
    maxAuditEntries: 1000,
    cleanupIntervalMs: 60000,
    enablePersistence: false,
    retentionDays: 30,
  };

  const service = createQueueService(config);

  const queueId = service.createQueue({
    name: 'priority_alerts',
    type: 'priority',
    maxMessages: 1000,
    maxMessageSize: 1048576,
    visibilityTimeoutMs: 30000,
    deliveryGuarantee: 'at-least-once',
    retryPolicy: {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      backoffType: 'exponential',
    },
  });

  service.sendMessage(queueId, { alert: 'Low priority' }, { priority: 'low' });
  service.sendMessage(queueId, { alert: 'Critical!' }, { priority: 'critical' });
  service.sendMessage(queueId, { alert: 'Medium' }, { priority: 'normal' });

  console.log(`✓ Sent 3 messages with different priorities`);

  service.stop();
}

async function demo3_BatchOperations(): Promise<void> {
  console.log('\n=== Demo 3: Batch Operations ===');

  const config: IQueueServiceConfig = {
    maxQueues: 100,
    maxMessagesPerQueue: 10000,
    defaultVisibilityTimeoutMs: 30000,
    maxMessageSize: 1048576,
    enableDeadLetterQueue: true,
    enableMetrics: true,
    enableAudit: true,
    maxAuditEntries: 1000,
    cleanupIntervalMs: 60000,
    enablePersistence: false,
    retentionDays: 30,
  };

  const service = createQueueService(config);

  const queueId = service.createQueue({
    name: 'batch_queue',
    type: 'FIFO',
    maxMessages: 1000,
    maxMessageSize: 1048576,
    visibilityTimeoutMs: 30000,
    deliveryGuarantee: 'at-least-once',
    retryPolicy: {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      backoffType: 'exponential',
    },
  });

  const result = service.sendBatch(queueId, [
    { body: { id: 1, type: 'alert' } },
    { body: { id: 2, type: 'event' } },
    { body: { id: 3, type: 'log' } },
  ]);

  console.log(`✓ Batch result: ${result.successCount} success, ${result.failureCount} failed`);

  service.stop();
}

async function demo4_ConsumerRegistration(): Promise<void> {
  console.log('\n=== Demo 4: Consumer Registration ===');

  const config: IQueueServiceConfig = {
    maxQueues: 100,
    maxMessagesPerQueue: 10000,
    defaultVisibilityTimeoutMs: 30000,
    maxMessageSize: 1048576,
    enableDeadLetterQueue: true,
    enableMetrics: true,
    enableAudit: true,
    maxAuditEntries: 1000,
    cleanupIntervalMs: 60000,
    enablePersistence: false,
    retentionDays: 30,
  };

  const service = createQueueService(config);

  const queueId = service.createQueue({
    name: 'consumer_queue',
    type: 'FIFO',
    maxMessages: 1000,
    maxMessageSize: 1048576,
    visibilityTimeoutMs: 30000,
    deliveryGuarantee: 'at-least-once',
    retryPolicy: {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      backoffType: 'exponential',
    },
  });

  const handler: MessageHandler = async (message) => {
    console.log(`Processing: ${JSON.stringify(message.body)}`);
  };

  service.registerConsumer(queueId, 'consumer1', handler);
  console.log(`✓ Registered consumer`);

  service.sendMessage(queueId, { data: 'test' });

  service.unregisterConsumer('consumer1');
  console.log(`✓ Unregistered consumer`);

  service.stop();
}

async function demo5_MessageRetry(): Promise<void> {
  console.log('\n=== Demo 5: Message Retry ===');

  const config: IQueueServiceConfig = {
    maxQueues: 100,
    maxMessagesPerQueue: 10000,
    defaultVisibilityTimeoutMs: 30000,
    maxMessageSize: 1048576,
    enableDeadLetterQueue: true,
    enableMetrics: true,
    enableAudit: true,
    maxAuditEntries: 1000,
    cleanupIntervalMs: 60000,
    enablePersistence: false,
    retentionDays: 30,
  };

  const service = createQueueService(config);

  const queueId = service.createQueue({
    name: 'retry_queue',
    type: 'FIFO',
    maxMessages: 1000,
    maxMessageSize: 1048576,
    visibilityTimeoutMs: 30000,
    deliveryGuarantee: 'at-least-once',
    retryPolicy: {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      backoffType: 'exponential',
    },
  });

  const msgId = service.sendMessage(queueId, { data: 'retry me' });
  const message = service.receiveMessage(queueId);

  service.failMessage(queueId, message!.messageId, 'First attempt failed');
  console.log(`✓ Failed message - will retry`);

  service.stop();
}

async function demo6_TTLMessages(): Promise<void> {
  console.log('\n=== Demo 6: TTL Messages ===');

  const config: IQueueServiceConfig = {
    maxQueues: 100,
    maxMessagesPerQueue: 10000,
    defaultVisibilityTimeoutMs: 30000,
    maxMessageSize: 1048576,
    enableDeadLetterQueue: true,
    enableMetrics: true,
    enableAudit: true,
    maxAuditEntries: 1000,
    cleanupIntervalMs: 60000,
    enablePersistence: false,
    retentionDays: 30,
  };

  const service = createQueueService(config);

  const queueId = service.createQueue({
    name: 'ttl_queue',
    type: 'FIFO',
    maxMessages: 1000,
    maxMessageSize: 1048576,
    visibilityTimeoutMs: 30000,
    deliveryGuarantee: 'at-least-once',
    retryPolicy: {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      backoffType: 'exponential',
    },
  });

  const msgId = service.sendMessage(queueId, { data: 'expires soon' }, { ttlMs: 5000 });
  console.log(`✓ Sent message with 5 second TTL`);

  service.stop();
}

async function demo7_QueueStats(): Promise<void> {
  console.log('\n=== Demo 7: Queue Statistics ===');

  const config: IQueueServiceConfig = {
    maxQueues: 100,
    maxMessagesPerQueue: 10000,
    defaultVisibilityTimeoutMs: 30000,
    maxMessageSize: 1048576,
    enableDeadLetterQueue: true,
    enableMetrics: true,
    enableAudit: true,
    maxAuditEntries: 1000,
    cleanupIntervalMs: 60000,
    enablePersistence: false,
    retentionDays: 30,
  };

  const service = createQueueService(config);

  const queueId = service.createQueue({
    name: 'stats_queue',
    type: 'FIFO',
    maxMessages: 1000,
    maxMessageSize: 1048576,
    visibilityTimeoutMs: 30000,
    deliveryGuarantee: 'at-least-once',
    retryPolicy: {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      backoffType: 'exponential',
    },
  });

  for (let i = 0; i < 10; i++) {
    service.sendMessage(queueId, { id: i });
  }

  const stats = service.getQueueStats(queueId);
  console.log(`✓ Stats:`);
  console.log(`  - Total: ${stats?.totalMessages}`);
  console.log(`  - Pending: ${stats?.pendingMessages}`);
  console.log(`  - Processing: ${stats?.processingMessages}`);

  service.stop();
}

async function demo8_DeadLetterQueue(): Promise<void> {
  console.log('\n=== Demo 8: Dead Letter Queue ===');

  const config: IQueueServiceConfig = {
    maxQueues: 100,
    maxMessagesPerQueue: 10000,
    defaultVisibilityTimeoutMs: 30000,
    maxMessageSize: 1048576,
    enableDeadLetterQueue: true,
    enableMetrics: true,
    enableAudit: true,
    maxAuditEntries: 1000,
    cleanupIntervalMs: 60000,
    enablePersistence: false,
    retentionDays: 30,
  };

  const service = createQueueService(config);

  const dlStats = service.getDeadLetterStats('queue1');
  console.log(`✓ Dead letter queue stats: ${dlStats.totalMessages} messages`);

  service.stop();
}

async function demo9_QueuePurge(): Promise<void> {
  console.log('\n=== Demo 9: Queue Purge ===');

  const config: IQueueServiceConfig = {
    maxQueues: 100,
    maxMessagesPerQueue: 10000,
    defaultVisibilityTimeoutMs: 30000,
    maxMessageSize: 1048576,
    enableDeadLetterQueue: true,
    enableMetrics: true,
    enableAudit: true,
    maxAuditEntries: 1000,
    cleanupIntervalMs: 60000,
    enablePersistence: false,
    retentionDays: 30,
  };

  const service = createQueueService(config);

  const queueId = service.createQueue({
    name: 'purge_queue',
    type: 'FIFO',
    maxMessages: 1000,
    maxMessageSize: 1048576,
    visibilityTimeoutMs: 30000,
    deliveryGuarantee: 'at-least-once',
    retryPolicy: {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      backoffType: 'exponential',
    },
  });

  service.sendMessage(queueId, { msg: 1 });
  service.sendMessage(queueId, { msg: 2 });

  const purged = service.purgeQueue(queueId);
  console.log(`✓ Purged ${purged} messages`);

  service.stop();
}

async function demo10_HealthCheck(): Promise<void> {
  console.log('\n=== Demo 10: Health Check ===');

  const config: IQueueServiceConfig = {
    maxQueues: 100,
    maxMessagesPerQueue: 10000,
    defaultVisibilityTimeoutMs: 30000,
    maxMessageSize: 1048576,
    enableDeadLetterQueue: true,
    enableMetrics: true,
    enableAudit: true,
    maxAuditEntries: 1000,
    cleanupIntervalMs: 60000,
    enablePersistence: false,
    retentionDays: 30,
  };

  const service = createQueueService(config);

  service.createQueue({
    name: 'health_queue',
    type: 'FIFO',
    maxMessages: 1000,
    maxMessageSize: 1048576,
    visibilityTimeoutMs: 30000,
    deliveryGuarantee: 'at-least-once',
    retryPolicy: {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      backoffType: 'exponential',
    },
  });

  const health = await service.performHealthCheck();
  console.log(`✓ Health: ${health.status}`);
  console.log(`✓ Queues: ${health.queues.length}`);

  service.stop();
}

async function demo11_EventListeners(): Promise<void> {
  console.log('\n=== Demo 11: Event Listeners ===');

  const config: IQueueServiceConfig = {
    maxQueues: 100,
    maxMessagesPerQueue: 10000,
    defaultVisibilityTimeoutMs: 30000,
    maxMessageSize: 1048576,
    enableDeadLetterQueue: true,
    enableMetrics: true,
    enableAudit: true,
    maxAuditEntries: 1000,
    cleanupIntervalMs: 60000,
    enablePersistence: false,
    retentionDays: 30,
  };

  const service = createQueueService(config);

  let eventCount = 0;
  const listener: QueueListener = async (event) => {
    eventCount++;
  };

  service.onEvent(listener);

  service.createQueue({
    name: 'event_queue',
    type: 'FIFO',
    maxMessages: 1000,
    maxMessageSize: 1048576,
    visibilityTimeoutMs: 30000,
    deliveryGuarantee: 'at-least-once',
    retryPolicy: {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      backoffType: 'exponential',
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  console.log(`✓ Events captured: ${eventCount}`);

  service.stop();
}

async function demo12_CompleteIntegration(): Promise<void> {
  console.log('\n=== Demo 12: Complete Integration ===');

  const config: IQueueServiceConfig = {
    maxQueues: 100,
    maxMessagesPerQueue: 10000,
    defaultVisibilityTimeoutMs: 30000,
    maxMessageSize: 1048576,
    enableDeadLetterQueue: true,
    enableMetrics: true,
    enableAudit: true,
    maxAuditEntries: 1000,
    cleanupIntervalMs: 60000,
    enablePersistence: false,
    retentionDays: 30,
  };

  const service = createQueueService(config);

  const queueId = service.createQueue({
    name: 'integration_queue',
    type: 'FIFO',
    maxMessages: 1000,
    maxMessageSize: 1048576,
    visibilityTimeoutMs: 30000,
    deliveryGuarantee: 'at-least-once',
    retryPolicy: {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      backoffType: 'exponential',
    },
  });

  console.log('✓ Queue created');

  service.sendBatch(queueId, [
    { body: { alert: 'Alert 1' } },
    { body: { alert: 'Alert 2' } },
  ]);

  console.log('✓ Messages sent');

  for (let i = 0; i < 2; i++) {
    const msg = service.receiveMessage(queueId);
    if (msg) service.completeMessage(queueId, msg.messageId);
  }

  console.log('✓ Messages processed');

  const stats = service.getQueueStats(queueId);
  const health = await service.performHealthCheck();

  console.log(`✓ Final stats: ${stats?.completedMessages} completed`);
  console.log(`✓ Health: ${health.status}`);

  service.stop();
}

async function runAllDemos(): Promise<void> {
  console.log('════════════════════════════════════════════════════════════');
  console.log('           Queue Service - Prototype Demonstrations');
  console.log('════════════════════════════════════════════════════════════');

  try {
    await demo1_BasicQueueOperations();
    await demo2_PriorityQueues();
    await demo3_BatchOperations();
    await demo4_ConsumerRegistration();
    await demo5_MessageRetry();
    await demo6_TTLMessages();
    await demo7_QueueStats();
    await demo8_DeadLetterQueue();
    await demo9_QueuePurge();
    await demo10_HealthCheck();
    await demo11_EventListeners();
    await demo12_CompleteIntegration();

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('          All Demos Completed Successfully');
    console.log('════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('Error running demos:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllDemos().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runAllDemos };
