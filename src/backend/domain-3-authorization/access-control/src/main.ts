/**
 * Access Control Service - Implementation
 * Resource-based access control with RBAC and ABAC support
 */

import { randomBytes } from 'crypto';
import type {
  IAccessContext,
  IAccessDecision,
  IAccessPolicy,
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
  AccessEffect,
  IAccessCondition,
} from './types';

/**
 * Access Control Service - Manages resource access control
 */
export class AccessControlService {
  private policies: Map<string, IAccessPolicy>;
  private resources: Map<string, IResource>;
  private delegations: Map<string, IDelegatedAccess>;
  private auditLog: IAccessAuditEntry[];
  private accessCache: Map<string, IAccessCacheEntry>;
  private listeners: Set<AccessListener>;
  private stats: IAccessStats;
  private config: IAccessControlConfig;

  // Dependencies (injected)
  private roleService: any;
  private permissionService: any;

  constructor(config: IAccessControlConfig) {
    this.validateConfig(config);
    this.config = config;
    this.policies = new Map();
    this.resources = new Map();
    this.delegations = new Map();
    this.auditLog = [];
    this.accessCache = new Map();
    this.listeners = new Set();
    this.stats = {
      totalDecisions: 0,
      allowedDecisions: 0,
      deniedDecisions: 0,
      averageEvaluationTime: 0,
      policiesApplied: {},
      resourceTypes: {},
      actions: {},
      topDenialReasons: [],
      errors: 0,
    };
  }

  /**
   * Set role service dependency
   */
  setRoleService(roleService: any): this {
    this.roleService = roleService;
    return this;
  }

  /**
   * Set permission service dependency
   */
  setPermissionService(permissionService: any): this {
    this.permissionService = permissionService;
    return this;
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: IAccessControlConfig): void {
    if (!config) {
      throw new Error('Access control configuration is required');
    }
    if (config.cacheTimeout < 1000) {
      throw new Error('cacheTimeout must be at least 1000ms');
    }
    if (config.maxPolicies < 10) {
      throw new Error('maxPolicies must be at least 10');
    }
  }

  /**
   * Check access for a user to perform an action on a resource
   */
  async checkAccess(context: IAccessContext): Promise<IAccessDecision> {
    const startTime = Date.now();

    try {
      // Check cache
      const cacheKey = this.generateCacheKey(context);
      const cached = this.accessCache.get(cacheKey);
      if (cached && cached.expiresAt > new Date()) {
        return cached.decision;
      }

      // Evaluate policies
      const decision = await this.evaluateAccessPolicies(context);

      // Update statistics
      this.stats.totalDecisions++;
      if (decision.allowed) {
        this.stats.allowedDecisions++;
      } else {
        this.stats.deniedDecisions++;
      }

      // Update resource type stats
      this.stats.resourceTypes[context.resource] =
        (this.stats.resourceTypes[context.resource] || 0) + 1;

      // Update action stats
      this.stats.actions[context.action] = (this.stats.actions[context.action] || 0) + 1;

      // Cache decision
      if (this.config.enableCaching) {
        this.cacheDecision(cacheKey, decision);
      }

      // Audit
      if (this.config.enableAuiting) {
        this.auditAccess(context, decision);
      }

      // Emit event
      this.emitEvent('decision_made', {
        userId: context.userId,
        resourceId: context.resourceId,
        allowed: decision.allowed,
      });

      return decision;
    } catch (err) {
      this.stats.errors++;
      const decision: IAccessDecision = {
        allowed: this.config.defaultDeny ? false : true,
        effect: 'deny',
        reason: 'Error evaluating access',
        evaluatedAt: new Date(),
      };
      return decision;
    }
  }

