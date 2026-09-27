/**
 * Permission Service - Implementation
 * Fine-grained permission management for role-based access control
 */

import { randomBytes } from 'crypto';
import type {
  IPermission,
  IPermissionWithDetails,
  IUserPermission,
  IRolePermission,
  IPermissionGroup,
  IResourcePermission,
  IPermissionCheckRequest,
  IPermissionCheckResult,
  IBulkPermissionRequest,
  ICreatePermissionRequest,
  IUpdatePermissionRequest,
  IPermissionStats,
  IPermissionEvent,
  PermissionListener,
  IPermissionServiceConfig,
  IPermissionConflict,
  IPermissionAuditEntry,
  IUserPermissionsSummary,
  IPermissionMatrixEntry,
  IBulkOperationResult,
  PermissionAction,
  ResourceType,
} from './types';

/**
 * Permission Service - Manages fine-grained permissions
 */
export class PermissionService {
  private permissions: Map<string, IPermission>;
  private userPermissions: Map<string, Set<string>>;
  private rolePermissions: Map<string, Set<string>>;
  private permissionGroups: Map<string, IPermissionGroup>;
  private resourcePermissions: Map<string, IResourcePermission>;
  private listeners: Set<PermissionListener>;
  private auditLog: IPermissionAuditEntry[];
  private stats: IPermissionStats;
  private config: IPermissionServiceConfig;

  constructor(config: IPermissionServiceConfig) {
    this.validateConfig(config);
    this.config = config;
    this.permissions = new Map();
    this.userPermissions = new Map();
    this.rolePermissions = new Map();
    this.permissionGroups = new Map();
    this.resourcePermissions = new Map();
    this.listeners = new Set();
    this.auditLog = [];
    this.stats = {
      totalPermissions: 0,
      activePermissions: 0,
      groupedPermissions: 0,
      permissionsGrantedToUsers: 0,
      permissionsGrantedToRoles: 0,
      resourceTypes: {},
      actionTypes: {},
      errors: 0,
    };
  }

  /**
   * Validate service configuration
   */
  private validateConfig(config: IPermissionServiceConfig): void {
    if (!config) {
      throw new Error('Permission service configuration is required');
    }
    if (config.maxPermissionsPerUser < 1) {
      throw new Error('maxPermissionsPerUser must be greater than 0');
    }
    if (config.permissionCacheTimeout < 1000) {
      throw new Error('permissionCacheTimeout must be at least 1000ms');
    }
    if (config.cacheSize < 100) {
      throw new Error('cacheSize must be at least 100');
    }
  }

  /**
   * Create a new permission
   */
  async createPermission(
    request: ICreatePermissionRequest,
    createdBy: string
  ): Promise<IPermission> {
    if (!request.name || !request.resource || !request.action) {
      throw new Error('Permission name, resource, and action are required');
    }

    const permissionId = this.generatePermissionId();
    const permission: IPermission = {
      permissionId,
      name: request.name,
      description: request.description || '',
      resource: request.resource,
      action: request.action,
      scope: request.scope,
      priority: request.priority ?? 100,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      metadata: request.metadata,
    };

    this.permissions.set(permissionId, permission);
    this.updateStats('resource', permission.resource, 1);
    this.updateStats('action', permission.action, 1);
    this.stats.totalPermissions++;
    this.stats.activePermissions++;

    this.logAudit('permission_created', permissionId, createdBy, {
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
    });

    this.emitEvent('permission_created', {
      permissionId,
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
    });

    return permission;
  }

  /**
   * Get permission by ID
   */
  async getPermission(permissionId: string): Promise<IPermission | null> {
    return this.permissions.get(permissionId) || null;
  }

  /**
   * Get permission with details
   */
  async getPermissionWithDetails(
    permissionId: string
  ): Promise<IPermissionWithDetails | null> {
    const permission = this.permissions.get(permissionId);
    if (!permission) return null;

    const rolesCount = this.rolePermissions.get(permissionId)?.size || 0;
    const usersCount = this.userPermissions.get(permissionId)?.size || 0;

    return {
      ...permission,
      rolesCount,
      usersCount,
    };
  }

