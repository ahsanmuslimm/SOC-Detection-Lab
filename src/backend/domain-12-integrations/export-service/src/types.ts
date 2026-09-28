/**
 * Export Service - Type Definitions
 * Data export, transformation, and delivery in multiple formats
 */

/**
 * Export format
 */
export type ExportFormat = 'JSON' | 'CSV' | 'XML' | 'PARQUET' | 'AVRO' | 'XLSX' | 'PDF' | 'HTML';

/**
 * Export status
 */
export type ExportStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';

/**
 * Compression algorithm
 */
export type CompressionAlgorithm = 'gzip' | 'brotli' | 'deflate' | 'lz4' | 'none';

/**
 * Delivery method
 */
export type DeliveryMethod = 'email' | 'download' | 'storage' | 'webhook' | 'sftp';

/**
 * Export job
 */
export interface IExportJob {
  jobId: string;
  name: string;
  description?: string;
  format: ExportFormat;
  status: ExportStatus;
  dataSource: IDataSource;
  filters?: IExportFilter[];
  columns?: string[];
  sorting?: ISortConfig[];
  pagination?: IPaginationConfig;
  compression: CompressionAlgorithm;
  encryption: boolean;
  deliveryMethods: DeliveryMethod[];
  rowCount: number;
  fileSize: number;
  estimatedSize?: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  progress: number;
  metadata?: Record<string, any>;
  retryCount: number;
  maxRetries: number;
}

/**
 * Data source
 */
export interface IDataSource {
  type: 'database' | 'api' | 'file' | 'query' | 'view';
  sourceId: string;
  query?: string;
  tableName?: string;
  endpoint?: string;
  connectionString?: string;
}

/**
 * Export filter
 */
export interface IExportFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

/**
 * Sort configuration
 */
