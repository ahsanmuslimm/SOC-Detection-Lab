# Production Implementation Specification

## How to Use This Document

This document provides **step-by-step implementation tasks** for the 12-week production roadmap. Each section specifies:
- **Exact files to create**
- **Code structure and patterns**
- **Type definitions and interfaces**
- **Testing approach**
- **Success criteria**

---

## PHASE 1: Integration & API Layer

### Week 1: Service Integration Hub

#### Task 1.1: Create Service Orchestrator

**File**: `src/backend/services/orchestrator/index.ts`

**Purpose**: Dependency injection container connecting all 15 modules

**Implementation**:

```typescript
import { AnalyticsService, createAnalyticsService } from '../../domain-12-integrations/analytics-service/src/index';
import { SyncService, createSyncService } from '../../domain-12-integrations/sync-service/src/index';
import { ExportService, createExportService } from '../../domain-12-integrations/export-service/src/index';
// ... import all 15 domain modules

export interface IServiceOrchestrator {
  // Tier 0: Infrastructure
  configService: any;
  auditService: any;
  cacheService: any;
  
  // Tier 1: Auth
  authService: any;
  userService: any;
  
  // Tier 1: Authorization
  rbacService: any;
  policyEngine: any;
  
  // Tier 2: Core Services
  alertService: any;
  detectionService: any;
  investigationService: any;
  caseService: any;
  
  // Tier 2: Integration Services
  analyticsService: AnalyticsService;
  syncService: SyncService;
  exportService: ExportService;
  
  // Lifecycle
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  healthCheck(): Promise<Record<string, any>>;
}

class ServiceOrchestrator implements IServiceOrchestrator {
  configService: any;
  // ... declare all services
  
  constructor() {
    // Initialize in dependency order
    this.configService = new ConfigService();
    this.auditService = new AuditService(this.configService);
    this.cacheService = new CacheService(this.configService);
    
    // Auth
    this.authService = new AuthService(this.configService);
    this.userService = new UserService(this.configService);
    
    // Authorization
    this.rbacService = new RBACService(this.configService);
    this.policyEngine = new PolicyEngine(this.rbacService);
    
    // Services
    this.analyticsService = createAnalyticsService(this.configService);
    this.syncService = createSyncService(this.configService);
    this.exportService = createExportService(this.configService);
  }
  
  async initialize(): Promise<void> {
    console.log('Initializing Service Orchestrator...');
    
    // Initialize services
    if (this.configService.initialize) await this.configService.initialize();
    if (this.auditService.initialize) await this.auditService.initialize();
    if (this.authService.initialize) await this.authService.initialize();
    // ... initialize all services
    
    console.log('✓ All services initialized');
  }
  
  async shutdown(): Promise<void> {
    console.log('Shutting down services...');
    // Cleanup in reverse order
    if (this.analyticsService.stop) this.analyticsService.stop();
    // ... shutdown all services
  }
  
  async healthCheck(): Promise<Record<string, any>> {
    const health: Record<string, any> = {
      timestamp: new Date(),
      services: {}
    };
    
    // Check each service
    health.services.analytics = this.analyticsService.performHealthCheck();
    health.services.sync = this.syncService.performHealthCheck();
    // ... check all services
    
    return health;
  }
}

export function createOrchestrator(): IServiceOrchestrator {
  return new ServiceOrchestrator();
}

export const orchestrator = createOrchestrator();
```

**Success Criteria**:
- ✅ All 15 modules can be instantiated
- ✅ No circular dependencies
- ✅ Lifecycle methods work (initialize → shutdown)
- ✅ Health check returns all services

---

#### Task 1.2: Build API Gateway

**File**: `src/backend/api-gateway/index.ts`

**Purpose**: Express setup with routing to orchestrated services

