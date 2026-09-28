/**
 * Logging Service - Demonstration Scenarios
 */

import { LoggingService, createLoggingService, ILoggerConfig, LogListener, ErrorListener } from '../src';

/**
 * Demo 1: Basic Logging
 */
async function demo1_BasicLogging() {
  console.log('\n=== Demo 1: Basic Logging ===\n');

  const config: ILoggerConfig = {
    level: 'trace',
    format: 'json',
    destinations: ['console'],
    enableStackTrace: true,
    enableSourceLocation: false,
    enablePerformanceMetrics: true,
    enableTracing: true,
    enableErrorGrouping: true,
    enableSampling: false,
    samplingRate: 1,
    maxContextSize: 65536,
    maxLogSize: 1000000,
    maxBufferSize: 100000,
    flushInterval: 5000,
    retentionDays: 30,
    enableCompression: false,
    enableEncryption: false,
  };

  const service = createLoggingService(config);

  console.log('Logging different levels:');
  const traceId = service.trace('Trace level message');
  console.log(`  Trace: ${traceId}`);

  const debugId = service.debug('system', 'Debug level message');
  console.log(`  Debug: ${debugId}`);

  const infoId = service.info('api', 'API call successful');
  console.log(`  Info: ${infoId}`);

  const warnId = service.warn('database', 'Query took longer than expected');
  console.log(`  Warn: ${warnId}`);

  const errorId = service.error('system', 'Error occurred', new Error('Sample error'));
  console.log(`  Error: ${errorId}`);

  const fatalId = service.fatal('system', 'System failure detected');
  console.log(`  Fatal: ${fatalId}`);

  service.stop();
}

/**
 * Demo 2: Context Management
 */
async function demo2_ContextManagement() {
  console.log('\n=== Demo 2: Context Management ===\n');

  const config: ILoggerConfig = {
    level: 'debug',
    format: 'json',
    destinations: ['console'],
    enableStackTrace: false,
    enableSourceLocation: false,
    enablePerformanceMetrics: true,
    enableTracing: true,
    enableErrorGrouping: true,
    enableSampling: false,
    samplingRate: 1,
    maxContextSize: 65536,
    maxLogSize: 1000000,
    maxBufferSize: 100000,
    flushInterval: 5000,
    retentionDays: 30,
    enableCompression: false,
    enableEncryption: false,
  };

  const service = createLoggingService(config);

  console.log('Setting context:');
  service.setContext({
    userId: 'analyst-01',
    sessionId: 'session-abc123',
    correlationId: 'corr-xyz789',
    environment: 'production',
    host: 'soc-server-01',
  });

  const context = service.getContext();
  console.log(`  User ID: ${context.userId}`);
  console.log(`  Session ID: ${context.sessionId}`);
  console.log(`  Correlation ID: ${context.correlationId}`);

  console.log('\nLogging with context (included automatically):');
  service.info('api', 'User action logged with full context');

  service.stop();
}

/**
 * Demo 3: Distributed Tracing
 */
async function demo3_DistributedTracing() {
  console.log('\n=== Demo 3: Distributed Tracing ===\n');

  const config: ILoggerConfig = {
    level: 'debug',
    format: 'json',
    destinations: ['console'],
    enableStackTrace: false,
    enableSourceLocation: false,
    enablePerformanceMetrics: true,
    enableTracing: true,
    enableErrorGrouping: true,
    enableSampling: false,
    samplingRate: 1,
    maxContextSize: 65536,
    maxLogSize: 1000000,
    maxBufferSize: 100000,
    flushInterval: 5000,
    retentionDays: 30,
    enableCompression: false,
    enableEncryption: false,
  };

  const service = createLoggingService(config);

  console.log('Creating distributed trace:');
  const traceId = service.startTrace('ProcessAlert', { severity: 'high' });
  console.log(`  Trace ID: ${traceId}`);

  // Parent span
  const parentSpanId = service.startSpan('ValidateAlert');
  console.log(`  Parent Span: ${parentSpanId}`);

  service.info('api', 'Validating alert structure');

  // Child span
  const childSpanId = service.startSpan('CheckThresholds');
  console.log(`  Child Span: ${childSpanId}`);

  service.info('rule', 'Evaluating rule thresholds');
  service.endSpan(childSpanId, 'success');

  service.endSpan(parentSpanId, 'success');

  // Another span
  const storeSpanId = service.startSpan('StoreResult');
  service.info('database', 'Storing alert in database');
  service.endSpan(storeSpanId, 'success');

  service.endTrace(traceId, 'success');

  const trace = service.getTrace(traceId);
  console.log(`\nTrace completed:`);
  console.log(`  Duration: ${trace?.duration}ms`);
  console.log(`  Spans: ${trace?.spans.length}`);
  console.log(`  Status: ${trace?.status}`);

  service.stop();
}

