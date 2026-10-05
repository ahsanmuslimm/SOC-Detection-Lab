/**
 * DatabaseClient
 *
 * Singleton pg.Pool wrapper for the SOC Detection Lab backend.
 * All repositories obtain their connection through this module.
 *
 * Configuration is read from environment variables:
 *   DATABASE_URL  — full connection string (takes priority over individual vars)
 *   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD — individual parts
 *   DB_POOL_MIN, DB_POOL_MAX — pool sizing (defaults: 2 / 10)
 */

import { Pool, PoolClient } from 'pg';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  error?: string;
}

export class DatabaseClient {
  private static instance: DatabaseClient | null = null;
  private pool: Pool;

  private constructor() {
    const poolConfig = process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL }
      : {
          host:     process.env.DB_HOST     ?? 'localhost',
          port:     Number(process.env.DB_PORT)     || 5432,
          database: process.env.DB_NAME     ?? 'soc_lab',
          user:     process.env.DB_USER     ?? 'postgres',
          password: process.env.DB_PASSWORD ?? '',
          min:      Number(process.env.DB_POOL_MIN) || 2,
          max:      Number(process.env.DB_POOL_MAX) || 10,
        };

    this.pool = new Pool(poolConfig);

    this.pool.on('error', (err: Error) => {
      console.error('[DatabaseClient] Unexpected pool error:', err.message);
    });
  }

  /** Returns the shared singleton instance. */
  static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  /**
   * Execute a parameterised SQL statement and return all rows.
   * Uses `$1`, `$2`, … placeholders.
   */
  async query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<T[]> {
    const result = await this.pool.query(sql, params);
    return result.rows as T[];
  }

  /**
   * Execute a parameterised SQL statement and return the first row or null.
   */
  async queryOne<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  /**
   * Execute a function inside a BEGIN … COMMIT transaction.
   * Automatically rolls back on error.
   */
  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /** Lightweight liveness check — runs SELECT 1. */
  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      await this.pool.query('SELECT 1');
      return { status: 'healthy', responseTime: Date.now() - start };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { status: 'unhealthy', responseTime: Date.now() - start, error: msg };
    }
  }

  /** Drain the pool and reset the singleton (useful in tests / scripts). */
  async end(): Promise<void> {
    await this.pool.end();
    DatabaseClient.instance = null;
  }
}

/**
 * Returns true when at least one of DATABASE_URL or DB_HOST is present
 * in the environment. The orchestrator uses this to decide whether to
 * wire PostgreSQL repositories or fall back to in-memory services.
 */
export function isDatabaseConfigured(): boolean {
  return !!(process.env.DATABASE_URL ?? process.env.DB_HOST);
}