```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { orchestrator } from '../services/orchestrator/index';

export interface IAPIGateway {
  app: Express;
  start(port: number): Promise<void>;
  stop(): Promise<void>;
}

class APIGateway implements IAPIGateway {
  app: Express;
  private server: any;
  
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  private setupMiddleware(): void {
    // Security
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
      credentials: true
    }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    });
    this.app.use(limiter);
    
    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }
  
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', async (req: Request, res: Response) => {
      const health = await orchestrator.healthCheck();
      res.json(health);
    });
    
    // API v1 routes
    this.app.use('/api/v1/auth', require('./routes/auth').default);
    this.app.use('/api/v1/users', require('./routes/users').default);
    this.app.use('/api/v1/rbac', require('./routes/rbac').default);
    this.app.use('/api/v1/alerts', require('./routes/alerts').default);
    this.app.use('/api/v1/cases', require('./routes/cases').default);
    this.app.use('/api/v1/investigations', require('./routes/investigations').default);
    this.app.use('/api/v1/detection', require('./routes/detection').default);
    this.app.use('/api/v1/reports', require('./routes/reports').default);
    this.app.use('/api/v1/analytics', require('./routes/analytics').default);
    this.app.use('/api/v1/sync', require('./routes/sync').default);
    this.app.use('/api/v1/export', require('./routes/export').default);
    
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: 'Not Found' });
    });
    
    // Error handler
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error(err);
      res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
      });
    });
  }
  
  async start(port: number): Promise<void> {
    await orchestrator.initialize();
    
    this.server = this.app.listen(port, () => {
      console.log(`✓ API Gateway running on http://localhost:${port}`);
    });
  }
  
  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
    await orchestrator.shutdown();
  }
}

export function createAPIGateway(): IAPIGateway {
  return new APIGateway();
}
```

**Files to Create**:
- `src/backend/api-gateway/index.ts` (above)
- `src/backend/api-gateway/routes/auth.ts` (100 lines)
- `src/backend/api-gateway/routes/alerts.ts` (150 lines)
- `src/backend/api-gateway/routes/cases.ts` (150 lines)
- ... (8 more route files)

**Success Criteria**:
- ✅ Server starts on port 3000
- ✅ GET /health returns status
- ✅ 11 route files functional
- ✅ 404 and error handling work

---

### Week 2: Database Layer & Migrations

#### Task 2.1: Create Database Client

**File**: `src/backend/domain-1-core-infrastructure/database-client/src/main.ts`

```typescript
import { Pool, PoolClient } from 'pg';

export interface IDatabase {
  query(sql: string, values?: any[]): Promise<any>;
  transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

class PostgresClient implements IDatabase {
  private pool: Pool;
  
  constructor(config: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    max?: number;
  }) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: config.max || 10
    });
  }
  
  async query(sql: string, values?: any[]): Promise<any> {
    try {
      const result = await this.pool.query(sql, values);
      return result.rows;
    } catch (error) {
      console.error('Database query failed:', sql, values);
      throw error;
    }
  }
  
  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export function createDatabase(config: any): IDatabase {
  return new PostgresClient(config);
}
```

**Success Criteria**:
- ✅ Can connect to PostgreSQL
- ✅ Queries execute successfully
- ✅ Transactions rollback on error
- ✅ Connection pooling works

---

#### Task 2.2: Create Database Migrations

**Files**: `database/migrations/`

```sql
-- 001_init_schema.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ... (additional 10 migrations for all tables)
```

**Success Criteria**:
- ✅ All migrations run without error
- ✅ Schema matches documented models
- ✅ Foreign keys properly defined
- ✅ Indexes on common query fields

---

#### Task 2.3: Create Seed Data

**File**: `database/seeds/001_seed_initial_data.sql`

```sql
INSERT INTO roles (name, permissions) VALUES
('SOC_ANALYST', '["alert:read", "case:create", "investigation:read"]'),
('DETECTION_ENGINEER', '["rule:create", "rule:edit", "rule:deploy"]'),
('SOC_MANAGER', '["dashboard:view", "report:generate"]'),
('ADMIN', '["*"]');

