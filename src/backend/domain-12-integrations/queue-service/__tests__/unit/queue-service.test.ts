/**
 * Queue Service - Unit Tests
 * Comprehensive test coverage for queuing, messaging, and delivery
 */

import {
  QueueService,
  createQueueService,
  IQueueServiceConfig,
  MessageHandler,
  QueueListener,
} from '../../src/index';

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(() => {
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
    service = createQueueService(config);
  });

  afterEach(() => {
    service.stop();
  });

  describe('Queue Management', () => {
    test('should create queue and return ID', () => {
      const queueId = service.createQueue({
        name: 'test_queue',
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

      expect(queueId).toBeDefined();
      expect(typeof queueId).toBe('string');
    });

    test('should retrieve queue configuration', () => {
      const queueId = service.createQueue({
        name: 'config_test',
        type: 'priority',
        maxMessages: 5000,
        maxMessageSize: 1048576,
        visibilityTimeoutMs: 30000,
        deliveryGuarantee: 'exactly-once',
        retryPolicy: {
          maxAttempts: 5,
          initialDelayMs: 500,
          maxDelayMs: 5000,
          backoffMultiplier: 1.5,
          backoffType: 'exponential',
        },
      });

      const config = service.getQueue(queueId);

      expect(config).toBeDefined();
      expect(config?.name).toBe('config_test');
      expect(config?.type).toBe('priority');
    });

    test('should delete queue', () => {
      const queueId = service.createQueue({
        name: 'delete_test',
        type: 'FIFO',
        maxMessages: 1000,
        maxMessageSize: 1048576,
        visibilityTimeoutMs: 30000,
        deliveryGuarantee: 'at-most-once',
        retryPolicy: {
          maxAttempts: 3,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          backoffMultiplier: 2,
          backoffType: 'exponential',
        },
      });

      const deleted = service.deleteQueue(queueId);
      expect(deleted).toBe(true);

      const retrieved = service.getQueue(queueId);
      expect(retrieved).toBeNull();
    });
  });

  describe('Message Operations', () => {
    test('should send message and return ID', () => {
      const queueId = service.createQueue({
        name: 'send_test',
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

      const messageId = service.sendMessage(queueId, { data: 'test' });
      expect(messageId).toBeDefined();
      expect(typeof messageId).toBe('string');
    });

    test('should receive message from queue', () => {
      const queueId = service.createQueue({
        name: 'receive_test',
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

      service.sendMessage(queueId, { payload: 'message1' });
      const message = service.receiveMessage(queueId);

      expect(message).toBeDefined();
      expect(message?.body.payload).toBe('message1');
      expect(message?.status).toBe('processing');
    });

    test('should complete message', () => {
      const queueId = service.createQueue({
        name: 'complete_test',
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

      const messageId = service.sendMessage(queueId, { data: 'test' });
      const message = service.receiveMessage(queueId);

      const completed = service.completeMessage(queueId, message!.messageId);
      expect(completed).toBe(true);
    });

    test('should handle message failure', () => {
      const queueId = service.createQueue({
        name: 'failure_test',
        type: 'FIFO',
        maxMessages: 1000,
        maxMessageSize: 1048576,
        visibilityTimeoutMs: 30000,
        deliveryGuarantee: 'at-least-once',
        retryPolicy: {
          maxAttempts: 2,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          backoffMultiplier: 2,
          backoffType: 'exponential',
        },
      });

      const messageId = service.sendMessage(queueId, { data: 'fail' });
      const message = service.receiveMessage(queueId);

      const failed = service.failMessage(queueId, message!.messageId, 'Processing failed');
      expect(failed).toBe(true);
    });

    test('should send message with priority', () => {
      const queueId = service.createQueue({
        name: 'priority_test',
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

      const highPriorityId = service.sendMessage(queueId, { priority: 'high' }, { priority: 'high' });
      const lowPriorityId = service.sendMessage(queueId, { priority: 'low' }, { priority: 'low' });

      expect(highPriorityId).toBeDefined();
      expect(lowPriorityId).toBeDefined();
    });

    test('should send message with TTL', () => {
      const queueId = service.createQueue({
        name: 'ttl_test',
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

      const messageId = service.sendMessage(queueId, { data: 'ttl' }, { ttlMs: 5000 });
      expect(messageId).toBeDefined();
    });
  });

  describe('Batch Operations', () => {
    test('should send batch of messages', () => {
      const queueId = service.createQueue({
        name: 'batch_test',
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

      const messages = [
        { body: { id: 1 } },
        { body: { id: 2 } },
        { body: { id: 3 } },
      ];

      const result = service.sendBatch(queueId, messages);

      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);
      expect(result.messageIds.length).toBe(3);
    });

    test('should handle batch errors', () => {
      const nonexistentQueueId = 'nonexistent';

      try {
        service.sendBatch(nonexistentQueueId, [{ body: { data: 'test' } }]);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Consumer Management', () => {
    test('should register consumer', () => {
      const queueId = service.createQueue({
        name: 'consumer_test',
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

      const handler: MessageHandler = async () => {};
      const registered = service.registerConsumer(queueId, 'consumer1', handler);

      expect(registered).toBe(true);
    });

    test('should unregister consumer', () => {
      const queueId = service.createQueue({
        name: 'unregister_test',
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

      const handler: MessageHandler = async () => {};
      service.registerConsumer(queueId, 'consumer1', handler);

      const unregistered = service.unregisterConsumer('consumer1');
      expect(unregistered).toBe(true);
    });
  });

  describe('Queue Statistics', () => {
    test('should get queue statistics', () => {
      const queueId = service.createQueue({
        name: 'stats_test',
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

      service.sendMessage(queueId, { data: 'test1' });
      service.sendMessage(queueId, { data: 'test2' });

      const stats = service.getQueueStats(queueId);

      expect(stats).toBeDefined();
      expect(stats?.totalMessages).toBeGreaterThan(0);
      expect(stats?.pendingMessages).toBeGreaterThan(0);
    });

    test('should track message completion', () => {
      const queueId = service.createQueue({
        name: 'completion_test',
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

      service.sendMessage(queueId, { data: 'test' });
      const message = service.receiveMessage(queueId);
      service.completeMessage(queueId, message!.messageId);

      const stats = service.getQueueStats(queueId);

      expect(stats?.completedMessages).toBeGreaterThan(0);
    });
  });

  describe('Dead Letter Queue', () => {
    test('should get dead letter statistics', () => {
      const dlStats = service.getDeadLetterStats('any');

      expect(dlStats).toBeDefined();
      expect(dlStats.totalMessages).toBeDefined();
    });
  });

  describe('Queue Operations', () => {
    test('should purge queue', () => {
      const queueId = service.createQueue({
        name: 'purge_test',
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

      service.sendMessage(queueId, { data: 'msg1' });
      service.sendMessage(queueId, { data: 'msg2' });

      const purged = service.purgeQueue(queueId);
      expect(purged).toBe(2);

      const stats = service.getQueueStats(queueId);
      expect(stats?.totalMessages).toBe(0);
    });
  });

  describe('Health Checks', () => {
    test('should perform health check', async () => {
      service.createQueue({
        name: 'health_test',
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

      expect(health).toBeDefined();
      expect(health.status).toMatch(/healthy|degraded|unhealthy/);
      expect(Array.isArray(health.queues)).toBe(true);
    });

    test('should include queue details in health check', async () => {
      const queueId = service.createQueue({
        name: 'health_detail_test',
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

      service.sendMessage(queueId, { data: 'test' });

      const health = await service.performHealthCheck();

      expect(health.queues.length).toBeGreaterThan(0);
    });
  });

  describe('Event Listeners', () => {
    test('should register event listener', (done) => {
      let eventReceived = false;

      const listener: QueueListener = async () => {
        eventReceived = true;
      };

      service.onEvent(listener);

      service.createQueue({
        name: 'event_test',
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

      setTimeout(() => {
        expect(eventReceived).toBe(true);
        done();
      }, 100);
    });

    test('should support chaining listeners', () => {
      const listener1: QueueListener = async () => {};
      const listener2: QueueListener = async () => {};

      const result = service.onEvent(listener1).onEvent(listener2);

      expect(result).toBe(service);
    });
  });

  describe('Service Lifecycle', () => {
    test('should stop service without errors', () => {
      expect(() => {
        service.stop();
      }).not.toThrow();
    });

    test('should continue accepting operations after creation', () => {
      const queueId = service.createQueue({
        name: 'lifecycle_test',
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

      expect(queueId).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete message workflow', async () => {
      // Create queue
      const queueId = service.createQueue({
        name: 'integration_test',
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

      // Send message
      const messageId = service.sendMessage(queueId, { alert: 'Security event' });
      expect(messageId).toBeDefined();

      // Receive message
      const message = service.receiveMessage(queueId);
      expect(message).toBeDefined();

      // Complete message
      const completed = service.completeMessage(queueId, message!.messageId);
      expect(completed).toBe(true);

      // Check stats
      const stats = service.getQueueStats(queueId);
      expect(stats?.completedMessages).toBeGreaterThan(0);
    });

    test('should manage multiple messages', () => {
      const queueId = service.createQueue({
        name: 'multi_msg_test',
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

      for (let i = 0; i < 5; i++) {
        service.sendMessage(queueId, { id: i });
      }

      for (let i = 0; i < 5; i++) {
        const msg = service.receiveMessage(queueId);
        expect(msg).toBeDefined();
      }

      const stats = service.getQueueStats(queueId);
      expect(stats?.processingMessages).toBeGreaterThan(0);
    });
  });
});
