# API Gateway Service

Enterprise-grade REST API gateway with comprehensive middleware support, authentication, authorization, rate limiting, and observability.

## Overview

The API Gateway Service provides a centralized entry point for managing all HTTP requests with advanced features for routing, middleware execution, request/response interception, and comprehensive metrics collection.

## Key Features

### Route Management
- Register individual routes with specific HTTP methods and paths
- Group routes with common basePath and shared middleware
- Support for all HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- Route-specific metadata and descriptions
- Dynamic path parameters with pattern matching

### Middleware System
- Global middleware executed for all requests
- Route-specific middleware for fine-grained control
- Built-in CORS, authentication, authorization, and rate limiting middleware
- Priority-based middleware execution
- Middleware chain with early termination on rejection

### Request/Response Interception
- Request interceptors for pre-processing
- Response interceptors for post-processing
- Priority-based interceptor ordering
- Full access to route context during interception
- Ability to modify or reject requests and responses

### Authentication & Authorization
- Token-based authentication with configurable extractors
- JWT token validation support
- Role-based access control (RBAC)
- Permission-based access control (PBAC)
- Public paths that bypass authentication
- Integration with external auth services

### Rate Limiting
- Configurable rate limit windows
- Per-user and per-IP rate limiting
- Custom key generators for flexible rate limiting strategies
- Automatic rate limit state reset

### Error Handling
- Status-code-specific error handlers
- Global error handling with type discrimination
- Detailed error responses
- Error audit trail

### Observability & Monitoring
- Real-time metrics collection
- Gateway health checks
- Audit logging of all requests
- Event emission for route execution lifecycle
- Performance statistics (response times, error rates, p95/p99)

### API Versioning
- Register multiple API versions
- Track deprecation status and dates
- Version-specific route management
- Backward compatibility support

### Endpoint Metadata
- OpenAPI/Swagger compatible metadata
- Parameter documentation
- Request/response schema definitions
- Operation tags and descriptions

## Architecture

### Component Structure

```
APIGateway
├── Route Registry
│   ├── Individual routes
│   └── Route groups
├── Middleware Pipeline
│   ├── Global middleware
│   ├── Built-in middleware (CORS, Auth, Authz, RateLimit)
│   └── Route-specific middleware
├── Interceptor Chain
│   ├── Request interceptors
│   └── Response interceptors
├── Error Handling
│   └── Status-specific handlers
├── Rate Limiting
│   └── State management
└── Observability
    ├── Metrics
    ├── Audit log
    └── Event listeners
```

### Request Execution Flow

```
Request Received
    ↓
Find Route
    ↓
Execute Request Interceptors
    ↓
Execute Global Middleware
    ↓
Execute Route Middleware
    ↓
Execute Route Handler
    ↓
Execute Response Interceptors
    ↓
Record Metrics & Audit
    ↓
Emit Events
    ↓
Return Response
```

## API Reference

### Constructor

```typescript
const gateway = new APIGateway(config: IAPIGatewayConfig);
```

**Configuration Options:**
- `enableLogging`: Enable request/response logging
- `enableMetrics`: Enable metrics collection
- `enableCORS`: Enable CORS middleware
- `corsConfig`: CORS configuration
- `enableAuth`: Enable authentication
- `authConfig`: Authentication configuration
- `enableAuthz`: Enable authorization
- `authzConfig`: Authorization configuration
- `enableRateLimit`: Enable rate limiting
- `defaultRateLimit`: Default rate limit config
- `requestTimeout`: Request timeout in ms
- `maxBodySize`: Maximum request body size

### Route Management

#### Register Single Route

```typescript
gateway.registerRoute(route: IRoute): IRouteRegistrationResult

// Example
gateway.registerRoute({
  routeId: 'get-users',
  method: 'GET',
  path: '/api/users',
  handler: async (context) => ({
    status: 200,
    body: { users: [] }
  }),
  requiredRoles: ['admin'],
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000
  }
});
```

#### Register Multiple Routes

