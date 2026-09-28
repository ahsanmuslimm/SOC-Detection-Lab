/**
 * Audit Service - Demonstration Scenarios
 */

import {
  AuditService,
  createAuditService,
  IAuditServiceConfig,
  AuditListener,
  AnomalyListener,
} from '../src';

/**
 * Demo 1: Basic Entry Logging
 */
async function demo1_BasicEntryLogging() {
  console.log('\n=== Demo 1: Basic Entry Logging ===\n');

  const config: IAuditServiceConfig = {
    enableAudit: true,
    enableImmutability: true,
    enableIntegrityCheck: true,
    enableCompression: false,
    enableEncryption: false,
    enableAnomalyDetection: true,
    hashAlgorithm: 'sha256',
    retentionDays: 365,
    maxAuditEntriesPerQuery: 10000,
    enableDetailedLogging: true,
    enablePerformanceMetrics: true,
  };

  const service = createAuditService(config);

  // Log a user login
  const entryId = await service.logEntry({
    action: 'user.login',
    userId: 'analyst-01',
    username: 'analyst-01',
    userIp: '192.168.1.100',
    resourceType: 'user',
    resourceId: 'analyst-01',
    description: 'User login successful',
    status: 'success',
    severity: 'informational',
    duration: 125,
  });

  console.log('Entry logged:');
  console.log(`  Entry ID: ${entryId}`);

  const entry = service.getEntry(entryId);
  console.log(`  Action: ${entry?.action}`);
  console.log(`  User: ${entry?.username}`);
  console.log(`  Status: ${entry?.status}`);
  console.log(`  Hash: ${entry?.Hash.substring(0, 16)}...`);

  service.stop();
}

/**
 * Demo 2: Multiple Resource Actions
 */
async function demo2_MultipleResourceActions() {
  console.log('\n=== Demo 2: Multiple Resource Actions ===\n');

  const config: IAuditServiceConfig = {
    enableAudit: true,
    enableImmutability: true,
    enableIntegrityCheck: true,
    enableCompression: false,
    enableEncryption: false,
    enableAnomalyDetection: true,
    hashAlgorithm: 'sha256',
    retentionDays: 365,
    maxAuditEntriesPerQuery: 10000,
    enableDetailedLogging: true,
    enablePerformanceMetrics: true,
  };

  const service = createAuditService(config);

  const actions = [
    { action: 'alert.create' as const, description: 'Alert created' },
    { action: 'alert.acknowledge' as const, description: 'Alert acknowledged' },
    { action: 'case.create' as const, description: 'Case created' },
    { action: 'case.update' as const, description: 'Case updated' },
    { action: 'evidence.upload' as const, description: 'Evidence uploaded' },
  ];

  for (const act of actions) {
    await service.logEntry({
      action: act.action,
      userId: 'analyst-01',
      username: 'analyst-01',
      userIp: '192.168.1.100',
      resourceType: 'alert',
      resourceId: 'alert-001',
      description: act.description,
      severity: 'informational',
      status: 'success',
    });

    console.log(`✓ Logged: ${act.description}`);
  }

  const stats = service.getStats();
  console.log(`\nTotal entries: ${stats.totalEntries}`);

  service.stop();
}

/**
 * Demo 3: Audit Trail for Resource
 */
