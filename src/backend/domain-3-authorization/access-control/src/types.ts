/**
 * Access Control Service - Type Definitions
 * Type definitions for resource-based access control (RBAC/ABAC)
 */

/**
 * Access effect type
 */
export type AccessEffect = 'allow' | 'deny' | 'conditional';

/**
 * Resource type
 */
export type ResourceType = 'report' | 'alert' | 'investigation' | 'case' | 'user' | 'system' | 'custom';

/**
 * Access context
 */
export interface IAccessContext {
  userId: string;
  resource: ResourceType;
  resourceId?: string;
  action: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Access decision
 */
export interface IAccessDecision {
  allowed: boolean;
  effect: AccessEffect;
  reason?: string;
  denialReasons?: string[];
  matchedPolicy?: string;
  appliedConditions?: string[];
  evaluatedAt: Date;
  expiration?: Date;
}

/**
 * Access policy
 */
export interface IAccessPolicy {
  policyId: string;
  name: string;
  description: string;
  effect: AccessEffect;
  resources: ResourceType[] | string[];
  actions: string[];
  subjects: string[];
  conditions?: IAccessCondition[];
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

/**
 * Access condition for policies
 */
export interface IAccessCondition {
  type: 'role' | 'permission' | 'ownership' | 'group' | 'time' | 'ip' | 'custom';
  operator: 'eq' | 'neq' | 'in' | 'not_in' | 'starts_with' | 'ends_with' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte';
  value: unknown;
  negate?: boolean;
}

/**
 * Resource with ownership
 */
export interface IResource {
  resourceId: string;
  type: ResourceType;
  ownerId: string;
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Owner check result
 */
export interface IOwnershipCheck {
  isOwner: boolean;
  ownerId: string;
  resourceId: string;
  resourceType: ResourceType;
}

/**
 * Group access check
 */
export interface IGroupAccess {
  hasAccess: boolean;
  groupId: string;
  userId: string;
  roles: string[];
  permissions: string[];
}

/**
 * Delegated access
 */
export interface IDelegatedAccess {
  delegationId: string;
  from: string;
  to: string;
  resource: ResourceType;
  resourceId?: string;
  action: string;
  expiresAt?: Date;
  grantedAt: Date;
  grantedBy: string;
}

/**
 * Access audit entry
 */
export interface IAccessAuditEntry {
  entryId: string;
  userId: string;
  resource: ResourceType;
  resourceId?: string;
  action: string;
  allowed: boolean;
  denialReason?: string;
  timestamp: Date;
  context?: IAccessContext;
}

/**
 * Access statistics
 */
export interface IAccessStats {
  totalDecisions: number;
  allowedDecisions: number;
  deniedDecisions: number;
  averageEvaluationTime: number;
  policiesApplied: Record<string, number>;
  resourceTypes: Record<ResourceType, number>;
  actions: Record<string, number>;
  topDenialReasons: string[];
  errors: number;
}

/**
 * Filtered result
 */
export interface IFilteredResult<T> {
  items: T[];
  total: number;
  filtered: number;
}

/**
 * Bulk access request
 */
export interface IBulkAccessRequest {
  userIds: string[];
  resource: ResourceType;
  action: string;
  resourceIds?: string[];
}

/**
 * Bulk access result
 */
export interface IBulkAccessResult {
  totalRequested: number;
  allowedCount: number;
  deniedCount: number;
  results: Array<{
    userId: string;
    allowed: boolean;
    reason?: string;
  }>;
}

/**
 * Cache entry for access decisions
 */
export interface IAccessCacheEntry {
  key: string;
  decision: IAccessDecision;
  timestamp: Date;
  expiresAt: Date;
}

/**
 * Policy evaluation context
 */
export interface IPolicyEvaluationContext {
  policy: IAccessPolicy;
  context: IAccessContext;
  userRoles: string[];
  userPermissions: string[];
  isOwner: boolean;
  groupAccess?: IGroupAccess;
}

/**
 * Resource access matrix
 */
export interface IResourceAccessMatrix {
  resourceId: string;
  resourceType: ResourceType;
  userId: string;
  permissions: Record<string, boolean>;
  roles: string[];
  isDelegated: boolean;
  isOwner: boolean;
}

/**
 * Access rule
 */
export interface IAccessRule {
  ruleId: string;
  name: string;
  resource: ResourceType;
  action: string;
  allowedRoles: string[];
  allowedPermissions: string[];
  conditions?: IAccessCondition[];
  priority: number;
  isActive: boolean;
}

/**
 * Conditional access token
 */
export interface IConditionalAccessToken {
  tokenId: string;
  userId: string;
  resource: ResourceType;
  resourceId: string;
  action: string;
  conditions: IAccessCondition[];
  issuedAt: Date;
  expiresAt: Date;
}

/**
 * Access event
 */
export interface IAccessEvent {
  type: 'decision_made' | 'access_granted' | 'access_denied' | 'policy_evaluated' | 'delegation_created' | 'audit_logged' | 'error';
  timestamp: Date;
  userId?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}

/**
 * Access listener callback
 */
export type AccessListener = (event: IAccessEvent) => Promise<void> | void;

/**
 * Policy conflict
 */
export interface IPolicyConflict {
  policy1Id: string;
  policy2Id: string;
  conflictType: 'overlapping_resources' | 'conflicting_effects' | 'priority_unclear';
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

/**
 * Access control service configuration
 */
export interface IAccessControlConfig {
  enableCaching: boolean;
  cacheTimeout: number;
  maxCacheSize: number;
  enableAuiting: boolean;
  auditRetention: number;
  maxPolicies: number;
  evaluationTimeout: number;
  defaultDeny: boolean;
}

/**
 * Create policy request
 */
export interface ICreatePolicyRequest {
  name: string;
  description: string;
  effect: AccessEffect;
  resources: ResourceType[] | string[];
  actions: string[];
  subjects: string[];
  conditions?: IAccessCondition[];
  priority?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Update policy request
 */
export interface IUpdatePolicyRequest {
  name?: string;
  description?: string;
  effect?: AccessEffect;
  resources?: ResourceType[] | string[];
  actions?: string[];
  subjects?: string[];
  conditions?: IAccessCondition[];
  priority?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Update delegated access request
 */
export interface IUpdateDelegationRequest {
  expiresAt?: Date;
  action?: string;
  grantedBy?: string;
}

/**
 * Access result with time metrics
 */
export interface IAccessEvaluationResult {
  decision: IAccessDecision;
  evaluationTimeMs: number;
  policiesEvaluated: number;
  conditionsEvaluated: number;
  cacheHit: boolean;
}

/**
 * Attribute-based access control context
 */
export interface IAttributeContext {
  userAttributes: Record<string, unknown>;
  resourceAttributes: Record<string, unknown>;
  environmentAttributes: Record<string, unknown>;
}

/**
 * Policy statement
 */
export interface IPolicyStatement {
  effect: AccessEffect;
  actions: string[];
  resources: ResourceType[] | string[];
  conditions?: IAccessCondition[];
}
