# Professional Project Structure

## Directory Layout

```
SOC-Detection-Lab/
│
├── 📁 src/                         ← Application source code
│   ├── backend/                    (67 modules, 12 domains)
│   ├── frontend/                   (28 modules, 3 layers)
│   └── shared/                     (12 shared modules)
│
├── 📁 tests/                       ← Automated tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── 📁 infra/                       ← Infrastructure & deployment
│   ├── kubernetes/                 (K8s manifests)
│   ├── terraform/                  (Infrastructure as code)
│   └── docker/                     (Docker configs)
│
├── 📁 docs/                        ← Project documentation
│   ├── SETUP.md                    (Setup & installation)
│   ├── ARCHITECTURE.md             (System architecture)
│   ├── DEVELOPMENT.md              (Development workflow)
│   └── API.md                      (API reference)
│
├── 📁 config/                      ← Configuration files
├── 📁 database/                    ← DB migrations & seeds
├── 📁 scripts/                     ← Build & utility scripts
├── 📁 .github/                     ← GitHub workflows (CI/CD)
│
├── 📄 README.md                    ← Project overview
├── 📄 package.json                 ← Dependencies & scripts
├── 📄 tsconfig.json                ← TypeScript config
├── ⚙️  .env.example                ← Environment template
├── ⚙️  .eslintrc.json              ← Linting rules
├── ⚙️  .prettierrc.json            ← Code formatting
├── ⚙️  jest.config.unit.js         ← Testing config
├── ⚙️  .gitignore                  ← Git ignore patterns
│
└── 📁 Document/                    ← Original specifications (reference)
```

## Essential Documentation (Only what you need)

| File | Purpose |
|------|---------|
| `README.md` | Project overview, quick start |
| `docs/SETUP.md` | Installation, prerequisites, troubleshooting |
| `docs/ARCHITECTURE.md` | System design, modules, technology stack |
| `docs/DEVELOPMENT.md` | Code standards, workflow, commands |
| `docs/API.md` | API endpoints, authentication, formats |

## Configuration Files (Professional setup)

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, 50+ npm scripts |
| `tsconfig.json` | TypeScript strict mode enabled |
| `.env.example` | Environment template (80+ variables) |
| `.eslintrc.json` | Code linting rules (no `any` types) |
| `.prettierrc.json` | Code formatting standards |
| `jest.config.unit.js` | Unit test configuration |
| `jest.config.integration.js` | Integration test configuration |
| `.gitignore` | Git ignore patterns |

## Module Structure (95 total, standard across all)

Every module follows this structure:

```
src/backend/domain-X/module-name/
├── src/
│   ├── index.ts                    # Public API exports
│   ├── main.ts                     # Main implementation
│   └── types.ts                    # Type definitions
├── __tests__/
│   ├── unit/                       # Unit tests (80%+ coverage required)
│   └── integration/                # Integration tests
└── README.md                       # Module documentation
```

## Key Features

✅ **Clean Root Directory** - No clutter, only essential files  
✅ **Organized by Function** - Clear separation (src, tests, infra, docs)  
✅ **Industry-Standard Layout** - Enterprise-ready structure  
✅ **Professional Configuration** - TypeScript strict, ESLint, Prettier  
✅ **95 Modules Scaffolded** - Ready for parallel development  
✅ **Modular Architecture** - Independent, testable services  
✅ **Automated Quality** - Tests, linting, type checking enforced  
✅ **Essential Docs Only** - No unnecessary files  

## Getting Started

### 1. Setup
```bash
npm install
cp .env.example .env
docker-compose up -d
npm run health
```

### 2. Development
```bash
npm run dev           # Start dev servers
npm run test:unit     # Run unit tests
npm run lint          # Check code quality
npm run format        # Format code
```

### 3. Build & Deploy
```bash
npm run build         # Build all
npm run build:backend # Build backend only
```

See `docs/SETUP.md` for detailed instructions.

## Git Structure

```
.github/
└── workflows/        ← CI/CD pipelines (GitHub Actions)
```

## Infrastructure

```
infra/
├── kubernetes/       ← Kubernetes deployment manifests
├── terraform/        ← Infrastructure as code (AWS, GCP, etc.)
└── docker/           ← Docker configurations
```

## Database

```
database/
├── migrations/       ← Database schema migrations
└── seeds/            ← Seed data for development
```

## Scripts

```
scripts/              ← Build, deployment, and utility scripts
```

## Development Workflow

1. **Create module** in `src/backend` or `src/frontend`
2. **Implement** in `src/main.ts`
3. **Define types** in `src/types.ts`
4. **Export API** in `src/index.ts`
5. **Write tests** in `__tests__/unit/` (80%+ coverage)
6. **Create README.md** for module documentation
7. **Commit & push** following git conventions
8. **Create PR** for code review

See `docs/DEVELOPMENT.md` for detailed guidance.

## Quality Standards

- **TypeScript**: Strict mode, no `any` types allowed
- **Testing**: 80% unit test coverage minimum
- **Linting**: Zero warnings, must pass ESLint
- **Formatting**: Code must be formatted with Prettier
- **Security**: Input validation, RBAC, encryption required

Enforced automatically by:
- Pre-commit hooks (linting)
- CI/CD pipeline (tests, coverage)
- Code review (architecture)

## Performance Targets

- API response: <100ms (p95)
- Search queries: <5s
- Event processing: <1s
- Timeline generation: <5s

## What's NOT Here

❌ No unnecessary markdown files  
❌ No bloated documentation  
❌ No redundant configuration  
❌ No multiple conflicting standards  

## This is Professional

✨ This structure is used by companies like:
- Netflix (microservices)
- Google (monorepo)
- Uber (distributed systems)
- Meta (scalable architecture)

It's designed for:
- Fast onboarding
- Clear responsibility
- Parallel development
- Easy scaling
- Professional standards

---

**Ready to develop?** Start with `docs/SETUP.md`
