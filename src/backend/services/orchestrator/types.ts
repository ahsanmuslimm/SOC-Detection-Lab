/**
 * Service Orchestrator - Type Definitions
 * Defines all 15 services and their interfaces
 */

// ============================================
// SERVICE CONFIGURATION TYPES
// ============================================

export interface IServiceConfig {
  maxRetries?: number;
  timeoutMs?: number;
  enableLogging?: boolean;
}

export interface IServiceHealth {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  responseTime?: number;
  details?: Record<string, any>;
}

export interface IOrchestratorConfig {
  enableAutoInitialize?: boolean;
  enableAutoShutdown?: boolean;
  healthCheckIntervalMs?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

// ============================================
// DOMAIN 1: CORE INFRASTRUCTURE SERVICES
// ============================================

export interface IConfigService {
  get(key: string): any;
  set(key: string, value: any): void;
  validate(): Promise<boolean>;
  initialize?(): Promise<void>;
}

export interface IAuditService {
  log(entry: any): Promise<void>;
  getLogs(filter?: any): Promise<any[]>;
  initialize?(): Promise<void>;
}

export interface ICacheService {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  initialize?(): Promise<void>;
}

export interface ILoggingService {
  debug(message: string, context?: any): void;
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, error?: Error, context?: any): void;
  initialize?(): Promise<void>;
}

export interface IErrorHandlingService {
  handle(error: Error): any;
  registerHandler(type: string, handler: (...args: any[]) => void): void;
  initialize?(): Promise<void>;
}

// ============================================
// DOMAIN 2: AUTHENTICATION SERVICES
// ============================================

export interface IAuthService {
  authenticate(credentials: any): Promise<string>;
  validateToken(token: string): Promise<boolean>;
  refreshToken(token: string): Promise<any>;
  /** Issue access + refresh tokens for valid credentials (in-memory auth). */
  login?(credentials: any): Promise<any>;
  /** End a session / revoke issued tokens for the user. */
  logout?(userId: string, sessionId?: string): Promise<void>;
  initialize?(): Promise<void>;
}

export interface IUserService {
  getUser(id: string): Promise<any>;
  createUser(userData: any): Promise<any>;
  updateUser(id: string, userData: any): Promise<any>;
  queryUsers?(params?: any): Promise<{ users: any[]; total: number }>;
  deleteUser?(id: string): Promise<boolean>;
  initialize?(): Promise<void>;
}

export interface ITokenService {
  generateToken(payload: any): string;
  verifyToken(token: string): any;
  revokeToken(token: string): Promise<void>;
  initialize?(): Promise<void>;
}

export interface ISessionService {
  createSession(userId: string, data: any): Promise<string>;
  getSession(sessionId: string): Promise<any>;
  endSession(sessionId: string): Promise<void>;
  initialize?(): Promise<void>;
}

// ============================================
// DOMAIN 3: AUTHORIZATION SERVICES
// ============================================

export interface IRBACService {
  hasPermission(role: string, permission: string): boolean;
  getPermissions(role: string): string[];
  addPermission(role: string, permission: string): Promise<void>;
  getRole?(roleId: string): Promise<any>;
  getAllRoles?(): Promise<{ roles: any[]; total: number }>;
  getAllPermissions?(): Promise<{ permissions: any[]; total: number }>;
  updateRolePermissions?(roleId: string, data: any): Promise<any>;
  getUserPermissions?(userId: string): Promise<any>;
  initialize?(): Promise<void>;
}

export interface IPermissionService {
  checkPermission(userId: string, action: string, resource: string): Promise<boolean>;
  getPermissions(userId: string): Promise<string[]>;
  initialize?(): Promise<void>;
}

export interface IPolicyEngine {
  evaluatePolicy(policy: any, context: any): Promise<boolean>;
  registerPolicy(name: string, policy: any): void;
  initialize?(): Promise<void>;
}

export interface IAccessControlService {
  isAccessAllowed(userId: string, action: string): Promise<boolean>;
  initialize?(): Promise<void>;
}

// ============================================
// DOMAIN 12: INTEGRATION SERVICES
// ============================================

export interface IAnalyticsService {
  trackEvent(event: any): string;
  getStatistics(): any;
  performHealthCheck(): Promise<any>;
  stop?(): void;
}

export interface ISyncService {
  sync(source: string, destination: string): Promise<void>;
  performHealthCheck(): Promise<any>;
  stop?(): void;
}

export interface IExportService {
  export(data: any, format: string): Promise<string>;
  performHealthCheck(): Promise<any>;
  stop?(): void;
}

export interface ISearchService {
  search(query: string, filters?: any): Promise<any[]>;
  performHealthCheck(): Promise<any>;
  stop?(): void;
}

export interface IQueueService {
  enqueue(message: any): Promise<string>;
  dequeue(): Promise<any>;
  performHealthCheck(): Promise<any>;
  stop?(): void;
}

export interface IStorageService {
  store(key: string, data: any): Promise<void>;
  retrieve(key: string): Promise<any>;
  performHealthCheck(): Promise<any>;
  stop?(): void;
}

export interface ICacheServiceIntegration {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  performHealthCheck(): Promise<any>;
  stop?(): void;
}

export interface IConfigurationService {
  getConfig(name: string): Promise<any>;
  setConfig(name: string, value: any): Promise<void>;
  performHealthCheck(): Promise<any>;
  stop?(): void;
}

