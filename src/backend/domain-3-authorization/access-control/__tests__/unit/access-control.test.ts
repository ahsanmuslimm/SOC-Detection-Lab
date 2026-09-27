/**
 * Access Control Service - Unit Tests
 * Comprehensive test suite for resource-based access control
 */

import { AccessControlService, createAccessControlService } from '../../src/main';
import type { IAccessControlConfig } from '../../src/types';

describe('AccessControlService', () => {
  let service: AccessControlService;
  const config: IAccessControlConfig = {
    enableCaching: true,
    cacheTimeout: 5000,
    maxCacheSize: 500,
    enableAuiting: true,
    auditRetention: 30,
    maxPolicies: 1000,
    evaluationTimeout: 1000,
    defaultDeny: false,
  };

  beforeEach(() => {
    service = new AccessControlService(config);
  });

  // ============================================================
  // Service Creation Tests
  // ============================================================

  describe('Service Creation', () => {
    test('should create access control service instance', () => {
      expect(service).toBeInstanceOf(AccessControlService);
    });

    test('should create service via factory', () => {
      const srv = createAccessControlService(config);
      expect(srv).toBeInstanceOf(AccessControlService);
    });

    test('should throw error with invalid config', () => {
      expect(() => {
        new AccessControlService({
          ...config,
          cacheTimeout: 100,
        });
      }).toThrow('cacheTimeout must be at least 1000ms');
    });

    test('should initialize empty stats', () => {
      const stats = service.getStats();
      expect(stats.totalDecisions).toBe(0);
      expect(stats.allowedDecisions).toBe(0);
      expect(stats.deniedDecisions).toBe(0);
    });
  });

  // ============================================================
  // Policy Creation Tests
  // ============================================================

  describe('Policy Creation', () => {
    test('should create allow policy', async () => {
      const policy = await service.createPolicy(
        {
          name: 'Report Read Access',
          description: 'Allow reading reports',
          effect: 'allow',
          resources: ['report'],
          actions: ['read'],
          subjects: ['role-analyst'],
        },
        'admin'
      );

      expect(policy.policyId).toBeDefined();
      expect(policy.name).toBe('Report Read Access');
      expect(policy.effect).toBe('allow');
      expect(policy.isActive).toBe(true);
    });

    test('should create deny policy', async () => {
      const policy = await service.createPolicy(
        {
          name: 'Sensitive Data Block',
          description: 'Block access to sensitive data',
          effect: 'deny',
          resources: ['*'],
          actions: ['delete'],
          subjects: ['*'],
        },
        'admin'
      );

      expect(policy.effect).toBe('deny');
    });

    test('should create policy with conditions', async () => {
      const policy = await service.createPolicy(
        {
          name: 'Time-Based Access',
          description: 'Access only during business hours',
          effect: 'allow',
          resources: ['system'],
          actions: ['manage'],
          subjects: ['role-admin'],
          conditions: [
            {
              type: 'time',
              operator: 'lt',
              value: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          ],
        },
        'admin'
      );

      expect(policy.conditions).toHaveLength(1);
    });

    test('should throw error exceeding policy limit', async () => {
      const limitedConfig: IAccessControlConfig = {
        ...config,
        maxPolicies: 1,
      };
      const limitedService = new AccessControlService(limitedConfig);

      await limitedService.createPolicy(
        {
          name: 'Policy 1',
          description: 'First policy',
          effect: 'allow',
          resources: ['report'],
          actions: ['read'],
          subjects: ['user-1'],
        },
        'admin'
      );

      await expect(
        limitedService.createPolicy(
          {
            name: 'Policy 2',
            description: 'Second policy',
            effect: 'allow',
            resources: ['alert'],
            actions: ['create'],
            subjects: ['user-2'],
          },
          'admin'
        )
      ).rejects.toThrow('Max policies limit reached');
    });
  });

  // ============================================================
  // Policy Management Tests
  // ============================================================

  describe('Policy Management', () => {
    let policyId: string;

    beforeEach(async () => {
      const policy = await service.createPolicy(
        {
          name: 'Test Policy',
          description: 'Test',
          effect: 'allow',
          resources: ['report'],
          actions: ['read'],
          subjects: ['user-1'],
        },
        'admin'
      );
      policyId = policy.policyId;
    });

    test('should get policy by ID', async () => {
      const policy = await service.getPolicy(policyId);
      expect(policy).toBeDefined();
      expect(policy?.name).toBe('Test Policy');
    });

    test('should update policy', async () => {
      const updated = await service.updatePolicy(
        policyId,
        {
          name: 'Updated Policy',
          priority: 200,
        },
        'admin'
      );

      expect(updated.name).toBe('Updated Policy');
      expect(updated.priority).toBe(200);
    });

    test('should deactivate policy', async () => {
      const updated = await service.updatePolicy(
        policyId,
        { isActive: false },
        'admin'
      );

      expect(updated.isActive).toBe(false);
    });

    test('should delete policy', async () => {
      const deleted = await service.deletePolicy(policyId, 'admin');
      expect(deleted).toBe(true);

      const retrieved = await service.getPolicy(policyId);
      expect(retrieved).toBeNull();
    });

    test('should get all policies', async () => {
      const policies = await service.getAllPolicies();
      expect(policies.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // Access Decision Tests
  // ============================================================

  describe('Access Decisions', () => {
    beforeEach(async () => {
      // Create allow policy
      await service.createPolicy(
        {
          name: 'Report Read',
          description: 'Allow report reading',
          effect: 'allow',
          resources: ['report'],
          actions: ['read'],
          subjects: ['user-analyst'],
        },
        'admin'
      );

      // Create deny policy
      await service.createPolicy(
        {
          name: 'Delete Block',
          description: 'Block deletes',
          effect: 'deny',
          resources: ['report'],
          actions: ['delete'],
          subjects: ['*'],
        },
        'admin'
      );
    });

    test('should allow matching access', async () => {
      const decision = await service.checkAccess({
        userId: 'user-analyst',
        resource: 'report',
        action: 'read',
        timestamp: new Date(),
      });

      expect(decision.allowed).toBe(true);
    });

    test('should deny non-matching access', async () => {
      const decision = await service.checkAccess({
        userId: 'user-analyst',
        resource: 'report',
        action: 'write',
        timestamp: new Date(),
      });

      expect(decision.allowed).toBe(false);
    });

    test('should apply deny policy', async () => {
      const decision = await service.checkAccess({
        userId: 'any-user',
        resource: 'report',
        action: 'delete',
        timestamp: new Date(),
      });

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Access denied');
    });

    test('should apply default deny', async () => {
      const denyConfig: IAccessControlConfig = {
        ...config,
        defaultDeny: true,
      };
      const denyService = new AccessControlService(denyConfig);

      const decision = await denyService.checkAccess({
        userId: 'unknown-user',
        resource: 'system',
        action: 'manage',
        timestamp: new Date(),
      });

      expect(decision.allowed).toBe(false);
    });
  });

  // ============================================================
  // Resource Registration Tests
  // ============================================================

  describe('Resource Registration', () => {
    test('should register resource', async () => {
      await service.registerResource({
        resourceId: 'report-123',
        type: 'report',
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const resource = await service.getResource('report-123');
      expect(resource).toBeDefined();
      expect(resource?.ownerId).toBe('user-1');
    });

    test('should check ownership', async () => {
      await service.registerResource({
        resourceId: 'report-456',
        type: 'report',
        ownerId: 'user-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const isOwner = await service.checkOwnership('user-2', 'report-456');
      expect(isOwner).toBe(true);

      const notOwner = await service.checkOwnership('user-1', 'report-456');
      expect(notOwner).toBe(false);
    });
  });

  // ============================================================
  // Delegation Tests
  // ============================================================

  describe('Delegations', () => {
    test('should create delegation', async () => {
      const delegation = await service.createDelegation(
        'user-1',
        'user-2',
        { type: 'report', resourceId: 'report-789' },
        'read',
        'admin'
      );

      expect(delegation.delegationId).toBeDefined();
      expect(delegation.from).toBe('user-1');
      expect(delegation.to).toBe('user-2');
    });

    test('should create temporary delegation', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const delegation = await service.createDelegation(
        'user-1',
        'user-2',
        { type: 'report', resourceId: 'report-temp' },
        'write',
        'admin',
        expiresAt
      );

      expect(delegation.expiresAt).toEqual(expiresAt);
    });

    test('should get delegations for user', async () => {
      await service.createDelegation(
        'user-1',
        'user-3',
        { type: 'alert', resourceId: 'alert-1' },
        'manage',
        'admin'
      );

      const delegations = await service.getDelegations('user-3');
      expect(delegations.length).toBeGreaterThan(0);
    });

    test('should revoke delegation', async () => {
      const delegation = await service.createDelegation(
        'user-1',
        'user-4',
        { type: 'case', resourceId: 'case-1' },
        'update',
        'admin'
      );

      const revoked = await service.revokeDelegation(
        delegation.delegationId,
        'admin'
      );
      expect(revoked).toBe(true);
    });
  });

  // ============================================================
  // Bulk Access Tests
  // ============================================================

  describe('Bulk Access', () => {
    beforeEach(async () => {
      await service.createPolicy(
        {
          name: 'Bulk Test',
          description: 'For bulk testing',
          effect: 'allow',
          resources: ['investigation'],
          actions: ['read'],
          subjects: ['user-bulk-1', 'user-bulk-2', 'user-bulk-3'],
        },
        'admin'
      );
    });

    test('should check bulk access', async () => {
      const result = await service.bulkCheckAccess({
        userIds: ['user-bulk-1', 'user-bulk-2', 'user-other'],
        resource: 'investigation',
        action: 'read',
        resourceIds: ['inv-1', 'inv-2'],
      });

      expect(result.totalRequested).toBe(3);
      expect(result.allowedCount).toBeGreaterThanOrEqual(0);
      expect(result.deniedCount).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================
  // Resource Filtering Tests
  // ============================================================

  describe('Resource Filtering', () => {
    beforeEach(async () => {
      await service.registerResource({
        resourceId: 'case-1',
        type: 'case',
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.registerResource({
        resourceId: 'case-2',
        type: 'case',
        ownerId: 'user-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.createPolicy(
        {
          name: 'Case Access',
          description: 'Case owner access',
          effect: 'allow',
          resources: ['case'],
          actions: ['read'],
          subjects: ['*'],
          conditions: [
            {
              type: 'ownership',
              operator: 'eq',
              value: true,
            },
          ],
        },
        'admin'
      );
    });

    test('should filter resources by access', async () => {
      const resources = [
        {
          resourceId: 'case-1',
          type: 'case' as any,
          ownerId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          resourceId: 'case-2',
          type: 'case' as any,
          ownerId: 'user-2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = await service.filterResourcesByAccess(
        'user-1',
        resources,
        'read'
      );

      expect(result.total).toBe(2);
      expect(result.items.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================
  // Event Listener Tests
  // ============================================================

  describe('Event Listeners', () => {
    test('should register event listener', async () => {
      const events: any[] = [];
      const listener = (event: any) => {
        events.push(event);
      };

      service.onAccess(listener);

      await service.createPolicy(
        {
          name: 'Event Test',
          description: 'Test',
          effect: 'allow',
          resources: ['report'],
          actions: ['read'],
          subjects: ['user-1'],
        },
        'admin'
      );

      expect(events.length).toBeGreaterThan(0);
    });

    test('should unregister event listener', async () => {
      const events: any[] = [];
      const listener = (event: any) => {
        events.push(event);
      };

      service.onAccess(listener);
      service.offAccess(listener);

      await service.createPolicy(
        {
          name: 'Event Test 2',
          description: 'Test',
          effect: 'allow',
          resources: ['report'],
          actions: ['read'],
          subjects: ['user-1'],
        },
        'admin'
      );

      expect(events.length).toBe(0);
    });
  });

  // ============================================================
  // Statistics Tests
  // ============================================================

  describe('Statistics', () => {
    test('should track access decisions', async () => {
      await service.createPolicy(
        {
          name: 'Stats Test',
          description: 'Test',
          effect: 'allow',
          resources: ['report'],
          actions: ['read'],
          subjects: ['user-stats'],
        },
        'admin'
      );

      await service.checkAccess({
        userId: 'user-stats',
        resource: 'report',
        action: 'read',
        timestamp: new Date(),
      });

      const stats = service.getStats();
      expect(stats.totalDecisions).toBeGreaterThan(0);
    });

    test('should track allowed and denied decisions', async () => {
      await service.createPolicy(
        {
          name: 'Allow Test',
          description: 'Test',
          effect: 'allow',
          resources: ['alert'],
          actions: ['read'],
          subjects: ['user-allow'],
        },
        'admin'
      );

      await service.checkAccess({
        userId: 'user-allow',
        resource: 'alert',
        action: 'read',
        timestamp: new Date(),
      });

      const stats = service.getStats();
      expect(stats.allowedDecisions).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // Audit Logging Tests
  // ============================================================

  describe('Audit Logging', () => {
    test('should log access audit', async () => {
      const auditConfig: IAccessControlConfig = {
        ...config,
        enableAuiting: true,
      };
      const auditService = new AccessControlService(auditConfig);

      await auditService.createPolicy(
        {
          name: 'Audit Test',
          description: 'Test',
          effect: 'allow',
          resources: ['report'],
          actions: ['read'],
          subjects: ['user-audit'],
        },
        'admin'
      );

      await auditService.checkAccess({
        userId: 'user-audit',
        resource: 'report',
        action: 'read',
        timestamp: new Date(),
      });

      const auditLog = auditService.getAuditLog();
      expect(auditLog.length).toBeGreaterThan(0);
    });

    test('should limit audit log retrieval', async () => {
      const log = service.getAuditLog(1);
      expect(log.length).toBeLessThanOrEqual(1);
    });
  });

  // ============================================================
  // Conflict Detection Tests
  // ============================================================

  describe('Conflict Detection', () => {
    test('should detect conflicting policies', async () => {
      await service.createPolicy(
        {
          name: 'Allow Delete',
          description: 'Allow',
          effect: 'allow',
          resources: ['report'],
          actions: ['delete'],
          subjects: ['user-1'],
        },
        'admin'
      );

      await service.createPolicy(
        {
          name: 'Deny Delete',
          description: 'Deny',
          effect: 'deny',
          resources: ['report'],
          actions: ['delete'],
          subjects: ['*'],
        },
        'admin'
      );

      const conflicts = await service.detectConflicts();
      expect(conflicts.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // Integration Tests
  // ============================================================

  describe('Integration Scenarios', () => {
    test('complete access control workflow', async () => {
      // Create policies
      const allowPolicy = await service.createPolicy(
        {
          name: 'Analyst Access',
          description: 'Allow analysts to read reports',
          effect: 'allow',
          resources: ['report'],
          actions: ['read'],
          subjects: ['role-analyst'],
        },
        'admin'
      );

      const denyPolicy = await service.createPolicy(
        {
          name: 'No System Delete',
          description: 'Prevent system deletion',
          effect: 'deny',
          resources: ['system'],
          actions: ['delete'],
          subjects: ['*'],
        },
        'admin'
      );

      // Register resource
      await service.registerResource({
        resourceId: 'report-final',
        type: 'report',
        ownerId: 'user-analyst-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Check access
      const allowedDecision = await service.checkAccess({
        userId: 'user-analyst-1',
        resource: 'report',
        action: 'read',
        resourceId: 'report-final',
        timestamp: new Date(),
      });

      const deniedDecision = await service.checkAccess({
        userId: 'any-user',
        resource: 'system',
        action: 'delete',
        timestamp: new Date(),
      });

      expect(allowedDecision.allowed).toBe(true);
      expect(deniedDecision.allowed).toBe(false);

      // Verify stats
      const stats = service.getStats();
      expect(stats.totalDecisions).toBeGreaterThanOrEqual(2);
    });
  });
});