/**
 * Demo 4: Error Grouping
 */
async function demo4_ErrorGrouping() {
  console.log('\n=== Demo 4: Error Grouping ===\n');

  const config: ILoggerConfig = {
    level: 'error',
    format: 'json',
    destinations: ['console'],
    enableStackTrace: true,
    enableSourceLocation: false,
    enablePerformanceMetrics: true,
    enableTracing: true,
    enableErrorGrouping: true,
    enableSampling: false,
    samplingRate: 1,
    maxContextSize: 65536,
    maxLogSize: 1000000,
    maxBufferSize: 100000,
    flushInterval: 5000,
    retentionDays: 30,
    enableCompression: false,
    enableEncryption: false,
  };

  const service = createLoggingService(config);

  const databaseError = new Error('Connection timeout');

  console.log('Simulating same error from multiple users:');

  service.setContext({ userId: 'user-1' });
  service.error('database', 'Failed to connect', databaseError);
  console.log('  User 1 encountered error');

  service.setContext({ userId: 'user-2' });
  service.error('database', 'Failed to connect', databaseError);
  console.log('  User 2 encountered error');

  service.setContext({ userId: 'user-3' });
  service.error('database', 'Failed to connect', databaseError);
  console.log('  User 3 encountered error');

  const groups = service.getErrorGroups();
  console.log(`\nError groups:`);
  groups.forEach((group) => {
    console.log(`  Group: ${group.groupId}`);
    console.log(`    Type: ${group.errorType}`);
    console.log(`    Message: ${group.errorMessage}`);
    console.log(`    Occurrences: ${group.occurrenceCount}`);
    console.log(`    Affected Users: ${group.affectedUsers}`);
  });

  service.stop();
}

/**
 * Demo 5: Querying Logs
 */
async function demo5_QueryingLogs() {
  console.log('\n=== Demo 5: Querying Logs ===\n');

  const config: ILoggerConfig = {
    level: 'trace',
    format: 'json',
    destinations: ['console'],
    enableStackTrace: false,
    enableSourceLocation: false,
    enablePerformanceMetrics: true,
    enableTracing: true,
    enableErrorGrouping: true,
    enableSampling: false,
    samplingRate: 1,
    maxContextSize: 65536,
    maxLogSize: 1000000,
    maxBufferSize: 100000,
    flushInterval: 5000,
    retentionDays: 30,
    enableCompression: false,
    enableEncryption: false,
  };

  const service = createLoggingService(config);

  // Create varied logs
  for (let i = 1; i <= 20; i++) {
    const level = i % 5 === 0 ? 'error' : i % 3 === 0 ? 'warn' : 'info';
    const category = i % 2 === 0 ? 'api' : i % 3 === 0 ? 'database' : 'system';

    service.log(level as any, category as any, `Operation ${i} completed`);
  }

  console.log('Query Examples:');

  const errorLogs = service.queryEntries({ levelFilter: ['error'] });
  console.log(`\n  By Level (error): ${errorLogs.length} logs`);

  const apiLogs = service.queryEntries({ categoryFilter: ['api'] });
  console.log(`  By Category (api): ${apiLogs.length} logs`);

  const warnings = service.queryEntries({ levelFilter: ['warn'] });
  console.log(`  By Level (warn): ${warnings.length} logs`);

  const searchResults = service.queryEntries({ searchText: 'Operation 1' });
  console.log(`  By Text search: ${searchResults.length} logs`);

  const paginated = service.queryEntries({ limit: 5 });
  console.log(`  Paginated (limit 5): ${paginated.length} logs`);

  service.stop();
}

