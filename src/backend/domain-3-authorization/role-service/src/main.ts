/**
 * Role Service - Main Implementation
 * Role management with hierarchy and permission assignment
 */

import type {
  IRole,
  IRoleWithHierarchy,
  IRoleAssignment,
  IRoleAssignmentWithDetails,
  IUserRoles,
  ICreateRoleRequest,
  IUpdateRoleRequest,
  IRolePermission,
  IBulkAssignRequest,
  IBulkRevokeRequest,
  IRoleHierarchy,
  IRoleStats,
  IRoleEvent,
  RoleListener,
  IRoleServiceConfig,
  IBulkOperationResult,
  IRolePermissionMatrix,
  IRoleComparison,
  IAuditLogEntry,
  IExpirationStatus,
} from './types';

/**
 * Role Service - Role management and hierarchy
 */
export class RoleService {
  private config: IRoleServiceConfig;
  private roles: Map<string, IRole> = new Map();
  private assignments: Map<string, IRoleAssignment[]> = new Map();
  private hierarchy: Map<string, IRoleHierarchy> = new Map();
  private auditLog: IAuditLogEntry[] = [];
  private listeners: Set<RoleListener> = new Set();
  private stats: IRoleStats = {
    totalRoles: 0,
    activeRoles: 0,
    inactiveRoles: 0,
    systemRoles: 0,
    customRoles: 0,
    temporaryRoles: 0,
    totalAssignments: 0,
    userCount: 0,
    errors: 0,
  };

  constructor(config: IRoleServiceConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (this.config.maxRoleDepth < 1) {
      throw new Error('Max role depth must be at least 1');
    }
  }

  /**
   * Create role
   */
  async createRole(request: ICreateRoleRequest, createdBy: string): Promise<IRole> {
    try {
      const roleId = this.generateRoleId();

      const role: IRole = {
        roleId,
        name: request.name,
        description: request.description,
        type: request.type,
        status: 'active',
        permissions: request.permissions || [],
        parentRoleId: request.parentRoleId,
        priority: request.priority || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        metadata: request.metadata,
      };

      // Validate hierarchy
      if (request.parentRoleId) {
        const parentRole = this.roles.get(request.parentRoleId);
        if (!parentRole) {
          throw new Error(`Parent role not found: ${request.parentRoleId}`);
        }

        // Check for cyclic hierarchy
        if (!this.config.allowCyclicHierarchy && this.wouldCreateCycle(request.parentRoleId, roleId)) {
          throw new Error('Creating this hierarchy would cause a cycle');
        }

        // Check depth
        const depth = this.calculateHierarchyDepth(request.parentRoleId);
        if (depth >= this.config.maxRoleDepth) {
          throw new Error(`Max role hierarchy depth exceeded: ${this.config.maxRoleDepth}`);
        }
      }

      this.roles.set(roleId, role);

      // Initialize hierarchy
      const roleHierarchy: IRoleHierarchy = {
        roleId,
        parentRoleId: request.parentRoleId,
        childRoleIds: [],
        depth: request.parentRoleId ? this.calculateHierarchyDepth(request.parentRoleId) + 1 : 0,
        ancestors: request.parentRoleId ? this.getAncestors(request.parentRoleId) : [],
        descendants: [],
      };

      this.hierarchy.set(roleId, roleHierarchy);

      // Update parent's children
      if (request.parentRoleId) {
        const parentHierarchy = this.hierarchy.get(request.parentRoleId);
        if (parentHierarchy) {
          parentHierarchy.childRoleIds.push(roleId);
        }
      }

      this.stats.totalRoles++;
      if (role.type === 'system') this.stats.systemRoles++;
      else if (role.type === 'custom') this.stats.customRoles++;
      else if (role.type === 'temporary') this.stats.temporaryRoles++;
      if (role.status === 'active') this.stats.activeRoles++;

      this.logAudit('role_created', roleId, createdBy, { request });
      this.emitEvent('role_created', { roleId, details: { name: request.name } });

      return role;
    } catch (err) {
      this.stats.errors++;
      throw err;
    }
  }

  /**
   * Get role
   */
  async getRole(roleId: string): Promise<IRole | null> {
    return this.roles.get(roleId) || null;
  }

