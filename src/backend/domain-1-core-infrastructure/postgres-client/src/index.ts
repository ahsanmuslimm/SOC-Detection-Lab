/**
 * PostgreSQL Client - Public API
 */

export { PostgresClient, createPostgresClient } from './main';

export type {
  IPoolConfig,
  IQueryOptions,
  IQueryResult,
  ITransactionOptions,
  TransactionCallback,
  IQuery,
  IHealthCheckResult,
  IPoolStatistics,
  IMigration,
  IQueryEvent,
  IConnectionEvent,
  IBatchResult,
  IIndexInfo,
  ITableSchema,
  IPaginationInfo,
  IPaginatedResult,
  IQueryBuilder,
  ConnectionListener,
  QueryListener,
  IQueryTimeoutConfig,
  IRetryPolicy,
} from './types';
