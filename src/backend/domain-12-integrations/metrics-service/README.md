# Metrics Service

Comprehensive metrics collection, aggregation, and monitoring system for real-time performance tracking and alerting.

## Overview

The Metrics Service provides a robust foundation for collecting, storing, aggregating, and monitoring system and application metrics. It supports multiple metric types (counter, gauge, histogram, timer, summary), advanced alerting with rule-based triggering, real-time aggregation, dashboard management, and comprehensive health monitoring.

**Key Features:**
- Multi-type metrics collection (counter, gauge, histogram, timer, summary)
- Real-time and period-based aggregation
- Alert rules with threshold conditions and automatic triggering
- Metric querying with filtering and tagging
- Dashboard management and configuration
- Service metrics collection and tracking
- Retention policies for data lifecycle management
- Event-driven architecture with metric and alert listeners
- Comprehensive health checks and monitoring
- Performance metrics and statistics tracking
- OpenTelemetry-compatible design
- Distributed tracing support

## Architecture

### Core Components

1. **Metric Recorder**: Handles collection and storage of raw metric values
2. **Aggregator**: Computes statistics and percentiles over time periods
3. **Alert Engine**: Evaluates alert rules and triggers notifications
4. **Query Engine**: Filters and retrieves metrics with tag matching
5. **Event Emitter**: Publishes metric and alert events to listeners
6. **Health Monitor**: Tracks service health and resource usage
7. **Retention Manager**: Enforces data retention policies
8. **Export Manager**: Exports metrics to external systems

### Data Flow

```
Metric Recording
    ↓
Storage (In-Memory)
    ↓
Event Emission
    ↓
Listener Notification
    ↓
Aggregation (Periodic)
    ↓
Alert Checking (Periodic)
    ↓
Alert Triggering
    ↓
Cleanup/Retention (Periodic)
```

## API Reference

### Creating the Service

```typescript
import { createMetricsService, IMetricsServiceConfig } from '@metrics-service';

const config: IMetricsServiceConfig = {
  enableMetrics: true,
  enableAlerts: true,
  enableExport: true,
  exportInterval: 60000,
  retentionDays: 30,
  maxMetricsPerQuery: 1000,
  enableCompression: true,
  enableEncryption: false,
  exporters: [
    {
      type: 'prometheus',
      enabled: true,
      interval: 30000,
      url: 'http://prometheus:9090',
    },
  ],
};

const service = createMetricsService(config);
```

### Recording Metrics

#### Counter Metrics

```typescript
// Increment counter by 1
const metricId = service.incrementCounter('requests_total', 1);

// Increment by custom value with tags
service.incrementCounter('api_calls', 5, {
  endpoint: '/api/users',
  method: 'GET',
});
```

#### Gauge Metrics

```typescript
// Set gauge value
const metricId = service.setGauge('memory_usage', 75.5);

// Set with tags
service.setGauge('queue_depth', 150, {
  queue_name: 'email_queue',
  priority: 'high',
});
```

#### Histogram Metrics

```typescript
// Record histogram value (e.g., response size)
const metricId = service.recordHistogram('response_size', 512);

// Record with tags
service.recordHistogram('latency_ms', 250, {
  endpoint: '/api/data',
  method: 'POST',
});
```

#### Timer Metrics

```typescript
// Start timer and get stop function
const timer = service.startTimer('operation_duration');

// ... perform operation ...

// Stop timer and record duration
timer();
```

### Alert Management

#### Creating Alert Rules

```typescript
const ruleId = service.createAlertRule({
  name: 'High CPU Alert',
  description: 'Alert when CPU exceeds 80%',
  metricName: 'cpu_usage',
  condition: 'gt', // gt, lt, eq, gte, lte
  threshold: 80,
  duration: 300000, // milliseconds
  enabled: true,
});
```

#### Retrieving Alert Rules

```typescript
const rule = service.getAlertRule(ruleId);

if (rule) {
  console.log(`Rule: ${rule.name}`);
  console.log(`Condition: ${rule.condition} ${rule.threshold}`);
}
```

### Querying Metrics

#### Basic Query

```typescript
// Query all metrics
const allMetrics = service.queryMetrics({});
```