```typescript
gateway.registerRoutes(routes: IRoute[]): IBatchRouteRegistrationResult

// Example
gateway.registerRoutes([
  {
    routeId: 'get-users',
    method: 'GET',
    path: '/api/users',
    handler: async () => ({ status: 200, body: {} })
  },
  {
    routeId: 'post-users',
    method: 'POST',
    path: '/api/users',
    handler: async () => ({ status: 201, body: {} })
  }
]);
```

#### Register Route Group

```typescript
gateway.registerRouteGroup(group: IRouteGroup): void

// Example
gateway.registerRouteGroup({
  groupId: 'api-v1',
  basePath: '/api/v1',
  routes: [
    {
      routeId: 'list',
      method: 'GET',
      path: '/users',
      handler: async () => ({ status: 200, body: {} })
    }
  ]
});
```

#### Get Route

```typescript
gateway.getRoute(method: HTTPMethod, path: string): IRoute | null

// Example
const route = gateway.getRoute('GET', '/api/users');
```

#### Get All Routes

```typescript
gateway.getAllRoutes(): IRoute[]

// Example
const allRoutes = gateway.getAllRoutes();
```

### Middleware Management

#### Add Middleware

```typescript
gateway.addMiddleware(handler: MiddlewareHandler): this

// Example
gateway.addMiddleware(async (context) => {
  if (!context.headers['authorization']) {
    return { allowed: false, reason: 'Missing auth header' };
  }
  return { allowed: true };
});
```

### Request/Response Interception

#### Add Request Interceptor

```typescript
gateway.addRequestInterceptor(interceptor: IRequestInterceptor): this

// Example
gateway.addRequestInterceptor({
  interceptorId: 'validator',
  name: 'Request Validator',
  priority: 1,
  handler: async (context) => {
    // Validate request
    return context;
  }
});
```

#### Add Response Interceptor

```typescript
gateway.addResponseInterceptor(interceptor: IResponseInterceptor): this

// Example
gateway.addResponseInterceptor({
  interceptorId: 'cors-headers',
  name: 'CORS Headers',
  priority: 1,
  handler: async (response) => {
    return {
      ...response,
      headers: {
        ...response.headers,
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
});
```

### Error Handling

#### Register Error Handler

```typescript
gateway.registerErrorHandler(handler: IErrorHandler): this

// Example
gateway.registerErrorHandler({
  handlerId: 'not-found',
  statusCode: 404,
  handler: async () => ({
    status: 404,
    body: { error: 'Not Found' }
  })
});
```

### Route Execution

#### Execute Route

```typescript
gateway.executeRoute(context: IRouteContext): Promise<IRouteResponse>

// Example
const response = await gateway.executeRoute({
  method: 'GET',
  path: '/api/users',
  query: { limit: '10' },
  params: {},
  headers: { 'authorization': 'Bearer token' },
  body: null,
  startTime: new Date()
});
```

### Metadata Management

#### Register Endpoint Metadata

```typescript
gateway.registerEndpointMetadata(metadata: IAPIEndpointMetadata): this

// Example
gateway.registerEndpointMetadata({
  operationId: 'getUsers',
  summary: 'Get all users',
  description: 'Retrieve a list of all users',
  tags: ['users'],
  parameters: [
    { name: 'limit', in: 'query', type: 'integer', required: false }
  ],
  responses: {
    200: { /* response schema */ }
  }
});
```

#### Get Endpoint Metadata

```typescript
gateway.getEndpointMetadata(operationId: string): IAPIEndpointMetadata | null
```

### API Versioning

#### Register API Version

```typescript
gateway.registerAPIVersion(version: IAPIVersion): this

// Example
gateway.registerAPIVersion({
  version: 'v1',
  released: new Date('2024-01-01'),
  routes: [],
  deprecated: false
});
```

#### Get API Version

```typescript
gateway.getAPIVersion(version: string): IAPIVersion | null
```

#### List API Versions

```typescript
gateway.listAPIVersions(): IAPIVersion[]
```

### Observability

#### Get Metrics

