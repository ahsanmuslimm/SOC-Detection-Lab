# Policy Engine Module

Dynamic policy evaluation and enforcement engine. Provides comprehensive policy management with version control, template support, and advanced condition evaluation.

## Overview

The Policy Engine module provides comprehensive policy capabilities with support for:

- **Policy Management**: Create, update, delete, and retrieve policies
- **Policy Statements**: Multiple statements per policy with effects (allow/deny)
- **Policy Conditions**: Complex condition evaluation (attribute, date, time, IP, role, permission)
- **Policy Versioning**: Track policy versions with rollback support
- **Policy Templates**: Reusable policy templates with instantiation
- **Policy Evaluation**: Single and bulk policy evaluation
- **Policy Search**: Find policies by criteria
- **Conflict Detection**: Identify conflicting policies
- **Event Monitoring**: Track policy events
- **Audit Logging**: Complete audit trail
- **Decision Caching**: Cache evaluated decisions
- **Statistics**: Comprehensive metrics

## Module Structure

```
policy-engine/
├── src/
│   ├── types.ts          # Type definitions (350+ lines)
│   ├── main.ts           # PolicyEngine implementation (700+ lines)
│   └── index.ts          # Public API exports
├── __tests__/
│   └── unit/
│       └── policy-engine.test.ts  # Unit tests (680+ lines, 40+ test cases)
├── prototype/
│   └── demo.ts           # 12 demonstration scenarios
└── README.md             # This file

Total: 2,600+ lines of production code and tests
```

## Installation

```bash
npm install
```

## Quick Start

### Initialize Policy Engine

```typescript
import { createPolicyEngine } from './src/main';

const engine = createPolicyEngine({
  maxPolicies: 1000,
  maxVersions: 5000,
  enableVersioning: true,
  enableAuditing: true,
  enableCaching: true,
  cacheTimeout: 5000,
  maxCacheSize: 500,
  evaluationTimeout: 1000,
  defaultEffect: 'deny',
});
```

### Create Policy

```typescript
const policy = await engine.createPolicy(
  {
    name: 'Report Read Access',
    description: 'Allow reading reports',
    statements: [
      {
        statementId: 'stmt-1',
        effect: 'allow',
        actions: ['read'],
        resources: ['report'],
        priority: 100,
      },
    ],
  },
  'admin'
);
```

### Evaluate Policy

```typescript
const result = await engine.evaluatePolicy({
  policyId: policy.policyId,
  userId: 'user-123',
  action: 'read',
  resource: 'report',
});

if (result.allowed) {
  console.log('✓ Access granted');
} else {
  console.log('✗ Access denied');
}
```

## API Reference

### PolicyEngine Class

#### Policy Management Methods

```typescript
// Create policy
async createPolicy(
  request: ICreatePolicyRequest,
  createdBy: string
): Promise<IPolicy>

// Get policy
async getPolicy(policyId: string): Promise<IPolicy | null>

// Update policy
async updatePolicy(
  policyId: string,
  request: IUpdatePolicyRequest,
  updatedBy: string
): Promise<IPolicy>

// Delete policy
async deletePolicy(policyId: string, deletedBy: string): Promise<boolean>

// Get all policies
async getAllPolicies(): Promise<IPolicy[]>

// Search policies
async searchPolicies(criteria: IPolicySearchCriteria): Promise<IPolicySearchResult>
```

#### Policy Evaluation Methods

```typescript
// Evaluate single policy
async evaluatePolicy(
  request: IPolicyEvaluationRequest
): Promise<IPolicyEvaluationResult>

// Bulk evaluate policies
async bulkEvaluatePolicies(
  request: IBulkPolicyEvaluationRequest
): Promise<IBulkPolicyEvaluationResult>
```

#### Version Management Methods

```typescript
// Get policy versions
async getPolicyVersions(policyId: string): Promise<IPolicyVersion[]>

// Rollback to version
async rollbackToVersion(
  policyId: string,
  versionNumber: number,
  rolledBackBy: string
): Promise<IPolicy>
```

#### Template Methods