  /**
   * Evaluate all applicable policies for a context
   */
  private async evaluateAccessPolicies(
    context: IAccessContext
  ): Promise<IAccessDecision> {
    let allowDecision: IAccessDecision | null = null;
    let denyDecision: IAccessDecision | null = null;
    const appliedConditions: string[] = [];

    // Get user roles and permissions
    const userRoles = await this.getUserRoles(context.userId);
    const userPermissions = await this.getUserPermissions(context.userId);
    const isOwner = await this.checkOwnership(context.userId, context.resourceId);
    const groupAccess = await this.checkGroupAccess(context.userId, context.resourceId);

    // Evaluate each policy
    const sortedPolicies = Array.from(this.policies.values()).sort(
      (a, b) => b.priority - a.priority
    );

    for (const policy of sortedPolicies) {
      if (!policy.isActive) continue;

      // Check if policy applies to this resource and action
      if (!this.policyAppliesToContext(policy, context)) {
        continue;
      }

      // Check if user is subject of this policy
      if (!this.userIsSubject(context.userId, policy, userRoles)) {
        continue;
      }

      // Evaluate conditions
      const conditionsMet = await this.evaluateConditions(
        policy.conditions || [],
        {
          policy,
          context,
          userRoles,
          userPermissions,
          isOwner,
          groupAccess,
        }
      );

      if (!conditionsMet) {
        continue;
      }

      appliedConditions.push(`${policy.name} (${policy.policyId})`);

      // Track which policies were applied
      this.stats.policiesApplied[policy.name] =
        (this.stats.policiesApplied[policy.name] || 0) + 1;

      // Handle policy effect
      if (policy.effect === 'allow') {
        allowDecision = {
          allowed: true,
          effect: 'allow',
          matchedPolicy: policy.policyId,
          appliedConditions,
          evaluatedAt: new Date(),
        };
      } else if (policy.effect === 'deny') {
        denyDecision = {
          allowed: false,
          effect: 'deny',
          reason: `Access denied by policy: ${policy.name}`,
          matchedPolicy: policy.policyId,
          appliedConditions,
          evaluatedAt: new Date(),
        };
        // Deny takes precedence
        return denyDecision;
      }
    }

    // Return decision (deny wins, then allow, then default)
    if (denyDecision) {
      return denyDecision;
    }

    if (allowDecision) {
      return allowDecision;
    }

    // Default decision
    return {
      allowed: !this.config.defaultDeny,
      effect: this.config.defaultDeny ? 'deny' : 'allow',
      reason: `Default ${this.config.defaultDeny ? 'deny' : 'allow'} applied`,
      evaluatedAt: new Date(),
    };
  }

  /**
   * Check if policy applies to the context
   */
  private policyAppliesToContext(policy: IAccessPolicy, context: IAccessContext): boolean {
    // Check resource
    const resourceMatch =
      policy.resources.includes('*') ||
      policy.resources.includes(context.resource) ||
      policy.resources.includes(context.resourceId || '');

    if (!resourceMatch) return false;

    // Check action
    const actionMatch =
      policy.actions.includes('*') || policy.actions.includes(context.action);

    return actionMatch;
  }

  /**
   * Check if user is subject of policy
   */
  private userIsSubject(
    userId: string,
    policy: IAccessPolicy,
    userRoles: string[]
  ): boolean {
    return (
      policy.subjects.includes('*') ||
      policy.subjects.includes(userId) ||
      userRoles.some(role => policy.subjects.includes(role))
    );
  }

  /**
   * Evaluate policy conditions
   */
  private async evaluateConditions(
    conditions: IAccessCondition[],
    evalContext: IPolicyEvaluationContext
  ): Promise<boolean> {
    if (conditions.length === 0) {
      return true;
    }

    // All conditions must be true (AND logic)
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, evalContext);
      if (!result) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate single condition
   */
  private async evaluateCondition(
    condition: IAccessCondition,
    evalContext: IPolicyEvaluationContext
  ): Promise<boolean> {
    let result = false;

    switch (condition.type) {
      case 'role':
        result = evalContext.userRoles.some(role =>
          this.matchCondition(condition.operator, role, condition.value)
        );
        break;

      case 'permission':
        result = evalContext.userPermissions.some(perm =>
          this.matchCondition(condition.operator, perm, condition.value)
        );
        break;

      case 'ownership':
        result = evalContext.isOwner;
        break;

      case 'group':
        result = !!evalContext.groupAccess?.hasAccess;
        break;

      case 'time':
        result = this.matchTimeCondition(condition.value as Date);
        break;

      case 'ip':
        result = this.matchIPCondition(evalContext.context.ipAddress, condition.value);
        break;

      case 'custom':
        result = await this.evaluateCustomCondition(condition, evalContext);
        break;

      default:
        result = false;
    }

    return condition.negate ? !result : result;
  }

