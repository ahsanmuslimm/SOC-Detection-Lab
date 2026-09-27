/**
 * Policy Engine - Demonstration Scenarios
 * 12 comprehensive demo scenarios showcasing policy engine capabilities
 */

import { createPolicyEngine } from '../src/main';
import type { IPolicyEngineConfig } from '../src/types';

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

/**
 * Demo 1: Basic Policy Creation
 */
async function demo1_BasicPolicyCreation() {
  console.log('\n========== DEMO 1: Basic Policy Creation ==========\n');

  const engine = createPolicyEngine(config);

  const policy = await engine.createPolicy(
    {
      name: 'Report Read Access',
      description: 'Allow reading reports',
      statements: [
        {
          statementId: 'stmt-read',
          effect: 'allow',
          actions: ['read'],
          resources: ['report'],
          priority: 100,
        },
      ],
    },
    'system'
  );

  console.log(`✓ Created policy: ${policy.name}`);
  console.log(`  - ID: ${policy.policyId}`);
  console.log(`  - Version: ${policy.version}`);
  console.log(`  - Statements: ${policy.statements.length}`);
}

/**
 * Demo 2: Policy with Conditions
 */
async function demo2_PolicyWithConditions() {
  console.log('\n========== DEMO 2: Policy with Conditions ==========\n');

  const engine = createPolicyEngine(config);

  const policy = await engine.createPolicy(
    {
      name: 'Time-Based Access',
      description: 'Access only during business hours',
      statements: [
        {
          statementId: 'stmt-time',
          effect: 'allow',
          actions: ['manage'],
          resources: ['system'],
          conditions: [
            {
              conditionId: 'cond-time',
              type: 'time',
              operator: 'before',
              value: new Date(Date.now() + 8 * 60 * 60 * 1000),
            },
          ],
          priority: 100,
        },
      ],
    },
    'admin'
  );

  console.log(`✓ Created policy with conditions: ${policy.name}`);
  console.log(`  - Conditions: ${policy.statements[0].conditions?.length || 0}`);
}

/**
 * Demo 3: Policy Evaluation
 */
async function demo3_PolicyEvaluation() {
  console.log('\n========== DEMO 3: Policy Evaluation ==========\n');

  const engine = createPolicyEngine(config);

  const policy = await engine.createPolicy(
    {
      name: 'Evaluation Test',
      description: 'Test',
      statements: [
        {
          statementId: 'stmt-eval',
          effect: 'allow',
          actions: ['read'],
          resources: ['report'],
          priority: 100,
        },
      ],
    },
    'admin'
  );

  const result = await engine.evaluatePolicy({
    policyId: policy.policyId,
    userId: 'user-1',
    action: 'read',
    resource: 'report',
  });

  console.log(`✓ Policy evaluation:`);
  console.log(`  - Result: ${result.allowed ? 'ALLOWED' : 'DENIED'}`);
  console.log(`  - Effect: ${result.effect}`);
  console.log(`  - Matched statements: ${result.matchedStatements.length}`);
  console.log(`  - Evaluation time: ${result.evaluationTimeMs}ms`);
}

/**
 * Demo 4: Bulk Policy Evaluation
 */
