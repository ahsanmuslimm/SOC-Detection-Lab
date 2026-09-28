/**
 * Export Service - Demo Scenarios
 * Real-world usage patterns and integration examples
 */

import { createExportService, IExportServiceConfig, IExportEvent } from '../src/index';

const config: IExportServiceConfig = {
  maxConcurrentJobs: 5,
  maxJobSize: 104857600,
  maxCacheSize: 1073741824,
  cacheExpiry: 3600000,
  enableCompression: true,
  defaultCompression: 'gzip',
  enableEncryption: false,
  enableAudit: true,
  maxAuditEntries: 10000,
  enableMetrics: true,
  enableScheduling: true,
  cleanupIntervalMs: 60000,
  temporaryStoragePath: '/tmp/exports',
  maxRetries: 3,
  requestTimeoutMs: 30000,
  enableCache: true,
};

const service = createExportService(config);

/**
 * Demo 1: Basic Job Creation
 */
async function demo1_BasicJobCreation(): Promise<void> {
  console.log('\n=== Demo 1: Basic Job Creation ===\n');

  // Create simple JSON export
  const jsonJobId = service.createExportJob({
    name: 'Users Export to JSON',
    format: 'JSON',
    dataSource: {
      type: 'database',
      sourceId: 'production-db',
      tableName: 'users',
    },
  });

  console.log(`Created JSON job: ${jsonJobId}`);

  // Create CSV export
  const csvJobId = service.createExportJob({
    name: 'Orders Export to CSV',
    format: 'CSV',
    dataSource: {
      type: 'database',
      sourceId: 'production-db',
      tableName: 'orders',
    },
  });

  console.log(`Created CSV job: ${csvJobId}`);

  // Create XML export
  const xmlJobId = service.createExportJob({
    name: 'Products Export to XML',
    format: 'XML',
    dataSource: {
      type: 'database',
      sourceId: 'production-db',
      tableName: 'products',
    },
  });

  console.log(`Created XML job: ${xmlJobId}`);

  // List all jobs
  const allJobs = service.listExportJobs();
  console.log(`\nTotal jobs created: ${allJobs.length}`);
  allJobs.forEach((job) => {
    console.log(`  - ${job.name} (${job.format})`);
  });
}

/**
 * Demo 2: Job Filtering and Sorting
 */
async function demo2_FilteringAndSorting(): Promise<void> {
  console.log('\n=== Demo 2: Filtering and Sorting ===\n');

  // Create job with filters
  const filteredJobId = service.createExportJob({
    name: 'Active Users Export',
    format: 'CSV',
    dataSource: {
      type: 'database',
      sourceId: 'production-db',
      query: 'SELECT * FROM users',
    },
    filters: [
      { field: 'status', operator: 'eq', value: 'active' },
      { field: 'createdAt', operator: 'gte', value: '2024-01-01' },
      { field: 'department', operator: 'in', values: ['sales', 'engineering'] },
    ],
    columns: ['id', 'name', 'email', 'department', 'joinDate'],
    sorting: [
      { field: 'department', order: 'asc' },
      { field: 'name', order: 'asc' },
    ],
  });

  console.log(`Created filtered export job: ${filteredJobId}`);

  const job = service.getExportJob(filteredJobId);
  console.log(`\nJob Configuration:`);
  console.log(`  Format: ${job?.format}`);
  console.log(`  Filters: ${job?.filters?.length}`);
  console.log(`  Columns: ${job?.columns?.join(', ')}`);
  console.log(`  Sorting: ${job?.sorting?.map((s) => `${s.field}:${s.order}`).join(', ')}`);
}

/**
 * Demo 3: Template Creation
 */
async function demo3_TemplateCreation(): Promise<void> {
  console.log('\n=== Demo 3: Template Creation ===\n');

  // Create templates for common exports
  const userTemplateId = service.createTemplate({
    name: 'User Report Template',
    format: 'CSV',
    defaultColumns: ['id', 'name', 'email', 'role', 'status', 'createdAt'],
    compression: 'gzip',
  });

  console.log(`Created user report template: ${userTemplateId}`);

  const orderTemplateId = service.createTemplate({
    name: 'Order Analysis Template',
    format: 'JSON',
    defaultColumns: ['orderId', 'customerId', 'total', 'status', 'date'],
    compression: 'brotli',
  });

  console.log(`Created order analysis template: ${orderTemplateId}`);

  const auditTemplateId = service.createTemplate({
    name: 'Audit Log Template',
    format: 'XML',
    defaultColumns: ['timestamp', 'action', 'user', 'resource', 'details'],
    encryption: true,
  });

  console.log(`Created audit log template: ${auditTemplateId}`);

  // List all templates
  const templates = service.listTemplates();
  console.log(`\nTotal templates: ${templates.length}`);
  templates.forEach((tmpl) => {
    console.log(`  - ${tmpl.name} (${tmpl.format})`);
  });
}