  /**
   * Update permission
   */
  async updatePermission(
    permissionId: string,
    request: IUpdatePermissionRequest,
    updatedBy: string
  ): Promise<IPermission> {
    const permission = this.permissions.get(permissionId);
    if (!permission) {
      throw new Error(`Permission not found: ${permissionId}`);
    }

    const oldState = { ...permission };

    if (request.name !== undefined) permission.name = request.name;
    if (request.description !== undefined)
      permission.description = request.description;
    if (request.scope !== undefined) permission.scope = request.scope;
    if (request.priority !== undefined) permission.priority = request.priority;
    if (request.isActive !== undefined) permission.isActive = request.isActive;
    if (request.metadata !== undefined) permission.metadata = request.metadata;

    permission.updatedAt = new Date();

    this.logAudit('permission_updated', permissionId, updatedBy, {
      before: oldState,
      after: permission,
    });

    this.emitEvent('permission_updated', {
      permissionId,
      changes: request,
    });

    return permission;
  }

  /**
   * Delete permission
   */
  async deletePermission(
    permissionId: string,
    deletedBy: string
  ): Promise<boolean> {
    const permission = this.permissions.get(permissionId);
    if (!permission) {
      throw new Error(`Permission not found: ${permissionId}`);
    }

    this.permissions.delete(permissionId);
    this.userPermissions.delete(permissionId);
    this.rolePermissions.delete(permissionId);
    this.updateStats('resource', permission.resource, -1);
    this.updateStats('action', permission.action, -1);
    this.stats.totalPermissions--;
    if (permission.isActive) this.stats.activePermissions--;

    this.logAudit('permission_deleted', permissionId, deletedBy, {
      name: permission.name,
      resource: permission.resource,
    });

    this.emitEvent('permission_deleted', {
      permissionId,
      name: permission.name,
    });

    return true;
  }

  /**
   * Grant permission to user
   */
  async grantPermissionToUser(
    permissionId: string,
    userId: string,
    grantedBy: string,
    expiresAt?: Date,
    reason?: string
  ): Promise<IUserPermission> {
    const permission = this.permissions.get(permissionId);
    if (!permission) {
      throw new Error(`Permission not found: ${permissionId}`);
    }

    const userPerms = this.userPermissions.get(permissionId) || new Set();
    if (userPerms.has(userId)) {
      throw new Error(
        `Permission ${permissionId} already granted to user ${userId}`
      );
    }

    userPerms.add(userId);
    this.userPermissions.set(permissionId, userPerms);
    this.stats.permissionsGrantedToUsers++;

    const userPermission: IUserPermission = {
      permissionId,
      userId,
      grantedAt: new Date(),
      grantedBy,
      expiresAt,
      reason,
    };

    this.logAudit('permission_granted', permissionId, grantedBy, {
      userId,
      expiresAt,
      reason,
    });

    this.emitEvent('permission_granted', {
      permissionId,
      userId,
      expiresAt,
    });

    return userPermission;
  }

  /**
   * Revoke permission from user
   */
  async revokePermissionFromUser(
    permissionId: string,
    userId: string,
    revokedBy: string
  ): Promise<boolean> {
    const userPerms = this.userPermissions.get(permissionId);
    if (!userPerms || !userPerms.has(userId)) {
      throw new Error(
        `Permission ${permissionId} not granted to user ${userId}`
      );
    }

    userPerms.delete(userId);
    if (userPerms.size === 0) {
      this.userPermissions.delete(permissionId);
    }
    this.stats.permissionsGrantedToUsers--;

    this.logAudit('permission_revoked', permissionId, revokedBy, {
      userId,
    });

    this.emitEvent('permission_revoked', {
      permissionId,
      userId,
    });

    return true;
  }

  /**
   * Grant permission to role
   */
  async grantPermissionToRole(
    permissionId: string,
    roleId: string,
    grantedBy: string
  ): Promise<IRolePermission> {
    const permission = this.permissions.get(permissionId);
    if (!permission) {
      throw new Error(`Permission not found: ${permissionId}`);
    }

    const rolePerms = this.rolePermissions.get(permissionId) || new Set();
    if (rolePerms.has(roleId)) {
      throw new Error(
        `Permission ${permissionId} already granted to role ${roleId}`
      );
    }

    rolePerms.add(roleId);
    this.rolePermissions.set(permissionId, rolePerms);
    this.stats.permissionsGrantedToRoles++;

    const rolePermission: IRolePermission = {
      permissionId,
      roleId,
      grantedAt: new Date(),
      grantedBy,
    };

    this.logAudit('permission_granted_to_role', permissionId, grantedBy, {
      roleId,
    });

    this.emitEvent('permission_granted', {
      permissionId,
      roleId,
    });

    return rolePermission;
  }

