# Design: PostgreSQL Repository Layer

## Architecture Overview

The swap is done by introducing a new `src/backend/database/` layer that sits between the orchestrator and PostgreSQL. The existing controller → orchestrator → in-memory service call chain remains unchanged; only the service implementations plugged into the orchestrator change.

```
Controllers (unchanged)
    ↓  orchestrator.alertService.createAlert(...)
Orchestrator (adds DB detection at startup)
    ↓  when DATABASE_URL present → PostgreSQL repository
    ↓  otherwise              → InMemory* service (unchanged)
DatabaseClient (pg.Pool singleton)
    ↓
PostgreSQL (tables from 001_init_schema.sql)
```

## File Structure

```
src/backend/database/
├── client.ts                          # pg.Pool singleton + query/transaction helpers
└── repositories/
    ├── UserRepository.ts              # REQ-4
    ├── AuthRepository.ts              # REQ-5
    ├── AlertRepository.ts             # REQ-6
    ├── CaseRepository.ts              # REQ-7
    ├── DetectionRuleRepository.ts     # REQ-8
    ├── InvestigationRepository.ts     # REQ-9
    ├── ReportRepository.ts            # REQ-10
    └── RBACRepository.ts              # REQ-11

scripts/
├── db-migrate.ts                      # REQ-2 (already referenced in package.json)
└── db-seed.ts                         # REQ-3 (already referenced in package.json)
```

## DatabaseClient Design

```typescript
// src/backend/database/client.ts
import { Pool, PoolClient, QueryResult } from 'pg';

export class DatabaseClient {
  private static instance: DatabaseClient;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // OR individual vars when DATABASE_URL absent:
      host:     process.env.DB_HOST     || 'localhost',
      port:     Number(process.env.DB_PORT)     || 5432,
      database: process.env.DB_NAME     || 'soc_lab',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
      min:  Number(process.env.DB_POOL_MIN) || 2,
      max:  Number(process.env.DB_POOL_MAX) || 10,
    });
  }

  static getInstance(): DatabaseClient { … }
  async query<T = any>(sql: string, params?: unknown[]): Promise<T[]>
  async queryOne<T = any>(sql: string, params?: unknown[]): Promise<T | null>
  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>
  async end(): Promise<void>
}

export function isDatabaseConfigured(): boolean {
  return !!(process.env.DATABASE_URL || process.env.DB_HOST);
}
```

`isDatabaseConfigured()` is the single feature flag the orchestrator uses.

## Repository Pattern

Every repository wraps `DatabaseClient` and exposes the same async method signatures as the corresponding `InMemory*` service so the orchestrator can swap them without touching controllers.

Example — `AlertRepository`:

```typescript
export class AlertRepository {
  constructor(private db: DatabaseClient) {}

  async createAlert(data: Partial<Alert>): Promise<Alert>
  async getAlert(id: string): Promise<Alert | null>
  async updateAlert(id: string, data: Partial<Alert>): Promise<Alert | null>
  async deleteAlert(id: string): Promise<boolean>
  async queryAlerts(params: QueryParams): Promise<{ alerts: Alert[]; total: number }>
  async getAlertStats(): Promise<AlertStats>
}
```

SQL uses parameterised queries (`$1`, `$2`, …) throughout. Column names follow the PostgreSQL schema (`assigned_to_id`, `created_at`, etc.) and are mapped to camelCase in the returned objects.

## Orchestrator Wiring (REQ-12)

```typescript
// src/backend/services/orchestrator/index.ts — modified startup block
import { isDatabaseConfigured, DatabaseClient } from '../../database/client';
import { AlertRepository } from '../../database/repositories/AlertRepository';
// … other repo imports

async initialize(): Promise<void> {
  if (isDatabaseConfigured()) {
    console.log('[orchestrator] Using PostgreSQL repositories');
    const db = DatabaseClient.getInstance();
    this.alertService  = new AlertRepository(db);
    this.queryService  = this.alertService;   // queryAlerts lives on AlertRepository
    this.caseService   = new CaseRepository(db);
    // … all repos
  } else {
    console.log('[orchestrator] Using in-memory services (no DATABASE_URL set)');
    // existing InMemory* wiring unchanged
  }
  // then call initialize() on each service as before
}
```

## Migration Runner Design

```typescript
// scripts/db-migrate.ts
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { DatabaseClient } from '../src/backend/database/client';

async function migrate() {
  const db = DatabaseClient.getInstance();
  // Create tracking table if it doesn't exist
  await db.query(`CREATE TABLE IF NOT EXISTS _migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT now()
  )`);

  const files = (await readdir('database/migrations'))
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const already = await db.queryOne('SELECT 1 FROM _migrations WHERE filename=$1', [file]);
    if (already) { console.log(`skip ${file}`); continue; }
    const sql = await readFile(join('database/migrations', file), 'utf8');
    await db.query(sql);
    await db.query('INSERT INTO _migrations(filename) VALUES($1)', [file]);
    console.log(`applied ${file}`);
  }

  await db.end();
}
```

## Password Hashing Migration

`InMemoryUserService` uses `createHash('sha256').update('soc-lab::' + password)` — insecure and not compatible with `bcryptjs`. `UserRepository` uses `bcrypt.hash(password, 12)` / `bcrypt.compare(password, hash)`. The seed file must generate bcrypt hashes for the fixture users so the integration tests keep working.

## Naming Conventions

- Table columns: `snake_case` (matches schema)
- TypeScript objects returned from repositories: `camelCase` (matches existing controller/response types)
- Mapping is done inside each repository method — no separate mapper layer to keep things simple.

## Environment Variables (`.env.example` additions)

```
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/soc_lab
# Or individual parts (used when DATABASE_URL is absent):
DB_HOST=localhost
DB_PORT=5432
DB_NAME=soc_lab
DB_USER=postgres
DB_PASSWORD=password
DB_POOL_MIN=2
DB_POOL_MAX=10
```
