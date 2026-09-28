/**
 * Analytics Service - Demo Scenarios
 * Real-world usage patterns and integration examples
 */

import { createAnalyticsService, IAnalyticsServiceConfig } from '../src/index';

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

/**
 * Demo 1: Basic Event Tracking
 */
async function demo1_BasicEventTracking(): Promise<void> {
  console.log('\n=== Demo 1: Basic Event Tracking ===\n');

  // Track user login event
  const loginEventId = service.trackEvent({
    timestamp: new Date(),
    source: 'web',
    category: 'user',
    action: 'login',
    data: { userId: 'user123', provider: 'google' },
    userId: 'user123',
    sessionId: 'session_abc',
  });

  console.log(`Tracked login event: ${loginEventId}`);

  // Track page view
  const pageViewId = service.trackEvent({
    timestamp: new Date(),
    source: 'web',
    category: 'page',
    action: 'view',
    data: { page: '/dashboard', referer: '/' },
    userId: 'user123',
    sessionId: 'session_abc',
  });

  console.log(`Tracked page view: ${pageViewId}`);

  // Track API call
  const apiCallId = service.trackEvent({
    timestamp: new Date(),
    source: 'api',
    category: 'system',
    action: 'sync',
    data: { endpoint: '/api/data', method: 'GET', duration: 145 },
  });

  console.log(`Tracked API call: ${apiCallId}`);

  const events = service.listEvents();
  console.log(`\nTotal events tracked: ${events.length}`);
}

/**
 * Demo 2: Event Aggregation
 */
async function demo2_EventAggregation(): Promise<void> {
  console.log('\n=== Demo 2: Event Aggregation ===\n');

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Track multiple events
  for (let i = 0; i < 5; i++) {
    service.trackEvent({
      timestamp: new Date(),
      source: 'web',
      category: 'user',
      action: 'click',
      data: { element: `button_${i}` },
      userId: `user${i}`,
      sessionId: `session_${i}`,
    });
  }

  // Aggregate events
  const agg = service.aggregateEvents(oneHourAgo, now, 'user');

  console.log(`Event Aggregation (last hour):`);
  console.log(`  Total events: ${agg.totalEvents}`);
  console.log(`  Unique users: ${agg.uniqueUsers}`);
  console.log(`  Unique sessions: ${agg.uniqueSessions}`);
  console.log(`  Actions: ${Object.keys(agg.eventsByAction).join(', ')}`);
}

/**
 * Demo 3: Metric Definition and Recording
 */
async function demo3_MetricsRecording(): Promise<void> {
  console.log('\n=== Demo 3: Metrics Recording ===\n');

  // Define metrics
  const cpuMetricId = service.defineMetric({
    name: 'CPU Usage',
    category: 'system',
    type: 'gauge',
    unit: '%',
    aggregationType: 'avg',
    retentionDays: 90,
    enabled: true,
  });

  const memoryMetricId = service.defineMetric({
    name: 'Memory Usage',
    category: 'system',
    type: 'gauge',
    unit: 'MB',
    aggregationType: 'avg',
    retentionDays: 90,
    enabled: true,
  });

  console.log('Defined metrics:');
  console.log(`  CPU Usage: ${cpuMetricId}`);
  console.log(`  Memory Usage: ${memoryMetricId}`);

  // Record metric values
  console.log('\nRecording metric values...');
  service.recordMetric(cpuMetricId, 42.5);
  service.recordMetric(cpuMetricId, 48.3);
  service.recordMetric(cpuMetricId, 45.1);

  service.recordMetric(memoryMetricId, 4096);
  service.recordMetric(memoryMetricId, 4512);
  service.recordMetric(memoryMetricId, 4300);

  console.log('✓ Metrics recorded');

  // Get real-time metrics
  const realTime = service.getRealTimeMetrics();
  console.log(`\nReal-time metrics: ${realTime.length}`);
  realTime.forEach((m) => {
    console.log(`  ${m.name}: ${m.currentValue}${m.unit ? ' ' + m.unit : ''} (${m.trend})`);
  });
}

/**
 * Demo 4: Query Creation and Execution
 */
