# Quick Start Guide - SOC Detection Lab Development

**Last Updated**: [TODAY]  
**For**: Development Team  
**Duration**: 30 minutes to first build

---

## STEP 1: VERIFY PREREQUISITES (5 min)

Run this in PowerShell to check your environment:

```powershell
# Check Node.js
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 9.0.0 or higher

# Check Docker (optional, but recommended)
docker --version

# Check Git
git --version
```

**If any fail**: Install the missing tool before proceeding.

---

## STEP 2: CLONE & SETUP (5 min)

```powershell
# Navigate to project directory
cd "d:\WORKING\PORTFOLIO\FEATURED PROJECTS\SOC-Detection-Lab"

# Create environment file from template
Copy-Item .env.example .env

# Open .env in editor and fill in:
# - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD (your local PostgreSQL)
# - REDIS_HOST, REDIS_PORT (your local Redis)
# - OPENSEARCH_HOST, OPENSEARCH_PORT (your local OpenSearch)
# - JWT_SECRET (generate random 32+ char string)
# - SESSION_SECRET (generate random 32+ char string)
notepad .env
```

---

## STEP 3: INSTALL DEPENDENCIES (5 min)

```powershell
# Install all npm dependencies
npm install

# If you get permission errors on Windows:
# Run PowerShell as Administrator, then retry

# Verify installation
npm list typescript jest eslint
```

---

## STEP 4: SETUP DATABASES (10 min)

### Option A: Docker (Recommended)

```powershell
# Create docker-compose.yml in project root with:
# Services: PostgreSQL, Redis, OpenSearch
# (See docker-compose.yml template below)

docker-compose up -d

# Wait 30 seconds for services to start
Start-Sleep -Seconds 30

# Verify services are running
docker-compose ps
```

### Option B: Local Installation

```powershell
# Start PostgreSQL (if installed locally)
# Start Redis (if installed locally)
# Start OpenSearch (if installed locally)

# Update connection strings in .env to match your setup
```

---

## STEP 5: VERIFY SETUP (5 min)

```powershell
# Run health check
npm run health

# Expected: 200 OK response
# If fails: Check .env configuration and database connectivity

# Verify TypeScript compilation
npm run type-check

# Expected: No errors

# Run tests
npm run test:unit -- --passWithNoTests

# Expected: No errors (tests will be empty for now)
```

---

## STEP 6: START DEVELOPMENT

```powershell
# Terminal 1: Start backend dev server
npm run dev:backend

# In another terminal 2: Start frontend dev server
npm run dev:frontend

# Visit http://localhost:3000 in browser
```

---

## DIRECTORY STRUCTURE AT A GLANCE

```
SOC-Detection-Lab/
├── src/
│   ├── backend/                    # 67 modules across 12 domains
│   │   ├── domain-1-core-infrastructure/
│   │   ├── domain-2-authentication/
│   │   └── ...more domains
│   ├── frontend/                   # 28 modules across 3 layers
│   │   ├── layer-1-components/
│   │   ├── layer-2-pages/
│   │   └── layer-3-services/
│   └── shared/                     # 12 cross-cutting modules
│       ├── types/
│       ├── middleware/
│       └── ...more
├── tests/
│   ├── integration/
│   └── e2e/
├── database/
│   ├── migrations/
│   └── seeds/
├── docs/
│   ├── api/
│   └── architecture/
├── .env.example                    # Copy to .env
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript config
├── jest.config.unit.js             # Unit test config
├── jest.config.integration.js      # Integration test config
├── .eslintrc.json                  # Linting rules
└── .prettierrc.json                # Code formatting
```

---

## COMMON COMMANDS

```powershell
# Development
npm run dev                    # Start both backend and frontend
npm run dev:backend           # Start backend only
npm run dev:frontend          # Start frontend only

# Building
npm run build                 # Build everything
npm run build:backend         # Build backend only
npm run build:frontend        # Build frontend only

# Testing
npm run test                  # Run all tests
npm run test:unit            # Run unit tests only
npm run test:integration     # Run integration tests only
npm run test:watch           # Run tests in watch mode

# Code Quality
npm run lint                 # Check for linting errors
npm run lint:fix             # Auto-fix linting errors
npm run format               # Format code with prettier
npm run format:check         # Check code formatting
npm run type-check           # Check TypeScript types

# Database
npm run db:migrate           # Run migrations
npm run db:rollback          # Rollback migrations
npm run db:seed              # Seed test data

# Production
npm run build && npm start   # Build and run production
npm run start:prod           # Run with NODE_ENV=production
```

