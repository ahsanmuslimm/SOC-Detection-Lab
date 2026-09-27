/**
 * PostgreSQL Client - Type Definitions
 * Type definitions for database operations and connections
 */

import type { Pool, PoolClient, QueryResult } from 'pg';

/**
 * Connection pool configuration
 */
export interface IPoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  min: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  maxUses: number;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

/**
 * Query options
 */
export interface IQueryOptions {
  timeout?: number;
  retry?: number;
  retryDelay?: number;
}

/**
 * Query result wrapper
 */
export interface IQueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
  oid?: number;
  duration?: number;
}

/**
 * Transaction options
 */
export interface ITransactionOptions {
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  timeout?: number;
}

/**
 * Transaction callback
 */
export type TransactionCallback<T> = (client: PoolClient) => Promise<T>;

/**
 * Query with parameters
 */
export interface IQuery {
  text: string;
  values?: unknown[];
  timeout?: number;
}

/**
 * Prepared statement
 */
export interface IPreparedStatement {
  name: string;
  text: string;
  values: unknown[];
}

/**
 * Database health check result
 */
export interface IHealthCheckResult {
  healthy: boolean;
  timestamp: Date;
  connectionTime?: number;
  queryTime?: number;
  poolStats?: {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  };
  error?: string;
}

/**
 * Connection pool statistics
 */
export interface IPoolStatistics {
  totalConnections: number;
  idleConnections: number;
  activeConnections: number;
  waitingRequests: number;
  createdConnections: number;
  destroyedConnections: number;
  errorCount: number;
}

/**
 * Migration info
 */
export interface IMigration {
  name: string;
  version: number;
  executedAt: Date;
}

/**
 * Query result event
 */
export interface IQueryEvent {
  query: string;
  duration: number;
  rowCount: number;
  timestamp: Date;
  error?: string;
}

/**
 * Connection event
 */
export interface IConnectionEvent {
  type: 'acquired' | 'released' | 'created' | 'removed';
  timestamp: Date;
  poolSize: number;
}

/**
 * Batch operation result
 */
export interface IBatchResult<T> {
  successful: number;
  failed: number;
  total: number;
  results: Array<{ success: boolean; data?: T; error?: string }>;
  duration: number;
}

/**
 * Index information
 */
export interface IIndexInfo {
  name: string;
  tableName: string;
  columns: string[];
  unique: boolean;
  primary: boolean;
}

/**
 * Table schema information
 */
export interface ITableSchema {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    default?: string;
  }>;
  indexes: IIndexInfo[];
  primaryKey?: string[];
}

/**
 * Pagination info
 */
export interface IPaginationInfo {
  limit: number;
  offset: number;
  total: number;
  pages: number;
  page: number;
}

/**
 * Paginated query result
 */
export interface IPaginatedResult<T> {
  data: T[];
  pagination: IPaginationInfo;
}

/**
 * Query builder for safe queries
 */
export interface IQueryBuilder {
  table(name: string): IQueryBuilder;
  select(...columns: string[]): IQueryBuilder;
  where(condition: string, values?: unknown[]): IQueryBuilder;
  andWhere(condition: string, values?: unknown[]): IQueryBuilder;
  orWhere(condition: string, values?: unknown[]): IQueryBuilder;
  orderBy(column: string, direction?: 'asc' | 'desc'): IQueryBuilder;
  limit(limit: number): IQueryBuilder;
  offset(offset: number): IQueryBuilder;
  build(): IQuery;
}

/**
 * Connection listener type
 */
export type ConnectionListener = (event: IConnectionEvent) => void;

/**
 * Query listener type
 */
export type QueryListener = (event: IQueryEvent) => void;

/**
 * Query timeout configuration
 */
export interface IQueryTimeoutConfig {
  default: number;
  max: number;
}

/**
 * Connection retry policy
 */
export interface IRetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}