INSERT INTO users (username, email, password_hash, role_id) VALUES
('analyst@soc.lab', 'analyst@soc.lab', '$2a$12$...', (SELECT id FROM roles WHERE name = 'SOC_ANALYST')),
('admin@soc.lab', 'admin@soc.lab', '$2a$12$...', (SELECT id FROM roles WHERE name = 'ADMIN'));
```

**Success Criteria**:
- ✅ All seed data inserted
- ✅ Referential integrity maintained
- ✅ Test users created

---

### Week 3: Unified REST API

#### Task 3.1: Create API Controllers

**File**: `src/backend/api/controllers/AlertController.ts`

```typescript
import { Request, Response } from 'express';
import { orchestrator } from '../../services/orchestrator/index';

export class AlertController {
  async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { status, category, limit = 50 } = req.query;
      
      const alerts = orchestrator.alertService.listAlerts({
        status: status as string,
        category: category as string,
        limit: parseInt(limit as string)
      });
      
      res.json({ alerts, count: alerts.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async createAlert(req: Request, res: Response): Promise<void> {
    try {
      const alertId = orchestrator.alertService.trackEvent(req.body);
      res.status(201).json({ alertId });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  
  async acknowledgeAlert(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const alert = orchestrator.alertService.getEvent(id);
      if (!alert) {
        res.status(404).json({ error: 'Alert not found' });
        return;
      }
      
      // Update status
      const updated = orchestrator.alertService.updateAlertStatus(id, 'acknowledged');
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const alertController = new AlertController();
```

**Similar Controllers** (to create):
- `AuthController` (login, register, refresh)
- `CaseController` (CRUD operations)
- `InvestigationController` (timeline, graph)
- `DetectionController` (rule management)
- `ReportController` (generate, export)
- `UserController` (user management)
- `RBACController` (role management)
- `AnalyticsController` (metrics, queries)

**Success Criteria**:
- ✅ 8+ controllers created
- ✅ All CRUD operations available
- ✅ Proper error handling
- ✅ Consistent response format

---

#### Task 3.2: Create API Routes

**File**: `src/backend/api/routes/alerts.ts`

```typescript
import express, { Router } from 'express';
import { alertController } from '../controllers/AlertController';
import { authMiddleware } from '../middleware/auth';
import { rbacMiddleware } from '../middleware/rbac';

const router: Router = express.Router();

// GET /api/v1/alerts
router.get('/', authMiddleware, async (req, res) => {
  await alertController.getAlerts(req, res);
});

// POST /api/v1/alerts
router.post('/', authMiddleware, rbacMiddleware('alert:create'), async (req, res) => {
  await alertController.createAlert(req, res);
});

// POST /api/v1/alerts/:id/acknowledge
router.post('/:id/acknowledge', authMiddleware, rbacMiddleware('alert:acknowledge'), async (req, res) => {
  await alertController.acknowledgeAlert(req, res);
});

export default router;
```

**Similar Route Files**:
- `src/backend/api/routes/auth.ts` (login, register, refresh)
- `src/backend/api/routes/cases.ts` (case CRUD)
- `src/backend/api/routes/investigations.ts` (investigation endpoints)
- `src/backend/api/routes/detection.ts` (rule endpoints)
- `src/backend/api/routes/reports.ts` (report endpoints)
- `src/backend/api/routes/users.ts` (user management)
- `src/backend/api/routes/rbac.ts` (role management)
- `src/backend/api/routes/analytics.ts` (metrics/query endpoints)

**Success Criteria**:
- ✅ 50+ endpoints defined
- ✅ Authentication on all endpoints
- ✅ RBAC checked where needed
- ✅ OpenAPI spec auto-generated

---

### Week 4: Integration Testing

#### Task 4.1: Create Integration Test Suite

**File**: `src/backend/__tests__/integration/auth-flow.test.ts`

```typescript
import { createAPIGateway, IAPIGateway } from '../../api-gateway/index';
import axios, { AxiosInstance } from 'axios';

describe('Authentication Flow Integration', () => {
  let gateway: IAPIGateway;
  let client: AxiosInstance;
  
  beforeAll(async () => {
    gateway = createAPIGateway();
    await gateway.start(3001);
    
    client = axios.create({
      baseURL: 'http://localhost:3001/api/v1',
      validateStatus: () => true
    });
  });
  
  afterAll(async () => {
    await gateway.stop();
  });
  
  test('should register user', async () => {
    const response = await client.post('/auth/register', {
      username: 'testuser',
      email: 'test@example.com',
      password: 'SecurePassword123!'
    });
    
    expect(response.status).toBe(201);
    expect(response.data.userId).toBeDefined();
  });
  
  test('should login and get token', async () => {
    const response = await client.post('/auth/login', {
      username: 'testuser',
      password: 'SecurePassword123!'
    });
    
    expect(response.status).toBe(200);
    expect(response.data.accessToken).toBeDefined();
    expect(response.data.refreshToken).toBeDefined();
  });
  
  test('should refresh token', async () => {
    // First login
    const loginRes = await client.post('/auth/login', {
      username: 'testuser',
      password: 'SecurePassword123!'
    });
    
    const refreshToken = loginRes.data.refreshToken;
    
    // Then refresh
    const response = await client.post('/auth/refresh', {
      refreshToken
    });
    
    expect(response.status).toBe(200);
    expect(response.data.accessToken).toBeDefined();
  });
});
```

**Similar Integration Tests**:
- `alert-workflow.test.ts` - Track → Aggregate → Query
- `case-workflow.test.ts` - Create → Assign → Update → Close
- `investigation-workflow.test.ts` - Evidence collection → Timeline
- `detection-workflow.test.ts` - Rule create → Test → Deploy
- `end-to-end-scenario.test.ts` - Complete attack detection flow

**Success Criteria**:
- ✅ 50+ integration tests
- ✅ All tests passing
- ✅ 90%+ code coverage
- ✅ Performance metrics captured

---

## PHASE 2: Security Hardening & Frontend

### Week 5: Security Implementation

#### Task 5.1: Authentication Middleware

**File**: `src/backend/api/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: { id: string; username: string; role: string };
    }
  }
}

export interface IAuthenticatedRequest extends Request {
  userId: string;
  user: { id: string; username: string; role: string };
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }
    
    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    req.userId = decoded.userId;
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

**Success Criteria**:
- ✅ JWT tokens validated
- ✅ Token payload accessible in requests
- ✅ Invalid tokens rejected
- ✅ Token refresh working

---

#### Task 5.2: Authorization/RBAC Middleware

**File**: `src/backend/api/middleware/rbac.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { orchestrator } from '../../services/orchestrator/index';

export function rbacMiddleware(requiredPermission: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      const hasPermission = orchestrator.rbacService.hasPermission(
        req.user.role,
        requiredPermission
      );
      
      if (!hasPermission) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}
```

**Success Criteria**:
- ✅ Permissions checked per route
- ✅ Roles enforce permission sets
- ✅ Unauthorized requests blocked
- ✅ Audit logged for denials

---

#### Task 5.3: Add Encryption

**File**: `src/backend/domain-1-core-infrastructure/encryption/src/main.ts`

```typescript
import crypto from 'crypto';

export interface IEncryptionService {
  encrypt(plaintext: string): string;
  decrypt(ciphertext: string): string;
}

class AES256Encrypter implements IEncryptionService {
  private key: Buffer;
  private algorithm = 'aes-256-gcm';
  
  constructor(keyHex: string) {
    this.key = Buffer.from(keyHex, 'hex');
  }
  
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return: iv.authTag.encrypted
    return `${iv.toString('hex')}.${authTag.toString('hex')}.${encrypted}`;
  }
  
  decrypt(ciphertext: string): string {
    const [ivHex, authTagHex, encrypted] = ciphertext.split('.');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

export function createEncrypter(keyHex: string): IEncryptionService {
  return new AES256Encrypter(keyHex);
}
```

**Success Criteria**:
- ✅ Encryption/decryption working
- ✅ Auth tags prevent tampering
- ✅ No plaintext leaked
- ✅ Key rotation supported

---

#### Task 5.4: Add Audit Middleware

**File**: `src/backend/api/middleware/audit.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { orchestrator } from '../../services/orchestrator/index';

export async function auditMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const startTime = Date.now();
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data: any) {
    const duration = Date.now() - startTime;
    
    // Log to audit
    orchestrator.auditService.log({
      timestamp: new Date(),
      actor: req.user?.id || 'anonymous',
      action: `${req.method} ${req.path}`,
      resource: req.path,
      status: res.statusCode,
      duration,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    return originalSend.call(this, data);
  };
  
  next();
}
```

**Success Criteria**:
- ✅ All API calls logged
- ✅ Audit trail immutable
- ✅ Performance impact <5ms
- ✅ Query audit logs working

---

### Week 6-7: Frontend Development

This requires a dedicated frontend developer. Create React project structure:

```
src/frontend/
├── components/
│   ├── AlertCard.tsx
│   ├── CaseTimeline.tsx
│   ├── InvestigationGraph.tsx
│   ├── RuleEditor.tsx
│   └── ... (30+ components)
├── pages/
│   ├── AlertsPage.tsx
│   ├── CasesPage.tsx
│   ├── InvestigationPage.tsx
│   ├── DashboardPage.tsx
│   └── ... (10+ pages)
├── services/
│   ├── api.ts (API client)
│   ├── auth.ts (auth state)
│   └── store.ts (global state)
└── App.tsx
```

**Key Pages to Build**:
1. Dashboard (summary metrics)
2. Alerts list & detail
3. Cases list & detail
4. Investigation workspace
5. Detection rules editor
6. Reports generator
7. User management
8. System admin console

**Success Criteria**:
- ✅ 10+ pages functional
- ✅ Mobile responsive
- ✅ Dark/light theme
- ✅ <3s load time

---

### Week 8: CI/CD Pipeline

#### Task 8.1: GitHub Actions Workflows

**File**: `.github/workflows/test.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Unit tests
        run: npm run test:unit -- --coverage
      
      - name: Integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost/test
          REDIS_URL: redis://localhost:6379
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

**Similar Workflows**:
- `lint.yml` - ESLint + Prettier check
- `security.yml` - Dependency audit + SAST
- `build.yml` - Docker image build
- `deploy.yml` - Deploy to staging/prod

**Success Criteria**:
- ✅ All PRs linted
- ✅ Tests run automatically
- ✅ Coverage reports generated
- ✅ Builds fail on errors

---

## PHASE 3: Production Hardening & Deployment

### Week 9: Observability & Monitoring

#### Task 9.1: Add Prometheus Metrics

**File**: `src/backend/api/middleware/metrics.ts`

```typescript
import promClient from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Create metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .inc();
  });
  
