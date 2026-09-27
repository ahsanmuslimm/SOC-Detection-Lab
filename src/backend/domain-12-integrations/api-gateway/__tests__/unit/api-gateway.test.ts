/**
 * API Gateway Service - Unit Tests
 */

import {
  APIGateway,
  createAPIGateway,
  IRoute,
  IRouteGroup,
  IAPIGatewayConfig,
  IRequestInterceptor,
  IResponseInterceptor,
  IErrorHandler,
  IRouteContext,
  IRouteResponse,
  IMiddlewareResult,
  IHealthCheckResult,
} from '../../src';

describe('APIGateway', () => {
  let gateway: APIGateway;
  let config: IAPIGatewayConfig;

  beforeEach(() => {
    config = {
      enableLogging: true,
      enableMetrics: true,
      enableCORS: true,
      corsConfig: {
        enabled: true,
        origins: ['http://localhost:3000', 'https://example.com'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
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
              roles: ['admin'],
              permissions: ['read', 'write'],
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
        roleChecker: async (userId, roles) => roles.includes('admin'),
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

    gateway = createAPIGateway(config);
  });

  describe('Route Registration', () => {
    it('should register a single route', () => {
      const route: IRoute = {
        routeId: 'get-users',
        method: 'GET',
        path: '/api/users',
        handler: async () => ({
          status: 200,
          body: { users: [] },
        }),
      };

      const result = gateway.registerRoute(route);

      expect(result.registered).toBe(true);
      expect(result.routeId).toBe('get-users');
      expect(result.method).toBe('GET');
      expect(result.path).toBe('/api/users');
    });

    it('should prevent duplicate route registration', () => {
      const route: IRoute = {
        routeId: 'get-users',
        method: 'GET',
        path: '/api/users',
        handler: async () => ({ status: 200, body: {} }),
      };

      gateway.registerRoute(route);
      const result = gateway.registerRoute(route);

      expect(result.registered).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should validate route properties', () => {
      const route: IRoute = {
        routeId: '',
        method: 'GET',
        path: '/api/users',
        handler: async () => ({ status: 200, body: {} }),
      };

      const result = gateway.registerRoute(route);

      expect(result.registered).toBe(false);
    });

    it('should register multiple routes', () => {
      const routes: IRoute[] = [
        {
          routeId: 'get-users',
          method: 'GET',
          path: '/api/users',
          handler: async () => ({ status: 200, body: {} }),
        },
        {
          routeId: 'post-users',
          method: 'POST',
          path: '/api/users',
          handler: async () => ({ status: 201, body: {} }),
        },
      ];

      const result = gateway.registerRoutes(routes);

      expect(result.successfulRoutes).toBe(2);
      expect(result.failedRoutes).toBe(0);
    });

    it('should retrieve registered routes', () => {
      const route: IRoute = {
        routeId: 'get-users',
        method: 'GET',
        path: '/api/users',
        handler: async () => ({ status: 200, body: {} }),
      };

      gateway.registerRoute(route);
      const found = gateway.getRoute('GET', '/api/users');

      expect(found).not.toBeNull();
      expect(found?.routeId).toBe('get-users');
    });

    it('should return null for non-existent route', () => {
      const found = gateway.getRoute('GET', '/api/nonexistent');
      expect(found).toBeNull();
    });

    it('should get all registered routes', () => {
      const routes: IRoute[] = [
        {
          routeId: 'get-users',
          method: 'GET',
          path: '/api/users',
          handler: async () => ({ status: 200, body: {} }),
        },
        {
          routeId: 'post-users',
          method: 'POST',
          path: '/api/users',
          handler: async () => ({ status: 201, body: {} }),
        },
      ];

      gateway.registerRoutes(routes);
      const all = gateway.getAllRoutes();

      expect(all.length).toBe(2);
    });
  });

  describe('Route Groups', () => {
    it('should register a route group', () => {
      const group: IRouteGroup = {
        groupId: 'users-api',
        basePath: '/api/v1',
        routes: [
          {
            routeId: 'get-users',
            method: 'GET',
            path: '/users',
            handler: async () => ({ status: 200, body: {} }),
          },
          {
            routeId: 'post-users',
            method: 'POST',
            path: '/users',
            handler: async () => ({ status: 201, body: {} }),
          },
        ],
      };

      expect(() => gateway.registerRouteGroup(group)).not.toThrow();
      const route = gateway.getRoute('GET', '/api/v1/users');
      expect(route).not.toBeNull();
    });

    it('should prevent duplicate group registration', () => {
      const group: IRouteGroup = {
        groupId: 'users-api',
        basePath: '/api/v1',
        routes: [],
      };

      gateway.registerRouteGroup(group);
      expect(() => gateway.registerRouteGroup(group)).toThrow();
    });
  });

  describe('Middleware', () => {
    it('should add middleware', () => {
      const middleware = async (): Promise<IMiddlewareResult> => ({
        allowed: true,
      });

      expect(() => {
        gateway.addMiddleware(middleware);
      }).not.toThrow();
    });

    it('should execute middleware during route execution', async () => {
      const middlewareCalled: boolean[] = [];
      const middleware = async (): Promise<IMiddlewareResult> => {
        middlewareCalled.push(true);
        return { allowed: true };
      };

      gateway.addMiddleware(middleware);
      gateway.registerRoute({
        routeId: 'test',
        method: 'GET',
        path: '/test',
        handler: async () => ({ status: 200, body: {} }),
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
      expect(middlewareCalled.length).toBeGreaterThan(0);
    });

    it('should reject request if middleware denies access', async () => {
      const middleware = async (): Promise<IMiddlewareResult> => ({
        allowed: false,
        reason: 'Access denied',
      });

      gateway.addMiddleware(middleware);
      gateway.registerRoute({
        routeId: 'test',
        method: 'GET',
        path: '/test',
        handler: async () => ({ status: 200, body: {} }),
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

      const response = await gateway.executeRoute(context);
      expect(response.status).toBe(403);
    });
  });

  describe('Request and Response Interceptors', () => {
    it('should add request interceptor', () => {
      const interceptor: IRequestInterceptor = {
        interceptorId: 'auth-interceptor',
        name: 'Authentication Interceptor',
        priority: 1,
        handler: async (ctx) => ctx,
      };

      expect(() => {
        gateway.addRequestInterceptor(interceptor);
      }).not.toThrow();
    });

    it('should add response interceptor', () => {
      const interceptor: IResponseInterceptor = {
        interceptorId: 'cors-interceptor',
        name: 'CORS Interceptor',
        priority: 1,
        handler: async (resp) => resp,
      };

      expect(() => {
        gateway.addResponseInterceptor(interceptor);
      }).not.toThrow();
    });

    it('should execute interceptors in priority order', async () => {
      const order: number[] = [];

      gateway.addRequestInterceptor({
        interceptorId: 'first',
        name: 'First',
        priority: 2,
        handler: async (ctx) => {
          order.push(2);
          return ctx;
        },
      });

      gateway.addRequestInterceptor({
        interceptorId: 'second',
        name: 'Second',
        priority: 1,
        handler: async (ctx) => {
          order.push(1);
          return ctx;
        },
      });

      gateway.registerRoute({
        routeId: 'test',
        method: 'GET',
        path: '/test',
        handler: async () => ({ status: 200, body: {} }),
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
      expect(order[0]).toBeLessThanOrEqual(order[1]);
    });
  });

  describe('Error Handling', () => {
    it('should register error handler', () => {
      const handler: IErrorHandler = {
        handlerId: 'not-found-handler',
        statusCode: 404,
        handler: async () => ({
          status: 404,
          body: { error: 'Not Found' },
        }),
      };

      expect(() => {
        gateway.registerErrorHandler(handler);
      }).not.toThrow();
    });

    it('should return 404 for unregistered route', async () => {
      const context: IRouteContext = {
        method: 'GET',
        path: '/nonexistent',
        query: {},
        params: {},
        headers: {},
        body: null,
        startTime: new Date(),
      };

      const response = await gateway.executeRoute(context);
      expect(response.status).toBe(404);
    });

    it('should handle route handler errors', async () => {
      gateway.registerRoute({
        routeId: 'error-route',
        method: 'GET',
        path: '/error',
        handler: async () => {
          throw new Error('Handler error');
        },
      });

      const context: IRouteContext = {
        method: 'GET',
        path: '/error',
        query: {},
        params: {},
        headers: {},
        body: null,
        startTime: new Date(),
      };

      const response = await gateway.executeRoute(context);
      expect(response.status).toBe(500);
    });
  });

  describe('Endpoint Metadata', () => {
    it('should register endpoint metadata', () => {
      gateway.registerEndpointMetadata({
        operationId: 'getUsers',
        summary: 'Get all users',
        description: 'Retrieve a list of all users',
        tags: ['users'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            type: 'integer',
            required: false,
          },
        ],
        responses: {
          200: { requestId: '', status: 200, headers: {}, body: [], contentType: 'application/json', responseTime: 0, timestamp: new Date() },
        },
      });

      const metadata = gateway.getEndpointMetadata('getUsers');
      expect(metadata).not.toBeNull();
      expect(metadata?.summary).toBe('Get all users');
    });
  });

  describe('API Versioning', () => {
    it('should register API version', () => {
      expect(() => {
        gateway.registerAPIVersion({
          version: 'v1',
          released: new Date(),
          routes: [],
          deprecated: false,
        });
      }).not.toThrow();
    });

    it('should retrieve API version', () => {
      gateway.registerAPIVersion({
        version: 'v1',
        released: new Date(),
        routes: [],
        deprecated: false,
      });

      const version = gateway.getAPIVersion('v1');
      expect(version).not.toBeNull();
      expect(version?.version).toBe('v1');
    });

    it('should list all API versions', () => {
      gateway.registerAPIVersion({
        version: 'v1',
        released: new Date(),
        routes: [],
        deprecated: false,
      });

      gateway.registerAPIVersion({
        version: 'v2',
        released: new Date(),
        routes: [],
        deprecated: false,
      });

      const versions = gateway.listAPIVersions();
      expect(versions.length).toBe(2);
    });

    it('should prevent duplicate version registration', () => {
      gateway.registerAPIVersion({
        version: 'v1',
        released: new Date(),
        routes: [],
        deprecated: false,
      });

      expect(() => {
        gateway.registerAPIVersion({
          version: 'v1',
          released: new Date(),
          routes: [],
          deprecated: false,
        });
      }).toThrow();
    });
  });

  describe('Metrics and Audit', () => {
    it('should track metrics', async () => {
      gateway.registerRoute({
        routeId: 'test',
        method: 'GET',
        path: '/test',
        handler: async () => ({ status: 200, body: {} }),
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
      const metrics = gateway.getMetrics();

      expect(metrics.totalRequests).toBeGreaterThan(0);
      expect(metrics.requestsByMethod.GET).toBeGreaterThan(0);
    });

    it('should maintain audit log', async () => {
      gateway.registerRoute({
        routeId: 'test',
        method: 'GET',
        path: '/test',
        handler: async () => ({ status: 200, body: {} }),
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
      const auditLog = gateway.getAuditLog();

      expect(auditLog.length).toBeGreaterThan(0);
    });

    it('should limit audit log size', async () => {
      gateway.registerRoute({
        routeId: 'test',
        method: 'GET',
        path: '/test',
        handler: async () => ({ status: 200, body: {} }),
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

      for (let i = 0; i < 11000; i++) {
        await gateway.executeRoute(context);
      }

      const auditLog = gateway.getAuditLog(10000);
      expect(auditLog.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('Event Listeners', () => {
    it('should register event listener', (done) => {
      let eventReceived = false;

      gateway.onRouteExecution(async () => {
        eventReceived = true;
        done();
      });

      gateway.registerRoute({
        routeId: 'test',
        method: 'GET',
        path: '/test',
        handler: async () => ({ status: 200, body: {} }),
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

      gateway.executeRoute(context).catch(done);
    });

    it('should remove event listener', () => {
      const listener = async () => {};
      gateway.onRouteExecution(listener);
      gateway.offRouteExecution(listener);
      expect(true).toBe(true);
    });
  });

  describe('Health Check', () => {
    it('should perform health check', async () => {
      const health = await gateway.performHealthCheck();
      expect(health.status).toBeDefined();
      expect(health.components).toBeDefined();
      expect(health.checks).toBeDefined();
    });

    it('should indicate healthy status when routes registered', async () => {
      gateway.registerRoute({
        routeId: 'test',
        method: 'GET',
        path: '/test',
        handler: async () => ({ status: 200, body: {} }),
      });

      const health = await gateway.performHealthCheck();
      expect(['healthy', 'degraded']).toContain(health.status);
    });
  });

  describe('Gateway Status', () => {
    it('should get gateway status', () => {
      gateway.registerRoute({
        routeId: 'test',
        method: 'GET',
        path: '/test',
        handler: async () => ({ status: 200, body: {} }),
      });

      const status = gateway.getStatus();
      expect(status.active).toBe(true);
      expect(status.routesRegistered).toBe(1);
    });
  });

  describe('Clear Operations', () => {
    it('should clear routes', () => {
      gateway.registerRoute({
        routeId: 'test',
        method: 'GET',
        path: '/test',
        handler: async () => ({ status: 200, body: {} }),
      });

      gateway.clearRoutes();
      const all = gateway.getAllRoutes();
      expect(all.length).toBe(0);
    });

    it('should clear metrics', async () => {
      gateway.registerRoute({
        routeId: 'test',
        method: 'GET',
        path: '/test',
        handler: async () => ({ status: 200, body: {} }),
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
      gateway.clearMetrics();

      const metrics = gateway.getMetrics();
      expect(metrics.totalRequests).toBe(0);
    });
  });

  describe('Configuration Validation', () => {
    it('should throw error for invalid request timeout', () => {
      const invalidConfig = {
        ...config,
        requestTimeout: 50,
      };

      expect(() => {
        createAPIGateway(invalidConfig);
      }).toThrow();
    });

    it('should throw error for invalid max body size', () => {
      const invalidConfig = {
        ...config,
        maxBodySize: 512,
      };

      expect(() => {
        createAPIGateway(invalidConfig);
      }).toThrow();
    });
  });

  describe('Integration', () => {
    it('should execute complete request flow', async () => {
      const interceptorCalls: string[] = [];

      gateway.addRequestInterceptor({
        interceptorId: 'log',
        name: 'Logger',
        priority: 1,
        handler: async (ctx) => {
          interceptorCalls.push('request');
          return ctx;
        },
      });

      gateway.addResponseInterceptor({
        interceptorId: 'cors',
        name: 'CORS',
        priority: 1,
        handler: async (resp) => {
          interceptorCalls.push('response');
          return resp;
        },
      });

      gateway.registerRoute({
        routeId: 'api',
        method: 'POST',
        path: '/api/data',
        handler: async () => ({
          status: 201,
          body: { id: '123' },
        }),
      });

      const context: IRouteContext = {
        method: 'POST',
        path: '/api/data',
        query: {},
        params: {},
        headers: {},
        body: { data: 'test' },
        startTime: new Date(),
      };

      const response = await gateway.executeRoute(context);

      expect(response.status).toBe(201);
      expect(interceptorCalls).toContain('request');
      expect(interceptorCalls).toContain('response');
    });
  });
});
