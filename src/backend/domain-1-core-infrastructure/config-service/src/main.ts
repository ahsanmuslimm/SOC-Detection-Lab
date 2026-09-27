/**
 * Configuration Service - Main Implementation
 * Manages application configuration from environment variables
 */

import type { IConfig, IAppConfig, IDatabaseConfig, ICacheConfig, ISearchConfig, ISecurityConfig, ILoggingConfig, IMonitoringConfig } from './types';

export class ConfigService {
  private config: IConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfig(): IConfig {
    return {
      app: this.loadAppConfig(),
      database: this.loadDatabaseConfig(),
      cache: this.loadCacheConfig(),
      search: this.loadSearchConfig(),
      security: this.loadSecurityConfig(),
      logging: this.loadLoggingConfig(),
      monitoring: this.loadMonitoringConfig(),
    };
  }

  /**
   * Load application configuration
   */
  private loadAppConfig(): IAppConfig {
    return {
      name: this.getString('APP_NAME', 'SOC-Detection-Lab'),
      version: this.getString('APP_VERSION', '1.0.0'),
      environment: (this.getString('NODE_ENV', 'development') as IAppConfig['environment']),
      port: this.getNumber('APP_PORT', 3000),
      host: this.getString('APP_HOST', 'localhost'),
      debug: this.getBoolean('DEBUG', false),
    };
  }

  /**
   * Load database configuration
   */
  private loadDatabaseConfig(): IDatabaseConfig {
    return {
      host: this.getString('DB_HOST', 'localhost'),
      port: this.getNumber('DB_PORT', 5432),
      database: this.getString('DB_NAME', 'soc_detection_lab'),
      username: this.getString('DB_USER', 'postgres'),
      password: this.getString('DB_PASSWORD', ''),
      ssl: this.getBoolean('DB_SSL', false),
      poolMin: this.getNumber('DB_POOL_MIN', 2),
      poolMax: this.getNumber('DB_POOL_MAX', 10),
      timeout: this.getNumber('DB_TIMEOUT', 5000),
    };
  }

  /**
   * Load cache configuration
   */
  private loadCacheConfig(): ICacheConfig {
    return {
      host: this.getString('REDIS_HOST', 'localhost'),
      port: this.getNumber('REDIS_PORT', 6379),
      password: this.getString('REDIS_PASSWORD'),
      db: this.getNumber('REDIS_DB', 0),
      ttl: this.getNumber('REDIS_TTL_DEFAULT', 3600),
      enabled: this.getBoolean('CACHE_ENABLED', true),
    };
  }

  /**
   * Load search configuration
   */
  private loadSearchConfig(): ISearchConfig {
    return {
      host: this.getString('OPENSEARCH_HOST', 'localhost'),
      port: this.getNumber('OPENSEARCH_PORT', 9200),
      scheme: (this.getString('OPENSEARCH_SCHEME', 'http') as ISearchConfig['scheme']),
      username: this.getString('OPENSEARCH_USERNAME', 'admin'),
      password: this.getString('OPENSEARCH_PASSWORD', ''),
      indexPrefix: this.getString('OPENSEARCH_INDEX_PREFIX', 'soc-'),
    };
  }

  /**
   * Load security configuration
   */
  private loadSecurityConfig(): ISecurityConfig {
    return {
      jwtSecret: this.getString('JWT_SECRET', ''),
      jwtExpiration: this.getString('JWT_EXPIRATION', '24h'),
      bcryptRounds: this.getNumber('BCRYPT_ROUNDS', 12),
      corsOrigins: this.getString('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001').split(','),
      corsCredentials: this.getBoolean('CORS_CREDENTIALS', true),
    };
  }

  /**
   * Load logging configuration
   */
  private loadLoggingConfig(): ILoggingConfig {
    return {
      level: (this.getString('LOG_LEVEL', 'info') as ILoggingConfig['level']),
      format: (this.getString('LOG_FORMAT', 'json') as ILoggingConfig['format']),
      transport: this.getString('LOG_TRANSPORT', 'console,file').split(',') as ('console' | 'file')[],
    };
  }

  /**
   * Load monitoring configuration
   */
  private loadMonitoringConfig(): IMonitoringConfig {
    return {
      enabled: this.getBoolean('MONITORING_ENABLED', true),
      metricsPort: this.getNumber('METRICS_PORT', 9090),
      healthCheckInterval: this.getNumber('HEALTH_CHECK_INTERVAL', 60000),
    };
  }

  /**
   * Get string environment variable
   */
  private getString(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (value !== undefined && value !== '') {
      return value;
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required configuration: ${key}`);
  }

  /**
   * Get number environment variable
   */
  private getNumber(key: string, defaultValue?: number): number {
    const value = process.env[key];
    if (value !== undefined && value !== '') {
      const num = Number(value);
      if (!Number.isNaN(num)) {
        return num;
      }
      throw new Error(`Invalid number configuration: ${key}=${value}`);
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required configuration: ${key}`);
  }

  /**
   * Get boolean environment variable
   */
  private getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = process.env[key];
    if (value !== undefined && value !== '') {
      return value === 'true' || value === '1' || value === 'yes';
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    return false;
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    // Validate required security settings for production
    if (this.config.app.environment === 'production') {
      if (!this.config.security.jwtSecret || this.config.security.jwtSecret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters in production');
      }
      if (this.config.database.password === '') {
        throw new Error('DB_PASSWORD is required in production');
      }
    }

    // Validate port range
    if (this.config.app.port < 1 || this.config.app.port > 65535) {
      throw new Error(`Invalid port: ${this.config.app.port}`);
    }

    // Validate database pool settings
    if (this.config.database.poolMin > this.config.database.poolMax) {
      throw new Error('DB_POOL_MIN must be less than or equal to DB_POOL_MAX');
    }
  }

  /**
   * Get full configuration
   */
  getConfig(): IConfig {
    return this.config;
  }

  /**
   * Get specific configuration section
   */
  getSection<T extends keyof IConfig>(section: T): IConfig[T] {
    return this.config[section];
  }

  /**
   * Get configuration value by path (dot notation)
   * Example: get('database.host') returns the database host
   */
  get(path: string, defaultValue?: unknown): unknown {
    const keys = path.split('.');
    let value: unknown = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.config.app.environment === 'production';
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }

  /**
   * Check if running in test
   */
  isTest(): boolean {
    return this.config.app.environment === 'test';
  }

  /**
   * Get all configuration as object (for debugging)
   * Sensitive values are masked
   */
  toObject(): Record<string, unknown> {
    return {
      app: this.config.app,
      database: {
        ...this.config.database,
        password: '***REDACTED***',
      },
      cache: {
        ...this.config.cache,
        password: this.config.cache.password ? '***REDACTED***' : undefined,
      },
      search: {
        ...this.config.search,
        password: '***REDACTED***',
      },
      security: {
        ...this.config.security,
        jwtSecret: '***REDACTED***',
      },
      logging: this.config.logging,
      monitoring: this.config.monitoring,
    };
  }
}
