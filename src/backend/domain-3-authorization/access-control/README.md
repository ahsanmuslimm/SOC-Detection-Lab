# Access Control Service Module

Resource-based access control with RBAC and ABAC support. Provides enterprise-grade access control with policy-based evaluation, resource ownership checks, and delegation capabilities.

## Overview

The Access Control Service module provides comprehensive access control capabilities with support for:

- **Policy-Based Access Control**: Define and enforce access policies with effects (allow/deny)
- **Resource Registration**: Register and manage resources with ownership
- **Role-Based Access Control (RBAC)**: Policy subjects include roles and users
- **Attribute-Based Access Control (ABAC)**: Condition-based policies with multiple attributes
- **Ownership Checks**: Verify resource ownership for access decisions
- **Group Access**: Support for group-based permissions
- **Access Delegation**: Delegate access to other users temporarily or permanently
- **Bulk Operations**: Check access for multiple users efficiently
- **Resource Filtering**: Filter resources based on user access rights
- **Caching**: Cache access decisions for performance
- **Audit Logging**: Complete audit trail of access decisions
- **Event Monitoring**: Track access control events
- **Policy Conflicts**: Detect conflicting policies

## Module Structure

```
access-control/
├── src/
│   ├── types.ts          # Type definitions (250+ lines)
│   ├── main.ts           # AccessControlService implementation (600+ lines)
│   └── index.ts          # Public API exports
├── __tests__/
│   └── unit/
│       └── access-control.test.ts  # Unit tests (750+ lines, 40+ test cases)
├── prototype/
│   └── demo.ts           # 12 demonstration scenarios
└── README.md             # This file

Total: 2,400+ lines of production code and tests
```

## Installation

```bash
npm install
```

## Quick Start

### Initialize Access Control Service

```typescript
import { createAccessControlService } from './src/main';

const accessControl = createAccessControlService({
  enableCaching: true,
  cacheTimeout: 5000,
  maxCacheSize: 500,
  enableAuiting: true,
  auditRetention: 30,
  maxPolicies: 1000,
  evaluationTimeout: 1000,
  defaultDeny: false,
});
```

### Create Policies

```typescript
// Create allow policy
const readPolicy = await accessControl.createPolicy(
  {
    name: 'Report Read Access',
    description: 'Allow reading reports',
    effect: 'allow',
    resources: ['report'],
    actions: ['read'],
    subjects: ['role-analyst'],
  },
  'admin'
);

// Create deny policy
const deletePolicy = await accessControl.createPolicy(
  {
    name: 'Block System Delete',
    description: 'Prevent system deletion',
    effect: 'deny',
    resources: ['system'],
    actions: ['delete'],
    subjects: ['*'],
  },
  'admin'
);
```

### Check Access

```typescript
const decision = await accessControl.checkAccess({
  userId: 'user-123',
  resource: 'report',
  action: 'read',
  resourceId: 'report-456',
  timestamp: new Date(),
});

if (decision.allowed) {
  console.log('✓ Access granted');
} else {
  console.log('✗ Access denied:', decision.reason);
}
```

### Register Resources

```typescript
await accessControl.registerResource({
  resourceId: 'report-789',
  type: 'report',
  ownerId: 'user-owner-1',
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

## API Reference

### AccessControlService Class

#### Configuration

```typescript
interface IAccessControlConfig {
  enableCaching: boolean;           // Enable decision caching
  cacheTimeout: number;             // Cache TTL (ms)
  maxCacheSize: number;             // Max cache entries
  enableAuiting: boolean;           // Enable audit logging
  auditRetention: number;           // Audit retention days
  maxPolicies: number;              // Max policies
  evaluationTimeout: number;        // Evaluation timeout (ms)
  defaultDeny: boolean;             // Deny by default
}
```

#### Policy Management Methods

```typescript
// Create policy
async createPolicy(
  request: ICreatePolicyRequest,
  createdBy: string
): Promise<IAccessPolicy>

