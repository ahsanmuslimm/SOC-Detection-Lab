/**
 * Access Control Service - Type Definitions
 * Resource-based access control with context-aware decision making
 */

/**
 * Resource type enumeration
 */
export type ResourceType =
  | 'alert'
  | 'case'
  | 'investigation'
  | 'report'
  | 'dashboard'
  | 'configuration'
  | 'user'
  | 'role'
  | 'permission'
  | 'system'
  | 'custom';

/**
 * Action type enumeration
 */
export type ActionType =
  | 'read'
  | 'write'
  | 'delete'
  | 'create'
  | 'update'
  | 'execute'
  | 'approve'
  | 'manage'
  | 'export'
  | 'share'
  | 'archive'
  | 'custom';

/**
 * Access decision type
 */
export type AccessDecision = 'allow' | 'deny' | 'deny_with_reason';

/**
 * Context information for access decisions
 */
export interface IAccessContext {
  userId: string;
  userRoles?: string[];
  userPermissions?: string[];
  ipAddress?: string;
  timestamp?: Date;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Resource information
 */
export interface IResource {
  resourceId: string;
  resourceType: ResourceType;
  ownerId: string;
  isPublic: boolean;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  department?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Access policy
 */
export interface IAccessPolicy {
  policyId: string;
  name: string;
  description: string;
  resource: ResourceType;
  action: ActionType;
  effect: 'allow' | 'deny';
  principals: IPrincipal[];
  conditions?: ICondition[];
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Principal (user, role, group)
 */
export interface IPrincipal {
  principalType: 'user' | 'role' | 'group';
  principalId: string;
}

/**
 * Policy condition
 */
export interface ICondition {
  conditionType:
    | 'time'
    | 'ip'
    | 'department'
    | 'sensitivity'
    | 'custom';
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'in_range';
  values: string[];
}

/**
 * Access control decision
 */
export interface IAccessControlDecision {
  decision: AccessDecision;
  policyId?: string;
  reason?: string;
  reasons?: string[];
  evaluatedAt: Date;
  evaluationTime: number;
}

/**
 * Resource access request
 */
export interface IAccessRequest {
  userId: string;
  resource: ResourceType;
  resourceId?: string;
  action: ActionType;
  context?: IAccessContext;
}

/**
 * Access grant
 */
export interface IAccessGrant {
  grantId: string;
  userId: string;
  resource: ResourceType;
  resourceId?: string;
  action: ActionType;
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
  reason?: string;
}

/**
 * Access revocation
 */
export interface IAccessRevocation {
  revocationId: string;
  grantId: string;
  revokedAt: Date;
  revokedBy: string;
  reason?: string;
}

/**
 * Access audit entry
 */
export interface IAccessAuditEntry {
  auditId: string;
  action: 'access_request' | 'access_granted' | 'access_denied' | 'access_revoked' | 'policy_evaluated';
  userId: string;
  resource: ResourceType;
  resourceId?: string;
  actionType: ActionType;
  decision: AccessDecision;
  policyId?: string;
  timestamp: Date;
  evaluationTime?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Access statistics
 */
export interface IAccessStats {
  totalRequests: number;
  allowedRequests: number;
  deniedRequests: number;
  totalPolicies: number;
  activePolicies: number;
  totalGrants: number;
  activeGrants: number;
  averageEvaluationTime: number;
  requestsByResource: Record<ResourceType, number>;
  requestsByAction: Record<ActionType, number>;
  allowDenyRatio: number;
  errors: number;
}

/**
 * Policy evaluation result
 */
export interface IPolicyEvaluationResult {
  policyId: string;
  policyName: string;
  matched: boolean;
  effect: 'allow' | 'deny';
  conditionsMet: boolean;
  principalMatched: boolean;
  evaluationTime: number;
}

/**
 * Resource access matrix
 */
export interface IResourceAccessMatrix {
  userId: string;
  resources: Array<{
    resource: ResourceType;
    actions: ActionType[];
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canManage: boolean;
  }>;
  totalResources: number;
  totalActions: number;
}

/**
 * Access control event
 */
export interface IAccessControlEvent {
  type: 'policy_created' | 'policy_updated' | 'policy_deleted' | 'policy_evaluated' | 'access_granted' | 'access_denied' | 'access_revoked' | 'error';
  timestamp: Date;
  policyId?: string;
  userId?: string;
  details?: Record<string, unknown>;
}

/**
 * Access control listener
 */
export type AccessControlListener = (event: IAccessControlEvent) => Promise<void> | void;

/**
 * Access control configuration
 */
export interface IAccessControlConfig {
  enableCaching: boolean;
  cacheTtl: number;
  maxCacheSize: number;
  enableAuditLogging: boolean;
  evaluationTimeout: number;
  defaultEffect: 'allow' | 'deny';
  enableContextEvaluation: boolean;
}

/**
 * Policy conflict
 */
export interface IPolicyConflict {
  policyId1: string;
  policyId2: string;
  conflictType: 'effect' | 'principals' | 'resources';
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

/**
 * Resource hierarchy
 */
export interface IResourceHierarchy {
  resourceId: string;
  resourceType: ResourceType;
  parentResourceId?: string;
  childResources: string[];
  level: number;
}

/**
 * Create policy request
 */
export interface ICreatePolicyRequest {
  name: string;
  description: string;
  resource: ResourceType;
  action: ActionType;
  effect: 'allow' | 'deny';
  principals: IPrincipal[];
  conditions?: ICondition[];
  priority?: number;
}

/**
 * Update policy request
 */
export interface IUpdatePolicyRequest {
  name?: string;
  description?: string;
  effect?: 'allow' | 'deny';
  principals?: IPrincipal[];
  conditions?: ICondition[];
  priority?: number;
  isActive?: boolean;
}

/**
 * Bulk access grant request
 */
export interface IBulkAccessGrantRequest {
  userIds: string[];
  resources: ResourceType[];
  actions: ActionType[];
  reason?: string;
  expiresAt?: Date;
}

/**
 * Bulk access revocation request
 */
export interface IBulkAccessRevocationRequest {
  grantIds: string[];
  reason?: string;
}

/**
 * Access evaluation result
 */
export interface IAccessEvaluationResult {
  userId: string;
  resource: ResourceType;
  action: ActionType;
  allowed: boolean;
  policyId?: string;
  evaluatedPolicies: IPolicyEvaluationResult[];
  evaluationTime: number;
  cacheHit: boolean;
}

/**
 * Resource owner information
 */
export interface IResourceOwner {
  ownerId: string;
  ownerType: 'user' | 'department' | 'team';
  ownerName: string;
  canDelegate: boolean;
}

/**
 * Access delegation
 */
export interface IAccessDelegation {
  delegationId: string;
  fromUserId: string;
  toUserId: string;
  resource: ResourceType;
  resourceId?: string;
  action: ActionType;
  delegatedAt: Date;
  expiresAt?: Date;
  canRedelegate: boolean;
}

/**
 * Approval workflow
 */
export interface IApprovalWorkflow {
  workflowId: string;
  resource: ResourceType;
  action: ActionType;
  requiredApprovers: number;
  approvalTimeout: number;
  escalationEnabled: boolean;
}

/**
 * Access approval request
 */
export interface IAccessApprovalRequest {
  approvalId: string;
  userId: string;
  resource: ResourceType;
  resourceId?: string;
  action: ActionType;
  requestedAt: Date;
  requiredApprovals: number;
  currentApprovals: number;
  status: 'pending' | 'approved' | 'denied' | 'expired';
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
