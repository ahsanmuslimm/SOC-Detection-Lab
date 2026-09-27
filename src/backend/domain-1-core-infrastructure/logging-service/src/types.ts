/**
 * Logging Service - Type Definitions
 * Defines all logging types and interfaces
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogFormat = 'json' | 'pretty';
export type LogTransport = 'console' | 'file' | 'syslog';

export interface ILogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface ILogEntry {
  level: LogLevel;
  message: string;
  context?: ILogContext;
  error?: Error;
  stack?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface ILoggerConfig {
  level: LogLevel;
  format: LogFormat;
  transports: LogTransport[];
  filePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
  enableConsole: boolean;
  enableFile: boolean;
}

export interface ILogger {
  debug(message: string, context?: ILogContext): void;
  info(message: string, context?: ILogContext): void;
  warn(message: string, context?: ILogContext): void;
  error(message: string, error?: Error | unknown, context?: ILogContext): void;
  fatal(message: string, error?: Error | unknown, context?: ILogContext): void;
}

export interface IStructuredLogger extends ILogger {
  withContext(context: ILogContext): IStructuredLogger;
  clearContext(): void;
  getContext(): ILogContext;
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
}

export interface ILogFormatter {
  format(entry: ILogEntry): string;
}

export interface ILogTransport {
  write(formatted: string): Promise<void>;
  close(): Promise<void>;
}

export interface ILogMetrics {
  totalLogs: number;
  debugCount: number;
  infoCount: number;
  warnCount: number;
  errorCount: number;
  fatalCount: number;
}

export type LogCallback = (entry: ILogEntry) => void;