async function demo4_BulkPolicyEvaluation() {
  console.log('\n========== DEMO 4: Bulk Policy Evaluation ==========\n');

  const engine = createPolicyEngine(config);

  const p1 = await engine.createPolicy(
    {
      name: 'Policy 1',
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

  const p2 = await engine.createPolicy(
    {
      name: 'Policy 2',
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

  const result = await engine.bulkEvaluatePolicies({
    policyIds: [p1.policyId, p2.policyId],
    userId: 'user-1',
    action: 'read',
    resource: 'report',
  });

  console.log(`✓ Bulk evaluation:`);
  console.log(`  - Total policies: ${result.totalPolicies}`);
  console.log(`  - Applicable policies: ${result.applicablePolicies}`);
  console.log(`  - Overall decision: ${result.overallDecision}`);
  console.log(`  - Evaluation time: ${result.evaluationTimeMs}ms`);
}

/**
 * Demo 5: Policy Management
 */
async function demo5_PolicyManagement() {
  console.log('\n========== DEMO 5: Policy Management ==========\n');

  const engine = createPolicyEngine(config);

  const policy = await engine.createPolicy(
    {
      name: 'Original',
      description: 'Original',
      statements: [],
    },
    'admin'
  );

  console.log(`✓ Created: ${policy.name}`);

  const updated = await engine.updatePolicy(
    policy.policyId,
    { name: 'Updated', description: 'Updated description' },
    'admin'
  );

  console.log(`✓ Updated: ${updated.name}`);
  console.log(`  - Description: ${updated.description}`);

  const deactivated = await engine.updatePolicy(
    policy.policyId,
    { isActive: false },
    'admin'
  );

  console.log(`✓ Deactivated: ${deactivated.isActive ? 'Active' : 'Inactive'}`);

  const deleted = await engine.deletePolicy(policy.policyId, 'admin');
  console.log(`✓ Deleted: ${deleted ? 'Success' : 'Failed'}`);
}

/**
 * Demo 6: Policy Versions
 */
async function demo6_PolicyVersions() {
  console.log('\n========== DEMO 6: Policy Versions ==========\n');

  const engine = createPolicyEngine(config);

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

  console.log(`✓ Created v1`);

  await engine.updatePolicy(
    policy.policyId,
    {
      statements: [
        {
          statementId: 'stmt-v2',
          effect: 'allow',
          actions: ['read', 'write'],
          resources: ['report', 'alert'],
          priority: 100,
        },
      ],
    },
    'admin'
  );

  console.log(`✓ Updated to v2`);

  const versions = await engine.getPolicyVersions(policy.policyId);
  console.log(`✓ Total versions: ${versions.length}`);

  versions.forEach((v, idx) => {
    console.log(`  v${v.version}: ${v.statements.length} statements`);
  });
}

/**
 * Demo 7: Policy Templates
 */
async function demo7_PolicyTemplates() {
  console.log('\n========== DEMO 7: Policy Templates ==========\n');

  const engine = createPolicyEngine(config);

  const template = await engine.createTemplate(
    'Read Template',
    'Template for read access',
    [
      {
        statementId: 'stmt-read',
        effect: 'allow',
        actions: ['read'],
        resources: ['*'],
        priority: 100,
      },
    ],
    'admin'
  );

  console.log(`✓ Created template: ${template.name}`);

  const policy = await engine.instantiateTemplate(
    {
      templateId: template.templateId,
      name: 'Read Policy Instance',
    },
    'admin'
  );

  console.log(`✓ Instantiated policy: ${policy.name}`);
  console.log(`  - Statements: ${policy.statements.length}`);
}

/**
 * Demo 8: Policy Search
 */
async function demo8_PolicySearch() {
  console.log('\n========== DEMO 8: Policy Search ==========\n');

  const engine = createPolicyEngine(config);

  await engine.createPolicy(
    {
      name: 'Search Test Policy 1',
      description: 'First',
      statements: [],
    },
    'admin'
  );

  await engine.createPolicy(
    {
      name: 'Search Test Policy 2',
      description: 'Second',
      statements: [],
    },
    'admin'
  );

  const result = await engine.searchPolicies({ name: 'Search Test' });

  console.log(`✓ Search results:`);
  console.log(`  - Total matching: ${result.total}`);
  console.log(`  - Returned: ${result.policies.length}`);

  result.policies.forEach((p, idx) => {
    console.log(`  ${idx + 1}. ${p.name}`);
  });
}

/**
 * Demo 9: Conflict Detection
 */
async function demo9_ConflictDetection() {
  console.log('\n========== DEMO 9: Conflict Detection ==========\n');

  const engine = createPolicyEngine(config);

  await engine.createPolicy(
    {
      name: 'Allow Delete',
      description: 'Allow',
      statements: [
        {
          statementId: 'stmt-allow-del',
          effect: 'allow',
          actions: ['delete'],
          resources: ['report'],
          priority: 100,
        },
      ],
    },
    'admin'
  );

  await engine.createPolicy(
    {
      name: 'Deny Delete',
      description: 'Deny',
      statements: [
        {
          statementId: 'stmt-deny-del',
          effect: 'deny',
          actions: ['delete'],
          resources: ['report'],
          priority: 100,
        },
      ],
    },
    'admin'
  );

  const conflicts = await engine.detectConflicts();

  console.log(`✓ Conflicts detected: ${conflicts.length}`);
  conflicts.forEach((conflict, idx) => {
    console.log(`  ${idx + 1}. Type: ${conflict.conflictType}`);
    console.log(`     - Severity: ${conflict.severity}`);
    console.log(`     - Recommendation: ${conflict.recommendation}`);
  });
}

/**
 * Demo 10: Event Monitoring
 */
async function demo10_EventMonitoring() {
  console.log('\n========== DEMO 10: Event Monitoring ==========\n');

  const engine = createPolicyEngine(config);
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

  console.log(`✓ Events captured: ${events.length}`);
  events.forEach((e, idx) => {
    console.log(`  ${idx + 1}. ${e.type} at ${e.timestamp.toISOString()}`);
  });
}

/**
 * Demo 11: Statistics
 */
async function demo11_Statistics() {
  console.log('\n========== DEMO 11: Statistics ==========\n');

  const engine = createPolicyEngine(config);

  const policy = await engine.createPolicy(
    {
      name: 'Stats Test',
      description: 'Test',
      statements: [
        {
          statementId: 'stmt-stats',
          effect: 'allow',
          actions: ['read'],
          resources: ['report'],
          priority: 100,
        },
      ],
    },
    'admin'
  );

  await engine.evaluatePolicy({
    policyId: policy.policyId,
    userId: 'user-1',
    action: 'read',
    resource: 'report',
  });

  const stats = engine.getStats();

  console.log(`✓ Statistics:`);
  console.log(`  - Total policies: ${stats.totalPolicies}`);
  console.log(`  - Active policies: ${stats.activePolicies}`);
  console.log(`  - Total evaluations: ${stats.totalEvaluations}`);
  console.log(`  - Successful evaluations: ${stats.successfulEvaluations}`);
  console.log(`  - Average eval time: ${stats.averageEvaluationTime}ms`);
}

/**
 * Demo 12: Complete Workflow
 */
async function demo12_CompleteWorkflow() {
  console.log('\n========== DEMO 12: Complete Workflow ==========\n');

  const engine = createPolicyEngine(config);

  console.log('[Step 1] Creating policies...');

  const readPolicy = await engine.createPolicy(
    {
      name: 'Report Read',
      description: 'Allow reading reports',
      statements: [
        {
          statementId: 'stmt-read',
          effect: 'allow',
          actions: ['read'],
          resources: ['report'],
          priority: 100,
        },
      ],
    },
    'system'
  );

  const writePolicy = await engine.createPolicy(
    {
      name: 'Report Write',
      description: 'Allow writing reports',
      statements: [
        {
          statementId: 'stmt-write',
          effect: 'allow',
          actions: ['write'],
          resources: ['report'],
          priority: 100,
        },
      ],
    },
    'system'
  );

  console.log(`✓ Created 2 policies`);

  console.log('\n[Step 2] Evaluating policies...');

  const readResult = await engine.evaluatePolicy({
    policyId: readPolicy.policyId,
    userId: 'analyst',
    action: 'read',
    resource: 'report',
  });

  const writeResult = await engine.evaluatePolicy({
    policyId: writePolicy.policyId,
    userId: 'analyst',
    action: 'write',
    resource: 'report',
  });

  console.log(`✓ Read access: ${readResult.allowed ? '✓ ALLOWED' : '✗ DENIED'}`);
  console.log(`✓ Write access: ${writeResult.allowed ? '✓ ALLOWED' : '✗ DENIED'}`);

  console.log('\n[Step 3] Bulk evaluation...');

  const bulkResult = await engine.bulkEvaluatePolicies({
    policyIds: [readPolicy.policyId, writePolicy.policyId],
    userId: 'analyst',
    action: 'read',
    resource: 'report',
  });

  console.log(`✓ Bulk result: ${bulkResult.overallDecision}`);
  console.log(`  - Evaluation time: ${bulkResult.evaluationTimeMs}ms`);

  console.log('\n[Step 4] Final statistics:');

  const stats = engine.getStats();
  console.log(`✓ Total evaluations: ${stats.totalEvaluations}`);
  console.log(`✓ Successful: ${stats.successfulEvaluations}`);
  console.log(`✓ Average time: ${stats.averageEvaluationTime}ms`);
}

/**
 * Run all demos
 */
async function runAllDemos() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║           Policy Engine - Demo Scenarios                  ║');
  console.log('║           12 Comprehensive Demonstration Cases            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  try {
    await demo1_BasicPolicyCreation();
    await demo2_PolicyWithConditions();
    await demo3_PolicyEvaluation();
    await demo4_BulkPolicyEvaluation();
    await demo5_PolicyManagement();
    await demo6_PolicyVersions();
    await demo7_PolicyTemplates();
    await demo8_PolicySearch();
    await demo9_ConflictDetection();
    await demo10_EventMonitoring();
    await demo11_Statistics();
    await demo12_CompleteWorkflow();

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                  All Demos Completed! ✓                  ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
  } catch (err) {
    console.error('\n✗ Error:', err);
    process.exit(1);
  }
}

runAllDemos().catch(console.error);
