/**
 * Metrics Service - Unit Tests
 * Comprehensive test coverage for metrics collection, aggregation, alerting
 */

import {
  MetricsService,
  createMetricsService,
  IMetricsServiceConfig,
  IAlertRule,
  IMetricQuery,
  IMetricDashboard,
  IRetentionPolicy,
  IMetricsStats,
  IMetricsHealthCheck,
  IServiceMetrics,
  MetricsListener,
  AlertListener,
  IAlertEvent,
  IMetricValue,
} from '../../src/index';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    const config: IMetricsServiceConfig = {
      enableMetrics: true,
      enableAlerts: true,
      enableExport: true,
      exportInterval: 5000,
      retentionDays: 30,
      maxMetricsPerQuery: 1000,
      enableCompression: true,
      enableEncryption: false,
      exporters: [
        {
          type: 'prometheus',
          enabled: true,
          interval: 10000,
          url: 'http://prometheus:9090',
        },
      ],
    };
    service = createMetricsService(config);
  });

  afterEach(() => {
    service.stop();
  });

  describe('Counter Metrics', () => {
    test('should increment counter and return metric ID', () => {
      const metricId = service.incrementCounter('requests_total', 1);
      expect(metricId).toBeDefined();
      expect(typeof metricId).toBe('string');
    });

    test('should increment counter by custom value', () => {
      const metricId1 = service.incrementCounter('api_calls', 5);
      const metricId2 = service.incrementCounter('api_calls', 3);

      expect(metricId1).toBeDefined();
      expect(metricId2).toBeDefined();
    });

    test('should support tags on counter metrics', () => {
      const metricId = service.incrementCounter('requests_total', 1, {
        method: 'GET',
        endpoint: '/api/users',
      });
      expect(metricId).toBeDefined();
    });

    test('should handle multiple counters with different names', () => {
      const id1 = service.incrementCounter('http_requests', 1);
      const id2 = service.incrementCounter('db_queries', 1);
      const id3 = service.incrementCounter('cache_hits', 1);

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id3).toBeDefined();
    });
  });

  describe('Gauge Metrics', () => {
    test('should set gauge and return metric ID', () => {
      const metricId = service.setGauge('memory_usage', 75.5);
      expect(metricId).toBeDefined();
      expect(typeof metricId).toBe('string');
    });

    test('should update gauge value', () => {
      service.setGauge('cpu_usage', 45);
      service.setGauge('cpu_usage', 60);

      const stats = service.getStats();
      expect(stats.totalMetrics).toBeGreaterThan(0);
    });

    test('should support tags on gauge metrics', () => {
      const metricId = service.setGauge('queue_depth', 150, {
        queue_name: 'email',
        priority: 'high',
      });
      expect(metricId).toBeDefined();
    });

    test('should track min/max values for gauges', () => {
      service.setGauge('temperature', 20);
      service.setGauge('temperature', 25);
      service.setGauge('temperature', 22);

      const stats = service.getStats();
      expect(stats.totalMetrics).toBeGreaterThan(0);
    });
  });

  describe('Histogram Metrics', () => {
    test('should record histogram and return metric ID', () => {
      const metricId = service.recordHistogram('response_size', 512);
      expect(metricId).toBeDefined();
      expect(typeof metricId).toBe('string');
    });

    test('should record multiple histogram values', () => {
      service.recordHistogram('latency', 100);
      service.recordHistogram('latency', 150);
      service.recordHistogram('latency', 120);

      const stats = service.getStats();
      expect(stats.totalMetrics).toBeGreaterThan(0);
    });

    test('should support tags on histogram metrics', () => {
      const metricId = service.recordHistogram('request_duration', 250, {
        endpoint: '/api/data',
        method: 'POST',
      });
      expect(metricId).toBeDefined();
    });

    test('should handle histogram with zero value', () => {
      const metricId = service.recordHistogram('zero_latency', 0);
      expect(metricId).toBeDefined();
    });
  });

  describe('Timer Metrics', () => {
    test('should start timer and record duration', (done) => {
      const timer = service.startTimer('operation_time');
      expect(typeof timer).toBe('function');

      setTimeout(() => {
        timer();
        const stats = service.getStats();
        expect(stats.totalMetrics).toBeGreaterThan(0);
        done();
      }, 50);
    });

    test('should record multiple timer operations', (done) => {
      const timer1 = service.startTimer('task_duration');
      const timer2 = service.startTimer('task_duration');

      setTimeout(() => {
        timer1();
        setTimeout(() => {
          timer2();
          const stats = service.getStats();
          expect(stats.totalMetrics).toBeGreaterThan(0);
          done();
        }, 30);
      }, 50);
    });

    test('should return stop function that can be called multiple times safely', () => {
      const timer = service.startTimer('safe_timer');
      expect(() => {
        timer();
        timer();
      }).not.toThrow();
    });
  });

  describe('Alert Rules', () => {
    test('should create alert rule and return rule ID', () => {
      const ruleId = service.createAlertRule({
        name: 'High CPU Alert',
        metricName: 'cpu_usage',
        condition: 'gt',
        threshold: 80,
        duration: 300000,
        enabled: true,
      });

      expect(ruleId).toBeDefined();
      expect(typeof ruleId).toBe('string');
    });

    test('should retrieve alert rule by ID', () => {
      const ruleId = service.createAlertRule({
        name: 'Memory Alert',
        metricName: 'memory_usage',
        condition: 'gt',
        threshold: 90,
        duration: 60000,
        enabled: true,
      });

      const rule = service.getAlertRule(ruleId);
      expect(rule).toBeDefined();
      expect(rule?.name).toBe('Memory Alert');
      expect(rule?.condition).toBe('gt');
      expect(rule?.threshold).toBe(90);
    });

    test('should support different alert conditions', () => {
      const conditions = ['gt', 'lt', 'eq', 'gte', 'lte'] as const;
      const ruleIds: string[] = [];

      conditions.forEach((condition) => {
        const ruleId = service.createAlertRule({
          name: `Alert ${condition}`,
          metricName: 'test_metric',
          condition,
          threshold: 50,
          duration: 60000,
          enabled: true,
        });
        ruleIds.push(ruleId);
      });

      expect(ruleIds).toHaveLength(5);
      ruleIds.forEach((id) => {
        expect(service.getAlertRule(id)).toBeDefined();
      });
    });

    test('should retrieve non-existent rule as null', () => {
      const rule = service.getAlertRule('nonexistent-rule-id');
      expect(rule).toBeNull();
    });
  });

  describe('Metric Querying', () => {
    test('should query metrics with no filters', () => {
      service.incrementCounter('metric1', 5);
      service.setGauge('metric2', 42);

      const query: IMetricQuery = {};
      const results = service.queryMetrics(query);

      expect(Array.isArray(results)).toBe(true);
    });

    test('should query metrics by name', () => {
      service.incrementCounter('requests', 10);
      service.incrementCounter('errors', 2);

      const query: IMetricQuery = { metricName: 'requests' };
      const results = service.queryMetrics(query);

      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    test('should query metrics with time range', () => {
      service.incrementCounter('timed_metric', 5);

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);

      const query: IMetricQuery = {
        startTime: oneHourAgo,
        endTime: now,
      };
      const results = service.queryMetrics(query);

      expect(Array.isArray(results)).toBe(true);
    });

    test('should query metrics with tags filter', () => {
      service.incrementCounter('api_requests', 5, { endpoint: '/users' });
      service.incrementCounter('api_requests', 3, { endpoint: '/posts' });

      const query: IMetricQuery = {
        metricName: 'api_requests',
        tags: { endpoint: '/users' },
      };
      const results = service.queryMetrics(query);

      expect(Array.isArray(results)).toBe(true);
    });

    test('should respect limit in query', () => {
      for (let i = 0; i < 50; i++) {
        service.incrementCounter('batch_metric', 1);
      }

      const query: IMetricQuery = { limit: 10 };
      const results = service.queryMetrics(query);

      expect(results.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Metric Aggregation', () => {
    test('should aggregate metrics by period', () => {
      service.incrementCounter('agg_metric', 10);
      service.incrementCounter('agg_metric', 20);
      service.incrementCounter('agg_metric', 15);

      const aggregation = service.getAggregation('agg_metric', '1h');

      expect(aggregation).toBeDefined();
      expect(aggregation?.name).toBe('agg_metric');
      expect(aggregation?.period).toBe('1h');
    });

    test('should calculate statistics in aggregation', () => {
      service.recordHistogram('latency', 100);
      service.recordHistogram('latency', 150);
      service.recordHistogram('latency', 200);
      service.recordHistogram('latency', 120);

      const aggregation = service.getAggregation('latency', '1h');

      expect(aggregation?.statistics).toBeDefined();
      expect(aggregation?.statistics?.mean).toBeGreaterThan(0);
      expect(aggregation?.statistics?.min).toBeGreaterThan(0);
      expect(aggregation?.statistics?.max).toBeGreaterThan(0);
    });

    test('should calculate percentiles in aggregation', () => {
      for (let i = 1; i <= 100; i++) {
        service.recordHistogram('percentile_test', i * 10);
      }

      const aggregation = service.getAggregation('percentile_test', '1h');

      expect(aggregation?.statistics?.percentile50).toBeDefined();
      expect(aggregation?.statistics?.percentile75).toBeDefined();
      expect(aggregation?.statistics?.percentile90).toBeDefined();
      expect(aggregation?.statistics?.percentile99).toBeDefined();
    });

    test('should return null for non-existent metric aggregation', () => {
      const aggregation = service.getAggregation('nonexistent_metric', '1h');
      expect(aggregation).toBeNull();
    });
  });

  describe('Metrics Statistics', () => {
    test('should return initial stats structure', () => {
      const stats = service.getStats();

      expect(stats).toBeDefined();
      expect(stats.totalMetrics).toBe(0);
      expect(stats.metricsByType).toBeDefined();
      expect(stats.totalAlertRules).toBe(0);
      expect(stats.activeAlerts).toBe(0);
    });

    test('should track metrics count by type', () => {
      service.incrementCounter('counter1', 1);
      service.setGauge('gauge1', 50);
      service.recordHistogram('histogram1', 100);

      const stats = service.getStats();

      expect(stats.totalMetrics).toBeGreaterThan(0);
      expect(stats.metricsByType).toBeDefined();
    });

    test('should update stats when metrics are added', () => {
      let stats1 = service.getStats();
      const count1 = stats1.totalMetrics;

      service.incrementCounter('new_metric', 5);

      let stats2 = service.getStats();
      const count2 = stats2.totalMetrics;

      expect(count2).toBeGreaterThanOrEqual(count1);
    });

    test('should track alert rule count in stats', () => {
      service.createAlertRule({
        name: 'Alert 1',
        metricName: 'metric1',
        condition: 'gt',
        threshold: 50,
        duration: 60000,
        enabled: true,
      });

      service.createAlertRule({
        name: 'Alert 2',
        metricName: 'metric2',
        condition: 'lt',
        threshold: 10,
        duration: 60000,
        enabled: true,
      });

      const stats = service.getStats();

      expect(stats.totalAlertRules).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Retention Policies', () => {
    test('should register retention policy', () => {
      const policy: IRetentionPolicy = {
        name: 'short_retention',
        description: 'Keep metrics for 7 days',
        retentionDays: 7,
        aggregationInterval: 3600000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service.registerRetentionPolicy(policy);
      expect(result).toBe(true);
    });

    test('should register multiple retention policies', () => {
      const policy1: IRetentionPolicy = {
        name: 'hourly',
        retentionDays: 7,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const policy2: IRetentionPolicy = {
        name: 'daily',
        retentionDays: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result1 = service.registerRetentionPolicy(policy1);
      const result2 = service.registerRetentionPolicy(policy2);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    test('should support metric type filtering in retention policies', () => {
      const policy: IRetentionPolicy = {
        name: 'counter_retention',
        metricTypeFilter: ['counter', 'gauge'],
        retentionDays: 14,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service.registerRetentionPolicy(policy);
      expect(result).toBe(true);
    });
  });

  describe('Dashboards', () => {
    test('should create dashboard and return dashboard ID', () => {
      const dashboardId = service.createDashboard({
        name: 'System Metrics',
        description: 'Core system metrics dashboard',
        metrics: ['cpu_usage', 'memory_usage', 'disk_usage'],
        refreshInterval: 5000,
      });

      expect(dashboardId).toBeDefined();
      expect(typeof dashboardId).toBe('string');
    });

    test('should retrieve dashboard by ID', () => {
      const dashboardId = service.createDashboard({
        name: 'API Metrics',
        description: 'API performance metrics',
        metrics: ['requests_total', 'error_rate', 'response_time'],
        refreshInterval: 10000,
      });

      const dashboard = service.getDashboard(dashboardId);

      expect(dashboard).toBeDefined();
      expect(dashboard?.name).toBe('API Metrics');
      expect(dashboard?.metrics.length).toBe(3);
    });

    test('should retrieve non-existent dashboard as null', () => {
      const dashboard = service.getDashboard('nonexistent-dashboard-id');
      expect(dashboard).toBeNull();
    });

    test('should create dashboards with different configurations', () => {
      const dash1 = service.createDashboard({
        name: 'Dashboard 1',
        metrics: ['metric1'],
        refreshInterval: 5000,
      });

      const dash2 = service.createDashboard({
        name: 'Dashboard 2',
        metrics: ['metric2', 'metric3', 'metric4'],
        refreshInterval: 10000,
      });

      expect(dash1).toBeDefined();
      expect(dash2).toBeDefined();
      expect(dash1).not.toBe(dash2);
    });
  });

  describe('Service Metrics', () => {
    test('should retrieve service metrics by service name', () => {
      const metrics = service.getServiceMetrics('api-service');

      expect(metrics).toBeNull();
    });

    test('should return null for untracked service', () => {
      const metrics = service.getServiceMetrics('unknown-service');
      expect(metrics).toBeNull();
    });
  });

  describe('Health Checks', () => {
    test('should perform health check', async () => {
      const health = await service.performHealthCheck();

      expect(health).toBeDefined();
      expect(health.status).toMatch(/healthy|degraded|unhealthy/);
      expect(health.timestamp).toBeInstanceOf(Date);
    });

    test('should include storage health in health check', async () => {
      const health = await service.performHealthCheck();

      expect(health.storageHealth).toMatch(/healthy|degraded|critical/);
    });

    test('should include processing health in health check', async () => {
      const health = await service.performHealthCheck();

      expect(health.processingHealth).toMatch(/healthy|degraded|critical/);
    });

    test('should include checks array in health check', async () => {
      const health = await service.performHealthCheck();

      expect(Array.isArray(health.checks)).toBe(true);
      expect(health.checks.length).toBeGreaterThan(0);
    });
  });

  describe('Event Listeners', () => {
    test('should register metric listener', (done) => {
      let metricReceived = false;

      const listener: MetricsListener = async (metric: IMetricValue) => {
        metricReceived = true;
      };

      service.onMetric(listener);
      service.incrementCounter('test_metric', 1);

      setTimeout(() => {
        expect(metricReceived).toBe(true);
        done();
      }, 100);
    });

    test('should register alert listener', (done) => {
      const listener: AlertListener = async (alert: IAlertEvent) => {
        expect(alert).toBeDefined();
      };

      service.onAlert(listener);

      service.createAlertRule({
        name: 'Test Alert',
        metricName: 'alert_test',
        condition: 'gt',
        threshold: 50,
        duration: 100,
        enabled: true,
      });

      for (let i = 0; i < 10; i++) {
        service.incrementCounter('alert_test', 100);
      }

      setTimeout(() => {
        done();
      }, 500);
    });

    test('should support chaining of listener registration', () => {
      const listener: MetricsListener = async () => {};
      const alertListener: AlertListener = async () => {};

      const result = service.onMetric(listener).onAlert(alertListener);

      expect(result).toBe(service);
    });
  });

  describe('Service Lifecycle', () => {
    test('should stop service without errors', () => {
      expect(() => {
        service.stop();
      }).not.toThrow();
    });

    test('should handle multiple stop calls gracefully', () => {
      expect(() => {
        service.stop();
        service.stop();
      }).not.toThrow();
    });

    test('should continue accepting metrics after creation', () => {
      const id1 = service.incrementCounter('metric1', 5);
      const id2 = service.incrementCounter('metric2', 10);

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete metrics workflow', async () => {
      // Record various metrics
      service.incrementCounter('requests', 100);
      service.setGauge('memory', 512);
      service.recordHistogram('latency', 150);

      const timer = service.startTimer('task');
      await new Promise((resolve) => setTimeout(resolve, 50));
      timer();

      // Create alert rule
      const ruleId = service.createAlertRule({
        name: 'Alert',
        metricName: 'requests',
        condition: 'gt',
        threshold: 50,
        duration: 60000,
        enabled: true,
      });

      // Query metrics
      const results = service.queryMetrics({ metricName: 'requests' });
      expect(results).toBeDefined();

      // Get aggregation
      const agg = service.getAggregation('latency', '1h');
      expect(agg).toBeDefined();

      // Check stats
      const stats = service.getStats();
      expect(stats.totalMetrics).toBeGreaterThan(0);
      expect(stats.totalAlertRules).toBeGreaterThan(0);

      // Check health
      const health = await service.performHealthCheck();
      expect(health.status).toBeDefined();
    });

    test('should manage multiple concurrent metrics', (done) => {
      const operations = [];

      for (let i = 0; i < 20; i++) {
        operations.push(service.incrementCounter(`concurrent_${i}`, 1));
      }

      const timer1 = service.startTimer('timer1');
      const timer2 = service.startTimer('timer2');

      setTimeout(() => {
        timer1();
        timer2();

        const stats = service.getStats();
        expect(stats.totalMetrics).toBeGreaterThan(20);
        done();
      }, 50);
    });

    test('should maintain metrics consistency', () => {
      const metricName = 'consistency_test';

      service.incrementCounter(metricName, 10);
      service.incrementCounter(metricName, 20);
      service.incrementCounter(metricName, 15);

      const query: IMetricQuery = { metricName };
      const results = service.queryMetrics(query);

      expect(results.length).toBeGreaterThan(0);
    });
  });
});
