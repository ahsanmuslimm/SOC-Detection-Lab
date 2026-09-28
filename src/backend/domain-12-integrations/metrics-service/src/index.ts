/**
 * Metrics Service - Public API Exports
 * Comprehensive metrics collection, aggregation, and monitoring
 */

export { MetricsService, createMetricsService } from './main';
export type {
  MetricType,
  MetricUnit,
  AggregationPeriod,
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
  IExporterConfig,
  MetricsListener,
  AlertListener,
  IMetricsServiceConfig,
  IMetricsHealthCheck,
  IMetricBatchOperation,
  IPercentileConfig,
  IDistributionBucket,
} from './types';
