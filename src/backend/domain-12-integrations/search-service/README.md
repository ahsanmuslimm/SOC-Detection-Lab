# Search Service

Full-text search engine with advanced indexing, filtering, aggregation, and relevance ranking for security data.

## Overview

The Search Service provides a powerful, scalable full-text search capability designed for security operations. It supports multiple indexing strategies, advanced query filtering, real-time aggregations, sophisticated ranking algorithms, and comprehensive monitoring.

**Key Features:**
- Full-text search with multiple analyzers
- Multiple index types (text, numeric, date, keyword, geo)
- Advanced query filtering and boolean operators
- Real-time aggregations (count, sum, avg, min, max, terms, percentiles)
- Relevance ranking with multiple algorithms (BM25, TF-IDF, LMD)
- Result highlighting and snippet generation
- Pagination and sorting
- Batch indexing operations
- Query caching and optimization
- Health monitoring and statistics
- Event-driven architecture with listeners
- Ranking profile customization
- Faceted search support
- Spell suggestions and corrections

## Architecture

### Core Components

1. **Index Manager**: Creates and manages multiple search indexes
2. **Document Indexer**: Handles document ingestion and updates
3. **Query Engine**: Executes complex search queries
4. **Filter Engine**: Applies advanced filtering rules
5. **Aggregation Engine**: Computes real-time aggregations
6. **Ranking Engine**: Calculates relevance scores
7. **Highlighting Engine**: Generates highlighted snippets
8. **Cache Layer**: Caches query results
9. **Event Emitter**: Publishes search events
10. **Health Monitor**: Tracks system health

### Data Flow

```
Index Creation
    ↓
Document Ingestion
    ↓
Tokenization & Analysis
    ↓
Index Storage
    ↓
Query Execution
    ↓
Filter Application
    ↓
Ranking & Scoring
    ↓
Aggregation
    ↓
Highlighting
    ↓
Result Return
```

## API Reference

### Creating the Service

```typescript
import { createSearchService, ISearchServiceConfig } from '@search-service';

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
```

### Index Management

```typescript
// Create index
const indexId = service.createIndex({
  name: 'security_alerts',
  fields: [
    { name: 'title', type: 'text', indexed: true, stored: true },
    { name: 'severity', type: 'numeric', indexed: true, stored: true },
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

// Retrieve index configuration
const config = service.getIndex(indexId);

// Delete index
service.deleteIndex(indexId);
```

### Document Operations

```typescript
// Index single document
const docId = service.indexDocument(indexId, {
  id: 'alert1',
  content: { title: 'SSH Attack', description: 'Brute force attempt' },
  fields: { title: 'SSH Attack', severity: 8 },
});

// Retrieve document
const doc = service.getDocument(indexId, 'alert1');

// Update document
service.updateDocument(indexId, 'alert1', { title: 'SSH Attack Updated', severity: 9 });

// Delete document
service.deleteDocument(indexId, 'alert1');

// Batch indexing
const result = service.indexBatch(indexId, [
  { id: 'doc1', content: { title: 'Doc 1' } },
  { id: 'doc2', content: { title: 'Doc 2' } },
]);
```

### Search Queries

```typescript
// Basic search
const results = service.search(indexId, {
  text: 'SSH attack',
  pagination: { page: 1, pageSize: 10 },
});

// Advanced search with filters
const advanced = service.search(indexId, {
  text: 'security incident',
  filters: [
    { field: 'severity', operator: 'gte', value: 7 },
    { field: 'timestamp', operator: 'range', range: { min: startDate, max: endDate } },
  ],
  sort: [{ field: 'severity', order: 'desc' }],
  highlight: {
    enabled: true,
    fields: ['title', 'content'],
  },
  aggregations: [
    { name: 'total_severity', type: 'sum', field: 'severity' },
    { name: 'avg_severity', type: 'avg', field: 'severity' },
    { name: 'severity_distribution', type: 'terms', field: 'severity', size: 10 },
  ],
});
```

### Ranking Profiles

```typescript
// Create custom ranking profile
const profileId = service.createRankingProfile({
  name: 'security_ranking',
  algorithm: 'BM25',
  fieldWeights: {
    title: 3.0,
    description: 1.5,
    severity: 2.0,
  },
});

// Retrieve profile
const profile = service.getRankingProfile(profileId);
```

### Statistics and Health

```typescript
// Get search statistics
const stats = service.getStats();
console.log(`Total indexes: ${stats.totalIndexes}`);
console.log(`Total searches: ${stats.totalSearches}`);
console.log(`Average search time: ${stats.averageSearchTime}ms`);

// Perform health check
const health = await service.performHealthCheck();
console.log(`Status: ${health.status}`);
health.indexes.forEach(idx => {
  console.log(`${idx.name}: ${idx.documentCount} documents`);
});
```