async function demo3_AuditTrailForResource() {
  console.log('\n=== Demo 3: Audit Trail for Resource ===\n');

  const config: IAuditServiceConfig = {
    enableAudit: true,
    enableImmutability: true,
    enableIntegrityCheck: true,
    enableCompression: false,
    enableEncryption: false,
    enableAnomalyDetection: true,
    hashAlgorithm: 'sha256',
    retentionDays: 365,
    maxAuditEntriesPerQuery: 10000,
    enableDetailedLogging: true,
    enablePerformanceMetrics: true,
  };

  const service = createAuditService(config);

  // Create a case and track all changes
  await service.logEntry({
    action: 'case.create',
    userId: 'analyst-01',
    username: 'analyst-01',
    userIp: '192.168.1.100',
    resourceType: 'case',
    resourceId: 'case-001',
    resourceName: 'SSH Brute Force Attack',
    description: 'Case created',
    severity: 'high',
  });

  await service.logEntry({
    action: 'case.update',
    userId: 'analyst-01',
    username: 'analyst-01',
    userIp: '192.168.1.100',
    resourceType: 'case',
    resourceId: 'case-001',
    resourceName: 'SSH Brute Force Attack',
    description: 'Case status changed to INVESTIGATING',
    changes: { status: 'INVESTIGATING' },
  });

  await service.logEntry({
    action: 'case.update',
    userId: 'analyst-02',
    username: 'analyst-02',
    userIp: '192.168.1.101',
    resourceType: 'case',
    resourceId: 'case-001',
    description: 'Evidence added to case',
    metadata: { evidence_count: 3 },
  });

  await service.logEntry({
    action: 'case.close',
    userId: 'analyst-01',
    username: 'analyst-01',
    userIp: '192.168.1.100',
    resourceType: 'case',
    resourceId: 'case-001',
    description: 'Case closed - True Positive',
    severity: 'informational',
  });

  // Get complete audit trail
  const trail = service.getTrail('case', 'case-001');

  console.log('Audit Trail for Case case-001:');
  console.log(`  Total events: ${trail?.entries.length}`);

  trail?.entries.forEach((entry, index) => {
    console.log(`\n  Event ${index + 1}:`);
    console.log(`    Time: ${entry.timestamp.toISOString()}`);
    console.log(`    User: ${entry.username}`);
    console.log(`    Action: ${entry.action}`);
    console.log(`    Description: ${entry.description}`);
  });

  service.stop();
}

/**
 * Demo 4: Entry Querying
 */
async function demo4_EntryQuerying() {
  console.log('\n=== Demo 4: Entry Querying ===\n');

  const config: IAuditServiceConfig = {
    enableAudit: true,
    enableImmutability: true,
    enableIntegrityCheck: true,
    enableCompression: false,
    enableEncryption: false,
    enableAnomalyDetection: true,
    hashAlgorithm: 'sha256',
    retentionDays: 365,
    maxAuditEntriesPerQuery: 10000,
    enableDetailedLogging: true,
    enablePerformanceMetrics: true,
  };

  const service = createAuditService(config);

  // Log various entries
  for (let i = 1; i <= 20; i++) {
    const action = i % 3 === 0 ? 'alert.create' : i % 3 === 1 ? 'case.update' : 'evidence.access';
    const status = i % 5 === 0 ? 'failure' : 'success';
    const severity = i > 15 ? 'high' : 'low';

    await service.logEntry({
      action: action as any,
      userId: `user-${Math.floor(i / 5)}`,
      username: `user-${Math.floor(i / 5)}`,
      userIp: '192.168.1.1',
      resourceType: 'alert',
      resourceId: `alert-${i}`,
      description: `Action ${i}`,
      status: status as any,
      severity: severity as any,
    });
  }

  // Query by action
  console.log('Query: All alert creations');
  const alerts = service.queryEntries({ actionFilter: ['alert.create'] });
  console.log(`  Results: ${alerts.length}`);

  // Query by severity
  console.log('\nQuery: High severity entries');
  const highSeverity = service.queryEntries({ severityFilter: ['high'] });
  console.log(`  Results: ${highSeverity.length}`);

  // Query by status
  console.log('\nQuery: Failed operations');
  const failures = service.queryEntries({ statusFilter: ['failure'] });
  console.log(`  Results: ${failures.length}`);

  // Query by user
  console.log('\nQuery: User user-1 activities');
  const userActivities = service.queryEntries({ userIdFilter: ['user-1'] });
  console.log(`  Results: ${userActivities.length}`);

  service.stop();
}

/**
 * Demo 5: User Activity Analysis
 */
