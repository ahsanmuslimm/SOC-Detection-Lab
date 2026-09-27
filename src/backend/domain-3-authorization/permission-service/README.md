# Permission Service Module

Fine-grained permission management for role-based access control (RBAC). Provides enterprise-grade permission system with support for user and role permissions, permission groups, resource scoping, and comprehensive audit logging.

## Overview

The Permission Service module provides comprehensive permission management capabilities with support for:

- **Permission Management**: Create, update, delete, and retrieve permissions
- **Permission Granting**: Assign permissions to users and roles
- **Permission Groups**: Organize permissions into logical groups
- **Permission Checking**: Query permissions and check access
- **Temporary Access**: Support for time-based permission assignments
- **Resource Scoping**: Fine-grained control with scope patterns
- **Bulk Operations**: Batch grant/revoke for multiple users/roles
- **Permission Inheritance**: Inherit permissions through groups and roles
- **Event Monitoring**: Track permission lifecycle and changes
- **Audit Logging**: Complete audit trail of all operations
- **Statistics**: Comprehensive metrics and tracking

## Module Structure

```
permission-service/
├── src/
│   ├── types.ts          # Type definitions (350+ lines)
│   ├── main.ts           # PermissionService implementation (700+ lines)
│   └── index.ts          # Public API exports
├── __tests__/
│   └── unit/
│       └── permission-service.test.ts  # Unit tests (750+ lines, 40+ test cases)
├── prototype/
│   └── demo.ts           # 12 demonstration scenarios
└── README.md             # This file

Total: 2,500+ lines of production code and tests
```

## Installation

```bash
npm install
```

## Quick Start

### Initialize Permission Service

```typescript
import { createPermissionService } from './src/main';

const permissionService = createPermissionService({
  enableResourceScoping: true,
  enableGrouping: true,
  maxPermissionsPerUser: 1000,
  permissionCacheTimeout: 5000,
  cacheSize: 500,
});
```

### Create Permissions

```typescript
// Create basic permission
const readReports = await permissionService.createPermission(
  {
    name: 'Read Reports',
    description: 'Permission to read security reports',
    resource: 'report',
    action: 'read',
    priority: 100,
  },
  'admin'
);

// Create permission with scope
const scopedPerm = await permissionService.createPermission(
  {
    name: 'Scoped Report Access',
    resource: 'report',
    action: 'read',
    scope: 'security:*', // Only access security reports
  },
  'admin'
);
```

### Grant Permissions to Users

```typescript
// Grant permission directly
await permissionService.grantPermissionToUser(
  readReports.permissionId,
  'user-123',
  'admin'
);

// Grant with expiration (temporary access)
const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
await permissionService.grantPermissionToUser(
  readReports.permissionId,
  'contractor-456',
  'admin',
  expiresAt,
  'Temporary contractor access'
);
```

### Create Permission Groups

```typescript
// Create permission group
const reportGroup = await permissionService.createPermissionGroup(
  'Report Manager',
  'Permissions for report management',
  [readPermId, writePermId, deletePermId],
  'admin'
);

// Assign group to user
await permissionService.grantPermissionGroupToUser(
  reportGroup.groupId,
  'user-789',
  'admin'
);
```

### Check Permissions

```typescript
// Check if user has permission
const result = await permissionService.checkPermission({
  userId: 'user-123',
  resource: 'report',
  action: 'read',
});

if (result.allowed) {
  console.log('✓ User has permission');
} else {
  console.log('✗ Access denied:', result.denialReasons);
}
```

## API Reference

### PermissionService Class

#### Constructor

```typescript
new PermissionService(config: IPermissionServiceConfig)
```

**Parameters:**
- `config.enableResourceScoping` - Enable resource-level scoping
- `config.enableGrouping` - Enable permission grouping
- `config.maxPermissionsPerUser` - Max permissions per user
- `config.permissionCacheTimeout` - Cache timeout (ms)
- `config.cacheSize` - Cache size limit

#### Permission Management Methods

```typescript
// Create permission
async createPermission(
  request: ICreatePermissionRequest,
  createdBy: string
): Promise<IPermission>

// Get permission
async getPermission(permissionId: string): Promise<IPermission | null>

// Get permission with details
async getPermissionWithDetails(
  permissionId: string
): Promise<IPermissionWithDetails | null>

// Update permission
async updatePermission(
  permissionId: string,
  request: IUpdatePermissionRequest,
  updatedBy: string
): Promise<IPermission>

// Delete permission
async deletePermission(
  permissionId: string,
  deletedBy: string
): Promise<boolean>

// Get all permissions
async getAllPermissions(
  resource?: ResourceType,
  action?: PermissionAction
): Promise<IPermission[]>
```