```typescript
gateway.getMetrics(): IGatewayMetrics

// Returns
{
  totalRequests: 1500,
  successfulRequests: 1480,
  failedRequests: 20,
  totalResponseTime: 45000,
  averageResponseTime: 30,
  requestsByMethod: { GET: 800, POST: 400, ... },
  statusCodeDistribution: { 200: 1200, 404: 20, 500: 5, ... },
  errorRate: 0.0133,
  p95ResponseTime: 125,
  p99ResponseTime: 250
}
```

#### Get Audit Log

```typescript
gateway.getAuditLog(limit: number = 100): IGatewayAuditEntry[]

// Returns
[
  {
    entryId: 'audit_123',
    requestId: 'req_456',
    userId: 'user-123',
    method: 'GET',
    path: '/api/users',
    status: 200,
    responseTime: 45,
    ip: '192.168.1.1',
    timestamp: new Date()
  }
]
```

#### Perform Health Check

```typescript
gateway.performHealthCheck(): Promise<IHealthCheckResult>

// Returns
{
  status: 'healthy',
  timestamp: new Date(),
  components: {
    routes: 'healthy',
    middleware: 'healthy',
    interceptors: 'healthy'
  },
  checks: [
    { name: 'routes_registered', status: 'healthy' },
    { name: 'middleware_loaded', status: 'healthy' }
  ]
}
```

#### Get Gateway Status

```typescript
gateway.getStatus(): {
  active: boolean,
  routesRegistered: number,
  middlewareCount: number,
  totalRequests: number,
  uptime: number
}
```

### Event Listeners

#### Add Event Listener

```typescript
gateway.onRouteExecution(listener: RouteExecutionListener): this

// Example
gateway.onRouteExecution(async (event) => {
  if (event.type === 'error_occurred') {
    console.error('Error:', event.details?.error);
  }
});
```

#### Remove Event Listener

```typescript
gateway.offRouteExecution(listener: RouteExecutionListener): this
```

### Maintenance

#### Clear Routes

```typescript
gateway.clearRoutes(): this
```

#### Clear Metrics

```typescript
gateway.clearMetrics(): this
```

## Usage Examples

### Basic Setup

```typescript
import { createAPIGateway } from '@soc-detection/api-gateway';

const gateway = createAPIGateway({
  enableLogging: true,
  enableMetrics: true,
  enableCORS: true,
  corsConfig: {
    enabled: true,
    origins: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 3600
  },
  enableAuth: true,
  authConfig: {
    enabled: true,
    tokenExtractor: (ctx) => ctx.headers.authorization?.split(' ')[1],
    tokenValidator: async (token) => {
      // Validate JWT token
      const decoded = jwt.verify(token, 'secret');
      return {
        userId: decoded.sub,
        roles: decoded.roles,
        permissions: decoded.permissions,
        isAuthenticated: true
      };
    },
    publicPaths: ['/health', '/version']
  },
  enableAuthz: true,
  authzConfig: {
    enabled: true,
    roleChecker: async (userId, roles) => {
      // Check if user has required roles
      return true;
    },
    permissionChecker: async (userId, permissions) => {
      // Check if user has required permissions
      return true;
    }
  },
  enableRateLimit: true,
  defaultRateLimit: {
    maxRequests: 100,
    windowMs: 60000
  },
  requestTimeout: 30000,
  maxBodySize: 1024 * 1024
});
```

### Register Routes

```typescript
// Single route
gateway.registerRoute({
  routeId: 'get-users',
  method: 'GET',
  path: '/api/users',
  description: 'Get all users',
  handler: async (context) => ({
    status: 200,
    body: { users: await User.find() }
  }),
  requiredRoles: ['admin'],
  rateLimit: {
    maxRequests: 50,
    windowMs: 60000
  }
});

// Route group
gateway.registerRouteGroup({
  groupId: 'users-api',
  basePath: '/api/v1',
  routes: [
    {
      routeId: 'list',
      method: 'GET',
      path: '/users',
      handler: async () => ({
        status: 200,
        body: { users: [] }
      })
    },
    {
      routeId: 'create',
      method: 'POST',
      path: '/users',
      handler: async (context) => ({
        status: 201,
        body: await User.create(context.body)
      })
    }
  ]
});
```

### Add Middleware

