/**
 * Audit Service - Type Definitions
 * Complete audit logging with immutable record, compliance, and forensics support
 */

/**
 * Audit action types
 */
export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.password_change'
  | 'role.create'
  | 'role.update'
  | 'role.delete'
  | 'permission.grant'
  | 'permission.revoke'
  | 'alert.create'
  | 'alert.acknowledge'
  | 'alert.escalate'
  | 'alert.close'
  | 'case.create'
  | 'case.update'
  | 'case.close'
  | 'evidence.upload'
  | 'evidence.access'
  | 'evidence.delete'
  | 'playbook.execute'
  | 'rule.create'
  | 'rule.update'
  | 'rule.delete'
  | 'search.execute'
  | 'report.generate'
  | 'config.update'
  | 'api.call'
  | 'export.create';

/**
 * Audit entry status
 */
export type AuditStatus = 'success' | 'failure' | 'partial';

/**
 * Resource types
 */
export type ResourceType =
  | 'user'
  | 'role'
  | 'permission'
  | 'alert'
  | 'case'
  | 'evidence'
  | 'playbook'
  | 'rule'
  | 'configuration'
  | 'report'
  | 'export';

/**
 * Severity levels
 */
export type AuditSeverity = 'informational' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Audit entry
 */
export interface IAuditEntry {
  entryId: string;
  timestamp: Date;
  action: AuditAction;
  status: AuditStatus;
  severity: AuditSeverity;
  userId: string;
  username: string;
  userIp: string;
  userAgent?: string;
  resourceType: ResourceType;
  resourceId: string;
  resourceName?: string;
  changes?: Record<string, unknown>;
  description: string;
  errorMessage?: string;
  errorCode?: string;
  correlationId?: string;
  sessionId?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  tags?: string[];
  Hash: string; // SHA-256 hash for integrity verification
}

/**
 * Audit query filter
 */
