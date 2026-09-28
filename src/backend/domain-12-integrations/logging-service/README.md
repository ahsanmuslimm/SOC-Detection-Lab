# Logging Service

Enterprise-grade structured logging system with distributed tracing, error grouping, performance metrics, and comprehensive observability for security operations environments.

## Overview

The Logging Service provides structured, context-aware logging with built-in distributed tracing (OpenTelemetry compatible), automatic error grouping, slow query tracking, and application health metrics. It supports multiple log levels and categories with flexible querying, export, and retention policies.

## Key Features

### Structured Logging
- Multi-level logging (trace, debug, info, warn, error, fatal)
- 15 log categories for domain-specific logging
- Context preservation (user, session, correlation ID)
- Configurable log formats (JSON, text, colored, structured)
- Complete log entry metadata capture

### Distributed Tracing
- OpenTelemetry-compatible trace creation
- Hierarchical span management
- Parent-child span relationships
- Trace and span status tracking
- Automatic log linking to spans

### Error Grouping
- Automatic error deduplication by stack trace
- Error occurrence tracking
- Affected user tracking
- Error group statistics
- Similar error detection

### Context Management
- User, session, and correlation ID tracking
- Request correlation across services
- Environment and host tagging
- Custom metadata preservation
- Context inheritance in spans

### Query & Retrieval
- Multi-filter querying (level, category, user, time)
- Full-text search across messages
- Date range filtering
- Pagination with configurable limits
- Result sorting

### Performance Monitoring
- Slow query logging with threshold detection
- Operation duration tracking
- Performance percentile metrics
- Memory and CPU usage monitoring
- Request/error rate tracking

### Data Export
- JSON format export
- CSV for analysis
- HTML for reports
- PDF generation support
- Checksum verification

### Health & Monitoring
- Real-time health checks
- Storage health assessment
- Processing health verification
- Application health metrics
- Component status reporting

### Sampling & Retention
- Configurable sampling policies
- Automatic log retention based on policies
- Per-level and per-category retention
- Compression and archival support
- Automatic cleanup

## Architecture

### Logging Flow

```
Log Entry
    ↓
Check Sampling → Capture Source Location
    ↓
Add Context → Generate Entry ID
    ↓
Immutable Store
    ↓
Update Stats → Add to Current Span
    ↓
Emit Event → Check for Errors
    ↓
Error Grouping → Group Similar Errors
    ↓
Listeners/Monitoring
```

### Trace & Span Hierarchy

```
Trace (traceId)
├── Start Time
├── End Time
├── Duration
└── Spans (hierarchical)
    ├── Span 1 (root)
    │   ├── Logs
    │   ├── Tags
    │   └── Span 2 (child)
    │       ├── Logs
    │       └── Span 3 (grandchild)
    └── Span 4 (sibling)
```

## Type Definitions

### ILogEntry

```typescript
interface ILogEntry {
  entryId: string;                    // Unique entry ID
  timestamp: Date;                    // Log timestamp (UTC)
  level: LogLevel;                    // trace | debug | info | warn | error | fatal
  category: LogCategory;              // Domain-specific category
  message: string;                    // Log message
  context?: Record<string, unknown>;  // Contextual data
  userId?: string;                    // User performing action
  sessionId?: string;                 // Session ID
  correlationId?: string;             // Request correlation ID
  traceId?: string;                   // Distributed trace ID
  spanId?: string;                    // Current span ID
  error?: {                           // Error details if applicable
    name: string;
    message: string;
    stack?: string;
  };
  performance?: {                     // Performance metrics
    duration: number;
    memory?: number;
  };
}
```

## API Reference

### Constructor

```typescript
const service = new LoggingService(config: ILoggerConfig);
```

### Basic Logging

#### Log by Level

```typescript
service.trace(message: string, data?: Record<string, unknown>): string
service.debug(category: LogCategory, message: string, data?: Record<string, unknown>): string
service.info(category: LogCategory, message: string, data?: Record<string, unknown>): string
service.warn(category: LogCategory, message: string, data?: Record<string, unknown>): string
service.error(category: LogCategory, message: string, error?: Error, data?: Record<string, unknown>): string
service.fatal(category: LogCategory, message: string, error?: Error, data?: Record<string, unknown>): string

// Example
service.info('api', 'Request processed', { statusCode: 200, duration: 150 });
```