#### User Permission Methods

```typescript
// Grant permission to user
async grantPermissionToUser(
  permissionId: string,
  userId: string,
  grantedBy: string,
  expiresAt?: Date,
  reason?: string
): Promise<IUserPermission>

// Revoke permission from user
async revokePermissionFromUser(
  permissionId: string,
  userId: string,
  revokedBy: string
): Promise<boolean>

// Get user permissions summary
async getUserPermissionsSummary(
  userId: string
): Promise<IUserPermissionsSummary>
```

#### Role Permission Methods

```typescript
// Grant permission to role
async grantPermissionToRole(
  permissionId: string,
  roleId: string,
  grantedBy: string
): Promise<IRolePermission>

// Revoke permission from role
async revokePermissionFromRole(
  permissionId: string,
  roleId: string,
  revokedBy: string
): Promise<boolean>
```

#### Permission Group Methods

```typescript
// Create group
async createPermissionGroup(
  name: string,
  description: string,
  permissionIds: string[],
  createdBy: string
): Promise<IPermissionGroup>

// Get group
async getPermissionGroup(groupId: string): Promise<IPermissionGroup | null>

// Update group
async updatePermissionGroup(
  groupId: string,
  name?: string,
  description?: string,
  permissionIds?: string[],
  updatedBy?: string
): Promise<IPermissionGroup>

// Delete group
async deletePermissionGroup(
  groupId: string,
  deletedBy: string
): Promise<boolean>

// Grant group to user
async grantPermissionGroupToUser(
  groupId: string,
  userId: string,
  grantedBy: string
): Promise<number>

// Revoke group from user
async revokePermissionGroupFromUser(
  groupId: string,
  userId: string,
  revokedBy: string
): Promise<number>

// Get all groups
async getAllPermissionGroups(): Promise<IPermissionGroup[]>
```

#### Permission Check Methods

```typescript
// Check permission
async checkPermission(
  request: IPermissionCheckRequest
): Promise<IPermissionCheckResult>

// Get permission matrix
async getPermissionMatrix(userId: string): Promise<IPermissionMatrixEntry[]>

// Detect conflicts
async detectConflicts(): Promise<IPermissionConflict[]>
```

#### Bulk Operations

```typescript
// Bulk grant permissions
async bulkGrantPermissions(
  request: IBulkPermissionRequest,
  grantedBy: string
): Promise<IBulkOperationResult>

// Bulk revoke permissions
async bulkRevokePermissions(
  request: IBulkPermissionRequest,
  revokedBy: string
): Promise<IBulkOperationResult>
```

#### Monitoring Methods

```typescript
// Register listener
onPermission(listener: PermissionListener): this

// Remove listener
offPermission(listener: PermissionListener): this

// Get statistics
getStats(): IPermissionStats

// Get audit log
getAuditLog(limit?: number): IPermissionAuditEntry[]
```

## Type Definitions

### Key Types

#### IPermission
```typescript
interface IPermission {
  permissionId: string;
  name: string;
  description: string;
  resource: ResourceType;
  action: PermissionAction;
  scope?: string;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata?: Record<string, unknown>;
}
```

#### IUserPermission
```typescript
interface IUserPermission {
  permissionId: string;
  userId: string;
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
  reason?: string;
}
```

#### IPermissionGroup
```typescript
interface IPermissionGroup {
  groupId: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}
```

#### IPermissionCheckRequest
```typescript
interface IPermissionCheckRequest {
  userId: string;
  resource: ResourceType;
  action: PermissionAction;
  resourceId?: string;
  context?: Record<string, unknown>;
}
```

#### IPermissionCheckResult
```typescript
interface IPermissionCheckResult {
  allowed: boolean;
  permissionId?: string;
  reason?: string;
  denialReasons?: string[];
}
```

## Usage Examples

### Example 1: Basic Permission Setup

