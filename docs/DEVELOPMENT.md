# Development Guide

## Getting Started

1. Complete [SETUP.md](SETUP.md)
2. Read [ARCHITECTURE.md](ARCHITECTURE.md)
3. Choose a module from `src/backend` or `src/frontend`
4. Follow the module structure

## Code Standards

### TypeScript

```typescript
// ✅ Required
const config: Configuration = getConfig();
function processEvents(events: Event[]): Result {
  return transform(events);
}

// ❌ Not allowed
const config: any = getConfig();
function processEvents(events): any {
  return transform(events);
}
```

### Testing

Every module requires 80%+ test coverage:

```bash
npm run test:unit -- src/backend/domain-*/module-name
```

Test structure:
```typescript
describe('ModuleName', () => {
  describe('method', () => {
    it('should handle case', () => {
      // arrange
      // act
      // assert
    });
  });
});
```

### Code Organization

```
src/backend/domain-X/module-name/
├── src/
│   ├── index.ts                    # Public API
│   ├── module.ts                   # Main class
│   ├── types.ts                    # Type definitions
│   └── constants.ts                # Module constants
├── __tests__/
│   └── unit/
│       ├── module.test.ts
│       ├── utils.test.ts
│       └── integration.test.ts
└── README.md                       # Module documentation
```

## Workflow

### 1. Create Module Prototype

```bash
# Navigate to module
cd src/backend/domain-1-core-infrastructure/config

# Create main implementation
# src/main.ts - implement your service
# src/types.ts - define types
# src/index.ts - export API
```

### 2. Write Tests

```bash
# Add tests
# __tests__/unit/config.test.ts
npm run test:unit -- config
# Aim for 80%+ coverage
```

### 3. Commit & Push

```bash
git add .
git commit -m "feat: implement config service"
git push origin feature/config-service
```

### 4. Create Pull Request

- Reference related issues
- Include test coverage report
- Request review from teammates

## Commands

```bash
# Development
npm run dev              # Start dev servers

# Building
npm run build            # Build all
npm run build:backend    # Build backend only

# Testing
npm run test             # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:watch       # Watch mode

# Code Quality
npm run lint             # Check linting
npm run lint:fix         # Fix issues
npm run format           # Format code
npm run type-check       # TypeScript check

# Database
npm run db:migrate       # Run migrations
npm run db:rollback      # Revert migrations
npm run db:seed          # Seed test data

# Other
npm run clean            # Clean build artifacts
npm run health           # Health check
```

## Debugging

### Backend
```bash
# With debugging enabled
npm run dev:backend -- --inspect
# Open chrome://inspect in Chrome DevTools
```

### Frontend
```bash
# DevTools built-in
npm run dev:frontend
# Use React DevTools browser extension
```

## Common Tasks

### Adding a Dependency

```bash
npm install package-name
# or for dev dependency
npm install --save-dev package-name
```

### Creating a New Module

1. Create directory: `src/backend/domain-X/new-module`
2. Create structure: `src/`, `__tests__/unit/`, `__tests__/integration/`
3. Create `README.md` with module description
4. Implement in `src/main.ts`
5. Define types in `src/types.ts`
6. Export in `src/index.ts`
7. Write tests with 80%+ coverage

### Integration with Another Module

```typescript
// src/module-a/src/main.ts
import { ServiceB } from '@backend/domain-X/module-b';

export class ServiceA {
  constructor(private serviceB: ServiceB) {}
  
  async process() {
    return this.serviceB.execute();
  }
}
```

## Git Conventions

**Branch naming**:
- Feature: `feature/module-name`
- Fix: `fix/issue-description`
- Refactor: `refactor/description`

**Commit messages** (conventional commits):
```
feat: add new feature
fix: resolve issue
refactor: improve code
docs: update documentation
test: add tests
chore: update dependencies
```

**PR template**:
```markdown
## Description
What does this PR do?

## Related Issues
Fixes #123

## Testing
How to test?

## Coverage
Before: X%
After: Y%
```

## Performance

Target performance metrics:
- API response: <100ms (p95)
- Search queries: <5s
- Full timeline: <5s
- Alert processing: <1s

Profile with:
```bash
npm run profile
```

## Security

- Always validate input
- Never log sensitive data
- Use environment variables for secrets
- Implement rate limiting
- Use HTTPS in production
- Regular dependency updates

Run security check:
```bash
npm audit
```

## Support

- **Questions**: Check existing docs
- **Issues**: Create GitHub issue with details
- **Discussions**: Use GitHub discussions
