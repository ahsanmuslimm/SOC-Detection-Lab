/**
 * Sync Service - Demo Scenarios
 * Real-world usage patterns and integration examples
 */

import { createSyncService, ISyncServiceConfig, ISyncEvent } from '../src/index';

const config: ISyncServiceConfig = {
  maxConcurrentSyncs: 5,
  maxBatchSize: 1000,
  defaultBatchSize: 100,
  enableCheckpoints: true,
  checkpointInterval: 60000,
  enableAudit: true,
  maxAuditEntries: 10000,
  enableMetrics: true,
  enableConflictTracking: true,
  cleanupIntervalMs: 60000,
  retentionDays: 7,
  requestTimeoutMs: 30000,
  maxRetries: 3,
};

const service = createSyncService(config);

/**
 * Demo 1: Basic Endpoint Registration
 */
async function demo1_BasicEndpointRegistration(): Promise<void> {
  console.log('\n=== Demo 1: Basic Endpoint Registration ===\n');

  // Register source endpoint
  const sourceEpId = service.registerEndpoint({
    name: 'Production Database',
    type: 'database',
    config: {
      connectionString: 'postgresql://localhost/production',
    },
    enabled: true,
  });

  console.log(`Registered source endpoint: ${sourceEpId}`);

  // Register target endpoint
  const targetEpId = service.registerEndpoint({
    name: 'Cloud API',
    type: 'api',
    config: {
      apiUrl: 'https://api.cloud.example.com',
    },
    enabled: true,
  });

  console.log(`Registered target endpoint: ${targetEpId}`);

  // List endpoints
  const endpoints = service.listEndpoints();
  console.log(`\nTotal endpoints: ${endpoints.length}`);
  endpoints.forEach((ep) => {
    console.log(`  - ${ep.name} (${ep.type})`);
  });
}

/**
 * Demo 2: Sync Configuration
 */
async function demo2_SyncConfiguration(): Promise<void> {
  console.log('\n=== Demo 2: Sync Configuration ===\n');

  const sourceEpId = service.registerEndpoint({
    name: 'Source DB',
    type: 'database',
    config: {},
    enabled: true,
  });

  const targetEpId = service.registerEndpoint({
    name: 'Target API',
    type: 'api',
    config: {},
    enabled: true,
  });

  const sourceEp = service.getEndpoint(sourceEpId)!;
  const targetEp = service.getEndpoint(targetEpId)!;

  // Create user sync
  const userSyncId = service.createSync({
    name: 'User Synchronization',
    sourceEndpoint: sourceEp,
    targetEndpoint: targetEp,
    direction: 'unidirectional',
    entityTypes: ['users', 'profiles'],
    conflictResolution: 'source-wins',
    scheduleType: 'continuous',
    batchSize: 100,
    retryPolicy: {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
    },
    enabled: true,
  });

  console.log(`Created user sync: ${userSyncId}`);

  // Create bidirectional sync
  const orderSyncId = service.createSync({
    name: 'Order Synchronization',
    sourceEndpoint: sourceEp,
    targetEndpoint: targetEp,
    direction: 'bidirectional',
    entityTypes: ['orders', 'order_items'],
    conflictResolution: 'timestamp',
    scheduleType: 'scheduled',
    scheduleInterval: 300000,
    batchSize: 250,
    retryPolicy: {
      maxRetries: 5,
      initialDelayMs: 500,
      maxDelayMs: 5000,
      backoffMultiplier: 1.5,
    },
    enabled: true,
  });

  console.log(`Created order sync: ${orderSyncId}`);

  // List syncs
  const syncs = service.listSyncs();
  console.log(`\nTotal syncs: ${syncs.length}`);
  syncs.forEach((sync) => {
    console.log(`  - ${sync.name} (${sync.direction}, ${sync.entityTypes.join(', ')})`);
  });
}

/**
 * Demo 3: Sync Execution
 */
async function demo3_SyncExecution(): Promise<void> {
  console.log('\n=== Demo 3: Sync Execution ===\n');

  const sourceEpId = service.registerEndpoint({
    name: 'Source',
    type: 'database',
    config: {},
    enabled: true,
  });

  const targetEpId = service.registerEndpoint({
    name: 'Target',
    type: 'api',
    config: {},
    enabled: true,
  });

  const syncId = service.createSync({
    name: 'Execution Test',
    sourceEndpoint: service.getEndpoint(sourceEpId)!,
    targetEndpoint: service.getEndpoint(targetEpId)!,
    direction: 'unidirectional',
    entityTypes: ['test'],
    conflictResolution: 'source-wins',
    scheduleType: 'continuous',
    batchSize: 100,
    retryPolicy: {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
    },
    enabled: true,
  });

  console.log(`Starting sync: ${syncId}`);
  const jobId = await service.startSync(syncId);
  console.log(`Created sync job: ${jobId}`);

  // Wait a bit for job to process
  await new Promise((resolve) => setTimeout(resolve, 200));

  const job = service.getSyncJob(jobId);
  console.log(`\nJob Status:`);
  console.log(`  Status: ${job?.status}`);
  console.log(`  Total entities: ${job?.totalEntities}`);
  console.log(`  Synced: ${job?.syncedEntities}`);
  console.log(`  Failed: ${job?.failedEntities}`);
  console.log(`  Progress: ${job?.progress}%`);
}