  /**
   * Revoke permission from role
   */
  async revokePermissionFromRole(
    permissionId: string,
    roleId: string,
    revokedBy: string
  ): Promise<boolean> {
    const rolePerms = this.rolePermissions.get(permissionId);
    if (!rolePerms || !rolePerms.has(roleId)) {
      throw new Error(
        `Permission ${permissionId} not granted to role ${roleId}`
      );
    }

    rolePerms.delete(roleId);
    if (rolePerms.size === 0) {
      this.rolePermissions.delete(permissionId);
    }
    this.stats.permissionsGrantedToRoles--;

    this.logAudit('permission_revoked_from_role', permissionId, revokedBy, {
      roleId,
    });

    this.emitEvent('permission_revoked', {
      permissionId,
      roleId,
    });

    return true;
  }

  /**
   * Create permission group
   */
  async createPermissionGroup(
    name: string,
    description: string,
    permissionIds: string[],
    createdBy: string
  ): Promise<IPermissionGroup> {
    // Validate all permissions exist
    for (const permId of permissionIds) {
      if (!this.permissions.has(permId)) {
        throw new Error(`Permission not found: ${permId}`);
      }
    }

    const groupId = this.generateGroupId();
    const group: IPermissionGroup = {
      groupId,
      name,
      description,
      permissions: permissionIds,
      isActive: true,
      createdAt: new Date(),
      createdBy,
    };

    this.permissionGroups.set(groupId, group);
    this.stats.groupedPermissions += permissionIds.length;

    this.logAudit('group_created', groupId, createdBy, {
      name,
      permissionCount: permissionIds.length,
    });

    this.emitEvent('group_created', {
      permissionId: groupId,
      details: { name, permissionCount: permissionIds.length },
    });

    return group;
  }

  /**
   * Get permission group
   */
  async getPermissionGroup(groupId: string): Promise<IPermissionGroup | null> {
    return this.permissionGroups.get(groupId) || null;
  }

  /**
   * Update permission group
   */
  async updatePermissionGroup(
    groupId: string,
    name?: string,
    description?: string,
    permissionIds?: string[],
    updatedBy?: string
  ): Promise<IPermissionGroup> {
    const group = this.permissionGroups.get(groupId);
    if (!group) {
      throw new Error(`Permission group not found: ${groupId}`);
    }

    const oldState = { ...group };

    if (name !== undefined) group.name = name;
    if (description !== undefined) group.description = description;
    if (permissionIds !== undefined) {
      for (const permId of permissionIds) {
        if (!this.permissions.has(permId)) {
          throw new Error(`Permission not found: ${permId}`);
        }
      }
      group.permissions = permissionIds;
    }

    this.logAudit('group_updated', groupId, updatedBy || 'system', {
      before: oldState,
      after: group,
    });

    this.emitEvent('group_updated', {
      permissionId: groupId,
    });

    return group;
  }

  /**
   * Delete permission group
   */
  async deletePermissionGroup(
    groupId: string,
    deletedBy: string
  ): Promise<boolean> {
    const group = this.permissionGroups.get(groupId);
    if (!group) {
      throw new Error(`Permission group not found: ${groupId}`);
    }

    this.stats.groupedPermissions -= group.permissions.length;
    this.permissionGroups.delete(groupId);

    this.logAudit('group_deleted', groupId, deletedBy, {
      name: group.name,
      permissionCount: group.permissions.length,
    });

    this.emitEvent('group_deleted', {
      permissionId: groupId,
    });

    return true;
  }

  /**
   * Check permission
   */
  async checkPermission(
    request: IPermissionCheckRequest
  ): Promise<IPermissionCheckResult> {
    const userPerms = this.getUserPermissions(request.userId);
    if (userPerms.length === 0) {
      return {
        allowed: false,
        reason: 'User has no permissions',
        denialReasons: ['No permissions assigned'],
      };
    }

    // Check for matching permission
    for (const permission of userPerms) {
      if (
        permission.resource === request.resource &&
        permission.action === request.action
      ) {
        if (!permission.isActive) {
          continue;
        }

        // Check scope if specified
        if (
          request.resourceId &&
          permission.scope &&
          !this.matchesScope(request.resourceId, permission.scope)
        ) {
          continue;
        }

        return {
          allowed: true,
          permissionId: permission.permissionId,
        };
      }
    }

    return {
      allowed: false,
      reason: 'Permission check failed',
      denialReasons: [
        `No permission found for ${request.resource}:${request.action}`,
      ],
    };
  }

  /**
   * Get user permissions
   */
  private getUserPermissions(userId: string): IPermission[] {
    const userPerms: IPermission[] = [];

    for (const [permId, userSet] of this.userPermissions.entries()) {
      if (userSet.has(userId)) {
        const permission = this.permissions.get(permId);
        if (permission) {
          userPerms.push(permission);
        }
      }
    }

    return userPerms;
  }

