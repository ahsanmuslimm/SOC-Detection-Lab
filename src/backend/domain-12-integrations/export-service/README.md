# Export Service

Enterprise data export engine supporting multiple formats, compression, templates, schedules, and delivery methods.

## Overview

The Export Service provides a powerful, scalable data export capability designed for enterprise applications. It supports multiple export formats (JSON, CSV, XML, PDF, XLSX, HTML), advanced filtering and sorting, export templates, scheduled exports, batch operations, compression algorithms, multiple delivery methods, and comprehensive monitoring.

**Key Features:**
- Multiple export formats (JSON, CSV, XML, PARQUET, AVRO, XLSX, PDF, HTML)
- Advanced data filtering with rich operators
- Column selection and sorting
- Export templates for reusable configurations
- Scheduled exports with multiple frequencies
- Batch export operations
- Multiple compression algorithms (gzip, brotli, deflate, lz4)
- Multiple delivery methods (email, download, storage, webhook, SFTP)
- Concurrent job processing with queuing
- Data quality metrics and validation
- Event-driven architecture with listeners
- Comprehensive statistics and monitoring
- Health checks and diagnostics
- Audit trail for all operations
- Cache support for improved performance
- Multiple data sources (database, query, API, file)

## Architecture

### Core Components

1. **Job Manager**: Creates and manages export jobs
2. **Job Executor**: Processes export jobs with concurrency control
3. **Format Converter**: Converts data to multiple formats
4. **Data Transformer**: Applies filters, sorting, and projections
5. **Compression Engine**: Compresses data using various algorithms
6. **Delivery Manager**: Handles multi-method delivery
7. **Template Manager**: Manages reusable templates
8. **Schedule Manager**: Manages scheduled exports
9. **Statistics Collector**: Tracks metrics and performance
10. **Event Emitter**: Publishes export events to listeners

### Data Flow

```
Job Creation
    ↓
Data Source Fetch
    ↓
Filtering & Sorting
    ↓
Format Conversion
    ↓
Compression
    ↓
Delivery
    ↓
Event Emission
    ↓
Statistics Update
```

## API Reference

### Creating the Service

```typescript
import { createExportService, IExportServiceConfig } from '@export-service';

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

const service = createExportService(config);
```

### Job Management

#### Create Export Job

```typescript
const jobId = service.createExportJob({
  name: 'User Export',
  format: 'CSV',
  dataSource: {
    type: 'database',
    sourceId: 'production-db',
    tableName: 'users',
  },
  filters: [
    { field: 'status', operator: 'eq', value: 'active' },
    { field: 'createdAt', operator: 'gte', value: '2024-01-01' },
  ],
  columns: ['id', 'name', 'email', 'department'],
  sorting: [
    { field: 'department', order: 'asc' },
    { field: 'name', order: 'asc' },
  ],
  compression: 'gzip',
  deliveryMethods: ['email', 'download'],
});
```

#### Get Export Job

```typescript
const job = service.getExportJob(jobId);
if (job) {
  console.log(`Status: ${job.status}`);
  console.log(`Progress: ${job.progress}%`);
  console.log(`Rows: ${job.rowCount}`);
}
```

#### List Export Jobs

```typescript
// List all jobs
const allJobs = service.listExportJobs();

// List jobs by status
const activeJobs = service.listExportJobs('in-progress');
const completedJobs = service.listExportJobs('completed');
```

#### Cancel Job

```typescript
const cancelled = service.cancelExportJob(jobId);
```

#### Delete Job

```typescript
const deleted = service.deleteExportJob(jobId);
```

### Job Execution

#### Start Export Job

```typescript
await service.startExportJob(jobId);
```

#### Execute Batch Export

```typescript
const batchResult = await service.batchExport({
  jobs: [
    {
      name: 'Job 1',
      format: 'JSON',
      dataSource: { type: 'database', sourceId: 'db1' },
    },
    {
      name: 'Job 2',
      format: 'CSV',
      dataSource: { type: 'database', sourceId: 'db1' },
    },
  ],
  parallelJobs: 2,
  stopOnError: false,
});

console.log(`Successful: ${batchResult.successfulJobs}`);
console.log(`Failed: ${batchResult.failedJobs}`);
```

### Template Management

#### Create Template

```typescript
const templateId = service.createTemplate({
  name: 'User Report',
  format: 'CSV',
  defaultColumns: ['id', 'name', 'email', 'role'],
  compression: 'gzip',
  encryption: false,
});
```

#### List Templates

