/**
 * Utils Helpers - Main Implementation
 * Collection of utility functions for common tasks
 */

import type {
  IFormatOptions,
  IDateFormatOptions,
  INumberFormatOptions,
  ByteUnit,
  TimeUnit,
  IChunkOptions,
  IMergeOptions,
  IValidationResult,
  IURLValidationOptions,
  IRetryOptions,
  IDebounceOptions,
  IThrottleOptions,
  IPaginationOptions,
  ISortOptions,
  IPaginationResult,
  ICloneOptions,
  IRandomOptions,
  ICacheKeyOptions,
  IDiffResult,
  IRateLimiterOptions,
  ICircuitBreakerOptions,
  CircuitBreakerState,
  FlatObject,
  NestedObject,
} from './types';

/**
 * String utilities
 */
export class StringUtils {
  /**
   * Format string
   */
  static format(str: string, options: IFormatOptions = {}): string {
    let result = str;

    if (options.trim) {
      result = result.trim();
    }

    if (options.uppercase) {
      result = result.toUpperCase();
    }

    if (options.lowercase) {
      result = result.toLowerCase();
    }

    if (options.capitalize) {
      result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
    }

    if (options.truncate && result.length > options.truncate) {
      result = result.substring(0, options.truncate) + '...';
    }

    return result;
  }

  /**
   * Capitalize string
   */
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Reverse string
   */
  static reverse(str: string): string {
    return str.split('').reverse().join('');
  }

  /**
   * Pad string
   */
  static pad(str: string, length: number, char: string = ' '): string {
    const padLength = Math.max(0, length - str.length);
    return str + char.repeat(padLength);
  }

  /**
   * Remove special characters
   */
  static removeSpecialChars(str: string): string {
    return str.replace(/[^a-zA-Z0-9 ]/g, '');
  }

  /**
   * Slugify string
   */
  static slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .replace(/-+/g, '-')
      .trim();
  }
}

/**
 * Number utilities
 */
export class NumberUtils {
  /**
   * Format number
   */
  static format(num: number, options: INumberFormatOptions = {}): string {
    let result = num.toFixed(options.decimals ?? 2);

    if (options.separator) {
      result = result.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    if (options.prefix) {
      result = options.prefix + result;
    }

    if (options.suffix) {
      result = result + options.suffix;
    }

    if (options.unit) {
      result = result + ' ' + options.unit;
    }

    return result;
  }

  /**
   * Format bytes
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units: ByteUnit[] = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
  }

  /**
   * Format milliseconds
   */
  static formatTime(ms: number): string {
    const units: [TimeUnit, number][] = [
      ['d', 24 * 60 * 60 * 1000],
      ['h', 60 * 60 * 1000],
      ['min', 60 * 1000],
      ['s', 1000],
      ['ms', 1],
    ];

    for (const [unit, divisor] of units) {
      if (ms >= divisor) {
        return (ms / divisor).toFixed(2) + unit;
      }
    }

    return '0ms';
  }

  /**
   * Clamp number
   */
  static clamp(num: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, num));
  }

  /**
   * Random integer
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Percentage
   */
  static percentage(value: number, total: number): number {
    return total === 0 ? 0 : (value / total) * 100;
  }
}

/**
 * Date utilities
 */
export class DateUtils {
  /**
   * Format date
   */
  static format(date: Date, format: string = 'YYYY-MM-DD'): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * Add days
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Difference in days
   */
  static diffDays(date1: Date, date2: Date): number {
    const diff = date2.getTime() - date1.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Is same day
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Start of day
   */
  static startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * End of day
   */
  static endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }
}

/**
 * Array utilities
 */
export class ArrayUtils {
  /**
   * Chunk array
   */
  static chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Flatten array
   */
  static flatten<T>(arr: (T | T[])[]): T[] {
    return arr.reduce<T[]>((acc, val) => {
      return acc.concat(Array.isArray(val) ? ArrayUtils.flatten(val) : val);
    }, []);
  }

  /**
   * Unique values
   */
  static unique<T>(arr: T[]): T[] {
    return [...new Set(arr)];
  }

  /**
   * Shuffle array
   */
  static shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * Group by key
   */
  static groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
    return arr.reduce(
      (acc, item) => {
        const k = key(item);
        if (!acc[k]) acc[k] = [];
        acc[k].push(item);
        return acc;
      },
      {} as Record<string, T[]>
    );
  }

  /**
   * Paginate array
   */
  static paginate<T>(arr: T[], options: IPaginationOptions): IPaginationResult<T> {
    const { page, pageSize } = options;
    const start = (page - 1) * pageSize;
    const items = arr.slice(start, start + pageSize);
    const total = arr.length;
    const pages = Math.ceil(total / pageSize);

    return {
      items,
      page,
      pageSize,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    };
  }
}

/**
 * Object utilities
 */
