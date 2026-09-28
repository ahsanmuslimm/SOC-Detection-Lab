# Sync Service

Enterprise data synchronization engine with conflict detection, resolution strategies, and bi-directional replication support.

## Overview

The Sync Service provides a robust, scalable data synchronization capability designed for enterprise applications. It supports multiple data source types, unidirectional and bidirectional sync, multiple conflict resolution strategies, checkpointing for recovery, batch processing, event-driven architecture, and comprehensive monitoring.

**Key Features:**
- Multiple endpoint types (database, API, file, storage, webhook)
- Unidirectional and bi-directional synchronization
- Advanced conflict detection and resolution
- Multiple conflict resolution strategies (source-wins, target-wins, timestamp, version, manual, merge)
- Checkpointing for fault recovery
- Batch processing with configurable sizes
- Entity-level filtering and transformation
- Concurrent sync jobs with queuing
- Incremental synchronization support
- Data validation and quality checks
- Event-driven architecture with listeners
- Comprehensive statistics and metrics
- Health checks and diagnostics
- Audit trail for all operations
- Automatic retry with exponential backoff

## Architecture

### Core Components

1. **Endpoint Manager**: Manages sync endpoints
2. **Sync Configuration**: Configures sync jobs
3. **Sync Executor**: Executes sync operations
4. **Delta Computer**: Computes data deltas
5. **Conflict Detector**: Detects conflicts
6. **Conflict Resolver**: Resolves conflicts
7. **Checkpoint Manager**: Manages sync checkpoints
8. **Batch Processor**: Processes data in batches
9. **Event Emitter**: Publishes sync events
10. **Health Monitor**: Tracks system health

### Data Flow

```
Sync Start
    ↓
Fetch Source Data
    ↓
Fetch Target Data
    ↓
Compute Deltas
    ↓
Detect Conflicts
    ↓
Apply Transformations
    ↓
Resolve Conflicts
    ↓
Apply to Target
    ↓
Update Checkpoint
    ↓
Emit Events
    ↓
Update Statistics
```

## API Reference

### Creating the Service

```typescript
import { createSyncService, ISyncServiceConfig } from '@sync-service';

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
```

### Endpoint Management

#### Register Endpoint

```typescript
const endpointId = service.registerEndpoint({
  name: 'Production Database',
  type: 'database',
  config: {
    connectionString: 'postgresql://localhost/prod',
  },
  enabled: true,
});
```

#### Get Endpoint

```typescript
const endpoint = service.getEndpoint(endpointId);
```

#### List Endpoints

```typescript
const endpoints = service.listEndpoints();
```

### Sync Configuration

#### Create Sync

```typescript
const syncId = service.createSync({
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
```

#### Get Sync

```typescript
const sync = service.getSync(syncId);
```

#### List Syncs

```typescript
const syncs = service.listSyncs();
```

#### Delete Sync

```typescript
const deleted = service.deleteSync(syncId);
```

### Sync Execution

#### Start Sync

```typescript
const jobId = await service.startSync(syncId);
```

#### Get Sync Job

```typescript
const job = service.getSyncJob(jobId);
```

#### List Sync Jobs

```typescript
const jobs = service.listSyncJobs();
const runningJobs = service.listSyncJobs('running');
```

#### Pause Sync

```typescript
const paused = service.pauseSync(jobId);
```

#### Resume Sync

```typescript
const resumed = service.resumeSync(jobId);
```

#### Cancel Sync

```typescript
const cancelled = service.cancelSync(jobId);
```

### Conflict Management

#### Get Conflicts

```typescript
const conflicts = service.getConflicts(syncId);
```

#### Resolve Conflict

```typescript
const resolved = service.resolveConflict(conflictId, {
  field1: 'resolvedValue1',
  field2: 'resolvedValue2',
});
```

### Checkpointing

#### Get Checkpoint