async function demo4_QueryExecution(): Promise<void> {
  console.log('\n=== Demo 4: Query Execution ===\n');

  // Create query
  const queryId = service.createQuery({
    name: 'User Events Last 24h',
    type: 'events',
    filters: [{ field: 'category', operator: 'eq', value: 'user' }],
    timeRange: {
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endTime: new Date(),
    },
  });

  console.log(`Created query: ${queryId}`);

  // Track some events
  for (let i = 0; i < 3; i++) {
    service.trackEvent({
      timestamp: new Date(),
      source: 'web',
      category: 'user',
      action: `action_${i}`,
      data: {},
      userId: `user${i}`,
    });
  }

  // Execute query
  const result = service.executeQuery(queryId);

  console.log(`\nQuery Execution Result:`);
  console.log(`  Rows: ${result.rowCount}`);
  console.log(`  Columns: ${result.columnCount}`);
  console.log(`  Execution time: ${result.executionTime}ms`);
}

/**
 * Demo 5: Dashboard Creation
 */
async function demo5_DashboardCreation(): Promise<void> {
  console.log('\n=== Demo 5: Dashboard Creation ===\n');

  // Create query for dashboard
  const queryId = service.createQuery({
    name: 'Dashboard Query',
    type: 'timeseries',
    filters: [],
    timeRange: {
      startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endTime: new Date(),
    },
  });

  // Create dashboard
  const dashboardId = service.createDashboard({
    name: 'Performance Dashboard',
    widgets: [],
    isPublic: true,
  });

  console.log(`Created dashboard: ${dashboardId}`);

  // Add widgets
  const widget1Id = service.addWidget(dashboardId, {
    type: 'line',
    queryId,
    title: 'Events Over Time',
    position: { x: 0, y: 0 },
    size: { width: 500, height: 300 },
  });

  const widget2Id = service.addWidget(dashboardId, {
    type: 'bar',
    queryId,
    title: 'Events by Category',
    position: { x: 0, y: 300 },
    size: { width: 500, height: 300 },
  });

  console.log(`\nAdded widgets:`);
  console.log(`  Widget 1: ${widget1Id}`);
  console.log(`  Widget 2: ${widget2Id}`);

  const dashboard = service.getDashboard(dashboardId);
  console.log(`\nDashboard widgets: ${dashboard?.widgets.length}`);
}

/**
 * Demo 6: Report Generation
 */
async function demo6_ReportGeneration(): Promise<void> {
  console.log('\n=== Demo 6: Report Generation ===\n');

  // Create report
  const reportId = service.createReport({
    name: 'Weekly Performance Report',
    type: 'executive',
    sections: [
      {
        sectionId: '1',
        title: 'Summary',
        type: 'summary',
        content: 'Weekly performance summary',
        order: 1,
      },
      {
        sectionId: '2',
        title: 'Metrics',
        type: 'metric',
        order: 2,
      },
    ],
    schedule: {
      frequency: 'weekly',
      time: '09:00',
      timezone: 'UTC',
      enabled: true,
    },
    recipients: ['admin@example.com', 'manager@example.com'],
  });

  console.log(`Created report: ${reportId}`);

  const reports = service.listReports();
  console.log(`\nTotal reports: ${reports.length}`);
  reports.forEach((r) => {
    console.log(`  - ${r.name} (${r.type})`);
  });
}

/**
 * Demo 7: Alert Management
 */
async function demo7_AlertManagement(): Promise<void> {
  console.log('\n=== Demo 7: Alert Management ===\n');

  // Create alerts
  const cpuAlertId = service.createAlert({
    name: 'High CPU Usage',
    metric: 'cpu_usage',
    condition: 'exceeds',
    threshold: 80,
    enabled: true,
    recipients: ['ops@example.com'],
  });

  const memoryAlertId = service.createAlert({
    name: 'Low Memory',
    metric: 'memory_available',
    condition: 'below',
    threshold: 1024,
    enabled: true,
    recipients: ['ops@example.com'],
  });

  const trafficAlertId = service.createAlert({
    name: 'Unusual Traffic',
    metric: 'request_count',
    condition: 'anomaly',
    enabled: true,
    recipients: ['security@example.com'],
  });

  console.log('Created alerts:');
  console.log(`  CPU Alert: ${cpuAlertId}`);
  console.log(`  Memory Alert: ${memoryAlertId}`);
  console.log(`  Traffic Alert: ${trafficAlertId}`);

  const alerts = service.listAlerts();
  console.log(`\nTotal alerts: ${alerts.length}`);
}

