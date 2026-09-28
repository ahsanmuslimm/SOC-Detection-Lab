/**
 * Cache Service - Unit Tests
 * Comprehensive test coverage for caching, eviction, compression, and metrics
 */

import {
  CacheService,
  createCacheService,
  ICacheServiceConfig,
  CacheListener,
  ICacheEvent,
} from '../../src/index';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    const config: ICacheServiceConfig = {
      maxSize: 10485760, // 10 MB
      maxEntries: 10000,
      defaultTTL: 3600000, // 1 hour
      evictionPolicy: 'LRU',
      enableCompression: true,
      compressionAlgorithm: 'gzip',
      compressionThreshold: 1024,
      writeStrategy: 'write-through',
      invalidationStrategy: 'immediate',
      enableMetrics: true,
      enableStatistics: true,
      cleanupInterval: 60000,
      enableAudit: true,
      maxAuditEntries: 1000,
      enableReplication: false,
    };
    service = createCacheService(config);
  });

  afterEach(() => {
    service.stop();
  });

  describe('Basic Cache Operations', () => {
    test('should set and get value', () => {
      service.set('key1', 'value1');
      const value = service.get('key1');
      expect(value).toBe('value1');
    });

    test('should return null for non-existent key', () => {
      const value = service.get('nonexistent');
      expect(value).toBeNull();
    });

    test('should support different value types', () => {
      service.set('string', 'text');
      service.set('number', 42);
      service.set('boolean', true);
      service.set('object', { nested: 'value' });
      service.set('array', [1, 2, 3]);

      expect(service.get('string')).toBe('text');
      expect(service.get('number')).toBe(42);
      expect(service.get('boolean')).toBe(true);
      expect(service.get('object')).toEqual({ nested: 'value' });
      expect(service.get('array')).toEqual([1, 2, 3]);
    });

    test('should check if key exists', () => {
      service.set('exists', 'value');
      expect(service.has('exists')).toBe(true);
      expect(service.has('not_exists')).toBe(false);
    });

    test('should delete value', () => {
      service.set('key', 'value');
      expect(service.has('key')).toBe(true);

      const deleted = service.delete('key');
      expect(deleted).toBe(true);
      expect(service.has('key')).toBe(false);
    });

    test('should clear all values', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');

      service.clear();
      expect(service.getCount()).toBe(0);
    });
  });

  describe('Bulk Operations', () => {
    test('should get multiple values', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      service.set('key3', 'value3');

      const results = service.getMultiple(['key1', 'key2', 'key4']);

      expect(results.get('key1')).toBe('value1');
      expect(results.get('key2')).toBe('value2');
      expect(results.get('key4')).toBeNull();
    });

    test('should set multiple values', () => {
      const entries = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
        { key: 'key3', value: 'value3' },
      ];

      const count = service.setMultiple(entries);
      expect(count).toBe(3);

      expect(service.get('key1')).toBe('value1');
      expect(service.get('key3')).toBe('value3');
    });

    test('should delete multiple values', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      service.set('key3', 'value3');

      const count = service.deleteMultiple(['key1', 'key2']);
      expect(count).toBe(2);

      expect(service.has('key3')).toBe(true);
      expect(service.has('key1')).toBe(false);
    });
  });

  describe('Pattern-Based Operations', () => {
    test('should delete by pattern', () => {
      service.set('app:config:name', 'SOC Lab');
      service.set('app:config:port', 3000);
      service.set('db:host', 'localhost');

      const deleted = service.deleteByPattern('app:config:.*');
      expect(deleted).toBe(2);

      expect(service.has('db:host')).toBe(true);
      expect(service.has('app:config:name')).toBe(false);
    });

    test('should invalidate by pattern', () => {
      service.set('user:1:profile', 'data');
      service.set('user:1:settings', 'data');
      service.set('user:2:profile', 'data');

      service.invalidateByPattern('user:1:.*', 'immediate');

      expect(service.has('user:1:profile')).toBe(false);
      expect(service.has('user:2:profile')).toBe(true);
    });
  });

  describe('TTL and Expiration', () => {
    test('should set TTL on entry', () => {
      service.set('ttl_key', 'value', { ttl: 100 });
      const metadata = service.getMetadata('ttl_key');

      expect(metadata?.ttl).toBe(100);
      expect(metadata?.expiresAt).toBeDefined();
    });

    test('should expire entry after TTL', (done) => {
      service.set('expire_key', 'value', { ttl: 100 });
      expect(service.get('expire_key')).toBe('value');

      setTimeout(() => {
        const value = service.get('expire_key');
        expect(value).toBeNull();
        done();
      }, 150);
    });

    test('should use default TTL', () => {
      service.set('default_ttl', 'value');
      const metadata = service.getMetadata('default_ttl');

      expect(metadata?.ttl).toBe(3600000);
    });
  });

  describe('Compression', () => {
    test('should compress large values', () => {
      const largeValue = 'x'.repeat(2000);
      service.set('large_value', largeValue);

      const metadata = service.getMetadata('large_value');
      expect(metadata?.compressed).toBe(true);

      const retrieved = service.get('large_value');
      expect(retrieved).toBe(largeValue);
    });

    test('should not compress small values', () => {
      service.set('small_value', 'x');

      const metadata = service.getMetadata('small_value');
      expect(metadata?.compressed).toBe(false);
    });
  });

  describe('Cache Metadata', () => {
    test('should retrieve entry metadata', () => {
      service.set('tracked_key', 'value');

      const metadata = service.getMetadata('tracked_key');

      expect(metadata).toBeDefined();
      expect(metadata?.key).toBe('tracked_key');
      expect(metadata?.status).toBe('active');
      expect(metadata?.accessCount).toBeGreaterThan(0);
    });

    test('should get all metadata', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      service.set('key3', 'value3');

      const allMetadata = service.getAllMetadata();

      expect(allMetadata.size).toBe(3);
      expect(allMetadata.has('key1')).toBe(true);
    });
  });

  describe('Cache Statistics', () => {
    test('should track cache statistics', () => {
      service.set('stat_key', 'value');
      service.get('stat_key');
      service.get('stat_key');
      service.get('nonexistent');

      const stats = service.getStats();

      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.misses).toBeGreaterThan(0);
      expect(stats.entryCount).toBeGreaterThan(0);
    });

    test('should calculate hit rate', () => {
      for (let i = 0; i < 10; i++) {
        service.set(`key${i}`, `value${i}`);
      }

      for (let i = 0; i < 10; i++) {
        service.get(`key${i}`);
      }

      service.get('nonexistent1');
      service.get('nonexistent2');

      const stats = service.getStats();
      expect(stats.hitRate).toBeGreaterThan(0.5);
    });

    test('should return metrics', () => {
      service.set('metric_key', 'value');
      service.get('metric_key');

      const metrics = service.getMetrics();

      expect(metrics.hitRate).toBeDefined();
      expect(metrics.missRate).toBeDefined();
      expect(metrics.memoryUtilization).toBeDefined();
      expect(metrics.operationTime).toBeDefined();
    });
  });

  describe('Cache Size and Count', () => {
    test('should track cache size', () => {
      service.set('size_key', 'x'.repeat(100));

      const size = service.getSize();
      expect(size).toBeGreaterThan(0);
    });

    test('should track entry count', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      service.set('key3', 'value3');

      const count = service.getCount();
      expect(count).toBe(3);
    });
  });

  describe('Eviction Policies', () => {
    test('should support LRU eviction', () => {
      const config: ICacheServiceConfig = {
        maxSize: 1000,
        maxEntries: 3,
        defaultTTL: 3600000,
        evictionPolicy: 'LRU',
        enableCompression: false,
        compressionAlgorithm: 'gzip',
        compressionThreshold: 1024,
        writeStrategy: 'write-through',
        invalidationStrategy: 'immediate',
        enableMetrics: true,
        enableStatistics: true,
        cleanupInterval: 60000,
        enableAudit: true,
        maxAuditEntries: 1000,
        enableReplication: false,
      };

      const lruService = createCacheService(config);

      lruService.set('key1', 'value1');
      lruService.set('key2', 'value2');
      lruService.set('key3', 'value3');

      lruService.get('key1');
      lruService.get('key2');

      lruService.set('key4', 'value4');

      expect(lruService.has('key3')).toBe(false);
      expect(lruService.has('key1')).toBe(true);

      lruService.stop();
    });

    test('should support FIFO eviction', () => {
      const config: ICacheServiceConfig = {
        maxSize: 1000,
        maxEntries: 3,
        defaultTTL: 3600000,
        evictionPolicy: 'FIFO',
        enableCompression: false,
        compressionAlgorithm: 'gzip',
        compressionThreshold: 1024,
        writeStrategy: 'write-through',
        invalidationStrategy: 'immediate',
        enableMetrics: true,
        enableStatistics: true,
        cleanupInterval: 60000,
        enableAudit: true,
        maxAuditEntries: 1000,
        enableReplication: false,
      };

      const fifoService = createCacheService(config);

      fifoService.set('key1', 'value1');
      fifoService.set('key2', 'value2');
      fifoService.set('key3', 'value3');

      fifoService.set('key4', 'value4');

      expect(fifoService.has('key1')).toBe(false);
      expect(fifoService.has('key4')).toBe(true);

      fifoService.stop();
    });

    test('should support LFU eviction', () => {
      const config: ICacheServiceConfig = {
        maxSize: 1000,
        maxEntries: 3,
        defaultTTL: 3600000,
        evictionPolicy: 'LFU',
        enableCompression: false,
        compressionAlgorithm: 'gzip',
        compressionThreshold: 1024,
        writeStrategy: 'write-through',
        invalidationStrategy: 'immediate',
        enableMetrics: true,
        enableStatistics: true,
        cleanupInterval: 60000,
        enableAudit: true,
        maxAuditEntries: 1000,
        enableReplication: false,
      };

      const lfuService = createCacheService(config);

      lfuService.set('key1', 'value1');
      lfuService.set('key2', 'value2');
      lfuService.set('key3', 'value3');

      lfuService.get('key1');
      lfuService.get('key1');
      lfuService.get('key2');

      lfuService.set('key4', 'value4');

      expect(lfuService.has('key3')).toBe(false);
      expect(lfuService.has('key1')).toBe(true);

      lfuService.stop();
    });
  });

  describe('Health Checks', () => {
    test('should perform health check', async () => {
      service.set('health_key', 'value');

      const health = await service.performHealthCheck();

      expect(health).toBeDefined();
      expect(health.status).toMatch(/healthy|degraded|unhealthy/);
      expect(health.timestamp).toBeInstanceOf(Date);
      expect(Array.isArray(health.checks)).toBe(true);
    });

    test('should include cache store in health checks', async () => {
      service.set('test', 'value');

      const health = await service.performHealthCheck();
      const storeCheck = health.checks.find((c) => c.name === 'Cache Store');

      expect(storeCheck).toBeDefined();
      expect(storeCheck?.status).toBe('healthy');
    });

    test('should include memory usage in health checks', async () => {
      service.set('memory_test', 'x'.repeat(1000));

      const health = await service.performHealthCheck();
      const memoryCheck = health.checks.find((c) => c.name === 'Memory Usage');

      expect(memoryCheck).toBeDefined();
      expect(memoryCheck?.message).toContain('%');
    });
  });

  describe('Event Listeners', () => {
    test('should register event listener', (done) => {
      let eventReceived = false;

      const listener: CacheListener = async (event: ICacheEvent) => {
        eventReceived = true;
      };

      service.onEvent(listener);
      service.set('event_key', 'value');

      setTimeout(() => {
        expect(eventReceived).toBe(true);
        done();
      }, 100);
    });

    test('should emit set events', (done) => {
      const events: ICacheEvent[] = [];

      const listener: CacheListener = async (event: ICacheEvent) => {
        events.push(event);
      };

      service.onEvent(listener);
      service.set('set_key', 'value');

      setTimeout(() => {
        const setEvent = events.find((e) => e.type === 'set');
        expect(setEvent).toBeDefined();
        expect(setEvent?.key).toBe('set_key');
        done();
      }, 100);
    });

    test('should emit get events', (done) => {
      const events: ICacheEvent[] = [];

      const listener: CacheListener = async (event: ICacheEvent) => {
        events.push(event);
      };

      service.onEvent(listener);
      service.set('get_key', 'value');
      service.get('get_key');

      setTimeout(() => {
        const getEvent = events.find((e) => e.type === 'get');
        expect(getEvent).toBeDefined();
        done();
      }, 100);
    });

    test('should support chaining listeners', () => {
      const listener1: CacheListener = async () => {};
      const listener2: CacheListener = async () => {};

      const result = service.onEvent(listener1).onEvent(listener2);

      expect(result).toBe(service);
    });
  });

  describe('Service Lifecycle', () => {
    test('should stop service without errors', () => {
      expect(() => {
        service.stop();
      }).not.toThrow();
    });

    test('should handle multiple stop calls gracefully', () => {
      expect(() => {
        service.stop();
        service.stop();
      }).not.toThrow();
    });

    test('should continue accepting operations after creation', () => {
      const id1 = service.set('key1', 'value1');
      const id2 = service.set('key2', 'value2');

      expect(id1).toBe(true);
      expect(id2).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete cache workflow', async () => {
      // Set values
      service.set('config:app', { name: 'SOC Lab', version: '1.0.0' });
      service.set('config:db', { host: 'localhost', port: 5432 });

      // Retrieve values
      const appConfig = service.get('config:app');
      expect(appConfig).toEqual({ name: 'SOC Lab', version: '1.0.0' });

      // Update values
      service.set('config:app', { name: 'SOC Lab', version: '1.1.0' });
      const updatedConfig = service.get('config:app');
      expect(updatedConfig.version).toBe('1.1.0');

      // Get statistics
      const stats = service.getStats();
      expect(stats.hits).toBeGreaterThan(0);

      // Check health
      const health = await service.performHealthCheck();
      expect(health.status).toBeDefined();

      // Clean up
      service.deleteByPattern('config:.*');

      const remaining = service.getCount();
      expect(remaining).toBe(0);
    });

    test('should manage large cache with multiple operations', () => {
      for (let i = 0; i < 100; i++) {
        service.set(`key:${i}`, `value:${i}`);
      }

      expect(service.getCount()).toBe(100);

      for (let i = 0; i < 100; i++) {
        const value = service.get(`key:${i}`);
        expect(value).toBe(`value:${i}`);
      }

      const stats = service.getStats();
      expect(stats.hits).toBe(100);

      service.deleteByPattern('key:.*');
      expect(service.getCount()).toBe(0);
    });

    test('should maintain consistency with mixed operations', () => {
      const keys = ['a', 'b', 'c', 'd', 'e'];

      for (const key of keys) {
        service.set(key, `value_${key}`);
      }

      service.delete('c');
      service.set('f', 'value_f');

      expect(service.getCount()).toBe(5);
      expect(service.has('c')).toBe(false);
      expect(service.has('f')).toBe(true);
    });
  });
});
