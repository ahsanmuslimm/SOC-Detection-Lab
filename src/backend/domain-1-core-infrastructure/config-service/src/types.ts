/**
 * Configuration Service - Type Definitions
 * Defines all configuration types and interfaces
 */

export interface IConfig {
  app: IAppConfig;
  database: IDatabaseConfig;
  cache: ICacheConfig;
  search: ISearchConfig;
  security: ISecurityConfig;
  logging: ILoggingConfig;
  monitoring: IMonitoringConfig;
}

export interface IAppConfig {
  name: string;
  version: string;
  environment: 'development' | 'production' | 'test';
  port: number;
  host: string;
  debug: boolean;
}

export interface IDatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  poolMin: number;
  poolMax: number;
  timeout: number;
}

export interface ICacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  ttl: number;
  enabled: boolean;
}

export interface ISearchConfig {
  host: string;
  port: number;
  scheme: 'http' | 'https';
  username: string;
  password: string;
  indexPrefix: string;
}

export interface ISecurityConfig {
  jwtSecret: string;
  jwtExpiration: string;
  bcryptRounds: number;
  corsOrigins: string[];
  corsCredentials: boolean;
}

export interface ILoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'pretty';
  transport: ('console' | 'file')[];
}

export interface IMonitoringConfig {
  enabled: boolean;
  metricsPort: number;
  healthCheckInterval: number;
}

export type ConfigKey = keyof IConfig;
export type EnvString = string | undefined;
export type EnvNumber = string | undefined;
export type EnvBoolean = 'true' | 'false' | undefined;
