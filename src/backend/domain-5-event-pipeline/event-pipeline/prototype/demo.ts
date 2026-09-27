/**
 * Event Pipeline Service - Demonstration Scenarios
 */

import {
  EventPipeline,
  createEventPipeline,
  IPipelineConfig,
  IEventEnricher,
  IEventCorrelator,
  IEventDistributor,
  IEventFilter,
  IPipelineEvent,
} from '../src';

/**
 * Demo 1: Basic Event Ingestion
 */
async function demo1_BasicEventIngestion() {
  console.log('\n=== Demo 1: Basic Event Ingestion ===\n');

  const config: IPipelineConfig = {
    enableIngestion: true,
    enableValidation: true,
    enableEnrichment: false,
    enableCorrelation: false,
    enableDistribution: false,
    enableArchive: true,
    enableMetrics: true,
    enableAudit: true,
  };

  const pipeline = createEventPipeline(config);

  console.log('Ingesting events...\n');

  const event1 = await pipeline.ingestEvent(
    'detection-engine',
    { threat: 'malware', file: 'test.exe', severity: 'high' },
    'high',
  );

  const event2 = await pipeline.ingestEvent(
    'network-sensor',
    { ip: '192.168.1.100', port: 443, protocol: 'https' },
    'medium',
  );

  const event3 = await pipeline.ingestEvent(
    'endpoint-agent',
    { process: 'explorer.exe', parent: 'system', action: 'created' },
    'low',
  );

  console.log(`Event 1: ${event1}`);
  console.log(`Event 2: ${event2}`);
  console.log(`Event 3: ${event3}`);

  const stats = pipeline.getStats();
  console.log(`\nTotal ingested: ${stats.totalEventsIngested}`);

  pipeline.stop();
}

/**
 * Demo 2: Batch Event Ingestion
 */
async function demo2_BatchEventIngestion() {
  console.log('\n=== Demo 2: Batch Event Ingestion ===\n');

  const config: IPipelineConfig = {
    enableIngestion: true,
    enableValidation: true,
    enableEnrichment: false,
    enableCorrelation: false,
    enableDistribution: false,
    enableArchive: true,
    enableMetrics: true,
    enableAudit: false,
    ingestionConfig: {
      maxBatchSize: 100,
      batchTimeoutMs: 1000,
      maxQueueSize: 10000,
      deduplicationEnabled: true,
    },
  };

  const pipeline = createEventPipeline(config);

  console.log('Ingesting batch of 10 events...\n');

  const result = await pipeline.ingestBatchEvents({
    events: Array.from({ length: 10 }, (_, i) => ({
      source: i % 2 === 0 ? 'detection-engine' : 'network-sensor',
      priority: ['critical', 'high', 'medium'][i % 3] as any,
      data: { id: i, message: `Event ${i}` },
    })),
  });

  console.log(`Batch ID: ${result.batchId}`);
  console.log(`Total Events: ${result.totalEvents}`);
  console.log(`Successful: ${result.successfulEvents}`);
  console.log(`Failed: ${result.failedEvents}`);
  console.log(`Average Duration: ${result.averageDurationMs.toFixed(2)}ms`);

  pipeline.stop();
}

/**
 * Demo 3: Event Enrichment
 */
