/**
 * Logging Service - Main Implementation
 * Provides structured, production-grade logging
 */

import type {
  ILogger,
  IStructuredLogger,
  ILogContext,
  ILogEntry,
  ILoggerConfig,
  ILogMetrics,
  LogLevel,
} from './types';

export class LoggerService implements IStructuredLogger {
  private config: ILoggerConfig;
  private context: ILogContext = {};
  private metrics: ILogMetrics = {
    totalLogs: 0,
    debugCount: 0,
    infoCount: 0,
    warnCount: 0,
    errorCount: 0,
    fatalCount: 0,
  };

  // Log level priority
  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  constructor(config: ILoggerConfig) {
    this.config = config;
    this.validate();
  }

  /**
   * Validate configuration
   */
  private validate(): void {
    if (!this.config.level || !this.levelPriority[this.config.level]) {
      throw new Error('Invalid log level');
    }

    if (!this.config.format || !['json', 'pretty'].includes(this.config.format)) {
      throw new Error('Invalid log format. Must be "json" or "pretty"');
    }

    if (!Array.isArray(this.config.transports) || this.config.transports.length === 0) {
      throw new Error('At least one transport must be specified');
    }

    // Validate transports
    for (const transport of this.config.transports) {
      if (!['console', 'file', 'syslog'].includes(transport)) {
        throw new Error(`Invalid transport: ${transport}`);
      }
    }

    // File config validation
    if (this.config.transports.includes('file') && !this.config.filePath) {
      throw new Error('filePath is required when using file transport');
    }

    if (this.config.maxFileSize && this.config.maxFileSize < 1024) {
      throw new Error('maxFileSize must be at least 1KB');
    }
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.config.level];
  }

  /**
   * Format log entry
   */
  private formatEntry(entry: ILogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify(this.toJSON(entry));
    }

    // Pretty format
    const timestamp = new Date().toISOString();
    const levelUpper = entry.level.toUpperCase().padEnd(7);
    let message = `[${timestamp}] ${levelUpper} ${entry.message}`;

    if (entry.context) {
      message += ` ${JSON.stringify(entry.context)}`;
    }

    if (entry.error) {
      message += `\n${entry.error instanceof Error ? entry.error.stack : String(entry.error)}`;
    }

    return message;
  }

  /**
   * Convert log entry to JSON
   */
  private toJSON(entry: ILogEntry): Record<string, unknown> {
    const json: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level: entry.level,
      message: entry.message,
    };

    if (entry.context && Object.keys(entry.context).length > 0) {
      json.context = entry.context;
    }

    if (entry.error) {
      if (entry.error instanceof Error) {
        json.error = {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack,
        };
      } else {
        json.error = entry.error;
      }
    }

    if (entry.duration !== undefined) {
      json.duration = entry.duration;
    }

    if (entry.metadata) {
      json.metadata = entry.metadata;
    }

    return json;
  }

  /**
   * Write log to outputs
   */
  private writeLog(formatted: string): void {
    for (const transport of this.config.transports) {
      switch (transport) {
        case 'console':
          if (this.config.enableConsole) {
            console.log(formatted);
          }
          break;
        case 'file':
          if (this.config.enableFile && this.config.filePath) {
            // File writing would be async, but keeping sync for simplicity
            // In production, use async file operations
            this.writeToFile(formatted);
          }
          break;
        case 'syslog':
          // Syslog writing would happen here
          this.writeToSyslog(formatted);
          break;
      }
    }
  }

  /**
   * Write to file (stub - would use async file ops in production)
   */
  private writeToFile(message: string): void {
    // In production, use fs.promises.appendFile or streaming
    // This is a stub for testing purposes
  }

  /**
   * Write to syslog (stub)
   */
  private writeToSyslog(message: string): void {
    // In production, use syslog library
    // This is a stub for testing purposes
  }

  /**
   * Update metrics
   */
  private updateMetrics(level: LogLevel): void {
    this.metrics.totalLogs++;
    switch (level) {
      case 'debug':
        this.metrics.debugCount++;
        break;
      case 'info':
        this.metrics.infoCount++;
        break;
      case 'warn':
        this.metrics.warnCount++;
        break;
      case 'error':
        this.metrics.errorCount++;
        break;
      case 'fatal':
        this.metrics.fatalCount++;
        break;
    }
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, errorOrContext?: Error | ILogContext, context?: ILogContext): void {
    if (!this.shouldLog(level)) {
      return;
    }

    let error: Error | undefined;
    let finalContext: ILogContext = { ...this.context };

    // Parse arguments
    if (errorOrContext instanceof Error) {
      error = errorOrContext;
      if (context) {
        finalContext = { ...finalContext, ...context };
      }
    } else if (errorOrContext && typeof errorOrContext === 'object') {
      finalContext = { ...finalContext, ...errorOrContext };
    }

    const entry: ILogEntry = {
      level,
      message,
      context: finalContext,
      error,
    };

    const formatted = this.formatEntry(entry);
    this.writeLog(formatted);
    this.updateMetrics(level);
  }

  // ILogger implementation

  /**
   * Log debug message
   */
  debug(message: string, context?: ILogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: ILogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: ILogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: ILogContext): void {
    if (error instanceof Error) {
      this.log('error', message, error, context);
    } else if (error && typeof error === 'object') {
      this.log('error', message, error as ILogContext);
    } else {
      this.log('error', message, context);
    }
  }

  /**
   * Log fatal message (and exit)
   */
  fatal(message: string, error?: Error | unknown, context?: ILogContext): void {
    if (error instanceof Error) {
      this.log('fatal', message, error, context);
    } else if (error && typeof error === 'object') {
      this.log('fatal', message, error as ILogContext);
    } else {
      this.log('fatal', message, context);
    }
  }

  // IStructuredLogger implementation

  /**
   * Create new logger with context
   */
  withContext(context: ILogContext): IStructuredLogger {
    const logger = new LoggerService(this.config);
    logger.context = { ...this.context, ...context };
    return logger;
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Get current context
   */
  getContext(): ILogContext {
    return { ...this.context };
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    if (!this.levelPriority[level]) {
      throw new Error(`Invalid log level: ${level}`);
    }
    this.config.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Get metrics
   */
  getMetrics(): ILogMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalLogs: 0,
      debugCount: 0,
      infoCount: 0,
      warnCount: 0,
      errorCount: 0,
      fatalCount: 0,
    };
  }

  /**
   * Get configuration
   */
  getConfig(): ILoggerConfig {
    return { ...this.config };
  }
}
