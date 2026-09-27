# Audit Client Module

Production-grade audit logging and compliance tracking for the SOC Detection Lab application. Provides comprehensive audit trail management, security event logging, and compliance reporting with data retention policies.

**Status**: ✅ Production Ready  
**Test Coverage**: 85%+  
**Dependencies**: None (Tier 0 Foundation)

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Installation & Setup](#installation--setup)
4. [Core Concepts](#core-concepts)
5. [Usage Examples](#usage-examples)
6. [API Reference](#api-reference)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Audit Client module provides:

- **Comprehensive Audit Logging**: Track all user actions, system events, and security incidents
- **Change Tracking**: Record before/after values for data modifications
- **Security Event Logging**: Specialized handling for security-relevant events
- **Compliance Reporting**: Generate compliance metrics and reports
- **Forensic Analysis**: Query and analyze audit trails for investigations
- **Data Retention**: Automatic cleanup with configurable retention policies
- **Export Functionality**: Export audit logs in multiple formats (JSON, CSV, XML, PDF)
- **Real-time Monitoring**: Event listeners for real-time audit tracking
- **Type Safety**: Full TypeScript support with strict typing

### Why This Module?

1. **Compliance**: Meet regulatory requirements (SOC2, HIPAA, PCI-DSS, GDPR)
2. **Security**: Track unauthorized access attempts and suspicious activity
3. **Accountability**: Maintain complete audit trail of user actions
4. **Investigation**: Support forensic analysis and incident response
5. **Monitoring**: Real-time visibility into system activity
6. **Type Safety**: Full TypeScript for compile-time safety

---

## Features

### ✅ Audit Logging

- Log any user action with full context
- Track data changes (before/after)
- Record success and failure events
- Capture IP address and user agent
- Store arbitrary metadata

### ✅ Query & Filtering

- Query by user ID
- Filter by action type
- Filter by resource
- Date range filtering
- Status filtering
- Pagination support

### ✅ Security Events

- Log security incidents
- Severity levels (critical, high, medium, low)
- Event type classification
- Context and metadata
- Automatic audit log creation

### ✅ Compliance Reports

- Time-period compliance metrics
- Action breakdowns
- Resource access summaries
- Success/failure rates
- Compliance scoring

### ✅ User Activity Analysis

- Get user action history
- Activity summary by action type
- Failed attempt tracking
- Time-based filtering

### ✅ Resource Access Tracking

- Track access to specific resources
- Identify all users who accessed a resource
- Access action breakdown
- Time-based filtering

### ✅ Data Management

- Export in multiple formats
- Compression support
- Encryption support
- Retention policies
- Automatic cleanup

### ✅ Real-time Monitoring

- Event listeners for audit events
- Track all operations
- Statistics and metrics
- Error tracking

---

## Installation & Setup

### 1. Configuration

```typescript
import { createAuditClient } from '@soc-detection-lab/audit-client';

const config: IAuditConfig = {
  database: {
    host: 'localhost',
    port: 5432,
    name: 'soc_audit_logs',
    user: 'audit_user',
    password: 'secure_password',
  },
  retention: {
    enabled: true,
    retentionDays: 365,
    archiveOlderThan: 90,
    deleteOlderThan: 730,
    compressArchives: true,
  },
  encryption: {
    enabled: true,
    algorithm: 'AES-256',
  },
};

const client = createAuditClient(config);
```

### 2. Connect

```typescript
// Connect to audit database
await client.connect();

// Client is now ready for logging
```

### 3. Start Logging

```typescript
// Log a user action
const logId = await client.log({
  userId: 'user-456',
  action: 'create',
  resource: 'alert',
  resourceId: 'alert-789',
  status: 'success',
  ipAddress: '192.168.1.100',
});
```

---

## Core Concepts

### Audit Action Types

```
create      → New resource created
read        → Resource accessed
update      → Resource modified
delete      → Resource removed
export      → Data exported
import      → Data imported
login       → User login
logout      → User logout
access_denied → Permission denied
config_change → Configuration changed
role_assign    → Role assigned to user
permission_grant → Permission granted
data_access    → Data accessed
```

### Compliance Score

```
Score = Successful Actions / Total Actions

Example:
- Total: 1000 actions
- Successful: 950 actions
- Score: 950/1000 = 0.95 (95%)
```

### Retention Policy

```
Enabled: true                  # Retention active
retentionDays: 365            # Keep logs for 1 year
archiveOlderThan: 90          # Archive after 90 days
deleteOlderThan: 730          # Delete after 2 years
compressArchives: true        # Compress archived logs
```

### Security Event Severity

```
Critical → Immediate threat or breach
High     → Serious security concern
Medium   → Notable security event
Low      → Minor security issue
```

---

## Usage Examples

### Basic Audit Logging

```typescript
// Log successful action
await client.log({
  userId: 'user-456',
  action: 'create',
  resource: 'alert',
  resourceId: 'alert-789',
  status: 'success',
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
});

// Log failed action
await client.log({
  userId: 'user-123',
  action: 'delete',
  resource: 'confidential_data',
  resourceId: 'data-001',
  status: 'failure',
  ipAddress: '192.168.1.50',
  errorMessage: 'Insufficient permissions',
});

// Log with changes
await client.log({
  userId: 'admin-001',
  action: 'update',
  resource: 'user_profile',
  resourceId: 'user-456',
  status: 'success',
  changes: {
    before: { role: 'analyst', status: 'active' },
    after: { role: 'senior_analyst', status: 'active' },
    fields: ['role'],
  },
  metadata: {
    reason: 'Promotion Q1 2024',
    approver: 'admin-002',
  },
});
```

### Query Audit Logs

```typescript
// Get all actions by user
const userLogs = await client.query({
  userId: 'user-456',
});

// Get failed access attempts in last 24 hours
const failedAttempts = await client.query({
  status: 'failure',
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
});

// Get specific resource access
const resourceAccess = await client.query({
  resource: 'alert',
  action: 'read',
});

// Query with pagination
const result = await client.query(
  {
    userId: 'user-456',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
  },
  1,      // Page number
  50      // Page size
);

console.log(`Total: ${result.total}, Pages: ${result.pages}`);
console.log(`Logs on page: ${result.logs.length}`);
```

### User Activity Tracking

```typescript
// Get user activity for last 30 days
const activity = await client.getUserActivity('user-456', 30);

// Analyze activity
const actionCounts = new Map<string, number>();
for (const log of activity) {
  const count = actionCounts.get(log.action) || 0;
  actionCounts.set(log.action, count + 1);
}

console.log('User Activity Summary:');
for (const [action, count] of actionCounts) {
  console.log(`  ${action}: ${count}`);
}

// Detect suspicious patterns
const failedAttempts = activity.filter(a => a.status === 'failure');
if (failedAttempts.length > 5) {
  console.warn('⚠️  Multiple failed attempts detected');
}
```

### Resource Access History

```typescript
// Get all access to a resource
const accessLog = await client.getResourceAccess(
  'dataset',
  'confidential-data-001',
  90  // Last 90 days
);

// Who accessed the resource?
const users = new Set(accessLog.map(log => log.userId));
console.log(`Accessed by ${users.size} users`);

// When was it accessed?
const accessTimes = accessLog.map(log => log.timestamp);
console.log(`First access: ${accessTimes[0]}`);
console.log(`Last access: ${accessTimes[accessTimes.length - 1]}`);

// What actions were performed?
const actions = new Map<string, number>();
for (const log of accessLog) {
  const count = actions.get(log.action) || 0;
  actions.set(log.action, count + 1);
}
```

### Security Event Logging

```typescript
// Log failed authentication
await client.logSecurityEvent({
  eventType: 'failed_authentication',
  severity: 'medium',
  userId: 'user-789',
  ipAddress: '203.0.113.45',
  description: 'Failed login attempt (3/5 max attempts)',
  context: {
    attemptNumber: 3,
    username: 'user-789',
  },
});

// Log privilege escalation
await client.logSecurityEvent({
  eventType: 'privilege_escalation',
  severity: 'critical',
  userId: 'admin-001',
  ipAddress: '192.168.1.100',
  description: 'User elevated to admin without authorization',
  context: {
    previousRole: 'analyst',
    newRole: 'administrator',
  },
});

// Log suspicious activity
await client.logSecurityEvent({
  eventType: 'suspicious_activity',
  severity: 'high',
  userId: 'user-456',
  description: 'Bulk data export detected',
  context: {
    recordsExported: 10000,
    fileSize: '2.5GB',
  },
});
```

### Compliance Reporting

```typescript
// Generate quarterly compliance report
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-03-31');

const report = await client.getComplianceReport(startDate, endDate);

console.log('Compliance Report - Q1 2024');
console.log(`Period: ${report.period.start} to ${report.period.end}`);
console.log(`Total Actions: ${report.totalActions}`);
console.log(`Successful: ${report.successfulActions}`);
console.log(`Failed: ${report.failedActions}`);
console.log(`Unique Users: ${report.uniqueUsers}`);
console.log(`Compliance Score: ${(report.complianceScore * 100).toFixed(2)}%`);

console.log('\nTop Actions:');
Object.entries(report.actionBreakdown)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .forEach(([action, count]) => {
    console.log(`  ${action}: ${count}`);
  });
```

### Get Audit Statistics

```typescript
// Get current statistics
const stats = await client.getStats();

console.log('Audit Statistics:');
console.log(`  Total Logs: ${stats.totalLogs}`);
console.log(`  Today: ${stats.logsToday}`);
console.log(`  This Month: ${stats.logsThisMonth}`);
console.log(`  Average/Day: ${stats.averageLogsPerDay}`);
console.log(`  Success Rate: ${(stats.successRate * 100).toFixed(2)}%`);
console.log(`  Unique Users: ${stats.uniqueUsers}`);

// Top actions
console.log('\nTop Actions:');
stats.topActions.slice(0, 5).forEach(({ action, count }) => {
  console.log(`  ${action}: ${count}`);
});

// Top resources
console.log('\nTop Resources:');
stats.topResources.slice(0, 5).forEach(({ resource, count }) => {
  console.log(`  ${resource}: ${count}`);
});
```

### Export Audit Logs

```typescript
// Export to JSON
const jsonExport = await client.export({
  format: 'json',
  filter: {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
  },
  compress: true,
});

// Export to CSV
const csvExport = await client.export({
  format: 'csv',
  filter: {
    resource: 'alert',
    status: 'failure',
  },
});

// Export to XML for compliance audit
const xmlExport = await client.export({
  format: 'xml',
  filter: {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
  },
  encrypt: true,
});

// Export to PDF report
const pdfExport = await client.export({
  format: 'pdf',
  filter: {
    userId: 'user-456',
  },
});
```

### Real-time Event Monitoring

```typescript
// Register audit listener
client.onAudit((log) => {
  // Log security events
  if (log.status === 'failure') {
    logger.warn(`Failed audit: ${log.userId} - ${log.action}`);
  }
  
  // Alert on critical resources
  if (log.resource === 'confidential_data') {
    metrics.recordConfidentialAccess(log);
  }
});

// Get audit statistics
const stats = client.getStats();
console.log(`Total logs: ${stats.totalLogs}`);
console.log(`Log count: ${client.getLogCount()}`);
console.log(`Error count: ${client.getErrorCount()}`);
```

### Data Cleanup & Retention

```typescript
// Cleanup logs older than 90 days
const deleted = await client.cleanup(90);
console.log(`Cleaned up ${deleted} logs`);

// Common retention policies
const policies = {
  security_events: 365,     // Keep 1 year
  access_logs: 90,          // Keep 3 months
  system_logs: 30,          // Keep 1 month
  compliance_logs: 2555,    // Keep 7 years
};

// Apply cleanup
for (const [type, days] of Object.entries(policies)) {
  const count = await client.cleanup(days);
  console.log(`Cleaned up ${type}: ${count} records`);
}
```

---

## API Reference

### AuditClient

#### Constructor

```typescript
new AuditClient(config: IAuditConfig)
```

#### Methods

**Audit Operations**

- `log(log)` - Log audit event
- `logSecurityEvent(event)` - Log security event
- `query(filter?, page?, pageSize?)` - Query logs
- `export(options)` - Export logs

**Analytics**

- `getUserActivity(userId, days?)` - Get user activity
- `getResourceAccess(resource, resourceId, days?)` - Get resource access
- `getStats()` - Get statistics
- `getComplianceReport(startDate, endDate)` - Get compliance report

**Management**

- `cleanup(daysToKeep?)` - Cleanup old logs
- `connect()` - Connect to database
- `close()` - Close connection

**Listeners**

- `onAudit(listener)` - Register listener
- `offAudit(listener)` - Unregister listener

**Status**

- `isConnected_()` - Get connection status
- `getLogCount()` - Get log count
- `getErrorCount()` - Get error count
- `resetCounters()` - Reset counters

---

## Best Practices

### 1. Log All Critical Actions

```typescript
// ✅ Good: Comprehensive logging
await client.log({
  userId: user.id,
  action: 'update',
  resource: 'alert_rule',
  resourceId: rule.id,
  status: 'success',
  changes: { before: oldRule, after: newRule },
  metadata: { approver: admin.id },
});

// ❌ Bad: Minimal logging
await client.log({
  userId: user.id,
  action: 'update',
  resource: 'alert_rule',
  resourceId: rule.id,
  status: 'success',
});
```

### 2. Include Contextual Information

```typescript
// ✅ Good: Rich context
await client.log({
  userId: user.id,
  action: 'access',
  resource: 'confidential_data',
  resourceId: data.id,
  status: 'success',
  ipAddress: request.ip,
  userAgent: request.userAgent,
  metadata: {
    department: user.department,
    purpose: 'Investigation',
    duration: '2 hours',
  },
});

// ❌ Bad: Minimal context
await client.log({
  userId: user.id,
  action: 'access',
  resource: 'data',
  resourceId: 'unknown',
  status: 'success',
});
```

### 3. Log Failed Actions

```typescript
// ✅ Good: Log failures too
try {
  await deleteConfidentialData(id);
} catch (error) {
  await client.log({
    userId: user.id,
    action: 'delete',
    resource: 'data',
    resourceId: id,
    status: 'failure',
    errorMessage: error.message,
  });
  throw error;
}

// ❌ Bad: Only log successes
await client.log({
  userId: user.id,
  action: 'delete',
  resource: 'data',
  resourceId: id,
  status: 'success',
});
```

### 4. Use Event Listeners for Real-time Alerts

```typescript
// ✅ Good: Real-time monitoring
client.onAudit((log) => {
  if (log.action === 'delete' && log.status === 'success') {
    alerts.critical(`Data deleted: ${log.resourceId} by ${log.userId}`);
  }
});

// ❌ Bad: No real-time alerts
// Only check audit logs later
```

### 5. Implement Retention Policies

```typescript
// ✅ Good: Automated cleanup
const config = {
  retention: {
    enabled: true,
    retentionDays: 365,
    archiveOlderThan: 90,
  },
};

// Periodic cleanup
setInterval(async () => {
  await client.cleanup(365);
}, 7 * 24 * 60 * 60 * 1000); // Weekly

// ❌ Bad: No cleanup
// Disk fills up with audit logs
```

### 6. Track Data Changes

```typescript
// ✅ Good: Before/after changes
const oldData = await db.get(id);
const newData = { ...oldData, status: 'approved' };
await db.update(id, newData);

await client.log({
  userId: user.id,
  action: 'update',
  resource: 'case',
  resourceId: id,
  status: 'success',
  changes: {
    before: oldData,
    after: newData,
    fields: ['status'],
  },
});

// ❌ Bad: No change tracking
await client.log({
  userId: user.id,
  action: 'update',
  resource: 'case',
  resourceId: id,
  status: 'success',
});
```

---

## Configuration Reference

```typescript
interface IAuditConfig {
  database: {
    host: string;           // Database host
    port: number;           // Database port
    name: string;           // Database name
    user: string;           // Database user
    password: string;       // Database password
  };
  retention?: {
    enabled: boolean;       // Enable retention
    retentionDays: number;  // Days to keep
    archiveOlderThan?: number;    // Days before archive
    deleteOlderThan?: number;     // Days before delete
    compressArchives?: boolean;   // Compress archives
  };
  encryption?: {
    enabled: boolean;       // Enable encryption
    algorithm: string;      // Algorithm (AES-256)
    keyId?: string;         // Key identifier
  };
}
```

---

## Troubleshooting

### Connection Failed

**Problem**: "Failed to connect to audit database"

**Solution**:
```typescript
// Verify database credentials
const config = {
  database: {
    host: 'actual-host',
    port: 5432,
    name: 'soc_audit_logs',
    user: 'audit_user',
    password: 'correct_password', // Verify password
  },
};

// Test connection
await client.connect();
console.log('Connected successfully');
```

### Database Out of Disk Space

**Problem**: "Write failed - disk full"

**Solution**:
```typescript
// Enable aggressive cleanup
const deleted = await client.cleanup(30);  // Keep only 30 days
console.log(`Cleaned up ${deleted} logs`);

// Delete old archives
// Manual database cleanup:
// DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '30 days'
```

### Slow Queries

**Problem**: Audit queries taking too long

**Solution**:
```typescript
// Add pagination
const page = await client.query(filter, 1, 100);

// Use date filtering
const result = await client.query({
  ...filter,
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
}, 1, 1000);

// Create database indexes on:
// - user_id
// - action
// - resource
// - timestamp
```

---

## Performance Considerations

| Operation | Typical Time | Notes |
|-----------|--------------|-------|
| Log | <10ms | In-memory buffer |
| Query | 50-200ms | Database dependent |
| Security Event | <10ms | With auto-logging |
| Compliance Report | 1-5s | Full data scan |
| Export | 100-500ms | Format dependent |
| Cleanup | 100-1000ms | Volume dependent |

---

## Related Modules

- **logging-service**: Structured logging for audit events
- **postgres-client**: Database connection for audit storage
- **error-handling**: Error handling and recovery
- **config-service**: Configuration management

---

**Module Version**: 1.0.0  
**Last Updated**: 2024  
**License**: Proprietary  
**Compliance**: SOC2, HIPAA, PCI-DSS, GDPR Ready
