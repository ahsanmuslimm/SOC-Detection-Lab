# Analytics Service

Real-time analytics engine with event tracking, metrics, dashboards, reporting, and anomaly detection.

## Overview

The Analytics Service provides comprehensive real-time analytics capabilities for enterprise applications. It supports event tracking, metrics collection, custom queries, dashboard creation, report generation, alert management, user journey tracking, real-time metrics, and anomaly detection.

**Key Features:**
- Real-time event tracking with flexible categorization
- Event aggregation and analysis
- Metric definition and recording
- Multiple metric types (gauge, counter, histogram, summary)
- Custom analytics queries with filtering
- Dashboard creation and management
- Report generation with scheduling
- Alert management with multiple conditions
- User journey tracking and visualization
- Real-time metrics and trending
- Anomaly detection
- Event-driven architecture
- Comprehensive statistics and monitoring
- Health checks and diagnostics

## Architecture

### Core Components

1. **Event Tracker**: Captures and stores analytics events
2. **Metric Engine**: Manages metric definitions and recordings
3. **Query Engine**: Executes custom analytics queries
4. **Dashboard Manager**: Creates and manages dashboards
5. **Report Generator**: Generates scheduled reports
6. **Alert Manager**: Manages analytics alerts
7. **Journey Tracker**: Tracks user journeys
8. **Anomaly Detector**: Detects anomalies in data
9. **Statistics Collector**: Aggregates metrics
10. **Event Emitter**: Publishes analytics events

### Data Flow

```
Event Tracking
    ↓
Event Storage
    ↓
Real-Time Processing
    ↓
Aggregation & Analysis
    ↓
Query Execution
    ↓
Dashboard Display
    ↓
Report Generation
    ↓
Alert Triggering
```

## API Reference

### Creating the Service

```typescript
import { createAnalyticsService, IAnalyticsServiceConfig } from '@analytics-service';

const config: IAnalyticsServiceConfig = {
  maxEvents: 10000,
  maxQueries: 1000,
  maxDashboards: 500,
  eventRetentionDays: 30,
  metricRetentionDays: 90,
  enableRealTime: true,
  enableAnomalyDetection: true,
  enableForecasting: false,
  enableAudit: true,
  maxAuditEntries: 10000,
  enableMetrics: true,
  cleanupIntervalMs: 60000,
  batchSize: 100,
  queryTimeoutMs: 30000,
};

const service = createAnalyticsService(config);
```

### Event Tracking

#### Track Event

```typescript
const eventId = service.trackEvent({
  timestamp: new Date(),
  source: 'web',
  category: 'user',
  action: 'login',
  data: { userId: 'user123', provider: 'google' },
  userId: 'user123',
  sessionId: 'session_abc',
});
```

#### Get Event

```typescript
const event = service.getEvent(eventId);
```

#### List Events

```typescript
const allEvents = service.listEvents();
const userEvents = service.listEvents('user');
const limitedEvents = service.listEvents(undefined, 100);
```

#### Aggregate Events

```typescript
const aggregation = service.aggregateEvents(startTime, endTime, 'user');
console.log(`Total: ${aggregation.totalEvents}`);
console.log(`Users: ${aggregation.uniqueUsers}`);
console.log(`Sessions: ${aggregation.uniqueSessions}`);
```

### Metrics

#### Define Metric

```typescript
const metricId = service.defineMetric({
  name: 'API Response Time',
  category: 'performance',
  type: 'histogram',
  unit: 'ms',
  aggregationType: 'avg',
  retentionDays: 90,
  enabled: true,
});
```

#### Record Metric

```typescript
const pointId = service.recordMetric(metricId, 150.5);
```

#### Get Real-Time Metrics

```typescript
const metrics = service.getRealTimeMetrics();
metrics.forEach(m => {
  console.log(`${m.name}: ${m.currentValue} (${m.trend})`);
});
```

### Queries

#### Create Query

```typescript
const queryId = service.createQuery({
  name: 'User Events Last 24h',
  type: 'events',
  filters: [
    { field: 'category', operator: 'eq', value: 'user' },
    { field: 'timestamp', operator: 'gte', value: oneDayAgo },
  ],
  groupBy: ['action'],
  orderBy: [{ field: 'count', order: 'desc' }],
  timeRange: {
    startTime: oneDayAgo,
    endTime: new Date(),
    granularity: 'hour',
  },
});
```

#### Execute Query