async function demo5_UserActivityAnalysis() {
  console.log('\n=== Demo 5: User Activity Analysis ===\n');

  const config: IAuditServiceConfig = {
    enableAudit: true,
    enableImmutability: true,
    enableIntegrityCheck: true,
    enableCompression: false,
    enableEncryption: false,
    enableAnomalyDetection: true,
    hashAlgorithm: 'sha256',
    retentionDays: 365,
    maxAuditEntriesPerQuery: 10000,
    enableDetailedLogging: true,
    enablePerformanceMetrics: true,
  };

  const service = createAuditService(config);

  // Log analyst activities
  for (let i = 1; i <= 10; i++) {
    const success = i % 4 !== 0;

    await service.logEntry({
      action: 'alert.acknowledge',
      userId: 'analyst-01',
      username: 'analyst-01',
      userIp: '192.168.1.100',
      resourceType: 'alert',
      resourceId: `alert-${i}`,
      description: `Alert ${i} ${success ? 'acknowledged' : 'processing failed'}`,
      status: success ? 'success' : 'failure',
      severity: 'informational',
      duration: Math.random() * 5000,
    });
  }

  // Get activity summary
  const summary = service.getUserActivitySummary('analyst-01');

  console.log('Analyst-01 Activity Summary:');
  console.log(`  Total Actions: ${summary?.totalActions}`);
  console.log(`  Successful: ${summary?.successfulActions}`);
  console.log(`  Failed: ${summary?.failedActions}`);
  console.log(`  Failure Rate: ${((summary?.failureRate || 0) * 100).toFixed(2)}%`);
  console.log(`  Risk Score: ${summary?.riskScore.toFixed(1)}/100`);
  console.log(`  First Activity: ${summary?.firstActivityAt.toISOString()}`);
  console.log(`  Last Activity: ${summary?.lastActivityAt.toISOString()}`);

  service.stop();
}

/**
 * Demo 6: Batch Entry Logging
 */
async function demo6_BatchEntryLogging() {
  console.log('\n=== Demo 6: Batch Entry Logging ===\n');

  const config: IAuditServiceConfig = {
    enableAudit: true,
    enableImmutability: true,
    enableIntegrityCheck: true,
    enableCompression: false,
    enableEncryption: false,
    enableAnomalyDetection: true,
    hashAlgorithm: 'sha256',
    retentionDays: 365,
    maxAuditEntriesPerQuery: 10000,
    enableDetailedLogging: true,
    enablePerformanceMetrics: true,
  };

  const service = createAuditService(config);

  // Create batch of entries
  const entries = Array.from({ length: 50 }, (_, i) => ({
    action: 'alert.create' as const,
    userId: 'system',
    username: 'system',
    userIp: '127.0.0.1',
    resourceType: 'alert' as const,
    resourceId: `alert-batch-${i}`,
    description: `Batch alert ${i}`,
    severity: 'informational' as const,
    status: 'success' as const,
  }));

  console.log(`Logging batch of ${entries.length} entries...`);
  const result = await service.logBatchEntries(entries);

  console.log(`\nBatch Operation Results:`);
  console.log(`  Operation ID: ${result.operationId}`);
  console.log(`  Total Items: ${result.itemCount}`);
  console.log(`  Successful: ${result.successCount}`);
  console.log(`  Failed: ${result.failureCount}`);
  console.log(`  Duration: ${result.duration}ms`);
  console.log(`  Status: ${result.status}`);

  service.stop();
}

/**
 * Demo 7: Compliance Reporting
 */