// Get policy
async getPolicy(policyId: string): Promise<IAccessPolicy | null>

// Update policy
async updatePolicy(
  policyId: string,
  request: IUpdatePolicyRequest,
  updatedBy: string
): Promise<IAccessPolicy>

// Delete policy
async deletePolicy(policyId: string, deletedBy: string): Promise<boolean>

// Get all policies
async getAllPolicies(): Promise<IAccessPolicy[]>
```

#### Access Decision Methods

```typescript
// Check access
async checkAccess(context: IAccessContext): Promise<IAccessDecision>

// Check resource access
async checkResourceAccess(
  userId: string,
  resourceId: string,
  action: string
): Promise<IAccessDecision>

// Bulk check access
async bulkCheckAccess(request: IBulkAccessRequest): Promise<IBulkAccessResult>
```

#### Resource Management Methods

```typescript
// Register resource
async registerResource(resource: IResource): Promise<void>

// Get resource
async getResource(resourceId: string): Promise<IResource | null>

// Check ownership
async checkOwnership(userId: string, resourceId?: string): Promise<boolean>

// Filter resources by access
async filterResourcesByAccess<T extends IResource>(
  userId: string,
  resources: T[],
  action: string
): Promise<IFilteredResult<T>>
```

#### Delegation Methods

```typescript
// Create delegation
async createDelegation(
  from: string,
  to: string,
  resource: any,
  action: string,
  grantedBy: string,
  expiresAt?: Date
): Promise<IDelegatedAccess>

// Get delegations
async getDelegations(userId: string): Promise<IDelegatedAccess[]>

// Revoke delegation
async revokeDelegation(delegationId: string, revokedBy: string): Promise<boolean>
```

#### Monitoring Methods

```typescript
// Register listener
onAccess(listener: AccessListener): this

// Remove listener
offAccess(listener: AccessListener): this

// Get statistics
getStats(): IAccessStats

// Get audit log
getAuditLog(limit?: number): IAccessAuditEntry[]

// Detect conflicts
async detectConflicts(): Promise<IPolicyConflict[]>
```

## Type Definitions

### IAccessPolicy

```typescript
interface IAccessPolicy {
  policyId: string;
  name: string;
  description: string;
  effect: 'allow' | 'deny' | 'conditional';
  resources: ResourceType[] | string[];
  actions: string[];
  subjects: string[];
  conditions?: IAccessCondition[];
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata?: Record<string, unknown>;
}
```

### IAccessContext

```typescript
interface IAccessContext {
  userId: string;
  resource: ResourceType;
  resourceId?: string;
  action: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}
```

### IAccessDecision

```typescript
interface IAccessDecision {
  allowed: boolean;
  effect: 'allow' | 'deny' | 'conditional';
  reason?: string;
  denialReasons?: string[];
  matchedPolicy?: string;
  appliedConditions?: string[];
  evaluatedAt: Date;
  expiration?: Date;
}
```

## Usage Examples

### Example 1: Basic RBAC Setup

```typescript
const ac = createAccessControlService(config);

// Create role-based policies
const adminPolicy = await ac.createPolicy(
  {
    name: 'Admin Full Access',
    effect: 'allow',
    resources: ['*'],
    actions: ['*'],
    subjects: ['role-admin'],
  },
  'system'
);

const analystPolicy = await ac.createPolicy(
  {
    name: 'Analyst Read Access',
    effect: 'allow',
    resources: ['report', 'alert'],
    actions: ['read'],
    subjects: ['role-analyst'],
  },
  'system'
);

// Check access
const adminAccess = await ac.checkAccess({
  userId: 'user-1',
  resource: 'system',
  action: 'manage',
  timestamp: new Date(),
});

