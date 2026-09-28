/**
 * Metrics Service - Prototype Demonstrations
 * 12 comprehensive scenario demonstrations
 */

import {
  MetricsService,
  createMetricsService,
  IMetricsServiceConfig,
  IAlertRule,
  IMetricQuery,
  IRetentionPolicy,
  MetricsListener,
  AlertListener,
  IAlertEvent,
  IMetricValue,
} from '../src/index';

/**
 * Demo 1: Basic counter and gauge operations
 */
async function demo1_BasicCounterGaugeOperations(): Promise<void> {
  console.log('\n=== Demo 1: Basic Counter & Gauge Operations ===');

  const config: IMetricsServiceConfig = {
    enableMetrics: true,
    enableAlerts: true,
    enableExport: false,
    exportInterval: 60000,
    retentionDays: 30,
    maxMetricsPerQuery: 1000,
    enableCompression: true,
    enableEncryption: false,
    exporters: [],
  };

  const service = createMetricsService(config);

  // Record counters
  const counter1 = service.incrementCounter('api_requests', 1, { endpoint: '/users' });
  const counter2 = service.incrementCounter('api_requests', 1, { endpoint: '/posts' });
  const counter3 = service.incrementCounter('api_requests', 1, { endpoint: '/users' });

  console.log(`✓ Recorded 3 counter metrics: ${counter1}, ${counter2}, ${counter3}`);

  // Record gauges
  const gauge1 = service.setGauge('memory_usage', 65.5, { host: 'server-1' });
  const gauge2 = service.setGauge('cpu_usage', 45.2, { host: 'server-1' });

  console.log(`✓ Recorded 2 gauge metrics: ${gauge1}, ${gauge2}`);

  // Update gauges
  service.setGauge('memory_usage', 72.1, { host: 'server-1' });
  service.setGauge('cpu_usage', 52.8, { host: 'server-1' });

  console.log('✓ Updated gauge metrics');

  // Query metrics
  const query: IMetricQuery = {};
  const results = service.queryMetrics(query);

  console.log(`✓ Total metrics recorded: ${results.length}`);

  const stats = service.getStats();
  console.log(`  - Total metrics: ${stats.totalMetrics}`);
  console.log(`  - Metrics by type: ${JSON.stringify(stats.metricsByType)}`);

  service.stop();
}

/**
 * Demo 2: Histogram operations and distribution tracking
 */
async function demo2_HistogramOperations(): Promise<void> {
  console.log('\n=== Demo 2: Histogram Operations ===');

  const config: IMetricsServiceConfig = {
    enableMetrics: true,
    enableAlerts: false,
    enableExport: false,
    exportInterval: 60000,
    retentionDays: 30,
    maxMetricsPerQuery: 1000,
    enableCompression: true,
    enableEncryption: false,
    exporters: [],
  };

  const service = createMetricsService(config);

  // Record response latencies
  const latencies = [45, 120, 78, 95, 132, 88, 110, 65, 150, 92];

  latencies.forEach((latency) => {
    service.recordHistogram('response_latency', latency, { endpoint: '/api/data' });
  });

  console.log(`✓ Recorded ${latencies.length} histogram values`);

  // Get aggregation
  const agg = service.getAggregation('response_latency', '1h');

  if (agg) {
    console.log(`✓ Histogram aggregation for '${agg.name}':`);
    console.log(`  - Total values: ${agg.statistics?.count}`);
    console.log(`  - Sum: ${agg.statistics?.sum}ms`);
    console.log(`  - Mean: ${agg.statistics?.mean?.toFixed(2)}ms`);
    console.log(`  - Min: ${agg.statistics?.min}ms`);
    console.log(`  - Max: ${agg.statistics?.max}ms`);
    console.log(`  - P50: ${agg.statistics?.percentile50?.toFixed(2)}ms`);
    console.log(`  - P90: ${agg.statistics?.percentile90?.toFixed(2)}ms`);
    console.log(`  - P99: ${agg.statistics?.percentile99?.toFixed(2)}ms`);
  }

  service.stop();
}

/**
 * Demo 3: Timer operations and duration tracking
 */
