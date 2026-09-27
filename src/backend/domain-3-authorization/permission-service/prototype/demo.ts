/**
 * Permission Service - Demonstration Scenarios
 * 12 comprehensive demo scenarios showcasing permission management capabilities
 */

import { createPermissionService } from '../src/main';
import type { IPermissionServiceConfig } from '../src/types';

/**
 * Demo configuration
 */
const config: IPermissionServiceConfig = {
  enableResourceScoping: true,
  enableGrouping: true,
  maxPermissionsPerUser: 1000,
  permissionCacheTimeout: 5000,
  cacheSize: 500,
};

/**
 * Demo 1: Basic Permission Creation
 */
async function demo1_BasicPermissionCreation() {
  console.log('\n========== DEMO 1: Basic Permission Creation ==========\n');

  const service = createPermissionService(config);

  // Create individual permissions
  const readPerm = await service.createPermission(
    {
      name: 'Read Reports',
      description: 'Permission to read security reports',
      resource: 'report',
      action: 'read',
      priority: 100,
    },
    'system'
  );

  const writePerm = await service.createPermission(
    {
      name: 'Write Reports',
      description: 'Permission to create and modify reports',
      resource: 'report',
      action: 'write',
      priority: 110,
    },
    'system'
  );

  console.log('✓ Created permission:', readPerm.name, `(${readPerm.permissionId})`);
  console.log('✓ Created permission:', writePerm.name, `(${writePerm.permissionId})`);

  const stats = service.getStats();
  console.log(`✓ Service stats: ${stats.totalPermissions} permissions created`);
}

/**
 * Demo 2: Permission Groups
 */
async function demo2_PermissionGroups() {
  console.log('\n========== DEMO 2: Permission Groups ==========\n');

  const service = createPermissionService(config);

  // Create individual permissions
  const perms = await Promise.all([
    service.createPermission(
      { name: 'Report Read', resource: 'report', action: 'read' },
      'admin'
    ),
    service.createPermission(
      { name: 'Report Write', resource: 'report', action: 'write' },
      'admin'
    ),
    service.createPermission(
      { name: 'Report Delete', resource: 'report', action: 'delete' },
      'admin'
    ),
  ]);

  // Create permission group
  const group = await service.createPermissionGroup(
    'Report Manager',
    'Full report management permissions',
    perms.map(p => p.permissionId),
    'admin'
  );

  console.log(`✓ Created permission group: ${group.name}`);
  console.log(`  - Contains ${group.permissions.length} permissions`);

  // Get all groups
  const allGroups = await service.getAllPermissionGroups();
  console.log(`✓ Total permission groups: ${allGroups.length}`);
}

/**
 * Demo 3: User Permission Assignment
 */
async function demo3_UserPermissionAssignment() {
  console.log('\n========== DEMO 3: User Permission Assignment ==========\n');

  const service = createPermissionService(config);

  // Create permission
  const perm = await service.createPermission(
    { name: 'User Management', resource: 'user', action: 'manage' },
    'admin'
  );

  // Grant to user
  const userPerm = await service.grantPermissionToUser(
    perm.permissionId,
    'user-alice',
    'admin'
  );

  console.log(`✓ Granted permission to user-alice`);
  console.log(`  - Permission: ${perm.name}`);
  console.log(`  - Granted at: ${userPerm.grantedAt.toISOString()}`);

  // Get user permissions
  const summary = await service.getUserPermissionsSummary('user-alice');
  console.log(`✓ User has ${summary.permissions.length} permissions`);
}

/**
 * Demo 4: Role Permission Assignment
 */
async function demo4_RolePermissionAssignment() {
  console.log('\n========== DEMO 4: Role Permission Assignment ==========\n');

  const service = createPermissionService(config);

  // Create permissions
  const perms = await Promise.all([
    service.createPermission(
      { name: 'System Read', resource: 'system', action: 'read' },
      'admin'
    ),
    service.createPermission(
      { name: 'System Write', resource: 'system', action: 'write' },
      'admin'
    ),
  ]);

  // Grant to role
  for (const perm of perms) {
    const rolePerm = await service.grantPermissionToRole(
      perm.permissionId,
      'role-admin',
      'admin'
    );
    console.log(`✓ Granted ${perm.name} to role-admin`);
  }

  const stats = service.getStats();
  console.log(`✓ Total permissions granted to roles: ${stats.permissionsGrantedToRoles}`);
}

