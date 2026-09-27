/**
 * API Gateway Service - Demonstration Scenarios
 */

import {
  APIGateway,
  createAPIGateway,
  IRoute,
  IRouteGroup,
  IAPIGatewayConfig,
  IRequestInterceptor,
  IResponseInterceptor,
  IRouteContext,
  IMiddlewareResult,
  IErrorHandler,
} from '../src';

/**
 * Demo 1: Basic Route Registration and Execution
 */
async function demo1_BasicRouteRegistration() {
  console.log('\n=== Demo 1: Basic Route Registration and Execution ===\n');

  const config: IAPIGatewayConfig = {
    enableLogging: true,
    enableMetrics: true,
    enableCORS: false,
    enableAuth: false,
    enableAuthz: false,
    enableRateLimit: false,
    requestTimeout: 30000,
    maxBodySize: 1024 * 1024,
  };

  const gateway = createAPIGateway(config);

  // Register GET route
  gateway.registerRoute({
    routeId: 'get-users',
    method: 'GET',
    path: '/api/users',
    description: 'Get all users',
    handler: async () => ({
      status: 200,
      body: {
        users: [
          { id: '1', name: 'Alice' },
          { id: '2', name: 'Bob' },
        ],
      },
    }),
  });

  // Execute route
  const context: IRouteContext = {
    method: 'GET',
    path: '/api/users',
    query: {},
    params: {},
    headers: {},
    body: null,
    startTime: new Date(),
  };

  const response = await gateway.executeRoute(context);
  console.log('Route executed successfully');
  console.log(`Status: ${response.status}`);
  console.log(`Response:`, response.body);

  const status = gateway.getStatus();
  console.log(`Gateway Status:`, {
    active: status.active,
    routesRegistered: status.routesRegistered,
    totalRequests: status.totalRequests,
  });
}

/**
 * Demo 2: Route Groups
 */
async function demo2_RouteGroups() {
  console.log('\n=== Demo 2: Route Groups ===\n');

  const config: IAPIGatewayConfig = {
    enableLogging: true,
    enableMetrics: true,
    enableCORS: false,
    enableAuth: false,
    enableAuthz: false,
    enableRateLimit: false,
    requestTimeout: 30000,
    maxBodySize: 1024 * 1024,
  };

  const gateway = createAPIGateway(config);

  // Register route group
  const usersGroup: IRouteGroup = {
    groupId: 'users-api',
    basePath: '/api/v1',
    description: 'User management API',
    routes: [
      {
        routeId: 'list-users',
        method: 'GET',
        path: '/users',
        description: 'List all users',
        handler: async () => ({
          status: 200,
          body: { users: [], total: 0 },
        }),
      },
      {
        routeId: 'create-user',
        method: 'POST',
        path: '/users',
        description: 'Create new user',
        handler: async () => ({
          status: 201,
          body: { id: 'new-user-id' },
        }),
      },
      {
        routeId: 'get-user',
        method: 'GET',
        path: '/users/:id',
        description: 'Get user by ID',
        handler: async () => ({
          status: 200,
          body: { id: '1', name: 'User' },
        }),
      },
    ],
  };

  gateway.registerRouteGroup(usersGroup);

  console.log(`Registered route group: ${usersGroup.groupId}`);
  console.log(`Base path: ${usersGroup.basePath}`);

  const allRoutes = gateway.getAllRoutes();
  console.log(`Total routes registered: ${allRoutes.length}`);
  allRoutes.forEach((r) => {
    console.log(`  - ${r.method} ${r.path}`);
  });
}

/**
 * Demo 3: Request and Response Interceptors
 */
