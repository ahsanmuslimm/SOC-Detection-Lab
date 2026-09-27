/**
 * API Gateway Service - Main Implementation
 * REST API gateway with middleware, authentication, authorization, and rate limiting support
 */

import {
  HTTPMethod,
  RouteHandler,
  MiddlewareHandler,
  IRouteContext,
  IRouteResponse,
  IMiddlewareResult,
  IRoute,
  IRouteGroup,
  IRateLimit,
  IRequestInterceptor,
  IResponseInterceptor,
  IErrorHandler,
  IAuthMiddlewareConfig,
  IAuthzMiddlewareConfig,
  ICORSConfig,
  IAPIRequest,
  IAPIResponse,
  IRouteExecutionResult,
  IRateLimiterState,
  IAPIGatewayConfig,
  IGatewayMetrics,
  IGatewayAuditEntry,
  IRouteExecutionEvent,
  RouteExecutionListener,
  IAPIEndpointMetadata,
  IHealthCheckResult,
  IRouteRegistrationResult,
  IBatchRouteRegistrationResult,
  IAPIVersion,
} from './types';

/**
 * API Gateway Service
 * Provides REST API gateway functionality with middleware, authentication, authorization, and rate limiting
 */
export class APIGateway {
  private routes: Map<string, IRoute> = new Map();
  private routeGroups: Map<string, IRouteGroup> = new Map();
  private middlewares: MiddlewareHandler[] = [];
  private requestInterceptors: IRequestInterceptor[] = [];
  private responseInterceptors: IResponseInterceptor[] = [];
  private errorHandlers: Map<number, IErrorHandler> = new Map();
  private rateLimiters: Map<string, IRateLimiterState> = new Map();
  private listeners: Set<RouteExecutionListener> = new Set();
  private config: IAPIGatewayConfig;
  private metrics: IGatewayMetrics;
  private auditLog: IGatewayAuditEntry[] = [];
  private apiVersions: Map<string, IAPIVersion> = new Map();
  private endpointMetadata: Map<string, IAPIEndpointMetadata> = new Map();
  private corsMiddleware: MiddlewareHandler | null = null;
  private authMiddleware: MiddlewareHandler | null = null;
  private authzMiddleware: MiddlewareHandler | null = null;
  private rateLimitMiddleware: MiddlewareHandler | null = null;

