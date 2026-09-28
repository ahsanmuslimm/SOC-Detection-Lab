# Audit Service

Enterprise-grade audit logging system with immutable record keeping, compliance reporting, forensics support, and anomaly detection for comprehensive security operations accountability and regulatory compliance.

## Overview

The Audit Service provides a robust, scalable framework for recording and analyzing all system activities with immutability guarantees, chain-of-custody support, compliance framework reporting, and forensic capabilities. It maintains complete audit trails for investigations, compliance audits, and incident response.

## Key Features

### Entry Logging
- Single and batch entry logging
- Immutable audit record storage
- Cryptographic hashing for integrity verification
- Complete entry metadata capture
- Correlation ID tracking for workflow tracing

### Audit Trail Tracking
- Complete resource lifecycle tracking
- Chronological entry ordering
- Change history preservation
- Related event linkage
- Time-series analysis capabilities

### Query & Retrieval
- Multi-filter query support (action, user, resource, severity, status)
- Full-text search across descriptions
- Date range filtering
- Pagination with configurable limits
- Sorting by timestamp, severity, action

### Compliance Reporting
- SOC2 compliance reports
- ISO 27001 framework mapping
- HIPAA compliance tracking
- PCI-DSS compliance verification
- GDPR data retention verification
- Framework-specific control evidence

### User Activity Analysis
- Per-user activity summaries
- Success/failure rate tracking
- Risk scoring based on patterns
- Anomaly detection integration
- Privilege escalation tracking

### Data Export
- Export to JSON format
- Export to CSV for spreadsheet analysis
- Export to XML for enterprise systems
- Cryptographic integrity verification
- Expiration management

### Integrity Verification
- SHA-256/512/BLAKE3 hashing support
- Entry-level integrity checking
- Full chain-of-custody verification
- Tamper detection
- Hash chain validation

### Anomaly Detection
- High-frequency activity detection
- Unusual access pattern identification
- Permission escalation alerts
- Privilege abuse detection
- Failed authentication tracking
- Automated anomaly flagging

### Health & Monitoring
- Real-time health checks
- Storage health monitoring
- Integrity health assessment
- Retention policy compliance verification
- Component status reporting

## Architecture

### Audit Logging Lifecycle

```
Event Occurs
    ↓
Entry Creation
    ├→ Generate Entry ID
    ├→ Capture Metadata (user, IP, timestamp)
    ├→ Record Action & Resource
    └→ Calculate Hash
    ↓
Immutable Storage
    ├→ Store in memory/database
    ├→ Add to chain of custody
    └→ Update statistics
    ↓
Trail Update
    └→ Link to resource audit trail
    ↓
Event Listeners
    ├→ Audit event dispatch
    └→ Anomaly detection check
    ↓
Compliance & Archival
    ├→ Retention policy check
    ├→ Compression (if configured)
    └→ Archive (if configured)
```

### Component Architecture

```
AuditService
├── Entry Management
│   ├── Log single/batch entries
│   ├── Retrieve by ID
│   ├── Query with filters
│   └── Full-text search
├── Trail Tracking
│   ├── Maintain resource trails
│   ├── Link related entries
│   └── Time-series analysis
├── User Analysis
│   ├── Activity summaries
│   ├── Risk scoring
│   └── Anomaly detection
├── Compliance
│   ├── Framework mapping
│   ├── Control evidence
│   ├── Compliance reports
│   └── Recommendations
├── Export & Archival
│   ├── Multi-format export
│   ├── Checksum generation
│   ├── Expiration management
│   └── Encryption (optional)
└── Integrity & Monitoring
    ├── Hash verification
    ├── Chain validation
    ├── Health checks
    └── Metrics collection
```

## Type Definitions

### IAuditEntry

```typescript
interface IAuditEntry {
  entryId: string;                    // Unique entry ID
  timestamp: Date;                    // Entry timestamp (UTC)
  action: AuditAction;                // Action performed
  status: AuditStatus;                // success | failure | partial
  severity: AuditSeverity;            // critical | high | medium | low | informational
  userId: string;                     // User who performed action
  username: string;                   // Username for display
  userIp: string;                     // Source IP address
  userAgent?: string;                 // User agent string
  resourceType: ResourceType;         // Resource type affected
  resourceId: string;                 // Resource ID
  resourceName?: string;              // Resource name for display
  changes?: Record<string, unknown>;  // Changed fields
  description: string;                // Action description
  errorMessage?: string;              // Error details if failure
  errorCode?: string;                 // Error code if failure
  correlationId?: string;             // Request correlation ID
  sessionId?: string;                 // Session ID
  duration?: number;                  // Operation duration (ms)
  metadata?: Record<string, unknown>; // Additional metadata
  tags?: string[];                    // Custom tags
  Hash: string;                       // SHA-256 hash for integrity
}
```

### IAuditQuery

