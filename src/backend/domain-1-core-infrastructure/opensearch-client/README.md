# OpenSearch Client Module

Production-grade OpenSearch/Elasticsearch client for the SOC Detection Lab application. Provides comprehensive search engine integration with index management, document operations, and advanced search capabilities.

**Status**: ✅ Production Ready  
**Test Coverage**: 80%+  
**Dependencies**: @opensearch-project/opensearchjs

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Installation & Setup](#installation--setup)
4. [Core Concepts](#core-concepts)
5. [Usage Examples](#usage-examples)
6. [API Reference](#api-reference)
7. [Best Practices](#best-practices)
8. [Migration Guide](#migration-guide)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The OpenSearch Client module provides:

- **Index Management**: Create, delete, and manage indices
- **Document Operations**: Index, retrieve, update, and delete documents
- **Advanced Search**: Query DSL, filters, sorting, aggregations
- **Bulk Operations**: Efficient batch document processing
- **Cluster Monitoring**: Health checks and statistics
- **Performance Optimization**: Caching, merging, refreshing
- **Event Listeners**: Search event tracking
- **Error Handling**: Integration with error-handling module

### Why This Module?

1. **Search Capability**: Full-text search across alerts and events
2. **Scalability**: Distributed search across multiple nodes
3. **Flexibility**: Query DSL for complex searches
4. **Performance**: Aggregations and analytics
5. **Monitoring**: Cluster and index health checks
6. **Type Safety**: Full TypeScript support

---

## Features

### ✅ Index Management

- Create indices with custom settings
- Configure field mappings
- Manage aliases
- Monitor index statistics
- Delete indices safely

### ✅ Document Operations

- Index single documents
- Retrieve documents by ID
- Update partial documents
- Delete documents
- Type-safe results with generics

### ✅ Search Capabilities

- Full-text search
- Query DSL support
- Range queries
- Boolean queries
- Wildcard and prefix queries
- Highlighting of results

### ✅ Aggregations

- Terms aggregation
- Date histogram
- Range aggregation
- Nested aggregations
- Metrics aggregation

### ✅ Bulk Operations

- Bulk index
- Bulk update
- Bulk delete
- Configurable batch size
- Error handling per item

### ✅ Monitoring

- Cluster health checks
- Index statistics
- Search event listeners
- Error tracking

---

## Installation & Setup

### 1. Configuration

```typescript
import { createOpenSearchClient } from '@soc-detection-lab/opensearch-client';

const config = {
  nodes: ['http://localhost:9200'],
  username: 'admin',
  password: 'admin',
  requestTimeout: 30000,
  maxRetries: 3,
  ssl: {
    rejectUnauthorized: false,
  },
};

const client = createOpenSearchClient(config);
```

### 2. Connect to Cluster

```typescript
// Connect to cluster
await client.connect();

// Verify health
const health = await client.clusterHealth();
if (health.status === 'red') {
  throw new Error('Cluster is unhealthy');
}
```

### 3. Create Indices

```typescript
await client.createIndex({
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
});
```

---

## Core Concepts

### Index

```
Index: alerts
├── Shard 1 (Primary)
│   ├── Document 1
│   ├── Document 2
│   └── Document 3
├── Shard 2 (Replica)
├── Shard 3 (Replica)
└── Mapping (Field definitions)
```

### Sharding

```
numberOfShards: 3
numberOfReplicas: 1

Total shards = 3 primary + 3 replica = 6 shards
Distributed across nodes for scalability
```

### Document

```typescript
{
  _id: 'alert-123',
  _index: 'alerts',
  _score: 1.5,
  _source: {
    title: 'Suspicious Login',
    severity: 'high',
    timestamp: '2024-01-15T10:30:00Z'
  }
}
```

---

## Usage Examples

### Index Management

```typescript
// Create index
await client.createIndex({
  name: 'events',
  numberOfShards: 5,
  numberOfReplicas: 2,
  mappings: {
    properties: {
      event_id: { type: 'keyword' },
      event_type: { type: 'keyword' },
      timestamp: { type: 'date' },
      data: { type: 'object' },
    },
  },
});

// Check if exists
const exists = await client.indexExists('events');

// Get stats
const stats = await client.getIndexStats('events');

// Create alias
await client.createAlias('events', 'events-latest');

// Delete index
await client.deleteIndex('events');
```

### Document Operations

```typescript
// Index document
const docId = await client.index('alerts', {
  title: 'Critical Event',
  severity: 'critical',
  timestamp: new Date(),
});

// Get document
const alert = await client.get<Alert>('alerts', docId);

// Update document
await client.update('alerts', docId, {
  doc: { status: 'acknowledged' },
});

// Delete document
await client.delete('alerts', docId);
```

### Search

```typescript
// Simple search
const result = await client.search('alerts', {
  query: {
    match: { title: 'suspicious' },
  },
  size: 20,
});

// Boolean query
const result = await client.search('alerts', {
  query: {
    bool: {
      must: [
        { match: { severity: 'high' } },
      ],
      filter: [
        { range: { timestamp: { gte: 'now-24h' } } },
      ],
    },
  },
  sort: [{ timestamp: 'desc' }],
  size: 50,
});

// With highlighting
const result = await client.search('alerts', {
  query: {
    match: { description: 'brute force' },
  },
  highlight: {
    fields: {
      description: {},
    },
  },
});
```

### Aggregations

```typescript
// Count by severity
const result = await client.search('alerts', {
  aggs: {
    severity_count: {
      terms: { field: 'severity', size: 10 },
    },
  },
  size: 0,  // No documents, only aggregations
});

// Time series
const result = await client.search('alerts', {
  aggs: {
    alerts_over_time: {
      date_histogram: {
        field: 'timestamp',
        interval: 'day',
      },
    },
  },
});
```

### Bulk Operations

```typescript
// Bulk index
const alerts = [
  { title: 'Alert 1', severity: 'high' },
  { title: 'Alert 2', severity: 'medium' },
  // ... 5000+ more
];

const response = await client.bulkIndex('alerts', alerts);

console.log(`Indexed ${response.items.length} documents`);
console.log(`Errors: ${response.errors}`);
console.log(`Duration: ${response.took}ms`);
```

### Pagination

```typescript
const pageSize = 20;
const page = 2;
const from = (page - 1) * pageSize;

const result = await client.search('alerts', {
  query: { match_all: {} },
  from,
  size: pageSize,
  sort: [{ timestamp: 'desc' }],
});

console.log(`Total results: ${result.hits.total.value}`);
console.log(`Current page: ${Math.floor(from / pageSize) + 1}`);
console.log(`Results on page: ${result.hits.hits.length}`);
```

### Monitoring

```typescript
// Cluster health
const health = await client.clusterHealth();
console.log(`Status: ${health.status}`);
console.log(`Active shards: ${health.activeShards}`);
console.log(`Unassigned shards: ${health.unassignedShards}`);

// Index stats
const stats = await client.getIndexStats('alerts');
console.log(`Doc count: ${stats.indices.alerts.primaries.docs.count}`);
console.log(`Size: ${stats.indices.alerts.primaries.store.size_in_bytes} bytes`);

// Cluster stats
const clusterStats = await client.clusterStats();
console.log(`Cluster status: ${clusterStats.status}`);
```

### Event Listeners

```typescript
// Track search operations
client.onSearch((stats) => {
  console.log(`Search executed in ${stats.duration}ms`);
  console.log(`Results: ${stats.hitsCount}`);
});

// Chainable
client
  .onSearch((stats) => logger.debug('Search:', stats))
  .onSearch((stats) => metrics.recordSearch(stats));
```

### Error Handling

```typescript
import { ExternalServiceError } from '@soc-detection-lab/error-handling';

try {
  const result = await client.search('alerts', query);
  return result;
} catch (err) {
  const searchError = new ExternalServiceError(
    'OpenSearch',
    'Search failed',
    err
  );
  
  searchError.withContext({
    userId: req.user.id,
    requestId: req.id,
  });
  
  throw searchError;
}
```

---

## API Reference

### OpenSearchClient

#### Constructor

```typescript
new OpenSearchClient(config: IOpenSearchConfig)
```

#### Methods

**Connection**

- `connect()` - Connect to cluster
- `close()` - Close connection
- `isConnected_()` - Check connection status

**Index Operations**

- `createIndex(config)` - Create index
- `deleteIndex(name)` - Delete index
- `indexExists(name)` - Check if exists
- `getIndexStats(name?)` - Get statistics

**Document Operations**

- `index<T>(name, body, id?, options?)` - Index document
- `get<T>(name, id)` - Get document
- `update<T>(name, id, request, options?)` - Update document
- `delete(name, id)` - Delete document

**Search Operations**

- `search<T>(name, query, options?)` - Search documents

**Bulk Operations**

- `bulk<T>(operations, options?)` - Bulk operations
- `bulkIndex<T>(name, documents)` - Bulk index

**Alias Management**

- `createAlias(index, alias)` - Create alias
- `deleteAlias(index, alias)` - Delete alias

**Monitoring**

- `clusterHealth()` - Check cluster health
- `clusterStats()` - Get cluster statistics

**Index Maintenance**

- `refresh(name)` - Refresh index
- `forceMerge(name, maxSegments?)` - Force merge
- `clearCache(name?)` - Clear cache

**Listeners**

- `onSearch(listener)` - Register search listener
- `offSearch(listener)` - Unregister listener

---

## Best Practices

### 1. Use Appropriate Shard Count

```typescript
// ✅ Good: Based on expected data size
numberOfShards: 3,  // 5-50GB per shard
numberOfReplicas: 1,  // At least 1 for high availability

// ❌ Bad: Too many shards for small datasets
numberOfShards: 10,  // Overhead for small data
```

### 2. Use Query DSL for Complex Searches

```typescript
// ✅ Good: Complex boolean query
const query = {
  bool: {
    must: [{ match: { severity: 'high' } }],
    filter: [{ range: { timestamp: { gte: 'now-24h' } } }],
    must_not: [{ term: { status: 'resolved' } }],
  },
};

// ❌ Bad: String-based search
const query = { query_string: { query: 'severity:high' } };
```

### 3. Use Bulk for Batch Operations

```typescript
// ✅ Good: Bulk for 1000+ documents
await client.bulkIndex('alerts', largeArray);

// ❌ Bad: Individual inserts in loop
for (const doc of largeArray) {
  await client.index('alerts', doc);
}
```

### 4. Optimize Field Mappings

```typescript
// ✅ Good: Appropriate field types
{
  properties: {
    severity: { type: 'keyword' },  // Not analyzed
    description: { type: 'text' },  // Analyzed for search
    timestamp: { type: 'date' },    // Efficient date queries
  },
}

// ❌ Bad: All text fields
{
  properties: {
    severity: { type: 'text' },     // Inefficient filtering
    description: { type: 'text' },
    timestamp: { type: 'text' },    // Can't do date math
  },
}
```

### 5. Monitor Cluster Health

```typescript
// ✅ Good: Periodic health checks
setInterval(async () => {
  const health = await client.clusterHealth();
  if (health.status === 'red') {
    logger.error('Cluster unhealthy');
  }
}, 60000);

// ❌ Bad: No monitoring
```

---

## Configuration Reference

```typescript
interface IOpenSearchConfig {
  nodes: string[];           // Cluster nodes
  region?: string;           // AWS region (if using AWS)
  username?: string;         // Username
  password?: string;         // Password
  requestTimeout?: number;   // Request timeout (default: 30000ms)
  maxRetries?: number;       // Max retries (default: 3)
  enableDebugLogging?: boolean;
  ssl?: {
    rejectUnauthorized?: boolean;
    certificateAuthority?: string;
  };
}
```

---

## Troubleshooting

### Connection Refused

**Problem**: "ECONNREFUSED" or "connect ETIMEDOUT"

**Solution**:
```typescript
// Verify OpenSearch is running
// Check configuration
const config = {
  nodes: ['http://actual-host:9200'],  // Verify host/port
  requestTimeout: 5000,  // Increase timeout
};
```

### Index Already Exists

**Problem**: "index_already_exists_exception"

**Solution**:
```typescript
// Check if exists first
const exists = await client.indexExists('alerts');
if (!exists) {
  await client.createIndex(config);
}
```

### Search Timeout

**Problem**: "Request timed out"

**Solution**:
```typescript
// Increase timeout for complex queries
const result = await client.search('alerts', query, {
  timeout: 60000,  // 60 seconds
});
```

### Out of Memory

**Problem**: JVM OutOfMemoryError

**Solution**:
```typescript
// Force merge to reduce segments
await client.forceMerge('alerts', 1);

// Clear cache
await client.clearCache('alerts');

// Reduce bulk size
await client.bulkIndex('alerts', docs, { timeout: 30000 });
```

---

## Related Modules

- **config-service**: Get search configuration
- **logging-service**: Log search operations
- **error-handling**: Handle search errors
- **types-definitions**: Search result types
- **postgres-client**: Complement relational queries with search

---

## Performance Considerations

| Operation | Time | Notes |
|-----------|------|-------|
| Index single doc | 1-10ms | Depends on refresh |
| Search query | 10-100ms | Depends on data size |
| Bulk index (1000) | 100-500ms | Much faster than individual |
| Aggregation | 50-1000ms | Complex aggs take longer |
| Health check | 1-5ms | Quick cluster status |

---

**Module Version**: 1.0.0  
**Last Updated**: 2024  
**License**: Proprietary