/**
 * Demo 4: Schedule Management
 */
async function demo4_ScheduleManagement(): Promise<void> {
  console.log('\n=== Demo 4: Schedule Management ===\n');

  // Create daily export schedule
  const dailyScheduleId = service.createSchedule({
    name: 'Daily User Export',
    frequency: 'daily',
  });

  console.log(`Created daily schedule: ${dailyScheduleId}`);

  // Create weekly export schedule
  const weeklyScheduleId = service.createSchedule({
    name: 'Weekly Analytics Export',
    frequency: 'weekly',
  });

  console.log(`Created weekly schedule: ${weeklyScheduleId}`);

  // Create monthly export schedule
  const monthlyScheduleId = service.createSchedule({
    name: 'Monthly Report Export',
    frequency: 'monthly',
  });

  console.log(`Created monthly schedule: ${monthlyScheduleId}`);

  // List all schedules
  const schedules = service.listSchedules();
  console.log(`\nTotal schedules: ${schedules.length}`);
  schedules.forEach((sch) => {
    console.log(`  - ${sch.name} (${sch.frequency})`);
  });
}

/**
 * Demo 5: Job Execution
 */
async function demo5_JobExecution(): Promise<void> {
  console.log('\n=== Demo 5: Job Execution ===\n');

  // Create and execute job
  const jobId = service.createExportJob({
    name: 'Executive Export',
    format: 'JSON',
    dataSource: {
      type: 'query',
      sourceId: 'analytics-db',
      query: 'SELECT * FROM reports WHERE type = "executive"',
    },
    compression: 'gzip',
    deliveryMethods: ['download', 'email'],
  });

  console.log(`Created job: ${jobId}`);

  // Start job
  console.log('\nStarting job execution...');
  await service.startExportJob(jobId);

  // Get job details
  const job = service.getExportJob(jobId);
  console.log(`\nJob Completed:`);
  console.log(`  Status: ${job?.status}`);
  console.log(`  Progress: ${job?.progress}%`);
  console.log(`  Rows Exported: ${job?.rowCount}`);
  console.log(`  File Size: ${job?.fileSize} bytes`);
  console.log(`  Compression: ${job?.compression}`);
  console.log(`  Delivery Methods: ${job?.deliveryMethods.join(', ')}`);
}

/**
 * Demo 6: Batch Export
 */
async function demo6_BatchExport(): Promise<void> {
  console.log('\n=== Demo 6: Batch Export ===\n');

  // Execute batch export
  const batchResult = await service.batchExport({
    jobs: [
      {
        name: 'Users Batch Export',
        format: 'CSV',
        dataSource: { type: 'database', sourceId: 'db1', tableName: 'users' },
        filters: [{ field: 'status', operator: 'eq', value: 'active' }],
      },
      {
        name: 'Orders Batch Export',
        format: 'JSON',
        dataSource: { type: 'database', sourceId: 'db1', tableName: 'orders' },
        filters: [{ field: 'amount', operator: 'gte', value: 100 }],
      },
      {
        name: 'Products Batch Export',
        format: 'XML',
        dataSource: { type: 'database', sourceId: 'db1', tableName: 'products' },
        filters: [{ field: 'category', operator: 'eq', value: 'electronics' }],
      },
    ],
    parallelJobs: 2,
    stopOnError: false,
  });

  console.log(`Batch ID: ${batchResult.batchId}`);
  console.log(`\nBatch Results:`);
  console.log(`  Total Jobs: ${batchResult.totalJobs}`);
  console.log(`  Successful: ${batchResult.successfulJobs}`);
  console.log(`  Failed: ${batchResult.failedJobs}`);
  console.log(`  Started: ${batchResult.startedAt.toISOString()}`);
  console.log(`  Completed: ${batchResult.completedAt.toISOString()}`);
}

/**
 * Demo 7: Compression Options
 */
