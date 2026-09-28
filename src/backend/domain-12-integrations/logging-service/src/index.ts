/**
 * Logging Service - Public API
 */

export { LoggingService, createLoggingService } from './main';

export type {
  LogLevel,
  LogDestination,
  LogCategory,
  ILogEntry,
  ILogQuery,
  ILogStats,
  ILogRetentionPolicy,
  ILogAggregation,
  ITrace,
  ISpan,
  IErrorGroup,
  IPerformanceMetric,
  LogFormat,
  LogExportFormat,
  ILogExportRequest,
  ILogExportResult,
  ILogSamplingPolicy,
  ILogFilterExpression,
  ILoggerContext,
  ILoggerConfig,
  LogListener,
  ErrorListener,
  ILogHealthCheck,
  ILogBatchOperation,
  ISlowQueryLog,
  IApplicationHealthMetrics,
} from './types';