/**
 * Demo 5: Temporary Permission Assignment
 */
async function demo5_TemporaryPermissionAssignment() {
  console.log('\n========== DEMO 5: Temporary Permission Assignment ==========\n');

  const service = createPermissionService(config);

  // Create permission
  const perm = await service.createPermission(
    { name: 'Sensitive Report Access', resource: 'report', action: 'read' },
    'admin'
  );

  // Grant with expiration
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const userPerm = await service.grantPermissionToUser(
    perm.permissionId,
    'contractor-bob',
    'admin',
    expiresAt,
    'Temporary access for project'
  );

  console.log(`✓ Granted temporary permission to contractor-bob`);
  console.log(`  - Permission: ${perm.name}`);
  console.log(`  - Expires: ${userPerm.expiresAt?.toISOString()}`);
  console.log(`  - Reason: ${userPerm.reason}`);
}

/**
 * Demo 6: Permission Checking
 */
async function demo6_PermissionChecking() {
  console.log('\n========== DEMO 6: Permission Checking ==========\n');

  const service = createPermissionService(config);

  // Create and grant permission
  const perm = await service.createPermission(
    { name: 'Report Delete', resource: 'report', action: 'delete' },
    'admin'
  );

  await service.grantPermissionToUser(perm.permissionId, 'user-charlie', 'admin');

  // Check permissions
  const allowedCheck = await service.checkPermission({
    userId: 'user-charlie',
    resource: 'report',
    action: 'delete',
  });

  const deniedCheck = await service.checkPermission({
    userId: 'user-charlie',
    resource: 'user',
    action: 'manage',
  });

  console.log(`✓ Permission check - Delete Report: ${allowedCheck.allowed ? '✓ ALLOWED' : '✗ DENIED'}`);
  console.log(`✓ Permission check - Manage Users: ${deniedCheck.allowed ? '✓ ALLOWED' : '✗ DENIED'}`);

  if (!deniedCheck.allowed) {
    console.log(`  - Denial reason: ${deniedCheck.reason}`);
  }
}

/**
 * Demo 7: Bulk Permission Operations
 */
async function demo7_BulkOperations() {
  console.log('\n========== DEMO 7: Bulk Permission Operations ==========\n');

  const service = createPermissionService(config);

  // Create permissions
  const perms = await Promise.all([
    service.createPermission(
      { name: 'Dashboard Access', resource: 'dashboard', action: 'read' },
      'admin'
    ),
    service.createPermission(
      { name: 'Alert Management', resource: 'alert', action: 'manage' },
      'admin'
    ),
  ]);

  // Bulk grant to multiple users
  const result = await service.bulkGrantPermissions(
    {
      permissionIds: perms.map(p => p.permissionId),
      userIds: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'],
      action: 'grant',
    },
    'admin'
  );

  console.log(`✓ Bulk granted permissions`);
  console.log(`  - Total requested: ${result.totalRequested}`);
  console.log(`  - Successful: ${result.successful}`);
  console.log(`  - Failed: ${result.failed}`);
}

/**
 * Demo 8: Permission Group Assignment
 */
async function demo8_PermissionGroupAssignment() {
  console.log('\n========== DEMO 8: Permission Group Assignment ==========\n');

  const service = createPermissionService(config);

  // Create permissions
  const perms = await Promise.all([
    service.createPermission(
      { name: 'Threat Read', resource: 'threat', action: 'read' },
      'admin'
    ),
    service.createPermission(
      { name: 'Threat Update', resource: 'threat', action: 'update' },
      'admin'
    ),
    service.createPermission(
      { name: 'Threat Approve', resource: 'threat', action: 'approve' },
      'admin'
    ),
  ]);

  // Create group
  const group = await service.createPermissionGroup(
    'Threat Analyst',
    'Permissions for threat analysis operations',
    perms.map(p => p.permissionId),
    'admin'
  );

  // Assign group to user
  const assigned = await service.grantPermissionGroupToUser(
    group.groupId,
    'analyst-dave',
    'admin'
  );

  console.log(`✓ Assigned group "${group.name}" to analyst-dave`);
  console.log(`  - Permissions granted: ${assigned}`);

  // Verify user has all permissions
  const summary = await service.getUserPermissionsSummary('analyst-dave');
  console.log(`✓ User now has ${summary.permissions.length} permissions total`);
}

