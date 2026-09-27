/**
 * Policy Engine - Unit Tests
 * Comprehensive test suite for policy evaluation and enforcement
 */

import { PolicyEngine, createPolicyEngine } from '../../src/main';
import type { IPolicyEngineConfig } from '../../src/types';

describe('PolicyEngine', () => {
  let engine: PolicyEngine;
  const config: IPolicyEngineConfig = {
    maxPolicies: 1000,
    maxVersions: 5000,
    enableVersioning: true,
    enableAuditing: true,
    enableCaching: true,
    cacheTimeout: 5000,
    maxCacheSize: 500,
    evaluationTimeout: 1000,
    defaultEffect: 'deny',
  };

  beforeEach(() => {
    engine = new PolicyEngine(config);
  });

  describe('Service Creation', () => {
    test('should create policy engine instance', () => {
      expect(engine).toBeInstanceOf(PolicyEngine);
    });

    test('should create via factory', () => {
      const eng = createPolicyEngine(config);
      expect(eng).toBeInstanceOf(PolicyEngine);
    });

    test('should throw on invalid config', () => {
      expect(() => {
        new PolicyEngine({ ...config, maxPolicies: 5 });
      }).toThrow('maxPolicies must be at least 10');
    });

    test('should initialize stats', () => {
      const stats = engine.getStats();
      expect(stats.totalPolicies).toBe(0);
      expect(stats.totalEvaluations).toBe(0);
    });
  });

  describe('Policy Creation', () => {
    test('should create policy', async () => {
      const policy = await engine.createPolicy(
        {
          name: 'Test Policy',
          description: 'Test',
          statements: [
            {
              statementId: 'stmt-1',
              effect: 'allow',
              actions: ['read'],
              resources: ['report'],
              priority: 100,
            },
          ],
        },
        'admin'
      );

      expect(policy.policyId).toBeDefined();
      expect(policy.name).toBe('Test Policy');
      expect(policy.isActive).toBe(true);
      expect(policy.version).toBe(1);
    });

    test('should throw when max policies exceeded', async () => {
      const limitedConfig: IPolicyEngineConfig = {
        ...config,
        maxPolicies: 1,
      };
      const limitedEngine = new PolicyEngine(limitedConfig);

      await limitedEngine.createPolicy(
        {
          name: 'Policy 1',
          description: 'Test',
          statements: [],
        },
        'admin'
      );

      await expect(
        limitedEngine.createPolicy(
          {
            name: 'Policy 2',
            description: 'Test',
            statements: [],
          },
          'admin'
        )
      ).rejects.toThrow('Max policies limit reached');
    });
  });

  describe('Policy Management', () => {
    let policyId: string;

    beforeEach(async () => {
      const policy = await engine.createPolicy(
        {
          name: 'Management Test',
          description: 'Test',
          statements: [
            {
              statementId: 'stmt-1',
              effect: 'allow',
              actions: ['*'],
              resources: ['*'],
              priority: 100,
            },
          ],
        },
        'admin'
      );
      policyId = policy.policyId;
    });

    test('should get policy', async () => {
      const policy = await engine.getPolicy(policyId);
      expect(policy).toBeDefined();
      expect(policy?.name).toBe('Management Test');
    });

    test('should update policy', async () => {
      const updated = await engine.updatePolicy(
        policyId,
        { name: 'Updated Policy' },
        'admin'
      );

      expect(updated.name).toBe('Updated Policy');
    });

    test('should deactivate policy', async () => {
      const updated = await engine.updatePolicy(
        policyId,
        { isActive: false },
        'admin'
      );

      expect(updated.isActive).toBe(false);
    });

    test('should delete policy', async () => {
      const deleted = await engine.deletePolicy(policyId, 'admin');
      expect(deleted).toBe(true);

      const retrieved = await engine.getPolicy(policyId);
      expect(retrieved).toBeNull();
    });

    test('should get all policies', async () => {
      const policies = await engine.getAllPolicies();
      expect(policies.length).toBeGreaterThan(0);
    });
  });

  describe('Policy Evaluation', () => {
    beforeEach(async () => {
      // Allow read
      await engine.createPolicy(
        {
          name: 'Allow Read',
          description: 'Allow read access',
          statements: [
            {
              statementId: 'stmt-allow-read',
              effect: 'allow',
              actions: ['read'],
              resources: ['report'],
              priority: 100,
            },
          ],
        },
        'admin'
      );

      // Deny write
      await engine.createPolicy(
        {
          name: 'Deny Write',
          description: 'Block write access',
          statements: [
            {
              statementId: 'stmt-deny-write',
              effect: 'deny',
              actions: ['write', 'delete'],
              resources: ['*'],
              priority: 200,
            },
          ],
        },
        'admin'
      );
    });

    test('should evaluate allow policy', async () => {
      const policies = await engine.getAllPolicies();
      const allowPolicy = policies.find(p => p.name === 'Allow Read');

      const result = await engine.evaluatePolicy({
        policyId: allowPolicy!.policyId,
        userId: 'user-1',
        action: 'read',
        resource: 'report',
      });

      expect(result.allowed).toBe(true);
      expect(result.matchedStatements.length).toBeGreaterThan(0);
    });

    test('should evaluate deny policy', async () => {
      const policies = await engine.getAllPolicies();
      const denyPolicy = policies.find(p => p.name === 'Deny Write');

      const result = await engine.evaluatePolicy({
        policyId: denyPolicy!.policyId,
        userId: 'user-1',
        action: 'write',
        resource: 'report',
      });

      expect(result.allowed).toBe(false);
    });

    test('should handle non-matching request', async () => {
      const policies = await engine.getAllPolicies();
      const allowPolicy = policies.find(p => p.name === 'Allow Read');

      const result = await engine.evaluatePolicy({
        policyId: allowPolicy!.policyId,
        userId: 'user-1',
        action: 'write',
        resource: 'report',
      });

      expect(result.allowed).toBe(false);
      expect(result.matchedStatements.length).toBe(0);
    });
  });

  describe('Bulk Evaluation', () => {
    beforeEach(async () => {
      await engine.createPolicy(
        {
          name: 'Bulk Test 1',
          description: 'Test',
          statements: [
            {
              statementId: 'stmt-1',
              effect: 'allow',
              actions: ['read'],
              resources: ['report'],
              priority: 100,
            },
          ],
        },
        'admin'
      );

      await engine.createPolicy(
        {
          name: 'Bulk Test 2',
          description: 'Test',
          statements: [
            {
              statementId: 'stmt-2',
              effect: 'allow',
              actions: ['write'],
              resources: ['alert'],
              priority: 100,
            },
          ],
        },
        'admin'
      );
    });

    test('should bulk evaluate policies', async () => {
      const policies = await engine.getAllPolicies();
      const policyIds = policies.map(p => p.policyId).slice(0, 2);

      const result = await engine.bulkEvaluatePolicies({
        policyIds,
        userId: 'user-1',
        action: 'read',
        resource: 'report',
      });

      expect(result.results.length).toBe(2);
      expect(result.totalPolicies).toBe(2);
    });
  });

  describe('Policy Versions', () => {
    let policyId: string;

    beforeEach(async () => {
      const policy = await engine.createPolicy(
        {
          name: 'Version Test',
          description: 'Test',
          statements: [
            {
              statementId: 'stmt-v1',
              effect: 'allow',
              actions: ['read'],
              resources: ['report'],
              priority: 100,
            },
          ],
        },
        'admin'
      );
      policyId = policy.policyId;
    });

    test('should create version on update', async () => {
      await engine.updatePolicy(
        policyId,
        {
          statements: [
            {
              statementId: 'stmt-v2',
              effect: 'allow',
              actions: ['read', 'write'],
              resources: ['report'],
              priority: 100,
            },
          ],
        },
        'admin'
      );

      const versions = await engine.getPolicyVersions(policyId);
      expect(versions.length).toBeGreaterThan(0);
    });

    test('should rollback to version', async () => {
      // Get initial version
      const versions1 = await engine.getPolicyVersions(policyId);
      const initialVersion = versions1[0].version;

      // Update policy
      await engine.updatePolicy(
        policyId,
        {
          name: 'Updated Name',
          statements: [
            {
              statementId: 'stmt-new',
              effect: 'deny',
              actions: ['*'],
              resources: ['*'],
              priority: 50,
            },
          ],
        },
        'admin'
      );

      // Verify update
      let policy = await engine.getPolicy(policyId);
      expect(policy?.name).toBe('Updated Name');

      // Rollback
      await engine.rollbackToVersion(policyId, initialVersion, 'admin');

      // Verify rollback
      policy = await engine.getPolicy(policyId);
      expect(policy?.name).toBe('Version Test');
    });
  });

  describe('Policy Templates', () => {
    test('should create template', async () => {
      const template = await engine.createTemplate(
        'Read Template',
        'Template for read access',
        [
          {
            statementId: 'stmt-read',
            effect: 'allow',
            actions: ['read'],
            resources: ['report'],
            priority: 100,
          },
        ],
        'admin'
      );

      expect(template.templateId).toBeDefined();
      expect(template.name).toBe('Read Template');
    });

    test('should instantiate template', async () => {
      const template = await engine.createTemplate(
        'Write Template',
        'Template for write',
        [
          {
            statementId: 'stmt-write',
            effect: 'allow',
            actions: ['write'],
            resources: ['report'],
            priority: 100,
          },
        ],
        'admin'
      );

      const policy = await engine.instantiateTemplate(
        {
          templateId: template.templateId,
          name: 'Instance Policy',
        },
        'admin'
      );

      expect(policy.name).toBe('Instance Policy');
      expect(policy.statements.length).toBe(1);
    });
  });

  describe('Search', () => {
    beforeEach(async () => {
      await engine.createPolicy(
        {
          name: 'Search Test 1',
          description: 'Test',
          statements: [],
        },
        'admin'
      );

      await engine.createPolicy(
        {
          name: 'Search Test 2',
          description: 'Test',
          statements: [],
        },
        'admin'
      );
    });

    test('should search by name', async () => {
      const result = await engine.searchPolicies({ name: 'Search Test' });
      expect(result.total).toBeGreaterThanOrEqual(2);
    });

    test('should search by active status', async () => {
      const result = await engine.searchPolicies({ active: true });
      expect(result.total).toBeGreaterThan(0);
    });
  });

  describe('Conflict Detection', () => {
    beforeEach(async () => {
      await engine.createPolicy(
        {
          name: 'Allow Write',
          description: 'Allow',
          statements: [
            {
              statementId: 'stmt-allow',
              effect: 'allow',
              actions: ['write'],
              resources: ['report'],
              priority: 100,
            },
          ],
        },
        'admin'
      );

      await engine.createPolicy(
        {
          name: 'Deny Write',
          description: 'Deny',
          statements: [
            {
              statementId: 'stmt-deny',
              effect: 'deny',
              actions: ['write'],
              resources: ['report'],
              priority: 100,
            },
          ],
        },
        'admin'
      );
    });

    test('should detect conflicts', async () => {
      const conflicts = await engine.detectConflicts();
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].conflictType).toBe('contradictory');
    });
  });

  describe('Event Listeners', () => {
    test('should register and fire events', async () => {
      const events: any[] = [];

      engine.onPolicy((event) => {
        events.push(event);
      });

      await engine.createPolicy(
        {
          name: 'Event Test',
          description: 'Test',
          statements: [],
        },
        'admin'
      );

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('policy_created');
    });

    test('should remove listener', async () => {
      const events: any[] = [];
      const listener = (event: any) => {
        events.push(event);
      };

      engine.onPolicy(listener);
      engine.offPolicy(listener);

      await engine.createPolicy(
        {
          name: 'Event Test 2',
          description: 'Test',
          statements: [],
        },
        'admin'
      );

      expect(events.length).toBe(0);
    });
  });

  describe('Statistics', () => {
    test('should track statistics', async () => {
      const policies = await engine.getAllPolicies();
      const policyId = policies[0]?.policyId;

      if (policyId) {
        await engine.evaluatePolicy({
          policyId,
          userId: 'user-1',
          action: 'read',
          resource: 'report',
        });
      }

      const stats = engine.getStats();
      expect(stats.totalEvaluations).toBeGreaterThan(0);
    });
  });

  describe('Audit Logging', () => {
    test('should log audit entries', async () => {
      await engine.createPolicy(
        {
          name: 'Audit Test',
          description: 'Test',
          statements: [],
        },
        'admin'
      );

      const log = engine.getAuditLog();
      expect(log.length).toBeGreaterThan(0);
    });
  });

  describe('Integration', () => {
    test('complete policy workflow', async () => {
      // Create policy
      const policy = await engine.createPolicy(
        {
          name: 'Complete Test',
          description: 'Full workflow',
          statements: [
            {
              statementId: 'stmt-complete',
              effect: 'allow',
              actions: ['read', 'write'],
              resources: ['report', 'alert'],
              priority: 100,
            },
          ],
        },
        'admin'
      );

      // Evaluate
      const result = await engine.evaluatePolicy({
        policyId: policy.policyId,
        userId: 'user-test',
        action: 'read',
        resource: 'report',
      });

      expect(result.allowed).toBe(true);

      // Update
      const updated = await engine.updatePolicy(
        policy.policyId,
        { name: 'Updated Test' },
        'admin'
      );

      expect(updated.name).toBe('Updated Test');

      // Get versions
      const versions = await engine.getPolicyVersions(policy.policyId);
      expect(versions.length).toBeGreaterThan(0);

      // Search
      const searchResult = await engine.searchPolicies({ name: 'Updated' });
      expect(searchResult.total).toBeGreaterThan(0);
    });
  });
});
