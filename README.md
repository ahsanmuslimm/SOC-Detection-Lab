# SOC Detection Lab

Enterprise-grade Security Operations Center (SOC) detection and incident response platform.

**Status**: v2 — Final Working Product (all tests passing, production-packaged)

## Quick Start

```bash
# 1. Install and run (backend + frontend)
npm install
npm run dev

# 2. Open the console
#    http://localhost:3001 (frontend) → proxied API on http://localhost:3000/api/v1

# 3. Sign in with the seeded administrator
#    admin@soc.local / SecurePassword123!
```

### One-command Docker stack

```bash
docker compose up -d
bash scripts/smoke-test.sh    # verifies health, login, alerts, cases, RBAC
```

## What's Inside (v2)

| Area | Detail |
|---|---|
| REST API | 50+ endpoints under `/api/v1` (alerts, cases, rules, investigations, users, reports, auth, rbac) |
| Auth | JWT access + refresh tokens, logout revocation, role-based permissions |
| Frontend | React 18 + TypeScript console: Dashboard, Alerts, Cases, Investigations, Reports, Users, Profile |
| Tests | 370 automated tests (42 unit + 328 API-contract integration) — all passing |
| Data | In-memory seeded stores for MVP; PostgreSQL migrations + Redis ship in the compose stack |
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
  │   ├── index.ts        # server entry point
  │   ├── api/            # gateway, routes, controllers, middleware
  │   ├── services/       # orchestrator + in-memory domain services
  │   └── domain-*/       # module libraries (v3 integration scope)
  ├── frontend/           # React 18 console (Vite, Tailwind, React Query)
  └── shared/             # shared types and utilities

database/
  ├── migrations/         # raw SQL schema migrations
  └── seeds/              # seed data

scripts/
  ├── db-migrate.ts       # idempotent migration runner
  ├── db-seed.ts          # seed runner
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
