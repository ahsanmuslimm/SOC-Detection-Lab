/**
 * Search Service - Prototype Demonstrations
 * 12 comprehensive scenario demonstrations
 */

import {
  SearchService,
  createSearchService,
  ISearchServiceConfig,
  SearchListener,
} from '../src/index';

/**
 * Demo 1: Basic index and search operations
 */
async function demo1_BasicIndexAndSearch(): Promise<void> {
  console.log('\n=== Demo 1: Basic Index and Search Operations ===');

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
    maxIndexSize: 1073741824,
  };

  const service = createSearchService(config);

  // Create index
  const indexId = service.createIndex({
    name: 'security_alerts',
    fields: [
      { name: 'title', type: 'text', indexed: true, stored: true },
      { name: 'description', type: 'text', indexed: true, stored: true },
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

  console.log(`✓ Created index: ${indexId}`);

  // Index documents
  service.indexDocument(indexId, {
    id: 'alert1',
    content: { title: 'SSH Brute Force', description: 'Unauthorized SSH login attempts' },
    fields: { title: 'SSH Brute Force', severity: 8 },
  });

  service.indexDocument(indexId, {
    id: 'alert2',
    content: { title: 'Port Scan', description: 'Unauthorized port scanning activity' },
    fields: { title: 'Port Scan', severity: 5 },
  });

  console.log('✓ Indexed 2 documents');

  // Search
  const results = service.search(indexId, {
    text: 'SSH',
    pagination: { page: 1, pageSize: 10 },
  });

  console.log(`✓ Search results:`);
  console.log(`  - Total hits: ${results.totalHits}`);
  console.log(`  - Results: ${results.results.length}`);
  console.log(`  - Duration: ${results.duration}ms`);

  service.stop();
}

/**
 * Demo 2: Document management (CRUD)
 */
async function demo2_DocumentManagement(): Promise<void> {
  console.log('\n=== Demo 2: Document Management (CRUD) ===');

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
    maxIndexSize: 1073741824,
  };

  const service = createSearchService(config);

  const indexId = service.createIndex({
    name: 'incidents',
    fields: [
      { name: 'title', type: 'text', indexed: true, stored: true },
      { name: 'status', type: 'keyword', indexed: true, stored: true },
    ],
    analyzer: 'standard',
    tokenizer: 'standard',
    rankingAlgorithm: 'BM25',
    enableHighlighting: true,
    enableAggregation: true,
    enableFacets: true,
    maxResultSize: 1000,
  });

  // Create
  service.indexDocument(indexId, {
    id: 'incident1',
    content: { title: 'Data Breach', status: 'open' },
    fields: { status: 'open' },
  });

  console.log('✓ Created document: incident1');

  // Read
  const doc = service.getDocument(indexId, 'incident1');
  console.log(`✓ Retrieved document: ${doc?.id}`);

  // Update
  service.updateDocument(indexId, 'incident1', { title: 'Data Breach', status: 'resolved' });
  console.log('✓ Updated document');

  // Delete
  service.deleteDocument(indexId, 'incident1');
  console.log('✓ Deleted document');

  service.stop();
}

/**
 * Demo 3: Batch operations
 */
async function demo3_BatchOperations(): Promise<void> {
  console.log('\n=== Demo 3: Batch Operations ===');

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
    maxIndexSize: 1073741824,
  };

  const service = createSearchService(config);

  const indexId = service.createIndex({
    name: 'events',
    fields: [
      { name: 'event_type', type: 'keyword', indexed: true, stored: true },
    ],
    analyzer: 'standard',
    tokenizer: 'standard',
    rankingAlgorithm: 'BM25',
    enableHighlighting: true,
    enableAggregation: true,
    enableFacets: true,
    maxResultSize: 1000,
  });

  const documents = [];
  for (let i = 1; i <= 10; i++) {
    documents.push({
      id: `event${i}`,
      content: { type: `Event ${i}`, timestamp: new Date() },
    });
  }

  const result = service.indexBatch(indexId, documents);

  console.log(`✓ Batch operation completed:`);
  console.log(`  - Total documents: ${result.documentCount}`);
  console.log(`  - Successful: ${result.successCount}`);
  console.log(`  - Failed: ${result.failureCount}`);
  console.log(`  - Duration: ${result.duration}ms`);

  service.stop();
}

