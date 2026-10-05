# Requirements: Replace In-Memory Stores with PostgreSQL Repositories

## Background

The SOC Detection Lab API currently uses in-memory `Map`-backed services for all data persistence (`InMemoryAlertService`, `InMemoryCaseService`, `InMemoryDetectionService`, `InMemoryInvestigationService`, `InMemoryReportService`, `InMemoryUserService`, `InMemoryAuthService`, `InMemoryRBACService` in `src/backend/services/orchestrator/domain-services.ts`). Data is lost on every restart.

The PostgreSQL schema is already fully defined in `database/migrations/001_init_schema.sql` (15 tables with indexes and triggers). The `pg` package is already in `package.json` dependencies. The goal is to create real repository classes that talk to PostgreSQL and swap the in-memory services out of the orchestrator — one domain at a time — so each swap is independently committable and verifiable.

## Requirements

### REQ-1: Database connection module
- A shared `DatabaseClient` class wrapping `pg.Pool` must be created at `src/backend/database/client.ts`.
- It must read connection config from environment variables: `DATABASE_URL` (takes precedence) or individual `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_POOL_MIN`, `DB_POOL_MAX`.
- It must expose `query(sql, params)`, `transaction(fn)`, and `end()` methods.
- It must be a singleton (one pool per process).
- The `.env.example` must document every variable.

### REQ-2: Migration runner
- `scripts/db-migrate.ts` must run every `.sql` file in `database/migrations/` in filename order.
- It must be idempotent: running it twice must not error (migrations use `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` style guards, or a migrations tracking table).
- `npm run db:migrate` must succeed against a running PostgreSQL instance.

### REQ-3: Seed runner
- `scripts/db-seed.ts` must insert the canonical fixture records (roles, users with hashed passwords, sample alerts, cases, rules, investigations, reports) so the integration tests have known IDs to assert against.
- It must be idempotent (use `INSERT … ON CONFLICT DO NOTHING`).
- `npm run db:seed` must succeed after `npm run db:migrate`.

### REQ-4: UserRepository + PostgreSQL UserService
- A `UserRepository` class at `src/backend/database/repositories/UserRepository.ts` must implement every method currently on `InMemoryUserService`: `getUser`, `createUser`, `updateUser`, `deleteUser`, `queryUsers`, `findByCredentials`, `verifyUserPassword`.
- Password hashing must use `bcryptjs` (already in `package.json`) instead of the current SHA-256 approach.
- The `UserRepository` must read/write the `users` and `roles` tables from the migration.
- The orchestrator must be updated to use `UserRepository` instead of `InMemoryUserService` when `DATABASE_URL` / `DB_HOST` is set, falling back to the in-memory service when no database config is present.

### REQ-5: AuthRepository + PostgreSQL AuthService
- A `PostgresAuthService` at `src/backend/database/repositories/AuthRepository.ts` must replace `InMemoryAuthService`.
- Refresh tokens must be stored in the `user_sessions` table (`token_hash` column stores a SHA-256 hash of the raw token).
- Login must record `last_login`, reset `failed_login_attempts`, and enforce `locked_until` (if set and in the future, reject with 401).
- Logout must delete the session row.
- The orchestrator must swap in `PostgresAuthService` under the same database-present condition as REQ-4.

### REQ-6: AlertRepository + PostgreSQL AlertService
- A `AlertRepository` at `src/backend/database/repositories/AlertRepository.ts` must implement `createAlert`, `getAlert`, `updateAlert`, `deleteAlert`, `queryAlerts` (with filtering by `status`, `severity`, `assignedTo`, `search`), `getAlertStats`.
- Must read/write the `alerts` table.
- The orchestrator swaps `InMemoryAlertService` for this when the database is available.
- `InMemoryQueryService` must also be replaced by a SQL-backed `queryAlerts` method on `AlertRepository`.

### REQ-7: CaseRepository + PostgreSQL CaseService
- `src/backend/database/repositories/CaseRepository.ts` implementing `createCase`, `getCase`, `updateCase`, `deleteCase`, `queryCases`, `getCaseStats`.
- Must auto-generate `case_number` in the format `CASE-YYYY-NNNN` (using a DB sequence or max+1 query).
- Must read/write the `cases` table.

### REQ-8: DetectionRuleRepository + PostgreSQL DetectionService
- `src/backend/database/repositories/DetectionRuleRepository.ts` implementing `createRule`, `getRule`, `updateRule`, `deleteRule`, `queryRules`, `testRule`, `deployRule`.
- `testRule` may remain a mock (no real rule engine exists) but must persist the test result in a `test_results` JSONB field on the rule row or a separate log.
- Must read/write `detection_rules` table.

### REQ-9: InvestigationRepository + PostgreSQL InvestigationService
- `src/backend/database/repositories/InvestigationRepository.ts` implementing `createInvestigation`, `getInvestigation`, `updateInvestigation`, `queryInvestigations`, `getTimeline`, `getCaseInvestigations`, `closeInvestigation`.
- Timeline events must be stored as rows in the `investigations.timeline_events` JSONB array column (append-only updates).
- Must read/write `investigations` table.

### REQ-10: ReportRepository + PostgreSQL ReportService
- `src/backend/database/repositories/ReportRepository.ts` implementing `generateReport`, `getReport`, `updateReport`, `deleteReport`, `queryReports`.
- Must read/write the `reports` table.

### REQ-11: RBACRepository + PostgreSQL RBACService
- `src/backend/database/repositories/RBACRepository.ts` implementing `listRoles`, `getRole`, `updateRolePermissions`, `listPermissions`, `getUserPermissions`.
- Roles and permissions are read from the `roles` table (`permissions` is a `JSONB` array of permission strings).
- Seed data provides the 3 base roles (admin, SOC_ANALYST, viewer).

### REQ-12: Orchestrator wiring
- `src/backend/services/orchestrator/index.ts` must detect whether database configuration is present at startup and swap in all PostgreSQL-backed repositories when it is.
- When no database config is present the in-memory services must still work (local dev without Postgres).
- A startup log line must indicate which mode is active: `"[orchestrator] Using PostgreSQL repositories"` vs `"[orchestrator] Using in-memory services (no DATABASE_URL set)"`.

### REQ-13: End-to-end smoke test passes
- `scripts/smoke-test.sh` must succeed after `db:migrate` + `db:seed` + `dev:backend` with a real PostgreSQL instance.
- The smoke test hits: `GET /api/v1/health`, `POST /api/v1/auth/login`, `GET /api/v1/alerts`, `POST /api/v1/alerts`, `GET /api/v1/cases`, `POST /api/v1/cases`.

### REQ-14: TypeScript strict compliance
- All new files must compile with `tsconfig.backend.json` (strict mode, no `any`).
- `npm run build:backend` must pass with zero errors after each task.

### REQ-15: Existing tests remain green
- `npm run test:unit` must pass throughout (unit tests mock the orchestrator, so they are unaffected by the swap).
- Integration tests that currently pass must continue to pass.