export class ObjectUtils {
  /**
   * Deep merge objects
   */
  static merge<T extends NestedObject>(obj1: T, obj2: Partial<T>): T {
    const result = { ...obj1 };

    for (const [key, value] of Object.entries(obj2)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key as keyof T] = ObjectUtils.merge(obj1[key as keyof T] as any, value);
      } else {
        (result as any)[key] = value;
      }
    }

    return result;
  }

  /**
   * Deep clone object
   */
  static clone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => ObjectUtils.clone(item)) as unknown as T;
    }

    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = ObjectUtils.clone(obj[key]);
      }
    }

    return cloned;
  }

  /**
   * Pick properties
   */
  static pick<T, K extends keyof T>(obj: T, keys: K[]): Partial<T> {
    const result: Partial<T> = {};
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  /**
   * Omit properties
   */
  static omit<T, K extends keyof T>(obj: T, keys: K[]): Partial<T> {
    const result: Partial<T> = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  }

  /**
   * Flatten object
   */
  static flatten(obj: NestedObject, prefix = ''): FlatObject {
    const result: FlatObject = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(result, ObjectUtils.flatten(value, newKey));
        } else {
          result[newKey] = value;
        }
      }
    }

    return result;
  }

  /**
   * Has property
   */
  static hasProperty(obj: NestedObject, path: string): boolean {
    const parts = path.split('.');
    let current: any = obj;

    for (const part of parts) {
      if (!(part in current)) {
        return false;
      }
      current = current[part];
    }

    return true;
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  /**
   * Is email valid
   */
  static isValidEmail(email: string): boolean {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }

  /**
   * Is URL valid
   */
  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Is IP address valid
   */
  static isValidIP(ip: string): boolean {
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipv4Pattern.test(ip);
  }

  /**
   * Is UUID valid
   */
  static isValidUUID(uuid: string): boolean {
    const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return pattern.test(uuid);
  }

  /**
   * Is strong password
   */
  static isStrongPassword(password: string): IValidationResult {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain number');
    }

    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Required field
   */
  static required(value: unknown): IValidationResult {
    const valid = value !== null && value !== undefined && value !== '';
    return {
      valid,
      errors: valid ? [] : ['Field is required'],
    };
  }

  /**
   * Min length
   */
  static minLength(value: string, min: number): IValidationResult {
    const valid = value.length >= min;
    return {
      valid,
      errors: valid ? [] : [`Minimum length is ${min}`],
    };
  }
}

/**
 * Async utilities
 */
export class AsyncUtils {
  /**
   * Retry with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    options: IRetryOptions
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err as Error;

        if (attempt < options.maxAttempts) {
          let delay = options.delayMs;

          if (options.backoff === 'exponential') {
            const multiplier = options.backoffMultiplier || 2;
            delay *= Math.pow(multiplier, attempt - 1);
          }

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Debounce function
   */
  static debounce<T extends (...args: any[]) => any>(
    fn: T,
    options: IDebounceOptions
  ): T {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastArgs: any[] | null = null;

    return ((...args: any[]) => {
      lastArgs = args;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        fn(...lastArgs);
        timeoutId = null;
      }, options.wait);
    }) as T;
  }

  /**
   * Throttle function
   */
  static throttle<T extends (...args: any[]) => any>(
    fn: T,
    options: IThrottleOptions
  ): T {
    let lastCall = 0;
    let timeoutId: NodeJS.Timeout | null = null;

    return ((...args: any[]) => {
      const now = Date.now();

      if (now - lastCall >= options.wait) {
        fn(...args);
        lastCall = now;

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      } else if (!timeoutId) {
        const remaining = options.wait - (now - lastCall);
        timeoutId = setTimeout(() => {
          fn(...args);
          lastCall = Date.now();
          timeoutId = null;
        }, remaining);
      }
    }) as T;
  }

  /**
   * Wait
   */
  static wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Timeout promise
   */
  static timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
    ]);
  }
}

/**
 * Factory functions
 */
export function createRateLimiter(options: IRateLimiterOptions) {
  let tokens = options.requests;
  setInterval(() => {
    tokens = Math.min(tokens + options.requests, options.requests);
  }, options.window);

  return () => {
    if (tokens > 0) {
      tokens--;
      return true;
    }
    return false;
  };
}

export function createCircuitBreaker<T>(fn: () => Promise<T>, options: ICircuitBreakerOptions) {
  let state: CircuitBreakerState = 'closed';
  let failureCount = 0;
  let successCount = 0;
  let lastFailureTime = 0;

  return async (): Promise<T> => {
    if (state === 'open') {
      if (Date.now() - lastFailureTime > options.resetTimeout) {
        state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), options.timeout)
        ),
      ]);

      if (state === 'half-open') {
        successCount++;
        if (successCount >= options.successThreshold) {
          state = 'closed';
          failureCount = 0;
          successCount = 0;
        }
      }

      return result;
    } catch (err) {
      failureCount++;
      lastFailureTime = Date.now();

      if (failureCount >= options.failureThreshold) {
        state = 'open';
      }

      throw err;
    }
  };
}

/**
 * Default export
 */
export default {
  string: StringUtils,
  number: NumberUtils,
  date: DateUtils,
  array: ArrayUtils,
  object: ObjectUtils,
  validation: ValidationUtils,
  async: AsyncUtils,
  createRateLimiter,
  createCircuitBreaker,
};
