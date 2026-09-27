/**
 * Role Service - Demonstration Scenarios
 * Shows practical role management and hierarchy usage
 */

import { RoleService } from '../src/main';
import type { IRoleServiceConfig } from '../src/types';

/**
 * Initialize Role Service
 */
function initializeRoleService(): RoleService {
  const config: IRoleServiceConfig = {
    maxRoleDepth: 5,
    allowCyclicHierarchy: false,
    defaultPermissionInheritance: true,
    roleIdPrefix: 'role',
  };

  return new RoleService(config);
}

/**
 * SCENARIO 1: Basic Role Creation
 * Demonstrates creating system and custom roles
 */
async function scenario1BasicRoleCreation(): Promise<void> {
  console.log('\n=== SCENARIO 1: Basic Role Creation ===');

  const roleService = initializeRoleService();

  // Step 1: Create system roles
  console.log('Step 1: Creating system roles...');
  const adminRole = await roleService.createRole(
    {
      name: 'Administrator',
      description: 'Full system access',
      type: 'system',
      permissions: ['read', 'write', 'delete', 'admin', 'audit'],
    },
    'system'
  );
  console.log(`Created Admin Role: ${adminRole.roleId}`);

  const guestRole = await roleService.createRole(
    {
      name: 'Guest',
      description: 'Limited read access',
      type: 'system',
      permissions: ['read'],
    },
    'system'
  );
  console.log(`Created Guest Role: ${guestRole.roleId}`);

  // Step 2: Create custom roles
  console.log('\nStep 2: Creating custom roles...');
  const userRole = await roleService.createRole(
    {
      name: 'User',
      description: 'Standard user permissions',
      type: 'custom',
      permissions: ['read', 'write'],
    },
    'admin'
  );
  console.log(`Created User Role: ${userRole.roleId}`);
}

/**
 * SCENARIO 2: Role Hierarchy
 * Demonstrates parent-child role relationships
 */
async function scenario2RoleHierarchy(): Promise<void> {
  console.log('\n=== SCENARIO 2: Role Hierarchy ===');

  const roleService = initializeRoleService();

  // Step 1: Create parent role
  console.log('Step 1: Creating parent role...');
  const parentRole = await roleService.createRole(
    {
      name: 'Manager',
      description: 'Manager permissions',
      type: 'custom',
      permissions: ['read', 'write', 'approve'],
    },
    'admin'
  );
  console.log(`Created Parent Role: ${parentRole.name}`);

  // Step 2: Create child role
  console.log('\nStep 2: Creating child role (inherits from parent)...');
  const childRole = await roleService.createRole(
    {
      name: 'TeamLead',
      description: 'Team lead with team-specific permissions',
      type: 'custom',
      permissions: ['read', 'write', 'assign'],
      parentRoleId: parentRole.roleId,
    },
    'admin'
  );
  console.log(`Created Child Role: ${childRole.name}`);

  // Step 3: View hierarchy
  console.log('\nStep 3: Viewing role with hierarchy...');
  const roleWithHierarchy = await roleService.getRoleWithHierarchy(childRole.roleId);
  console.log(`Parent: ${roleWithHierarchy?.parentRole?.name}`);
  console.log(`Direct Permissions: ${roleWithHierarchy?.permissions.join(', ')}`);
  console.log(`Inherited Permissions: ${roleWithHierarchy?.inheritedPermissions.join(', ')}`);
  console.log(`All Permissions: ${roleWithHierarchy?.allPermissions.join(', ')}`);
}

/**
 * SCENARIO 3: Role Assignment
 * Demonstrates assigning roles to users
 */
