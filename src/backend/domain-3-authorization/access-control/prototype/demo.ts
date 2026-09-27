/**
 * Access Control Service - Demonstration Scenarios
 * 12 comprehensive demo scenarios showcasing access control capabilities
 */

import { createAccessControlService } from '../src/main';
import type { IAccessControlConfig } from '../src/types';

/**
 * Demo configuration
 */
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

/**
 * Demo 1: Basic Policy Creation
 */
async function demo1_BasicPolicyCreation() {
  console.log('\n========== DEMO 1: Basic Policy Creation ==========\n');

  const service = createAccessControlService(config);

  // Create allow policy
  const readPolicy = await service.createPolicy(
    {
      name: 'Report Read Access',
      description: 'Allow reading reports',
      effect: 'allow',
      resources: ['report'],
      actions: ['read'],
      subjects: ['role-analyst'],
    },
    'system'
  );

  console.log(`✓ Created policy: ${readPolicy.name}`);
  console.log(`  - Effect: ${readPolicy.effect}`);
  console.log(`  - Resources: ${readPolicy.resources.join(', ')}`);
  console.log(`  - Actions: ${readPolicy.actions.join(', ')}`);

  const policies = await service.getAllPolicies();
  console.log(`✓ Total policies: ${policies.length}`);
}

/**
 * Demo 2: Policy with Conditions
 */