```typescript
const checkpoint = service.getCheckpoint(syncId);
console.log(`Last synced: ${checkpoint?.lastSyncedAt}`);
console.log(`Version: ${checkpoint?.version}`);
```

### Progress Tracking

#### Get Sync Progress

```typescript
const progress = service.getSyncProgress(jobId);
console.log(`Progress: ${progress?.percentage}%`);
console.log(`Entities: ${progress?.processedEntities}/${progress?.totalEntities}`);
```

### Health Check

```typescript
const health = await service.performHealthCheck();
console.log(`Status: ${health.status}`);
health.endpoints.forEach(ep => {
  console.log(`${ep.name}: ${ep.status}`);
});
```

### Event Listeners

```typescript
service.onEvent(async (event) => {
  console.log(`Event: ${event.type}`);
  
  switch (event.type) {
    case 'sync-started':
      console.log(`Sync started: ${event.jobId}`);
      break;
    case 'sync-completed':
      console.log(`Sync completed: ${event.jobId}`);
      break;
    case 'conflict-detected':
      console.log(`Conflict detected: ${event.details?.entityId}`);
      break;
  }
});
```

## Configuration

### Endpoint Types

| Type | Description | Use Case |
|------|-------------|----------|
| **database** | SQL/NoSQL database | Primary data source |
| **api** | REST/GraphQL API | Third-party systems |
| **file** | File system | Batch imports/exports |
| **storage** | Object storage (S3, GCS) | Cloud storage |
| **webhook** | Webhook endpoint | Event-driven sync |

### Sync Directions

- **unidirectional**: Source → Target only
- **bidirectional**: Source ↔ Target (requires conflict resolution)

### Conflict Resolution Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| **source-wins** | Source data overwrites target | Cache invalidation |
| **target-wins** | Target data takes precedence | Preserving edits |
| **timestamp** | Latest update wins | Most scenarios |
| **version** | Highest version wins | Versioned data |
| **manual** | Operator resolves conflicts | Complex data |
| **merge** | Merge changes intelligently | Collaborative sync |

### Schedule Types

- **manual**: Trigger manually via API
- **continuous**: Sync continuously
- **scheduled**: Sync at regular intervals

## Usage Examples

### Example 1: Database to API Sync

```typescript
// Register endpoints
const dbEpId = service.registerEndpoint({
  name: 'Production DB',
  type: 'database',
  config: { connectionString: 'postgresql://prod-db' },
  enabled: true,
});

const apiEpId = service.registerEndpoint({
  name: 'Analytics API',
  type: 'api',
  config: { apiUrl: 'https://analytics.example.com' },
  enabled: true,
});

// Create sync
const syncId = service.createSync({
  name: 'DB to API',
  sourceEndpoint: service.getEndpoint(dbEpId)!,
  targetEndpoint: service.getEndpoint(apiEpId)!,
  direction: 'unidirectional',
  entityTypes: ['transactions', 'events'],
  conflictResolution: 'source-wins',
  scheduleType: 'continuous',
  batchSize: 500,
  retryPolicy: { maxRetries: 5, initialDelayMs: 1000, maxDelayMs: 30000, backoffMultiplier: 2 },
  enabled: true,
});

// Start sync
const jobId = await service.startSync(syncId);
```

### Example 2: Bi-directional Order Sync

```typescript
const syncId = service.createSync({
  name: 'Order Sync',
  sourceEndpoint: sourceEp,
  targetEndpoint: targetEp,
  direction: 'bidirectional',
  entityTypes: ['orders', 'order_items'],
  conflictResolution: 'timestamp', // Latest update wins
  scheduleType: 'continuous',
  batchSize: 250,
  retryPolicy: {
    maxRetries: 5,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 1.5,
  },
  enabled: true,
});

const jobId = await service.startSync(syncId);

// Monitor progress
const progress = service.getSyncProgress(jobId);
console.log(`${progress?.processedEntities}/${progress?.totalEntities} synced`);

// Get conflicts
const conflicts = service.getConflicts(syncId);
conflicts.forEach(conflict => {
  // Resolve conflict
  service.resolveConflict(conflict.conflictId, conflict.targetData.data);
});
```