async function scenario3RoleAssignment(): Promise<void> {
  console.log('\n=== SCENARIO 3: Role Assignment ===');

  const roleService = initializeRoleService();

  // Step 1: Create roles
  const adminRole = await roleService.createRole(
    {
      name: 'Admin',
      description: 'Admin',
      type: 'system',
      permissions: ['read', 'write', 'admin'],
    },
    'system'
  );

  const userRole = await roleService.createRole(
    {
      name: 'User',
      description: 'User',
      type: 'custom',
      permissions: ['read', 'write'],
    },
    'admin'
  );

  // Step 2: Assign roles to users
  console.log('Step 1: Assigning roles to users...');
  await roleService.assignRoleToUser('user-john', adminRole.roleId, 'admin');
  console.log('Assigned Admin role to john');

  await roleService.assignRoleToUser('user-jane', userRole.roleId, 'admin');
  console.log('Assigned User role to jane');

  await roleService.assignRoleToUser('user-bob', userRole.roleId, 'admin');
  console.log('Assigned User role to bob');

  // Step 3: Get user roles
  console.log('\nStep 2: Retrieving user roles...');
  const johnRoles = await roleService.getUserRoles('user-john');
  console.log(`John's roles: ${johnRoles.roles.map(r => r.name).join(', ')}`);
  console.log(`John's permissions: ${johnRoles.allPermissions.join(', ')}`);

  const janeRoles = await roleService.getUserRoles('user-jane');
  console.log(`Jane's roles: ${janeRoles.roles.map(r => r.name).join(', ')}`);
  console.log(`Jane's permissions: ${janeRoles.allPermissions.join(', ')}`);
}

/**
 * SCENARIO 4: Permission Management
 * Demonstrates granting and revoking permissions
 */
async function scenario4PermissionManagement(): Promise<void> {
  console.log('\n=== SCENARIO 4: Permission Management ===');

  const roleService = initializeRoleService();

  // Step 1: Create role
  const role = await roleService.createRole(
    {
      name: 'Moderator',
      description: 'Moderator role',
      type: 'custom',
      permissions: ['read', 'write'],
    },
    'admin'
  );
  console.log(`Step 1: Created role with permissions: ${role.permissions.join(', ')}`);

  // Step 2: Grant additional permissions
  console.log('\nStep 2: Granting additional permissions...');
  await roleService.grantPermissionToRole(role.roleId, 'moderate', 'admin');
  console.log('Granted moderate permission');

  await roleService.grantPermissionToRole(role.roleId, 'approve', 'admin');
  console.log('Granted approve permission');

  // Step 3: View updated role
  const updated = await roleService.getRole(role.roleId);
  console.log(`\nStep 3: Updated permissions: ${updated?.permissions.join(', ')}`);

  // Step 4: Revoke permission
  console.log('\nStep 4: Revoking permission...');
  await roleService.revokePermissionFromRole(role.roleId, 'approve', 'admin');
  console.log('Revoked approve permission');

  const final = await roleService.getRole(role.roleId);
  console.log(`Final permissions: ${final?.permissions.join(', ')}`);
}

/**
 * SCENARIO 5: Bulk Operations
 * Demonstrates bulk role assignment
 */
async function scenario5BulkOperations(): Promise<void> {
  console.log('\n=== SCENARIO 5: Bulk Operations ===');

  const roleService = initializeRoleService();

  // Step 1: Create role
  const userRole = await roleService.createRole(
    {
      name: 'User',
      description: 'Standard user',
      type: 'custom',
      permissions: ['read', 'write'],
    },
    'admin'
  );
  console.log('Step 1: Created user role');

  // Step 2: Bulk assign to multiple users
  console.log('\nStep 2: Bulk assigning role to 10 users...');
  const userIds = Array.from({ length: 10 }, (_, i) => `user-${i + 1}`);
  const result = await roleService.bulkAssignRole(
    {
      userIds,
      roleId: userRole.roleId,
      reason: 'New user onboarding',
    },
    'admin'
  );

  console.log(`Successful assignments: ${result.successful}/${result.totalRequested}`);
  console.log(`Failed assignments: ${result.failed}`);

  // Step 3: Bulk revoke
  console.log('\nStep 3: Bulk revoking role from 5 users...');
  const revokeResult = await roleService.bulkRevokeRole(
    {
      userIds: userIds.slice(0, 5),
      roleId: userRole.roleId,
    },
    'admin'
  );

  console.log(`Successful revokes: ${revokeResult.successful}/${revokeResult.totalRequested}`);
}

