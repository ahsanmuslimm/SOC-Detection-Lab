/**
 * Metrics Service - Type Definitions
 * Comprehensive metrics collection, aggregation, and monitoring
 */

/**
 * Metric type
 */
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary' | 'timer';

/**
 * Metric unit
 */
export type MetricUnit =
  | 'count'
  | 'bytes'
  | 'milliseconds'
  | 'seconds'
  | 'percentage'
  | 'requests'
  | 'errors'
  | 'throughput';

/**
 * Aggregation period
 */
export type AggregationPeriod = '1m' | '5m' | '15m' | '1h' | '24h' | 'all';

/**
 * Metric value
 */
export interface IMetricValue {
  timestamp: Date;
  value: number;
  tags?: Record<string, string>;
  labels?: Record<string, string>;
}

/**
 * Counter metric
 */
export interface ICounterMetric {
  metricId: string;
  name: string;
  description?: string;
  value: number;
  unit: MetricUnit;
  createdAt: Date;
  updatedAt: Date;
  tags?: Record<string, string>;
}

/**
 * Gauge metric
 */
export interface IGaugeMetric {
  metricId: string;
  name: string;
  description?: string;
  value: number;
  unit: MetricUnit;
  min?: number;
  max?: number;
  createdAt: Date;
  updatedAt: Date;
  tags?: Record<string, string>;
}

/**
 * Histogram metric
 */
export interface IHistogramMetric {
  metricId: string;
  name: string;
  description?: string;
  unit: MetricUnit;
  buckets: Record<number, number>;
  sum: number;
  count: number;
  createdAt: Date;
  updatedAt: Date;
  tags?: Record<string, string>;
}

/**
 * Summary metric
 */
export interface ISummaryMetric {
  metricId: string;
  name: string;
  description?: string;
  unit: MetricUnit;
  sum: number;
  count: number;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  percentiles: Record<number, number>;
  createdAt: Date;
  updatedAt: Date;
  tags?: Record<string, string>;
}

/**
 * Timer metric
 */
export interface ITimerMetric {
  metricId: string;
  operationName: string;
  duration: number;
  unit: MetricUnit;
  status: 'success' | 'failure';
  timestamp: Date;
  tags?: Record<string, string>;
}

/**
 * Metric query
 */
export interface IMetricQuery {
  metricName?: string;
  metricType?: MetricType;
  startTime?: Date;
  endTime?: Date;
  tags?: Record<string, string>;
  aggregationPeriod?: AggregationPeriod;
  limit?: number;
}

/**
 * Metric aggregation result
 */
export interface IMetricAggregation {
  name: string;
  type: MetricType;
  period: AggregationPeriod;
  values: IMetricValue[];
  statistics?: {
    sum: number;
    count: number;
    mean: number;
    min: number;
    max: number;
    percentile50: number;
    percentile75: number;
    percentile90: number;
    percentile99: number;
  };
}

/**
 * Alert rule
 */
export interface IAlertRule {
  ruleId: string;
  name: string;
  description?: string;
  metricName: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number; // milliseconds
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Alert event
 */
export interface IAlertEvent {
  alertId: string;
  ruleId: string;
  timestamp: Date;
  metricValue: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

/**
 * Metrics statistics
 */
export interface IMetricsStats {
  totalMetrics: number;
  metricsByType: Record<MetricType, number>;
  metricsLastHour: number;
  metricsLastDay: number;
  totalAlertRules: number;
  activeAlerts: number;
  alertEvents: number;
}

/**
 * Retention policy
 */
export interface IRetentionPolicy {
  name: string;
  description?: string;
  metricTypeFilter?: MetricType[];
  retentionDays: number;
  aggregationInterval?: number; // milliseconds
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Custom metric
 */
export interface ICustomMetric {
  metricId: string;
  name: string;
  type: MetricType;
  unit: MetricUnit;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

/**
 * Metric dashboard
 */
export interface IMetricDashboard {
  dashboardId: string;
  name: string;
  description?: string;
  metrics: string[];
  refreshInterval: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Health metric
 */
export interface IHealthMetric {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIO: number;
  processCount: number;
  errorRate: number;
  responseTime: number;
  throughput: number;
}

/**
 * Service metrics
 */
export interface IServiceMetrics {
  service: string;
  timestamp: Date;
  requestCount: number;
  errorCount: number;
  successCount: number;
  avgResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errorRate: number;
  uptime: number;
}

/**
 * Exporter configuration
 */
export interface IExporterConfig {
  type: 'prometheus' | 'graphite' | 'influxdb' | 'custom';
  enabled: boolean;
  interval: number;
  url?: string;
  credentials?: {
    username?: string;
    password?: string;
  };
}

/**
 * Metrics listener
 */
export type MetricsListener = (metric: IMetricValue) => Promise<void> | void;

/**
 * Alert listener
 */
export type AlertListener = (alert: IAlertEvent) => Promise<void> | void;

/**
 * Metrics service configuration
 */
export interface IMetricsServiceConfig {
  enableMetrics: boolean;
  enableAlerts: boolean;
  enableExport: boolean;
  exportInterval: number;
  retentionDays: number;
  maxMetricsPerQuery: number;
  enableCompression: boolean;
  enableEncryption: boolean;
  exporters: IExporterConfig[];
}

/**
 * Metrics health check
 */
export interface IMetricsHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  storageHealth: 'healthy' | 'degraded' | 'critical';
  processingHealth: 'healthy' | 'degraded' | 'critical';
  checks: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
  }>;
}

/**
 * Metric batch operation
 */
export interface IMetricBatchOperation {
  operationId: string;
  timestamp: Date;
  itemCount: number;
  successCount: number;
  failureCount: number;
  duration: number;
  status: 'success' | 'failure' | 'partial';
}

/**
 * Percentile configuration
 */
export interface IPercentileConfig {
  p50?: boolean;
  p75?: boolean;
  p90?: boolean;
  p95?: boolean;
  p99?: boolean;
}

/**
 * Distribution bucket
 */
export interface IDistributionBucket {
  le: number; // less than or equal
  count: number;
  cumulative: boolean;
}
