/**
 * Analytics Service - Unit Tests
 */

import { AnalyticsService, createAnalyticsService, IAnalyticsServiceConfig } from '../../src/index';

describe('Analytics Service', () => {
  let service: AnalyticsService;

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

  beforeEach(() => {
    service = createAnalyticsService(config);
  });

  afterEach(() => {
    service.stop();
  });

  describe('Event Tracking', () => {
    test('should track analytics event', () => {
      const eventId = service.trackEvent({
        timestamp: new Date(),
        source: 'web',
        category: 'user',
        action: 'login',
        data: { userId: 'user123' },
      });

      expect(eventId).toBeDefined();
      expect(eventId).toMatch(/^evt_/);

      const event = service.getEvent(eventId);
      expect(event?.category).toBe('user');
      expect(event?.action).toBe('login');
      expect(event?.source).toBe('web');
    });

    test('should track multiple events', () => {
      service.trackEvent({
        timestamp: new Date(),
        source: 'web',
        category: 'user',
        action: 'login',
        data: {},
      });

      service.trackEvent({
        timestamp: new Date(),
        source: 'api',
        category: 'system',
        action: 'sync',
        data: {},
      });

      const events = service.listEvents();
      expect(events.length).toBe(2);
    });

    test('should list events by category', () => {
      service.trackEvent({
        timestamp: new Date(),
        source: 'web',
        category: 'user',
        action: 'login',
        data: {},
      });

      service.trackEvent({
        timestamp: new Date(),
        source: 'web',
        category: 'user',
        action: 'logout',
        data: {},
      });

      service.trackEvent({
        timestamp: new Date(),
        source: 'api',
        category: 'system',
        action: 'sync',
        data: {},
      });

      const userEvents = service.listEvents('user');
      expect(userEvents.length).toBe(2);
      expect(userEvents.every((e) => e.category === 'user')).toBe(true);
    });

    test('should limit event list', () => {
      for (let i = 0; i < 10; i++) {
        service.trackEvent({
          timestamp: new Date(),
          source: 'web',
          category: 'test',
          action: 'test',
          data: {},
        });
      }

      const limited = service.listEvents(undefined, 5);
      expect(limited.length).toBe(5);
    });
  });

  describe('Event Aggregation', () => {
    test('should aggregate events', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      service.trackEvent({
        timestamp: now,
        source: 'web',
        category: 'clicks',
        action: 'button_click',
        data: {},
        userId: 'user1',
        sessionId: 'session1',
      });

      service.trackEvent({
        timestamp: now,
        source: 'api',
        category: 'clicks',
        action: 'api_call',
        data: {},
        userId: 'user2',
        sessionId: 'session2',
      });

      const agg = service.aggregateEvents(oneHourAgo, now, 'clicks');
      expect(agg.totalEvents).toBe(2);
      expect(agg.uniqueUsers).toBe(2);
      expect(agg.uniqueSessions).toBe(2);
    });
  });

  describe('Metric Definition and Recording', () => {
    test('should define metric', () => {
      const metricId = service.defineMetric({
        name: 'API Response Time',
        category: 'performance',
        type: 'histogram',
        aggregationType: 'avg',
        retentionDays: 90,
        enabled: true,
      });

      expect(metricId).toBeDefined();
      expect(metricId).toMatch(/^met_/);
    });

    test('should record metric value', () => {
      const metricId = service.defineMetric({
        name: 'CPU Usage',
        category: 'system',
        type: 'gauge',
        unit: '%',
        aggregationType: 'avg',
        retentionDays: 90,
        enabled: true,
      });

      const pointId = service.recordMetric(metricId, 75.5);
      expect(pointId).toBeDefined();
      expect(pointId).toMatch(/^pt_/);
    });

    test('should record multiple metric values', () => {
      const metricId = service.defineMetric({
        name: 'Memory Usage',
        category: 'system',
        type: 'gauge',
        unit: 'MB',
        aggregationType: 'avg',
        retentionDays: 90,
        enabled: true,
      });

      service.recordMetric(metricId, 1024);
      service.recordMetric(metricId, 2048);
      service.recordMetric(metricId, 1536);

      const realTime = service.getRealTimeMetrics();
      const memory = realTime.find((m) => m.metricId === metricId);
      expect(memory).toBeDefined();
      expect(memory?.currentValue).toBe(1536);
    });
  });

  describe('Query Management', () => {
    test('should create analytics query', () => {
      const queryId = service.createQuery({
        name: 'User Events',
        type: 'events',
        filters: [{ field: 'category', operator: 'eq', value: 'user' }],
        timeRange: {
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
          endTime: new Date(),
        },
      });

      expect(queryId).toBeDefined();
      expect(queryId).toMatch(/^qry_/);
    });

    test('should execute query', () => {
      const queryId = service.createQuery({
        name: 'Test Query',
        type: 'events',
        filters: [],
        timeRange: {
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
          endTime: new Date(),
        },
      });

      service.trackEvent({
        timestamp: new Date(),
        source: 'web',
        category: 'test',
        action: 'test',
        data: {},
      });

      const result = service.executeQuery(queryId);
      expect(result).toBeDefined();
      expect(result.queryId).toBe(queryId);
    });
  });

  describe('Dashboard Management', () => {
    test('should create dashboard', () => {
      const dashboardId = service.createDashboard({
        name: 'Performance Dashboard',
        widgets: [],
        isPublic: true,
      });

      expect(dashboardId).toBeDefined();
      expect(dashboardId).toMatch(/^dash_/);

      const dashboard = service.getDashboard(dashboardId);
      expect(dashboard?.name).toBe('Performance Dashboard');
    });

    test('should list dashboards', () => {
      const dash1 = service.createDashboard({
        name: 'Dashboard 1',
        widgets: [],
        isPublic: true,
      });

      const dash2 = service.createDashboard({
        name: 'Dashboard 2',
        widgets: [],
        isPublic: false,
      });

      const dashboards = service.listDashboards();
      expect(dashboards.length).toBe(2);
      expect(dashboards.map((d) => d.dashboardId)).toContain(dash1);
      expect(dashboards.map((d) => d.dashboardId)).toContain(dash2);
    });

    test('should add widget to dashboard', () => {
      const queryId = service.createQuery({
        name: 'Query',
        type: 'events',
        filters: [],
        timeRange: {
          startTime: new Date(),
          endTime: new Date(),
        },
      });

      const dashboardId = service.createDashboard({
        name: 'Test Dashboard',
        widgets: [],
        isPublic: true,
      });

      const widgetId = service.addWidget(dashboardId, {
        type: 'line',
        queryId,
        title: 'Events Over Time',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });

      expect(widgetId).toBeDefined();

      const dashboard = service.getDashboard(dashboardId);
      expect(dashboard?.widgets.length).toBe(1);
    });

    test('should delete dashboard', () => {
      const dashboardId = service.createDashboard({
        name: 'Deletable',
        widgets: [],
        isPublic: false,
      });

      const deleted = service.deleteDashboard(dashboardId);
      expect(deleted).toBe(true);

      const dashboard = service.getDashboard(dashboardId);
      expect(dashboard).toBeNull();
    });
  });

  describe('Report Generation', () => {
    test('should create report', () => {
      const reportId = service.createReport({
        name: 'Monthly Report',
        type: 'executive',
        sections: [],
      });

      expect(reportId).toBeDefined();
      expect(reportId).toMatch(/^rep_/);

      const report = service.getReport(reportId);
      expect(report?.name).toBe('Monthly Report');
      expect(report?.type).toBe('executive');
    });

    test('should list reports', () => {
      const rep1 = service.createReport({
        name: 'Report 1',
        type: 'detailed',
        sections: [],
      });

      const rep2 = service.createReport({
        name: 'Report 2',
        type: 'custom',
        sections: [],
      });

      const reports = service.listReports();
      expect(reports.length).toBe(2);
      expect(reports.map((r) => r.reportId)).toContain(rep1);
    });
  });

  describe('Alert Management', () => {
    test('should create alert', () => {
      const alertId = service.createAlert({
        name: 'High CPU',
        metric: 'cpu_usage',
        condition: 'exceeds',
        threshold: 90,
        enabled: true,
        recipients: ['admin@example.com'],
      });

      expect(alertId).toBeDefined();

      const alert = service.getAlert(alertId);
      expect(alert?.name).toBe('High CPU');
      expect(alert?.threshold).toBe(90);
    });

    test('should list alerts', () => {
      service.createAlert({
        name: 'Alert 1',
        metric: 'metric1',
        condition: 'exceeds',
        threshold: 100,
        enabled: true,
        recipients: [],
      });

      service.createAlert({
        name: 'Alert 2',
        metric: 'metric2',
        condition: 'below',
        threshold: 50,
        enabled: true,
        recipients: [],
      });

      const alerts = service.listAlerts();
      expect(alerts.length).toBe(2);
    });
  });

  describe('User Journey Tracking', () => {
    test('should track user journey', () => {
      const journeyId = service.trackJourney({
        userId: 'user123',
        steps: [
          {
            stepId: '1',
            timestamp: new Date(),
            action: 'visit',
            category: 'page',
            data: { page: 'home' },
          },
        ],
        startTime: new Date(),
        endTime: new Date(),
        duration: 1000,
        conversionFlag: false,
      });

      expect(journeyId).toBeDefined();

      const journey = service.getJourney(journeyId);
      expect(journey?.userId).toBe('user123');
      expect(journey?.steps.length).toBe(1);
    });
  });

  describe('Real-Time Metrics', () => {
    test('should get real-time metrics', () => {
      const metricId = service.defineMetric({
        name: 'Response Time',
        category: 'performance',
        type: 'histogram',
        aggregationType: 'avg',
        retentionDays: 90,
        enabled: true,
      });

      service.recordMetric(metricId, 100);
      service.recordMetric(metricId, 150);

      const metrics = service.getRealTimeMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      const metric = metrics.find((m) => m.metricId === metricId);
      expect(metric).toBeDefined();
      expect(metric?.currentValue).toBe(150);
    });
  });

  describe('Anomaly Detection', () => {
    test('should detect anomalies', () => {
      const metricId = service.defineMetric({
        name: 'Traffic',
        category: 'system',
        type: 'counter',
        aggregationType: 'sum',
        retentionDays: 90,
        enabled: true,
      });

      // Record normal values
      for (let i = 0; i < 15; i++) {
        service.recordMetric(metricId, 100);
      }

      // Record anomalous value
      service.recordMetric(metricId, 500);

      const anomalies = service.detectAnomalies();
      expect(Array.isArray(anomalies)).toBe(true);
    });
  });

  describe('Health Check', () => {
    test('should perform health check', async () => {
      const health = await service.performHealthCheck();
      expect(health.status).toBeDefined();
      expect(health.eventCount).toBeDefined();
      expect(health.timestamp).toBeDefined();
    });

    test('should report healthy status', async () => {
      const health = await service.performHealthCheck();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });
  });

  describe('Statistics', () => {
    test('should track statistics', () => {
      service.trackEvent({
        timestamp: new Date(),
        source: 'web',
        category: 'test',
        action: 'test',
        data: {},
      });

      service.defineMetric({
        name: 'Test Metric',
        category: 'test',
        type: 'gauge',
        aggregationType: 'avg',
        retentionDays: 30,
        enabled: true,
      });

      service.createDashboard({
        name: 'Test Dashboard',
        widgets: [],
        isPublic: true,
      });

      const stats = service.getStatistics();
      expect(stats.totalEvents).toBeGreaterThan(0);
      expect(stats.metricsTracked).toBeGreaterThan(0);
      expect(stats.dashboardsCreated).toBeGreaterThan(0);
    });
  });

  describe('Event Listeners', () => {
    test('should emit event tracking log', () => {
      const logs: any[] = [];

      service.onAnalyticsEvent(async (log) => {
        logs.push(log);
      });

      service.trackEvent({
        timestamp: new Date(),
        source: 'web',
        category: 'test',
        action: 'test',
        data: {},
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((l) => l.type === 'event-tracked')).toBe(true);
    });

    test('should emit query execution log', () => {
      const logs: any[] = [];

      service.onAnalyticsEvent(async (log) => {
        logs.push(log);
      });

      const queryId = service.createQuery({
        name: 'Test',
        type: 'events',
        filters: [],
        timeRange: {
          startTime: new Date(),
          endTime: new Date(),
        },
      });

      service.executeQuery(queryId);

      const queryLogs = logs.filter((l) => l.type === 'query-executed');
      expect(queryLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Data Types', () => {
    test('should support different metric types', () => {
      const gaugeId = service.defineMetric({
        name: 'CPU Usage',
        category: 'system',
        type: 'gauge',
        aggregationType: 'avg',
        retentionDays: 90,
        enabled: true,
      });

      const counterId = service.defineMetric({
        name: 'Requests',
        category: 'system',
        type: 'counter',
        aggregationType: 'sum',
        retentionDays: 90,
        enabled: true,
      });

      const histogramId = service.defineMetric({
        name: 'Response Time',
        category: 'performance',
        type: 'histogram',
        aggregationType: 'avg',
        retentionDays: 90,
        enabled: true,
      });

      expect(gaugeId).toBeDefined();
      expect(counterId).toBeDefined();
      expect(histogramId).toBeDefined();
    });

    test('should support different query types', () => {
      const queries = ['events', 'metrics', 'timeseries', 'comparison', 'trend'];

      queries.forEach((type) => {
        const queryId = service.createQuery({
          name: `${type} query`,
          type: type as any,
          filters: [],
          timeRange: {
            startTime: new Date(),
            endTime: new Date(),
          },
        });

        expect(queryId).toBeDefined();
      });
    });
  });
});