```typescript
const service = createPermissionService(config);

// Create permissions
const readPerm = await service.createPermission(
  {
    name: 'Read Alerts',
    resource: 'alert',
    action: 'read',
    priority: 100,
  },
  'system'
);

const writePerm = await service.createPermission(
  {
    name: 'Create Alerts',
    resource: 'alert',
    action: 'create',
    priority: 110,
  },
  'system'
);

// Grant to users
await service.grantPermissionToUser(readPerm.permissionId, 'analyst-1', 'admin');
await service.grantPermissionToUser(writePerm.permissionId, 'responder-1', 'admin');

// Verify permissions
const can_read = await service.checkPermission({
  userId: 'analyst-1',
  resource: 'alert',
  action: 'read',
});

console.log(can_read.allowed); // true
```

### Example 2: Permission Groups for Roles

```typescript
// Create permissions for analyst role
const permissions = await Promise.all([
  service.createPermission(
    { name: 'View Threats', resource: 'threat', action: 'read' },
    'admin'
  ),
  service.createPermission(
    { name: 'Update Threats', resource: 'threat', action: 'update' },
    'admin'
  ),
  service.createPermission(
    { name: 'View Reports', resource: 'report', action: 'read' },
    'admin'
  ),
]);

// Create group
const analystGroup = await service.createPermissionGroup(
  'Threat Analyst',
  'Permissions for threat analysis',
  permissions.map(p => p.permissionId),
  'admin'
);

// Assign to multiple users
const userIds = ['emp-001', 'emp-002', 'emp-003'];
for (const userId of userIds) {
  await service.grantPermissionGroupToUser(
    analystGroup.groupId,
    userId,
    'admin'
  );
}
```

### Example 3: Temporary Access

```typescript
const contractorPerm = await service.createPermission(
  { name: 'Data Export', resource: 'data', action: 'export' },
  'admin'
);

// Grant for 14 days
const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
await service.grantPermissionToUser(
  contractorPerm.permissionId,
  'contractor-123',
  'admin',
  expiresAt,
  'Short-term project: Data analysis'
);

// Later, check who has expiring access
const matrix = await service.getPermissionMatrix('contractor-123');
console.log('User permissions:', matrix);
```

### Example 4: Bulk Permission Assignment

```typescript
// Create read permission
const readPerm = await service.createPermission(
  { name: 'System Access', resource: 'system', action: 'read' },
  'admin'
);

// Assign to 50 new employees
const newEmployeeIds = Array.from({ length: 50 }, (_, i) => `emp-${i + 1000}`);

const result = await service.bulkGrantPermissions(
  {
    permissionIds: [readPerm.permissionId],
    userIds: newEmployeeIds,
    action: 'grant',
  },
  'admin'
);

console.log(`Assigned to ${result.successful} users, ${result.failed} failed`);
```

### Example 5: Permission Scoping

```typescript
// Create scoped permission
const scopedPerm = await service.createPermission(
  {
    name: 'Security Report Access',
    resource: 'report',
    action: 'read',
    scope: 'security:*', // Only security reports
  },
  'admin'
);

// Grant to analyst
await service.grantPermissionToUser(scopedPerm.permissionId, 'analyst-1', 'admin');

// Check permission
const result = await service.checkPermission({
  userId: 'analyst-1',
  resource: 'report',
  action: 'read',
  resourceId: 'security:threat-report-2024-09-27',
});

console.log(result.allowed); // true
```

### Example 6: Event Monitoring

```typescript
const events = [];

service.onPermission((event) => {
  events.push(event);
  
  if (event.type === 'permission_created') {
    console.log(`✓ Permission created: ${event.details?.name}`);
  } else if (event.type === 'permission_granted') {
    console.log(`✓ Permission granted to ${event.userId || event.roleId}`);
  }
});

// Perform operations
await service.createPermission(...);
await service.grantPermissionToUser(...);

console.log(`Total events: ${events.length}`);
```

## Testing

Run the comprehensive test suite:

```bash
# Run unit tests
npm test -- permission-service.test.ts

# Run with coverage
npm test -- --coverage permission-service.test.ts

# Run specific test suite
npm test -- --testNamePattern="Permission Groups"
```

### Test Coverage (40+ tests)

The module includes comprehensive testing for:
- Service creation and initialization
- Permission creation, retrieval, update, deletion
- User permission assignment and revocation
- Role permission assignment and revocation
- Permission groups and group operations
- Permission checking and validation
- Bulk operations
- Temporary access
- Event listeners
- Audit logging
- Statistics tracking
- Conflict detection
- Integration scenarios

**Coverage Target**: 85%+

## Demonstration

Run the demo scenarios:

```bash
npm run demo -- permission-service
```