```typescript
const templates = service.listTemplates();
```

#### Get Template

```typescript
const template = service.getTemplate(templateId);
```

#### Delete Template

```typescript
service.deleteTemplate(templateId);
```

### Schedule Management

#### Create Schedule

```typescript
const scheduleId = service.createSchedule({
  name: 'Daily Export',
  frequency: 'daily',
  templateId: templateId,
});
```

#### List Schedules

```typescript
const schedules = service.listSchedules();
```

#### Get Schedule

```typescript
const schedule = service.getSchedule(scheduleId);
```

#### Delete Schedule

```typescript
service.deleteSchedule(scheduleId);
```

### Data Filtering

#### Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| **eq** | Equal | `{ field: 'status', operator: 'eq', value: 'active' }` |
| **ne** | Not equal | `{ field: 'status', operator: 'ne', value: 'deleted' }` |
| **gt** | Greater than | `{ field: 'amount', operator: 'gt', value: 100 }` |
| **gte** | Greater or equal | `{ field: 'date', operator: 'gte', value: '2024-01-01' }` |
| **lt** | Less than | `{ field: 'age', operator: 'lt', value: 65 }` |
| **lte** | Less or equal | `{ field: 'score', operator: 'lte', value: 100 }` |
| **in** | In list | `{ field: 'status', operator: 'in', values: ['new', 'active'] }` |
| **contains** | Contains | `{ field: 'email', operator: 'contains', value: '@company.com' }` |
| **startsWith** | Starts with | `{ field: 'code', operator: 'startsWith', value: 'ORD' }` |
| **endsWith** | Ends with | `{ field: 'domain', operator: 'endsWith', value: '.com' }` |

### Statistics and Monitoring

#### Get Statistics

```typescript
const stats = service.getExportStatistics();
console.log(`Total jobs: ${stats.totalJobs}`);
console.log(`Completed: ${stats.completedJobs}`);
console.log(`Failed: ${stats.failedJobs}`);
console.log(`Success rate: ${(stats.successRate * 100).toFixed(2)}%`);
```

#### Health Check

```typescript
const health = await service.performHealthCheck();
console.log(`Status: ${health.status}`);
console.log(`Active jobs: ${health.activeJobs}`);
console.log(`Queued jobs: ${health.queuedJobs}`);
console.log(`Disk utilization: ${health.diskUsage.utilizationPercentage}%`);
```

### Event Listeners

```typescript
service.onEvent(async (event) => {
  console.log(`Event: ${event.type}`);
  
  switch (event.type) {
    case 'job-created':
      console.log(`Job created: ${event.jobId}`);
      break;
    case 'job-started':
      console.log(`Job started: ${event.jobId}`);
      break;
    case 'job-completed':
      console.log(`Job completed with ${event.details?.rowCount} rows`);
      break;
    case 'job-failed':
      console.log(`Job failed: ${event.details?.error}`);
      break;
    case 'delivery-sent':
      console.log(`Delivery via ${event.details?.method}`);
      break;
  }
});
```

## Configuration

### Export Formats

| Format | Description | Use Case |
|--------|-------------|----------|
| **JSON** | JavaScript Object Notation | APIs, web applications |
| **CSV** | Comma-separated values | Spreadsheets, databases |
| **XML** | Extensible markup language | Enterprise systems |
| **PARQUET** | Columnar storage format | Big data analytics |
| **AVRO** | Row-based format | Data streaming |
| **XLSX** | Excel spreadsheet | Business reports |
| **PDF** | Portable document | Print-ready reports |
| **HTML** | Hypertext markup | Web viewing |

### Compression Algorithms

| Algorithm | Ratio | Speed | Use Case |
|-----------|-------|-------|----------|
| **gzip** | ~30% | Fast | General compression |
| **brotli** | ~25% | Slower | Web delivery |
| **deflate** | ~35% | Very fast | Legacy systems |
| **lz4** | ~60% | Very fast | Real-time compression |
| **none** | 100% | Instant | Uncompressed |

### Delivery Methods

- **email**: Send via email
- **download**: Direct download link
- **storage**: Save to object storage
- **webhook**: POST to webhook URL
- **sftp**: Upload to SFTP server

## Usage Examples

### Example 1: Daily User Report

