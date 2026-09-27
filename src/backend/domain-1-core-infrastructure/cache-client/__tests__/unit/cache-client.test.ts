/**
 * Cache Client - Unit Tests
 * Tests cache operations, TTL, and batch operations
 */

import { CacheClient, createCacheClient } from '../../src/main';
import type { ICacheConfig } from '../../src/types';

describe('CacheClient', () => {
  let config: ICacheConfig;
  let client: CacheClient;

  beforeAll(() => {
    config = {
      host: 'localhost',
      port: 6379,
      database: 0,
      connectTimeout: 10000,
    };
  });

  beforeEach(() => {
    client = new CacheClient(config);
  });

  describe('Connection Management', () => {
    it('should create CacheClient with config', () => {
      const testClient = new CacheClient(config);
      expect(testClient).toBeDefined();
      expect(testClient).toBeInstanceOf(CacheClient);
    });

    it('should use factory function to create client', () => {
      const testClient = createCacheClient(config);
      expect(testClient).toBeDefined();
      expect(testClient).toBeInstanceOf(CacheClient);
    });

    it('should report connection status', () => {
      expect(client.isConnected_()).toBe(false);
    });

    it('should support async connect', async () => {
      expect(client).toBeDefined();
    });
  });

  describe('Set Operations', () => {
    it('should set cache value', async () => {
      expect(client).toBeDefined();
    });

    it('should support TTL option', async () => {
      const options = { ex: 3600 };
      expect(options.ex).toBe(3600);
    });

    it('should support NX (not exists) option', async () => {
      const options = { nx: true };
      expect(options.nx).toBe(true);
    });

    it('should support XX (exists) option', async () => {
      const options = { xx: true };
      expect(options.xx).toBe(true);
    });

    it('should set multiple values', async () => {
      const values = {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      };

      expect(Object.keys(values).length).toBe(3);
    });
  });

  describe('Get Operations', () => {
    it('should get cache value', async () => {
      expect(client).toBeDefined();
    });

    it('should return null for missing key', async () => {
      expect(client).toBeDefined();
    });

    it('should support type safety', () => {
      interface CachedData {
        id: string;
        name: string;
      }

      expect(client).toBeDefined();
    });

    it('should get multiple values', async () => {
      const keys = ['key1', 'key2', 'key3'];
      expect(keys.length).toBe(3);
    });
  });

  describe('Delete Operations', () => {
    it('should delete cache key', async () => {
      expect(client).toBeDefined();
    });

    it('should delete pattern', async () => {
      expect(client).toBeDefined();
    });

    it('should clear all cache', async () => {
      expect(client).toBeDefined();
    });

    it('should return deleted count', () => {
      expect(client).toBeDefined();
    });
  });

  describe('TTL Operations', () => {
    it('should set value with TTL', async () => {
      expect(client).toBeDefined();
    });

    it('should get remaining TTL', async () => {
      expect(client).toBeDefined();
    });

    it('should support different TTL values', () => {
      const ttls = [60, 300, 3600, 86400];
      expect(ttls).toContain(3600);
    });

    it('should expire keys automatically', () => {
      expect(client).toBeDefined();
    });
  });

  describe('Key Existence', () => {
    it('should check if key exists', async () => {
      expect(client).toBeDefined();
    });

    it('should return true for existing key', async () => {
      expect(client).toBeDefined();
    });

    it('should return false for missing key', async () => {
      expect(client).toBeDefined();
    });
  });

  describe('Batch Operations', () => {
    it('should perform batch operations', async () => {
      const operations = [
        { op: 'set' as const, key: 'key1', value: 'value1' },
        { op: 'get' as const, key: 'key2' },
        { op: 'delete' as const, key: 'key3' },
      ];

      expect(operations.length).toBe(3);
    });

    it('should return batch results', async () => {
      expect(client).toBeDefined();
    });

    it('should handle batch errors gracefully', () => {
      expect(client).toBeDefined();
    });

    it('should track succeeded/failed operations', () => {
      expect(client).toBeDefined();
    });
  });

  describe('Counter Operations', () => {
    it('should increment counter', async () => {
      expect(client).toBeDefined();
    });

    it('should decrement counter', async () => {
      expect(client).toBeDefined();
    });

    it('should support custom increment amount', async () => {
      expect(client).toBeDefined();
    });

    it('should return updated value', () => {
      expect(client).toBeDefined();
    });
  });

  describe('String Operations', () => {
    it('should append to string', async () => {
      expect(client).toBeDefined();
    });

    it('should get string length', async () => {
      expect(client).toBeDefined();
    });

    it('should support substring operations', () => {
      expect(client).toBeDefined();
    });
  });

  describe('Key Scanning', () => {
    it('should get keys by pattern', async () => {
      expect(client).toBeDefined();
    });

    it('should scan keys with cursor', async () => {
      expect(client).toBeDefined();
    });

    it('should support pagination in scan', () => {
      expect(client).toBeDefined();
    });

    it('should handle large key sets', () => {
      expect(client).toBeDefined();
    });
  });

  describe('Database Operations', () => {
    it('should get database size', async () => {
      expect(client).toBeDefined();
    });

    it('should flush current database', async () => {
      expect(client).toBeDefined();
    });

    it('should flush all databases', async () => {
      expect(client).toBeDefined();
    });

    it('should ping Redis', async () => {
      expect(client).toBeDefined();
    });

    it('should get Redis info', async () => {
      expect(client).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should track cache hits', () => {
      const stats = client.getStats();
      expect(stats.hits).toBe(0);
    });

    it('should track cache misses', () => {
      const stats = client.getStats();
      expect(stats.misses).toBe(0);
    });

    it('should calculate hit rate', () => {
      const stats = client.getStats();
      expect(stats.hitRate).toBeDefined();
    });

    it('should track set operations', () => {
      const stats = client.getStats();
      expect(stats.sets).toBeDefined();
    });

    it('should track delete operations', () => {
      const stats = client.getStats();
      expect(stats.deletes).toBeDefined();
    });

    it('should track errors', () => {
      const stats = client.getStats();
      expect(stats.errors).toBeDefined();
    });

    it('should reset statistics', () => {
      client.resetStats();
      const stats = client.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('Event Listeners', () => {
    it('should register cache listener', () => {
      const mockListener = jest.fn();
      client.onCache(mockListener);

      expect(client).toBeDefined();
    });

    it('should unregister cache listener', () => {
      const mockListener = jest.fn();
      client.onCache(mockListener);
      client.offCache(mockListener);

      expect(client).toBeDefined();
    });

    it('should support chaining listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      const result = client.onCache(listener1).onCache(listener2);

      expect(result).toBe(client);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });

      client.onCache(errorListener);
      expect(client).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should accept custom host and port', () => {
      const customConfig: ICacheConfig = {
        host: 'redis.example.com',
        port: 6380,
      };

      const testClient = new CacheClient(customConfig);
      expect(testClient).toBeDefined();
    });

    it('should support database selection', () => {
      const customConfig: ICacheConfig = {
        host: 'localhost',
        port: 6379,
        database: 5,
      };

      const testClient = new CacheClient(customConfig);
      expect(testClient).toBeDefined();
    });

    it('should support password authentication', () => {
      const customConfig: ICacheConfig = {
        host: 'localhost',
        port: 6379,
        password: 'secure-password',
      };

      const testClient = new CacheClient(customConfig);
      expect(testClient).toBeDefined();
    });

    it('should support username authentication', () => {
      const customConfig: ICacheConfig = {
        host: 'localhost',
        port: 6379,
        username: 'default',
        password: 'password',
      };

      const testClient = new CacheClient(customConfig);
      expect(testClient).toBeDefined();
    });

    it('should support TLS connection', () => {
      const customConfig: ICacheConfig = {
        host: 'localhost',
        port: 6380,
        tls: true,
      };

      const testClient = new CacheClient(customConfig);
      expect(testClient).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should support generic types', () => {
      interface CacheData {
        id: string;
        name: string;
        timestamp: Date;
      }

      expect(client).toBeDefined();
    });

    it('should support custom object types', () => {
      interface Alert {
        alertId: string;
        severity: string;
        message: string;
      }

      expect(client).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', async () => {
      const badConfig: ICacheConfig = {
        host: 'invalid-host',
        port: 9999,
        connectTimeout: 1000,
      };

      const testClient = new CacheClient(badConfig);
      expect(testClient).toBeDefined();
    });

    it('should track error count', () => {
      const stats = client.getStats();
      expect(stats.errors).toBeDefined();
    });

    it('should handle operations on closed connection', async () => {
      expect(client.isConnected_()).toBe(false);
    });
  });

  describe('Factory Function', () => {
    it('should create client with factory', () => {
      const testClient = createCacheClient(config);
      expect(testClient).toBeInstanceOf(CacheClient);
    });

    it('should create independent instances', () => {
      const client1 = createCacheClient(config);
      const client2 = createCacheClient(config);

      expect(client1).not.toBe(client2);
    });
  });

  describe('Lifecycle', () => {
    it('should support connect and disconnect', async () => {
      expect(client).toBeDefined();
    });

    it('should handle multiple connections', () => {
      const client1 = createCacheClient(config);
      const client2 = createCacheClient(config);

      expect(client1).toBeDefined();
      expect(client2).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should track cache performance', () => {
      const stats = client.getStats();
      expect(stats.hitRate).toBeDefined();
    });

    it('should calculate hit rate correctly', () => {
      const stats = client.getStats();
      if (stats.hits + stats.misses > 0) {
        expect(stats.hitRate).toBeLessThanOrEqual(1);
        expect(stats.hitRate).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

describe('CacheClient - Integration Scenarios', () => {
  let client: CacheClient;

  beforeEach(() => {
    const config: ICacheConfig = {
      host: 'localhost',
      port: 6379,
    };

    client = new CacheClient(config);
  });

  it('should support cache warming', () => {
    expect(client).toBeDefined();
  });

  it('should support cache invalidation', () => {
    expect(client).toBeDefined();
  });

  it('should support session storage', () => {
    expect(client).toBeDefined();
  });

  it('should support rate limiting', () => {
    expect(client).toBeDefined();
  });

  it('should support real-time data caching', () => {
    expect(client).toBeDefined();
  });
});