export interface IMetricsService {
  recordMetric(name: string, value: number): Promise<void>;
  getMetrics(): Promise<any>;
  performHealthCheck(): Promise<any>;
  stop?(): void;
}

// ============================================
// SERVICE ORCHESTRATOR INTERFACE
// ============================================

// ============================================
// DOMAIN SERVICES (SOC workflows)
// ============================================
// In-memory implementations ship with the orchestrator for MVP/v2; the
// PostgreSQL-backed repositories replace them in the hardening phase.

export interface IAlertDomainService {
  createAlert(data: any): Promise<any>;
  getAlert(id: string): Promise<any>;
  updateAlert(id: string, data: any): Promise<any>;
  deleteAlert(id: string): Promise<boolean>;
  getAlertStats?(filters?: any): Promise<any>;
  initialize?(): Promise<void>;
}

export interface IQueryDomainService {
  queryAlerts(params: any): Promise<{ alerts: any[]; total: number }>;
  initialize?(): Promise<void>;
}

export interface ICaseDomainService {
  createCase(data: any): Promise<any>;
  getCase(id: string): Promise<any>;
  updateCase(id: string, data: any): Promise<any>;
  deleteCase(id: string): Promise<boolean>;
  queryCases?(params?: any): Promise<{ cases: any[]; total: number }>;
  getCaseStats?(): Promise<any>;
  initialize?(): Promise<void>;
}

export interface IDetectionDomainService {
  createRule(data: any): Promise<any>;
  getRule(id: string): Promise<any>;
  updateRule(id: string, data: any): Promise<any>;
  deleteRule(id: string): Promise<boolean>;
  queryRules?(params?: any): Promise<{ rules: any[]; total: number }>;
  testRule?(id: string, data?: any): Promise<any>;
  deployRule?(id: string): Promise<any>;
  initialize?(): Promise<void>;
}

export interface IInvestigationDomainService {
  createInvestigation(data: any): Promise<any>;
  getInvestigation(id: string): Promise<any>;
  updateInvestigation(id: string, data: any): Promise<any>;
  queryInvestigations?(params?: any): Promise<{ investigations: any[]; total: number }>;
  getTimeline?(id: string): Promise<any>;
  getCaseInvestigations?(caseId: string): Promise<any>;
  closeInvestigation?(id: string, data?: any): Promise<any>;
  initialize?(): Promise<void>;
}

export interface IReportDomainService {
  generateReport(data: any): Promise<any>;
  getReport(id: string): Promise<any>;
  updateReport(id: string, data: any): Promise<any>;
  deleteReport(id: string): Promise<boolean>;
  queryReports?(params?: any): Promise<{ reports: any[]; total: number }>;
  initialize?(): Promise<void>;
}

export interface IServiceOrchestrator {
  // Core Infrastructure
  configService: IConfigService;
  auditService: IAuditService;
  cacheService: ICacheService;
  loggingService: ILoggingService;
  errorHandlingService: IErrorHandlingService;

  // Authentication
  authService: IAuthService;
  userService: IUserService;
  tokenService: ITokenService;
  sessionService: ISessionService;

  // Authorization
  rbacService: IRBACService;
  permissionService: IPermissionService;
  policyEngine: IPolicyEngine;
  accessControlService: IAccessControlService;

  // Integration Services (Tier 2)
  analyticsService: IAnalyticsService;
  syncService: ISyncService;
  exportService: IExportService;
  searchService: ISearchService;
  queueService: IQueueService;
  storageService: IStorageService;
  cacheServiceIntegration: ICacheServiceIntegration;
  configurationService: IConfigurationService;
  metricsService: IMetricsService;

  // Domain Services (SOC workflows)
  alertService?: IAlertDomainService;
  queryService?: IQueryDomainService;
  caseService?: ICaseDomainService;
  detectionService?: IDetectionDomainService;
  investigationService?: IInvestigationDomainService;
  reportService?: IReportDomainService;

  // Lifecycle Methods
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  healthCheck(): Promise<Record<string, IServiceHealth>>;
  getService(name: string): any;
  isInitialized(): boolean;
}

// ============================================
// SERVICE REGISTRY
// ============================================

export interface IServiceRegistry {
  register(name: string, service: any): void;
  get(name: string): any;
  getAll(): Record<string, any>;
}

// ============================================
// INITIALIZATION ORDER
// ============================================

export const INITIALIZATION_ORDER = [
  // Phase 1: Infrastructure (must be first)
  'configService',
  'loggingService',
  'errorHandlingService',
  'auditService',
  'cacheService',

  // Phase 2: Authentication
  'tokenService',
  'userService',
  'sessionService',
  'authService',

  // Phase 3: Authorization
  'rbacService',
  'permissionService',
  'policyEngine',
  'accessControlService',

  // Phase 4: Integration Services
  'metricsService',
  'configurationService',
  'cacheServiceIntegration',
  'analyticsService',
  'syncService',
  'exportService',
  'searchService',
  'queueService',
  'storageService',

  // Phase 5: Domain Services (SOC workflows)
  'alertService',
  'queryService',
  'caseService',
  'detectionService',
  'investigationService',
  'reportService'
];

export const SERVICE_NAMES = new Set(INITIALIZATION_ORDER);
