/**
 * Database Client Module - Public API
 *
 * @module database-client
 */

export * from './types';
export {
  PostgresClient,
  createDatabase,
  createDatabaseWithCheck,
  getDatabase,
  setDatabase,
  resetDatabase
} from './main';
