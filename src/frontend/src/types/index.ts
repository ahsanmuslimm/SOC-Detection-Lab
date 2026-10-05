/**
 * Global Type Definitions
 * 
 * Shared TypeScript types for the entire frontend application.
 * Ensures type safety across all components and services.
 */

// ============================================================================
// API Response Types
// ============================================================================

export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    timestamp?: string;
  };
  meta?: {
    timestamp: string;
    version: string;
    traceId?: string;
  };
}

export interface IPaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  meta?: {
    timestamp: string;
    version: string;
  };
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface IUser {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status?: string;
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: IUser;
}

export type UserRole = 'admin' | 'analyst' | 'viewer' | 'manager';

export interface IPermission {
  resource: string;
  actions: ('read' | 'create' | 'update' | 'delete')[];
}

// ============================================================================
// Alert Types
// ============================================================================

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'false_positive';

export interface IAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  sourceSystem: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  detectionRuleId?: string;
  caseId?: string;
  investigationId?: string;
}

export interface ICreateAlertRequest {
  title: string;
  description: string;
  severity: AlertSeverity;
  sourceSystem: string;
  detectionRuleId?: string;
}

// ============================================================================
// Case Types
// ============================================================================

export type CaseStatus = 'open' | 'in_progress' | 'closed' | 'suspended';
export type CaseSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ICase {
  id: string;
  title: string;
  description: string;
  status: CaseStatus;
  severity: CaseSeverity;
  caseNumber?: string;
  caseType?: string;
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  alertCount?: number;
  investigationCount?: number;
  tags?: string[];
}

export interface ICreateCaseRequest {
  title: string;
  description: string;
  severity: CaseSeverity;
}

// ============================================================================
// Investigation Types
// ============================================================================

export type InvestigationStatus = 'open' | 'in_progress' | 'closed' | 'escalated';
export type InvestigationPriority = 'critical' | 'high' | 'medium' | 'low';

export interface IInvestigation {
  id: string;
  title: string;
  description: string;
  status: InvestigationStatus;
  priority: InvestigationPriority;
  severity?: string;
  caseId?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  findings?: string;
  conclusion?: string;
  timeline?: ITimelineEvent[];
}

export interface ITimelineEvent {
  id?: string;
  timestamp: string;
  type: string;
  description: string;
  source?: string;
  actor?: string;
  alertId?: string;
  caseId?: string;
  details?: unknown;
}

// ============================================================================
// Detection Rule Types
// ============================================================================

export type RuleType = 'network' | 'host' | 'application' | 'threat_intel' | 'behavioral';
export type RuleStatus = 'draft' | 'active' | 'inactive' | 'deprecated';

export interface IDetectionRule {
  id: string;
  name: string;
  description: string;
  ruleType: RuleType;
  severity: AlertSeverity;
  status: RuleStatus;
  ruleDefinition: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
  alertCount?: number;
}

// ============================================================================
// Report Types
// ============================================================================

export type ReportType = 'daily_summary' | 'weekly_summary' | 'incident_analysis' | 'compliance' | 'threat_intelligence';

export interface IReport {
  id: string;
  title: string;
  description: string;
  reportType: ReportType;
  status: 'draft' | 'generated' | 'published' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  content?: string;
  format?: 'pdf' | 'html' | 'json';
}

// ============================================================================
// Audit Log Types
// ============================================================================

export interface IAuditLog {
  id: string;
  actor: string;
  action: string;
  resource: string;
  resourceId: string;
  status: 'success' | 'failure';
  details?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface IAlertStats {
  total: number;
  open?: number;
  acknowledged?: number;
  resolved?: number;
  closed?: number;
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;
  bySeverity?: Record<string, number>;
  byStatus?: Record<string, number>;
  trend?: ITrendData[];
  lastUpdated?: string;
}

export interface ICaseStats {
  total: number;
  byStatus: Record<CaseStatus, number>;
  averageResolutionTime: number;
  openCases: number;
}

export interface ITrendData {
  timestamp: string;
  value: number;
  label: string;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface ITableState {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
  search?: string;
}

export interface INotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// Error Types
// ============================================================================

export interface IAppError {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
  timestamp?: string;
}

// ============================================================================
// Request Query Types
// ============================================================================

export interface IQueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface IDashboardData {
  stats: {
    totalAlerts: number;
    openCases: number;
    activeInvestigations: number;
    alertsToday: number;
  };
  recentAlerts: IAlert[];
  alertTrend: ITrendData[];
  alertsById: ITrendData[];
  topRules: { name: string; count: number }[];
}

// ============================================================================
// Filter Types
// ============================================================================

export interface IFilterOption {
  label: string;
  value: string | number | boolean;
}

export interface IFilter {
  name: string;
  label: string;
  type: 'select' | 'multi-select' | 'date' | 'date-range' | 'text';
  options?: IFilterOption[];
  value?: unknown;
  defaultValue?: unknown;
}

// ============================================================================
// Profile Types
// ============================================================================

export interface IUserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  roleId?: string;
  permissions: string[];
}
