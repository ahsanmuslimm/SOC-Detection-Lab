# Event Pipeline Service

Enterprise-grade event processing pipeline with ingestion, validation, enrichment, correlation, and distribution capabilities for security events and system-wide event handling.

## Overview

The Event Pipeline Service provides a robust, scalable framework for processing events through multiple stages with built-in enrichment, correlation, and distribution capabilities. It handles events from multiple sources, applies intelligent filtering and enrichment, correlates related events, and distributes processed events to various destinations.

## Key Features

### Event Ingestion
- Single and batch event ingestion
- Multiple event sources support
- Event deduplication
- Queue-based processing
- Priority-based event handling

### Event Processing
- Multi-stage pipeline (validation → enrichment → correlation → distribution)
- Event validation with configurable rules
- Configurable timeout and retry logic
- Batch processing optimization
- Error handling and recovery

### Event Enrichment
- Multiple enricher registration and execution
- Built-in threat intelligence enrichment
- Context and metadata enrichment
- Caching support for enrichment results
- Enrichment confidence scoring

### Event Correlation
- Event correlation by threat, user, asset
- Time-window based correlation
- Correlation scoring and grouping
- Historical event analysis
- Pattern-based correlation

### Event Distribution
- Multiple distributor support
- Configurable distribution routes
- Event filtering before distribution
- Timeout and failure handling
- Webhook and external system integration

### Filtering and Querying
- Complex filter conditions
- Event filtering by multiple attributes
- Advanced query capabilities
- Event history search
- Event deduplication

### Observability
- Comprehensive metrics collection
- Real-time statistics
- Event throughput monitoring
- Processing error tracking
- Health checks

### Audit & Compliance
- Complete audit logging
- Event replay capabilities
- Event archival
- Compliance reporting
- Traceability

## Architecture

### Pipeline Stages

```
Event Ingestion
    ↓
Validation
    ├→ Apply Filters
    ├→ Reject Invalid
    └→ Transform
    ↓
Enrichment
    ├→ Threat Intelligence
    ├→ Context Enrichment
    ├→ Metadata Enrichment
    └→ Custom Enrichers
    ↓
Correlation
    ├→ Threat Correlation
    ├→ User Correlation
    ├→ Asset Correlation
    └→ Time-window Analysis
    ↓
Distribution
    ├→ Webhook Distribution
    ├→ System Distribution
    ├→ Alert Distribution
    └→ Custom Distributors
    ↓
Archive
    └→ Historical Storage
```

### Component Types

```
EventPipeline
├── Ingestion Layer
│   ├── Event Queue
│   ├── Deduplication
│   └── Batch Processor
├── Processing Layer
│   ├── Validators
│   ├── Filters
│   └── Processors
├── Enrichment Layer
│   ├── Enrichers
│   └── Cache
├── Correlation Layer
│   ├── Correlators
│   └── History
└── Distribution Layer
    ├── Distributors
    └── Routing
```

## Type Definitions

### IPipelineEvent

```typescript
interface IPipelineEvent {
  eventId: string;
  timestamp: Date;
  source: EventSource;
  priority: EventPriority;
  status: EventStatus;
  data: IEventData;
  context: IEventContext;
  enrichments: IEventEnrichment[];
  correlations: IEventCorrelation[];
  ingestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
}
```

### IEventEnricher

```typescript
interface IEventEnricher {
  enricherId: string;
  name: string;
  enrichmentType: EnrichmentType;
  priority: number;
  isActive: boolean;
  handler: (event: IPipelineEvent) => Promise<IEventEnrichment[]>;
}
```

### IEventCorrelator

```typescript
interface IEventCorrelator {
  correlatorId: string;
  name: string;
  correlationType: CorrelationType;
  priority: number;
  isActive: boolean;
  handler: (event: IPipelineEvent, history: IPipelineEvent[]) => Promise<IEventCorrelation[]>;
}
```

## API Reference

### Constructor

```typescript
const pipeline = new EventPipeline(config: IPipelineConfig);
```

### Event Ingestion

#### Ingest Single Event

```typescript
async ingestEvent(
  source: EventSource,
  data: IEventData,
  priority?: EventPriority,
  context?: Partial<IEventContext>
): Promise<string>

// Example
const eventId = await pipeline.ingestEvent(
  'detection-engine',
  { threat: 'malware', severity: 'high' },
  'critical'
);
```