/**
 * Demo 4: Search filtering
 */
async function demo4_SearchFiltering(): Promise<void> {
  console.log('\n=== Demo 4: Search Filtering ===');

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
    maxIndexSize: 1073741824,
  };

  const service = createSearchService(config);

  const indexId = service.createIndex({
    name: 'alerts_filtered',
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

  for (let i = 1; i <= 5; i++) {
    service.indexDocument(indexId, {
      id: `alert${i}`,
      content: { title: `Alert ${i}`, severity: i * 2 },
      fields: { title: `Alert ${i}`, severity: i * 2 },
    });
  }

  console.log('✓ Indexed 5 documents');

  // Filter by severity
  const highSeverity = service.search(indexId, {
    filters: [{ field: 'severity', operator: 'gte', value: 6 }],
  });

  console.log(`✓ High severity alerts (>= 6): ${highSeverity.totalHits}`);

  // Combine text and filter
  const combined = service.search(indexId, {
    text: 'Alert',
    filters: [{ field: 'severity', operator: 'lte', value: 4 }],
  });

  console.log(`✓ Low severity "Alert" results: ${combined.totalHits}`);

  service.stop();
}

/**
 * Demo 5: Sorting and pagination
 */
async function demo5_SortingAndPagination(): Promise<void> {
  console.log('\n=== Demo 5: Sorting and Pagination ===');

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
    maxIndexSize: 1073741824,
  };

  const service = createSearchService(config);

  const indexId = service.createIndex({
    name: 'paginated_search',
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

  for (let i = 1; i <= 25; i++) {
    service.indexDocument(indexId, {
      id: `item${i}`,
      content: { priority: Math.floor(Math.random() * 10) },
      fields: { priority: Math.floor(Math.random() * 10) },
    });
  }

  const page1 = service.search(indexId, {
    sort: [{ field: 'priority', order: 'desc' }],
    pagination: { page: 1, pageSize: 10 },
  });

  const page2 = service.search(indexId, {
    sort: [{ field: 'priority', order: 'desc' }],
    pagination: { page: 2, pageSize: 10 },
  });

  console.log(`✓ Pagination results:`);
  console.log(`  - Total hits: ${page1.totalHits}`);
  console.log(`  - Total pages: ${page1.totalPages}`);
  console.log(`  - Page 1 results: ${page1.results.length}`);
  console.log(`  - Page 2 results: ${page2.results.length}`);

  service.stop();
}

/**
 * Demo 6: Highlighting
 */
async function demo6_Highlighting(): Promise<void> {
  console.log('\n=== Demo 6: Highlighting ===');

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
    maxIndexSize: 1073741824,
  };

  const service = createSearchService(config);

  const indexId = service.createIndex({
    name: 'highlight_search',
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
    content: { content: 'This is a security incident report with critical findings' },
    fields: { content: 'This is a security incident report with critical findings' },
  });

  const results = service.search(indexId, {
    text: 'security incident',
    highlight: {
      enabled: true,
      fields: ['content'],
    },
  });

  console.log(`✓ Highlighting enabled:`);
  if (results.results[0]?.highlight) {
    console.log(`  - Highlighted content: ${Object.keys(results.results[0].highlight).join(', ')}`);
  }

  service.stop();
}

/**
 * Demo 7: Aggregations
 */
async function demo7_Aggregations(): Promise<void> {
  console.log('\n=== Demo 7: Aggregations ===');

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
    maxIndexSize: 1073741824,
  };

  const service = createSearchService(config);

  const indexId = service.createIndex({
    name: 'aggregation_search',
    fields: [
      { name: 'impact_score', type: 'numeric', indexed: true, stored: true },
    ],
    analyzer: 'standard',
    tokenizer: 'standard',
    rankingAlgorithm: 'BM25',
    enableHighlighting: true,
    enableAggregation: true,
    enableFacets: true,
    maxResultSize: 1000,
  });

  for (let i = 1; i <= 10; i++) {
    service.indexDocument(indexId, {
      id: `metric${i}`,
      content: { score: i * 10 },
      fields: { impact_score: i * 10 },
    });
  }

  const results = service.search(indexId, {
    aggregations: [
      { name: 'total', type: 'sum', field: 'impact_score' },
      { name: 'average', type: 'avg', field: 'impact_score' },
      { name: 'max', type: 'max', field: 'impact_score' },
    ],
  });

  console.log(`✓ Aggregation results:`);
  console.log(`  - Total: ${results.aggregations?.total}`);
  console.log(`  - Average: ${results.aggregations?.average?.toFixed(2)}`);
  console.log(`  - Max: ${results.aggregations?.max}`);

  service.stop();
}

