# SOC Detection Lab - Professional Build Guidelines
## Standards & Best Practices for All Modules

---

## 1. CODE QUALITY STANDARDS

### 1.1 Language & Typing

**Backend**: TypeScript (strict mode)
```typescript
// ✅ GOOD: Full typing, strict null checks
interface AlertService {
  getAlert(id: string): Promise<Alert | null>;
  createAlert(data: AlertInput): Promise<Alert>;
}

// ❌ BAD: Any types, no null safety
function getAlert(id): Promise<any> {
  return alertsDB.find(id);
}
```

**Frontend**: TypeScript (strict mode) + React/Vue with full prop typing

**Rules**:
- ✓ No `any` types (use `unknown` if necessary, with type guard)
- ✓ Enable `strict` mode in tsconfig.json
- ✓ All function parameters typed
- ✓ All function return types explicit
- ✓ All component props typed
- ✓ Null/undefined safety enforced

### 1.2 Linting & Formatting

**All Projects**:
- ESLint with @typescript-eslint plugin
- Prettier for code formatting
- StyleLint for CSS/SCSS (frontend)

**Configuration files**:
```
.eslintrc.json
.prettierrc
.stylelintrc (frontend)
```

**Pre-commit hooks** (husky):
```
husky/pre-commit: Run lint + format check
husky/commit-msg: Validate commit message format
```

**Enforce in CI/CD**:
```yaml
# GitHub Actions example
- name: Lint
  run: npm run lint --fix

- name: Format check
  run: npm run format:check
```

### 1.3 Code Organization

**Module Structure**:
```
module-name/
├── src/
│   ├── types.ts              # Type definitions only
│   ├── service.ts            # Business logic
│   ├── repository.ts         # Data access (optional)
│   ├── api.ts                # REST endpoints (optional)
│   ├── validators.ts         # Input validation
│   ├── errors.ts             # Error definitions
│   ├── config.ts             # Configuration
│   └── index.ts              # Public exports
│
├── __tests__/
│   ├── unit/
│   │   ├── service.test.ts
│   │   └── repository.test.ts
│   ├── integration/
│   │   └── service.integration.test.ts
│   └── fixtures/
│       └── sample-data.ts
│
└── README.md
```

**Exports**: Always use `index.ts` for public API
```typescript
// src/index.ts
export { AlertService } from './service';
export type { Alert, AlertInput } from './types';
export { AlertError } from './errors';
```

### 1.4 Naming Conventions

**Files**:
- Services: `service.ts` (not `Service.ts`)
- Types: `types.ts` (not `Types.ts`)
- Tests: `service.test.ts` (mirror source)
- React components: `ComponentName.tsx` (PascalCase)

**Classes & Interfaces**:
```typescript
// ✅ GOOD
class UserService { }
interface IAlert { }
type AlertStatus = 'new' | 'open' | 'closed';

// ❌ AVOID
class userService { }
interface Alert { }  // No I prefix needed
type AlertType = string;  // Too generic
```

**Functions & Variables**:
```typescript
// ✅ GOOD
async function getUserById(id: string): Promise<User> { }
const alertCount: number = 5;
const isActive: boolean = true;

// ❌ AVOID
async function get_user_by_id() { }
var alertCnt;
let active;
```

**Constants**:
```typescript
// ✅ GOOD
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;

const StatusEnum = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;
```

---

## 2. TESTING STANDARDS

### 2.1 Test Coverage Requirements

**Minimum Coverage by Module**:
- **Unit Tests**: 80% coverage (lines, branches, functions)
- **Integration Tests**: 70% coverage (workflows)
- **Critical paths**: 100% coverage

**Calculation**:
```bash
# Run coverage report
npm run test:coverage

# Expected output
Statements   : 85.3% ( 200/234 )
Branches     : 82.1% ( 145/176 )
Functions    : 88.9% ( 80/90 )
Lines        : 86.4% ( 192/222 )
```

**Enforce in CI/CD**:
```yaml
- name: Coverage check
  run: npm run test:coverage -- --threshold=80
```

### 2.2 Unit Testing

**Framework**: Jest

