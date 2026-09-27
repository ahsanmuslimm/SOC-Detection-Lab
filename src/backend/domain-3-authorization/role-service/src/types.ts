/**
 * Role Service - Type Definitions
 * Type definitions for role management and hierarchy
 */

/**
 * Role status
 */
export type RoleStatus = 'active' | 'inactive' | 'archived';

/**
 * Role type
 */
export type RoleType = 'system' | 'custom' | 'temporary';

/**
 * Role
 */
export interface IRole {
  roleId: string;
  name: string;
  description: string;
  type: RoleType;
  status: RoleStatus;
  permissions: string[];
  parentRoleId?: string;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

/**
 * Role with hierarchy
 */
export interface IRoleWithHierarchy extends IRole {
  parentRole?: IRole;
  childRoles: IRole[];
  inheritedPermissions: string[];
  allPermissions: string[];
}

/**
 * Role assignment
 */
export interface IRoleAssignment {
  assignmentId: string;
  userId: string;
  roleId: string;
  assignedAt: Date;
  expiresAt?: Date;
  assignedBy: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Role assignment with details
 */
export interface IRoleAssignmentWithDetails extends IRoleAssignment {
  role: IRole;
  allPermissions: string[];
}

/**
 * User roles
 */
export interface IUserRoles {
  userId: string;
  roles: IRole[];
  allPermissions: string[];
  assignedAt: Date[];
}

/**
 * Create role request
 */
export interface ICreateRoleRequest {
  name: string;
  description: string;
  type: RoleType;
  permissions?: string[];
  parentRoleId?: string;
  priority?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Update role request
 */
export interface IUpdateRoleRequest {
  name?: string;
  description?: string;
  status?: RoleStatus;
  permissions?: string[];
  parentRoleId?: string | null;
  priority?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Role permission
 */
export interface IRolePermission {
  roleId: string;
  permissionId: string;
  grantedAt: Date;
  grantedBy: string;
}

/**
 * Bulk assign request
 */
export interface IBulkAssignRequest {
  userIds: string[];
  roleId: string;
  expiresAt?: Date;
  reason?: string;
}

/**
 * Bulk revoke request
 */
export interface IBulkRevokeRequest {
  userIds: string[];
  roleId: string;
}

/**
 * Role hierarchy
 */
export interface IRoleHierarchy {
  roleId: string;
  parentRoleId?: string;
  childRoleIds: string[];
  depth: number;
  ancestors: string[];
  descendants: string[];
}

/**
 * Role statistics
 */
export interface IRoleStats {
  totalRoles: number;
  activeRoles: number;
  inactiveRoles: number;
  systemRoles: number;
  customRoles: number;
  temporaryRoles: number;
  totalAssignments: number;
  userCount: number;
  errors: number;
}

/**
 * Role event
 */
export interface IRoleEvent {
  type: 'role_created' | 'role_updated' | 'role_deleted' | 'role_activated' | 'role_deactivated' | 'role_assigned' | 'role_revoked' | 'hierarchy_changed' | 'permission_granted' | 'permission_revoked' | 'error';
  timestamp: Date;
  roleId: string;
  userId?: string;
  details?: Record<string, unknown>;
}

/**
 * Role listener
 */
export type RoleListener = (event: IRoleEvent) => Promise<void> | void;

/**
 * Role service configuration
 */
export interface IRoleServiceConfig {
  maxRoleDepth: number;
  allowCyclicHierarchy: boolean;
  defaultPermissionInheritance: boolean;
  roleIdPrefix: string;
}

/**
 * Bulk operation result
 */
export interface IBulkOperationResult {
  totalRequested: number;
  successful: number;
  failed: number;
  errors: Array<{
    userId: string;
    error: string;
  }>;
}

/**
 * Role permission matrix
 */
export interface IRolePermissionMatrix {
  roleId: string;
  roleName: string;
  directPermissions: string[];
  inheritedPermissions: string[];
  totalPermissions: string[];
  source: Record<string, string[]>;
}

/**
 * Conflicting permission
 */
export interface IConflictingPermission {
  permission: string;
  fromRole1: string;
  fromRole2: string;
  role1Name: string;
  role2Name: string;
}

/**
 * Role comparison
 */
export interface IRoleComparison {
  role1Id: string;
  role2Id: string;
  commonPermissions: string[];
  uniqueToRole1: string[];
  uniqueToRole2: string[];
  conflicts: IConflictingPermission[];
}

/**
 * Audit log entry
 */
export interface IAuditLogEntry {
  entryId: string;
  action: string;
  roleId: string;
  userId?: string;
  changes: Record<string, unknown>;
  timestamp: Date;
  performedBy: string;
}

/**
 * Expiration status
 */
export interface IExpirationStatus {
  assignmentId: string;
  userId: string;
  roleId: string;
  expiresAt: Date;
  daysUntilExpiration: number;
  isExpired: boolean;
}
