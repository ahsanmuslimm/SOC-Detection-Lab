/**
 * Role Service - Public API
 * Role management with hierarchy and permission assignment
 */

export { RoleService, createRoleService } from './main';

export type {
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