  /**
   * Get role with hierarchy
   */
  async getRoleWithHierarchy(roleId: string): Promise<IRoleWithHierarchy | null> {
    const role = this.roles.get(roleId);
    if (!role) {
      return null;
    }

    const hierarchy = this.hierarchy.get(roleId) || { roleId, childRoleIds: [], descendants: [] };
    const parentRole = role.parentRoleId ? this.roles.get(role.parentRoleId) : undefined;
    const childRoles = hierarchy.childRoleIds
      .map(id => this.roles.get(id))
      .filter((r): r is IRole => r !== undefined);

    const inheritedPermissions = this.getInheritedPermissions(roleId);
    const allPermissions = [...new Set([...role.permissions, ...inheritedPermissions])];

    return {
      ...role,
      parentRole,
      childRoles,
      inheritedPermissions,
      allPermissions,
    };
  }

  /**
   * Update role
   */
  async updateRole(roleId: string, request: IUpdateRoleRequest, updatedBy: string): Promise<IRole> {
    try {
      const role = this.roles.get(roleId);
      if (!role) {
        throw new Error(`Role not found: ${roleId}`);
      }

      const updates: Partial<IRole> = {};

      if (request.name !== undefined) updates.name = request.name;
      if (request.description !== undefined) updates.description = request.description;
      if (request.status !== undefined) {
        updates.status = request.status;
        if (request.status === 'active') {
          this.stats.activeRoles++;
          this.stats.inactiveRoles--;
        } else {
          this.stats.activeRoles--;
          this.stats.inactiveRoles++;
        }
      }
      if (request.permissions !== undefined) updates.permissions = request.permissions;
      if (request.priority !== undefined) updates.priority = request.priority;
      if (request.metadata !== undefined) updates.metadata = request.metadata;

      // Handle parent role change
      if (request.parentRoleId !== undefined) {
        if (request.parentRoleId !== null) {
          const parentRole = this.roles.get(request.parentRoleId);
          if (!parentRole) {
            throw new Error(`Parent role not found: ${request.parentRoleId}`);
          }

          if (!this.config.allowCyclicHierarchy && this.wouldCreateCycle(request.parentRoleId, roleId)) {
            throw new Error('Changing parent would create a hierarchy cycle');
          }
        }

        updates.parentRoleId = request.parentRoleId || undefined;

        // Update hierarchy
        const roleHierarchy = this.hierarchy.get(roleId);
        if (roleHierarchy) {
          roleHierarchy.parentRoleId = request.parentRoleId || undefined;
          roleHierarchy.ancestors = request.parentRoleId ? this.getAncestors(request.parentRoleId) : [];
          roleHierarchy.depth = request.parentRoleId ? this.calculateHierarchyDepth(request.parentRoleId) + 1 : 0;
        }

        this.emitEvent('hierarchy_changed', { roleId, details: { parentRoleId: request.parentRoleId } });
      }

      updates.updatedAt = new Date();

      const updatedRole = { ...role, ...updates } as IRole;
      this.roles.set(roleId, updatedRole);

      this.logAudit('role_updated', roleId, updatedBy, { updates });
      this.emitEvent('role_updated', { roleId, details: updates });

      return updatedRole;
    } catch (err) {
      this.stats.errors++;
      throw err;
    }
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: string, deletedBy: string): Promise<boolean> {
    try {
      const role = this.roles.get(roleId);
      if (!role) {
        return false;
      }

      // Check for child roles
      const hierarchy = this.hierarchy.get(roleId);
      if (hierarchy && hierarchy.childRoleIds.length > 0) {
        throw new Error('Cannot delete role with child roles');
      }

      // Remove from parent
      if (role.parentRoleId) {
        const parentHierarchy = this.hierarchy.get(role.parentRoleId);
        if (parentHierarchy) {
          const index = parentHierarchy.childRoleIds.indexOf(roleId);
          if (index > -1) {
            parentHierarchy.childRoleIds.splice(index, 1);
          }
        }
      }

      // Remove assignments
      this.assignments.delete(roleId);

      this.roles.delete(roleId);
      this.hierarchy.delete(roleId);

      this.stats.totalRoles--;
      if (role.type === 'system') this.stats.systemRoles--;
      else if (role.type === 'custom') this.stats.customRoles--;
      else if (role.type === 'temporary') this.stats.temporaryRoles--;
      if (role.status === 'active') this.stats.activeRoles--;

      this.logAudit('role_deleted', roleId, deletedBy, { role });
      this.emitEvent('role_deleted', { roleId });

      return true;
    } catch (err) {
      this.stats.errors++;
      throw err;
    }
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, roleId: string, assignedBy: string, expiresAt?: Date, reason?: string): Promise<IRoleAssignment> {
    try {
      const role = this.roles.get(roleId);
      if (!role) {
        throw new Error(`Role not found: ${roleId}`);
      }

      const assignmentId = this.generateAssignmentId();
      const assignment: IRoleAssignment = {
        assignmentId,
        userId,
        roleId,
        assignedAt: new Date(),
        expiresAt,
        assignedBy,
        reason,
      };

      let userAssignments = this.assignments.get(userId) || [];
      userAssignments.push(assignment);
      this.assignments.set(userId, userAssignments);

      this.stats.totalAssignments++;

      // Count unique users
      this.stats.userCount = this.assignments.size;

      this.logAudit('role_assigned', roleId, userId, { assignedBy, expiresAt, reason });
      this.emitEvent('role_assigned', { roleId, userId, details: { expiresAt, reason } });

      return assignment;
    } catch (err) {
      this.stats.errors++;
      throw err;
    }
  }

