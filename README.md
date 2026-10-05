# SOC Detection Lab

Enterprise-grade Security Operations Center (SOC) detection and incident response platform.

**Status**: v2 — Final Working Product (all tests passing, production-packaged)

## Quick Start (with PostgreSQL)

```bash
# 1. Install dependencies
npm install

# 2. Configure the database
cp .env.example .env
# Edit .env — set DATABASE_URL=postgresql://user:pass@localhost:5432/soc_lab

# 3. Create tables + load fixture data
npm run db:migrate
npm run db:seed

# 4. Start the backend
npm run dev:backend
# → http://localhost:3000/api/v1

# 5. Verify everything works
npm run smoke-test

# 6. Sign in
#    admin@soc.local / SecurePassword123!
```

### Quick Start (in-memory, no database)

```bash
# Remove / comment out DATABASE_URL from .env — the server falls back to
# in-memory stores automatically.
npm install
npm run dev:backend
```

### One-command Docker stack

```bash
docker compose up -d
bash scripts/smoke-test.sh   # health + login + all 6 entity types
```

## What's Inside (v2)

| Area | Detail |
|---|---|
| REST API | 50+ endpoints under `/api/v1` (alerts, cases, rules, investigations, users, reports, auth, rbac) |
| Auth | JWT access + refresh tokens, bcrypt passwords, session table, refresh-token rotation |
| Data layer | PostgreSQL repositories for all 8 domain services; graceful in-memory fallback when no DB configured |
| Frontend | React 18 + TypeScript console: Dashboard, Alerts, Cases, Investigations, Reports, Users, Profile |
| Tests | 370 automated tests (42 unit + 328 API-contract integration) — all passing |
| Packaging | Dockerfile (multi-stage), docker-compose stack, GitHub Actions CI |

## Commands

```bash
npm run dev              # backend + frontend (watch mode)
npm test                 # unit + integration suites
npm run build            # backend (tsc) + frontend (vite)
npm run type-check       # strict TS validation
npm run db:migrate       # apply database/migrations/*.sql (idempotent)
npm run db:seed          # apply database/seeds/*.sql
npm run smoke-test       # end-to-end deployment smoke check
npm run docker:build     # build the production image
```

## Default Accounts

| Account | Email | Role |
|---|---|---|
| Administrator | `admin@soc.local` | admin (full access) |
| Analyst | `analyst1@soc.local` | analyst |
| Viewer | `viewer1@soc.local` | viewer (read-only) |

All seeded accounts use the password `SecurePassword123!` — **change them before any real deployment** (see DEPLOYMENT.md).

## Project Structure

```
src/
  ├── backend/
  │   ├── index.ts          # server entry point
  │   ├── api/              # gateway, routes, controllers, middleware
  │   ├── services/         # orchestrator + in-memory domain services (fallback)
  │   ├── database/         # PostgreSQL layer
  │   │   ├── client.ts     # pg.Pool singleton + isDatabaseConfigured()
  │   │   └── repositories/ # UserRepository, AuthRepository, AlertRepository,
  │   │                     # CaseRepository, DetectionRuleRepository,
  │   │                     # InvestigationRepository, ReportRepository, RBACRepository
  │   └── domain-*/         # module libraries (v3 integration scope)
  ├── frontend/             # React 18 console (Vite, Tailwind, React Query)
  └── shared/               # shared types and utilities

database/
  ├── migrations/           # 001_init_schema.sql, 002_case_sequence.sql
  └── seeds/                # SQL seed data

scripts/
  ├── db-migrate.ts         # idempotent migration runner (tracks in schema_migrations)
  ├── db-seed.ts            # bcrypt-hashed fixture data, ON CONFLICT DO NOTHING
  └── smoke-test.sh         # end-to-end verification (10 checks)
```
  └── smoke-test.sh       # deployment smoke test

.github/workflows/ci.yml  # lint → type-check → tests → builds → docker
```

## Documentation

- [Deployment Guide](DEPLOYMENT.md)
- [Production Roadmap](PRODUCTION_READINESS_ROADMAP.md) (v2 gate model + plan)
- [Architecture](docs/ARCHITECTURE.md)
- [API Overview](docs/API.md)

## License

MIT