**Structure**:
```typescript
// service.test.ts
import { AlertService } from './service';

describe('AlertService', () => {
  
  let service: AlertService;
  
  beforeEach(() => {
    service = new AlertService();
  });
  
  describe('getAlert', () => {
    
    it('should return alert when found', async () => {
      // ARRANGE
      const mockAlert = { id: '1', name: 'SSH Brute Force' };
      jest.spyOn(db, 'find').mockResolvedValue(mockAlert);
      
      // ACT
      const result = await service.getAlert('1');
      
      // ASSERT
      expect(result).toEqual(mockAlert);
      expect(db.find).toHaveBeenCalledWith('1');
    });
    
    it('should return null when not found', async () => {
      jest.spyOn(db, 'find').mockResolvedValue(null);
      
      const result = await service.getAlert('999');
      
      expect(result).toBeNull();
    });
    
    it('should throw on database error', async () => {
      jest.spyOn(db, 'find').mockRejectedValue(new Error('DB error'));
      
      await expect(service.getAlert('1')).rejects.toThrow('DB error');
    });
  });
});
```

**Rules**:
- ✓ Test one thing per test
- ✓ Use AAA pattern (Arrange, Act, Assert)
- ✓ Mock external dependencies (DB, APIs, etc.)
- ✓ Test error paths
- ✓ Test edge cases
- ✓ Use descriptive test names

### 2.3 Integration Testing

**Framework**: Jest + Testcontainers (for services)

**Structure**:
```typescript
// service.integration.test.ts
describe('Alert Service Integration', () => {
  
  let service: AlertService;
  let pgContainer: PostgresContainer;
  let osContainer: OpenSearchContainer;
  
  beforeAll(async () => {
    // Start test databases
    pgContainer = await new PostgresContainer().start();
    osContainer = await new OpenSearchContainer().start();
    
    // Connect service to test databases
    service = new AlertService({
      pgUrl: pgContainer.getConnectionUri(),
      osUrl: osContainer.getConnectionUri(),
    });
  });
  
  afterAll(async () => {
    await pgContainer.stop();
    await osContainer.stop();
  });
  
  it('should create alert and index in OpenSearch', async () => {
    const alertData: AlertInput = { /* ... */ };
    
    const alert = await service.createAlert(alertData);
    
    const indexed = await osClient.get({ index: 'alerts', id: alert.id });
    expect(indexed.found).toBe(true);
  });
});
```

**Rules**:
- ✓ Use real test databases (testcontainers)
- ✓ Test multi-service workflows
- ✓ Clean up test data after each test
- ✓ Test failure scenarios (network, timeouts)

### 2.4 Scenario Testing

**Framework**: Custom test scenarios

**Structure**:
```typescript
// ssh-brute-force.scenario.test.ts
describe('SSH Brute Force Scenario', () => {
  
  it('should detect ssh brute force attack', async () => {
    // SETUP: Inject test events
    const authLogs = [
      { timestamp: Date.now(), event: 'SSH login failed - admin' },
      { timestamp: Date.now() + 1000, event: 'SSH login failed - admin' },
      { timestamp: Date.now() + 2000, event: 'SSH login failed - admin' },
      { timestamp: Date.now() + 3000, event: 'SSH login failed - admin' },
      { timestamp: Date.now() + 4000, event: 'SSH login failed - admin' },
    ];
    
    for (const log of authLogs) {
      await telemetryCollector.ingest(log);
    }
    
    // ACT: Wait for detection
    await new Promise(r => setTimeout(r, 5000));
    
    // ASSERT: Verify alert generated
    const alerts = await alertService.getAlerts({
      ruleId: '5002',
      severity: { gte: 8 },
    });
    
    expect(alerts).toHaveLength(1);
    expect(alerts[0].mitreTechnique).toBe('T1110.001');
    expect(alerts[0].severity).toBe(8);
  });
});
```

### 2.5 Test Data & Fixtures

**Location**: `__tests__/fixtures/`

```typescript
// fixtures/sample-alerts.ts
export const sampleAlert = {
  id: 'alert-001',
  ruleId: '5001',
  ruleName: 'SSH Authentication Failed',
  severity: 6,
  confidence: 0.95,
  sourceIp: '192.168.1.50',
  hostname: 'ssh-server',
  userName: 'admin',
  timestamp: new Date('2024-09-27T14:30:00Z'),
};

export const sampleCase = {
  id: 'case-001',
  title: 'SSH Brute Force Attack',
  severity: 'HIGH',
  status: 'OPEN',
  owner: 'analyst-01',
  createdAt: new Date('2024-09-27T14:35:00Z'),
};
```

