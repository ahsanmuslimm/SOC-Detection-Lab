# Phase 1, Week 3: REST API Layer - IN PROGRESS 🚀

## What's Being Created

The REST API foundation connecting the Service Orchestrator (Week 1) and Database Layer (Week 2) to create a 50+ endpoint API for the SOC Detection Lab platform.

---

## Files Created (5 files so far, 1,800+ lines)

### 1. `src/backend/api/types.ts` (350 lines)

**Purpose**: Complete type definitions for REST API

**Contains**:
- `IAuthenticatedRequest` - Request with user context
- `IApiResponse<T>` - Generic success response
- `IPaginatedResponse<T>` - Paginated list response
- `IQueryParams` - Query parameter types
- Request types for 8 resources (Alerts, Cases, Rules, Users, etc.)
- Response types for 8 resources
- Error response types
- HTTP status constants
- API error code constants
- Constants for API base paths and version

**Key Interfaces**:
```typescript
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: { timestamp: string; version: string };
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
}
```

### 2. `src/backend/api/gateway.ts` (480 lines)

**Purpose**: Express application setup and route management

**Contains**:
- `ApiGateway` class implementing `IApiGateway`
- Security middleware setup (helmet, CORS, rate limiting)
- Request context middleware (tracing, logging)
- Route definitions (health check, status, version, docs)
- Error handling
- Graceful shutdown
- Singleton pattern

**Key Endpoints**:
```
GET  /api/v1/health       - Health check
GET  /api/v1/status       - Status (no auth)
GET  /api/v1/version      - Version info
GET  /api/docs            - API documentation
```

**Features**:
- HELMET security headers
- CORS with configurable origin
- Rate limiting (100 requests/15min)
- Request context with trace ID
- Comprehensive logging
- Service orchestrator initialization
- Graceful shutdown on SIGTERM/SIGINT

### 3. `src/backend/api/middleware.ts` (600+ lines)

**Purpose**: Authentication, authorization, validation, and logging middleware

**Middleware Functions**:

1. **authMiddleware** - JWT token verification
2. **authorizationMiddleware** - Permission checking
3. **validateRequest** - Request body validation (Joi schema)
4. **validateQueryParams** - Query parameter validation
5. **auditMiddleware** - Audit logging
6. **timingMiddleware** - Request timing metrics
7. **sanitizeMiddleware** - Input sanitization
8. **errorResponseMiddleware** - Consistent error formatting
9. **corsPreflightMiddleware** - CORS preflight handling
10. **securityHeadersMiddleware** - Security headers
11. **asyncHandler** - Async error wrapper
12. **optionalAuthMiddleware** - Optional authentication
13. **rateLimitPerUser** - Per-user rate limiting

**Features**:
- JWT token validation with expiry checking
- Role-based access control (RBAC)
- Request validation with detailed errors
- SQL injection prevention (input sanitization)
- XSS prevention
- Audit trail logging
- Performance metrics
- Error tracking
- Security headers (CSP, X-Frame-Options, etc.)

### 4. `src/backend/api/controllers/BaseController.ts` (180 lines)

**Purpose**: Abstract base class for all controllers

**Contains**:
- `BaseController` abstract class
- Common response methods (`success`, `created`, `paginated`, `error`)
- Error response helpers (`notFound`, `validationError`, `conflict`, `unauthorized`, `forbidden`)
- Parameter extraction helpers
- `getPaginationParams()` - Handles page, pageSize, limit, offset
- `getFilterParams()` - Extracts filter criteria
- `getSortParams()` - Handles sorting
- `getUserId()` - Safely gets authenticated user ID
- Logging methods