/**
 * Demo 9: Permission Updates and Deactivation
 */
async function demo9_PermissionUpdates() {
  console.log('\n========== DEMO 9: Permission Updates and Deactivation ==========\n');

  const service = createPermissionService(config);

  // Create permission
  const perm = await service.createPermission(
    {
      name: 'System Configuration',
      description: 'Original description',
      resource: 'system',
      action: 'configure',
      priority: 100,
    },
    'admin'
  );

  console.log(`✓ Created permission: ${perm.name}`);

  // Update permission
  const updated = await service.updatePermission(
    perm.permissionId,
    {
      description: 'Updated - Manage system configuration settings',
      priority: 150,
    },
    'admin'
  );

  console.log(`✓ Updated permission: ${updated.name}`);
  console.log(`  - New priority: ${updated.priority}`);

  // Deactivate permission
  const deactivated = await service.updatePermission(
    perm.permissionId,
    { isActive: false },
    'admin'
  );

  console.log(`✓ Deactivated permission: ${deactivated.isActive ? 'Active' : 'Inactive'}`);
}

/**
 * Demo 10: Audit Logging and Events
 */
async function demo10_AuditLogging() {
  console.log('\n========== DEMO 10: Audit Logging and Events ==========\n');

  const service = createPermissionService(config);
  const events: string[] = [];

  // Register event listener
  service.onPermission((event) => {
    events.push(`${event.type} at ${event.timestamp.toISOString()}`);
  });

  // Perform operations
  const perm = await service.createPermission(
    { name: 'Test', resource: 'test', action: 'read' },
    'admin'
  );

  await service.grantPermissionToUser(perm.permissionId, 'user-1', 'admin');

  console.log(`✓ Recorded ${events.length} events:`);
  events.forEach((event, idx) => {
    console.log(`  ${idx + 1}. ${event}`);
  });

  // Get audit log
  const auditLog = service.getAuditLog(10);
  console.log(`✓ Audit log contains ${auditLog.length} entries`);
}

/**
 * Demo 11: Permission Statistics and Monitoring
 */
async function demo11_Statistics() {
  console.log('\n========== DEMO 11: Permission Statistics and Monitoring ==========\n');

  const service = createPermissionService(config);

  // Create various permissions
  await service.createPermission(
    { name: 'Read', resource: 'user', action: 'read' },
    'admin'
  );
  await service.createPermission(
    { name: 'Write', resource: 'user', action: 'write' },
    'admin'
  );
  await service.createPermission(
    { name: 'Delete', resource: 'report', action: 'delete' },
    'admin'
  );
  await service.createPermission(
    { name: 'Manage', resource: 'system', action: 'manage' },
    'admin'
  );

  // Get statistics
  const stats = service.getStats();

  console.log(`✓ Permission Statistics:`);
  console.log(`  - Total Permissions: ${stats.totalPermissions}`);
  console.log(`  - Active Permissions: ${stats.activePermissions}`);
  console.log(`  - Grouped Permissions: ${stats.groupedPermissions}`);
  console.log(`  - Granted to Users: ${stats.permissionsGrantedToUsers}`);
  console.log(`  - Granted to Roles: ${stats.permissionsGrantedToRoles}`);
  console.log(`\n  Resource Types:`);
  Object.entries(stats.resourceTypes).forEach(([resource, count]) => {
    console.log(`    - ${resource}: ${count}`);
  });
  console.log(`\n  Action Types:`);
  Object.entries(stats.actionTypes).forEach(([action, count]) => {
    console.log(`    - ${action}: ${count}`);
  });
}

/**
 * Demo 12: Complete RBAC Workflow
 */
