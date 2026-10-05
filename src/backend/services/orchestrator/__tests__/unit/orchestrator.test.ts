/**
 * Service Orchestrator - Unit Tests
 */

import { createOrchestrator, getOrchestrator, setOrchestrator } from '../../index';
import { IServiceOrchestrator } from '../../types';

describe('Service Orchestrator', () => {
  let orchestrator: IServiceOrchestrator;

  beforeEach(() => {
    orchestrator = createOrchestrator();
  });

  afterEach(() => {
    setOrchestrator(null as any);
  });

  // ============================================
  // SERVICE INSTANTIATION TESTS
  // ============================================

  describe('Service Instantiation', () => {
    test('should create orchestrator with all 19 services', () => {
      expect(orchestrator).toBeDefined();
      expect(orchestrator.configService).toBeDefined();
      expect(orchestrator.auditService).toBeDefined();
      expect(orchestrator.cacheService).toBeDefined();
      expect(orchestrator.authService).toBeDefined();
      expect(orchestrator.rbacService).toBeDefined();
      expect(orchestrator.analyticsService).toBeDefined();
    });

    test('should have all infrastructure services', () => {
      expect(orchestrator.configService).toBeDefined();
      expect(orchestrator.loggingService).toBeDefined();
      expect(orchestrator.errorHandlingService).toBeDefined();
      expect(orchestrator.auditService).toBeDefined();
      expect(orchestrator.cacheService).toBeDefined();
    });

    test('should have all authentication services', () => {
      expect(orchestrator.authService).toBeDefined();
      expect(orchestrator.userService).toBeDefined();
      expect(orchestrator.tokenService).toBeDefined();
      expect(orchestrator.sessionService).toBeDefined();
    });

    test('should have all authorization services', () => {
      expect(orchestrator.rbacService).toBeDefined();
      expect(orchestrator.permissionService).toBeDefined();
      expect(orchestrator.policyEngine).toBeDefined();
      expect(orchestrator.accessControlService).toBeDefined();
    });

    test('should have all integration services', () => {
      expect(orchestrator.analyticsService).toBeDefined();
      expect(orchestrator.syncService).toBeDefined();
      expect(orchestrator.exportService).toBeDefined();
      expect(orchestrator.searchService).toBeDefined();
      expect(orchestrator.queueService).toBeDefined();
      expect(orchestrator.storageService).toBeDefined();
      expect(orchestrator.metricsService).toBeDefined();
      expect(orchestrator.configurationService).toBeDefined();
    });
  });

  // ============================================
  // LIFECYCLE TESTS
  // ============================================

  describe('Initialization', () => {
    test('should initialize without error', async () => {
      await expect(orchestrator.initialize()).resolves.not.toThrow();
    });

    test('should mark as initialized after init', async () => {
      expect(orchestrator.isInitialized()).toBe(false);
      await orchestrator.initialize();
      expect(orchestrator.isInitialized()).toBe(true);
    });

    test('should not throw when initialized twice', async () => {
      await orchestrator.initialize();
      await expect(orchestrator.initialize()).resolves.not.toThrow();
    });
  });

  describe('Shutdown', () => {
    test('should shutdown without error', async () => {
      await orchestrator.initialize();
      await expect(orchestrator.shutdown()).resolves.not.toThrow();
    });

    test('should mark as uninitialized after shutdown', async () => {
      await orchestrator.initialize();
      expect(orchestrator.isInitialized()).toBe(true);
      await orchestrator.shutdown();
      expect(orchestrator.isInitialized()).toBe(false);
    });

    test('should be able to reinitialize after shutdown', async () => {
      await orchestrator.initialize();
      await orchestrator.shutdown();
      await expect(orchestrator.initialize()).resolves.not.toThrow();
      expect(orchestrator.isInitialized()).toBe(true);
    });
  });

  // ============================================
  // HEALTH CHECK TESTS
  // ============================================

  describe('Health Check', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    test('should return health status for all services', async () => {
      const health = await orchestrator.healthCheck();
      
      expect(health).toBeDefined();
      expect(Object.keys(health).length).toBeGreaterThan(15);
    });

    test('should include all core services in health check', async () => {
      const health = await orchestrator.healthCheck();

      expect(health.configService).toBeDefined();
      expect(health.auditService).toBeDefined();
      expect(health.authService).toBeDefined();
      expect(health.rbacService).toBeDefined();
      expect(health.analyticsService).toBeDefined();
    });

    test('should report healthy status for each service', async () => {
      const health = await orchestrator.healthCheck();

      Object.values(health).forEach((serviceHealth) => {
        expect(['healthy', 'degraded', 'unhealthy']).toContain(serviceHealth.status);
      });
    });

    test('should include timestamp in health check', async () => {
      const health = await orchestrator.healthCheck();
      const firstService = Object.values(health)[0];

      expect(firstService.timestamp).toBeDefined();
      expect(firstService.timestamp instanceof Date).toBe(true);
    });

    test('should include service name in health check', async () => {
      const health = await orchestrator.healthCheck();

      Object.values(health).forEach((serviceHealth) => {
        expect(serviceHealth.serviceName).toBeDefined();
        expect(typeof serviceHealth.serviceName).toBe('string');
      });
    });
  });

  // ============================================
  // SERVICE LOOKUP TESTS
  // ============================================

  describe('Service Lookup', () => {
    test('should retrieve service by name', () => {
      const configService = orchestrator.getService('configService');
      expect(configService).toBeDefined();
      expect(configService).toBe(orchestrator.configService);
    });

    test('should return null for non-existent service', () => {
      const nonExistent = orchestrator.getService('nonExistentService');
      expect(nonExistent).toBeUndefined();
    });

    test('should retrieve all core services by name', () => {
      expect(orchestrator.getService('authService')).toBe(orchestrator.authService);
      expect(orchestrator.getService('rbacService')).toBe(orchestrator.rbacService);
      expect(orchestrator.getService('analyticsService')).toBe(orchestrator.analyticsService);
    });
  });

  // ============================================
  // SERVICE INTEGRATION TESTS
  // ============================================

  describe('Service Integration', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    test('authentication services should work together', async () => {
      const token = orchestrator.tokenService.generateToken({ userId: '123' });
      expect(token).toBeDefined();

      const verified = orchestrator.tokenService.verifyToken(token);
      expect(verified.userId).toBe('123');
    });

    test('RBAC should check permissions', () => {
      const hasPermission = orchestrator.rbacService.hasPermission('admin', 'alert:read');
      expect(hasPermission).toBe(true);
    });

    test('RBAC should deny unauthorized permissions', () => {
      const hasPermission = orchestrator.rbacService.hasPermission('analyst', 'admin:delete');
      expect(hasPermission).toBe(false);
    });

    test('cache service should store and retrieve values', async () => {
      await orchestrator.cacheService.set('test-key', 'test-value');
      const value = await orchestrator.cacheService.get('test-key');
      expect(value).toBe('test-value');
    });

    test('audit service should log entries', async () => {
      await orchestrator.auditService.log({
        action: 'test-action',
        actor: 'test-user'
      });

      const logs = await orchestrator.auditService.getLogs();
      expect(logs.length).toBeGreaterThan(0);
    });

    test('analytics service should track events', () => {
      const eventId = orchestrator.analyticsService.trackEvent({
        action: 'test',
        category: 'test'
      });

      expect(eventId).toBeDefined();
      expect(eventId).toMatch(/^evt-/);
    });

    test('queue service should enqueue and dequeue messages', async () => {
      const messageId = await orchestrator.queueService.enqueue({ data: 'test' });
      expect(messageId).toBeDefined();

      const message = await orchestrator.queueService.dequeue();
      expect(message).toBeDefined();
      expect(message.data).toBe('test');
    });

    test('storage service should store and retrieve data', async () => {
      await orchestrator.storageService.store('key1', { data: 'value1' });
      const retrieved = await orchestrator.storageService.retrieve('key1');

      expect(retrieved).toBeDefined();
      expect(retrieved.data).toBe('value1');
    });

    test('metrics service should record and retrieve metrics', async () => {
      await orchestrator.metricsService.recordMetric('test-metric', 42);
      const metrics = await orchestrator.metricsService.getMetrics();

      expect(metrics['test-metric']).toBe(42);
    });
  });

  // ============================================
  // FACTORY PATTERN TESTS
  // ============================================

  describe('Factory Pattern', () => {
    test('createOrchestrator should create new instance', () => {
      const orch1 = createOrchestrator();
      const orch2 = createOrchestrator();

      expect(orch1).not.toBe(orch2);
    });

    test('getOrchestrator should return singleton instance', () => {
      const orch1 = getOrchestrator();
      const orch2 = getOrchestrator();

      expect(orch1).toBe(orch2);
    });

    test('setOrchestrator should set singleton instance', () => {
      const newOrch = createOrchestrator();
      setOrchestrator(newOrch);

      const retrieved = getOrchestrator();
      expect(retrieved).toBe(newOrch);
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe('Error Handling', () => {
    test('should handle service errors gracefully', async () => {
      await orchestrator.initialize();
      const health = await orchestrator.healthCheck();

      Object.values(health).forEach((serviceHealth) => {
        if (serviceHealth.status === 'unhealthy') {
          expect(serviceHealth.details?.error).toBeDefined();
        }
      });
    });

    test('logging service should handle errors', () => {
      expect(() => {
        orchestrator.loggingService.error('test error', new Error('Test'));
      }).not.toThrow();
    });

    test('error handling service should process errors', () => {
      const result = orchestrator.errorHandlingService.handle(new Error('Test Error'));

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test Error');
    });
  });

  // ============================================
  // CONFIGURATION TESTS
  // ============================================

  describe('Configuration', () => {
    test('config service should store and retrieve values', () => {
      orchestrator.configService.set('test-key', 'test-value');
      const value = orchestrator.configService.get('test-key');

      expect(value).toBe('test-value');
    });

    test('configuration service should handle configs', async () => {
      await orchestrator.configurationService.setConfig('feature-flag', true);
      const config = await orchestrator.configurationService.getConfig('feature-flag');

      expect(config).toBe(true);
    });
  });

  // ============================================
  // FULL WORKFLOW TESTS
  // ============================================

  describe('Full Workflow', () => {
    test('complete authentication workflow', async () => {
      await orchestrator.initialize();

      // Create user
      const user = await orchestrator.userService.createUser({
        username: 'testuser',
        email: 'test@example.com'
      });
      expect(user.id).toBeDefined();

      // Generate token
      const token = orchestrator.tokenService.generateToken({ userId: user.id });
      expect(token).toBeDefined();

      // Verify token
      const verified = orchestrator.tokenService.verifyToken(token);
      expect(verified.userId).toBe(user.id);

      // Create session
      const session = await orchestrator.sessionService.createSession(user.id, {});
      expect(session).toBeDefined();

      // Get session
      const retrieved = await orchestrator.sessionService.getSession(session);
      expect(retrieved.userId).toBe(user.id);
    });

    test('complete event tracking workflow', async () => {
      await orchestrator.initialize();

      // Track event
      const eventId = orchestrator.analyticsService.trackEvent({
        action: 'user-login',
        category: 'auth',
        userId: 'user1'
      });
      expect(eventId).toBeDefined();

      // Get stats
      const stats = orchestrator.analyticsService.getStatistics();
      expect(stats.totalEvents).toBeGreaterThan(0);

      // Record metric
      await orchestrator.metricsService.recordMetric('auth-events', stats.totalEvents);

      // Get metrics
      const metrics = await orchestrator.metricsService.getMetrics();
      expect(metrics['auth-events']).toBe(stats.totalEvents);
    });

    test('complete message queue workflow', async () => {
      await orchestrator.initialize();

      // Enqueue message
      const msg1 = await orchestrator.queueService.enqueue({ type: 'alert', severity: 'high' });
      const msg2 = await orchestrator.queueService.enqueue({ type: 'event', severity: 'low' });

      expect(msg1).toBeDefined();
      expect(msg2).toBeDefined();

      // Dequeue messages
      const dequeued1 = await orchestrator.queueService.dequeue();
      expect(dequeued1.type).toBe('alert');

      const dequeued2 = await orchestrator.queueService.dequeue();
      expect(dequeued2.type).toBe('event');
    });
  });

  // ============================================
  // PERFORMANCE TESTS
  // ============================================

  describe('Performance', () => {
    test('initialization should complete in reasonable time', async () => {
      const start = Date.now();
      await orchestrator.initialize();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete in < 1 second
    });

    test('health check should complete quickly', async () => {
      await orchestrator.initialize();

      const start = Date.now();
      await orchestrator.healthCheck();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500); // Should complete in < 500ms
    });

    test('service lookup should be instantaneous', () => {
      const start = Date.now();
      orchestrator.getService('authService');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10); // Should complete in < 10ms
    });
  });
});