async function demo3_TimerOperations(): Promise<void> {
  console.log('\n=== Demo 3: Timer Operations ===');

  const config: IMetricsServiceConfig = {
    enableMetrics: true,
    enableAlerts: false,
    enableExport: false,
    exportInterval: 60000,
    retentionDays: 30,
    maxMetricsPerQuery: 1000,
    enableCompression: true,
    enableEncryption: false,
    exporters: [],
  };

  const service = createMetricsService(config);

  // Simulate operations with timer
  const operations = [
    { name: 'database_query', duration: 150 },
    { name: 'cache_lookup', duration: 10 },
    { name: 'api_call', duration: 500 },
  ];

  for (const op of operations) {
    const timer = service.startTimer(`operation_${op.name}`);
    await new Promise((resolve) => setTimeout(resolve, op.duration));
    timer();
  }

  console.log(`✓ Completed ${operations.length} timed operations`);

  const stats = service.getStats();
  console.log(`✓ Service metrics stats: ${stats.totalMetrics} total metrics`);

  service.stop();
}

/**
 * Demo 4: Alert rule creation and management
 */
async function demo4_AlertRuleCreation(): Promise<void> {
  console.log('\n=== Demo 4: Alert Rule Creation ===');

  const config: IMetricsServiceConfig = {
    enableMetrics: true,
    enableAlerts: true,
    enableExport: false,
    exportInterval: 60000,
    retentionDays: 30,
    maxMetricsPerQuery: 1000,
    enableCompression: true,
    enableEncryption: false,
    exporters: [],
  };

  const service = createMetricsService(config);

  // Create alert rules
  const rule1 = service.createAlertRule({
    name: 'High CPU Usage',
    description: 'Alert when CPU usage exceeds 80%',
    metricName: 'cpu_usage',
    condition: 'gt',
    threshold: 80,
    duration: 300000,
    enabled: true,
  });

  const rule2 = service.createAlertRule({
    name: 'Memory Critical',
    description: 'Alert when memory usage exceeds 90%',
    metricName: 'memory_usage',
    condition: 'gte',
    threshold: 90,
    duration: 60000,
    enabled: true,
  });

  const rule3 = service.createAlertRule({
    name: 'Low Disk Space',
    description: 'Alert when disk space is below 10%',
    metricName: 'disk_free',
    condition: 'lt',
    threshold: 10,
    duration: 600000,
    enabled: true,
  });

  console.log(`✓ Created 3 alert rules:`);
  console.log(`  - Rule 1: ${rule1}`);
  console.log(`  - Rule 2: ${rule2}`);
  console.log(`  - Rule 3: ${rule3}`);

  // Retrieve and display rules
  const retrievedRule1 = service.getAlertRule(rule1);
  const retrievedRule2 = service.getAlertRule(rule2);

  console.log(`✓ Retrieved alert rules:`);
  console.log(`  - ${retrievedRule1?.name}: ${retrievedRule1?.condition} ${retrievedRule1?.threshold}`);
  console.log(`  - ${retrievedRule2?.name}: ${retrievedRule2?.condition} ${retrievedRule2?.threshold}`);

  const stats = service.getStats();
  console.log(`✓ Total alert rules: ${stats.totalAlertRules}`);

  service.stop();
}

/**
 * Demo 5: Alert triggering and detection
 */
async function demo5_AlertTriggering(): Promise<void> {
  console.log('\n=== Demo 5: Alert Triggering ===');

  const config: IMetricsServiceConfig = {
    enableMetrics: true,
    enableAlerts: true,
    enableExport: false,
    exportInterval: 60000,
    retentionDays: 30,
    maxMetricsPerQuery: 1000,
    enableCompression: true,
    enableEncryption: false,
    exporters: [],
  };

  const service = createMetricsService(config);

  let alertTriggered = false;

  // Register alert listener
  const alertListener: AlertListener = async (alert: IAlertEvent) => {
    alertTriggered = true;
    console.log(`🚨 Alert Triggered: ${alert.alertId}`);
    console.log(`  - Rule: ${alert.ruleId}`);
    console.log(`  - Severity: ${alert.severity}`);
    console.log(`  - Message: ${alert.message}`);
    console.log(`  - Value: ${alert.metricValue}, Threshold: ${alert.threshold}`);
  };

  service.onAlert(alertListener);

  // Create alert rule
  const ruleId = service.createAlertRule({
    name: 'Response Time Alert',
    metricName: 'response_time',
    condition: 'gt',
    threshold: 500,
    duration: 100,
    enabled: true,
  });

  console.log(`✓ Created alert rule: ${ruleId}`);

  // Record metrics that should trigger alert
  for (let i = 0; i < 15; i++) {
    service.recordHistogram('response_time', 600);
  }

  console.log('✓ Recorded metrics that exceed threshold');

  // Wait for alert check
  await new Promise((resolve) => setTimeout(resolve, 500));

  const stats = service.getStats();
  console.log(`✓ Service stats:`);
  console.log(`  - Total metrics: ${stats.totalMetrics}`);
  console.log(`  - Active alerts: ${stats.activeAlerts}`);
  console.log(`  - Alert events: ${stats.alertEvents}`);

  service.stop();
}