export interface ISortConfig {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Pagination configuration
 */
export interface IPaginationConfig {
  pageSize: number;
  startRow: number;
  maxRows?: number;
}

/**
 * Export template
 */
export interface IExportTemplate {
  templateId: string;
  name: string;
  description?: string;
  format: ExportFormat;
  defaultColumns?: string[];
  defaultFilters?: IExportFilter[];
  defaultSorting?: ISortConfig[];
  compression: CompressionAlgorithm;
  encryption: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Export delivery config
 */
export interface IExportDeliveryConfig {
  method: DeliveryMethod;
  recipient?: string; // email, webhook URL, SFTP path
  scheduleType?: 'once' | 'daily' | 'weekly' | 'monthly';
  scheduleTime?: string; // HH:mm format
  retryPolicy?: IRetryPolicy;
  notifyOnComplete?: boolean;
  notifyOnError?: boolean;
}

/**
 * Retry policy
 */
export interface IRetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Export transformation
 */
export interface IExportTransformation {
  transformId: string;
  name: string;
  type: 'filter' | 'map' | 'aggregate' | 'join' | 'pivot';
  config: Record<string, any>;
  enabled: boolean;
  order: number;
  createdAt: Date;
}

/**
 * Export statistics
 */
export interface IExportStatistics {
  jobId: string;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalDataExported: number;
  averageExportTime: number;
  averageFileSize: number;
  successRate: number;
  lastExportTime: Date;
  updatedAt: Date;
}

/**
 * Export audit entry
 */
export interface IExportAuditEntry {
  auditId: string;
  timestamp: Date;
  jobId: string;
  action: 'create' | 'start' | 'complete' | 'fail' | 'cancel' | 'deliver';
  userId?: string;
  status: 'success' | 'failure';
  details?: Record<string, any>;
}

/**
 * Export result
 */
export interface IExportResult {
  jobId: string;
  format: ExportFormat;
  fileName: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  compressionRatio?: number;
  downloadUrl?: string;
  storageLocation?: string;
  deliveryStatus: Record<string, 'pending' | 'sent' | 'failed'>;
  generatedAt: Date;
  expiresAt: Date;
}

/**
 * Export format options
 */
export interface IExportFormatOptions {
  format: ExportFormat;
  delimiter?: string;
  quote?: string;
  escape?: string;
  includeHeaders?: boolean;
  includeRowNumbers?: boolean;
  dateFormat?: string;
  numberFormat?: string;
  booleanFormat?: string;
}

/**
 * Column mapping
 */
export interface IColumnMapping {
  sourceColumn: string;
  exportColumn: string;
  dataType?: 'string' | 'number' | 'boolean' | 'date' | 'datetime';
  format?: string;
  transform?: string;
}

/**
 * Export schedule
 */
export interface IExportSchedule {
  scheduleId: string;
  templateId?: string;
  jobId?: string;
  name: string;
  enabled: boolean;
  frequency: 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextRunAt: Date;
  lastRunAt?: Date;
  deliveryConfigs: IExportDeliveryConfig[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Export cache entry
 */
export interface IExportCacheEntry {
  cacheId: string;
  jobId: string;
  dataHash: string;
  fileName: string;
  fileSize: number;
  compressionRatio: number;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessedAt: Date;
}

/**
 * Export health check
 */
export interface IExportHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  activeJobs: number;
  queuedJobs: number;
  failedJobsLastHour: number;
  averageProcessingTime: number;
  diskUsage: {
    usedMB: number;
    availableMB: number;
    utilizationPercentage: number;
  };
}

/**
 * Export event
 */
export interface IExportEvent {
  eventId: string;
  timestamp: Date;
  type: 'job-created' | 'job-started' | 'job-completed' | 'job-failed' | 'job-cancelled' | 'delivery-sent' | 'cache-cleared';
  jobId: string;
  details?: Record<string, any>;
}

/**
 * Export listener
 */
export type ExportListener = (event: IExportEvent) => Promise<void> | void;

/**
 * Batch export options
 */
export interface IBatchExportOptions {
  jobs: Array<{
    name: string;
    format: ExportFormat;
    dataSource: IDataSource;
    filters?: IExportFilter[];
  }>;
  parallelJobs: number;
  stopOnError: boolean;
}

/**
 * Export performance metrics
 */
export interface IExportPerformanceMetrics {
  timestamp: Date;
  jobsProcessed: number;
  totalDataExported: number;
  averageProcessingTime: number;
  peakConcurrency: number;
  cpuUsage: number;
  memoryUsage: number;
  diskIORate: number;
}

/**
 * Export service configuration
 */
export interface IExportServiceConfig {
  maxConcurrentJobs: number;
  maxJobSize: number;
  maxCacheSize: number;
  cacheExpiry: number;
  enableCompression: boolean;
  defaultCompression: CompressionAlgorithm;
  enableEncryption: boolean;
  enableAudit: boolean;
  maxAuditEntries: number;
  enableMetrics: boolean;
  enableScheduling: boolean;
  cleanupIntervalMs: number;
  temporaryStoragePath: string;
  maxRetries: number;
  requestTimeoutMs: number;
  enableCache: boolean;
}

/**
 * Export batch result
 */
export interface IExportBatchResult {
  batchId: string;
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  results: Array<{
    jobId: string;
    status: ExportStatus;
    result?: IExportResult;
    error?: string;
  }>;
  startedAt: Date;
  completedAt: Date;
}

/**
 * Data transformation function
 */
export type DataTransformFunction = (data: any[], config: Record<string, any>) => Promise<any[]>;

/**
 * Export format handler
 */
export interface IExportFormatHandler {
  format: ExportFormat;
  canHandle(format: ExportFormat): boolean;
  export(data: any[], options: IExportFormatOptions): Promise<Buffer>;
  getFileExtension(): string;
  getMimeType(): string;
}

/**
 * Column aggregation
 */
export interface IColumnAggregation {
  field: string;
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'first' | 'last';
  alias?: string;
}

/**
 * Join configuration
 */
export interface IJoinConfig {
  type: 'inner' | 'left' | 'right' | 'full';
  targetSource: IDataSource;
  onField: string;
  targetField: string;
}

/**
 * Pivot configuration
 */
export interface IPivotConfig {
  rowFields: string[];
  columnFields: string[];
  valueField: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

/**
 * Export template preset
 */
export interface IExportTemplatePreset {
  presetId: string;
  name: string;
  description: string;
  category: 'report' | 'analytics' | 'backup' | 'archive' | 'custom';
  format: ExportFormat;
  defaultColumns: string[];
  icon?: string;
  description_long?: string;
  example?: any[];
}

/**
 * Data quality metrics
 */
export interface IDataQualityMetrics {
  jobId: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  nullValues: number;
  duplicateRecords: number;
  qualityScore: number;
  warnings: Array<{
    type: string;
    count: number;
    examples: any[];
  }>;
}