/**
 * Demo 8: User Journey Tracking
 */
async function demo8_UserJourneyTracking(): Promise<void> {
  console.log('\n=== Demo 8: User Journey Tracking ===\n');

  const now = new Date();
  const startTime = new Date(now.getTime() - 10 * 60 * 1000);

  // Track user journey
  const journeyId = service.trackJourney({
    userId: 'user123',
    steps: [
      {
        stepId: '1',
        timestamp: startTime,
        action: 'visit_home',
        category: 'page',
        data: { page: '/home' },
      },
      {
        stepId: '2',
        timestamp: new Date(startTime.getTime() + 30000),
        action: 'click_product',
        category: 'interaction',
        data: { productId: 'prod_456' },
      },
      {
        stepId: '3',
        timestamp: new Date(startTime.getTime() + 120000),
        action: 'view_cart',
        category: 'page',
        data: { items: 1, total: 99.99 },
      },
      {
        stepId: '4',
        timestamp: now,
        action: 'purchase',
        category: 'conversion',
        data: { orderId: 'order_789', amount: 99.99 },
      },
    ],
    startTime,
    endTime: now,
    duration: 600000,
    conversionFlag: true,
  });

  console.log(`Tracked user journey: ${journeyId}`);

  const journey = service.getJourney(journeyId);
  console.log(`\nJourney Details:`);
  console.log(`  User: ${journey?.userId}`);
  console.log(`  Duration: ${journey?.duration}ms`);
  console.log(`  Steps: ${journey?.steps.length}`);
  console.log(`  Converted: ${journey?.conversionFlag}`);

  console.log(`\nJourney Steps:`);
  journey?.steps.forEach((step, idx) => {
    console.log(`  ${idx + 1}. ${step.action} (${step.category})`);
  });
}

/**
 * Demo 9: Real-Time Metrics
 */
async function demo9_RealTimeMetrics(): Promise<void> {
  console.log('\n=== Demo 9: Real-Time Metrics ===\n');

  // Define and record metrics
  const metricId = service.defineMetric({
    name: 'Response Time',
    category: 'performance',
    type: 'histogram',
    unit: 'ms',
    aggregationType: 'avg',
    retentionDays: 30,
    enabled: true,
  });

  // Simulate metric recording
  const values = [120, 135, 128, 142, 130];
  for (const value of values) {
    service.recordMetric(metricId, value);
  }

  console.log('Recorded metric values: ' + values.join(', '));

  // Get real-time metrics
  const realTime = service.getRealTimeMetrics();
  console.log(`\nReal-time metrics: ${realTime.length}`);

  const metric = realTime.find((m) => m.metricId === metricId);
  console.log(`\n${metric?.name}:`);
  console.log(`  Current: ${metric?.currentValue}${metric?.unit ? ' ' + metric.unit : ''}`);
  console.log(`  Previous: ${metric?.previousValue}${metric?.unit ? ' ' + metric.unit : ''}`);
  console.log(`  Trend: ${metric?.trend}`);
}

/**
 * Demo 10: Anomaly Detection
 */
async function demo10_AnomalyDetection(): Promise<void> {
  console.log('\n=== Demo 10: Anomaly Detection ===\n');

  const metricId = service.defineMetric({
    name: 'Traffic Volume',
    category: 'system',
    type: 'counter',
    aggregationType: 'sum',
    retentionDays: 30,
    enabled: true,
  });

  // Record normal values
  console.log('Recording normal traffic values...');
  for (let i = 0; i < 20; i++) {
    service.recordMetric(metricId, 100 + Math.random() * 20);
  }

  // Record anomalous value
  console.log('Recording anomalous value...');
  service.recordMetric(metricId, 500);

  // Detect anomalies
  const anomalies = service.detectAnomalies();
  console.log(`\nDetected ${anomalies.length} anomalies`);

  if (anomalies.length > 0) {
    anomalies.forEach((a) => {
      console.log(`  Metric: ${a.metric}`);
      console.log(`  Expected: ${a.expectedValue.toFixed(2)}`);
      console.log(`  Actual: ${a.actualValue.toFixed(2)}`);
      console.log(`  Severity: ${a.severity}`);
    });
  }
}

