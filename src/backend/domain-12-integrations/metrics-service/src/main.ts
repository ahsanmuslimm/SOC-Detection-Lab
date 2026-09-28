/**
 * Metrics Service - Main Implementation
 * Comprehensive metrics collection, aggregation, and monitoring with alerting
 */

import crypto from 'crypto';
import {
  MetricType,
  IMetricValue,
  ICounterMetric,
  IGaugeMetric,
  IHistogramMetric,
  ISummaryMetric,
  ITimerMetric,
  IMetricQuery,
  IMetricAggregation,
  IAlertRule,
  IAlertEvent,
  IMetricsStats,
  IRetentionPolicy,
  ICustomMetric,
  IMetricDashboard,
  IHealthMetric,
  IServiceMetrics,
  MetricsListener,
  AlertListener,
  IMetricsServiceConfig,
  IMetricsHealthCheck,
  IMetricBatchOperation,
} from './types';

/**
 * Metrics Service
 * Comprehensive metrics collection with alerting and monitoring
 */
export class MetricsService {
  private config: IMetricsServiceConfig;
  private counters: Map<string, ICounterMetric> = new Map();
  private gauges: Map<string, IGaugeMetric> = new Map();
  private histograms: Map<string, IHistogramMetric> = new Map();
  private timers: Map<string, ITimerMetric[]> = new Map();
  private values: Map<string, IMetricValue[]> = new Map();
  private alertRules: Map<string, IAlertRule> = new Map();
  private alerts: Map<string, IAlertEvent> = new Map();
  private retentionPolicies: Map<string, IRetentionPolicy> = new Map();
  private customMetrics: Map<string, ICustomMetric> = new Map();
  private dashboards: Map<string, IMetricDashboard> = new Map();
  private metricsListeners: Set<MetricsListener> = new Set();
  private alertListeners: Set<AlertListener> = new Set();
  private stats: IMetricsStats;
  private cleanupIntervalId: NodeJS.Timeout | null = null;
  private alertCheckIntervalId: NodeJS.Timeout | null = null;
  private exportIntervalId: NodeJS.Timeout | null = null;

  /**
   * Constructor
   */
  constructor(config: IMetricsServiceConfig) {
    this.config = this.validateConfig(config);
    this.stats = this.initializeStats();
    this.startCleanupInterval();
    this.startAlertCheckInterval();
    if (this.config.enableExport) {
      this.startExportInterval();
    }
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: IMetricsServiceConfig): IMetricsServiceConfig {
    if (!config.enableMetrics) {
      console.warn('Metrics service is disabled');
    }
    return config;
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): IMetricsStats {
    return {
      totalMetrics: 0,
      metricsByType: { counter: 0, gauge: 0, histogram: 0, summary: 0, timer: 0 },
      metricsLastHour: 0,
      metricsLastDay: 0,
      totalAlertRules: 0,
      activeAlerts: 0,
      alertEvents: 0,
    };
  }