async function demo3_EventEnrichment() {
  console.log('\n=== Demo 3: Event Enrichment ===\n');

  const config: IPipelineConfig = {
    enableIngestion: true,
    enableValidation: true,
    enableEnrichment: true,
    enableCorrelation: false,
    enableDistribution: false,
    enableArchive: true,
    enableMetrics: true,
    enableAudit: true,
    enrichmentConfig: {
      enableCaching: true,
      maxEnrichersPerEvent: 10,
      timeoutPerEnricherMs: 5000,
    },
  };

  const pipeline = createEventPipeline(config);

  // Register threat intelligence enricher
  const threatEnricher: IEventEnricher = {
    enricherId: 'threat-intel',
    name: 'Threat Intelligence Enricher',
    enrichmentType: 'threat-intel',
    priority: 1,
    isActive: true,
    handler: async (event) => [
      {
        enrichmentId: 'ti-1',
        type: 'threat-intel',
        source: 'threat-feed',
        data: { reputation: 'known_malicious', threat_score: 95 },
        appliedAt: new Date(),
        confidence: 0.95,
      },
    ],
  };

  pipeline.registerEnricher(threatEnricher);

  console.log('Registered threat intelligence enricher\n');

  const eventId = await pipeline.ingestEvent(
    'detection-engine',
    { file: 'malware.exe', hash: 'abc123' },
    'critical',
  );

  const event = pipeline.getEvent(eventId);
  console.log(`Event enrichments: ${event?.enrichments.length || 0}`);
  if (event?.enrichments.length) {
    event.enrichments.forEach((e) => {
      console.log(`  - ${e.type}: ${e.source}`);
    });
  }

  pipeline.stop();
}

/**
 * Demo 4: Event Correlation
 */
async function demo4_EventCorrelation() {
  console.log('\n=== Demo 4: Event Correlation ===\n');

  const config: IPipelineConfig = {
    enableIngestion: true,
    enableValidation: true,
    enableEnrichment: false,
    enableCorrelation: true,
    enableDistribution: false,
    enableArchive: true,
    enableMetrics: true,
    enableAudit: true,
    correlationConfig: {
      enableCorrelation: true,
      maxHistoryPerEvent: 1000,
      timeWindowMs: 3600000,
      minCorrelationScore: 0.5,
    },
  };

  const pipeline = createEventPipeline(config);

  // Register threat correlator
  const threatCorrelator: IEventCorrelator = {
    correlatorId: 'threat-correlator',
    name: 'Threat Correlator',
    correlationType: 'threat',
    priority: 1,
    isActive: true,
    timeWindowMs: 300000,
    handler: async (event, history) => {
      const related = history.filter((e) =>
        e.data && event.data && e.data.severity === event.data.severity,
      );

      return [
        {
          correlationId: 'corr-1',
          type: 'threat',
          relatedEventIds: related.map((e) => e.eventId),
          groupId: 'threat-group-1',
          score: related.length > 0 ? 0.8 : 0,
        },
      ];
    },
  };

  pipeline.registerCorrelator(threatCorrelator);

  console.log('Registered threat correlator\n');

  // Ingest related events
  const ids: string[] = [];
  for (let i = 0; i < 3; i++) {
    const id = await pipeline.ingestEvent(
      'detection-engine',
      { threat: 'malware', variant: `variant_${i}` },
      'high',
    );
    ids.push(id);
  }

  console.log(`Ingested ${ids.length} related events`);

  const event = pipeline.getEvent(ids[0]);
  if (event) {
    console.log(`Event correlations: ${event.correlations.length}`);
    event.correlations.forEach((c) => {
      console.log(`  - Type: ${c.type}, Related: ${c.relatedEventIds.length}, Score: ${c.score}`);
    });
  }

  pipeline.stop();
}

/**
 * Demo 5: Event Filtering
 */
async function demo5_EventFiltering() {
  console.log('\n=== Demo 5: Event Filtering ===\n');

  const config: IPipelineConfig = {
    enableIngestion: true,
    enableValidation: true,
    enableEnrichment: false,
    enableCorrelation: false,
    enableDistribution: false,
    enableArchive: true,
    enableMetrics: true,
    enableAudit: true,
  };

  const pipeline = createEventPipeline(config);

  // Register filter for high severity events
  const highSeverityFilter: IEventFilter = {
    filterId: 'high-severity',
    name: 'High Severity Filter',
    priority: 1,
    isActive: true,
    conditions: [
      {
        conditionId: 'severity-cond',
        field: 'severity',
        operator: 'equals',
        value: 'high',
      },
    ],
    action: 'accept',
  };

  pipeline.registerFilter(highSeverityFilter);

  console.log('Registered high severity filter\n');

  // Ingest events
  for (let i = 0; i < 5; i++) {
    const severity = i % 2 === 0 ? 'high' : 'low';
    await pipeline.ingestEvent(
      'detection-engine',
      { id: i, severity },
    );
  }

  // Query high severity events
  const results = pipeline.queryEvents({
    priorityFilter: ['high', 'critical'],
  });

  console.log(`Query results: ${results.length} events`);

  pipeline.stop();
}

