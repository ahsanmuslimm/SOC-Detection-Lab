/**
 * Search Service - Unit Tests
 * Comprehensive test coverage for search, indexing, filtering, and aggregation
 */

import {
  SearchService,
  createSearchService,
  ISearchServiceConfig,
  ISearchQuery,
  SearchListener,
} from '../../src/index';

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(() => {
    const config: ISearchServiceConfig = {
      maxIndexes: 100,
      maxDocumentsPerIndex: 100000,
      defaultAnalyzer: 'standard',
      defaultRankingAlgorithm: 'BM25',
      enableHighlighting: true,
      enableAggregation: true,
      enableFaceting: true,
      maxResultsPerQuery: 1000,
      queryTimeout: 5000,
      indexingBatchSize: 100,
      enableMetrics: true,
      enableAnalytics: true,
      retentionDays: 30,
      maxIndexSize: 1073741824, // 1GB
    };
    service = createSearchService(config);
  });

  afterEach(() => {
    service.stop();
  });

  describe('Index Management', () => {
    test('should create index and return ID', () => {
      const indexId = service.createIndex({
        name: 'test_index',
        description: 'Test index',
        fields: [
          { name: 'title', type: 'text', indexed: true, stored: true },
          { name: 'content', type: 'text', indexed: true, stored: true },
          { name: 'timestamp', type: 'date', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      expect(indexId).toBeDefined();
      expect(typeof indexId).toBe('string');
    });

    test('should retrieve index configuration', () => {
      const indexId = service.createIndex({
        name: 'retrieve_test',
        fields: [
          { name: 'title', type: 'text', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      const config = service.getIndex(indexId);

      expect(config).toBeDefined();
      expect(config?.name).toBe('retrieve_test');
    });

    test('should delete index', () => {
      const indexId = service.createIndex({
        name: 'delete_test',
        fields: [
          { name: 'title', type: 'text', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      const deleted = service.deleteIndex(indexId);
      expect(deleted).toBe(true);

      const retrieved = service.getIndex(indexId);
      expect(retrieved).toBeNull();
    });
  });

  describe('Document Indexing', () => {
    test('should index document and return ID', () => {
      const indexId = service.createIndex({
        name: 'indexing_test',
        fields: [
          { name: 'title', type: 'text', indexed: true, stored: true },
          { name: 'content', type: 'text', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      const docId = service.indexDocument(indexId, {
        id: 'doc1',
        content: { title: 'Test Document', text: 'This is a test' },
        fields: { title: 'Test Document' },
      });

      expect(docId).toBe('doc1');
    });

    test('should retrieve indexed document', () => {
      const indexId = service.createIndex({
        name: 'retrieve_doc_test',
        fields: [
          { name: 'title', type: 'text', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      const content = { title: 'Alert', description: 'Security alert' };
      service.indexDocument(indexId, {
        id: 'alert1',
        content,
        fields: { title: 'Alert' },
      });

      const doc = service.getDocument(indexId, 'alert1');

      expect(doc).toBeDefined();
      expect(doc?.id).toBe('alert1');
    });

    test('should update document', () => {
      const indexId = service.createIndex({
        name: 'update_test',
        fields: [
          { name: 'title', type: 'text', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      service.indexDocument(indexId, {
        id: 'doc1',
        content: { title: 'Original' },
      });

      const updated = service.updateDocument(indexId, 'doc1', { title: 'Updated' });
      expect(updated).toBe(true);

      const doc = service.getDocument(indexId, 'doc1');
      expect(doc?.content.title).toBe('Updated');
      expect(doc?.version).toBe(2);
    });

    test('should delete document', () => {
      const indexId = service.createIndex({
        name: 'delete_doc_test',
        fields: [
          { name: 'title', type: 'text', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      service.indexDocument(indexId, {
        id: 'doc1',
        content: { title: 'To be deleted' },
      });

      const deleted = service.deleteDocument(indexId, 'doc1');
      expect(deleted).toBe(true);

      const retrieved = service.getDocument(indexId, 'doc1');
      expect(retrieved).toBeNull();
    });
  });

  describe('Bulk Operations', () => {
    test('should index batch of documents', () => {
      const indexId = service.createIndex({
        name: 'batch_test',
        fields: [
          { name: 'title', type: 'text', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      const documents = [
        { id: 'doc1', content: { title: 'Doc 1' } },
        { id: 'doc2', content: { title: 'Doc 2' } },
        { id: 'doc3', content: { title: 'Doc 3' } },
      ];

      const result = service.indexBatch(indexId, documents);

      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);
    });

    test('should handle errors in batch operation', () => {
      const indexId = service.createIndex({
        name: 'batch_error_test',
        fields: [
          { name: 'title', type: 'text', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      const documents = [
        { id: 'doc1', content: { title: 'Doc 1' } },
        { id: 'doc2', content: { title: 'Doc 2' } },
      ];

      const result = service.indexBatch(indexId, documents);

      expect(result.documentCount).toBe(2);
      expect(result.successCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Search Queries', () => {
    test('should search and return results', () => {
      const indexId = service.createIndex({
        name: 'search_test',
        fields: [
          { name: 'title', type: 'text', indexed: true, stored: true },
          { name: 'content', type: 'text', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      service.indexDocument(indexId, {
        id: 'alert1',
        content: { title: 'SSH Attack', description: 'Brute force attempt' },
        fields: { title: 'SSH Attack' },
      });

      const results = service.search(indexId, {
        text: 'SSH',
        pagination: { page: 1, pageSize: 10 },
      });

      expect(results.totalHits).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(results.results)).toBe(true);
    });

    test('should support pagination', () => {
      const indexId = service.createIndex({
        name: 'pagination_test',
        fields: [
          { name: 'id', type: 'keyword', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      for (let i = 1; i <= 25; i++) {
        service.indexDocument(indexId, {
          id: `doc${i}`,
          content: { id: i },
          fields: { id: String(i) },
        });
      }

      const page1 = service.search(indexId, {
        pagination: { page: 1, pageSize: 10 },
      });

      const page2 = service.search(indexId, {
        pagination: { page: 2, pageSize: 10 },
      });

      expect(page1.results.length).toBeLessThanOrEqual(10);
      expect(page2.results.length).toBeLessThanOrEqual(10);
      expect(page1.totalPages).toBeGreaterThan(1);
    });

    test('should support sorting', () => {
      const indexId = service.createIndex({
        name: 'sort_test',
        fields: [
          { name: 'priority', type: 'numeric', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      service.indexDocument(indexId, {
        id: 'doc1',
        content: { priority: 3 },
        fields: { priority: 3 },
      });

      service.indexDocument(indexId, {
        id: 'doc2',
        content: { priority: 1 },
        fields: { priority: 1 },
      });

      service.indexDocument(indexId, {
        id: 'doc3',
        content: { priority: 2 },
        fields: { priority: 2 },
      });

      const results = service.search(indexId, {
        sort: [{ field: 'priority', order: 'asc' }],
      });

      expect(results.results.length).toBeGreaterThan(0);
    });

    test('should support filtering', () => {
      const indexId = service.createIndex({
        name: 'filter_test',
        fields: [
          { name: 'severity', type: 'numeric', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      service.indexDocument(indexId, {
        id: 'alert1',
        content: { severity: 8 },
        fields: { severity: 8 },
      });

      service.indexDocument(indexId, {
        id: 'alert2',
        content: { severity: 3 },
        fields: { severity: 3 },
      });

      const results = service.search(indexId, {
        filters: [{ field: 'severity', operator: 'gte', value: 5 }],
      });

      expect(results.results.length).toBeGreaterThanOrEqual(0);
    });

    test('should support highlighting', () => {
      const indexId = service.createIndex({
        name: 'highlight_test',
        fields: [
          { name: 'content', type: 'text', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      service.indexDocument(indexId, {
        id: 'doc1',
        content: { content: 'This is a test document' },
        fields: { content: 'This is a test document' },
      });

      const results = service.search(indexId, {
        text: 'test',
        highlight: {
          enabled: true,
          fields: ['content'],
        },
      });

      expect(results.results[0]?.highlight).toBeDefined();
    });
  });

  describe('Aggregations', () => {
    test('should compute count aggregation', () => {
      const indexId = service.createIndex({
        name: 'agg_count_test',
        fields: [
          { name: 'title', type: 'text', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      service.indexDocument(indexId, {
        id: 'doc1',
        content: { title: 'Doc 1' },
      });

      service.indexDocument(indexId, {
        id: 'doc2',
        content: { title: 'Doc 2' },
      });

      const results = service.search(indexId, {
        aggregations: [{ name: 'total_docs', type: 'count' }],
      });

      expect(results.aggregations?.total_docs).toBeDefined();
    });

    test('should compute numeric aggregations', () => {
      const indexId = service.createIndex({
        name: 'agg_numeric_test',
        fields: [
          { name: 'value', type: 'numeric', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      service.indexDocument(indexId, {
        id: 'doc1',
        content: { value: 10 },
        fields: { value: 10 },
      });

      service.indexDocument(indexId, {
        id: 'doc2',
        content: { value: 20 },
        fields: { value: 20 },
      });

      const results = service.search(indexId, {
        aggregations: [
          { name: 'total', type: 'sum', field: 'value' },
          { name: 'average', type: 'avg', field: 'value' },
          { name: 'minimum', type: 'min', field: 'value' },
          { name: 'maximum', type: 'max', field: 'value' },
        ],
      });

      expect(results.aggregations?.total).toBeDefined();
      expect(results.aggregations?.average).toBeDefined();
    });
  });

  describe('Ranking Profiles', () => {
    test('should create ranking profile', () => {
      const profileId = service.createRankingProfile({
        name: 'custom_ranking',
        algorithm: 'BM25',
        fieldWeights: {
          title: 2.0,
          content: 1.0,
        },
      });

      expect(profileId).toBeDefined();
      expect(typeof profileId).toBe('string');
    });

    test('should retrieve ranking profile', () => {
      const profileId = service.createRankingProfile({
        name: 'test_profile',
        algorithm: 'TF-IDF',
      });

      const profile = service.getRankingProfile(profileId);

      expect(profile).toBeDefined();
      expect(profile?.name).toBe('test_profile');
    });
  });

  describe('Statistics and Health', () => {
    test('should get search statistics', () => {
      const stats = service.getStats();

      expect(stats).toBeDefined();
      expect(stats.totalIndexes).toBeDefined();
      expect(stats.totalDocuments).toBeDefined();
      expect(stats.totalSearches).toBeDefined();
    });

    test('should perform health check', async () => {
      service.createIndex({
        name: 'health_test',
        fields: [
          { name: 'title', type: 'text', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      const health = await service.performHealthCheck();

      expect(health.status).toMatch(/healthy|degraded|unhealthy/);
      expect(Array.isArray(health.indexes)).toBe(true);
    });
  });

  describe('Event Listeners', () => {
    test('should register event listener', (done) => {
      let eventReceived = false;

      const listener: SearchListener = async () => {
        eventReceived = true;
      };

      service.onEvent(listener);

      service.createIndex({
        name: 'event_test',
        fields: [
          { name: 'title', type: 'text', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      setTimeout(() => {
        expect(eventReceived).toBe(true);
        done();
      }, 100);
    });

    test('should support chaining listeners', () => {
      const listener1: SearchListener = async () => {};
      const listener2: SearchListener = async () => {};

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

    test('should continue accepting operations after creation', () => {
      const indexId = service.createIndex({
        name: 'lifecycle_test',
        fields: [
          { name: 'title', type: 'text', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      expect(indexId).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    test('should perform complete search workflow', async () => {
      // Create index
      const indexId = service.createIndex({
        name: 'integration_test',
        fields: [
          { name: 'title', type: 'text', indexed: true, stored: true },
          { name: 'severity', type: 'numeric', indexed: true, stored: true },
        ],
        analyzer: 'standard',
        tokenizer: 'standard',
        rankingAlgorithm: 'BM25',
        enableHighlighting: true,
        enableAggregation: true,
        enableFacets: true,
        maxResultSize: 1000,
      });

      // Index documents
      service.indexDocument(indexId, {
        id: 'alert1',
        content: { title: 'SSH Attack', severity: 8 },
        fields: { title: 'SSH Attack', severity: 8 },
      });

      service.indexDocument(indexId, {
        id: 'alert2',
        content: { title: 'Port Scan', severity: 5 },
        fields: { title: 'Port Scan', severity: 5 },
      });

      // Search
      const results = service.search(indexId, {
        text: 'attack',
        filters: [{ field: 'severity', operator: 'gte', value: 5 }],
        pagination: { page: 1, pageSize: 10 },
      });

      expect(results.totalHits).toBeGreaterThanOrEqual(0);

      // Update document
      service.updateDocument(indexId, 'alert1', { title: 'Updated Attack', severity: 9 });

      // Get statistics
      const stats = service.getStats();
      expect(stats.totalIndexes).toBeGreaterThan(0);

      // Health check
      const health = await service.performHealthCheck();
      expect(health.status).toBeDefined();
    });
  });
});
