/**
 * Logging Service - Unit Tests
 * Tests all logging functionality and features
 */

import { LoggerService } from '../../src/main';
import type { ILoggerConfig, LogLevel, ILogContext } from '../../src/types';

describe('LoggerService', () => {
  let logger: LoggerService;
  const mockConfig: ILoggerConfig = {
    level: 'debug',
    format: 'json',
    transports: ['console'],
    enableConsole: true,
    enableFile: false,
  };

  beforeEach(() => {
    logger = new LoggerService(mockConfig);
    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create logger with valid config', () => {
      expect(logger).toBeDefined();
      expect(logger.getConfig()).toBeDefined();
    });

    it('should throw error for invalid log level', () => {
      const invalidConfig: ILoggerConfig = {
        level: 'invalid' as LogLevel,
        format: 'json',
        transports: ['console'],
        enableConsole: true,
        enableFile: false,
      };

      expect(() => new LoggerService(invalidConfig)).toThrow('Invalid log level');
    });

    it('should throw error for invalid format', () => {
      const invalidConfig: ILoggerConfig = {
        level: 'info',
        format: 'invalid' as any,
        transports: ['console'],
        enableConsole: true,
        enableFile: false,
      };

      expect(() => new LoggerService(invalidConfig)).toThrow('Invalid log format');
    });

    it('should throw error when no transports specified', () => {
      const invalidConfig: ILoggerConfig = {
        level: 'info',
        format: 'json',
        transports: [],
        enableConsole: true,
        enableFile: false,
      };

      expect(() => new LoggerService(invalidConfig)).toThrow('At least one transport must be specified');
    });

    it('should throw error for invalid transport', () => {
      const invalidConfig: ILoggerConfig = {
        level: 'info',
        format: 'json',
        transports: ['invalid' as any],
        enableConsole: true,
        enableFile: false,
      };

      expect(() => new LoggerService(invalidConfig)).toThrow('Invalid transport');
    });

    it('should require filePath when using file transport', () => {
      const invalidConfig: ILoggerConfig = {
        level: 'info',
        format: 'json',
        transports: ['file'],
        enableConsole: true,
        enableFile: true,
      };

      expect(() => new LoggerService(invalidConfig)).toThrow('filePath is required');
    });

    it('should throw error for invalid maxFileSize', () => {
      const invalidConfig: ILoggerConfig = {
        level: 'info',
        format: 'json',
        transports: ['file'],
        filePath: './logs.txt',
        maxFileSize: 512, // Less than 1KB
        enableConsole: true,
        enableFile: true,
      };

      expect(() => new LoggerService(invalidConfig)).toThrow('maxFileSize must be at least 1KB');
    });
  });

  describe('Logging Methods', () => {
    it('should log debug message', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      logger.debug('debug message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log info message', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      logger.info('info message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log warn message', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      logger.warn('warning message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log error message', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const error = new Error('Test error');
      logger.error('error occurred', error);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log fatal message', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      logger.fatal('fatal error');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Log Levels', () => {
    it('should not log below configured level', () => {
      const config: ILoggerConfig = {
        level: 'warn',
        format: 'json',
        transports: ['console'],
        enableConsole: true,
        enableFile: false,
      };

      const strictLogger = new LoggerService(config);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      strictLogger.debug('debug'); // Should not log
      expect(consoleSpy).not.toHaveBeenCalled();

      strictLogger.info('info'); // Should not log
      expect(consoleSpy).not.toHaveBeenCalled();

      strictLogger.warn('warning'); // Should log
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log all levels when set to debug', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');
      logger.fatal('fatal');

      expect(consoleSpy).toHaveBeenCalledTimes(5);
    });

    it('should change log level', () => {
      logger.setLevel('error');
      expect(logger.getLevel()).toBe('error');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      logger.debug('debug'); // Should not log
      expect(consoleSpy).not.toHaveBeenCalled();

      logger.error('error'); // Should log
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should throw error for invalid level change', () => {
      expect(() => logger.setLevel('invalid' as LogLevel)).toThrow('Invalid log level');
    });
  });

  describe('Log Formatting', () => {
    it('should format message as JSON', () => {
      const config: ILoggerConfig = {
        level: 'info',
        format: 'json',
        transports: ['console'],
        enableConsole: true,
        enableFile: false,
      };

      const jsonLogger = new LoggerService(config);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      jsonLogger.info('test message');

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(() => JSON.parse(output)).not.toThrow();

      const parsed = JSON.parse(output);
      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('test message');
      expect(parsed.timestamp).toBeDefined();
    });

    it('should format message as pretty', () => {
      const config: ILoggerConfig = {
        level: 'info',
        format: 'pretty',
        transports: ['console'],
        enableConsole: true,
        enableFile: false,
      };

      const prettyLogger = new LoggerService(config);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      prettyLogger.info('test message');

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('test message');
      expect(output).toContain('INFO');
    });

    it('should include error stack trace in pretty format', () => {
      const config: ILoggerConfig = {
        level: 'error',
        format: 'pretty',
        transports: ['console'],
        enableConsole: true,
        enableFile: false,
      };

      const prettyLogger = new LoggerService(config);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const error = new Error('Test error');
      prettyLogger.error('error occurred', error);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('Test error');
    });
  });

  describe('Context Management', () => {
    it('should log with context', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const context: ILogContext = { userId: '123', requestId: 'req-456' };

      logger.info('user action', context);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('userId');
    });

    it('should create logger with context', () => {
      const context: ILogContext = { userId: '123' };
      const contextLogger = logger.withContext(context);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      contextLogger.info('message');

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('userId');
    });

    it('should get context', () => {
      const context: ILogContext = { userId: '123', sessionId: 'sess-789' };
      const contextLogger = logger.withContext(context);

      const retrievedContext = contextLogger.getContext();
      expect(retrievedContext.userId).toBe('123');
      expect(retrievedContext.sessionId).toBe('sess-789');
    });

    it('should clear context', () => {
      const context: ILogContext = { userId: '123' };
      const contextLogger = logger.withContext(context);

      contextLogger.clearContext();
      const retrievedContext = contextLogger.getContext();

      expect(Object.keys(retrievedContext).length).toBe(0);
    });

    it('should merge contexts', () => {
      const context1: ILogContext = { userId: '123' };
      const context2: ILogContext = { requestId: 'req-456' };

      const logger1 = logger.withContext(context1);
      const logger2 = logger1.withContext(context2);

      const finalContext = logger2.getContext();
      expect(finalContext.userId).toBe('123');
      expect(finalContext.requestId).toBe('req-456');
    });
  });

  describe('Error Handling', () => {
    it('should log Error object', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const error = new Error('Test error');

      logger.error('error occurred', error);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log unknown error type', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logger.error('error occurred', 'string error');

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle error with context', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const error = new Error('Test error');
      const context: ILogContext = { userId: '123' };

      logger.error('error occurred', error, context);

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Metrics', () => {
    it('should track log metrics', () => {
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      const metrics = logger.getMetrics();
      expect(metrics.totalLogs).toBe(4);
      expect(metrics.debugCount).toBe(1);
      expect(metrics.infoCount).toBe(1);
      expect(metrics.warnCount).toBe(1);
      expect(metrics.errorCount).toBe(1);
    });

    it('should not count logs below level', () => {
      const config: ILoggerConfig = {
        level: 'warn',
        format: 'json',
        transports: ['console'],
        enableConsole: true,
        enableFile: false,
      };

      const strictLogger = new LoggerService(config);

      strictLogger.debug('debug');
      strictLogger.info('info');
      strictLogger.warn('warn');

      const metrics = strictLogger.getMetrics();
      expect(metrics.totalLogs).toBe(1); // Only warn
    });

    it('should reset metrics', () => {
      logger.info('message');
      let metrics = logger.getMetrics();
      expect(metrics.totalLogs).toBe(1);

      logger.resetMetrics();
      metrics = logger.getMetrics();
      expect(metrics.totalLogs).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should get configuration', () => {
      const config = logger.getConfig();
      expect(config.level).toBe('debug');
      expect(config.format).toBe('json');
      expect(config.transports).toContain('console');
    });

    it('should return copy of configuration', () => {
      const config1 = logger.getConfig();
      const config2 = logger.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different objects
    });
  });

  describe('Multiple Transports', () => {
    it('should handle multiple transports', () => {
      const config: ILoggerConfig = {
        level: 'info',
        format: 'json',
        transports: ['console', 'file'],
        filePath: './logs.txt',
        enableConsole: true,
        enableFile: true,
      };

      const multiLogger = new LoggerService(config);
      expect(multiLogger.getConfig().transports.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      logger.info('');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle very long message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const longMessage = 'x'.repeat(10000);
      logger.info(longMessage);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle special characters', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      logger.info('message with "quotes" and \'apostrophes\'');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle unicode characters', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      logger.info('message with émojis 🚀 and ñ');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
