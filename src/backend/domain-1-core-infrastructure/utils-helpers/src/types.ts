/**
 * Utils Helpers - Type Definitions
 * Type definitions for utility functions and helpers
 */

/**
 * String formatting options
 */
export interface IFormatOptions {
  uppercase?: boolean;
  lowercase?: boolean;
  capitalize?: boolean;
  trim?: boolean;
  truncate?: number;
}

/**
 * Date formatting options
 */
export interface IDateFormatOptions {
  format?: 'iso' | 'locale' | 'custom';
  pattern?: string;
  timezone?: string;
  locale?: string;
}

/**
 * Number formatting options
 */
export interface INumberFormatOptions {
  decimals?: number;
  separator?: boolean;
  prefix?: string;
  suffix?: string;
  unit?: string;
}

/**
 * Byte size unit options
 */
export type ByteUnit = 'B' | 'KB' | 'MB' | 'GB' | 'TB';

/**
 * Time unit options
 */
export type TimeUnit = 'ms' | 's' | 'min' | 'h' | 'd';

/**
 * Array chunk options
 */
export interface IChunkOptions {
  size: number;
}

/**
 * Deep merge options
 */
export interface IMergeOptions {
  overwrite?: boolean;
  deep?: boolean;
  arrays?: 'concat' | 'replace';
}

/**
 * Validation result
 */
export interface IValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Email validation regex pattern
 */
export type EmailPattern = 'strict' | 'loose' | 'custom';

/**
 * URL validation options
 */
export interface IURLValidationOptions {
  protocol?: string[];
  allowLocal?: boolean;
  allowIP?: boolean;
}

/**
 * Retry options
 */
export interface IRetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoff?: 'linear' | 'exponential';
  backoffMultiplier?: number;
}

/**
 * Debounce options
 */
export interface IDebounceOptions {
  wait: number;
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

/**
 * Throttle options
 */
export interface IThrottleOptions {
  wait: number;
  leading?: boolean;
  trailing?: boolean;
}

/**
 * Pagination options
 */
export interface IPaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Sort options
 */
export interface ISortOptions {
  key: string;
  direction: 'asc' | 'desc';
}

/**
 * Pagination result
 */
export interface IPaginationResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Deep clone options
 */
export interface ICloneOptions {
  deep?: boolean;
  circular?: boolean;
}

/**
 * Random options
 */
export interface IRandomOptions {
  min: number;
  max: number;
}

/**
 * Cache key generation options
 */
export interface ICacheKeyOptions {
  prefix?: string;
  separator?: string;
  hash?: boolean;
}

/**
 * Diff result
 */
export interface IDiffResult<T> {
  added: Partial<T>[];
  removed: Partial<T>[];
  modified: Partial<T>[];
}

/**
 * Rate limiter options
 */
export interface IRateLimiterOptions {
  requests: number;
  window: number; // milliseconds
}

/**
 * Circuit breaker options
 */
export interface ICircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number;
  timeout: number; // milliseconds
  resetTimeout: number; // milliseconds
}

/**
 * Circuit breaker state
 */
export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

/**
 * Flat object structure
 */
export type FlatObject = Record<string, unknown>;

/**
 * Nested object structure
 */
export type NestedObject = {
  [key: string]: any;
};