  /**
   * Get user permissions summary
   */
  async getUserPermissionsSummary(
    userId: string
  ): Promise<IUserPermissionsSummary> {
    const permissions = this.getUserPermissions(userId);
    const groups: IPermissionGroup[] = [];
    const directPermissions = permissions.length;

    // Find groups containing these permissions
    for (const group of this.permissionGroups.values()) {
      if (group.permissions.some(pid => permissions.some(p => p.permissionId === pid))) {
        groups.push(group);
      }
    }

    return {
      userId,
      permissions,
      permissionGroups: groups,
      totalPermissions: permissions.length,
      directPermissions,
      inheritedPermissions: 0, // In a real system, would calculate from roles
    };
  }

  /**
   * Grant permission group to user
   */
  async grantPermissionGroupToUser(
    groupId: string,
    userId: string,
    grantedBy: string
  ): Promise<number> {
    const group = this.permissionGroups.get(groupId);
    if (!group) {
      throw new Error(`Permission group not found: ${groupId}`);
    }

    let granted = 0;
    for (const permId of group.permissions) {
      const userPerms = this.userPermissions.get(permId) || new Set();
      if (!userPerms.has(userId)) {
        userPerms.add(userId);
        this.userPermissions.set(permId, userPerms);
        granted++;
      }
    }

    if (granted > 0) {
      this.stats.permissionsGrantedToUsers += granted;
      this.logAudit('group_granted_to_user', groupId, grantedBy, {
        userId,
        permissionCount: granted,
      });

      this.emitEvent('permission_granted', {
        permissionId: groupId,
        userId,
      });
    }

    return granted;
  }

  /**
   * Revoke permission group from user
   */
  async revokePermissionGroupFromUser(
    groupId: string,
    userId: string,
    revokedBy: string
  ): Promise<number> {
    const group = this.permissionGroups.get(groupId);
    if (!group) {
      throw new Error(`Permission group not found: ${groupId}`);
    }

    let revoked = 0;
    for (const permId of group.permissions) {
      const userPerms = this.userPermissions.get(permId);
      if (userPerms && userPerms.has(userId)) {
        userPerms.delete(userId);
        revoked++;
      }
    }

    if (revoked > 0) {
      this.stats.permissionsGrantedToUsers -= revoked;
      this.logAudit('group_revoked_from_user', groupId, revokedBy, {
        userId,
        permissionCount: revoked,
      });

      this.emitEvent('permission_revoked', {
        permissionId: groupId,
        userId,
      });
    }

    return revoked;
  }

  /**
   * Bulk grant permissions
   */
  async bulkGrantPermissions(
    request: IBulkPermissionRequest,
    grantedBy: string
  ): Promise<IBulkOperationResult> {
    const result: IBulkOperationResult = {
      totalRequested: 0,
      successful: 0,
      failed: 0,
      errors: [],
    };

    if (request.action !== 'grant') {
      return result;
    }

    // Grant to users
    if (request.userIds) {
      for (const userId of request.userIds) {
        result.totalRequested++;
        try {
          for (const permId of request.permissionIds) {
            await this.grantPermissionToUser(permId, userId, grantedBy);
          }
          result.successful++;
        } catch (err) {
          result.failed++;
          result.errors.push({
            itemId: userId,
            error: (err as Error).message,
          });
        }
      }
    }

    // Grant to roles
    if (request.roleIds) {
      for (const roleId of request.roleIds) {
        result.totalRequested++;
        try {
          for (const permId of request.permissionIds) {
            await this.grantPermissionToRole(permId, roleId, grantedBy);
          }
          result.successful++;
        } catch (err) {
          result.failed++;
          result.errors.push({
            itemId: roleId,
            error: (err as Error).message,
          });
        }
      }
    }

    return result;
  }