/**
 * Demo 6: Slow Query Logging
 */
async function demo6_SlowQueryLogging() {
  console.log('\n=== Demo 6: Slow Query Logging ===\n');

  const config: ILoggerConfig = {
    level: 'warn',
    format: 'json',
    destinations: ['console'],
    enableStackTrace: false,
    enableSourceLocation: false,
    enablePerformanceMetrics: true,
    enableTracing: true,
    enableErrorGrouping: true,
    enableSampling: false,
    samplingRate: 1,
    maxContextSize: 65536,
    maxLogSize: 1000000,
    maxBufferSize: 100000,
    flushInterval: 5000,
    retentionDays: 30,
    enableCompression: false,
    enableEncryption: false,
  };

  const service = createLoggingService(config);

  console.log('Logging slow queries:');

  const queries = [
    { name: 'GetAlerts', duration: 2500, threshold: 1000 },
    { name: 'GetCases', duration: 3200, threshold: 1000 },
    { name: 'SearchEvents', duration: 5100, threshold: 2000 },
  ];

  for (const q of queries) {
    const sql = `SELECT * FROM ${q.name.toLowerCase()} LIMIT 100`;
    service.logSlowQuery(q.name, q.duration, q.threshold, sql);
    console.log(`  ${q.name}: ${q.duration}ms (threshold: ${q.threshold}ms)`);
  }

  const stats = service.getStats();
  console.log(`\nSlow query statistics:`);
  console.log(`  Total slow queries: ${stats.slowQueryCount}`);

  service.stop();
}

/**
 * Demo 7: Statistics
 */
async function demo7_Statistics() {
  console.log('\n=== Demo 7: Statistics ===\n');

  const config: ILoggerConfig = {
    level: 'trace',
    format: 'json',
    destinations: ['console'],
    enableStackTrace: false,
    enableSourceLocation: false,
    enablePerformanceMetrics: true,
    enableTracing: true,
    enableErrorGrouping: true,
    enableSampling: false,
    samplingRate: 1,
    maxContextSize: 65536,
    maxLogSize: 1000000,
    maxBufferSize: 100000,
    flushInterval: 5000,
    retentionDays: 30,
    enableCompression: false,
    enableEncryption: false,
  };

  const service = createLoggingService(config);

  // Generate varied logs
  for (let i = 1; i <= 50; i++) {
    const level = i % 10 === 0 ? 'error' : i % 5 === 0 ? 'warn' : 'info';
    const categories = ['api', 'database', 'cache', 'event', 'system'];
    const category = categories[i % categories.length];

    service.log(level as any, category as any, `Log ${i}`);
  }

  const stats = service.getStats();

  console.log('Logging Service Statistics:');
  console.log(`  Total Logs: ${stats.totalLogs}`);
  console.log(`  Error Rate: ${(stats.errorRate * 100).toFixed(2)}%`);
  console.log(`  Logs Last Hour: ${stats.logsLastHour}`);
  console.log(`\nBy Level:`);
  Object.entries(stats.logsByLevel).forEach(([level, count]) => {
    if (count > 0) console.log(`  ${level}: ${count}`);
  });
  console.log(`\nBy Category:`);
  Object.entries(stats.logsByCategory).forEach(([cat, count]) => {
    if (count > 0) console.log(`  ${cat}: ${count}`);
  });

  service.stop();
}

/**
 * Demo 8: Log Export
 */
