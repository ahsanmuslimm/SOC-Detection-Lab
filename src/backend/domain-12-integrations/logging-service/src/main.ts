/**
 * Logging Service - Main Implementation
 * Structured logging with context preservation, distributed tracing, and performance metrics
 */

import crypto from 'crypto';
import {
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
  ILogExportRequest,
  ILogExportResult,
  ILogSamplingPolicy,
  ILoggerContext,
  ILoggerConfig,
  LogListener,
  ErrorListener,
  ILogHealthCheck,
  ILogBatchOperation,
  ISlowQueryLog,
  IApplicationHealthMetrics,
} from './types';

/**
 * Logging Service
 * Provides structured logging with tracing, error grouping, and performance monitoring
 */
export class LoggingService {
  private config: ILoggerConfig;
  private entries: Map<string, ILogEntry> = new Map();
  private traces: Map<string, ITrace> = new Map();
  private errorGroups: Map<string, IErrorGroup> = new Map();
  private slowQueries: Map<string, ISlowQueryLog> = new Map();
  private retentionPolicies: Map<string, ILogRetentionPolicy> = new Map();
  private samplingPolicies: Map<string, ILogSamplingPolicy> = new Map();
  private logListeners: Set<LogListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();
  private stats: ILogStats;
  private context: ILoggerContext = {};
  private logBuffer: ILogEntry[] = [];
  private cleanupIntervalId: NodeJS.Timeout | null = null;
  private flushIntervalId: NodeJS.Timeout | null = null;
  private healthMetricsIntervalId: NodeJS.Timeout | null = null;
  private currentTrace: ITrace | null = null;
  private currentSpan: ISpan | null = null;

  /**
   * Constructor
   */
  constructor(config: ILoggerConfig) {
    this.config = this.validateConfig(config);
    this.stats = this.initializeStats();
    this.startCleanupInterval();
    this.startFlushInterval();
    this.startHealthMetricsCollection();
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: ILoggerConfig): ILoggerConfig {
    if (config.samplingRate < 0 || config.samplingRate > 1) {
      config.samplingRate = 1;
    }
    return config;
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): ILogStats {
    return {
      totalLogs: 0,
      logsByLevel: { trace: 0, debug: 0, info: 0, warn: 0, error: 0, fatal: 0 },
      logsByCategory: {} as Record<LogCategory, number>,
      logsLastHour: 0,
      logsLastDay: 0,
      logsLastWeek: 0,
      errorRate: 0,
      averageLogSize: 0,
      traceCount: 0,
      slowQueryCount: 0,
    };
  }

  /**
   * Set context
   */
  public setContext(context: Partial<ILoggerContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Get context
   */
  public getContext(): ILoggerContext {
    return { ...this.context };
  }

  /**
   * Log message
   */
  public log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: Record<string, unknown>,
  ): string {
    // Check sampling policy
    if (!this.shouldLog(level, category)) {
      return '';
    }

    const entryId = this.generateEntryId();
    const entry: ILogEntry = {
      entryId,
      timestamp: new Date(),
      level,
      category,
      message,
      context: data,
      userId: this.context.userId,
      sessionId: this.context.sessionId,
      correlationId: this.context.correlationId,
      traceId: this.currentTrace?.traceId || this.context.traceId,
      spanId: this.currentSpan?.spanId || this.context.spanId,
      parentSpanId: this.currentSpan?.parentSpanId,
      metadata: this.context.metadata,
      environment: this.context.environment,
      host: this.context.host,
    };

    // Add source location if enabled
    if (this.config.enableSourceLocation) {
      entry.source = this.captureSourceLocation();
    }

    // Store entry
    this.entries.set(entryId, entry);
    this.logBuffer.push(entry);

    // Update statistics
    this.updateStats(entry);

    // Add to current trace/span if active
    if (this.currentSpan) {
      this.currentSpan.logs.push(entry);
    }

    // Emit event
    this.emitLogEvent(entry);

    // Check for errors
    if (level === 'error' || level === 'fatal') {
      this.groupError(entry);
    }

    return entryId;
  }

