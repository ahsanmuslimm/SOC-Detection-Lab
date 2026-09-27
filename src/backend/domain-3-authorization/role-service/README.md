# Role Service Module

Role management with hierarchical structure and permission assignment. Provides enterprise-grade role-based access control (RBAC) with support for role hierarchy, permission inheritance, and flexible role assignment.

## Overview

The Role Service module provides comprehensive role management capabilities with support for:

- **Role Management**: Create, update, delete, and retrieve roles
- **Role Hierarchy**: Parent-child role relationships with permission inheritance
- **Permission Management**: Grant and revoke permissions at role level
- **Role Assignment**: Assign roles to users with optional expiration
- **Bulk Operations**: Bulk assign or revoke roles for multiple users
- **Permission Matrix**: View complete permission inheritance chain
- **Temporary Roles**: Support for time-based role assignments
- **Event Monitoring**: Track role lifecycle and changes
- **Audit Logging**: Complete audit trail of all operations
- **Statistics**: Comprehensive metrics and tracking

## Module Structure

```
role-service/
├── src/
│   ├── types.ts          # Type definitions (350+ lines)
│   ├── main.ts           # RoleService implementation (500+ lines)
│   └── index.ts          # Public API exports
├── __tests__/
│   └── unit/
│       └── role-service.test.ts  # Unit tests (750+ lines, 40+ test cases)
├── prototype/
│   └── demo.ts           # 12 demonstration scenarios
└── README.md             # This file

Total: 2,000+ lines of production code and tests
```

## Installation

```bash
npm install
```

## Quick Start

### Initialize Role Service

```typescript
import { createRoleService } from './src/main';

const roleService = createRoleService({
  maxRoleDepth: 5,
  allowCyclicHierarchy: false,
  defaultPermissionInheritance: true,
  roleIdPrefix: 'role',
});
```

### Create Roles

```typescript
// Create system role
const adminRole = await roleService.createRole(
  {
    name: 'Administrator',
    description: 'Full system access',
    type: 'system',
    permissions: ['read', 'write', 'delete', 'admin'],
  },
  'system'
);

// Create custom role
const userRole = await roleService.createRole(
  {
    name: 'User',
    description: 'Standard user permissions',
    type: 'custom',
    permissions: ['read', 'write'],
  },
  'admin'
);
```

### Create Role Hierarchy

```typescript
// Create parent role
const managerRole = await roleService.createRole(
  {
    name: 'Manager',
    description: 'Manager permissions',
    type: 'custom',
    permissions: ['read', 'write', 'approve'],
  },
  'admin'
);

// Create child role that inherits from parent
const teamLeadRole = await roleService.createRole(
  {
    name: 'TeamLead',
    description: 'Team lead with inherited permissions',
    type: 'custom',
    permissions: ['read', 'write', 'assign'],
    parentRoleId: managerRole.roleId,
  },
  'admin'
);
```

### Assign Roles to Users

```typescript
// Assign role to user
await roleService.assignRoleToUser('user-123', userRole.roleId, 'admin');

// Assign role with expiration (temporary access)
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
await roleService.assignRoleToUser('contractor', tempRole.roleId, 'admin', expiresAt);

// Get user roles and permissions
const userRoles = await roleService.getUserRoles('user-123');
console.log(userRoles.roles);           // [{ name: 'User', ... }]
console.log(userRoles.allPermissions);  // ['read', 'write']
```

## API Reference

### RoleService Class

#### Constructor

```typescript
new RoleService(config: IRoleServiceConfig)
```

**Parameters:**
- `config.maxRoleDepth` - Maximum hierarchy depth (default: 5)
- `config.allowCyclicHierarchy` - Allow cyclic relationships (default: false)
- `config.defaultPermissionInheritance` - Enable inheritance by default (default: true)
- `config.roleIdPrefix` - Prefix for generated role IDs (default: 'role')

#### Role Management Methods

```typescript
// Create role
async createRole(
  request: ICreateRoleRequest,
  createdBy: string
): Promise<IRole>

// Get role
async getRole(roleId: string): Promise<IRole | null>

// Get role with hierarchy
async getRoleWithHierarchy(roleId: string): Promise<IRoleWithHierarchy | null>

// Update role
async updateRole(
  roleId: string,
  request: IUpdateRoleRequest,
  updatedBy: string
): Promise<IRole>

// Delete role
async deleteRole(roleId: string, deletedBy: string): Promise<boolean>

// Get all roles
async getAllRoles(status?: string): Promise<IRole[]>
```

#### Assignment Methods

```typescript
// Assign role to user
async assignRoleToUser(
  userId: string,
  roleId: string,
  assignedBy: string,
  expiresAt?: Date,
  reason?: string
): Promise<IRoleAssignment>

// Revoke role from user
async revokeRoleFromUser(
  userId: string,
  roleId: string,
  revokedBy: string
): Promise<boolean>

// Get user roles
async getUserRoles(userId: string): Promise<IUserRoles>

// Get role assignments
async getRoleAssignments(roleId: string): Promise<IRoleAssignmentWithDetails[]>
```

