/**
 * Policy Engine - Type Definitions
 * Type definitions for dynamic policy evaluation and enforcement
 */

/**
 * Policy effect
 */
export type PolicyEffect = 'allow' | 'deny' | 'condition';

/**
 * Policy statement
 */
export interface IPolicyStatement {
  statementId: string;
  effect: PolicyEffect;
  actions: string[];
  resources: string[];
  conditions?: IPolicyCondition[];
  priority: number;
}

/**
 * Policy condition
 */
export interface IPolicyCondition {
  conditionId: string;
  type: 'attribute' | 'date' | 'time' | 'ip' | 'role' | 'permission' | 'custom';
  attribute?: string;
  operator: string;
  value: unknown;
  negate?: boolean;
}

/**
 * Policy
 */
export interface IPolicy {
  policyId: string;
  name: string;
  description: string;
  version: number;
  statements: IPolicyStatement[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

/**
 * Policy with version history
 */
export interface IPolicyWithHistory extends IPolicy {
  versions: IPolicyVersion[];
  currentVersion: number;
}

/**
 * Policy version
 */
export interface IPolicyVersion {
  versionId: string;
  policyId: string;
  version: number;
  statements: IPolicyStatement[];
  createdAt: Date;
  createdBy: string;
  changeLog?: string;
}

/**
 * Policy evaluation request
 */
export interface IPolicyEvaluationRequest {
  policyId: string;
  userId: string;
  action: string;
  resource: string;
  context?: Record<string, unknown>;
  attributes?: IAttributeMap;
}

/**
 * Policy evaluation result
 */
export interface IPolicyEvaluationResult {
  policyId: string;
  allowed: boolean;
  effect: PolicyEffect;
  reason?: string;
  matchedStatements: string[];
  evaluatedAt: Date;
  evaluationTimeMs: number;
}

/**
 * Bulk policy evaluation request
 */
export interface IBulkPolicyEvaluationRequest {
  policyIds: string[];
  userId: string;
  action: string;
  resource: string;
  context?: Record<string, unknown>;
}

/**
 * Bulk policy evaluation result
 */
export interface IBulkPolicyEvaluationResult {
  results: IPolicyEvaluationResult[];
  overallDecision: 'allow' | 'deny' | 'no-match';
  totalPolicies: number;
  applicablePolicies: number;
  evaluationTimeMs: number;
}

/**
 * Policy template
 */
export interface IPolicyTemplate {
  templateId: string;
  name: string;
  description: string;
  statements: IPolicyStatement[];
  variables?: IPolicyVariable[];
  createdAt: Date;
  createdBy: string;
}

/**
 * Policy variable
 */
export interface IPolicyVariable {
  variableName: string;
  defaultValue?: unknown;
  description?: string;
  required: boolean;
}

/**
 * Attribute map for evaluation
 */
export interface IAttributeMap {
  userAttributes?: Record<string, unknown>;
  resourceAttributes?: Record<string, unknown>;
  environmentAttributes?: Record<string, unknown>;
  temporalAttributes?: ITemporalAttributes;
}

/**
 * Temporal attributes
 */
export interface ITemporalAttributes {
  currentDate: Date;
  currentTime: Date;
  dayOfWeek: string;
  isBusinessHours: boolean;
}

/**
 * Policy evaluation context
 */
export interface IPolicyEvaluationContext {
  request: IPolicyEvaluationRequest;
  policy: IPolicy;
  attributes: IAttributeMap;
  evaluatedConditions: IConditionEvaluationResult[];
}

/**
 * Condition evaluation result
 */
export interface IConditionEvaluationResult {
  conditionId: string;
  type: string;
  passed: boolean;
  reason?: string;
}

/**
 * Policy compliance check
 */
export interface IPolicyComplianceCheck {
  checkId: string;
  policyId: string;
  userId: string;
  action: string;
  resource: string;
  isCompliant: boolean;
  violations?: IComplianceViolation[];
  timestamp: Date;
}

/**
 * Compliance violation
 */
export interface IComplianceViolation {
  violationId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  remediation?: string;
}

/**
 * Policy audit entry
 */
export interface IPolicyAuditEntry {
  entryId: string;
  policyId: string;
  action: string;
  userId: string;
  changes?: Record<string, unknown>;
  timestamp: Date;
  performedBy: string;
}

/**
 * Policy statistics
 */
export interface IPolicyStats {
  totalPolicies: number;
  activePolicies: number;
  inactivePolicies: number;
  totalVersions: number;
  templateCount: number;
  totalEvaluations: number;
  successfulEvaluations: number;
  failedEvaluations: number;
  averageEvaluationTime: number;
  errors: number;
}

/**
 * Policy conflict
 */
export interface IPolicyConflict {
  conflictId: string;
  policy1Id: string;
  policy2Id: string;
  conflictType: 'overlapping' | 'contradictory' | 'priority';
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

/**
 * Policy event
 */
export interface IPolicyEvent {
  type: 'policy_created' | 'policy_updated' | 'policy_deleted' | 'policy_evaluated' | 'compliance_checked' | 'version_created' | 'error';
  timestamp: Date;
  policyId?: string;
  userId?: string;
  details?: Record<string, unknown>;
}

/**
 * Policy listener
 */
export type PolicyListener = (event: IPolicyEvent) => Promise<void> | void;

/**
 * Policy engine configuration
 */
export interface IPolicyEngineConfig {
  maxPolicies: number;
  maxVersions: number;
  enableVersioning: boolean;
  enableAuditing: boolean;
  enableCaching: boolean;
  cacheTimeout: number;
  maxCacheSize: number;
  evaluationTimeout: number;
  defaultEffect: PolicyEffect;
}

/**
 * Create policy request
 */
export interface ICreatePolicyRequest {
  name: string;
  description: string;
  statements: IPolicyStatement[];
  metadata?: Record<string, unknown>;
}

/**
 * Update policy request
 */
export interface IUpdatePolicyRequest {
  name?: string;
  description?: string;
  statements?: IPolicyStatement[];
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Policy template instantiation request
 */
export interface IInstantiatePolicyTemplateRequest {
  templateId: string;
  name: string;
  variables?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Policy cache entry
 */
export interface IPolicyCacheEntry {
  key: string;
  result: IPolicyEvaluationResult;
  timestamp: Date;
  expiresAt: Date;
}

/**
 * Effect combination result
 */
export interface IEffectCombinationResult {
  policy1Id: string;
  policy2Id: string;
  policy1Effect: PolicyEffect;
  policy2Effect: PolicyEffect;
  combinedEffect: 'allow' | 'deny' | 'no-effect';
  priority: number;
}

/**
 * Policy search criteria
 */
export interface IPolicySearchCriteria {
  name?: string;
  active?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Policy search result
 */
export interface IPolicySearchResult {
  policies: IPolicy[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Policy export format
 */
export interface IPolicyExport {
  format: 'json' | 'yaml' | 'xml';
  policies: IPolicy[];
  exportedAt: Date;
  exportedBy: string;
}

/**
 * Policy import result
 */
export interface IPolicyImportResult {
  imported: number;
  skipped: number;
  errors: Array<{
    policyName: string;
    error: string;
  }>;
}

/**
 * Policy analysis result
 */
export interface IPolicyAnalysisResult {
  policyId: string;
  complexity: number;
  coveragePercentage: number;
  potentialConflicts: IPolicyConflict[];
  recommendations: string[];
  lastAnalyzedAt: Date;
}

/**
 * Condition operator
 */
export interface IConditionOperator {
  name: string;
  description: string;
  supportedTypes: string[];
  example: unknown;
}

/**
 * Policy metrics
 */
export interface IPolicyMetrics {
  policyId: string;
  totalEvaluations: number;
  allowedCount: number;
  deniedCount: number;
  successRate: number;
  averageEvaluationTime: number;
  lastEvaluatedAt?: Date;
}
