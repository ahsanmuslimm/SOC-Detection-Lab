/**
 * PostgreSQL Client - Main Implementation
 * Database connection pooling, query execution, and transaction management
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import type {
  IPoolConfig,
  IQueryOptions,
  IQueryResult,
  ITransactionOptions,
  TransactionCallback,
  IQuery,
  IHealthCheckResult,
  IPoolStatistics,
  IPaginatedResult,
  IPaginationInfo,
  IQueryEvent,
  IConnectionEvent,
  ConnectionListener,
  QueryListener,
} from './types';

/**
 * PostgreSQL Client - Connection pooling and query management
 */
export class PostgresClient {
  private pool: Pool;
  private queryListeners: Set<QueryListener> = new Set();
  private connectionListeners: Set<ConnectionListener> = new Set();
  private isInitialized = false;
  private queryCount = 0;
  private errorCount = 0;

  constructor(config: IPoolConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: config.max,
      min: config.min,
      idleTimeoutMillis: config.idleTimeoutMillis,
      connectionTimeoutMillis: config.connectionTimeoutMillis,
      maxUses: config.maxUses,
      ssl: config.ssl,
    });

    this.setupPoolEvents();
  }

  /**
   * Setup pool event listeners
   */
  private setupPoolEvents(): void {
    this.pool.on('error', (err) => {
      this.errorCount++;
      console.error('[PostgresClient] Pool error:', err);
    });

    this.pool.on('connect', () => {
      this.notifyConnectionEvent({
        type: 'created',
        timestamp: new Date(),
        poolSize: this.pool.totalCount,
      });
    });

    this.pool.on('remove', () => {
      this.notifyConnectionEvent({
        type: 'removed',
        timestamp: new Date(),
        poolSize: this.pool.totalCount,
      });
    });
  }

  /**
   * Initialize connection pool
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      this.isInitialized = true;
    } catch (err) {
      throw new Error(`Failed to initialize PostgreSQL pool: ${err}`);
    }
  }

  /**
   * Execute a query
   */
  async query<T = any>(
    text: string,
    values?: unknown[],
    options?: IQueryOptions
  ): Promise<IQueryResult<T>> {
    const startTime = Date.now();
    const timeout = options?.timeout || 30000;
    const retry = options?.retry || 0;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        const result = await Promise.race([
          this.pool.query<T>(text, values),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), timeout)
          ),
        ]);

        const duration = Date.now() - startTime;
        this.queryCount++;

        this.notifyQueryEvent({
          query: text,
          duration,
          rowCount: result.rowCount || 0,
          timestamp: new Date(),
        });

        return {
          rows: result.rows,
          rowCount: result.rowCount || 0,
          command: result.command,
          oid: result.oid,
          duration,
        };
      } catch (err) {
        lastError = err as Error;

        if (attempt < retry && options?.retryDelay) {
          await this.sleep(options.retryDelay);
        }
      }
    }

    this.errorCount++;
    throw lastError || new Error('Query failed');
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T>(
    callback: TransactionCallback<T>,
    options?: ITransactionOptions
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      if (options?.isolationLevel) {
        await client.query(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`);
      }

      const result = await callback(client);
      await client.query('COMMIT');

      this.notifyConnectionEvent({
        type: 'released',
        timestamp: new Date(),
        poolSize: this.pool.totalCount,
      });

      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      this.errorCount++;
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Execute query with client
   */
  async withClient<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      return await callback(client);
    } finally {
      client.release();
    }
  }

  /**
   * Batch insert operation
   */
  async batchInsert<T>(
    table: string,
    rows: T[],
    chunkSize: number = 100
  ): Promise<number> {
    let totalInserted = 0;

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const result = await this.transaction(async (client) => {
        let inserted = 0;

        for (const row of chunk) {
          const columns = Object.keys(row as any);
          const values = Object.values(row as any);
          const placeholders = columns
            .map((_, idx) => `$${idx + 1}`)
            .join(',');

          const query = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`;
          await client.query(query, values);
          inserted++;
        }

        return inserted;
      });

      totalInserted += result;
    }

    return totalInserted;
  }

  /**
   * Execute paginated query
   */
  async paginated<T>(
    query: string,
    values: unknown[],
    page: number,
    limit: number
  ): Promise<IPaginatedResult<T>> {
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM (${query}) as subquery`;
    const countResult = await this.query<{ count: string }>(countQuery, values);
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    // Get paginated data
    const paginatedQuery = `${query} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    const result = await this.query<T>(paginatedQuery, [...values, limit, offset]);

    const pagination: IPaginationInfo = {
      limit,
      offset,
      total,
      page,
      pages: Math.ceil(total / limit),
    };

    return {
      data: result.rows,
      pagination,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<IHealthCheckResult> {
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        this.query('SELECT 1 as health'),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        ),
      ]);

      const duration = Date.now() - startTime;

      return {
        healthy: true,
        timestamp: new Date(),
        connectionTime: duration,
        poolStats: {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount,
        },
      };
    } catch (err) {
      return {
        healthy: false,
        timestamp: new Date(),
        error: (err as Error).message,
        poolStats: {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount,
        },
      };
    }
  }

  /**
   * Get pool statistics
   */
  getStatistics(): IPoolStatistics {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      activeConnections: this.pool.totalCount - this.pool.idleCount,
      waitingRequests: this.pool.waitingCount,
      createdConnections: this.queryCount,
      destroyedConnections: 0,
      errorCount: this.errorCount,
    };
  }

  /**
   * Close connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    this.isInitialized = false;
  }

  /**
   * Register query listener
   */
  onQuery(listener: QueryListener): this {
    this.queryListeners.add(listener);
    return this;
  }

  /**
   * Remove query listener
   */
  offQuery(listener: QueryListener): this {
    this.queryListeners.delete(listener);
    return this;
  }

  /**
   * Register connection listener
   */
  onConnection(listener: ConnectionListener): this {
    this.connectionListeners.add(listener);
    return this;
  }

  /**
   * Remove connection listener
   */
  offConnection(listener: ConnectionListener): this {
    this.connectionListeners.delete(listener);
    return this;
  }

  /**
   * Notify query listeners
   */
  private notifyQueryEvent(event: IQueryEvent): void {
    this.queryListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[PostgresClient] Query listener error:', err);
      }
    });
  }

  /**
   * Notify connection listeners
   */
  private notifyConnectionEvent(event: IConnectionEvent): void {
    this.connectionListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[PostgresClient] Connection listener error:', err);
      }
    });
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Is pool initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get query count
   */
  getQueryCount(): number {
    return this.queryCount;
  }

  /**
   * Get error count
   */
  getErrorCount(): number {
    return this.errorCount;
  }

  /**
   * Reset counters
   */
  resetCounters(): void {
    this.queryCount = 0;
    this.errorCount = 0;
  }
}

/**
 * Connection pool factory
 */
export function createPostgresClient(config: IPoolConfig): PostgresClient {
  return new PostgresClient(config);
}

/**
 * Default export
 */
export default PostgresClient;