---

## 3. ERROR HANDLING

### 3.1 Error Definition

```typescript
// src/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', 400, message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super('NOT_FOUND', 404, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', 401, message);
  }
}
```

### 3.2 Error Usage

```typescript
// ✅ GOOD: Throw typed errors
if (!user) {
  throw new NotFoundError(`User ${userId} not found`);
}

if (!hasPermission(user, 'alert:read')) {
  throw new UnauthorizedError('Permission denied: alert:read');
}

if (!isValidEmail(email)) {
  throw new ValidationError('Invalid email format', { email });
}

// ❌ BAD: Generic errors
throw new Error('Not found');
throw new Error('Auth failed');
```

### 3.3 Error Handling in Middleware

```typescript
// middleware/error-handler.ts
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }
  
  // Unexpected errors
  logger.error('Unhandled error', { error: err, url: req.url });
  
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
```

---

## 4. LOGGING STANDARDS

### 4.1 Structured Logging

```typescript
// infrastructure/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      levelFirst: true,
      singleLine: process.env.NODE_ENV === 'production',
    },
  },
});

// Usage
logger.info('Alert created', {
  alertId: 'alert-001',
  ruleId: '5001',
  severity: 8,
  userId: 'analyst-01',
  duration: 1234,  // milliseconds
});
```

**Log Levels**:
- **ERROR**: Failures, exceptions, recoverable errors
- **WARN**: Deprecations, unusual but handled situations
- **INFO**: Significant events (user login, alert created, case escalated)
- **DEBUG**: Detailed execution flow (only in dev)
- **TRACE**: Very detailed (only in dev)

**Required Fields**:
```json
{
  "level": "info",
  "timestamp": "2024-09-27T14:30:00.123Z",
  "message": "Alert created",
  "correlationId": "req-abc123",
  "userId": "analyst-01",
  "resourceId": "alert-001",
  "duration": 1234,
  "context": { "ruleId": "5001" }
}
```

---

## 5. DOCUMENTATION STANDARDS

### 5.1 README.md (Every Module)

```markdown
# Module Name

Brief one-sentence description.

## Overview

Longer description (2-3 paragraphs) of what this module does and why.

## Installation

npm install @soc-lab/module-name

## Usage

```typescript
import { ModuleService } from '@soc-lab/module-name';

const service = new ModuleService({ config });
const result = await service.doSomething();
```

## API Reference

### ModuleService.method(param: Type): Promise<Result>

Description of what the method does.

**Parameters**:
- param (Type): Description

**Returns**: Promise<Result>

**Throws**: ErrorType - When condition

**Example**:
```typescript
const alert = await service.getAlert('alert-001');
```

## Testing

npm test

## Dependencies

- Service A: Used for X
- External API: Used for Y

## Contributing

See main CONTRIBUTING.md

## License

Apache 2.0
```

### 5.2 Code Comments

```typescript
// ✅ GOOD: Explains WHY, not WHAT
// Limit to 5 recent alerts to prevent overwhelming analyst
const recentAlerts = await db.query(query).limit(5);

// ❌ BAD: Explains WHAT (obvious from code)
// Get alerts from database
const recentAlerts = await db.query(query);
```

**Comment Rules**:
- ✓ Explain business logic and non-obvious decisions
- ✓ Link to relevant documentation/tickets
- ✓ Explain complex algorithms
- ✗ Don't comment obvious code
- ✗ Don't duplicate code in comments

### 5.3 TypeScript as Documentation

```typescript
// ✅ GOOD: Types are self-documenting
interface AlertInput {
  /** Rule ID from detection engine */
  ruleId: string;
  
  /** Severity 0-10, higher is more severe */
  severity: number;
  
  /** Confidence 0-1, higher is more certain */
  confidence: number;
}

// ✗ BAD: Missing type information
function createAlert(data: any): any {
  // Need to read code to understand parameters
}
```

---

## 6. API STANDARDS

### 6.1 REST API Design

