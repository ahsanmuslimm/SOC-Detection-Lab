/**
 * Configuration Service - Unit Tests
 * Tests all configuration loading and validation
 */

import { ConfigService } from '../../src/main';
import type { IConfig } from '../../src/types';

describe('ConfigService', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    // Clear all SOC_ prefixed variables
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith('APP_') || key.startsWith('DB_') || key.startsWith('REDIS_') ||
          key.startsWith('OPENSEARCH_') || key.startsWith('JWT_') || key.startsWith('BCRYPT_') ||
          key.startsWith('CORS_') || key.startsWith('LOG_') || key.startsWith('MONITORING_') ||
          key === 'NODE_ENV' || key === 'DEBUG') {
        delete process.env[key];
      }
    });
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Loading Configuration', () => {
    it('should load default configuration values', () => {
      const config = new ConfigService();
      expect(config).toBeDefined();
      expect(config.getConfig()).toBeDefined();
    });

    it('should load app configuration with defaults', () => {
      const config = new ConfigService();
      const appConfig = config.getSection('app');

      expect(appConfig.name).toBe('SOC-Detection-Lab');
      expect(appConfig.version).toBe('1.0.0');
      expect(appConfig.port).toBe(3000);
      expect(appConfig.host).toBe('localhost');
      expect(appConfig.debug).toBe(false);
    });

    it('should load app configuration from environment variables', () => {
      process.env.APP_NAME = 'CustomApp';
      process.env.APP_PORT = '8080';
      process.env.APP_HOST = '0.0.0.0';
      process.env.DEBUG = 'true';

      const config = new ConfigService();
      const appConfig = config.getSection('app');

      expect(appConfig.name).toBe('CustomApp');
      expect(appConfig.port).toBe(8080);
      expect(appConfig.host).toBe('0.0.0.0');
      expect(appConfig.debug).toBe(true);
    });

    it('should load database configuration with defaults', () => {
      const config = new ConfigService();
      const dbConfig = config.getSection('database');

      expect(dbConfig.host).toBe('localhost');
      expect(dbConfig.port).toBe(5432);
      expect(dbConfig.database).toBe('soc_detection_lab');
      expect(dbConfig.username).toBe('postgres');
      expect(dbConfig.ssl).toBe(false);
      expect(dbConfig.poolMin).toBe(2);
      expect(dbConfig.poolMax).toBe(10);
    });

    it('should load database configuration from environment variables', () => {
      process.env.DB_HOST = 'db.example.com';
      process.env.DB_PORT = '5433';
      process.env.DB_NAME = 'custom_db';
      process.env.DB_USER = 'admin';
      process.env.DB_PASSWORD = 'secret';
      process.env.DB_SSL = 'true';
      process.env.DB_POOL_MIN = '5';
      process.env.DB_POOL_MAX = '20';

      const config = new ConfigService();
      const dbConfig = config.getSection('database');

      expect(dbConfig.host).toBe('db.example.com');
      expect(dbConfig.port).toBe(5433);
      expect(dbConfig.database).toBe('custom_db');
      expect(dbConfig.username).toBe('admin');
      expect(dbConfig.password).toBe('secret');
      expect(dbConfig.ssl).toBe(true);
      expect(dbConfig.poolMin).toBe(5);
      expect(dbConfig.poolMax).toBe(20);
    });

    it('should load cache configuration with defaults', () => {
      const config = new ConfigService();
      const cacheConfig = config.getSection('cache');

      expect(cacheConfig.host).toBe('localhost');
      expect(cacheConfig.port).toBe(6379);
      expect(cacheConfig.db).toBe(0);
      expect(cacheConfig.ttl).toBe(3600);
      expect(cacheConfig.enabled).toBe(true);
    });

    it('should load search configuration with defaults', () => {
      const config = new ConfigService();
      const searchConfig = config.getSection('search');

      expect(searchConfig.host).toBe('localhost');
      expect(searchConfig.port).toBe(9200);
      expect(searchConfig.scheme).toBe('http');
      expect(searchConfig.indexPrefix).toBe('soc-');
    });

    it('should load security configuration with defaults', () => {
      process.env.NODE_ENV = 'test'; // Set to test to skip production validation
      const config = new ConfigService();
      const securityConfig = config.getSection('security');

      expect(securityConfig.jwtExpiration).toBe('24h');
      expect(securityConfig.bcryptRounds).toBe(12);
      expect(securityConfig.corsCredentials).toBe(true);
      expect(Array.isArray(securityConfig.corsOrigins)).toBe(true);
    });

    it('should load logging configuration with defaults', () => {
      const config = new ConfigService();
      const loggingConfig = config.getSection('logging');

      expect(loggingConfig.level).toBe('info');
      expect(loggingConfig.format).toBe('json');
      expect(Array.isArray(loggingConfig.transport)).toBe(true);
    });

    it('should load monitoring configuration with defaults', () => {
      const config = new ConfigService();
      const monitoringConfig = config.getSection('monitoring');

      expect(monitoringConfig.enabled).toBe(true);
      expect(monitoringConfig.metricsPort).toBe(9090);
      expect(monitoringConfig.healthCheckInterval).toBe(60000);
    });
  });

  describe('Type Conversions', () => {
    it('should convert string numbers to numbers', () => {
      process.env.APP_PORT = '9999';
      process.env.DB_POOL_MAX = '50';

      const config = new ConfigService();
      expect(config.getSection('app').port).toBe(9999);
      expect(config.getSection('database').poolMax).toBe(50);
      expect(typeof config.getSection('app').port).toBe('number');
    });

    it('should convert string booleans to booleans', () => {
      process.env.DEBUG = 'true';
      process.env.DB_SSL = 'false';
      process.env.CACHE_ENABLED = '1';

      const config = new ConfigService();
      expect(config.getSection('app').debug).toBe(true);
      expect(config.getSection('database').ssl).toBe(false);
      expect(config.getSection('cache').enabled).toBe(true);
    });

    it('should handle comma-separated values', () => {
      process.env.CORS_ORIGINS = 'http://localhost:3000,http://localhost:3001,https://example.com';

      const config = new ConfigService();
      const origins = config.getSection('security').corsOrigins;

      expect(Array.isArray(origins)).toBe(true);
      expect(origins.length).toBe(3);
      expect(origins[0]).toBe('http://localhost:3000');
      expect(origins[2]).toBe('https://example.com');
    });
  });

  describe('Validation', () => {
    it('should throw error for invalid port numbers', () => {
      process.env.APP_PORT = '99999'; // Out of range
      expect(() => new ConfigService()).toThrow('Invalid port');
    });

    it('should throw error for non-numeric port', () => {
      process.env.APP_PORT = 'not-a-number';
      expect(() => new ConfigService()).toThrow('Invalid number configuration');
    });

    it('should throw error when DB_POOL_MIN > DB_POOL_MAX', () => {
      process.env.DB_POOL_MIN = '20';
      process.env.DB_POOL_MAX = '10';
      expect(() => new ConfigService()).toThrow('DB_POOL_MIN must be less than or equal to DB_POOL_MAX');
    });

    it('should require JWT_SECRET in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.DB_PASSWORD = 'secret'; // Required in prod
      // JWT_SECRET not set
      expect(() => new ConfigService()).toThrow('JWT_SECRET must be at least 32 characters');
    });

    it('should require DB_PASSWORD in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.DB_PASSWORD = ''; // Empty in production
      expect(() => new ConfigService()).toThrow('DB_PASSWORD is required in production');
    });

    it('should allow empty JWT_SECRET in test environment', () => {
      process.env.NODE_ENV = 'test';
      expect(() => new ConfigService()).not.toThrow();
    });

    it('should allow empty DB_PASSWORD in development', () => {
      process.env.NODE_ENV = 'development';
      expect(() => new ConfigService()).not.toThrow();
    });
  });

  describe('Get Configuration', () => {
    it('should return full configuration', () => {
      const config = new ConfigService();
      const fullConfig = config.getConfig();

      expect(fullConfig).toHaveProperty('app');
      expect(fullConfig).toHaveProperty('database');
      expect(fullConfig).toHaveProperty('cache');
      expect(fullConfig).toHaveProperty('security');
      expect(fullConfig).toHaveProperty('logging');
      expect(fullConfig).toHaveProperty('monitoring');
    });

    it('should get configuration by dot notation path', () => {
      process.env.DB_HOST = 'mydb.com';
      const config = new ConfigService();

      expect(config.get('database.host')).toBe('mydb.com');
      expect(config.get('app.port')).toBe(3000);
      expect(config.get('app.name')).toBe('SOC-Detection-Lab');
    });

    it('should return default value for missing path', () => {
      const config = new ConfigService();
      expect(config.get('nonexistent.path', 'default')).toBe('default');
    });

    it('should return undefined for missing path without default', () => {
      const config = new ConfigService();
      expect(config.get('nonexistent.path')).toBeUndefined();
    });
  });

  describe('Environment Checks', () => {
    it('should identify production environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.DB_PASSWORD = 'secret';

      const config = new ConfigService();
      expect(config.isProduction()).toBe(true);
      expect(config.isDevelopment()).toBe(false);
      expect(config.isTest()).toBe(false);
    });

    it('should identify development environment', () => {
      process.env.NODE_ENV = 'development';
      const config = new ConfigService();

      expect(config.isDevelopment()).toBe(true);
      expect(config.isProduction()).toBe(false);
      expect(config.isTest()).toBe(false);
    });

    it('should identify test environment', () => {
      process.env.NODE_ENV = 'test';
      const config = new ConfigService();

      expect(config.isTest()).toBe(true);
      expect(config.isDevelopment()).toBe(false);
      expect(config.isProduction()).toBe(false);
    });
  });

  describe('To Object (Debugging)', () => {
    it('should mask sensitive values in toObject()', () => {
      process.env.DB_PASSWORD = 'super-secret';
      process.env.JWT_SECRET = 'jwt-secret';
      process.env.OPENSEARCH_PASSWORD = 'search-secret';
      process.env.REDIS_PASSWORD = 'cache-secret';

      const config = new ConfigService();
      const obj = config.toObject();

      expect(obj.database).toHaveProperty('password', '***REDACTED***');
      expect(obj.security).toHaveProperty('jwtSecret', '***REDACTED***');
      expect(obj.search).toHaveProperty('password', '***REDACTED***');
      expect(obj.cache).toHaveProperty('password', '***REDACTED***');
    });

    it('should include non-sensitive configuration in toObject()', () => {
      process.env.APP_NAME = 'TestApp';
      process.env.DB_HOST = 'testdb.com';

      const config = new ConfigService();
      const obj = config.toObject();

      expect(obj.app).toHaveProperty('name', 'TestApp');
      expect(obj.database).toHaveProperty('host', 'testdb.com');
    });
  });

  describe('Configuration Sections', () => {
    it('should return app section', () => {
      const config = new ConfigService();
      const app = config.getSection('app');

      expect(app).toHaveProperty('name');
      expect(app).toHaveProperty('version');
      expect(app).toHaveProperty('environment');
      expect(app).toHaveProperty('port');
      expect(app).toHaveProperty('host');
      expect(app).toHaveProperty('debug');
    });

    it('should return database section', () => {
      const config = new ConfigService();
      const db = config.getSection('database');

      expect(db).toHaveProperty('host');
      expect(db).toHaveProperty('port');
      expect(db).toHaveProperty('database');
      expect(db).toHaveProperty('username');
      expect(db).toHaveProperty('password');
    });

    it('should return cache section', () => {
      const config = new ConfigService();
      const cache = config.getSection('cache');

      expect(cache).toHaveProperty('host');
      expect(cache).toHaveProperty('port');
      expect(cache).toHaveProperty('db');
      expect(cache).toHaveProperty('ttl');
      expect(cache).toHaveProperty('enabled');
    });
  });
});