/**
 * Demo 4: Job Control
 */
async function demo4_JobControl(): Promise<void> {
  console.log('\n=== Demo 4: Job Control ===\n');

  const sourceEpId = service.registerEndpoint({
    name: 'Source',
    type: 'database',
    config: {},
    enabled: true,
  });

  const targetEpId = service.registerEndpoint({
    name: 'Target',
    type: 'api',
    config: {},
    enabled: true,
  });

  const syncId = service.createSync({
    name: 'Control Test',
    sourceEndpoint: service.getEndpoint(sourceEpId)!,
    targetEndpoint: service.getEndpoint(targetEpId)!,
    direction: 'unidirectional',
    entityTypes: ['test'],
    conflictResolution: 'source-wins',
    scheduleType: 'continuous',
    batchSize: 100,
    retryPolicy: {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
    },
    enabled: true,
  });

  const jobId = await service.startSync(syncId);

  // Pause job
  console.log('Pausing job...');
  const paused = service.pauseSync(jobId);
  console.log(`Paused: ${paused}`);

  // Resume job
  console.log('Resuming job...');
  const resumed = service.resumeSync(jobId);
  console.log(`Resumed: ${resumed}`);

  // Cancel job
  console.log('Cancelling job...');
  const cancelled = service.cancelSync(jobId);
  console.log(`Cancelled: ${cancelled}`);
}

/**
 * Demo 5: Multiple Endpoints
 */
async function demo5_MultipleEndpoints(): Promise<void> {
  console.log('\n=== Demo 5: Multiple Endpoints ===\n');

  const endpoints = [
    { name: 'PostgreSQL Primary', type: 'database' },
    { name: 'PostgreSQL Replica', type: 'database' },
    { name: 'Redis Cache', type: 'storage' },
    { name: 'REST API', type: 'api' },
    { name: 'GraphQL API', type: 'api' },
  ];

  console.log('Registering multiple endpoints...');
  const epIds: string[] = [];

  for (const ep of endpoints) {
    const epId = service.registerEndpoint({
      name: ep.name,
      type: ep.type as any,
      config: {},
      enabled: true,
    });
    epIds.push(epId);
    console.log(`✓ ${ep.name}: ${epId}`);
  }

  const registered = service.listEndpoints();
  console.log(`\nTotal registered: ${registered.length}`);
}

/**
 * Demo 6: Conflict Resolution Strategies
 */
async function demo6_ConflictResolution(): Promise<void> {
  console.log('\n=== Demo 6: Conflict Resolution Strategies ===\n');

  const sourceEpId = service.registerEndpoint({
    name: 'Source',
    type: 'database',
    config: {},
    enabled: true,
  });

  const targetEpId = service.registerEndpoint({
    name: 'Target',
    type: 'api',
    config: {},
    enabled: true,
  });

  const sourceEp = service.getEndpoint(sourceEpId)!;
  const targetEp = service.getEndpoint(targetEpId)!;

  const strategies: Array<'source-wins' | 'target-wins' | 'manual' | 'timestamp' | 'version' | 'merge'> = [
    'source-wins',
    'target-wins',
    'timestamp',
    'version',
  ];

  console.log('Creating syncs with different conflict resolution strategies...');

  for (const strategy of strategies) {
    const syncId = service.createSync({
      name: `${strategy} Sync`,
      sourceEndpoint: sourceEp,
      targetEndpoint: targetEp,
      direction: 'bidirectional',
      entityTypes: ['test'],
      conflictResolution: strategy,
      scheduleType: 'continuous',
      batchSize: 100,
      retryPolicy: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
      },
      enabled: true,
    });

    console.log(`✓ ${strategy}: ${syncId}`);
  }

  const syncs = service.listSyncs();
  console.log(`\nTotal syncs: ${syncs.length}`);
}

/**
 * Demo 7: Sync Directions
 */