```typescript
const result = service.executeQuery(queryId);
console.log(`Rows: ${result.rowCount}`);
console.log(`Execution time: ${result.executionTime}ms`);
```

### Dashboards

#### Create Dashboard

```typescript
const dashboardId = service.createDashboard({
  name: 'Performance Dashboard',
  widgets: [],
  isPublic: true,
});
```

#### Add Widget

```typescript
const widgetId = service.addWidget(dashboardId, {
  type: 'line',
  queryId,
  title: 'Events Over Time',
  position: { x: 0, y: 0 },
  size: { width: 500, height: 300 },
});
```

#### Get Dashboard

```typescript
const dashboard = service.getDashboard(dashboardId);
```

#### List Dashboards

```typescript
const dashboards = service.listDashboards();
```

### Reports

#### Create Report

```typescript
const reportId = service.createReport({
  name: 'Weekly Report',
  type: 'executive',
  sections: [
    {
      sectionId: '1',
      title: 'Summary',
      type: 'summary',
      content: 'Weekly summary',
      order: 1,
    },
  ],
  schedule: {
    frequency: 'weekly',
    time: '09:00',
    timezone: 'UTC',
    enabled: true,
  },
  recipients: ['admin@example.com'],
});
```

#### Get Report

```typescript
const report = service.getReport(reportId);
```

#### List Reports

```typescript
const reports = service.listReports();
```

### Alerts

#### Create Alert

```typescript
const alertId = service.createAlert({
  name: 'High CPU',
  metric: 'cpu_usage',
  condition: 'exceeds',
  threshold: 80,
  enabled: true,
  recipients: ['ops@example.com'],
});
```

#### Get Alert

```typescript
const alert = service.getAlert(alertId);
```

#### List Alerts

```typescript
const alerts = service.listAlerts();
```

### User Journeys

#### Track Journey

```typescript
const journeyId = service.trackJourney({
  userId: 'user123',
  steps: [
    {
      stepId: '1',
      timestamp: new Date(),
      action: 'visit_home',
      category: 'page',
      data: { page: '/home' },
    },
    {
      stepId: '2',
      timestamp: new Date(),
      action: 'click_product',
      category: 'interaction',
      data: { productId: 'prod_456' },
    },
  ],
  startTime: new Date(),
  endTime: new Date(),
  duration: 600000,
  conversionFlag: true,
});
```

#### Get Journey

```typescript
const journey = service.getJourney(journeyId);
```

### Anomaly Detection

#### Detect Anomalies

```typescript
const anomalies = service.detectAnomalies();
anomalies.forEach(a => {
  console.log(`${a.metric}: ${a.severity}`);
  console.log(`  Expected: ${a.expectedValue}`);
  console.log(`  Actual: ${a.actualValue}`);
});
```

### Health Check

```typescript
const health = await service.performHealthCheck();
console.log(`Status: ${health.status}`);
console.log(`Events: ${health.eventCount}`);
console.log(`Processing Latency: ${health.processingLatency}ms`);
```

### Statistics

```typescript
const stats = service.getStatistics();
console.log(`Total events: ${stats.totalEvents}`);
console.log(`Total queries: ${stats.totalQueries}`);
console.log(`Dashboards: ${stats.dashboardsCreated}`);
```

### Event Listeners

```typescript
service.onAnalyticsEvent(async (log) => {
  if (log.type === 'event-tracked') {
    console.log(`Event tracked: ${log.details?.eventId}`);
  }
  if (log.type === 'query-executed') {
    console.log(`Query executed in ${log.details?.executionTime}ms`);
  }
  if (log.type === 'anomaly-detected') {
    console.log(`Anomaly detected: ${log.details?.metricId}`);
  }
});
```

## Configuration

### Metric Types

| Type | Description |
|------|-------------|
| **gauge** | Instantaneous value |
| **counter** | Monotonically increasing |
| **histogram** | Distribution of values |
| **summary** | Quantile statistics |

### Query Types

| Type | Description |
|------|-------------|
| **events** | Query events |
| **metrics** | Query metrics |
| **timeseries** | Time-based data |
| **comparison** | Period comparison |
| **trend** | Trend analysis |

### Widget Types

| Type | Description |
|------|-------------|
| **line** | Line chart |
| **bar** | Bar chart |
| **pie** | Pie chart |
| **table** | Data table |
| **gauge** | Gauge chart |
| **heatmap** | Heatmap |
| **scatter** | Scatter plot |
| **card** | Metric card |

