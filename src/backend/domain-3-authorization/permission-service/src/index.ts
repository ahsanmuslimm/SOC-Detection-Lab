/**
 * Permission Service - Public API
 */

export { PermissionService, createPermissionService } from './main';
export type {
  ResourceType,
  PermissionAction,
  IPermission,
  IPermissionWithDetails,
  IUserPermission,
  IRolePermission,
  IPermissionGroup,
  IPermissionMatrixEntry,
  IUserPermissionsSummary,
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
  IPermissionHierarchy,
  IPermissionScope,
  IBulkOperationResult,
} from './types';
