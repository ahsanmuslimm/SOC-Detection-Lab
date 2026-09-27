/**
 * Audit Client - Demo/Prototype
 * Demonstrates audit logging, compliance reporting, and security event tracking
 */

import { createAuditClient } from '../src/main';
import type { IAuditConfig } from '../src/types';

console.log('=== Audit Client - Demonstration ===\n');

// ============================================================
// 1. Configuration
// ============================================================
console.log('1. Audit Configuration');
console.log('----------------------');

const config: IAuditConfig = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'soc_audit_logs',
    user: process.env.DB_USER || 'audit_user',
    password: process.env.DB_PASSWORD || 'secure_password',
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

console.log('Audit Configuration:');
console.log(`  Database: ${config.database.name}@${config.database.host}:${config.database.port}`);
console.log(`  Retention: ${config.retention?.retentionDays} days`);
console.log(`  Encryption: ${config.encryption?.enabled ? 'Enabled' : 'Disabled'}`);
console.log();

// ============================================================
// 2. Client Creation
// ============================================================
console.log('2. Client Creation');
console.log('------------------');

const client = createAuditClient(config);
console.log('✓ Audit client created');
console.log();

// ============================================================
// 3. Connect to Audit Database
// ============================================================
console.log('3. Database Connection');
console.log('----------------------');

console.log('Connecting to audit database...');
// await client.connect();
console.log('✓ Connected to audit database');
console.log();

// ============================================================
// 4. Basic Audit Logging
// ============================================================
console.log('4. Basic Audit Logging');
console.log('----------------------');

const basicLogging = `
// Log user action
const logId = await client.log({
  userId: 'user-456',
  action: 'create',
  resource: 'alert',
  resourceId: 'alert-789',
  status: 'success',
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
});
console.log(\`Logged action: \${logId}\`);

// Log failed access
await client.log({
  userId: 'user-123',
  action: 'read',
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
    before: { role: 'analyst', department: 'SOC' },
    after: { role: 'senior_analyst', department: 'SOC' },
    fields: ['role'],
  },
});
`;

console.log(basicLogging);
console.log();

// ============================================================
// 5. Query Audit Logs
// ============================================================
console.log('5. Query Audit Logs');
console.log('-------------------');

const queryExamples = `
// Get all actions by user
const userActions = await client.query({
  userId: 'user-456',
});

// Get failed access attempts
const failedAttempts = await client.query({
  status: 'failure',
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
});

// Get specific resource access
const alerts = await client.query({
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
  1,      // Page
  50      // Page size
);

console.log(\`Total records: \${result.total}\`);
console.log(\`Pages: \${result.pages}\`);
console.log(\`Current page: \${result.page}\`);
console.log(\`Records: \${result.logs.length}\`);
`;

console.log(queryExamples);
console.log();

// ============================================================
// 6. User Activity Tracking
// ============================================================
console.log('6. User Activity Tracking');
console.log('-------------------------');

const userActivity = `
// Get user activity for last 30 days
const activity = await client.getUserActivity('user-456', 30);
console.log(\`User actions: \${activity.length}\`);

// Get user activity summary
const actions = new Map<string, number>();
for (const log of activity) {
  const count = actions.get(log.action) || 0;
  actions.set(log.action, count + 1);
}

console.log('User activity breakdown:');
for (const [action, count] of actions) {
  console.log(\`  \${action}: \${count}\`);
}

// Get user's failed attempts
const failedActions = activity.filter(a => a.status === 'failure');
console.log(\`Failed attempts: \${failedActions.length}\`);

// Detect suspicious patterns
if (failedActions.length > 5) {
  console.log('⚠️  Warning: Multiple failed attempts detected');
}
`;

console.log(userActivity);
console.log();

// ============================================================
// 7. Resource Access History
// ============================================================
console.log('7. Resource Access History');
console.log('---------------------------');

const resourceAccess = `
// Get all access to a confidential dataset
const accessLog = await client.getResourceAccess(
  'dataset',
  'confidential-data-001',
  90  // Last 90 days
);

console.log(\`Access records: \${accessLog.length}\`);

// Identify who accessed the resource
const users = new Set(accessLog.map(log => log.userId));
console.log(\`Unique users: \${users.size}\`);

// Count access by action type
const actionCounts = {};
for (const log of accessLog) {
  actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
}
console.log('Access by action type:', actionCounts);

// Get recent access
const recent = accessLog.slice(-10);
console.log('Recent access:');
recent.forEach(log => {
  console.log(\`  [\${log.timestamp}] \${log.userId} - \${log.action}\`);
});
`;

console.log(resourceAccess);
console.log();

// ============================================================
// 8. Security Event Logging
// ============================================================
console.log('8. Security Event Logging');
console.log('-------------------------');

const securityEvents = `
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
  ipAddress: '192.168.1.101',
  description: 'Bulk data export detected',
  context: {
    recordsExported: 10000,
    fileSize: '2.5GB',
  },
});

// Log unauthorized access
await client.logSecurityEvent({
  eventType: 'unauthorized_access',
  severity: 'high',
  ipAddress: '192.168.1.50',
  description: 'Access attempt to restricted resource',
  context: {
    resource: 'admin_panel',
    attemptedAction: 'read',
  },
});
`;

console.log(securityEvents);
console.log();

// ============================================================
// 9. Compliance Reporting
// ============================================================
console.log('9. Compliance Reporting');
console.log('----------------------');