```typescript
// Create template
const templateId = service.createTemplate({
  name: 'Daily User Report',
  format: 'CSV',
  defaultColumns: ['id', 'name', 'email', 'lastActive', 'status'],
});

// Create job
const jobId = service.createExportJob({
  name: 'Today\'s Users',
  format: 'CSV',
  dataSource: {
    type: 'database',
    sourceId: 'main-db',
    query: 'SELECT * FROM users WHERE DATE(createdAt) = CURDATE()',
  },
  compression: 'gzip',
  deliveryMethods: ['email'],
});

// Execute
await service.startExportJob(jobId);
```

### Example 2: Filtered Analytics Export

```typescript
const jobId = service.createExportJob({
  name: 'High-Value Orders',
  format: 'JSON',
  dataSource: {
    type: 'query',
    sourceId: 'analytics',
    query: 'SELECT * FROM orders',
  },
  filters: [
    { field: 'total', operator: 'gte', value: 1000 },
    { field: 'status', operator: 'in', values: ['completed', 'shipped'] },
  ],
  columns: ['orderId', 'customer', 'total', 'date', 'status'],
  sorting: [{ field: 'total', order: 'desc' }],
  compression: 'brotli',
  deliveryMethods: ['storage', 'email'],
});

await service.startExportJob(jobId);
```

### Example 3: Batch Export with Templates

```typescript
const templates = [
  { name: 'Users', format: 'CSV' as ExportFormat },
  { name: 'Orders', format: 'JSON' as ExportFormat },
  { name: 'Products', format: 'XML' as ExportFormat },
];

// Create templates
const templateIds = templates.map(t =>
  service.createTemplate({
    name: `${t.name} Export Template`,
    format: t.format,
  })
);

// Create batch job
const result = await service.batchExport({
  jobs: [
    {
      name: 'Batch Users',
      format: 'CSV',
      dataSource: { type: 'database', sourceId: 'db1', tableName: 'users' },
    },
    {
      name: 'Batch Orders',
      format: 'JSON',
      dataSource: { type: 'database', sourceId: 'db1', tableName: 'orders' },
    },
  ],
  parallelJobs: 2,
  stopOnError: false,
});
```

### Example 4: Scheduled Monthly Reports

```typescript
// Create template
const templateId = service.createTemplate({
  name: 'Monthly Summary',
  format: 'PDF',
  defaultColumns: ['metric', 'value', 'change', 'forecast'],
});

// Create schedule
const scheduleId = service.createSchedule({
  name: 'Monthly Report Generation',
  frequency: 'monthly',
  templateId,
});

// Jobs will be auto-created per schedule
```

## Performance Considerations

### Export Optimization

- Use column selection to reduce data size
- Apply filters before export for efficiency
- Use appropriate compression (gzip for balance)
- Batch related exports together
- Schedule exports during off-peak hours

### Format Selection

- JSON: Flexible, large file size
- CSV: Compact, spreadsheet-friendly
- XML: Structured, verbose
- Parquet: Efficient for analytics
- PDF: Print-ready, compressed

### Concurrency

- Default: 5 concurrent jobs
- Queued jobs process as slots free
- Adjust based on system resources

## Best Practices

1. **Template Reuse**: Create templates for common exports
2. **Scheduling**: Schedule exports during off-peak hours
3. **Compression**: Enable compression for large exports
4. **Filters**: Always filter data to minimum required
5. **Columns**: Select only necessary columns
6. **Delivery**: Use appropriate delivery method
7. **Monitoring**: Track job status and statistics
8. **Error Handling**: Configure retry policies
9. **Cleanup**: Archive or delete old exports
10. **Security**: Encrypt sensitive exports

## Error Handling

Service handles:
- Invalid format selection (defaults to JSON)
- Data source unavailability
- Compression failures (stores uncompressed)
- Delivery failures (retries configured)
- Job timeouts (respects timeout config)
- Concurrent job limits (queues jobs)

## Lifecycle Management

```typescript
// Create service
const service = createExportService(config);

// Create and execute jobs
const jobId = service.createExportJob({...});
await service.startExportJob(jobId);

// Graceful shutdown
service.stop();
```

## Testing

Run unit tests:

```bash
npm run test -- export-service.test.ts
```

Run demo scenarios:

```bash
npm run demo -- export-service/demo.ts
```

## Dependencies

- **Built-in**: Node.js Buffer for data handling
- **Optional**: Format libraries (xlsx, pdf-lib), compression libraries

## See Also

- [Storage Service](../storage-service/README.md) - Store export files
- [Queue Service](../queue-service/README.md) - Queue export jobs
- [Notification Service](../notification-service/README.md) - Notify on completion
- [Metrics Service](../metrics-service/README.md) - Export metrics

## Version

1.0.0

## License

See repository LICENSE file
