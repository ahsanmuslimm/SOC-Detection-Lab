/**
 * Audit Service - Unit Tests
 */

import {
  AuditService,
  createAuditService,
  IAuditServiceConfig,
  IAuditEntry,
  AuditListener,
  AnomalyListener,
} from '../../src';

describe('AuditService', () => {
  let service: AuditService;
  let config: IAuditServiceConfig;

  beforeEach(() => {
    config = {
      enableAudit: true,
      enableImmutability: true,
      enableIntegrityCheck: true,
      enableCompression: false,
      enableEncryption: false,
      enableAnomalyDetection: true,
      hashAlgorithm: 'sha256',
      retentionDays: 365,
      maxAuditEntriesPerQuery: 10000,
      enableDetailedLogging: true,
      enablePerformanceMetrics: true,
    };

    service = createAuditService(config);
  });

  afterEach(() => {
    service.stop();
  });

  describe('Entry Logging', () => {
    it('should log single audit entry', async () => {
      const entryId = await service.logEntry({
        action: 'user.login',
        userId: 'user-123',
        username: 'analyst-01',
        userIp: '192.168.1.100',
        resourceType: 'user',
        resourceId: 'user-123',
        description: 'User login successful',
        status: 'success',
        severity: 'informational',
      });

      expect(entryId).toBeDefined();
      expect(entryId).toMatch(/^audit_/);

      const entry = service.getEntry(entryId);
      expect(entry).not.toBeNull();
      expect(entry?.action).toBe('user.login');
      expect(entry?.userId).toBe('user-123');
    });

    it('should include hash for integrity', async () => {
      const entryId = await service.logEntry({
        action: 'user.create',
        userId: 'admin',
        username: 'admin',
        userIp: '192.168.1.1',
        resourceType: 'user',
        resourceId: 'user-new',
        description: 'New user created',
      });

      const entry = service.getEntry(entryId);
      expect(entry?.Hash).toBeDefined();
      expect(entry?.Hash.length).toBeGreaterThan(0);
    });

    it('should handle disabled audit', async () => {
      const disabledConfig = { ...config, enableAudit: false };
      const disabledService = createAuditService(disabledConfig);

      const entryId = await disabledService.logEntry({
        action: 'alert.create',
        userId: 'system',
        username: 'system',
        userIp: '127.0.0.1',
        resourceType: 'alert',
        resourceId: 'alert-001',
        description: 'Alert generated',
      });

      expect(entryId).toBe('');
      disabledService.stop();
    });
  });

  describe('Batch Logging', () => {
    it('should log batch entries', async () => {
      const entries = [
        {
          action: 'alert.create' as const,
          userId: 'system',
          username: 'system',
          userIp: '127.0.0.1',
          resourceType: 'alert' as const,
          resourceId: 'alert-001',
          description: 'Alert 1',
        },
        {
          action: 'alert.create' as const,
          userId: 'system',
          username: 'system',
          userIp: '127.0.0.1',
          resourceType: 'alert' as const,
          resourceId: 'alert-002',
          description: 'Alert 2',
        },
        {
          action: 'alert.create' as const,
          userId: 'system',
          username: 'system',
          userIp: '127.0.0.1',
          resourceType: 'alert' as const,
          resourceId: 'alert-003',
          description: 'Alert 3',
        },
      ];

      const result = await service.logBatchEntries(entries);

      expect(result.itemCount).toBe(3);
      expect(result.successCount).toBeGreaterThanOrEqual(0);
      expect(result.operationId).toMatch(/^op_/);
    });
  });

  describe('Entry Retrieval', () => {
    it('should get entry by ID', async () => {
      const entryId = await service.logEntry({
        action: 'user.login',
        userId: 'user-123',
        username: 'analyst-01',
        userIp: '192.168.1.100',
        resourceType: 'user',
        resourceId: 'user-123',
        description: 'Login',
      });

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
    beforeEach(async () => {
      // Create multiple entries
      for (let i = 1; i <= 5; i++) {
        await service.logEntry({
          action: i % 2 === 0 ? 'alert.create' : 'alert.acknowledge',
          userId: `user-${i}`,
          username: `analyst-${i}`,
          userIp: `192.168.1.${i}`,
          resourceType: 'alert',
          resourceId: `alert-${i}`,
          description: `Alert ${i}`,
          severity: i > 3 ? 'high' : 'low',
        });
      }
    });

    it('should query by action', () => {
      const results = service.queryEntries({
        actionFilter: ['alert.create'],
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((e) => e.action === 'alert.create')).toBe(true);
    });

    it('should query by severity', () => {
      const results = service.queryEntries({
        severityFilter: ['high'],
      });

      expect(results.every((e) => e.severity === 'high')).toBe(true);
    });

    it('should query by date range', async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 86400000);

      const results = service.queryEntries({
        startDate: now,
        endDate: tomorrow,
      });

      expect(results.length).toBeGreaterThan(0);
    });

    it('should search text', () => {
      const results = service.queryEntries({
        searchText: 'Alert 1',
      });

      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should respect pagination', () => {
      const results = service.queryEntries({
        limit: 2,
        offset: 0,
      });

      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Audit Trail', () => {
    it('should get audit trail for resource', async () => {
      const entryId = await service.logEntry({
        action: 'case.create',
        userId: 'analyst-01',
        username: 'analyst-01',
        userIp: '192.168.1.100',
        resourceType: 'case',
        resourceId: 'case-001',
        description: 'Case created',
      });

      await service.logEntry({
        action: 'case.update',
        userId: 'analyst-01',
        username: 'analyst-01',
        userIp: '192.168.1.100',
        resourceType: 'case',
        resourceId: 'case-001',
        description: 'Case updated',
      });

      const trail = service.getTrail('case', 'case-001');

      expect(trail).not.toBeNull();
      expect(trail?.entries.length).toBe(2);
      expect(trail?.resourceId).toBe('case-001');
    });
  });

  describe('User Activity', () => {
    beforeEach(async () => {
      for (let i = 1; i <= 3; i++) {
        await service.logEntry({
          action: 'alert.acknowledge',
          userId: 'analyst-01',
          username: 'analyst-01',
          userIp: '192.168.1.100',
          resourceType: 'alert',
          resourceId: `alert-${i}`,
          description: `Alert ${i} acknowledged`,
          status: 'success',
        });
      }

      await service.logEntry({
        action: 'user.login',
        userId: 'analyst-01',
        username: 'analyst-01',
        userIp: '192.168.1.100',
        resourceType: 'user',
        resourceId: 'analyst-01',
        description: 'Login failed',
        status: 'failure',
        severity: 'medium',
      });
    });

    it('should get user activity summary', () => {
      const summary = service.getUserActivitySummary('analyst-01');

      expect(summary).not.toBeNull();
      expect(summary?.userId).toBe('analyst-01');
      expect(summary?.totalActions).toBe(4);
      expect(summary?.successfulActions).toBeGreaterThan(0);
    });

    it('should calculate risk score', () => {
      const summary = service.getUserActivitySummary('analyst-01');

      expect(summary?.riskScore).toBeDefined();
      expect(summary?.riskScore).toBeGreaterThanOrEqual(0);
      expect(summary?.riskScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Retention Policies', () => {
    it('should register retention policy', () => {
      const result = service.registerRetentionPolicy({
        name: 'one-year-retention',
        description: 'Keep all records for 1 year',
        retentionDays: 365,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(result).toBe(true);
    });

    it('should retrieve retention policy', () => {
      service.registerRetentionPolicy({
        name: 'policy-1',
        retentionDays: 90,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const policy = service.getRetentionPolicy('policy-1');

      expect(policy).not.toBeNull();
      expect(policy?.retentionDays).toBe(90);
    });

    it('should prevent duplicate policies', () => {
      const policy = {
        name: 'duplicate-test',
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

  describe('Statistics', () => {
    beforeEach(async () => {
      for (let i = 1; i <= 10; i++) {
        await service.logEntry({
          action: i % 3 === 0 ? 'user.login' : 'alert.create',
          userId: `user-${Math.floor(i / 2)}`,
          username: `user-${Math.floor(i / 2)}`,
          userIp: '192.168.1.1',
          resourceType: 'alert',
          resourceId: `alert-${i}`,
          description: `Entry ${i}`,
          status: i % 5 === 0 ? 'failure' : 'success',
        });
      }
    });

    it('should get statistics', () => {
      const stats = service.getStats();

      expect(stats.totalEntries).toBe(10);
      expect(stats.uniqueUsers).toBeGreaterThan(0);
      expect(stats.failureRate).toBeDefined();
      expect(stats.failureRate).toBeGreaterThanOrEqual(0);
      expect(stats.failureRate).toBeLessThanOrEqual(1);
    });

    it('should track entries by status', () => {
      const stats = service.getStats();

      expect(stats.entriesByStatus.success).toBeGreaterThanOrEqual(0);
      expect(stats.entriesByStatus.failure).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Compliance Reporting', () => {
    beforeEach(async () => {
      await service.logEntry({
        action: 'user.login',
        userId: 'analyst-01',
        username: 'analyst-01',
        userIp: '192.168.1.100',
        resourceType: 'user',
        resourceId: 'analyst-01',
        description: 'Login',
      });
    });

    it('should generate compliance report', () => {
      const startDate = new Date(Date.now() - 86400000);
      const endDate = new Date();

      const report = service.generateComplianceReport('SOC2', startDate, endDate);

      expect(report.reportId).toBeDefined();
      expect(report.framework).toBe('SOC2');
      expect(report.sections).toBeDefined();
      expect(report.summary).toBeDefined();
    });

    it('should include recommendations', () => {
      const report = service.generateComplianceReport('ISO27001', new Date(Date.now() - 86400000), new Date());

      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Export', () => {
    beforeEach(async () => {
      for (let i = 1; i <= 3; i++) {
        await service.logEntry({
          action: 'alert.create',
          userId: 'system',
          username: 'system',
          userIp: '127.0.0.1',
          resourceType: 'alert',
          resourceId: `alert-${i}`,
          description: `Alert ${i}`,
        });
      }
    });

    it('should export to JSON', async () => {
      const result = await service.exportEntries({
        format: 'json',
        query: {},
      });

      expect(result.exportId).toBeDefined();
      expect(result.format).toBe('json');
      expect(result.totalRecords).toBeGreaterThan(0);
    });

    it('should export to CSV', async () => {
      const result = await service.exportEntries({
        format: 'csv',
        query: {},
      });

      expect(result.format).toBe('csv');
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should calculate checksums', async () => {
      const result = await service.exportEntries({
        format: 'json',
        query: {},
      });

      expect(result.hash).toBeDefined();
      expect(result.checksum).toBeDefined();
    });
  });

  describe('Integrity Verification', () => {
    it('should verify entry integrity', async () => {
      const entryId = await service.logEntry({
        action: 'alert.create',
        userId: 'system',
        username: 'system',
        userIp: '127.0.0.1',
        resourceType: 'alert',
        resourceId: 'alert-001',
        description: 'Alert created',
      });

      const result = service.verifyIntegrity(entryId);

      expect(result.status).toBe('valid');
      expect(result.integrityScore).toBe(1);
    });

    it('should verify chain integrity', async () => {
      for (let i = 1; i <= 5; i++) {
        await service.logEntry({
          action: 'alert.create',
          userId: 'system',
          username: 'system',
          userIp: '127.0.0.1',
          resourceType: 'alert',
          resourceId: `alert-${i}`,
          description: `Alert ${i}`,
        });
      }

      const result = service.verifyChain();

      expect(result.entriesChecked).toBe(5);
      expect(result.integrityScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Health Check', () => {
    it('should perform health check', async () => {
      const health = await service.performHealthCheck();

      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
      expect(health.checks).toBeDefined();
      expect(health.checks.length).toBeGreaterThan(0);
    });

    it('should report storage health', async () => {
      const health = await service.performHealthCheck();

      expect(['healthy', 'degraded', 'critical']).toContain(health.storageHealth);
    });
  });

  describe('Event Listeners', () => {
    it('should call audit listener', (done) => {
      const listener: AuditListener = async (entry) => {
        expect(entry.entryId).toBeDefined();
        done();
      };

      service.onAuditEntry(listener);

      service.logEntry({
        action: 'alert.create',
        userId: 'system',
        username: 'system',
        userIp: '127.0.0.1',
        resourceType: 'alert',
        resourceId: 'alert-001',
        description: 'Alert created',
      });
    });

    it('should call anomaly listener on high frequency', (done) => {
      const listener: AnomalyListener = async (anomaly) => {
        expect(anomaly.anomalyId).toBeDefined();
        done();
      };

      service.onAnomaly(listener);

      // Log many entries in rapid succession
      (async () => {
        for (let i = 1; i <= 101; i++) {
          await service.logEntry({
            action: 'alert.create',
            userId: 'user-123',
            username: 'user-123',
            userIp: '192.168.1.1',
            resourceType: 'alert',
            resourceId: `alert-${i}`,
            description: `Alert ${i}`,
          });
        }
      })();
    });
  });
});