async function demo8_LogExport() {
  console.log('\n=== Demo 8: Log Export ===\n');

  const config: ILoggerConfig = {
    level: 'debug',
    format: 'json',
    destinations: ['console'],
    enableStackTrace: false,
    enableSourceLocation: false,
    enablePerformanceMetrics: true,
    enableTracing: true,
    enableErrorGrouping: true,
    enableSampling: false,
    samplingRate: 1,
    maxContextSize: 65536,
    maxLogSize: 1000000,
    maxBufferSize: 100000,
    flushInterval: 5000,
    retentionDays: 30,
    enableCompression: false,
    enableEncryption: false,
  };

  const service = createLoggingService(config);

  for (let i = 1; i <= 10; i++) {
    service.info('api', `Operation ${i}`);
  }

  console.log('Exporting logs in different formats:');

  const jsonExport = await service.exportLogs({ format: 'json', query: {} });
  console.log(`\nJSON Export:`);
  console.log(`  Records: ${jsonExport.totalRecords}`);
  console.log(`  Size: ${jsonExport.fileSize} bytes`);
  console.log(`  Checksum: ${jsonExport.checksum.substring(0, 16)}...`);

  const csvExport = await service.exportLogs({ format: 'csv', query: {} });
  console.log(`\nCSV Export:`);
  console.log(`  Records: ${csvExport.totalRecords}`);
  console.log(`  Size: ${csvExport.fileSize} bytes`);

  service.stop();
}

/**
 * Demo 9: Event Listeners
 */
async function demo9_EventListeners() {
  console.log('\n=== Demo 9: Event Listeners ===\n');

  const config: ILoggerConfig = {
    level: 'debug',
    format: 'json',
    destinations: ['console'],
    enableStackTrace: false,
    enableSourceLocation: false,
    enablePerformanceMetrics: true,
    enableTracing: true,
    enableErrorGrouping: true,
    enableSampling: false,
    samplingRate: 1,
    maxContextSize: 65536,
    maxLogSize: 1000000,
    maxBufferSize: 100000,
    flushInterval: 5000,
    retentionDays: 30,
    enableCompression: false,
    enableEncryption: false,
  };

  const service = createLoggingService(config);
  const events: string[] = [];

  service.onLog(async (entry) => {
    events.push(`[Log] ${entry.level.toUpperCase()} - ${entry.message}`);
  });

  service.onError(async (group) => {
    events.push(`[Error] ${group.errorType} occurred ${group.occurrenceCount}x`);
  });

  console.log('Triggering events with listeners:');

  service.info('api', 'User logged in');
  service.warn('database', 'Slow query');
  service.error('system', 'Connection failed', new Error('DB error'));

  console.log('\nCaptured Events:');
  events.forEach((e) => console.log(`  ${e}`));

  service.stop();
}

/**
 * Demo 10: Health Metrics
 */
async function demo10_HealthMetrics() {
  console.log('\n=== Demo 10: Health Metrics ===\n');

  const config: ILoggerConfig = {
    level: 'info',
    format: 'json',
    destinations: ['console'],
    enableStackTrace: false,
    enableSourceLocation: false,
    enablePerformanceMetrics: true,
    enableTracing: true,
    enableErrorGrouping: true,
    enableSampling: false,
    samplingRate: 1,
    maxContextSize: 65536,
    maxLogSize: 1000000,
    maxBufferSize: 100000,
    flushInterval: 5000,
    retentionDays: 30,
    enableCompression: false,
    enableEncryption: false,
  };

  const service = createLoggingService(config);

  for (let i = 1; i <= 30; i++) {
    service.info('api', `Request ${i}`);
  }

  const health = await service.performHealthCheck();
  const metrics = service.getApplicationHealth();

  console.log('Logging Service Health:');
  console.log(`  Overall Status: ${health.status}`);
  console.log(`  Storage Health: ${health.storageHealth}`);
  console.log(`  Processing Health: ${health.processingHealth}`);

  console.log('\nApplication Metrics:');
  console.log(`  Uptime: ${metrics.uptime.toFixed(2)}s`);
  console.log(`  Memory (heap): ${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  Request Count: ${metrics.requestCount}`);
  console.log(`  Error Count: ${metrics.errorCount}`);

  service.stop();
}

/**
 * Demo 11: Retention Policies
 */