/**
 * Demo 6: Event Distribution
 */
async function demo6_EventDistribution() {
  console.log('\n=== Demo 6: Event Distribution ===\n');

  const config: IPipelineConfig = {
    enableIngestion: true,
    enableValidation: true,
    enableEnrichment: false,
    enableCorrelation: false,
    enableDistribution: true,
    enableArchive: true,
    enableMetrics: true,
    enableAudit: true,
    distributionConfig: {
      maxDistributorsPerEvent: 10,
      timeoutPerDistributorMs: 5000,
      failFastMode: false,
    },
  };

  const pipeline = createEventPipeline(config);
  const distributedTo: string[] = [];

  // Register distributors
  const slackDistributor: IEventDistributor = {
    distributorId: 'slack',
    name: 'Slack Distributor',
    priority: 1,
    isActive: true,
    handler: async (event) => {
      distributedTo.push('Slack');
    },
  };

  const emailDistributor: IEventDistributor = {
    distributorId: 'email',
    name: 'Email Distributor',
    priority: 2,
    isActive: true,
    handler: async (event) => {
      distributedTo.push('Email');
    },
  };

  pipeline.registerDistributor(slackDistributor);
  pipeline.registerDistributor(emailDistributor);

  console.log('Registered distributors\n');

  await pipeline.ingestEvent(
    'detection-engine',
    { threat: 'critical_alert' },
    'critical',
  );

  console.log(`Distributed to: ${distributedTo.join(', ')}`);

  pipeline.stop();
}

/**
 * Demo 7: Event Querying
 */
async function demo7_EventQuerying() {
  console.log('\n=== Demo 7: Event Querying ===\n');

  const config: IPipelineConfig = {
    enableIngestion: true,
    enableValidation: true,
    enableEnrichment: false,
    enableCorrelation: false,
    enableDistribution: false,
    enableArchive: true,
    enableMetrics: true,
    enableAudit: false,
  };

  const pipeline = createEventPipeline(config);

  // Ingest various events
  const sources = ['detection-engine', 'network-sensor', 'endpoint-agent'];
  const priorities = ['critical', 'high', 'medium', 'low'];

  for (let i = 0; i < 12; i++) {
    await pipeline.ingestEvent(
      sources[i % 3] as any,
      { id: i, index: i },
      priorities[i % 4] as any,
    );
  }

  // Query by source
  const detectionEvents = pipeline.queryEvents({
    sourceFilter: ['detection-engine'],
  });
  console.log(`Detection events: ${detectionEvents.length}`);

  // Query by priority
  const criticalEvents = pipeline.queryEvents({
    priorityFilter: ['critical'],
  });
  console.log(`Critical events: ${criticalEvents.length}`);

  // Query by date range
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600000);
  const recentEvents = pipeline.queryEvents({
    startDate: oneHourAgo,
    endDate: now,
  });
  console.log(`Recent events: ${recentEvents.length}`);

  pipeline.stop();
}

/**
 * Demo 8: Event Listeners
 */
