/**
 * Utils Helpers - Unit Tests
 * Comprehensive test suite for utility functions
 */

import {
  StringUtils,
  NumberUtils,
  DateUtils,
  ArrayUtils,
  ObjectUtils,
  ValidationUtils,
  AsyncUtils,
  createRateLimiter,
  createCircuitBreaker,
} from '../../src/main';

describe('Utils Helpers', () => {
  // ============================================================
  // String Utils Tests
  // ============================================================

  describe('StringUtils', () => {
    test('should format string', () => {
      const result = StringUtils.format('hello world', { capitalize: true });
      expect(result).toBe('Hello world');
    });

    test('should capitalize string', () => {
      expect(StringUtils.capitalize('hello')).toBe('Hello');
    });

    test('should reverse string', () => {
      expect(StringUtils.reverse('hello')).toBe('olleh');
    });

    test('should pad string', () => {
      const result = StringUtils.pad('hello', 10);
      expect(result).toHaveLength(10);
    });

    test('should remove special characters', () => {
      const result = StringUtils.removeSpecialChars('hello@world!');
      expect(result).toBe('helloworld');
    });

    test('should slugify string', () => {
      const result = StringUtils.slugify('Hello World!');
      expect(result).toBe('hello-world');
    });

    test('should truncate string', () => {
      const result = StringUtils.format('hello world', { truncate: 5 });
      expect(result).toBe('hello...');
    });

    test('should uppercase string', () => {
      const result = StringUtils.format('hello', { uppercase: true });
      expect(result).toBe('HELLO');
    });

    test('should lowercase string', () => {
      const result = StringUtils.format('HELLO', { lowercase: true });
      expect(result).toBe('hello');
    });

    test('should trim string', () => {
      const result = StringUtils.format('  hello  ', { trim: true });
      expect(result).toBe('hello');
    });
  });

  // ============================================================
  // Number Utils Tests
  // ============================================================

  describe('NumberUtils', () => {
    test('should format number', () => {
      const result = NumberUtils.format(1234.567, { decimals: 2 });
      expect(result).toBe('1234.57');
    });

    test('should format bytes', () => {
      const result = NumberUtils.formatBytes(1024 * 1024);
      expect(result).toContain('MB');
    });

    test('should format time', () => {
      const result = NumberUtils.formatTime(1000);
      expect(result).toContain('s');
    });

    test('should clamp number', () => {
      expect(NumberUtils.clamp(5, 0, 10)).toBe(5);
      expect(NumberUtils.clamp(15, 0, 10)).toBe(10);
      expect(NumberUtils.clamp(-5, 0, 10)).toBe(0);
    });

    test('should generate random integer', () => {
      const result = NumberUtils.randomInt(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    });

    test('should calculate percentage', () => {
      const result = NumberUtils.percentage(50, 100);
      expect(result).toBe(50);
    });

    test('should add separators', () => {
      const result = NumberUtils.format(1234567, { separator: true });
      expect(result).toContain(',');
    });
  });

  // ============================================================
  // Date Utils Tests
  // ============================================================

  describe('DateUtils', () => {
    test('should format date', () => {
      const date = new Date(2024, 0, 15);
      const result = DateUtils.format(date, 'YYYY-MM-DD');
      expect(result).toBe('2024-01-15');
    });

    test('should add days', () => {
      const date = new Date(2024, 0, 1);
      const result = DateUtils.addDays(date, 5);
      expect(result.getDate()).toBe(6);
    });

    test('should calculate difference in days', () => {
      const date1 = new Date(2024, 0, 1);
      const date2 = new Date(2024, 0, 11);
      const result = DateUtils.diffDays(date1, date2);
      expect(result).toBe(10);
    });

    test('should check if same day', () => {
      const date1 = new Date(2024, 0, 1, 10, 30);
      const date2 = new Date(2024, 0, 1, 15, 45);
      expect(DateUtils.isSameDay(date1, date2)).toBe(true);
    });

    test('should get start of day', () => {
      const date = new Date(2024, 0, 1, 15, 30, 45);
      const result = DateUtils.startOfDay(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });

    test('should get end of day', () => {
      const date = new Date(2024, 0, 1, 10, 30);
      const result = DateUtils.endOfDay(date);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
    });
  });

  // ============================================================
  // Array Utils Tests
  // ============================================================

  describe('ArrayUtils', () => {
    test('should chunk array', () => {
      const arr = [1, 2, 3, 4, 5, 6];
      const result = ArrayUtils.chunk(arr, 2);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual([1, 2]);
    });

    test('should flatten array', () => {
      const arr = [1, [2, [3, 4]], 5];
      const result = ArrayUtils.flatten(arr);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    test('should get unique values', () => {
      const arr = [1, 2, 2, 3, 3, 3];
      const result = ArrayUtils.unique(arr);
      expect(result).toEqual([1, 2, 3]);
    });

    test('should shuffle array', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = ArrayUtils.shuffle(arr);
      expect(result).toHaveLength(5);
      expect(result).toContainEqual(1);
    });

    test('should group by key', () => {
      const arr = [
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
        { category: 'A', value: 3 },
      ];
      const result = ArrayUtils.groupBy(arr, item => item.category);
      expect(result.A).toHaveLength(2);
      expect(result.B).toHaveLength(1);
    });

    test('should paginate array', () => {
      const arr = Array.from({ length: 25 }, (_, i) => i + 1);
      const result = ArrayUtils.paginate(arr, { page: 2, pageSize: 10 });
      expect(result.items).toHaveLength(10);
      expect(result.items[0]).toBe(11);
      expect(result.hasNext).toBe(true);
      expect(result.pages).toBe(3);
    });
  });

  // ============================================================
  // Object Utils Tests
  // ============================================================

  describe('ObjectUtils', () => {
    test('should merge objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      const result = ObjectUtils.merge(obj1, obj2);
      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    test('should deep clone object', () => {
      const obj = { a: 1, b: { c: 2 } };
      const clone = ObjectUtils.clone(obj);
      clone.b.c = 3;
      expect(obj.b.c).toBe(2);
    });

    test('should pick properties', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = ObjectUtils.pick(obj, ['a', 'c']);
      expect(result).toEqual({ a: 1, c: 3 });
    });

    test('should omit properties', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = ObjectUtils.omit(obj, ['b']);
      expect(result).toEqual({ a: 1, c: 3 });
    });

    test('should flatten object', () => {
      const obj = { a: 1, b: { c: 2, d: { e: 3 } } };
      const result = ObjectUtils.flatten(obj);
      expect(result['b.c']).toBe(2);
      expect(result['b.d.e']).toBe(3);
    });

    test('should check property path', () => {
      const obj = { a: { b: { c: 1 } } };
      expect(ObjectUtils.hasProperty(obj, 'a.b.c')).toBe(true);
      expect(ObjectUtils.hasProperty(obj, 'a.b.d')).toBe(false);
    });
  });

  // ============================================================
  // Validation Utils Tests
  // ============================================================

  describe('ValidationUtils', () => {
    test('should validate email', () => {
      expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true);
      expect(ValidationUtils.isValidEmail('invalid.email')).toBe(false);
    });

    test('should validate URL', () => {
      expect(ValidationUtils.isValidURL('https://example.com')).toBe(true);
      expect(ValidationUtils.isValidURL('not a url')).toBe(false);
    });

    test('should validate IP address', () => {
      expect(ValidationUtils.isValidIP('192.168.1.1')).toBe(true);
      expect(ValidationUtils.isValidIP('invalid.ip')).toBe(false);
    });

    test('should validate UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(ValidationUtils.isValidUUID(uuid)).toBe(true);
      expect(ValidationUtils.isValidUUID('not-a-uuid')).toBe(false);
    });

    test('should validate strong password', () => {
      const result = ValidationUtils.isStrongPassword('WeakPass1');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      const strong = ValidationUtils.isStrongPassword('StrongPass1@#');
      expect(strong.valid).toBe(true);
    });

    test('should validate required field', () => {
      const empty = ValidationUtils.required('');
      expect(empty.valid).toBe(false);

      const filled = ValidationUtils.required('value');
      expect(filled.valid).toBe(true);
    });

    test('should validate min length', () => {
      const result = ValidationUtils.minLength('hi', 5);
      expect(result.valid).toBe(false);

      const valid = ValidationUtils.minLength('hello', 5);
      expect(valid.valid).toBe(true);
    });
  });

  // ============================================================
  // Async Utils Tests
  // ============================================================

  describe('AsyncUtils', () => {
    test('should retry on failure', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) throw new Error('Failed');
        return 'success';
      };

      const result = await AsyncUtils.retry(fn, {
        maxAttempts: 5,
        delayMs: 10,
      });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    test('should wait', async () => {
      const start = Date.now();
      await AsyncUtils.wait(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(50);
    });

    test('should timeout promise', async () => {
      const promise = new Promise(resolve => setTimeout(resolve, 1000));
      await expect(AsyncUtils.timeout(promise, 50)).rejects.toThrow();
    });

    test('should debounce function', async () => {
      let callCount = 0;
      const fn = jest.fn(() => {
        callCount++;
      });
      const debounced = AsyncUtils.debounce(fn, { wait: 50 });

      debounced();
      debounced();
      debounced();

      await AsyncUtils.wait(100);
      // Called once after debounce period
      expect(fn).toHaveBeenCalled();
    });

    test('should throttle function', async () => {
      let callCount = 0;
      const fn = jest.fn(() => {
        callCount++;
      });
      const throttled = AsyncUtils.throttle(fn, { wait: 50 });

      throttled();
      throttled();
      throttled();

      await AsyncUtils.wait(100);
      // Called based on throttle period
      expect(fn).toHaveBeenCalled();
    });
  });

  // ============================================================
  // Factory Functions Tests
  // ============================================================

  describe('Factory Functions', () => {
    test('should create rate limiter', () => {
      const limiter = createRateLimiter({ requests: 3, window: 1000 });
      expect(limiter()).toBe(true);
      expect(limiter()).toBe(true);
      expect(limiter()).toBe(true);
      expect(limiter()).toBe(false);
    });

    test('should create circuit breaker', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        throw new Error('Failed');
      };

      const breaker = createCircuitBreaker(fn, {
        failureThreshold: 2,
        successThreshold: 1,
        timeout: 1000,
        resetTimeout: 100,
      });

      // First call fails
      await expect(breaker()).rejects.toThrow();
      // Second call fails
      await expect(breaker()).rejects.toThrow();
      // Circuit opens
      await expect(breaker()).rejects.toThrow('Circuit breaker is open');
    });
  });

  // ============================================================
  // Edge Cases
  // ============================================================

  describe('Edge Cases', () => {
    test('should handle empty arrays', () => {
      expect(ArrayUtils.flatten([])).toEqual([]);
      expect(ArrayUtils.unique([])).toEqual([]);
    });

    test('should handle empty objects', () => {
      const result = ObjectUtils.merge({}, {});
      expect(result).toEqual({});
    });

    test('should handle null/undefined in clone', () => {
      expect(ObjectUtils.clone(null)).toBe(null);
      expect(ObjectUtils.clone(undefined)).toBe(undefined);
    });

    test('should handle dates in clone', () => {
      const date = new Date();
      const cloned = ObjectUtils.clone(date);
      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
    });

    test('should handle zero in percentage', () => {
      const result = NumberUtils.percentage(50, 0);
      expect(result).toBe(0);
    });

    test('should handle last page in pagination', () => {
      const arr = [1, 2, 3];
      const result = ArrayUtils.paginate(arr, { page: 1, pageSize: 5 });
      expect(result.hasNext).toBe(false);
    });
  });
});