async function demo7_CompressionOptions(): Promise<void> {
  console.log('\n=== Demo 7: Compression Options ===\n');

  const compressions: Array<'gzip' | 'brotli' | 'deflate' | 'lz4' | 'none'> = ['gzip', 'brotli', 'none'];

  for (const compression of compressions) {
    const jobId = service.createExportJob({
      name: `Export with ${compression} compression`,
      format: 'JSON',
      dataSource: {
        type: 'database',
        sourceId: 'db1',
        tableName: 'large_table',
      },
      compression: compression as any,
    });

    console.log(`Created job with ${compression} compression: ${jobId}`);
  }

  const jobs = service.listExportJobs();
  console.log(`\nAll compression jobs:`);
  jobs.slice(-3).forEach((job) => {
    console.log(`  - ${job.name} (Compression: ${job.compression})`);
  });
}

/**
 * Demo 8: Format Support
 */
async function demo8_FormatSupport(): Promise<void> {
  console.log('\n=== Demo 8: Format Support ===\n');

  const formats: ExportFormat[] = ['JSON', 'CSV', 'XML', 'XLSX', 'PDF', 'HTML'];

  for (const format of formats) {
    const jobId = service.createExportJob({
      name: `Export to ${format}`,
      format: format,
      dataSource: {
        type: 'database',
        sourceId: 'db1',
        tableName: 'data',
      },
    });

    console.log(`Created ${format} export job: ${jobId}`);
  }

  const jobs = service.listExportJobs();
  const formatCount: Record<string, number> = {};

  for (const job of jobs) {
    formatCount[job.format] = (formatCount[job.format] || 0) + 1;
  }

  console.log(`\nFormat Distribution:`);
  Object.entries(formatCount).forEach(([format, count]) => {
    console.log(`  ${format}: ${count} jobs`);
  });
}

/**
 * Demo 9: Data Sources
 */
async function demo9_DataSources(): Promise<void> {
  console.log('\n=== Demo 9: Data Sources ===\n');

  // Database source
  const dbJobId = service.createExportJob({
    name: 'Database Export',
    format: 'CSV',
    dataSource: {
      type: 'database',
      sourceId: 'production',
      tableName: 'users',
    },
  });

  console.log(`Created database export: ${dbJobId}`);

  // Query source
  const queryJobId = service.createExportJob({
    name: 'Query Export',
    format: 'JSON',
    dataSource: {
      type: 'query',
      sourceId: 'analytics',
      query: 'SELECT COUNT(*) as total, status FROM orders GROUP BY status',
    },
  });

  console.log(`Created query export: ${queryJobId}`);

  // API source
  const apiJobId = service.createExportJob({
    name: 'API Export',
    format: 'JSON',
    dataSource: {
      type: 'api',
      sourceId: 'external',
      endpoint: 'https://api.example.com/data?limit=1000',
    },
  });

  console.log(`Created API export: ${apiJobId}`);

  // File source
  const fileJobId = service.createExportJob({
    name: 'File Export',
    format: 'CSV',
    dataSource: {
      type: 'file',
      sourceId: 'uploads',
    },
  });

  console.log(`Created file export: ${fileJobId}`);
}

/**
 * Demo 10: Event Tracking
 */
async function demo10_EventTracking(): Promise<void> {
  console.log('\n=== Demo 10: Event Tracking ===\n');

  const events: IExportEvent[] = [];

  service.onEvent(async (event) => {
    events.push(event);
    console.log(`Event: ${event.type}`);
  });

  // Create and execute job
  const jobId = service.createExportJob({
    name: 'Tracked Export',
    format: 'JSON',
    dataSource: {
      type: 'database',
      sourceId: 'db1',
    },
  });

  await service.startExportJob(jobId);

  console.log(`\nTotal events captured: ${events.length}`);
  console.log('Event types:');
  const eventTypes = new Set(events.map((e) => e.type));
  eventTypes.forEach((type) => {
    const count = events.filter((e) => e.type === type).length;
    console.log(`  - ${type}: ${count}`);
  });
}

/**
 * Demo 11: Health Check
 */