---

## TROUBLESHOOTING

### Issue: "Cannot find module" errors

```powershell
# Solution: Clear node_modules and reinstall
Remove-Item -Recurse node_modules
npm install
```

### Issue: Database connection refused

```powershell
# Solution: Verify database is running
# Check .env file has correct credentials
# Try connecting with: psql -h localhost -U postgres

# If using Docker:
docker-compose ps                # Check if containers running
docker-compose logs postgres     # View PostgreSQL logs
docker-compose restart           # Restart all services
```

### Issue: Port already in use

```powershell
# Solution: Change port in .env
# Backend: APP_PORT=3001
# Or kill process using port 3000:
# Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### Issue: TypeScript compilation errors

```powershell
# Solution: 
npm run type-check              # See detailed errors
# Fix any type errors shown
npm run lint:fix                # Auto-fix common issues
```

### Issue: Tests failing

```powershell
# Solution:
npm run test -- --verbose       # See detailed test output
npm run test:unit -- --no-coverage  # Faster test run
```

---

## FIRST DEVELOPMENT TASK

**Goal**: Create your first module scaffold

```powershell
# 1. Navigate to a Tier 0 module
cd src/backend/domain-1-core-infrastructure/config

# 2. Open src/main.ts and add:
cat > src/main.ts << 'EOF'
/**
 * Configuration Service
 * Manages environment-based application configuration
 */

import dotenv from 'dotenv';

export class ConfigService {
  private config: Record<string, string | undefined>;

  constructor() {
    dotenv.config();
    this.config = process.env;
  }

  get(key: string): string {
    const value = this.config[key];
    if (!value) {
      throw new Error(`Missing configuration: ${key}`);
    }
    return value;
  }

  getOptional(key: string, defaultValue?: string): string | undefined {
    return this.config[key] ?? defaultValue;
  }
}
EOF

# 3. Create unit test
cat > __tests__/unit/config.test.ts << 'EOF'
import { ConfigService } from '../../src/main';

describe('ConfigService', () => {
  it('should load configuration', () => {
    const config = new ConfigService();
    expect(config).toBeDefined();
  });
});
EOF

# 4. Run tests
npm run test:unit -- config

# Expected: 1 passed
```

---

## TEAM COMMUNICATION SETUP

**Slack Channels** (Create these):
- #soc-lab-dev - Main development channel
- #soc-lab-blockers - Issues and blockers
- #soc-lab-deployments - Release notifications

**Daily Standup**:
- Time: [ASSIGN TIME]
- Duration: 15 minutes
- Format: Yesterday, Today, Blockers, Metrics
- Location: [ASSIGN LOCATION]

**Documentation**:
- All decisions logged in GitHub issues
- Architecture changes discussed before implementing
- Code reviews required before merge to main

---

## DOCKER COMPOSE TEMPLATE

If using Docker, save this as `docker-compose.yml`:

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: soc_admin
      POSTGRES_PASSWORD: your_password
      POSTGRES_DB: soc_detection_lab
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U soc_admin"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  opensearch:
    image: opensearchproject/opensearch:2.11.0
    environment:
      - discovery.type=single-node
      - OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m
      - OPENSEARCH_INITIAL_ADMIN_PASSWORD=YourPassword123!
    ports:
      - "9200:9200"
    healthcheck:
      test: ["CMD-SHELL", "curl -s http://localhost:9200 >/dev/null || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

Then run:

```powershell
docker-compose up -d
```

---

## NEXT STEPS

1. ✅ Complete this setup
2. 📖 Read LEVEL-1-MODULES.md to see your assigned module
3. 💻 Start with the prototype for your module
4. 🧪 Write unit tests (80%+ coverage)
5. 🔄 Submit PR for review

---

## SUPPORT & ESCALATION

**Questions about setup**: Ask in #soc-lab-dev  
**Blocked on dependencies**: Post in #soc-lab-blockers  
**Need decision on architecture**: Post in #soc-lab-dev with context

**Escalation Path**:
- Team Lead → Tech Lead → Architect → Project Manager

---

**Ready?** Start with the first command in **STEP 1** above. You'll be coding in 30 minutes.

Good luck! 🚀
