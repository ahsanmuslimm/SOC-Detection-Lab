/**
 * Policy Engine - Implementation
 * Dynamic policy evaluation and enforcement engine
 */

import { randomBytes } from 'crypto';
import type {
  IPolicy,
  IPolicyStatement,
  IPolicyCondition,
  IPolicyEvaluationRequest,
  IPolicyEvaluationResult,
  IBulkPolicyEvaluationRequest,
  IBulkPolicyEvaluationResult,
  IPolicyTemplate,
  IPolicyVersion,
  IAttributeMap,
  IPolicyComplianceCheck,
  IComplianceViolation,
  IPolicyAuditEntry,
  IPolicyStats,
  IPolicyConflict,
  IPolicyEvent,
  PolicyListener,
  IPolicyEngineConfig,
  ICreatePolicyRequest,
  IUpdatePolicyRequest,
  IInstantiatePolicyTemplateRequest,
  IPolicyCacheEntry,
  IPolicySearchCriteria,
  IPolicySearchResult,
  IPolicyAnalysisResult,
  IPolicyMetrics,
} from './types';

/**
 * Policy Engine - Evaluates and enforces policies
 */
export class PolicyEngine {
  private policies: Map<string, IPolicy>;
  private versions: Map<string, IPolicyVersion>;
  private templates: Map<string, IPolicyTemplate>;
  private policyVersionMap: Map<string, string[]>;
  private auditLog: IPolicyAuditEntry[];
  private policyCache: Map<string, IPolicyCacheEntry>;
  private listeners: Set<PolicyListener>;
  private stats: IPolicyStats;
  private config: IPolicyEngineConfig;
  private metrics: Map<string, IPolicyMetrics>;

  constructor(config: IPolicyEngineConfig) {
    this.validateConfig(config);
    this.config = config;
    this.policies = new Map();
    this.versions = new Map();
    this.templates = new Map();
    this.policyVersionMap = new Map();
    this.auditLog = [];
    this.policyCache = new Map();
    this.listeners = new Set();
    this.metrics = new Map();
    this.stats = {
      totalPolicies: 0,
      activePolicies: 0,
      inactivePolicies: 0,
      totalVersions: 0,
      templateCount: 0,
      totalEvaluations: 0,
      successfulEvaluations: 0,
      failedEvaluations: 0,
      averageEvaluationTime: 0,
      errors: 0,
    };
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: IPolicyEngineConfig): void {
    if (!config) {
      throw new Error('Policy engine configuration is required');
    }
    if (config.maxPolicies < 10) {
      throw new Error('maxPolicies must be at least 10');
    }
    if (config.evaluationTimeout < 100) {
      throw new Error('evaluationTimeout must be at least 100ms');
    }
  }

  /**
   * Create policy
   */
  async createPolicy(
    request: ICreatePolicyRequest,
    createdBy: string
  ): Promise<IPolicy> {
    if (this.policies.size >= this.config.maxPolicies) {
      throw new Error(`Max policies limit reached: ${this.config.maxPolicies}`);
    }

    const policyId = this.generatePolicyId();
    const policy: IPolicy = {
      policyId,
      name: request.name,
      description: request.description,
      version: 1,
      statements: request.statements,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      metadata: request.metadata,
    };

    this.policies.set(policyId, policy);
    this.policyVersionMap.set(policyId, []);

    // Create initial version
    if (this.config.enableVersioning) {
      await this.createVersion(policyId, policy.statements, createdBy, 'Initial version');
    }

    this.stats.totalPolicies++;
    this.stats.activePolicies++;

    this.logAudit('policy_created', policyId, createdBy, {
      name: request.name,
      statementCount: request.statements.length,
    });

    this.emitEvent('policy_created', {
      policyId,
      details: { name: request.name },
    });

    return policy;
  }

  /**
   * Get policy
   */
  async getPolicy(policyId: string): Promise<IPolicy | null> {
    return this.policies.get(policyId) || null;
  }