#### Query with Filters

```typescript
const metrics = service.queryMetrics({
  metricName: 'api_requests',
  startTime: new Date(Date.now() - 3600000), // Last hour
  endTime: new Date(),
  tags: { endpoint: '/api/users' },
  limit: 100,
});
```

### Aggregation

```typescript
// Get aggregation for a metric
const agg = service.getAggregation('response_time', '1h'); // 1m, 5m, 15m, 1h, 24h, all

if (agg && agg.statistics) {
  console.log(`Mean: ${agg.statistics.mean}ms`);
  console.log(`P50: ${agg.statistics.percentile50}ms`);
  console.log(`P99: ${agg.statistics.percentile99}ms`);
}
```

### Statistics

```typescript
const stats = service.getStats();

console.log(`Total metrics: ${stats.totalMetrics}`);
console.log(`Metrics by type:`, stats.metricsByType);
console.log(`Last hour: ${stats.metricsLastHour}`);
console.log(`Alert rules: ${stats.totalAlertRules}`);
console.log(`Active alerts: ${stats.activeAlerts}`);
```

### Dashboard Management

```typescript
// Create dashboard
const dashboardId = service.createDashboard({
  name: 'System Health',
  description: 'Core system metrics',
  metrics: ['cpu_usage', 'memory_usage', 'disk_usage'],
  refreshInterval: 5000,
});

// Retrieve dashboard
const dashboard = service.getDashboard(dashboardId);
```

### Retention Policies

```typescript
service.registerRetentionPolicy({
  name: 'short_term',
  description: 'Keep metrics for 7 days',
  retentionDays: 7,
  aggregationInterval: 3600000,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

### Health Checks

```typescript
const health = await service.performHealthCheck();

console.log(`Status: ${health.status}`); // healthy, degraded, unhealthy
console.log(`Storage: ${health.storageHealth}`);
console.log(`Processing: ${health.processingHealth}`);

health.checks.forEach((check) => {
  console.log(`${check.name}: ${check.status}`);
});
```

### Event Listeners

#### Metric Listener

```typescript
service.onMetric(async (metric: IMetricValue) => {
  console.log(`Metric recorded: ${metric.value}`);
});
```

#### Alert Listener

```typescript
service.onAlert(async (alert: IAlertEvent) => {
  console.log(`Alert triggered: ${alert.message}`);
  console.log(`Severity: ${alert.severity}`);
  console.log(`Value: ${alert.metricValue}`);
});
```

#### Chaining Listeners

```typescript
service
  .onMetric(metricListener)
  .onAlert(alertListener);
```

## Configuration Options

### IMetricsServiceConfig

```typescript
interface IMetricsServiceConfig {
  enableMetrics: boolean;           // Enable metric collection
  enableAlerts: boolean;            // Enable alert system
  enableExport: boolean;            // Enable metric export
  exportInterval: number;           // Export interval in ms
  retentionDays: number;            // Data retention period
  maxMetricsPerQuery: number;       // Max results per query
  enableCompression: boolean;       // Enable data compression
  enableEncryption: boolean;        // Enable encryption
  exporters: IExporterConfig[];     // Export destinations
}
```

### IExporterConfig

```typescript
interface IExporterConfig {
  type: 'prometheus' | 'graphite' | 'influxdb' | 'custom';
  enabled: boolean;
  interval: number;
  url?: string;
  credentials?: {
    username?: string;
    password?: string;
  };
}
```

## Type Definitions

### Metric Types

- **counter**: Monotonically increasing value (requests, errors)
- **gauge**: Value that can go up or down (memory, connections)
- **histogram**: Distribution of values (latencies, sizes)
- **timer**: Duration of operations (execution time)
- **summary**: Statistical summary (percentiles, mean)

### Alert Conditions

- **gt**: Greater than threshold
- **lt**: Less than threshold
- **eq**: Equal to threshold
- **gte**: Greater than or equal to threshold
- **lte**: Less than or equal to threshold

### Aggregation Periods

- **1m**: 1 minute
- **5m**: 5 minutes
- **15m**: 15 minutes
- **1h**: 1 hour
- **24h**: 24 hours
- **all**: All available data

### Alert Severity

- **low**: Minor issue
- **medium**: Moderate issue
- **high**: Significant issue
- **critical**: Critical issue

## Usage Examples

### Example 1: Basic API Metrics

```typescript
const service = createMetricsService(config);