export interface IAuditQuery {
  actionFilter?: AuditAction[];
  userIdFilter?: string[];
  resourceTypeFilter?: ResourceType[];
  resourceIdFilter?: string[];
  severityFilter?: AuditSeverity[];
  statusFilter?: AuditStatus[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  searchText?: string;
}

/**
 * Audit statistics
 */
export interface IAuditStats {
  totalEntries: number;
  entriesByAction: Record<AuditAction, number>;
  entriesByStatus: Record<AuditStatus, number>;
  entriesBySeverity: Record<AuditSeverity, number>;
  entriesByResource: Record<ResourceType, number>;
  uniqueUsers: number;
  entriesLastHour: number;
  entriesLastDay: number;
  entriesLastWeek: number;
  averageActionDuration: number;
  failureRate: number;
}

/**
 * Audit retention policy
 */
export interface IAuditRetentionPolicy {
  name: string;
  description?: string;
  actionFilter?: AuditAction[];
  resourceTypeFilter?: ResourceType[];
  severityFilter?: AuditSeverity[];
  retentionDays: number;
  compressAfterDays?: number;
  archiveAfterDays?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Audit compliance report
 */
export interface IAuditComplianceReport {
  reportId: string;
  title: string;
  description?: string;
  generatedAt: Date;
  startDate: Date;
  endDate: Date;
  framework: 'SOC2' | 'ISO27001' | 'HIPAA' | 'PCI-DSS' | 'GDPR' | 'CUSTOM';
  sections: IAuditComplianceSection[];
  summary: IAuditComplianceSummary;
  recommendations: string[];
}

/**
 * Compliance report section
 */
export interface IAuditComplianceSection {
  sectionId: string;
  title: string;
  description: string;
  controls: IAuditComplianceControl[];
  complianceStatus: 'compliant' | 'non-compliant' | 'partial';
}

/**
 * Compliance control
 */
export interface IAuditComplianceControl {
  controlId: string;
  controlName: string;
  requirement: string;
  evidenceEntries: IAuditEntry[];
  status: 'compliant' | 'non-compliant' | 'n/a';
  notes?: string;
}

/**
 * Compliance summary
 */
export interface IAuditComplianceSummary {
  totalControls: number;
  compliantControls: number;
  nonCompliantControls: number;
  naControls: number;
  compliancePercentage: number;
  riskAreas: string[];
}

/**
 * Audit export format
 */
export type AuditExportFormat = 'json' | 'csv' | 'pdf' | 'xml';

/**
 * Audit export request
 */
export interface IAuditExportRequest {
  format: AuditExportFormat;
  query: IAuditQuery;
  includeDetails?: boolean;
  compress?: boolean;
  encryptionKey?: string;
}

/**
 * Audit export result
 */
export interface IAuditExportResult {
  exportId: string;
  format: AuditExportFormat;
  totalRecords: number;
  fileSize: number;
  url: string;
  generatedAt: Date;
  expiresAt: Date;
  hash: string;
  checksum: string;
}

/**
 * Audit trail entry
 */
export interface IAuditTrail {
  trailId: string;
  resourceType: ResourceType;
  resourceId: string;
  entries: IAuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Anomaly detection result
 */
export interface IAuditAnomaly {
  anomalyId: string;
  timestamp: Date;
  anomalyType:
    | 'unusual_time'
    | 'unusual_location'
    | 'unusual_action'
    | 'high_frequency'
    | 'permission_escalation'
    | 'data_exfiltration'
    | 'privilege_abuse'
    | 'failed_auth_attempts';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  description: string;
  relatedEntries: IAuditEntry[];
  recommendations: string[];
  acknowledged: boolean;
  acknowledgedAt?: Date;
}

/**
 * User activity summary
 */
export interface IUserActivitySummary {
  userId: string;
  username: string;
  totalActions: number;
  actionsByType: Record<AuditAction, number>;
  firstActivityAt: Date;
  lastActivityAt: Date;
  successfulActions: number;
  failedActions: number;
  failureRate: number;
  riskScore: number;
  anomalies: number;
}

/**
 * Integrity verification result
 */
export interface IIntegrityCheckResult {
  checkId: string;
  timestamp: Date;
  entriesChecked: number;
  entriesValid: number;
  entriesInvalid: number;
  integrityScore: number;
  tamperedEntries: IAuditEntry[];
  status: 'valid' | 'invalid' | 'partial';
  recommendedAction?: string;
}

/**
 * Audit service configuration
 */
export interface IAuditServiceConfig {
  enableAudit: boolean;
  enableImmutability: boolean;
  enableIntegrityCheck: boolean;
  enableCompression: boolean;
  enableEncryption: boolean;
  enableAnomalyDetection: boolean;
  hashAlgorithm: 'sha256' | 'sha512' | 'blake3';
  retentionDays: number;
  compressionAfterDays?: number;
  archiveAfterDays?: number;
  maxAuditEntriesPerQuery: number;
  enableDetailedLogging: boolean;
  enablePerformanceMetrics: boolean;
}

/**
 * Audit listener
 */
export type AuditListener = (entry: IAuditEntry) => Promise<void> | void;

/**
 * Compliance listener
 */
export type ComplianceListener = (report: IAuditComplianceReport) => Promise<void> | void;

/**
 * Anomaly listener
 */
export type AnomalyListener = (anomaly: IAuditAnomaly) => Promise<void> | void;

/**
 * Audit health check
 */
export interface IAuditHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  storageHealth: 'healthy' | 'degraded' | 'critical';
  integrityHealth: 'healthy' | 'degraded' | 'critical';
  retentionHealth: 'compliant' | 'at_risk' | 'non-compliant';
  checks: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
  }>;
}

/**
 * Audit filter expression
 */
export interface IAuditFilterExpression {
  field: string;
  operator: 'equals' | 'contains' | 'in' | 'gte' | 'lte' | 'between' | 'regex';
  value: unknown;
  caseSensitive?: boolean;
}

/**
 * Search aggregation
 */
export interface IAuditAggregation {
  aggregationType: 'count' | 'sum' | 'average' | 'histogram' | 'terms';
  field: string;
  bucketSize?: number;
  buckets: Array<{
    key: string | number;
    count: number;
    value?: number;
  }>;
}

/**
 * Audit batch operation
 */
export interface IAuditBatchOperation {
  operationId: string;
  timestamp: Date;
  action: AuditAction;
  itemCount: number;
  successCount: number;
  failureCount: number;
  duration: number;
  status: 'success' | 'failure' | 'partial';
  entries: IAuditEntry[];
}
