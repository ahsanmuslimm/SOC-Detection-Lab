/**
 * OpenSearch Client - Demo/Prototype
 * Demonstrates search operations, index management, and bulk operations
 */

import { createOpenSearchClient } from '../src/main';
import type { IOpenSearchConfig, IIndexConfig, ISearchQuery } from '../src/types';

console.log('=== OpenSearch Client - Demonstration ===\n');

// ============================================================
// 1. Configuration
// ============================================================
console.log('1. Client Configuration');
console.log('----------------------');

const config: IOpenSearchConfig = {
  nodes: process.env.OPENSEARCH_HOST
    ? [process.env.OPENSEARCH_HOST]
    : ['http://localhost:9200'],
  username: process.env.OPENSEARCH_USER || 'admin',
  password: process.env.OPENSEARCH_PASS || 'admin',
  requestTimeout: 30000,
  maxRetries: 3,
};

console.log('OpenSearch Configuration:');
console.log(`  Nodes: ${config.nodes.join(', ')}`);
console.log(`  Request timeout: ${config.requestTimeout}ms`);
console.log(`  Max retries: ${config.maxRetries}`);
console.log();

// ============================================================
// 2. Client Creation
// ============================================================
console.log('2. Client Creation');
console.log('------------------');

const client = createOpenSearchClient(config);
console.log('✓ OpenSearch client created');
console.log();

// ============================================================
// 3. Index Configuration Examples
// ============================================================
console.log('3. Index Configuration Examples');
console.log('-------------------------------');

const alertsIndexConfig: IIndexConfig = {
  name: 'alerts',
  numberOfShards: 3,
  numberOfReplicas: 1,
  refreshInterval: '1s',
  mappings: {
    properties: {
      id: { type: 'keyword' },
      title: { type: 'text', analyzer: 'standard' },
      description: { type: 'text' },
      severity: { type: 'keyword' },
      status: { type: 'keyword' },
      source_ip: { type: 'ip' },
      destination_ip: { type: 'ip' },
      timestamp: { type: 'date' },
      created_at: { type: 'date' },
      updated_at: { type: 'date' },
      tags: { type: 'keyword' },
      metadata: { type: 'object' },
    },
  },
};

console.log('Alerts Index Configuration:');
console.log(`  Index: ${alertsIndexConfig.name}`);
console.log(`  Shards: ${alertsIndexConfig.numberOfShards}`);
console.log(`  Replicas: ${alertsIndexConfig.numberOfReplicas}`);
console.log(`  Refresh: ${alertsIndexConfig.refreshInterval}`);
console.log(`  Fields: ${Object.keys(alertsIndexConfig.mappings?.properties || {}).length}`);
console.log();

// ============================================================
// 4. Search Query Examples
// ============================================================
console.log('4. Search Query Examples');
console.log('------------------------');

const searchQueries = [
  {
    name: 'Simple Match Query',
    query: {
      query: {
        match: {
          title: 'suspicious activity',
        },
      },
      size: 20,
    },
  },
  {
    name: 'Boolean Query',
    query: {
      query: {
        bool: {
          must: [{ match: { severity: 'high' } }],
          filter: [
            { range: { timestamp: { gte: 'now-24h' } } },
          ],
        },
      },
      size: 50,
    },
  },
  {
    name: 'Range Query',
    query: {
      query: {
        range: {
          timestamp: {
            gte: '2024-01-01',
            lte: '2024-12-31',
          },
        },
      },
    },
  },
  {
    name: 'Prefix Query',
    query: {
      query: {
        prefix: {
          description: 'brute',
        },
      },
    },
  },
  {
    name: 'Wildcard Query',
    query: {
      query: {
        wildcard: {
          source_ip: '192.168.*',
        },
      },
    },
  },
];

console.log('Sample Search Queries:');
searchQueries.forEach((q, idx) => {
  console.log(`\n${idx + 1}. ${q.name}`);
  console.log(`   Query: ${JSON.stringify(q.query).substring(0, 80)}...`);
});
console.log();

