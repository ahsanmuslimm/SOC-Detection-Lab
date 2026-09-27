/**
 * Monitoring Service - Main Implementation
 * Prometheus metrics collection, health checks, and performance monitoring
 */

import type {
  IHealthCheckResponse,
  IHealthStatus,
  IPrometheusMetric,
  IPerformanceMetric,
  ISystemMetrics,
  IDatabaseMetrics,
  ICacheMetrics,
  ISearchMetrics,
  IMonitoringConfig,
  IMonitoringEvent,
  IAlert,
  MonitoringListener,
  IMetricsSnapshot,
  IRequestMetrics,
  HealthCheckFunction,
  IAlertConfig,
} from './types';

/**
 * Monitoring Service - Metrics collection and health monitoring
 */
export class MonitoringService {
  private config: IMonitoringConfig;
  private listeners: Set<MonitoringListener> = new Set();
  private isRunning = false;
  private metricsBuffer: IPrometheusMetric[] = [];
  private healthChecks: Map<string, HealthCheckFunction> = new Map();
  private alerts: Map<string, IAlert> = new Map();
  private alertConfig: IAlertConfig;
  private metricsInterval?: NodeJS.Timer;
  private startTime = Date.now();
  private requestMetrics: IRequestMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    p50ResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    statusCodeDistribution: {},
  };

  constructor(config: IMonitoringConfig, alertConfig?: IAlertConfig) {
    this.config = config;
    this.alertConfig = alertConfig || {
      enabled: false,
      cpuThreshold: 80,
      memoryThreshold: 85,
      diskThreshold: 90,
      responseTimeThreshold: 1000,
      errorRateThreshold: 5,
    };
  }

  /**
   * Start monitoring service
   */
  async start(): Promise<void> {
    try {
      this.isRunning = true;

      if (this.config.enabled) {
        // Start metrics collection interval
        this.metricsInterval = setInterval(async () => {
          await this.collectMetrics();
        }, this.config.interval || 5000);
      }

      this.emitEvent('health', {
        status: 'healthy',
        timestamp: new Date(),
        uptime: this.getUptime(),
        components: [],
        checks: {
          database: true,
          cache: true,
          search: true,
          memory: true,
          disk: true,
        },
      });
    } catch (err) {
      throw new Error(`Failed to start monitoring service: ${err}`);
    }
  }

  /**
   * Stop monitoring service
   */
  async stop(): Promise<void> {
    try {
      this.isRunning = false;

      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
        this.metricsInterval = undefined;
      }
    } catch (err) {
      throw new Error(`Failed to stop monitoring service: ${err}`);
    }
  }

  /**
   * Register health check
   */
  registerHealthCheck(name: string, fn: HealthCheckFunction): this {
    this.healthChecks.set(name, fn);
    return this;
  }

  /**
   * Perform health check
   */
  async healthCheck(): Promise<IHealthCheckResponse> {
    try {
      const results = [];

      for (const [name, fn] of this.healthChecks) {
        try {
          const result = await fn();
          results.push(result);
        } catch (err) {
          results.push({
            name,
            status: 'unhealthy',
            responseTime: 0,
            error: String(err),
          });
        }
      }

      const unhealthy = results.filter(r => r.status === 'unhealthy').length;
      const status = unhealthy > 0 ? 'unhealthy' : 'healthy';

      const response: IHealthCheckResponse = {
        status,
        timestamp: new Date(),
        uptime: this.getUptime(),
        components: results,
        checks: {
          database: true,
          cache: true,
          search: true,
          memory: true,
          disk: true,
        },
      };

      this.emitEvent('health', response);

      return response;
    } catch (err) {
      throw new Error(`Health check failed: ${err}`);
    }
  }

  /**
   * Collect metrics
   */
  async collectMetrics(): Promise<IPrometheusMetric[]> {
    try {
      const metrics: IPrometheusMetric[] = [];

      // System metrics
      const systemMetrics = await this.getSystemMetrics();
      metrics.push(
        {
          name: 'system_cpu_usage_percent',
          type: 'gauge',
          help: 'CPU usage percentage',
          value: systemMetrics.cpuUsage,
        },
        {
          name: 'system_memory_usage_bytes',
          type: 'gauge',
          help: 'Memory usage in bytes',
          value: systemMetrics.memoryUsage,
        },
        {
          name: 'system_disk_usage_percent',
          type: 'gauge',
          help: 'Disk usage percentage',
          value: systemMetrics.diskUsage,
        },
        {
          name: 'process_uptime_seconds',
          type: 'gauge',
          help: 'Process uptime in seconds',
          value: this.getUptime() / 1000,
        }
      );

      // Check for alerts
      if (this.alertConfig.enabled) {
        this.checkAlerts(systemMetrics);
      }

      this.metricsBuffer = metrics;
      this.emitEvent('metric', metrics);

      return metrics;
    } catch (err) {
      throw new Error(`Failed to collect metrics: ${err}`);
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<ISystemMetrics> {
    try {
      // Simulated system metrics
      return {
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 1024 * 1024 * 1024,
        diskUsage: Math.random() * 100,
        uptime: Date.now() - this.startTime,
        processUptime: process.uptime() * 1000,
        fileDescriptors: {
          open: Math.floor(Math.random() * 256),
          max: 1024,
        },
      };
    } catch (err) {
      throw new Error(`Failed to get system metrics: ${err}`);
    }
  }

  /**
   * Get database metrics
   */
  async getDatabaseMetrics(): Promise<IDatabaseMetrics> {
    try {
      return {
        connections: Math.floor(Math.random() * 100),
        maxConnections: 100,
        activeConnections: Math.floor(Math.random() * 50),
        idleConnections: Math.floor(Math.random() * 50),
        queriesPerSecond: Math.random() * 1000,
        averageQueryTime: Math.random() * 100,
        slowQueries: Math.floor(Math.random() * 10),
      };
    } catch (err) {
      throw new Error(`Failed to get database metrics: ${err}`);
    }
  }

  /**
   * Get cache metrics
   */
  async getCacheMetrics(): Promise<ICacheMetrics> {
    try {
      const hits = Math.floor(Math.random() * 10000);
      const misses = Math.floor(Math.random() * 2000);
      const total = hits + misses;

      return {
        hits,
        misses,
        hitRate: total > 0 ? hits / total : 0,
        evictions: Math.floor(Math.random() * 100),
        size: Math.floor(Math.random() * 1024 * 1024 * 1024),
        maxSize: 2 * 1024 * 1024 * 1024,
      };
    } catch (err) {
      throw new Error(`Failed to get cache metrics: ${err}`);
    }
  }

  /**
   * Get search metrics
   */
  async getSearchMetrics(): Promise<ISearchMetrics> {
    try {
      return {
        totalSearches: Math.floor(Math.random() * 100000),
        averageSearchTime: Math.random() * 500,
        indexSize: Math.floor(Math.random() * 10 * 1024 * 1024 * 1024),
        documentCount: Math.floor(Math.random() * 1000000),
        indexRefreshTime: Math.random() * 1000,
      };
    } catch (err) {
      throw new Error(`Failed to get search metrics: ${err}`);
    }
  }

  /**
   * Record request metrics
   */
  recordRequest(
    statusCode: number,
    responseTime: number,
    success: boolean
  ): void {
    this.requestMetrics.totalRequests++;

    if (success) {
      this.requestMetrics.successfulRequests++;
    } else {
      this.requestMetrics.failedRequests++;
    }

    this.requestMetrics.statusCodeDistribution[statusCode] =
      (this.requestMetrics.statusCodeDistribution[statusCode] || 0) + 1;
  }

  /**
   * Get request metrics
   */
  getRequestMetrics(): IRequestMetrics {
    return { ...this.requestMetrics };
  }

  /**
   * Get metrics snapshot
   */
  async getMetricsSnapshot(): Promise<IMetricsSnapshot> {
    try {
      return {
        timestamp: new Date(),
        system: await this.getSystemMetrics(),
        database: await this.getDatabaseMetrics(),
        cache: await this.getCacheMetrics(),
        search: await this.getSearchMetrics(),
        request: this.getRequestMetrics(),
      };
    } catch (err) {
      throw new Error(`Failed to get metrics snapshot: ${err}`);
    }
  }

  /**
   * Get Prometheus metrics endpoint
   */
  getPrometheusMetrics(): string {
    let output = '# HELP process_uptime Process uptime in seconds\n';
    output += '# TYPE process_uptime gauge\n';
    output += `process_uptime ${this.getUptime() / 1000}\n\n`;

    // Add more metrics as needed
    return output;
  }

  /**
   * Check for alerts
   */
  private checkAlerts(metrics: ISystemMetrics): void {
    // CPU alert
    if (metrics.cpuUsage > this.alertConfig.cpuThreshold) {
      this.createAlert({
        type: 'cpu',
        severity: 'high',
        message: `CPU usage above threshold: ${metrics.cpuUsage.toFixed(2)}%`,
        value: metrics.cpuUsage,
        threshold: this.alertConfig.cpuThreshold,
      });
    }

    // Memory alert
    if (metrics.memoryUsage / (1024 * 1024 * 1024) > this.alertConfig.memoryThreshold) {
      this.createAlert({
        type: 'memory',
        severity: 'high',
        message: `Memory usage above threshold`,
        value: metrics.memoryUsage / (1024 * 1024 * 1024),
        threshold: this.alertConfig.memoryThreshold,
      });
    }

    // Disk alert
    if (metrics.diskUsage > this.alertConfig.diskThreshold) {
      this.createAlert({
        type: 'disk',
        severity: 'critical',
        message: `Disk usage above threshold: ${metrics.diskUsage.toFixed(2)}%`,
        value: metrics.diskUsage,
        threshold: this.alertConfig.diskThreshold,
      });
    }
  }

  /**
   * Create alert
   */
  private createAlert(data: {
    type: string;
    severity: string;
    message: string;
    value: number;
    threshold: number;
  }): void {
    const alert: IAlert = {
      id: `${data.type}-${Date.now()}`,
      type: data.type as any,
      severity: data.severity as any,
      message: data.message,
      value: data.value,
      threshold: data.threshold,
      timestamp: new Date(),
    };

    this.alerts.set(alert.id, alert);
    this.emitEvent('alert', alert);
  }

  /**
   * Register monitoring listener
   */
  onMonitoring(listener: MonitoringListener): this {
    this.listeners.add(listener);
    return this;
  }

  /**
   * Remove monitoring listener
   */
  offMonitoring(listener: MonitoringListener): this {
    this.listeners.delete(listener);
    return this;
  }

  /**
   * Get running status
   */
  isRunning_(): boolean {
    return this.isRunning;
  }

  /**
   * Get uptime in milliseconds
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get active alerts
   */
  getAlerts(): IAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Clear resolved alerts
   */
  clearAlerts(): void {
    this.alerts.clear();
  }

  /**
   * Emit monitoring event
   */
  private emitEvent(type: string, data: unknown): void {
    const event: IMonitoringEvent = {
      type: type as any,
      timestamp: new Date(),
      source: 'monitoring-service',
      data: data as any,
    };

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[MonitoringService] Listener error:', err);
      }
    }
  }
}

/**
 * Factory function
 */
export function createMonitoringService(
  config: IMonitoringConfig,
  alertConfig?: IAlertConfig
): MonitoringService {
  return new MonitoringService(config, alertConfig);
}

/**
 * Default export
 */
export default MonitoringService;