#### Permission Methods

```typescript
// Grant permission
async grantPermissionToRole(
  roleId: string,
  permissionId: string,
  grantedBy: string
): Promise<boolean>

// Revoke permission
async revokePermissionFromRole(
  roleId: string,
  permissionId: string,
  revokedBy: string
): Promise<boolean>
```

#### Bulk Operations

```typescript
// Bulk assign
async bulkAssignRole(
  request: IBulkAssignRequest,
  assignedBy: string
): Promise<IBulkOperationResult>

// Bulk revoke
async bulkRevokeRole(
  request: IBulkRevokeRequest,
  revokedBy: string
): Promise<IBulkOperationResult>
```

#### Analysis Methods

```typescript
// Get permission matrix
getPermissionMatrix(roleId: string): IRolePermissionMatrix

// Compare roles
compareRoles(role1Id: string, role2Id: string): IRoleComparison

// Get expiring assignments
async getExpiringAssignments(daysThreshold?: number): Promise<IExpirationStatus[]>

// Clean up expired
async cleanupExpiredAssignments(): Promise<number>
```

#### Monitoring Methods

```typescript
// Register listener
onRole(listener: RoleListener): this

// Remove listener
offRole(listener: RoleListener): this

// Get statistics
getStats(): IRoleStats

// Get audit log
getAuditLog(limit?: number): IAuditLogEntry[]
```

## Type Definitions

### Key Types

#### IRole
```typescript
interface IRole {
  roleId: string;
  name: string;
  description: string;
  type: 'system' | 'custom' | 'temporary';
  status: 'active' | 'inactive' | 'archived';
  permissions: string[];
  parentRoleId?: string;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata?: Record<string, unknown>;
}
```

#### IRoleAssignment
```typescript
interface IRoleAssignment {
  assignmentId: string;
  userId: string;
  roleId: string;
  assignedAt: Date;
  expiresAt?: Date;
  assignedBy: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}
```

#### IRoleStats
```typescript
interface IRoleStats {
  totalRoles: number;
  activeRoles: number;
  inactiveRoles: number;
  systemRoles: number;
  customRoles: number;
  temporaryRoles: number;
  totalAssignments: number;
  userCount: number;
  errors: number;
}
```

## Usage Examples

### Example 1: Basic RBAC Setup

```typescript
const roleService = createRoleService(config);

// Create roles
const admin = await roleService.createRole(
  {
    name: 'Admin',
    type: 'system',
    permissions: ['read', 'write', 'delete', 'admin'],
  },
  'system'
);

const user = await roleService.createRole(
  {
    name: 'User',
    type: 'custom',
    permissions: ['read', 'write'],
  },
  'admin'
);

// Assign roles
await roleService.assignRoleToUser('alice', admin.roleId, 'admin');
await roleService.assignRoleToUser('bob', user.roleId, 'admin');

// Check permissions
const aliceRoles = await roleService.getUserRoles('alice');
console.log(aliceRoles.allPermissions); // ['read', 'write', 'delete', 'admin']
```

### Example 2: Role Hierarchy

```typescript
// Create hierarchy
const parent = await roleService.createRole(
  {
    name: 'Manager',
    permissions: ['read', 'write', 'approve'],
  },
  'admin'
);

const child = await roleService.createRole(
  {
    name: 'TeamLead',
    permissions: ['read', 'write', 'assign'],
    parentRoleId: parent.roleId,
  },
  'admin'
);

// Get with hierarchy
const role = await roleService.getRoleWithHierarchy(child.roleId);
console.log(role?.parentRole?.name);      // 'Manager'
console.log(role?.inheritedPermissions); // ['approve']
console.log(role?.allPermissions);       // ['read', 'write', 'assign', 'approve']
```

### Example 3: Bulk Assignment

```typescript
const role = await roleService.createRole(
  {
    name: 'NewUser',
    permissions: ['read'],
  },
  'admin'
);

// Assign to 100 new employees
const userIds = generateNewEmployeeIds(100);
const result = await roleService.bulkAssignRole(
  {
    userIds,
    roleId: role.roleId,
    reason: 'New employee onboarding',
  },
  'admin'
);

console.log(`Assigned: ${result.successful}, Failed: ${result.failed}`);
```

### Example 4: Temporary Access

```typescript
const tempRole = await roleService.createRole(
  {
    name: 'Contractor',
    type: 'temporary',
    permissions: ['read', 'write'],
  },
  'admin'
);

// Grant access for 30 days
const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
await roleService.assignRoleToUser(
  'contractor-jane',
  tempRole.roleId,
  'admin',
  expiresAt,
  'Contract period: 30 days'
);

// Later, check expiring assignments
const expiring = await roleService.getExpiringAssignments(7);
expiring.forEach(exp => {
  console.log(`${exp.userId} access expires in ${exp.daysUntilExpiration} days`);
});

// Clean up when expired
await roleService.cleanupExpiredAssignments();
```

### Example 5: Event Monitoring

