# Tasks: Replace In-Memory Stores with PostgreSQL Repositories

Each task is small, self-contained, and ends with a working, committable state. Complete them in order.

---

## Task 1 — DatabaseClient singleton + .env updates

**Files to create/modify**:
- `src/backend/database/client.ts` — NEW
- `.env.example` — MODIFY (add DB vars)
- `.env` — MODIFY (add DB vars with local defaults)

**What to implement**:

Create `src/backend/database/client.ts`:

```typescript
import { Pool, PoolClient } from 'pg';

export class DatabaseClient {
  private static instance: DatabaseClient | null = null;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool(
      process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL }
        : {
            host:     process.env.DB_HOST     || 'localhost',
            port:     Number(process.env.DB_PORT)     || 5432,
            database: process.env.DB_NAME     || 'soc_lab',
            user:     process.env.DB_USER     || 'postgres',
            password: process.env.DB_PASSWORD || '',
            min:      Number(process.env.DB_POOL_MIN) || 2,
            max:      Number(process.env.DB_POOL_MAX) || 10,
          }
    );
    this.pool.on('error', (err) => {
      console.error('[DatabaseClient] Unexpected pool error', err);
    });
  }

  static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  async query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await this.pool.query(sql, params);
    return result.rows as T[];
  }

  async queryOne<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<{ status: string; responseTime: number }> {
    const start = Date.now();
    try {
      await this.pool.query('SELECT 1');
      return { status: 'healthy', responseTime: Date.now() - start };
    } catch {
      return { status: 'unhealthy', responseTime: Date.now() - start };
    }
  }

  async end(): Promise<void> {
    await this.pool.end();
    DatabaseClient.instance = null;
  }
}

export function isDatabaseConfigured(): boolean {
  return !!(process.env.DATABASE_URL || process.env.DB_HOST);
}
```

Add to `.env.example` (and `.env`):
```
# ── Database ────────────────────────────────────────────
# Use DATABASE_URL for a single connection string (takes priority):
DATABASE_URL=postgresql://postgres:password@localhost:5432/soc_lab
# Or set individual parts (used when DATABASE_URL is absent):
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=soc_lab
# DB_USER=postgres
# DB_PASSWORD=password
# DB_POOL_MIN=2
# DB_POOL_MAX=10
```

**Verification**: `npm run build:backend` compiles with zero errors. No runtime test needed yet.

---

## Task 2 — Migration runner (`scripts/db-migrate.ts`)

**Files to create/modify**:
- `scripts/db-migrate.ts` — REPLACE (currently a stub or partial)
- `database/migrations/001_init_schema.sql` — ADD `IF NOT EXISTS` guards where missing

**What to implement**:

```typescript
// scripts/db-migrate.ts
import 'dotenv/config';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { DatabaseClient } from '../src/backend/database/client';

async function migrate(): Promise<void> {
  const db = DatabaseClient.getInstance();

  // Tracking table
  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrationsDir = join(process.cwd(), 'database', 'migrations');
  const files = (await readdir(migrationsDir))
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const already = await db.queryOne<{ filename: string }>(
      'SELECT filename FROM _migrations WHERE filename = $1',
      [file]
    );
    if (already) {
      console.log(`  skip  ${file}`);
      continue;
    }
    console.log(`  apply ${file} …`);
    const sql = await readFile(join(migrationsDir, file), 'utf8');
    await db.query(sql);
    await db.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
    console.log(`  done  ${file}`);
  }

  console.log('Migrations complete.');
  await db.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

Also prepend `IF NOT EXISTS` to every `CREATE TABLE` and `CREATE INDEX` statement in `001_init_schema.sql` so re-running is safe.  Add `CREATE EXTENSION IF NOT EXISTS` guards (they probably already have `IF NOT EXISTS`).

**Verification**: With PostgreSQL running:
```
npm run db:migrate
# → prints "apply 001_init_schema.sql … done"
npm run db:migrate   # second run
# → prints "skip  001_init_schema.sql"
npm run build:backend  # zero errors
```

---

## Task 3 — Seed runner (`scripts/db-seed.ts`)

**Files to create/modify**:
- `scripts/db-seed.ts` — REPLACE

**What to implement**:

The seed must insert (using `ON CONFLICT DO NOTHING`):
- 3 roles: `ADMIN` (id `role-admin`), `SOC_ANALYST` (id `role-analyst`), `VIEWER` (id `role-viewer`)
- 3 users matching fixture IDs from the integration tests: `user-123` (analyst1), `user-456` (viewer1), `user-admin` (admin) — passwords hashed with bcrypt
- 2 detection rules: `rule-123`, `rule-456`
- 3 alerts: `test-id-123`, `alert-456`, `alert-789`
- 2 cases: `case-123`, `case-456`
- 1 investigation: `inv-123` with 4 timeline events
- 1 report: `report-123`

Use `bcryptjs` to generate password hashes at seed time (hash `SecurePassword123!` with cost 12).

```typescript
// scripts/db-seed.ts
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { DatabaseClient } from '../src/backend/database/client';