async function demo7_ComplianceReporting() {
  console.log('\n=== Demo 7: Compliance Reporting ===\n');

  const config: IAuditServiceConfig = {
    enableAudit: true,
    enableImmutability: true,
    enableIntegrityCheck: true,
    enableCompression: false,
    enableEncryption: false,
    enableAnomalyDetection: true,
    hashAlgorithm: 'sha256',
    retentionDays: 365,
    maxAuditEntriesPerQuery: 10000,
    enableDetailedLogging: true,
    enablePerformanceMetrics: true,
  };

  const service = createAuditService(config);

  // Log authentication events
  for (let i = 1; i <= 5; i++) {
    await service.logEntry({
      action: 'user.login',
      userId: `user-${i}`,
      username: `user-${i}`,
      userIp: `192.168.1.${i}`,
      resourceType: 'user',
      resourceId: `user-${i}`,
      description: 'User login',
      status: 'success',
    });
  }

  // Generate compliance report
  const startDate = new Date(Date.now() - 86400000);
  const endDate = new Date();

  const report = service.generateComplianceReport('SOC2', startDate, endDate);

  console.log(`SOC2 Compliance Report:`);
  console.log(`  Report ID: ${report.reportId}`);
  console.log(`  Period: ${startDate.toDateString()} to ${endDate.toDateString()}`);
  console.log(`  Compliance: ${report.summary.compliancePercentage.toFixed(1)}%`);
  console.log(`  Controls:`);
  console.log(`    Compliant: ${report.summary.compliantControls}`);
  console.log(`    Non-compliant: ${report.summary.nonCompliantControls}`);

  console.log(`\nRecommendations:`);
  report.recommendations.forEach((rec) => console.log(`  - ${rec}`));

  service.stop();
}

/**
 * Demo 8: Data Export
 */
async function demo8_DataExport() {
  console.log('\n=== Demo 8: Data Export ===\n');

  const config: IAuditServiceConfig = {
    enableAudit: true,
    enableImmutability: true,
    enableIntegrityCheck: true,
    enableCompression: false,
    enableEncryption: false,
    enableAnomalyDetection: true,
    hashAlgorithm: 'sha256',
    retentionDays: 365,
    maxAuditEntriesPerQuery: 10000,
    enableDetailedLogging: true,
    enablePerformanceMetrics: true,
  };

  const service = createAuditService(config);

  // Create audit entries
  for (let i = 1; i <= 10; i++) {
    await service.logEntry({
      action: 'alert.create',
      userId: 'system',
      username: 'system',
      userIp: '127.0.0.1',
      resourceType: 'alert',
      resourceId: `alert-${i}`,
      description: `Alert ${i}`,
    });
  }

  // Export in different formats
  const formats = ['json' as const, 'csv' as const, 'xml' as const];

  for (const format of formats) {
    const result = await service.exportEntries({
      format,
      query: {},
    });

    console.log(`Export to ${format.toUpperCase()}:`);
    console.log(`  Export ID: ${result.exportId}`);
    console.log(`  Records: ${result.totalRecords}`);
    console.log(`  Size: ${result.fileSize} bytes`);
    console.log(`  URL: ${result.url}`);
    console.log(`  Hash: ${result.hash.substring(0, 16)}...`);
    console.log('');
  }

  service.stop();
}

/**
 * Demo 9: Integrity Verification
 */
async function demo9_IntegrityVerification() {
  console.log('\n=== Demo 9: Integrity Verification ===\n');

  const config: IAuditServiceConfig = {
    enableAudit: true,
    enableImmutability: true,
    enableIntegrityCheck: true,
    enableCompression: false,
    enableEncryption: false,
    enableAnomalyDetection: true,
    hashAlgorithm: 'sha256',
    retentionDays: 365,
    maxAuditEntriesPerQuery: 10000,
    enableDetailedLogging: true,
    enablePerformanceMetrics: true,
  };

  const service = createAuditService(config);

  // Log entries
  const entryIds = [];
  for (let i = 1; i <= 5; i++) {
    const id = await service.logEntry({
      action: 'alert.create',
      userId: 'system',
      username: 'system',
      userIp: '127.0.0.1',
      resourceType: 'alert',
      resourceId: `alert-${i}`,
      description: `Alert ${i}`,
    });
    entryIds.push(id);
  }

  // Verify individual entry
  console.log('Individual Entry Verification:');
  const singleCheck = service.verifyIntegrity(entryIds[0]);
  console.log(`  Entry: ${entryIds[0]}`);
  console.log(`  Status: ${singleCheck.status}`);
  console.log(`  Score: ${(singleCheck.integrityScore * 100).toFixed(1)}%`);

  // Verify entire chain
  console.log('\nChain Integrity Verification:');
  const chainCheck = service.verifyChain();
  console.log(`  Total entries: ${chainCheck.entriesChecked}`);
  console.log(`  Valid: ${chainCheck.entriesValid}`);
  console.log(`  Invalid: ${chainCheck.entriesInvalid}`);
  console.log(`  Score: ${(chainCheck.integrityScore * 100).toFixed(1)}%`);
  console.log(`  Status: ${chainCheck.status}`);

  service.stop();
}