// ============================================================
// 5. Aggregation Examples
// ============================================================
console.log('5. Aggregation Examples');
console.log('------------------------');

const aggregations = [
  {
    name: 'Count by Severity',
    agg: {
      severity_count: {
        terms: { field: 'severity', size: 10 },
      },
    },
  },
  {
    name: 'Time Series by Day',
    agg: {
      alerts_over_time: {
        date_histogram: { field: 'timestamp', interval: 'day' },
      },
    },
  },
  {
    name: 'Top Source IPs',
    agg: {
      top_sources: {
        terms: { field: 'source_ip', size: 10 },
      },
    },
  },
];

console.log('Sample Aggregations:');
aggregations.forEach((agg, idx) => {
  console.log(`\n${idx + 1}. ${agg.name}`);
  console.log(`   Aggregation: ${JSON.stringify(agg.agg).substring(0, 80)}...`);
});
console.log();

// ============================================================
// 6. Pagination Example
// ============================================================
console.log('6. Pagination Example');
console.log('---------------------');

console.log(`
// Paginate through search results
async function paginateAlerts(pageSize: number = 20) {
  const pages = [1, 2, 3, 4, 5];
  
  for (const page of pages) {
    const from = (page - 1) * pageSize;
    
    const result = await client.search('alerts', {
      query: { match_all: {} },
      from: from,
      size: pageSize,
    });
    
    console.log(\`Page \${page}: \${result.hits.hits.length} results (total: \${result.hits.total.value})\`);
    
    // Process results...
  }
}

// Page 1: from=0, size=20   (results 1-20)
// Page 2: from=20, size=20  (results 21-40)
// Page 3: from=40, size=20  (results 41-60)
`);
console.log();

// ============================================================
// 7. Bulk Operations Example
// ============================================================
console.log('7. Bulk Operations');
console.log('-------------------');

console.log(`
// Bulk index multiple documents
const alerts = [
  { id: '1', title: 'Alert 1', severity: 'high' },
  { id: '2', title: 'Alert 2', severity: 'medium' },
  { id: '3', title: 'Alert 3', severity: 'low' },
  // ... 5000+ more
];

const response = await client.bulkIndex('alerts', alerts);

console.log(\`Bulk indexed \${alerts.length} documents\`);
console.log(\`  Errors: \${response.errors}\`);
console.log(\`  Items: \${response.items.length}\`);
console.log(\`  Duration: \${response.took}ms\`);

// Benefits:
// - Much faster than individual inserts
// - Automatic batching
// - Error handling per item
`);
console.log();

// ============================================================
// 8. Sorting Example
// ============================================================
console.log('8. Sorting Results');
console.log('------------------');

const sortExamples = [
  {
    name: 'Sort by Timestamp (Descending)',
    sort: [{ timestamp: 'desc' }],
  },
  {
    name: 'Sort by Severity then Timestamp',
    sort: [
      { severity: 'desc' },
      { timestamp: 'desc' },
    ],
  },
  {
    name: 'Sort by Distance',
    sort: [
      {
        _geo_distance: {
          location: { lat: 40, lon: -70 },
          order: 'asc',
          unit: 'km',
        },
      },
    ],
  },
];

console.log('Sorting Examples:');
sortExamples.forEach((ex, idx) => {
  console.log(`\n${idx + 1}. ${ex.name}`);
  console.log(`   Sort: ${JSON.stringify(ex.sort)}`);
});
console.log();

// ============================================================
// 9. Highlighting Example
// ============================================================
console.log('9. Search Highlighting');
console.log('----------------------');

console.log(`
// Highlight matching terms in results
const query = {
  query: {
    match: { description: 'privilege escalation' }
  },
  highlight: {
    fields: {
      description: {},
      title: {}
    },
    preTags: ['<mark>'],
    postTags: ['</mark>'],
  }
};

const result = await client.search('alerts', query);

// Results include highlighted fields:
// {
//   _source: { title: 'Suspicious Activity', description: '...' },
//   highlight: {
//     description: ['Possible <mark>privilege escalation</mark> detected']
//   }
// }
`);
console.log();

