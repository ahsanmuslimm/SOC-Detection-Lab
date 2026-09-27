/**
 * Monitoring Service - Demo/Prototype
 * Demonstrates metrics collection, health checks, and performance monitoring
 */

import { createMonitoringService } from '../src/main';
import type { IMonitoringConfig, IAlertConfig } from '../src/types';

console.log('=== Monitoring Service - Demonstration ===\n');

// ============================================================
// 1. Configuration
// ============================================================
console.log('1. Monitoring Configuration');
console.log('---------------------------');

const config: IMonitoringConfig = {
  enabled: true,
  port: 9090,
  metricsPath: '/metrics',
  healthCheckPath: '/health',
  interval: 5000,
  retention: 3600,
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

console.log('Monitoring Configuration:');
console.log(`  Port: ${config.port}`);
console.log(`  Metrics endpoint: http://localhost:${config.port}${config.metricsPath}`);
console.log(`  Health endpoint: http://localhost:${config.port}${config.healthCheckPath}`);
console.log(`  Interval: ${config.interval}ms`);
console.log(`  Retention: ${config.retention}s`);
console.log();

// ============================================================
// 2. Service Creation
// ============================================================
console.log('2. Service Creation');
console.log('-------------------');

const service = createMonitoringService(config, alertConfig);
console.log('✓ Monitoring service created');
console.log();

// ============================================================
// 3. Health Checks
// ============================================================
console.log('3. Health Check Registration');
console.log('----------------------------');

const registerHealth = `
// Register database health check
service.registerHealthCheck('database', async () => {
  const startTime = Date.now();
  try {
    // Simulate database ping
    await new Promise(resolve => setTimeout(resolve, 10));
    return {
      name: 'database',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      details: { version: '14.0', pool_size: 20 },
    };
  } catch (err) {
    return {
      name: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: 'Connection timeout',
    };
  }
});

// Register cache health check
service.registerHealthCheck('cache', async () => {
  const startTime = Date.now();
  try {
    await new Promise(resolve => setTimeout(resolve, 5));
    return {
      name: 'cache',
      status: 'healthy',
      responseTime: Date.now() - startTime,
    };
  } catch (err) {
    return {
      name: 'cache',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: 'Redis connection failed',
    };
  }
});

// Register search engine health check
service.registerHealthCheck('search', async () => {
  const startTime = Date.now();
  try {
    await new Promise(resolve => setTimeout(resolve, 15));
    return {
      name: 'search',
      status: 'healthy',
      responseTime: Date.now() - startTime,
    };
  } catch (err) {
    return {
      name: 'search',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: 'OpenSearch cluster unreachable',
    };
  }
});
`;

console.log(registerHealth);
console.log();

// ============================================================
// 4. Starting the Service
// ============================================================
console.log('4. Starting Monitoring Service');
console.log('------------------------------');

console.log(`
// Start service
await service.start();
console.log('✓ Monitoring service started');

// Perform initial health check
const health = await service.healthCheck();
console.log(\`Health Status: \${health.status}\`);
console.log(\`Components checked: \${health.components.length}\`);
console.log(\`Uptime: \${health.uptime}ms\`);
`);
console.log();

// ============================================================
// 5. Metrics Collection
// ============================================================
console.log('5. Metrics Collection');
console.log('---------------------');

const metrics = `
// Collect all metrics
const metrics = await service.collectMetrics();
console.log(\`Collected \${metrics.length} metrics\`);

// Get specific system metrics
const systemMetrics = await service.getSystemMetrics();
console.log('System Metrics:');
console.log(\`  CPU: \${systemMetrics.cpuUsage.toFixed(2)}%\`);
console.log(\`  Memory: \${(systemMetrics.memoryUsage / 1024 / 1024 / 1024).toFixed(2)}GB\`);
console.log(\`  Disk: \${systemMetrics.diskUsage.toFixed(2)}%\`);
console.log(\`  Uptime: \${(systemMetrics.uptime / 1000).toFixed(2)}s\`);

// Get database metrics
const dbMetrics = await service.getDatabaseMetrics();
console.log('\\nDatabase Metrics:');
console.log(\`  Active connections: \${dbMetrics.activeConnections}\`);
console.log(\`  Queries/sec: \${dbMetrics.queriesPerSecond.toFixed(2)}\`);
console.log(\`  Avg query time: \${dbMetrics.averageQueryTime.toFixed(2)}ms\`);
console.log(\`  Slow queries: \${dbMetrics.slowQueries}\`);

// Get cache metrics
const cacheMetrics = await service.getCacheMetrics();
console.log('\\nCache Metrics:');
console.log(\`  Hits: \${cacheMetrics.hits}\`);
console.log(\`  Misses: \${cacheMetrics.misses}\`);
console.log(\`  Hit rate: \${(cacheMetrics.hitRate * 100).toFixed(2)}%\`);
console.log(\`  Evictions: \${cacheMetrics.evictions}\`);

// Get search metrics
const searchMetrics = await service.getSearchMetrics();
console.log('\\nSearch Metrics:');
console.log(\`  Total searches: \${searchMetrics.totalSearches}\`);
console.log(\`  Avg search time: \${searchMetrics.averageSearchTime.toFixed(2)}ms\`);
console.log(\`  Documents: \${searchMetrics.documentCount}\`);
console.log(\`  Index size: \${(searchMetrics.indexSize / 1024 / 1024 / 1024).toFixed(2)}GB\`);
`;

console.log(metrics);
console.log();

// ============================================================
// 6. Request Metrics
// ============================================================
console.log('6. Request Metrics');
console.log('------------------');

const request = `
// Track API requests
service.recordRequest(200, 45, true);   // Successful request
service.recordRequest(200, 52, true);   // Successful request
service.recordRequest(404, 30, false);  // Not found
service.recordRequest(500, 150, false); // Server error

// Get request metrics
const requestMetrics = service.getRequestMetrics();
console.log('Request Metrics:');
console.log(\`  Total: \${requestMetrics.totalRequests}\`);
console.log(\`  Successful: \${requestMetrics.successfulRequests}\`);
console.log(\`  Failed: \${requestMetrics.failedRequests}\`);
console.log(\`  Success rate: \${((requestMetrics.successfulRequests / requestMetrics.totalRequests) * 100).toFixed(2)}%\`);
console.log('Status codes:', requestMetrics.statusCodeDistribution);
`;

console.log(request);
console.log();

// ============================================================
// 7. Metrics Snapshot
// ============================================================
console.log('7. Metrics Snapshot');
console.log('-------------------');

const snapshot = `
// Get complete metrics snapshot
const snapshot = await service.getMetricsSnapshot();
console.log('Metrics Snapshot:');
console.log(\`  Timestamp: \${snapshot.timestamp.toISOString()}\`);
console.log(\`  CPU: \${snapshot.system.cpuUsage.toFixed(2)}%\`);
console.log(\`  Memory: \${(snapshot.system.memoryUsage / 1024 / 1024 / 1024).toFixed(2)}GB\`);
console.log(\`  DB connections: \${snapshot.database?.activeConnections}\`);
console.log(\`  Cache hit rate: \${(snapshot.cache?.hitRate || 0) * 100)toFixed(2)}%\`);
console.log(\`  Search latency: \${snapshot.search?.averageSearchTime.toFixed(2)}ms\`);
`;

console.log(snapshot);
console.log();

// ============================================================
// 8. Monitoring Events
// ============================================================
console.log('8. Real-time Monitoring Events');
console.log('------------------------------');

const events = `
// Register monitoring listener for real-time events
service.onMonitoring((event) => {
  console.log(\`[\\${event.timestamp.toISOString()}] \${event.type.toUpperCase()}: \${event.source}\`);

  if (event.type === 'metric') {
    console.log('  Metrics collected');
  } else if (event.type === 'health') {
    const health = event.data;
    console.log(\`  Health status: \${health.status}\`);
  } else if (event.type === 'alert') {
    const alert = event.data;
    console.log(\`  ALERT: \${alert.severity.toUpperCase()} - \${alert.message}\`);
  }
});

// Listener will be called for:
// - Metric collection events (every interval)
// - Health check results
// - System alerts (CPU, memory, disk usage)
`;

console.log(events);
console.log();

// ============================================================
// 9. Prometheus Endpoint
// ============================================================
console.log('9. Prometheus Metrics Endpoint');
console.log('------------------------------');

const prometheus = `
// Get Prometheus-format metrics
const prometheusMetrics = service.getPrometheusMetrics();
console.log(prometheusMetrics);

// Output (Prometheus text format):
// # HELP process_uptime Process uptime in seconds
// # TYPE process_uptime gauge
// process_uptime 42.5
// ...

// Prometheus scrape configuration:
// scrape_configs:
//   - job_name: 'soc-detection-lab'
//     static_configs:
//       - targets: ['localhost:9090']
//     metrics_path: '/metrics'
//     scrape_interval: 15s
`;

console.log(prometheus);
console.log();

// ============================================================
// 10. Alert Monitoring
// ============================================================
console.log('10. Alert Monitoring');
console.log('--------------------');

const alerts = `
// Register alert listener
service.onMonitoring((event) => {
  if (event.type === 'alert') {
    const alert = event.data;

    switch (alert.type) {
      case 'cpu':
        console.log(\`🔴 CPU Alert: \${alert.value.toFixed(2)}% (threshold: \${alert.threshold}%)\`);
        // Trigger scaling, notifications, etc.
        break;

      case 'memory':
        console.log(\`🟡 Memory Alert: \${alert.value.toFixed(2)}GB\`);
        // Clean cache, trigger garbage collection
        break;

      case 'disk':
        console.log(\`🔴 CRITICAL: Disk full \${alert.value.toFixed(2)}% (threshold: \${alert.threshold}%)\`);
        // Archive logs, clean temporary files
        break;

      case 'response_time':
        console.log(\`🟠 Slow response time: \${alert.value.toFixed(2)}ms\`);
        // Log slow requests, notify team
        break;

      case 'error_rate':
        console.log(\`🔴 High error rate: \${alert.value.toFixed(2)}%\`);
        // Alert team, page on-call
        break;
    }
  }
});

// Get active alerts
const activeAlerts = service.getAlerts();
console.log(\`Active alerts: \${activeAlerts.length}\`);

// Clear resolved alerts
service.clearAlerts();
`;

console.log(alerts);
console.log();

// ============================================================
// 11. Common Patterns
// ============================================================
console.log('11. Common Usage Patterns');
console.log('------------------------');

const patterns = `
// Pattern 1: Health-based auto-scaling
async function handleAutoScaling() {
  const health = await service.healthCheck();
  if (health.status === 'unhealthy') {
    console.log('Triggering failover...');
  }
}

// Pattern 2: Performance monitoring
async function monitorPerformance() {
  const snapshot = await service.getMetricsSnapshot();
  if (snapshot.system.cpuUsage > 90) {
    console.log('CPU spike detected - optimizing...');
  }
}

// Pattern 3: SLA tracking
function trackSLA() {
  service.onMonitoring((event) => {
    if (event.type === 'metric') {
      // Update SLA dashboards
      // Calculate availability percentage
      // Track SLO compliance
    }
  });
}

// Pattern 4: Cost optimization
async function optimizeCosts() {
  const dbMetrics = await service.getDatabaseMetrics();
  if (dbMetrics.activeConnections < 5) {
    console.log('Reducing DB instance size...');
  }
}

// Pattern 5: Anomaly detection
async function detectAnomalies() {
  const current = await service.getSystemMetrics();
  const baseline = { cpuUsage: 40, memoryUsage: 2 * 1024 * 1024 * 1024 };

  if (current.cpuUsage > baseline.cpuUsage * 2) {
    console.log('Anomaly detected: CPU usage doubled');
  }
}
`;

console.log(patterns);
console.log();

// ============================================================
// 12. Shutdown
// ============================================================
console.log('12. Shutdown');
console.log('------------');

const shutdown = `
// Stop monitoring
await service.stop();
console.log('✓ Monitoring service stopped');
`;

console.log(shutdown);
console.log();

// ============================================================
// 13. Statistics
// ============================================================
console.log('13. Service Statistics');
console.log('----------------------');

console.log(`
Uptime: ${service.getUptime()}ms
Running: ${service.isRunning_() ? 'Yes' : 'No'}
Active alerts: ${service.getAlerts().length}
`);
console.log();

// ============================================================
// 14. Feature Summary
// ============================================================
console.log('14. Feature Summary');
console.log('-------------------');

const features = {
  'Health Checks': ['Register checks', 'Perform checks', 'Component details', 'Status aggregation'],
  'Metrics Collection': ['System metrics', 'Database metrics', 'Cache metrics', 'Search metrics'],
  'Request Tracking': ['Record requests', 'Status distribution', 'Success rate', 'Aggregated metrics'],
  'Prometheus Export': ['Metrics endpoint', 'Standard format', 'Scrape ready'],
  'Alerting': ['CPU monitoring', 'Memory monitoring', 'Disk monitoring', 'Alert tracking'],
  'Events': ['Real-time events', 'Metric events', 'Health events', 'Alert events'],
  'Monitoring': ['Event listeners', 'Uptime tracking', 'Performance metrics'],
};

Object.entries(features).forEach(([category, items]) => {
  console.log(`\n${category}:`);
  items.forEach((item) => console.log(`  • ${item}`));
});

console.log('\n=== Demo Complete ===');
console.log(`\nService Status: ${service.isRunning_() ? 'Running' : 'Stopped'}`);
console.log(`Uptime: ${service.getUptime()}ms`);
console.log(`Alerts: ${service.getAlerts().length}`);