/**
 * Demo 6: Metric querying with filters
 */
async function demo6_MetricQuerying(): Promise<void> {
  console.log('\n=== Demo 6: Metric Querying with Filters ===');

  const config: IMetricsServiceConfig = {
    enableMetrics: true,
    enableAlerts: false,
    enableExport: false,
    exportInterval: 60000,
    retentionDays: 30,
    maxMetricsPerQuery: 1000,
    enableCompression: true,
    enableEncryption: false,
    exporters: [],
  };

  const service = createMetricsService(config);

  // Record metrics with various tags
  service.incrementCounter('api_requests', 5, { endpoint: '/users', method: 'GET' });
  service.incrementCounter('api_requests', 3, { endpoint: '/posts', method: 'GET' });
  service.incrementCounter('api_requests', 2, { endpoint: '/users', method: 'POST' });
  service.incrementCounter('api_requests', 1, { endpoint: '/comments', method: 'DELETE' });

  console.log('✓ Recorded 4 tagged metrics');

  // Query all metrics
  const allMetrics = service.queryMetrics({});
  console.log(`✓ Query (all): ${allMetrics.length} metrics`);

  // Query by metric name
  const byName = service.queryMetrics({ metricName: 'api_requests' });
  console.log(`✓ Query (by name 'api_requests'): ${byName.length} metrics`);

  // Query with tag filter
  const byTag = service.queryMetrics({
    metricName: 'api_requests',
    tags: { endpoint: '/users' },
  });
  console.log(`✓ Query (endpoint='/users'): ${byTag.length} metrics`);

  // Query with limit
  const limited = service.queryMetrics({ limit: 2 });
  console.log(`✓ Query (limit=2): ${limited.length} metrics`);

  service.stop();
}

/**
 * Demo 7: Metric aggregation and statistics
 */
async function demo7_MetricAggregation(): Promise<void> {
  console.log('\n=== Demo 7: Metric Aggregation ===');

  const config: IMetricsServiceConfig = {
    enableMetrics: true,
    enableAlerts: false,
    enableExport: false,
    exportInterval: 60000,
    retentionDays: 30,
    maxMetricsPerQuery: 1000,
    enableCompression: true,
    enableEncryption: false,
    exporters: [],
  };

  const service = createMetricsService(config);

  // Record response times
  const times = [50, 75, 100, 125, 150, 175, 200, 225, 250, 300];

  times.forEach((time) => {
    service.recordHistogram('response_time', time);
  });

  console.log(`✓ Recorded ${times.length} response time metrics`);

  // Get aggregations for different periods
  const agg1h = service.getAggregation('response_time', '1h');
  const agg5m = service.getAggregation('response_time', '5m');

  console.log('✓ Response time statistics (1h):');
  if (agg1h?.statistics) {
    const stats = agg1h.statistics;
    console.log(`  - Count: ${stats.count}`);
    console.log(`  - Sum: ${stats.sum}ms`);
    console.log(`  - Mean: ${stats.mean.toFixed(2)}ms`);
    console.log(`  - Min/Max: ${stats.min}/${stats.max}ms`);
    console.log(`  - Percentiles: P50=${stats.percentile50?.toFixed(2)}, P75=${stats.percentile75?.toFixed(2)}, P90=${stats.percentile90?.toFixed(2)}`);
  }

  service.stop();
}

/**
 * Demo 8: Service metrics collection
 */
async function demo8_ServiceMetrics(): Promise<void> {
  console.log('\n=== Demo 8: Service Metrics Collection ===');

  const config: IMetricsServiceConfig = {
    enableMetrics: true,
    enableAlerts: false,
    enableExport: false,
    exportInterval: 60000,
    retentionDays: 30,
    maxMetricsPerQuery: 1000,
    enableCompression: true,
    enableEncryption: false,
    exporters: [],
  };

  const service = createMetricsService(config);

  // Simulate API service metrics
  for (let i = 0; i < 100; i++) {
    service.incrementCounter('api_requests', 1, { service: 'auth-service' });
  }

  for (let i = 0; i < 5; i++) {
    service.incrementCounter('api_errors', 1, { service: 'auth-service' });
  }

  for (let i = 0; i < 50; i++) {
    service.recordHistogram('response_time', Math.random() * 300, { service: 'auth-service' });
  }

  console.log('✓ Recorded service metrics for auth-service');

  // Get service metrics
  const serviceMetrics = service.getServiceMetrics('auth-service');

  if (serviceMetrics) {
    console.log(`✓ Service metrics for 'auth-service':`);
    console.log(`  - Requests: ${serviceMetrics.requestCount}`);
    console.log(`  - Errors: ${serviceMetrics.errorCount}`);
    console.log(`  - Success: ${serviceMetrics.successCount}`);
    console.log(`  - Avg Response Time: ${serviceMetrics.avgResponseTime.toFixed(2)}ms`);
    console.log(`  - Throughput: ${serviceMetrics.throughput.toFixed(2)} req/s`);
    console.log(`  - Error Rate: ${serviceMetrics.errorRate.toFixed(2)}%`);
  }

  service.stop();
}