// ============================================================
// 10. Index Management Operations
// ============================================================
console.log('10. Index Management');
console.log('--------------------');

const operations = [
  'Create Index',
  'Delete Index',
  'Refresh Index',
  'Force Merge',
  'Clear Cache',
  'Create Alias',
  'Delete Alias',
  'Get Index Stats',
];

console.log('Index Management Operations:');
operations.forEach((op, idx) => {
  console.log(`  ${idx + 1}. ${op}`);
});
console.log();

// ============================================================
// 11. Cluster Health Example
// ============================================================
console.log('11. Cluster Health Check');
console.log('------------------------');

console.log(`
// Check cluster health
const health = await client.clusterHealth();

console.log('Cluster Status:', health.status);  // green, yellow, red
console.log('Nodes:', health.numberOfNodes);
console.log('Data Nodes:', health.numberOfDataNodes);
console.log('Active Shards:', health.activeShards);
console.log('Unassigned Shards:', health.unassignedShards);

// Status meanings:
// green   - All primary and replica shards assigned
// yellow  - All primary shards assigned, some replicas unassigned
// red     - Some primary shards unassigned
`);
console.log();

// ============================================================
// 12. Event Listeners
// ============================================================
console.log('12. Event Listeners');
console.log('-------------------');

let searchEventCount = 0;

// Register search listener
client.onSearch((event) => {
  searchEventCount++;
  console.log(`[Search Event] Query: ${event.query.substring(0, 60)}...`);
  console.log(`  Duration: ${event.duration}ms`);
  console.log(`  Results: ${event.hitsCount}`);
});

console.log('✓ Search listener registered');
console.log();

// ============================================================
// 13. Error Handling Integration
// ============================================================
console.log('13. Error Handling Integration');
console.log('------------------------------');

console.log(`
import { ExternalServiceError } from '@soc-detection-lab/error-handling';

try {
  const result = await client.search('alerts', query);
  return result;
} catch (err) {
  const searchError = new ExternalServiceError(
    'OpenSearch',
    'Search operation failed',
    err
  );
  
  searchError.withContext({
    userId: 'analyst-123',
    requestId: 'req-789',
  });
  
  searchError.withMetadata({
    indexName: 'alerts',
    querySize: query.size,
  });
  
  throw searchError;
}
`);
console.log();

// ============================================================
// 14. Document Operations Example
// ============================================================
console.log('14. Document Operations');
console.log('------------------------');

console.log(`
// Index a document
const docId = await client.index('alerts', {
  title: 'Suspicious Login',
  severity: 'high',
  timestamp: new Date(),
});

// Get a document
const alert = await client.get('alerts', docId);

// Update a document
await client.update('alerts', docId, {
  doc: { status: 'acknowledged' }
});

// Delete a document
await client.delete('alerts', docId);
`);
console.log();

// ============================================================
// 15. Summary
// ============================================================
console.log('15. Feature Summary');
console.log('-------------------');

const features = {
  'Index Management': ['Create', 'Delete', 'Manage aliases', 'Refresh'],
  'Document Operations': ['Index', 'Get', 'Update', 'Delete', 'Bulk'],
  'Search': ['Query DSL', 'Filters', 'Sorting', 'Pagination', 'Highlighting'],
  'Aggregations': ['Terms', 'Date histogram', 'Range', 'Nested'],
  'Monitoring': ['Cluster health', 'Index stats', 'Search listeners'],
  'Performance': ['Bulk indexing', 'Force merge', 'Cache management'],
};

Object.entries(features).forEach(([category, items]) => {
  console.log(`\n${category}:`);
  items.forEach((item) => console.log(`  • ${item}`));
});

console.log('\n=== Demo Complete ===');
console.log(`\nTotal search events: ${searchEventCount}`);
console.log(`Search count: ${client.getSearchCount()}`);
console.log(`Error count: ${client.getErrorCount()}`);