  next();
}

// Expose metrics
export function setupMetricsEndpoint(app: any): void {
  app.get('/metrics', async (req: Request, res: Response) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  });
}
```

**Success Criteria**:
- ✅ Metrics exposed at /metrics
- ✅ Prometheus can scrape
- ✅ Grafana dashboards working
- ✅ Performance metrics tracked

---

### Week 10: Infrastructure-as-Code

#### Task 10.1: Kubernetes Manifests

**File**: `infra/kubernetes/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: soc-detection-lab-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: soc-lab-backend
  template:
    metadata:
      labels:
        app: soc-lab-backend
    spec:
      containers:
      - name: backend
        image: soc-detection-lab:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: soc-lab-backend
spec:
  selector:
    app: soc-lab-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

**Additional K8s Files**:
- `configmap.yaml` - Configuration
- `statefulset-postgres.yaml` - Database
- `statefulset-redis.yaml` - Cache
- `ingress.yaml` - External access
- `hpa.yaml` - Auto-scaling

**Success Criteria**:
- ✅ Deployment works
- ✅ Service discovery works
- ✅ Auto-scaling configured
- ✅ Persistent storage working

---

#### Task 10.2: Terraform IaC

**File**: `infra/terraform/main.tf`

```hcl
provider "aws" {
  region = var.aws_region
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name            = "soc-detection-lab"
  version         = "1.27"
  role_arn        = aws_iam_role.eks_cluster_role.arn

  vpc_config {
    subnet_ids = aws_subnet.private[*].id
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier     = "soc-lab-db"
  engine         = "postgres"
  engine_version = "15.0"
  instance_class = "db.t3.micro"
  
  db_name  = "soc_lab"
  username = "socadmin"
  password = random_password.db_password.result
  
  allocated_storage = 100
  storage_type      = "gp3"
  
  backup_retention_period = 30
  multi_az               = true
  
  skip_final_snapshot = false
  final_snapshot_identifier = "soc-lab-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "soc-lab-redis"
  engine              = "redis"
  node_type          = "cache.t3.micro"
  num_cache_nodes     = 1
  parameter_group_name = "default.redis7"
  engine_version      = "7.0"
  port                = 6379
}

# Outputs
output "eks_cluster_endpoint" {
  value = aws_eks_cluster.main.endpoint
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.redis.cache_nodes[0].address
}
```