/**
 * SCENARIO 6: Temporary Roles
 * Demonstrates temporary role assignment with expiration
 */
async function scenario6TemporaryRoles(): Promise<void> {
  console.log('\n=== SCENARIO 6: Temporary Roles ===');

  const roleService = initializeRoleService();

  // Step 1: Create temporary role
  const tempRole = await roleService.createRole(
    {
      name: 'Contractor',
      description: 'Temporary contractor access',
      type: 'temporary',
      permissions: ['read', 'write'],
    },
    'admin'
  );
  console.log('Step 1: Created temporary role');

  // Step 2: Assign with expiration
  console.log('\nStep 2: Assigning temporary role with 7-day expiration...');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const assignment = await roleService.assignRoleToUser(
    'contractor-alice',
    tempRole.roleId,
    'admin',
    expiresAt,
    'Contract duration: 7 days'
  );

  console.log(`Assignment ID: ${assignment.assignmentId}`);
  console.log(`Expires at: ${assignment.expiresAt}`);

  // Step 3: Check expiring assignments
  console.log('\nStep 3: Checking expiring assignments...');
  const expiringAssignments = await roleService.getExpiringAssignments(10);
  console.log(`Assignments expiring within 10 days: ${expiringAssignments.length}`);
  expiringAssignments.forEach(exp => {
    console.log(`  - User: ${exp.userId}, Days until: ${exp.daysUntilExpiration}`);
  });
}

/**
 * SCENARIO 7: Role Comparison
 * Demonstrates comparing permissions between roles
 */
async function scenario7RoleComparison(): Promise<void> {
  console.log('\n=== SCENARIO 7: Role Comparison ===');

  const roleService = initializeRoleService();

  // Step 1: Create two roles
  const role1 = await roleService.createRole(
    {
      name: 'Editor',
      description: 'Editor role',
      type: 'custom',
      permissions: ['read', 'write', 'publish'],
    },
    'admin'
  );

  const role2 = await roleService.createRole(
    {
      name: 'Reviewer',
      description: 'Reviewer role',
      type: 'custom',
      permissions: ['read', 'review', 'approve'],
    },
    'admin'
  );

  console.log('Step 1: Created two roles for comparison');

  // Step 2: Compare roles
  console.log('\nStep 2: Comparing roles...');
  const comparison = roleService.compareRoles(role1.roleId, role2.roleId);

  console.log(`Common permissions: ${comparison.commonPermissions.join(', ')}`);
  console.log(`Unique to Editor: ${comparison.uniqueToRole1.join(', ')}`);
  console.log(`Unique to Reviewer: ${comparison.uniqueToRole2.join(', ')}`);
}

/**
 * SCENARIO 8: Permission Matrix
 * Demonstrates viewing full permission matrix
 */
async function scenario8PermissionMatrix(): Promise<void> {
  console.log('\n=== SCENARIO 8: Permission Matrix ===');

  const roleService = initializeRoleService();

  // Step 1: Create hierarchy
  const adminRole = await roleService.createRole(
    {
      name: 'Admin',
      description: 'Admin',
      type: 'system',
      permissions: ['admin', 'audit', 'delete'],
    },
    'system'
  );

  const modRole = await roleService.createRole(
    {
      name: 'Moderator',
      description: 'Moderator',
      type: 'custom',
      permissions: ['read', 'write', 'moderate'],
      parentRoleId: adminRole.roleId,
    },
    'admin'
  );

  console.log('Step 1: Created role hierarchy');

  // Step 2: Get permission matrices
  console.log('\nStep 2: Permission matrices...');
  const adminMatrix = roleService.getPermissionMatrix(adminRole.roleId);
  const modMatrix = roleService.getPermissionMatrix(modRole.roleId);

  console.log('\nAdmin role:');
  console.log(`  Direct: ${adminMatrix.directPermissions.join(', ')}`);
  console.log(`  Inherited: ${adminMatrix.inheritedPermissions.join(', ')}`);
  console.log(`  Total: ${adminMatrix.totalPermissions.join(', ')}`);

  console.log('\nModerator role:');
  console.log(`  Direct: ${modMatrix.directPermissions.join(', ')}`);
  console.log(`  Inherited: ${modMatrix.inheritedPermissions.join(', ')}`);
  console.log(`  Total: ${modMatrix.totalPermissions.join(', ')}`);
}