**Endpoints**:
```
GET    /api/v1/alerts              # List alerts (paginated)
POST   /api/v1/alerts              # Create alert
GET    /api/v1/alerts/{id}         # Get alert by ID
PUT    /api/v1/alerts/{id}         # Update alert
DELETE /api/v1/alerts/{id}         # Delete alert

GET    /api/v1/alerts/{id}/timeline  # Get alert timeline
POST   /api/v1/alerts/{id}/acknowledge  # Acknowledge alert
```

**Request/Response**:
```typescript
// ✅ GOOD: Consistent, predictable
POST /api/v1/alerts
{
  "ruleId": "5001",
  "severity": 8,
  "sourceIp": "192.168.1.50"
}

HTTP 201 Created
{
  "id": "alert-001",
  "ruleId": "5001",
  "severity": 8,
  "sourceIp": "192.168.1.50",
  "createdAt": "2024-09-27T14:30:00Z"
}

// ❌ BAD: Inconsistent
POST /v1/alert/create
{
  "rule": "5001",
  "level": 8,
  "src_ip": "192.168.1.50"
}

Response:
{
  "success": true,
  "data": { "id": "001", ... }
}
```

**Error Responses**:
```json
HTTP 400 Bad Request
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "severity": "Must be between 0 and 10"
    }
  }
}

HTTP 401 Unauthorized
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Permission denied"
  }
}
```

### 6.2 OpenAPI / Swagger

Every API must have OpenAPI spec:

```yaml
openapi: 3.0.0
info:
  title: SOC Detection Lab API
  version: 1.0.0
paths:
  /api/v1/alerts:
    get:
      summary: List alerts
      parameters:
        - name: severity
          in: query
          schema:
            type: integer
            minimum: 0
            maximum: 10
      responses:
        200:
          description: Alerts list
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Alert'
        401:
          $ref: '#/components/responses/Unauthorized'
components:
  schemas:
    Alert:
      type: object
      required: [id, ruleId, severity]
      properties:
        id:
          type: string
        ruleId:
          type: string
        severity:
          type: integer
```

---

## 7. GIT CONVENTIONS

### 7.1 Commit Messages

**Format**: `<type>(<scope>): <subject>`

```
<type>: feat, fix, docs, style, refactor, perf, test, chore
<scope>: module name or component
<subject>: brief change description (50 chars max)

feat(alert-service): add alert deduplication logic

Prevent duplicate alerts within 5-minute window using
event fingerprinting. Duplicate detection happens at
the deduplication service before alert is created.

Closes #123
```

**Rules**:
- Use imperative mood ("add" not "added")
- Don't capitalize first letter
- No period at end
- Reference issues/tickets: `Closes #123`

### 7.2 Branch Naming

```
feature/alert-deduplication
bugfix/typo-in-error-message
docs/api-documentation
refactor/optimize-timeline-query
test/add-scenario-tests
```

### 7.3 Pull Request Process

1. Branch from `main` (or sprint branch)
2. Commit with proper messages
3. Push to remote
4. Create PR with description
5. Request review from 2+ team members
6. Address review comments
7. Squash commits before merge
8. Merge to main

**PR Template**:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Feature
- [ ] Bugfix
- [ ] Documentation

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests passing
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Coverage maintained above 80%
```

---

## 8. CONFIGURATION MANAGEMENT

### 8.1 Environment Variables

**File**: `.env.example` (committed to repo)
```
# Database
DATABASE_URL=postgres://user:password@localhost/soclab
OPENSEARCH_URL=http://localhost:9200

# SIEM
WAZUH_MANAGER_URL=http://wazuh-manager:55000

# Authentication
JWT_SECRET=your-secret-here
SESSION_TTL=3600

# Logging
LOG_LEVEL=info

# Monitoring
METRICS_ENABLED=true
TRACE_ENABLED=false
```

**Files**: `.env*` (NOT committed)
```
.env.local           # Local development
.env.development     # Dev environment
.env.staging         # Staging environment
.env.production      # Production environment
```

### 8.2 Configuration Loading

```typescript
// config/index.ts
import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