  /**
   * Match condition operator
   */
  private matchCondition(
    operator: string,
    actual: unknown,
    expected: unknown
  ): boolean {
    switch (operator) {
      case 'eq':
        return actual === expected;
      case 'neq':
        return actual !== expected;
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'not_in':
        return !Array.isArray(expected) || !expected.includes(actual);
      case 'starts_with':
        return String(actual).startsWith(String(expected));
      case 'ends_with':
        return String(actual).endsWith(String(expected));
      case 'contains':
        return String(actual).includes(String(expected));
      case 'gt':
        return Number(actual) > Number(expected);
      case 'lt':
        return Number(actual) < Number(expected);
      case 'gte':
        return Number(actual) >= Number(expected);
      case 'lte':
        return Number(actual) <= Number(expected);
      default:
        return false;
    }
  }

  /**
   * Match time condition
   */
  private matchTimeCondition(timeValue: Date): boolean {
    const now = new Date();
    return now < timeValue;
  }

  /**
   * Match IP condition
   */
  private matchIPCondition(actualIP: string | undefined, expectedIP: unknown): boolean {
    if (!actualIP) return false;
    if (expectedIP === '*') return true;
    if (Array.isArray(expectedIP)) {
      return expectedIP.includes(actualIP);
    }
    return actualIP === expectedIP;
  }

  /**
   * Evaluate custom condition
   */
  private async evaluateCustomCondition(
    condition: IAccessCondition,
    evalContext: IPolicyEvaluationContext
  ): Promise<boolean> {
    // Placeholder for custom condition evaluation
    return true;
  }

  /**
   * Get user roles
   */
  private async getUserRoles(userId: string): Promise<string[]> {
    if (!this.roleService) return [];

    try {
      const userRoles = await this.roleService.getUserRoles(userId);
      return userRoles?.roles?.map((r: any) => r.roleId) || [];
    } catch {
      return [];
    }
  }

  /**
   * Get user permissions
   */
  private async getUserPermissions(userId: string): Promise<string[]> {
    if (!this.permissionService) return [];

    try {
      const summary = await this.permissionService.getUserPermissionsSummary(userId);
      return summary?.permissions?.map((p: any) => p.permissionId) || [];
    } catch {
      return [];
    }
  }

  /**
   * Check resource ownership
   */
  async checkOwnership(userId: string, resourceId?: string): Promise<boolean> {
    if (!resourceId) return false;

    const resource = this.resources.get(resourceId);
    return resource ? resource.ownerId === userId : false;
  }

  /**
   * Check group access
   */
  private async checkGroupAccess(userId: string, resourceId?: string): Promise<IGroupAccess | null> {
    if (!resourceId) return null;

    const resource = this.resources.get(resourceId);
    if (!resource || !resource.groupId) return null;

    const userRoles = await this.getUserRoles(userId);
    const userPermissions = await this.getUserPermissions(userId);

    return {
      hasAccess: userRoles.length > 0 || userPermissions.length > 0,
      groupId: resource.groupId,
      userId,
      roles: userRoles,
      permissions: userPermissions,
    };
  }

  /**
   * Check access for resource
   */
  async checkResourceAccess(
    userId: string,
    resourceId: string,
    action: string
  ): Promise<IAccessDecision> {
    const resource = this.resources.get(resourceId);

    return this.checkAccess({
      userId,
      resource: resource?.type || 'custom',
      resourceId,
      action,
      timestamp: new Date(),
    });
  }