```typescript
// Create template
async createTemplate(
  name: string,
  description: string,
  statements: IPolicyStatement[],
  createdBy: string
): Promise<IPolicyTemplate>

// Get template
async getTemplate(templateId: string): Promise<IPolicyTemplate | null>

// Instantiate template
async instantiateTemplate(
  request: IInstantiatePolicyTemplateRequest,
  createdBy: string
): Promise<IPolicy>
```

#### Analysis Methods

```typescript
// Detect policy conflicts
async detectConflicts(): Promise<IPolicyConflict[]>
```

#### Monitoring Methods

```typescript
// Register listener
onPolicy(listener: PolicyListener): this

// Remove listener
offPolicy(listener: PolicyListener): this

// Get statistics
getStats(): IPolicyStats

// Get audit log
getAuditLog(limit?: number): IPolicyAuditEntry[]
```

## Type Definitions

### IPolicy

```typescript
interface IPolicy {
  policyId: string;
  name: string;
  description: string;
  version: number;
  statements: IPolicyStatement[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata?: Record<string, unknown>;
}
```

### IPolicyStatement

```typescript
interface IPolicyStatement {
  statementId: string;
  effect: 'allow' | 'deny' | 'condition';
  actions: string[];
  resources: string[];
  conditions?: IPolicyCondition[];
  priority: number;
}
```

### IPolicyCondition

```typescript
interface IPolicyCondition {
  conditionId: string;
  type: 'attribute' | 'date' | 'time' | 'ip' | 'role' | 'permission' | 'custom';
  attribute?: string;
  operator: string;
  value: unknown;
  negate?: boolean;
}
```

### IPolicyEvaluationResult

```typescript
interface IPolicyEvaluationResult {
  policyId: string;
  allowed: boolean;
  effect: 'allow' | 'deny' | 'condition';
  reason?: string;
  matchedStatements: string[];
  evaluatedAt: Date;
  evaluationTimeMs: number;
}
```

## Usage Examples

### Example 1: Basic Policy

```typescript
const engine = createPolicyEngine(config);

const policy = await engine.createPolicy(
  {
    name: 'Admin Access',
    description: 'Full admin access',
    statements: [
      {
        statementId: 'stmt-admin',
        effect: 'allow',
        actions: ['*'],
        resources: ['*'],
        priority: 100,
      },
    ],
  },
  'system'
);

const result = await engine.evaluatePolicy({
  policyId: policy.policyId,
  userId: 'user-admin',
  action: 'delete',
  resource: 'system',
});
```

### Example 2: Policy with Conditions

```typescript
const policy = await engine.createPolicy(
  {
    name: 'Time-Based Access',
    description: 'Access during business hours',
    statements: [
      {
        statementId: 'stmt-time',
        effect: 'allow',
        actions: ['manage'],
        resources: ['system'],
        conditions: [
          {
            conditionId: 'cond-time',
            type: 'time',
            operator: 'before',
            value: new Date(Date.now() + 8 * 60 * 60 * 1000),
          },
        ],
        priority: 100,
      },
    ],
  },
  'admin'
);
```

### Example 3: Policy Versioning

```typescript
// Create policy
const policy = await engine.createPolicy({ ... }, 'admin');

// Update policy
await engine.updatePolicy(policy.policyId, { ... }, 'admin');

// Get versions
const versions = await engine.getPolicyVersions(policy.policyId);

// Rollback to previous version
await engine.rollbackToVersion(policy.policyId, 1, 'admin');
```

### Example 4: Policy Templates

```typescript
// Create template
const template = await engine.createTemplate(
  'Read Access Template',
  'Template for read-only access',
  [
    {
      statementId: 'stmt-read',
      effect: 'allow',
      actions: ['read'],
      resources: ['*'],
      priority: 100,
    },
  ],
  'admin'
);

// Instantiate template
const policy = await engine.instantiateTemplate(
  {
    templateId: template.templateId,
    name: 'Analyst Read Access',
  },
  'admin'
);
```

### Example 5: Bulk Evaluation

