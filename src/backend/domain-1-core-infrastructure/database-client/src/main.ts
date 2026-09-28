/**
 * Database Client Module - Main Implementation
 *
 * PostgreSQL database client with connection pooling, transaction support,
 * query execution, health checks, and event emission.
 *
 * @module database-client/main
 */

import { Pool, PoolClient } from 'pg';
import { EventEmitter } from 'events';
import type {
  IDatabase,
  IDatabaseConfig,
  IHealthCheckResult,
  IQueryConfig,
  IQueryResult,
  IPoolClient,
  IPoolStats,
  TransactionCallback,
  IDatabaseEvents,
  IQueryMetrics,
  IPoolError
} from './types';
import {
  DEFAULT_DATABASE_CONFIG,
  DEFAULT_QUERY_TIMEOUT,
  DEFAULT_HEALTH_CHECK_TIMEOUT,
  MAX_POOL_SIZE,
  MIN_POOL_SIZE,
  POSTGRES_ERROR_CODES
} from './types';

/**
 * PostgreSQL Database Client
 *
 * Provides connection pooling, transaction management, query execution,
 * and health monitoring for PostgreSQL database.
 */
export class PostgresClient implements IDatabase, IDatabaseEvents {
  private pool: Pool;
  private connected: boolean = false;
  private queryMetrics: IQueryMetrics = {
    totalQueries: 0,
    totalTime: 0,
    averageTime: 0,
    errors: 0
  };
  private eventEmitter: EventEmitter = new EventEmitter();

  /**
   * Initialize database client with configuration
   */
  constructor(config: IDatabaseConfig) {
    const poolConfig = {
      host: config.host,
      port: config.port || DEFAULT_DATABASE_CONFIG.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: Math.min(config.max || DEFAULT_DATABASE_CONFIG.max || 10, MAX_POOL_SIZE),
      idleTimeoutMillis: config.idleTimeoutMillis || DEFAULT_DATABASE_CONFIG.idleTimeoutMillis,
      connectionTimeoutMillis: config.connectionTimeoutMillis || DEFAULT_DATABASE_CONFIG.connectionTimeoutMillis,
      ssl: config.ssl || DEFAULT_DATABASE_CONFIG.ssl,
      application_name: 'soc-detection-lab'
    };

    this.pool = new Pool(poolConfig);

    // Handle pool errors
    this.pool.on('error', (err: IPoolError) => {
      console.error('[Database] Unexpected pool error:', err);
      this.eventEmitter.emit('error', err);
    });

    // Handle client errors during connection
    this.pool.on('connect', () => {
      this.connected = true;
      this.eventEmitter.emit('connect');
    });
  }

  /**
   * Execute a SQL query
   */
  async query<T = any>(
    sqlOrConfig: string | IQueryConfig,
    values?: any[]
  ): Promise<IQueryResult<T>> {
    if (!this.connected) {
      await this.ensureConnection();
    }

    const startTime = Date.now();
    let sql: string;

    if (typeof sqlOrConfig === 'string') {
      sql = sqlOrConfig;
    } else {
      sql = sqlOrConfig.text;
      values = sqlOrConfig.values;
    }

    try {
      const result = await this.pool.query<T>(sql, values);
      const duration = Date.now() - startTime;

      this.recordQuery(sql, duration);
      this.eventEmitter.emit('query', sql, duration);

      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        command: result.command
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.queryMetrics.errors++;
      this.eventEmitter.emit('error', error);

      console.error('[Database] Query error:', {
        sql,
        error: error.message,
        duration,
        code: error.code
      });

      throw this.formatDatabaseError(error, sql);
    }
  }