```typescript
interface IAuditQuery {
  actionFilter?: AuditAction[];          // Filter by action type
  userIdFilter?: string[];               // Filter by user ID
  resourceTypeFilter?: ResourceType[];   // Filter by resource type
  resourceIdFilter?: string[];           // Filter by resource ID
  severityFilter?: AuditSeverity[];      // Filter by severity
  statusFilter?: AuditStatus[];          // Filter by status
  startDate?: Date;                      // Start of date range
  endDate?: Date;                        // End of date range
  limit?: number;                        // Max results
  offset?: number;                       // Pagination offset
  searchText?: string;                   // Full-text search
}
```

## API Reference

### Constructor

```typescript
const service = new AuditService(config: IAuditServiceConfig);
```

### Entry Logging

#### Log Single Entry

```typescript
async logEntry(entry: Partial<IAuditEntry>): Promise<string>

// Example
const entryId = await service.logEntry({
  action: 'user.login',
  userId: 'analyst-01',
  username: 'analyst-01',
  userIp: '192.168.1.100',
  resourceType: 'user',
  resourceId: 'analyst-01',
  description: 'User login successful',
  status: 'success',
  severity: 'informational'
});
```

#### Log Batch Entries

```typescript
async logBatchEntries(entries: Partial<IAuditEntry>[]): Promise<IAuditBatchOperation>

// Example
const result = await service.logBatchEntries([
  {
    action: 'alert.create',
    userId: 'system',
    username: 'system',
    userIp: '127.0.0.1',
    resourceType: 'alert',
    resourceId: 'alert-001',
    description: 'Alert created'
  },
  // ... more entries
]);
```

### Entry Retrieval

#### Get Entry

```typescript
getEntry(entryId: string): IAuditEntry | null

// Example
const entry = service.getEntry('audit_123456_abc');
```

#### Query Entries

```typescript
queryEntries(query: IAuditQuery): IAuditEntry[]

// Example
const results = service.queryEntries({
  actionFilter: ['user.login'],
  statusFilter: ['failure'],
  severityFilter: ['high'],
  limit: 100
});
```

#### Get Audit Trail

```typescript
getTrail(resourceType: ResourceType, resourceId: string): IAuditTrail | null

// Example
const trail = service.getTrail('case', 'case-001');
// Returns complete history of all actions on case-001
```

### User Analysis

#### Get User Activity Summary

```typescript
getUserActivitySummary(userId: string): IUserActivitySummary | null

// Example
const summary = service.getUserActivitySummary('analyst-01');
// Returns: total actions, success rate, risk score, anomaly count
```

### Compliance & Reporting

#### Register Retention Policy

```typescript
registerRetentionPolicy(policy: IAuditRetentionPolicy): boolean

// Example
service.registerRetentionPolicy({
  name: 'one-year-retention',
  retentionDays: 365,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

#### Generate Compliance Report

```typescript
generateComplianceReport(
  framework: 'SOC2' | 'ISO27001' | 'HIPAA' | 'PCI-DSS' | 'GDPR' | 'CUSTOM',
  startDate: Date,
  endDate: Date
): IAuditComplianceReport

// Example
const report = service.generateComplianceReport('SOC2', startDate, endDate);
```

### Export & Archival

#### Export Entries

```typescript
async exportEntries(request: IAuditExportRequest): Promise<IAuditExportResult>

// Example
const result = await service.exportEntries({
  format: 'csv',
  query: { severityFilter: ['high', 'critical'] }
});
```

### Integrity & Verification

#### Verify Entry Integrity

```typescript
verifyIntegrity(entryId: string): IIntegrityCheckResult

// Example
const check = service.verifyIntegrity(entryId);
// Returns: valid/invalid status, tampering detection
```

#### Verify Chain Integrity

```typescript
verifyChain(): IIntegrityCheckResult

// Example
const chainCheck = service.verifyChain();
// Validates entire audit trail for tampering
```

### Monitoring

#### Get Statistics

```typescript
getStats(): IAuditStats

// Example
const stats = service.getStats();
// Returns: total entries, unique users, failure rate, statistics by action/resource
```

#### Perform Health Check

```typescript
async performHealthCheck(): Promise<IAuditHealthCheck>

// Example
const health = await service.performHealthCheck();
// Returns: storage health, integrity health, retention compliance
```

### Event Listeners

#### On Audit Entry

```typescript
onAuditEntry(listener: AuditListener): this

// Example
service.onAuditEntry(async (entry) => {
  console.log(`Action: ${entry.action}`);
  // Send to monitoring system, trigger alerts, etc.
});
```

#### On Anomaly Detection

```typescript
onAnomaly(listener: AnomalyListener): this

// Example
service.onAnomaly(async (anomaly) => {
  console.log(`Anomaly detected: ${anomaly.anomalyType}`);
  // Trigger investigation, alert security team, etc.
});
```

## Usage Examples

### Basic Entry Logging

```typescript
const service = new AuditService({
  enableAudit: true,
  enableIntegrityCheck: true,
  enableAnomalyDetection: true,
  hashAlgorithm: 'sha256',
  retentionDays: 365
});