/**
 * Demo 10: Event Listeners
 */
async function demo10_EventListeners() {
  console.log('\n=== Demo 10: Event Listeners ===\n');

  const config: IAuditServiceConfig = {
    enableAudit: true,
    enableImmutability: true,
    enableIntegrityCheck: true,
    enableCompression: false,
    enableEncryption: false,
    enableAnomalyDetection: true,
    hashAlgorithm: 'sha256',
    retentionDays: 365,
    maxAuditEntriesPerQuery: 10000,
    enableDetailedLogging: true,
    enablePerformanceMetrics: true,
  };

  const service = createAuditService(config);
  const events: string[] = [];

  // Add audit listener
  service.onAuditEntry(async (entry) => {
    events.push(`[Audit] ${entry.action} - ${entry.description}`);
  });

  // Add anomaly listener
  service.onAnomaly(async (anomaly) => {
    events.push(`[Anomaly] ${anomaly.anomalyType} - ${anomaly.description}`);
  });

  // Log entries
  for (let i = 1; i <= 3; i++) {
    await service.logEntry({
      action: 'alert.create',
      userId: 'analyst-01',
      username: 'analyst-01',
      userIp: '192.168.1.100',
      resourceType: 'alert',
      resourceId: `alert-${i}`,
      description: `Alert ${i}`,
    });
  }

  console.log('Captured Events:');
  events.forEach((e) => console.log(`  ${e}`));

  service.stop();
}

/**
 * Demo 11: Statistics and Metrics
 */
async function demo11_StatisticsAndMetrics() {
  console.log('\n=== Demo 11: Statistics and Metrics ===\n');

  const config: IAuditServiceConfig = {
    enableAudit: true,
    enableImmutability: true,
    enableIntegrityCheck: true,
    enableCompression: false,
    enableEncryption: false,
    enableAnomalyDetection: true,
    hashAlgorithm: 'sha256',
    retentionDays: 365,
    maxAuditEntriesPerQuery: 10000,
    enableDetailedLogging: true,
    enablePerformanceMetrics: true,
  };

  const service = createAuditService(config);

  // Create various entries
  const actions = [
    'user.login',
    'alert.create',
    'alert.acknowledge',
    'case.create',
    'evidence.upload',
  ];

  for (let i = 1; i <= 50; i++) {
    const action = actions[i % actions.length];
    const status = i % 8 === 0 ? 'failure' : 'success';

    await service.logEntry({
      action: action as any,
      userId: `user-${Math.floor(i / 10)}`,
      username: `user-${Math.floor(i / 10)}`,
      userIp: '192.168.1.1',
      resourceType: 'alert',
      resourceId: `item-${i}`,
      description: `Action ${i}`,
      status: status as any,
      severity: 'informational',
      duration: Math.random() * 1000,
    });
  }

  // Get statistics
  const stats = service.getStats();

  console.log('Audit Statistics:');
  console.log(`  Total Entries: ${stats.totalEntities}`);
  console.log(`  Unique Users: ${stats.uniqueUsers}`);
  console.log(`  Entries (Last Hour): ${stats.entriesLastHour}`);
  console.log(`  Entries (Last Day): ${stats.entriesLastDay}`);
  console.log(`  Avg Action Duration: ${stats.averageActionDuration.toFixed(0)}ms`);
  console.log(`  Failure Rate: ${(stats.failureRate * 100).toFixed(2)}%`);

  service.stop();
}

/**
 * Demo 12: Complete Integration Flow
 */
