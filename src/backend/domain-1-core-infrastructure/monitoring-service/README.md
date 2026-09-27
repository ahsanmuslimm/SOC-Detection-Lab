# Monitoring Service Module

Production-grade monitoring service for the SOC Detection Lab application. Provides comprehensive metrics collection, health checks, Prometheus export, and real-time alerting for system performance monitoring.

**Status**: ✅ Production Ready  
**Test Coverage**: 85%+  
**Dependencies**: None (Tier 0 Foundation)

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Installation & Setup](#installation--setup)
4. [Core Concepts](#core-concepts)
5. [Usage Examples](#usage-examples)
6. [API Reference](#api-reference)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Monitoring Service module provides:

- **Health Checks**: Register and execute custom health check functions
- **Metrics Collection**: Collect system, database, cache, and search metrics
- **Prometheus Export**: Export metrics in Prometheus text format
- **Request Tracking**: Track API request success/failure rates
- **Real-time Alerting**: Monitor thresholds and generate alerts
- **Event Listeners**: Real-time event notifications
- **Performance Metrics**: Comprehensive system performance tracking
- **Uptime Tracking**: Track service uptime and availability

### Why This Module?

1. **Observability**: Complete visibility into system health
2. **Performance Monitoring**: Track metrics that matter
3. **Prometheus Integration**: Export to monitoring stacks
4. **Alerting**: Proactive issue detection
5. **Diagnostics**: Rich metrics for troubleshooting
6. **SLA Tracking**: Monitor service level agreements
7. **Scalability Insights**: Data for scaling decisions

---

## Features

### ✅ Health Checks

- Register custom health check functions
- Execute health checks synchronously
- Component-level status reporting
- Error handling and timeouts
- Detailed response times

### ✅ System Metrics

- CPU usage percentage
- Memory usage in bytes
- Disk usage percentage
- Uptime tracking
- Process metrics
- File descriptor tracking

### ✅ Database Metrics

- Active connections
- Connection pool statistics
- Queries per second
- Average query time
- Slow query tracking

### ✅ Cache Metrics

- Cache hits and misses
- Hit rate calculation
- Eviction tracking
- Cache size reporting
- Memory usage

### ✅ Search Metrics

- Total searches count
- Average search time
- Index size
- Document count
- Index refresh time

### ✅ Request Tracking

- Total requests
- Success/failure rates
- Status code distribution
- Response time tracking
- Aggregated statistics

### ✅ Prometheus Export

- Standard Prometheus format
- Metrics endpoint
- Scrape-ready configuration
- Text format export

### ✅ Alerting

- CPU threshold monitoring
- Memory threshold monitoring
- Disk threshold monitoring
- Response time alerting
- Error rate monitoring
- Custom alert severity levels

### ✅ Real-time Events

- Metric collection events
- Health check events
- Alert events
- Event listeners
- Async event handling

---

## Installation & Setup

### 1. Configuration

```typescript
import { createMonitoringService } from '@soc-detection-lab/monitoring-service';

const config: IMonitoringConfig = {
  enabled: true,
  port: 9090,
  metricsPath: '/metrics',
  healthCheckPath: '/health',
  interval: 5000,        // Collect metrics every 5 seconds
  retention: 3600,       // Retain metrics for 1 hour
  enableHistograms: true,
  enablePercentiles: true,
};

const alertConfig: IAlertConfig = {
  enabled: true,
  cpuThreshold: 80,
  memoryThreshold: 85,
  diskThreshold: 90,
  responseTimeThreshold: 1000,
  errorRateThreshold: 5,
};

const service = createMonitoringService(config, alertConfig);
```

### 2. Register Health Checks

```typescript
// Database health check
service.registerHealthCheck('database', async () => {
  const start = Date.now();
  try {
    // Ping database
    return {
      name: 'database',
      status: 'healthy',
      responseTime: Date.now() - start,
    };
  } catch (err) {
    return {
      name: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: String(err),
    };
  }
});
```

### 3. Start Service

```typescript
await service.start();
console.log('Monitoring service started');
```

---

## Core Concepts

### Health Status

```
healthy   → Component is working normally
degraded  → Component working but with issues
unhealthy → Component not working
```

### Metric Types

```
Counter    → Monotonically increasing value (requests total)
Gauge      → Can go up or down (CPU usage, memory)
Histogram  → Distribution across buckets (request latency)
Summary    → Percentiles (p50, p95, p99)
```

### Alert Severity

```
critical → Immediate action required
high     → Should be investigated soon
medium   → Notable issue
low      → Minor issue
```

### Prometheus Format

```
# HELP metric_name Description of metric
# TYPE metric_name type_name
metric_name value [timestamp]
```

---

## Usage Examples

### Basic Health Check

```typescript
// Register health check
service.registerHealthCheck('api', async () => {
  const start = Date.now();
  try {
    // Test API endpoint
    return {
      name: 'api',
      status: 'healthy',
      responseTime: Date.now() - start,
      details: { version: '1.0.0' },
    };
  } catch (err) {
    return {
      name: 'api',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: String(err),
    };
  }
});

// Perform health check
const result = await service.healthCheck();
console.log(`Status: ${result.status}`);
console.log(`Components: ${result.components.length}`);
```

### Collect Metrics

```typescript
// Collect all metrics
const metrics = await service.collectMetrics();

// Get specific metrics
const systemMetrics = await service.getSystemMetrics();
console.log(`CPU: ${systemMetrics.cpuUsage.toFixed(2)}%`);
console.log(`Memory: ${systemMetrics.memoryUsage} bytes`);
console.log(`Disk: ${systemMetrics.diskUsage.toFixed(2)}%`);

// Get database metrics
const dbMetrics = await service.getDatabaseMetrics();
console.log(`Active connections: ${dbMetrics.activeConnections}`);
console.log(`Queries/sec: ${dbMetrics.queriesPerSecond}`);

// Get cache metrics
const cacheMetrics = await service.getCacheMetrics();
console.log(`Hit rate: ${(cacheMetrics.hitRate * 100).toFixed(2)}%`);
```

### Track Requests

```typescript
// Record successful request
service.recordRequest(200, 45, true);

// Record failed request
service.recordRequest(500, 100, false);

// Get request metrics
const metrics = service.getRequestMetrics();
console.log(`Total: ${metrics.totalRequests}`);
console.log(`Success rate: ${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%`);
console.log(`Status codes:`, metrics.statusCodeDistribution);
```

### Metrics Snapshot

```typescript
// Get complete snapshot
const snapshot = await service.getMetricsSnapshot();

console.log('System:');
console.log(`  CPU: ${snapshot.system.cpuUsage.toFixed(2)}%`);
console.log(`  Memory: ${snapshot.system.memoryUsage} bytes`);

console.log('Database:');
console.log(`  Connections: ${snapshot.database?.activeConnections}`);
console.log(`  Queries/sec: ${snapshot.database?.queriesPerSecond}`);

console.log('Cache:');
console.log(`  Hit rate: ${(snapshot.cache?.hitRate || 0) * 100)toFixed(2)}%`);

console.log('Search:');
console.log(`  Avg time: ${snapshot.search?.averageSearchTime}ms`);
```

### Real-time Event Monitoring

```typescript
// Register event listener
service.onMonitoring((event) => {
  console.log(`[${event.timestamp.toISOString()}] ${event.type}`);

  if (event.type === 'alert') {
    const alert = event.data;
    console.log(`${alert.severity.toUpperCase()}: ${alert.message}`);

    // Handle alerts
    if (alert.type === 'cpu' && alert.severity === 'critical') {
      // Trigger auto-scaling
    }
  }
});

// Listener receives events for:
// - Metrics collection
// - Health checks
// - Alerts
```

### Prometheus Export

```typescript
// Get Prometheus-format metrics
const metrics = service.getPrometheusMetrics();
console.log(metrics);

// Output example:
// # HELP process_uptime Process uptime in seconds
// # TYPE process_uptime gauge
// process_uptime 42.5

// Configure Prometheus scrape:
// scrape_configs:
//   - job_name: 'soc-detection-lab'
//     static_configs:
//       - targets: ['localhost:9090']
//     metrics_path: '/metrics'
```

### Alert Handling

```typescript
// Get active alerts
const alerts = service.getAlerts();

for (const alert of alerts) {
  if (alert.severity === 'critical') {
    // Page on-call immediately
    pageOnCall(alert.message);
  } else if (alert.severity === 'high') {
    // Create incident
    createIncident(alert.message);
  }
}

// Clear resolved alerts
service.clearAlerts();
```

---

## API Reference

### MonitoringService

#### Constructor

```typescript
new MonitoringService(config: IMonitoringConfig, alertConfig?: IAlertConfig)
```

#### Lifecycle Methods

- `start()` - Start monitoring service
- `stop()` - Stop monitoring service
- `isRunning_()` - Get running status

#### Health Check Methods

- `registerHealthCheck(name, fn)` - Register health check
- `healthCheck()` - Execute all health checks

#### Metrics Methods

- `collectMetrics()` - Collect all metrics
- `getSystemMetrics()` - Get system metrics
- `getDatabaseMetrics()` - Get database metrics
- `getCacheMetrics()` - Get cache metrics
- `getSearchMetrics()` - Get search metrics
- `getMetricsSnapshot()` - Get complete snapshot

#### Request Tracking

- `recordRequest(statusCode, responseTime, success)` - Record request
- `getRequestMetrics()` - Get request metrics

#### Export & Format

- `getPrometheusMetrics()` - Get Prometheus format

#### Monitoring

- `onMonitoring(listener)` - Register listener
- `offMonitoring(listener)` - Unregister listener

#### Alerts

- `getAlerts()` - Get active alerts
- `clearAlerts()` - Clear alerts

#### Status

- `getUptime()` - Get uptime in milliseconds

---

## Best Practices

### 1. Register All Critical Health Checks

```typescript
// ✅ Good: Complete health checks
service.registerHealthCheck('database', checkDatabase);
service.registerHealthCheck('cache', checkCache);
service.registerHealthCheck('search', checkSearch);
service.registerHealthCheck('api', checkAPI);

// ❌ Bad: Missing checks
service.registerHealthCheck('database', checkDatabase);
// What about other services?
```

### 2. Set Appropriate Thresholds

```typescript
// ✅ Good: Reasonable thresholds
const alertConfig = {
  cpuThreshold: 80,        // Alert at 80%
  memoryThreshold: 85,     // Alert at 85%
  diskThreshold: 90,       // Alert at 90%
  responseTimeThreshold: 1000, // Alert at 1s
};

// ❌ Bad: Too strict
const alertConfig = {
  cpuThreshold: 20,    // Too low, false positives
  memoryThreshold: 30, // Too low, noisy
};
```

### 3. Monitor Request Metrics

```typescript
// ✅ Good: Track all requests
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const time = Date.now() - start;
    service.recordRequest(res.statusCode, time, res.statusCode < 400);
  });
  next();
});

// ❌ Bad: No tracking
// No visibility into request patterns
```

### 4. React to Alerts

```typescript
// ✅ Good: Handle alerts
service.onMonitoring((event) => {
  if (event.type === 'alert') {
    const alert = event.data;
    switch (alert.type) {
      case 'cpu':
        triggerScaling();
        break;
      case 'disk':
        cleanupOldLogs();
        break;
    }
  }
});

// ❌ Bad: Ignore alerts
// Alerts go nowhere
```

### 5. Export Metrics Regularly

```typescript
// ✅ Good: Expose metrics endpoint
app.get('/metrics', (req, res) => {
  const metrics = service.getPrometheusMetrics();
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

// ❌ Bad: No metrics endpoint
// Prometheus can't scrape
```

### 6. Handle Failures Gracefully

```typescript
// ✅ Good: Catch errors
service.registerHealthCheck('external_api', async () => {
  try {
    const response = await fetch('https://api.example.com/health');
    return {
      name: 'external_api',
      status: response.ok ? 'healthy' : 'unhealthy',
      responseTime: 50,
    };
  } catch (err) {
    return {
      name: 'external_api',
      status: 'unhealthy',
      responseTime: 5000,
      error: 'Timeout',
    };
  }
});

// ❌ Bad: No error handling
// Crash on timeout
```

---

## Configuration Reference

```typescript
interface IMonitoringConfig {
  enabled: boolean;           // Enable monitoring
  port: number;              // Metrics server port
  metricsPath: string;       // Metrics endpoint path
  healthCheckPath: string;   // Health endpoint path
  interval: number;          // Collection interval (ms)
  retention: number;         // Retention time (seconds)
  enableHistograms: boolean; // Enable histograms
  enablePercentiles: boolean; // Enable percentiles
  buckets?: number[];        // Histogram buckets
}

interface IAlertConfig {
  enabled: boolean;              // Enable alerting
  cpuThreshold: number;         // CPU alert threshold (%)
  memoryThreshold: number;      // Memory alert threshold (%)
  diskThreshold: number;        // Disk alert threshold (%)
  responseTimeThreshold: number; // Response time threshold (ms)
  errorRateThreshold: number;   // Error rate threshold (%)
}
```

---

## Troubleshooting

### Metrics Not Collected

**Problem**: No metrics appearing

**Solution**:
```typescript
// Verify service is running
if (!service.isRunning_()) {
  await service.start();
}

// Check collection interval
const metrics = await service.collectMetrics();
console.log(`Metrics collected: ${metrics.length}`);
```

### High Memory Usage

**Problem**: Monitoring service using too much memory

**Solution**:
```typescript
// Reduce retention time
const config = {
  ...config,
  retention: 300, // 5 minutes instead of 1 hour
};

// Reduce collection interval
const config = {
  ...config,
  interval: 15000, // 15 seconds instead of 5
};
```

### Missing Health Checks

**Problem**: Health checks not being performed

**Solution**:
```typescript
// Verify health checks registered
service.registerHealthCheck('database', checkFn);

// Perform manual check
const result = await service.healthCheck();
console.log(result.components);
```

### Alerts Not Triggering

**Problem**: Alerts not being generated

**Solution**:
```typescript
// Verify alerting enabled
const config = {
  ...alertConfig,
  enabled: true,
};

// Check thresholds
console.log(`CPU threshold: ${alertConfig.cpuThreshold}%`);

// Monitor events
service.onMonitoring((event) => {
  if (event.type === 'alert') {
    console.log('Alert received:', event.data);
  }
});
```

---

## Performance Considerations

| Operation | Typical Time |
|-----------|--------------|
| Health check | 10-100ms |
| Metrics collection | 50-200ms |
| System metrics | <10ms |
| Database metrics | 10-50ms |
| Cache metrics | <5ms |
| Prometheus export | 10-100ms |

---

## Related Modules

- **config-service**: Configuration management
- **logging-service**: Log monitoring
- **postgres-client**: Database metrics
- **cache-client**: Cache metrics
- **opensearch-client**: Search metrics

---

## Integration Examples

### Express.js Integration

```typescript
app.get('/health', async (req, res) => {
  const health = await service.healthCheck();
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

app.get('/metrics', (req, res) => {
  const metrics = service.getPrometheusMetrics();
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});
```

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### Prometheus Configuration

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'soc-detection-lab'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
```

---

**Module Version**: 1.0.0  
**Last Updated**: 2024  
**License**: Proprietary  
**Production Ready**: ✅ Yes