async function demo11_HealthCheck(): Promise<void> {
  console.log('\n=== Demo 11: Health Check ===\n');

  // Create some jobs
  for (let i = 0; i < 3; i++) {
    service.createExportJob({
      name: `Health Check Job ${i + 1}`,
      format: i % 2 === 0 ? 'JSON' : 'CSV',
      dataSource: { type: 'database', sourceId: 'db1' },
    });
  }

  // Perform health check
  const health = await service.performHealthCheck();

  console.log(`System Status: ${health.status}`);
  console.log(`Timestamp: ${health.timestamp.toISOString()}`);
  console.log(`\nHealthcheck Details:`);
  console.log(`  Active Jobs: ${health.activeJobs}`);
  console.log(`  Queued Jobs: ${health.queuedJobs}`);
  console.log(`  Failed (last hour): ${health.failedJobsLastHour}`);
  console.log(`  Avg Processing Time: ${health.averageProcessingTime}ms`);
  console.log(`\nDisk Usage:`);
  console.log(`  Used: ${health.diskUsage.usedMB} MB`);
  console.log(`  Available: ${health.diskUsage.availableMB} MB`);
  console.log(`  Utilization: ${health.diskUsage.utilizationPercentage}%`);
}

/**
 * Demo 12: Complete Workflow
 */
async function demo12_CompleteWorkflow(): Promise<void> {
  console.log('\n=== Demo 12: Complete Workflow ===\n');

  console.log('Setting up automated reporting system...\n');

  // Step 1: Create templates
  console.log('Step 1: Creating export templates');
  const reportTemplateId = service.createTemplate({
    name: 'Monthly Business Report',
    format: 'PDF',
    defaultColumns: ['metric', 'value', 'comparison', 'trend'],
  });
  console.log(`✓ Created report template: ${reportTemplateId}`);

  // Step 2: Create schedules
  console.log('\nStep 2: Creating export schedules');
  const monthlyScheduleId = service.createSchedule({
    name: 'Monthly Report Generation',
    frequency: 'monthly',
    templateId: reportTemplateId,
  });
  console.log(`✓ Created monthly schedule: ${monthlyScheduleId}`);

  // Step 3: Create export job
  console.log('\nStep 3: Creating export job');
  const jobId = service.createExportJob({
    name: 'Q1 Business Analytics Report',
    format: 'JSON',
    dataSource: {
      type: 'query',
      sourceId: 'analytics-db',
      query: 'SELECT * FROM quarterly_metrics WHERE quarter = 1',
    },
    filters: [
      { field: 'status', operator: 'eq', value: 'verified' },
      { field: 'confidence', operator: 'gte', value: 0.95 },
    ],
    sorting: [{ field: 'metric_importance', order: 'desc' }],
    compression: 'gzip',
    deliveryMethods: ['email', 'storage'],
  });
  console.log(`✓ Created export job: ${jobId}`);

  // Step 4: Execute job
  console.log('\nStep 4: Executing export job');
  await service.startExportJob(jobId);
  const job = service.getExportJob(jobId);
  console.log(`✓ Job completed: ${job?.status}`);
  console.log(`  Rows exported: ${job?.rowCount}`);
  console.log(`  File size: ${job?.fileSize} bytes`);

  // Step 5: Statistics
  console.log('\nStep 5: Exporting statistics');
  const stats = service.getExportStatistics();
  console.log(`✓ Statistics:`);
  console.log(`  Total jobs: ${stats.totalJobs}`);
  console.log(`  Completed: ${stats.completedJobs}`);
  console.log(`  Failed: ${stats.failedJobs}`);

  // Step 6: Health check
  console.log('\nStep 6: System health verification');
  const health = await service.performHealthCheck();
  console.log(`✓ System status: ${health.status}`);

  console.log('\n✓ Complete workflow executed successfully!');
}

/**
 * Type definition needed for demo
 */
type ExportFormat = 'JSON' | 'CSV' | 'XML' | 'PARQUET' | 'AVRO' | 'XLSX' | 'PDF' | 'HTML';

/**
 * Run all demos
 */
async function runAllDemos(): Promise<void> {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     EXPORT SERVICE - DEMO SCENARIOS    ║');
  console.log('╚════════════════════════════════════════╝');

  await demo1_BasicJobCreation();
  await demo2_FilteringAndSorting();
  await demo3_TemplateCreation();
  await demo4_ScheduleManagement();
  await demo5_JobExecution();
  await demo6_BatchExport();
  await demo7_CompressionOptions();
  await demo8_FormatSupport();
  await demo9_DataSources();
  await demo10_EventTracking();
  await demo11_HealthCheck();
  await demo12_CompleteWorkflow();

  service.stop();

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║         ALL DEMOS COMPLETED            ║');
  console.log('╚════════════════════════════════════════╝\n');
}

// Execute
runAllDemos().catch(console.error);
