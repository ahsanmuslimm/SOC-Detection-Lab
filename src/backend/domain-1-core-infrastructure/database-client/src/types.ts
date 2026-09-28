/**
 * Database Client Module - Type Definitions
 *
 * Comprehensive type definitions for PostgreSQL database client,
 * connection pooling, transactions, and query operations.
 *
 * @module database-client/types
 */

/**
 * Database configuration interface
 */
export interface IDatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number; // Maximum pool connections
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  ssl?: boolean | object;
}

/**
 * Query result wrapper
 */
export interface IQueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
}

/**
 * Transaction callback function type
 */
export type TransactionCallback<T> = (client: IPoolClient) => Promise<T>;

/**
 * Pool client interface for transaction operations
 */
export interface IPoolClient {
  query<T = any>(sql: string, values?: any[]): Promise<IQueryResult<T>>;
  query<T = any>(config: IQueryConfig, values?: any[]): Promise<IQueryResult<T>>;
  release(err?: Error): void;
}

/**
 * Query configuration interface
 */
export interface IQueryConfig {
  text: string;
  values?: any[];
  rowMode?: string;
  timeout?: number;
}

/**
 * Database connection pool statistics
 */
export interface IPoolStats {
  totalConnections: number;
  availableConnections: number;
  waitingQueue: number;
  idleConnections: number;
}

/**
 * Health check result
 */
export interface IHealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  responseTime: number; // milliseconds
  message: string;
  poolStats?: IPoolStats;
}

/**
 * Migration metadata
 */
export interface IMigrationMeta {
  id: string;
  name: string;
  batch: number;
  executedAt: Date;
  duration: number; // milliseconds
}

/**
 * Database interface - main service
 */
export interface IDatabase {
  /**
   * Execute a query
   */
  query<T = any>(sql: string, values?: any[]): Promise<IQueryResult<T>>;

  /**
   * Execute query with config
   */
  query<T = any>(config: IQueryConfig): Promise<IQueryResult<T>>;

  /**
   * Execute query and return single row
   */
  queryOne<T = any>(sql: string, values?: any[]): Promise<T | null>;

  /**
   * Execute query and return all rows
   */
  queryMany<T = any>(sql: string, values?: any[]): Promise<T[]>;

  /**
   * Execute transaction
   */
  transaction<T>(callback: TransactionCallback<T>): Promise<T>;

  /**
   * Get connection pool statistics
   */
  getPoolStats(): IPoolStats;

  /**
   * Perform health check
   */
  healthCheck(): Promise<IHealthCheckResult>;

  /**
   * Close database connection pool
   */
  close(): Promise<void>;

  /**
   * Check if database is connected
   */
  isConnected(): boolean;
}

/**
 * Query builder interface - for type-safe queries
 */
export interface IQueryBuilder {
  select(...columns: string[]): this;
  from(table: string): this;
  where(condition: string, values?: any[]): this;
  and(condition: string, values?: any[]): this;
  or(condition: string, values?: any[]): this;
  join(table: string, on: string): this;
  leftJoin(table: string, on: string): this;
  orderBy(column: string, direction?: 'ASC' | 'DESC'): this;
  limit(count: number): this;
  offset(count: number): this;
  build(): { sql: string; values: any[] };
}

/**
 * Migration runner interface
 */
export interface IMigrationRunner {
  /**
   * Run pending migrations
   */
  up(): Promise<IMigrationMeta[]>;

  /**
   * Rollback last batch of migrations
   */
  down(): Promise<IMigrationMeta[]>;

  /**
   * Get migration status
   */
  status(): Promise<{
    pending: string[];
    executed: IMigrationMeta[];
  }>;

  /**
   * Reset database (drop all tables)
   */
  reset(): Promise<void>;

  /**
   * Refresh database (drop all and run all)
   */
  refresh(): Promise<void>;
}

/**
 * Prepared statement for repeated queries
 */
export interface IPreparedStatement {
  bind(...values: any[]): string;
}

/**
 * Database event emitter interface
 */
export interface IDatabaseEvents {
  on(event: 'query', handler: (sql: string, duration: number) => void): void;
  on(event: 'error', handler: (error: Error) => void): void;
  on(event: 'connect', handler: () => void): void;
  on(event: 'disconnect', handler: () => void): void;
  off(event: string, handler: Function): void;
}

/**
 * Raw SQL tagged template for type safety
 */
export type SQLTemplate = (
  strings: TemplateStringsArray,
  ...values: any[]
) => { sql: string; values: any[] };

/**
 * Batch insert options
 */
export interface IBatchInsertOptions {
  batchSize?: number; // Default: 1000
  returnId?: boolean;
  onConflict?: 'IGNORE' | 'REPLACE' | 'UPDATE';
}

/**
 * Connection pool error event
 */
export interface IPoolError extends Error {
  code?: string;
  severity?: string;
}

/**
 * Database schema interface
 */
export interface ISchema {
  version: number;
  tables: {
    [tableName: string]: {
      columns: {
        [columnName: string]: {
          type: string;
          nullable: boolean;
          default?: any;
          primaryKey?: boolean;
          unique?: boolean;
          index?: boolean;
        };
      };
      primaryKey: string[];
      foreignKeys: {
        column: string;
        referencesTable: string;
        referencesColumn: string;
      }[];
    };
  };
}

/**
 * Query metrics interface
 */
export interface IQueryMetrics {
  totalQueries: number;
  totalTime: number; // milliseconds
  averageTime: number;
  slowestQuery?: {
    sql: string;
    duration: number;
  };
  errors: number;
}

/**
 * Database configuration with defaults
 */
export const DEFAULT_DATABASE_CONFIG: Partial<IDatabaseConfig> = {
  port: 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: false
};

/**
 * Known PostgreSQL error codes
 */
export const POSTGRES_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
  SYNTAX_ERROR: '42601',
  PERMISSION_DENIED: '42501',
  DUPLICATE_OBJECT: '42710',
  CONNECTION_FAILURE: '08006'
} as const;

/**
 * Query timeout (milliseconds)
 */
export const DEFAULT_QUERY_TIMEOUT = 30000;

/**
 * Health check timeout (milliseconds)
 */
export const DEFAULT_HEALTH_CHECK_TIMEOUT = 5000;

/**
 * Maximum pool size (production)
 */
export const MAX_POOL_SIZE = 50;

/**
 * Minimum pool size
 */
export const MIN_POOL_SIZE = 2;
