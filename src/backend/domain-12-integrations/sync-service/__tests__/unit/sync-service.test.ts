/**
 * Sync Service - Unit Tests
 */

import { SyncService, createSyncService, ISyncServiceConfig, ISyncEvent } from '../../src/index';

describe('Sync Service', () => {
  let service: SyncService;

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

  beforeEach(() => {
    service = createSyncService(config);
  });

  afterEach(() => {
    service.stop();
  });

  describe('Endpoint Management', () => {
    test('should register endpoint', () => {
      const endpointId = service.registerEndpoint({
        name: 'Production Database',
        type: 'database',
        config: {
          connectionString: 'postgresql://localhost/prod',
        },
        enabled: true,
      });

      expect(endpointId).toBeDefined();
      expect(endpointId).toMatch(/^ep_/);

      const endpoint = service.getEndpoint(endpointId);
      expect(endpoint?.name).toBe('Production Database');
      expect(endpoint?.type).toBe('database');
    });

    test('should list endpoints', () => {
      const ep1 = service.registerEndpoint({
        name: 'Source DB',
        type: 'database',
        config: {},
        enabled: true,
      });

      const ep2 = service.registerEndpoint({
        name: 'Target API',
        type: 'api',
        config: { apiUrl: 'https://api.example.com' },
        enabled: true,
      });

      const endpoints = service.listEndpoints();
      expect(endpoints.length).toBe(2);
      expect(endpoints.map((e) => e.endpointId)).toContain(ep1);
      expect(endpoints.map((e) => e.endpointId)).toContain(ep2);
    });

    test('should support different endpoint types', () => {
      const types = ['database', 'api', 'file', 'storage', 'webhook'];

      types.forEach((type) => {
        const epId = service.registerEndpoint({
          name: `${type} endpoint`,
          type: type as any,
          config: {},
          enabled: true,
        });

        const ep = service.getEndpoint(epId);
        expect(ep?.type).toBe(type);
      });
    });
  });

  describe('Sync Configuration', () => {
    test('should create sync configuration', () => {
      const sourceEp = service.registerEndpoint({
        name: 'Source',
        type: 'database',
        config: {},
        enabled: true,
      });

      const targetEp = service.registerEndpoint({
        name: 'Target',
        type: 'api',
        config: {},
        enabled: true,
      });

      const syncId = service.createSync({
        name: 'User Sync',
        sourceEndpoint: service.getEndpoint(sourceEp)!,
        targetEndpoint: service.getEndpoint(targetEp)!,
        direction: 'unidirectional',
        entityTypes: ['users', 'roles'],
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

      expect(syncId).toBeDefined();
      expect(syncId).toMatch(/^sync_/);

      const sync = service.getSync(syncId);
      expect(sync?.name).toBe('User Sync');
      expect(sync?.direction).toBe('unidirectional');
    });

    test('should list sync configurations', () => {
      const ep1 = service.registerEndpoint({
        name: 'EP1',
        type: 'database',
        config: {},
        enabled: true,
      });

      const ep2 = service.registerEndpoint({
        name: 'EP2',
        type: 'api',
        config: {},
        enabled: true,
      });

      const endpoint1 = service.getEndpoint(ep1)!;
      const endpoint2 = service.getEndpoint(ep2)!;

      service.createSync({
        name: 'Sync 1',
        sourceEndpoint: endpoint1,
        targetEndpoint: endpoint2,
        direction: 'unidirectional',
        entityTypes: ['users'],
        conflictResolution: 'source-wins',
        scheduleType: 'continuous',
        batchSize: 100,
        retryPolicy: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 },
        enabled: true,
      });

      service.createSync({
        name: 'Sync 2',
        sourceEndpoint: endpoint1,
        targetEndpoint: endpoint2,
        direction: 'bidirectional',
        entityTypes: ['orders'],
        conflictResolution: 'timestamp',
        scheduleType: 'scheduled',
        scheduleInterval: 300000,
        batchSize: 200,
        retryPolicy: { maxRetries: 5, initialDelayMs: 500, maxDelayMs: 5000, backoffMultiplier: 1.5 },
        enabled: true,
      });

      const syncs = service.listSyncs();
      expect(syncs.length).toBe(2);
    });

    test('should delete sync configuration', () => {
      const ep1 = service.registerEndpoint({
        name: 'EP1',
        type: 'database',
        config: {},
        enabled: true,
      });

      const ep2 = service.registerEndpoint({
        name: 'EP2',
        type: 'api',
        config: {},
        enabled: true,
      });

      const syncId = service.createSync({
        name: 'Temp Sync',
        sourceEndpoint: service.getEndpoint(ep1)!,
        targetEndpoint: service.getEndpoint(ep2)!,
        direction: 'unidirectional',
        entityTypes: ['test'],
        conflictResolution: 'source-wins',
        scheduleType: 'manual',
        batchSize: 50,
        retryPolicy: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 },
        enabled: false,
      });

      const deleted = service.deleteSync(syncId);
      expect(deleted).toBe(true);

      const sync = service.getSync(syncId);
      expect(sync).toBeNull();
    });
  });

  describe('Sync Execution', () => {
    test('should start sync job', async () => {
      const ep1 = service.registerEndpoint({
        name: 'EP1',
        type: 'database',
        config: {},
        enabled: true,
      });

      const ep2 = service.registerEndpoint({
        name: 'EP2',
        type: 'api',
        config: {},
        enabled: true,
      });

      const syncId = service.createSync({
        name: 'Test Sync',
        sourceEndpoint: service.getEndpoint(ep1)!,
        targetEndpoint: service.getEndpoint(ep2)!,
        direction: 'unidirectional',
        entityTypes: ['test'],
        conflictResolution: 'source-wins',
        scheduleType: 'continuous',
        batchSize: 100,
        retryPolicy: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 },
        enabled: true,
      });

      const jobId = await service.startSync(syncId);
      expect(jobId).toBeDefined();

      // Wait for job to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const job = service.getSyncJob(jobId);
      expect(job).toBeDefined();
    });

    test('should list sync jobs', async () => {
      const ep1 = service.registerEndpoint({
        name: 'EP1',
        type: 'database',
        config: {},
        enabled: true,
      });

      const ep2 = service.registerEndpoint({
        name: 'EP2',
        type: 'api',
        config: {},
        enabled: true,
      });

      const syncId = service.createSync({
        name: 'Test Sync',
        sourceEndpoint: service.getEndpoint(ep1)!,
        targetEndpoint: service.getEndpoint(ep2)!,
        direction: 'unidirectional',
        entityTypes: ['test'],
        conflictResolution: 'source-wins',
        scheduleType: 'continuous',
        batchSize: 100,
        retryPolicy: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 },
        enabled: true,
      });

      const jobId = await service.startSync(syncId);

      const jobs = service.listSyncJobs();
      expect(jobs.length).toBeGreaterThan(0);
      expect(jobs.map((j) => j.jobId)).toContain(jobId);
    });

    test('should pause sync job', async () => {
      const ep1 = service.registerEndpoint({
        name: 'EP1',
        type: 'database',
        config: {},
        enabled: true,
      });

      const ep2 = service.registerEndpoint({
        name: 'EP2',
        type: 'api',
        config: {},
        enabled: true,
      });

      const syncId = service.createSync({
        name: 'Test Sync',
        sourceEndpoint: service.getEndpoint(ep1)!,
        targetEndpoint: service.getEndpoint(ep2)!,
        direction: 'unidirectional',
        entityTypes: ['test'],
        conflictResolution: 'source-wins',
        scheduleType: 'continuous',
        batchSize: 100,
        retryPolicy: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 },
        enabled: true,
      });

      const jobId = await service.startSync(syncId);

      const paused = service.pauseSync(jobId);
      expect(paused).toBe(true);

      const job = service.getSyncJob(jobId);
      expect(job?.status).toBe('paused');
    });

    test('should cancel sync job', async () => {
      const ep1 = service.registerEndpoint({
        name: 'EP1',
        type: 'database',
        config: {},
        enabled: true,
      });

      const ep2 = service.registerEndpoint({
        name: 'EP2',
        type: 'api',
        config: {},
        enabled: true,
      });

      const syncId = service.createSync({
        name: 'Test Sync',
        sourceEndpoint: service.getEndpoint(ep1)!,
        targetEndpoint: service.getEndpoint(ep2)!,
        direction: 'unidirectional',
        entityTypes: ['test'],
        conflictResolution: 'source-wins',
        scheduleType: 'continuous',
        batchSize: 100,
        retryPolicy: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 },
        enabled: true,
      });

      const jobId = await service.startSync(syncId);

      const cancelled = service.cancelSync(jobId);
      expect(cancelled).toBe(true);
    });
  });

  describe('Conflict Management', () => {
    test('should track conflicts', async () => {
      const ep1 = service.registerEndpoint({
        name: 'EP1',
        type: 'database',
        config: {},
        enabled: true,
      });

      const ep2 = service.registerEndpoint({
        name: 'EP2',
        type: 'api',
        config: {},
        enabled: true,
      });

      const syncId = service.createSync({
        name: 'Conflict Test Sync',
        sourceEndpoint: service.getEndpoint(ep1)!,
        targetEndpoint: service.getEndpoint(ep2)!,
        direction: 'bidirectional',
        entityTypes: ['test'],
        conflictResolution: 'manual',
        scheduleType: 'continuous',
        batchSize: 100,
        retryPolicy: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 },
        enabled: true,
      });

      const conflicts = service.getConflicts(syncId);
      expect(Array.isArray(conflicts)).toBe(true);
    });
  });

  describe('Sync Progress', () => {
    test('should track sync progress', async () => {
      const ep1 = service.registerEndpoint({
        name: 'EP1',
        type: 'database',
        config: {},
        enabled: true,
      });

      const ep2 = service.registerEndpoint({
        name: 'EP2',
        type: 'api',
        config: {},
        enabled: true,
      });

      const syncId = service.createSync({
        name: 'Progress Test Sync',
        sourceEndpoint: service.getEndpoint(ep1)!,
        targetEndpoint: service.getEndpoint(ep2)!,
        direction: 'unidirectional',
        entityTypes: ['test'],
        conflictResolution: 'source-wins',
        scheduleType: 'continuous',
        batchSize: 100,
        retryPolicy: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 },
        enabled: true,
      });

      const jobId = await service.startSync(syncId);

      const progress = service.getSyncProgress(jobId);
      expect(progress).toBeDefined();
      expect(progress?.percentage).toBeDefined();
    });
  });

  describe('Checkpoints', () => {
    test('should manage checkpoints', () => {
      const ep1 = service.registerEndpoint({
        name: 'EP1',
        type: 'database',
        config: {},
        enabled: true,
      });

      const ep2 = service.registerEndpoint({
        name: 'EP2',
        type: 'api',
        config: {},
        enabled: true,
      });

      const syncId = service.createSync({
        name: 'Checkpoint Test Sync',
        sourceEndpoint: service.getEndpoint(ep1)!,
        targetEndpoint: service.getEndpoint(ep2)!,
        direction: 'unidirectional',
        entityTypes: ['test'],
        conflictResolution: 'source-wins',
        scheduleType: 'continuous',
        batchSize: 100,
        retryPolicy: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 },
        enabled: true,
      });

      const checkpoint = service.getCheckpoint(syncId);
      expect(checkpoint).toBeDefined();
      expect(checkpoint?.syncId).toBe(syncId);
    });
  });

  describe('Health Check', () => {
    test('should perform health check', async () => {
      const health = await service.performHealthCheck();
      expect(health.status).toBeDefined();
      expect(health.activeJobs).toBeDefined();
      expect(health.endpoints).toBeDefined();
    });

    test('should report healthy status', async () => {
      const health = await service.performHealthCheck();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });
  });

  describe('Event Listeners', () => {
    test('should emit sync-started event', async () => {
      const events: ISyncEvent[] = [];

      service.onEvent(async (event) => {
        events.push(event);
      });

      const ep1 = service.registerEndpoint({
        name: 'EP1',
        type: 'database',
        config: {},
        enabled: true,
      });

      const ep2 = service.registerEndpoint({
        name: 'EP2',
        type: 'api',
        config: {},
        enabled: true,
      });

      const syncId = service.createSync({
        name: 'Event Test Sync',
        sourceEndpoint: service.getEndpoint(ep1)!,
        targetEndpoint: service.getEndpoint(ep2)!,
        direction: 'unidirectional',
        entityTypes: ['test'],
        conflictResolution: 'source-wins',
        scheduleType: 'continuous',
        batchSize: 100,
        retryPolicy: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 },
        enabled: true,
      });

      await service.startSync(syncId);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(events.length).toBeGreaterThan(0);
      expect(events.some((e) => e.type === 'sync-started')).toBe(true);
    });

    test('should emit sync-completed event', async () => {
      const events: ISyncEvent[] = [];

      service.onEvent(async (event) => {
        events.push(event);
      });

      const ep1 = service.registerEndpoint({
        name: 'EP1',
        type: 'database',
        config: {},
        enabled: true,
      });

      const ep2 = service.registerEndpoint({
        name: 'EP2',
        type: 'api',
        config: {},
        enabled: true,
      });

      const syncId = service.createSync({
        name: 'Completion Event Test',
        sourceEndpoint: service.getEndpoint(ep1)!,
        targetEndpoint: service.getEndpoint(ep2)!,
        direction: 'unidirectional',
        entityTypes: ['test'],
        conflictResolution: 'source-wins',
        scheduleType: 'continuous',
        batchSize: 100,
        retryPolicy: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 },
        enabled: true,
      });

      await service.startSync(syncId);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const completedEvents = events.filter((e) => e.type === 'sync-completed');
      expect(completedEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Conflict Resolution Strategies', () => {
    test('should support source-wins strategy', () => {
      const ep1 = service.registerEndpoint({
        name: 'EP1',
        type: 'database',
        config: {},
        enabled: true,
      });

      const ep2 = service.registerEndpoint({
        name: 'EP2',
        type: 'api',
        config: {},
        enabled: true,
      });

      const syncId = service.createSync({
        name: 'Source Wins Sync',
        sourceEndpoint: service.getEndpoint(ep1)!,
        targetEndpoint: service.getEndpoint(ep2)!,
        direction: 'unidirectional',
        entityTypes: ['test'],
        conflictResolution: 'source-wins',
        scheduleType: 'continuous',
        batchSize: 100,
        retryPolicy: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 },
        enabled: true,
      });

      const sync = service.getSync(syncId);
      expect(sync?.conflictResolution).toBe('source-wins');
    });

    test('should support timestamp strategy', () => {
      const ep1 = service.registerEndpoint({
        name: 'EP1',
        type: 'database',
        config: {},
        enabled: true,
      });

      const ep2 = service.registerEndpoint({
        name: 'EP2',
        type: 'api',
        config: {},
        enabled: true,
      });

      const syncId = service.createSync({
        name: 'Timestamp Sync',
        sourceEndpoint: service.getEndpoint(ep1)!,
        targetEndpoint: service.getEndpoint(ep2)!,
        direction: 'bidirectional',
        entityTypes: ['test'],
        conflictResolution: 'timestamp',
        scheduleType: 'continuous',
        batchSize: 100,
        retryPolicy: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 },
        enabled: true,
      });

      const sync = service.getSync(syncId);
      expect(sync?.conflictResolution).toBe('timestamp');
    });
  });

  describe('Sync Directions', () => {
    test('should support unidirectional sync', () => {
      const ep1 = service.registerEndpoint({
        name: 'EP1',
        type: 'database',
        config: {},
        enabled: true,
      });

      const ep2 = service.registerEndpoint({
        name: 'EP2',
        type: 'api',
        config: {},
        enabled: true,
      });

      const syncId = service.createSync({
        name: 'Uni Sync',
        sourceEndpoint: service.getEndpoint(ep1)!,
        targetEndpoint: service.getEndpoint(ep2)!,
        direction: 'unidirectional',
        entityTypes: ['test'],
        conflictResolution: 'source-wins',
        scheduleType: 'continuous',
        batchSize: 100,
        retryPolicy: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 },
        enabled: true,
      });

      const sync = service.getSync(syncId);
      expect(sync?.direction).toBe('unidirectional');
    });

    test('should support bidirectional sync', () => {
      const ep1 = service.registerEndpoint({
        name: 'EP1',
        type: 'database',
        config: {},
        enabled: true,
      });

      const ep2 = service.registerEndpoint({
        name: 'EP2',
        type: 'api',
        config: {},
        enabled: true,
      });

      const syncId = service.createSync({
        name: 'Bi Sync',
        sourceEndpoint: service.getEndpoint(ep1)!,
        targetEndpoint: service.getEndpoint(ep2)!,
        direction: 'bidirectional',
        entityTypes: ['test'],
        conflictResolution: 'timestamp',
        scheduleType: 'continuous',
        batchSize: 100,
        retryPolicy: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 },
        enabled: true,
      });

      const sync = service.getSync(syncId);
      expect(sync?.direction).toBe('bidirectional');
    });
  });
});