async function demo2_PolicyWithConditions() {
  console.log('\n========== DEMO 2: Policy with Conditions ==========\n');

  const service = createAccessControlService(config);

  // Create policy with time condition
  const timeBasedPolicy = await service.createPolicy(
    {
      name: 'Business Hours Access',
      description: 'Allow access during business hours',
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

  console.log(`✓ Created policy with conditions: ${timeBasedPolicy.name}`);
  console.log(`  - Conditions: ${timeBasedPolicy.conditions?.length || 0}`);

  // Create policy with role condition
  const rolePolicy = await service.createPolicy(
    {
      name: 'Senior Admin Only',
      description: 'Restrict to senior admins',
      effect: 'allow',
      resources: ['system'],
      actions: ['delete'],
      subjects: ['role-senior-admin'],
      conditions: [
        {
          type: 'role',
          operator: 'in',
          value: ['role-senior-admin', 'role-director'],
        },
      ],
    },
    'admin'
  );

  console.log(`✓ Created role-based policy: ${rolePolicy.name}`);
}

/**
 * Demo 3: Access Decision Evaluation
 */
async function demo3_AccessDecisionEvaluation() {
  console.log('\n========== DEMO 3: Access Decision Evaluation ==========\n');

  const service = createAccessControlService(config);

  // Create policies
  await service.createPolicy(
    {
      name: 'Report Read',
      description: 'Allow reading',
      effect: 'allow',
      resources: ['report'],
      actions: ['read'],
      subjects: ['user-analyst'],
    },
    'admin'
  );

  await service.createPolicy(
    {
      name: 'Report Delete Block',
      description: 'Block deletion',
      effect: 'deny',
      resources: ['report'],
      actions: ['delete'],
      subjects: ['*'],
    },
    'admin'
  );

  // Check allowed access
  const allowedDecision = await service.checkAccess({
    userId: 'user-analyst',
    resource: 'report',
    action: 'read',
    timestamp: new Date(),
  });

  console.log(`✓ Access decision for read: ${allowedDecision.allowed ? 'ALLOWED' : 'DENIED'}`);

  // Check denied access
  const deniedDecision = await service.checkAccess({
    userId: 'user-analyst',
    resource: 'report',
    action: 'delete',
    timestamp: new Date(),
  });

  console.log(`✓ Access decision for delete: ${deniedDecision.allowed ? 'ALLOWED' : 'DENIED'}`);
  if (!deniedDecision.allowed) {
    console.log(`  - Reason: ${deniedDecision.reason}`);
  }
}

/**
 * Demo 4: Resource Registration and Ownership
 */
async function demo4_ResourceOwnershipChecks() {
  console.log('\n========== DEMO 4: Resource Ownership Checks ==========\n');

  const service = createAccessControlService(config);

  // Register resources
  await service.registerResource({
    resourceId: 'report-2024-001',
    type: 'report',
    ownerId: 'user-alice',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await service.registerResource({
    resourceId: 'alert-critical-001',
    type: 'alert',
    ownerId: 'user-bob',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`✓ Registered resources`);

  // Check ownership
  const isAliceOwner = await service.checkOwnership('user-alice', 'report-2024-001');
  const isBobOwner = await service.checkOwnership('user-bob', 'report-2024-001');

  console.log(`✓ Ownership checks:`);
  console.log(`  - Alice owns report-2024-001: ${isAliceOwner}`);
  console.log(`  - Bob owns report-2024-001: ${isBobOwner}`);
}

/**
 * Demo 5: Policy Management
 */
async function demo5_PolicyManagement() {
  console.log('\n========== DEMO 5: Policy Management ==========\n');

  const service = createAccessControlService(config);

  // Create policy
  const policy = await service.createPolicy(
    {
      name: 'Original Policy',
      description: 'Original description',
      effect: 'allow',
      resources: ['alert'],
      actions: ['read'],
      subjects: ['user-1'],
      priority: 100,
    },
    'admin'
  );

  console.log(`✓ Created policy: ${policy.name} (${policy.policyId})`);

  // Update policy
  const updated = await service.updatePolicy(
    policy.policyId,
    {
      name: 'Updated Policy',
      priority: 200,
      description: 'Updated description',
    },
    'admin'
  );

  console.log(`✓ Updated policy: ${updated.name}`);
  console.log(`  - New priority: ${updated.priority}`);

  // Deactivate policy
  const deactivated = await service.updatePolicy(
    policy.policyId,
    { isActive: false },
    'admin'
  );

  console.log(`✓ Deactivated policy: ${deactivated.isActive ? 'Active' : 'Inactive'}`);

  // Delete policy
  const deleted = await service.deletePolicy(policy.policyId, 'admin');
  console.log(`✓ Deleted policy: ${deleted ? 'Successful' : 'Failed'}`);
}

/**
 * Demo 6: Delegation
 */
async function demo6_AccessDelegation() {
  console.log('\n========== DEMO 6: Access Delegation ==========\n');

  const service = createAccessControlService(config);

  // Create permanent delegation
  const delegation = await service.createDelegation(
    'user-alice',
    'user-bob',
    { type: 'report', resourceId: 'report-123' },
    'read',
    'admin'
  );

  console.log(`✓ Created permanent delegation`);
  console.log(`  - From: ${delegation.from}`);
  console.log(`  - To: ${delegation.to}`);
  console.log(`  - Action: ${delegation.action}`);

  // Create temporary delegation
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const tempDelegation = await service.createDelegation(
    'user-alice',
    'user-charlie',
    { type: 'alert', resourceId: 'alert-456' },
    'write',
    'admin',
    expiresAt
  );

  console.log(`✓ Created temporary delegation`);
  console.log(`  - Expires: ${tempDelegation.expiresAt?.toISOString()}`);

  // Get delegations
  const delegations = await service.getDelegations('user-bob');
  console.log(`✓ Delegations for user-bob: ${delegations.length}`);
}

/**
 * Demo 7: Bulk Access Checking
 */
async function demo7_BulkAccessChecking() {
  console.log('\n========== DEMO 7: Bulk Access Checking ==========\n');

  const service = createAccessControlService(config);

  // Create policy for multiple users
  await service.createPolicy(
    {
      name: 'Team Access',
      description: 'Allow team members',
      effect: 'allow',
      resources: ['investigation'],
      actions: ['read', 'update'],
      subjects: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'],
    },
    'admin'
  );

  // Check bulk access
  const result = await service.bulkCheckAccess({
    userIds: ['user-1', 'user-2', 'user-6', 'user-7'],
    resource: 'investigation',
    action: 'read',
    resourceIds: ['inv-1', 'inv-2'],
  });

  console.log(`✓ Bulk access check:`);
  console.log(`  - Total requested: ${result.totalRequested}`);
  console.log(`  - Allowed: ${result.allowedCount}`);
  console.log(`  - Denied: ${result.deniedCount}`);
}

/**
 * Demo 8: Resource Filtering
 */
async function demo8_ResourceFiltering() {
  console.log('\n========== DEMO 8: Resource Filtering ==========\n');

  const service = createAccessControlService(config);

  // Register multiple resources
  await service.registerResource({
    resourceId: 'case-1',
    type: 'case',
    ownerId: 'user-alice',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await service.registerResource({
    resourceId: 'case-2',
    type: 'case',
    ownerId: 'user-bob',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await service.registerResource({
    resourceId: 'case-3',
    type: 'case',
    ownerId: 'user-alice',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Create ownership-based policy
  await service.createPolicy(
    {
      name: 'Owner Access',
      description: 'Owners can access their cases',
      effect: 'allow',
      resources: ['case'],
      actions: ['read', 'update'],
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

  // Filter resources
  const resources = [
    { resourceId: 'case-1', type: 'case' as any, ownerId: 'user-alice', createdAt: new Date(), updatedAt: new Date() },
    { resourceId: 'case-2', type: 'case' as any, ownerId: 'user-bob', createdAt: new Date(), updatedAt: new Date() },
    { resourceId: 'case-3', type: 'case' as any, ownerId: 'user-alice', createdAt: new Date(), updatedAt: new Date() },
  ];

  const result = await service.filterResourcesByAccess('user-alice', resources, 'read');

  console.log(`✓ Resource filtering:`);
  console.log(`  - Total resources: ${result.total}`);
  console.log(`  - Accessible: ${result.items.length}`);
  console.log(`  - Filtered out: ${result.filtered - result.items.length}`);
}

/**
 * Demo 9: Policy Conflicts
 */
async function demo9_PolicyConflictDetection() {
  console.log('\n========== DEMO 9: Policy Conflict Detection ==========\n');

  const service = createAccessControlService(config);

  // Create conflicting policies
  await service.createPolicy(
    {
      name: 'Allow Report Delete',
      description: 'Allow deletion',
      effect: 'allow',
      resources: ['report'],
      actions: ['delete'],
      subjects: ['role-manager'],
    },
    'admin'
  );

  await service.createPolicy(
    {
      name: 'Deny All Delete',
      description: 'Block all deletions',
      effect: 'deny',
      resources: ['report'],
      actions: ['delete'],
      subjects: ['*'],
    },
    'admin'
  );

  // Detect conflicts
  const conflicts = await service.detectConflicts();

  console.log(`✓ Policy conflicts detected: ${conflicts.length}`);
  conflicts.forEach((conflict, idx) => {
    console.log(`  ${idx + 1}. ${conflict.conflictType}`);
    console.log(`     - Severity: ${conflict.severity}`);
    console.log(`     - Recommendation: ${conflict.recommendation}`);
  });
}

/**
 * Demo 10: Event Monitoring
 */
async function demo10_EventMonitoring() {
  console.log('\n========== DEMO 10: Event Monitoring ==========\n');

  const service = createAccessControlService(config);
  const events: any[] = [];

  // Register event listener
  service.onAccess((event) => {
    events.push(event);
  });

  // Create policies and check access
  await service.createPolicy(
    {
      name: 'Event Test',
      description: 'Test',
      effect: 'allow',
      resources: ['alert'],
      actions: ['read'],
      subjects: ['user-1'],
    },
    'admin'
  );

  await service.checkAccess({
    userId: 'user-1',
    resource: 'alert',
    action: 'read',
    timestamp: new Date(),
  });

  console.log(`✓ Events captured: ${events.length}`);
  events.forEach((event, idx) => {
    console.log(`  ${idx + 1}. ${event.type} at ${event.timestamp.toISOString()}`);
  });
}

/**
 * Demo 11: Statistics and Metrics
 */
async function demo11_StatisticsAndMetrics() {
  console.log('\n========== DEMO 11: Statistics and Metrics ==========\n');

  const service = createAccessControlService(config);

  // Create multiple policies
  await service.createPolicy(
    {
      name: 'Policy 1',
      description: 'Test',
      effect: 'allow',
      resources: ['report'],
      actions: ['read'],
      subjects: ['user-1'],
    },
    'admin'
  );

  await service.createPolicy(
    {
      name: 'Policy 2',
      description: 'Test',
      effect: 'allow',
      resources: ['alert'],
      actions: ['create'],
      subjects: ['user-2'],
    },
    'admin'
  );

  // Check various accesses
  await service.checkAccess({
    userId: 'user-1',
    resource: 'report',
    action: 'read',
    timestamp: new Date(),
  });

  await service.checkAccess({
    userId: 'user-2',
    resource: 'alert',
    action: 'create',
    timestamp: new Date(),
  });

  // Get statistics
  const stats = service.getStats();

  console.log(`✓ Access Control Statistics:`);
  console.log(`  - Total decisions: ${stats.totalDecisions}`);
  console.log(`  - Allowed: ${stats.allowedDecisions}`);
  console.log(`  - Denied: ${stats.deniedDecisions}`);
  console.log(`  - Average evaluation time: ${stats.averageEvaluationTime}ms`);
  console.log(`  - Errors: ${stats.errors}`);
}

/**
 * Demo 12: Complete RBAC Implementation
 */
async function demo12_CompleteRBACImplementation() {
  console.log('\n========== DEMO 12: Complete RBAC Implementation ==========\n');

  const service = createAccessControlService(config);

  console.log('[Step 1] Creating role-based policies...');

  // Create admin policy
  await service.createPolicy(
    {
      name: 'Admin Full Access',
      description: 'Full system access for admins',
      effect: 'allow',
      resources: ['*'],
      actions: ['*'],
      subjects: ['role-admin'],
      priority: 200,
    },
    'system'
  );

  // Create analyst policy
  await service.createPolicy(
    {
      name: 'Analyst Read Access',
      description: 'Read-only access to reports and alerts',
      effect: 'allow',
      resources: ['report', 'alert', 'investigation'],
      actions: ['read'],
      subjects: ['role-analyst'],
      priority: 100,
    },
    'system'
  );

  // Create responder policy
  await service.createPolicy(
    {
      name: 'Responder Update Access',
      description: 'Can update alerts and cases',
      effect: 'allow',
      resources: ['alert', 'case'],
      actions: ['update', 'create'],
      subjects: ['role-responder'],
      priority: 100,
    },
    'system'
  );

  console.log('✓ Created 3 role-based policies');

  console.log('\n[Step 2] Registering resources...');

  await service.registerResource({
    resourceId: 'report-critical-001',
    type: 'report',
    ownerId: 'user-analyst-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('✓ Registered critical report');

  console.log('\n[Step 3] Checking access for different roles...');

  const adminAccess = await service.checkAccess({
    userId: 'user-admin-1',
    resource: 'system',
    action: 'manage',
    timestamp: new Date(),
  });

  const analystAccess = await service.checkAccess({
    userId: 'user-analyst-1',
    resource: 'report',
    action: 'read',
    timestamp: new Date(),
  });

  const responderAccess = await service.checkAccess({
    userId: 'user-responder-1',
    resource: 'alert',
    action: 'update',
    timestamp: new Date(),
  });

  console.log('✓ Access checks:');
  console.log(`  - Admin system access: ${adminAccess.allowed ? '✓ ALLOWED' : '✗ DENIED'}`);
  console.log(`  - Analyst report read: ${analystAccess.allowed ? '✓ ALLOWED' : '✗ DENIED'}`);
  console.log(`  - Responder alert update: ${responderAccess.allowed ? '✓ ALLOWED' : '✗ DENIED'}`);

  console.log('\n[Step 4] Final statistics:');
  const stats = service.getStats();
  console.log(`✓ Statistics:`);
  console.log(`  - Total decisions: ${stats.totalDecisions}`);
  console.log(`  - Policies applied: ${Object.keys(stats.policiesApplied).length}`);
  console.log(`  - Resource types accessed: ${Object.keys(stats.resourceTypes).length}`);
}

/**
 * Run all demos
 */
async function runAllDemos() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║         Access Control Service - Demo Scenarios           ║');
  console.log('║           12 Comprehensive Demonstration Cases            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  try {
    await demo1_BasicPolicyCreation();
    await demo2_PolicyWithConditions();
    await demo3_AccessDecisionEvaluation();
    await demo4_ResourceOwnershipChecks();
    await demo5_PolicyManagement();
    await demo6_AccessDelegation();
    await demo7_BulkAccessChecking();
    await demo8_ResourceFiltering();
    await demo9_PolicyConflictDetection();
    await demo10_EventMonitoring();
    await demo11_StatisticsAndMetrics();
    await demo12_CompleteRBACImplementation();

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                  All Demos Completed! ✓                  ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
  } catch (err) {
    console.error('\n✗ Error during demo execution:', err);
    process.exit(1);
  }
}

// Execute
runAllDemos().catch(console.error);
