# SOC Detection Lab — Deployment Guide

This guide covers deploying the v2 product in three modes: local development, single-container Docker, and the full compose stack.

---

## 1. Local Development

**Prerequisites**: Node.js ≥ 18, npm ≥ 9.

```bash
npm install                     # root (backend tooling)
cd src/frontend && npm install  # frontend dependencies

npm run dev                     # backend on :3000, frontend on :3001
```

- Frontend console: http://localhost:3001
- API base: http://localhost:3000/api/v1
- Health check: `curl http://localhost:3000/api/v1/health`

Sign in with `admin@soc.local` / `SecurePassword123!`.

> **Note**: in v2 the API runs on in-memory seeded stores (fast, zero infrastructure).
> PostgreSQL/Redis connect in the compose stack; the repositories swap in during the
> v3 hardening phase per `PRODUCTION_READINESS_ROADMAP.md`.

---

## 2. Full Docker Stack (recommended)

**Prerequisites**: Docker Engine ≥ 24 with the compose plugin.

```bash
# Optional: override defaults via .env
cp .env.example .env

docker compose up -d --build

# Watch it come up
docker compose logs -f app

# Verify the deployment
bash scripts/smoke-test.sh
```

The stack starts:

| Service | Port | Purpose |
|---|---|---|
| app | 3000 | API + built frontend (single container) |
| postgres | 5432 | Persistent datastore |
| redis | 6379 | Cache / job queue |

### Applying database migrations

```bash
docker compose exec app npx tsx scripts/db-migrate.ts   # inside the container
npm run db:migrate                                       # from the host against local PG
```

Migrations run inside a transaction per file and are tracked in `schema_migrations`,
so re-running is safe.

### Changing secrets

Set these before first start (see `.env` / compose `environment`):

- `JWT_SECRET` — token signing key (generate: `openssl rand -hex 32`)
- `POSTGRES_PASSWORD` — database password
- `CORS_ORIGIN` — browser origin allowed to call the API

The seeded demo accounts ship with a public default password. Rotate them on first
boot (Users page → status/role controls, or direct SQL once connected to PostgreSQL).

---

## 3. Single Production Container

The image bundles backend build + frontend assets; it serves the SPA itself
(`SERVE_STATIC=true`) so one container can sit behind any reverse proxy.

```bash
docker build -t soc-detection-lab:latest .
docker run -d --name soc-lab \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  -e DATABASE_URL=postgresql://user:pass@db-host:5432/soclab \
  soc-detection-lab:latest
```

Put TLS termination (nginx, Traefik, cloud LB) in front — the app itself speaks HTTP.

---

## 4. Post-deployment Verification

```bash
BASE_URL=https://your-host/api/v1 bash scripts/smoke-test.sh
```

The smoke test checks: health → login → alert create/acknowledge/delete → case and
RBAC reads → unauthenticated rejection. All checks green = deployment verified.

### Health & monitoring

- `GET /api/v1/health` — service status JSON
- Container `HEALTHCHECK` polls it every 30s
- Structured request logs are emitted to stdout (`docker compose logs app`)

---

## 5. Rollback

```bash
docker compose down                      # stop stack (volumes persist)
git checkout <previous-tag>              # or pull the previous image tag
docker compose up -d --build
```

Database state survives via the `postgres-data` volume; migrations are tracked, so
an older image simply skips newer schema entries it doesn't expect.

---

## 6. Operational Checklist

- [ ] `JWT_SECRET` rotated from default
- [ ] Seeded demo accounts removed or password-rotated
- [ ] `CORS_ORIGIN` set to the real frontend origin
- [ ] TLS terminated at the proxy
- [ ] `docker compose logs` shipping to your log aggregator
- [ ] `scripts/smoke-test.sh` wired into your post-deploy pipeline
- [ ] Backups: `pg_dump` cron against the postgres volume