#### Ingest Batch Events

```typescript
async ingestBatchEvents(batch: IBatchIngestionRequest): Promise<IPipelineBatchResult>

// Example
const result = await pipeline.ingestBatchEvents({
  events: [
    { source: 'detection-engine', data: { threat: 'malware' } },
    { source: 'network-sensor', data: { ip: '192.168.1.1' } }
  ]
});
```

### Component Registration

#### Register Enricher

```typescript
registerEnricher(enricher: IEventEnricher): void

// Example
pipeline.registerEnricher({
  enricherId: 'threat-intel',
  name: 'Threat Intelligence',
  enrichmentType: 'threat-intel',
  priority: 1,
  isActive: true,
  handler: async (event) => [
    {
      enrichmentId: 'ti-1',
      type: 'threat-intel',
      source: 'threat-feed',
      data: { reputation: 'malicious', score: 95 },
      appliedAt: new Date()
    }
  ]
});
```

#### Register Correlator

```typescript
registerCorrelator(correlator: IEventCorrelator): void

// Example
pipeline.registerCorrelator({
  correlatorId: 'threat-correlator',
  name: 'Threat Correlator',
  correlationType: 'threat',
  priority: 1,
  isActive: true,
  handler: async (event, history) => {
    const related = history.filter(e => /* matching criteria */);
    return [{
      correlationId: 'corr-1',
      type: 'threat',
      relatedEventIds: related.map(e => e.eventId),
      groupId: 'threat-group-1',
      score: 0.85
    }];
  }
});
```

#### Register Distributor

```typescript
registerDistributor(distributor: IEventDistributor): void

// Example
pipeline.registerDistributor({
  distributorId: 'webhook',
  name: 'Webhook Distributor',
  priority: 1,
  isActive: true,
  handler: async (event) => {
    // Send to external system via webhook
    await fetch('https://example.com/webhooks/events', {
      method: 'POST',
      body: JSON.stringify(event)
    });
  }
});
```

### Event Retrieval

#### Get Event

```typescript
getEvent(eventId: string): IPipelineEvent | null

// Example
const event = pipeline.getEvent(eventId);
```

#### Query Events

```typescript
queryEvents(query: IEventQuery): IPipelineEvent[]

// Example
const results = pipeline.queryEvents({
  sourceFilter: ['detection-engine'],
  priorityFilter: ['critical', 'high'],
  startDate: new Date(Date.now() - 3600000),
  limit: 100
});
```

### Monitoring

#### Get Statistics

```typescript
getStats(): IPipelineStats

// Returns
{
  totalEventsIngested: 5000,
  eventsEnriched: 4950,
  eventsCorrelated: 4900,
  eventsDistributed: 4850,
  failedEvents: 50,
  averageProcessingTimeMs: 125,
  throughputEventsPerSecond: 50,
  ...
}
```

#### Get Audit Log

```typescript
getAuditLog(limit: number = 100): IPipelineAuditEntry[]

// Example
const auditLog = pipeline.getAuditLog(500);
```

#### Perform Health Check

```typescript
async performHealthCheck(): Promise<IPipelineHealthCheck>

// Returns
{
  status: 'healthy',
  stageHealth: {
    ingestion: 'healthy',
    enrichment: 'healthy',
    correlation: 'healthy',
    distribution: 'healthy'
  },
  queueDepth: 125,
  processingRate: 50,
  errorRate: 0.01
}
```

### Event Listeners

#### Add Event Listener

```typescript
onEvent(listener: EventPipelineListener): this

// Example
pipeline.onEvent(async (event) => {
  console.log(`Processed event: ${event.eventId}`);
});
```

#### Add Stage Listener

```typescript
onStage(listener: StageListener): this

// Example
pipeline.onStage(async (event, stage) => {
  console.log(`Event ${event.eventId} at stage: ${stage}`);
});
```

### Event Management

#### Replay Events

```typescript
async replayEvents(request: IEventReplayRequest): Promise<IEventReplayResult>

// Example
const result = await pipeline.replayEvents({
  startDate: new Date(Date.now() - 86400000),
  endDate: new Date(),
  sourceFilter: ['detection-engine'],
  reprocessWithEnrichment: true
});
```

#### Archive Old Events

