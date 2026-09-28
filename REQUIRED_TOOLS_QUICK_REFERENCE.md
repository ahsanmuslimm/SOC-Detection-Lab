# Required Tools - Quick Reference Card

## At a Glance

### ⚡ Phase 1, Week 1: Orchestrator
```
Core:     Node.js 18+, npm 9+, TypeScript 5.2+
Dev:      VS Code, Git, ESLint, Prettier
Testing:  Jest, ts-jest
```

### ⚡ Phase 1, Week 2: Database
```
Database:  PostgreSQL 15+
Client:    pg (npm package)
Migrations: knex (npm package)
Tools:     PgAdmin (optional)
```

### ⚡ Phase 1, Week 3: API
```
Framework:  Express 4.18+
Security:   helmet, cors, express-rate-limit
Auth:       jsonwebtoken, bcryptjs
Validation: joi, class-validator
Docs:       swagger-jsdoc, swagger-ui-express
Testing:    Postman, REST Client (VS Code)
```

### ⚡ Phase 1, Week 4: Testing
```
Framework:  Jest 29+, ts-jest
Integration: supertest, faker
Database:   Docker, Docker Compose, Testcontainers
Coverage:   nyc
```

---

## Phase 1 Complete Stack

```yaml
Runtime:
  - Node.js ≥18.0.0
  - npm ≥9.0.0
  - TypeScript ^5.2.2

Backend Framework:
  - Express ^4.18.2
  - express-async-errors

Database:
  - PostgreSQL ≥15.0
  - pg ^8.11.3
  - knex ^2.5.0

Security:
  - helmet ^7.1.0
  - cors ^2.8.5
  - express-rate-limit ^7.1.5
  - jsonwebtoken ^9.1.2
  - bcryptjs ^2.4.3

Validation:
  - joi ^17.11.0
  - class-validator ^0.14.0
  - class-transformer ^0.5.1

Testing:
  - jest ^29.5.0
  - ts-jest
  - supertest
  - faker

Utilities:
  - axios ^1.6.5
  - lodash-es ^4.17.21
  - uuid ^9.0.1
  - date-fns ^2.30.0
  - pino ^8.16.2

Development:
  - ESLint ^8.56.0
  - Prettier ^3.1.0
  - @typescript-eslint/eslint-plugin ^6.17.0
```

---

## Phase 2 Complete Stack

### Security (Week 5)
```yaml
Encryption:
  - bcryptjs ^2.4.3
  - jsonwebtoken ^9.1.2
  - dotenv ^16.3.1

Logging:
  - pino ^8.16.2
  - pino-pretty ^10.2.3

Security:
  - helmet ^7.1.0
  - express-rate-limit ^7.1.5
  - express-validator

Scanning:
  - npm audit (built-in)
  - Snyk
  - OWASP ZAP
```

### Frontend (Weeks 6-7)
```yaml
Core:
  - React ^18.2.0
  - react-dom ^18.2.0
  - TypeScript ^5.2.2

UI Components:
  - @mui/material ^5.14.0
  - @mui/icons-material ^5.14.0

Routing:
  - react-router-dom ^6.20.0

State Management:
  - zustand (lightweight)
  - @hookform/react-hook-form

HTTP:
  - axios ^1.6.5
  - @tanstack/react-query

Visualization:
  - recharts
  - Chart.js

Styling:
  - tailwindcss
  - @emotion/react
  - @emotion/styled

Build:
  - Vite ^5.0.0
  - TypeScript ^5.2.2

Testing:
  - @testing-library/react
  - Vitest

Development:
  - React Developer Tools
  - Storybook
  - Vite dev server
```

### CI/CD (Week 8)
```yaml
VCS:
  - Git
  - GitHub (or GitLab)

CI/CD:
  - GitHub Actions (built-in)

Container:
  - Docker
  - Docker Compose

Code Quality:
  - ESLint
  - Prettier
  - SonarQube (optional)

Security:
  - npm audit
  - Snyk
  - OWASP Dependency Check
```

---

## Phase 3 Complete Stack

### Monitoring (Week 9)
```yaml
Logging:
  - pino ^8.16.2
  - ELK Stack / CloudWatch

Metrics:
  - prom-client ^15.0.0
  - Prometheus
  - Grafana

Tracing:
  - @opentelemetry/api
  - @opentelemetry/sdk-node
  - Jaeger

Error Tracking:
  - @sentry/node ^7.88.0

Alerting:
  - AlertManager
  - PagerDuty
```

### Infrastructure (Week 10)
```yaml
Container Orchestration:
  - Kubernetes ≥1.27
  - kubectl
  - Helm

IaC:
  - Terraform ≥1.4.0
  - Ansible

Cloud Provider (Choose 1):
  - AWS (Amazon)
  - Google Cloud
  - Microsoft Azure
  - DigitalOcean (MVP)

Container Registry:
  - Docker Hub
  - ECR (AWS)
  - GCR (Google)
  - ACR (Azure)
```

### Performance (Week 11)
```yaml
Load Testing:
  - k6
  - JMeter
  - Locust
  - Artillery

Profiling:
  - Clinic.js
  - Node profiler

Database:
  - pgBadger (PostgreSQL analysis)
  - EXPLAIN ANALYZE

Caching:
  - Redis ≥7.0
  - Memcached (alternative)
```

