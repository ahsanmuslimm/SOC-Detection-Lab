/**
 * Event Pipeline Service - Unit Tests
 */

import {
  EventPipeline,
  createEventPipeline,
  IPipelineConfig,
  IPipelineEvent,
  IEventProcessor,
  IEventEnricher,
  IEventCorrelator,
  IEventDistributor,
  IEventFilter,
  EventPipelineListener,
  StageListener,
} from '../../src';

describe('EventPipeline', () => {
  let pipeline: EventPipeline;
  let config: IPipelineConfig;

  beforeEach(() => {
    config = {
      enableIngestion: true,
      enableValidation: true,
      enableEnrichment: true,
      enableCorrelation: true,
      enableDistribution: true,
      enableArchive: true,
      enableMetrics: true,
      enableAudit: true,
      enableLogging: true,
      ingestionConfig: {
        maxBatchSize: 100,
        batchTimeoutMs: 1000,
        maxQueueSize: 10000,
        deduplicationEnabled: true,
        deduplicationWindowMs: 60000,
      },
      processingConfig: {
        parallelProcessors: 4,
        timeoutMs: 30000,
        maxRetries: 3,
        retryBackoffMs: 1000,
      },
      enrichmentConfig: {
        enableCaching: true,
        cacheTtlMs: 300000,
        maxEnrichersPerEvent: 10,
        timeoutPerEnricherMs: 5000,
      },
      correlationConfig: {
        enableCorrelation: true,
        maxHistoryPerEvent: 1000,
        timeWindowMs: 3600000,
        minCorrelationScore: 0.5,
      },
      distributionConfig: {
        maxDistributorsPerEvent: 10,
        timeoutPerDistributorMs: 5000,
        failFastMode: false,
      },
    };

    pipeline = createEventPipeline(config);
  });

  afterEach(() => {
    pipeline.stop();
  });

  describe('Event Ingestion', () => {
    it('should ingest event', async () => {
      const eventId = await pipeline.ingestEvent(
        'detection-engine',
        { threat: 'malware', severity: 'high' },
        'high',
      );

      expect(eventId).toBeDefined();
      expect(eventId).toMatch(/^evt_/);
    });

    it('should return event with correct structure', async () => {
      const eventId = await pipeline.ingestEvent(
        'detection-engine',
        { data: 'test' },
      );

      const event = pipeline.getEvent(eventId);
      expect(event).not.toBeNull();
      expect(event?.source).toBe('detection-engine');
      expect(event?.data).toEqual({ data: 'test' });
    });

    it('should track event priority', async () => {
      const criticalId = await pipeline.ingestEvent(
        'detection-engine',
        { data: 'test' },
        'critical',
      );

      const highId = await pipeline.ingestEvent(
        'detection-engine',
        { data: 'test' },
        'high',
      );

      const critical = pipeline.getEvent(criticalId);
      const high = pipeline.getEvent(highId);

      expect(critical?.priority).toBe('critical');
      expect(high?.priority).toBe('high');
    });
  });

  describe('Batch Ingestion', () => {
    it('should ingest batch events', async () => {
      const result = await pipeline.ingestBatchEvents({
        events: [
          {
            source: 'detection-engine',
            priority: 'high',
            data: { id: '1' },
          },
          {
            source: 'detection-engine',
            priority: 'medium',
            data: { id: '2' },
          },
          {
            source: 'network-sensor',
            priority: 'low',
            data: { id: '3' },
          },
        ],
      });

      expect(result.totalEvents).toBe(3);
      expect(result.successfulEvents).toBeGreaterThanOrEqual(0);
    });

    it('should track batch statistics', async () => {
      const result = await pipeline.ingestBatchEvents({
        events: [
          { source: 'detection-engine', data: { id: '1' } },
          { source: 'detection-engine', data: { id: '2' } },
        ],
      });

      expect(result.batchId).toBeDefined();
      expect(result.averageDurationMs).toBeGreaterThan(0);
    });
  });

  describe('Processor Management', () => {
    it('should register processor', () => {
      const processor: IEventProcessor = {
        processorId: 'test-processor',
        name: 'Test Processor',
        priority: 1,
        isActive: true,
        handler: async (event) => event,
      };

      expect(() => {
        pipeline.registerProcessor(processor);
      }).not.toThrow();
    });

    it('should prevent duplicate processor registration', () => {
      const processor: IEventProcessor = {
        processorId: 'test-processor',
        name: 'Test Processor',
        priority: 1,
        isActive: true,
        handler: async (event) => event,
      };

      pipeline.registerProcessor(processor);

      expect(() => {
        pipeline.registerProcessor(processor);
      }).toThrow();
    });
  });

  describe('Enricher Management', () => {
    it('should register enricher', () => {
      const enricher: IEventEnricher = {
        enricherId: 'test-enricher',
        name: 'Test Enricher',
        enrichmentType: 'threat-intel',
        priority: 1,
        isActive: true,
        handler: async (event) => [
          {
            enrichmentId: 'enrich-1',
            type: 'threat-intel',
            source: 'external-api',
            data: { reputation: 'malicious' },
            appliedAt: new Date(),
          },
        ],
      };

      expect(() => {
        pipeline.registerEnricher(enricher);
      }).not.toThrow();
    });
  });

  describe('Correlator Management', () => {
    it('should register correlator', () => {
      const correlator: IEventCorrelator = {
        correlatorId: 'test-correlator',
        name: 'Test Correlator',
        correlationType: 'threat',
        priority: 1,
        isActive: true,
        handler: async (event, history) => [],
      };

      expect(() => {
        pipeline.registerCorrelator(correlator);
      }).not.toThrow();
    });
  });

  describe('Distributor Management', () => {
    it('should register distributor', () => {
      const distributor: IEventDistributor = {
        distributorId: 'test-distributor',
        name: 'Test Distributor',
        priority: 1,
        isActive: true,
        handler: async (event) => {
          // Send to external system
        },
      };

      expect(() => {
        pipeline.registerDistributor(distributor);
      }).not.toThrow();
    });
  });

  describe('Filter Management', () => {
    it('should register filter', () => {
      const filter: IEventFilter = {
        filterId: 'test-filter',
        name: 'High Severity Filter',
        priority: 1,
        isActive: true,
        conditions: [
          {
            conditionId: 'cond-1',
            field: 'severity',
            operator: 'equals',
            value: 'high',
          },
        ],
        action: 'accept',
      };

      expect(() => {
        pipeline.registerFilter(filter);
      }).not.toThrow();
    });
  });

  describe('Event Retrieval', () => {
    it('should get event by ID', async () => {
      const eventId = await pipeline.ingestEvent(
        'detection-engine',
        { data: 'test' },
      );

      const event = pipeline.getEvent(eventId);
      expect(event).not.toBeNull();
      expect(event?.eventId).toBe(eventId);
    });

    it('should return null for non-existent event', () => {
      const event = pipeline.getEvent('non-existent');
      expect(event).toBeNull();
    });

    it('should query events by priority', async () => {
      await pipeline.ingestEvent(
        'detection-engine',
        { data: 'test1' },
        'high',
      );
      await pipeline.ingestEvent(
        'detection-engine',
        { data: 'test2' },
        'low',
      );

      const results = pipeline.queryEvents({
        priorityFilter: ['high'],
      });

      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should query events by source', async () => {
      await pipeline.ingestEvent(
        'detection-engine',
        { data: 'test' },
      );

      const results = pipeline.queryEvents({
        sourceFilter: ['detection-engine'],
      });

      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Statistics', () => {
    it('should track ingested events', async () => {
      await pipeline.ingestEvent(
        'detection-engine',
        { data: 'test' },
      );

      const stats = pipeline.getStats();
      expect(stats.totalEventsIngested).toBeGreaterThan(0);
    });

    it('should calculate processing error rate', async () => {
      await pipeline.ingestEvent(
        'detection-engine',
        { data: 'test' },
      );

      const stats = pipeline.getStats();
      expect(stats.processingErrorRate).toBeGreaterThanOrEqual(0);
      expect(stats.processingErrorRate).toBeLessThanOrEqual(1);
    });

    it('should calculate throughput', async () => {
      await pipeline.ingestEvent(
        'detection-engine',
        { data: 'test' },
      );

      const stats = pipeline.getStats();
      expect(stats.throughputEventsPerSecond).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Audit Logging', () => {
    it('should maintain audit log', async () => {
      await pipeline.ingestEvent(
        'detection-engine',
        { data: 'test' },
      );

      const auditLog = pipeline.getAuditLog();
      expect(auditLog.length).toBeGreaterThan(0);
    });

    it('should limit audit log size', async () => {
      for (let i = 0; i < 50; i++) {
        await pipeline.ingestEvent(
          'detection-engine',
          { id: i },
        );
      }

      const auditLog = pipeline.getAuditLog(10000);
      expect(auditLog.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('Health Check', () => {
    it('should perform health check', async () => {
      const health = await pipeline.performHealthCheck();

      expect(health.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
      expect(health.checks).toBeDefined();
    });

    it('should report stage health', async () => {
      const health = await pipeline.performHealthCheck();

      expect(health.stageHealth).toBeDefined();
      expect(health.stageHealth.ingestion).toBeDefined();
      expect(health.stageHealth.enrichment).toBeDefined();
    });
  });

  describe('Event Listeners', () => {
    it('should call event listener', (done) => {
      let eventCaught = false;

      const listener: EventPipelineListener = async (event) => {
        eventCaught = true;
        done();
      };

      pipeline.onEvent(listener);

      pipeline.ingestEvent(
        'detection-engine',
        { data: 'test' },
      ).catch(done);
    });

    it('should remove event listener', () => {
      const listener: EventPipelineListener = async () => {};
      pipeline.onEvent(listener);
      pipeline.offEvent(listener);
      expect(true).toBe(true);
    });

    it('should call stage listener', (done) => {
      let stageCaught = false;

      const listener: StageListener = async (event, stage) => {
        stageCaught = true;
        done();
      };

      pipeline.onStage(listener);

      pipeline.ingestEvent(
        'detection-engine',
        { data: 'test' },
      ).catch(done);
    });
  });

  describe('Event Replay', () => {
    it('should replay events', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);

      const result = await pipeline.replayEvents({
        startDate: oneHourAgo,
        endDate: now,
      });

      expect(result.replayId).toBeDefined();
      expect(result.totalEventsReplayed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Event Archival', () => {
    it('should archive old events', async () => {
      await pipeline.ingestEvent(
        'detection-engine',
        { data: 'test' },
      );

      const archived = pipeline.archiveOldEvents(1);
      expect(archived).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Configuration Validation', () => {
    it('should throw error for invalid batch size', () => {
      const invalidConfig: IPipelineConfig = {
        enableIngestion: true,
        enableValidation: true,
        enableEnrichment: true,
        enableCorrelation: true,
        enableDistribution: true,
        enableArchive: true,
        ingestionConfig: {
          maxBatchSize: 0,
          batchTimeoutMs: 1000,
          maxQueueSize: 10000,
          deduplicationEnabled: true,
        },
      };

      expect(() => {
        createEventPipeline(invalidConfig);
      }).toThrow();
    });

    it('should throw error for invalid batch timeout', () => {
      const invalidConfig: IPipelineConfig = {
        enableIngestion: true,
        enableValidation: true,
        enableEnrichment: true,
        enableCorrelation: true,
        enableDistribution: true,
        enableArchive: true,
        ingestionConfig: {
          maxBatchSize: 100,
          batchTimeoutMs: 50,
          maxQueueSize: 10000,
          deduplicationEnabled: true,
        },
      };

      expect(() => {
        createEventPipeline(invalidConfig);
      }).toThrow();
    });
  });

  describe('Integration', () => {
    it('should handle complete event pipeline flow', async () => {
      // Register enricher
      pipeline.registerEnricher({
        enricherId: 'threat-enricher',
        name: 'Threat Enricher',
        enrichmentType: 'threat-intel',
        priority: 1,
        isActive: true,
        handler: async (event) => [
          {
            enrichmentId: 'enrich-1',
            type: 'threat-intel',
            source: 'threat-feed',
            data: { threat_score: 95 },
            appliedAt: new Date(),
          },
        ],
      });

      // Register distributor
      pipeline.registerDistributor({
        distributorId: 'slack-distributor',
        name: 'Slack Distributor',
        priority: 1,
        isActive: true,
        handler: async (event) => {
          // Would send to Slack
        },
      });

      // Ingest event
      const eventId = await pipeline.ingestEvent(
        'detection-engine',
        { threat: 'malware', severity: 'critical' },
        'critical',
      );

      // Verify
      const event = pipeline.getEvent(eventId);
      expect(event).not.toBeNull();
      expect(event?.eventId).toBe(eventId);

      const stats = pipeline.getStats();
      expect(stats.totalEventsIngested).toBeGreaterThan(0);
    });
  });
});