### Context Management

#### Set Context

```typescript
setContext(context: Partial<ILoggerContext>): void

// Example
service.setContext({
  userId: 'analyst-01',
  correlationId: 'req-abc123',
  sessionId: 'sess-xyz789'
});
```

#### Get Context

```typescript
getContext(): ILoggerContext
```

### Distributed Tracing

#### Start/End Trace

```typescript
startTrace(operationName: string, tags?: Record<string, unknown>): string
endTrace(traceId: string, status?: 'success' | 'error' | 'partial'): void

// Example
const traceId = service.startTrace('ProcessAlert', { severity: 'high' });
// ... operations
service.endTrace(traceId, 'success');
```

#### Start/End Span

```typescript
startSpan(operationName: string, tags?: Record<string, unknown>): string
endSpan(spanId: string, status?: 'success' | 'error' | 'partial'): void

// Example
const spanId = service.startSpan('ValidateInput');
service.info('api', 'Validating input');
service.endSpan(spanId, 'success');
```

### Query & Retrieval

#### Get Entry

```typescript
getEntry(entryId: string): ILogEntry | null
```

#### Query Entries

```typescript
queryEntries(query: ILogQuery): ILogEntry[]

// Example
const errors = service.queryEntries({
  levelFilter: ['error', 'fatal'],
  startDate: new Date(Date.now() - 86400000),
  limit: 100
});
```

#### Get Trace

```typescript
getTrace(traceId: string): ITrace | null
```

### Error Management

#### Get Error Groups

```typescript
getErrorGroups(): IErrorGroup[]
getErrorGroup(groupId: string): IErrorGroup | null
```

### Performance Monitoring

#### Log Slow Query

```typescript
logSlowQuery(
  queryName: string,
  duration: number,
  threshold: number,
  query: string,
  parameters?: Record<string, unknown>
): string

// Example
service.logSlowQuery('GetAlerts', 2500, 1000, 'SELECT * FROM alerts LIMIT 1000');
```

### Policies

#### Register Retention Policy

```typescript
registerRetentionPolicy(policy: ILogRetentionPolicy): boolean

// Example
service.registerRetentionPolicy({
  name: 'debug-logs-7day',
  levelFilter: ['trace', 'debug'],
  retentionDays: 7,
  isActive: true
});
```

#### Register Sampling Policy

```typescript
registerSamplingPolicy(policy: ILogSamplingPolicy): boolean

// Example
service.registerSamplingPolicy({
  name: 'debug-sampling',
  sampleRate: 0.1,  // 10% of debug logs
  isActive: true
});
```

### Export & Reporting

#### Export Logs

```typescript
async exportLogs(request: ILogExportRequest): Promise<ILogExportResult>

// Example
const result = await service.exportLogs({
  format: 'csv',
  query: { levelFilter: ['error'] }
});
```

#### Get Statistics

```typescript
getStats(): ILogStats
```

#### Get Health

```typescript
async performHealthCheck(): Promise<ILogHealthCheck>
getApplicationHealth(): IApplicationHealthMetrics
```

### Event Listeners

```typescript
onLog(listener: LogListener): this
onError(listener: ErrorListener): this

// Example
service.onError(async (group) => {
  if (group.occurrenceCount > 10) {
    // Alert on recurring errors
  }
});
```

## Usage Examples

### Basic Logging

```typescript
const service = new LoggingService({
  level: 'debug',
  format: 'json',
  enableTracing: true,
  enableErrorGrouping: true
});

// Set context
service.setContext({
  userId: 'analyst-01',
  correlationId: 'incident-2024-001'
});

// Log operations
service.info('api', 'User logged in', { method: 'OAuth' });
service.info('rule', 'Rule executed', { ruleId: '5001', matched: true });
service.warn('database', 'Slow query', { duration: 2500 });
```

### Distributed Tracing