/**
 * Demo 8: Ranking profiles
 */
async function demo8_RankingProfiles(): Promise<void> {
  console.log('\n=== Demo 8: Ranking Profiles ===');

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
    maxIndexSize: 1073741824,
  };

  const service = createSearchService(config);

  const profileId = service.createRankingProfile({
    name: 'security_ranking',
    algorithm: 'BM25',
    fieldWeights: {
      title: 3.0,
      description: 1.5,
      severity: 2.0,
    },
  });

  console.log(`✓ Created ranking profile: ${profileId}`);

  const profile = service.getRankingProfile(profileId);

  console.log(`✓ Profile details:`);
  console.log(`  - Name: ${profile?.name}`);
  console.log(`  - Algorithm: ${profile?.algorithm}`);
  console.log(`  - Field weights: ${JSON.stringify(profile?.fieldWeights)}`);

  service.stop();
}

/**
 * Demo 9: Statistics and health
 */
async function demo9_StatisticsAndHealth(): Promise<void> {
  console.log('\n=== Demo 9: Statistics and Health ===');

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
    maxIndexSize: 1073741824,
  };

  const service = createSearchService(config);

  const indexId = service.createIndex({
    name: 'stats_test',
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
    content: { title: 'Test' },
  });

  service.search(indexId, { text: 'test' });

  const stats = service.getStats();
  console.log(`✓ Search statistics:`);
  console.log(`  - Total indexes: ${stats.totalIndexes}`);
  console.log(`  - Total documents: ${stats.totalDocuments}`);
  console.log(`  - Total searches: ${stats.totalSearches}`);
  console.log(`  - Successful: ${stats.successfulSearches}`);
  console.log(`  - Failed: ${stats.failedSearches}`);

  const health = await service.performHealthCheck();
  console.log(`✓ Health check:`);
  console.log(`  - Status: ${health.status}`);
  console.log(`  - Indexes: ${health.indexes.length}`);

  service.stop();
}

/**
 * Demo 10: Event listeners
 */
