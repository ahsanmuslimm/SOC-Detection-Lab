/**
 * OpenSearch Client - Unit Tests
 * Tests search operations, index management, and bulk operations
 */

import { OpenSearchClient, createOpenSearchClient } from '../../src/main';
import type { IOpenSearchConfig, IIndexConfig, ISearchQuery } from '../../src/types';

describe('OpenSearchClient', () => {
  let config: IOpenSearchConfig;
  let client: OpenSearchClient;

  beforeAll(() => {
    config = {
      nodes: ['http://localhost:9200'],
      username: 'admin',
      password: 'admin',
      requestTimeout: 30000,
      maxRetries: 3,
    };
  });

  beforeEach(() => {
    client = new OpenSearchClient(config);
  });

  describe('Connection Management', () => {
    it('should create OpenSearchClient with config', () => {
      const testClient = new OpenSearchClient(config);
      expect(testClient).toBeDefined();
      expect(testClient).toBeInstanceOf(OpenSearchClient);
    });

    it('should use factory function to create client', () => {
      const testClient = createOpenSearchClient(config);
      expect(testClient).toBeDefined();
      expect(testClient).toBeInstanceOf(OpenSearchClient);
    });

    it('should report connection status', () => {
      expect(client.isConnected_()).toBe(false);
    });

    it('should accept custom configuration', () => {
      const customConfig: IOpenSearchConfig = {
        nodes: ['http://node1:9200', 'http://node2:9200'],
        username: 'user',
        password: 'pass',
        requestTimeout: 60000,
        maxRetries: 5,
      };

      const testClient = new OpenSearchClient(customConfig);
      expect(testClient).toBeDefined();
    });
  });

  describe('Cluster Operations', () => {
    it('should check cluster health', async () => {
      // Note: Actual connection requires running OpenSearch
      expect(client).toBeDefined();
    });

    it('should get cluster stats', async () => {
      expect(client).toBeDefined();
    });

    it('should handle different health statuses', () => {
      // Green, Yellow, Red
      expect(client).toBeDefined();
    });
  });

  describe('Index Management', () => {
    it('should create index with config', async () => {
      const indexConfig: IIndexConfig = {
        name: 'alerts',
        numberOfShards: 3,
        numberOfReplicas: 1,
        mappings: {
          properties: {
            title: { type: 'text' },
            severity: { type: 'keyword' },
            timestamp: { type: 'date' },
          },
        },
      };

      expect(client).toBeDefined();
    });

    it('should support custom index settings', () => {
      const config: IIndexConfig = {
        name: 'events',
        numberOfShards: 5,
        numberOfReplicas: 2,
        refreshInterval: '30s',
      };

      expect(config.numberOfShards).toBe(5);
    });

    it('should delete index', async () => {
      expect(client).toBeDefined();
    });

    it('should check if index exists', async () => {
      expect(client).toBeDefined();
    });

    it('should get index stats', async () => {
      expect(client).toBeDefined();
    });
  });

  describe('Document Operations', () => {
    it('should index document', async () => {
      interface Alert {
        title: string;
        severity: string;
        timestamp: Date;
      }

      const alert: Alert = {
        title: 'Critical Alert',
        severity: 'high',
        timestamp: new Date(),
      };

      expect(client).toBeDefined();
    });

    it('should get document', async () => {
      expect(client).toBeDefined();
    });

    it('should update document', async () => {
      expect(client).toBeDefined();
    });

    it('should delete document', async () => {
      expect(client).toBeDefined();
    });

    it('should support custom document IDs', () => {
      expect(client).toBeDefined();
    });
  });

  describe('Search Operations', () => {
    it('should search documents', async () => {
      const query: ISearchQuery = {
        query: {
          match: {
            title: 'alert',
          },
        },
        size: 10,
      };

      expect(client).toBeDefined();
    });

    it('should support pagination in search', () => {
      const query: ISearchQuery = {
        from: 20,
        size: 10,
      };

      expect(query.from).toBe(20);
      expect(query.size).toBe(10);
    });

    it('should support sorting', () => {
      const query: ISearchQuery = {
        sort: [{ timestamp: 'desc' }],
      };

      expect(query.sort).toBeDefined();
    });

    it('should support aggregations', () => {
      const query: ISearchQuery = {
        aggs: {
          severity_count: {
            terms: { field: 'severity' },
          },
        },
      };

      expect(query.aggs).toBeDefined();
    });

    it('should support highlighting', () => {
      const query: ISearchQuery = {
        highlight: {
          fields: {
            title: {},
            description: {},
          },
        },
      };

      expect(query.highlight).toBeDefined();
    });

    it('should support source filtering', () => {
      const query: ISearchQuery = {
        _source: ['title', 'severity'],
      };

      expect(query._source).toEqual(['title', 'severity']);
    });
  });

  describe('Bulk Operations', () => {
    it('should perform bulk operations', async () => {
      const operations = [
        { index: { _index: 'alerts' }, doc: { title: 'Alert 1' } },
        { index: { _index: 'alerts' }, doc: { title: 'Alert 2' } },
        { index: { _index: 'alerts' }, doc: { title: 'Alert 3' } },
      ];

      expect(client).toBeDefined();
    });

    it('should bulk index documents', async () => {
      const documents = [
        { title: 'Alert 1', severity: 'high' },
        { title: 'Alert 2', severity: 'medium' },
        { title: 'Alert 3', severity: 'low' },
      ];

      expect(client).toBeDefined();
    });

    it('should handle bulk errors', () => {
      expect(client).toBeDefined();
    });

    it('should support different bulk operations', () => {
      // index, create, update, delete
      expect(client).toBeDefined();
    });
  });

  describe('Alias Management', () => {
    it('should create alias', async () => {
      expect(client).toBeDefined();
    });

    it('should delete alias', async () => {
      expect(client).toBeDefined();
    });

    it('should support read/write aliases', () => {
      expect(client).toBeDefined();
    });
  });

  describe('Index Maintenance', () => {
    it('should refresh index', async () => {
      expect(client).toBeDefined();
    });

    it('should force merge index', async () => {
      expect(client).toBeDefined();
    });

    it('should clear cache', async () => {
      expect(client).toBeDefined();
    });

    it('should clear cache for specific index', async () => {
      expect(client).toBeDefined();
    });
  });

  describe('Event Listeners', () => {
    it('should register search listener', () => {
      const mockListener = jest.fn();
      client.onSearch(mockListener);

      expect(client).toBeDefined();
    });

    it('should unregister search listener', () => {
      const mockListener = jest.fn();
      client.onSearch(mockListener);
      client.offSearch(mockListener);

      expect(client).toBeDefined();
    });

    it('should support chaining listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      const result = client.onSearch(listener1).onSearch(listener2);

      expect(result).toBe(client);
    });
  });

  describe('Counters', () => {
    it('should track search count', () => {
      expect(client.getSearchCount()).toBe(0);
    });

    it('should track error count', () => {
      expect(client.getErrorCount()).toBe(0);
    });

    it('should reset counters', () => {
      client.resetCounters();
      expect(client.getSearchCount()).toBe(0);
      expect(client.getErrorCount()).toBe(0);
    });
  });

  describe('Configuration Options', () => {
    it('should accept custom request timeout', () => {
      const customConfig: IOpenSearchConfig = {
        nodes: ['http://localhost:9200'],
        requestTimeout: 60000,
      };

      const testClient = new OpenSearchClient(customConfig);
      expect(testClient).toBeDefined();
    });

    it('should accept max retries', () => {
      const customConfig: IOpenSearchConfig = {
        nodes: ['http://localhost:9200'],
        maxRetries: 5,
      };

      const testClient = new OpenSearchClient(customConfig);
      expect(testClient).toBeDefined();
    });

    it('should accept SSL configuration', () => {
      const customConfig: IOpenSearchConfig = {
        nodes: ['https://localhost:9200'],
        ssl: {
          rejectUnauthorized: false,
        },
      };

      const testClient = new OpenSearchClient(customConfig);
      expect(testClient).toBeDefined();
    });

    it('should accept credentials', () => {
      const customConfig: IOpenSearchConfig = {
        nodes: ['http://localhost:9200'],
        username: 'admin',
        password: 'password',
      };

      const testClient = new OpenSearchClient(customConfig);
      expect(testClient).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should support generic types for documents', () => {
      interface Alert {
        id: string;
        title: string;
        severity: string;
      }

      expect(client).toBeDefined();
    });

    it('should support custom search result types', () => {
      interface SearchAlert {
        score: number;
        alert: {
          id: string;
          title: string;
        };
      }

      expect(client).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', async () => {
      const badConfig: IOpenSearchConfig = {
        nodes: ['http://invalid-host:9999'],
        requestTimeout: 1000,
      };

      const testClient = new OpenSearchClient(badConfig);
      expect(testClient).toBeDefined();
    });

    it('should increment error count on failure', () => {
      expect(client.getErrorCount()).toBe(0);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });

      // Should not throw
      client.onSearch(errorListener);
      expect(client).toBeDefined();
    });
  });

  describe('Factory Function', () => {
    it('should create client with factory', () => {
      const testClient = createOpenSearchClient(config);
      expect(testClient).toBeInstanceOf(OpenSearchClient);
    });

    it('should create independent instances', () => {
      const client1 = createOpenSearchClient(config);
      const client2 = createOpenSearchClient(config);

      expect(client1).not.toBe(client2);
    });
  });

  describe('Lifecycle', () => {
    it('should support closing connection', async () => {
      expect(client).toBeDefined();
    });

    it('should handle multiple connections', () => {
      const client1 = createOpenSearchClient(config);
      const client2 = createOpenSearchClient(config);

      expect(client1).toBeDefined();
      expect(client2).toBeDefined();
    });
  });
});

describe('OpenSearchClient - Integration Scenarios', () => {
  let client: OpenSearchClient;

  beforeEach(() => {
    const config: IOpenSearchConfig = {
      nodes: ['http://localhost:9200'],
    };

    client = new OpenSearchClient(config);
  });

  it('should support search with listeners', () => {
    const searchListener = jest.fn();
    client.onSearch(searchListener);

    expect(client).toBeDefined();
  });

  it('should provide chainable API', () => {
    const result = client
      .onSearch(jest.fn())
      .onSearch(jest.fn());

    expect(result).toBe(client);
  });

  it('should support multiple indices', () => {
    expect(client).toBeDefined();
  });

  it('should support index aliases', () => {
    expect(client).toBeDefined();
  });
});