async function demo8_EventListeners() {
  console.log('\n=== Demo 8: Event Listeners ===\n');

  const config: IPipelineConfig = {
    enableIngestion: true,
    enableValidation: true,
    enableEnrichment: false,
    enableCorrelation: false,
    enableDistribution: false,
    enableArchive: true,
    enableMetrics: true,
    enableAudit: false,
  };

  const pipeline = createEventPipeline(config);
  const eventLog: string[] = [];

  // Register event listener
  pipeline.onEvent(async (event) => {
    eventLog.push(`[Event] ${event.eventId} - ${event.priority}`);
  });

  // Register stage listener
  pipeline.onStage(async (event, stage) => {
    eventLog.push(`[Stage] ${stage} - ${event.eventId}`);
  });

  console.log('Listeners registered\n');

  await pipeline.ingestEvent(
    'detection-engine',
    { data: 'test' },
    'high',
  );

  console.log('Event log:');
  eventLog.forEach((entry) => console.log(`  ${entry}`));

  pipeline.stop();
}

/**
 * Demo 9: Audit Trail
 */
async function demo9_AuditTrail() {
  console.log('\n=== Demo 9: Audit Trail ===\n');

  const config: IPipelineConfig = {
    enableIngestion: true,
    enableValidation: true,
    enableEnrichment: false,
    enableCorrelation: false,
    enableDistribution: false,
    enableArchive: true,
    enableMetrics: true,
    enableAudit: true,
  };

  const pipeline = createEventPipeline(config);

  const id1 = await pipeline.ingestEvent(
    'detection-engine',
    { threat: 'malware' },
    'high',
  );

  const id2 = await pipeline.ingestEvent(
    'network-sensor',
    { suspicious_traffic: true },
  );

  const auditLog = pipeline.getAuditLog(20);

  console.log('Audit trail entries:');
  auditLog.forEach((entry) => {
    console.log(`  - ${entry.action.toUpperCase()} (${entry.stage}) at ${entry.timestamp.toISOString()}`);
  });

  pipeline.stop();
}

/**
 * Demo 10: Statistics and Health
 */
async function demo10_StatisticsAndHealth() {
  console.log('\n=== Demo 10: Statistics and Health ===\n');

  const config: IPipelineConfig = {
    enableIngestion: true,
    enableValidation: true,
    enableEnrichment: false,
    enableCorrelation: false,
    enableDistribution: false,
    enableArchive: true,
    enableMetrics: true,
    enableAudit: true,
  };

  const pipeline = createEventPipeline(config);

  // Ingest multiple events
  for (let i = 0; i < 5; i++) {
    await pipeline.ingestEvent(
      'detection-engine',
      { id: i },
      i % 2 === 0 ? 'high' : 'low',
    );
  }

  // Get statistics
  const stats = pipeline.getStats();
  console.log('Statistics:');
  console.log(`  Total Ingested: ${stats.totalEventsIngested}`);
  console.log(`  Distributed: ${stats.eventsDistributed}`);
  console.log(`  Failed: ${stats.failedEvents}`);
  console.log(`  Error Rate: ${(stats.processingErrorRate * 100).toFixed(2)}%`);
  console.log(`  Throughput: ${stats.throughputEventsPerSecond.toFixed(2)} events/sec`);

  // Health check
  const health = await pipeline.performHealthCheck();
  console.log(`\nHealth Status: ${health.status}`);
  console.log(`Queue Depth: ${health.queueDepth}`);
  console.log(`Processing Rate: ${health.processingRate.toFixed(2)} events/sec`);
  console.log(`Error Rate: ${(health.errorRate * 100).toFixed(2)}%`);

  pipeline.stop();
}

/**
 * Demo 11: Event Replay
 */
async function demo11_EventReplay() {
  console.log('\n=== Demo 11: Event Replay ===\n');

  const config: IPipelineConfig = {
    enableIngestion: true,
    enableValidation: true,
    enableEnrichment: false,
    enableCorrelation: false,
    enableDistribution: false,
    enableArchive: true,
    enableMetrics: true,
    enableAudit: false,
  };

  const pipeline = createEventPipeline(config);

  // Ingest events
  for (let i = 0; i < 3; i++) {
    await pipeline.ingestEvent(
      'detection-engine',
      { id: i },
    );
  }

  // Replay recent events
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600000);

  const result = await pipeline.replayEvents({
    startDate: oneHourAgo,
    endDate: now,
  });

  console.log('Replay result:');
  console.log(`  Replay ID: ${result.replayId}`);
  console.log(`  Total Replayed: ${result.totalEventsReplayed}`);
  console.log(`  Successful: ${result.successfulReplays}`);
  console.log(`  Failed: ${result.failedReplays}`);
  console.log(`  Duration: ${result.durationMs}ms`);

  pipeline.stop();
}

