# Module Development Template

**Based on config-service - Production-Ready Pattern**

Follow this template to develop new modules with the same professional quality.

---

## 📋 Step-by-Step Guide

### Step 1: Create Directory Structure

```bash
mkdir -p src/backend/domain-X-name/module-name/{src,__tests__/unit,__tests__/integration,prototype}
```

### Step 2: Create Type Definitions (types.ts)

```typescript
/**
 * Module Name - Type Definitions
 */

// Define all interfaces and types
export interface IMyService {
  method1(): string;
  method2(param: string): Promise<void>;
}

// Specific domain types
export interface IDomainModel {
  id: string;
  name: string;
}

// Utility types
export type ServiceConfig = Record<string, unknown>;
```

**Check: Do you have all types needed?**

### Step 3: Implement Main Logic (main.ts)

```typescript
/**
 * Module Name - Main Implementation
 */

import type { IMyService, IDomainModel } from './types';

export class MyService implements IMyService {
  private config: ServiceConfig;

  constructor(config?: ServiceConfig) {
    this.config = config || {};
    this.validate();
  }

  // Implement all interface methods
  method1(): string {
    // Implementation
    return 'result';
  }

  async method2(param: string): Promise<void> {
    // Implementation
  }

  // Private validation method
  private validate(): void {
    // Add validation logic
  }
}
```

**Check: Do all methods have implementation?**

### Step 4: Export Public API (index.ts)

```typescript
/**
 * Module Name - Public API
 */

export { MyService } from './main';
export type {
  IMyService,
  IDomainModel,
  ServiceConfig,
} from './types';
```

**Check: Are all public exports included?**

### Step 5: Create Unit Tests (__tests__/unit/module.test.ts)

```typescript
/**
 * Module Name - Unit Tests
 * Target: 80%+ coverage
 */

import { MyService } from '../../src/main';
import type { IDomainModel } from '../../src/types';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
  });

  describe('method1', () => {
    it('should return expected result', () => {
      const result = service.method1();
      expect(result).toBe('result');
    });

    it('should handle edge case', () => {
      // Test edge case
    });
  });

  describe('method2', () => {
    it('should execute successfully', async () => {
      await expect(service.method2('param')).resolves.not.toThrow();
    });

    it('should handle errors', async () => {
      await expect(service.method2('')).rejects.toThrow('Error message');
    });
  });

  // Add error handling tests
  describe('error handling', () => {
    it('should throw on invalid input', () => {
      expect(() => service.method1()).not.toThrow();
    });
  });
});
```

**Check: Is coverage 80%+? (Required)**

### Step 6: Run Tests

```bash
npm run test:unit -- module-name
```

Expected output:
```
PASS  __tests__/unit/module.test.ts
  MyService
    ✓ should return expected result
    ✓ should handle edge case
    ✓ should execute successfully
    ... more tests

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Coverage:    85% lines, 85% functions, 80% branches
```

**Required: 80%+ coverage - If below, add more tests**

### Step 7: Create Prototype/Demo (prototype/demo.ts)

```typescript
/**
 * Module Name - Prototype Demo
 * Demonstrates all features
 */

import { MyService } from '../src/main';

function runDemo(): void {
  console.log('=== MyService Demo ===\n');

  try {
    // Initialize
    const service = new MyService();
    console.log('✅ Service initialized\n');

    // Feature 1
    console.log('Feature 1: Basic operation');
    const result = service.method1();
    console.log(`  Result: ${result}`);
    console.log('  ✅ Success\n');

    // Feature 2
    console.log('Feature 2: Async operation');
    service.method2('demo').then(() => {
      console.log('  ✅ Success\n');
    });

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

runDemo();
```

**Check: Does it demonstrate all key features?**

### Step 8: Write Documentation (README.md)

```markdown
# Module Name

Brief description of what this module does.

## Status

- [x] Prototype: Complete
- [x] Unit tests: Complete (XX+ tests, Y%+ coverage)
- [x] Integration ready: Yes
- [x] Documentation: Complete

## Features

- Feature 1
- Feature 2
- Feature 3

## Usage

\`\`\`typescript
import { MyService } from '@backend/domain-X-name/module-name';

const service = new MyService();
const result = await service.method1();
\`\`\`

## API

### MyService

#### method1(): string
Description of what it does.

#### method2(param: string): Promise<void>
Description of what it does.

## Testing

Run tests:
\`\`\`bash
npm run test:unit -- module-name
\`\`\`

## Dependencies

- config-service (if needed)
- other-module (if needed)

## Related Modules

- Uses: ...
- Used by: ...

## Troubleshooting

### Error X
Solution

### Error Y
Solution
```

