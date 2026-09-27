/**
 * Monitoring Service - Type Definitions
 * Type definitions for Prometheus metrics, health checks, and performance monitoring
 */

/**
 * Health check status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Health check component result
 */
export interface IHealthCheckResult {
  name: string;
  status: HealthStatus;
  responseTime: number;
  details?: Record<string, unknown>;
  error?: string;
}

/**
 * Overall health check response
 */
export interface IHealthCheckResponse {
  status: HealthStatus;
  timestamp: Date;
  uptime: number;
  components: IHealthCheckResult[];
  checks: {
    database: boolean;
    cache: boolean;
    search: boolean;
    memory: boolean;
    disk: boolean;
  };
}

/**
 * Prometheus metric types
 */
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

/**
 * Prometheus metric
 */
export interface IPrometheusMetric {
  name: string;
  type: MetricType;
  help: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: Date;
}

/**
 * Histogram bucket configuration
 */
export interface IHistogramBucket {
  le: number;
  count: number;
}

/**
 * Performance metric
 */
export interface IPerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  timestamp: Date;
  tags?: Record<string, string>;
}

/**
 * Request metrics
 */
export interface IRequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  statusCodeDistribution: Record<number, number>;
}

/**
 * System metrics
 */
export interface ISystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: number;
  processUptime: number;
  fileDescriptors: {
    open: number;
    max: number;
  };
}

/**
 * Database metrics
 */
export interface IDatabaseMetrics {
  connections: number;
  maxConnections: number;
  activeConnections: number;
  idleConnections: number;
  queriesPerSecond: number;
  averageQueryTime: number;
  slowQueries: number;
}

/**
 * Cache metrics
 */
export interface ICacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  size: number;
  maxSize: number;
}

/**
 * Search engine metrics
 */
export interface ISearchMetrics {
  totalSearches: number;
  averageSearchTime: number;
  indexSize: number;
  documentCount: number;
  indexRefreshTime: number;
}

/**
 * Monitoring configuration
 */
export interface IMonitoringConfig {
  enabled: boolean;
  port: number;
  metricsPath: string;
  healthCheckPath: string;
  interval: number;
  retention: number;
  enableHistograms: boolean;
  enablePercentiles: boolean;
  buckets?: number[];
}

/**
 * Alert configuration
 */
export interface IAlertConfig {
  enabled: boolean;
  cpuThreshold: number;
  memoryThreshold: number;
  diskThreshold: number;
  responseTimeThreshold: number;
  errorRateThreshold: number;
}

/**
 * Monitoring event
 */
export interface IMonitoringEvent {
  type: 'metric' | 'health' | 'alert';
  timestamp: Date;
  source: string;
  data: IPrometheusMetric | IHealthCheckResponse | IAlert;
}

/**
 * Alert
 */
export interface IAlert {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'error_rate' | 'response_time' | 'health';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved?: boolean;
}

/**
 * Monitoring listener
 */
export type MonitoringListener = (event: IMonitoringEvent) => Promise<void> | void;

/**
 * Metrics collector interface
 */
export interface IMetricsCollector {
  collectMetrics(): Promise<IPrometheusMetric[]>;
  getSystemMetrics(): Promise<ISystemMetrics>;
  getDatabaseMetrics(): Promise<IDatabaseMetrics>;
  getCacheMetrics(): Promise<ICacheMetrics>;
  getSearchMetrics(): Promise<ISearchMetrics>;
}

/**
 * Health check function
 */
export type HealthCheckFunction = () => Promise<IHealthCheckResult>;

/**
 * Metrics snapshot
 */
export interface IMetricsSnapshot {
  timestamp: Date;
  system: ISystemMetrics;
  database?: IDatabaseMetrics;
  cache?: ICacheMetrics;
  search?: ISearchMetrics;
  request?: IRequestMetrics;
}