### QA & Docs (Week 12)
```yaml
E2E Testing:
  - Cypress
  - Playwright
  - Selenium

Security Audit:
  - OWASP ZAP
  - Burp Suite
  - Trivy (container scanning)

Documentation:
  - TypeDoc
  - Swagger/OpenAPI
  - MkDocs
  - Markdown
```

---

## Installation Quick Guide

### Prerequisites (Before Starting)
```bash
# Check Node.js and npm
node --version  # should be ≥18.0.0
npm --version   # should be ≥9.0.0

# Install/Update if needed:
# macOS:   brew install node
# Windows: Download from nodejs.org
# Linux:   apt-get install nodejs npm
```

### Phase 1 Setup
```bash
# Clone repository
git clone <your-repo-url>
cd <project>

# Install all dependencies
npm install

# Development tools
npm install --save-dev typescript eslint prettier jest ts-jest

# Verify setup
npm run build
npm run test:unit
```

### Phase 2 Frontend Setup
```bash
# Navigate to frontend directory
cd src/frontend

# Install dependencies
npm install

# Or create new React project with Vite
npm create vite@latest . -- --template react
npm install
npm install react-router-dom axios recharts @mui/material
```

### Phase 3 DevOps Setup
```bash
# Install Docker
# macOS:   brew install docker
# Windows: Download Docker Desktop
# Linux:   apt-get install docker.io

# Install Kubernetes
# kubectl included with Docker Desktop
# Helm:
brew install helm

# Install Terraform
brew install terraform

# Verify installations
docker --version
kubectl version --client
helm version
terraform --version
```

---

## Dependency Tree (High-Level)

```
SOC Detection Lab
│
├── Backend (Node.js)
│   ├── Express (API framework)
│   ├── PostgreSQL (Database)
│   ├── Redis (Caching - optional)
│   └── TypeScript (Language)
│
├── Frontend (React)
│   ├── Vite (Build tool)
│   ├── Material-UI (Components)
│   ├── React Router (Navigation)
│   └── TypeScript (Language)
│
├── DevOps
│   ├── Docker (Containerization)
│   ├── Kubernetes (Orchestration)
│   ├── Terraform (IaC)
│   └── GitHub Actions (CI/CD)
│
└── Observability
    ├── Prometheus (Metrics)
    ├── Grafana (Visualization)
    ├── ELK/CloudWatch (Logging)
    └── Jaeger (Tracing)
```

---

## Environment Variables (Template)

```bash
# .env file template

# Application
NODE_ENV=development
APP_PORT=3000
APP_HOST=localhost

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=soc_lab
DB_USER=soc_admin
DB_PASSWORD=changeme

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRATION=24h

# Encryption
ENCRYPTION_KEY=your-encryption-key-32-chars

# Frontend
VITE_API_URL=http://localhost:3000/api

# Monitoring
SENTRY_DSN=your-sentry-dsn
PROMETHEUS_ENABLED=true

# AWS (if using)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=changeme
AWS_SECRET_ACCESS_KEY=changeme
```

---

## Common Installation Issues & Fixes

### Issue: Node.js version too old
```bash
# Check version
node --version

# Update to LTS
brew install node@18  # macOS
# Windows: Download from nodejs.org
apt-get install nodejs  # Linux
```

### Issue: npm packages not installing
```bash
# Clear cache
npm cache clean --force

# Reinstall
rm package-lock.json
npm install
```

### Issue: PostgreSQL won't connect
```bash
# Start PostgreSQL service
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux

# Or use Docker
docker run -d --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:15
```

### Issue: Docker not found
```bash
# Install Docker
brew install docker  # macOS
# Windows: Download Docker Desktop
apt-get install docker.io  # Linux

# Start Docker daemon
docker daemon  # or use Docker Desktop
```

---

## Free Tier Limitations

### GitHub Actions
- **Free**: 2,000 minutes/month
- **Upgrade**: If >2,000 minutes needed

### AWS
- **Free**: 12 months for new accounts + always free tier
- **Estimate**: ~$10-50/month for small app

### Terraform Cloud
- **Free**: Up to 50 runs/month
- **Upgrade**: If >50 runs needed

### Docker Hub
- **Free**: 1 private repository
- **Upgrade**: More private repos needed

---

## Recommended Installation Order

1. **Day 1**: Node.js, npm, TypeScript, VS Code, Git
2. **Day 2**: PostgreSQL, Docker
3. **Phase 1**: Express, Jest, testing tools
4. **Phase 2**: React, Vite, UI libraries
5. **Phase 3**: Kubernetes, Terraform, monitoring tools

---

## Documentation Links

- [Node.js Official](https://nodejs.org)
- [Express.js](https://expressjs.com)
- [React](https://react.dev)
- [PostgreSQL](https://www.postgresql.org)
- [Docker](https://www.docker.com)
- [Kubernetes](https://kubernetes.io)
- [Terraform](https://www.terraform.io)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Quick Reference Version**: 1.0
**Last Updated**: Phase 1-3 Planning
**Status**: Ready for Use