  /**
   * Update policy
   */
  async updatePolicy(
    policyId: string,
    request: IUpdatePolicyRequest,
    updatedBy: string
  ): Promise<IPolicy> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy not found: ${policyId}`);
    }

    const oldState = { ...policy };

    if (request.name !== undefined) policy.name = request.name;
    if (request.description !== undefined) policy.description = request.description;
    if (request.statements !== undefined) {
      policy.statements = request.statements;
      policy.version++;

      // Create new version if versioning enabled
      if (this.config.enableVersioning) {
        await this.createVersion(
          policyId,
          policy.statements,
          updatedBy,
          'Policy updated'
        );
      }
    }
    if (request.isActive !== undefined) {
      policy.isActive = request.isActive;
      if (request.isActive) {
        this.stats.activePolicies++;
        this.stats.inactivePolicies--;
      } else {
        this.stats.activePolicies--;
        this.stats.inactivePolicies++;
      }
    }
    if (request.metadata !== undefined) policy.metadata = request.metadata;

    policy.updatedAt = new Date();

    // Invalidate cache
    this.policyCache.clear();

    this.logAudit('policy_updated', policyId, updatedBy, {
      before: oldState,
      after: policy,
    });

    this.emitEvent('policy_updated', {
      policyId,
      details: { version: policy.version },
    });

    return policy;
  }

  /**
   * Delete policy
   */
  async deletePolicy(policyId: string, deletedBy: string): Promise<boolean> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      return false;
    }

    this.policies.delete(policyId);
    this.policyVersionMap.delete(policyId);
    this.metrics.delete(policyId);

    this.stats.totalPolicies--;
    if (policy.isActive) {
      this.stats.activePolicies--;
    } else {
      this.stats.inactivePolicies--;
    }

    this.logAudit('policy_deleted', policyId, deletedBy, { name: policy.name });

    this.emitEvent('policy_deleted', {
      policyId,
      details: { name: policy.name },
    });

    return true;
  }

  /**
   * Get all policies
   */
  async getAllPolicies(): Promise<IPolicy[]> {
    return Array.from(this.policies.values());
  }

  /**
   * Search policies
   */
  async searchPolicies(criteria: IPolicySearchCriteria): Promise<IPolicySearchResult> {
    let policies = Array.from(this.policies.values());

    if (criteria.name) {
      policies = policies.filter(p =>
        p.name.toLowerCase().includes(criteria.name!.toLowerCase())
      );
    }

    if (criteria.active !== undefined) {
      policies = policies.filter(p => p.isActive === criteria.active);
    }

    if (criteria.createdAfter) {
      policies = policies.filter(p => p.createdAt >= criteria.createdAfter!);
    }

    if (criteria.createdBefore) {
      policies = policies.filter(p => p.createdAt <= criteria.createdBefore!);
    }

    const total = policies.length;
    const offset = criteria.offset || 0;
    const limit = criteria.limit || 50;

    policies = policies.slice(offset, offset + limit);

    return { policies, total, limit, offset };
  }

  /**
   * Evaluate single policy
   */
  async evaluatePolicy(
    request: IPolicyEvaluationRequest
  ): Promise<IPolicyEvaluationResult> {
    const startTime = Date.now();

    try {
      // Check cache
      const cacheKey = this.generateCacheKey(request);
      const cached = this.policyCache.get(cacheKey);
      if (cached && cached.expiresAt > new Date()) {
        return cached.result;
      }

      const policy = this.policies.get(request.policyId);
      if (!policy) {
        return {
          policyId: request.policyId,
          allowed: false,
          effect: 'deny',
          reason: 'Policy not found',
          matchedStatements: [],
          evaluatedAt: new Date(),
          evaluationTimeMs: 0,
        };
      }

      if (!policy.isActive) {
        return {
          policyId: request.policyId,
          allowed: false,
          effect: 'deny',
          reason: 'Policy is inactive',
          matchedStatements: [],
          evaluatedAt: new Date(),
          evaluationTimeMs: 0,
        };
      }

      const result = await this.evaluateStatements(policy, request);

      // Update metrics
      this.updateMetrics(request.policyId, result);

      // Cache result
      if (this.config.enableCaching) {
        const expiresAt = new Date(Date.now() + this.config.cacheTimeout);
        this.policyCache.set(cacheKey, { key: cacheKey, result, timestamp: new Date(), expiresAt });
      }

      // Update stats
      this.stats.totalEvaluations++;
      if (result.allowed) {
        this.stats.successfulEvaluations++;
      } else {
        this.stats.failedEvaluations++;
      }

      const evaluationTime = Date.now() - startTime;
      result.evaluationTimeMs = evaluationTime;

      this.logAudit('policy_evaluated', request.policyId, request.userId, {
        action: request.action,
        allowed: result.allowed,
        evaluationTime,
      });

      this.emitEvent('policy_evaluated', {
        policyId: request.policyId,
        userId: request.userId,
        details: { allowed: result.allowed, evaluationTime },
      });

      return result;
    } catch (err) {
      this.stats.errors++;
      this.stats.failedEvaluations++;

      return {
        policyId: request.policyId,
        allowed: this.config.defaultEffect === 'allow',
        effect: 'deny',
        reason: 'Error evaluating policy',
        matchedStatements: [],
        evaluatedAt: new Date(),
        evaluationTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Evaluate statements
   */
  private async evaluateStatements(
    policy: IPolicy,
    request: IPolicyEvaluationRequest
  ): Promise<IPolicyEvaluationResult> {
    const matchedStatements: string[] = [];
    let allowed = false;
    let reason = 'No matching statement';

    for (const statement of policy.statements) {
      if (!this.statementAppliesToRequest(statement, request)) {
        continue;
      }

      // Evaluate conditions
      const conditionsMet = await this.evaluateConditions(
        statement.conditions || [],
        request
      );

      if (!conditionsMet) {
        continue;
      }

      matchedStatements.push(statement.statementId);

      if (statement.effect === 'allow') {
        allowed = true;
        reason = 'Allowed by matching statement';
      } else if (statement.effect === 'deny') {
        allowed = false;
        reason = 'Denied by matching statement';
        break; // Deny takes precedence
      }
    }

    return {
      policyId: policy.policyId,
      allowed,
      effect: allowed ? 'allow' : 'deny',
      reason,
      matchedStatements,
      evaluatedAt: new Date(),
      evaluationTimeMs: 0,
    };
  }

  /**
   * Check if statement applies to request
   */
  private statementAppliesToRequest(
    statement: IPolicyStatement,
    request: IPolicyEvaluationRequest
  ): boolean {
    const actionMatch =
      statement.actions.includes('*') ||
      statement.actions.includes(request.action);

    if (!actionMatch) return false;

    const resourceMatch =
      statement.resources.includes('*') ||
      statement.resources.includes(request.resource);

    return resourceMatch;
  }

  /**
   * Evaluate conditions
   */
  private async evaluateConditions(
    conditions: IPolicyCondition[],
    request: IPolicyEvaluationRequest
  ): Promise<boolean> {
    if (conditions.length === 0) {
      return true;
    }

    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, request);
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
    condition: IPolicyCondition,
    request: IPolicyEvaluationRequest
  ): Promise<boolean> {
    let result = true;

    switch (condition.type) {
      case 'attribute':
        if (request.attributes?.userAttributes && condition.attribute) {
          const value = request.attributes.userAttributes[condition.attribute];
          result = this.matchConditionValue(condition.operator, value, condition.value);
        }
        break;

      case 'date':
        if (request.attributes?.temporalAttributes) {
          result = this.matchDateCondition(
            request.attributes.temporalAttributes.currentDate,
            condition.operator,
            condition.value
          );
        }
        break;

      case 'time':
        if (request.attributes?.temporalAttributes) {
          result = this.matchTimeCondition(
            request.attributes.temporalAttributes.currentTime,
            condition.operator,
            condition.value
          );
        }
        break;

      case 'ip':
        if (request.context?.ipAddress) {
          result = this.matchIPCondition(
            request.context.ipAddress as string,
            condition.operator,
            condition.value
          );
        }
        break;

      case 'role':
        if (request.context?.roles) {
          const roles = request.context.roles as string[];
          result = roles.some(role =>
            this.matchConditionValue(condition.operator, role, condition.value)
          );
        }
        break;

      case 'permission':
        if (request.context?.permissions) {
          const perms = request.context.permissions as string[];
          result = perms.some(perm =>
            this.matchConditionValue(condition.operator, perm, condition.value)
          );
        }
        break;

      case 'custom':
        result = await this.evaluateCustomCondition(condition, request);
        break;
    }

    return condition.negate ? !result : result;
  }

  /**
   * Match condition value
   */
  private matchConditionValue(
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
      case 'contains':
        return String(actual).includes(String(expected));
      case 'starts_with':
        return String(actual).startsWith(String(expected));
      case 'ends_with':
        return String(actual).endsWith(String(expected));
      default:
        return false;
    }
  }

  /**
   * Match date condition
   */
  private matchDateCondition(actual: Date, operator: string, expected: unknown): boolean {
    const expectedDate = new Date(expected as string);
    switch (operator) {
      case 'before':
        return actual < expectedDate;
      case 'after':
        return actual > expectedDate;
      case 'eq':
        return actual.toDateString() === expectedDate.toDateString();
      default:
        return false;
    }
  }

  /**
   * Match time condition
   */
  private matchTimeCondition(actual: Date, operator: string, expected: unknown): boolean {
    const expectedTime = new Date(expected as string);
    switch (operator) {
      case 'before':
        return actual < expectedTime;
      case 'after':
        return actual > expectedTime;
      case 'eq':
        return actual.getTime() === expectedTime.getTime();
      default:
        return false;
    }
  }

  /**
   * Match IP condition
   */
  private matchIPCondition(actual: string, operator: string, expected: unknown): boolean {
    switch (operator) {
      case 'eq':
        return actual === expected;
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'not_in':
        return !Array.isArray(expected) || !expected.includes(actual);
      default:
        return false;
    }
  }

  /**
   * Evaluate custom condition
   */
  private async evaluateCustomCondition(
    condition: IPolicyCondition,
    request: IPolicyEvaluationRequest
  ): Promise<boolean> {
    // Placeholder for custom condition evaluation
    return true;
  }

  /**
   * Bulk evaluate policies
   */
  async bulkEvaluatePolicies(
    request: IBulkPolicyEvaluationRequest
  ): Promise<IBulkPolicyEvaluationResult> {
    const startTime = Date.now();
    const results: IPolicyEvaluationResult[] = [];
    let applicablePolicies = 0;

    for (const policyId of request.policyIds) {
      const result = await this.evaluatePolicy({
        policyId,
        userId: request.userId,
        action: request.action,
        resource: request.resource,
        context: request.context,
      });

      results.push(result);

      if (result.matchedStatements.length > 0) {
        applicablePolicies++;
      }
    }

    // Determine overall decision
    let overallDecision: 'allow' | 'deny' | 'no-match' = 'no-match';
    for (const result of results) {
      if (result.allowed && result.matchedStatements.length > 0) {
        overallDecision = 'allow';
        break;
      }
    }

    if (overallDecision === 'no-match') {
      for (const result of results) {
        if (!result.allowed && result.matchedStatements.length > 0) {
          overallDecision = 'deny';
          break;
        }
      }
    }

    return {
      results,
      overallDecision,
      totalPolicies: request.policyIds.length,
      applicablePolicies,
      evaluationTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Create policy version
   */
  private async createVersion(
    policyId: string,
    statements: IPolicyStatement[],
    createdBy: string,
    changeLog?: string
  ): Promise<IPolicyVersion> {
    if (this.stats.totalVersions >= this.config.maxVersions) {
      throw new Error(`Max versions limit reached: ${this.config.maxVersions}`);
    }

    const versionId = this.generateVersionId();
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy not found: ${policyId}`);
    }

    const version: IPolicyVersion = {
      versionId,
      policyId,
      version: policy.version,
      statements,
      createdAt: new Date(),
      createdBy,
      changeLog,
    };

    this.versions.set(versionId, version);

    const versions = this.policyVersionMap.get(policyId) || [];
    versions.push(versionId);
    this.policyVersionMap.set(policyId, versions);

    this.stats.totalVersions++;

    this.emitEvent('version_created', {
      policyId,
      details: { version: policy.version },
    });

    return version;
  }

  /**
   * Get policy versions
   */
  async getPolicyVersions(policyId: string): Promise<IPolicyVersion[]> {
    const versionIds = this.policyVersionMap.get(policyId) || [];
    return versionIds
      .map(id => this.versions.get(id))
      .filter((v): v is IPolicyVersion => v !== undefined);
  }

  /**
   * Rollback to version
   */
  async rollbackToVersion(
    policyId: string,
    versionNumber: number,
    rolledBackBy: string
  ): Promise<IPolicy> {
    const versionIds = this.policyVersionMap.get(policyId) || [];
    const version = versionIds
      .map(id => this.versions.get(id))
      .find(v => v?.version === versionNumber);

    if (!version) {
      throw new Error(`Version not found: ${versionNumber}`);
    }

    return this.updatePolicy(
      policyId,
      { statements: version.statements },
      rolledBackBy
    );
  }

  /**
   * Create policy template
   */
  async createTemplate(
    name: string,
    description: string,
    statements: IPolicyStatement[],
    createdBy: string
  ): Promise<IPolicyTemplate> {
    const templateId = this.generateTemplateId();
    const template: IPolicyTemplate = {
      templateId,
      name,
      description,
      statements,
      createdAt: new Date(),
      createdBy,
    };

    this.templates.set(templateId, template);
    this.stats.templateCount++;

    return template;
  }

  /**
   * Get template
   */
  async getTemplate(templateId: string): Promise<IPolicyTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  /**
   * Instantiate template
   */
  async instantiateTemplate(
    request: IInstantiatePolicyTemplateRequest,
    createdBy: string
  ): Promise<IPolicy> {
    const template = this.templates.get(request.templateId);
    if (!template) {
      throw new Error(`Template not found: ${request.templateId}`);
    }

    // Substitute variables in statements
    const statements = JSON.parse(JSON.stringify(template.statements));

    return this.createPolicy(
      {
        name: request.name,
        description: template.description,
        statements,
        metadata: request.metadata,
      },
      createdBy
    );
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
        const p1Statements = p1.statements;
        const p2Statements = p2.statements;

        for (const s1 of p1Statements) {
          for (const s2 of p2Statements) {
            const resourceOverlap = s1.resources.some(r =>
              s2.resources.includes(r) || s2.resources.includes('*') || s1.resources.includes('*')
            );

            const actionOverlap = s1.actions.some(a =>
              s2.actions.includes(a) || s2.actions.includes('*') || s1.actions.includes('*')
            );

            if (resourceOverlap && actionOverlap && s1.effect !== s2.effect) {
              conflicts.push({
                conflictId: this.generateConflictId(),
                policy1Id: p1.policyId,
                policy2Id: p2.policyId,
                conflictType: 'contradictory',
                severity: 'high',
                description: `Conflicting effects: ${s1.effect} vs ${s2.effect}`,
                recommendation: 'Review and resolve conflicting statements',
              });
            }
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Get statistics
   */
  getStats(): IPolicyStats {
    return { ...this.stats };
  }

  /**
   * Get audit log
   */
  getAuditLog(limit: number = 100): IPolicyAuditEntry[] {
    return this.auditLog.slice(-limit);
  }

  /**
   * Register event listener
   */
  onPolicy(listener: PolicyListener): this {
    this.listeners.add(listener);
    return this;
  }

  /**
   * Remove event listener
   */
  offPolicy(listener: PolicyListener): this {
    this.listeners.delete(listener);
    return this;
  }

  /**
   * Private helper methods
   */

  private generatePolicyId(): string {
    return `policy_${randomBytes(8).toString('hex')}`;
  }

  private generateVersionId(): string {
    return `version_${randomBytes(8).toString('hex')}`;
  }

  private generateTemplateId(): string {
    return `template_${randomBytes(8).toString('hex')}`;
  }

  private generateConflictId(): string {
    return `conflict_${randomBytes(8).toString('hex')}`;
  }

  private generateCacheKey(request: IPolicyEvaluationRequest): string {
    return `policy_${request.policyId}_${request.userId}_${request.action}_${request.resource}`;
  }

  private logAudit(
    action: string,
    policyId: string,
    userId: string,
    changes?: Record<string, unknown>
  ): void {
    const entry: IPolicyAuditEntry = {
      entryId: this.generateVersionId(),
      policyId,
      action,
      userId,
      changes,
      timestamp: new Date(),
      performedBy: userId,
    };

    this.auditLog.push(entry);
  }

  private async emitEvent(
    type: IPolicyEvent['type'],
    details?: Record<string, unknown>
  ): Promise<void> {
    const event: IPolicyEvent = {
      type,
      timestamp: new Date(),
      policyId: details?.policyId as string,
      userId: details?.userId as string,
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

  private updateMetrics(policyId: string, result: IPolicyEvaluationResult): void {
    let metrics = this.metrics.get(policyId);
    if (!metrics) {
      metrics = {
        policyId,
        totalEvaluations: 0,
        allowedCount: 0,
        deniedCount: 0,
        successRate: 0,
        averageEvaluationTime: 0,
      };
    }

    metrics.totalEvaluations++;
    if (result.allowed) {
      metrics.allowedCount++;
    } else {
      metrics.deniedCount++;
    }

    metrics.successRate = (metrics.allowedCount / metrics.totalEvaluations) * 100;
    metrics.averageEvaluationTime = result.evaluationTimeMs;
    metrics.lastEvaluatedAt = new Date();

    this.metrics.set(policyId, metrics);
  }
}

/**
 * Factory function to create Policy Engine
 */
export function createPolicyEngine(config: IPolicyEngineConfig): PolicyEngine {
  return new PolicyEngine(config);
}