async function demo11_RetentionPolicies() {
  console.log('\n=== Demo 11: Retention Policies ===\n');

  const config: ILoggerConfig = {
    level: 'info',
    format: 'json',
    destinations: ['console'],
    enableStackTrace: false,
    enableSourceLocation: false,
    enablePerformanceMetrics: true,
    enableTracing: true,
    enableErrorGrouping: true,
    enableSampling: false,
    samplingRate: 1,
    maxContextSize: 65536,
    maxLogSize: 1000000,
    maxBufferSize: 100000,
    flushInterval: 5000,
    retentionDays: 30,
    enableCompression: false,
    enableEncryption: false,
  };

  const service = createLoggingService(config);

  console.log('Registering retention policies:');

  const policy1 = service.registerRetentionPolicy({
    name: 'short-term-logs',
    description: 'Keep debug/trace logs for 7 days',
    levelFilter: ['trace', 'debug'],
    retentionDays: 7,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`  Short-term policy registered: ${policy1}`);

  const policy2 = service.registerRetentionPolicy({
    name: 'long-term-errors',
    description: 'Keep error logs for 90 days',
    levelFilter: ['error', 'fatal'],
    retentionDays: 90,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`  Long-term policy registered: ${policy2}`);

  service.stop();
}

/**
 * Demo 12: Complete Integration Flow
 */
async function demo12_CompleteIntegrationFlow() {
  console.log('\n=== Demo 12: Complete Integration Flow ===\n');

  const config: ILoggerConfig = {
    level: 'debug',
    format: 'json',
    destinations: ['console', 'file'],
    enableStackTrace: true,
    enableSourceLocation: false,
    enablePerformanceMetrics: true,
    enableTracing: true,
    enableErrorGrouping: true,
    enableSampling: false,
    samplingRate: 1,
    maxContextSize: 65536,
    maxLogSize: 1000000,
    maxBufferSize: 100000,
    flushInterval: 5000,
    retentionDays: 30,
    enableCompression: false,
    enableEncryption: false,
  };

  const service = createLoggingService(config);
  const flowSteps: string[] = [];

  service.setContext({
    userId: 'analyst-01',
    correlationId: 'incident-2024-001',
    environment: 'production',
  });

  // Simulate incident investigation
  flowSteps.push('[Start] Incident investigation initiated');

  const traceId = service.startTrace('IncidentInvestigation');

  const span1 = service.startSpan('GatherEvidence');
  service.info('event', 'Retrieving related events');
  service.endSpan(span1, 'success');
  flowSteps.push('[Trace] Evidence gathered');

  const span2 = service.startSpan('AnalyzeTimeline');
  service.info('analysis', 'Building event timeline');
  service.endSpan(span2, 'success');
  flowSteps.push('[Trace] Timeline analyzed');

  try {
    const span3 = service.startSpan('GenerateReport');
    service.info('report', 'Generating investigation report');
    service.endSpan(span3, 'success');
  } catch (error) {
    service.error('report', 'Report generation failed', error as Error);
  }

  service.endTrace(traceId, 'success');
  flowSteps.push('[End] Investigation complete');

  console.log('Investigation Flow:');
  flowSteps.forEach((s) => console.log(`  ${s}`));

  const stats = service.getStats();
  const trace = service.getTrace(traceId);

  console.log(`\nFinal Metrics:`, {
    logsGenerated: stats.totalLogs,
    traceDuration: `${trace?.duration}ms`,
    spans: trace?.spans.length,
  });

  service.stop();
}

/**
 * Run all demonstrations
 */
async function runAllDemos() {
  try {
    await demo1_BasicLogging();
    await demo2_ContextManagement();
    await demo3_DistributedTracing();
    await demo4_ErrorGrouping();
    await demo5_QueryingLogs();
    await demo6_SlowQueryLogging();
    await demo7_Statistics();
    await demo8_LogExport();
    await demo9_EventListeners();
    await demo10_HealthMetrics();
    await demo11_RetentionPolicies();
    await demo12_CompleteIntegrationFlow();

    console.log('\n=== All demonstrations completed successfully ===\n');
  } catch (error) {
    console.error('Demo execution failed:', error);
  }
}

export {
  demo1_BasicLogging,
  demo2_ContextManagement,
  demo3_DistributedTracing,
  demo4_ErrorGrouping,
  demo5_QueryingLogs,
  demo6_SlowQueryLogging,
  demo7_Statistics,
  demo8_LogExport,
  demo9_EventListeners,
  demo10_HealthMetrics,
  demo11_RetentionPolicies,
  demo12_CompleteIntegrationFlow,
  runAllDemos,
};