**Benefits**:
- DRY code (Don't Repeat Yourself)
- Consistent response formatting
- Uniform error handling
- Common utility methods

### 5. `src/backend/api/controllers/AlertController.ts` (350 lines)

**Purpose**: REST API endpoints for alert management

**Endpoints**:

1. **GET /api/v1/alerts** - List alerts
   - Query: page, pageSize, status, severity, assignedTo, sortBy, search
   - Returns: Paginated alert list
   - Permissions: alert:read

2. **POST /api/v1/alerts** - Create new alert
   - Body: title, description, severity, alertType, sourceSystem, detectionIds
   - Returns: Created alert with ID
   - Permissions: alert:create

3. **GET /api/v1/alerts/:id** - Get alert details
   - Returns: Complete alert info
   - Permissions: alert:read

4. **PUT /api/v1/alerts/:id** - Update alert
   - Body: title, description, status, assignedToId
   - Returns: Updated alert
   - Permissions: alert:edit

5. **DELETE /api/v1/alerts/:id** - Delete alert
   - Returns: 204 No Content
   - Permissions: alert:delete

6. **POST /api/v1/alerts/:id/acknowledge** - Acknowledge alert
   - Body: comment
   - Returns: Updated alert
   - Permissions: alert:acknowledge

7. **POST /api/v1/alerts/:id/assign** - Assign alert to user
   - Body: assignToUserId
   - Returns: Updated alert
   - Permissions: alert:assign

8. **GET /api/v1/alerts/stats/summary** - Alert statistics
   - Returns: Stats by severity, status
   - Permissions: alert:read

9. **POST /api/v1/alerts/bulk-update** - Bulk update alerts
   - Body: alertIds, status, severity
   - Returns: { updated: number, total: number }
   - Permissions: alert:edit

**Features**:
- Comprehensive error handling
- Input validation
- Audit logging
- Pagination support
- Filtering and sorting
- Bulk operations
- Service orchestrator integration

---

## Architecture

### API Request Flow

```
HTTP Request
    ↓
API Gateway (Express app)
    ↓
Security Middleware (CORS, Helmet, Rate Limit)
    ↓
Request Context (Trace ID, User Info)
    ↓
Authentication Middleware (JWT)
    ↓
Authorization Middleware (RBAC)
    ↓
Input Validation (Joi schema)
    ↓
Controller Method
    ↓
Service Orchestrator
    ↓
Service Layer (Alert Service, Case Service, etc.)
    ↓
Database Client
    ↓
PostgreSQL
    ↓
Response (JSON)
    ↓
Audit Middleware (Log to audit_logs)
    ↓
HTTP Response
```

### Middleware Stack

```
express.json()
    ↓
Helmet (security headers)
    ↓
CORS (cross-origin)
    ↓
Rate Limit (global)
    ↓
Request Context (trace ID)
    ↓
Request Logging
    ↓
Route Handler
    ↓
Error Handler
```

---

## Planned Controllers (8 total)

| Controller | Endpoints | Methods |
|-----------|-----------|---------|
| AlertController | /alerts | 9 |
| CaseController | /cases | 8 |
| DetectionController | /rules | 7 |
| InvestigationController | /investigations | 6 |
| UserController | /users | 6 |
| ReportController | /reports | 5 |
| AuthController | /auth | 4 |
| RBACController | /rbac | 5 |

**Total**: 50+ endpoints

---

## Complete 50+ Endpoints Plan

### Alerts (9 endpoints)
```
GET    /api/v1/alerts                        - List all
POST   /api/v1/alerts                        - Create
GET    /api/v1/alerts/:id                    - Get details
PUT    /api/v1/alerts/:id                    - Update
DELETE /api/v1/alerts/:id                    - Delete
POST   /api/v1/alerts/:id/acknowledge        - Acknowledge
POST   /api/v1/alerts/:id/assign             - Assign to user
GET    /api/v1/alerts/stats/summary          - Statistics
POST   /api/v1/alerts/bulk-update            - Bulk update
```

### Cases (8 endpoints)
```
GET    /api/v1/cases                         - List all
POST   /api/v1/cases                         - Create
GET    /api/v1/cases/:id                     - Get details
PUT    /api/v1/cases/:id                     - Update
DELETE /api/v1/cases/:id                     - Delete
POST   /api/v1/cases/:id/assign              - Assign to user
GET    /api/v1/cases/:id/investigations      - Get investigations
GET    /api/v1/cases/stats/summary           - Statistics
```

### Detection Rules (7 endpoints)
```
GET    /api/v1/rules                         - List all
POST   /api/v1/rules                         - Create
GET    /api/v1/rules/:id                     - Get details
PUT    /api/v1/rules/:id                     - Update
DELETE /api/v1/rules/:id                     - Delete
POST   /api/v1/rules/:id/test                - Test rule
POST   /api/v1/rules/:id/deploy              - Deploy rule
```

### Investigations (6 endpoints)
```
GET    /api/v1/investigations                - List all
POST   /api/v1/investigations                - Create
GET    /api/v1/investigations/:id            - Get details
PUT    /api/v1/investigations/:id            - Update
GET    /api/v1/investigations/:id/timeline   - Get timeline
POST   /api/v1/investigations/:id/close      - Close investigation
```

### Users (6 endpoints)
```
GET    /api/v1/users                         - List all
POST   /api/v1/users                         - Create
GET    /api/v1/users/:id                     - Get details
PUT    /api/v1/users/:id                     - Update
DELETE /api/v1/users/:id                     - Delete
GET    /api/v1/users/me/profile              - Get current user
```

### Reports (5 endpoints)
```
GET    /api/v1/reports                       - List all
POST   /api/v1/reports                       - Create
GET    /api/v1/reports/:id                   - Get details
PUT    /api/v1/reports/:id                   - Update
DELETE /api/v1/reports/:id                   - Delete
```

### Authentication (4 endpoints)
```
POST   /api/v1/auth/login                    - Login
POST   /api/v1/auth/logout                   - Logout
POST   /api/v1/auth/refresh                  - Refresh token
POST   /api/v1/auth/register                 - Register (admin only)
```

### RBAC (5 endpoints)
```
GET    /api/v1/rbac/roles                    - List roles
GET    /api/v1/rbac/roles/:id                - Get role
PUT    /api/v1/rbac/roles/:id                - Update role permissions
GET    /api/v1/rbac/permissions              - List all permissions
GET    /api/v1/rbac/user/:userId/permissions - Get user permissions
```

---

## Quality Standards

All Week 3 code will follow:

✅ **TypeScript Strict Mode** - 100% compliant
✅ **No `any` types** - Full type safety
✅ **Comprehensive Testing** - 50+ integration tests (planned)
✅ **Error Handling** - Consistent error formatting
✅ **Logging** - Request/response/audit trails
✅ **Security** - JWT auth, RBAC, input validation, rate limiting
✅ **Documentation** - JSDoc comments, README
✅ **Performance** - <100ms response targets
✅ **Pagination** - 25 items default, max 100
✅ **Filtering** - By status, severity, date ranges, etc.
✅ **Sorting** - By created_at, updated_at, custom fields
✅ **Bulk Operations** - Support for batch updates/deletes
✅ **Audit Trail** - All operations logged

---

## Integration Points

### Service Orchestrator Integration
Each controller calls through orchestrator:

```typescript
// Alert Controller
this.orchestrator.alertService.createAlert(data)
this.orchestrator.alertService.updateAlert(id, data)
this.orchestrator.alertService.listAlerts(filters)

// Case Controller
this.orchestrator.caseService.createCase(data)
this.orchestrator.caseService.getCase(id)

// Audit
this.orchestrator.auditService.log({...})
```

### Database Client Integration (Week 2)
Services use database client:

```typescript
// AlertService uses Database Client
const db = getDatabase();
await db.query('SELECT * FROM alerts WHERE id = $1', [id]);
await db.transaction(async (client) => {
  // Multi-table operations
});
```

---

## Response Format Examples

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "alert-123",
    "title": "SSH Brute Force",
    "severity": "high",
    "status": "open"
  },
  "meta": {
    "timestamp": "2024-01-15T14:23:45Z",
    "version": "1.0.0"
  }
}
```

### Paginated Response
```json
{
  "items": [
    { "id": "alert-1", "title": "Alert 1" },
    { "id": "alert-2", "title": "Alert 2" }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 100,
    "totalPages": 4,
    "hasMore": true
  },
  "meta": {
    "timestamp": "2024-01-15T14:23:45Z",
    "version": "1.0.0"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "title", "message": "Required" }
    ],
    "timestamp": "2024-01-15T14:23:45Z"
  }
}
```

---

## Performance Targets

| Operation | Target | Status |
|-----------|--------|--------|
| GET list (25 items) | <50ms | 🎯 |
| GET by ID | <20ms | 🎯 |
| POST create | <100ms | 🎯 |
| PUT update | <100ms | 🎯 |
| DELETE | <50ms | 🎯 |
| Bulk update (100 items) | <500ms | 🎯 |
| Health check | <1s | 🎯 |

---

## Testing Strategy

### Unit Tests (API layer)
- Controller method mocking
- Error handling
- Parameter extraction
- Response formatting

### Integration Tests (API + Service + Database)
- End-to-end workflows
- Cross-service interactions
- Database operations
- Error scenarios

### Load Tests (planned Week 4)
- Concurrent requests
- Throughput
- Memory usage
- Connection pooling

---

## Files Still to Create

### Controllers (7 remaining)
1. CaseController (8 endpoints)
2. DetectionRuleController (7 endpoints)
3. InvestigationController (6 endpoints)
4. UserController (6 endpoints)
5. ReportController (5 endpoints)
6. AuthController (4 endpoints)
7. RBACController (5 endpoints)

### Route Files (8)
1. alertRoutes.ts
2. caseRoutes.ts
3. detectionRoutes.ts
4. investigationRoutes.ts
5. userRoutes.ts
6. reportRoutes.ts
7. authRoutes.ts
8. rbacRoutes.ts

### Index Files
1. src/backend/api/index.ts (exports)
2. src/backend/api/controllers/index.ts (controller exports)

### Tests
1. src/backend/api/__tests__/integration/alert-api.test.ts
2. src/backend/api/__tests__/integration/case-api.test.ts
3. ... (7 more integration test files)

### Documentation
1. API_REFERENCE.md (detailed endpoint documentation)
2. AUTHENTICATION_GUIDE.md (JWT, token refresh, role setup)
3. ERROR_CODES.md (all error codes and meanings)
4. RATE_LIMITING.md (rate limit policies)
5. EXAMPLES.md (cURL examples, code samples)

---

## Next Steps

### Immediate (This Session)
1. ✅ Create API types and constants
2. ✅ Create API gateway
3. ✅ Create middleware (auth, validation, logging)
4. ✅ Create base controller class
5. ✅ Create alert controller (example)
6. ⏳ Create remaining 7 controllers
7. ⏳ Create route files
8. ⏳ Create integration tests

### Week 3 Completion
- 50+ endpoints fully functional
- 8 controllers implemented
- Complete middleware stack
- Request/response validation
- Audit logging
- Error handling
- 50+ integration tests
- Full API documentation

---

## Key Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Endpoints | 50+ | 9 done, 41 planned |
| Controllers | 8 | 1 done, 7 planned |
| Middleware | 13 | ✅ Done |
| Type definitions | 25+ | ✅ Done |
| Response formats | 5+ | ✅ Done |
| Test coverage | 80%+ | 📋 Planned |
| Documentation | Comprehensive | 📋 Planned |

---

## Integration Status

✅ **Week 1 (Service Orchestrator)**: Complete - Uses orchestrator for all service calls
✅ **Week 2 (Database Layer)**: Complete - Services use database client
🚀 **Week 3 (REST API)**: In Progress - Controllers → Services → Database
📋 **Week 4 (Integration Testing)**: Planned - End-to-end testing

---

## Current Progress

**5 files created** (1,800+ lines):
- ✅ types.ts (350 lines)
- ✅ gateway.ts (480 lines)
- ✅ middleware.ts (600+ lines)
- ✅ BaseController.ts (180 lines)
- ✅ AlertController.ts (350 lines)

**Estimated Completion**: 70% of Week 3 foundation
**Remaining**: 7 controllers + routes + tests + documentation

---

## Status: 🚀 IN PROGRESS

Week 3 REST API layer is being built systematically. Core infrastructure is complete. Ready to scale to all 50+ endpoints.