/**
 * SCENARIO 9: Event Monitoring
 * Demonstrates monitoring role events
 */
async function scenario9EventMonitoring(): Promise<void> {
  console.log('\n=== SCENARIO 9: Event Monitoring ===');

  const roleService = initializeRoleService();
  const events: any[] = [];

  // Step 1: Set up event listener
  console.log('Step 1: Setting up event listener...');
  roleService.onRole((event) => {
    events.push(event);
    console.log(`Event: ${event.type} - Role: ${event.roleId}`);
  });

  // Step 2: Trigger events
  console.log('\nStep 2: Creating roles (triggering events)...');
  const role1 = await roleService.createRole(
    {
      name: 'Role1',
      description: 'Role 1',
      type: 'custom',
      permissions: ['read'],
    },
    'admin'
  );

  await roleService.updateRole(role1.roleId, { permissions: ['read', 'write'] }, 'admin');

  await roleService.assignRoleToUser('user-1', role1.roleId, 'admin');

  // Step 3: Summary
  console.log(`\nStep 3: Event summary (${events.length} total events)`);
  const eventTypes = new Set(events.map(e => e.type));
  console.log(`Event types: ${Array.from(eventTypes).join(', ')}`);
}

/**
 * SCENARIO 10: Statistics Tracking
 * Demonstrates role service statistics
 */
async function scenario10Statistics(): Promise<void> {
  console.log('\n=== SCENARIO 10: Statistics Tracking ===');

  const roleService = initializeRoleService();

  // Step 1: Create various roles
  console.log('Step 1: Creating roles...');
  for (let i = 0; i < 5; i++) {
    await roleService.createRole(
      {
        name: `CustomRole${i}`,
        description: `Custom role ${i}`,
        type: 'custom',
        permissions: ['read'],
      },
      'admin'
    );
  }

  // Step 2: Assign roles
  console.log('Step 2: Assigning roles to users...');
  const roles = await roleService.getAllRoles();
  for (let i = 0; i < 10; i++) {
    await roleService.assignRoleToUser(`user-${i}`, roles[i % roles.length].roleId, 'admin');
  }

  // Step 3: Get statistics
  console.log('\nStep 3: Role Statistics:');
  const stats = roleService.getStats();
  console.log(`  Total Roles: ${stats.totalRoles}`);
  console.log(`  Active Roles: ${stats.activeRoles}`);
  console.log(`  Custom Roles: ${stats.customRoles}`);
  console.log(`  Total Assignments: ${stats.totalAssignments}`);
  console.log(`  Unique Users: ${stats.userCount}`);
  console.log(`  Errors: ${stats.errors}`);
}

/**
 * SCENARIO 11: Complete RBAC Setup
 * Demonstrates complete role-based access control setup
 */