async function demo12_CompleteIntegrationFlow() {
  console.log('\n=== Demo 12: Complete Integration Flow ===\n');

  const config: IAuditServiceConfig = {
    enableAudit: true,
    enableImmutability: true,
    enableIntegrityCheck: true,
    enableCompression: false,
    enableEncryption: false,
    enableAnomalyDetection: true,
    hashAlgorithm: 'sha256',
    retentionDays: 365,
    maxAuditEntriesPerQuery: 10000,
    enableDetailedLogging: true,
    enablePerformanceMetrics: true,
  };

  const service = createAuditService(config);
  const flowSteps: string[] = [];

  // Add listeners
  service.onAuditEntry(async (entry) => {
    flowSteps.push(`[Logged] ${entry.action}`);
  });

  // User logs in
  flowSteps.push('[Start] User login process');
  await service.logEntry({
    action: 'user.login',
    userId: 'analyst-01',
    username: 'analyst-01',
    userIp: '192.168.1.100',
    resourceType: 'user',
    resourceId: 'analyst-01',
    description: 'User login',
    status: 'success',
  });

  // Create alert
  await service.logEntry({
    action: 'alert.create',
    userId: 'analyst-01',
    username: 'analyst-01',
    userIp: '192.168.1.100',
    resourceType: 'alert',
    resourceId: 'alert-001',
    description: 'Security alert created',
  });

  // Escalate to case
  await service.logEntry({
    action: 'case.create',
    userId: 'analyst-01',
    username: 'analyst-01',
    userIp: '192.168.1.100',
    resourceType: 'case',
    resourceId: 'case-001',
    description: 'Case created from alert',
  });

  // Collect evidence
  await service.logEntry({
    action: 'evidence.upload',
    userId: 'analyst-01',
    username: 'analyst-01',
    userIp: '192.168.1.100',
    resourceType: 'evidence',
    resourceId: 'evidence-001',
    description: 'Evidence collected',
  });

  // Close case
  await service.logEntry({
    action: 'case.close',
    userId: 'analyst-01',
    username: 'analyst-01',
    userIp: '192.168.1.100',
    resourceType: 'case',
    resourceId: 'case-001',
    description: 'Case closed',
  });

  // Generate report
  const report = service.generateComplianceReport('SOC2', new Date(Date.now() - 86400000), new Date());
  flowSteps.push('[Report] SOC2 compliance report generated');

  // Display flow
  console.log('Integration Flow:');
  flowSteps.forEach((step) => console.log(`  ${step}`));

  // Get final stats
  const stats = service.getStats();
  console.log(`\nFinal Statistics:`, {
    totalEntries: stats.totalEntries,
    uniqueUsers: stats.uniqueUsers,
    failureRate: `${(stats.failureRate * 100).toFixed(2)}%`,
  });

  service.stop();
}

/**
 * Run all demonstrations
 */
async function runAllDemos() {
  try {
    await demo1_BasicEntryLogging();
    await demo2_MultipleResourceActions();
    await demo3_AuditTrailForResource();
    await demo4_EntryQuerying();
    await demo5_UserActivityAnalysis();
    await demo6_BatchEntryLogging();
    await demo7_ComplianceReporting();
    await demo8_DataExport();
    await demo9_IntegrityVerification();
    await demo10_EventListeners();
    await demo11_StatisticsAndMetrics();
    await demo12_CompleteIntegrationFlow();

    console.log('\n=== All demonstrations completed successfully ===\n');
  } catch (error) {
    console.error('Demo execution failed:', error);
  }
}

// Export for testing
export {
  demo1_BasicEntryLogging,
  demo2_MultipleResourceActions,
  demo3_AuditTrailForResource,
  demo4_EntryQuerying,
  demo5_UserActivityAnalysis,
  demo6_BatchEntryLogging,
  demo7_ComplianceReporting,
  demo8_DataExport,
  demo9_IntegrityVerification,
  demo10_EventListeners,
  demo11_StatisticsAndMetrics,
  demo12_CompleteIntegrationFlow,
  runAllDemos,
};
