/**
 * Monitoring Service - Public API
 * Exports the monitoring service and related types
 */

export { MonitoringService, createMonitoringService } from './main';
export type {
  IHealthCheckResponse,
  IHealthCheckResult,
  IPrometheusMetric,
  IPerformanceMetric,
  ISystemMetrics,
  IDatabaseMetrics,
  ICacheMetrics,
  ISearchMetrics,
  IMonitoringConfig,
  IMonitoringEvent,
  IAlert,
  IMetricsSnapshot,
  IRequestMetrics,
  IAlertConfig,
  HealthStatus,
  MetricType,
  MonitoringListener,
  HealthCheckFunction,
  IMetricsCollector,
} from './types';
