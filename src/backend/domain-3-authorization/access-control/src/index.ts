/**
 * Access Control Service - Public API
 */

export { AccessControlService, createAccessControlService } from './main';
export type {
  ResourceType,
  ActionType,
  AccessDecision,
  IAccessContext,
  IResource,
  IAccessPolicy,
  IPrincipal,
  ICondition,
  IAccessControlDecision,
  IAccessRequest,
  IAccessGrant,
  IAccessRevocation,
  IAccessAuditEntry,
  IAccessStats,
  IPolicyEvaluationResult,
  IResourceAccessMatrix,
  IAccessControlEvent,
  AccessControlListener,
  IAccessControlConfig,
  IPolicyConflict,
  ICreatePolicyRequest,
  IUpdatePolicyRequest,
  IBulkAccessGrantRequest,
  IBulkAccessRevocationRequest,
  IAccessEvaluationResult,
  IResourceOwner,
  IAccessDelegation,
  IApprovalWorkflow,
  IAccessApprovalRequest,
  IBulkOperationResult,
} from './types';