async function demo3_Interceptors() {
  console.log('\n=== Demo 3: Request and Response Interceptors ===\n');

  const config: IAPIGatewayConfig = {
    enableLogging: true,
    enableMetrics: true,
    enableCORS: false,
    enableAuth: false,
    enableAuthz: false,
    enableRateLimit: false,
    requestTimeout: 30000,
    maxBodySize: 1024 * 1024,
  };

  const gateway = createAPIGateway(config);
  const logs: string[] = [];

  // Add request interceptor
  gateway.addRequestInterceptor({
    interceptorId: 'request-logger',
    name: 'Request Logger',
    priority: 1,
    handler: async (ctx) => {
      logs.push(`[Request] ${ctx.method} ${ctx.path}`);
      return ctx;
    },
  });

  // Add response interceptor
  gateway.addResponseInterceptor({
    interceptorId: 'response-logger',
    name: 'Response Logger',
    priority: 1,
    handler: async (resp) => {
      logs.push(`[Response] Status: ${resp.status}`);
      return resp;
    },
  });

  gateway.registerRoute({
    routeId: 'test-route',
    method: 'GET',
    path: '/test',
    handler: async () => ({
      status: 200,
      body: { message: 'Success' },
    }),
  });

  const context: IRouteContext = {
    method: 'GET',
    path: '/test',
    query: {},
    params: {},
    headers: {},
    body: null,
    startTime: new Date(),
  };

  await gateway.executeRoute(context);

  console.log('Interceptor logs:');
  logs.forEach((log) => console.log(`  ${log}`));
}

/**
 * Demo 4: Middleware
 */
async function demo4_Middleware() {
  console.log('\n=== Demo 4: Middleware ===\n');

  const config: IAPIGatewayConfig = {
    enableLogging: true,
    enableMetrics: true,
    enableCORS: false,
    enableAuth: false,
    enableAuthz: false,
    enableRateLimit: false,
    requestTimeout: 30000,
    maxBodySize: 1024 * 1024,
  };

  const gateway = createAPIGateway(config);
  const middlewareExecutions: string[] = [];

  // Add custom middleware
  gateway.addMiddleware(async (ctx: IRouteContext): Promise<IMiddlewareResult> => {
    middlewareExecutions.push('Validation Middleware');
    return { allowed: true };
  });

  gateway.addMiddleware(async (ctx: IRouteContext): Promise<IMiddlewareResult> => {
    middlewareExecutions.push('Logging Middleware');
    return { allowed: true };
  });

  gateway.registerRoute({
    routeId: 'protected-route',
    method: 'POST',
    path: '/protected',
    handler: async () => ({
      status: 200,
      body: { result: 'Protected resource accessed' },
    }),
  });

  const context: IRouteContext = {
    method: 'POST',
    path: '/protected',
    query: {},
    params: {},
    headers: { 'content-type': 'application/json' },
    body: { data: 'test' },
    startTime: new Date(),
  };

  await gateway.executeRoute(context);

  console.log('Middleware executions:');
  middlewareExecutions.forEach((m) => console.log(`  ✓ ${m}`));
}

/**
 * Demo 5: Error Handling
 */
async function demo5_ErrorHandling() {
  console.log('\n=== Demo 5: Error Handling ===\n');

  const config: IAPIGatewayConfig = {
    enableLogging: true,
    enableMetrics: true,
    enableCORS: false,
    enableAuth: false,
    enableAuthz: false,
    enableRateLimit: false,
    requestTimeout: 30000,
    maxBodySize: 1024 * 1024,
  };

  const gateway = createAPIGateway(config);

  // Register error handlers
  gateway
    .registerErrorHandler({
      handlerId: 'not-found',
      statusCode: 404,
      handler: async () => ({
        status: 404,
        body: { error: 'Resource not found' },
      }),
    })
    .registerErrorHandler({
      handlerId: 'server-error',
      statusCode: 500,
      handler: async (error) => ({
        status: 500,
        body: { error: 'Internal server error', message: String(error) },
      }),
    });

  // Route that throws error
  gateway.registerRoute({
    routeId: 'error-route',
    method: 'GET',
    path: '/error',
    handler: async () => {
      throw new Error('Something went wrong');
    },
  });

  // Test error handling
  const errorContext: IRouteContext = {
    method: 'GET',
    path: '/error',
    query: {},
    params: {},
    headers: {},
    body: null,
    startTime: new Date(),
  };

  const errorResponse = await gateway.executeRoute(errorContext);
  console.log(`Error route response: ${errorResponse.status}`);
  console.log(`Error body:`, errorResponse.body);

  // Test 404 handling
  const notFoundContext: IRouteContext = {
    method: 'GET',
    path: '/nonexistent',
    query: {},
    params: {},
    headers: {},
    body: null,
    startTime: new Date(),
  };

  const notFoundResponse = await gateway.executeRoute(notFoundContext);
  console.log(`Not found response: ${notFoundResponse.status}`);
  console.log(`Not found body:`, notFoundResponse.body);
}