Or execute directly:

```bash
npx ts-node prototype/demo.ts
```

### Demo Scenarios (12)

1. **Basic Permission Creation** - Create individual permissions
2. **Permission Groups** - Group permissions together
3. **User Permission Assignment** - Grant permissions to users
4. **Role Permission Assignment** - Grant permissions to roles
5. **Temporary Permission Assignment** - Time-based access
6. **Permission Checking** - Query and validate permissions
7. **Bulk Operations** - Batch grant/revoke operations
8. **Permission Group Assignment** - Assign groups to users
9. **Permission Updates** - Modify and deactivate permissions
10. **Audit Logging** - Track events and changes
11. **Statistics and Monitoring** - View system metrics
12. **Complete RBAC Workflow** - Full end-to-end scenario

## Key Features

### Fine-Grained Permission Control

- Resource and action-based permissions
- Wildcard scope patterns (e.g., `security:*`)
- Permission priorities
- Active/inactive status

### Permission Organization

- Permission groups for logical organization
- Batch operations on groups
- Group assignment to users and roles
- Dynamic group updates

### Access Control

- Direct user permissions
- Role-based permissions
- Group-based permissions
- Temporary time-based access

### Monitoring & Compliance

- Complete audit trail
- Event notifications
- Statistics tracking
- Conflict detection

## Integration Points

### With Role Service (Module 5)
```typescript
// After creating roles, assign permissions
const rolesWithPermissions = await roleService.getRoleAssignments(roleId);
for (const role of rolesWithPermissions) {
  for (const perm of permissions) {
    await permissionService.grantPermissionToRole(
      perm.permissionId,
      role.roleId,
      'admin'
    );
  }
}
```

### With Access Control (Module 7)
```typescript
// Use permission service for access decisions
const checkResult = await permissionService.checkPermission({
  userId,
  resource,
  action,
});

if (checkResult.allowed) {
  // Allow operation
} else {
  // Deny operation
}
```

### With Audit Client (Tier 0)
```typescript
// Log permission changes
permissionService.onPermission((event) => {
  auditClient.logEvent('permission_event', {
    type: event.type,
    permissionId: event.permissionId,
    timestamp: event.timestamp,
    details: event.details,
  });
});
```

## Configuration Reference

```typescript
{
  enableResourceScoping: true,      // Enable scope patterns
  enableGrouping: true,             // Enable permission groups
  maxPermissionsPerUser: 1000,      // Max permissions per user
  permissionCacheTimeout: 5000,     // Cache timeout (ms)
  cacheSize: 500,                   // Cache entry limit
}
```

## Performance Characteristics

- **Permission Creation**: < 1ms
- **Permission Lookup**: O(1)
- **Grant Permission**: O(1)
- **Check Permission**: O(n) where n = user permissions
- **Permission Matrix**: O(n) where n = user permissions
- **Bulk Operations**: O(m × n) where m = items, n = permissions

## Security Considerations

### Access Control

- User-based permissions
- Role-based permissions
- Resource-scoped access
- Temporary access expiration
- Event monitoring

### Data Protection

- Immutable permission IDs
- Audit trail maintenance
- Change tracking
- User attribution

### Audit Trail

- Complete operation history
- Timestamp tracking
- User attribution
- Detailed change logs

## Error Handling

```typescript
// Permission not found
try {
  await permissionService.getPermission('nonexistent');
} catch (err) {
  console.error(err.message); // "Permission not found: nonexistent"
}

// Duplicate grant
try {
  await permissionService.grantPermissionToUser(permId, userId, 'admin');
  await permissionService.grantPermissionToUser(permId, userId, 'admin');
} catch (err) {
  console.error(err.message); // "already granted to user"
}

// Invalid group
try {
  await permissionService.getPermissionGroup('invalid-group');
} catch (err) {
  console.error(err.message); // "Permission group not found"
}
```

## Limitations & Future Enhancements

### Current Limitations
- In-memory storage only
- No database persistence
- Single-instance deployment
- No distributed caching
- No permission hierarchies

### Future Enhancements
- Database persistence layer
- Redis-based caching
- Permission hierarchies
- Dynamic permission predicates
- Advanced scope matching
- Permission inheritance rules
- Resource-based access control (RBAC)
- Attribute-based access control (ABAC)
- Distributed permission service
- Permission versioning

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

**Total Lines**: 2,500+

**Test Cases**: 40+

**Coverage Target**: 85%+