  /**
   * Revoke role from user
   */
  async revokeRoleFromUser(userId: string, roleId: string, revokedBy: string): Promise<boolean> {
    try {
      const userAssignments = this.assignments.get(userId);
      if (!userAssignments) {
        return false;
      }

      const index = userAssignments.findIndex(a => a.roleId === roleId);
      if (index === -1) {
        return false;
      }

      userAssignments.splice(index, 1);

      if (userAssignments.length === 0) {
        this.assignments.delete(userId);
      }

      this.stats.totalAssignments--;
      this.stats.userCount = this.assignments.size;

      this.logAudit('role_revoked', roleId, userId, { revokedBy });
      this.emitEvent('role_revoked', { roleId, userId });

      return true;
    } catch (err) {
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<IUserRoles> {
    const userAssignments = this.assignments.get(userId) || [];
    const roles = userAssignments
      .map(a => this.roles.get(a.roleId))
      .filter((r): r is IRole => r !== undefined);

    const allPermissions = new Set<string>();
    roles.forEach(role => {
      role.permissions.forEach(p => allPermissions.add(p));
      const inherited = this.getInheritedPermissions(role.roleId);
      inherited.forEach(p => allPermissions.add(p));
    });

    return {
      userId,
      roles,
      allPermissions: Array.from(allPermissions),
      assignedAt: userAssignments.map(a => a.assignedAt),
    };
  }

  /**
   * Get role assignments
   */
  async getRoleAssignments(roleId: string): Promise<IRoleAssignmentWithDetails[]> {
    const role = this.roles.get(roleId);
    if (!role) {
      return [];
    }

    const allPermissions = this.getPermissionMatrix(roleId).totalPermissions;
    const assignments: IRoleAssignmentWithDetails[] = [];

    for (const [userId, userAssignments] of this.assignments.entries()) {
      const assignment = userAssignments.find(a => a.roleId === roleId);
      if (assignment) {
        assignments.push({
          ...assignment,
          role,
          allPermissions,
        });
      }
    }

    return assignments;
  }

  /**
   * Grant permission to role
   */
  async grantPermissionToRole(roleId: string, permissionId: string, grantedBy: string): Promise<boolean> {
    try {
      const role = this.roles.get(roleId);
      if (!role) {
        throw new Error(`Role not found: ${roleId}`);
      }

      if (role.permissions.includes(permissionId)) {
        return true; // Already granted
      }

      role.permissions.push(permissionId);
      role.updatedAt = new Date();

      this.logAudit('permission_granted', roleId, grantedBy, { permissionId });
      this.emitEvent('permission_granted', { roleId, details: { permissionId } });

      return true;
    } catch (err) {
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Revoke permission from role
   */
  async revokePermissionFromRole(roleId: string, permissionId: string, revokedBy: string): Promise<boolean> {
    try {
      const role = this.roles.get(roleId);
      if (!role) {
        throw new Error(`Role not found: ${roleId}`);
      }

      const index = role.permissions.indexOf(permissionId);
      if (index === -1) {
        return false;
      }

      role.permissions.splice(index, 1);
      role.updatedAt = new Date();

      this.logAudit('permission_revoked', roleId, revokedBy, { permissionId });
      this.emitEvent('permission_revoked', { roleId, details: { permissionId } });

      return true;
    } catch (err) {
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get all roles
   */
  async getAllRoles(status?: string): Promise<IRole[]> {
    const roles = Array.from(this.roles.values());
    if (status) {
      return roles.filter(r => r.status === status);
    }
    return roles;
  }

  /**
   * Bulk assign role
   */
  async bulkAssignRole(request: IBulkAssignRequest, assignedBy: string): Promise<IBulkOperationResult> {
    const result: IBulkOperationResult = {
      totalRequested: request.userIds.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const userId of request.userIds) {
      try {
        await this.assignRoleToUser(userId, request.roleId, assignedBy, request.expiresAt, request.reason);
        result.successful++;
      } catch (err) {
        result.failed++;
        result.errors.push({
          userId,
          error: (err as Error).message,
        });
      }
    }

    return result;
  }

  /**
   * Bulk revoke role
   */
  async bulkRevokeRole(request: IBulkRevokeRequest, revokedBy: string): Promise<IBulkOperationResult> {
    const result: IBulkOperationResult = {
      totalRequested: request.userIds.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const userId of request.userIds) {
      try {
        const revoked = await this.revokeRoleFromUser(userId, request.roleId, revokedBy);
        if (revoked) {
          result.successful++;
        } else {
          result.failed++;
        }
      } catch (err) {
        result.failed++;
        result.errors.push({
          userId,
          error: (err as Error).message,
        });
      }
    }

    return result;
  }

  /**
   * Get permission matrix for role
   */
  getPermissionMatrix(roleId: string): IRolePermissionMatrix {
    const role = this.roles.get(roleId);
    if (!role) {
      return {
        roleId,
        roleName: 'Unknown',
        directPermissions: [],
        inheritedPermissions: [],
        totalPermissions: [],
        source: {},
      };
    }

    const inherited = this.getInheritedPermissions(roleId);
    const source: Record<string, string[]> = {
      direct: role.permissions,
    };

    // Add inherited sources
    const hierarchy = this.hierarchy.get(roleId);
    if (hierarchy?.ancestors) {
      hierarchy.ancestors.forEach(ancestorId => {
        const ancestor = this.roles.get(ancestorId);
        if (ancestor) {
          source[`inherited_from_${ancestor.name}`] = ancestor.permissions;
        }
      });
    }

    return {
      roleId,
      roleName: role.name,
      directPermissions: role.permissions,
      inheritedPermissions: inherited,
      totalPermissions: [...new Set([...role.permissions, ...inherited])],
      source,
    };
  }

  /**
   * Compare two roles
   */
  compareRoles(role1Id: string, role2Id: string): IRoleComparison {
    const matrix1 = this.getPermissionMatrix(role1Id);
    const matrix2 = this.getPermissionMatrix(role2Id);

    const set1 = new Set(matrix1.totalPermissions);
    const set2 = new Set(matrix2.totalPermissions);

    const common = [...set1].filter(p => set2.has(p));
    const unique1 = [...set1].filter(p => !set2.has(p));
    const unique2 = [...set2].filter(p => !set1.has(p));

    // Find conflicts (same permission from different roles)
    const conflicts: IConflictingPermission[] = [];

    return {
      role1Id,
      role2Id,
      commonPermissions: common,
      uniqueToRole1: unique1,
      uniqueToRole2: unique2,
      conflicts,
    };
  }

  /**
   * Get expiring assignments
   */
  async getExpiringAssignments(daysThreshold: number = 7): Promise<IExpirationStatus[]> {
    const expirations: IExpirationStatus[] = [];
    const now = new Date();
    const threshold = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

    for (const [userId, userAssignments] of this.assignments.entries()) {
      for (const assignment of userAssignments) {
        if (assignment.expiresAt && assignment.expiresAt <= threshold && assignment.expiresAt > now) {
          expirations.push({
            assignmentId: assignment.assignmentId,
            userId,
            roleId: assignment.roleId,
            expiresAt: assignment.expiresAt,
            daysUntilExpiration: Math.ceil((assignment.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
            isExpired: false,
          });
        }
      }
    }

    return expirations;
  }

  /**
   * Clean up expired assignments
   */
  async cleanupExpiredAssignments(): Promise<number> {
    let cleaned = 0;
    const now = new Date();

    for (const [userId, userAssignments] of this.assignments.entries()) {
      const filtered = userAssignments.filter(a => {
        if (a.expiresAt && a.expiresAt <= now) {
          cleaned++;
          return false;
        }
        return true;
      });

      if (filtered.length === 0) {
        this.assignments.delete(userId);
      } else if (filtered.length < userAssignments.length) {
        this.assignments.set(userId, filtered);
      }
    }

    return cleaned;
  }

  /**
   * Register listener
   */
  onRole(listener: RoleListener): this {
    this.listeners.add(listener);
    return this;
  }

  /**
   * Remove listener
   */
  offRole(listener: RoleListener): this {
    this.listeners.delete(listener);
    return this;
  }

  /**
   * Get statistics
   */
  getStats(): IRoleStats {
    return { ...this.stats };
  }

  /**
   * Get audit log
   */
  getAuditLog(limit: number = 100): IAuditLogEntry[] {
    return this.auditLog.slice(-limit);
  }

  // ============================================================
  // Private Helper Methods
  // ============================================================

  private generateRoleId(): string {
    return `${this.config.roleIdPrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAssignmentId(): string {
    return `assign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private wouldCreateCycle(parentRoleId: string, childRoleId: string): boolean {
    const visited = new Set<string>();
    let current = parentRoleId;

    while (current) {
      if (current === childRoleId) {
        return true;
      }

      if (visited.has(current)) {
        break;
      }

      visited.add(current);

      const role = this.roles.get(current);
      if (!role?.parentRoleId) {
        break;
      }

      current = role.parentRoleId;
    }

    return false;
  }

  private calculateHierarchyDepth(roleId: string): number {
    let depth = 0;
    let current = roleId;

    while (current) {
      const role = this.roles.get(current);
      if (!role?.parentRoleId) {
        break;
      }

      depth++;
      current = role.parentRoleId;
    }

    return depth;
  }

  private getAncestors(roleId: string): string[] {
    const ancestors: string[] = [];
    let current = roleId;

    while (current) {
      const role = this.roles.get(current);
      if (!role?.parentRoleId) {
        break;
      }

      ancestors.push(role.parentRoleId);
      current = role.parentRoleId;
    }

    return ancestors;
  }

  private getInheritedPermissions(roleId: string): string[] {
    const permissions: string[] = [];
    const hierarchy = this.hierarchy.get(roleId);

    if (hierarchy?.ancestors) {
      hierarchy.ancestors.forEach(ancestorId => {
        const ancestor = this.roles.get(ancestorId);
        if (ancestor) {
          permissions.push(...ancestor.permissions);
        }
      });
    }

    return [...new Set(permissions)];
  }

  private logAudit(action: string, roleId: string, userId: string, changes: Record<string, unknown>): void {
    const entry: IAuditLogEntry = {
      entryId: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      roleId,
      userId,
      changes,
      timestamp: new Date(),
      performedBy: userId,
    };

    this.auditLog.push(entry);
  }

  private emitEvent(type: IRoleEvent['type'], details?: Record<string, unknown>): void {
    const event: IRoleEvent = {
      type,
      timestamp: new Date(),
      roleId: (details?.roleId as string) || 'unknown',
      userId: details?.userId as string,
      details,
    };

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[RoleService] Listener error:', err);
      }
    }
  }
}

/**
 * Factory function
 */
export function createRoleService(config: IRoleServiceConfig): RoleService {
  return new RoleService(config);
}

/**
 * Default export
 */
export default RoleService;
