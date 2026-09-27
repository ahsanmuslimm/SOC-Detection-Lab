/**
 * API Gateway - Type Definitions
 * Type definitions for REST API gateway with middleware support
 */

/**
 * HTTP method
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Route handler
 */
export type RouteHandler = (context: IRouteContext) => Promise<IRouteResponse> | IRouteResponse;

/**
 * Middleware handler
 */
export type MiddlewareHandler = (context: IRouteContext) => Promise<IMiddlewareResult> | IMiddlewareResult;

/**
 * Route context
 */
export interface IRouteContext {
  method: HTTPMethod;
  path: string;
  query: Record<string, string | string[]>;
  params: Record<string, string>;
  headers: Record<string, string>;
  body: unknown;
  user?: IUserContext;
  startTime: Date;
  metadata?: Record<string, unknown>;
}

/**
 * User context
 */
export interface IUserContext {
  userId: string;
  roles: string[];
  permissions: string[];
  token?: string;
  isAuthenticated: boolean;
}

/**
 * Route response
 */
export interface IRouteResponse {
  status: number;
  headers?: Record<string, string>;
  body: unknown;
  contentType?: string;
}

/**
 * Middleware result
 */
export interface IMiddlewareResult {
  allowed: boolean;
  reason?: string;
  context?: Partial<IRouteContext>;
  error?: unknown;
}

/**
 * Route definition
 */
export interface IRoute {
  routeId: string;
  method: HTTPMethod;
  path: string;
  handler: RouteHandler;
  middlewares?: MiddlewareHandler[];
  description?: string;
  isPublic?: boolean;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  rateLimit?: IRateLimit;
  metadata?: Record<string, unknown>;
}

/**
 * Route group
 */
export interface IRouteGroup {
  groupId: string;
  basePath: string;
  routes: IRoute[];
  middlewares?: MiddlewareHandler[];
  description?: string;
}

/**
 * Rate limit configuration
 */
export interface IRateLimit {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (context: IRouteContext) => string;
}

/**
 * Request interceptor
 */
export interface IRequestInterceptor {
  interceptorId: string;
  name: string;
  priority: number;
  handler: (context: IRouteContext) => Promise<IRouteContext | null>;
}

/**
 * Response interceptor
 */
export interface IResponseInterceptor {
  interceptorId: string;
  name: string;
  priority: number;
  handler: (response: IRouteResponse) => Promise<IRouteResponse>;
}

/**
 * Error handler
 */
export interface IErrorHandler {
  handlerId: string;
  statusCode: number;
  handler: (error: unknown) => Promise<IRouteResponse> | IRouteResponse;
}

/**
 * Authentication middleware config
 */
export interface IAuthMiddlewareConfig {
  enabled: boolean;
  tokenExtractor: (context: IRouteContext) => string | null;
  tokenValidator: (token: string) => Promise<IUserContext | null>;
  publicPaths?: string[];
}

/**
 * Authorization middleware config
 */
export interface IAuthzMiddlewareConfig {
  enabled: boolean;
  roleChecker: (userId: string, requiredRoles: string[]) => Promise<boolean>;
  permissionChecker: (userId: string, requiredPermissions: string[]) => Promise<boolean>;
}

/**
 * CORS configuration
 */
export interface ICORSConfig {
  enabled: boolean;
  origins: string[];
  methods: HTTPMethod[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

/**
 * API request
 */
export interface IAPIRequest {
  requestId: string;
  method: HTTPMethod;
  path: string;
  query: Record<string, string | string[]>;
  headers: Record<string, string>;
  body: unknown;
  ip: string;
  timestamp: Date;
}

/**
 * API response
 */
export interface IAPIResponse {
  requestId: string;
  status: number;
  headers: Record<string, string>;
  body: unknown;
  contentType: string;
  responseTime: number;
  timestamp: Date;
}

/**
 * Route execution result
 */
export interface IRouteExecutionResult {
  requestId: string;
  routeId: string;
  success: boolean;
  statusCode: number;
  responseTime: number;
  middlewaresExecuted: string[];
  errors?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Rate limiter state
 */
export interface IRateLimiterState {
  userId: string;
  key: string;
  requests: number;
  resetTime: Date;
  isLimited: boolean;
}

/**
 * API gateway configuration
 */
export interface IAPIGatewayConfig {
  enableLogging: boolean;
  enableMetrics: boolean;
  enableCORS: boolean;
  corsConfig?: ICORSConfig;
  enableAuth: boolean;
  authConfig?: IAuthMiddlewareConfig;
  enableAuthz: boolean;
  authzConfig?: IAuthzMiddlewareConfig;
  enableRateLimit: boolean;
  defaultRateLimit?: IRateLimit;
  requestTimeout: number;
  maxBodySize: number;
}

/**
 * Gateway metrics
 */
export interface IGatewayMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalResponseTime: number;
  averageResponseTime: number;
  requestsByMethod: Record<HTTPMethod, number>;
  requestsByPath: Record<string, number>;
  statusCodeDistribution: Record<number, number>;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

/**
 * Gateway audit entry
 */
export interface IGatewayAuditEntry {
  entryId: string;
  requestId: string;
  userId?: string;
  method: HTTPMethod;
  path: string;
  status: number;
  responseTime: number;
  ip: string;
  timestamp: Date;
}

/**
 * Route execution event
 */
export interface IRouteExecutionEvent {
  type: 'request_received' | 'auth_check' | 'authz_check' | 'route_executed' | 'response_sent' | 'error_occurred';
  requestId: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

/**
 * Route execution listener
 */
export type RouteExecutionListener = (event: IRouteExecutionEvent) => Promise<void> | void;

/**
 * API endpoint metadata
 */
export interface IAPIEndpointMetadata {
  operationId: string;
  summary: string;
  description: string;
  tags: string[];
  parameters: IAPIParameter[];
  requestBody?: IAPIRequestBody;
  responses: Record<number, IAPIResponse>;
  deprecated?: boolean;
}

/**
 * API parameter
 */
export interface IAPIParameter {
  name: string;
  in: 'query' | 'path' | 'header';
  type: string;
  required: boolean;
  description?: string;
  example?: unknown;
}

/**
 * API request body
 */
export interface IAPIRequestBody {
  required: boolean;
  content: Record<string, IMediaType>;
}

/**
 * Media type
 */
export interface IMediaType {
  schema: Record<string, unknown>;
  example?: unknown;
}

/**
 * Health check result
 */
export interface IHealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  components: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
  checks: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
  }>;
}

/**
 * Route registration result
 */
export interface IRouteRegistrationResult {
  routeId: string;
  method: HTTPMethod;
  path: string;
  registered: boolean;
  errors?: string[];
}

/**
 * Batch route registration result
 */
export interface IBatchRouteRegistrationResult {
  totalRoutes: number;
  successfulRoutes: number;
  failedRoutes: number;
  results: IRouteRegistrationResult[];
}

/**
 * API version
 */
export interface IAPIVersion {
  version: string;
  released: Date;
  routes: IRoute[];
  deprecated: boolean;
  deprecationDate?: Date;
}