  /**
   * Log trace
   */
  public trace(message: string, data?: Record<string, unknown>): string {
    return this.log('trace', 'system', message, data);
  }

  /**
   * Log debug
   */
  public debug(category: LogCategory, message: string, data?: Record<string, unknown>): string {
    return this.log('debug', category, message, data);
  }

  /**
   * Log info
   */
  public info(category: LogCategory, message: string, data?: Record<string, unknown>): string {
    return this.log('info', category, message, data);
  }

  /**
   * Log warn
   */
  public warn(category: LogCategory, message: string, data?: Record<string, unknown>): string {
    return this.log('warn', category, message, data);
  }

  /**
   * Log error
   */
  public error(category: LogCategory, message: string, error?: Error, data?: Record<string, unknown>): string {
    const entry = {
      ...data,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: this.config.enableStackTrace ? error.stack : undefined,
      } : undefined,
    };

    return this.log('error', category, message, entry);
  }

  /**
   * Log fatal
   */
  public fatal(category: LogCategory, message: string, error?: Error, data?: Record<string, unknown>): string {
    const entry = {
      ...data,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: this.config.enableStackTrace ? error.stack : undefined,
      } : undefined,
    };

    return this.log('fatal', category, message, entry);
  }

  /**
   * Start trace
   */
  public startTrace(operationName: string, tags?: Record<string, unknown>): string {
    const traceId = this.generateTraceId();

    const trace: ITrace = {
      traceId,
      spans: [],
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      status: 'success',
      userId: this.context.userId,
      correlationId: this.context.correlationId,
      tags,
    };

    this.traces.set(traceId, trace);
    this.currentTrace = trace;

    this.stats.traceCount++;

    return traceId;
  }

  /**
   * Start span
   */
  public startSpan(operationName: string, tags?: Record<string, unknown>): string {
    const spanId = this.generateSpanId();
    const traceId = this.currentTrace?.traceId || this.generateTraceId();

    const span: ISpan = {
      spanId,
      traceId,
      parentSpanId: this.currentSpan?.spanId,
      operationName,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      status: 'success',
      logs: [],
      tags,
    };

    if (!this.currentTrace) {
      const trace: ITrace = {
        traceId,
        spans: [span],
        startTime: span.startTime,
        endTime: span.endTime,
        duration: 0,
        status: 'success',
        userId: this.context.userId,
      };
      this.traces.set(traceId, trace);
      this.currentTrace = trace;
    } else {
      this.currentTrace.spans.push(span);
    }

    this.currentSpan = span;

    return spanId;
  }

  /**
   * End span
   */
  public endSpan(spanId: string, status?: 'success' | 'error' | 'partial'): void {
    if (!this.currentSpan || this.currentSpan.spanId !== spanId) {
      return;
    }

    this.currentSpan.endTime = new Date();
    this.currentSpan.duration = this.currentSpan.endTime.getTime() - this.currentSpan.startTime.getTime();
    this.currentSpan.status = status || 'success';

    this.currentSpan = this.currentSpan.parentSpanId
      ? (this.currentTrace?.spans.find((s) => s.spanId === this.currentSpan?.parentSpanId) || null)
      : null;
  }

  /**
   * End trace
   */
  public endTrace(traceId: string, status?: 'success' | 'error' | 'partial'): void {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return;
    }

    trace.endTime = new Date();
    trace.duration = trace.endTime.getTime() - trace.startTime.getTime();
    trace.status = status || 'success';

    this.currentTrace = null;
    this.currentSpan = null;
  }

  /**
   * Log slow query
   */
  public logSlowQuery(
    queryName: string,
    duration: number,
    threshold: number,
    query: string,
    parameters?: Record<string, unknown>,
  ): string {
    const logId = this.generateSlowQueryId();

    const slowQuery: ISlowQueryLog = {
      logId,
      timestamp: new Date(),
      queryName,
      duration,
      threshold,
      query,
      parameters,
      userId: this.context.userId,
      correlationId: this.context.correlationId,
    };

    this.slowQueries.set(logId, slowQuery);
    this.stats.slowQueryCount++;

    this.log('warn', 'performance', `Slow query detected: ${queryName} (${duration}ms)`, {
      queryName,
      duration,
      threshold,
    });

    return logId;
  }

  /**
   * Get entry
   */
  public getEntry(entryId: string): ILogEntry | null {
    return this.entries.get(entryId) || null;
  }

  /**
   * Query entries
   */
  public queryEntries(query: ILogQuery): ILogEntry[] {
    let results = Array.from(this.entries.values());

    if (query.levelFilter && query.levelFilter.length > 0) {
      results = results.filter((e) => query.levelFilter!.includes(e.level));
    }

    if (query.categoryFilter && query.categoryFilter.length > 0) {
      results = results.filter((e) => query.categoryFilter!.includes(e.category));
    }

    if (query.userIdFilter && query.userIdFilter.length > 0) {
      results = results.filter((e) => e.userId && query.userIdFilter!.includes(e.userId));
    }

    if (query.correlationIdFilter && query.correlationIdFilter.length > 0) {
      results = results.filter(
        (e) => e.correlationId && query.correlationIdFilter!.includes(e.correlationId),
      );
    }

    if (query.traceIdFilter && query.traceIdFilter.length > 0) {
      results = results.filter((e) => e.traceId && query.traceIdFilter!.includes(e.traceId));
    }

    if (query.startDate) {
      results = results.filter((e) => e.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      results = results.filter((e) => e.timestamp <= query.endDate!);
    }

    if (query.searchText) {
      const searchLower = query.searchText.toLowerCase();
      results = results.filter((e) => e.message.toLowerCase().includes(searchLower));
    }

    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const offset = query.offset || 0;
    const limit = Math.min(query.limit || 100, 10000);

    return results.slice(offset, offset + limit);
  }

  /**
   * Get trace
   */
  public getTrace(traceId: string): ITrace | null {
    return this.traces.get(traceId) || null;
  }

  /**
   * Get error group
   */
  public getErrorGroup(groupId: string): IErrorGroup | null {
    return this.errorGroups.get(groupId) || null;
  }

  /**
   * Get all error groups
   */
  public getErrorGroups(): IErrorGroup[] {
    return Array.from(this.errorGroups.values()).sort(
      (a, b) => b.occurrenceCount - a.occurrenceCount,
    );
  }

  /**
   * Register retention policy
   */
  public registerRetentionPolicy(policy: ILogRetentionPolicy): boolean {
    if (this.retentionPolicies.has(policy.name)) {
      return false;
    }

    this.retentionPolicies.set(policy.name, policy);
    return true;
  }

  /**
   * Register sampling policy
   */
  public registerSamplingPolicy(policy: ILogSamplingPolicy): boolean {
    if (this.samplingPolicies.has(policy.name)) {
      return false;
    }

    this.samplingPolicies.set(policy.name, policy);
    return true;
  }

  /**
   * Get statistics
   */
  public getStats(): ILogStats {
    this.stats.totalLogs = this.entries.size;

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 86400000);
    const oneWeekAgo = new Date(now.getTime() - 604800000);

    this.stats.logsLastHour = Array.from(this.entries.values()).filter(
      (e) => e.timestamp >= oneHourAgo,
    ).length;

    this.stats.logsLastDay = Array.from(this.entries.values()).filter(
      (e) => e.timestamp >= oneDayAgo,
    ).length;

    this.stats.logsLastWeek = Array.from(this.entries.values()).filter(
      (e) => e.timestamp >= oneWeekAgo,
    ).length;

    const errorCount = Array.from(this.entries.values()).filter(
      (e) => e.level === 'error' || e.level === 'fatal',
    ).length;

    this.stats.errorRate = this.entries.size > 0 ? errorCount / this.entries.size : 0;

    const totalSize = Array.from(this.entries.values()).reduce(
      (sum, e) => sum + JSON.stringify(e).length,
      0,
    );
    this.stats.averageLogSize = this.entries.size > 0 ? totalSize / this.entries.size : 0;

    return { ...this.stats };
  }

  /**
   * Export logs
   */
  public async exportLogs(request: ILogExportRequest): Promise<ILogExportResult> {
    const entries = this.queryEntries(request.query);

    const exportId = this.generateExportId();
    let content = '';

    switch (request.format) {
      case 'json':
        content = JSON.stringify(entries, null, 2);
        break;

      case 'csv':
        content = this.convertToCSV(entries);
        break;

      case 'html':
        content = this.convertToHTML(entries);
        break;

      case 'pdf':
        content = JSON.stringify(entries);
        break;
    }

    const fileSize = Buffer.byteLength(content, 'utf-8');
    const checksum = crypto.createHash('sha256').update(content).digest('hex');

    return {
      exportId,
      format: request.format,
      totalRecords: entries.length,
      fileSize,
      url: `/exports/${exportId}`,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      checksum,
    };
  }

  /**
   * Get application health
   */
  public getApplicationHealth(): IApplicationHealthMetrics {
    const memUsage = process.memoryUsage();

    return {
      timestamp: new Date(),
      memoryUsage: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
      },
      cpuUsage: process.cpuUsage().user / 1000000,
      uptime: process.uptime(),
      requestCount: this.stats.logsLastHour,
      errorCount: Array.from(this.entries.values()).filter(
        (e) => e.level === 'error' || e.level === 'fatal',
      ).length,
      averageResponseTime: this.stats.averageLogSize,
      activeSessions: this.context.sessionId ? 1 : 0,
      databaseConnections: 0, // Would be populated by actual DB
      cacheHitRate: 0, // Would be populated by cache service
    };
  }

  /**
   * Perform health check
   */
  public async performHealthCheck(): Promise<ILogHealthCheck> {
    const health: ILogHealthCheck = {
      status: 'healthy',
      timestamp: new Date(),
      storageHealth: this.entries.size < 10000000 ? 'healthy' : 'degraded',
      processingHealth: this.logBuffer.length < 10000 ? 'healthy' : 'degraded',
      checks: [
        {
          name: 'entries_stored',
          status: this.entries.size > 0 ? 'healthy' : 'degraded',
          message: `${this.entries.size} entries stored`,
        },
        {
          name: 'buffer_depth',
          status: this.logBuffer.length < 10000 ? 'healthy' : 'degraded',
          message: `${this.logBuffer.length} entries in buffer`,
        },
        {
          name: 'traces_active',
          status: this.traces.size < 1000 ? 'healthy' : 'degraded',
          message: `${this.traces.size} traces active`,
        },
      ],
    };

    if (health.storageHealth === 'critical' || health.processingHealth === 'critical') {
      health.status = 'unhealthy';
    } else if (health.storageHealth === 'degraded' || health.processingHealth === 'degraded') {
      health.status = 'degraded';
    }

    return health;
  }

  /**
   * Add log listener
   */
  public onLog(listener: LogListener): this {
    this.logListeners.add(listener);
    return this;
  }

  /**
   * Add error listener
   */
  public onError(listener: ErrorListener): this {
    this.errorListeners.add(listener);
    return this;
  }

  /**
   * Should log based on sampling
   */
  private shouldLog(level: LogLevel, category: LogCategory): boolean {
    if (!this.config.enableSampling) {
      return true;
    }

    // Always log errors and fatal
    if (level === 'error' || level === 'fatal') {
      return true;
    }

    return Math.random() < this.config.samplingRate;
  }

  /**
   * Update statistics
   */
  private updateStats(entry: ILogEntry): void {
    this.stats.logsByLevel[entry.level]++;
    this.stats.logsByCategory[entry.category] = (this.stats.logsByCategory[entry.category] || 0) + 1;
  }

  /**
   * Group error
   */
  private groupError(entry: ILogEntry): void {
    if (!entry.error) {
      return;
    }

    const stackTraceHash = crypto
      .createHash('sha256')
      .update(entry.error.stack || entry.error.message)
      .digest('hex');

    let group = Array.from(this.errorGroups.values()).find((g) => g.stackTraceHash === stackTraceHash);

    if (!group) {
      const groupId = this.generateErrorGroupId();
      group = {
        groupId,
        errorType: entry.error.name,
        errorMessage: entry.error.message,
        firstOccurrence: entry.timestamp,
        lastOccurrence: entry.timestamp,
        occurrenceCount: 0,
        affectedUsers: 0,
        stackTraceHash,
        entries: [],
      };
      this.errorGroups.set(groupId, group);
    }

    group.occurrenceCount++;
    group.lastOccurrence = entry.timestamp;
    if (entry.userId && !group.entries.some((e) => e.userId === entry.userId)) {
      group.affectedUsers++;
    }
    group.entries.push(entry);

    this.emitErrorEvent(group);
  }

  /**
   * Emit log event
   */
  private emitLogEvent(entry: ILogEntry): void {
    for (const listener of this.logListeners) {
      try {
        listener(entry);
      } catch (error) {
        // Silently ignore
      }
    }
  }

  /**
   * Emit error event
   */
  private emitErrorEvent(group: IErrorGroup): void {
    for (const listener of this.errorListeners) {
      try {
        listener(group);
      } catch (error) {
        // Silently ignore
      }
    }
  }

  /**
   * Capture source location
   */
  private captureSourceLocation() {
    const stack = new Error().stack || '';
    const lines = stack.split('\n');
    const line = lines[3]; // Skip Error, captureSourceLocation, log, and wrapper function

    // Parse source location from stack trace
    const match = line.match(/at (.*):(\d+):(\d+)/);
    if (match) {
      return {
        file: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
      };
    }

    return undefined;
  }

  /**
   * Convert to CSV
   */
  private convertToCSV(entries: ILogEntry[]): string {
    const headers = ['timestamp', 'level', 'category', 'message', 'userId', 'traceId'];
    const rows = entries.map((e) => [
      e.timestamp.toISOString(),
      e.level,
      e.category,
      `"${e.message.replace(/"/g, '""')}"`,
      e.userId || '',
      e.traceId || '',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Convert to HTML
   */
  private convertToHTML(entries: ILogEntry[]): string {
    let html = '<html><body><table border="1">';
    html += '<tr><th>Time</th><th>Level</th><th>Category</th><th>Message</th></tr>';

    for (const entry of entries) {
      html += `<tr><td>${entry.timestamp.toISOString()}</td><td>${entry.level}</td><td>${entry.category}</td><td>${entry.message}</td></tr>`;
    }

    html += '</table></body></html>';
    return html;
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupIntervalId = setInterval(() => {
      this.cleanup();
    }, 3600000); // 1 hour
  }

  /**
   * Start flush interval
   */
  private startFlushInterval(): void {
    this.flushIntervalId = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Start health metrics collection
   */
  private startHealthMetricsCollection(): void {
    this.healthMetricsIntervalId = setInterval(() => {
      // Periodic health metric collection
    }, 60000); // 1 minute
  }

  /**
   * Cleanup old entries
   */
  private cleanup(): void {
    const now = Date.now();

    for (const policy of this.retentionPolicies.values()) {
      if (!policy.isActive) continue;

      const cutoffTime = now - policy.retentionDays * 24 * 60 * 60 * 1000;

      for (const [entryId, entry] of this.entries.entries()) {
        if (entry.timestamp.getTime() < cutoffTime) {
          this.entries.delete(entryId);
        }
      }
    }
  }

  /**
   * Flush log buffer
   */
  private flush(): void {
    // In production, would flush to persistent storage
    this.logBuffer = [];
  }

  /**
   * Stop service
   */
  public stop(): void {
    if (this.cleanupIntervalId) clearInterval(this.cleanupIntervalId);
    if (this.flushIntervalId) clearInterval(this.flushIntervalId);
    if (this.healthMetricsIntervalId) clearInterval(this.healthMetricsIntervalId);
    this.flush();
  }

  /**
   * Generate IDs
   */
  private generateEntryId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTraceId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  private generateSpanId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  private generateExportId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSlowQueryId(): string {
    return `slowq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorGroupId(): string {
    return `ergrp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory function
 */
export function createLoggingService(config: ILoggerConfig): LoggingService {
  return new LoggingService(config);
}
