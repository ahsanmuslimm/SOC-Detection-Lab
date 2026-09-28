/**
 * Logging Service - Unit Tests
 */

import {
  LoggingService,
  createLoggingService,
  ILoggerConfig,
  LogListener,
  ErrorListener,
} from '../../src';

describe('LoggingService', () => {
  let service: LoggingService;
  let config: ILoggerConfig;

  beforeEach(() => {
    config = {
      level: 'trace',
      format: 'json',
      destinations: ['console', 'file'],
      enableStackTrace: true,
      enableSourceLocation: false, // Disable to avoid file system access
      enablePerformanceMetrics: true,
      enableTracing: true,
      enableErrorGrouping: true,
      enableSampling: false,
      samplingRate: 1,
      maxContextSize: 65536,
      maxLogSize: 1000000,
      maxBufferSize: 100000,
      flushInterval: 5000,
      retentionDays: 30,
      enableCompression: false,
      enableEncryption: false,
    };

    service = createLoggingService(config);
  });

  afterEach(() => {
    service.stop();
  });

  describe('Basic Logging', () => {
    it('should log trace message', () => {
      const entryId = service.trace('Test trace message');

      expect(entryId).toBeDefined();
      expect(entryId).toMatch(/^log_/);

      const entry = service.getEntry(entryId);
      expect(entry?.level).toBe('trace');
      expect(entry?.message).toBe('Test trace message');
    });

    it('should log debug message', () => {
      const entryId = service.debug('system', 'Debug message');

      expect(entryId).toBeDefined();
      const entry = service.getEntry(entryId);
      expect(entry?.level).toBe('debug');
    });

    it('should log info message', () => {
      const entryId = service.info('api', 'API call made');

      expect(entryId).toBeDefined();
      const entry = service.getEntry(entryId);
      expect(entry?.level).toBe('info');
      expect(entry?.category).toBe('api');
    });

    it('should log warn message', () => {
      const entryId = service.warn('database', 'Slow query detected');

      expect(entryId).toBeDefined();
      const entry = service.getEntry(entryId);
      expect(entry?.level).toBe('warn');
    });

    it('should log error with exception', () => {
      const error = new Error('Test error');
      const entryId = service.error('system', 'An error occurred', error);

      expect(entryId).toBeDefined();
      const entry = service.getEntry(entryId);
      expect(entry?.error).toBeDefined();
      expect(entry?.error?.message).toBe('Test error');
    });

    it('should log fatal message', () => {
      const entryId = service.fatal('system', 'Fatal error');

      expect(entryId).toBeDefined();
      const entry = service.getEntry(entryId);
      expect(entry?.level).toBe('fatal');
    });
  });

  describe('Context Management', () => {
    it('should set and get context', () => {
      service.setContext({
        userId: 'analyst-01',
        sessionId: 'session-123',
        correlationId: 'corr-456',
      });

      const context = service.getContext();
      expect(context.userId).toBe('analyst-01');
      expect(context.sessionId).toBe('session-123');
      expect(context.correlationId).toBe('corr-456');
    });

    it('should include context in log entries', () => {
      service.setContext({ userId: 'analyst-01', correlationId: 'corr-123' });

      const entryId = service.info('api', 'Test message');
      const entry = service.getEntry(entryId);

      expect(entry?.userId).toBe('analyst-01');
      expect(entry?.correlationId).toBe('corr-123');
    });
  });

  describe('Distributed Tracing', () => {
    it('should start and end trace', () => {
      const traceId = service.startTrace('test-operation');
      expect(traceId).toBeDefined();

      service.endTrace(traceId, 'success');

      const trace = service.getTrace(traceId);
      expect(trace).not.toBeNull();
      expect(trace?.status).toBe('success');
    });

    it('should create spans within trace', () => {
      const traceId = service.startTrace('parent-operation');

      const spanId = service.startSpan('child-operation');
      service.info('api', 'Operation in progress');
      service.endSpan(spanId, 'success');

      service.endTrace(traceId, 'success');

      const trace = service.getTrace(traceId);
      expect(trace?.spans.length).toBeGreaterThan(0);
    });

    it('should link logs to span', () => {
      const traceId = service.startTrace('test-operation');
      const spanId = service.startSpan('test-span');

      const logId = service.info('api', 'Test log message');
      service.endSpan(spanId, 'success');
      service.endTrace(traceId, 'success');

      const trace = service.getTrace(traceId);
      expect(trace?.spans[0]?.logs.length).toBeGreaterThan(0);
    });
  });

  describe('Entry Retrieval', () => {
    it('should get entry by ID', () => {
      const entryId = service.info('system', 'Test message');
      const entry = service.getEntry(entryId);

      expect(entry).not.toBeNull();
      expect(entry?.entryId).toBe(entryId);
    });

    it('should return null for non-existent entry', () => {
      const entry = service.getEntry('non-existent');
      expect(entry).toBeNull();
    });
  });

  describe('Entry Querying', () => {
    beforeEach(() => {
      for (let i = 1; i <= 10; i++) {
        const level = i % 3 === 0 ? 'error' : i % 3 === 1 ? 'warn' : 'info';
        const category = i % 2 === 0 ? 'api' : 'database';

        service.log(level as any, category as any, `Message ${i}`);
      }
    });

    it('should query by level', () => {
      const results = service.queryEntries({ levelFilter: ['error'] });

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((e) => e.level === 'error')).toBe(true);
    });

    it('should query by category', () => {
      const results = service.queryEntries({ categoryFilter: ['api'] });

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((e) => e.category === 'api')).toBe(true);
    });

    it('should search text', () => {
      const results = service.queryEntries({ searchText: 'Message 1' });

      expect(results.length).toBeGreaterThan(0);
    });

    it('should respect pagination', () => {
      const results = service.queryEntries({ limit: 2 });

      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Error Grouping', () => {
    it('should group identical errors', () => {
      const error = new Error('Test error message');

      service.error('system', 'Error 1', error);
      service.error('system', 'Error 2', error);

      const groups = service.getErrorGroups();
      expect(groups.length).toBeGreaterThan(0);
      expect(groups[0]?.occurrenceCount).toBeGreaterThanOrEqual(2);
    });

    it('should track affected users', () => {
      service.setContext({ userId: 'user-1' });
      const error = new Error('Test error');

      service.error('system', 'Error 1', error);

      service.setContext({ userId: 'user-2' });
      service.error('system', 'Error 2', error);

      const groups = service.getErrorGroups();
      expect(groups[0]?.affectedUsers).toBe(2);
    });
  });

  describe('Slow Query Logging', () => {
    it('should log slow query', () => {
      const logId = service.logSlowQuery('SELECT * FROM alerts', 5000, 1000, 'SELECT * FROM alerts');

      expect(logId).toBeDefined();
      expect(logId).toMatch(/^slowq_/);
    });

    it('should increment slow query count', () => {
      service.logSlowQuery('SELECT * FROM alerts', 5000, 1000, 'SELECT * FROM alerts');

      const stats = service.getStats();
      expect(stats.slowQueryCount).toBeGreaterThan(0);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      for (let i = 1; i <= 10; i++) {
        const level = i % 5 === 0 ? 'error' : 'info';
        service.log(level as any, 'api', `Message ${i}`);
      }
    });

    it('should calculate statistics', () => {
      const stats = service.getStats();

      expect(stats.totalLogs).toBe(10);
      expect(stats.errorRate).toBeGreaterThan(0);
    });

    it('should track logs by level', () => {
      const stats = service.getStats();

      expect(stats.logsByLevel.info).toBeGreaterThan(0);
      expect(stats.logsByLevel.error).toBeGreaterThan(0);
    });

    it('should track logs by category', () => {
      const stats = service.getStats();

      expect(stats.logsByCategory.api).toBeGreaterThan(0);
    });
  });

  describe('Retention Policies', () => {
    it('should register retention policy', () => {
      const result = service.registerRetentionPolicy({
        name: 'thirty-day-retention',
        retentionDays: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(result).toBe(true);
    });

    it('should prevent duplicate policies', () => {
      const policy = {
        name: 'test-policy',
        retentionDays: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const first = service.registerRetentionPolicy(policy);
      const second = service.registerRetentionPolicy(policy);

      expect(first).toBe(true);
      expect(second).toBe(false);
    });
  });

  describe('Sampling Policies', () => {
    it('should register sampling policy', () => {
      const result = service.registerSamplingPolicy({
        name: 'debug-sampling',
        sampleRate: 0.5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(result).toBe(true);
    });
  });

  describe('Export', () => {
    beforeEach(() => {
      for (let i = 1; i <= 5; i++) {
        service.info('api', `Message ${i}`);
      }
    });

    it('should export to JSON', async () => {
      const result = await service.exportLogs({
        format: 'json',
        query: {},
      });

      expect(result.exportId).toBeDefined();
      expect(result.format).toBe('json');
      expect(result.totalRecords).toBe(5);
    });

    it('should export to CSV', async () => {
      const result = await service.exportLogs({
        format: 'csv',
        query: {},
      });

      expect(result.format).toBe('csv');
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should calculate checksum', async () => {
      const result = await service.exportLogs({
        format: 'json',
        query: {},
      });

      expect(result.checksum).toBeDefined();
      expect(result.checksum.length).toBeGreaterThan(0);
    });
  });

  describe('Health Check', () => {
    it('should perform health check', async () => {
      const health = await service.performHealthCheck();

      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
      expect(health.checks).toBeDefined();
      expect(health.checks.length).toBeGreaterThan(0);
    });
  });

  describe('Application Health', () => {
    it('should get application health metrics', () => {
      const metrics = service.getApplicationHealth();

      expect(metrics.timestamp).toBeDefined();
      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.cpuUsage).toBeDefined();
      expect(metrics.uptime).toBeGreaterThan(0);
    });
  });

  describe('Event Listeners', () => {
    it('should call log listener', (done) => {
      const listener: LogListener = async (entry) => {
        expect(entry.entryId).toBeDefined();
        done();
      };

      service.onLog(listener);
      service.info('api', 'Test message');
    });

    it('should call error listener on error', (done) => {
      const listener: ErrorListener = async (group) => {
        expect(group.groupId).toBeDefined();
        done();
      };

      service.onError(listener);

      const error = new Error('Test error');
      service.error('system', 'Error occurred', error);
    });
  });
});
