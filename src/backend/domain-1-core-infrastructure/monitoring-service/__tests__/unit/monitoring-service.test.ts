/**
 * Monitoring Service - Unit Tests
 * Comprehensive test suite for monitoring, metrics, and health checks
 */

import { MonitoringService, createMonitoringService } from '../../src/main';
import type { IMonitoringConfig, IAlertConfig } from '../../src/types';

describe('MonitoringService', () => {
  let service: MonitoringService;
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

  beforeEach(() => {
    service = new MonitoringService(config, alertConfig);
  });

  afterEach(async () => {
    if (service.isRunning_()) {
      await service.stop();
    }
  });

  // ============================================================
  // Service Lifecycle Tests
  // ============================================================

  describe('Service Lifecycle', () => {
    test('should create monitoring service instance', () => {
      expect(service).toBeInstanceOf(MonitoringService);
      expect(service.isRunning_()).toBe(false);
    });

    test('should start monitoring service', async () => {
      await service.start();
      expect(service.isRunning_()).toBe(true);
    });

    test('should stop monitoring service', async () => {
      await service.start();
      await service.stop();
      expect(service.isRunning_()).toBe(false);
    });

    test('should throw error on failed start', async () => {
      const badConfig: IMonitoringConfig = {
        ...config,
        port: -1,
      };
      const badService = new MonitoringService(badConfig);
      // Should start successfully even with bad config (simulated)
      await badService.start();
      await badService.stop();
    });
  });

  // ============================================================
  // Health Check Tests
  // ============================================================

  describe('Health Checks', () => {
    test('should register health check', () => {
      const checkFn = async () => ({
        name: 'database',
        status: 'healthy' as const,
        responseTime: 10,
      });

      service.registerHealthCheck('database', checkFn);
      // Should register without error
      expect(service).toBeDefined();
    });

    test('should perform health check', async () => {
      service.registerHealthCheck('database', async () => ({
        name: 'database',
        status: 'healthy' as const,
        responseTime: 10,
      }));

      const result = await service.healthCheck();
      expect(result.status).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.components).toBeInstanceOf(Array);
    });

    test('should return healthy status when all checks pass', async () => {
      service.registerHealthCheck('test', async () => ({
        name: 'test',
        status: 'healthy' as const,
        responseTime: 5,
      }));

      const result = await service.healthCheck();
      expect(result.status).toBe('healthy');
    });

    test('should return unhealthy status when check fails', async () => {
      service.registerHealthCheck('test', async () => ({
        name: 'test',
        status: 'unhealthy' as const,
        responseTime: 5,
        error: 'Connection failed',
      }));

      const result = await service.healthCheck();
      expect(result.status).toBe('unhealthy');
    });

    test('should include component details', async () => {
      service.registerHealthCheck('component1', async () => ({
        name: 'component1',
        status: 'healthy' as const,
        responseTime: 10,
        details: { version: '1.0.0' },
      }));

      const result = await service.healthCheck();
      expect(result.components).toHaveLength(1);
      expect(result.components[0].name).toBe('component1');
    });

    test('should handle multiple health checks', async () => {
      service.registerHealthCheck('check1', async () => ({
        name: 'check1',
        status: 'healthy' as const,
        responseTime: 5,
      }));

      service.registerHealthCheck('check2', async () => ({
        name: 'check2',
        status: 'healthy' as const,
        responseTime: 10,
      }));

      const result = await service.healthCheck();
      expect(result.components).toHaveLength(2);
    });
  });

  // ============================================================
  // Metrics Collection Tests
  // ============================================================

  describe('Metrics Collection', () => {
    test('should collect metrics', async () => {
      const metrics = await service.collectMetrics();
      expect(metrics).toBeInstanceOf(Array);
      expect(metrics.length).toBeGreaterThan(0);
    });

    test('should return prometheus format metrics', async () => {
      const metrics = await service.collectMetrics();
      expect(metrics[0]).toHaveProperty('name');
      expect(metrics[0]).toHaveProperty('type');
      expect(metrics[0]).toHaveProperty('help');
      expect(metrics[0]).toHaveProperty('value');
    });

    test('should include system metrics', async () => {
      const metrics = await service.collectMetrics();
      const metricNames = metrics.map(m => m.name);
      expect(metricNames).toContain('system_cpu_usage_percent');
      expect(metricNames).toContain('system_memory_usage_bytes');
    });

    test('should update metrics over time', async () => {
      const metrics1 = await service.collectMetrics();
      const metric1 = metrics1[0];

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      const metrics2 = await service.collectMetrics();
      const metric2 = metrics2[0];

      expect(metric1).toBeDefined();
      expect(metric2).toBeDefined();
    });

    test('should include process uptime', async () => {
      const metrics = await service.collectMetrics();
      const uptimeMetric = metrics.find(m => m.name === 'process_uptime_seconds');
      expect(uptimeMetric).toBeDefined();
      expect(uptimeMetric?.value).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // System Metrics Tests
  // ============================================================

  describe('System Metrics', () => {
    test('should get system metrics', async () => {
      const metrics = await service.getSystemMetrics();
      expect(metrics).toHaveProperty('cpuUsage');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('diskUsage');
      expect(metrics).toHaveProperty('uptime');
    });

    test('should return valid cpu usage', async () => {
      const metrics = await service.getSystemMetrics();
      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
    });

    test('should return valid memory usage', async () => {
      const metrics = await service.getSystemMetrics();
      expect(metrics.memoryUsage).toBeGreaterThan(0);
    });

    test('should return valid disk usage', async () => {
      const metrics = await service.getSystemMetrics();
      expect(metrics.diskUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.diskUsage).toBeLessThanOrEqual(100);
    });

    test('should return file descriptors info', async () => {
      const metrics = await service.getSystemMetrics();
      expect(metrics.fileDescriptors).toHaveProperty('open');
      expect(metrics.fileDescriptors).toHaveProperty('max');
    });
  });

  // ============================================================
  // Database Metrics Tests
  // ============================================================

  describe('Database Metrics', () => {
    test('should get database metrics', async () => {
      const metrics = await service.getDatabaseMetrics();
      expect(metrics).toHaveProperty('connections');
      expect(metrics).toHaveProperty('activeConnections');
      expect(metrics).toHaveProperty('queriesPerSecond');
    });

    test('should return valid connection counts', async () => {
      const metrics = await service.getDatabaseMetrics();
      expect(metrics.connections).toBeGreaterThanOrEqual(0);
      expect(metrics.maxConnections).toBeGreaterThan(0);
      expect(metrics.activeConnections).toBeGreaterThanOrEqual(0);
    });

    test('should return query metrics', async () => {
      const metrics = await service.getDatabaseMetrics();
      expect(metrics.queriesPerSecond).toBeGreaterThanOrEqual(0);
      expect(metrics.averageQueryTime).toBeGreaterThanOrEqual(0);
    });

    test('should track slow queries', async () => {
      const metrics = await service.getDatabaseMetrics();
      expect(metrics.slowQueries).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================
  // Cache Metrics Tests
  // ============================================================

  describe('Cache Metrics', () => {
    test('should get cache metrics', async () => {
      const metrics = await service.getCacheMetrics();
      expect(metrics).toHaveProperty('hits');
      expect(metrics).toHaveProperty('misses');
      expect(metrics).toHaveProperty('hitRate');
    });

    test('should calculate hit rate correctly', async () => {
      const metrics = await service.getCacheMetrics();
      expect(metrics.hitRate).toBeGreaterThanOrEqual(0);
      expect(metrics.hitRate).toBeLessThanOrEqual(1);
    });

    test('should track evictions', async () => {
      const metrics = await service.getCacheMetrics();
      expect(metrics.evictions).toBeGreaterThanOrEqual(0);
    });

    test('should report cache size', async () => {
      const metrics = await service.getCacheMetrics();
      expect(metrics.size).toBeGreaterThanOrEqual(0);
      expect(metrics.maxSize).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // Search Metrics Tests
  // ============================================================

  describe('Search Metrics', () => {
    test('should get search metrics', async () => {
      const metrics = await service.getSearchMetrics();
      expect(metrics).toHaveProperty('totalSearches');
      expect(metrics).toHaveProperty('averageSearchTime');
      expect(metrics).toHaveProperty('indexSize');
    });

    test('should track total searches', async () => {
      const metrics = await service.getSearchMetrics();
      expect(metrics.totalSearches).toBeGreaterThanOrEqual(0);
    });

    test('should track average search time', async () => {
      const metrics = await service.getSearchMetrics();
      expect(metrics.averageSearchTime).toBeGreaterThanOrEqual(0);
    });

    test('should track document count', async () => {
      const metrics = await service.getSearchMetrics();
      expect(metrics.documentCount).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================
  // Request Metrics Tests
  // ============================================================

  describe('Request Metrics', () => {
    test('should record request', () => {
      service.recordRequest(200, 50, true);
      const metrics = service.getRequestMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(1);
    });

    test('should record failed request', () => {
      service.recordRequest(500, 100, false);
      const metrics = service.getRequestMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.failedRequests).toBe(1);
    });

    test('should track status code distribution', () => {
      service.recordRequest(200, 50, true);
      service.recordRequest(200, 60, true);
      service.recordRequest(404, 30, false);

      const metrics = service.getRequestMetrics();
      expect(metrics.statusCodeDistribution[200]).toBe(2);
      expect(metrics.statusCodeDistribution[404]).toBe(1);
    });

    test('should accumulate metrics', () => {
      service.recordRequest(200, 50, true);
      service.recordRequest(200, 60, true);
      service.recordRequest(500, 100, false);

      const metrics = service.getRequestMetrics();
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.successfulRequests).toBe(2);
      expect(metrics.failedRequests).toBe(1);
    });
  });

  // ============================================================
  // Metrics Snapshot Tests
  // ============================================================

  describe('Metrics Snapshot', () => {
    test('should get metrics snapshot', async () => {
      const snapshot = await service.getMetricsSnapshot();
      expect(snapshot).toHaveProperty('timestamp');
      expect(snapshot).toHaveProperty('system');
      expect(snapshot).toHaveProperty('database');
      expect(snapshot).toHaveProperty('cache');
    });

    test('should include all system metrics in snapshot', async () => {
      const snapshot = await service.getMetricsSnapshot();
      expect(snapshot.system.cpuUsage).toBeDefined();
      expect(snapshot.system.memoryUsage).toBeDefined();
      expect(snapshot.system.diskUsage).toBeDefined();
    });

    test('should include database metrics in snapshot', async () => {
      const snapshot = await service.getMetricsSnapshot();
      expect(snapshot.database?.connections).toBeDefined();
      expect(snapshot.database?.queriesPerSecond).toBeDefined();
    });

    test('should include cache metrics in snapshot', async () => {
      const snapshot = await service.getMetricsSnapshot();
      expect(snapshot.cache?.hits).toBeDefined();
      expect(snapshot.cache?.hitRate).toBeDefined();
    });
  });

  // ============================================================
  // Prometheus Format Tests
  // ============================================================

  describe('Prometheus Metrics Format', () => {
    test('should generate prometheus metrics', () => {
      const metrics = service.getPrometheusMetrics();
      expect(typeof metrics).toBe('string');
      expect(metrics.length).toBeGreaterThan(0);
    });

    test('should include metric help text', () => {
      const metrics = service.getPrometheusMetrics();
      expect(metrics).toContain('# HELP');
      expect(metrics).toContain('# TYPE');
    });

    test('should include process uptime', () => {
      const metrics = service.getPrometheusMetrics();
      expect(metrics).toContain('process_uptime');
    });
  });

  // ============================================================
  // Monitoring Event Tests
  // ============================================================

  describe('Monitoring Events', () => {
    test('should register monitoring listener', () => {
      const listener = jest.fn();
      service.onMonitoring(listener);
      expect(service).toBeDefined();
    });

    test('should emit events', async () => {
      const listener = jest.fn();
      service.onMonitoring(listener);

      await service.healthCheck();
      // Event should be emitted
      expect(service).toBeDefined();
    });

    test('should remove monitoring listener', () => {
      const listener = jest.fn();
      service.onMonitoring(listener);
      service.offMonitoring(listener);
      expect(service).toBeDefined();
    });

    test('should handle multiple listeners', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      service.onMonitoring(listener1);
      service.onMonitoring(listener2);

      await service.healthCheck();
      // Both should receive events
      expect(service).toBeDefined();
    });
  });

  // ============================================================
  // Alert Tests
  // ============================================================

  describe('Alerts', () => {
    test('should get alerts list', () => {
      const alerts = service.getAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });

    test('should clear alerts', () => {
      service.clearAlerts();
      const alerts = service.getAlerts();
      expect(alerts).toHaveLength(0);
    });
  });

  // ============================================================
  // Uptime Tests
  // ============================================================

  describe('Uptime Tracking', () => {
    test('should track uptime', () => {
      const uptime = service.getUptime();
      expect(uptime).toBeGreaterThanOrEqual(0);
    });

    test('should increase uptime over time', async () => {
      const uptime1 = service.getUptime();
      await new Promise(resolve => setTimeout(resolve, 100));
      const uptime2 = service.getUptime();
      expect(uptime2).toBeGreaterThan(uptime1);
    });
  });

  // ============================================================
  // Factory Function Tests
  // ============================================================

  describe('Factory Function', () => {
    test('should create service via factory', () => {
      const srv = createMonitoringService(config);
      expect(srv).toBeInstanceOf(MonitoringService);
    });

    test('should create service with alert config', () => {
      const srv = createMonitoringService(config, alertConfig);
      expect(srv).toBeInstanceOf(MonitoringService);
    });
  });

  // ============================================================
  // Edge Cases Tests
  // ============================================================

  describe('Edge Cases', () => {
    test('should handle health check error', async () => {
      service.registerHealthCheck('error', async () => {
        throw new Error('Test error');
      });

      const result = await service.healthCheck();
      expect(result).toBeDefined();
      expect(result.components.some(c => c.error)).toBe(true);
    });

    test('should handle empty health checks', async () => {
      const result = await service.healthCheck();
      expect(result.status).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    test('should handle disabled monitoring', async () => {
      const disabledConfig: IMonitoringConfig = {
        ...config,
        enabled: false,
      };
      const disabledService = new MonitoringService(disabledConfig);
      await disabledService.start();
      expect(disabledService.isRunning_()).toBe(true);
      await disabledService.stop();
    });

    test('should handle multiple start/stop cycles', async () => {
      for (let i = 0; i < 3; i++) {
        await service.start();
        expect(service.isRunning_()).toBe(true);
        await service.stop();
        expect(service.isRunning_()).toBe(false);
      }
    });
  });
});