### Example 3: Multi-Endpoint Sync Chain

```typescript
// Create chain: DB → Cache → API

const syncDB2Cache = service.createSync({
  name: 'DB to Cache',
  sourceEndpoint: dbEp,
  targetEndpoint: cacheEp,
  direction: 'unidirectional',
  entityTypes: ['sessions', 'config'],
  conflictResolution: 'source-wins',
  scheduleType: 'continuous',
  batchSize: 1000,
  retryPolicy: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 },
  enabled: true,
});

const syncCache2API = service.createSync({
  name: 'Cache to API',
  sourceEndpoint: cacheEp,
  targetEndpoint: apiEp,
  direction: 'unidirectional',
  entityTypes: ['sessions', 'config'],
  conflictResolution: 'source-wins',
  scheduleType: 'continuous',
  batchSize: 500,
  retryPolicy: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 },
  enabled: true,
});

await service.startSync(syncDB2Cache);
await service.startSync(syncCache2API);
```

### Example 4: Conflict Resolution

```typescript
// Start sync
const jobId = await service.startSync(syncId);

// Monitor for conflicts
service.onEvent(async (event) => {
  if (event.type === 'conflict-detected') {
    const conflicts = service.getConflicts(syncId);
    
    for (const conflict of conflicts) {
      if (!conflict.resolved) {
        // Merge strategy: combine source and target
        const merged = {
          ...conflict.targetData.data,
          ...conflict.sourceData.data,
          lastUpdated: new Date(),
        };
        
        service.resolveConflict(conflict.conflictId, merged);
      }
    }
  }
});
```

## Performance Considerations

### Batch Sizing

- Small batches (100-500): Lower memory, more latency
- Medium batches (500-2000): Balanced
- Large batches (2000+): Lower latency, higher memory

### Concurrent Syncs

- Default: 5 concurrent jobs
- Adjust based on system resources
- Queued jobs process as slots free

### Checkpointing

- Enables recovery from failures
- Minimal overhead (stores state)
- Recommended for long-running syncs

## Best Practices

1. **Endpoint Configuration**: Use connection pooling for databases
2. **Batch Sizing**: Choose based on network and system resources
3. **Conflict Resolution**: Pick strategy matching business logic
4. **Checkpointing**: Enable for critical syncs
5. **Monitoring**: Track sync metrics and health regularly
6. **Error Handling**: Configure appropriate retry policies
7. **Testing**: Test with realistic data volumes
8. **Documentation**: Document sync configurations
9. **Alerts**: Set up alerts for failed syncs
10. **Cleanup**: Archive or delete old sync records

## Error Handling

Service handles:
- Endpoint unavailability (retries configured)
- Data conflicts (resolution configured)
- Network failures (automatic retry)
- Timeouts (respects timeout config)
- Concurrent job limits (queues jobs)

## Lifecycle Management

```typescript
// Create service
const service = createSyncService(config);

// Register endpoints and create syncs
const syncId = service.createSync({...});

// Execute syncs
const jobId = await service.startSync(syncId);

// Graceful shutdown
service.stop();
```

## Testing

Run unit tests:

```bash
npm run test -- sync-service.test.ts
```

Run demo scenarios:

```bash
npm run demo -- sync-service/demo.ts
```

## Dependencies

- **Built-in**: Node.js for async operations
- **Optional**: Database drivers, API clients for real integrations

## See Also

- [Queue Service](../queue-service/README.md) - Queue sync jobs
- [Storage Service](../storage-service/README.md) - Store sync data
- [Audit Service](../audit-service/README.md) - Audit sync operations
- [Metrics Service](../metrics-service/README.md) - Sync metrics

## Version

1.0.0

## License

See repository LICENSE file