async function demo12_CompleteWorkflow() {
  console.log('\n========== DEMO 12: Complete RBAC Workflow ==========\n');

  const service = createPermissionService(config);

  // Step 1: Create permissions
  console.log('\n[Step 1] Creating permissions...');
  const permissions = await Promise.all([
    service.createPermission(
      { name: 'View Alerts', resource: 'alert', action: 'read', priority: 100 },
      'system'
    ),
    service.createPermission(
      { name: 'Create Alerts', resource: 'alert', action: 'create', priority: 110 },
      'system'
    ),
    service.createPermission(
      { name: 'Respond to Alerts', resource: 'alert', action: 'update', priority: 120 },
      'system'
    ),
    service.createPermission(
      { name: 'View Reports', resource: 'report', action: 'read', priority: 100 },
      'system'
    ),
    service.createPermission(
      { name: 'Create Reports', resource: 'report', action: 'create', priority: 110 },
      'system'
    ),
    service.createPermission(
      { name: 'Manage System', resource: 'system', action: 'manage', priority: 200 },
      'system'
    ),
  ]);

  console.log(`✓ Created ${permissions.length} permissions`);

  // Step 2: Create permission groups
  console.log('\n[Step 2] Creating permission groups...');
  const analystGroup = await service.createPermissionGroup(
    'Security Analyst',
    'Permissions for security analysts',
    [permissions[0].permissionId, permissions[3].permissionId],
    'system'
  );

  const responderGroup = await service.createPermissionGroup(
    'Incident Responder',
    'Permissions for incident response',
    [
      permissions[0].permissionId,
      permissions[2].permissionId,
      permissions[4].permissionId,
    ],
    'system'
  );

  const adminGroup = await service.createPermissionGroup(
    'Administrator',
    'Full system access',
    permissions.map(p => p.permissionId),
    'system'
  );

  console.log(`✓ Created 3 permission groups: Analyst, Responder, Administrator`);

  // Step 3: Assign to roles
  console.log('\n[Step 3] Granting permissions to roles...');
  await service.bulkGrantPermissions(
    {
      permissionIds: [permissions[0].permissionId, permissions[3].permissionId],
      roleIds: ['role-analyst'],
      action: 'grant',
    },
    'system'
  );

  await service.bulkGrantPermissions(
    {
      permissionIds: permissions.map(p => p.permissionId),
      roleIds: ['role-admin'],
      action: 'grant',
    },
    'system'
  );

  console.log(`✓ Assigned permissions to roles`);

  // Step 4: Assign to users
  console.log('\n[Step 4] Assigning permissions to users...');
  await service.grantPermissionGroupToUser(analystGroup.groupId, 'emp-001', 'system');
  await service.grantPermissionGroupToUser(responderGroup.groupId, 'emp-002', 'system');
  await service.grantPermissionGroupToUser(adminGroup.groupId, 'emp-003', 'system');

  console.log(`✓ Assigned groups to users: emp-001 (Analyst), emp-002 (Responder), emp-003 (Admin)`);

  // Step 5: Verify permissions
  console.log('\n[Step 5] Verifying permissions...');
  const checks = [
    { userId: 'emp-001', resource: 'alert' as const, action: 'read' as const, expected: true },
    { userId: 'emp-001', resource: 'alert' as const, action: 'create' as const, expected: false },
    { userId: 'emp-002', resource: 'alert' as const, action: 'update' as const, expected: true },
    { userId: 'emp-003', resource: 'system' as const, action: 'manage' as const, expected: true },
  ];

  for (const check of checks) {
    const result = await service.checkPermission({
      userId: check.userId,
      resource: check.resource,
      action: check.action,
    });

    const status = result.allowed === check.expected ? '✓' : '✗';
    console.log(`${status} ${check.userId}: ${check.resource}:${check.action} = ${result.allowed}`);
  }

  // Step 6: Display statistics
  console.log('\n[Step 6] Final Statistics:');
  const stats = service.getStats();
  console.log(`  - Total Permissions: ${stats.totalPermissions}`);
  console.log(`  - Granted to Users: ${stats.permissionsGrantedToUsers}`);
  console.log(`  - Granted to Roles: ${stats.permissionsGrantedToRoles}`);
  console.log(`  - Total Events Logged: ${service.getAuditLog().length}`);
}

/**
 * Run all demos
 */
async function runAllDemos() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║         Permission Service - Demo Scenarios               ║');
  console.log('║           12 Comprehensive Demonstration Cases            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  try {
    await demo1_BasicPermissionCreation();
    await demo2_PermissionGroups();
    await demo3_UserPermissionAssignment();
    await demo4_RolePermissionAssignment();
    await demo5_TemporaryPermissionAssignment();
    await demo6_PermissionChecking();
    await demo7_BulkOperations();
    await demo8_PermissionGroupAssignment();
    await demo9_PermissionUpdates();
    await demo10_AuditLogging();
    await demo11_Statistics();
    await demo12_CompleteWorkflow();

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
