/**
 * Access Control Service - Public API
 */

export { AccessControlService, createAccessControlService } from './main';
export type {
  IAccessContext,
  IAccessDecision,
  IAccessPolicy,
  IAccessCondition,
  IResource,
  IOwnershipCheck,
  IGroupAccess,
  IDelegatedAccess,
  IAccessAuditEntry,
  IAccessStats,
  IFilteredResult,
  IBulkAccessRequest,
  IBulkAccessResult,
  IAccessCacheEntry,
  IPolicyEvaluationContext,
  IResourceAccessMatrix,
  IAccessRule,
  IAccessEvent,
  AccessListener,
  IPolicyConflict,
  IAccessControlConfig,
  ICreatePolicyRequest,
  IUpdatePolicyRequest,
  IUpdateDelegationRequest,
  IAccessEvaluationResult,
  IAttributeContext,
  IPolicyStatement,
  AccessEffect,
  ResourceType,
} from './types';