// Track requests
service.incrementCounter('http_requests', 1, {
  method: req.method,
  endpoint: req.path,
  status: res.statusCode,
});

// Track latency
const timer = service.startTimer('http_request_duration');
// ... handle request ...
timer();
```

### Example 2: Alert on High Latency

```typescript
service.createAlertRule({
  name: 'High Latency',
  metricName: 'response_time',
  condition: 'gt',
  threshold: 1000, // 1 second
  duration: 300000, // Alert if exceeds for 5 minutes
  enabled: true,
});

service.onAlert(async (alert) => {
  await sendSlackNotification(`${alert.message} - Severity: ${alert.severity}`);
});
```

### Example 3: Performance Dashboard

```typescript
const dashboardId = service.createDashboard({
  name: 'API Performance',
  metrics: [
    'http_requests',
    'http_errors',
    'response_time',
    'p99_response_time',
    'throughput',
  ],
  refreshInterval: 10000,
});
```

### Example 4: Resource Monitoring

```typescript
// Collect resource metrics periodically
setInterval(() => {
  const usage = os.cpus().length;
  service.setGauge('cpu_count', usage);

  const memory = process.memoryUsage();
  service.setGauge('process_memory_mb', Math.round(memory.heapUsed / 1024 / 1024));
}, 5000);
```

## Performance Characteristics

### Metric Recording
- **Counter/Gauge**: O(1) time complexity
- **Histogram**: O(1) amortized
- **Timer**: O(1) time and space

### Querying
- **Query complexity**: O(n) where n = matching metrics
- **Aggregation**: O(n log n) due to sorting for percentiles
- **Storage**: In-memory, grows with metric count

### Alerting
- **Rule evaluation**: O(rules * relevant_metrics)
- **Alert triggers**: Event-driven with configurable check intervals

### Limits & Scaling

| Aspect | Default | Notes |
|--------|---------|-------|
| Max metrics per query | 1000 | Configurable |
| Max dashboard metrics | Unlimited | Limited by memory |
| Max retention | 30 days | Configurable |
| Alert rules | Unlimited | Limited by memory |
| Aggregation periods | 6 (1m-24h) | Fixed set |

## Best Practices

1. **Use Appropriate Metric Types**: Choose counter for cumulative, gauge for point-in-time values
2. **Tag Consistently**: Use consistent tag naming and values for easy filtering
3. **Set Reasonable Alert Thresholds**: Avoid alert fatigue with appropriate thresholds
4. **Monitor Retention**: Configure retention policies based on storage capacity
5. **Use Aggregation**: Query aggregations for better performance with large datasets
6. **Implement Listeners**: Use event listeners for real-time alert handling
7. **Health Monitoring**: Regularly check service health with performHealthCheck()
8. **Export Metrics**: Enable export to external systems for long-term retention

## Lifecycle Management

```typescript
// Create service
const service = createMetricsService(config);

// Use service for metrics collection and monitoring
// ... application running ...

// Graceful shutdown
service.stop();
```

## Error Handling

The service automatically handles:
- Invalid metric values (NaN, Infinity)
- Out-of-range thresholds
- Non-existent rule/dashboard lookups (returns null)
- Memory pressure and cleanup
- Export failures (graceful degradation)

## Testing

Run unit tests:

```bash
npm run test -- metrics-service.test.ts
```

Run demo scenarios:

```bash
npm run demo -- metrics-service/demo.ts
```

## Dependencies

- **Built-in**: No external dependencies for core functionality
- **Optional**: Prometheus client, InfluxDB client for advanced exporters

## See Also

- [Logging Service](../logging-service/README.md) - Structured logging
- [Audit Service](../audit-service/README.md) - Audit trail tracking
- [Event Pipeline Service](../event-pipeline/README.md) - Event processing
- [API Gateway](../api-gateway/README.md) - Request routing and metrics

## Version

1.0.0

## License

See repository LICENSE file