/**
 * Demo 6: Metrics and Monitoring
 */
async function demo6_Metrics() {
  console.log('\n=== Demo 6: Metrics and Monitoring ===\n');

  const config: IAPIGatewayConfig = {
    enableLogging: true,
    enableMetrics: true,
    enableCORS: false,
    enableAuth: false,
    enableAuthz: false,
    enableRateLimit: false,
    requestTimeout: 30000,
    maxBodySize: 1024 * 1024,
  };

  const gateway = createAPIGateway(config);

  // Register multiple routes
  gateway.registerRoute({
    routeId: 'get-data',
    method: 'GET',
    path: '/data',
    handler: async () => ({
      status: 200,
      body: { data: [] },
    }),
  });

  gateway.registerRoute({
    routeId: 'post-data',
    method: 'POST',
    path: '/data',
    handler: async () => ({
      status: 201,
      body: { id: 'new' },
    }),
  });

  // Execute multiple requests
  for (let i = 0; i < 5; i++) {
    const context: IRouteContext = {
      method: i % 2 === 0 ? 'GET' : 'POST',
      path: '/data',
      query: {},
      params: {},
      headers: {},
      body: i % 2 === 0 ? null : { data: 'test' },
      startTime: new Date(),
    };
    await gateway.executeRoute(context);
  }

  // Get metrics
  const metrics = gateway.getMetrics();
  console.log('Gateway Metrics:');
  console.log(`  Total Requests: ${metrics.totalRequests}`);
  console.log(`  Successful Requests: ${metrics.successfulRequests}`);
  console.log(`  Failed Requests: ${metrics.failedRequests}`);
  console.log(`  Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`);
  console.log(`  Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
  console.log(`  Requests by Method:`, metrics.requestsByMethod);
}

/**
 * Demo 7: Event Listeners
 */
async function demo7_EventListeners() {
  console.log('\n=== Demo 7: Event Listeners ===\n');

  const config: IAPIGatewayConfig = {
    enableLogging: true,
    enableMetrics: true,
    enableCORS: false,
    enableAuth: false,
    enableAuthz: false,
    enableRateLimit: false,
    requestTimeout: 30000,
    maxBodySize: 1024 * 1024,
  };

  const gateway = createAPIGateway(config);
  const events: string[] = [];

  // Add event listener
  gateway.onRouteExecution(async (event) => {
    events.push(`[${event.type}] ${event.timestamp.toISOString()}`);
  });

  gateway.registerRoute({
    routeId: 'test',
    method: 'GET',
    path: '/test',
    handler: async () => ({
      status: 200,
      body: { ok: true },
    }),
  });

  const context: IRouteContext = {
    method: 'GET',
    path: '/test',
    query: {},
    params: {},
    headers: {},
    body: null,
    startTime: new Date(),
  };

  await gateway.executeRoute(context);

  console.log('Events emitted:');
  events.forEach((event) => console.log(`  ${event}`));
}

/**
 * Demo 8: API Versioning
 */
async function demo8_APIVersioning() {
  console.log('\n=== Demo 8: API Versioning ===\n');

  const config: IAPIGatewayConfig = {
    enableLogging: true,
    enableMetrics: true,
    enableCORS: false,
    enableAuth: false,
    enableAuthz: false,
    enableRateLimit: false,
    requestTimeout: 30000,
    maxBodySize: 1024 * 1024,
  };

  const gateway = createAPIGateway(config);

  // Register API versions
  gateway
    .registerAPIVersion({
      version: 'v1',
      released: new Date('2024-01-01'),
      routes: [],
      deprecated: false,
    })
    .registerAPIVersion({
      version: 'v2',
      released: new Date('2024-06-01'),
      routes: [],
      deprecated: false,
    })
    .registerAPIVersion({
      version: 'v1',
      released: new Date('2024-01-01'),
      routes: [],
      deprecated: true,
      deprecationDate: new Date('2025-01-01'),
    });

  const versions = gateway.listAPIVersions();
  console.log('API Versions:');
  versions.forEach((v) => {
    console.log(`  - ${v.version} (Released: ${v.released.toDateString()}, Deprecated: ${v.deprecated})`);
  });
}

/**
 * Demo 9: Endpoint Metadata
 */
async function demo9_EndpointMetadata() {
  console.log('\n=== Demo 9: Endpoint Metadata ===\n');

  const config: IAPIGatewayConfig = {
    enableLogging: true,
    enableMetrics: true,
    enableCORS: false,
    enableAuth: false,
    enableAuthz: false,
    enableRateLimit: false,
    requestTimeout: 30000,
    maxBodySize: 1024 * 1024,
  };

  const gateway = createAPIGateway(config);

  // Register endpoint metadata
  gateway.registerEndpointMetadata({
    operationId: 'getUsers',
    summary: 'Retrieve all users',
    description: 'Get a paginated list of all users in the system',
    tags: ['users', 'management'],
    parameters: [
      { name: 'page', in: 'query', type: 'integer', required: false },
      { name: 'limit', in: 'query', type: 'integer', required: false },
    ],
    responses: {
      200: {
        requestId: '',
        status: 200,
        headers: { 'x-total-count': 'number' },
        body: { users: [] },
        contentType: 'application/json',
        responseTime: 0,
        timestamp: new Date(),
      },
      400: {
        requestId: '',
        status: 400,
        headers: {},
        body: { error: 'Invalid request' },
        contentType: 'application/json',
        responseTime: 0,
        timestamp: new Date(),
      },
    },
  });

  const metadata = gateway.getEndpointMetadata('getUsers');
  console.log('Endpoint Metadata:');
  console.log(`  Operation ID: ${metadata?.operationId}`);
  console.log(`  Summary: ${metadata?.summary}`);
  console.log(`  Tags: ${metadata?.tags.join(', ')}`);
  console.log(`  Parameters: ${metadata?.parameters.map((p) => p.name).join(', ')}`);
}

/**
 * Demo 10: Health Check
 */
async function demo10_HealthCheck() {
  console.log('\n=== Demo 10: Health Check ===\n');

  const config: IAPIGatewayConfig = {
    enableLogging: true,
    enableMetrics: true,
    enableCORS: false,
    enableAuth: false,
    enableAuthz: false,
    enableRateLimit: false,
    requestTimeout: 30000,
    maxBodySize: 1024 * 1024,
  };

  const gateway = createAPIGateway(config);

  // Register some routes
  gateway.registerRoute({
    routeId: 'health',
    method: 'GET',
    path: '/health',
    handler: async () => ({
      status: 200,
      body: { status: 'healthy' },
    }),
  });

  const health = await gateway.performHealthCheck();
  console.log('Health Check Result:');
  console.log(`  Overall Status: ${health.status}`);
  console.log(`  Components:`);
  Object.entries(health.components).forEach(([key, value]) => {
    console.log(`    - ${key}: ${value}`);
  });
  console.log(`  Checks:`);
  health.checks.forEach((check) => {
    console.log(`    - ${check.name}: ${check.status}`);
  });
}

/**
 * Demo 11: Audit Log
 */
async function demo11_AuditLog() {
  console.log('\n=== Demo 11: Audit Log ===\n');

  const config: IAPIGatewayConfig = {
    enableLogging: true,
    enableMetrics: true,
    enableCORS: false,
    enableAuth: false,
    enableAuthz: false,
    enableRateLimit: false,
    requestTimeout: 30000,
    maxBodySize: 1024 * 1024,
  };

  const gateway = createAPIGateway(config);

  gateway.registerRoute({
    routeId: 'api',
    method: 'GET',
    path: '/api/data',
    handler: async () => ({
      status: 200,
      body: { data: [] },
    }),
  });

  // Execute requests
  for (let i = 0; i < 3; i++) {
    const context: IRouteContext = {
      method: 'GET',
      path: '/api/data',
      query: {},
      params: {},
      headers: { 'x-forwarded-for': `192.168.1.${i}` },
      body: null,
      startTime: new Date(),
    };
    await gateway.executeRoute(context);
  }

  // Get audit log
  const auditLog = gateway.getAuditLog(10);
  console.log('Audit Log Entries:');
  auditLog.forEach((entry) => {
    console.log(`  - ${entry.method} ${entry.path} - Status: ${entry.status} - IP: ${entry.ip}`);
  });
}

/**
 * Demo 12: Complete Integration
 */
async function demo12_CompleteIntegration() {
  console.log('\n=== Demo 12: Complete Integration ===\n');

  const config: IAPIGatewayConfig = {
    enableLogging: true,
    enableMetrics: true,
    enableCORS: true,
    corsConfig: {
      enabled: true,
      origins: ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['X-Total-Count'],
      credentials: true,
      maxAge: 3600,
    },
    enableAuth: true,
    authConfig: {
      enabled: true,
      tokenExtractor: (ctx) => ctx.headers.authorization?.split(' ')[1] || null,
      tokenValidator: async (token) => {
        if (token === 'valid-token') {
          return {
            userId: 'user-123',
            roles: ['user'],
            permissions: ['read'],
            isAuthenticated: true,
          };
        }
        return null;
      },
      publicPaths: ['/health', '/version'],
    },
    enableAuthz: true,
    authzConfig: {
      enabled: true,
      roleChecker: async (userId, roles) => roles.includes('user'),
      permissionChecker: async (userId, perms) => perms.includes('read'),
    },
    enableRateLimit: true,
    defaultRateLimit: {
      maxRequests: 100,
      windowMs: 60000,
    },
    requestTimeout: 30000,
    maxBodySize: 1024 * 1024,
  };

  const gateway = createAPIGateway(config);
  const results: string[] = [];

  // Add interceptors
  gateway.addRequestInterceptor({
    interceptorId: 'validation',
    name: 'Request Validation',
    priority: 1,
    handler: async (ctx) => {
      results.push('Request validated');
      return ctx;
    },
  });

  // Register routes
  gateway.registerRoute({
    routeId: 'get-data',
    method: 'GET',
    path: '/api/data',
    handler: async () => ({
      status: 200,
      body: { data: [1, 2, 3] },
    }),
  });

  // Execute request
  const context: IRouteContext = {
    method: 'GET',
    path: '/api/data',
    query: {},
    params: {},
    headers: { authorization: 'Bearer valid-token' },
    body: null,
    startTime: new Date(),
  };

  const response = await gateway.executeRoute(context);

  console.log('Integration Test Result:');
  console.log(`  Response Status: ${response.status}`);
  console.log(`  Response Body:`, response.body);
  console.log(`  Processing Steps:`, results);

  const status = gateway.getStatus();
  console.log(`  Gateway Status:`, {
    active: status.active,
    routesRegistered: status.routesRegistered,
    totalRequests: status.totalRequests,
  });
}

/**
 * Run all demonstrations
 */
async function runAllDemos() {
  try {
    await demo1_BasicRouteRegistration();
    await demo2_RouteGroups();
    await demo3_Interceptors();
    await demo4_Middleware();
    await demo5_ErrorHandling();
    await demo6_Metrics();
    await demo7_EventListeners();
    await demo8_APIVersioning();
    await demo9_EndpointMetadata();
    await demo10_HealthCheck();
    await demo11_AuditLog();
    await demo12_CompleteIntegration();

    console.log('\n=== All demonstrations completed successfully ===\n');
  } catch (error) {
    console.error('Demo execution failed:', error);
  }
}

// Export for testing
export {
  demo1_BasicRouteRegistration,
  demo2_RouteGroups,
  demo3_Interceptors,
  demo4_Middleware,
  demo5_ErrorHandling,
  demo6_Metrics,
  demo7_EventListeners,
  demo8_APIVersioning,
  demo9_EndpointMetadata,
  demo10_HealthCheck,
  demo11_AuditLog,
  demo12_CompleteIntegration,
  runAllDemos,
};