const analystAccess = await ac.checkAccess({
  userId: 'user-2',
  resource: 'report',
  action: 'read',
  timestamp: new Date(),
});
```

### Example 2: Ownership-Based Access

```typescript
// Register resources
await ac.registerResource({
  resourceId: 'report-123',
  type: 'report',
  ownerId: 'user-alice',
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Create ownership-based policy
await ac.createPolicy(
  {
    name: 'Owner Update Access',
    effect: 'allow',
    resources: ['report'],
    actions: ['update', 'delete'],
    subjects: ['*'],
    conditions: [
      {
        type: 'ownership',
        operator: 'eq',
        value: true,
      },
    ],
  },
  'admin'
);

// Alice can update her own report
const decision = await ac.checkAccess({
  userId: 'user-alice',
  resource: 'report',
  resourceId: 'report-123',
  action: 'update',
  timestamp: new Date(),
});

// Bob cannot update Alice's report
const bobDecision = await ac.checkAccess({
  userId: 'user-bob',
  resource: 'report',
  resourceId: 'report-123',
  action: 'update',
  timestamp: new Date(),
});
```

### Example 3: Time-Based Access

```typescript
// Create time-based policy
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

await ac.createPolicy(
  {
    name: 'Temporary System Access',
    effect: 'allow',
    resources: ['system'],
    actions: ['manage'],
    subjects: ['contractor-user'],
    conditions: [
      {
        type: 'time',
        operator: 'lt',
        value: expiresAt,
      },
    ],
  },
  'admin'
);
```

### Example 4: Access Delegation

```typescript
// Create delegation
const delegation = await ac.createDelegation(
  'user-alice',
  'user-bob',
  { type: 'report', resourceId: 'report-456' },
  'read',
  'admin'
);

// Temporary delegation (7 days)
const tempDelegation = await ac.createDelegation(
  'user-alice',
  'user-charlie',
  { type: 'alert', resourceId: 'alert-789' },
  'update',
  'admin',
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
);

// Get delegations
const delegations = await ac.getDelegations('user-bob');
console.log(`Bob has ${delegations.length} delegations`);

// Revoke delegation
await ac.revokeDelegation(delegation.delegationId, 'admin');
```

### Example 5: Bulk Access Checking

```typescript
const result = await ac.bulkCheckAccess({
  userIds: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'],
  resource: 'report',
  action: 'read',
  resourceIds: ['report-1', 'report-2', 'report-3'],
});

console.log(`Allowed: ${result.allowedCount}, Denied: ${result.deniedCount}`);
```

### Example 6: Resource Filtering

```typescript
const resources = [
  { resourceId: 'case-1', type: 'case', ownerId: 'user-1', ... },
  { resourceId: 'case-2', type: 'case', ownerId: 'user-2', ... },
  { resourceId: 'case-3', type: 'case', ownerId: 'user-1', ... },
];

const result = await ac.filterResourcesByAccess('user-1', resources, 'update');

console.log(`User can access ${result.items.length} of ${result.total} resources`);
```

## Testing

Run the comprehensive test suite:

```bash
# Run unit tests
npm test -- access-control.test.ts

# Run with coverage
npm test -- --coverage access-control.test.ts

# Run specific test suite
npm test -- --testNamePattern="Access Decisions"
```

### Test Coverage (40+ tests)

The module includes comprehensive testing for:
- Service creation and initialization
- Policy creation, retrieval, update, deletion
- Access decision evaluation
- Resource registration and ownership
- Access delegation
- Bulk operations
- Resource filtering
- Event listeners
- Audit logging
- Statistics tracking
- Policy conflict detection
- Integration scenarios

**Coverage Target**: 85%+

## Demonstration

Run the demo scenarios:

```bash
npm run demo -- access-control
```

Or execute directly:

```bash
npx ts-node prototype/demo.ts
```

### Demo Scenarios (12)

1. **Basic Policy Creation** - Create allow/deny policies
2. **Policy with Conditions** - Condition-based policies
3. **Access Decision Evaluation** - Check access decisions
4. **Resource Ownership Checks** - Verify resource ownership
5. **Policy Management** - Create, update, delete policies
6. **Access Delegation** - Delegate access temporarily/permanently
7. **Bulk Access Checking** - Check access for multiple users
8. **Resource Filtering** - Filter resources by access rights
9. **Policy Conflict Detection** - Find conflicting policies
10. **Event Monitoring** - Track access control events
11. **Statistics and Metrics** - Monitor access control metrics
12. **Complete RBAC Implementation** - Full RBAC workflow

## Key Features

### Policy-Based Control

- Multiple effects (allow/deny/conditional)
- Resource and action matching
- Subject-based evaluation
- Priority-based policy ordering

### Conditions

- Role-based conditions
- Permission-based conditions
- Ownership checks
- Time-based conditions
- IP-based conditions
- Custom conditions

### Performance

- Decision caching for frequently checked accesses
- Configurable cache timeout and size
- Efficient policy evaluation
- Minimal evaluation overhead

### Compliance

- Complete audit trail
- Event monitoring
- Statistics tracking
- Conflict detection

## Configuration Reference

```typescript
{
  enableCaching: true,              // Cache decisions
  cacheTimeout: 5000,               // 5 second cache TTL
  maxCacheSize: 500,                // Max cached entries
  enableAuiting: true,              // Log all decisions
  auditRetention: 30,               // 30 day retention
  maxPolicies: 1000,                // Max policies allowed
  evaluationTimeout: 1000,          // 1 second timeout
  defaultDeny: false,               // Default to allow
}
```

## Performance Characteristics

- **Policy Creation**: < 1ms
- **Access Check**: O(n) where n = matching policies
- **Decision Caching**: O(1) lookup
- **Bulk Check**: O(m × n) where m = users, n = policies
- **Resource Filter**: O(r × n) where r = resources, n = policies

## Security Considerations

### Access Control

- Role-based authorization
- Ownership verification
- Condition-based evaluation
- Delegation with expiration

### Audit Trail

- All decisions logged
- User attribution
- Complete context capture
- Immutable audit records

### Data Protection

- Sensitive decision context captured
- Audit retention policies
- Statistics isolation
- No sensitive data in logs

## Integration Points

### With Role Service (Module 5)
```typescript
// Users are assigned roles
// Policies check role membership
const policy = await ac.createPolicy({
  effect: 'allow',
  subjects: ['role-analyst'], // From Role Service
  ...
}, 'admin');
```

### With Permission Service (Module 6)
```typescript
// Policies can reference permissions
// Conditions can check permissions
const policy = await ac.createPolicy({
  conditions: [{
    type: 'permission',
    value: ['perm-read', 'perm-write']
  }],
  ...
}, 'admin');
```

### With Audit Client (Tier 0)
```typescript
// Log all access decisions
ac.onAccess((event) => {
  auditClient.logEvent('access_control', {
    type: event.type,
    userId: event.userId,
    timestamp: event.timestamp,
  });
});
```

## Error Handling

```typescript
try {
  const decision = await ac.checkAccess(context);
} catch (err) {
  // Decision defaults to defaultDeny config
  console.error('Error evaluating access:', err);
}
```

## Limitations & Future Enhancements

### Current Limitations
- In-memory policy storage
- No persistence layer
- Single-instance deployment
- Synchronous evaluation

### Future Enhancements
- Database persistence
- Distributed caching
- Async policy evaluation
- Dynamic policy loading
- Policy versioning
- Advanced pattern matching

## License

Licensed under the ISC License.

## Contributing

This module follows SOC Detection Lab development standards:
- TypeScript strict mode
- 85%+ test coverage
- ESLint compliance
- Professional documentation
- Type-safe implementations

---

**Module Version**: 1.0.0

**Created**: September 27, 2026

**Status**: Production Ready

**Total Lines**: 2,400+

**Test Cases**: 40+

**Coverage Target**: 85%+