/**
 * Demo 11: Health Check
 */
async function demo11_HealthCheck(): Promise<void> {
  console.log('\n=== Demo 11: Health Check ===\n');

  // Generate some data
  for (let i = 0; i < 5; i++) {
    service.trackEvent({
      timestamp: new Date(),
      source: 'web',
      category: 'test',
      action: 'test',
      data: {},
    });
  }

  const health = await service.performHealthCheck();

  console.log(`Analytics System Health:`);
  console.log(`  Status: ${health.status}`);
  console.log(`  Events: ${health.eventCount}`);
  console.log(`  Query Queue: ${health.queryQueueSize}`);
  console.log(`  Active Queries: ${health.activeQueries}`);
  console.log(`  Processing Latency: ${health.processingLatency}ms`);
}

/**
 * Demo 12: Complete Analytics Workflow
 */
async function demo12_CompleteWorkflow(): Promise<void> {
  console.log('\n=== Demo 12: Complete Analytics Workflow ===\n');

  console.log('Setting up comprehensive analytics system...\n');

  // Step 1: Define metrics
  console.log('Step 1: Defining key metrics');
  const cpuId = service.defineMetric({
    name: 'CPU Usage',
    category: 'system',
    type: 'gauge',
    unit: '%',
    aggregationType: 'avg',
    retentionDays: 90,
    enabled: true,
  });
  console.log('✓ Metrics defined');

  // Step 2: Track events
  console.log('\nStep 2: Tracking user events');
  service.trackEvent({
    timestamp: new Date(),
    source: 'web',
    category: 'user',
    action: 'signup',
    data: { plan: 'pro' },
    userId: 'new_user_1',
  });
  console.log('✓ Events tracked');

  // Step 3: Record metrics
  console.log('\nStep 3: Recording system metrics');
  service.recordMetric(cpuId, 45.2);
  service.recordMetric(cpuId, 48.7);
  console.log('✓ Metrics recorded');

  // Step 4: Create dashboard
  console.log('\nStep 4: Creating analytics dashboard');
  const queryId = service.createQuery({
    name: 'Performance Query',
    type: 'metrics',
    filters: [],
    timeRange: {
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endTime: new Date(),
    },
  });

  const dashboardId = service.createDashboard({
    name: 'System Dashboard',
    widgets: [],
    isPublic: true,
  });

  service.addWidget(dashboardId, {
    type: 'line',
    queryId,
    title: 'Performance Metrics',
    position: { x: 0, y: 0 },
    size: { width: 600, height: 300 },
  });
  console.log('✓ Dashboard created');

  // Step 5: Generate report
  console.log('\nStep 5: Generating analytics report');
  service.createReport({
    name: 'Daily Analytics Report',
    type: 'executive',
    sections: [],
  });
  console.log('✓ Report generated');

  // Step 6: Check health
  console.log('\nStep 6: Checking system health');
  const health = await service.performHealthCheck();
  console.log(`✓ System health: ${health.status}`);

  // Step 7: View statistics
  console.log('\nStep 7: Analytics statistics');
  const stats = service.getStatistics();
  console.log(`✓ Events tracked: ${stats.totalEvents}`);
  console.log(`✓ Metrics defined: ${stats.metricsTracked}`);
  console.log(`✓ Dashboards created: ${stats.dashboardsCreated}`);

  console.log('\n✓ Complete analytics workflow executed successfully!');
}

/**
 * Run all demos
 */
async function runAllDemos(): Promise<void> {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║    ANALYTICS SERVICE - DEMO SCENARIOS  ║');
  console.log('╚════════════════════════════════════════╝');

  await demo1_BasicEventTracking();
  await demo2_EventAggregation();
  await demo3_MetricsRecording();
  await demo4_QueryExecution();
  await demo5_DashboardCreation();
  await demo6_ReportGeneration();
  await demo7_AlertManagement();
  await demo8_UserJourneyTracking();
  await demo9_RealTimeMetrics();
  await demo10_AnomalyDetection();
  await demo11_HealthCheck();
  await demo12_CompleteWorkflow();

  service.stop();

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║         ALL DEMOS COMPLETED            ║');
  console.log('╚════════════════════════════════════════╝\n');
}

// Execute
runAllDemos().catch(console.error);