```typescript
// Validation middleware
gateway.addMiddleware(async (context) => {
  const contentType = context.headers['content-type'];
  if (context.method !== 'GET' && !contentType?.includes('application/json')) {
    return {
      allowed: false,
      reason: 'Invalid Content-Type'
    };
  }
  return { allowed: true };
});

// Custom context enrichment
gateway.addMiddleware(async (context) => {
  return {
    allowed: true,
    context: {
      startTime: Date.now(),
      requestId: context.headers['x-request-id']
    }
  };
});
```

### Add Interceptors

```typescript
// Request interceptor for validation
gateway.addRequestInterceptor({
  interceptorId: 'schema-validator',
  name: 'JSON Schema Validator',
  priority: 1,
  handler: async (context) => {
    if (context.body && !isValidSchema(context.body)) {
      return null; // Reject request
    }
    return context;
  }
});

// Response interceptor for pagination
gateway.addResponseInterceptor({
  interceptorId: 'pagination',
  name: 'Pagination Handler',
  priority: 1,
  handler: async (response) => {
    return {
      ...response,
      headers: {
        ...response.headers,
        'X-Total-Count': '1000'
      }
    };
  }
});
```

### Event Monitoring

```typescript
gateway.onRouteExecution(async (event) => {
  if (event.type === 'request_received') {
    console.log(`Received: ${event.details?.method} ${event.details?.path}`);
  } else if (event.type === 'error_occurred') {
    console.error(`Error: ${event.details?.error}`);
  }
});
```

### Health and Metrics

```typescript
// Health check
const health = await gateway.performHealthCheck();
console.log(`Gateway Status: ${health.status}`);

// Metrics
const metrics = gateway.getMetrics();
console.log(`Average Response Time: ${metrics.averageResponseTime}ms`);
console.log(`Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%`);

// Audit trail
const auditLog = gateway.getAuditLog(100);
auditLog.forEach(entry => {
  console.log(`${entry.method} ${entry.path} - ${entry.status} (${entry.responseTime}ms)`);
});
```

## Type Definitions

### IRoute

```typescript
interface IRoute {
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
```

### IRouteContext

```typescript
interface IRouteContext {
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
```

### IRouteResponse

```typescript
interface IRouteResponse {
  status: number;
  headers?: Record<string, string>;
  body: unknown;
  contentType?: string;
}
```

### IGatewayMetrics

```typescript
interface IGatewayMetrics {
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
```

## Best Practices

1. **Route Organization**: Group related routes using route groups for consistent basePath and shared middleware
2. **Middleware Ordering**: Order middleware by priority (authentication before authorization)
3. **Error Handling**: Register specific error handlers for common status codes (404, 500, etc.)
4. **Rate Limiting**: Configure rate limits per-route for different service levels
5. **Monitoring**: Regularly collect metrics and audit logs for performance analysis
6. **Versioning**: Use API versioning for backward compatibility
7. **Security**: Always validate requests in interceptors before handler execution
8. **Performance**: Use response interceptors to optimize response payloads

## Testing

The service includes comprehensive unit tests covering:
- Route registration and retrieval
- Middleware execution and ordering
- Request/response interception
- Authentication and authorization
- Rate limiting
- Error handling
- Metrics collection
- Event emission
- Health checks
- Integration scenarios

Run tests with:
```bash
npm run test:unit -- api-gateway.test.ts
```

## Performance Characteristics

- **Route Lookup**: O(1) using map-based storage
- **Middleware Execution**: O(n) where n = number of middleware
- **Interceptor Execution**: O(n log n) with priority-based sorting
- **Metrics Collection**: O(1) for updates, O(log n) for response time calculations
- **Audit Log Size**: Limited to 10,000 entries (5,000 kept after rotation)

## Related Services

- **Access Control Service**: Authorization layer
- **Policy Engine**: Policy-based access control
- **Permission Service**: Permission management
- **Auth Service**: Authentication and token management

## Contributing

When adding new features:
1. Update type definitions in `types.ts`
2. Implement feature in `main.ts`
3. Export from `index.ts`
4. Add comprehensive tests
5. Update documentation
6. Ensure 100% TypeScript strict compliance

## License

Enterprise Grade - All Rights Reserved