### Event Listeners

```typescript
service.onEvent(async (event) => {
  console.log(`Event: ${event.type}`);
  console.log(`Duration: ${event.duration}ms`);
});
```

## Query Syntax

### Operators

- **AND**: Match all terms
- **OR**: Match any term
- **NOT**: Exclude term
- **PHRASE**: Exact phrase match
- **WILDCARD**: Pattern matching (*)
- **RANGE**: Range queries
- **FUZZY**: Fuzzy matching

### Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| **eq** | Equal to | `{ field: 'status', operator: 'eq', value: 'open' }` |
| **ne** | Not equal | `{ field: 'status', operator: 'ne', value: 'closed' }` |
| **gt** | Greater than | `{ field: 'severity', operator: 'gt', value: 7 }` |
| **gte** | Greater or equal | `{ field: 'severity', operator: 'gte', value: 5 }` |
| **lt** | Less than | `{ field: 'age', operator: 'lt', value: 30 }` |
| **lte** | Less or equal | `{ field: 'age', operator: 'lte', value: 30 }` |
| **in** | In list | `{ field: 'status', operator: 'in', values: ['open', 'pending'] }` |
| **range** | Range | `{ field: 'date', operator: 'range', range: { min: startDate, max: endDate } }` |

### Aggregation Types

| Type | Description |
|------|-------------|
| **count** | Count of documents |
| **sum** | Sum of numeric field |
| **avg** | Average of numeric field |
| **min** | Minimum value |
| **max** | Maximum value |
| **terms** | Unique term distribution |
| **date_histogram** | Date-based distribution |
| **range** | Range-based distribution |
| **percentiles** | Percentile calculations |

## Ranking Algorithms

- **BM25**: Best-matching 25, industry standard
- **TF-IDF**: Term Frequency-Inverse Document Frequency
- **LMD**: Language Model Dirichlet
- **vector**: Vector space model
- **custom**: Custom scoring function

## Usage Examples

### Example 1: Security Alert Search

```typescript
const alerts = service.search(indexId, {
  text: 'breach attack',
  filters: [
    { field: 'severity', operator: 'gte', value: 8 },
  ],
  sort: [{ field: 'timestamp', order: 'desc' }],
  pagination: { page: 1, pageSize: 20 },
});
```

### Example 2: Incident Analysis

```typescript
const analysis = service.search(indexId, {
  filters: [
    { field: 'status', operator: 'eq', value: 'open' },
  ],
  aggregations: [
    { name: 'by_severity', type: 'terms', field: 'severity' },
    { name: 'by_type', type: 'terms', field: 'incident_type' },
    { name: 'total_impact', type: 'sum', field: 'impact_score' },
  ],
});
```

### Example 3: Event Timeline

```typescript
const timeline = service.search(indexId, {
  filters: [
    { field: 'timestamp', operator: 'range', range: { min: lastHour, max: now } },
  ],
  sort: [{ field: 'timestamp', order: 'asc' }],
  highlight: {
    enabled: true,
    fields: ['description'],
  },
});
```

## Performance Considerations

### Search Optimization

- Query caching for repeated searches
- Field-level indexing for selective search
- Batch indexing for bulk operations
- Pagination for large result sets
- Field weighting for relevance

### Index Optimization

- Appropriate field types
- Selective indexing (don't index everything)
- Batch operations where possible
- Regular cleanup of deleted documents

## Best Practices

1. **Index Design**: Choose appropriate field types
2. **Query Optimization**: Use filters before full-text search
3. **Pagination**: Always paginate large result sets
4. **Caching**: Leverage query caching for repeated searches
5. **Ranking**: Customize ranking profiles for domain-specific needs
6. **Monitoring**: Track search metrics and health regularly
7. **Updates**: Use batch operations for bulk updates
8. **Analysis**: Choose appropriate analyzers for your data
9. **Storage**: Monitor index size and manage retention
10. **Testing**: Test search queries with expected data

## Lifecycle Management

```typescript
// Create service
const service = createSearchService(config);

// Use service
const results = service.search(indexId, query);

// Graceful shutdown
service.stop();
```

## Testing

Run unit tests:

```bash
npm run test -- search-service.test.ts
```

Run demo scenarios:

```bash
npm run demo -- search-service/demo.ts
```

## Dependencies

- **Built-in**: No external dependencies for core functionality
- **Optional**: Elasticsearch adapter for distributed search

## See Also

- [Cache Service](../cache-service/README.md) - Query result caching
- [Metrics Service](../metrics-service/README.md) - Search metrics
- [Logging Service](../logging-service/README.md) - Search logs
- [Event Pipeline Service](../event-pipeline/README.md) - Event indexing

## Version

1.0.0

## License

See repository LICENSE file