  /**
   * Execute query and return single row
   */
  async queryOne<T = any>(sql: string, values?: any[]): Promise<T | null> {
    const result = await this.query<T>(sql, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Execute query and return all rows
   */
  async queryMany<T = any>(sql: string, values?: any[]): Promise<T[]> {
    const result = await this.query<T>(sql, values);
    return result.rows;
  }

  /**
   * Execute query within transaction
   *
   * Provides ACID guarantees for multiple operations.
   * Automatically commits on success, rolls back on error.
   */
  async transaction<T>(callback: TransactionCallback<T>): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client as IPoolClient);
      await client.query('COMMIT');
      return result;
    } catch (error: any) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('[Database] Rollback failed:', rollbackError);
      }

      console.error('[Database] Transaction failed:', error.message);
      throw this.formatDatabaseError(error, 'TRANSACTION');
    } finally {
      client.release();
    }
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats(): IPoolStats {
    return {
      totalConnections: this.pool.totalCount,
      availableConnections: this.pool.availableCount,
      waitingQueue: this.pool.waitingCount,
      idleConnections: this.pool.idleCount
    };
  }

  /**
   * Perform health check
   *
   * Executes a simple query to verify database connectivity and performance.
   */
  async healthCheck(): Promise<IHealthCheckResult> {
    const startTime = Date.now();

    try {
      await Promise.race([
        this.query('SELECT 1 as alive'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), DEFAULT_HEALTH_CHECK_TIMEOUT)
        )
      ]);

      const responseTime = Date.now() - startTime;
      const poolStats = this.getPoolStats();

      return {
        status: responseTime > 1000 ? 'degraded' : 'healthy',
        timestamp: new Date(),
        responseTime,
        message: `Database is ${responseTime > 1000 ? 'degraded' : 'healthy'} (${responseTime}ms)`,
        poolStats
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      return {
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime,
        message: `Database health check failed: ${error.message}`,
        poolStats: this.getPoolStats()
      };
    }
  }

  /**
   * Close database connection pool
   *
   * Gracefully closes all connections. Waiting queries will complete
   * before connections are terminated.
   */
  async close(): Promise<void> {
    try {
      await this.pool.end();
      this.connected = false;
      this.eventEmitter.emit('disconnect');
      console.log('[Database] Connection pool closed');
    } catch (error: any) {
      console.error('[Database] Error closing pool:', error.message);
      throw error;
    }
  }

  /**
   * Check if database is connected
   */
  isConnected(): boolean {
    return this.connected && this.pool.totalCount > 0;
  }

  /**
   * Get query metrics
   */
  getMetrics(): IQueryMetrics {
    return {
      ...this.queryMetrics,
      averageTime: this.queryMetrics.totalQueries > 0 
        ? this.queryMetrics.totalTime / this.queryMetrics.totalQueries 
        : 0
    };
  }

  /**
   * Reset query metrics
   */
  resetMetrics(): void {
    this.queryMetrics = {
      totalQueries: 0,
      totalTime: 0,
      averageTime: 0,
      errors: 0
    };
  }

  /**
   * Batch insert rows
   *
   * Efficiently insert multiple rows using a single query.
   * Useful for bulk loading data.
   */
  async batchInsert<T = any>(
    table: string,
    rows: Record<string, any>[],
    batchSize: number = 1000
  ): Promise<number> {
    if (rows.length === 0) return 0;

    let inserted = 0;
    const columns = Object.keys(rows[0]);
    const placeholderTemplate = `(${columns.map((_, i) => `$${i + 1}`).join(', ')})`;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const values: any[] = [];
      const placeholders: string[] = [];

      batch.forEach((row, rowIndex) => {
        const offset = rowIndex * columns.length;
        placeholders.push(
          `(${columns.map((_, j) => `$${offset + j + 1}`).join(', ')})`
        );
        columns.forEach(col => values.push(row[col]));
      });

      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders.join(', ')}`;
      const result = await this.query(sql, values);
      inserted += result.rowCount;
    }

    return inserted;
  }

  /**
   * Event emitter interface
   */
  on(event: string, handler: Function): void {
    this.eventEmitter.on(event, handler);
  }

  off(event: string, handler: Function): void {
    this.eventEmitter.off(event, handler);
  }

  /**
   * Ensure connection is established
   */
  private async ensureConnection(): Promise<void> {
    try {
      await this.query('SELECT 1');
      this.connected = true;
    } catch (error: any) {
      console.error('[Database] Connection check failed:', error.message);
      throw error;
    }
  }

  /**
   * Record query metrics
   */
  private recordQuery(sql: string, duration: number): void {
    this.queryMetrics.totalQueries++;
    this.queryMetrics.totalTime += duration;

    if (duration > 1000) {
      console.warn(`[Database] Slow query (${duration}ms):`, sql.substring(0, 100));
    }
  }

  /**
   * Format database errors with context
   */
  private formatDatabaseError(error: any, sql: string): Error {
    const message = this.getErrorMessage(error);

    const formattedError = new Error(
      `Database Error: ${message}\nSQL: ${sql.substring(0, 200)}`
    );

    return formattedError;
  }

  /**
   * Get human-readable error message from PostgreSQL error
   */
  private getErrorMessage(error: any): string {
    if (error.code === POSTGRES_ERROR_CODES.UNIQUE_VIOLATION) {
      return 'Unique constraint violation';
    }
    if (error.code === POSTGRES_ERROR_CODES.FOREIGN_KEY_VIOLATION) {
      return 'Foreign key constraint violation';
    }
    if (error.code === POSTGRES_ERROR_CODES.NOT_NULL_VIOLATION) {
      return 'Not null constraint violation';
    }
    if (error.code === POSTGRES_ERROR_CODES.CHECK_VIOLATION) {
      return 'Check constraint violation';
    }
    if (error.code === POSTGRES_ERROR_CODES.SYNTAX_ERROR) {
      return 'SQL syntax error';
    }
    if (error.code === POSTGRES_ERROR_CODES.PERMISSION_DENIED) {
      return 'Permission denied';
    }
    if (error.code === POSTGRES_ERROR_CODES.CONNECTION_FAILURE) {
      return 'Connection failure';
    }

    return error.message || 'Unknown database error';
  }
}

/**
 * Factory function to create database client
 */
export function createDatabase(config: IDatabaseConfig): IDatabase {
  return new PostgresClient(config);
}

/**
 * Create database client with connection check
 */
export async function createDatabaseWithCheck(config: IDatabaseConfig): Promise<IDatabase> {
  const db = new PostgresClient(config);
  const health = await db.healthCheck();

  if (health.status === 'unhealthy') {
    await db.close();
    throw new Error(`Failed to connect to database: ${health.message}`);
  }

  console.log(`[Database] Connected successfully (${health.responseTime}ms)`);
  return db;
}

/**
 * Singleton instance
 */
let instance: IDatabase | null = null;

/**
 * Get or create database singleton
 */
export function getDatabase(config?: IDatabaseConfig): IDatabase {
  if (!instance && config) {
    instance = createDatabase(config);
  }
  if (!instance) {
    throw new Error('Database not initialized. Call createDatabase first.');
  }
  return instance;
}

/**
 * Set database singleton (for testing)
 */
export function setDatabase(db: IDatabase): void {
  instance = db;
}

/**
 * Reset database singleton
 */
export function resetDatabase(): void {
  instance = null;
}

export { PostgresClient };
