/**
 * Role Service - Unit Tests
 * Comprehensive test suite for role management and hierarchy
 */

import { RoleService, createRoleService } from '../../src/main';
import type { IRoleServiceConfig } from '../../src/types';

describe('RoleService', () => {
  let service: RoleService;
  const config: IRoleServiceConfig = {
    maxRoleDepth: 5,
    allowCyclicHierarchy: false,
    defaultPermissionInheritance: true,
    roleIdPrefix: 'role',
  };

  beforeEach(() => {
    service = new RoleService(config);
  });

  // ============================================================
  // Service Creation Tests
  // ============================================================

  describe('Service Creation', () => {
    test('should create role service instance', () => {
      expect(service).toBeInstanceOf(RoleService);
    });

    test('should create service via factory', () => {
      const srv = createRoleService(config);
      expect(srv).toBeInstanceOf(RoleService);
    });

    test('should throw error with invalid config', () => {
      expect(() => {
        new RoleService({
          ...config,
          maxRoleDepth: 0,
        });
      }).toThrow();
    });

    test('should initialize empty stats', () => {
      const stats = service.getStats();
      expect(stats.totalRoles).toBe(0);
      expect(stats.activeRoles).toBe(0);
      expect(stats.totalAssignments).toBe(0);
      expect(stats.errors).toBe(0);
    });
  });

  // ============================================================
  // Role Creation Tests
  // ============================================================

  describe('Role Creation', () => {
    test('should create role', async () => {
      const role = await service.createRole(
        {
          name: 'Admin',
          description: 'Administrator role',
          type: 'system',
          permissions: ['read', 'write', 'delete'],
        },
        'admin'
      );

      expect(role.roleId).toBeDefined();
      expect(role.name).toBe('Admin');
      expect(role.type).toBe('system');
      expect(role.permissions).toContain('read');
    });

    test('should create custom role', async () => {
      const role = await service.createRole(
        {
          name: 'Viewer',
          description: 'View-only role',
          type: 'custom',
          permissions: ['read'],
        },
        'admin'
      );

      expect(role.type).toBe('custom');
    });

    test('should create role with hierarchy', async () => {
      const parent = await service.createRole(
        {
          name: 'Parent',
          description: 'Parent role',
          type: 'system',
          permissions: ['read', 'write'],
        },
        'admin'
      );

      const child = await service.createRole(
        {
          name: 'Child',
          description: 'Child role',
          type: 'custom',
          permissions: ['read'],
          parentRoleId: parent.roleId,
        },
        'admin'
      );

      expect(child.parentRoleId).toBe(parent.roleId);
    });

    test('should reject invalid parent role', async () => {
      await expect(
        service.createRole(
          {
            name: 'Child',
            description: 'Child role',
            type: 'custom',
            parentRoleId: 'nonexistent',
          },
          'admin'
        )
      ).rejects.toThrow('Parent role not found');
    });

    test('should reject cyclic hierarchy', async () => {
      const role1 = await service.createRole(
        {
          name: 'Role1',
          description: 'Role 1',
          type: 'custom',
        },
        'admin'
      );

      const role2 = await service.createRole(
        {
          name: 'Role2',
          description: 'Role 2',
          type: 'custom',
          parentRoleId: role1.roleId,
        },
        'admin'
      );

      await expect(
        service.createRole(
          {
            name: 'Role3',
            description: 'Role 3',
            type: 'custom',
            parentRoleId: role2.roleId,
          },
          'admin'
        )
      ).resolves.toBeDefined();
    });

    test('should track role creation statistics', async () => {
      await service.createRole(
        {
          name: 'Admin',
          description: 'Admin role',
          type: 'system',
        },
        'admin'
      );

      await service.createRole(
        {
          name: 'User',
          description: 'User role',
          type: 'custom',
        },
        'admin'
      );

      const stats = service.getStats();
      expect(stats.totalRoles).toBe(2);
      expect(stats.systemRoles).toBe(1);
      expect(stats.customRoles).toBe(1);
    });
  });

  // ============================================================
  // Role Retrieval Tests
  // ============================================================

  describe('Role Retrieval', () => {
    test('should get role by ID', async () => {
      const created = await service.createRole(
        {
          name: 'Test Role',
          description: 'Test',
          type: 'custom',
        },
        'admin'
      );

      const retrieved = await service.getRole(created.roleId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Role');
    });

    test('should return null for non-existent role', async () => {
      const retrieved = await service.getRole('nonexistent');
      expect(retrieved).toBeNull();
    });

    test('should get role with hierarchy', async () => {
      const parent = await service.createRole(
        {
          name: 'Parent',
          description: 'Parent',
          type: 'system',
          permissions: ['read', 'write'],
        },
        'admin'
      );

      const child = await service.createRole(
        {
          name: 'Child',
          description: 'Child',
          type: 'custom',
          permissions: ['read'],
          parentRoleId: parent.roleId,
        },
        'admin'
      );

      const retrieved = await service.getRoleWithHierarchy(child.roleId);
      expect(retrieved?.parentRole?.roleId).toBe(parent.roleId);
      expect(retrieved?.inheritedPermissions).toContain('write');
    });

    test('should get all roles', async () => {
      await service.createRole(
        {
          name: 'Role1',
          description: 'Role 1',
          type: 'system',
        },
        'admin'
      );

      await service.createRole(
        {
          name: 'Role2',
          description: 'Role 2',
          type: 'custom',
        },
        'admin'
      );

      const roles = await service.getAllRoles();
      expect(roles.length).toBeGreaterThanOrEqual(2);
    });

    test('should filter roles by status', async () => {
      const role = await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'custom',
        },
        'admin'
      );

      const active = await service.getAllRoles('active');
      expect(active.some(r => r.roleId === role.roleId)).toBe(true);
    });
  });

  // ============================================================
  // Role Update Tests
  // ============================================================

  describe('Role Update', () => {
    test('should update role', async () => {
      const role = await service.createRole(
        {
          name: 'Original',
          description: 'Original',
          type: 'custom',
        },
        'admin'
      );

      const updated = await service.updateRole(
        role.roleId,
        {
          name: 'Updated',
          description: 'Updated description',
        },
        'admin'
      );

      expect(updated.name).toBe('Updated');
      expect(updated.description).toBe('Updated description');
    });

    test('should update role status', async () => {
      const role = await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'custom',
        },
        'admin'
      );

      const updated = await service.updateRole(
        role.roleId,
        {
          status: 'inactive',
        },
        'admin'
      );

      expect(updated.status).toBe('inactive');
    });

    test('should update role permissions', async () => {
      const role = await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'custom',
          permissions: ['read'],
        },
        'admin'
      );

      const updated = await service.updateRole(
        role.roleId,
        {
          permissions: ['read', 'write', 'delete'],
        },
        'admin'
      );

      expect(updated.permissions).toHaveLength(3);
      expect(updated.permissions).toContain('write');
    });

    test('should update role hierarchy', async () => {
      const role1 = await service.createRole(
        {
          name: 'Role1',
          description: 'Role 1',
          type: 'custom',
        },
        'admin'
      );

      const role2 = await service.createRole(
        {
          name: 'Role2',
          description: 'Role 2',
          type: 'custom',
        },
        'admin'
      );

      const updated = await service.updateRole(
        role1.roleId,
        {
          parentRoleId: role2.roleId,
        },
        'admin'
      );

      expect(updated.parentRoleId).toBe(role2.roleId);
    });
  });

  // ============================================================
  // Role Deletion Tests
  // ============================================================

  describe('Role Deletion', () => {
    test('should delete role', async () => {
      const role = await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'custom',
        },
        'admin'
      );

      const deleted = await service.deleteRole(role.roleId, 'admin');
      expect(deleted).toBe(true);

      const retrieved = await service.getRole(role.roleId);
      expect(retrieved).toBeNull();
    });

    test('should return false for non-existent role', async () => {
      const deleted = await service.deleteRole('nonexistent', 'admin');
      expect(deleted).toBe(false);
    });

    test('should prevent deleting role with children', async () => {
      const parent = await service.createRole(
        {
          name: 'Parent',
          description: 'Parent',
          type: 'custom',
        },
        'admin'
      );

      await service.createRole(
        {
          name: 'Child',
          description: 'Child',
          type: 'custom',
          parentRoleId: parent.roleId,
        },
        'admin'
      );

      await expect(service.deleteRole(parent.roleId, 'admin')).rejects.toThrow(
        'Cannot delete role with child roles'
      );
    });

    test('should update statistics on deletion', async () => {
      const role = await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'system',
        },
        'admin'
      );

      await service.deleteRole(role.roleId, 'admin');

      const stats = service.getStats();
      expect(stats.totalRoles).toBe(0);
      expect(stats.systemRoles).toBe(0);
    });
  });

  // ============================================================
  // Role Assignment Tests
  // ============================================================

  describe('Role Assignment', () => {
    test('should assign role to user', async () => {
      const role = await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'custom',
        },
        'admin'
      );

      const assignment = await service.assignRoleToUser('user-123', role.roleId, 'admin');
      expect(assignment.userId).toBe('user-123');
      expect(assignment.roleId).toBe(role.roleId);
    });

    test('should assign role with expiration', async () => {
      const role = await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'custom',
        },
        'admin'
      );

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const assignment = await service.assignRoleToUser('user-123', role.roleId, 'admin', expiresAt);

      expect(assignment.expiresAt).toBeDefined();
    });

    test('should revoke role from user', async () => {
      const role = await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'custom',
        },
        'admin'
      );

      await service.assignRoleToUser('user-123', role.roleId, 'admin');
      const revoked = await service.revokeRoleFromUser('user-123', role.roleId, 'admin');

      expect(revoked).toBe(true);
    });

    test('should get user roles', async () => {
      const role1 = await service.createRole(
        {
          name: 'Role1',
          description: 'Role 1',
          type: 'custom',
          permissions: ['read'],
        },
        'admin'
      );

      const role2 = await service.createRole(
        {
          name: 'Role2',
          description: 'Role 2',
          type: 'custom',
          permissions: ['write'],
        },
        'admin'
      );

      await service.assignRoleToUser('user-123', role1.roleId, 'admin');
      await service.assignRoleToUser('user-123', role2.roleId, 'admin');

      const userRoles = await service.getUserRoles('user-123');
      expect(userRoles.roles).toHaveLength(2);
      expect(userRoles.allPermissions).toContain('read');
      expect(userRoles.allPermissions).toContain('write');
    });

    test('should get role assignments', async () => {
      const role = await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'custom',
        },
        'admin'
      );

      await service.assignRoleToUser('user-1', role.roleId, 'admin');
      await service.assignRoleToUser('user-2', role.roleId, 'admin');

      const assignments = await service.getRoleAssignments(role.roleId);
      expect(assignments.length).toBe(2);
    });

    test('should track assignment statistics', async () => {
      const role = await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'custom',
        },
        'admin'
      );

      await service.assignRoleToUser('user-1', role.roleId, 'admin');
      await service.assignRoleToUser('user-2', role.roleId, 'admin');

      const stats = service.getStats();
      expect(stats.totalAssignments).toBe(2);
      expect(stats.userCount).toBe(2);
    });
  });

  // ============================================================
  // Permission Management Tests
  // ============================================================

  describe('Permission Management', () => {
    test('should grant permission to role', async () => {
      const role = await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'custom',
          permissions: ['read'],
        },
        'admin'
      );

      const granted = await service.grantPermissionToRole(role.roleId, 'write', 'admin');
      expect(granted).toBe(true);

      const updated = await service.getRole(role.roleId);
      expect(updated?.permissions).toContain('write');
    });

    test('should revoke permission from role', async () => {
      const role = await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'custom',
          permissions: ['read', 'write'],
        },
        'admin'
      );

      const revoked = await service.revokePermissionFromRole(role.roleId, 'write', 'admin');
      expect(revoked).toBe(true);

      const updated = await service.getRole(role.roleId);
      expect(updated?.permissions).not.toContain('write');
    });

    test('should handle permission inheritance', async () => {
      const parent = await service.createRole(
        {
          name: 'Parent',
          description: 'Parent',
          type: 'system',
          permissions: ['read', 'write'],
        },
        'admin'
      );

      const child = await service.createRole(
        {
          name: 'Child',
          description: 'Child',
          type: 'custom',
          permissions: ['read'],
          parentRoleId: parent.roleId,
        },
        'admin'
      );

      const roleWithHierarchy = await service.getRoleWithHierarchy(child.roleId);
      expect(roleWithHierarchy?.inheritedPermissions).toContain('write');
      expect(roleWithHierarchy?.allPermissions).toContain('write');
    });
  });

  // ============================================================
  // Bulk Operations Tests
  // ============================================================

  describe('Bulk Operations', () => {
    test('should bulk assign role', async () => {
      const role = await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'custom',
        },
        'admin'
      );

      const result = await service.bulkAssignRole(
        {
          userIds: ['user-1', 'user-2', 'user-3'],
          roleId: role.roleId,
        },
        'admin'
      );

      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
    });

    test('should bulk revoke role', async () => {
      const role = await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'custom',
        },
        'admin'
      );

      await service.assignRoleToUser('user-1', role.roleId, 'admin');
      await service.assignRoleToUser('user-2', role.roleId, 'admin');

      const result = await service.bulkRevokeRole(
        {
          userIds: ['user-1', 'user-2'],
          roleId: role.roleId,
        },
        'admin'
      );

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
    });

    test('should handle bulk operation errors', async () => {
      const result = await service.bulkAssignRole(
        {
          userIds: ['user-1', 'user-2'],
          roleId: 'nonexistent',
        },
        'admin'
      );

      expect(result.successful).toBe(0);
      expect(result.failed).toBe(2);
    });
  });

  // ============================================================
  // Role Comparison Tests
  // ============================================================

  describe('Role Comparison', () => {
    test('should compare roles', async () => {
      const role1 = await service.createRole(
        {
          name: 'Role1',
          description: 'Role 1',
          type: 'custom',
          permissions: ['read', 'write'],
        },
        'admin'
      );

      const role2 = await service.createRole(
        {
          name: 'Role2',
          description: 'Role 2',
          type: 'custom',
          permissions: ['write', 'delete'],
        },
        'admin'
      );

      const comparison = service.compareRoles(role1.roleId, role2.roleId);
      expect(comparison.commonPermissions).toContain('write');
      expect(comparison.uniqueToRole1).toContain('read');
      expect(comparison.uniqueToRole2).toContain('delete');
    });

    test('should get permission matrix', async () => {
      const parent = await service.createRole(
        {
          name: 'Parent',
          description: 'Parent',
          type: 'system',
          permissions: ['read', 'write'],
        },
        'admin'
      );

      const child = await service.createRole(
        {
          name: 'Child',
          description: 'Child',
          type: 'custom',
          permissions: ['read'],
          parentRoleId: parent.roleId,
        },
        'admin'
      );

      const matrix = service.getPermissionMatrix(child.roleId);
      expect(matrix.directPermissions).toContain('read');
      expect(matrix.inheritedPermissions).toContain('write');
      expect(matrix.totalPermissions).toHaveLength(2);
    });
  });

  // ============================================================
  // Expiration Tests
  // ============================================================

  describe('Expiration Handling', () => {
    test('should get expiring assignments', async () => {
      const role = await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'custom',
        },
        'admin'
      );

      const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      await service.assignRoleToUser('user-123', role.roleId, 'admin', expiresAt);

      const expiringassignments = await service.getExpiringAssignments(7);
      expect(expiringassignments.length).toBeGreaterThan(0);
    });

    test('should cleanup expired assignments', async () => {
      const role = await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'custom',
        },
        'admin'
      );

      const expiredAt = new Date(Date.now() - 1000);
      await service.assignRoleToUser('user-123', role.roleId, 'admin', expiredAt);

      const cleaned = await service.cleanupExpiredAssignments();
      expect(cleaned).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // Event Listener Tests
  // ============================================================

  describe('Event Listeners', () => {
    test('should emit role creation event', async () => {
      const events: any[] = [];
      service.onRole((event) => events.push(event));

      await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'custom',
        },
        'admin'
      );

      const createdEvent = events.find(e => e.type === 'role_created');
      expect(createdEvent).toBeDefined();
    });

    test('should support multiple listeners', async () => {
      const events1: any[] = [];
      const events2: any[] = [];

      service.onRole((event) => events1.push(event));
      service.onRole((event) => events2.push(event));

      await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'custom',
        },
        'admin'
      );

      expect(events1.length).toBeGreaterThan(0);
      expect(events2.length).toBeGreaterThan(0);
    });

    test('should remove listener', async () => {
      const events: any[] = [];
      const listener = (event: any) => events.push(event);

      service.onRole(listener);
      service.offRole(listener);

      await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'custom',
        },
        'admin'
      );

      expect(events.length).toBe(0);
    });

    test('should chain listener registration', () => {
      const listener = jest.fn();
      const result = service.onRole(listener).onRole(listener);

      expect(result).toBe(service);
    });
  });

  // ============================================================
  // Statistics Tests
  // ============================================================

  describe('Statistics', () => {
    test('should track role creation', async () => {
      await service.createRole(
        {
          name: 'Test1',
          description: 'Test 1',
          type: 'system',
        },
        'admin'
      );

      await service.createRole(
        {
          name: 'Test2',
          description: 'Test 2',
          type: 'custom',
        },
        'admin'
      );

      const stats = service.getStats();
      expect(stats.totalRoles).toBe(2);
      expect(stats.systemRoles).toBe(1);
      expect(stats.customRoles).toBe(1);
    });

    test('should return immutable stats', () => {
      const stats1 = service.getStats();
      const stats2 = service.getStats();

      expect(stats1).toEqual(stats2);
      expect(stats1).not.toBe(stats2);
    });
  });

  // ============================================================
  // Audit Log Tests
  // ============================================================

  describe('Audit Log', () => {
    test('should maintain audit log', async () => {
      const role = await service.createRole(
        {
          name: 'Test',
          description: 'Test',
          type: 'custom',
        },
        'admin'
      );

      await service.updateRole(role.roleId, { name: 'Updated' }, 'admin');

      const log = service.getAuditLog();
      expect(log.length).toBeGreaterThan(0);
    });

    test('should limit audit log retrieval', async () => {
      for (let i = 0; i < 150; i++) {
        await service.createRole(
          {
            name: `Role${i}`,
            description: `Role ${i}`,
            type: 'custom',
          },
          'admin'
        );
      }

      const log = service.getAuditLog(100);
      expect(log.length).toBe(100);
    });
  });

  // ============================================================
  // Integration Tests
  // ============================================================

  describe('Integration Scenarios', () => {
    test('should complete role hierarchy and assignment flow', async () => {
      // Step 1: Create role hierarchy
      const admin = await service.createRole(
        {
          name: 'Admin',
          description: 'Administrator',
          type: 'system',
          permissions: ['read', 'write', 'delete', 'admin'],
        },
        'system'
      );

      const moderator = await service.createRole(
        {
          name: 'Moderator',
          description: 'Moderator',
          type: 'custom',
          permissions: ['read', 'write', 'moderate'],
          parentRoleId: admin.roleId,
        },
        'admin'
      );

      const viewer = await service.createRole(
        {
          name: 'Viewer',
          description: 'Viewer',
          type: 'custom',
          permissions: ['read'],
          parentRoleId: moderator.roleId,
        },
        'admin'
      );

      // Step 2: Assign roles to users
      await service.assignRoleToUser('user-1', admin.roleId, 'admin');
      await service.assignRoleToUser('user-2', moderator.roleId, 'admin');
      await service.assignRoleToUser('user-3', viewer.roleId, 'admin');

      // Step 3: Verify permissions
      const user1Roles = await service.getUserRoles('user-1');
      expect(user1Roles.allPermissions).toContain('admin');

      const user3Roles = await service.getUserRoles('user-3');
      expect(user3Roles.allPermissions).toContain('read');
      expect(user3Roles.allPermissions).toContain('write');
      expect(user3Roles.allPermissions).toContain('moderate');
      expect(user3Roles.allPermissions).not.toContain('admin');
    });

    test('should handle role update with hierarchy', async () => {
      const role1 = await service.createRole(
        {
          name: 'Role1',
          description: 'Role 1',
          type: 'custom',
        },
        'admin'
      );

      const role2 = await service.createRole(
        {
          name: 'Role2',
          description: 'Role 2',
          type: 'custom',
        },
        'admin'
      );

      const updated = await service.updateRole(
        role1.roleId,
        {
          parentRoleId: role2.roleId,
        },
        'admin'
      );

      expect(updated.parentRoleId).toBe(role2.roleId);
    });

    test('should manage temporary role assignments', async () => {
      const role = await service.createRole(
        {
          name: 'TemporaryRole',
          description: 'Temporary',
          type: 'temporary',
          permissions: ['read'],
        },
        'admin'
      );

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await service.assignRoleToUser('user-123', role.roleId, 'admin', expiresAt);

      const userRoles = await service.getUserRoles('user-123');
      expect(userRoles.roles).toHaveLength(1);

      const expiring = await service.getExpiringAssignments(2);
      expect(expiring.length).toBeGreaterThan(0);
    });
  });
});