**Success Criteria**:
- ✅ Infrastructure deployed via Terraform
- ✅ All services provisioned
- ✅ Networking configured
- ✅ Backups enabled

---

### Week 11: Performance & Optimization

#### Task 11.1: Load Testing

**File**: `src/backend/__tests__/performance/load-test.ts`

```typescript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<500'], // 99th percentile < 500ms
    http_req_failed: ['<1%'],         // Error rate < 1%
  }
};

export default function() {
  // Test alert listing
  const listRes = http.get('http://localhost:3000/api/v1/alerts');
  check(listRes, {
    'alerts list status 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200
  });
  
  sleep(1);
  
  // Test case creation
  const createRes = http.post('http://localhost:3000/api/v1/cases', {
    title: 'Test Case',
    description: 'Load test case'
  });
  check(createRes, {
    'case creation status 201': (r) => r.status === 201
  });
  
  sleep(2);
}
```

**Success Criteria**:
- ✅ 100+ concurrent users sustained
- ✅ 99th percentile latency <500ms
- ✅ Error rate <1%
- ✅ Throughput ≥100 req/sec

---

### Week 12: Documentation & QA

#### Task 12.1: Create Deployment Guide

**File**: `DEPLOYMENT.md`

```markdown
# Production Deployment Guide

## Prerequisites
- Docker 20.10+
- Kubernetes 1.27+
- Terraform 1.4+
- AWS account with appropriate permissions

## 1. Infrastructure Setup (Terraform)

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

## 2. Build Docker Image

```bash
docker build -t soc-detection-lab:latest .
docker tag soc-detection-lab:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/soc-lab:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/soc-lab:latest
```

## 3. Deploy to Kubernetes

```bash
kubectl apply -f infra/kubernetes/