// Log user action
await service.logEntry({
  action: 'alert.acknowledge',
  userId: 'analyst-01',
  username: 'analyst-01',
  userIp: '192.168.1.100',
  resourceType: 'alert',
  resourceId: 'alert-001',
  description: 'Alert acknowledged by analyst',
  status: 'success',
  duration: 250
});
```

### Query and Analysis

```typescript
// Find all high-severity actions by a user
const suspicious = service.queryEntries({
  userIdFilter: ['analyst-05'],
  severityFilter: ['high', 'critical'],
  statusFilter: ['failure'],
  limit: 100
});

// Analyze user activity
const summary = service.getUserActivitySummary('analyst-05');
if (summary.riskScore > 70) {
  // High-risk user detected
  console.log('Investigate user activity');
}
```

### Compliance Reporting

```typescript
// Generate SOC2 compliance report
const report = service.generateComplianceReport(
  'SOC2',
  new Date(Date.now() - 90 * 86400000),  // Last 90 days
  new Date()
);

console.log(`Compliance: ${report.summary.compliancePercentage}%`);
report.recommendations.forEach(rec => console.log(`- ${rec}`));
```

### Integrity Verification

```typescript
// Verify specific entry hasn't been tampered
const check = service.verifyIntegrity('audit_123456_abc');
if (check.status !== 'valid') {
  console.error('Audit log tampering detected!');
  // Alert security, trigger investigation
}

// Verify entire audit trail
const chainCheck = service.verifyChain();
console.log(`Chain integrity: ${(chainCheck.integrityScore * 100).toFixed(1)}%`);
```

### Batch Operations

```typescript
// Log many entries efficiently
const result = await service.logBatchEntries(entries);
console.log(`Logged ${result.successCount}/${result.itemCount} entries`);
```

## Configuration

### Service Configuration

```typescript
interface IAuditServiceConfig {
  enableAudit: boolean;              // Enable audit service
  enableImmutability: boolean;       // Enforce immutable records
  enableIntegrityCheck: boolean;     // Enable hash verification
  enableCompression: boolean;        // Compress archived data
  enableEncryption: boolean;         // Encrypt sensitive data
  enableAnomalyDetection: boolean;   // Enable anomaly detection
  hashAlgorithm: 'sha256' | 'sha512' | 'blake3';
  retentionDays: number;             // Default retention (days)
  compressionAfterDays?: number;     // Archive compression timing
  archiveAfterDays?: number;         // Archive timing
  maxAuditEntriesPerQuery: number;   // Query size limit
  enableDetailedLogging: boolean;    // Verbose logging
  enablePerformanceMetrics: boolean; // Performance tracking
}
```

## Supported Actions

- User: login, logout, create, update, delete, password_change
- Role: create, update, delete
- Permission: grant, revoke
- Alert: create, acknowledge, escalate, close
- Case: create, update, close
- Evidence: upload, access, delete
- Playbook: execute
- Rule: create, update, delete
- Configuration: update
- API: call
- Search: execute
- Report: generate
- Export: create

## Supported Frameworks

- **SOC2**: Service Organization Control 2 compliance
- **ISO 27001**: Information security management standard
- **HIPAA**: Health Insurance Portability and Accountability Act
- **PCI-DSS**: Payment Card Industry Data Security Standard
- **GDPR**: General Data Protection Regulation
- **Custom**: Framework-agnostic audit trail

## Best Practices

1. **Always Capture Context**: Include correlation IDs for request tracing
2. **Set Appropriate Severity**: Use severity levels accurately for risk assessment
3. **Include Duration Metrics**: Track operation timing for performance analysis
4. **Enable Integrity Checks**: Regular verification ensures audit log integrity
5. **Monitor Anomalies**: Act on detected unusual patterns
6. **Retention Policies**: Set appropriate retention based on compliance needs
7. **Regular Audits**: Generate compliance reports periodically
8. **Export Securely**: Use checksums and hashing for exported data
9. **Listener Implementation**: Non-blocking, fault-tolerant event handling
10. **Archive Strategy**: Plan for long-term storage and retrieval

## Performance Characteristics

- **Entry Logging**: O(1) insertion with hash calculation
- **Entry Retrieval**: O(1) by ID lookup
- **Query**: O(n) filtering with optional indexing
- **Hash Verification**: O(1) single entry, O(n) full chain
- **Compliance Report**: O(n) aggregation across entries
- **Batch Operations**: O(m) where m = batch size

## Related Services

- **Event Pipeline**: Event processing and distribution
- **Access Control**: Authorization and permission management
- **Notification Service**: Alert delivery for anomalies
- **Search Service**: Full-text search over audit entries
- **Configuration Service**: Audit policy management

## Testing

The service includes comprehensive unit tests covering:

- Single and batch entry logging
- Entry retrieval and querying
- Audit trail tracking
- User activity analysis
- Retention policies
- Statistics and metrics
- Compliance reporting
- Data export (JSON, CSV, XML)
- Integrity verification
- Health checks
- Event listeners
- Anomaly detection
- Integration workflows

## Graceful Shutdown

```typescript
service.stop();
```

Stops internal intervals and allows pending operations to complete.

## License

Enterprise Grade - All Rights Reserved