```typescript
const result = await engine.bulkEvaluatePolicies({
  policyIds: [policy1.policyId, policy2.policyId, policy3.policyId],
  userId: 'user-123',
  action: 'read',
  resource: 'report',
});

console.log(`Overall decision: ${result.overallDecision}`);
console.log(`Applicable policies: ${result.applicablePolicies}`);
```

### Example 6: Policy Search

```typescript
const result = await engine.searchPolicies({
  name: 'admin',
  active: true,
  limit: 50,
});

console.log(`Found ${result.total} policies`);
result.policies.forEach(p => {
  console.log(`- ${p.name} (v${p.version})`);
});
```

## Testing

Run the comprehensive test suite:

```bash
# Run unit tests
npm test -- policy-engine.test.ts

# Run with coverage
npm test -- --coverage policy-engine.test.ts
```

### Test Coverage (40+ tests)

- Service creation and initialization
- Policy creation, retrieval, update, deletion
- Policy management and search
- Policy evaluation (single and bulk)
- Policy versions and rollback
- Policy templates and instantiation
- Conflict detection
- Event listeners
- Statistics and audit logging
- Integration scenarios

**Coverage Target**: 85%+

## Demonstration

Run the demo scenarios:

```bash
npm run demo -- policy-engine
```

Or execute directly:

```bash
npx ts-node prototype/demo.ts
```

### Demo Scenarios (12)

1. **Basic Policy Creation** - Create policies
2. **Policy with Conditions** - Condition-based policies
3. **Policy Evaluation** - Evaluate policies
4. **Bulk Evaluation** - Evaluate multiple policies
5. **Policy Management** - Create, update, delete operations
6. **Policy Versions** - Track and manage versions
7. **Policy Templates** - Create and instantiate templates
8. **Policy Search** - Search and filter policies
9. **Conflict Detection** - Identify conflicts
10. **Event Monitoring** - Track events
11. **Statistics** - Monitor metrics
12. **Complete Workflow** - End-to-end scenario

## Configuration Reference

```typescript
{
  maxPolicies: 1000,              // Max policies allowed
  maxVersions: 5000,              // Max versions per policy
  enableVersioning: true,         // Track versions
  enableAuditing: true,           // Audit operations
  enableCaching: true,            // Cache decisions
  cacheTimeout: 5000,             // Cache TTL (ms)
  maxCacheSize: 500,              // Max cache entries
  evaluationTimeout: 1000,        // Eval timeout (ms)
  defaultEffect: 'deny',          // Default effect
}
```

## Performance Characteristics

- **Policy Creation**: < 1ms
- **Policy Evaluation**: O(s × c) where s = statements, c = conditions
- **Bulk Evaluation**: O(p × s × c) where p = policies
- **Search**: O(n) where n = total policies
- **Conflict Detection**: O(p²) where p = policies

## Security Considerations

- Role-based condition evaluation
- Permission-based conditions
- User attribution tracking
- Complete audit trail

## Key Features

### Statement-Based Policies

- Multiple statements per policy
- Different effects per statement
- Condition support per statement

### Advanced Conditions

- Attribute-based evaluation
- Date/time-based conditions
- IP-based conditions
- Role and permission checks
- Custom conditions

### Version Control

- Track all policy versions
- Rollback to previous versions
- Change logging

### Template Support

- Reusable policy templates
- Variable substitution
- Quick policy creation

### Performance Optimization

- Decision caching
- Condition short-circuit evaluation
- Efficient bulk operations

## Integration Points

### With Access Control (Module 7)
```typescript
// Use policy engine for access decisions
const result = await engine.evaluatePolicy({
  policyId,
  userId,
  action,
  resource,
});

if (result.allowed) {
  // Grant access
}
```

### With Audit Client (Tier 0)
```typescript
// Log policy decisions
engine.onPolicy((event) => {
  auditClient.logEvent('policy_event', {
    type: event.type,
    policyId: event.policyId,
    timestamp: event.timestamp,
  });
});
```

## License

Licensed under the ISC License.

---

**Module Version**: 1.0.0

**Created**: September 27, 2026

**Status**: Production Ready

**Total Lines**: 2,600+

**Test Cases**: 40+

**Coverage Target**: 85%+
