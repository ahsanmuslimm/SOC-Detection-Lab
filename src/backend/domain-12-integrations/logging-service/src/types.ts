/**
 * Logging Service - Type Definitions
 * Structured, multi-level logging with context preservation, tracing, and performance metrics
 */

/**
 * Log level
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Log destination
 */
export type LogDestination = 'console' | 'file' | 'database' | 'remote' | 'aggregator';

/**
 * Log category
 */
export type LogCategory =
  | 'auth'
  | 'api'
  | 'database'
  | 'cache'
  | 'search'
  | 'event'
  | 'alert'
  | 'case'
  | 'rule'
  | 'playbook'
  | 'integration'
  | 'performance'
  | 'security'
  | 'audit'
  | 'system';

/**
 * Log entry
 */
export interface ILogEntry {
  entryId: string;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {
    duration: number;
    memory?: number;
    cpu?: number;
  };
  metadata?: Record<string, unknown>;
  tags?: string[];
  source?: {
    file?: string;
    function?: string;
    line?: number;
    column?: number;
  };
  host?: string;
  environment?: string;
}

/**
 * Log query
 */
export interface ILogQuery {
  levelFilter?: LogLevel[];
  categoryFilter?: LogCategory[];
  userIdFilter?: string[];
  correlationIdFilter?: string[];
  traceIdFilter?: string[];
  startDate?: Date;
  endDate?: Date;
  searchText?: string;
  limit?: number;
  offset?: number;
}

/**
 * Log statistics
 */
export interface ILogStats {
  totalLogs: number;
  logsByLevel: Record<LogLevel, number>;
  logsByCategory: Record<LogCategory, number>;
  logsLastHour: number;
  logsLastDay: number;
  logsLastWeek: number;
  errorRate: number;
  averageLogSize: number;
  traceCount: number;
  slowQueryCount: number;
}

/**
 * Log retention policy
 */
export interface ILogRetentionPolicy {
  name: string;
  description?: string;
  levelFilter?: LogLevel[];
  categoryFilter?: LogCategory[];
  retentionDays: number;
  compressAfterDays?: number;
  archiveAfterDays?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Log aggregation
 */
export interface ILogAggregation {
  aggregationType: 'count' | 'histogram' | 'heatmap' | 'distribution';
  field: string;
  bucketSize?: number;
  buckets: Array<{
    key: string | number;
    count: number;
    value?: number;
  }>;
}

/**
 * Trace
 */
export interface ITrace {
  traceId: string;
  spans: ISpan[];
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'success' | 'error' | 'partial';
  userId?: string;
  correlationId?: string;
  tags?: Record<string, unknown>;
}

/**
 * Span
 */
export interface ISpan {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'success' | 'error' | 'partial';
  logs: ILogEntry[];
  tags?: Record<string, unknown>;
  metrics?: Record<string, number>;
}

/**
 * Error group
 */
export interface IErrorGroup {
  groupId: string;
  errorType: string;
  errorMessage: string;
  firstOccurrence: Date;
  lastOccurrence: Date;
  occurrenceCount: number;
  affectedUsers: number;
  stackTraceHash: string;
  entries: ILogEntry[];
}

/**
 * Performance metric
 */
export interface IPerformanceMetric {
  metricId: string;
  timestamp: Date;
  operationName: string;
  duration: number;
  percentile50: number;
  percentile75: number;
  percentile90: number;
  percentile99: number;
  min: number;
  max: number;
  avg: number;
  count: number;
  errors: number;
  errorRate: number;
}

/**
 * Log format
 */
export type LogFormat = 'json' | 'text' | 'colored' | 'structured';

/**
 * Log export format
 */
export type LogExportFormat = 'json' | 'csv' | 'pdf' | 'html';

/**
 * Log export request
 */
export interface ILogExportRequest {
  format: LogExportFormat;
  query: ILogQuery;
  includeTraces?: boolean;
  compress?: boolean;
}

/**
 * Log export result
 */
export interface ILogExportResult {
  exportId: string;
  format: LogExportFormat;
  totalRecords: number;
  fileSize: number;
  url: string;
  generatedAt: Date;
  expiresAt: Date;
  checksum: string;
}

/**
 * Log sampling policy
 */
export interface ILogSamplingPolicy {
  name: string;
  description?: string;
  sampleRate: number; // 0-1
  categoryFilter?: LogCategory[];
  levelFilter?: LogLevel[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Log filter expression
 */
export interface ILogFilterExpression {
  field: string;
  operator: 'equals' | 'contains' | 'in' | 'gte' | 'lte' | 'between' | 'regex';
  value: unknown;
  caseSensitive?: boolean;
}

/**
 * Logger context
 */
export interface ILoggerContext {
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  environment?: string;
  host?: string;
  version?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Logger configuration
 */
export interface ILoggerConfig {
  level: LogLevel;
  format: LogFormat;
  destinations: LogDestination[];
  enableStackTrace: boolean;
  enableSourceLocation: boolean;
  enablePerformanceMetrics: boolean;
  enableTracing: boolean;
  enableErrorGrouping: boolean;
  enableSampling: boolean;
  samplingRate: number;
  maxContextSize: number;
  maxLogSize: number;
  maxBufferSize: number;
  flushInterval: number;
  retentionDays: number;
  enableCompression: boolean;
  enableEncryption: boolean;
}

/**
 * Log listener
 */
export type LogListener = (entry: ILogEntry) => Promise<void> | void;

/**
 * Error listener
 */
export type ErrorListener = (error: IErrorGroup) => Promise<void> | void;

/**
 * Log health check
 */
export interface ILogHealthCheck {
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
 * Log batch operation
 */
export interface ILogBatchOperation {
  operationId: string;
  timestamp: Date;
  itemCount: number;
  successCount: number;
  failureCount: number;
  duration: number;
  status: 'success' | 'failure' | 'partial';
}

/**
 * Slow query log
 */
export interface ISlowQueryLog {
  logId: string;
  timestamp: Date;
  queryName: string;
  duration: number;
  threshold: number;
  query: string;
  parameters?: Record<string, unknown>;
  result?: {
    rowsAffected: number;
    rowsReturned?: number;
  };
  userId?: string;
  correlationId?: string;
}

/**
 * Application health metrics
 */
export interface IApplicationHealthMetrics {
  timestamp: Date;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpuUsage: number;
  uptime: number;
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  activeSessions: number;
  databaseConnections: number;
  cacheHitRate: number;
}