### Alert Conditions

| Condition | Description |
|-----------|-------------|
| **exceeds** | Value exceeds threshold |
| **below** | Value below threshold |
| **change** | Large change detected |
| **anomaly** | Anomalous behavior |

## Usage Examples

### Example 1: Event Tracking

```typescript
// Track user actions
service.trackEvent({
  timestamp: new Date(),
  source: 'web',
  category: 'user',
  action: 'signup',
  data: { plan: 'premium' },
  userId: 'new_user_1',
  sessionId: 'session_xyz',
});

// Track system events
service.trackEvent({
  timestamp: new Date(),
  source: 'api',
  category: 'system',
  action: 'deploy',
  data: { version: '2.1.0' },
});
```

### Example 2: Metrics Collection

```typescript
// Define performance metrics
const responseTimeId = service.defineMetric({
  name: 'API Response Time',
  category: 'performance',
  type: 'histogram',
  unit: 'ms',
  aggregationType: 'avg',
  retentionDays: 90,
  enabled: true,
});

// Record measurements
service.recordMetric(responseTimeId, 145);
service.recordMetric(responseTimeId, 152);
service.recordMetric(responseTimeId, 138);
```

### Example 3: Dashboard Analytics

```typescript
// Create performance dashboard
const dashboardId = service.createDashboard({
  name: 'System Performance',
  widgets: [],
  isPublic: false,
});

// Create query for metrics
const queryId = service.createQuery({
  name: 'Performance Metrics',
  type: 'metrics',
  filters: [],
  timeRange: {
    startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endTime: new Date(),
  },
});

// Add visualization widget
service.addWidget(dashboardId, {
  type: 'line',
  queryId,
  title: 'Response Time Trend',
  position: { x: 0, y: 0 },
  size: { width: 600, height: 400 },
});
```

### Example 4: User Journey Analysis

```typescript
// Track complete user journey
const journeyId = service.trackJourney({
  userId: 'user_456',
  steps: [
    { stepId: '1', timestamp: t0, action: 'view_product', category: 'page', data: {} },
    { stepId: '2', timestamp: t1, action: 'add_to_cart', category: 'interaction', data: {} },
    { stepId: '3', timestamp: t2, action: 'checkout', category: 'conversion', data: {} },
  ],
  startTime: t0,
  endTime: t2,
  duration: t2.getTime() - t0.getTime(),
  conversionFlag: true,
});
```

## Performance Considerations

### Event Retention

- Default: 30 days
- Older events automatically cleaned up
- Adjust based on storage capacity

### Metric Retention

- Default: 90 days
- By-metric configuration available
- Balance between historical data and storage

### Query Performance

- Use time ranges to limit scope
- Add filters for faster queries
- Pagination for large result sets

## Best Practices

1. **Event Categorization**: Use consistent category naming
2. **Metric Naming**: Use descriptive, unique metric names
3. **Query Optimization**: Always specify time ranges
4. **Dashboard Design**: Limit widgets per dashboard
5. **Alert Tuning**: Set thresholds based on baseline
6. **Journey Tracking**: Include conversion events
7. **Retention Policy**: Balance data vs. storage
8. **Monitoring**: Track system health regularly
9. **Cleanup**: Archive old analytics data
10. **Documentation**: Document custom metrics

## Error Handling

Service handles:
- Event queue overflow (removes oldest)
- Query timeout (returns partial results)
- Storage limits (cleans up automatically)
- Invalid filters (returns empty result)

## Lifecycle Management

```typescript
const service = createAnalyticsService(config);

// Track events
service.trackEvent({...});

// Create dashboards
service.createDashboard({...});

// Graceful shutdown
service.stop();
```

## Testing

Run unit tests:

```bash
npm run test -- analytics-service.test.ts
```

Run demo scenarios:

```bash
npm run demo -- analytics-service/demo.ts
```

## Dependencies

- **Built-in**: Node.js for async operations
- **Optional**: Time-series database for historical storage

## See Also

- [Metrics Service](../metrics-service/README.md) - Metrics collection
- [Dashboard Framework](../dashboard-framework/README.md) - Dashboard rendering
- [Alert Service](../alert-service/README.md) - Alert delivery
- [Reporting Service](../reporting-service/README.md) - Report generation

## Version

1.0.0

## License

See repository LICENSE file
