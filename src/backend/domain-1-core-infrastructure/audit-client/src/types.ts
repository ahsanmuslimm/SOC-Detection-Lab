/**
 * Audit Client - Type Definitions
 * Type definitions for audit logging and compliance tracking
 */

/**
 * Audit log entry
 */
export interface IAuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  status: 'success' | 'failure';
  ipAddress?: string;
  userAgent?: string;
  changes?: IAuditChanges;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}

/**
 * Audit action types
 */
export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'import'
  | 'login'
  | 'logout'
  | 'access_denied'
  | 'config_change'
  | 'role_assign'
  | 'permission_grant'
  | 'data_access';

/**
 * Changes tracking
 */
export interface IAuditChanges {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  fields?: string[];
}

/**
 * Query filter for audit logs
 */
export interface IAuditFilter {
  userId?: string;
  action?: AuditAction | AuditAction[];
  resource?: string;
  resourceId?: string;
  status?: 'success' | 'failure';
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
}

/**
 * Query result
 */
export interface IAuditQueryResult {
  logs: IAuditLog[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

/**
 * Compliance report
 */
export interface IComplianceReport {
  period: {
    start: Date;
    end: Date;
  };
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  uniqueUsers: number;
  actionBreakdown: Record<AuditAction, number>;
  resourceBreakdown: Record<string, number>;
  complianceScore: number;
}

/**
 * Data access log
 */
export interface IDataAccessLog extends IAuditLog {
  resource: 'data';
  dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted';
  recordsAccessed?: number;
  hasPersonalData?: boolean;
}

/**
 * Security event
 */
export interface ISecurityEvent {
  id: string;
  timestamp: Date;
  eventType: SecurityEventType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  userId?: string;
  ipAddress?: string;
  description: string;
  context?: Record<string, unknown>;
}

/**
 * Security event types
 */
export type SecurityEventType =
  | 'failed_authentication'
  | 'unauthorized_access'
  | 'privilege_escalation'
  | 'suspicious_activity'
  | 'data_exfiltration'
  | 'config_tampering';

/**
 * Audit statistics
 */
export interface IAuditStats {
  totalLogs: number;
  logsToday: number;
  logsThisMonth: number;
  averageLogsPerDay: number;
  successRate: number;
  uniqueUsers: number;
  topActions: Array<{ action: AuditAction; count: number }>;
  topResources: Array<{ resource: string; count: number }>;
}

/**
 * Retention policy
 */
export interface IRetentionPolicy {
  enabled: boolean;
  retentionDays: number;
  archiveOlderThan?: number;
  deleteOlderThan?: number;
  compressArchives?: boolean;
}

/**
 * Audit configuration
 */
export interface IAuditConfig {
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  retention?: IRetentionPolicy;
  compression?: {
    enabled: boolean;
    algorithm: 'gzip' | 'bzip2';
  };
  encryption?: {
    enabled: boolean;
    algorithm: string;
    keyId?: string;
  };
  retentionPolicy?: IRetentionPolicy;
}

/**
 * Audit listener
 */
export type AuditListener = (log: IAuditLog) => Promise<void> | void;

/**
 * Export format
 */
export type ExportFormat = 'json' | 'csv' | 'xml' | 'pdf';

/**
 * Export options
 */
export interface IExportOptions {
  format: ExportFormat;
  filter?: IAuditFilter;
  compress?: boolean;
  encrypt?: boolean;
}