async function scenario11CompleteRBACSetup(): Promise<void> {
  console.log('\n=== SCENARIO 11: Complete RBAC Setup ===');

  const roleService = initializeRoleService();

  // Step 1: Create role hierarchy
  console.log('Step 1: Creating role hierarchy...');

  const superAdmin = await roleService.createRole(
    {
      name: 'SuperAdmin',
      description: 'Super administrator',
      type: 'system',
      permissions: ['*'],
    },
    'system'
  );

  const admin = await roleService.createRole(
    {
      name: 'Admin',
      description: 'Administrator',
      type: 'system',
      permissions: ['admin', 'audit', 'user_management'],
      parentRoleId: superAdmin.roleId,
    },
    'system'
  );

  const manager = await roleService.createRole(
    {
      name: 'Manager',
      description: 'Manager',
      type: 'custom',
      permissions: ['read', 'write', 'approve', 'assign'],
      parentRoleId: admin.roleId,
    },
    'admin'
  );

  const user = await roleService.createRole(
    {
      name: 'User',
      description: 'Regular user',
      type: 'custom',
      permissions: ['read', 'write'],
      parentRoleId: manager.roleId,
    },
    'admin'
  );

  console.log('Role hierarchy created');

  // Step 2: Assign roles to organization
  console.log('\nStep 2: Assigning roles...');
  await roleService.assignRoleToUser('alice', superAdmin.roleId, 'system');
  await roleService.assignRoleToUser('bob', admin.roleId, 'admin');
  await roleService.assignRoleToUser('charlie', manager.roleId, 'admin');
  await roleService.assignRoleToUser('david', user.roleId, 'admin');

  // Step 3: Verify access levels
  console.log('\nStep 3: Verifying access levels...');

  const aliceAccess = await roleService.getUserRoles('alice');
  console.log(`Alice permissions: ${aliceAccess.allPermissions.join(', ')}`);

  const davidAccess = await roleService.getUserRoles('david');
  console.log(`David permissions: ${davidAccess.allPermissions.join(', ')}`);

  console.log(`\nAccess levels properly configured with inheritance`);
}

/**
 * SCENARIO 12: Audit Trail
 * Demonstrates audit logging capabilities
 */
async function scenario12AuditTrail(): Promise<void> {
  console.log('\n=== SCENARIO 12: Audit Trail ===');

  const roleService = initializeRoleService();

  // Step 1: Perform various operations
  console.log('Step 1: Performing role operations...');
  const role = await roleService.createRole(
    {
      name: 'AuditedRole',
      description: 'For audit demonstration',
      type: 'custom',
      permissions: ['read'],
    },
    'admin'
  );

  await roleService.updateRole(role.roleId, { permissions: ['read', 'write'] }, 'admin');
  await roleService.grantPermissionToRole(role.roleId, 'moderate', 'admin');
  await roleService.assignRoleToUser('user-audit', role.roleId, 'admin');

  // Step 2: Review audit log
  console.log('\nStep 2: Audit log entries (last 5):');
  const auditLog = roleService.getAuditLog(5);
  auditLog.forEach((entry, index) => {
    console.log(`  ${index + 1}. ${entry.action} - Role: ${entry.roleId} - By: ${entry.performedBy}`);
  });
}

/**
 * Run all demo scenarios
 */
async function runAllScenarios(): Promise<void> {
  try {
    await scenario1BasicRoleCreation();
    await scenario2RoleHierarchy();
    await scenario3RoleAssignment();
    await scenario4PermissionManagement();
    await scenario5BulkOperations();
    await scenario6TemporaryRoles();
    await scenario7RoleComparison();
    await scenario8PermissionMatrix();
    await scenario9EventMonitoring();
    await scenario10Statistics();
    await scenario11CompleteRBACSetup();
    await scenario12AuditTrail();

    console.log('\n=== ALL SCENARIOS COMPLETED ===\n');
  } catch (error) {
    console.error('Error running scenarios:', error);
  }
}

// Export scenarios for individual testing
export {
  scenario1BasicRoleCreation,
  scenario2RoleHierarchy,
  scenario3RoleAssignment,
  scenario4PermissionManagement,
  scenario5BulkOperations,
  scenario6TemporaryRoles,
  scenario7RoleComparison,
  scenario8PermissionMatrix,
  scenario9EventMonitoring,
  scenario10Statistics,
  scenario11CompleteRBACSetup,
  scenario12AuditTrail,
  runAllScenarios,
};

// Run all scenarios if executed directly
if (require.main === module) {
  runAllScenarios().catch(console.error);
}