async function seed(): Promise<void> {
  const db = DatabaseClient.getInstance();
  const hash = await bcrypt.hash('SecurePassword123!', 12);

  // Roles
  await db.query(`
    INSERT INTO roles (id, name, description, permissions) VALUES
      ('role-admin',   'ADMIN',       'Full access',         '["*"]'::jsonb),
      ('role-analyst', 'SOC_ANALYST', 'Analyst permissions', '["alert:read","alert:create","case:read","case:create","investigation:read","investigation:create"]'::jsonb),
      ('role-viewer',  'VIEWER',      'Read-only access',    '["alert:read","case:read","report:read"]'::jsonb)
    ON CONFLICT (id) DO NOTHING
  `);

  // Users (with bcrypt hashes)
  await db.query(`
    INSERT INTO users (id, username, email, password_hash, role_id, status) VALUES
      ('user-admin', 'admin',    'admin@soc.local',   $1, 'role-admin',   'active'),
      ('user-123',   'analyst1', 'analyst1@soc.local',$1, 'role-analyst', 'active'),
      ('user-456',   'viewer1',  'viewer1@soc.local', $1, 'role-viewer',  'active')
    ON CONFLICT (id) DO NOTHING
  `, [hash]);

  // Detection rules
  await db.query(`
    INSERT INTO detection_rules (id, name, description, rule_type, severity, status, mitre_technique_id, rule_definition) VALUES
      ('rule-123','SSH Brute Force Threshold','Fires after 5 failed SSH attempts','threshold','high','production','T1110.001','{"condition":"multiple_failed_logins","threshold":5,"timeWindow":300}'::jsonb),
      ('rule-456','SQLi Payload Detection','Regex matching SQL injection payloads','atomic','critical','production','T1190','{"condition":"sqli_payload_match","pattern":"(?i)(union.*select)"}'::jsonb)
    ON CONFLICT (id) DO NOTHING
  `);

  // Alerts
  await db.query(`
    INSERT INTO alerts (id, title, description, severity, status, alert_type, source_system) VALUES
      ('test-id-123','SSH Brute Force Detected','Multiple failed SSH authentication attempts','high','open','brute_force','wazuh'),
      ('alert-456',  'SQL Injection Attempt',   'SQLi payload detected against DVWA',        'critical','acknowledged','web_attack','wazuh'),
      ('alert-789',  'Suspicious Python Execution','Unusual python process by web user',      'medium','resolved','suspicious_execution','auditd')
    ON CONFLICT (id) DO NOTHING
  `);

  // Cases
  await db.query(`
    INSERT INTO cases (id, case_number, title, description, severity, status, created_by_id, assigned_to_id) VALUES
      ('case-123','CASE-2026-0123','Brute Force Campaign Investigation','Investigate SSH brute force','high','investigating','user-admin','user-123'),
      ('case-456','CASE-2026-0456','Web Attack Against DVWA','SQL injection attempts against DVWA','critical','open','user-admin',NULL)
    ON CONFLICT (id) DO NOTHING
  `);

  // Investigations
  await db.query(`
    INSERT INTO investigations (id, case_id, title, description, investigator_id, status, timeline_events) VALUES
      ('inv-123','case-123','Brute Force Timeline Analysis','Timeline reconstruction of SSH brute force campaign','user-123','active',
       '[{"timestamp":"2026-10-01T08:14:55.000Z","eventType":"auth_failure","source":"wazuh","description":"Failed SSH login for root"},{"timestamp":"2026-10-01T08:15:30.000Z","eventType":"alert_generated","source":"wazuh","description":"Rule 5002 threshold reached"}]'::jsonb[])
    ON CONFLICT (id) DO NOTHING
  `);

  // Reports
  await db.query(`
    INSERT INTO reports (id, title, report_type, status, generated_by_id, report_data) VALUES
      ('report-123','Weekly Detection Coverage Report','coverage','completed','user-123','{"summary":"8/8 techniques detected"}'::jsonb)
    ON CONFLICT (id) DO NOTHING
  `);

  console.log('Seed complete.');
  await db.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

**Verification**: With PostgreSQL running after `db:migrate`:
```
npm run db:seed       # → "Seed complete."
npm run db:seed       # second run → no error (ON CONFLICT DO NOTHING)
npm run build:backend # zero errors
```

---

## Task 4 — UserRepository

**Files to create**:
- `src/backend/database/repositories/UserRepository.ts`

**What to implement**:

Implement a class `UserRepository` with the same async method signatures as `InMemoryUserService`.  Map between `snake_case` DB columns and `camelCase` JS properties inside each method.

Key mapping: `password_hash` → never returned to callers (strip it in `toPublicUser`); `role_id` → `roleId`; `created_at` → `createdAt`.

Methods:
- `getUser(id)` → `SELECT * FROM users WHERE id=$1`; return public user (no passwordHash)
- `createUser(data)` → validate no duplicate email/username, `bcrypt.hash` the password, `INSERT INTO users`, return public user
- `updateUser(id, data)` → `UPDATE users SET … WHERE id=$1`, return updated public user
- `deleteUser(id)` → `DELETE FROM users WHERE id=$1`, return boolean
- `queryUsers(params)` → build dynamic SQL with optional `WHERE status=…`, `role_id=…`, `ILIKE` search on username/email; `LIMIT`/`OFFSET` pagination; also `SELECT COUNT(*)`
- `findByCredentials(identifier)` → search by email OR username (LOWER comparison), return full row including `password_hash`
- `verifyUserPassword(user, password)` → `bcrypt.compare(password, user.passwordHash)`
- `toPublicUser(user)` → strip `passwordHash`, `password_hash` from the object

**Verification**:
```
npm run build:backend  # zero errors
```

---

## Task 5 — AuthRepository (PostgreSQL sessions)

**Files to create**:
- `src/backend/database/repositories/AuthRepository.ts`

**What to implement**:

Class `AuthRepository` with same signatures as `InMemoryAuthService`.  Uses `UserRepository` for user lookups.

Methods:
- `login(credentials)` → find user via `UserRepository.findByCredentials`, verify bcrypt, check `locked_until`, reset `failed_login_attempts`, update `last_login`; INSERT row into `user_sessions` (`token_hash = sha256(rawRefreshToken)`); return `{ user, accessToken, refreshToken, tokenType, expiresIn }`
- `logout(userId, sessionId?)` → DELETE FROM user_sessions WHERE user_id=$1
- `refreshToken(rawToken)` → hash it, SELECT from user_sessions where token_hash matches and expires_at > now(); if found re-issue access token; delete old session row, insert new one
- `authenticate(credentials)` → thin wrapper returning just the accessToken string
- `validateToken(token)` → jwt.verify wrapper, return boolean
- `initialize()` → no-op (connection already established)

**Verification**:
```
npm run build:backend  # zero errors
```

---

## Task 6 — Orchestrator wires UserRepository + AuthRepository

**Files to modify**:
- `src/backend/services/orchestrator/index.ts`

**What to implement**:

In the orchestrator's `initialize()` method add the database detection block:

```typescript
import { isDatabaseConfigured, DatabaseClient } from '../../database/client';
import { UserRepository } from '../../database/repositories/UserRepository';
import { AuthRepository } from '../../database/repositories/AuthRepository';

// Inside ServiceOrchestrator.initialize():
if (isDatabaseConfigured()) {
  console.log('[orchestrator] Using PostgreSQL repositories');
  const db = DatabaseClient.getInstance();
  const userRepo = new UserRepository(db);
  await userRepo.initialize?.();
  this.userService = userRepo;
  this.authService = new AuthRepository(db, userRepo);
} else {
  console.log('[orchestrator] Using in-memory services (no DATABASE_URL set)');
  // existing code already handles this
}
```

The health check should also query the DB:
```typescript
health.database = await DatabaseClient.getInstance().healthCheck();
```
(only call this when `isDatabaseConfigured()`)

**Verification**:
```
npm run build:backend       # zero errors
# With Postgres + seeds running:
npm run dev:backend &
sleep 3
curl -s http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@soc.local","password":"SecurePassword123!"}' | grep accessToken
# → should contain "accessToken"
```

---

## Task 7 — AlertRepository

**Files to create**:
- `src/backend/database/repositories/AlertRepository.ts`

**What to implement**:

Class `AlertRepository` — implements the same interface as `InMemoryAlertService` + the `queryAlerts` method from `InMemoryQueryService`.

Column mapping (`alerts` table):
- `assigned_to_id` ↔ `assignedToId`
- `closed_by_id` ↔ `closedById`
- `acknowledged_at` ↔ `acknowledgedAt`
- `closed_at` ↔ `closedAt`
- `alert_type` ↔ `alertType`
- `source_system` ↔ `sourceSystem`
- `detection_ids` ↔ `detectionIds` (UUID[])
- `created_by` ↔ `createdBy` (store as metadata JSONB key or add column via migration Task 7a if needed)

`queryAlerts(params)` — dynamic SQL:
```sql
SELECT *, COUNT(*) OVER() AS total_count
FROM alerts
WHERE ($1::text IS NULL OR status = $1)
  AND ($2::text IS NULL OR severity = $2)
  AND ($3::uuid IS NULL OR assigned_to_id = $3)
  AND ($4::text IS NULL OR (title ILIKE '%' || $4 || '%' OR description ILIKE '%' || $4 || '%'))
ORDER BY created_at DESC
LIMIT $5 OFFSET $6
```

`getAlertStats()` — use `COUNT(*) FILTER (WHERE status='open')` etc. in a single query.

**Verification**:
```
npm run build:backend  # zero errors
```

---

## Task 8 — Orchestrator wires AlertRepository

**Files to modify**:
- `src/backend/services/orchestrator/index.ts`

**What to implement**:

Extend the `isDatabaseConfigured()` block from Task 6:

```typescript
import { AlertRepository } from '../../database/repositories/AlertRepository';

// Inside the isDatabaseConfigured block:
const alertRepo = new AlertRepository(db);
this.alertService = alertRepo;
this.queryService = alertRepo;  // AlertRepository also provides queryAlerts
```

**Verification**:
```
npm run build:backend
# With Postgres running:
curl -s http://localhost:3000/api/v1/alerts \
  -H "Authorization: Bearer <token>" | grep total
# → returns alerts from DB (including seeded test-id-123)
```

---

## Task 9 — CaseRepository + orchestrator wiring

**Files to create/modify**:
- `src/backend/database/repositories/CaseRepository.ts` — NEW
- `src/backend/services/orchestrator/index.ts` — MODIFY

**What to implement**:

`CaseRepository` — implements `InMemoryCaseService` interface.

Auto-generate `case_number`:
```sql
SELECT 'CASE-' || EXTRACT(YEAR FROM NOW())::text || '-' || LPAD((COALESCE(MAX(CAST(SPLIT_PART(case_number,'-',3) AS INT)),0)+1)::text, 4, '0')
FROM cases
```

Or simpler — use a DB sequence. Add a migration file `database/migrations/002_case_sequence.sql`:
```sql
CREATE SEQUENCE IF NOT EXISTS case_number_seq START 1;
```
And in `createCase`:
```sql
INSERT INTO cases (id, case_number, …)
VALUES (gen_random_uuid(), 'CASE-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('case_number_seq')::text,4,'0'), …)
```

Wire into orchestrator:
```typescript
import { CaseRepository } from '../../database/repositories/CaseRepository';
this.caseService = new CaseRepository(db);
```

**Verification**:
```
npm run build:backend
npm run db:migrate   # picks up 002_case_sequence.sql
curl -s -X POST http://localhost:3000/api/v1/cases \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Case","severity":"low","description":"test"}' | grep caseNumber
```

---

## Task 10 — DetectionRuleRepository + orchestrator wiring

**Files to create/modify**:
- `src/backend/database/repositories/DetectionRuleRepository.ts` — NEW
- `src/backend/services/orchestrator/index.ts` — MODIFY

**What to implement**:

`DetectionRuleRepository` — implements `InMemoryDetectionService` interface.

Column mapping (`detection_rules` table):
- `rule_type` ↔ `ruleType`
- `mitre_technique_id` ↔ `techniqueId`
- `rule_definition` ↔ `ruleDefinition` (JSONB)
- `false_positive_count` ↔ `falsePositives`

`testRule(id, data)` — run the mock logic as before but UPDATE the `detection_rules` row:
```sql
UPDATE detection_rules
SET metadata = jsonb_set(COALESCE(metadata,'{}'), '{lastTestResult}', $1::jsonb),
    updated_at = NOW()
WHERE id = $2
```

`deployRule(id)` — `UPDATE detection_rules SET status='production', updated_at=NOW() WHERE id=$1`.

Wire into orchestrator:
```typescript
import { DetectionRuleRepository } from '../../database/repositories/DetectionRuleRepository';
this.detectionService = new DetectionRuleRepository(db);
```

**Verification**:
```
npm run build:backend
curl -s http://localhost:3000/api/v1/rules \
  -H "Authorization: Bearer <token>" | grep total
# → returns rules from DB (including seeded rule-123)
```

---

## Task 11 — InvestigationRepository + orchestrator wiring

**Files to create/modify**:
- `src/backend/database/repositories/InvestigationRepository.ts` — NEW
- `src/backend/services/orchestrator/index.ts` — MODIFY

**What to implement**:

`InvestigationRepository` — implements `InMemoryInvestigationService` interface.

Timeline is stored in `investigations.timeline_events JSONB[]`.  Append events with:
```sql
UPDATE investigations
SET timeline_events = timeline_events || $1::jsonb,
    updated_at = NOW()
WHERE id = $2
```

`getTimeline(id)` — `SELECT timeline_events FROM investigations WHERE id=$1`.

`closeInvestigation(id, data)`:
```sql
UPDATE investigations
SET status='completed', closed_at=NOW(), findings=$1, updated_at=NOW()
WHERE id=$2
```

Wire into orchestrator:
```typescript
import { InvestigationRepository } from '../../database/repositories/InvestigationRepository';
this.investigationService = new InvestigationRepository(db);
```

**Verification**:
```
npm run build:backend
curl -s http://localhost:3000/api/v1/investigations/inv-123 \
  -H "Authorization: Bearer <token>" | grep '"id"'
```

---

## Task 12 — ReportRepository + orchestrator wiring

**Files to create/modify**:
- `src/backend/database/repositories/ReportRepository.ts` — NEW
- `src/backend/services/orchestrator/index.ts` — MODIFY

**What to implement**:

`ReportRepository` — implements `InMemoryReportService` interface.

Column mapping (`reports` table):
- `report_type` ↔ `reportType`
- `generated_by_id` ↔ `createdBy` (map to/from the column)
- `report_data` ↔ `content` (stored as JSONB; serialize strings to `{"text": "…"}`)
- `file_format` ↔ `format`

Wire into orchestrator:
```typescript
import { ReportRepository } from '../../database/repositories/ReportRepository';
this.reportService = new ReportRepository(db);
```

**Verification**:
```
npm run build:backend
curl -s http://localhost:3000/api/v1/reports \
  -H "Authorization: Bearer <token>" | grep '"id"'
```

---

## Task 13 — RBACRepository + orchestrator wiring

**Files to create/modify**:
- `src/backend/database/repositories/RBACRepository.ts` — NEW
- `src/backend/services/orchestrator/index.ts` — MODIFY

**What to implement**:

`RBACRepository` — implements `InMemoryRBACService` interface.

`listRoles()` → `SELECT id, name, description, permissions FROM roles ORDER BY name`

`getRole(id)` → `SELECT … FROM roles WHERE id=$1`

`updateRolePermissions(roleId, permissions)`:
- Validate each permission matches `/^(\*|[a-z0-9_-]+:[a-z0-9_-]+)$/`
- Prevent removing all permissions from the admin role
- `UPDATE roles SET permissions=$1::jsonb WHERE id=$2`

`listPermissions()` → return a hard-coded canonical list of 22 permissions (same as in-memory version — no DB table for this).

`getUserPermissions(userId)`:
```sql
SELECT r.permissions
FROM users u JOIN roles r ON u.role_id = r.id
WHERE u.id = $1
```
Return the JSONB array cast to `string[]`.

`hasPermission(roleId, permission)` → fetch role permissions, check if `'*'` or exact match exists.

Wire into orchestrator:
```typescript
import { RBACRepository } from '../../database/repositories/RBACRepository';
this.rbacService = new RBACRepository(db);
```

**Verification**:
```
npm run build:backend
curl -s http://localhost:3000/api/v1/rbac/roles \
  -H "Authorization: Bearer <token>" | grep '"name"'
```

---

## Task 14 — Full end-to-end smoke test

**Files to modify**:
- `scripts/smoke-test.sh` — UPDATE (ensure it covers auth + all 6 entity types)

**What to implement**:

Update `scripts/smoke-test.sh` to:
1. `GET /api/v1/health` — expect `"status":"healthy"`
2. `POST /api/v1/auth/login` with `admin@soc.local` — capture `accessToken`
3. `GET /api/v1/alerts` with token — expect HTTP 200 and non-empty `data`
4. `POST /api/v1/alerts` — create alert, expect `id` in response
5. `GET /api/v1/cases` — expect HTTP 200
6. `POST /api/v1/cases` — create case, expect `caseNumber` in response
7. `GET /api/v1/rules` — expect HTTP 200
8. `GET /api/v1/investigations` — expect HTTP 200
9. `GET /api/v1/reports` — expect HTTP 200
10. `GET /api/v1/rbac/roles` — expect HTTP 200

Exit 0 if all checks pass, exit 1 with failing check printed otherwise.

**Verification**:
```
npm run db:migrate
npm run db:seed
npm run dev:backend &   # or start it in another terminal
sleep 3
npm run smoke-test
# → "All smoke checks passed ✓"
```

---

## Task 15 — `npm run build:backend` full clean build + README update

**Files to modify**:
- `README.md` — add a "Quick Start (with PostgreSQL)" section
- `DEPLOYMENT.md` — update DB setup steps

**What to implement**:

Add to README.md under a new `## Quick Start` section:

```markdown
## Quick Start (with PostgreSQL)

1. `cp .env.example .env` — edit `DATABASE_URL` to point at your Postgres instance
2. `npm install`
3. `npm run db:migrate`   — create all tables
4. `npm run db:seed`      — load fixture data
5. `npm run dev:backend`  — starts on http://localhost:3000
6. `npm run smoke-test`   — verifies all core endpoints
```

Run full build as final verification:
```
npm run build:backend
```

Expect: zero TypeScript errors.

---

## Completion Checklist

- [ ] Task 1: DatabaseClient compiles
- [ ] Task 2: Migration runner is idempotent
- [ ] Task 3: Seed runner is idempotent
- [ ] Task 4: UserRepository compiles
- [ ] Task 5: AuthRepository compiles
- [ ] Task 6: Login works against Postgres
- [ ] Task 7: AlertRepository compiles
- [ ] Task 8: GET /api/v1/alerts returns DB data
- [ ] Task 9: CaseRepository + case_number sequence works
- [ ] Task 10: DetectionRuleRepository compiles + GET /rules works
- [ ] Task 11: InvestigationRepository compiles
- [ ] Task 12: ReportRepository compiles
- [ ] Task 13: RBACRepository compiles + GET /roles works
- [ ] Task 14: Smoke test passes all 10 checks
- [ ] Task 15: Full build clean, README updated
