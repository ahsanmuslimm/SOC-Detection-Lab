/**
 * Permission Service - Unit Tests
 * Comprehensive test suite for fine-grained permission management
 */

import { PermissionService, createPermissionService } from '../../src/main';
import type {
  IPermissionServiceConfig,
  ICreatePermissionRequest,
  IPermissionCheckRequest,
} from '../../src/types';

describe('PermissionService', () => {
  let service: PermissionService;
  const config: IPermissionServiceConfig = {
    enableResourceScoping: true,
    enableGrouping: true,
    maxPermissionsPerUser: 1000,
    permissionCacheTimeout: 5000,
    cacheSize: 500,
  };

  beforeEach(() => {
    service = new PermissionService(config);
  });

  // ============================================================
  // Service Creation Tests
  // ============================================================

  describe('Service Creation', () => {
    test('should create permission service instance', () => {
      expect(service).toBeInstanceOf(PermissionService);
    });

    test('should create service via factory', () => {
      const srv = createPermissionService(config);
      expect(srv).toBeInstanceOf(PermissionService);
    });

    test('should throw error with invalid config', () => {
      expect(() => {
        new PermissionService({
          ...config,
          maxPermissionsPerUser: 0,
        });
      }).toThrow('maxPermissionsPerUser must be greater than 0');
    });

    test('should initialize empty stats', () => {
      const stats = service.getStats();
      expect(stats.totalPermissions).toBe(0);
      expect(stats.activePermissions).toBe(0);
      expect(stats.permissionsGrantedToUsers).toBe(0);
      expect(stats.errors).toBe(0);
    });
  });

  // ============================================================
  // Permission Creation Tests
  // ============================================================

  describe('Permission Creation', () => {
    test('should create permission', async () => {
      const request: ICreatePermissionRequest = {
        name: 'Read Reports',
        description: 'Permission to read security reports',
        resource: 'report',
        action: 'read',
        priority: 100,
      };

      const perm = await service.createPermission(request, 'admin');

      expect(perm.permissionId).toBeDefined();
      expect(perm.name).toBe('Read Reports');
      expect(perm.resource).toBe('report');
      expect(perm.action).toBe('read');
      expect(perm.isActive).toBe(true);
      expect(perm.createdBy).toBe('admin');
    });

    test('should create permission with scope', async () => {
      const perm = await service.createPermission(
        {
          name: 'Scoped Permission',
          resource: 'report',
          action: 'read',
          scope: 'security:*',
        },
        'admin'
      );

      expect(perm.scope).toBe('security:*');
    });

    test('should throw error with missing required fields', async () => {
      await expect(
        service.createPermission(
          {
            name: '',
            resource: 'report',
            action: 'read',
          },
          'admin'
        )
      ).rejects.toThrow();
    });

    test('should increment stats on creation', async () => {
      const stats1 = service.getStats();
      const initialCount = stats1.totalPermissions;

      await service.createPermission(
        {
          name: 'Test',
          resource: 'report',
          action: 'read',
        },
        'admin'
      );

      const stats2 = service.getStats();
      expect(stats2.totalPermissions).toBe(initialCount + 1);
      expect(stats2.activePermissions).toBe(initialCount + 1);
    });

    test('should track resource and action types', async () => {
      await service.createPermission(
        {
          name: 'User Read',
          resource: 'user',
          action: 'read',
        },
        'admin'
      );

      await service.createPermission(
        {
          name: 'User Write',
          resource: 'user',
          action: 'write',
        },
        'admin'
      );

      const stats = service.getStats();
      expect(stats.resourceTypes.user).toBe(2);
      expect(stats.actionTypes.read).toBe(1);
      expect(stats.actionTypes.write).toBe(1);
    });
  });

  // ============================================================
  // Permission Retrieval Tests
  // ============================================================

  describe('Permission Retrieval', () => {
    test('should get permission by ID', async () => {
      const created = await service.createPermission(
        {
          name: 'Test Perm',
          resource: 'user',
          action: 'read',
        },
        'admin'
      );

      const retrieved = await service.getPermission(created.permissionId);
      expect(retrieved).toEqual(created);
    });

    test('should return null for non-existent permission', async () => {
      const perm = await service.getPermission('nonexistent');
      expect(perm).toBeNull();
    });

    test('should get permission with details', async () => {
      const perm = await service.createPermission(
        {
          name: 'Test',
          resource: 'user',
          action: 'read',
        },
        'admin'
      );

      const details = await service.getPermissionWithDetails(perm.permissionId);
      expect(details).toBeDefined();
      expect(details?.rolesCount).toBe(0);
      expect(details?.usersCount).toBe(0);
    });

    test('should get all permissions', async () => {
      await service.createPermission(
        {
          name: 'Perm1',
          resource: 'report',
          action: 'read',
        },
        'admin'
      );

      await service.createPermission(
        {
          name: 'Perm2',
          resource: 'user',
          action: 'write',
        },
        'admin'
      );

      const all = await service.getAllPermissions();
      expect(all.length).toBe(2);
    });

    test('should filter permissions by resource', async () => {
      await service.createPermission(
        {
          name: 'Report Read',
          resource: 'report',
          action: 'read',
        },
        'admin'
      );

      await service.createPermission(
        {
          name: 'User Write',
          resource: 'user',
          action: 'write',
        },
        'admin'
      );

      const reports = await service.getAllPermissions('report');
      expect(reports.length).toBe(1);
      expect(reports[0].resource).toBe('report');
    });

    test('should filter permissions by action', async () => {
      await service.createPermission(
        {
          name: 'Report Read',
          resource: 'report',
          action: 'read',
        },
        'admin'
      );

      await service.createPermission(
        {
          name: 'User Read',
          resource: 'user',
          action: 'read',
        },
        'admin'
      );

      const reads = await service.getAllPermissions(undefined, 'read');
      expect(reads.length).toBe(2);
    });
  });

  // ============================================================
  // Permission Update Tests
  // ============================================================

  describe('Permission Update', () => {
    test('should update permission', async () => {
      const perm = await service.createPermission(
        {
          name: 'Original',
          resource: 'report',
          action: 'read',
        },
        'admin'
      );

      const updated = await service.updatePermission(
        perm.permissionId,
        {
          name: 'Updated',
          description: 'New description',
        },
        'admin'
      );

      expect(updated.name).toBe('Updated');
      expect(updated.description).toBe('New description');
    });

    test('should update priority', async () => {
      const perm = await service.createPermission(
        {
          name: 'Test',
          resource: 'user',
          action: 'read',
          priority: 100,
        },
        'admin'
      );

      const updated = await service.updatePermission(
        perm.permissionId,
        { priority: 200 },
        'admin'
      );

      expect(updated.priority).toBe(200);
    });

    test('should deactivate permission', async () => {
      const perm = await service.createPermission(
        {
          name: 'Test',
          resource: 'user',
          action: 'read',
        },
        'admin'
      );

      const updated = await service.updatePermission(
        perm.permissionId,
        { isActive: false },
        'admin'
      );

      expect(updated.isActive).toBe(false);
    });

    test('should throw error for non-existent permission', async () => {
      await expect(
        service.updatePermission('nonexistent', { name: 'Test' }, 'admin')
      ).rejects.toThrow('Permission not found');
    });
  });

  // ============================================================
  // Permission Deletion Tests
  // ============================================================

  describe('Permission Deletion', () => {
    test('should delete permission', async () => {
      const perm = await service.createPermission(
        {
          name: 'Test',
          resource: 'user',
          action: 'read',
        },
        'admin'
      );

      const deleted = await service.deletePermission(perm.permissionId, 'admin');
      expect(deleted).toBe(true);

      const retrieved = await service.getPermission(perm.permissionId);
      expect(retrieved).toBeNull();
    });

    test('should decrement stats on deletion', async () => {
      const perm = await service.createPermission(
        {
          name: 'Test',
          resource: 'user',
          action: 'read',
        },
        'admin'
      );

      const stats1 = service.getStats();
      const initialCount = stats1.totalPermissions;

      await service.deletePermission(perm.permissionId, 'admin');

      const stats2 = service.getStats();
      expect(stats2.totalPermissions).toBe(initialCount - 1);
    });

    test('should throw error for non-existent permission', async () => {
      await expect(
        service.deletePermission('nonexistent', 'admin')
      ).rejects.toThrow('Permission not found');
    });
  });

  // ============================================================
  // User Permission Tests
  // ============================================================

  describe('User Permissions', () => {
    let permId: string;

    beforeEach(async () => {
      const perm = await service.createPermission(
        {
          name: 'Test',
          resource: 'user',
          action: 'read',
        },
        'admin'
      );
      permId = perm.permissionId;
    });

    test('should grant permission to user', async () => {
      const userPerm = await service.grantPermissionToUser(
        permId,
        'user-123',
        'admin'
      );

      expect(userPerm.userId).toBe('user-123');
      expect(userPerm.permissionId).toBe(permId);
      expect(userPerm.grantedBy).toBe('admin');
    });

    test('should grant permission with expiration', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const userPerm = await service.grantPermissionToUser(
        permId,
        'user-123',
        'admin',
        expiresAt,
        'Temporary access'
      );

      expect(userPerm.expiresAt).toEqual(expiresAt);
      expect(userPerm.reason).toBe('Temporary access');
    });

    test('should throw error granting duplicate permission', async () => {
      await service.grantPermissionToUser(permId, 'user-123', 'admin');

      await expect(
        service.grantPermissionToUser(permId, 'user-123', 'admin')
      ).rejects.toThrow('already granted');
    });

    test('should revoke permission from user', async () => {
      await service.grantPermissionToUser(permId, 'user-123', 'admin');

      const revoked = await service.revokePermissionFromUser(
        permId,
        'user-123',
        'admin'
      );

      expect(revoked).toBe(true);
    });

    test('should throw error revoking non-granted permission', async () => {
      await expect(
        service.revokePermissionFromUser(permId, 'user-123', 'admin')
      ).rejects.toThrow('not granted');
    });

    test('should get user permissions summary', async () => {
      await service.grantPermissionToUser(permId, 'user-123', 'admin');

      const summary = await service.getUserPermissionsSummary('user-123');

      expect(summary.userId).toBe('user-123');
      expect(summary.permissions.length).toBe(1);
      expect(summary.totalPermissions).toBe(1);
      expect(summary.directPermissions).toBe(1);
    });

    test('should increment stats on grant', async () => {
      const stats1 = service.getStats();
      const initialCount = stats1.permissionsGrantedToUsers;

      await service.grantPermissionToUser(permId, 'user-123', 'admin');

      const stats2 = service.getStats();
      expect(stats2.permissionsGrantedToUsers).toBe(initialCount + 1);
    });

    test('should decrement stats on revoke', async () => {
      await service.grantPermissionToUser(permId, 'user-123', 'admin');
      const stats1 = service.getStats();
      const initialCount = stats1.permissionsGrantedToUsers;

      await service.revokePermissionFromUser(permId, 'user-123', 'admin');

      const stats2 = service.getStats();
      expect(stats2.permissionsGrantedToUsers).toBe(initialCount - 1);
    });
  });

  // ============================================================
  // Role Permission Tests
  // ============================================================

  describe('Role Permissions', () => {
    let permId: string;

    beforeEach(async () => {
      const perm = await service.createPermission(
        {
          name: 'Admin Perm',
          resource: 'system',
          action: 'manage',
        },
        'admin'
      );
      permId = perm.permissionId;
    });

    test('should grant permission to role', async () => {
      const rolePerm = await service.grantPermissionToRole(
        permId,
        'role-admin',
        'admin'
      );

      expect(rolePerm.roleId).toBe('role-admin');
      expect(rolePerm.permissionId).toBe(permId);
    });

    test('should revoke permission from role', async () => {
      await service.grantPermissionToRole(permId, 'role-admin', 'admin');

      const revoked = await service.revokePermissionFromRole(
        permId,
        'role-admin',
        'admin'
      );

      expect(revoked).toBe(true);
    });

    test('should increment stats on role grant', async () => {
      const stats1 = service.getStats();
      const initialCount = stats1.permissionsGrantedToRoles;

      await service.grantPermissionToRole(permId, 'role-admin', 'admin');

      const stats2 = service.getStats();
      expect(stats2.permissionsGrantedToRoles).toBe(initialCount + 1);
    });
  });

  // ============================================================
  // Permission Group Tests
  // ============================================================

  describe('Permission Groups', () => {
    let permId1: string;
    let permId2: string;

    beforeEach(async () => {
      const p1 = await service.createPermission(
        {
          name: 'Read',
          resource: 'report',
          action: 'read',
        },
        'admin'
      );
      permId1 = p1.permissionId;

      const p2 = await service.createPermission(
        {
          name: 'Write',
          resource: 'report',
          action: 'write',
        },
        'admin'
      );
      permId2 = p2.permissionId;
    });

    test('should create permission group', async () => {
      const group = await service.createPermissionGroup(
        'Report Access',
        'Basic report access permissions',
        [permId1, permId2],
        'admin'
      );

      expect(group.groupId).toBeDefined();
      expect(group.name).toBe('Report Access');
      expect(group.permissions.length).toBe(2);
    });

    test('should get permission group', async () => {
      const created = await service.createPermissionGroup(
        'Group1',
        'Test group',
        [permId1],
        'admin'
      );

      const retrieved = await service.getPermissionGroup(created.groupId);
      expect(retrieved).toEqual(created);
    });

    test('should update permission group', async () => {
      const group = await service.createPermissionGroup(
        'Original',
        'Original description',
        [permId1],
        'admin'
      );

      const updated = await service.updatePermissionGroup(
        group.groupId,
        'Updated',
        'Updated description',
        [permId1, permId2],
        'admin'
      );

      expect(updated.name).toBe('Updated');
      expect(updated.description).toBe('Updated description');
      expect(updated.permissions.length).toBe(2);
    });

    test('should delete permission group', async () => {
      const group = await service.createPermissionGroup(
        'Test',
        'Test group',
        [permId1],
        'admin'
      );

      const deleted = await service.deletePermissionGroup(group.groupId, 'admin');
      expect(deleted).toBe(true);

      const retrieved = await service.getPermissionGroup(group.groupId);
      expect(retrieved).toBeNull();
    });

    test('should grant group to user', async () => {
      const group = await service.createPermissionGroup(
        'Group',
        'Test',
        [permId1, permId2],
        'admin'
      );

      const granted = await service.grantPermissionGroupToUser(
        group.groupId,
        'user-123',
        'admin'
      );

      expect(granted).toBe(2);
    });

    test('should revoke group from user', async () => {
      const group = await service.createPermissionGroup(
        'Group',
        'Test',
        [permId1, permId2],
        'admin'
      );

      await service.grantPermissionGroupToUser(group.groupId, 'user-123', 'admin');

      const revoked = await service.revokePermissionGroupFromUser(
        group.groupId,
        'user-123',
        'admin'
      );

      expect(revoked).toBe(2);
    });

    test('should get all permission groups', async () => {
      await service.createPermissionGroup('G1', 'Test1', [permId1], 'admin');
      await service.createPermissionGroup('G2', 'Test2', [permId2], 'admin');

      const groups = await service.getAllPermissionGroups();
      expect(groups.length).toBe(2);
    });
  });

  // ============================================================
  // Permission Check Tests
  // ============================================================

  describe('Permission Checks', () => {
    let permId: string;

    beforeEach(async () => {
      const perm = await service.createPermission(
        {
          name: 'Test',
          resource: 'report',
          action: 'read',
        },
        'admin'
      );
      permId = perm.permissionId;
    });

    test('should check permission - allowed', async () => {
      await service.grantPermissionToUser(permId, 'user-123', 'admin');

      const check: IPermissionCheckRequest = {
        userId: 'user-123',
        resource: 'report',
        action: 'read',
      };

      const result = await service.checkPermission(check);
      expect(result.allowed).toBe(true);
      expect(result.permissionId).toBe(permId);
    });

    test('should check permission - denied', async () => {
      const check: IPermissionCheckRequest = {
        userId: 'user-123',
        resource: 'report',
        action: 'read',
      };

      const result = await service.checkPermission(check);
      expect(result.allowed).toBe(false);
      expect(result.denialReasons).toBeDefined();
    });

    test('should check permission - wrong action', async () => {
      await service.grantPermissionToUser(permId, 'user-123', 'admin');

      const check: IPermissionCheckRequest = {
        userId: 'user-123',
        resource: 'report',
        action: 'write',
      };

      const result = await service.checkPermission(check);
      expect(result.allowed).toBe(false);
    });
  });

  // ============================================================
  // Bulk Operations Tests
  // ============================================================

  describe('Bulk Operations', () => {
    let permId1: string;
    let permId2: string;

    beforeEach(async () => {
      const p1 = await service.createPermission(
        {
          name: 'P1',
          resource: 'user',
          action: 'read',
        },
        'admin'
      );
      permId1 = p1.permissionId;

      const p2 = await service.createPermission(
        {
          name: 'P2',
          resource: 'user',
          action: 'write',
        },
        'admin'
      );
      permId2 = p2.permissionId;
    });

    test('should bulk grant permissions to users', async () => {
      const result = await service.bulkGrantPermissions(
        {
          permissionIds: [permId1, permId2],
          userIds: ['user-1', 'user-2'],
          action: 'grant',
        },
        'admin'
      );

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
    });

    test('should bulk grant permissions to roles', async () => {
      const result = await service.bulkGrantPermissions(
        {
          permissionIds: [permId1],
          roleIds: ['role-1', 'role-2'],
          action: 'grant',
        },
        'admin'
      );

      expect(result.successful).toBe(2);
    });

    test('should track bulk operation errors', async () => {
      await service.grantPermissionToUser(permId1, 'user-1', 'admin');

      const result = await service.bulkGrantPermissions(
        {
          permissionIds: [permId1],
          userIds: ['user-1', 'user-2'],
          action: 'grant',
        },
        'admin'
      );

      expect(result.failed).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should bulk revoke permissions', async () => {
      await service.grantPermissionToUser(permId1, 'user-1', 'admin');
      await service.grantPermissionToUser(permId2, 'user-1', 'admin');

      const result = await service.bulkRevokePermissions(
        {
          permissionIds: [permId1, permId2],
          userIds: ['user-1'],
          action: 'revoke',
        },
        'admin'
      );

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
    });
  });

  // ============================================================
  // Event Listener Tests
  // ============================================================

  describe('Event Listeners', () => {
    test('should register event listener', async () => {
      const events: string[] = [];
      const listener = (event: any) => {
        events.push(event.type);
      };

      service.onPermission(listener);

      const perm = await service.createPermission(
        {
          name: 'Test',
          resource: 'user',
          action: 'read',
        },
        'admin'
      );

      expect(events).toContain('permission_created');
    });

    test('should unregister event listener', async () => {
      const events: string[] = [];
      const listener = (event: any) => {
        events.push(event.type);
      };

      service.onPermission(listener);
      service.offPermission(listener);

      await service.createPermission(
        {
          name: 'Test',
          resource: 'user',
          action: 'read',
        },
        'admin'
      );

      expect(events.length).toBe(0);
    });

    test('should emit permission_granted event', async () => {
      const events: string[] = [];
      service.onPermission((event) => {
        events.push(event.type);
      });

      const perm = await service.createPermission(
        {
          name: 'Test',
          resource: 'user',
          action: 'read',
        },
        'admin'
      );

      await service.grantPermissionToUser(perm.permissionId, 'user-1', 'admin');

      expect(events).toContain('permission_granted');
    });
  });

  // ============================================================
  // Audit Logging Tests
  // ============================================================

  describe('Audit Logging', () => {
    test('should log audit entries', async () => {
      await service.createPermission(
        {
          name: 'Test',
          resource: 'user',
          action: 'read',
        },
        'admin'
      );

      const log = service.getAuditLog();
      expect(log.length).toBeGreaterThan(0);
    });

    test('should limit audit log retrieval', async () => {
      await service.createPermission(
        {
          name: 'P1',
          resource: 'user',
          action: 'read',
        },
        'admin'
      );

      await service.createPermission(
        {
          name: 'P2',
          resource: 'user',
          action: 'write',
        },
        'admin'
      );

      const log = service.getAuditLog(1);
      expect(log.length).toBeLessThanOrEqual(1);
    });
  });

  // ============================================================
  // Statistics Tests
  // ============================================================

  describe('Statistics', () => {
    test('should track total permissions', async () => {
      const stats1 = service.getStats();
      const before = stats1.totalPermissions;

      await service.createPermission(
        {
          name: 'Test',
          resource: 'user',
          action: 'read',
        },
        'admin'
      );

      const stats2 = service.getStats();
      expect(stats2.totalPermissions).toBe(before + 1);
    });

    test('should track active permissions', async () => {
      const perm = await service.createPermission(
        {
          name: 'Test',
          resource: 'user',
          action: 'read',
        },
        'admin'
      );

      await service.updatePermission(perm.permissionId, { isActive: false }, 'admin');

      const stats = service.getStats();
      expect(stats.activePermissions).toBeLessThan(stats.totalPermissions);
    });

    test('should track resource types', async () => {
      await service.createPermission(
        {
          name: 'Test1',
          resource: 'user',
          action: 'read',
        },
        'admin'
      );

      await service.createPermission(
        {
          name: 'Test2',
          resource: 'user',
          action: 'write',
        },
        'admin'
      );

      const stats = service.getStats();
      expect(stats.resourceTypes.user).toBe(2);
    });
  });

  // ============================================================
  // Permission Matrix Tests
  // ============================================================

  describe('Permission Matrix', () => {
    test('should generate permission matrix for user', async () => {
      const p1 = await service.createPermission(
        {
          name: 'Read',
          resource: 'report',
          action: 'read',
        },
        'admin'
      );

      const p2 = await service.createPermission(
        {
          name: 'Write',
          resource: 'report',
          action: 'write',
        },
        'admin'
      );

      await service.grantPermissionToUser(p1.permissionId, 'user-1', 'admin');
      await service.grantPermissionToUser(p2.permissionId, 'user-1', 'admin');

      const matrix = await service.getPermissionMatrix('user-1');

      expect(matrix.length).toBe(2);
      expect(matrix[0].hasPermission).toBe(true);
    });
  });

  // ============================================================
  // Conflict Detection Tests
  // ============================================================

  describe('Conflict Detection', () => {
    test('should detect duplicate permissions', async () => {
      await service.createPermission(
        {
          name: 'Perm1',
          resource: 'user',
          action: 'read',
        },
        'admin'
      );

      await service.createPermission(
        {
          name: 'Perm2',
          resource: 'user',
          action: 'read',
        },
        'admin'
      );

      const conflicts = await service.detectConflicts();
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].conflictType).toBe('resource');
    });
  });

  // ============================================================
  // Integration Tests
  // ============================================================

  describe('Integration Scenarios', () => {
    test('full permission workflow', async () => {
      // Create permissions
      const readPerm = await service.createPermission(
        {
          name: 'Read Reports',
          resource: 'report',
          action: 'read',
        },
        'admin'
      );

      const writePerm = await service.createPermission(
        {
          name: 'Write Reports',
          resource: 'report',
          action: 'write',
        },
        'admin'
      );

      // Create group
      const group = await service.createPermissionGroup(
        'Report Analyst',
        'Basic report analysis permissions',
        [readPerm.permissionId, writePerm.permissionId],
        'admin'
      );

      // Assign to user
      const assigned = await service.grantPermissionGroupToUser(
        group.groupId,
        'analyst-1',
        'admin'
      );

      expect(assigned).toBe(2);

      // Check permissions
      const readCheck = await service.checkPermission({
        userId: 'analyst-1',
        resource: 'report',
        action: 'read',
      });

      const writeCheck = await service.checkPermission({
        userId: 'analyst-1',
        resource: 'report',
        action: 'write',
      });

      expect(readCheck.allowed).toBe(true);
      expect(writeCheck.allowed).toBe(true);
    });
  });
});
