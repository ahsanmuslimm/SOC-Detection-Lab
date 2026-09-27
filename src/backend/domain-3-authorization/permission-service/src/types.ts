/**
 * Permission Service - Type Definitions
 * Type definitions for fine-grained permission management
 */

/**
 * Permission resource type
 */
export type ResourceType = 'user' | 'role' | 'resource' | 'report' | 'system' | 'custom';

/**
 * Permission action
 */
export type PermissionAction = 'read' | 'write' | 'delete' | 'create' | 'update' | 'execute' | 'manage' | 'approve' | 'custom';

/**
 * Permission
 */
export interface IPermission {
  permissionId: string;
  name: string;
  description: string;
  resource: ResourceType;
  action: PermissionAction;
  scope?: string;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

/**
 * Permission with relationships
 */
export interface IPermissionWithDetails extends IPermission {
  rolesCount: number;
  usersCount: number;
  lastModifiedBy?: string;
}

/**
 * User permission
 */
export interface IUserPermission {
  permissionId: string;
  userId: string;
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
  reason?: string;
}

/**
 * Role permission
 */
export interface IRolePermission {
  permissionId: string;
  roleId: string;
  grantedAt: Date;
  grantedBy: string;
}

/**
 * Permission group
 */
export interface IPermissionGroup {
  groupId: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

/**
 * Permission matrix entry
 */
export interface IPermissionMatrixEntry {
  resource: ResourceType;
  action: PermissionAction;
  hasPermission: boolean;
  grantedBy: string;
  grantedAt: Date;
}

/**
 * User permissions summary
 */
export interface IUserPermissionsSummary {
  userId: string;
  permissions: IPermission[];
  permissionGroups: IPermissionGroup[];
  totalPermissions: number;
  directPermissions: number;
  inheritedPermissions: number;
}

/**
 * Resource-based permission
 */
export interface IResourcePermission {
  permissionId: string;
  resource: string;
  resourceId: string;
  action: PermissionAction;
  users: string[];
  roles: string[];
}

/**
 * Permission check request
 */
export interface IPermissionCheckRequest {
  userId: string;
  resource: ResourceType;
  action: PermissionAction;
  resourceId?: string;
  context?: Record<string, unknown>;
}

/**
 * Permission check result
 */
export interface IPermissionCheckResult {
  allowed: boolean;
  permissionId?: string;
  reason?: string;
  denialReasons?: string[];
}

/**
 * Bulk permission request
 */
export interface IBulkPermissionRequest {
  permissionIds: string[];
  userIds?: string[];
  roleIds?: string[];
  action: 'grant' | 'revoke';
}

/**
 * Create permission request
 */
export interface ICreatePermissionRequest {
  name: string;
  description: string;
  resource: ResourceType;
  action: PermissionAction;
  scope?: string;
  priority?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Update permission request
 */
export interface IUpdatePermissionRequest {
  name?: string;
  description?: string;
  scope?: string;
  priority?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Permission statistics
 */
export interface IPermissionStats {
  totalPermissions: number;
  activePermissions: number;
  groupedPermissions: number;
  permissionsGrantedToUsers: number;
  permissionsGrantedToRoles: number;
  resourceTypes: Record<ResourceType, number>;
  actionTypes: Record<PermissionAction, number>;
  errors: number;
}

/**
 * Permission event
 */
export interface IPermissionEvent {
  type: 'permission_created' | 'permission_updated' | 'permission_deleted' | 'permission_granted' | 'permission_revoked' | 'group_created' | 'group_updated' | 'group_deleted' | 'error';
  timestamp: Date;
  permissionId: string;
  userId?: string;
  roleId?: string;
  details?: Record<string, unknown>;
}

/**
 * Permission listener
 */
export type PermissionListener = (event: IPermissionEvent) => Promise<void> | void;

/**
 * Permission service configuration
 */
export interface IPermissionServiceConfig {
  enableResourceScoping: boolean;
  enableGrouping: boolean;
  maxPermissionsPerUser: number;
  permissionCacheTimeout: number;
  cacheSize: number;
}

/**
 * Permission conflict
 */
export interface IPermissionConflict {
  permissionId1: string;
  permissionId2: string;
  conflictType: 'resource' | 'action' | 'scope';
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

/**
 * Permission audit entry
 */
export interface IPermissionAuditEntry {
  entryId: string;
  action: string;
  permissionId: string;
  userId?: string;
  changes: Record<string, unknown>;
  timestamp: Date;
  performedBy: string;
}

/**
 * Permission hierarchy
 */
export interface IPermissionHierarchy {
  permissionId: string;
  parent?: IPermission;
  children: IPermission[];
  level: number;
}

/**
 * Permission scope
 */
export interface IPermissionScope {
  scopeId: string;
  resource: ResourceType;
  resourceId: string;
  permissions: string[];
}

/**
 * Bulk operation result
 */
export interface IBulkOperationResult {
  totalRequested: number;
  successful: number;
  failed: number;
  errors: Array<{
    itemId: string;
    error: string;
  }>;
}