**Check: Is documentation complete?**

### Step 9: Verify Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format

# Testing
npm run test:unit -- module-name

# Coverage report
npm run test:unit -- module-name --coverage
```

**Checklist:**
- [ ] TypeScript strict mode passes
- [ ] ESLint: zero warnings
- [ ] Code formatted with Prettier
- [ ] Tests: 80%+ coverage
- [ ] README: Complete

### Step 10: Commit to Repository

```bash
# Create feature branch
git checkout -b feature/module-name

# Add files
git add src/backend/domain-X-name/module-name

# Commit
git commit -m "feat: implement module-name with 80%+ coverage"

# Push
git push origin feature/module-name

# Create Pull Request on GitHub
```

---

## 📋 Template Checklist

Before considering your module complete, verify:

### Code Quality
- [ ] TypeScript strict mode - no errors
- [ ] No `any` types
- [ ] All functions have return types
- [ ] ESLint - zero warnings
- [ ] Prettier - code formatted
- [ ] No console.log in production code
- [ ] No commented-out code

### Testing
- [ ] 80%+ unit test coverage
- [ ] All error cases tested
- [ ] Edge cases handled
- [ ] Tests pass: `npm run test:unit`
- [ ] No skipped tests

### Documentation
- [ ] README.md complete
- [ ] Usage examples included
- [ ] API documented
- [ ] Error cases explained
- [ ] Troubleshooting section
- [ ] Dependencies listed

### Files
- [ ] src/main.ts - implementation
- [ ] src/types.ts - type definitions
- [ ] src/index.ts - public API
- [ ] __tests__/unit/module.test.ts - tests
- [ ] prototype/demo.ts - demo
- [ ] README.md - documentation

---

## 🎯 Development Pattern

```
1. Define Types (types.ts)
   ↓
2. Implement Main Logic (main.ts)
   ↓
3. Export Public API (index.ts)
   ↓
4. Write Unit Tests (config.test.ts)
   ↓
5. Reach 80%+ Coverage
   ↓
6. Create Demo (demo.ts)
   ↓
7. Write Documentation (README.md)
   ↓
8. Quality Checks (lint, format, type-check)
   ↓
9. Commit & Create PR
   ↓
10. Code Review & Merge
```

---

## 📊 Module Metrics (Expected)

After completion:

| Metric | Target | Your Module |
|--------|--------|-------------|
| Implementation | 200-300 lines | ___ |
| Tests | 400-600 lines | ___ |
| Documentation | 300-400 lines | ___ |
| Test Coverage | 80%+ | ___ |
| External Dependencies | 0-2 | ___ |
| Type Coverage | 100% | ___ |

---

## 🔄 Common Modules to Build Next

After config-service, build in this order (Tier 0):

1. **logging-service** - Structured logging
2. **types-definitions** - Shared types
3. **error-handling** - Error classes
4. **postgres-client** - Database client
5. **opensearch-client** - Search client
6. **cache-client** - Redis client
7. **audit-client** - Audit logging
8. **monitoring-service** - Metrics
9. **utils-helpers** - Utilities

Each should follow this template and achieve:
- ✅ Full implementation
- ✅ 80%+ test coverage
- ✅ Complete documentation
- ✅ Working demo

---

## 💡 Pro Tips

1. **Start with types** - Define what you're building before building it
2. **Test as you code** - Don't save testing for the end
3. **Document early** - Writing docs helps you think through the code
4. **One responsibility** - Each module does one thing well
5. **No external deps** - Keep Tier 0 modules dependency-free
6. **Use config-service** - Reference its pattern in your implementation
7. **Copy the structure** - Don't reinvent, replicate
8. **Team review** - Have another dev review before merge

---

## ✅ Final Checklist

Before submitting PR:

- [ ] 80%+ test coverage
- [ ] TypeScript strict mode passes
- [ ] ESLint: zero warnings
- [ ] Prettier formatted
- [ ] README complete
- [ ] Demo works
- [ ] No external dependencies (for Tier 0)
- [ ] Git commit message follows convention
- [ ] Code reviewed by teammate
- [ ] Ready for production

---

## Support

If you're stuck:

1. Check config-service implementation for patterns
2. Review __tests__/unit/config.test.ts for test patterns
3. Ask Tech Lead for design review
4. Reference BUILD_GUIDELINES.md for standards

---

**Ready to build your module?**

Start with Step 1 and follow through Step 10.

Target: Complete one module per day.

Good luck! 🚀
