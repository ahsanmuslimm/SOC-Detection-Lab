/**
 * Shared Type Definitions - Core Types
 * Defines all shared application types and interfaces
 */

// ============================================================
// Identifiers & Basic Types
// ============================================================

export type ID = string & { readonly __brand: 'ID' };
export type UUID = string & { readonly __brand: 'UUID' };
export type Email = string & { readonly __brand: 'Email' };
export type URL = string & { readonly __brand: 'URL' };

export function createID(value: string): ID {
  return value as ID;
}

export function createUUID(value: string): UUID {
  return value as UUID;
}

export function createEmail(value: string): Email {
  return value as Email;
}

export function createURL(value: string): URL {
  return value as URL;
}

// ============================================================
// User & Authentication Types
// ============================================================

export interface IUser {
  id: ID;
  email: Email;
  username: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface ISession {
  id: ID;
  userId: ID;
  token: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
  createdAt: Date;
}

// ============================================================
// Event Types
// ============================================================

export type EventLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type EventSource = 'api' | 'agent' | 'webhook' | 'import' | 'manual';
export type EventStatus = 'new' | 'acknowledged' | 'closed' | 'escalated';

export interface IEvent {
  id: ID;
  source: EventSource;
  level: EventLevel;
  timestamp: Date;
  sourceIp: string;
  userId?: ID;
  eventType: string;
  description: string;
  metadata: Record<string, unknown>;
  hash: string;
  rawData?: Record<string, unknown>;
}

export interface INormalizedEvent extends IEvent {
  normalizedAt: Date;
  normalizedData: Record<string, unknown>;
  enrichedData?: Record<string, unknown>;
}

// ============================================================
// Detection & Alert Types
// ============================================================

export type ThreatLevel = 'critical' | 'high' | 'medium' | 'low';
export type DetectionMethod = 'rule' | 'ml' | 'anomaly' | 'correlation';
export type AlertStatus = 'new' | 'acknowledged' | 'investigating' | 'resolved' | 'false_positive';

export interface IDetection {
  id: ID;
  eventIds: ID[];
  method: DetectionMethod;
  ruleId?: ID;
  threatLevel: ThreatLevel;
  threatScore: number;
  confidence: number;
  description: string;
  metadata: Record<string, unknown>;
  detectedAt: Date;
}

export interface IAlert {
  id: ID;
  detectionId: ID;
  title: string;
  description: string;
  threatLevel: ThreatLevel;
  status: AlertStatus;
  assignedTo?: ID;
  createdBy: ID;
  createdAt: Date;
  updatedAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: ID;
  resolvedAt?: Date;
  resolvedBy?: ID;
}

// ============================================================
// Investigation & Case Types
// ============================================================

export type InvestigationStatus = 'open' | 'in_progress' | 'on_hold' | 'closed';
export type CaseStatus = 'new' | 'assigned' | 'in_progress' | 'waiting' | 'closed' | 'archived';
export type CasePriority = 'critical' | 'high' | 'medium' | 'low';
export type WorkflowStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface IInvestigation {
  id: ID;
  alertId: ID;
  title: string;
  description: string;
  status: InvestigationStatus;
  assignedTo: ID;
  timeline: ITimelineEvent[];
  relatedEntities: IEntity[];
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export interface ICase {
  id: ID;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  assignedTo: ID;
  createdBy: ID;
  alerts: ID[];
  investigations: ID[];
  tickets: ID[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimelineEvent {
  id: ID;
  eventId: ID;
  timestamp: Date;
  type: string;
  description: string;
  source: string;
}

export interface IEntity {
  id: ID;
  type: 'ip' | 'domain' | 'user' | 'file' | 'process' | 'registry' | 'url';
  value: string;
  firstSeen: Date;
  lastSeen: Date;
  threat Level?: ThreatLevel;
  metadata: Record<string, unknown>;
}

// ============================================================
// Response & Remediation Types
// ============================================================

export type ActionStatus = 'pending' | 'executing' | 'succeeded' | 'failed' | 'cancelled';
export type ActionType = 'isolate' | 'block' | 'reset' | 'delete' | 'notify' | 'investigate';

export interface IResponseAction {
  id: ID;
  caseId: ID;
  actionType: ActionType;
  target: string;
  status: ActionStatus;
  description: string;
  executedBy?: ID;
  createdAt: Date;
  executedAt?: Date;
  completedAt?: Date;
  result?: Record<string, unknown>;
  error?: string;
}

export interface IRemediationStep {
  id: ID;
  actionId: ID;
  step: number;
  description: string;
  status: WorkflowStatus;
  startedAt?: Date;
  completedAt?: Date;
}

// ============================================================
// Report & Metrics Types
// ============================================================

export interface IReportData {
  id: ID;
  title: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  period: {
    startDate: Date;
    endDate: Date;
  };
  metrics: Record<string, unknown>;
  generatedAt: Date;
  generatedBy: ID;
}

export interface IMetrics {
  timestamp: Date;
  eventsProcessed: number;
  detectionsCreated: number;
  alertsGenerated: number;
  casesCreated: number;
  averageResponseTime: number;
  systemHealth: number;
}

// ============================================================
// API Response Types
// ============================================================

export interface IApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: IApiError;
  meta?: {
    timestamp: string;
    version: string;
    requestId?: string;
  };
}

export interface IApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

// ============================================================
// Database Types
// ============================================================

export interface IRepository<T> {
  findById(id: ID): Promise<T | null>;
  findAll(filter?: Record<string, unknown>): Promise<T[]>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: ID, data: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
}

export interface IQueryBuilder {
  where(field: string, operator: string, value: unknown): IQueryBuilder;
  orderBy(field: string, direction: 'asc' | 'desc'): IQueryBuilder;
  limit(limit: number): IQueryBuilder;
  offset(offset: number): IQueryBuilder;
  build(): string;
}

// ============================================================
// Pagination Types
// ============================================================

export interface IPaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface IPaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasMore: boolean;
}

// ============================================================
// Filter & Search Types
// ============================================================

export interface ISearchQuery {
  query: string;
  filters?: Record<string, unknown>;
  sort?: string;
  pagination?: IPaginationParams;
}

export interface ISearchResult<T> {
  results: T[];
  total: number;
  took: number; // milliseconds
  facets?: Record<string, unknown>;
}

// ============================================================
// Audit & Compliance Types
// ============================================================

export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'login' | 'logout';

export interface IAuditLog {
  id: ID;
  userId: ID;
  action: AuditAction;
  resource: string;
  resourceId: ID;
  changes?: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure';
  errorMessage?: string;
  timestamp: Date;
}

// ============================================================
// Webhook Types
// ============================================================

export interface IWebhook {
  id: ID;
  url: URL;
  events: string[];
  isActive: boolean;
  secret: string;
  retryCount: number;
  timeout: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWebhookPayload<T = unknown> {
  event: string;
  timestamp: Date;
  data: T;
  signature: string;
}

// ============================================================
// Error Types
// ============================================================

export interface IErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
  timestamp: Date;
  requestId?: string;
}

// ============================================================
// Health Check Types
// ============================================================

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface IHealthCheckResult {
  status: HealthStatus;
  timestamp: Date;
  uptime: number;
  checks: {
    database: HealthStatus;
    cache: HealthStatus;
    search: HealthStatus;
    filesystem: HealthStatus;
  };
}