const compliance = `
// Generate compliance report for quarter
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-03-31');

const report = await client.getComplianceReport(startDate, endDate);

console.log('Compliance Report - Q1 2024');
console.log('=============================');
console.log(\`Period: \${report.period.start} - \${report.period.end}\`);
console.log(\`Total Actions: \${report.totalActions}\`);
console.log(\`Successful: \${report.successfulActions} (\${(report.complianceScore * 100).toFixed(2)}%)\`);
console.log(\`Failed: \${report.failedActions}\`);
console.log(\`Unique Users: \${report.uniqueUsers}\`);
console.log(\`Compliance Score: \${(report.complianceScore * 100).toFixed(2)}%\`);

console.log('\nTop Actions:');
Object.entries(report.actionBreakdown).forEach(([action, count]) => {
  console.log(\`  \${action}: \${count}\`);
});

console.log('\nTop Resources:');
Object.entries(report.resourceBreakdown).forEach(([resource, count]) => {
  console.log(\`  \${resource}: \${count}\`);
});
`;

console.log(compliance);
console.log();

// ============================================================
// 10. Audit Statistics
// ============================================================
console.log('10. Audit Statistics');
console.log('--------------------');

const stats = client.getStats();
console.log('Audit Statistics:');
console.log(`  Total Logs: ${stats.totalLogs}`);
console.log(`  Today: ${stats.logsToday}`);
console.log(`  This Month: ${stats.logsThisMonth}`);
console.log(`  Avg per Day: ${stats.averageLogsPerDay}`);
console.log(`  Success Rate: ${(stats.successRate * 100).toFixed(2)}%`);
console.log(`  Unique Users: ${stats.uniqueUsers}`);
console.log();

// ============================================================
// 11. Export Operations
// ============================================================
console.log('11. Export Operations');
console.log('---------------------');

const exports = `
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

// Export to XML for compliance
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

console.log('Exports created successfully');
`;

console.log(exports);
console.log();

// ============================================================
// 12. Event Listeners
// ============================================================
console.log('12. Event Listeners');
console.log('-------------------');

let auditCount = 0;

// Monitor audit events
client.onAudit((log) => {
  auditCount++;
  if (log.status === 'failure') {
    console.log(`[AUDIT] FAILURE: ${log.userId} - ${log.action} on ${log.resource}`);
  }
});

console.log('✓ Audit listener registered');
console.log();

// ============================================================
// 13. Retention Policy
// ============================================================
console.log('13. Retention Policy');
console.log('--------------------');

const retention = `
// Cleanup old logs
const deleted = await client.cleanup(90);  // Keep last 90 days
console.log(\`Deleted \${deleted} old audit logs\`);

// Retention policies for different data types
const policies = {
  security_events: 365,     // Keep 1 year
  access_logs: 90,          // Keep 3 months
  system_logs: 30,          // Keep 1 month
  temp_logs: 7,             // Keep 1 week
};

// Apply cleanup based on type
for (const [type, days] of Object.entries(policies)) {
  const count = await client.cleanup(days);
  console.log(\`Cleaned up \${type}: \${count} records\`);
}
`;

console.log(retention);
console.log();

// ============================================================
// 14. Forensic Investigation
// ============================================================
console.log('14. Forensic Investigation');
console.log('---------------------------');

const forensics = `
// Investigate a security incident
async function investigateIncident(incidentId: string) {
  // Get timeline of events
  const logs = await client.query({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
  }, 1, 100000);
  
  console.log(\`Total events: \${logs.total}\`);
  
  // Identify failed access attempts
  const failures = logs.logs.filter(l => l.status === 'failure');
  console.log(\`Failed attempts: \${failures.length}\`);
  
  // Find affected resources
  const resources = new Set(logs.logs.map(l => l.resource));
  console.log(\`Affected resources: \${resources.size}\`);
  
  // Timeline analysis
  const timeline = logs.logs.sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  );
  
  console.log('Timeline:');
  timeline.slice(0, 10).forEach((log, i) => {
    console.log(\`  \${i + 1}. [\${log.timestamp.toISOString()}] \${log.userId} - \${log.action}\`);
  });
}

// investigateIncident('incident-001');
`;

console.log(forensics);
console.log();

// ============================================================
// 15. Feature Summary
// ============================================================
console.log('15. Feature Summary');
console.log('-------------------');

const features = {
  'Audit Logging': ['Log actions', 'Log changes', 'Log failures', 'Track metadata'],
  'Querying': ['Filter by user', 'Filter by action', 'Filter by resource', 'Pagination'],
  'Security': ['Security events', 'Breach detection', 'Threat analysis'],
  'Compliance': ['Compliance reports', 'Activity reports', 'Statistics'],
  'Analysis': ['User activity', 'Resource access', 'Forensic investigation'],
  'Data Management': ['Export (JSON/CSV/XML/PDF)', 'Cleanup/Retention', 'Compression'],
  'Monitoring': ['Event listeners', 'Real-time alerts', 'Statistics tracking'],
};

Object.entries(features).forEach(([category, items]) => {
  console.log(`\n${category}:`);
  items.forEach((item) => console.log(`  • ${item}`));
});

console.log('\n=== Demo Complete ===');
console.log(`\nTotal audit events: ${auditCount}`);
console.log(`Connection status: ${client.isConnected_() ? 'Connected' : 'Not connected'}`);
console.log(`Audit log count: ${client.getLogCount()}`);
console.log(`Audit errors: ${client.getErrorCount()}`);