  /**
   * Record counter metric
   */
  public incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): string {
    const metricId = this.generateMetricId();

    let metric = Array.from(this.counters.values()).find((m) => m.name === name);

    if (!metric) {
      metric = {
        metricId,
        name,
        value,
        unit: 'count',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags,
      };
      this.counters.set(metricId, metric);
      this.stats.metricsByType.counter++;
    } else {
      metric.value += value;
      metric.updatedAt = new Date();
    }

    this.recordValue(name, value, tags);
    this.stats.totalMetrics++;

    return metricId;
  }

  /**
   * Record gauge metric
   */
  public setGauge(name: string, value: number, tags?: Record<string, string>): string {
    const metricId = this.generateMetricId();

    let metric = Array.from(this.gauges.values()).find((m) => m.name === name);

    if (!metric) {
      metric = {
        metricId,
        name,
        value,
        unit: 'count',
        min: value,
        max: value,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags,
      };
      this.gauges.set(metricId, metric);
      this.stats.metricsByType.gauge++;
    } else {
      metric.value = value;
      metric.min = Math.min(metric.min || value, value);
      metric.max = Math.max(metric.max || value, value);
      metric.updatedAt = new Date();
    }

    this.recordValue(name, value, tags);
    this.stats.totalMetrics++;

    return metricId;
  }

  /**
   * Record histogram metric
   */
  public recordHistogram(
    name: string,
    value: number,
    buckets: number[] = [10, 25, 50, 75, 90, 99],
    tags?: Record<string, string>,
  ): string {
    const metricId = this.generateMetricId();

    let metric = Array.from(this.histograms.values()).find((m) => m.name === name);

    if (!metric) {
      const bucketMap: Record<number, number> = {};
      buckets.forEach((b) => (bucketMap[b] = 0));

      metric = {
        metricId,
        name,
        unit: 'milliseconds',
        buckets: bucketMap,
        sum: 0,
        count: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags,
      };
      this.histograms.set(metricId, metric);
      this.stats.metricsByType.histogram++;
    }

    metric.sum += value;
    metric.count++;

    // Update bucket counts
    for (const bucket of Object.keys(metric.buckets)) {
      if (value <= parseInt(bucket, 10)) {
        metric.buckets[parseInt(bucket, 10)]++;
      }
    }

    metric.updatedAt = new Date();

    this.recordValue(name, value, tags);
    this.stats.totalMetrics++;

    return metricId;
  }

  /**
   * Record timer metric
   */
  public startTimer(operationName: string): () => void {
    const startTime = Date.now();

    return (status: 'success' | 'failure' = 'success') => {
      const duration = Date.now() - startTime;

      const timer: ITimerMetric = {
        metricId: this.generateMetricId(),
        operationName,
        duration,
        unit: 'milliseconds',
        status,
        timestamp: new Date(),
      };

      if (!this.timers.has(operationName)) {
        this.timers.set(operationName, []);
        this.stats.metricsByType.timer++;
      }

      this.timers.get(operationName)!.push(timer);

      this.recordValue(operationName, duration);
      this.stats.totalMetrics++;

      this.emitMetricEvent({
        timestamp: new Date(),
        value: duration,
        tags: { operation: operationName, status },
      });
    };
  }

  /**
   * Record metric value
   */
  private recordValue(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.values.has(name)) {
      this.values.set(name, []);
    }

    const metricValue: IMetricValue = {
      timestamp: new Date(),
      value,
      tags,
    };

    this.values.get(name)!.push(metricValue);
  }

  /**
   * Create alert rule
   */
  public createAlertRule(rule: Omit<IAlertRule, 'ruleId' | 'createdAt' | 'updatedAt'>): string {
    const ruleId = this.generateRuleId();

    const alertRule: IAlertRule = {
      ...rule,
      ruleId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.alertRules.set(ruleId, alertRule);
    this.stats.totalAlertRules++;

    return ruleId;
  }

  /**
   * Get alert rule
   */
  public getAlertRule(ruleId: string): IAlertRule | null {
    return this.alertRules.get(ruleId) || null;
  }

  /**
   * Query metrics
   */
  public queryMetrics(query: IMetricQuery): IMetricValue[] {
    let results: IMetricValue[] = [];

    if (query.metricName && this.values.has(query.metricName)) {
      results = [...(this.values.get(query.metricName) || [])];
    } else {
      // Return all values
      Array.from(this.values.values()).forEach((vals) => {
        results.push(...vals);
      });
    }

    if (query.startTime) {
      results = results.filter((m) => m.timestamp >= query.startTime!);
    }

    if (query.endTime) {
      results = results.filter((m) => m.timestamp <= query.endTime!);
    }

    if (query.tags) {
      results = results.filter((m) =>
        Object.entries(query.tags!).every(([k, v]) => m.tags?.[k] === v),
      );
    }

    const limit = Math.min(query.limit || 1000, this.config.maxMetricsPerQuery);
    return results.slice(0, limit);
  }

  /**
   * Get aggregation
   */
  public getAggregation(name: string, period: string = '1h'): IMetricAggregation | null {
    const values = this.values.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    // Filter values by period
    const periodMs = this.parsePeriod(period);
    const cutoffTime = Date.now() - periodMs;
    const filtered = values.filter((v) => v.timestamp.getTime() >= cutoffTime);

    if (filtered.length === 0) {
      return null;
    }

    const sorted = filtered.map((v) => v.value).sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / sorted.length;
    const variance = sorted.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / sorted.length;

    return {
      name,
      type: 'gauge',
      period: period as any,
      values: filtered,
      statistics: {
        sum,
        count: sorted.length,
        mean,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        percentile50: this.getPercentile(sorted, 50),
        percentile75: this.getPercentile(sorted, 75),
        percentile90: this.getPercentile(sorted, 90),
        percentile99: this.getPercentile(sorted, 99),
      },
    };
  }

  /**
   * Get statistics
   */
  public getStats(): IMetricsStats {
    this.stats.totalMetrics = this.counters.size + this.gauges.size + this.histograms.size;

    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;

    this.stats.metricsLastHour = Array.from(this.values.values())
      .flat()
      .filter((m) => m.timestamp.getTime() >= oneHourAgo).length;

    this.stats.metricsLastDay = Array.from(this.values.values())
      .flat()
      .filter((m) => m.timestamp.getTime() >= oneDayAgo).length;

    this.stats.activeAlerts = Array.from(this.alerts.values()).filter((a) => !a.acknowledged)
      .length;

    return { ...this.stats };
  }

  /**
   * Register retention policy
   */
  public registerRetentionPolicy(policy: IRetentionPolicy): boolean {
    if (this.retentionPolicies.has(policy.name)) {
      return false;
    }

    this.retentionPolicies.set(policy.name, policy);
    return true;
  }

  /**
   * Create dashboard
   */
  public createDashboard(
    name: string,
    metrics: string[],
    refreshInterval: number = 60000,
  ): string {
    const dashboardId = this.generateDashboardId();

    const dashboard: IMetricDashboard = {
      dashboardId,
      name,
      metrics,
      refreshInterval,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dashboards.set(dashboardId, dashboard);
    return dashboardId;
  }

  /**
   * Get dashboard
   */
  public getDashboard(dashboardId: string): IMetricDashboard | null {
    return this.dashboards.get(dashboardId) || null;
  }

  /**
   * Get service metrics
   */
  public getServiceMetrics(service: string): IServiceMetrics | null {
    const values = Array.from(this.values.values()).flat();
    if (values.length === 0) {
      return null;
    }

    const sorted = values.map((v) => v.value).sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / sorted.length;

    return {
      service,
      timestamp: new Date(),
      requestCount: this.stats.metricsLastHour,
      errorCount: 0,
      successCount: this.stats.metricsLastHour,
      avgResponseTime: mean,
      p50ResponseTime: this.getPercentile(sorted, 50),
      p95ResponseTime: this.getPercentile(sorted, 95),
      p99ResponseTime: this.getPercentile(sorted, 99),
      throughput: this.stats.metricsLastHour / 3600,
      errorRate: 0,
      uptime: process.uptime(),
    };
  }

  /**
   * Perform health check
   */
  public async performHealthCheck(): Promise<IMetricsHealthCheck> {
    return {
      status: 'healthy',
      timestamp: new Date(),
      storageHealth: this.counters.size < 100000 ? 'healthy' : 'degraded',
      processingHealth: this.values.size < 10000 ? 'healthy' : 'degraded',
      checks: [
        {
          name: 'counters',
          status: this.counters.size > 0 ? 'healthy' : 'degraded',
          message: `${this.counters.size} counters`,
        },
        {
          name: 'gauges',
          status: this.gauges.size > 0 ? 'healthy' : 'degraded',
          message: `${this.gauges.size} gauges`,
        },
        {
          name: 'alerts',
          status: this.stats.activeAlerts < 100 ? 'healthy' : 'degraded',
          message: `${this.stats.activeAlerts} active alerts`,
        },
      ],
    };
  }

  /**
   * Add metrics listener
   */
  public onMetric(listener: MetricsListener): this {
    this.metricsListeners.add(listener);
    return this;
  }

  /**
   * Add alert listener
   */
  public onAlert(listener: AlertListener): this {
    this.alertListeners.add(listener);
    return this;
  }

  /**
   * Check alerts
   */
  private checkAlerts(): void {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      const values = this.values.get(rule.metricName) || [];
      const recent = values.filter(
        (v) => v.timestamp.getTime() > Date.now() - rule.duration,
      );

      if (recent.length === 0) continue;

      const lastValue = recent[recent.length - 1].value;
      let triggered = false;

      switch (rule.condition) {
        case 'gt':
          triggered = lastValue > rule.threshold;
          break;
        case 'lt':
          triggered = lastValue < rule.threshold;
          break;
        case 'eq':
          triggered = lastValue === rule.threshold;
          break;
        case 'gte':
          triggered = lastValue >= rule.threshold;
          break;
        case 'lte':
          triggered = lastValue <= rule.threshold;
          break;
      }

      if (triggered) {
        const alert: IAlertEvent = {
          alertId: this.generateAlertId(),
          ruleId: rule.ruleId,
          timestamp: new Date(),
          metricValue: lastValue,
          threshold: rule.threshold,
          severity: this.calculateSeverity(Math.abs(lastValue - rule.threshold)),
          message: `${rule.name}: ${lastValue} ${rule.condition} ${rule.threshold}`,
          acknowledged: false,
        };

        this.alerts.set(alert.alertId, alert);
        this.stats.alertEvents++;
        this.emitAlertEvent(alert);
      }
    }
  }

  /**
   * Emit metric event
   */
  private emitMetricEvent(value: IMetricValue): void {
    for (const listener of this.metricsListeners) {
      try {
        listener(value);
      } catch (error) {
        // Ignore
      }
    }
  }

  /**
   * Emit alert event
   */
  private emitAlertEvent(alert: IAlertEvent): void {
    for (const listener of this.alertListeners) {
      try {
        listener(alert);
      } catch (error) {
        // Ignore
      }
    }
  }

  /**
   * Parse period string
   */
  private parsePeriod(period: string): number {
    switch (period) {
      case '1m':
        return 60000;
      case '5m':
        return 300000;
      case '15m':
        return 900000;
      case '1h':
        return 3600000;
      case '24h':
        return 86400000;
      default:
        return 3600000;
    }
  }

  /**
   * Get percentile
   */
  private getPercentile(sorted: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }

  /**
   * Calculate severity
   */
  private calculateSeverity(deviation: number): 'low' | 'medium' | 'high' | 'critical' {
    if (deviation > 1000) return 'critical';
    if (deviation > 500) return 'high';
    if (deviation > 100) return 'medium';
    return 'low';
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupIntervalId = setInterval(() => {
      this.cleanup();
    }, 3600000);
  }

  /**
   * Start alert check interval
   */
  private startAlertCheckInterval(): void {
    this.alertCheckIntervalId = setInterval(() => {
      this.checkAlerts();
    }, 60000);
  }

  /**
   * Start export interval
   */
  private startExportInterval(): void {
    this.exportIntervalId = setInterval(() => {
      this.export();
    }, this.config.exportInterval);
  }

  /**
   * Cleanup old metrics
   */
  private cleanup(): void {
    const now = Date.now();

    for (const policy of this.retentionPolicies.values()) {
      if (!policy.isActive) continue;

      const cutoffTime = now - policy.retentionDays * 24 * 60 * 60 * 1000;

      for (const [name, values] of this.values.entries()) {
        this.values.set(
          name,
          values.filter((v) => v.timestamp.getTime() >= cutoffTime),
        );
      }
    }
  }

  /**
   * Export metrics
   */
  private export(): void {
    // Export to configured exporters (Prometheus, Graphite, etc.)
  }

  /**
   * Stop service
   */
  public stop(): void {
    if (this.cleanupIntervalId) clearInterval(this.cleanupIntervalId);
    if (this.alertCheckIntervalId) clearInterval(this.alertCheckIntervalId);
    if (this.exportIntervalId) clearInterval(this.exportIntervalId);
  }

  /**
   * Generate IDs
   */
  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDashboardId(): string {
    return `dash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory function
 */
export function createMetricsService(config: IMetricsServiceConfig): MetricsService {
  return new MetricsService(config);
}