/**
 * Demo 12: Complete Pipeline Flow
 */
async function demo12_CompletePipelineFlow() {
  console.log('\n=== Demo 12: Complete Pipeline Flow ===\n');

  const config: IPipelineConfig = {
    enableIngestion: true,
    enableValidation: true,
    enableEnrichment: true,
    enableCorrelation: true,
    enableDistribution: true,
    enableArchive: true,
    enableMetrics: true,
    enableAudit: true,
    enrichmentConfig: {
      enableCaching: true,
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

  const pipeline = createEventPipeline(config);
  const flowLog: string[] = [];

  // Register components
  pipeline.registerEnricher({
    enricherId: 'threat-enricher',
    name: 'Threat Enricher',
    enrichmentType: 'threat-intel',
    priority: 1,
    isActive: true,
    handler: async () => [
      {
        enrichmentId: 'e1',
        type: 'threat-intel',
        source: 'threat-feed',
        data: { threat_score: 90 },
        appliedAt: new Date(),
      },
    ],
  });

  pipeline.registerCorrelator({
    correlatorId: 'threat-correlator',
    name: 'Threat Correlator',
    correlationType: 'threat',
    priority: 1,
    isActive: true,
    handler: async (event, history) => [
      {
        correlationId: 'c1',
        type: 'threat',
        relatedEventIds: [],
        groupId: 'threat-group',
        score: 0.85,
      },
    ],
  });

  pipeline.registerDistributor({
    distributorId: 'webhook',
    name: 'Webhook Distributor',
    priority: 1,
    isActive: true,
    handler: async () => {
      flowLog.push('Distributed to Webhook');
    },
  });

  flowLog.push('Pipeline configured');

  // Ingest events
  const id1 = await pipeline.ingestEvent(
    'detection-engine',
    { threat: 'ransomware', file: 'payment.exe' },
    'critical',
  );

  const id2 = await pipeline.ingestEvent(
    'network-sensor',
    { suspicious_connection: true, target: 'c2-server.com' },
    'high',
  );

  flowLog.push('Events ingested');

  // Get final statistics
  const stats = pipeline.getStats();
  flowLog.push(`Stats: ${stats.totalEventsIngested} ingested`);

  console.log('Pipeline flow:');
  flowLog.forEach((entry) => console.log(`  ${entry}`));

  pipeline.stop();
}

/**
 * Run all demonstrations
 */
async function runAllDemos() {
  try {
    await demo1_BasicEventIngestion();
    await demo2_BatchEventIngestion();
    await demo3_EventEnrichment();
    await demo4_EventCorrelation();
    await demo5_EventFiltering();
    await demo6_EventDistribution();
    await demo7_EventQuerying();
    await demo8_EventListeners();
    await demo9_AuditTrail();
    await demo10_StatisticsAndHealth();
    await demo11_EventReplay();
    await demo12_CompletePipelineFlow();

    console.log('\n=== All demonstrations completed successfully ===\n');
  } catch (error) {
    console.error('Demo execution failed:', error);
  }
}

export {
  demo1_BasicEventIngestion,
  demo2_BatchEventIngestion,
  demo3_EventEnrichment,
  demo4_EventCorrelation,
  demo5_EventFiltering,
  demo6_EventDistribution,
  demo7_EventQuerying,
  demo8_EventListeners,
  demo9_AuditTrail,
  demo10_StatisticsAndHealth,
  demo11_EventReplay,
  demo12_CompletePipelineFlow,
  runAllDemos,
};