export const config = {
  db: {
    url: process.env.DATABASE_URL || 'postgres://localhost/soclab',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10'),
    },
  },
  opensearch: {
    url: process.env.OPENSEARCH_URL || 'http://localhost:9200',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',
    sessionTtl: parseInt(process.env.SESSION_TTL || '3600'),
  },
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Validate required config
if (!config.db.url) {
  throw new Error('DATABASE_URL is required');
}
```

---

## 9. PERFORMANCE STANDARDS

### 9.1 Targets by Operation

| Operation | Target | Measurement |
|---|---|---|
| Alert API (GET) | <100ms | p95 latency |
| Alert creation | <500ms | p95 latency |
| Case creation | <1s | p95 latency |
| Timeline reconstruction | <5s | 30-day window, p95 |
| Search query | <5s | up to 100k results, p95 |
| Playbook execution | <2s | dry-run included |

### 9.2 Performance Testing

```typescript
// tests/performance/alert-search.bench.ts
import { performanceTest } from '../utils/perf-utils';

describe('Alert Search Performance', () => {
  
  it('should search 100k alerts in <5s', async () => {
    const results = await performanceTest(async () => {
      return await alertService.search({
        query: 'severity:>8',
        limit: 1000,
      });
    });
    
    expect(results.duration).toBeLessThan(5000);
    expect(results.data).toHaveLength(1000);
  });
});
```

---

## 10. SECURITY STANDARDS

### 10.1 Input Validation

```typescript
// ✅ GOOD: Validate all inputs
import { z } from 'zod';

const alertSchema = z.object({
  ruleId: z.string().min(1).max(50),
  severity: z.number().int().min(0).max(10),
  sourceIp: z.string().ip(),
});

function createAlert(data: unknown): Alert {
  const validated = alertSchema.parse(data);
  return service.create(validated);
}

// ❌ BAD: No validation
function createAlert(data: any): Alert {
  return service.create(data);  // Could accept malicious data
}
```

### 10.2 Authentication & Authorization

```typescript
// middleware/require-auth.ts
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    throw new UnauthorizedError('Missing authentication token');
  }
  
  const user = verifyToken(token);
  req.user = user;
  next();
}

// middleware/require-permission.ts
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!hasPermission(req.user, permission)) {
      throw new UnauthorizedError(`Missing permission: ${permission}`);
    }
    next();
  };
}

// Usage
app.post('/api/v1/alerts/:id/approve', 
  requireAuth,
  requirePermission('alert:approve'),
  approveAlertHandler
);
```

### 10.3 SQL Injection Prevention

```typescript
// ✅ GOOD: Parameterized queries
const alerts = await db.query(
  'SELECT * FROM alerts WHERE severity > $1 AND rule_id = $2',
  [8, '5001']
);

// ❌ BAD: String concatenation
const alerts = await db.query(
  `SELECT * FROM alerts WHERE severity > ${severity} AND rule_id = '${ruleId}'`
);
```

### 10.4 Secrets Management

```typescript
// ✅ GOOD: Load from environment
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET not configured');
}

// ❌ BAD: Hardcoded secrets
const jwtSecret = 'my-secret-key-12345';
```

---

## 11. DEPLOYMENT & RELEASE

### 11.1 Versioning

**Semantic Versioning**: MAJOR.MINOR.PATCH

```
v1.0.0      # Initial release
v1.1.0      # New features, backward compatible
v1.1.1      # Bug fix
v2.0.0      # Breaking changes
```

**VERSION file**:
```
1.0.0
```

### 11.2 Changelog

**File**: `CHANGELOG.md`

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2024-10-15

### Added
- Alert deduplication service
- IOC extraction from alerts
- Threat hunt query builder

### Fixed
- Timeline reconstruction timestamp accuracy
- False positive in SSH rule

### Changed
- Alert priority calculation now includes asset criticality
- Improved search performance with new indexes

## [0.9.0] - 2024-10-01

### Added
- Initial MVP release
```

---

## CHECKLIST: Before Marking Module Complete

- [ ] Code written and reviewed
- [ ] 80% unit test coverage
- [ ] All tests passing
- [ ] ESLint passes (no errors)
- [ ] TypeScript strict mode passes
- [ ] Prettier formatted
- [ ] README.md complete
- [ ] Types exported in index.ts
- [ ] Error handling comprehensive
- [ ] Logging in place (key operations)
- [ ] API documented (if applicable)
- [ ] Performance benchmarked (if applicable)
- [ ] Security review passed (if applicable)
- [ ] Integration tests with dependencies
- [ ] Commit message follows format
- [ ] PR reviewed and approved

---

**Last Updated**: 2026-09-27  
**Version**: 1.0  
**Status**: Active guidelines for all development
