/**
 * Access Control Service - Implementation
 * Resource-based access control with context-aware decision making
 */

import { randomBytes } from 'crypto';
import type {
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

/**
 * Access Control Service - Manages resource-based access control
 */
export class AccessControlService {
  private policies: Map<string, IAccessPolicy>;
  private grants: Map<string, IAccessGrant>;
  private revocations: Map<string, IAccessRevocation>;
  private delegations: Map<string, IAccessDelegation>;
  private approvals: Map<string, IAccessApprovalRequest>;
  private resources: Map<string, IResource>;
  private resourceOwners: Map<string, IResourceOwner>;
  private listeners: Set<AccessControlListener>;
  private auditLog: IAccessAuditEntry[];
  private stats: IAccessStats;
  private config: IAccessControlConfig;
  private evaluationCache: Map<string, IAccessControlDecision>;

  constructor(config: IAccessControlConfig) {
    this.validateConfig(config);
    this.config = config;
    this.policies = new Map();
    this.grants = new Map();
    this.revocations = new Map();
    this.delegations = new Map();
    this.approvals = new Map();
    this.resources = new Map();
    this.resourceOwners = new Map();
    this.listeners = new Set();
    this.auditLog = [];
    this.evaluationCache = new Map();
    this.stats = {
      totalRequests: 0,
      allowedRequests: 0,
      deniedRequests: 0,
      totalPolicies: 0,
      activePolicies: 0,
      totalGrants: 0,
      activeGrants: 0,
      averageEvaluationTime: 0,
      requestsByResource: {},
      requestsByAction: {},
      allowDenyRatio: 0,
      errors: 0,
    };
  }

  /**
   * Validate service configuration
   */
  private validateConfig(config: IAccessControlConfig): void {
    if (!config) {
      throw new Error('Access control configuration is required');
    }
    if (config.evaluationTimeout < 100) {
      throw new Error('evaluationTimeout must be at least 100ms');
    }
    if (config.cacheTtl < 1000) {
      throw new Error('cacheTtl must be at least 1000ms');
    }
  }

  /**
   * Create access control policy
   */
  async createPolicy(
    request: ICreatePolicyRequest,
    createdBy: string
  ): Promise<IAccessPolicy> {
    if (!request.name || !request.resource || !request.action || !request.effect) {
      throw new Error('Policy name, resource, action, and effect are required');
    }

    const policyId = this.generatePolicyId();
    const policy: IAccessPolicy = {
      policyId,
      name: request.name,
      description: request.description || '',
      resource: request.resource,
      action: request.action,
      effect: request.effect,
      principals: request.principals || [],
      conditions: request.conditions || [],
      priority: request.priority ?? 100,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
    };

    this.policies.set(policyId, policy);
    this.stats.totalPolicies++;
    this.stats.activePolicies++;

    this.logAudit('policy_created', {
      policyId,
      name: policy.name,
      resource: policy.resource,
      action: policy.action,
    });

    this.emitEvent('policy_created', {
      policyId,
      details: { name: policy.name, effect: policy.effect },
    });

    return policy;
  }

  /**
   * Get policy by ID
   */
  async getPolicy(policyId: string): Promise<IAccessPolicy | null> {
    return this.policies.get(policyId) || null;
  }

  /**
   * Update policy
   */
  async updatePolicy(
    policyId: string,
    request: IUpdatePolicyRequest,
    updatedBy: string
  ): Promise<IAccessPolicy> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy not found: ${policyId}`);
    }

    const oldState = { ...policy };

    if (request.name !== undefined) policy.name = request.name;
    if (request.description !== undefined) policy.description = request.description;
    if (request.effect !== undefined) policy.effect = request.effect;
    if (request.principals !== undefined) policy.principals = request.principals;
    if (request.conditions !== undefined) policy.conditions = request.conditions;
    if (request.priority !== undefined) policy.priority = request.priority;
    if (request.isActive !== undefined) {
      policy.isActive = request.isActive;
      if (request.isActive) {
        this.stats.activePolicies++;
      } else {
        this.stats.activePolicies--;
      }
    }

    policy.updatedAt = new Date();

    this.logAudit('policy_updated', {
      policyId,
      before: oldState,
      after: policy,
    });

    this.emitEvent('policy_updated', {
      policyId,
      details: { changes: request },
    });

    return policy;
  }

  /**
   * Delete policy
   */
  async deletePolicy(policyId: string, deletedBy: string): Promise<boolean> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy not found: ${policyId}`);
    }

    this.policies.delete(policyId);
    this.stats.totalPolicies--;
    if (policy.isActive) this.stats.activePolicies--;

    this.logAudit('policy_deleted', {
      policyId,
      name: policy.name,
    });

    this.emitEvent('policy_deleted', {
      policyId,
    });

    return true;
  }

  /**
   * Evaluate access control decision
   */
  async evaluateAccess(request: IAccessRequest): Promise<IAccessEvaluationResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);

    // Check cache
    if (this.config.enableCaching) {
      const cached = this.evaluationCache.get(cacheKey);
      if (cached) {
        const endTime = Date.now();
        return {
          userId: request.userId,
          resource: request.resource,
          action: request.action,
          allowed: cached.decision === 'allow',
          evaluatedPolicies: [],
          evaluationTime: endTime - startTime,
          cacheHit: true,
        };
      }
    }

    const evaluatedPolicies: IPolicyEvaluationResult[] = [];
    let allowed = false;

    // Get applicable policies
    const applicablePolicies = this.getApplicablePolicies(
      request.resource,
      request.action
    );

    // Evaluate each policy
    for (const policy of applicablePolicies) {
      const result = this.evaluatePolicy(policy, request);
      evaluatedPolicies.push(result);

      if (result.matched && result.effect === 'allow') {
        allowed = true;
        break;
      }

      if (result.matched && result.effect === 'deny') {
        allowed = false;
        break;
      }
    }

    const endTime = Date.now();
    const evaluationTime = endTime - startTime;

    // Update stats
    this.stats.totalRequests++;
    this.updateRequestStats(request.resource, request.action);
    if (allowed) {
      this.stats.allowedRequests++;
    } else {
      this.stats.deniedRequests++;
    }
    this.stats.allowDenyRatio =
      this.stats.deniedRequests > 0
        ? this.stats.allowedRequests / this.stats.deniedRequests
        : this.stats.allowedRequests;

    // Cache result
    if (this.config.enableCaching) {
      const decision: IAccessControlDecision = {
        decision: allowed ? 'allow' : 'deny',
        evaluatedAt: new Date(),
        evaluationTime,
      };
      this.evaluationCache.set(cacheKey, decision);
    }

    // Log audit
    if (this.config.enableAuditLogging) {
      this.logAccessAudit({
        userId: request.userId,
        resource: request.resource,
        resourceId: request.resourceId,
        action: request.action,
        allowed,
        evaluatedPolicies,
        evaluationTime,
      });
    }

    return {
      userId: request.userId,
      resource: request.resource,
      action: request.action,
      allowed,
      evaluatedPolicies,
      evaluationTime,
      cacheHit: false,
    };
  }

  /**
   * Get policies for resource and action
   */
  private getApplicablePolicies(
    resource: ResourceType,
    action: ActionType
  ): IAccessPolicy[] {
    const applicable: IAccessPolicy[] = [];

    for (const policy of this.policies.values()) {
      if (policy.isActive && policy.resource === resource && policy.action === action) {
        applicable.push(policy);
      }
    }

    // Sort by priority (higher priority first)
    return applicable.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Evaluate single policy
   */
  private evaluatePolicy(
    policy: IAccessPolicy,
    request: IAccessRequest
  ): IPolicyEvaluationResult {
    const startTime = Date.now();

    // Check principals
    const principalMatched = this.evaluatePrincipals(
      policy.principals,
      request.userId,
      request.context?.userRoles || []
    );

    if (!principalMatched) {
      return {
        policyId: policy.policyId,
        policyName: policy.name,
        matched: false,
        effect: policy.effect,
        conditionsMet: false,
        principalMatched: false,
        evaluationTime: Date.now() - startTime,
      };
    }

    // Check conditions
    const conditionsMet = this.evaluateConditions(
      policy.conditions || [],
      request.context || {}
    );

    const matched = principalMatched && conditionsMet;

    return {
      policyId: policy.policyId,
      policyName: policy.name,
      matched,
      effect: policy.effect,
      conditionsMet,
      principalMatched,
      evaluationTime: Date.now() - startTime,
    };
  }

  /**
   * Evaluate principals
   */
  private evaluatePrincipals(
    principals: IPrincipal[],
    userId: string,
    userRoles: string[]
  ): boolean {
    if (principals.length === 0) return true;

    for (const principal of principals) {
      if (principal.principalType === 'user' && principal.principalId === userId) {
        return true;
      }
      if (principal.principalType === 'role' && userRoles.includes(principal.principalId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(
    conditions: ICondition[],
    context: IAccessContext
  ): boolean {
    if (conditions.length === 0) return true;

    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(condition: ICondition, context: IAccessContext): boolean {
    switch (condition.conditionType) {
      case 'ip':
        return this.evaluateIpCondition(condition, context.ipAddress);
      case 'time':
        return this.evaluateTimeCondition(condition);
      case 'department':
        return this.evaluateDepartmentCondition(condition, context.metadata?.department);
      default:
        return true;
    }
  }

  /**
   * Evaluate IP condition
   */
  private evaluateIpCondition(condition: ICondition, ip?: string): boolean {
    if (!ip) return false;

    switch (condition.operator) {
      case 'equals':
        return condition.values.includes(ip);
      case 'not_equals':
        return !condition.values.includes(ip);
      case 'contains':
        return condition.values.some(v => ip.includes(v));
      default:
        return true;
    }
  }

  /**
   * Evaluate time condition
   */
  private evaluateTimeCondition(condition: ICondition): boolean {
    const now = new Date().getHours();

    if (condition.operator === 'in_range' && condition.values.length >= 2) {
      const start = parseInt(condition.values[0]);
      const end = parseInt(condition.values[1]);
      return now >= start && now <= end;
    }

    return true;
  }

  /**
   * Evaluate department condition
   */
  private evaluateDepartmentCondition(
    condition: ICondition,
    department?: unknown
  ): boolean {
    if (!department) return false;

    const deptStr = String(department);

    switch (condition.operator) {
      case 'equals':
        return condition.values.includes(deptStr);
      case 'not_equals':
        return !condition.values.includes(deptStr);
      default:
        return true;
    }
  }

  /**
   * Grant access
   */
  async grantAccess(
    request: IAccessRequest,
    grantedBy: string,
    expiresAt?: Date,
    reason?: string
  ): Promise<IAccessGrant> {
    const grantId = this.generateGrantId();
    const grant: IAccessGrant = {
      grantId,
      userId: request.userId,
      resource: request.resource,
      resourceId: request.resourceId,
      action: request.action,
      grantedAt: new Date(),
      grantedBy,
      expiresAt,
      reason,
    };

    this.grants.set(grantId, grant);
    this.stats.totalGrants++;
    this.stats.activeGrants++;

    this.logAudit('access_granted', {
      grantId,
      userId: request.userId,
      resource: request.resource,
      action: request.action,
    });

    this.emitEvent('access_granted', {
      details: { grantId, userId: request.userId },
    });

    return grant;
  }

  /**
   * Revoke access
   */
  async revokeAccess(grantId: string, revokedBy: string, reason?: string): Promise<boolean> {
    const grant = this.grants.get(grantId);
    if (!grant) {
      throw new Error(`Access grant not found: ${grantId}`);
    }

    const revocationId = this.generateRevocationId();
    const revocation: IAccessRevocation = {
      revocationId,
      grantId,
      revokedAt: new Date(),
      revokedBy,
      reason,
    };

    this.revocations.set(revocationId, revocation);
    this.grants.delete(grantId);
    this.stats.activeGrants--;

    this.logAudit('access_revoked', {
      grantId,
      revocationId,
      revokedBy,
    });

    this.emitEvent('access_revoked', {
      details: { grantId, revocationId },
    });

    return true;
  }

  /**
   * Create access delegation
   */
  async delegateAccess(
    userId: string,
    toUserId: string,
    resource: ResourceType,
    action: ActionType,
    delegatedBy: string,
    expiresAt?: Date,
    canRedelegate: boolean = false
  ): Promise<IAccessDelegation> {
    const delegationId = this.generateDelegationId();
    const delegation: IAccessDelegation = {
      delegationId,
      fromUserId: userId,
      toUserId,
      resource,
      action,
      delegatedAt: new Date(),
      expiresAt,
      canRedelegate,
    };

    this.delegations.set(delegationId, delegation);

    this.logAudit('access_delegated', {
      delegationId,
      fromUserId: userId,
      toUserId,
      resource,
      action,
    });

    return delegation;
  }

  /**
   * Get grants for user
   */
  async getUserGrants(userId: string): Promise<IAccessGrant[]> {
    const userGrants: IAccessGrant[] = [];

    for (const grant of this.grants.values()) {
      if (grant.userId === userId) {
        userGrants.push(grant);
      }
    }

    return userGrants;
  }

  /**
   * Get delegations for user
   */
  async getUserDelegations(userId: string): Promise<IAccessDelegation[]> {
    const userDelegations: IAccessDelegation[] = [];

    for (const delegation of this.delegations.values()) {
      if (delegation.toUserId === userId) {
        userDelegations.push(delegation);
      }
    }

    return userDelegations;
  }

  /**
   * Get all policies
   */
  async getAllPolicies(resource?: ResourceType, action?: ActionType): Promise<IAccessPolicy[]> {
    const policies: IAccessPolicy[] = [];

    for (const policy of this.policies.values()) {
      if (
        (!resource || policy.resource === resource) &&
        (!action || policy.action === action)
      ) {
        policies.push(policy);
      }
    }

    return policies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get resource access matrix for user
   */
  async getResourceAccessMatrix(userId: string, userRoles: string[] = []): Promise<IResourceAccessMatrix> {
    const resourceTypes: ResourceType[] = [
      'alert',
      'case',
      'investigation',
      'report',
      'dashboard',
      'configuration',
      'user',
      'role',
      'permission',
      'system',
    ];
    const actionTypes: ActionType[] = ['read', 'write', 'delete', 'create', 'update', 'manage'];

    const matrix: IResourceAccessMatrix = {
      userId,
      resources: [],
      totalResources: 0,
      totalActions: 0,
    };

    for (const resource of resourceTypes) {
      const actions: ActionType[] = [];
      let canRead = false;
      let canWrite = false;
      let canDelete = false;
      let canManage = false;

      for (const action of actionTypes) {
        const result = await this.evaluateAccess({
          userId,
          resource,
          action,
          context: { userId, userRoles },
        });

        if (result.allowed) {
          actions.push(action);

          if (action === 'read') canRead = true;
          if (action === 'write') canWrite = true;
          if (action === 'delete') canDelete = true;
          if (action === 'manage') canManage = true;
        }
      }

      if (actions.length > 0) {
        matrix.resources.push({
          resource,
          actions,
          canRead,
          canWrite,
          canDelete,
          canManage,
        });
        matrix.totalResources++;
        matrix.totalActions += actions.length;
      }
    }

    return matrix;
  }

  /**
   * Detect policy conflicts
   */
  async detectConflicts(): Promise<IPolicyConflict[]> {
    const conflicts: IPolicyConflict[] = [];
    const policyArray = Array.from(this.policies.values());

    for (let i = 0; i < policyArray.length; i++) {
      for (let j = i + 1; j < policyArray.length; j++) {
        const p1 = policyArray[i];
        const p2 = policyArray[j];

        if (
          p1.resource === p2.resource &&
          p1.action === p2.action &&
          p1.effect !== p2.effect
        ) {
          conflicts.push({
            policyId1: p1.policyId,
            policyId2: p2.policyId,
            conflictType: 'effect',
            severity: 'high',
            recommendation: `Conflicting policies: ${p1.name} (${p1.effect}) vs ${p2.name} (${p2.effect})`,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Get statistics
   */
  getStats(): IAccessStats {
    return { ...this.stats };
  }

  /**
   * Get audit log
   */
  getAuditLog(limit: number = 100): IAccessAuditEntry[] {
    return this.auditLog.slice(-limit);
  }

  /**
   * Register event listener
   */
  onAccessControl(listener: AccessControlListener): this {
    this.listeners.add(listener);
    return this;
  }

  /**
   * Remove event listener
   */
  offAccessControl(listener: AccessControlListener): this {
    this.listeners.delete(listener);
    return this;
  }

  /**
   * Clear evaluation cache
   */
  clearCache(): void {
    this.evaluationCache.clear();
  }

  /**
   * Private helper methods
   */

  private generatePolicyId(): string {
    return `pol_${randomBytes(8).toString('hex')}`;
  }

  private generateGrantId(): string {
    return `grt_${randomBytes(8).toString('hex')}`;
  }

  private generateRevocationId(): string {
    return `rev_${randomBytes(8).toString('hex')}`;
  }

  private generateDelegationId(): string {
    return `del_${randomBytes(8).toString('hex')}`;
  }

  private generateCacheKey(request: IAccessRequest): string {
    return `${request.userId}:${request.resource}:${request.action}:${request.resourceId || '*'}`;
  }

  private updateRequestStats(resource: ResourceType, action: ActionType): void {
    const rt = this.stats.requestsByResource as Record<ResourceType, number>;
    rt[resource] = (rt[resource] || 0) + 1;

    const at = this.stats.requestsByAction as Record<ActionType, number>;
    at[action] = (at[action] || 0) + 1;
  }

  private logAudit(action: string, details: Record<string, unknown>): void {
    const auditId = `aud_${randomBytes(8).toString('hex')}`;
    const entry: Partial<IAccessAuditEntry> = {
      auditId,
      action: action as any,
      timestamp: new Date(),
      metadata: details,
    };
    this.auditLog.push(entry as IAccessAuditEntry);
  }

  private logAccessAudit(details: {
    userId: string;
    resource: ResourceType;
    resourceId?: string;
    action: ActionType;
    allowed: boolean;
    evaluatedPolicies: IPolicyEvaluationResult[];
    evaluationTime: number;
  }): void {
    const auditId = `aud_${randomBytes(8).toString('hex')}`;
    const entry: IAccessAuditEntry = {
      auditId,
      action: details.allowed ? 'access_granted' : 'access_denied',
      userId: details.userId,
      resource: details.resource,
      resourceId: details.resourceId,
      actionType: details.action,
      decision: details.allowed ? 'allow' : 'deny',
      timestamp: new Date(),
      evaluationTime: details.evaluationTime,
      metadata: {
        policiesEvaluated: details.evaluatedPolicies.length,
      },
    };
    this.auditLog.push(entry);
  }

  private async emitEvent(
    type: IAccessControlEvent['type'],
    details?: Record<string, unknown>
  ): Promise<void> {
    const event: IAccessControlEvent = {
      type,
      timestamp: new Date(),
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
 * Factory function to create Access Control Service
 */
export function createAccessControlService(
  config: IAccessControlConfig
): AccessControlService {
  return new AccessControlService(config);
}