```typescript
// Start trace
const traceId = service.startTrace('ProcessIncident');

// Span 1: Gather evidence
const gatherSpan = service.startSpan('GatherEvidence');
service.info('event', 'Retrieving events');
service.endSpan(gatherSpan, 'success');

// Span 2: Analyze
const analyzeSpan = service.startSpan('Analyze');
service.info('analysis', 'Analyzing timeline');
service.endSpan(analyzeSpan, 'success');

// End trace
service.endTrace(traceId, 'success');

// Retrieve trace
const trace = service.getTrace(traceId);
console.log(`Trace duration: ${trace?.duration}ms`);
```

### Error Handling & Grouping

```typescript
try {
  // Operation
} catch (error) {
  service.error('system', 'Operation failed', error as Error);
}

// Later: Get error statistics
const groups = service.getErrorGroups();
groups.forEach(group => {
  console.log(`${group.errorType}: ${group.occurrenceCount} occurrences, ${group.affectedUsers} users`);
});
```

### Performance Monitoring

```typescript
// Log slow query
service.logSlowQuery(
  'FetchAlerts',
  3200,           // actual duration (ms)
  1000,           // threshold (ms)
  'SELECT * FROM alerts WHERE severity > ?',
  { severity: 8 }
);

// Get metrics
const metrics = service.getApplicationHealth();
console.log(`Memory: ${metrics.memoryUsage.heapUsed / 1024 / 1024}MB`);
console.log(`Requests: ${metrics.requestCount}`);
```

## Configuration

### Logger Configuration

```typescript
interface ILoggerConfig {
  level: LogLevel;                    // Minimum log level
  format: LogFormat;                  // Output format
  destinations: LogDestination[];     // Where to send logs
  enableStackTrace: boolean;          // Include stack traces
  enableSourceLocation: boolean;      // Capture file/line info
  enablePerformanceMetrics: boolean;  // Track timing
  enableTracing: boolean;             // Distributed tracing
  enableErrorGrouping: boolean;       // Group similar errors
  enableSampling: boolean;            // Sample logs
  samplingRate: number;               // 0-1 sampling rate
  flushInterval: number;              // Batch flush timing (ms)
  retentionDays: number;              // Default retention
}
```

## Log Categories

- auth, api, database, cache, search, event, alert, case, rule, playbook, integration, performance, security, audit, system

## Supported Log Levels

- **TRACE**: Most detailed - variable initialization, function entry/exit
- **DEBUG**: Detailed - variable values, control flow
- **INFO**: General informational - important events, milestones
- **WARN**: Warnings - deprecated usage, recoverable issues
- **ERROR**: Errors - failures, exceptions, problems
- **FATAL**: Fatal - unrecoverable errors, shutdowns

## Performance Characteristics

- **Log Entry Creation**: O(1) with context capture
- **Querying**: O(n) filtering with optional indexing
- **Trace Operations**: O(1) span creation, O(n) full traversal
- **Error Grouping**: O(1) hash lookup for deduplication
- **Export**: O(n) iteration + formatting

## Related Services

- **Audit Service**: Immutable compliance logging
- **Metrics Service**: Numeric metrics collection
- **Event Pipeline**: Event stream processing
- **Notification Service**: Alert delivery
- **Search Service**: Full-text log search

## Best Practices

1. **Set Context Early**: Establish correlation IDs at request start
2. **Use Appropriate Levels**: Avoid over-logging at INFO/DEBUG
3. **Enable Tracing for Critical Paths**: Monitor request flows
4. **Monitor Error Groups**: Track recurring issues
5. **Tune Sampling**: Balance visibility with performance
6. **Export Regularly**: Archive logs for compliance
7. **Alert on Anomalies**: Configure error thresholds
8. **Clean Up Retention**: Enforce policies for storage
9. **Test Health Metrics**: Monitor service health
10. **Use Categories**: Organize logs by domain

## Testing

Comprehensive unit tests include:
- Basic logging at all levels
- Context management and inheritance
- Distributed tracing and span hierarchy
- Error grouping and deduplication
- Entry retrieval and querying
- Slow query logging
- Statistics calculation
- Export in multiple formats
- Health checks
- Event listeners
- Integration workflows

## Graceful Shutdown

```typescript
service.stop();
```

Flushes buffers and stops background intervals.

## License

Enterprise Grade - All Rights Reserved