async function demo10_EventListeners(): Promise<void> {
  console.log('\n=== Demo 10: Event Listeners ===');

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
    maxIndexSize: 1073741824,
  };

  const service = createSearchService(config);

  const events: any[] = [];

  const listener: SearchListener = async (event) => {
    events.push(event);
  };

  service.onEvent(listener);

  const indexId = service.createIndex({
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

  service.indexDocument(indexId, {
    id: 'doc1',
    content: { title: 'Test' },
  });

  service.search(indexId, { text: 'test' });

  await new Promise((resolve) => setTimeout(resolve, 100));

  console.log(`✓ Events captured: ${events.length}`);
  events.forEach((event) => {
    console.log(`  - ${event.type}`);
  });

  service.stop();
}

/**
 * Demo 11: Index management
 */
async function demo11_IndexManagement(): Promise<void> {
  console.log('\n=== Demo 11: Index Management ===');

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
    maxIndexSize: 1073741824,
  };

  const service = createSearchService(config);

  const index1 = service.createIndex({
    name: 'index1',
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

  const index2 = service.createIndex({
    name: 'index2',
    fields: [
      { name: 'content', type: 'text', indexed: true, stored: true },
    ],
    analyzer: 'standard',
    tokenizer: 'standard',
    rankingAlgorithm: 'TF-IDF',
    enableHighlighting: true,
    enableAggregation: true,
    enableFacets: true,
    maxResultSize: 1000,
  });

  console.log(`✓ Created 2 indexes`);

  const config1 = service.getIndex(index1);
  console.log(`✓ Index 1: ${config1?.name}`);

  const deleted = service.deleteIndex(index1);
  console.log(`✓ Deleted index 1: ${deleted}`);

  service.stop();
}

/**
 * Demo 12: Complete integration flow
 */
async function demo12_CompleteIntegrationFlow(): Promise<void> {
  console.log('\n=== Demo 12: Complete Integration Flow ===');

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
    maxIndexSize: 1073741824,
  };

  const service = createSearchService(config);

  console.log('✓ Service initialized');

  // Create index
  const indexId = service.createIndex({
    name: 'security_incidents',
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

  console.log(`✓ Created index: ${indexId}`);

  // Index documents
  const docs = [
    { id: 'incident1', content: { title: 'SQL Injection', severity: 9 }, fields: { title: 'SQL Injection', severity: 9 } },
    { id: 'incident2', content: { title: 'XSS Attack', severity: 7 }, fields: { title: 'XSS Attack', severity: 7 } },
    { id: 'incident3', content: { title: 'DDoS Attack', severity: 8 }, fields: { title: 'DDoS Attack', severity: 8 } },
  ];

  const batch = service.indexBatch(indexId, docs);
  console.log(`✓ Indexed ${batch.successCount} documents`);

  // Search
  const search1 = service.search(indexId, {
    filters: [{ field: 'severity', operator: 'gte', value: 8 }],
    aggregations: [
      { name: 'total_severity', type: 'sum', field: 'severity' },
      { name: 'avg_severity', type: 'avg', field: 'severity' },
    ],
  });

  console.log(`✓ High severity incidents: ${search1.totalHits}`);
  console.log(`  - Total severity: ${search1.aggregations?.total_severity}`);
  console.log(`  - Avg severity: ${search1.aggregations?.avg_severity?.toFixed(2)}`);

  // Get stats
  const stats = service.getStats();
  const health = await service.performHealthCheck();

  console.log(`✓ Final status:`);
  console.log(`  - Indexes: ${stats.totalIndexes}`);
  console.log(`  - Documents: ${stats.totalDocuments}`);
  console.log(`  - Searches: ${stats.totalSearches}`);
  console.log(`  - Health: ${health.status}`);

  service.stop();
  console.log('✓ Service stopped');
}

/**
 * Run all demos
 */
async function runAllDemos(): Promise<void> {
  console.log('════════════════════════════════════════════════════════════');
  console.log('           Search Service - Prototype Demonstrations');
  console.log('════════════════════════════════════════════════════════════');

  try {
    await demo1_BasicIndexAndSearch();
    await demo2_DocumentManagement();
    await demo3_BatchOperations();
    await demo4_SearchFiltering();
    await demo5_SortingAndPagination();
    await demo6_Highlighting();
    await demo7_Aggregations();
    await demo8_RankingProfiles();
    await demo9_StatisticsAndHealth();
    await demo10_EventListeners();
    await demo11_IndexManagement();
    await demo12_CompleteIntegrationFlow();

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('          All Demos Completed Successfully');
    console.log('════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('Error running demos:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllDemos().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export {
  demo1_BasicIndexAndSearch,
  demo2_DocumentManagement,
  demo3_BatchOperations,
  demo4_SearchFiltering,
  demo5_SortingAndPagination,
  demo6_Highlighting,
  demo7_Aggregations,
  demo8_RankingProfiles,
  demo9_StatisticsAndHealth,
  demo10_EventListeners,
  demo11_IndexManagement,
  demo12_CompleteIntegrationFlow,
  runAllDemos,
};