```typescript
archiveOldEvents(olderThanMs?: number): number

// Example
const archived = pipeline.archiveOldEvents(86400000); // 1 day
```

## Usage Examples

### Basic Event Processing

```typescript
const pipeline = createEventPipeline({
  enableIngestion: true,
  enableValidation: true,
  enableEnrichment: true,
  enableCorrelation: true,
  enableDistribution: true,
  enableArchive: true,
  enableMetrics: true,
  enableAudit: true
});

// Ingest event
const eventId = await pipeline.ingestEvent(
  'detection-engine',
  { threat: 'malware', file: 'test.exe' },
  'critical'
);

// Get processed event
const event = pipeline.getEvent(eventId);
console.log(`Enrichments: ${event.enrichments.length}`);
console.log(`Correlations: ${event.correlations.length}`);
```

### Register Enricher

```typescript
pipeline.registerEnricher({
  enricherId: 'geolocation',
  name: 'Geolocation Enricher',
  enrichmentType: 'context',
  priority: 2,
  isActive: true,
  handler: async (event) => {
    if (event.data.ip) {
      const geo = await lookupGeoLocation(event.data.ip);
      return [{
        enrichmentId: 'geo-1',
        type: 'context',
        source: 'geoip-api',
        data: geo,
        appliedAt: new Date()
      }];
    }
    return [];
  }
});
```

### Register Distributor

```typescript
pipeline.registerDistributor({
  distributorId: 'slack-alerts',
  name: 'Slack Alerts',
  priority: 1,
  isActive: true,
  filters: [{
    filterId: 'critical-only',
    name: 'Critical Events',
    priority: 1,
    isActive: true,
    conditions: [{
      conditionId: 'priority-cond',
      field: 'priority',
      operator: 'equals',
      value: 'critical'
    }],
    action: 'accept'
  }],
  handler: async (event) => {
    await sendToSlack({
      channel: '#security',
      text: `Critical event: ${event.eventId}`
    });
  }
});
```

## Supported Event Sources

- `detection-engine` - Detection system events
- `threat-intelligence` - Threat intel feed events
- `network-sensor` - Network monitoring events
- `endpoint-agent` - Endpoint detection events
- `user-action` - User activity events
- `system-event` - System events
- `external-feed` - External data feeds
- `api-call` - API-triggered events
- `manual-entry` - Manually created events

## Best Practices

1. **Component Ordering**: Register components by priority (lower = higher priority)
2. **Enrichment**: Use multiple enrichers for comprehensive data enrichment
3. **Filtering**: Apply filters early to reduce processing load
4. **Correlation**: Set appropriate time windows based on event patterns
5. **Distribution**: Use fail-safe mode for critical distributors
6. **Monitoring**: Regularly check health and metrics
7. **Archival**: Set appropriate archive cleanup intervals
8. **Performance**: Tune batch sizes and timeouts for your workload

## Configuration

### Ingestion Config

```typescript
{
  maxBatchSize: 100,              // Max events per batch
  batchTimeoutMs: 1000,           // Batch timeout
  maxQueueSize: 10000,            // Max queue size
  deduplicationEnabled: true,     // Enable dedup
  deduplicationWindowMs: 60000    // Dedup window
}
```

### Enrichment Config

```typescript
{
  enableCaching: true,                  // Cache enrichments
  cacheTtlMs: 300000,                  // Cache TTL (5 min)
  maxEnrichersPerEvent: 10,            // Max enrichers
  timeoutPerEnricherMs: 5000           // Per-enricher timeout
}
```

## Performance Characteristics

- **Event Ingestion**: O(1) queue append
- **Event Querying**: O(n) filtering
- **Enrichment**: O(e) where e = number of enrichers
- **Correlation**: O(h) where h = history size
- **Distribution**: O(d) where d = number of distributors

## Related Services

- **API Gateway**: HTTP request routing
- **Webhook Service**: Event delivery
- **Access Control**: Authorization
- **Policy Engine**: Policy-based rules

## Testing

The service includes 40+ comprehensive unit tests covering:
- Event ingestion (single and batch)
- Component registration
- Event querying and retrieval
- Processing pipeline stages
- Statistics and metrics
- Audit logging
- Health checks
- Event listeners
- Replay functionality
- Integration scenarios

## Graceful Shutdown

```typescript
pipeline.stop();
```

## License

Enterprise Grade - All Rights Reserved