  /**
   * Create policy
   */
  async createPolicy(
    request: ICreatePolicyRequest,
    createdBy: string
  ): Promise<IAccessPolicy> {
    if (this.policies.size >= this.config.maxPolicies) {
      throw new Error(`Max policies limit reached: ${this.config.maxPolicies}`);
    }

    const policyId = this.generatePolicyId();
    const policy: IAccessPolicy = {
      policyId,
      name: request.name,
      description: request.description,
      effect: request.effect,
      resources: request.resources,
      actions: request.actions,
      subjects: request.subjects,
      conditions: request.conditions,
      priority: request.priority ?? 100,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      metadata: request.metadata,
    };

    this.policies.set(policyId, policy);

    this.emitEvent('access_granted', {
      details: { policyId, name: request.name },
    });

    return policy;
  }

  /**
   * Get policy
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

    if (request.name !== undefined) policy.name = request.name;
    if (request.description !== undefined) policy.description = request.description;
    if (request.effect !== undefined) policy.effect = request.effect;
    if (request.resources !== undefined) policy.resources = request.resources;
    if (request.actions !== undefined) policy.actions = request.actions;
    if (request.subjects !== undefined) policy.subjects = request.subjects;
    if (request.conditions !== undefined) policy.conditions = request.conditions;
    if (request.priority !== undefined) policy.priority = request.priority;
    if (request.isActive !== undefined) policy.isActive = request.isActive;
    if (request.metadata !== undefined) policy.metadata = request.metadata;

    policy.updatedAt = new Date();

    // Invalidate cache
    this.accessCache.clear();

    return policy;
  }

  /**
   * Delete policy
   */
  async deletePolicy(policyId: string, deletedBy: string): Promise<boolean> {
    const deleted = this.policies.delete(policyId);

    if (deleted) {
      // Invalidate cache
      this.accessCache.clear();
    }

    return deleted;
  }

  /**
   * Get all policies
   */
  async getAllPolicies(): Promise<IAccessPolicy[]> {
    return Array.from(this.policies.values());
  }

  /**
   * Register resource
   */
  async registerResource(resource: IResource): Promise<void> {
    this.resources.set(resource.resourceId, resource);
  }

  /**
   * Get resource
   */
  async getResource(resourceId: string): Promise<IResource | null> {
    return this.resources.get(resourceId) || null;
  }

  /**
   * Filter resources by access
   */
  async filterResourcesByAccess<T extends IResource>(
    userId: string,
    resources: T[],
    action: string
  ): Promise<IFilteredResult<T>> {
    const filtered: T[] = [];

    for (const resource of resources) {
      const decision = await this.checkResourceAccess(userId, resource.resourceId, action);
      if (decision.allowed) {
        filtered.push(resource);
      }
    }

    return {
      items: filtered,
      total: resources.length,
      filtered: filtered.length,
    };
  }

  /**
   * Create delegation
   */
  async createDelegation(
    from: string,
    to: string,
    resource: any,
    action: string,
    grantedBy: string,
    expiresAt?: Date
  ): Promise<IDelegatedAccess> {
    const delegation: IDelegatedAccess = {
      delegationId: this.generateDelegationId(),
      from,
      to,
      resource: resource.type,
      resourceId: resource.resourceId,
      action,
      expiresAt,
      grantedAt: new Date(),
      grantedBy,
    };

    this.delegations.set(delegation.delegationId, delegation);

    this.emitEvent('delegation_created', {
      details: { from, to, resource: resource.type },
    });

    return delegation;
  }

  /**
   * Get delegations for user
   */
  async getDelegations(userId: string): Promise<IDelegatedAccess[]> {
    const delegations: IDelegatedAccess[] = [];

    for (const delegation of this.delegations.values()) {
      if (delegation.to === userId && (!delegation.expiresAt || delegation.expiresAt > new Date())) {
        delegations.push(delegation);
      }
    }

    return delegations;
  }