  /**
   * Constructor
   */
  constructor(config: IAPIGatewayConfig) {
    this.config = this.validateConfig(config);
    this.metrics = this.initializeMetrics();
    this.initializeMiddleware();
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: IAPIGatewayConfig): IAPIGatewayConfig {
    if (config.requestTimeout < 100) {
      throw new Error('Request timeout must be at least 100ms');
    }
    if (config.maxBodySize < 1024) {
      throw new Error('Max body size must be at least 1024 bytes');
    }
    return config;
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): IGatewayMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      requestsByMethod: {
        GET: 0,
        POST: 0,
        PUT: 0,
        PATCH: 0,
        DELETE: 0,
        HEAD: 0,
        OPTIONS: 0,
      },
      requestsByPath: {},
      statusCodeDistribution: {},
      errorRate: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
    };
  }

  /**
   * Initialize built-in middleware
   */
  private initializeMiddleware(): void {
    if (this.config.enableCORS && this.config.corsConfig) {
      this.corsMiddleware = this.createCORSMiddleware(this.config.corsConfig);
      this.middlewares.push(this.corsMiddleware);
    }

    if (this.config.enableAuth && this.config.authConfig) {
      this.authMiddleware = this.createAuthMiddleware(this.config.authConfig);
      this.middlewares.push(this.authMiddleware);
    }

    if (this.config.enableAuthz && this.config.authzConfig) {
      this.authzMiddleware = this.createAuthzMiddleware(this.config.authzConfig);
      this.middlewares.push(this.authzMiddleware);
    }

    if (this.config.enableRateLimit) {
      this.rateLimitMiddleware = this.createRateLimitMiddleware();
      this.middlewares.push(this.rateLimitMiddleware);
    }
  }

  /**
   * Register a route
   */
  public registerRoute(route: IRoute): IRouteRegistrationResult {
    try {
      if (!route.routeId || !route.method || !route.path || !route.handler) {
        return {
          routeId: route.routeId || 'unknown',
          method: route.method,
          path: route.path,
          registered: false,
          errors: ['Missing required route properties'],
        };
      }

      const routeKey = `${route.method}:${route.path}`;
      if (this.routes.has(routeKey)) {
        return {
          routeId: route.routeId,
          method: route.method,
          path: route.path,
          registered: false,
          errors: ['Route already registered'],
        };
      }

      this.routes.set(routeKey, route);
      return {
        routeId: route.routeId,
        method: route.method,
        path: route.path,
        registered: true,
      };
    } catch (error) {
      return {
        routeId: route.routeId || 'unknown',
        method: route.method,
        path: route.path,
        registered: false,
        errors: [String(error)],
      };
    }
  }

  /**
   * Register multiple routes
   */
  public registerRoutes(routes: IRoute[]): IBatchRouteRegistrationResult {
    const results: IRouteRegistrationResult[] = [];
    let successCount = 0;

    for (const route of routes) {
      const result = this.registerRoute(route);
      results.push(result);
      if (result.registered) {
        successCount++;
      }
    }

    return {
      totalRoutes: routes.length,
      successfulRoutes: successCount,
      failedRoutes: routes.length - successCount,
      results,
    };
  }

  /**
   * Register a route group
   */
  public registerRouteGroup(group: IRouteGroup): void {
    if (this.routeGroups.has(group.groupId)) {
      throw new Error(`Route group ${group.groupId} already registered`);
    }

    this.routeGroups.set(group.groupId, group);

    for (const route of group.routes) {
      const updatedRoute: IRoute = {
        ...route,
        path: group.basePath + route.path,
        middlewares: [
          ...(group.middlewares || []),
          ...(route.middlewares || []),
        ],
      };
      this.registerRoute(updatedRoute);
    }
  }

  /**
   * Get route by method and path
   */
  public getRoute(method: HTTPMethod, path: string): IRoute | null {
    const routeKey = `${method}:${path}`;
    return this.routes.get(routeKey) || null;
  }

  /**
   * Get all routes
   */
  public getAllRoutes(): IRoute[] {
    return Array.from(this.routes.values());
  }

  /**
   * Add middleware
   */
  public addMiddleware(handler: MiddlewareHandler): this {
    this.middlewares.push(handler);
    return this;
  }

  /**
   * Add request interceptor
   */
  public addRequestInterceptor(interceptor: IRequestInterceptor): this {
    this.requestInterceptors.push(interceptor);
    this.requestInterceptors.sort((a, b) => a.priority - b.priority);
    return this;
  }

  /**
   * Add response interceptor
   */
  public addResponseInterceptor(interceptor: IResponseInterceptor): this {
    this.responseInterceptors.push(interceptor);
    this.responseInterceptors.sort((a, b) => a.priority - b.priority);
    return this;
  }

  /**
   * Register error handler
   */
  public registerErrorHandler(handler: IErrorHandler): this {
    this.errorHandlers.set(handler.statusCode, handler);
    return this;
  }

  /**
   * Execute route handler with middleware
   */
  public async executeRoute(context: IRouteContext): Promise<IRouteResponse> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      // Track metrics
      this.metrics.totalRequests++;
      this.metrics.requestsByMethod[context.method]++;
      this.metrics.requestsByPath[context.path] =
        (this.metrics.requestsByPath[context.path] || 0) + 1;

      // Emit request received event
      await this.emitEvent({
        type: 'request_received',
        requestId,
        timestamp: new Date(),
        details: { method: context.method, path: context.path },
      });

      // Find route
      const route = this.getRoute(context.method, context.path);
      if (!route) {
        const response: IRouteResponse = {
          status: 404,
          body: { error: 'Route not found' },
        };
        this.recordMetrics(context, response, Date.now() - startTime);
        return response;
      }

      // Execute interceptors
      let interceptedContext = context;
      for (const interceptor of this.requestInterceptors) {
        const result = await interceptor.handler(interceptedContext);
        if (!result) {
          const response: IRouteResponse = {
            status: 400,
            body: { error: 'Request interceptor rejected request' },
          };
          this.recordMetrics(context, response, Date.now() - startTime);
          return response;
        }
        interceptedContext = result;
      }

      // Execute global middleware
      for (const middleware of this.middlewares) {
        const result = await middleware(interceptedContext);
        if (!result.allowed) {
          const response: IRouteResponse = {
            status: 403,
            body: { error: result.reason || 'Middleware rejected request' },
          };
          this.recordMetrics(context, response, Date.now() - startTime);
          return response;
        }
        if (result.context) {
          interceptedContext = { ...interceptedContext, ...result.context };
        }
      }

      // Execute route-specific middleware
      if (route.middlewares) {
        for (const middleware of route.middlewares) {
          const result = await middleware(interceptedContext);
          if (!result.allowed) {
            const response: IRouteResponse = {
              status: 403,
              body: { error: result.reason || 'Route middleware rejected request' },
            };
            this.recordMetrics(context, response, Date.now() - startTime);
            return response;
          }
          if (result.context) {
            interceptedContext = { ...interceptedContext, ...result.context };
          }
        }
      }

      // Execute route handler
      await this.emitEvent({
        type: 'route_executed',
        requestId,
        timestamp: new Date(),
        details: { routeId: route.routeId },
      });

      let response = await route.handler(interceptedContext);

      // Execute response interceptors
      for (const interceptor of this.responseInterceptors) {
        response = await interceptor.handler(response);
      }

      // Record success
      this.metrics.successfulRequests++;
      this.recordMetrics(context, response, Date.now() - startTime);

      await this.emitEvent({
        type: 'response_sent',
        requestId,
        timestamp: new Date(),
        details: { status: response.status },
      });

      return response;
    } catch (error) {
      this.metrics.failedRequests++;
      const statusCode = 500;
      const handler = this.errorHandlers.get(statusCode);
      const response = handler
        ? await handler.handler(error)
        : { status: 500, body: { error: 'Internal server error' } };

      this.recordMetrics(context, response, Date.now() - startTime);

      await this.emitEvent({
        type: 'error_occurred',
        requestId,
        timestamp: new Date(),
        details: { error: String(error) },
      });

      return response;
    }
  }

  /**
   * Create CORS middleware
   */
  private createCORSMiddleware(config: ICORSConfig): MiddlewareHandler {
    return async (context: IRouteContext): Promise<IMiddlewareResult> => {
      if (config.origins.includes('*') || config.origins.includes(context.headers.origin || '')) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'CORS origin not allowed' };
    };
  }

  /**
   * Create authentication middleware
   */
  private createAuthMiddleware(config: IAuthMiddlewareConfig): MiddlewareHandler {
    return async (context: IRouteContext): Promise<IMiddlewareResult> => {
      if (config.publicPaths?.some((path) => context.path.startsWith(path))) {
        return { allowed: true };
      }

      const token = config.tokenExtractor(context);
      if (!token) {
        return { allowed: false, reason: 'Missing authentication token' };
      }

      const user = await config.tokenValidator(token);
      if (!user) {
        return { allowed: false, reason: 'Invalid authentication token' };
      }

      return { allowed: true, context: { user } };
    };
  }

  /**
   * Create authorization middleware
   */
  private createAuthzMiddleware(config: IAuthzMiddlewareConfig): MiddlewareHandler {
    return async (context: IRouteContext): Promise<IMiddlewareResult> => {
      if (!context.user) {
        return { allowed: true };
      }

      const route = this.getRoute(context.method, context.path);
      if (!route) {
        return { allowed: true };
      }

      if (route.requiredRoles && route.requiredRoles.length > 0) {
        const hasRoles = await config.roleChecker(context.user.userId, route.requiredRoles);
        if (!hasRoles) {
          return { allowed: false, reason: 'User lacks required roles' };
        }
      }

      if (route.requiredPermissions && route.requiredPermissions.length > 0) {
        const hasPermissions = await config.permissionChecker(
          context.user.userId,
          route.requiredPermissions,
        );
        if (!hasPermissions) {
          return { allowed: false, reason: 'User lacks required permissions' };
        }
      }

      return { allowed: true };
    };
  }

  /**
   * Create rate limit middleware
   */
  private createRateLimitMiddleware(): MiddlewareHandler {
    return async (context: IRouteContext): Promise<IMiddlewareResult> => {
      const route = this.getRoute(context.method, context.path);
      const rateLimit = route?.rateLimit || this.config.defaultRateLimit;

      if (!rateLimit) {
        return { allowed: true };
      }

      const key = rateLimit.keyGenerator?.(context) || context.user?.userId || context.headers['x-forwarded-for'] || 'anonymous';
      const state = this.getRateLimiterState(key);

      if (state.isLimited) {
        return { allowed: false, reason: 'Rate limit exceeded' };
      }

      state.requests++;
      if (state.requests > rateLimit.maxRequests) {
        state.isLimited = true;
      }

      return { allowed: true };
    };
  }

  /**
   * Get or create rate limiter state
   */
  private getRateLimiterState(key: string): IRateLimiterState {
    let state = this.rateLimiters.get(key);

    if (!state) {
      state = {
        userId: key,
        key,
        requests: 0,
        resetTime: new Date(Date.now() + (this.config.defaultRateLimit?.windowMs || 60000)),
        isLimited: false,
      };
      this.rateLimiters.set(key, state);
    }

    if (new Date() > state.resetTime) {
      state.requests = 0;
      state.isLimited = false;
      state.resetTime = new Date(Date.now() + (this.config.defaultRateLimit?.windowMs || 60000));
    }

    return state;
  }

  /**
   * Register endpoint metadata
   */
  public registerEndpointMetadata(metadata: IAPIEndpointMetadata): this {
    this.endpointMetadata.set(metadata.operationId, metadata);
    return this;
  }

  /**
   * Get endpoint metadata
   */
  public getEndpointMetadata(operationId: string): IAPIEndpointMetadata | null {
    return this.endpointMetadata.get(operationId) || null;
  }

  /**
   * Register API version
   */
  public registerAPIVersion(version: IAPIVersion): this {
    if (this.apiVersions.has(version.version)) {
      throw new Error(`API version ${version.version} already registered`);
    }
    this.apiVersions.set(version.version, version);
    return this;
  }

  /**
   * Get API version
   */
  public getAPIVersion(version: string): IAPIVersion | null {
    return this.apiVersions.get(version) || null;
  }

  /**
   * List all API versions
   */
  public listAPIVersions(): IAPIVersion[] {
    return Array.from(this.apiVersions.values());
  }

  /**
   * Perform health check
   */
  public async performHealthCheck(): Promise<IHealthCheckResult> {
    const checks = [
      {
        name: 'routes_registered',
        status: this.routes.size > 0 ? ('healthy' as const) : ('degraded' as const),
      },
      {
        name: 'middleware_loaded',
        status: this.middlewares.length > 0 ? ('healthy' as const) : ('degraded' as const),
      },
      {
        name: 'error_handlers_registered',
        status: this.errorHandlers.size > 0 ? ('healthy' as const) : ('degraded' as const),
      },
    ];

    const unhealthyCount = checks.filter((c) => c.status === 'unhealthy').length;
    const overallStatus =
      unhealthyCount > 0 ? ('unhealthy' as const) : ('healthy' as const);

    return {
      status: overallStatus,
      timestamp: new Date(),
      components: {
        routes: 'healthy',
        middleware: 'healthy',
        interceptors: 'healthy',
      },
      checks,
    };
  }

  /**
   * Record metrics for a request
   */
  private recordMetrics(context: IRouteContext, response: IRouteResponse, responseTime: number): void {
    this.metrics.totalResponseTime += responseTime;
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.totalRequests;

    const statusCode = response.status;
    this.metrics.statusCodeDistribution[statusCode] =
      (this.metrics.statusCodeDistribution[statusCode] || 0) + 1;

    const auditEntry: IGatewayAuditEntry = {
      entryId: this.generateAuditId(),
      requestId: this.generateRequestId(),
      userId: context.user?.userId,
      method: context.method,
      path: context.path,
      status: statusCode,
      responseTime,
      ip: context.headers['x-forwarded-for'] || 'unknown',
      timestamp: new Date(),
    };

    this.auditLog.push(auditEntry);
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }

    this.metrics.errorRate =
      this.metrics.failedRequests / Math.max(1, this.metrics.totalRequests);
  }

  /**
   * Get gateway metrics
   */
  public getMetrics(): IGatewayMetrics {
    return { ...this.metrics };
  }

  /**
   * Get audit log
   */
  public getAuditLog(limit: number = 100): IGatewayAuditEntry[] {
    return this.auditLog.slice(-limit);
  }

  /**
   * Add event listener
   */
  public onRouteExecution(listener: RouteExecutionListener): this {
    this.listeners.add(listener);
    return this;
  }

  /**
   * Remove event listener
   */
  public offRouteExecution(listener: RouteExecutionListener): this {
    this.listeners.delete(listener);
    return this;
  }

  /**
   * Emit event to all listeners
   */
  private async emitEvent(event: IRouteExecutionEvent): Promise<void> {
    for (const listener of this.listeners) {
      try {
        await listener(event);
      } catch (error) {
        // Silently ignore listener errors
      }
    }
  }

  /**
   * Get gateway status
   */
  public getStatus(): {
    active: boolean;
    routesRegistered: number;
    middlewareCount: number;
    totalRequests: number;
    uptime: number;
  } {
    return {
      active: true,
      routesRegistered: this.routes.size,
      middlewareCount: this.middlewares.length,
      totalRequests: this.metrics.totalRequests,
      uptime: Date.now(),
    };
  }

  /**
   * Clear all routes
   */
  public clearRoutes(): this {
    this.routes.clear();
    return this;
  }

  /**
   * Clear all metrics
   */
  public clearMetrics(): this {
    this.metrics = this.initializeMetrics();
    this.auditLog = [];
    return this;
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate audit ID
   */
  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory function to create API Gateway
 */
export function createAPIGateway(config: IAPIGatewayConfig): APIGateway {
  return new APIGateway(config);
}