/**
 * Demo 9: Dashboard creation and management
 */
async function demo9_DashboardManagement(): Promise<void> {
  console.log('\n=== Demo 9: Dashboard Management ===');

  const config: IMetricsServiceConfig = {
    enableMetrics: true,
    enableAlerts: false,
    enableExport: false,
    exportInterval: 60000,
    retentionDays: 30,
    maxMetricsPerQuery: 1000,
    enableCompression: true,
    enableEncryption: false,
    exporters: [],
  };

  const service = createMetricsService(config);

  // Create dashboards
  const dash1 = service.createDashboard({
    name: 'System Health',
    description: 'Overall system health metrics',
    metrics: ['cpu_usage', 'memory_usage', 'disk_usage'],
    refreshInterval: 5000,
  });

  const dash2 = service.createDashboard({
    name: 'API Performance',
    description: 'API performance and response metrics',
    metrics: ['response_time', 'api_requests', 'api_errors'],
    refreshInterval: 10000,
  });

  console.log(`✓ Created 2 dashboards:`);
  console.log(`  - Dashboard 1: ${dash1}`);
  console.log(`  - Dashboard 2: ${dash2}`);

  // Retrieve dashboards
  const retrieved1 = service.getDashboard(dash1);
  const retrieved2 = service.getDashboard(dash2);

  console.log(`✓ Retrieved dashboards:`);
  console.log(`  - ${retrieved1?.name}: ${retrieved1?.metrics.join(', ')}`);
  console.log(`  - ${retrieved2?.name}: ${retrieved2?.metrics.join(', ')}`);

  service.stop();
}

/**
 * Demo 10: Health checks and monitoring
 */
async function demo10_HealthChecks(): Promise<void> {
  console.log('\n=== Demo 10: Health Checks ===');

  const config: IMetricsServiceConfig = {
    enableMetrics: true,
    enableAlerts: false,
    enableExport: false,
    exportInterval: 60000,
    retentionDays: 30,
    maxMetricsPerQuery: 1000,
    enableCompression: true,
    enableEncryption: false,
    exporters: [],
  };

  const service = createMetricsService(config);

  // Perform health check
  const health = await service.performHealthCheck();

  console.log(`✓ Health check completed:`);
  console.log(`  - Overall Status: ${health.status}`);
  console.log(`  - Storage Health: ${health.storageHealth}`);
  console.log(`  - Processing Health: ${health.processingHealth}`);
  console.log(`  - Timestamp: ${health.timestamp.toISOString()}`);
  console.log(`  - Checks (${health.checks.length}):`);

  health.checks.forEach((check) => {
    console.log(`    • ${check.name}: ${check.status}`);
    if (check.message) {
      console.log(`      Message: ${check.message}`);
    }
  });

  service.stop();
}

/**
 * Demo 11: Retention policies
 */