async function demo7_SyncDirections(): Promise<void> {
  console.log('\n=== Demo 7: Sync Directions ===\n');

  const sourceEpId = service.registerEndpoint({
    name: 'Source',
    type: 'database',
    config: {},
    enabled: true,
  });

  const targetEpId = service.registerEndpoint({
    name: 'Target',
    type: 'api',
    config: {},
    enabled: true,
  });

  const sourceEp = service.getEndpoint(sourceEpId)!;
  const targetEp = service.getEndpoint(targetEpId)!;

  // Unidirectional
  const uniSyncId = service.createSync({
    name: 'Unidirectional Sync',
    sourceEndpoint: sourceEp,
    targetEndpoint: targetEp,
    direction: 'unidirectional',
    entityTypes: ['users'],
    conflictResolution: 'source-wins',
    scheduleType: 'continuous',
    batchSize: 100,
    retryPolicy: {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
    },
    enabled: true,
  });

  console.log(`Created unidirectional sync: ${uniSyncId}`);

  // Bidirectional
  const biSyncId = service.createSync({
    name: 'Bidirectional Sync',
    sourceEndpoint: sourceEp,
    targetEndpoint: targetEp,
    direction: 'bidirectional',
    entityTypes: ['orders'],
    conflictResolution: 'timestamp',
    scheduleType: 'continuous',
    batchSize: 100,
    retryPolicy: {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
    },
    enabled: true,
  });

  console.log(`Created bidirectional sync: ${biSyncId}`);

  const syncs = service.listSyncs();
  console.log(`\nSync directions:`);
  syncs.slice(-2).forEach((sync) => {
    console.log(`  - ${sync.name}: ${sync.direction}`);
  });
}

/**
 * Demo 8: Event Tracking
 */
async function demo8_EventTracking(): Promise<void> {
  console.log('\n=== Demo 8: Event Tracking ===\n');

  const events: ISyncEvent[] = [];

  service.onEvent(async (event) => {
    events.push(event);
    console.log(`Event: ${event.type}`);
  });

  const sourceEpId = service.registerEndpoint({
    name: 'Source',
    type: 'database',
    config: {},
    enabled: true,
  });

  const targetEpId = service.registerEndpoint({
    name: 'Target',
    type: 'api',
    config: {},
    enabled: true,
  });

  const syncId = service.createSync({
    name: 'Event Test Sync',
    sourceEndpoint: service.getEndpoint(sourceEpId)!,
    targetEndpoint: service.getEndpoint(targetEpId)!,
    direction: 'unidirectional',
    entityTypes: ['test'],
    conflictResolution: 'source-wins',
    scheduleType: 'continuous',
    batchSize: 100,
    retryPolicy: {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
    },
    enabled: true,
  });

  await service.startSync(syncId);
  await new Promise((resolve) => setTimeout(resolve, 100));

  console.log(`\nTotal events: ${events.length}`);
  const eventTypes = new Set(events.map((e) => e.type));
  eventTypes.forEach((type) => {
    const count = events.filter((e) => e.type === type).length;
    console.log(`  ${type}: ${count}`);
  });
}

/**
 * Demo 9: Health Check
 */
async function demo9_HealthCheck(): Promise<void> {
  console.log('\n=== Demo 9: Health Check ===\n');

  const health = await service.performHealthCheck();

  console.log(`System Health: ${health.status}`);
  console.log(`Timestamp: ${health.timestamp.toISOString()}`);
  console.log(`\nHealthcheck Details:`);
  console.log(`  Active jobs: ${health.activeJobs}`);
  console.log(`  Queued jobs: ${health.queuedJobs}`);
  console.log(`  Failed (last hour): ${health.failedJobsLastHour}`);
  console.log(`  Avg sync time: ${health.averageSyncTime}ms`);
  console.log(`\nEndpoints:`);
  health.endpoints.forEach((ep) => {
    console.log(`  - ${ep.name}: ${ep.status}`);
  });
}

/**
 * Demo 10: Multiple Concurrent Syncs
 */
async function demo10_ConcurrentSyncs(): Promise<void> {
  console.log('\n=== Demo 10: Multiple Concurrent Syncs ===\n');

  const sourceEpId = service.registerEndpoint({
    name: 'Source',
    type: 'database',
    config: {},
    enabled: true,
  });

  const targetEpId = service.registerEndpoint({
    name: 'Target',
    type: 'api',
    config: {},
    enabled: true,
  });

  const sourceEp = service.getEndpoint(sourceEpId)!;
  const targetEp = service.getEndpoint(targetEpId)!;

  console.log('Starting 3 concurrent syncs...');

  const jobIds = [];
  for (let i = 0; i < 3; i++) {
    const syncId = service.createSync({
      name: `Concurrent Sync ${i + 1}`,
      sourceEndpoint: sourceEp,
      targetEndpoint: targetEp,
      direction: 'unidirectional',
      entityTypes: ['test'],
      conflictResolution: 'source-wins',
      scheduleType: 'continuous',
      batchSize: 100,
      retryPolicy: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
      },
      enabled: true,
    });

    const jobId = await service.startSync(syncId);
    jobIds.push(jobId);
    console.log(`✓ Started job: ${jobId}`);
  }

  await new Promise((resolve) => setTimeout(resolve, 150));

  console.log(`\nAll jobs started`);
}