  /**
   * Revoke delegation
   */
  async revokeDelegation(delegationId: string, revokedBy: string): Promise<boolean> {
    return this.delegations.delete(delegationId);
  }

  /**
   * Bulk check access
   */
  async bulkCheckAccess(request: IBulkAccessRequest): Promise<IBulkAccessResult> {
    const results = [];

    for (const userId of request.userIds) {
      let allowed = false;
      let reason: string | undefined;

      for (const resourceId of request.resourceIds || []) {
        const decision = await this.checkAccess({
          userId,
          resource: request.resource,
          resourceId,
          action: request.action,
          timestamp: new Date(),
        });

        if (decision.allowed) {
          allowed = true;
          break;
        }
      }

      results.push({
        userId,
        allowed,
        reason,
      });
    }

    return {
      totalRequested: request.userIds.length,
      allowedCount: results.filter(r => r.allowed).length,
      deniedCount: results.filter(r => !r.allowed).length,
      results,
    };
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
  onAccess(listener: AccessListener): this {
    this.listeners.add(listener);
    return this;
  }

  /**
   * Remove event listener
   */
  offAccess(listener: AccessListener): this {
    this.listeners.delete(listener);
    return this;
  }

  /**
   * Detect policy conflicts
   */
  async detectConflicts(): Promise<IPolicyConflict[]> {
    const conflicts: IPolicyConflict[] = [];
    const policies = Array.from(this.policies.values());

    for (let i = 0; i < policies.length; i++) {
      for (let j = i + 1; j < policies.length; j++) {
        const p1 = policies[i];
        const p2 = policies[j];

        // Check for overlapping resources and actions
        const resourceOverlap = p1.resources.some(r => p2.resources.includes(r));
        const actionOverlap = p1.actions.some(a => p2.actions.includes(a));

        if (resourceOverlap && actionOverlap) {
          if (p1.effect !== p2.effect) {
            conflicts.push({
              policy1Id: p1.policyId,
              policy2Id: p2.policyId,
              conflictType: 'conflicting_effects',
              severity: 'high',
              recommendation: `Review conflicting effects for ${p1.name} and ${p2.name}`,
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Private helper methods
   */

  private generateCacheKey(context: IAccessContext): string {
    return `access_${context.userId}_${context.resource}_${context.action}_${context.resourceId || 'all'}`;
  }

  private cacheDecision(key: string, decision: IAccessDecision): void {
    const expiresAt = new Date(Date.now() + this.config.cacheTimeout);
    this.accessCache.set(key, { key, decision, timestamp: new Date(), expiresAt });

    if (this.accessCache.size > this.config.maxCacheSize) {
      const oldest = Array.from(this.accessCache.values()).sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      )[0];
      this.accessCache.delete(oldest.key);
    }
  }

  private auditAccess(context: IAccessContext, decision: IAccessDecision): void {
    const entry: IAccessAuditEntry = {
      entryId: this.generateAuditId(),
      userId: context.userId,
      resource: context.resource,
      resourceId: context.resourceId,
      action: context.action,
      allowed: decision.allowed,
      denialReason: decision.reason,
      timestamp: new Date(),
      context,
    };

    this.auditLog.push(entry);
  }

  private generatePolicyId(): string {
    return `policy_${randomBytes(8).toString('hex')}`;
  }

  private generateDelegationId(): string {
    return `delegation_${randomBytes(8).toString('hex')}`;
  }

  private generateAuditId(): string {
    return `audit_${randomBytes(8).toString('hex')}`;
  }

  private async emitEvent(type: IAccessEvent['type'], details?: Record<string, unknown>): Promise<void> {
    const event: IAccessEvent = {
      type,
      timestamp: new Date(),
      userId: details?.userId as string,
      resourceId: details?.resourceId as string,
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