async function demo11_RetentionPolicies(): Promise<void> {
  console.log('\n=== Demo 11: Retention Policies ===');

  const config: IMetricsServiceConfig = {
    enableMetrics: true,
    enableAlerts: false,
    enableExport: false,
    exportInterval: 60000,
    retentionDays: 30,
    maxMetricsPerQuery: 1000,
    enableCompression: true,
    enableEncryption: false,
    exporters: [],
  };

  const service = createMetricsService(config);

  // Create retention policies
  const policy1: IRetentionPolicy = {
    name: 'short_term',
    description: 'Keep metrics for 7 days',
    retentionDays: 7,
    aggregationInterval: 60000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const policy2: IRetentionPolicy = {
    name: 'long_term',
    description: 'Keep counter metrics for 90 days',
    metricTypeFilter: ['counter'],
    retentionDays: 90,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result1 = service.registerRetentionPolicy(policy1);
  const result2 = service.registerRetentionPolicy(policy2);

  console.log(`✓ Registered retention policies:`);
  console.log(`  - Policy 1 (${policy1.name}): ${result1 ? 'Success' : 'Failed'}`);
  console.log(`  - Policy 2 (${policy2.name}): ${result2 ? 'Success' : 'Failed'}`);

  service.stop();
}

/**
 * Demo 12: Complete integration flow
 */
async function demo12_CompleteIntegrationFlow(): Promise<void> {
  console.log('\n=== Demo 12: Complete Integration Flow ===');

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

  let metricsReceived = 0;
  let alertsTriggered = 0;

  // Register listeners
  const metricListener: MetricsListener = async () => {
    metricsReceived++;
  };

  const alertListener: AlertListener = async () => {
    alertsTriggered++;
  };

  service.onMetric(metricListener).onAlert(alertListener);

  console.log('✓ Registered event listeners');

  // Record various metrics
  console.log('✓ Recording metrics...');

  for (let i = 0; i < 50; i++) {
    service.incrementCounter('requests', 1);
    service.recordHistogram('latency', Math.random() * 200);
    service.setGauge('connections', Math.floor(Math.random() * 100));
  }

  // Create alert rules
  const cpuRule = service.createAlertRule({
    name: 'CPU Alert',
    metricName: 'cpu_usage',
    condition: 'gt',
    threshold: 75,
    duration: 300000,
    enabled: true,
  });

  const errorRule = service.createAlertRule({
    name: 'Error Rate Alert',
    metricName: 'error_rate',
    condition: 'gte',
    threshold: 5,
    duration: 60000,
    enabled: true,
  });

  console.log(`✓ Created ${2} alert rules`);

  // Create dashboards
  const sysDash = service.createDashboard({
    name: 'System Dashboard',
    metrics: ['cpu_usage', 'memory_usage', 'disk_usage'],
    refreshInterval: 5000,
  });

  const appDash = service.createDashboard({
    name: 'Application Dashboard',
    metrics: ['requests', 'latency', 'error_rate'],
    refreshInterval: 10000,
  });

  console.log(`✓ Created ${2} dashboards`);

  // Register retention policy
  const policy: IRetentionPolicy = {
    name: 'default_retention',
    retentionDays: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  service.registerRetentionPolicy(policy);
  console.log('✓ Registered retention policy');

  // Query metrics
  const allMetrics = service.queryMetrics({});
  console.log(`✓ Total metrics recorded: ${allMetrics.length}`);

  // Get aggregation
  const agg = service.getAggregation('latency', '1h');
  console.log(`✓ Latency aggregation: ${agg?.statistics?.count} values`);

  // Get stats
  const stats = service.getStats();
  console.log(`✓ Service statistics:`);
  console.log(`  - Total metrics: ${stats.totalMetrics}`);
  console.log(`  - Alert rules: ${stats.totalAlertRules}`);
  console.log(`  - Last hour: ${stats.metricsLastHour}`);

  // Health check
  const health = await service.performHealthCheck();
  console.log(`✓ Health status: ${health.status}`);

  service.stop();
  console.log('✓ Service stopped successfully');
}

/**
 * Run all demos
 */
async function runAllDemos(): Promise<void> {
  console.log('════════════════════════════════════════════════════════════');
  console.log('         Metrics Service - Prototype Demonstrations');
  console.log('════════════════════════════════════════════════════════════');

  try {
    await demo1_BasicCounterGaugeOperations();
    await demo2_HistogramOperations();
    await demo3_TimerOperations();
    await demo4_AlertRuleCreation();
    await demo5_AlertTriggering();
    await demo6_MetricQuerying();
    await demo7_MetricAggregation();
    await demo8_ServiceMetrics();
    await demo9_DashboardManagement();
    await demo10_HealthChecks();
    await demo11_RetentionPolicies();
    await demo12_CompleteIntegrationFlow();

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('              All Demos Completed Successfully');
    console.log('════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('Error running demos:', error);
    process.exit(1);
  }
}

// Run demos if executed directly
if (require.main === module) {
  runAllDemos().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export {
  demo1_BasicCounterGaugeOperations,
  demo2_HistogramOperations,
  demo3_TimerOperations,
  demo4_AlertRuleCreation,
  demo5_AlertTriggering,
  demo6_MetricQuerying,
  demo7_MetricAggregation,
  demo8_ServiceMetrics,
  demo9_DashboardManagement,
  demo10_HealthChecks,
  demo11_RetentionPolicies,
  demo12_CompleteIntegrationFlow,
  runAllDemos,
};