/**
 * Demo 11: Sync Progress
 */
async function demo11_SyncProgress(): Promise<void> {
  console.log('\n=== Demo 11: Sync Progress ===\n');

  const sourceEpId = service.registerEndpoint({
    name: 'Source',
    type: 'database',
    config: {},
    enabled: true,
  });

  const targetEpId = service.registerEndpoint({
    name: 'Target',
    type: 'api',
    config: {},
    enabled: true,
  });

  const syncId = service.createSync({
    name: 'Progress Test',
    sourceEndpoint: service.getEndpoint(sourceEpId)!,
    targetEndpoint: service.getEndpoint(targetEpId)!,
    direction: 'unidirectional',
    entityTypes: ['test'],
    conflictResolution: 'source-wins',
    scheduleType: 'continuous',
    batchSize: 100,
    retryPolicy: {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
    },
    enabled: true,
  });

  const jobId = await service.startSync(syncId);

  await new Promise((resolve) => setTimeout(resolve, 100));

  const progress = service.getSyncProgress(jobId);
  console.log('Sync Progress:');
  console.log(`  Total entities: ${progress?.totalEntities}`);
  console.log(`  Processed: ${progress?.processedEntities}`);
  console.log(`  Failed: ${progress?.failedEntities}`);
  console.log(`  Percentage: ${progress?.percentage}%`);
}

/**
 * Demo 12: Complete Workflow
 */
async function demo12_CompleteWorkflow(): Promise<void> {
  console.log('\n=== Demo 12: Complete Workflow ===\n');

  console.log('Setting up data synchronization workflow...\n');

  // Step 1: Register endpoints
  console.log('Step 1: Registering endpoints');
  const sourceEpId = service.registerEndpoint({
    name: 'Production Database',
    type: 'database',
    config: { connectionString: 'postgresql://prod-db' },
    enabled: true,
  });
  console.log(`✓ Source endpoint: ${sourceEpId}`);

  const targetEpId = service.registerEndpoint({
    name: 'Analytics API',
    type: 'api',
    config: { apiUrl: 'https://analytics.example.com' },
    enabled: true,
  });
  console.log(`✓ Target endpoint: ${targetEpId}`);

  // Step 2: Create sync configuration
  console.log('\nStep 2: Creating sync configuration');
  const syncId = service.createSync({
    name: 'Production to Analytics Sync',
    sourceEndpoint: service.getEndpoint(sourceEpId)!,
    targetEndpoint: service.getEndpoint(targetEpId)!,
    direction: 'unidirectional',
    entityTypes: ['transactions', 'events', 'metrics'],
    conflictResolution: 'source-wins',
    scheduleType: 'continuous',
    batchSize: 500,
    retryPolicy: {
      maxRetries: 5,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
    },
    enabled: true,
  });
  console.log(`✓ Sync configured: ${syncId}`);

  // Step 3: Start synchronization
  console.log('\nStep 3: Starting synchronization');
  const jobId = await service.startSync(syncId);
  console.log(`✓ Sync job started: ${jobId}`);

  // Step 4: Monitor progress
  console.log('\nStep 4: Monitoring progress');
  await new Promise((resolve) => setTimeout(resolve, 150));
  const progress = service.getSyncProgress(jobId);
  console.log(`✓ Progress: ${progress?.processedEntities}/${progress?.totalEntities} entities`);

  // Step 5: Check health
  console.log('\nStep 5: Checking system health');
  const health = await service.performHealthCheck();
  console.log(`✓ System health: ${health.status}`);

  // Step 6: Get checkpoint
  console.log('\nStep 6: Saving checkpoint');
  const checkpoint = service.getCheckpoint(syncId);
  console.log(`✓ Checkpoint version: ${checkpoint?.version}`);

  console.log('\n✓ Complete workflow executed successfully!');
}

/**
 * Run all demos
 */
async function runAllDemos(): Promise<void> {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║      SYNC SERVICE - DEMO SCENARIOS     ║');
  console.log('╚════════════════════════════════════════╝');

  await demo1_BasicEndpointRegistration();
  await demo2_SyncConfiguration();
  await demo3_SyncExecution();
  await demo4_JobControl();
  await demo5_MultipleEndpoints();
  await demo6_ConflictResolution();
  await demo7_SyncDirections();
  await demo8_EventTracking();
  await demo9_HealthCheck();
  await demo10_ConcurrentSyncs();
  await demo11_SyncProgress();
  await demo12_CompleteWorkflow();

  service.stop();

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║         ALL DEMOS COMPLETED            ║');
  console.log('╚════════════════════════════════════════╝\n');
}

// Execute
runAllDemos().catch(console.error);