# Wait for rollout
kubectl rollout status deployment/soc-detection-lab-backend
```

## 4. Database Setup

```bash
# Run migrations
kubectl exec -it deployment/soc-detection-lab-backend -- npm run db:migrate

# Seed data
kubectl exec -it deployment/soc-detection-lab-backend -- npm run db:seed
```

## 5. Verify Deployment

```bash
# Check pods
kubectl get pods -l app=soc-lab-backend

# Check logs
kubectl logs -f deployment/soc-detection-lab-backend

# Health check
curl http://your-domain.com/health
```

## 6. Rollback (if needed)

```bash
kubectl rollout undo deployment/soc-detection-lab-backend
```

## Troubleshooting

### Pods not starting
- Check logs: `kubectl logs pod-name`
- Check events: `kubectl describe pod pod-name`
- Verify resources: `kubectl top nodes`

### Database connection issues
- Verify RDS security group allows access
- Check connection string in secrets
- Verify migrations ran: `kubectl exec ... -- psql ...`

---

## Production Checklist

- [ ] All secrets configured in AWS Secrets Manager
- [ ] RDS backups enabled and tested
- [ ] Monitoring configured (CloudWatch + Prometheus)
- [ ] Logging configured (CloudWatch Logs)
- [ ] SSL certificates installed (ACM)
- [ ] DNS configured (Route53)
- [ ] WAF rules applied
- [ ] Backups tested and documented
- [ ] Runbooks created for on-call
- [ ] Fire drill completed successfully
```

