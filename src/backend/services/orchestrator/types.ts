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
  registerHandler(type: string, handler: Function): void;
  initialize?(): Promise<void>;
}

// ============================================
// DOMAIN 2: AUTHENTICATION SERVICES
// ============================================

export interface IAuthService {
  authenticate(credentials: any): Promise<string>;
  validateToken(token: string): Promise<boolean>;
  refreshToken(token: string): Promise<string>;
  initialize?(): Promise<void>;
}

export interface IUserService {
  getUser(id: string): Promise<any>;
  createUser(userData: any): Promise<any>;
  updateUser(id: string, userData: any): Promise<any>;
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
  'storageService'
];

export const SERVICE_NAMES = new Set(INITIALIZATION_ORDER);