  /**
   * Bulk revoke permissions
   */
  async bulkRevokePermissions(
    request: IBulkPermissionRequest,
    revokedBy: string
  ): Promise<IBulkOperationResult> {
    const result: IBulkOperationResult = {
      totalRequested: 0,
      successful: 0,
      failed: 0,
      errors: [],
    };

    if (request.action !== 'revoke') {
      return result;
    }

    // Revoke from users
    if (request.userIds) {
      for (const userId of request.userIds) {
        result.totalRequested++;
        try {
          for (const permId of request.permissionIds) {
            await this.revokePermissionFromUser(permId, userId, revokedBy);
          }
          result.successful++;
        } catch (err) {
          result.failed++;
          result.errors.push({
            itemId: userId,
            error: (err as Error).message,
          });
        }
      }
    }

    // Revoke from roles
    if (request.roleIds) {
      for (const roleId of request.roleIds) {
        result.totalRequested++;
        try {
          for (const permId of request.permissionIds) {
            await this.revokePermissionFromRole(permId, roleId, revokedBy);
          }
          result.successful++;
        } catch (err) {
          result.failed++;
          result.errors.push({
            itemId: roleId,
            error: (err as Error).message,
          });
        }
      }
    }

    return result;
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(
    resource?: ResourceType,
    action?: PermissionAction
  ): Promise<IPermission[]> {
    const perms: IPermission[] = [];

    for (const perm of this.permissions.values()) {
      if (
        (!resource || perm.resource === resource) &&
        (!action || perm.action === action)
      ) {
        perms.push(perm);
      }
    }

    return perms.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get all permission groups
   */
  async getAllPermissionGroups(): Promise<IPermissionGroup[]> {
    return Array.from(this.permissionGroups.values());
  }

  /**
   * Get permission statistics
   */
  getStats(): IPermissionStats {
    return { ...this.stats };
  }

  /**
   * Get audit log
   */
  getAuditLog(limit: number = 100): IPermissionAuditEntry[] {
    return this.auditLog.slice(-limit);
  }

  /**
   * Register event listener
   */
  onPermission(listener: PermissionListener): this {
    this.listeners.add(listener);
    return this;
  }

  /**
   * Remove event listener
   */
  offPermission(listener: PermissionListener): this {
    this.listeners.delete(listener);
    return this;
  }

  /**
   * Detect permission conflicts
   */
  async detectConflicts(): Promise<IPermissionConflict[]> {
    const conflicts: IPermissionConflict[] = [];
    const permArray = Array.from(this.permissions.values());

    for (let i = 0; i < permArray.length; i++) {
      for (let j = i + 1; j < permArray.length; j++) {
        const p1 = permArray[i];
        const p2 = permArray[j];

        if (p1.resource === p2.resource && p1.action === p2.action) {
          conflicts.push({
            permissionId1: p1.permissionId,
            permissionId2: p2.permissionId,
            conflictType: 'resource',
            severity: 'high',
            recommendation: `Merge duplicate permissions: ${p1.name} and ${p2.name}`,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Get permission matrix for a user
   */
  async getPermissionMatrix(userId: string): Promise<IPermissionMatrixEntry[]> {
    const matrix: IPermissionMatrixEntry[] = [];
    const userPerms = this.getUserPermissions(userId);

    for (const perm of userPerms) {
      if (perm.isActive) {
        matrix.push({
          resource: perm.resource,
          action: perm.action,
          hasPermission: true,
          grantedBy: perm.createdBy,
          grantedAt: perm.createdAt,
        });
      }
    }

    return matrix;
  }

  /**
   * Private helper methods
   */

  private generatePermissionId(): string {
    return `perm_${randomBytes(8).toString('hex')}`;
  }

  private generateGroupId(): string {
    return `grp_${randomBytes(8).toString('hex')}`;
  }

  private updateStats(
    type: 'resource' | 'action',
    key: string,
    delta: number
  ): void {
    if (type === 'resource') {
      const rt = this.stats.resourceTypes as Record<string, number>;
      rt[key] = (rt[key] || 0) + delta;
    } else {
      const at = this.stats.actionTypes as Record<string, number>;
      at[key] = (at[key] || 0) + delta;
    }
  }

  private matchesScope(resourceId: string, scope: string): boolean {
    // Simple wildcard matching
    if (scope === '*') return true;
    if (scope === resourceId) return true;
    if (scope.endsWith('*')) {
      const prefix = scope.slice(0, -1);
      return resourceId.startsWith(prefix);
    }
    return false;
  }

  private logAudit(
    action: string,
    permissionId: string,
    userId: string,
    changes: Record<string, unknown>
  ): void {
    const entry: IPermissionAuditEntry = {
      entryId: this.generatePermissionId(),
      action,
      permissionId,
      userId,
      changes,
      timestamp: new Date(),
      performedBy: userId,
    };
    this.auditLog.push(entry);
  }

  private async emitEvent(
    type: IPermissionEvent['type'],
    details?: Record<string, unknown>
  ): Promise<void> {
    const event: IPermissionEvent = {
      type,
      timestamp: new Date(),
      permissionId: details?.permissionId as string,
      userId: details?.userId as string,
      roleId: details?.roleId as string,
      details,
    };

    for (const listener of this.listeners) {
      try {
        await listener(event);
      } catch (err) {
        this.stats.errors++;
      }
    }
  }
}

/**
 * Factory function to create Permission Service
 */
export function createPermissionService(
  config: IPermissionServiceConfig
): PermissionService {
  return new PermissionService(config);
}