**Additional Documentation**:
- `OPERATIONS.md` - Day-to-day operations
- `SECURITY_HARDENING.md` - Security checklist
- `TROUBLESHOOTING.md` - Common issues
- `API.md` - OpenAPI documentation
- `ARCHITECTURE.md` - System design

**Success Criteria**:
- ✅ Deployment automated
- ✅ Runbooks documented
- ✅ Team trained
- ✅ Ready for launch

---

## Testing Checklist

### Functional Testing ✅
- [ ] All CRUD operations working
- [ ] Auth flow (register → login → refresh → logout)
- [ ] Case lifecycle (create → assign → investigate → close)
- [ ] Alert workflow (track → aggregate → investigate → respond)
- [ ] Detection rules (create → test → deploy)
- [ ] Report generation (create → export → email)

### Security Testing ✅
- [ ] SQL injection prevention working
- [ ] XSS prevention working
- [ ] CSRF tokens validated
- [ ] Rate limiting enforced
- [ ] Audit trail complete
- [ ] Encryption working (data at rest + in transit)
- [ ] RBAC enforced on all endpoints
- [ ] Session timeout working

### Performance Testing ✅
- [ ] API response time <200ms (95th percentile)
- [ ] Database queries <50ms (average)
- [ ] 100+ concurrent users sustained
- [ ] No memory leaks over 24 hours
- [ ] CPU utilization <80% at peak

### Integration Testing ✅
- [ ] All 15 modules communicating
- [ ] Cross-module workflows functional
- [ ] Error handling proper
- [ ] Logging centralized
- [ ] Metrics exposed

### Deployment Testing ✅
- [ ] Docker image builds successfully
- [ ] Kubernetes deployment works
- [ ] Database migrations successful
- [ ] Rollback procedures tested
- [ ] Disaster recovery tested

---

## Success Metrics

| Metric | Target | Achieved |
|--------|--------|----------|
| Code Coverage | 90%+ | [ ] |
| API Response Time (p95) | <200ms | [ ] |
| Throughput | ≥100 req/sec | [ ] |
| Error Rate | <1% | [ ] |
| Deployment Time | <10 minutes | [ ] |
| Time to Recover | <5 minutes | [ ] |
| Security Vulnerabilities | 0 Critical | [ ] |
| Documentation Coverage | 100% | [ ] |

---

## Ready for Production ✅

Once all checklists complete and metrics achieved:

1. **Sign-off** from:
   - Engineering Lead
   - Security Team
   - Operations Team
   - Product Owner

2. **Announcement** to stakeholders

3. **Monitor** for first 48 hours with on-call rotation

4. **Celebrate** 🎉

---

**Document Version**: 1.0  
**Last Updated**: [timestamp]  
**Status**: Ready for Implementation
