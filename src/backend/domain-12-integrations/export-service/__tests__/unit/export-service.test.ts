/**
 * Export Service - Unit Tests
 */

import { ExportService, createExportService, IExportServiceConfig, IExportEvent } from '../../src/index';

describe('Export Service', () => {
  let service: ExportService;

  const config: IExportServiceConfig = {
    maxConcurrentJobs: 5,
    maxJobSize: 104857600, // 100 MB
    maxCacheSize: 1073741824, // 1 GB
    cacheExpiry: 3600000, // 1 hour
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

  beforeEach(() => {
    service = createExportService(config);
  });

  afterEach(() => {
    service.stop();
  });

  describe('Export Job Management', () => {
    test('should create export job successfully', () => {
      const jobId = service.createExportJob({
        name: 'User Export',
        format: 'CSV',
        dataSource: {
          type: 'database',
          sourceId: 'db1',
          tableName: 'users',
        },
      });

      expect(jobId).toBeDefined();
      expect(jobId).toMatch(/^exp_/);

      const job = service.getExportJob(jobId);
      expect(job).toBeDefined();
      expect(job?.name).toBe('User Export');
      expect(job?.format).toBe('CSV');
      expect(job?.status).toBe('pending');
    });

    test('should create job with filters and columns', () => {
      const jobId = service.createExportJob({
        name: 'Filtered Export',
        format: 'JSON',
        dataSource: {
          type: 'database',
          sourceId: 'db1',
          query: 'SELECT * FROM orders',
        },
        filters: [
          { field: 'status', operator: 'eq', value: 'completed' },
          { field: 'amount', operator: 'gte', value: 100 },
        ],
        columns: ['orderId', 'customerId', 'amount', 'date'],
        compression: 'brotli',
        encryption: true,
      });

      const job = service.getExportJob(jobId);
      expect(job?.filters?.length).toBe(2);
      expect(job?.columns?.length).toBe(4);
      expect(job?.compression).toBe('brotli');
      expect(job?.encryption).toBe(true);
    });

    test('should list all jobs', () => {
      const job1Id = service.createExportJob({
        name: 'Job 1',
        format: 'CSV',
        dataSource: { type: 'database', sourceId: 'db1' },
      });

      const job2Id = service.createExportJob({
        name: 'Job 2',
        format: 'JSON',
        dataSource: { type: 'database', sourceId: 'db1' },
      });

      const jobs = service.listExportJobs();
      expect(jobs.length).toBe(2);
      expect(jobs.map((j) => j.jobId)).toContain(job1Id);
      expect(jobs.map((j) => j.jobId)).toContain(job2Id);
    });

    test('should list jobs by status', () => {
      service.createExportJob({
        name: 'Job 1',
        format: 'CSV',
        dataSource: { type: 'database', sourceId: 'db1' },
      });

      service.createExportJob({
        name: 'Job 2',
        format: 'JSON',
        dataSource: { type: 'database', sourceId: 'db1' },
      });

      const pendingJobs = service.listExportJobs('pending');
      expect(pendingJobs.length).toBeGreaterThan(0);
      expect(pendingJobs.every((j) => j.status === 'pending')).toBe(true);
    });

    test('should delete export job', () => {
      const jobId = service.createExportJob({
        name: 'Deletable Job',
        format: 'CSV',
        dataSource: { type: 'database', sourceId: 'db1' },
      });

      const deleted = service.deleteExportJob(jobId);
      expect(deleted).toBe(true);

      const job = service.getExportJob(jobId);
      expect(job).toBeNull();
    });
  });

  describe('Job Execution', () => {
    test('should start export job', async () => {
      const jobId = service.createExportJob({
        name: 'Processing Job',
        format: 'JSON',
        dataSource: { type: 'database', sourceId: 'db1' },
      });

      await service.startExportJob(jobId);

      const job = service.getExportJob(jobId);
      expect(job?.status).toBe('completed');
      expect(job?.progress).toBe(100);
      expect(job?.rowCount).toBeGreaterThan(0);
      expect(job?.fileSize).toBeGreaterThan(0);
    });

    test('should cancel export job', async () => {
      const jobId = service.createExportJob({
        name: 'Cancellable Job',
        format: 'CSV',
        dataSource: { type: 'database', sourceId: 'db1' },
      });

      await service.startExportJob(jobId);

      const cancelled = service.cancelExportJob(jobId);
      expect(cancelled).toBe(true);
    });

    test('should handle concurrent jobs', async () => {
      const jobIds = [];
      for (let i = 0; i < 3; i++) {
        const jobId = service.createExportJob({
          name: `Concurrent Job ${i}`,
          format: 'JSON',
          dataSource: { type: 'database', sourceId: 'db1' },
        });
        jobIds.push(jobId);
        await service.startExportJob(jobId);
      }

      const jobs = jobIds.map((id) => service.getExportJob(id));
      expect(jobs.length).toBe(3);
    });

    test('should queue jobs when limit reached', async () => {
      const smallConfig: IExportServiceConfig = { ...config, maxConcurrentJobs: 1 };
      const smallService = createExportService(smallConfig);

      const job1Id = smallService.createExportJob({
        name: 'Job 1',
        format: 'JSON',
        dataSource: { type: 'database', sourceId: 'db1' },
      });

      const job2Id = smallService.createExportJob({
        name: 'Job 2',
        format: 'JSON',
        dataSource: { type: 'database', sourceId: 'db1' },
      });

      await smallService.startExportJob(job1Id);
      await smallService.startExportJob(job2Id);

      smallService.stop();
    });
  });

  describe('Template Management', () => {
    test('should create export template', () => {
      const templateId = service.createTemplate({
        name: 'Standard Report',
        format: 'PDF',
        defaultColumns: ['id', 'name', 'email', 'date'],
      });

      expect(templateId).toBeDefined();
      expect(templateId).toMatch(/^tmpl_/);

      const template = service.getTemplate(templateId);
      expect(template).toBeDefined();
      expect(template?.name).toBe('Standard Report');
      expect(template?.format).toBe('PDF');
    });

    test('should list templates', () => {
      const tmpl1Id = service.createTemplate({
        name: 'Template 1',
        format: 'CSV',
      });

      const tmpl2Id = service.createTemplate({
        name: 'Template 2',
        format: 'JSON',
      });

      const templates = service.listTemplates();
      expect(templates.length).toBe(2);
      expect(templates.map((t) => t.templateId)).toContain(tmpl1Id);
      expect(templates.map((t) => t.templateId)).toContain(tmpl2Id);
    });

    test('should delete template', () => {
      const templateId = service.createTemplate({
        name: 'Deletable Template',
        format: 'XML',
      });

      const deleted = service.deleteTemplate(templateId);
      expect(deleted).toBe(true);

      const template = service.getTemplate(templateId);
      expect(template).toBeNull();
    });
  });

  describe('Schedule Management', () => {
    test('should create export schedule', () => {
      const templateId = service.createTemplate({
        name: 'Base Template',
        format: 'CSV',
      });

      const scheduleId = service.createSchedule({
        name: 'Daily Export',
        frequency: 'daily',
        templateId,
      });

      expect(scheduleId).toBeDefined();
      expect(scheduleId).toMatch(/^sch_/);

      const schedule = service.getSchedule(scheduleId);
      expect(schedule).toBeDefined();
      expect(schedule?.name).toBe('Daily Export');
      expect(schedule?.frequency).toBe('daily');
      expect(schedule?.enabled).toBe(true);
    });

    test('should list schedules', () => {
      const sch1Id = service.createSchedule({
        name: 'Schedule 1',
        frequency: 'daily',
      });

      const sch2Id = service.createSchedule({
        name: 'Schedule 2',
        frequency: 'weekly',
      });

      const schedules = service.listSchedules();
      expect(schedules.length).toBe(2);
      expect(schedules.map((s) => s.scheduleId)).toContain(sch1Id);
      expect(schedules.map((s) => s.scheduleId)).toContain(sch2Id);
    });

    test('should delete schedule', () => {
      const scheduleId = service.createSchedule({
        name: 'Deletable Schedule',
        frequency: 'monthly',
      });

      const deleted = service.deleteSchedule(scheduleId);
      expect(deleted).toBe(true);

      const schedule = service.getSchedule(scheduleId);
      expect(schedule).toBeNull();
    });

    test('should create schedule with weekly frequency', () => {
      const scheduleId = service.createSchedule({
        name: 'Weekly Export',
        frequency: 'weekly',
      });

      const schedule = service.getSchedule(scheduleId);
      expect(schedule?.frequency).toBe('weekly');
    });
  });

  describe('Data Filtering and Sorting', () => {
    test('should apply export filters', async () => {
      const jobId = service.createExportJob({
        name: 'Filtered Export',
        format: 'JSON',
        dataSource: { type: 'database', sourceId: 'db1' },
        filters: [{ field: 'status', operator: 'eq', value: 'active' }],
      });

      const job = service.getExportJob(jobId);
      expect(job?.filters?.length).toBe(1);
      expect(job?.filters?.[0].operator).toBe('eq');
    });

    test('should apply export sorting', async () => {
      const jobId = service.createExportJob({
        name: 'Sorted Export',
        format: 'CSV',
        dataSource: { type: 'database', sourceId: 'db1' },
        sorting: [
          { field: 'date', order: 'desc' },
          { field: 'name', order: 'asc' },
        ],
      });

      const job = service.getExportJob(jobId);
      expect(job?.sorting?.length).toBe(2);
      expect(job?.sorting?.[0].order).toBe('desc');
    });

    test('should select specific columns', async () => {
      const jobId = service.createExportJob({
        name: 'Column Select Export',
        format: 'JSON',
        dataSource: { type: 'database', sourceId: 'db1' },
        columns: ['id', 'name', 'email'],
      });

      const job = service.getExportJob(jobId);
      expect(job?.columns?.length).toBe(3);
      expect(job?.columns).toContain('email');
    });
  });

  describe('Batch Export', () => {
    test('should execute batch export', async () => {
      const result = await service.batchExport({
        jobs: [
          {
            name: 'Batch Job 1',
            format: 'JSON',
            dataSource: { type: 'database', sourceId: 'db1' },
          },
          {
            name: 'Batch Job 2',
            format: 'CSV',
            dataSource: { type: 'database', sourceId: 'db1' },
          },
        ],
        parallelJobs: 2,
        stopOnError: false,
      });

      expect(result.batchId).toBeDefined();
      expect(result.totalJobs).toBe(2);
      expect(result.successfulJobs + result.failedJobs).toBe(2);
    });
  });

  describe('Compression Support', () => {
    test('should support gzip compression', () => {
      const jobId = service.createExportJob({
        name: 'Gzip Export',
        format: 'JSON',
        dataSource: { type: 'database', sourceId: 'db1' },
        compression: 'gzip',
      });

      const job = service.getExportJob(jobId);
      expect(job?.compression).toBe('gzip');
    });

    test('should support brotli compression', () => {
      const jobId = service.createExportJob({
        name: 'Brotli Export',
        format: 'JSON',
        dataSource: { type: 'database', sourceId: 'db1' },
        compression: 'brotli',
      });

      const job = service.getExportJob(jobId);
      expect(job?.compression).toBe('brotli');
    });

    test('should support no compression', () => {
      const jobId = service.createExportJob({
        name: 'Uncompressed Export',
        format: 'JSON',
        dataSource: { type: 'database', sourceId: 'db1' },
        compression: 'none',
      });

      const job = service.getExportJob(jobId);
      expect(job?.compression).toBe('none');
    });
  });

  describe('Format Support', () => {
    test('should support JSON format', () => {
      const jobId = service.createExportJob({
        name: 'JSON Export',
        format: 'JSON',
        dataSource: { type: 'database', sourceId: 'db1' },
      });

      const job = service.getExportJob(jobId);
      expect(job?.format).toBe('JSON');
    });

    test('should support CSV format', () => {
      const jobId = service.createExportJob({
        name: 'CSV Export',
        format: 'CSV',
        dataSource: { type: 'database', sourceId: 'db1' },
      });

      const job = service.getExportJob(jobId);
      expect(job?.format).toBe('CSV');
    });

    test('should support XML format', () => {
      const jobId = service.createExportJob({
        name: 'XML Export',
        format: 'XML',
        dataSource: { type: 'database', sourceId: 'db1' },
      });

      const job = service.getExportJob(jobId);
      expect(job?.format).toBe('XML');
    });
  });

  describe('Statistics', () => {
    test('should track export statistics', async () => {
      service.createExportJob({
        name: 'Stat Job',
        format: 'JSON',
        dataSource: { type: 'database', sourceId: 'db1' },
      });

      const stats = service.getExportStatistics();
      expect(stats.totalJobs).toBeGreaterThan(0);
    });
  });

  describe('Health Check', () => {
    test('should perform health check', async () => {
      const health = await service.performHealthCheck();
      expect(health.status).toBeDefined();
      expect(health.activeJobs).toBeDefined();
      expect(health.queuedJobs).toBeDefined();
      expect(health.diskUsage).toBeDefined();
    });

    test('should report healthy status', async () => {
      const health = await service.performHealthCheck();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });
  });

  describe('Event Listeners', () => {
    test('should emit job-created event', () => {
      const events: IExportEvent[] = [];

      service.onEvent(async (event) => {
        events.push(event);
      });

      service.createExportJob({
        name: 'Event Job',
        format: 'JSON',
        dataSource: { type: 'database', sourceId: 'db1' },
      });

      expect(events.length).toBeGreaterThan(0);
      expect(events.some((e) => e.type === 'job-created')).toBe(true);
    });

    test('should emit job-completed event', async () => {
      const events: IExportEvent[] = [];

      service.onEvent(async (event) => {
        events.push(event);
      });

      const jobId = service.createExportJob({
        name: 'Completion Event Job',
        format: 'JSON',
        dataSource: { type: 'database', sourceId: 'db1' },
      });

      await service.startExportJob(jobId);

      const completionEvents = events.filter((e) => e.type === 'job-completed');
      expect(completionEvents.length).toBeGreaterThan(0);
    });

    test('should emit job-failed event on error', () => {
      const events: IExportEvent[] = [];

      service.onEvent(async (event) => {
        events.push(event);
      });

      service.createExportJob({
        name: 'Event Job',
        format: 'JSON',
        dataSource: { type: 'database', sourceId: 'db1' },
      });

      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('Data Sources', () => {
    test('should support database data source', () => {
      const jobId = service.createExportJob({
        name: 'DB Export',
        format: 'JSON',
        dataSource: {
          type: 'database',
          sourceId: 'main-db',
          tableName: 'users',
        },
      });

      const job = service.getExportJob(jobId);
      expect(job?.dataSource.type).toBe('database');
      expect(job?.dataSource.tableName).toBe('users');
    });

    test('should support query data source', () => {
      const jobId = service.createExportJob({
        name: 'Query Export',
        format: 'JSON',
        dataSource: {
          type: 'query',
          sourceId: 'analytics',
          query: 'SELECT * FROM events WHERE date > NOW() - INTERVAL 1 DAY',
        },
      });

      const job = service.getExportJob(jobId);
      expect(job?.dataSource.type).toBe('query');
      expect(job?.dataSource.query).toContain('events');
    });

    test('should support API data source', () => {
      const jobId = service.createExportJob({
        name: 'API Export',
        format: 'JSON',
        dataSource: {
          type: 'api',
          sourceId: 'external-api',
          endpoint: 'https://api.example.com/data',
        },
      });

      const job = service.getExportJob(jobId);
      expect(job?.dataSource.type).toBe('api');
      expect(job?.dataSource.endpoint).toContain('api.example.com');
    });
  });

  describe('Delivery Methods', () => {
    test('should support email delivery', () => {
      const jobId = service.createExportJob({
        name: 'Email Export',
        format: 'CSV',
        dataSource: { type: 'database', sourceId: 'db1' },
        deliveryMethods: ['email'],
      });

      const job = service.getExportJob(jobId);
      expect(job?.deliveryMethods).toContain('email');
    });

    test('should support storage delivery', () => {
      const jobId = service.createExportJob({
        name: 'Storage Export',
        format: 'JSON',
        dataSource: { type: 'database', sourceId: 'db1' },
        deliveryMethods: ['storage'],
      });

      const job = service.getExportJob(jobId);
      expect(job?.deliveryMethods).toContain('storage');
    });

    test('should support multiple delivery methods', () => {
      const jobId = service.createExportJob({
        name: 'Multi Delivery',
        format: 'CSV',
        dataSource: { type: 'database', sourceId: 'db1' },
        deliveryMethods: ['email', 'storage', 'download'],
      });

      const job = service.getExportJob(jobId);
      expect(job?.deliveryMethods.length).toBe(3);
    });
  });
});