```typescript
const auditLog = [];

roleService.onRole((event) => {
  auditLog.push(event);
  
  console.log(`Role Event: ${event.type} at ${event.timestamp}`);
  
  if (event.type === 'role_created') {
    console.log(`  New role: ${event.details?.name}`);
  }
});

// Perform operations
await roleService.createRole(...);
await roleService.updateRole(...);
await roleService.assignRoleToUser(...);

console.log(`Total events: ${auditLog.length}`);
```

## Testing

Run the comprehensive test suite:

```bash
# Run unit tests
npm test -- role-service.test.ts

# Run with coverage
npm test -- --coverage role-service.test.ts

# Run specific test suite
npm test -- --testNamePattern="Role Hierarchy"
```

### Test Coverage (40+ tests)

The module includes comprehensive testing for:
- Service creation and initialization
- Role creation, retrieval, update, deletion
- Role hierarchy and relationships
- Role assignments and revocation
- Permission management
- Bulk operations
- Role comparison
- Expiration handling
- Event listeners
- Statistics tracking
- Audit logging
- Integration scenarios

**Coverage Target**: 85%+

## Demonstration

Run the demo scenarios:

```bash
npm run demo -- role-service
```

Or execute directly:

```bash
npx ts-node prototype/demo.ts
```

### Demo Scenarios (12)

1. **Basic Role Creation** - Create system and custom roles
2. **Role Hierarchy** - Parent-child role relationships
3. **Role Assignment** - Assign roles to users
4. **Permission Management** - Grant and revoke permissions
5. **Bulk Operations** - Bulk assign/revoke for multiple users
6. **Temporary Roles** - Time-based role assignments
7. **Role Comparison** - Compare permissions between roles
8. **Permission Matrix** - View inheritance chains
9. **Event Monitoring** - Track role events
10. **Statistics Tracking** - Monitor role metrics
11. **Complete RBAC Setup** - Full RBAC implementation
12. **Audit Trail** - Review operation history

## Key Features

### Hierarchy Management

- Multi-level role hierarchy
- Automatic permission inheritance
- Configurable max depth
- Cycle detection
- Ancestor tracking

### Permission Inheritance

- Direct permissions
- Inherited permissions from parents
- Permission matrix view
- Conflict detection
- Source tracking

### Flexible Assignments

- Permanent assignments
- Time-based expiration
- Bulk assignment/revocation
- Multiple roles per user
- Reason tracking

### Compliance

- Complete audit trail
- Event monitoring
- Change tracking
- User attribution
- Statistics tracking

## Integration Points

### With Permission Service (Module 6)
```typescript
// After roles are defined, assign permissions from permission service
for (const permission of availablePermissions) {
  await roleService.grantPermissionToRole(roleId, permission.id, 'admin');
}
```

### With Access Control (Module 7)
```typescript
// Use role permissions in access decisions
const userRoles = await roleService.getUserRoles(userId);
const hasAccess = accessControl.checkAccess(userId, resource, userRoles.allPermissions);
```

### With Audit Client (Tier 0)
```typescript
// Track role changes
roleService.onRole((event) => {
  auditClient.logEvent('role_operation', {
    type: event.type,
    roleId: event.roleId,
    timestamp: event.timestamp,
  });
});
```

## Configuration Reference

```typescript
{
  maxRoleDepth: 5,                      // Max hierarchy levels
  allowCyclicHierarchy: false,          // Prevent cycles
  defaultPermissionInheritance: true,   // Enable inheritance
  roleIdPrefix: 'role',                 // ID prefix
}
```

## Performance Characteristics

- **Role Creation**: < 1ms
- **Role Lookup**: O(1)
- **Hierarchy Traversal**: O(depth)
- **Permission Resolution**: O(ancestors)
- **Bulk Operations**: O(n) where n = number of users
- **Expiration Cleanup**: O(total assignments)

## Security Considerations

### Access Control

- Role-based authorization
- Hierarchical permission inheritance
- User attribution tracking
- Audit logging
- Event monitoring

### Data Protection

- Immutable role IDs
- Audit trail maintenance
- Statistics isolation
- No sensitive data in logs

## Error Handling

```typescript
// Parent role not found
try {
  await roleService.createRole({
    name: 'Child',
    parentRoleId: 'nonexistent',
  }, 'admin');
} catch (err) {
  console.error(err.message); // "Parent role not found: nonexistent"
}

// Cyclic hierarchy
// Error: "Creating this hierarchy would cause a cycle"

// Max depth exceeded
// Error: "Max role hierarchy depth exceeded: 5"

// Cannot delete role with children
// Error: "Cannot delete role with child roles"
```

## Limitations & Future Enhancements

### Current Limitations
- In-memory role storage
- No database persistence
- Single-instance deployment
- No distributed caching

### Future Enhancements
- Database persistence layer
- Redis-based caching
- Distributed role service
- Advanced permission predicates
- Dynamic role composition
- Role versioning
- Role templates

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

**Total Lines**: 2,000+

**Test Cases**: 40+

**Coverage Target**: 85%+
